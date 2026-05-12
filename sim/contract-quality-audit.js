// Verifies computeContractQuality produces sensible distributions across
// the full contract generation space (all tiers, all unlocked crops, all
// templates, variance rolls). Run: node sim/contract-quality-audit.js

const CROPS = {
  radish:    { baseYield: 70,   growthMs: 4 * 60*60*1000 },
  carrot:    { baseYield: 160,  growthMs: 8 * 60*60*1000 },
  tomato:    { baseYield: 250,  growthMs: 12 * 60*60*1000 },
  strawberry:{ baseYield: 400,  growthMs: 18 * 60*60*1000 },
  wheat:     { baseYield: 540,  growthMs: 24 * 60*60*1000 },
  corn:      { baseYield: 690,  growthMs: 30 * 60*60*1000 },
  pumpkin:   { baseYield: 950,  growthMs: 40 * 60*60*1000 },
  sunflower: { baseYield: 1200, growthMs: 60 * 60*60*1000 },
};

const BRONZE_FAST_CROP_LIMIT_HOURS = 12;
const SILVER_FAST_CROP_LIMIT_HOURS = 18;
const SILVER_PACK_CHANCE = 0;

function withCoinVariance(baseCoins) {
  const variance = baseCoins * 0.15;
  const offset = (Math.random() * 2 - 1) * variance;
  return Math.max(50, Math.round(baseCoins + offset));
}

function bronzeCountForCrop(crop) {
  const h = CROPS[crop].growthMs / 3600000;
  if (h <= 4) return 2 + Math.floor(Math.random() * 2);
  if (h <= 8) return 1 + Math.floor(Math.random() * 2);
  return 1;
}
function silverCountForCrop(crop) {
  const h = CROPS[crop].growthMs / 3600000;
  if (h <= 4)  return 5 + Math.floor(Math.random() * 3);
  if (h <= 8)  return 3 + Math.floor(Math.random() * 2);
  if (h <= 12) return 2 + Math.floor(Math.random() * 2);
  return 2;
}
function goldDeadlineFor(crops) {
  const slowestHrs = Math.max(...crops.map(c => CROPS[c].growthMs / 3600000));
  return Math.max(72, Math.min(168, Math.ceil(slowestHrs * 4)));
}
function goldCountForCrop(crop, deadlineHrs) {
  const growthHrs = CROPS[crop].growthMs / 3600000;
  const max = Math.floor(deadlineHrs / growthHrs);
  const factor = 0.60 + Math.random() * 0.20;
  return Math.max(3, Math.floor(max * factor));
}

function generateBronze(unlockedCrops) {
  const fast = unlockedCrops.filter(c => CROPS[c].growthMs / 3600000 <= BRONZE_FAST_CROP_LIMIT_HOURS);
  const pool = fast.length > 0 ? fast : unlockedCrops;
  const crop = pool[Math.floor(Math.random() * pool.length)];
  const isQuick = Math.random() < 0.30;
  const baseCnt = bronzeCountForCrop(crop);
  let count, coinBase, coinPer, deadlineHours;
  if (isQuick) { count = Math.max(1, Math.floor(baseCnt * 0.6)); coinBase = 100; coinPer = 35; deadlineHours = 12; }
  else { count = baseCnt + (Math.random() < 0.3 ? 1 : 0); coinBase = 150; coinPer = 40; deadlineHours = 24; }
  return {
    tier: 'bronze',
    template: 'deliver_n_of_x',
    params: { crop, count, deadlineHours },
    reward: { coins: coinBase + count * coinPer, packs: 0 },
  };
}
function generateSilver(unlockedCrops) {
  const fast = unlockedCrops.filter(c => CROPS[c].growthMs / 3600000 <= SILVER_FAST_CROP_LIMIT_HOURS);
  const pool = fast.length > 0 ? fast : unlockedCrops;
  const canMix = pool.length >= 2;
  if (!canMix || Math.random() < 0.5) {
    const crop = pool[Math.floor(Math.random() * pool.length)];
    const count = silverCountForCrop(crop);
    return {
      tier: 'silver',
      template: 'deliver_n_of_x',
      params: { crop, count },
      reward: { coins: withCoinVariance(360 + count * 70), packs: 0 },
    };
  }
  const sh = [...pool].sort(() => Math.random() - 0.5);
  const cA = sh[0], cB = sh[1];
  const ctA = Math.max(2, Math.floor(silverCountForCrop(cA) * 0.6));
  const ctB = Math.max(2, Math.floor(silverCountForCrop(cB) * 0.6));
  return {
    tier: 'silver',
    template: 'deliver_mixed',
    params: { crops: { [cA]: ctA, [cB]: ctB } },
    reward: { coins: withCoinVariance(460 + (ctA + ctB) * 70), packs: 0 },
  };
}
function generateGold(unlockedCrops) {
  const crop = unlockedCrops[Math.floor(Math.random() * unlockedCrops.length)];
  const deadlineHrs = goldDeadlineFor([crop]);
  const count = goldCountForCrop(crop, deadlineHrs);
  return {
    tier: 'gold',
    template: 'deliver_n_of_x',
    params: { crop, count },
    reward: { coins: withCoinVariance(1500 + count * 70), packs: 1 },
  };
}

// --- Per-tier variance-based quality ---
// Quality reflects how this contract rolled against its TIER'S expected
// reward, not against market baseline coins. Contract reward is BONUS on
// top of harvest income, so absolute "is it generous" is hard to anchor.
// Within-tier variance ("did I get a good roll?") is the actually useful
// signal for the reroll decision.
function computeContractQuality(c) {
  const coins = c.reward?.coins || 0;
  const packs = c.reward?.packs || 0;

  // Compute the expected (no-variance, base-formula) coin reward for this
  // contract from its tier's generation formula.
  let expected = coins; // fallback
  if (c.tier === 'bronze') {
    // Bronze has no coin variance — fixed by sub-style + count.
    // Quick (deadline 12h): 100 + count*35
    // Standard (24h):       150 + count*40
    const isQuick = c.params?.deadlineHours === 12;
    expected = isQuick
      ? 100 + (c.params?.count || 0) * 35
      : 150 + (c.params?.count || 0) * 40;
  } else if (c.tier === 'silver') {
    if (c.template === 'deliver_mixed') {
      const total = Object.values(c.params?.crops || {}).reduce((s, n) => s + n, 0);
      expected = 460 + total * 70;
    } else {
      expected = 360 + (c.params?.count || 0) * 70;
    }
  } else if (c.tier === 'gold') {
    expected = 1500 + (c.params?.count || 0) * 70;
  }

  const ratio = expected > 0 ? coins / expected : 1.0;

  // Pack-bearing contracts (currently gold) — always at least "good".
  // "Great" only when coin variance rolled high on top of the pack.
  if (packs > 0) {
    if (ratio >= 1.08) return { tier: 'legendary', label: 'great' };
    return { tier: 'rare', label: 'good' };
  }

  // Coin-only — use variance roll position to bucket.
  // With ±15% variance: 0.85 (worst roll) ↔ 1.15 (best roll).
  // Bronze has zero variance so always lands at ratio = 1.0 → "good"
  // (bronze contracts are reliably worth doing as quick easy money).
  if (ratio >= 1.08) return { tier: 'legendary', label: 'great' };
  if (ratio >= 0.98) return { tier: 'rare',      label: 'good' };
  if (ratio >= 0.90) return { tier: 'uncommon',  label: 'fair' };
  return { tier: 'common', label: 'modest' };
}

// --- Run the audit ---
const TRIALS = 30000;
const tiers = ['bronze', 'silver', 'gold'];
// Test multiple "player progression" snapshots — early game has fewer crops
const progressions = [
  { name: 'early game (radish + carrot)',          crops: ['radish', 'carrot'] },
  { name: 'mid game (5 crops unlocked)',           crops: ['radish', 'carrot', 'tomato', 'strawberry', 'wheat'] },
  { name: 'late game (all 8 crops)',               crops: Object.keys(CROPS) },
];
const generators = { bronze: generateBronze, silver: generateSilver, gold: generateGold };

console.log(`Contract quality audit — ${TRIALS.toLocaleString()} trials per (tier × progression)\n`);
console.log('Quality buckets: modest | fair | good | great');
console.log('Internal tier ↔ visible label: common→modest, uncommon→fair, rare→good, legendary→great\n');

for (const prog of progressions) {
  console.log(`\n=== ${prog.name} ===`);
  for (const tier of tiers) {
    const gen = generators[tier];
    const counts = { modest: 0, fair: 0, good: 0, great: 0 };
    let ratioSum = 0, ratioMin = Infinity, ratioMax = -Infinity;
    for (let i = 0; i < TRIALS; i++) {
      const c = gen(prog.crops);
      const q = computeContractQuality(c);
      counts[q.label] += 1;
      // record ratio for diagnostics
      let baseline = 0;
      if (c.template === 'deliver_n_of_x') baseline = CROPS[c.params.crop].baseYield * c.params.count;
      else for (const [crop, n] of Object.entries(c.params.crops)) baseline += CROPS[crop].baseYield * n;
      const totalValue = c.reward.coins + (c.reward.packs || 0) * 800; // for ratio reporting only
      const ratio = baseline > 0 ? totalValue / baseline : 0;
      ratioSum += ratio;
      if (ratio < ratioMin) ratioMin = ratio;
      if (ratio > ratioMax) ratioMax = ratio;
    }
    const total = TRIALS;
    const pct = (n) => ((n / total) * 100).toFixed(1).padStart(5);
    const avgRatio = (ratioSum / total).toFixed(2);
    console.log(`  ${tier.padEnd(7)} modest:${pct(counts.modest)}%  fair:${pct(counts.fair)}%  good:${pct(counts.good)}%  great:${pct(counts.great)}%   value-to-baseline ratio: avg ${avgRatio}, range ${ratioMin.toFixed(2)}–${ratioMax.toFixed(2)}`);
  }
}

console.log(`\n=== Verdict guide ===`);
console.log('Expected pattern:');
console.log('  Bronze — small ask, modest payout. Should range fair→good, mostly fair.');
console.log('           Some "great" rolls from variance are fine.');
console.log('  Silver — bigger ask, no pack. Variance-dependent — should span the full range.');
console.log('  Gold   — always has pack → always at least "good", "great" when coin also generous.');
console.log('  No "modest" gold contracts should appear (pack alone makes them worth doing).');
console.log('  No "great" should be SO common that the label loses meaning.');

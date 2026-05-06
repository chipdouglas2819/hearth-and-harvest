// Hearth & Harvest balance simulator
// Replicates the in-run buff math from farm-prototype-v6.html and runs Monte Carlo
// over many planted runs to surface OP combos and check the plot-cost economy.

// ============ DATA (mirror of v6 BUFF_POOL) ============
// Pass --proposed to use the rebalance values; default = current v6 values.
const USE_PROPOSED = process.argv.includes('--proposed');
const CROPS = USE_PROPOSED ? {
  radish:  { growthHrs: 4,  plantCost: 20,  baseYield: 80,   pickCount: 1 },
  carrot:  { growthHrs: 8,  plantCost: 35,  baseYield: 175,  pickCount: 2 },
  tomato:  { growthHrs: 12, plantCost: 60,  baseYield: 280,  pickCount: 3 },
  wheat:   { growthHrs: 24, plantCost: 100, baseYield: 450,  pickCount: 5 },
  corn:    { growthHrs: 30, plantCost: 175, baseYield: 700,  pickCount: 5 },
  pumpkin: { growthHrs: 40, plantCost: 220, baseYield: 800,  pickCount: 6 },
} : {
  radish:  { growthHrs: 4,  plantCost: 20,  baseYield: 60,   pickCount: 2 },
  carrot:  { growthHrs: 8,  plantCost: 35,  baseYield: 130,  pickCount: 3 },
  tomato:  { growthHrs: 12, plantCost: 60,  baseYield: 240,  pickCount: 3 },
  wheat:   { growthHrs: 24, plantCost: 150, baseYield: 800,  pickCount: 5 },
  corn:    { growthHrs: 30, plantCost: 250, baseYield: 1500, pickCount: 5 },
  pumpkin: { growthHrs: 40, plantCost: 350, baseYield: 2200, pickCount: 6 },
};

const RARITY_WEIGHTS = { common: 60, uncommon: 28, rare: 9.5, legendary: 2.2, mythic: 0.3 };
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'mythic'];

const BUFF_POOL = [
  // common
  { id: 'sun',      name: 'Sunny Days',     rarity: 'common',   yieldMult: 1.12 },
  { id: 'rain',     name: 'Gentle Rain',    rarity: 'common',   timeMult: 0.88 },
  { id: 'rich',     name: 'Rich Soil',      rarity: 'common',   yieldMult: 1.18 },
  { id: 'compost',  name: 'Compost Tea',    rarity: 'common',   yieldMult: 1.08, timeMult: 0.92 },
  { id: 'sprout',   name: 'Eager Sprout',   rarity: 'common',   timeMult: 0.80 },
  { id: 'sturdy',   name: 'Sturdy Stems',   rarity: 'common',   yieldMult: 1.15 },
  { id: 'patient',  name: 'Slow & Steady',  rarity: 'common',   yieldMult: 1.30, timeMult: 1.20 },
  { id: 'common_synergy', name: 'Folk Wisdom', rarity: 'common', custom: 'common_synergy' },
  // uncommon
  { id: 'bee',      name: 'Bee Visitation', rarity: 'uncommon', yieldMult: 1.25 },
  { id: 'mulch',    name: 'Living Mulch',   rarity: 'uncommon', yieldMult: 1.22, timeMult: 0.90 },
  { id: 'symbiosis', name: 'Symbiosis',     rarity: 'uncommon', custom: 'symbiosis' },
  { id: 'gamble',   name: 'Coin Flip',      rarity: 'uncommon', custom: 'coin_flip_17' },
  { id: 'tradeoff_a', name: 'Long Patience', rarity: 'uncommon', yieldMult: 1.40, timeMult: 1.25 },
  { id: 'echo',     name: 'Echo',           rarity: 'uncommon', yieldMult: 1.12, custom: 'echo' },
  { id: 'twofold',  name: 'Twofold Path',   rarity: 'uncommon', yieldMult: 1.15, custom: 'twofold' },
  { id: 'cross_a',  name: 'Wild Pollen',    rarity: 'uncommon', custom: 'cross_yield_15' },
  { id: 'lock_time', name: 'Steady Hand',   rarity: 'uncommon', yieldMult: 1.30, custom: 'lock_time' },
  { id: 'skill_a',  name: 'Peak Ripeness',  rarity: 'uncommon', custom: 'skill_window_10' },
  { id: 'devour',   name: 'Eat the Roots',  rarity: 'uncommon', yieldMult: 1.45, custom: 'next_penalty_20' },
  // rare
  { id: 'storm',    name: 'After the Storm', rarity: 'rare', yieldMult: 1.55 },
  { id: 'oldway',   name: 'The Old Way',    rarity: 'rare', yieldMult: 1.20, timeMult: 0.60 },
  { id: 'common_amp', name: 'Rare Earth',   rarity: 'rare', custom: 'common_amp' },
  { id: 'cornucopia', name: 'Cornucopia',   rarity: 'rare', yieldMult: 1.20, custom: 'cornucopia' },
  { id: 'commit',   name: 'Devoted Tending', rarity: 'rare', custom: 'no_more_picks_80' },
  { id: 'cross_b',  name: 'Hive Mind',      rarity: 'rare', custom: 'cross_pick_1' },
  { id: 'high_gamble', name: 'Frost Gamble', rarity: 'rare', custom: 'frost_gamble' },
  { id: 'ferment',  name: 'Slow Ferment',   rarity: 'rare', custom: 'ferment_5s_8' },
  { id: 'pickback', name: 'Reroll the Day', rarity: 'rare', custom: 'reroll_last' },
  { id: 'rare_doubler', name: 'Garden Sage', rarity: 'rare', custom: 'double_actives' },
  // legendary
  { id: 'plenty',   name: 'Year of Plenty', rarity: 'legendary', yieldMult: 1.90 },
  { id: 'long_wait', name: 'The Long Wait', rarity: 'legendary', yieldMult: 2.50, timeMult: 1.60 },
  { id: 'cascade_gold', name: 'Cascade of Gold', rarity: 'legendary', custom: 'cascade_gold' },
  { id: 'cross_leg', name: "Garden's Blessing", rarity: 'legendary', custom: 'cross_yield_50' },
  { id: 'all_in',   name: 'All In', rarity: 'legendary', custom: 'all_in' },
  // mythic
  { id: 'wishflower', name: 'Wishflower', rarity: 'mythic', custom: 'wishflower' },
  { id: 'world_tree', name: 'Roots of the World', rarity: 'mythic', custom: 'world_tree' },
  { id: 'eternal',  name: 'Eternal Crop', rarity: 'mythic', custom: 'eternal' },
  { id: 'sun_god',  name: 'Solstice', rarity: 'mythic', custom: 'solstice' },
];

// ============ SIM HELPERS ============
function makePlot(crop) {
  return {
    crop,
    growthHrs: CROPS[crop].growthHrs,
    totalMs: CROPS[crop].growthHrs * 3600 * 1000,
    totalPicks: CROPS[crop].pickCount,
    picksTaken: 0,
    yieldMult: 1.0,
    activeBuffs: [],
    flags: {
      lockTime: false, noMorePicks: false,
      skillWindow10: false, skillFerment: false,
      eternalActive: false, eternalUsed: false,
      committedNoMore: false, picksAtCommit: undefined,
      nextPenaltyMult: 1.0, wishflowerLeft: 0,
      wideDraftLeft: 0, echoLeft: 0,
    },
  };
}

function draftN(n, rarityFloor = null) {
  const filtered = rarityFloor
    ? BUFF_POOL.filter(b => RARITY_ORDER.indexOf(b.rarity) >= RARITY_ORDER.indexOf(rarityFloor))
    : BUFF_POOL;
  const usePool = filtered.length >= n ? filtered : BUFF_POOL;
  const weighted = usePool.map(b => ({ b, w: RARITY_WEIGHTS[b.rarity] }));
  const picks = [];
  const used = new Set();
  for (let i = 0; i < n && picks.length < usePool.length; i++) {
    const remaining = weighted.filter(x => !used.has(x.b.id));
    const total = remaining.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of remaining) {
      r -= x.w;
      if (r <= 0) { picks.push(x.b); used.add(x.b.id); break; }
    }
  }
  return picks;
}

function pickRandomFromPool(filterFn) {
  const pool = BUFF_POOL.filter(filterFn);
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function applyBuff(plot, buff) {
  if (plot.flags.wishflowerLeft > 0) plot.flags.wishflowerLeft -= 1;
  if (plot.flags.wideDraftLeft > 0) plot.flags.wideDraftLeft -= 1;
  const echoActive = plot.flags.echoLeft > 0 && buff.id !== 'echo';
  if (echoActive) plot.flags.echoLeft -= 1;

  if (buff.yieldMult) {
    plot.yieldMult *= buff.yieldMult;
    if (echoActive) plot.yieldMult *= buff.yieldMult;
  }
  if (buff.timeMult && !plot.flags.lockTime) {
    plot.totalMs *= buff.timeMult;
    if (echoActive) plot.totalMs *= buff.timeMult;
  }
  if (buff.custom) handleCustom(plot, buff, echoActive);
  plot.activeBuffs.push(buff);
  plot.picksTaken += 1;
}

function handleCustom(plot, buff, echo) {
  const e = echo ? 2 : 1;
  switch (buff.custom) {
    case 'common_synergy': {
      const commons = plot.activeBuffs.filter(b => b.rarity === 'common').length + 1;
      plot.yieldMult *= Math.pow(1 + 0.05 * commons, e);
      break;
    }
    case 'symbiosis': {
      const others = plot.activeBuffs.length;
      plot.yieldMult *= Math.pow(1 + 0.08 * others, e);
      break;
    }
    case 'coin_flip_17':
      for (let i = 0; i < e; i++) if (Math.random() < 0.5) plot.yieldMult *= 1.7;
      break;
    case 'frost_gamble':
      for (let i = 0; i < e; i++) plot.yieldMult *= (Math.random() < 0.7) ? 2.2 : 0.5;
      break;
    case 'echo':
      plot.flags.echoLeft = (plot.flags.echoLeft || 0) + 1;
      break;
    case 'twofold': {
      const random = pickRandomFromPool(b => ['common', 'uncommon'].includes(b.rarity) && b.id !== 'twofold' && !b.custom);
      if (random) {
        if (random.yieldMult) plot.yieldMult *= random.yieldMult;
        if (random.timeMult && !plot.flags.lockTime) plot.totalMs *= random.timeMult;
        plot.activeBuffs.push(random);
      }
      break;
    }
    case 'cornucopia':
      plot.flags.wideDraftLeft = (plot.flags.wideDraftLeft || 0) + 1;
      break;
    case 'cascade_gold': {
      const pool = BUFF_POOL.filter(b => b.rarity === 'rare' && b.id !== 'cascade_gold' && !b.custom);
      const used = new Set();
      for (let i = 0; i < 2 && pool.length > 0; i++) {
        const remaining = pool.filter(x => !used.has(x.id));
        if (remaining.length === 0) break;
        const random = remaining[Math.floor(Math.random() * remaining.length)];
        used.add(random.id);
        if (random.yieldMult) plot.yieldMult *= random.yieldMult;
        if (random.timeMult && !plot.flags.lockTime) plot.totalMs *= random.timeMult;
        plot.activeBuffs.push(random);
      }
      break;
    }
    case 'lock_time': plot.flags.lockTime = true; break;
    case 'next_penalty_20': plot.flags.nextPenaltyMult = 0.80; break;
    case 'skill_window_10': plot.flags.skillWindow10 = true; break;
    case 'ferment_5s_8': plot.flags.skillFerment = true; break;
    case 'reroll_last': {
      if (plot.activeBuffs.length > 0) {
        const last = plot.activeBuffs[plot.activeBuffs.length - 1];
        if (last.yieldMult) plot.yieldMult /= last.yieldMult;
        plot.activeBuffs.pop();
        plot.picksTaken -= 1;
        plot.totalPicks += 1;
      }
      break;
    }
    case 'double_actives':
      plot.activeBuffs.forEach(b => { if (b.yieldMult) plot.yieldMult *= b.yieldMult; });
      break;
    case 'no_more_picks_80':
      plot.flags.noMorePicks = true;
      plot.flags.committedNoMore = true;
      plot.flags.picksAtCommit = plot.picksTaken + 1;
      break;
    case 'all_in': {
      const others = plot.activeBuffs.filter(b => b.id !== 'all_in');
      others.forEach(b => { if (b.yieldMult) plot.yieldMult /= b.yieldMult; });
      plot.activeBuffs = [];
      plot.yieldMult *= Math.pow(2.5, e);
      break;
    }
    case 'wishflower':
      plot.flags.wishflowerLeft = (plot.flags.wishflowerLeft || 0) + 3;
      plot.totalPicks += 3;
      break;
    case 'world_tree':
      plot.yieldMult *= Math.pow(3.5, e);
      plot.flags.noMorePicks = true;
      break;
    case 'solstice':
      plot.yieldMult *= Math.pow(2.5, e);
      break;
    case 'common_amp': {
      const commons = plot.activeBuffs.filter(b => b.rarity === 'common').length;
      plot.yieldMult *= Math.pow(1 + 0.25 * commons, e);
      break;
    }
  }
}

// ============ STRATEGIES ============
// random pick — picks one of 3 at random
function strategyRandom(picks) {
  return picks[Math.floor(Math.random() * picks.length)];
}

// greedy — pick whatever yields the highest expected immediate yieldMult,
// ignoring time. Simple but realistic.
function expectedYieldMult(buff) {
  if (buff.yieldMult) return buff.yieldMult;
  if (buff.custom === 'world_tree') return 3.5;
  if (buff.custom === 'all_in') return 2.5;
  if (buff.custom === 'solstice') return 2.5;
  if (buff.custom === 'cascade_gold') return 1.55 * 1.55; // 2 random rares (rough avg)
  if (buff.custom === 'frost_gamble') return 0.7 * 2.2 + 0.3 * 0.5; // 1.69
  if (buff.custom === 'coin_flip_17') return 0.5 * 1.7 + 0.5 * 1.0; // 1.35
  if (buff.custom === 'no_more_picks_80') return 1.80;
  if (buff.custom === 'symbiosis') return 1.4; // assumes mid-game
  if (buff.custom === 'common_amp') return 1.5;
  if (buff.custom === 'common_synergy') return 1.2;
  if (buff.custom === 'double_actives') return 1.5; // depends on state
  if (buff.custom === 'wishflower') return 2.2;
  return 1.0;
}
function strategyGreedy(picks) {
  return picks.reduce((best, b) => expectedYieldMult(b) > expectedYieldMult(best) ? b : best);
}

// ============ RUN A SIMULATION ============
function simulateRun(crop, strategy) {
  const plot = makePlot(crop);
  for (let pick = 0; pick < plot.totalPicks; pick++) {
    if (plot.flags.noMorePicks) break;
    const draftSize = plot.flags.wideDraftLeft > 0 ? 5 : 3;
    const rarityFloor = plot.flags.wishflowerLeft > 0 ? 'legendary' : null;
    const draftedPicks = draftN(draftSize, rarityFloor);
    if (draftedPicks.length === 0) break;
    const chosen = strategy(draftedPicks);
    applyBuff(plot, chosen);
  }
  // committedNoMore final-multiplier check
  if (plot.flags.committedNoMore && plot.flags.picksAtCommit !== undefined && plot.picksTaken === plot.flags.picksAtCommit) {
    plot.yieldMult *= 1.80;
  }
  const baseYield = CROPS[crop].baseYield;
  const yieldAmount = Math.floor(baseYield * plot.yieldMult);
  const hours = plot.totalMs / 3600 / 1000;
  return {
    yield: yieldAmount,
    yieldMult: plot.yieldMult,
    hours,
    yieldPerHour: yieldAmount / hours,
    buffs: plot.activeBuffs.map(b => b.id),
  };
}

function runMonteCarlo(crop, strategy, n) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(simulateRun(crop, strategy));
  }
  results.sort((a, b) => a.yield - b.yield);
  const median = results[Math.floor(n / 2)].yield;
  const mean = results.reduce((s, r) => s + r.yield, 0) / n;
  const p95 = results[Math.floor(n * 0.95)].yield;
  const p99 = results[Math.floor(n * 0.99)].yield;
  const max = results[n - 1].yield;
  const meanPerHour = results.reduce((s, r) => s + r.yieldPerHour, 0) / n;
  return { crop, n, median, mean, p95, p99, max, meanPerHour, top10: results.slice(-10).reverse() };
}

// ============ REPORT ============
const N = 20000;
const STRATEGY_NAME = process.argv[2] || 'greedy';
const strategy = STRATEGY_NAME === 'random' ? strategyRandom : strategyGreedy;

console.log(`\nHearth & Harvest balance simulation`);
console.log(`Strategy: ${STRATEGY_NAME}, runs/crop: ${N}\n`);

const crops = ['radish', 'carrot', 'tomato', 'wheat', 'corn', 'pumpkin'];
const stats = crops.map(c => runMonteCarlo(c, strategy, N));

console.log('Crop      base    median    mean      p95       p99       max         coins/hr');
console.log('-------   ------- --------  --------  --------  --------  --------    --------');
for (const s of stats) {
  const base = CROPS[s.crop].baseYield;
  console.log(
    `${s.crop.padEnd(8)}  ${String(base).padStart(6)}  ${String(s.median).padStart(7)}   ${String(Math.floor(s.mean)).padStart(7)}   ${String(s.p95).padStart(7)}   ${String(s.p99).padStart(7)}   ${String(s.max).padStart(7)}     ${Math.floor(s.meanPerHour).toString().padStart(6)}`
  );
}

console.log('\n--- TOP 5 RUNS BY CROP (yield, mult, hours, buffs) ---');
for (const s of stats) {
  console.log(`\n${s.crop}:`);
  for (const r of s.top10.slice(0, 5)) {
    console.log(`  ${String(r.yield).padStart(8)}  (${r.yieldMult.toFixed(2)}× in ${r.hours.toFixed(1)}h)  ${r.buffs.join(', ')}`);
  }
}

// ============ PLOT ECONOMY ============
console.log('\n--- PLOT ECONOMY (assumes endless single-crop greedy run, no taps) ---');
const PLOT_COSTS = USE_PROPOSED
  ? [0, 300, 1000, 3000, 9000, 25000]
  : [0, 250, 700, 1700, 4000, 9000, 19000, 40000];
const costStr = PLOT_COSTS.slice(1).map(c => '$' + c).join('/');
console.log(`Crop      coins/hr   hrs to next plot at ${costStr}`);
for (const s of stats) {
  const cph = s.meanPerHour;
  const hrs = PLOT_COSTS.slice(1).map(c => (c / cph).toFixed(1));
  console.log(`${s.crop.padEnd(8)}  ${String(Math.floor(cph)).padStart(7)}    ${hrs.join('  ')}`);
}

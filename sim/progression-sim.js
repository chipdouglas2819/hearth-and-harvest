// Hearth & Harvest progression simulator
// Simulates calendar time at 1× speed: full gameplay loop with greedy player AI.
// Reports time-to-milestones (plot unlocks, first legendary, full loadout, etc.)
// and surfaces balance bottlenecks.

// ============ CONFIG (mirror of v6) ============
const CROPS = {
  radish:     { growthHrs: 4,  plantCost: 20,  baseYield: 70,   pickCount: 1, unlocksAt: null },
  carrot:     { growthHrs: 8,  plantCost: 35,  baseYield: 160,  pickCount: 2, unlocksAt: { crop: 'radish',     harvests: 1 } },
  tomato:     { growthHrs: 12, plantCost: 60,  baseYield: 250,  pickCount: 2, unlocksAt: { crop: 'carrot',     harvests: 1 } },
  strawberry: { growthHrs: 18, plantCost: 80,  baseYield: 370,  pickCount: 3, unlocksAt: { crop: 'tomato',     harvests: 1 } },
  wheat:      { growthHrs: 24, plantCost: 100, baseYield: 380,  pickCount: 5, unlocksAt: { crop: 'strawberry', harvests: 1 } },
  corn:       { growthHrs: 30, plantCost: 175, baseYield: 690,  pickCount: 5, unlocksAt: { crop: 'wheat',      harvests: 1 } },
  pumpkin:    { growthHrs: 40, plantCost: 220, baseYield: 950,  pickCount: 5, unlocksAt: { crop: 'corn',       harvests: 1 } },
  sunflower:  { growthHrs: 50, plantCost: 280, baseYield: 1300, pickCount: 5, unlocksAt: { crop: 'pumpkin',    harvests: 1 } },
};
function isCropUnlocked(state, crop) {
  const c = CROPS[crop];
  if (!c.unlocksAt) return true;
  const u = c.unlocksAt;
  const harvests = Math.floor((state.mastery[u.crop] || 0) / CROPS[u.crop].growthHrs);
  return harvests >= u.harvests;
}
const PLOT_COSTS = [0, 300, 1200, 5000, 20000, 80000, 320000, 1250000];
const HARVESTS_PER_PACK = 10;
const MAX_PERMA_SLOTS = 4;
const MASTERY_BONUS_PER_5 = 0.001;
const RARITY_WEIGHTS = { common: 60, uncommon: 28, rare: 9.5, legendary: 2.2, mythic: 0.3 };
const PERMA_RARITY_WEIGHTS = { common: 50, uncommon: 30, rare: 15, legendary: 4, mythic: 1 };
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'mythic'];

// In-run buff pool (mirror of v6)
const BUFF_POOL = [
  { id: 'sun', rarity: 'common', yieldMult: 1.12 },
  { id: 'rain', rarity: 'common', timeMult: 0.88 },
  { id: 'rich', rarity: 'common', yieldMult: 1.18 },
  { id: 'compost', rarity: 'common', yieldMult: 1.08, timeMult: 0.92 },
  { id: 'sprout', rarity: 'common', timeMult: 0.85 },
  { id: 'sturdy', rarity: 'common', yieldMult: 1.15 },
  { id: 'patient', rarity: 'common', yieldMult: 1.25, timeMult: 1.20 },
  { id: 'common_synergy', rarity: 'common', custom: 'common_synergy' },
  { id: 'bee', rarity: 'uncommon', yieldMult: 1.22 },
  { id: 'mulch', rarity: 'uncommon', yieldMult: 1.18, timeMult: 0.90 },
  { id: 'symbiosis', rarity: 'uncommon', custom: 'symbiosis' },
  { id: 'gamble', rarity: 'uncommon', custom: 'coin_flip_17' },
  { id: 'tradeoff_a', rarity: 'uncommon', yieldMult: 1.40, timeMult: 1.25 },
  { id: 'echo', rarity: 'uncommon', yieldMult: 1.12, custom: 'echo' },
  { id: 'twofold', rarity: 'uncommon', yieldMult: 1.15, custom: 'twofold' },
  { id: 'cross_a', rarity: 'uncommon', custom: 'cross_yield_15' },
  { id: 'lock_time', rarity: 'uncommon', yieldMult: 1.25, custom: 'lock_time' },
  { id: 'skill_a', rarity: 'uncommon', custom: 'skill_window_10' },
  { id: 'devour', rarity: 'uncommon', yieldMult: 1.35, custom: 'next_penalty_20' },
  { id: 'storm', rarity: 'rare', yieldMult: 1.45 },
  { id: 'oldway', rarity: 'rare', yieldMult: 1.20, timeMult: 0.75 },
  { id: 'common_amp', rarity: 'rare', custom: 'common_amp' },
  { id: 'cornucopia', rarity: 'rare', yieldMult: 1.20, custom: 'cornucopia' },
  { id: 'commit', rarity: 'rare', custom: 'no_more_picks_80' },
  { id: 'cross_b', rarity: 'rare', custom: 'cross_pick_1' },
  { id: 'high_gamble', rarity: 'rare', custom: 'frost_gamble' },
  { id: 'ferment', rarity: 'rare', custom: 'ferment_5s_8' },
  { id: 'pickback', rarity: 'rare', custom: 'reroll_last' },
  { id: 'rare_doubler', rarity: 'rare', custom: 'double_actives' },
  { id: 'plenty', rarity: 'legendary', yieldMult: 1.70 },
  { id: 'long_wait', rarity: 'legendary', yieldMult: 2.00, timeMult: 1.60 },
  { id: 'cascade_gold', rarity: 'legendary', custom: 'cascade_gold' },
  { id: 'cross_leg', rarity: 'legendary', custom: 'cross_yield_50' },
  { id: 'all_in', rarity: 'legendary', custom: 'all_in' },
  { id: 'wishflower', rarity: 'mythic', custom: 'wishflower' },
  { id: 'world_tree', rarity: 'mythic', custom: 'world_tree' },
  { id: 'eternal', rarity: 'mythic', custom: 'eternal' },
  { id: 'sun_god', rarity: 'mythic', custom: 'solstice' },
  { id: 'crunch', rarity: 'uncommon', yieldMult: 1.25, cropOnly: 'radish' },
  { id: 'french', rarity: 'legendary', yieldMult: 2.00, timeMult: 0.85, cropOnly: 'radish' },
  { id: 'rainbow_carrot', rarity: 'rare', yieldMult: 1.40, cropOnly: 'carrot' },
  { id: 'sugarsnap', rarity: 'legendary', yieldMult: 2.10, timeMult: 0.90, cropOnly: 'carrot' },
  { id: 'heirloom', rarity: 'uncommon', yieldMult: 1.35, cropOnly: 'tomato' },
  { id: 'beefsteak', rarity: 'legendary', yieldMult: 2.20, cropOnly: 'tomato' },
  { id: 'golden', rarity: 'uncommon', yieldMult: 1.38, cropOnly: 'wheat' },
  { id: 'harvest_hymn', rarity: 'legendary', yieldMult: 2.30, timeMult: 0.80, cropOnly: 'wheat' },
  { id: 'corn_silk', rarity: 'rare', yieldMult: 1.40, cropOnly: 'corn' },
  { id: 'sweet_corn', rarity: 'legendary', yieldMult: 2.20, timeMult: 0.90, cropOnly: 'corn' },
  { id: 'jack_o', rarity: 'rare', yieldMult: 1.50, cropOnly: 'pumpkin' },
  { id: 'field_giant', rarity: 'legendary', yieldMult: 2.30, cropOnly: 'pumpkin' },
  { id: 'berry_burst', rarity: 'uncommon', yieldMult: 1.38, cropOnly: 'strawberry' },
  { id: 'wild_jam', rarity: 'legendary', yieldMult: 2.20, timeMult: 0.85, cropOnly: 'strawberry' },
  { id: 'sunseed', rarity: 'rare', yieldMult: 1.45, cropOnly: 'sunflower' },
  { id: 'sunblaze', rarity: 'legendary', yieldMult: 2.40, timeMult: 0.90, cropOnly: 'sunflower' },
];

// Perma pool — minimal mirror, just yield/time/cropOnly/rarity
const PERMA_POOL = [
  // General
  { id: 'p_glass', rarity: 'common', yieldMult: 1.04 },
  { id: 'p_lazy_river', rarity: 'common', timeMult: 0.97 },
  { id: 'p_seeds', rarity: 'common', yieldMult: 1.05 },
  { id: 'p_humming', rarity: 'common', yieldMult: 1.03, timeMult: 0.98 },
  { id: 'p_loyal_bee', rarity: 'uncommon', yieldMult: 1.07 },
  { id: 'p_tractor', rarity: 'uncommon', timeMult: 0.94 },
  { id: 'p_library', rarity: 'uncommon' }, // mastery synergy ignored in sim
  { id: 'p_heritage', rarity: 'rare', yieldMult: 1.10 },
  { id: 'p_spring', rarity: 'rare', timeMult: 0.90 },
  { id: 'p_balance', rarity: 'rare', yieldMult: 1.08, timeMult: 0.95 },
  { id: 'p_crystal', rarity: 'legendary', yieldMult: 1.15 },
  { id: 'p_pact_earth', rarity: 'legendary', yieldMult: 1.25, timeMult: 1.05 },
  { id: 'p_starlight', rarity: 'legendary', yieldMult: 1.12, timeMult: 0.95 },
  { id: 'p_eternal_garden', rarity: 'mythic', yieldMult: 1.28 },
  { id: 'p_first_seed', rarity: 'mythic', yieldMult: 1.18, timeMult: 0.88 },
  // Crop-specific (4 per crop, 8 crops = 32)
];
// Generate crop-specific permas programmatically
const cropList = ['radish','carrot','tomato','strawberry','wheat','corn','pumpkin','sunflower'];
for (const crop of cropList) {
  PERMA_POOL.push({ id: `p_${crop}_c`, rarity: 'common', yieldMult: 1.06, cropOnly: crop });
  PERMA_POOL.push({ id: `p_${crop}_u`, rarity: 'uncommon', yieldMult: 1.10, cropOnly: crop });
  PERMA_POOL.push({ id: `p_${crop}_r`, rarity: 'rare', timeMult: 0.88, cropOnly: crop });
  PERMA_POOL.push({ id: `p_${crop}_l`, rarity: 'legendary', yieldMult: 1.28, cropOnly: crop });
}

// ============ CARD SETS (mirror of game) ============
// Crop set: own all 4 crop-specific PERMA cards → +10% yield on that crop.
// Master set: own every PERMA card → +5% global yield.
const CARD_SETS = (() => {
  const sets = [];
  for (const crop of cropList) {
    sets.push({
      id: `set_${crop}`,
      cardIds: PERMA_POOL.filter(b => b.cropOnly === crop).map(b => b.id),
      bonus: { type: 'crop_yield', crop, mult: 1.10 },
    });
  }
  sets.push({
    id: 'set_master',
    cardIds: PERMA_POOL.map(b => b.id),
    bonus: { type: 'global_yield', mult: 1.05 },
  });
  return sets;
})();
function getCardSetBonus(state, crop) {
  let mult = 1.0;
  for (const set of CARD_SETS) {
    const owned = set.cardIds.every(id => state.collection.some(c => c.id === id));
    if (!owned) continue;
    if (set.bonus.type === 'crop_yield' && set.bonus.crop === crop) mult *= set.bonus.mult;
    if (set.bonus.type === 'global_yield') mult *= set.bonus.mult;
  }
  return mult;
}

// ============ PLOT UPGRADES (mirror of game) ============
const PLOT_UPGRADES = {
  autoReplant:    { cost: 10000  },
  masterGardener: { cost: 75000  },
  practicedSoil:  { cost: 300000 },
  bonusPick:      { cost: 400000 },
};
function plotUpgradeMultiplier(plotId) {
  const t = plotId / 7;
  return 0.5 + (3.0 - 0.5) * t;
}
function plotUpgradeCost(plotId, key) {
  return Math.round(PLOT_UPGRADES[key].cost * plotUpgradeMultiplier(plotId) / 100) * 100;
}
function plotHasUpgrade(state, plotId, key) {
  return state.plotUpgrades && state.plotUpgrades[plotId] && state.plotUpgrades[plotId][key] === true;
}

// ============ STATE ============
function initState() {
  const state = {
    money: 25,
    plots: [],
    loadouts: [],
    collection: [],
    mastery: Object.fromEntries(cropList.map(c => [c, 0])),
    totalHarvests: 0,
    pendingPacks: 0,
    packsOpened: 0,
    contractCoins: 0,
    contractPacks: 0,
    lastContractRewardDay: -1,
    // Phase D additions
    plotUpgrades: [],
    totalPicksTaken: 0,        // every applyBuff increments this
    upgradeSpend: 0,           // total coins sunk into upgrades
    perDayPicks: [],           // picks taken in each simulated day (for fatigue analysis)
    lastPickSampleDay: 0,
    lastPickSampleTotal: 0,
  };
  state.plots.push(makePlot(0));
  state.loadouts.push([]);
  for (let i = 1; i < 6; i++) {
    state.plots.push({ id: i, locked: true });
    state.loadouts.push([]);
  }
  return state;
}

function makePlot(id) {
  return {
    id, locked: false, crop: null,
    elapsedMs: 0, totalMs: 0,
    totalPicks: 0, picksTaken: 0,
    yieldMult: 1.0,
    activeBuffs: [],
    flags: {
      lockTime: false, noMorePicks: false, skillWindow10: false,
      skillFerment: false, eternalActive: false, eternalUsed: false,
      committedNoMore: false, picksAtCommit: undefined,
      nextPenaltyMult: 1.0, wishflowerLeft: 0, wideDraftLeft: 0, echoLeft: 0,
    },
  };
}

// ============ HELPERS ============
function isReady(plot) { return plot.crop && plot.elapsedMs >= plot.totalMs; }
function picksUnlockedAt(plot) {
  const progress = plot.totalMs > 0 ? plot.elapsedMs / plot.totalMs : 0;
  return Math.min(plot.totalPicks, Math.floor(progress * (plot.totalPicks + 1)));
}
function picksAvailable(plot) {
  if (!plot.crop) return 0;
  if (plot.flags.noMorePicks) return 0;
  return Math.max(0, picksUnlockedAt(plot) - plot.picksTaken);
}
function activeCropsGrowing(state) {
  return new Set(state.plots.filter(p => !p.locked && p.crop).map(p => p.crop));
}

function getActivePerma(state, plotId) {
  const plot = state.plots[plotId];
  const loadout = state.loadouts[plotId] || [];
  return loadout
    .map(id => PERMA_POOL.find(b => b.id === id))
    .filter(b => b && (!b.cropOnly || b.cropOnly === plot.crop));
}
// Star-leveling: each card has 1-5 stars. Each star adds 20% of the base effect.
const STAR_THRESHOLDS = [0, 1, 3, 7, 14];
function starsFromCount(count) {
  const dupes = Math.max(0, count - 1);
  for (let s = STAR_THRESHOLDS.length; s >= 1; s--) {
    if (dupes >= STAR_THRESHOLDS[s - 1]) return s;
  }
  return 1;
}
function getStarMultiplier(stars) { return 1.0 + 0.2 * (stars - 1); }
function getStarsForBuff(state, buffId) {
  const c = state.collection.find(x => x.id === buffId);
  return c?.stars || 1;
}
function getPermaYieldMultForPlot(state, plotId) {
  let m = 1.0;
  for (const b of getActivePerma(state, plotId)) {
    const stars = getStarsForBuff(state, b.id);
    const sm = getStarMultiplier(stars);
    if (b.yieldMult) m *= 1 + (b.yieldMult - 1) * sm;
  }
  return m;
}
function getPermaTimeMultForPlot(state, plotId) {
  let m = 1.0;
  for (const b of getActivePerma(state, plotId)) {
    const stars = getStarsForBuff(state, b.id);
    const sm = getStarMultiplier(stars);
    if (b.timeMult) m *= 1 - (1 - b.timeMult) * sm;
  }
  return m;
}
// Tiered mastery curve (mirror of HTML)
const MASTERY_TIERS = [
  { upTo: 50,       hoursPerTick: 5  },
  { upTo: 200,      hoursPerTick: 10 },
  { upTo: Infinity, hoursPerTick: 20 },
];
function masteryTicksAtHours(hours) {
  let ticks = 0;
  let tierStart = 0;
  for (const tier of MASTERY_TIERS) {
    const tierEnd = Math.min(tier.upTo, hours);
    if (tierEnd > tierStart) ticks += Math.floor((tierEnd - tierStart) / tier.hoursPerTick);
    if (hours <= tier.upTo) break;
    tierStart = tier.upTo;
  }
  return ticks;
}
function getMasteryBonusForCrop(state, crop) {
  return 1 + masteryTicksAtHours(state.mastery[crop] || 0) * MASTERY_BONUS_PER_5;
}

// ============ DRAFT/APPLY ============
function isBuffApplicable(buff, plot, state) {
  const lockedRarities = ['legendary', 'mythic'];
  if (lockedRarities.includes(buff.rarity)) {
    if (plot.activeBuffs.some(b => b.id === buff.id)) return false;
  }
  const hasOtherActivePlots = state.plots.some((p, i) => i !== plot.id && !p.locked && p.crop);
  const isLastPick = (plot.totalPicks - plot.picksTaken) <= 1;
  const hasYieldActives = plot.activeBuffs.some(b => b.yieldMult);
  const commonsActive = plot.activeBuffs.filter(b => b.rarity === 'common').length;
  if (['cross_yield_15', 'cross_pick_1', 'cross_yield_50'].includes(buff.custom) && !hasOtherActivePlots) return false;
  if (['echo', 'cornucopia', 'wishflower'].includes(buff.custom) && isLastPick) return false;
  if (buff.custom === 'symbiosis' && plot.activeBuffs.length === 0) return false;
  if (buff.custom === 'common_amp' && commonsActive === 0) return false;
  if (buff.custom === 'reroll_last' && plot.activeBuffs.length === 0) return false;
  if (buff.custom === 'double_actives' && !hasYieldActives) return false;
  return true;
}

function getAvailableBuffs(plot, state) {
  return BUFF_POOL.filter(b => {
    if (b.cropOnly && b.cropOnly !== plot.crop) return false;
    return isBuffApplicable(b, plot, state);
  });
}

function draftN(plot, state, n, rarityFloor = null) {
  const pool = getAvailableBuffs(plot, state);
  const filtered = rarityFloor
    ? pool.filter(b => RARITY_ORDER.indexOf(b.rarity) >= RARITY_ORDER.indexOf(rarityFloor))
    : pool;
  const usePool = filtered.length >= n ? filtered : pool;
  const weighted = usePool.map(b => ({ b, w: RARITY_WEIGHTS[b.rarity] }));
  const picks = [];
  const used = new Set();
  for (let i = 0; i < n && picks.length < usePool.length; i++) {
    const remaining = weighted.filter(x => !used.has(x.b.id));
    if (remaining.length === 0) break;
    const total = remaining.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of remaining) {
      r -= x.w;
      if (r <= 0) { picks.push(x.b); used.add(x.b.id); break; }
    }
  }
  return picks;
}

function _trackPick(state) { state.totalPicksTaken = (state.totalPicksTaken || 0) + 1; }

function applyBuff(state, plotId, buff) {
  _trackPick(state);
  const plot = state.plots[plotId];
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
  if (buff.custom) handleCustom(plot, buff, echoActive, state);
  plot.activeBuffs.push(buff);
  plot.picksTaken += 1;
}

function handleCustom(plot, buff, echo, state) {
  const e = echo ? 2 : 1;
  switch (buff.custom) {
    case 'common_synergy': {
      const commons = plot.activeBuffs.filter(b => b.rarity === 'common').length + 1;
      plot.yieldMult *= Math.pow(1 + 0.05 * commons, e); break;
    }
    case 'symbiosis': {
      const others = plot.activeBuffs.length;
      plot.yieldMult *= Math.pow(1 + 0.06 * others, e); break;
    }
    case 'coin_flip_17':
      for (let i = 0; i < e; i++) if (Math.random() < 0.5) plot.yieldMult *= 1.7; break;
    case 'frost_gamble':
      for (let i = 0; i < e; i++) plot.yieldMult *= (Math.random() < 0.7) ? 2.2 : 0.5; break;
    case 'echo': plot.flags.echoLeft = (plot.flags.echoLeft || 0) + 1; break;
    case 'twofold': {
      const pool = BUFF_POOL.filter(b => ['common','uncommon'].includes(b.rarity) && b.id !== 'twofold' && (!b.cropOnly || b.cropOnly === plot.crop) && !b.custom && !plot.activeBuffs.some(ab => ab.id === b.id));
      if (pool.length > 0) {
        const r = pool[Math.floor(Math.random() * pool.length)];
        if (r.yieldMult) plot.yieldMult *= r.yieldMult;
        if (r.timeMult && !plot.flags.lockTime) plot.totalMs *= r.timeMult;
        plot.activeBuffs.push(r);
      }
      break;
    }
    case 'cornucopia': plot.flags.wideDraftLeft = (plot.flags.wideDraftLeft || 0) + 1; break;
    case 'cascade_gold': {
      const pool = BUFF_POOL.filter(b => b.rarity === 'rare' && b.id !== 'cascade_gold' && (!b.cropOnly || b.cropOnly === plot.crop) && !b.custom && !plot.activeBuffs.some(ab => ab.id === b.id));
      const used = new Set();
      for (let i = 0; i < 2 && pool.length > 0; i++) {
        const remaining = pool.filter(x => !used.has(x.id));
        if (remaining.length === 0) break;
        const r = remaining[Math.floor(Math.random() * remaining.length)];
        used.add(r.id);
        if (r.yieldMult) plot.yieldMult *= r.yieldMult;
        if (r.timeMult && !plot.flags.lockTime) plot.totalMs *= r.timeMult;
        plot.activeBuffs.push(r);
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
    case 'double_actives': {
      const yieldBuffs = plot.activeBuffs.filter(b => b.yieldMult);
      if (yieldBuffs.length === 0) break;
      const best = yieldBuffs.reduce((max, b) => b.yieldMult > max.yieldMult ? b : max);
      plot.yieldMult *= Math.pow(best.yieldMult, e);
      break;
    }
    case 'no_more_picks_80':
      plot.flags.noMorePicks = true;
      plot.flags.committedNoMore = true;
      plot.flags.picksAtCommit = plot.picksTaken + 1;
      break;
    case 'all_in': {
      const carryover = plot.flags.nextPenaltyMult || 1.0;
      plot.yieldMult = carryover;
      plot.activeBuffs = [];
      plot.yieldMult *= Math.pow(2.1, e); break;
    }
    case 'wishflower':
      plot.flags.wishflowerLeft = (plot.flags.wishflowerLeft || 0) + 2;
      plot.totalPicks += 2; break;
    case 'world_tree':
      plot.yieldMult *= Math.pow(2.9, e);
      plot.flags.noMorePicks = true; break;
    case 'eternal': plot.flags.eternalActive = true; break;
    case 'solstice': plot.yieldMult *= Math.pow(2.0, e); break;
    case 'common_amp': {
      const commons = plot.activeBuffs.filter(b => b.rarity === 'common').length;
      plot.yieldMult *= Math.pow(1 + 0.20 * commons, e); break;
    }
  }
}

// ============ PLAYER ACTIONS ============
function expectedYieldMult(buff) {
  if (buff.yieldMult) return buff.yieldMult;
  if (buff.custom === 'world_tree') return 2.9;
  if (buff.custom === 'all_in') return 2.1;
  if (buff.custom === 'solstice') return 2.0;
  if (buff.custom === 'cascade_gold') return 1.45 * 1.45;
  if (buff.custom === 'frost_gamble') return 1.69;
  if (buff.custom === 'coin_flip_17') return 1.35;
  if (buff.custom === 'no_more_picks_80') return 1.60;
  if (buff.custom === 'wishflower') return 2.0;
  return 1.0;
}
// Risk-adjusted version: discounts high-variance buffs.
// Used by the conservative strategy — they prefer steady gains over gambles.
function riskAdjustedYieldMult(buff) {
  const base = expectedYieldMult(buff);
  if (buff.custom === 'frost_gamble') return base * 0.6;     // 30% chance of −50%
  if (buff.custom === 'coin_flip_17') return base * 0.85;     // 50% chance of nothing
  if (buff.custom === 'all_in') return base * 0.5;           // wipes prior buffs
  if (buff.custom === 'no_more_picks_80') return base * 0.85; // commits early
  if (buff.timeMult && buff.timeMult > 1.10) return base * 0.9; // slow growth
  return base;
}
// Strategy: pick the buff with the highest expected yield mult.
function pickGreedy(picks) {
  return picks.reduce((best, b) => expectedYieldMult(b) > expectedYieldMult(best) ? b : best);
}
// Strategy: like greedy, but risk-averse (discounts variance and commit/lose buffs).
function pickConservative(picks) {
  return picks.reduce((best, b) => riskAdjustedYieldMult(b) > riskAdjustedYieldMult(best) ? b : best);
}
// Strategy: novice player picks at random — establishes a floor for "what if you don't optimize".
function pickNovice(picks) {
  return picks[Math.floor(Math.random() * picks.length)];
}
// Strategy: prefers crop-specific cards (best long-term value via star-leveling).
function pickCropFocused(picks) {
  const cropPicks = picks.filter(p => p.cropOnly);
  if (cropPicks.length > 0) {
    return cropPicks.reduce((best, b) => expectedYieldMult(b) > expectedYieldMult(best) ? b : best);
  }
  return pickGreedy(picks);
}
const STRATEGIES = {
  greedy:      pickGreedy,
  conservative:pickConservative,
  novice:      pickNovice,
  cropFocused: pickCropFocused,
};

function plant(state, plotId, crop) {
  const plot = state.plots[plotId];
  state.money -= CROPS[crop].plantCost;
  const carryover = plot.flags?.nextPenaltyMult || 1.0;
  Object.assign(plot, makePlot(plotId));
  plot.crop = crop;
  // Plot upgrades affect time and pick count
  const practicedSoilMult = plotHasUpgrade(state, plotId, 'practicedSoil') ? 0.9 : 1.0;
  plot.totalMs = CROPS[crop].growthHrs * 3600 * 1000 * getPermaTimeMultForPlot(state, plotId) * practicedSoilMult;
  plot.totalPicks = CROPS[crop].pickCount + (plotHasUpgrade(state, plotId, 'bonusPick') ? 1 : 0);
  plot.yieldMult *= carryover;
}

function pickBestCropToPlant(state) {
  // Plant the best coin/hr crop the player can afford, that isn't already growing,
  // AND that's unlocked (mastery-gated).
  const growing = activeCropsGrowing(state);
  const candidates = Object.entries(CROPS)
    .filter(([k, c]) => !growing.has(k) && state.money >= c.plantCost && isCropUnlocked(state, k))
    .sort((a, b) => (b[1].baseYield / b[1].growthHrs) - (a[1].baseYield / a[1].growthHrs));
  return candidates[0]?.[0];
}

function harvest(state, plotId) {
  const plot = state.plots[plotId];
  let mult = plot.yieldMult;
  if (plot.flags.committedNoMore && plot.flags.picksAtCommit !== undefined && plot.picksTaken === plot.flags.picksAtCommit) {
    mult *= 1.60;
  }
  mult *= getPermaYieldMultForPlot(state, plotId);
  mult *= getMasteryBonusForCrop(state, plot.crop);
  mult *= getCardSetBonus(state, plot.crop);
  const yieldAmount = Math.floor(CROPS[plot.crop].baseYield * mult);
  state.money += yieldAmount;
  // Mastery now in grow-hours invested
  state.mastery[plot.crop] = (state.mastery[plot.crop] || 0) + CROPS[plot.crop].growthHrs;
  state.totalHarvests += 1;
  if (state.totalHarvests % HARVESTS_PER_PACK === 0) state.pendingPacks += 1;
  // skill_window_10: skill check assumed missed in sim (player won't catch every 10s window)
  // skill_ferment: skip in sim
  const carry = plot.flags.nextPenaltyMult || 1.0;
  Object.assign(plot, makePlot(plotId));
  plot.flags.nextPenaltyMult = carry < 1 ? carry : 1.0;
}

function draftPermaPack(state, n, rarityFloor = null) {
  // Every pack guarantees 1 general; remaining slots are random
  const guaranteedGeneral = 1;
  const filterByFloor = (b) => rarityFloor ? RARITY_ORDER.indexOf(b.rarity) >= RARITY_ORDER.indexOf(rarityFloor) : true;
  const generalPool = PERMA_POOL.filter(b => !b.cropOnly && filterByFloor(b));
  const fullPool = PERMA_POOL.filter(filterByFloor);
  const picks = [];
  const used = new Set();
  for (let i = 0; i < guaranteedGeneral && i < n; i++) {
    const pool = generalPool.filter(b => !used.has(b.id));
    if (pool.length === 0) break;
    const weighted = pool.map(b => ({ b, w: PERMA_RARITY_WEIGHTS[b.rarity] }));
    const total = weighted.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) { picks.push(x.b); used.add(x.b.id); break; }
    }
  }
  while (picks.length < n) {
    const pool = fullPool.filter(b => !used.has(b.id));
    if (pool.length === 0) break;
    const weighted = pool.map(b => ({ b, w: PERMA_RARITY_WEIGHTS[b.rarity] }));
    const total = weighted.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) { picks.push(x.b); used.add(x.b.id); break; }
    }
  }
  return picks;
}

function addToCollection(state, buff) {
  const existing = state.collection.find(c => c.id === buff.id);
  if (existing) {
    existing.count += 1;
    existing.stars = starsFromCount(existing.count);
  } else {
    state.collection.push({ ...buff, count: 1, stars: 1 });
  }
}

function autoEquip(state, card) {
  // Prefer the plot growing the matching crop; fall back to plot 0 for general.
  const plotIdx = card.cropOnly
    ? state.plots.findIndex(p => !p.locked && p.crop === card.cropOnly)
    : 0;
  if (plotIdx < 0 || plotIdx === undefined) return;
  if (!state.loadouts[plotIdx]) state.loadouts[plotIdx] = [];
  if (state.loadouts[plotIdx].includes(card.id)) return;
  // Compare new card's strength to existing slot occupants — replace weakest if loadout is full
  const strength = (b) => (RARITY_ORDER.indexOf(b.rarity) + 1) * (b.yieldMult || 1) * (b.timeMult ? (1 / b.timeMult) : 1);
  if (state.loadouts[plotIdx].length < MAX_PERMA_SLOTS) {
    state.loadouts[plotIdx].push(card.id);
  } else {
    const occupants = state.loadouts[plotIdx].map(id => PERMA_POOL.find(b => b.id === id));
    const weakest = occupants.reduce((min, b) => strength(b) < strength(min) ? b : min);
    if (strength(card) > strength(weakest)) {
      const idx = state.loadouts[plotIdx].indexOf(weakest.id);
      state.loadouts[plotIdx][idx] = card.id;
    }
  }
}

function buyPlot(state, plotId) {
  state.money -= PLOT_COSTS[plotId];
  state.plots[plotId] = makePlot(plotId);
  if (!state.loadouts[plotId]) state.loadouts[plotId] = [];
  const nextId = state.plots.length;
  if (nextId < PLOT_COSTS.length) {
    state.plots.push({ id: nextId, locked: true });
    state.loadouts.push([]);
  }
}

// AI buys upgrades when plots aren't affordable. Cheapest unowned upgrade first.
function tryBuyCheapestUpgrade(state) {
  const lockedIdx = state.plots.findIndex(p => p.locked);
  if (lockedIdx >= 0 && state.money >= PLOT_COSTS[lockedIdx]) return false; // save for plot
  let cheapest = null;
  for (const plot of state.plots) {
    if (plot.locked) continue;
    for (const key of Object.keys(PLOT_UPGRADES)) {
      if (plotHasUpgrade(state, plot.id, key)) continue;
      const cost = plotUpgradeCost(plot.id, key);
      if (state.money >= cost && (!cheapest || cost < cheapest.cost)) {
        cheapest = { plotId: plot.id, key, cost };
      }
    }
  }
  if (cheapest) {
    state.money -= cheapest.cost;
    if (!state.plotUpgrades[cheapest.plotId]) state.plotUpgrades[cheapest.plotId] = {};
    state.plotUpgrades[cheapest.plotId][cheapest.key] = true;
    state.upgradeSpend = (state.upgradeSpend || 0) + cheapest.cost;
    return true;
  }
  return false;
}

// ============ TICK ============
function tickSim(state, dtSec) {
  for (const p of state.plots) {
    if (p.locked || !p.crop) continue;
    p.elapsedMs = Math.min(p.totalMs, p.elapsedMs + dtSec * 1000);
  }
}

// Approximate Phase C contract rewards once per simulated day.
// Models the expected behaviour of a player who accepts what they can finish.
function awardDailyContracts(state, simSec) {
  const day = Math.floor(simSec / 86400);
  if (day === state.lastContractRewardDay) return;
  state.lastContractRewardDay = day;
  if (day === 0) return; // no time to complete on day 0

  const plotCount = state.plots.filter(p => !p.locked).length;
  let coins = 0, packs = 0;

  // Bronze: 150 + count*40, ~90% completion. count 2-3 → 230-270
  if (Math.random() < 0.90) {
    coins += 180 + Math.floor(Math.random() * 90);
  }
  // Silver: 300 + count*70, ~80% completion. count 5-7 → 650-790
  if (plotCount >= 3 && Math.random() < 0.80) {
    coins += 500 + Math.floor(Math.random() * 300);
    if (Math.random() < 0.30) packs += 1;
  }
  // 2nd Silver at 5+ plots, ~70% completion
  if (plotCount >= 5 && Math.random() < 0.70) {
    coins += 500 + Math.floor(Math.random() * 300);
    if (Math.random() < 0.30) packs += 1;
  }
  // Gold: 1500 + count*70, 25% offered × 80% complete. count ~12 → 2340
  if (plotCount >= 5 && Math.random() < 0.25 * 0.80) {
    coins += 2000 + Math.floor(Math.random() * 1300);
    packs += 1;
  }

  state.money += coins;
  state.pendingPacks += packs;
  state.contractCoins += coins;
  state.contractPacks += packs;
}

function playerActions(state, milestones, simSec, pickStrategy = pickGreedy) {
  awardDailyContracts(state, simSec);
  // 1. Harvest ready
  state.plots.forEach((p, i) => {
    if (p.locked || !p.crop || !isReady(p)) return;
    const crop = p.crop;
    harvest(state, i);
    if (!milestones[`first_${crop}_harvested`]) milestones[`first_${crop}_harvested`] = simSec;
  });

  // 2. Take all picks
  state.plots.forEach((p, i) => {
    let safety = 50;
    while (picksAvailable(p) > 0 && safety-- > 0) {
      const draftSize = p.flags.wideDraftLeft > 0 ? 5 : 3;
      const rarityFloor = p.flags.wishflowerLeft > 0 ? 'legendary' : null;
      const picks = draftN(p, state, draftSize, rarityFloor);
      if (picks.length === 0) break;
      const chosen = pickStrategy(picks);
      applyBuff(state, i, chosen);
    }
  });

  // 3. Plant empty plots
  state.plots.forEach((p, i) => {
    if (p.locked || p.crop) return;
    const crop = pickBestCropToPlant(state);
    if (crop) plant(state, i, crop);
  });

  // 4. Buy next plot
  const lockedIdx = state.plots.findIndex(p => p.locked);
  if (lockedIdx >= 0 && state.money >= PLOT_COSTS[lockedIdx]) {
    buyPlot(state, lockedIdx);
    milestones[`plot${lockedIdx + 1}_unlocked`] = simSec;
  }

  // 4.5 Once plot saving isn't an immediate goal, sink coins into upgrades
  tryBuyCheapestUpgrade(state);

  // Sample picks-per-day (for fatigue analysis)
  const dayNow = Math.floor(simSec / 86400);
  if (dayNow > state.lastPickSampleDay) {
    const picksThisDay = (state.totalPicksTaken || 0) - (state.lastPickSampleTotal || 0);
    state.perDayPicks.push(picksThisDay);
    state.lastPickSampleDay = dayNow;
    state.lastPickSampleTotal = state.totalPicksTaken || 0;
  }

  // 5. Open packs
  while (state.pendingPacks > 0) {
    const cards = draftPermaPack(state, 3);
    state.pendingPacks -= 1;
    state.packsOpened += 1;
    cards.forEach(c => {
      addToCollection(state, c);
      autoEquip(state, c);
      if (c.rarity === 'legendary' && !milestones.first_legendary_perma) milestones.first_legendary_perma = simSec;
      if (c.rarity === 'mythic' && !milestones.first_mythic_perma) milestones.first_mythic_perma = simSec;
    });
    if (!milestones.first_pack_opened) milestones.first_pack_opened = simSec;
    if (!milestones.full_loadout_p1 && state.loadouts[0].length >= 4) milestones.full_loadout_p1 = simSec;
    // Set completion milestones — track first set + first crop set + master
    if (!milestones.first_set_complete) {
      const anyComplete = CARD_SETS.some(s => s.cardIds.every(id => state.collection.some(c => c.id === id)));
      if (anyComplete) milestones.first_set_complete = simSec;
    }
    if (!milestones.master_set_complete) {
      const masterSet = CARD_SETS.find(s => s.id === 'set_master');
      if (masterSet.cardIds.every(id => state.collection.some(c => c.id === id))) {
        milestones.master_set_complete = simSec;
      }
    }
  }
}

// ============ RUN ============
function fmtTime(sec) {
  const h = sec / 3600;
  if (h < 1) return `${Math.floor(sec / 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  const d = h / 24;
  return `${d.toFixed(1)}d (${h.toFixed(0)}h)`;
}

function runSim(daysMax = 60, opts = {}) {
  const pickStrategy = opts.pickStrategy || pickGreedy;
  const dailySnapshots = !!opts.dailySnapshots;
  const state = initState();
  const milestones = {};
  const TICK_SEC = 60; // simulate 1 minute increments
  const totalSec = daysMax * 24 * 3600;
  const snapshots = [];
  // Pre-build snapshot day-set: either every day (CSV) or sparse (default).
  const snapshotDays = dailySnapshots
    ? Array.from({ length: daysMax + 1 }, (_, d) => d)
    : [1, 7, 14, 30, 60].filter(d => d <= daysMax);
  const snapshotAtSet = new Set(snapshotDays.map(d => d * 24 * 3600));
  for (let simSec = 0; simSec < totalSec; simSec += TICK_SEC) {
    tickSim(state, TICK_SEC);
    playerActions(state, milestones, simSec, pickStrategy);
    if (snapshotAtSet.has(simSec)) {
      snapshots.push({ day: simSec / 86400, state: snapshotState(state) });
    }
  }
  return { state, milestones, snapshots };
}

function snapshotState(state) {
  const unlockedPlots = state.plots.filter(p => !p.locked).length;
  const starDist = [0, 0, 0, 0, 0];
  for (const c of state.collection) starDist[(c.stars || 1) - 1] += 1;
  // Count plot upgrades owned
  let upgradesOwned = 0;
  for (const ups of (state.plotUpgrades || [])) {
    for (const k in (ups || {})) if (ups[k]) upgradesOwned += 1;
  }
  return {
    money: Math.floor(state.money),
    unlockedPlots,
    totalHarvests: state.totalHarvests,
    packsOpened: state.packsOpened,
    legendariesOwned: state.collection.filter(c => c.rarity === 'legendary').length,
    mythicsOwned: state.collection.filter(c => c.rarity === 'mythic').length,
    totalCardsOwned: state.collection.reduce((s, c) => s + c.count, 0),
    uniqueCardsOwned: state.collection.length,
    mastery: { ...state.mastery },
    loadoutFill: state.loadouts.slice(0, unlockedPlots).map(l => l.length),
    starDist,
    contractCoins: state.contractCoins || 0,
    contractPacks: state.contractPacks || 0,
    totalPicksTaken: state.totalPicksTaken || 0,
    upgradeSpend: state.upgradeSpend || 0,
    upgradesOwned,
    avgPicksPerDay: state.perDayPicks.length ? state.perDayPicks.reduce((a, b) => a + b, 0) / state.perDayPicks.length : 0,
  };
}

// ============ MODULE EXPORTS ============
// (keeps the CLI block at the bottom guarded so other sims can `require()` this file)
if (typeof module !== 'undefined') {
  module.exports = {
    CROPS, PLOT_COSTS, PLOT_UPGRADES, BUFF_POOL, PERMA_POOL,
    RARITY_WEIGHTS, PERMA_RARITY_WEIGHTS, RARITY_ORDER,
    HARVESTS_PER_PACK, MAX_PERMA_SLOTS, MASTERY_BONUS_PER_5,
    cropList,
    initState, makePlot, runSim, snapshotState,
    pickGreedy, pickConservative, pickNovice, pickCropFocused, STRATEGIES,
    expectedYieldMult, riskAdjustedYieldMult,
    draftPermaPack, addToCollection,
    masteryTicksAtHours,
  };
}

// CLI entrypoint guard — only runs when invoked directly, not via require()
if (require.main !== module) return;

// ============ REPORT ============
function parseArg(name, fallback) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : fallback;
}
const RUNS = parseInt(parseArg('runs', process.argv[2])) || 5;
const DAYS = parseInt(parseArg('days', process.argv[3])) || 60;
const STRATEGY_NAME = parseArg('strategy', 'greedy');
const CSV_PATH = parseArg('csv', null);
const strategy = STRATEGIES[STRATEGY_NAME];
if (!strategy) {
  console.error(`Unknown strategy: ${STRATEGY_NAME}. Choices: ${Object.keys(STRATEGIES).join(', ')}`);
  process.exit(1);
}

console.log(`Hearth & Harvest progression simulation`);
console.log(`Runs: ${RUNS}, simulated days per run: ${DAYS}, strategy: ${STRATEGY_NAME}`);
console.log(`Player AI: plant best-coin/hr available, auto-equip strongest cards`);
if (CSV_PATH) console.log(`CSV output: ${CSV_PATH} (run 1, daily snapshots)`);
console.log('');

const allRuns = [];
for (let i = 0; i < RUNS; i++) {
  // Run 1 gets daily snapshots if CSV requested
  const opts = { pickStrategy: strategy, dailySnapshots: i === 0 && !!CSV_PATH };
  allRuns.push(runSim(DAYS, opts));
}

// Optional CSV export — daily snapshot of run 1
if (CSV_PATH) {
  const fs = require('fs');
  const r0 = allRuns[0];
  const headers = ['day','money','plots','harvests','packs_opened','unique_cards','total_cards','legendaries','mythics','total_picks','upgrades_owned','upgrade_spend','contract_coins','contract_packs'];
  const lines = [headers.join(',')];
  for (const snap of r0.snapshots) {
    const s = snap.state;
    lines.push([
      snap.day, s.money, s.unlockedPlots, s.totalHarvests, s.packsOpened,
      s.uniqueCardsOwned, s.totalCardsOwned, s.legendariesOwned, s.mythicsOwned,
      s.totalPicksTaken, s.upgradesOwned, s.upgradeSpend,
      s.contractCoins, s.contractPacks,
    ].join(','));
  }
  fs.writeFileSync(CSV_PATH, lines.join('\n'));
  console.log(`Wrote ${lines.length - 1} day-rows to ${CSV_PATH}\n`);
}

// Aggregate milestones
function pct(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)];
}

console.log('=== MILESTONE TIMING (median across runs) ===');
const milestoneKeys = [
  'first_pack_opened',
  'plot2_unlocked', 'plot3_unlocked', 'plot4_unlocked',
  'plot5_unlocked', 'plot6_unlocked', 'plot7_unlocked', 'plot8_unlocked',
  'first_legendary_perma', 'first_mythic_perma',
  'full_loadout_p1',
  'first_set_complete', 'master_set_complete',
];
for (const k of milestoneKeys) {
  const times = allRuns.map(r => r.milestones[k]).filter(t => t !== undefined);
  if (times.length === 0) {
    console.log(`  ${k.padEnd(28)} not reached in ${DAYS}d`);
  } else {
    const median = pct(times, 0.5);
    console.log(`  ${k.padEnd(28)} ${fmtTime(median)} (${times.length}/${RUNS} runs)`);
  }
}

console.log('\n=== STATE OVER TIME (run 1) ===');
const r0 = allRuns[0];
for (const snap of r0.snapshots) {
  console.log(`Day ${snap.day}:`);
  console.log(`  $${snap.state.money}, plots ${snap.state.unlockedPlots}/8, ${snap.state.totalHarvests} harvests, ${snap.state.packsOpened} packs opened`);
  console.log(`  Collection: ${snap.state.uniqueCardsOwned} unique (${snap.state.totalCardsOwned} total) — ${snap.state.legendariesOwned} legendaries, ${snap.state.mythicsOwned} mythics`);
  const loadoutStr = snap.state.loadoutFill.map((n, i) => `P${i+1}:${n}/4`).join(', ');
  console.log(`  Loadouts: ${loadoutStr}`);
  const sd = snap.state.starDist;
  console.log(`  Stars: ★1:${sd[0]}, ★2:${sd[1]}, ★3:${sd[2]}, ★4:${sd[3]}, ★5:${sd[4]}`);
  const top3 = Object.entries(snap.state.mastery).filter(([k, v]) => v > 0).sort((a,b) => b[1] - a[1]).slice(0, 3);
  if (top3.length > 0) console.log(`  Top mastery: ${top3.map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

console.log('\n=== END-STATE (median across runs at day ' + DAYS + ') ===');
const endStates = allRuns.map(r => snapshotState(r.state));
console.log(`  Money: $${pct(endStates.map(s => s.money), 0.5)}`);
console.log(`  Plots unlocked: ${pct(endStates.map(s => s.unlockedPlots), 0.5)} / 8`);
console.log(`  Total harvests: ${pct(endStates.map(s => s.totalHarvests), 0.5)}`);
console.log(`  Packs opened: ${pct(endStates.map(s => s.packsOpened), 0.5)}`);
console.log(`  Unique cards owned: ${pct(endStates.map(s => s.uniqueCardsOwned), 0.5)} / ${PERMA_POOL.length}`);
console.log(`  Legendaries: ${pct(endStates.map(s => s.legendariesOwned), 0.5)}`);
const sd = [0,1,2,3,4].map(i => pct(endStates.map(s => s.starDist[i]), 0.5));
console.log(`  Star distribution (median): ★1:${sd[0]}, ★2:${sd[1]}, ★3:${sd[2]}, ★4:${sd[3]}, ★5:${sd[4]}`);
console.log(`  Plot upgrades owned: ${pct(endStates.map(s => s.upgradesOwned), 0.5)} / ${8 * Object.keys(PLOT_UPGRADES).length}`);
console.log(`  Spent on upgrades: $${pct(endStates.map(s => s.upgradeSpend), 0.5)}`);
console.log(`  Total boon picks taken: ${pct(endStates.map(s => s.totalPicksTaken), 0.5)}`);
console.log(`  Avg picks per simulated day: ${pct(endStates.map(s => s.avgPicksPerDay), 0.5).toFixed(1)}`);
const peakDayPicks = pct(endStates.map(s => Math.max(...s.starDist.length ? [s.totalPicksTaken / Math.max(1, DAYS)] : [0])), 0.5);

// Mastery — median grow-hours invested per crop
console.log('  Mastery medians (grow-hours invested):');
for (const crop of cropList) {
  const hours = endStates.map(s => s.mastery[crop]);
  const median = pct(hours, 0.5);
  const bonusPct = (masteryTicksAtHours(median) * 0.1).toFixed(1);
  console.log(`    ${crop.padEnd(11)} ${String(Math.floor(median)).padStart(5)}h  →  +${bonusPct}% mastery bonus`);
}

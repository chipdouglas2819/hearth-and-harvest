// Hearth & Harvest balance audit
// Runs heavy multi-strategy sims and surfaces concrete balance issues.
// This is the "yes there are blind spots, here they are" tool.
//
// Usage: node sim/balance-audit.js [runs=50] [days=60]

const sim = require('./progression-sim.js');

const RUNS = parseInt(process.argv[2]) || 50;
const DAYS = parseInt(process.argv[3]) || 60;

console.log(`\n========================================`);
console.log(`Hearth & Harvest — BALANCE AUDIT`);
console.log(`${RUNS} runs × ${DAYS} days × 4 strategies`);
console.log(`========================================\n`);

function median(arr) { const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; }
function mean(arr) { return arr.reduce((a,b)=>a+b,0) / arr.length; }
function pct(arr, p) { const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length*p)]; }

// ============ RUN ALL STRATEGIES ============
console.log('Running progression sims (this takes ~10-20s)...');
const t0 = Date.now();
const strategies = ['optimal', 'greedy', 'conservative', 'cropFocused', 'novice'];
const allRuns = {};
for (const stratName of strategies) {
  const strategy = sim.STRATEGIES[stratName];
  allRuns[stratName] = [];
  for (let i = 0; i < RUNS; i++) {
    allRuns[stratName].push(sim.runSim(DAYS, { pickStrategy: strategy }));
  }
}
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

// ============ STRATEGY GAP REPORT ============
console.log('=== 1. STRATEGY GAP ===');
console.log('How much does skilled play matter? Compare end-of-run money.\n');
const stratStats = {};
for (const stratName of strategies) {
  const ends = allRuns[stratName].map(r => sim.snapshotState(r.state));
  stratStats[stratName] = {
    moneyMedian: median(ends.map(s => s.money)),
    moneyMean: Math.floor(mean(ends.map(s => s.money))),
    moneyP10: pct(ends.map(s => s.money), 0.1),
    moneyP90: pct(ends.map(s => s.money), 0.9),
    plots: median(ends.map(s => s.unlockedPlots)),
    harvests: median(ends.map(s => s.totalHarvests)),
    legendaries: median(ends.map(s => s.legendariesOwned)),
    plot7Reach: allRuns[stratName].filter(r => r.milestones.plot7_unlocked !== undefined).length,
  };
}
console.log('Strategy           Median $   Mean $    P10–P90 $          Plots  Harvests  Leg.  P7-reach');
console.log('-'.repeat(95));
for (const stratName of strategies) {
  const s = stratStats[stratName];
  console.log(`${stratName.padEnd(18)} $${String(s.moneyMedian).padEnd(8)} $${String(s.moneyMean).padEnd(8)} $${s.moneyP10}–${String(s.moneyP90).padEnd(15)} ${String(s.plots).padEnd(6)} ${String(s.harvests).padEnd(9)} ${String(s.legendaries).padEnd(5)} ${s.plot7Reach}/${RUNS}`);
}

// "Skill gap" = best-informed strategy vs random novice. Greedy alone isn't the right
// reference because it can be self-defeating (e.g., when its heuristic over-values
// time-stretchers or gambles). The healthy metric is "does any strategy clearly beat
// random play?"
const informedNames = ['greedy', 'optimal', 'conservative', 'cropFocused'];
const informedBestName = informedNames.reduce((best, n) =>
  stratStats[n].moneyMedian > stratStats[best].moneyMedian ? n : best, informedNames[0]);
const bestStat = stratStats[informedBestName];
const gap = (bestStat.moneyMedian / Math.max(1, stratStats.novice.moneyMedian) - 1) * 100;
console.log(`\nBest informed (${informedBestName}) vs Novice: informed is ${gap.toFixed(0)}% richer.`);
if (gap > 200) console.log('🚩 ISSUE: Skill gap >200% — game heavily punishes casual players.');
else if (gap < 30) console.log('🚩 ISSUE: Skill gap <30% — strategy doesn\'t matter; player choice feels meaningless.');
else console.log('✓ Skill gap in healthy range (30–200%).');

// Inverted-greedy detector: if greedy LOSES to novice, the greedy heuristic is wrong.
const greedyVsNovice = (stratStats.greedy.moneyMedian / Math.max(1, stratStats.novice.moneyMedian) - 1) * 100;
if (greedyVsNovice < 0) {
  console.log(`⚠ Greedy AI loses to novice by ${Math.abs(greedyVsNovice).toFixed(0)}% — heuristic is mis-valuing some boons.`);
}

const consGap = (stratStats.conservative.moneyMedian / stratStats.greedy.moneyMedian - 1) * 100;
console.log(`Conservative vs Greedy: ${consGap >= 0 ? '+' : ''}${consGap.toFixed(0)}% (variance penalty for greedy).`);

// ============ STUCK-POINT DETECTION ============
console.log('\n=== 2. STUCK POINTS ===');
console.log('Days where money growth flatlines (<5%/day for 3+ days).');
console.log('Stuck regions = where players might feel grindy.\n');

const allStuckRegions = [];
for (const stratName of strategies) {
  const stuckCounts = []; // per-run count of stuck days
  for (const run of allRuns[stratName]) {
    const regions = sim.detectStuckPoints(run.snapshots);
    let stuckDays = 0;
    for (const r of regions) {
      stuckDays += r.length;
      allStuckRegions.push({ strategy: stratName, ...r });
    }
    stuckCounts.push(stuckDays);
  }
  const avgStuck = mean(stuckCounts);
  const maxStuck = Math.max(...stuckCounts);
  console.log(`${stratName.padEnd(18)} avg ${avgStuck.toFixed(1)} stuck days/run, max ${maxStuck}`);
}

// Heatmap: which days are most commonly stuck across all runs?
const dayStuckCount = {};
for (const region of allStuckRegions) {
  for (let d = Math.floor(region.startDay); d <= Math.floor(region.endDay); d++) {
    dayStuckCount[d] = (dayStuckCount[d] || 0) + 1;
  }
}
const stuckSorted = Object.entries(dayStuckCount).sort((a,b) => b[1] - a[1]);
const totalRunsAcrossStrats = RUNS * strategies.length;
const topStuck = stuckSorted.filter(([d, count]) => count >= totalRunsAcrossStrats * 0.25).slice(0, 8);
if (topStuck.length > 0) {
  console.log('\nMost commonly stuck days (≥25% of runs got stuck on this day):');
  for (const [day, count] of topStuck) {
    const pctStuck = (count / totalRunsAcrossStrats * 100).toFixed(0);
    console.log(`  Day ${String(day).padStart(2)}: stuck in ${pctStuck}% of runs (${count}/${totalRunsAcrossStrats})`);
  }
  console.log('🚩 ISSUE: Concentrated stuck-points — these days feel grindy across most playthroughs.');
} else {
  console.log('\n✓ No stuck-day concentrated above 25% of runs.');
}

// ============ COIN/HR PER CROP ============
console.log('\n=== 3. COIN/HR SCALING PER CROP ===');
console.log('Greedy run, no taps. Should grow steadily — flat regions mean a crop is dead-on-arrival.\n');
// Use balance-sim-like calc (per-crop yield from yieldMult chain — simplified to base × 1.0)
// Actually use the existing CROPS from progression-sim and assume buff yield ≈ 2.5x avg.
// Better: read off the rough numbers we already have.
const crops = sim.cropList;
const cropExpectedYieldMult = 2.5; // greedy avg from balance-sim earlier runs
console.log('Crop         baseYield  growthHr  base $/hr  w/ ~2.5× avg buff');
console.log('-'.repeat(65));
let prevPerHr = 0;
for (const crop of crops) {
  const c = sim.CROPS[crop];
  const basePerHr = c.baseYield / c.growthHrs;
  const buffedPerHr = (c.baseYield * cropExpectedYieldMult) / c.growthHrs;
  const growthVsPrev = prevPerHr > 0 ? ((buffedPerHr / prevPerHr - 1) * 100).toFixed(0) + '%' : '—';
  const flag = prevPerHr > 0 && buffedPerHr / prevPerHr - 1 < 0.05 ? '🚩 flat' : '';
  console.log(`${crop.padEnd(12)} ${String(c.baseYield).padStart(8)}  ${String(c.growthHrs).padStart(7)}h  ${String(Math.floor(basePerHr)).padStart(8)}   ${String(Math.floor(buffedPerHr)).padStart(8)}/hr  (${growthVsPrev} vs prev) ${flag}`);
  prevPerHr = buffedPerHr;
}

// ============ MILESTONE SPREAD ============
console.log('\n=== 4. MILESTONE TIMING (greedy) ===');
console.log('When does a typical greedy player reach key checkpoints?\n');
const greedyRuns = allRuns.greedy;
const milestoneKeys = [
  ['first_pack_opened', 'First pack'],
  ['plot2_unlocked', 'Plot 2'],
  ['plot3_unlocked', 'Plot 3'],
  ['plot4_unlocked', 'Plot 4'],
  ['plot5_unlocked', 'Plot 5'],
  ['plot6_unlocked', 'Plot 6'],
  ['plot7_unlocked', 'Plot 7'],
  ['plot8_unlocked', 'Plot 8'],
  ['first_legendary_perma', 'First legendary'],
  ['first_mythic_perma', 'First mythic'],
  ['first_set_complete', 'First set complete'],
  ['master_set_complete', 'Master set'],
];
console.log('Milestone                   p25 day   median   p75 day   reached');
console.log('-'.repeat(70));
for (const [key, label] of milestoneKeys) {
  const times = greedyRuns.map(r => r.milestones[key]).filter(t => t !== undefined);
  if (times.length === 0) {
    console.log(`${label.padEnd(28)} —         —        —         0/${RUNS}`);
    continue;
  }
  const p25Day = (pct(times, 0.25) / 86400).toFixed(1);
  const medDay = (median(times) / 86400).toFixed(1);
  const p75Day = (pct(times, 0.75) / 86400).toFixed(1);
  console.log(`${label.padEnd(28)} ${p25Day.padStart(7)}d  ${medDay.padStart(7)}d ${p75Day.padStart(7)}d   ${times.length}/${RUNS}`);
}

// ============ END STATE ============
console.log('\n=== 5. END-OF-RUN STATE (greedy, day ' + DAYS + ') ===');
const endStates = greedyRuns.map(r => sim.snapshotState(r.state));
console.log(`Money:                $${pct(endStates.map(s=>s.money), 0.5)}`);
console.log(`Plots unlocked:       ${pct(endStates.map(s=>s.unlockedPlots), 0.5)} / 8`);
console.log(`Total harvests:       ${pct(endStates.map(s=>s.totalHarvests), 0.5)}`);
console.log(`Packs opened:         ${pct(endStates.map(s=>s.packsOpened), 0.5)}`);
console.log(`Unique cards:         ${pct(endStates.map(s=>s.uniqueCardsOwned), 0.5)} / ${sim.PERMA_POOL.length}`);
console.log(`Legendaries:          ${pct(endStates.map(s=>s.legendariesOwned), 0.5)}`);
console.log(`Plot upgrades:        ${pct(endStates.map(s=>s.upgradesOwned), 0.5)}`);
console.log(`Avg picks per day:    ${pct(endStates.map(s=>s.avgPicksPerDay), 0.5).toFixed(1)}`);

// ============ SUMMARY OF FINDINGS ============
console.log('\n=== 6. AUDIT SUMMARY ===');
const issues = [];
if (gap > 200) issues.push(`Skill gap >200% — punishes casual players`);
else if (gap < 30) issues.push(`Skill gap <30% — strategy doesn't matter`);
if (greedyVsNovice < 0) issues.push(`Greedy heuristic is mis-valued (loses to random play)`);
if (topStuck.length > 0) issues.push(`Concentrated stuck days (${topStuck.length} days): ${topStuck.map(([d]) => 'd' + d).join(', ')}`);
const plot5Reach = greedyRuns.filter(r => r.milestones.plot5_unlocked !== undefined).length;
if (plot5Reach < RUNS * 0.9) issues.push(`Plot 5 not reliably reached (${plot5Reach}/${RUNS} runs) — mid-game gate too aggressive`);
const plot7Reach = greedyRuns.filter(r => r.milestones.plot7_unlocked !== undefined).length;
if (plot7Reach < RUNS * 0.1) issues.push(`Plot 7 effectively never reached (${plot7Reach}/${RUNS}) — late-game out of reach in ${DAYS} days`);

if (issues.length === 0) console.log('✓ No major balance flags detected. Run with more samples or look at boon-stats.');
else {
  console.log(`Found ${issues.length} potential issue${issues.length === 1 ? '' : 's'}:`);
  for (const issue of issues) console.log(`  ⚠ ${issue}`);
}
console.log('\nFor per-boon analytics: node sim/balance-sim.js 50000 --boon-stats');
console.log('For pack drop verification: node sim/pack-validator.js 100000\n');

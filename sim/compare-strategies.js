// Hearth & Harvest strategy comparison
// Runs the same N seeds across all AI strategies (greedy, conservative, novice, cropFocused)
// and reports side-by-side progression. Surfaces how much each strategy actually matters
// — which is the difference between balance "designed for the optimizer" and "designed for everyone".
//
// Usage: node sim/compare-strategies.js [runs=20] [days=30]

const sim = require('./progression-sim.js');

const RUNS = parseInt(process.argv[2]) || 20;
const DAYS = parseInt(process.argv[3]) || 30;

const STRATEGIES = ['greedy', 'conservative', 'cropFocused', 'novice'];

console.log(`\nHearth & Harvest — strategy comparison`);
console.log(`Runs per strategy: ${RUNS}, simulated days: ${DAYS}`);
console.log(`Note: each strategy gets fresh seeds — comparison is statistical, not paired.\n`);

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Run all strategies
const results = {};
for (const stratName of STRATEGIES) {
  const strategy = sim.STRATEGIES[stratName];
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    runs.push(sim.runSim(DAYS, { pickStrategy: strategy }));
  }
  const ends = runs.map(r => sim.snapshotState(r.state));
  results[stratName] = {
    money: median(ends.map(s => s.money)),
    plots: median(ends.map(s => s.unlockedPlots)),
    harvests: median(ends.map(s => s.totalHarvests)),
    packs: median(ends.map(s => s.packsOpened)),
    legendaries: median(ends.map(s => s.legendariesOwned)),
    mythics: median(ends.map(s => s.mythicsOwned)),
    cards: median(ends.map(s => s.uniqueCardsOwned)),
    picks: median(ends.map(s => s.totalPicksTaken)),
    upgrades: median(ends.map(s => s.upgradesOwned)),
    moneyMean: Math.floor(mean(ends.map(s => s.money))),
    moneyP10: [...ends.map(s => s.money)].sort((a,b)=>a-b)[Math.floor(ends.length * 0.10)],
    moneyP90: [...ends.map(s => s.money)].sort((a,b)=>a-b)[Math.floor(ends.length * 0.90)],
    // Track first plot7+ unlock (proxy for late game depth)
    plot6Unlocked: runs.filter(r => r.milestones.plot6_unlocked !== undefined).length,
    plot7Unlocked: runs.filter(r => r.milestones.plot7_unlocked !== undefined).length,
    plot8Unlocked: runs.filter(r => r.milestones.plot8_unlocked !== undefined).length,
    // Median time to plot 5 (mid-game gate)
    plot5Days: (() => {
      const ts = runs.map(r => r.milestones.plot5_unlocked).filter(Boolean);
      if (ts.length === 0) return null;
      return (median(ts) / 86400).toFixed(1);
    })(),
  };
}

// Print side-by-side comparison
function pad(s, n) { return String(s).padEnd(n); }
function rpad(s, n) { return String(s).padStart(n); }

const header = 'Metric'.padEnd(28);
const cols = STRATEGIES.map(s => s.padStart(13)).join('');
console.log('\n=== END-OF-RUN MEDIANS (day ' + DAYS + ') ===');
console.log(header + cols);
console.log('-'.repeat(header.length + cols.length));

const rows = [
  ['Money', s => '$' + s.money],
  ['Money (mean)', s => '$' + s.moneyMean],
  ['Money (10th–90th pct)', s => `$${s.moneyP10}–${s.moneyP90}`],
  ['Plots unlocked / 8', s => s.plots],
  ['Total harvests', s => s.harvests],
  ['Packs opened', s => s.packs],
  ['Unique cards owned', s => s.cards],
  ['Legendaries owned', s => s.legendaries],
  ['Mythics owned', s => s.mythics],
  ['Total boon picks', s => s.picks],
  ['Plot upgrades owned', s => s.upgrades],
  ['', () => ''],
  ['Days to plot 5 (median)', s => s.plot5Days || '—'],
  [`Runs reaching plot 6 (/${RUNS})`, s => s.plot6Unlocked],
  [`Runs reaching plot 7 (/${RUNS})`, s => s.plot7Unlocked],
  [`Runs reaching plot 8 (/${RUNS})`, s => s.plot8Unlocked],
];

for (const [label, fn] of rows) {
  if (label === '') { console.log(''); continue; }
  const cells = STRATEGIES.map(stratName => rpad(fn(results[stratName]), 13)).join('');
  console.log(label.padEnd(28) + cells);
}

// Summary insights
console.log('\n=== INSIGHTS ===');
const greedy = results.greedy;
const novice = results.novice;
const moneyGap = ((greedy.money / Math.max(1, novice.money) - 1) * 100).toFixed(0);
console.log(`Greedy player ends ~${moneyGap}% richer than a random-pick novice.`);
const harvestGap = ((greedy.harvests / Math.max(1, novice.harvests) - 1) * 100).toFixed(0);
console.log(`Greedy player gets ~${harvestGap}% more harvests in the same time.`);

const conservative = results.conservative;
const consGap = ((conservative.money / greedy.money - 1) * 100).toFixed(0);
const consSign = consGap >= 0 ? '+' : '';
console.log(`Conservative (risk-averse) ends ${consSign}${consGap}% vs greedy — variance penalty cost.`);

const cropFocused = results.cropFocused;
const cfGap = ((cropFocused.money / greedy.money - 1) * 100).toFixed(0);
const cfSign = cfGap >= 0 ? '+' : '';
console.log(`Crop-focused (favors crop-specific) ends ${cfSign}${cfGap}% vs greedy.`);

if (parseFloat(moneyGap) > 200) {
  console.log(`⚠ Wide gap (>200%) — game heavily rewards optimization. May feel punishing for casual.`);
}
if (parseFloat(moneyGap) < 30) {
  console.log(`⚠ Narrow gap (<30%) — strategy barely matters. May feel like skill doesn't reward.`);
}
if (results.novice.plots < 4 && results.greedy.plots >= 5) {
  console.log(`⚠ Novice players may stall before plot 5 — worth checking onboarding/early balance.`);
}
console.log('');

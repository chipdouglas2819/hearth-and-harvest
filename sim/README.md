# Hearth & Harvest simulators

Three sims you can run from this folder. All require Node.js, no install needed.

## `progression-sim.js` — full-economy progression sim

Simulates many in-game days at 1× speed, modelling the entire gameplay loop: planting, harvesting, picking boons, opening packs, equipping cards, buying plots, buying upgrades, completing contracts.

### Run it
```bash
node sim/progression-sim.js                              # 5 runs × 60 days, greedy AI
node sim/progression-sim.js --runs=20 --days=90          # bigger sample
node sim/progression-sim.js --strategy=conservative      # different AI
node sim/progression-sim.js --strategy=novice --runs=10  # random-pick (floor)
node sim/progression-sim.js --csv=out.csv --days=30      # export day-by-day to CSV
```

### Strategies
- `greedy` (default) — picks the boon with the highest expected yield multiplier
- `conservative` — risk-averse; discounts gambles and committal boons
- `novice` — random pick (establishes the floor)
- `cropFocused` — prefers crop-specific cards when offered

### What it tells you
- Time-to-milestone: when does a player unlock plot N? Their first legendary? A full loadout?
- Mid-game state: where is the median player at days 1, 7, 14, 30, 60?
- End-state: total harvests, packs opened, mastery hours, upgrades owned, etc.
- Per-day boon picks (fatigue analysis)

---

## `compare-strategies.js` — strategy side-by-side

Runs N runs of each strategy on fresh seeds and reports a side-by-side comparison.

### Run it
```bash
node sim/compare-strategies.js                # 20 runs × 30 days, all 4 strategies
node sim/compare-strategies.js 50 60          # heavier sample, longer runs
```

### What it tells you
- How much skill matters: the gap between greedy and novice
- Whether risk-aversion costs more than it saves
- Whether crop-focus is a viable strategy
- Auto-flags suspicious patterns (>200% gap = punishing for casual; <30% gap = skill doesn't matter)

---

## `pack-validator.js` — drop-rate verification

Sims many packs and verifies observed rarity rates match configured weights. Fails loudly if a future tweak silently changes drop math.

### Run it
```bash
node sim/pack-validator.js                    # 10,000 packs (default)
node sim/pack-validator.js 100000             # heavier sample
```

### What it tells you
- Per-rarity observed % vs expected % (with absolute drift verdict)
- First-slot general-card guarantee holding (should be 100%)
- General vs crop-specific pack composition
- In-run boon draft rarity distribution

---

## `balance-sim.js` — per-crop Monte Carlo

Pre-existing tool: runs 20,000 simulated runs per crop with greedy boon picks, surfaces median/mean/p95/p99/max yield. Useful when tuning specific boons.

### Run it
```bash
node sim/balance-sim.js                       # current values
node sim/balance-sim.js --proposed            # proposed rebalance values
node sim/balance-sim.js random                # random-strategy floor
```

---

## Workflow tips

- **After balance changes**: run `compare-strategies.js` to see if the change widened or closed the skill gap.
- **After loot tuning**: run `pack-validator.js` to verify drops still match config.
- **For visual analysis**: `progression-sim.js --csv=out.csv` then graph the CSV in a spreadsheet.
- **Spotting design issues**: if `compare-strategies.js` shows novice players never reaching plot 5, the early game is too punishing.

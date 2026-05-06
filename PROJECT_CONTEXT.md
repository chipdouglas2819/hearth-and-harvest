# Hearth & Harvest — Project Context

A cozy mobile farming-sim with roguelike-flavored progression. This document captures the design decisions, current state, and known issues so anyone (you, me later, Claude Code, another LLM) can pick up where we left off without re-reading the entire conversation.

---

## Game Concept (one paragraph)

A cozy farming game where each crop's growth cycle is its own mini-roguelike "run" — you draft 2-6 boons during the grow time, harvest, and start fresh. Multiple plots run in parallel, each on its own crop's timer. There's no failure state — engagement is rewarded, never punished. On top of the per-run roguelike layer sits a meta-progression layer (booster packs of permanent buffs earned every 10 harvests) and a "loadout" layer (each plot has 4 perma-buff slots that customize it for one specialized crop long-term).

---

## Core Design Principles (locked in)

1. **Cozy, never punishing.** No fail states, no resource pressure. Crops just grow.
2. **Decisions matter, but ride lightly.** Boons offer real strategic choice (synergy, tradeoff, gamble, commit) but the wrong pick never feels catastrophic.
3. **Per-crop runs.** Each plot's growing crop is its own roguelike run. Buffs apply only to that crop's harvest, then dissolve. No power creep within the run layer.
4. **Real-time growth, time-acceleration for testing only.** 4h-40h crop times in production. Speed buttons (1×/60×/600×) exist for prototype testing.
5. **Monetization is optional, never gates content.** Ads/IAP touch only the permanent layer. The free game is complete.

---

## Layer Architecture

```
┌─ META LAYER ─────────────────────────────────────────────────┐
│  • Booster packs (3 perma-cards each, every 10 harvests)     │
│  • Per-plot loadouts (4 slots each, mix of general+specific) │
│  • Mastery counters per crop (5/20 milestones unlock crop-   │
│    specific in-run buffs)                                    │
│  • Watch-Ad-for-Bonus-Card (rewarded video, gated to packs)  │
│  • Monetization model: TBD pending broader meta-game design  │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─ RUN LAYER (per crop, per plot, parallel) ───────────────────┐
│  • Plant a crop (cost), grow over real time                  │
│  • Picks unlock at i/(N+1) progress points                   │
│  • Each pick: choose 1 of 3 boons (sometimes 5, sometimes    │
│    legendary-floor, depending on prior boons taken)          │
│  • Tap to grow (limited taps × % time reduction)             │
│  • Harvest → coins + mastery + pack progress                 │
│  • All in-run buffs dissolve after harvest                   │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─ PHYSICAL LAYER ─────────────────────────────────────────────┐
│  • Plots (purchase with coins, scaling cost)                 │
│  • Speed control (1×/60×/600×) — testing only                │
│  • Coins as currency                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Numbers

### Crops
| Crop | Grow Time | Plant Cost | Base Yield | Picks |
|------|-----------|------------|------------|-------|
| Radish | 4h | 20 | 60 | 2 |
| Carrot | 8h | 35 | 130 | 3 |
| Tomato | 12h | 60 | 240 | 3 |
| Wheat | 24h | 150 | 800 | 5 |
| Corn | 30h | 250 | 1500 | 5 |
| Pumpkin | 40h | 350 | 2200 | 6 |

### Plot Costs
0, 250, 700, 1700, 4000, 9000, 19000, 40000

### Rarities
| Rarity | In-Run Weight | Perma Weight |
|--------|---------------|--------------|
| Common | 60 | 50 |
| Uncommon | 28 | 30 |
| Rare | 9.5 | 15 |
| Legendary | 2.2 | 4 |
| Mythic | 0.3 | 1 |

### Tap Mechanic
- Base: 15 taps per planting (extended by `+taps` perma-buffs)
- Effect: time reduction scales with speed — `min(0.12, 0.02 * (1 + log10(speed) * 1.8))`
  - 1× → 2% per tap
  - 60× → ~5.6% per tap
  - 600× → ~11% per tap
- 200ms cooldown between taps

### Pack Cadence
1 free pack every 10 harvests. Each pack = 3 perma-buffs. Watch ad in pack reveal → +1 bonus card (uncommon-or-higher floor).

### Starting State
$25 coin (exactly enough for 1 radish), 1 plot unlocked, all others purchasable.

---

## Buff Taxonomy (in-run)

The pool has ~40 buffs across these archetypes — design intent is that each pick should feel like a real choice, not "biggest number wins":

- **Stat** — straight % bonuses. The baseline.
- **Tradeoff** — bigger number with a cost (more time, less next planting, etc.).
- **Synergy** — scales with what else you've taken (e.g. "+5% per common buff").
- **Cascade** — applies/triggers other buffs (Echo doubles next, Twofold rolls a free common, Cornucopia widens your next draft).
- **Gamble** — RNG on payout (50% ×1.7 / 50% nothing).
- **Commit** — high power if you stop taking buffs.
- **Cross-plot** — affects other active plots.
- **Skill** — rewards player action (harvest within window, ferment past ripe).
- **Meta** — modifies other buffs (Garden Sage doubles existing yield buffs, Reroll undoes last pick).

5 rarity tiers + crop-specific in-run buffs unlocked at mastery 5/20.

## Buff Taxonomy (permanent)

40+ perma-buffs in two flavors:
- **General** (17): apply on any crop. Magnitudes 3-30% (commons +3-5%, mythic +28-30%).
- **Crop-specific** (24): 4 per crop × 6 crops, each set has common/uncommon/rare/legendary. Stronger than general at same rarity (legendary crop = +28% vs legendary general = +15%) but only activate when matching crop is planted on the plot.

This makes the late-game grail "build a fully-specialized 4-card loadout per plot" — but mixed loadouts remain viable.

---

## Files

- `farm-prototype.html` — v1, basic loop
- `farm-prototype-v2.html` — archetypes, mythic tier, second crop wave, visual scaling
- `farm-prototype-v3.html` — tap-to-grow, redesigned cascades
- `farm-prototype-v4.html` — booster pack system, GLOBAL 4-slot perma-buffs (deprecated approach)
- `farm-prototype-v5.html` — pivot to PER-PLOT loadouts, 24 crop-specific perma cards, ad gated to pack opening
- `farm-prototype-v6.html` — **current** — major bug fixes, partial-render refactor, $25 starting balance, removed Premium Pack

---

## Code Architecture (v6)

Single-file HTML, ~2500 lines. Structure:

```
<style>           ~700 lines — CSS, design tokens, components
<body>            HTML scaffold — topbar, plots-grid, sidebar, modals
<script>          ~1700 lines — vanilla JS, no framework
  CONFIG          CROPS, BUFF_POOL, PERMA_POOL, RARITY_WEIGHTS, etc.
  STATE           single state object, plots array, loadouts array
  UTILITY         fmt helpers, picksUnlocked, picksAvailable, isReady
  PERMA EFFECTS   getPermaYieldMultForPlot, etc. — per-plot, filters by cropOnly
  DRAFTING        getAvailableBuffs, draftN (in-run), draftPermaPack (perma)
  ACTIONS         plant, tapCrop, harvest, applyBuff, handleCustom (big switch)
  COLLECTION      addToCollection, equipToPlot, unequipFromPlot
  MODALS          openPlantModal, openBuffModal, openPackModal, etc.
  PACK FLOW       renderPackCards, renderPackActions, watchAdForBonus
  LOADOUT MODAL   openLoadoutModal, renderLoadoutModal
  RENDER          render() — full rebuild for state transitions
  TICK            updatePlotTick() + tick() — partial DOM updates for time progression only
```

### Key architectural decision in v6
**`render()` rebuilds the entire plots grid via `innerHTML`. `tick()` does NOT call `render()` for normal time progression — it directly updates `.progress-fill` width and `.plot-info` text via `updatePlotTick(plot)`.** Full `render()` is only called on:
- Plant, harvest, tap-exhaustion (state transitions)
- Pick becoming available (structural change in tick)
- Plot becoming ready (structural change in tick)
- Buff applied, perma equipped/unequipped, plot bought
- Modal closes

This was the fix for the silent click loss bug — previously, render rebuilt buttons every animation frame at 600× speed, and clicks would be lost when the button was replaced between mousedown and mouseup.

---

## Known Issues / Things Held Back

### Implemented but minor
- Tap counter at 600× speed updates via direct DOM manipulation (not render) — verified working
- Tap animation requires partial-render to play visibly (verified)

### Deferred (deliberate)
- **Set completion tracking** ("Radish Set: 2/4 collected") — easy to add, would help collector dopamine
- **Duplicate merging** (Hearthstone-dust style) — turns dupes from waste into progress
- **The meta-layer** for varying daily decisions: market price fluctuations, contracts, festivals, seasonal events. This is the missing piece that would keep "what to plant today?" interesting once loadouts stabilize.
- **Sound design** — should be cozy: leaves rustling, soft chimes on harvest, no aggressive audio
- **Save/load** — currently no persistence between page loads
- **Mobile gesture polish** — taps work but haven't been tested on actual mobile device

### Open questions for future iteration
- **Monetization model** — TBD. Likely candidates: battle-pass-style permanent unlocks ($4.99 one-time), ad-free purchase ($9.99), seasonal subscription. Whatever it is, it must:
  - Never gate content
  - Never affect core gameplay balance
  - Touch only the permanent/cosmetic layer
- **Tap mechanic at scale** — does +11% per tap at 600× speed feel too cheaty? Might want to tone down or remove tap-at-high-speed entirely (only enable at 1×/60×).
- **Boon balance** — Cascade of Gold and Long Wait have been re-tuned but high-level stacking interactions haven't been deeply playtested
- **Plot count** — 6 plots may be too many for casual players. Consider gating later plots behind achievements not just coin.
- **Crop variety** — 6 crops feels right but specific timings might need adjustment based on real player retention data

---

## How I'd Approach Picking This Up

If you're me-in-the-future or another LLM:

1. **Read v6 first** — it's the current state. Don't read older versions unless you specifically want to see how a system evolved.
2. **Don't full-rewrite the file.** It's 2500 lines now. Use targeted `str_replace` patches for any bug fix or feature add. Full rewrites are slow and error-prone.
3. **Test mentally for click safety on any new interactive element.** The boon-button bug (clicks lost between mousedown and mouseup when render rebuilds DOM) is a footgun — anything that needs to be clicked during a `tick()` cycle should either be in `.plot-actions` (z-index 10) or its parent should not be rebuilt by tick.
4. **The big upcoming feature is the meta-layer** (market prices, contracts, etc.). Until that exists, optimal play converges fast once loadouts stabilize. That's the variable layer that should keep the game interesting.
5. **The user is a non-technical game designer.** Focus on feel, mechanics, decisions. Don't dive into code-architecture talk unless asked.

---

## How I'd Approach Moving to Claude Code

Open Claude Code in a directory containing `farm-prototype-v6.html` and `PROJECT_CONTEXT.md` (this file). Tell Claude Code:

> "Read PROJECT_CONTEXT.md and farm-prototype-v6.html. We're iterating on a cozy farming-sim roguelike. I'd like you to [next change]."

Claude Code can edit files directly without the round-trip overhead of full rewrites. It's better suited for this stage of the project.

---

## Conversation History (high-level chronology)

The full transcript spans 6 versions across many conversation turns. Major design discoveries in order:

1. Initial pitch: "Farming Sim mobile game, but it's an endless roguelike. Ads to skip time."
2. **Multiple parallel runs** — one per plot, each on its own crop's timeline (key insight)
3. **Per-crop buffs that dissolve after harvest** — solves the power-creep problem (user's idea)
4. **Buff archetypes beyond stat-sticks** — synergy, tradeoff, cascade, etc. — to make picks meaningful
5. **Tap-to-grow** — adds an active engagement layer
6. **Booster pack meta-progression** — every 10 harvests, optional ads, mock IAP placeholder
7. **Per-plot loadouts** (v5 pivot) — each plot is its own optimization puzzle, crop-specific cards strongest when matched
8. **Bug fixes & monetization rethink** (v6) — partial-render refactor, $25 start, removed bad $0.99/pack

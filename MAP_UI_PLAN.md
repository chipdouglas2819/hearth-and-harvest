# Hearth & Harvest — The Farm Map: build-ready plan

> From a design workflow (5 analyses → synthesis → adversarial critique), grounded in
> `farm-prototype-v6.html`. This is the critique's corrected FINAL PLAN. 2026-05-13.

## The vision
Open the app and land on **your yard**: one small fenced garden, whole thing visible, no scrolling.
**The plant IS the progress bar** (4 glance stages: soil → sprout → leafy → ripe-and-bobbing). A flat
day/night tint from your real clock makes the place feel like it kept living while you were away.
Cards/Contracts/Journal become **objects you walk up to**, not tabs. Target feeling: *"Oh — there's my place."*
Borrowed feel (never art): Stardew's small knowable plot, Animal Crossing's real-time light, Hay Day's
tap-the-crop-where-it-grows. The through-line: **act on the world where it lives, not on a menu of it.**

## The world legend (corrected for phone fit — 4 outdoor objects, not 6)
The yard is one fixed scene; 6–8 plots in the center; doors around the edge:

| Today | Becomes | Face shows (glance) | Tap opens |
|---|---|---|---|
| Farm grid | **The yard ground** (home) | plots as beds in soil | — |
| Daily Market | **Stall** | **featured crop emoji + ▲/▼ on its face** | sheet: full prices + why |
| Contracts | **Noticeboard** | papers; flutter when claimable | contracts sheet |
| Cards + Journal | **Cottage** (one object) | shelf-fill; ribbon when new keepsake | collection sheet, journal as a section-tab inside |
| Pack pending | **Mailbox** | flag UP + glow when a pack waits, else `X/10` | `openPackModal` directly |
| Stats/Achievements/Mastery | sections **inside** the cottage sheet | — | sheet sections (no buildings) |
| Loadout / Plant | **tap a bed** | — | `openLoadoutModal(i)` / `openPlantModal(i)` |
| Boon draft | **stays the Boon FAB** | follows you everywhere | `openBuffModal` |
| Tend / breathing | **stays the Tend FAB** | — | breathe modals |
| Harmony | **stays HUD glyph** + drives yard tint | leaf glyph | `openHarmonySheet` |
| Settings | **corner gear** (not a building) | — | settings |

Bottom bar shrinks to **🏡 Home + ⚙️ Settings**. Badges retarget from tab-pips to objects via a new
`refreshBuildingBadges()` (call it where pack/contract timers change, not only inside `render()`).

**Restraint is the design:** buildings are fixed, non-movable, non-upgradeable doors to *existing* flows.
**No new nouns, no placement, no upgrade trees.** That's what keeps it cozy, not a city-builder.

## Phone interaction — fixed single screen, no scroll/camera
- `.plots-grid` → `repeat(3,1fr)`, beds `aspect-ratio:1`, drop `min-height:360px` → ~110px square beds at
  390px. The whole bed is the tap target (clears 44px easily). Locked plots 7–8 = dim buyable tiles.
- **Three states, three verbs (no mode-switch):**
  1. **Empty bed → tap PLANTS** (`openPlantModal(i)`).
  2. **Growing bed → tap PEEKS** — bottom sheet (~40%) with rich detail (crop+live countdown, ×yield+why,
     3 loadout slots, buff chips, Choose Boon). Yard stays visible; the sheet **ticks its own countdown in
     place while open** so it isn't frozen.
  3. **Ready bed → tap HARVESTS directly** (`harvest(i, ev)`) — no sheet, no confirm; coins fly from the plant.
- Picks stay primarily on the Boon FAB (aggregates, follows you — the no-aim fallback when several ripen).
- **Glance vs tap (so the map REMOVES taps, not adds them):** bed always shows crop-visual (4 stages),
  ripe glow+bob, a **small `×3.4` yield chip**, ⭐ pip (boon waiting), 📜 pip (fills a contract), tiny time
  chip. Everything richer is one tap. **The yield chip is non-negotiable** — glow alone is too coarse.
- **Ready grabs the eye gently** (all CSS, 50-BPM calm): lift, warm gold glow, slow ~2s bob, chip→`✓ ready`,
  one-time sparkle; the Farm badge lights so you know to come home. No red, no alarm, no sound-yell.

## Phased HTML build (the one rule: tappable things are built once & updated in place — never innerHTML by a tick)

**Phase 0 — Kill the tap-loss gotcha. ~½–1 day. Invisible, highest leverage.**
Today a full `render()` fires the instant a crop ripens *or a pick lands* (line 9544) — at 600× that's
constant, and it rebuilds the grid mid-tap. Write `restyleReadyPlots()` (~50 lines): toggle
`.ready`/`.exhausted`, show/hide the **Harvest AND Choose-Boon buttons**, update the "next boon in Xm" line
and time chip — **in place, no innerHTML**. Point `tick()`'s structural branch at it. Full `render()` now
fires only on user actions. Test a *pick* threshold crossing at 600×, not just a ripen.

**Phase 1 — Lay the yard. ~½ day. Mostly CSS.** Wrap `#plotsGrid` in `.farm-ground` (warm soil gradient,
fence, faint ~15° tilt); 3-column square beds. Half-answers "it's all menus" on day one.

**Phase 2 — Plant-as-progress + stable beds + tap-to-peek. ~3 days (real work here).**
First **extract** `render()`'s per-plot detail block (9333–9396) into `buildPeekSheet(i)` (doesn't exist
today). `buildFarmScene()` creates stable `.bed` divs once into `bedEls[]`; one delegated tap handler on the
never-rebuilt container routes by current state; `refreshTile(id)` updates in place (no innerHTML); peek sheet
gets its own in-place countdown. Remove the progress bar. Test at 600×.

**Phase 3 — Buildings. ~2 days. Additive.** Stable `.building` divs (stall, mailbox, noticeboard, cottage)
open existing flows via sheets. `refreshBuildingBadges()`. Shrink tab bar to Home+Settings.

**Phase 4 — Signs of life. ~½–1 day. CSS only, trimmed.** Day/night tint (real clock), harmony bloom as ONE
static green-shift class, ripe-crop bob. **CUT from HTML:** wandering critter, animated butterflies, parallax —
they prove nothing about layout/IA and risk jank. Godot delights.

## Godot split
**Transfers (the deliverable):** state shape (`state.plots[]` → a Plot resource), the tap vocabulary, the IA
rulings (glance/tap/modal triage, yield-chip-on-bed, harmony-as-picture, 3-verb tap), tuned constants
(PLOT_COSTS, growth times, stage thresholds → frame breakpoints), the render/tick discipline.
**Throwaway:** all CSS, innerHTML, the `.plot` card, emoji-as-art, keyframes, the tab system. In Godot the
gotcha vanishes for free (becoming-ready = mutating stable nodes).

## The 3 conditions (write into the spec)
1. **Yield number + market best-price stay readable on the yard without tapping** (a chip on the plant, a
   price arrow on the stall) — else the map quietly *adds* taps and recreates the menu feeling.
2. **Buildings collapse to four** so 8 plots fit a phone without scrolling.
3. **First step is the invisible plumbing fix** (Phase 0), scoped honestly (~50 lines, handle the pick path
   too) — not the pretty part.

## Verdict & first step
Build it, earn it in order, against the gate: it must **reduce** taps per session (keep yield+market on the
face), answer "what needs me / best yield / fills a contract" at a glance, and adopt the stable-container
discipline. **Start with Phase 0 + Phase 1 (~1–1.5 days, almost all CSS + one ~50-line function).** After it,
the player opens the app to their whole little yard, beds in the soil, taps landing reliably even at test
speed — "a beautiful collection of menus" becomes "there's my place," with Phases 2–4 as additive steps.

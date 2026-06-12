# The Yard — Definitive Map Build Plan

> **Status:** Build-ready blueprint. Supersedes MAP_UI_PLAN.md (folds in its critique fixes,
> updates every anchor to the current build — commit `62f862f` — and locks all open design
> calls). The next session executes this with ultracode orchestration. **No code in this doc
> is written yet.**
>
> **Anchor note:** line numbers below are as-of `62f862f` and will drift — the build must
> locate by function/selector name, lines are hints only.

---

## 0. North star

Open the app and land on **your yard**: one small fenced garden, all of it visible at once,
no scrolling. The light is morning-gold because it's morning where you are. Your cress has
filled in since last night — you can see it's taller. One bed glows: ready. You tap the plant
itself and coins fly. The market stall on the lane shows carrots are fetching a premium today.
The mailbox flag is up.

**The feeling: "Oh — there's my place."** Not "I opened the farming app."

The cozy-feel pillars this build must hit (what Stardew / Animal Crossing / Hay Day actually do):

1. **Ground, not interface.** Things sit on soil and grass, not in white cards.
2. **The world has light.** Time of day visibly changes the place (and it changed while you were away).
3. **Things live somewhere.** The market is a stall on the lane; the mail is a mailbox; your collection is in the cottage.
4. **The plant is the status.** You read the farm like a gardener (shape, color, glow), not a dashboard. Numbers exist but whisper.
5. **Soft attention.** The ripe thing is the *prettiest* thing on screen — nothing pulses red or yells.
6. **Touch the world.** Tap the plant to harvest (already shipped), tap the soil to plant, tap the stall to browse.
7. **No new mechanics.** The map re-homes what exists. Zero new nouns, no placement, no upgrades, no critters-in-HTML.

## 1. What already shipped that this build stands on (verified in code)

- **Tap-the-crop harvest** (`.crop-visual-wrap.ready-tap` + onclick) and **harvest juice** (burst, coin-fly, money bounce, pluck, haptic) — the map's "ready → tap the plant" verb is live and loved already.
- **Living growth**: smooth continuous scale in `updatePlotTick`, gentle desynced sway, seedling→crop swap mid-tick. The plant-as-progress-bar is half-built.
- **Cress** (4-min crop) — the first session has a loop for the yard to show off.
- **`openGardenSheet({icon,title,body})`** — the proven stable-overlay primitive; the building sheets reuse it (pattern, not necessarily the same node).
- **Patient contracts** — no countdowns to live-tick anymore; the noticeboard is simpler than the old plan assumed.
- **Pack reveal + earn-toast** — the mailbox's payoff moment already exists (`openPackModal`).
- **Harmony cue + calm tint hooks** (`#harmonyCue`, `body.calm-state`) — the template for "picture, not number," and the hook the yard's harmony visuals extend.
- **FAB pattern** (`renderBoonFab`/`renderTendFab`, stable nodes updated in place) — the architectural proof that in-place updates survive ticks.

## 2. The screen (portrait phone, wireframe in words)

```
┌─────────────────────────────────────┐
│ Hearth & Harvest        🌿  ◉ 1,240 │ TOPBAR — unchanged (brand · harmony · coins)
├─────────────────────────────────────┤
│ ~~~~~~~~ SKY BAND (~64px) ~~~~~~~~~ │ gradient keyed to real local hour; sun/moon dot;
│        ☀  (drifts by hour)          │ faint stars at night. Pure CSS, zero animation.
├──────── garden lane ────────────────┤
│  [🧺 stall] [📋 board] [📬 mail] [🏡] │ FOUR objects on a path — signs standing on the
│   🥕▲ +40%   2 pinned    flag UP     │ lane (vertical jitter so it reads as a place,
├─────────────────────────────────────┤ not a second tab bar). Faces show headlines.
│   ╭────╮   ╭────╮   ╭────╮          │
│   │ 🌿 │   │🥕 ✦│   │ ╋  │          │ THE BEDS — 3-col grid of square soil patches.
│   ╰────╯   ╰─⭐──╯   ╰────╯          │ Crop stands IN the soil; sway + smooth growth
│    12m      ×2.4      tap to        │ already live. Chips whisper: time (below),
│   ╭────╮   ╭────╮   ╭┄┄┄┄╮          │ yield ×N (corner), ⭐ boon pip, 📜 contract pip.
│   │ 🍅 │   │ 🌾📜│   ┊◉800┊          │ Ready = gold glow + lift + slow bob + "✓".
│   ╰────╯   ╰────╯   ╰┄┄┄┄╯          │ Locked = grassy patch w/ small price tag.
│    2h ✓!    6h                      │
│                      ╭─────────╮    │
│          ╭────────╮  │🌟 Boons 2│    │ FABs — unchanged, stable, float above all.
│          │🌿 Tend │  ╰─────────╯    │
│          ╰────────╯                 │
├─────────────────────────────────────┤
│      🏡 Home          ⚙️ Settings    │ ANCHOR BAR — was 5 tabs (Phase 3)
└─────────────────────────────────────┘
```

**Locked layout decisions (with reasons):**

- **Fixed single screen. No pan, no zoom, no camera.** 6–8 beds is glanceable; scrolling breaks cozy and re-imports layout churn into tick-touched surfaces.
- **NO 3D/perspective transform.** The old plan's "~15° tilt" is rejected: CSS `perspective` on a container with interactive children risks tap-offset bugs and text blur on mobile. Depth comes from layering (sky → lane → beds), soft shadows, and bed shaping. Flat-but-warm, like Hay Day's menus.
- **Buildings are a "garden lane" ROW, not scattered absolutes.** Keeps DOM/tab order, responsive flow, and a11y sane on a 360px phone. De-tab-ified by styling: sign-shaped chips, slight per-item vertical offset (±4px), varied widths, standing on a path texture. 4 objects only (stall, noticeboard, mailbox, cottage) per the phone-fit math — Cards+Journal share the cottage.
- **Beds**: `grid-template-columns: repeat(3, 1fr)`, `aspect-ratio: 1`, drop `min-height: 360px` (current `.plots-grid` at CSS ~556, `.plot` ~563). ~110px square at 390px wide; whole bed is the tap target (≥44px floor cleared everywhere down to 320px).
- **Only unlocked beds + the single next-to-buy** render (existing `firstLockedIdx` rule carries over). 1-bed start = the yard frames small and grows; 8 beds = 3 rows, fits.

## 3. Visual language (CSS recipes — no art assets; Godot gets the real art)

**The yard container** `#farmYard` wraps the existing `#plotsGrid` plus new `#skyBand` and `#gardenLane`:

- **Sky** `#skyBand`: hour-bucketed gradient via `data-daypart` on `#farmYard` —
  `dawn` (5–8h: blush→pale gold) · `day` (8–16h: soft blue→cream) · `golden` (16–19h: amber→peach) ·
  `dusk` (19–21h: mauve→slate) · `night` (21–5h: deep indigo, faint star dots via two
  `radial-gradient` background layers, a moon dot). Sun/moon = one absolutely-positioned soft-glow
  dot, `left`% mapped from the hour. Updated by a 1-minute interval (piggyback the existing
  `applyTheme` minute timer area, ~8421). **Zero animation. Pure class/attribute swap.**
- **Ground**: layered backgrounds on `#farmYard` — sage-to-warm-earth vertical wash, 2–3 large
  low-opacity radial gradients as dappled light, slight darkening toward the bottom edge.
- **Fence**: a thin `repeating-linear-gradient` picket strip between sky and lane.
- **Lane**: a horizontal path band (lighter earth tone) the four signs stand on.
- **Beds** `.plot` restyled as soil: `border-radius: 18px`, warm brown radial soil gradient,
  faint inset shadow, soil-texture dots (low-opacity repeating radial). **Empty** = lighter
  tilled stripes (`repeating-linear-gradient`) + a soft "＋" — tap anywhere to plant. **Locked** =
  grass texture + small price-tag button (kept as a button: land-buying is a big spend and
  deserves an explicit press, not a mis-tap).
- **Day/night + dark theme**: all daypart tints defined as CSS variables overridden under
  `[data-theme="dark"]` so night-in-light-theme and dark-mode both stay readable. **Verify the
  yard in dark mode explicitly** (probe text/chip contrast like the earlier dark-mode audit).
- **Calm state, visible at last**: `body.calm-state #farmYard` → warmer tint + sway duration
  lengthened (calmer garden literally moves slower) + the sky dot gains a soft halo. One rule each.
- **Harmony, visible at last**: `#farmYard[data-harmony="0..3"]` → at 2: a few static flower
  glyphs along the fence line (positioned `::before/::after`, no animation); at 3: slightly
  richer ground green + one more flower cluster. Static class swaps only — "wellness you can
  see" with zero repaint cost.
- **Reduced motion**: all new motion (bob) behind the existing `prefers-reduced-motion` guard.

## 4. The bed — anatomy & the three-verb tap model

A bed shows, at a glance (everything else is one tap away):

| Always visible on the bed | Where |
|---|---|
| Crop visual (smooth growth + sway — already live) | center |
| **Time chip** `12m` / `2h` / `✓ ready` — low-contrast | bottom center |
| **Yield chip** `×2.4` — tiny, corner, whispers | top-right |
| **⭐ pip** when a boon pick is waiting | top-left |
| **📜 pip** when this crop fills an active contract (`isCropWantedByContract`) | bottom-right |
| Ready choreography: gold glow + `translateY(-4px)` lift + slow ~2s bob + one-time ripen sparkle | whole bed |

**Cut from the bed face** (moves into the peek sheet): crop name text, `×N yield` long label,
loadout strip, buff chips, "N/M picked," "next boon in Xm," progress bar (the plant IS the
progress bar — the thin track can remain as a 2px soil-line during Phase 1 and be removed in
Phase 2 once the peek sheet exists).

**The verbs (no mode-switching — the bed's state decides):**

1. **Empty → tap PLANTS.** Whole bed → `openPlantModal(i)`. (Today it's a button; becomes the bed.)
2. **Growing → tap PEEKS.** Whole bed → the peek sheet (§5).
3. **Ready → tap HARVESTS.** Already shipped (`ready-tap` → `harvest(i, ev)`), juice flies from
   the plant. **Never add a confirm.**
4. **Locked → press the price tag** → existing `buyPlot(i)` flow.

Picks stay primarily on the **Boon FAB** (aggregates, follows you everywhere — the no-aim path
when several beds want attention at test speed). The ⭐ pip + peek sheet are discovery paths.

**The glance test (hard acceptance gate):** without tapping anything, a player must be able to
answer — *which bed needs me* (glow/⭐), *which is my best earner* (yield chip), *which crop fills
a contract* (📜). If any answer requires a tap, add a pip — do not ship.

## 5. The peek sheet (growing-bed detail)

A bottom sheet, ~40% height, yard visible and dimmed above; tap-outside or ✕ closes.
**One stable element** `#plotPeekSheet`, registered in `anyModalOpen()` and `closeAllModals()`.

Contents (top→bottom): crop emoji + name + **live countdown** · yield line `×2.40` with the
active **buff chips** (reuse existing chip markup — keep `class="ferment-bonus" data-plotid` so
the existing `updatePlotTick` ferment poke keeps working *inside the sheet for free*) ·
**loadout strip** (tap → `openLoadoutModal(i)`) · **Choose Boon** button when picks > 0
(→ `openBuffModal(i)`) · "next boon in Xm" line when applicable.

- **Live updates while open**: `updatePlotTick(plot)` additionally updates the open sheet when
  `sheet.dataset.plotid == plot.id` (time text; and if the plot just became ready, swap the
  sheet's CTA to a Harvest button → `harvest(i, ev)` + auto-close). No interval needed — the
  rAF tick already visits growing plots.
- **Build-on-open is safe** (a tick never rebuilds it), but the **extraction is the real work**:
  today the sheet's contents live as ~90 inline template lines inside `render()`'s plot loop
  (buff chips at ~9460s, buttons ~9410s). They must be extracted into `buildPeekSheet(i)` used
  by the sheet — **budget for this; it's Phase 2's risk center.**

## 6. The garden lane — four objects, every old tab re-homed

| Object | Face shows (glance, no tap) | Tap opens | Badge retarget |
|---|---|---|---|
| **🧺 Stall** (Daily Market) | featured crop emoji + `▲+40%` (and glut `▼−30%`) painted ON the sign — the *what* without a tap | market sheet: full prices + the why (reparent `#farmMarketStrip` content / `renderFarmMarket` data) | restocked dot at new market day |
| **📋 Noticeboard** (Contracts) | pinned-paper count; flutter class when an offer is claimable | contracts sheet (reparent `#contractContent`; `renderContract()` keeps working — patient contracts have no countdowns now) | existing contracts badge logic |
| **📬 Mailbox** (Packs) | **flag UP + glow** when `pendingPacks > 0` (emoji swap 📬/📪); else quiet `X/10` fill text | `openPackModal()` directly — straight into the reveal ceremony | replaces the Cards tab pack pip |
| **🏡 Cottage** (Cards + Journal) | small ribbon dot when there's a new keepsake / NEW cards | one sheet, sectioned: **Collection** (default) · **Sets** · **Journal** (Garden Remembers + activity + stats + achievements + mastery as internal sections — NOT separate buildings) | cards badge |

- **Settings** stays a ⚙️ corner gear (utility, not a place). **Debug** stays inside Settings.
- **Tab bar → anchor bar**: 🏡 Home + ⚙️ Settings (Phase 3; markup at ~3509, `TAB_ORDER` ~8606).
- **Badges**: new `refreshBuildingBadges()` reads the same flags `renderTabBadges()` (~9038)
  computes. **Must be called where state changes on timers too** (pack earn in `harvest()`,
  `ensureContractOffered()`, market day rotation) — not only inside `render()`.
- **Phase 3a wiring is `switchTab(...)`** (zero-risk: buildings are doors to the existing pages,
  tab bar shrinks). **Phase 3b** (optional polish, separate commit): reparent Cards/Contracts
  content into overlay sheets so the yard stays visible behind. Ship 3a, feel it, then decide 3b.

## 7. Onboarding in a world (first-minute focus)

Preserve the scripted starter verbatim (ripe radish on plot 0 + 1 pending pack, `isFreshStart`
block ~9625). Gate only the *spatial reveal*:

- Before the first harvest (`totalHarvests === 0`): the lane renders **empty path** (no signs);
  the only loud thing is the glowing ready bed. The first tap is unmissable.
- After the first harvest: the lane's four signs fade in (one CSS class), the pack toast fires
  (already shipped) and the mailbox flag is up — the player's eye goes from toast → flag. The
  world *grows into* a place.
- All gates are state-derived (`totalHarvests`, `packsOpened`) → every existing save sees the
  full lane immediately. No migration.

## 8. Architecture — the render/tick discipline (the load-bearing part)

**The one rule:** anything tappable lives in a stable element created once and updated in place —
never re-created by `innerHTML` while a tick can fire.

**Current reality (verified):** `tick()` (~9564) runs per-frame; on `wasReady→isNowReady` OR
`wasPicks→nowPicks` flips it calls **full `render()`** (line ~9590) which `innerHTML`-rebuilds the
entire grid — eating in-flight taps exactly at the moment a crop ripens or a pick lands (constant
at 60×/600× test speeds). `updatePlotTick` (the safe path) already updates progress, time, crop
scale/swap in place.

**Phase 0 — sever tick from render (~50–60 lines, invisible, do FIRST):**
- `restyleReadyPlots()`: for each unlocked crop'd plot's existing card —
  toggle `.ready` on `.plot`; swap `.crop-visual-wrap` → `ready-tap` + bind its harvest onclick;
  **create** the Harvest button (with expected-yield label) into the existing `.plot-actions`
  container if missing / remove when gone; same for the Choose-Boon button + pick badge
  (`wasPicks` flips are HALF the structural trigger — must be covered); hide the "next boon in
  Xm" line when a pick becomes available; update the info line. No `innerHTML` on containers.
- Replace `if (structuralChange) render()` with `if (structuralChange) { restyleReadyPlots();
  renderBoonFab(); renderTabBadges(); }` (all three are in-place updaters).
- Full `render()` still fires on every user action — unchanged.
- **Test gate:** at 600×, while repeatedly tapping one plot's harvest, let another plot cross BOTH
  a ready flip AND a pick threshold — zero lost taps, buttons appear correctly.

**Phase 2 — stable beds:** `buildFarmScene()` creates one `.bed[data-plotid]` per visible plot
ONCE (and on plot-count change); **one delegated tap handler on the never-rebuilt `#plotsGrid`**
routes by *current* `state.plots[id]` (empty→plant, growing→peek, ready→`harvest(id, ev)`) — there
is structurally no tap target left for a rebuild to destroy. `refreshTile(id)` becomes the only
farm updater (`render()`'s plot loop delegates to it; `tick()` calls it via `updatePlotTick`).
`harvest(i, ev)` is index-keyed (verified) — survives any redraw.

**Keep:** the contracts-tab 30s `renderContract()` refresh (~9594) is harmless now (no countdowns).

## 9. Phased build (each phase ships, verifies, commits, pushes — stop after any)

| Phase | What | Effort | Player sees |
|---|---|---|---|
| **0** | Sever tick→render (`restyleReadyPlots`) + 600×/pick-flip test | ~½ day | nothing (taps stop dying at test speed) |
| **1** | The yard: sky band (day-part tints, sun/moon, stars) + ground/fence/lane CSS + beds → 3-col soil squares + chips (time/yield/⭐/📜) + calm & harmony yard visuals + dark-mode pass | ~1 day | **"There's my place"** — the farm becomes a yard with real light |
| **2** | Plant-as-progress completion: extract `buildPeekSheet(i)`, stable beds + delegated handler, tap-to-peek sheet (live countdown, ready-CTA swap), strip card chrome (name/loadout-strip/chips/progress-bar off the face), empty-bed tap-to-plant | ~2–3 days | beds are soil you touch; detail is one gentle tap |
| **3a** | Garden lane: 4 sign-objects (faces per §6) + `refreshBuildingBadges()` + first-minute reveal gating + tab bar → Home/Settings | ~1 day | menus become places |
| **3b** *(opt.)* | Reparent Cards/Contracts into overlay sheets (yard visible behind) | ~1 day | detours feel like visits, not screen swaps |
| **4** | Signs-of-life polish: ripe-bob refine, golden-hour glow pass, stars/moon tune | ~½ day | the yard at 10pm feels like 10pm |

**Explicitly OUT of scope** (cozy-guard): critters/animated butterflies (Godot), canvas, any
camera, equip-flow redesign, one-tap replant, plot-buy ceremony, seasons/adjacency/weather
mechanics, any new mechanic of any kind.

## 10. Acceptance gates (the build fails if any fail)

1. **Tap-count must drop, not move.** Session = harvest 3 · take 2 picks · check best yield ·
   check market · check a contract. Today: 3 taps, 2 modals, 0 (yield on card), 0 (strip), 1 tab-tap.
   With map: identical or better — yield chip and stall face keep the two glance-reads at ZERO taps.
2. **Glance test** (§4) passes with no taps.
3. **600× survival** incl. a pick-threshold flip mid-tap (Phase 0 gate, re-run after Phase 2).
4. **Fresh-start focus**: first minute shows one glowing bed; lane appears after first harvest;
   existing saves see everything (no migration).
5. **Dark mode + night daypart** both readable (probe computed colors like the prior audit).
6. **360px width**: every target ≥44px, no overlap with FABs at 8 beds.
7. **Zero console errors; `prefers-reduced-motion` respected; every state keeps a text label**
   (peek sheet carries the words; pips get `title`/`aria-label` — never color-only).

## 11. Next-turn ultracode orchestration (how to run the build)

Single 9,500-line file ⇒ **parallel agents must not edit it concurrently.** The right shape:

- **Build sequentially in the main loop**, phase by phase: edit → `node` parse check → preview
  runtime test (the phase's gate from §10) → commit → push. Each phase live on GitHub Pages
  before the next starts.
- **Use the Workflow tool for parallel VERIFICATION panels**, not editing:
  - **Checkpoint A (after Phases 0+1):** parallel reviewers — gotcha/tap-loss audit (read the
    tick/restyle paths adversarially), visual/dark-mode/daypart review, a11y review.
  - **Checkpoint B (after Phases 2+3a):** full acceptance-gate panel (§10 one agent per gate) +
    one adversarial reviewer asking the only question that matters: *"did this actually reduce
    menu-feel and taps, or is it a reskin?"* — with authority to fail the build.
- Fix-forward anything the panels surface before proceeding to the next phase.

## 12. Godot port notes (unchanged from prior plan, still true)

Transfers: the state shape, the three-verb tap vocabulary, every IA ruling in this doc (glance
chips, four-object lane, sheet triage, harmony-as-picture), tuned constants, and the render/tick
discipline. Throwaway: all CSS/DOM specifics. In Godot the gotcha disappears (stable scene nodes),
the sky becomes real lighting, the lane objects become drawn buildings, and the critters finally
get to exist.

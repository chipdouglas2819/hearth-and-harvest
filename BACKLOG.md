# Hearth & Harvest — What's still on the table

> Living backlog. Written 2026-06-13 after the file-split + dead-code sweep. Grounded in
> what's actually shipped in the drawn Garden Scene (verified in code), the design docs
> (MAP_BUILD_PLAN, LIVING_FARM_*), and the multi-lens QA pass. Ordered by *payoff for the
> cozy living-garden vision*, not by effort. Each item says **why it matters** and a
> **first step**. Nothing here is started unless it says so.

---

## Where we are now (so the list reads in context)

The farm is a **drawn 3/4-view garden**, not cards. Already living in the scene, verified:
- Per-crop plant shapes (stalk / vine / bush), plants grow with progress, gentle sway.
- Ready bed = lift + **bob** + warm **under-glow**; top-decile harvests get a **perfect-star** twinkle.
- Fruit emoji fade in as the crop nears ripe (≈82%) and at ripe.
- Plant size nudges up with yield (`yBoost`, capped ~+22%).
- **Weather** states (dew / breeze / mist / rain / robin / butterfly / golden), a rose-gold **calm wash**,
  and **harmony** states (fence flowers, richer grass) — all drawn, all real.
- Boon FX: rain droplets, sun rays/halo, gamble glints, legendary/mythic auras.
- Real-clock **dayparts** (dawn→night) tint sky + soil; dark-theme handled.
- Garden **lane** = drawn buildings (stall / noticeboard / mailbox / cottage); the cottage window lights after dark.
- Beds are keyboard-focusable; pips carry aria labels.

So the big "make it a true garden" ask is **substantially delivered**. The list below is mostly
about *landing it harder* and *the deferred cozy depth*.

---

## Tier 1 — Land the living garden harder (the north star)

**1. Every boon you pick should leave a visible mark on its bed.**
Some archetypes paint FX (gamble glints, legendary/mythic auras, rain/sun). Others (synergy,
cascade, cross-pollen, commit, tradeoff) currently change only numbers. The dream you've stated
is "boons affect how the garden looks." → *First step:* list the ~8 boon archetypes, decide a tiny
drawn signature for each that lacks one (e.g. cross-pollen = a few petals drifting between beds;
synergy = a second flowering; tradeoff = darker, heavier soil). One archetype per pass.

**2. A big harvest should *look* big.**
Plant-size scaling is capped at +22% — subtle. Consider letting a fat yield show **more fruit dots**
(not just bigger plants) so a ×4 bed reads as "heavy with fruit" at a glance. → *First step:* drive
fruit-dot count off effective yield in `updateBedScene` (it already manages fruit opacity).

**3. The harvest *moment* in the scene.**
Tapping a ripe bed should feel like plucking: the plants give a little shake, fruit pops, coins fly
**from the bed** (the bed anchor exists — `bedAnchorEl`). Confirm the juice originates at the bed and
add a one-shot pluck animation on the drawn plants. → *First step:* verify coin-fly origin at 375px,
then add a `harvested` class with a 250ms squash/settle.

**4. Harmony could bloom further at the top.**
Today it's roughly two visible states. At max harmony the garden could feel unmistakably *thriving*
— fuller grass, an extra flower cluster, a resident bird or two. → *First step:* add a `data-harmony="3"`
richer pass (still static class swaps, no new tick cost).

---

## Tier 2 — Cozy depth still deferred (on the table, not built)

**5. Seasons / festivals.** The remaining meta-layer variability piece (long-flagged deferred). A
seasonal palette shift + one seasonal crop or gentle festival event would give the world a calendar
and a reason to return. → *First step:* a single season palette (autumn) swapped by a date check,
visuals only, before any festival mechanic.

**6. Building "interiors" (Phase 3b).** Tapping the cottage / noticeboard could open a sheet that
feels like stepping inside, with the yard dimmed behind — instead of a flat modal. The blueprint
calls this optional polish. → *First step:* reparent the cottage sheet to overlay the yard (yard
visible, dimmed) for one building, feel it, then decide.

**7. A little more world life.** Critters / butterflies / parallax are explicitly deferred to the
Godot build, but one or two cheap CSS critters (a hopping bird, a drifting butterfly in calm
weather) would add the coziness you keep asking for without much risk. → *First step:* one
calm-weather butterfly, behind `prefers-reduced-motion`.

**8. Sound rounds out the world.** Ambient wind/birds/crickets + harvest chimes already exist. Gaps:
rain sound during rain weather, a soft day→night ambient shift, and a gentle boon-pick sound. →
*First step:* gate a soft rain loop on the rain weather state.

---

## Tier 3 — UX, legibility, onboarding

**9. First-run still feels guided.** The lane fades in after the first harvest (intentional focus).
Re-walk a brand-new save end to end and confirm the first tap is unmissable and the world "grows into
a place." → *First step:* fresh-start playthrough at 375px.

**10. Keyboard / screen-reader full loop.** Beds are focusable and labeled; verify the *entire* loop
(focus a bed → plant → peek → harvest, plus the lane buildings and FABs) is operable and announced
without a mouse. → *First step:* tab through the yard with a screen reader on.

**11. Keep testing at real 375px.** The newest scene states (weather pills, the two-line mood
line) were fixed at true mobile width; keep verifying there as new visuals land — desktop-width math
hid earlier bugs.

---

## Tier 4 — Game design / depth (the "is it a good game" layer)

**12. Per-crop run variety.** Each crop's growth cycle is a mini-roguelike with 2–6 boon picks.
Playtest whether the build choices (synergy / cascade / commit / tradeoff archetypes) actually feel
*different* and worth thinking about, or whether it's "always take the biggest +yield." → *First step:*
a few real runs, note when a pick felt like a real decision vs. obvious.

**13. Contract pacing & card-set / mastery pull.** The long-term goals (card sets, per-crop mastery,
contracts) are the reason to keep playing. Sanity-check the pacing: does a session end with a clear
"one more thing I'm working toward"? → *First step:* play to ~10 harvests, note the pull.

**14. Monetization decision (deferred, principle locked).** Still undecided. Locked rule: optional,
never gates content, touches only the permanent layer. → *First step:* not code — a design call to make
before launch scope.

---

## Tier 5 — Game health / code (so the next editor moves fast)

**Done this session (2026-06-13):** split the 10.5k-line single file into `farm-prototype-v6.html`
+ `game.css` + `game.js`; deleted the legacy hidden card grid; swept ~860 lines of verified-dead
CSS/JS (old card styles, fake-ad pack shop, contract-quality chip, swap-picker modal, etc.); fixed
the misleading comments (one CSS banner literally claimed hidden card nodes still existed); added
accurate top-to-bottom section indexes to both files; confirmed the "tick never calls render" rule
holds and every `getElementById` resolves.

**Robustness / footguns found (worth a quick fix):**
- `anyModalOpen()` does `ids.some(id => !document.getElementById(id).hidden)` with **no null guard**.
  It works today (every id exists), but if a modal is ever removed from the HTML without also being
  removed from this list, the function throws on *every* call and silently breaks modal-gating
  game-wide. → *Fix:* `ids.some(id => { const m = document.getElementById(id); return m && !m.hidden; })`.
  (Same pattern is safe in `closeAllModals` because it already null-guards each lookup — make this match.)

**Small latent cleanups noticed (low priority):**
- The in-yard market strip (`#farmYard .farm-market-strip`) is given a panel style and then
  `display:none`'d (the stall face replaced it) — the panel rule is dead *and* `renderFarmMarket()`
  still computes + writes into a hidden element (wasted work). Confirm intent, remove the dead rule,
  and consider skipping the render when it's hidden.
- `.pip-boon { top; left }` positions a DOM pip that's now an SVG node — the rule is a harmless no-op;
  fold pip placement fully into the scene drawing if you touch it.

**Worth adding for velocity:**
- A lightweight **smoke test** so future edits can be checked without manual probing — the `sim/`
  scripts already exist; wire one into a quick "does it still boot + harvest" check.
- **Save robustness:** there's `saveGame()` to localStorage — add a version stamp + migration path so a
  future data-shape change doesn't strand existing players. No cloud save yet (fine for prototype).

**The eventual Godot port** (per the design docs): the HTML is the prototype. What transfers is the
state shape, the 3-verb tap vocabulary, the IA rulings, the tuned constants, and the render/tick
discipline — *not* the CSS/SVG. The drawn scene becomes real art + lighting; the gotcha disappears
for free with stable scene nodes.

---

### Suggested next move
Tier 1 is the highest-leverage and most in your voice ("boons should change how it looks"). I'd start
with **#3 (the harvest moment)** — it's the verb you do most, and making it feel tactile pays back every
session — then **#1 (a visible mark per boon archetype)**, one archetype at a time.

# Hearth & Harvest — Full UX Audit & Action Plan

> From a 5-part UX audit (onboarding/core-loop, cards/economy, goals/meta, wellness, game-feel/IA)
> → synthesis → adversarial critique, all grounded in `farm-prototype-v6.html`. 2026-05-13.
> This supersedes the variance/stakes direction (DESIGN_DIRECTION.md / VARIANCE_STABILITY_SPEC.md).

## The headline (you were right)

All five audits independently reached the player's own conclusion: **the wellness/harmony/variance
layer does not change anything a player can perceive.** Proof from the code:
- The "Calm State" visual is `filter: saturate(0.96) brightness(1.012)` — a 4% desaturation / 1.2%
  brightness shift, below the threshold you can see.
- The variance system is EV-neutral by its own code comment ("pure style, never 'Wild pays more'").
  Reduced variance around a constant mean is the single least-perceivable thing a game can do.
- The Wild cards literally say "(same average)" on their own face — textbook filler, admitted on the card.

The fix is **not another mechanic.** It's making the verbs you already have — harvest, plant, open a
pack, equip, tend — *feel like moments* instead of number-ticks behind menus.

## What it feels like now (honest)

The first 30 seconds are great (ripe crop, glowing Harvest button, clear goal). Then you tap Harvest
and the **entire payoff is one number fading over ~1.2s while the vegetable vanishes** — no burst, no
coins flying, no pop (confirmed: `harvest()` ends in a single `addFloat('+N')`). Then the farm goes
**inert for 4 real hours** (the fastest crop is 4h; none shorter) with a **frozen plant** (no idle
animation anywhere). You **can't tap the crop** — you press a labeled button. Every decision is a
full-screen **modal** that hides the farm (equip is 2–3 modals deep). The farm is literally a vertical
**stack of white cards** — no sky, ground, sun, or life. That is the literal source of "menus, not a game."

## Why it feels like menus — ranked
1. The harvest has almost no payoff (one fading number).
2. The farm is dead while you wait (frozen plant, no ambient life, 4–50h grows).
3. The crop is untouchable; verbs are UI buttons, not acts.
4. Every decision is a modal stack that hides the farm.
5. Rewards are silent/mistimed (earned pack unannounced; equipping changes an unseen number).
6. Goals are far away or invisible (first achievement = 100 harvests; harmony = invisible).
7. The wellness/variance layer added menus to explain a feeling you can't feel.

**#1–#5 are about FEEL, not strategy. Fixing them adds zero complexity.**

## THE PLAN — 5 things to do next (ranked by certainty-of-feeling-per-effort)
Each phrased as what you'll do and see. **None needs the deferred map. None adds complexity.**

1. **Tap the crop itself to harvest it.** (~10 lines; the crop wrapper already accepts taps and knows
   its plot — infra is in place.) The core verb stops being "press a button" and becomes "touch the
   vegetable." Most certain, cheapest felt win in the build. **Do first.**
2. **Add a ~3–5 minute starter crop.** Right now the first session is one harvest then a 4-hour wall.
   A fast crop means the first ten minutes contain 3–4 full plant→grow→harvest loops — an actual game.
   Bigger "is it a game" lever than juice, because juice can't fix "there's nothing to do."
3. **Make the harvest a moment.** Crop pops and flings a few crop emojis that arc/fade at the tap point;
   coins physically fly to the wallet which ticks up + bounces; a chunkier "pluck" sound + optional phone
   buzz; bigger burst on big/perfect yields (perfect-harvest is already detected). (Small new burst-spawn
   code; the particle visual is reusable.)
4. **Rebuild pack opening into a real reveal — on the farm.** Cards flip face-DOWN first, one at a time,
   rarity color + sound escalating to the last (best) card; the earned pack is announced the instant you
   earn it and opens where you harvested, not silently filed behind a tab. Weight early packs toward crops
   you've actually unlocked (so the reward is usable today).
5. **Pay off the big moments + cut the abstraction.** Equipping floats "+5%" on the plot; buying a plot
   animates the land open with a warm sound; tiny first-session milestones ("First harvest!", "Open your
   first pack") fire a celebration now. AND rip out the variance layer (below) + the cozy-breaking
   "contract expired while you were away" and "Watch Ad to Reroll" beats.

## Variance verdict — CUT it (correctly, in all 3 hiding spots)
The invisible "harmony narrows the swing" math is wired into **three** sites + a badge, not one:
- The 3 Wild Orchard perma cards' harvest band (`getPlotVolatility` / `wildFortune` in `harvest()`).
- The `coin_flip_17` in-run boon (`steadyTowardMean` + "· steadied").
- The `frost_gamble` in-run boon (same).
- The 🎲 Wild / 🍃 Steady badge (`boonStyleInfo`) tags the whole `gamble` archetype.

Do this:
- **Delete** the 3 Wild Orchard cards (`p_wildseed`, `p_feast_famine`, `p_tempest`), the 🎲/🍃 badge,
  the harvest swing-band, and the "wild garden swung high/low" log line.
- **In the two gamble boons, keep the gamble** (a visible "50% for ×1.7" IS a felt moment) but **strip the
  invisible narrowing** — let the result land at full force; drop "· steadied."
- **Keep** the harmony→rare-event link (Golden Yield / Midnight Bloom — the one VISIBLE wellness payoff),
  reframed as "a cared-for garden blooms more often," with the event toast crediting the calm.
- **Re-point "care"** at something the player SEES go up — flowers/fireflies appearing on the farm after a
  breath, a readable "+calm" bonus on ripe plots — not a swing they can't see narrow. Same intent, as a
  picture instead of a statistic.

## Second wave (after the verbs feel good)
Ambient life (gentle crop sway, drifting motes, smooth continuous growth, day/night on the plots), the
modal-maze collapse (equip on one screen; boon choice as a bottom sheet on the plot), goals surfacing
(streak + nearest achievement on the farm), patient contracts with a villager face and a visible
decoration reward, mini-games promoted to first-class (open a calm; delete "no reward" labels).

## Appendix — the full themed menu (pick freely later)
A) Juice: harvest burst, coins fly, pluck sound, scale-payoff-to-win, tactile equip.
B) World: idle crop sway, ambient motes, smooth growth, day/night on plots, living empty plot, (L) true map.
C) Core loop: fast starter crop, tap-the-plant, one-tap replant, staggered early plots.
D) Packs: one-at-a-time face-down reveal, rarity escalation, open-on-farm, usable early cards, tappable
   collection detail, NEW dots/foil, dupe→star animation.
E) Equip/boons: one-screen equip, explicit card-drift, boon bottom-sheet on plot, cut archetype jargon,
   hide filters until large, celebrate rare offers.
F) Goals: first-session milestones, loud reward announce, streak/achievements on farm, plot-buy ceremony,
   surface upgrades, market as actable daily event, contracts with a face + decoration reward, mastery moments.
G) Tone: drop 24h auto-expiry, cut ad-reroll, drop hidden quality labels.
H) Wellness tangibly: breath blooms the farm, legible "+calm" bonus, mini-games open calm, tend-streak
   grows a visible ornament, rare events legibly caused by calm.

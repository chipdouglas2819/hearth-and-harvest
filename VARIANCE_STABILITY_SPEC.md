# Spec — Wellness as Stability: the variance-vs-stability choice harmony governs

> Status: PLAN for review, not yet built. Implements Tier-1 #1 from DESIGN_DIRECTION.md
> ("archetypes WITH a consequence"). Goal: make Garden Harmony govern a real, cozy decision
> — so it stops being ignorable texture — without ever touching expected coins (the hard line).

---

## 0. Ground truth (verified in code)

There are **two** card systems, and they are NOT the same thing:

| | **In-run boons** (`BUFF_POOL`) | **Permanent cards** (`PERMA_POOL`) |
|---|---|---|
| What | Drafted during a crop's growth, dissolve at harvest | Owned forever, equipped 4-per-plot in loadouts |
| Decisions | Per-run, moment-to-moment (the roguelite layer) | Persistent — your "build identity" |
| Has `archetype` tags? | **Yes** — `stat / tradeoff / gamble / commit / synergy / cascade / cross / skill / meta` | No (just crop-set membership + flat mults) |
| Has variance? | **Yes** — gamble cards (Coin Flip, Frost Gamble) | No — almost all flat |

**Critical detail:** gamble boons resolve **at pick-time**, not harvest-time. `coin_flip_17`
(line 7309) and `frost_gamble` (7315) roll `Math.random()` the instant you pick them and bake the
result into `plot.yieldMult`; the pick UI shows "+70%!" / "miss" immediately. So today's variance
is a *per-pick gamble you see resolve right away*, not a suspense-at-harvest swing.

**Expected values today** (so we don't accidentally nerf): Frost Gamble EV ≈ 1.69×, Coin Flip
EV ≈ 1.35×. Gambles are already +EV with a downside — they're "wild but rewarding."

**Where harmony plugs in:** `getHarmony()` (0–100, floor 20) and the `harvest()` multiplier chain
(peak/ferment → perma → mastery → set → market → rare-event) already exist. The boon resolution
lives in `applyBuff` (the `switch(custom)` around line 7309).

---

## 1. The design goal (one sentence)

Give the player a genuine choice between a **calm, predictable garden** and a **wild, swingy one**,
and make **tending (harmony) the thing that tames the swings** — so mindfulness finally answers a
question the player is already asking, while staying cozy (no punishment, no loss).

## 2. The core mechanic — "harmony narrows variance toward its mean"

The principled, EV-safe version of the doc's "breakthrough mechanic":

> A variance effect resolves around a **mean**. Harmony pulls each outcome **toward that mean**,
> shrinking the spread. **Expected value is preserved exactly** — harmony changes how *swingy* a
> result is, never how *much* on average.

Math (applied to any gamble/variance outcome `x` with mean `m`):
```
narrow = harmonyNarrow();            // 0.0 at floor harmony → ~0.6 at max harmony
x_final = m + (x - m) * (1 - narrow);
```
- At **low harmony**: `narrow ≈ 0` → full wild spread (Frost Gamble still ×2.2 / ×0.5).
- At **high harmony**: `narrow ≈ 0.6` → outcomes pulled 60% toward the mean (Frost Gamble becomes
  ≈ ×1.9 / ×1.0 — still swingy, but the gut-punch floor is softened and the jackpot trimmed).
- **EV identical at every harmony level**, because we scale deviations symmetrically around `m`.

`harmonyNarrow()`:
```
narrow = ((getHarmony() - HARMONY_FLOOR) / (HARMONY_MAX - HARMONY_FLOOR)) * 0.60;  // 0 → 0.60
```

**Why EV-preserving is the right call:** it makes tending a *risk-preference* choice, not a
gold lever. There is literally no "breathe because it's optimal for coins" incentive — the average
payout is the same whether you tend or not. You tend because you'd rather not eat the ×0.5 swing.
That is the doc's "opportunity cost, never punishment," and it can't become the coercion trap the
docs warn against three times. **This is the hard line, and this design satisfies it by construction.**

## 3. The choice, made legible (naming the styles)

Variance is invisible until it's named. Two style labels, surfaced on the boon draft and in copy:

- **Wild Orchard** — the gamble/high-variance/commit boons. Big swings, same average. "Feast or famine."
- **Hearthkeeper** — the flat `stat` boons. Calm and dependable.

(The other existing archetype tags — synergy, cascade, cross, skill, meta — keep their tags; only
`gamble` + the swingy `commit`/`tradeoff` extremes get the "Wild" framing for now.)

Surface it:
- A small **Wild / Steady badge** on each boon in the draft modal (reuses the archetype field).
- When a Wild boon resolves, the result toast already shows ("+70%!" / "miss") — add, when harmony
  is high: *"…steadied by your calm garden."* So the player *sees* harmony doing something.
- A line in the harmony garden-sheet: *"A calm garden steadies its wildest harvests — the big
  swings settle toward something surer, without losing their average."*

## 4. Phasing

**PHASE 1 — Harmony tames the in-run gambles (the cheap, real-stakes injection). ~1–2 days.**
- Apply §2 narrowing to the existing gamble resolutions (`coin_flip_17`, `frost_gamble`) and any
  other pick-time variance, reading harmony at pick-time.
- Add the Wild/Steady badge + the "steadied by your calm" feedback.
- Result: harmony now *does something a player can feel* (your wild picks are safer when you tend),
  and there's a real per-run decision (draft wild and tame it, or draft steady). Smallest change
  that kills the "harmony is ignorable" problem.

**PHASE 2 — Persistent build identity in the PERMA pool (the doc's "my Wild Orchard garden"). ~3–4 days.**
- Tag every PERMA card with an archetype **family**: Moonlit Garden, Hearthkeeper, Wild Orchard,
  Pilgrim Soil, Golden Harvest, Raincaller. Show a family badge; add an optional "group by family"
  view on the Cards tab (kept *alongside* crop sets — see §5).
- Introduce a per-plot **Garden Fortune** band at harvest: if the equipped loadout leans **Wild
  Orchard**, the plot's final yield is multiplied by a random factor drawn from a band centered on
  **1.0** (mean = 1.0, so Wild is *not* higher EV than Hearthkeeper — pure style choice). Harmony
  narrows the band via the same §2 formula. A **Hearthkeeper** loadout → no band (flat).
- Now the *persistent* build is the identity: "I run a Wild Orchard pumpkin plot and tend it to
  keep the swings friendly," vs "a calm Hearthkeeper plot I can ignore."
- This is where the visceral, watch-the-harvest-swing feeling lives. Phase 1 makes harmony matter;
  Phase 2 makes it an identity.

## 5. Reconciling with the existing crop sets (the critique's wrinkle)

`CARD_SETS` already group the PERMA pool **by crop** (Radish Set, Carrot Set…) with completion
bonuses. Archetype families are a **second, orthogonal** axis (cross-crop philosophy).
**Recommendation: keep both, don't merge.** A card can belong to a crop set *and* a family. Crop
sets stay the *collection/completion* mechanic (gotta-catch-'em-all); families are the *build/identity*
mechanic. The Cards tab keeps its crop-set grouping by default and gains a "by family" toggle. No
math changes to crop sets. (If this proves confusing in play, revisit — flagged as open question.)

## 6. Cozy guardrails (must all hold)
- **EV-preserving** (Phase 1) / **mean = 1.0** (Phase 2 band): tending never changes average coins.
  No "breathe for gold."
- **Floor stays positive:** even the worst Wild roll is a *smaller gift*, never a loss or a
  destroyed crop. (Frost Gamble's ×0.5 is the current floor and it's already positive; the band's
  floor will be set ≥ ~0.6×, never 0.)
- **Wild is never mandatory:** a Hearthkeeper player ignores all of this and plays a complete, calm
  game. Wild is an *option* with a *feel*, not the optimal path.
- **No score, no fail, no timer pressure** anywhere.

## 7. Tuning targets (feel-test knobs)
- `harmonyNarrow` max (default 0.60): how much a maxed garden tames the swing. Higher = harmony
  feels more powerful but Wild converges to flat.
- Phase 2 band width at low harmony (e.g. 0.65×–1.45× around mean 1.0): how dramatic Wild feels.
- A new player should be able to *notice* a tamed swing within a session of tending a Wild build.

## 8. Risks / open questions (for you to weigh)
1. **Is EV-neutral too subtle?** Tending a Wild build changes *spread, not average*. The decision is
   real but quiet. The visceral payoff is mostly Phase 2 (watching a big swing get tamed). If you
   want tending to feel more *rewarding*, the alternative is letting harmony lift the floor (raising
   EV) — but that re-opens the "breathe for gold" coercion the docs warn against. **My rec: stay
   EV-neutral; get the drama from Phase 2's visible band, not from a coin bonus.**
2. **Phase 1 is per-run, not a persistent identity.** It makes harmony matter immediately and cheaply,
   but "my Wild Orchard garden" as a lasting identity only really arrives in Phase 2. Worth being
   clear that Phase 1 alone is the *stakes injection*, Phase 2 is the *identity*.
3. **Crop-sets vs families coexistence** — two grouping axes on one Cards tab. Recommended to keep
   both; needs a clean UI so it doesn't clutter.
4. **Does this need the map UI?** No — all of this works in the current menu build. It makes the
   menus *meaningful*; it doesn't pretend to fix "it's all menus" (that's the deferred map).

## 9. What this explicitly does NOT do
- Does not add seasons (Tier-1 #4 — comes after this, so seasons have build identities to re-weight).
- Does not touch the map / spatial layout (deferred to Godot).
- Does not make wellness raise coins, add punishment, or gate the core game behind harmony.
- Does not rename cards *without* giving them a consequence (the "seductive empty fluff" trap).

## 10. Recommended path
Build **Phase 1 first**, feel-test whether "tending tames my wild picks" lands, then commit to
Phase 2 (the persistent named-build identity + harvest band). Phase 1 is the cheap proof that
harmony-as-stakes is fun; Phase 2 is the payoff that makes it an identity.

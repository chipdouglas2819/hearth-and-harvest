# Living Farm — Retention & Wellness Redesign (Plan)

> **Status:** Design plan, not yet implemented. Backend/mechanics first; visual & audio
> richness comes with the Godot port. This doc is the reference for what we build in HTML.
>
> **Created:** 2026-05-13. Supersedes the "rewire the three mindfulness cards" framing —
> that change is now one piece of this larger, coherent redesign.

---

## 0. Why This Doc Exists (the real problem)

Playtest feedback, in the player's own words: *"I just haven't felt a need to keep
returning to the app on a consistent basis, making it difficult to complete contracts.
It probably does have a lot to do with graphic state but it should be functioning well
without graphics."*

The player is right that it's not really about graphics. The honest diagnosis:

**The game has no anticipation layer.** The core loop is:

> plant → wait (real time) → harvest (predictable result) → replant → leave

Nothing changes between visits. Nothing happens *while you're away* that you discover on
return. Nothing about today is different from yesterday. So there is no curiosity pull —
only the obligation pull of contract deadlines, which makes contracts feel like chores you
fail rather than goals you enjoy chasing.

This independently confirms the analysis doc's central thesis (Part 4): the real retention
engine is **"I wonder what will happen next,"** not "numbers go up." We're going to build
that engine.

---

## 1. The Thesis

**Make the farm feel alive between visits and a little different each day — and make
mindful, consistent play the thing that makes it *more* alive.**

This reframes the wellness layer. Wellness is no longer "breathe for faster crops" (a
throughput reward the doc warns against). Wellness becomes **the dial that controls how
much wonder your farm produces** — how often rare moments happen, how alive the world feels,
how much the garden "knows you." That gives the mindfulness system a real purpose AND fixes
retention with the same mechanism.

The player feeling we're chasing:

> "Let me check the farm — I wonder what's happening today."
> "Oh — something bloomed overnight while I was gone."
> "The more I tend it, the more alive it feels."

NOT:

> "I should log in or I'll lose my contract."
> "I breathe because it makes my crops grow 8% faster."

---

## 2. How It Solves the Retention Problem

| Problem today | What the redesign adds |
| --- | --- |
| Nothing is different day to day | **Daily Farm Moment** — one small thing changes each real day on open |
| Absence is invisible / nothing waits for you | **While-You-Were-Away reveals** — returning surfaces what happened |
| Harvests are 100% predictable | **Rare events** (Midnight Bloom, Golden Yield, Rare Bloom) punctuate them |
| Consistency isn't rewarded with anything but coins | **Garden Harmony** — consistent/mindful play → more moments, more life |
| Contracts are the only return-reason, and they feel like chores | Contracts become a *side effect* of enjoying a farm worth returning to |
| Breathing is a "should," gives a throughput bump | **Calm State** — breathing opens a window where the world softens & more can happen |

Contracts are NOT made easier. We don't paper over the problem by extending deadlines. We
fix the *cause* (no reason to return) so the daily engagement contracts need happens
naturally.

---

## 3. The Four Interlocking Systems

### 3.1 Garden Harmony (the dial)

A hidden persistent state, 0–100. It does **not** affect coins or yield. It governs how
often the farm produces "moments."

**Rises from (mindful / consistent / present play):**
- Completing a breathing exercise (largest single input)
- Completing an active mini-game (smaller)
- Harvesting inside a Peak Ripeness / Slow Ferment window (rewards attentive timing)
- Crop diversity (3+ different crops growing at once)
- Returning on a new real day (consistency — small daily tick up)
- Any interaction during local night hours (presence at quiet times)

**Decays from (neglect — gently, never punishing):**
- Prolonged absence: harmony drifts down toward a floor (e.g. never below ~20) over days.
  The garden gets *quieter* when untended, it doesn't get *damaged*.
- No decay from "playing wrong" — we are NOT adding a fast-click penalty or any "you played
  too efficiently" punishment. (This was a bad idea floated earlier; explicitly rejected.)

**What it controls:**
- Base probability that a harvest produces a rare event
- Frequency of Daily Farm Moments and visitors
- Intensity of ambient calm cues (richer at high harmony)

**Surface:** ONE subtle cue, not a HUD bar, not a number. A small pictorial state (e.g. a
leaf-cluster glyph that fills out in ~3 stages, or a gentle ambient tint). The player should
*infer* harmony from how alive the farm feels, and only have a quiet confirmation glyph.
Never display "Harmony: 64/100."

---

### 3.2 Calm State (replaces the −8% farm time reward)

The everyday reward for breathing. Triggered by completing any breathing exercise.

- **Duration:** ~30 real minutes.
- **During it:** rare-event chances are elevated, ambient visuals/audio soften (the doc's
  "Calm State" — dimmer particles, gentler sound, slower motion), and a quiet "the garden is
  at peace" cue appears.
- **The reward shifts** from "your crops grow 8% faster" to "for the next half hour the world
  feels calmer and more wonderful things can happen." Possibility, not throughput.

**Why remove −8% time:** it's a throughput reward (exactly what Part 3 warns against), and it
trains "breathe = numbers up." Replacing it with Calm State keeps breathing *worth doing* —
arguably more so, because the payoff is anticipation — without the optimization trap.

**Risk & mitigation:** −8% time was a (weak) return-driver. The replacement MUST itself pull
players back, or retention gets worse. That's why Calm State is tied to elevated rare-event
chances: breathing now opens a window worth *using* (go harvest something during it), which
is a stronger, more curious pull than a passive speed bump.

---

### 3.3 Living Moments (the content that creates anticipation)

Three categories, all building on the **existing Lucky Harvest scaffold** (3% × 1.5 yield
with celebration) rather than inventing a new event system from scratch.

**a) Rare harvest events** — fire at harvest, gated by harmony × calm × conditions:
- **Midnight Bloom** — harvesting during local night has a chance for a moon-glow harvest:
  small yield bump, special visual/sound, journal entry on first occurrence.
- **Golden Yield** — rare chance a whole row/cluster of ready plots harvests together in one
  celebratory beat.
- **Rare Bloom** — rare chance a harvest yields a one-time heirloom variant of the crop.

Yield bumps stay **small** (gift, not target). The *moment* matters more than the math.

**b) While-You-Were-Away reveals** — on returning after time away, surface what happened in a
warm, gift-framed way: "A Midnight Bloom opened while you were gone." "A quiet visitor passed
through and left something by the gate." This converts absence from a void into a positive
discovery. (Some of these can be generated retroactively on load based on elapsed time +
harmony, since we can't run while the app is closed.)

**c) Daily Farm Moment** — each real day, one small thing is different on first open: a
weather mood, a passing visitor, a market quirk, an ambient shift. The "what's today" hook.
Low-stakes, cozy, but gives a reason to *open* the app even before harvests are ready.

---

### 3.4 Living Journal (the memory — why it accrues meaning over time)

The Journal tab is currently pure stats. Add a **narrative strand**: short reflective entries
triggered by firsts and milestones.

Examples:
- "First Midnight Bloom — early spring. The garden glowed."
- "100 tendings. It has begun to know you."
- "A quiet visitor, and a gift left behind."
- "Your first Golden Yield. The whole row, at once."

This turns the *history* of the farm into something worth having, reinforcing the long arc.
It also makes harmony and rare events feel consequential (they leave a mark), which is the
sustainable version of "reward" the doc argues for (Part 3 §6, Memory Systems).

---

## 4. The Three Phase 1 Cards, Rewired

These perma cards only matter for owners who equip them, so they're **amplifiers** within the
new system, never its engine. All stay in the **Pilgrim Soil** archetype.

| Card | Old effect (remove) | New effect (texture/possibility) |
| --- | --- | --- |
| **Garden Devotion** (uncommon) | +5% base, +20% if tended today | Tending raises Garden Harmony faster; tended-today plots are more likely to produce a moment |
| **Centered** (rare) | +30% yield if breathed in last hour | Extends & intensifies Calm State — longer window, higher rare-event chance during it |
| **Lifetime Reverence** (legendary) | +1% per 50 sessions, cap +30% | Raises the Garden Harmony ceiling and unlocks Living Journal entries over a long arc |

Card descriptions should read like garden lore with a small italic rules line beneath, not a
stat sheet (e.g. Centered: *"Your harvests carry the calm of a recent breath. Possibility
lingers."*).

---

## 5. What Gets Replaced / Retired / Kept

**Replaced:**
- −8% farm time on first 4 daily breaths → **Calm State**
- `tendSessionsToday` as a *reward gate* → becomes a **harmony input** (still tracked)
- The three cards' flat yield % → **texture/possibility effects**

**Extended (not replaced):**
- Lucky Harvest → becomes the base of the **rare-event family**

**Kept as-is:**
- Crop growth, planting, mastery, packs, contracts, market, loadouts, boons, streak
- The breathing exercises themselves and the mini-games (only their *reward wiring* changes)

**New state to add (HTML):**
- `gardenHarmony` (0–100), plus its decay timestamp
- `calmStateUntil` (timestamp)
- Per-event "first seen" flags (for journal triggers)
- A lightweight "while away" reveal record computed on load
- Daily Farm Moment seed/record (one per real day)

---

## 6. Tuning Targets (the numbers we'll feel-test)

- **New player:** sees their first rare event within the first day or two (soft-boost
  rare-event rate during the first ~3 days so the *feel* is taught early).
- **Daily returner:** witnesses a "moment" roughly every 1–3 sessions — frequent enough to
  anticipate, rare enough to stay special.
- **Lapsed player (2–3 days away):** farm feels noticeably quieter (lower harmony, fewer
  moments) but recovers within a session or two of return. Pull, not punishment.
- **Rare-event yield bumps:** small (≈10–15%), so they're gifts, never optimization targets.
- **Harmony swing:** slow. A single breath shouldn't max it; consistent play over days should.

All of these are knobs we'll tune by playing, exactly the kind of thing the HTML phase is for.

---

## 7. HTML Scope vs. Godot Scope

| Build now in HTML (logic / feel) | Finalize in Godot (assets / polish) |
| --- | --- |
| Garden Harmony state, inputs, decay, gating | Ambient visual response to harmony (lighting, particle density) |
| Calm State timing + what it modulates | Calm State visual/audio richness (fireflies, hush, soft score) |
| Rare-event triggers, conditions, yield math | Cinematic bloom moments (shaders, particles, sound) |
| While-away reveal logic + copy | Theatrical "what you missed" reveal presentation |
| Daily Farm Moment selection + effects | Weather/visitor visuals & audio |
| Living Journal entries (text + triggers) | Journal page styling / handwriting feel |
| Rewired card effects + lore copy | Card art |
| All tuning numbers | — (locked in HTML) |

Principle: **lock every mechanic and number in HTML.** Godot should be presentation work, not
design work.

---

## 8. Open Questions & Risks

1. **Legibility (biggest risk).** Players must *perceive* that their care makes the farm more
   alive, or harmony is invisible and pointless. Mitigation: journal attribution ("a Midnight
   Bloom, drawn out by your calm") + the subtle harmony glyph + teaching the feel early.
2. **While-away reveals must feel like gifts**, not a numbers report. Tone and framing matter
   more than the contents.
3. **No FOMO / anxiety.** Must never tip into "log in daily or miss out." Cozy principle is
   sacred — pulls are positive ("something nice is waiting"), never punitive.
4. **Calm State must carry the retention weight** that −8% time used to. If feel-testing shows
   it doesn't pull players back, revisit before removing −8% time entirely (could run both in
   parallel during a transition test).
5. **Are 3 rare events enough to start?** Likely yes for a feel-test (Midnight Bloom first,
   it's the cleanest). Add Golden Yield / Rare Bloom once the first one feels right.

---

## 9. Explicitly NOT Doing (scope guards)

- No stress/anxiety meters or "fix yourself for bonuses" (Part 3, hard no).
- No punishment, crop death, or decay-as-damage (cozy principle).
- No fast-click / efficiency penalty (rejected earlier bad idea).
- No spirit-realm ecology, mutation chains, or resource-identity currency rewrite (doc
  overreach — see Analysis doc Part 6 §"Where Parts 1–5 Overreach").
- Not making contracts easier — we fix the return-reason, not the symptom.

---

## 10. Build Order (within this redesign)

1. **Garden Harmony** state — invisible plumbing first (inputs + decay, no surface yet).
2. **Midnight Bloom** — first rare event, hung off the existing Lucky Harvest path, gated by
   harmony. This is the proof-of-concept that "harmony → wonder" works.
3. **Calm State** — replace −8% time; tie elevated rare-event chance to it.
4. **Subtle harmony surface** — the one quiet cue.
5. **Living Journal entries** — for first Midnight Bloom + harmony milestones.
6. **Rewire the three cards** — now that the system underneath is real.
7. **While-You-Were-Away reveal** — compute on load, gift-framed.
8. **Daily Farm Moment** — the "what's today" hook.
9. Add **Golden Yield / Rare Bloom** once Midnight Bloom feels right.

Each step is feel-testable on its own. Steps 1–2 alone should already start changing whether
the farm feels worth returning to.

---

## 11. Relationship to the Other Tier 1 Items

This redesign is the **anticipation/wellness spine**. The remaining Tier 1 items from the
Analysis doc plug into it later, each as its own plan:

- **Seasons** — the strongest amplifier of "today is different"; feeds Daily Farm Moments and
  rare-event flavor. Natural next big plan after this one lands.
- **Buff archetypes** — labeling pass; gives the cards (incl. the rewired Pilgrim Soil three)
  identity. Independent, can happen any time.
- **Coin sinks** — separate economy concern; doesn't depend on this. Do when inflation bites.

We do this spine first because it's the one that directly answers "why don't I come back."

# Hearth & Harvest — Design Direction (the north star)

> Produced 2026-05-13 by a design-reckoning workflow (5 diagnoses → synthesis →
> adversarial critique), after the player felt the Living Farm work was "meaningless
> filler and fluff." This is the **corrected** verdict — the critique's FINAL DIRECTION,
> which overrides the synthesis where they conflicted. Supersedes the texture-only
> framing in LIVING_FARM_REDESIGN.md where they disagree.

## The honest verdict

The Living Farm work was **not a failure and not a betrayal — and not the thing that
makes this a game.**

- It competently built the layer its own plan targeted: **retention through anticipation**
  (rare events, calm state, journal, while-away framing, daily moment).
- It fixed a genuine wart: the old "breathe for −8% farm time" coercion is gone. **Real keeper.**
- It did **not** give the game **stakes** — decisions with consequences — because the plan
  *deliberately and repeatedly* chose not to, to protect coziness.

The player's "fluff" instinct is **correct**, and the legibility pass deserves credit for it:
by honestly telling the player "this never costs you, nothing is managed," it removed the fog
that let imagination supply stakes that were never there. The fluff wasn't created by the
legibility pass — it was *exposed* by it.

**What's actually happening:** the player solved problem A (no anticipation) and surfaced a
deeper problem B (no stakes/decisions) that the plan had set aside. That deferral was a
defensible call. Its cost is now visible. Time to reopen it.

## The principle that unlocks everything

**Cozy ≠ no stakes. Cozy = no _punishment, time-pressure, or loss._**

Stardew has real economic and crop-timing decisions and is the genre's comfort archetype. You
can have meaningful choices and zero cruelty at the same time. The texture-only model conflated
"no punishment" with "no consequence" — that conflation is the root error to discard.

## Garden Harmony today (the problem, in one line)

Days of tending move a rare-event roll from **3% → 12%**, the event gives **1.4×–1.6× on one
plot** + a 30-min screen tint. A resource you passively accrue, can't spend, can't lose (floored
at 20). That is the textbook profile of a stat players learn to ignore.

## The #1 next move — consequence first, name second

**Give two or three card archetypes a real stability-vs-variance consequence, and name them in
the same pass. The consequence is the deliverable; the name is the wrapper. Do NOT ship names alone**
(a rename with no consequence is the most seductive form of fluff — looks like progress, changes
nothing).

- Group the variance-rich cards that already exist (`Frost Gamble`, `Coin Flip`, `All In`, the
  `gamble`/`commit`/`skill` behavior tags) as **Wild Orchard**: their yield becomes a *band*
  (e.g. 0.6×–2.2×) instead of a flat number. Group the reliable flat cards as **Hearthkeeper**:
  calm and dependable.
- **Harmony narrows the Wild band from the floor up** — high harmony lifts the worst roll toward
  a smaller-gift, never a loss. This is the analysis doc's own self-named "breakthrough mechanic"
  (wellness = stability/risk), made cozy: it touches **variance, never expected coins.**
- The real, cozy decision this creates: *run a calm Hearthkeeper build that needs no tending, or
  a Wild Orchard build whose feast-or-famine swings I smooth by actually showing up and breathing?*
  Mindfulness becomes the answer to a question the player is already asking. **Worst case is still
  a harvest — "less gift," never "loss."**

**Honest cost & wrinkles (do not undersell):**
- This is a **few days, not "free / zero math."** You're adding a variance step to the `harvest()`
  multiplier chain and reusing the existing `rareEventChanceForHarvest` harmony scaling.
- The commitment skeleton **already exists** (4 loadout slots per plot, 6 plots) — you're filling
  it with *meaning*, which is why it's days not weeks.
- **Reconcile with the existing `CARD_SETS`**, which already group the Cards tab *by crop* (Radish
  Set, etc.) with real bonuses. Archetype families are a *second* taxonomy — decide how they
  coexist or fold together. This is the main design-fraught part.

**Why this beats seasons-first** (overriding the doc's stated order, with eyes open): seasons are
higher-ceiling but much heavier, and they *re-weight build identities that don't yet exist* —
building the modifier before the thing it modifies. Build the consequential choice first.

## The hard line for wellness (never cross it)

Harmony may touch **variance, content-kind, or timing — NEVER expected coins directly.** The
instant breathing raises gold/hour, you recreate the "I breathe because it's optimal" resentment
the docs warn against three times. Every meaningful-wellness option below respects this.

## Prioritized backlog

**TIER 1 — Creates stakes (the actual gap):**
1. **Archetypes WITH a variance-vs-stability consequence** (Wild Orchard band; harmony narrows it;
   floor always a gift). Naming bundled in. *Days; reconcile with crop sets.*
2. **One real decision-pressure point** — pick-1-of-3 seasonal blessing, or competing contract
   slots. Cheap, HTML-doable, directly attacks "no choices."
3. **Harmony gates content KIND, not amount** — heirloom/ritual crops reachable only via sustained
   harmony. Gives the calm, non-strategic player a *reason to want* harmony, without touching coins.

**TIER 2 — Real wins, after stakes exist:**
4. **Seasons** (now that archetypes exist for them to re-weight) — the doc's #1, correctly sequenced second.
5. **Daily Farm Moment → make it real** — currently 8 fixed strings with zero effect; tie to season/harmony.
6. **Identity payoff in journal** ("You've been a Herbalist this month") — the reward for #1.

**TIER 3 — Texture (where Living Farm lived). Do NOT add more here until Tier 1 ships.**
Journal, calm tint, reactive audio, ritual crops, presence moments, discovery hooks.

**BLOCKED ON A SPATIAL MAP (deliberately deferred to the Godot port — a stated plan, not a failing):**
spatial farm map, plot adjacency, layout-building, strategic weather. **Flag:** the missing map is
the single biggest contributor to the "it's all menus" feeling. Tier-1 work makes the menus
*meaningful*; only the map makes them *not menus*. No amount of HTML stakes-work fully resolves that.

## The mini-games call

Keep, lightly fix, **do not deepen** — and it does **not** move the needle on stakes. The player's
suspicion is correct: there is no "doing it well," only a 10-second timer (the picker even prints
"no reward"). Fix by rewarding **presence, not performance**:
- Scale harmony by minutes lingered (soft-capped).
- Let a real session open a shorter Calm State (`startCalmState()` is ~one line).
- Fold completions into the journal / lifetime tend count.
- **Do NOT add a score** — that betrays the no-pressure tone. Wordless positive feedback only.
~1 hour of work. Least load-bearing item on the list.

## Keep, don't cut

Keep almost everything Living Farm built — journal, calm tint, honest copy, the harmony cue. It's
good connective tissue. It was just connective tissue with nothing to connect to. **The moment
harmony governs something real (Tier-1 #1), all that legibility work becomes genuinely valuable —
it'll be explaining a system that matters.**

## The one paragraph that matters

You were not lost and not gaslit. You built the anticipation layer your plan asked for, fixed a real
coercion wart, and — by making it honest — exposed a second, deeper problem your plan had deliberately
set aside: the game has no stakes. The fix is **not** to rename your cards and call it done — that's
the seductive, empty half. The fix is to give two or three archetypes a genuine **stability-vs-variance
choice that harmony governs**, and name them while you're in there. Consequence first, label second.
That converts "a beautiful, legible collection of menus" into *a calm Hearthkeeper garden, or a wild
one I tend to tame.*

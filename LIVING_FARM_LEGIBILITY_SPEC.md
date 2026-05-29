# Hearth & Harvest — Living Farm Legibility Spec (build-ready)

> Produced by a design workflow (6 parallel diagnoses → synthesis → adversarial critique),
> 2026-05-13. This is the **revised** spec — it already incorporates the critique's fixes.
> The layer was mechanically sound but illegible; this makes every symbol explain itself
> on demand, in plain warm words, while staying cozy and pressure-free.

## Core principle
The layer fails because it speaks in symbols and never plain words, so a caring player reads
silence as risk. Fix: every ambient symbol gets **one consistent tappable "garden sheet"**
that explains itself on demand. Three anti-fear promises, kept **truthful and separate**:

- **Tending is never wasted** — a breath/harvest only ever *adds*; nothing you do costs you anything. (True everywhere.)
- **Calm is never spent** — breathing refreshes the calm window, never consumes it. (`startCalmState` assigns.)
- **Harmony is described honestly** — it rests and grows quiet when you're away, and *always comes back with a little care*; it never costs coins and never drops below the garden's resting calm. **Never say harmony is "never lost"** (it decays toward the floor while away — telling the truth here is what removes the lingering ominousness).

## 1. Legibility spine
Reusable helper `openGardenSheet({icon, title, body})` drives one shared modal
(`.modal/.modal-content/data-close`, patterned on `exerciseIntroModal`). Each sheet = 1 warm
headline + 2–3 short lines + a truthful closer. Player opts into depth; nothing forced.
- **Always-on copy** for things you can't tap (panel subtitles, softened flavor).
- **First-time-only beats**, gated by **new** flags, observational not instructional.

Add static `<div class="modal" id="gardenSheetModal" hidden>`; register in `anyModalOpen` and
`closeAllModals`. Load-time `[data-close]` + backdrop-close handle dismissal.

## 2. Per-system fixes

### Harmony + topbar cue
Make `#harmonyCue` tappable in `render()` (`cursor:pointer`, `onclick`). Headline from
`harmonyStage()` + **one stage-varying clause** + constant truthful closer:

> **🍃 Your garden feels alive.**
> The more you tend it — a quiet breath, a moment of care, a harvest at the right time — the
> more alive it feels, and the more it surprises you: a rare bloom here, a whole row catching
> the light there.
> *[stage clause]*
> *When you're away a while it rests and grows quiet — a little care always brings it back. It
> never costs you anything; tending is only ever a gift.*

Stage clauses: 🌱 "Your garden is quiet." *It's resting right now — a quiet breath will start to
wake it.* / 🌿 "Your garden is settling." *It's finding its rhythm.* / 🍃 "Your garden feels
alive." *It's lively today — moments come more easily.* / 🌸 "Your garden is radiant." *Wonder is
never far.* (No "midnight"/"a whole row at once" as **conditions** — imagery only, never *when*,
so we don't teach a timing lever to dread.)

**First-time beat:** first genuine in-session stage increase → `.tend-toast`: *"Your garden feels
a little more alive."* Gate on new flag `journalSeen.first_stageup`. **Migration:** seed
`state._lastStageIdx` from current stage on load so it never mis-fires on first render.

### Calm State
Bind the Tend FAB ✦ badge `onclick` → sheet (two-state body):

> **✦ A calm has settled.** For about half an hour the garden is softer and more open — rare
> moments stir more easily. A lovely time to wander over and harvest whatever's ready.
> *Nothing is used up. Breathing again just freshens the calm — there's no wrong time to tend.*

Resting state: **The garden is quiet.** *Tend it with a breath whenever you like… It only ever
adds calm, never spends it.*

First calm → one soft CSS pulse on ✦ (no text). Post-breath toast → **A calm settles in** —
*a lovely time to wander over and harvest.* (replaces "rare moments stir" scarcity phrasing).

### Rare harvest events
**Always-on:** rewrite `rareEventFlavor` short strings (already shown every harvest) to named
two-part lines:
- `🌙 Midnight Bloom — drawn out by the quiet night.`
- `☀️ Golden Yield — the whole row caught the light.`
- `🍃 Rare Bloom — your settled garden offered something rare.`
- `✨ A lucky harvest — fortune touched this one.`

When `isCalmState()`, append `· while the garden was at peace.` **Do NOT touch the `mult >= 3.0`
gate** — it governs the separate `attribution` tag; un-gating it would tag every harvest (clutter).

**First-time card per kind (ever):** new flags `journalSeen.firstcard_{golden|midnight|rarebloom|lucky}`
(NOT the existing `first_*` keys, which `addJournalEntry` consumes; `first_lucky` is an achievement
id — don't reuse). In `onRareHarvestEvent`, first time each fires, tiny auto-dismiss card, e.g.:

> **A Midnight Bloom 🌙** — Harvesting under a dark sky drew this out: a small gift, nothing spent.
> A calm, settled garden brings more moments like it.

Always *more moments / more wonder* — never a percent, never "more yield." Lucky needs its own
`firstcard_lucky` flag + fire point (no journal entry today).

### Daily Farm Moment — Option B (honest ambiance)
It has no mechanical effect; make it honest scenery rather than bolting on a hidden effect (a
known "misty days bloom better" rule would be a new timing variable to dread — forbidden).
1. Stop `unshift`ing into `harvestLog`; render `dailyMomentText` into a small italic **"Today ·"**
   strip at the **top of the Journal tab only** (no new chrome on the Farm grid).
2. Tappable → sheet: **Today's weather** — *Just the day's mood; the farm's weather, nothing to
   manage. Some days simply feel different.*
3. Soften forecast grammar: "…is promised." → "The afternoon turns warm and golden."; "smells of
   coming rain" → "Rain is in the air."

### The Garden Remembers
Subtitle under the `<h3>`: *A keepsake of moments your garden has lived. Nothing here ever fades.*
"About" link → sheet: **Your garden's memory** — *Each line marks a real moment your care created…
It's a keepsake, not a task: it never resets, and nothing you do here is ever wasted.*

## 3. Streak rework → "Days in the Garden"
Counter already increments once/calendar day. Make the gentle copy *true*:
- **Increment only:** first visit of a new day → `daysVisited += 1`.
- **Delete the reset branch** (the >3-day reset, milestone re-lock, clock-backwards check). Login
  bonus + milestones run after it — safe.
- Rename `streakDays → daysVisited`. **Retire `bestStreak`** (save/load, Stats row; repoint
  `quiet_year`/`streak_30`/`streak_100` achievements' `test` AND `progress` to `daysVisited`).
- Keep `lastStreakMilestoneDay` (→ `lastVisitedMilestone`) only as the already-awarded guard.
- Migration: `daysVisited = daysVisited ?? Math.max(streakDays||0, bestStreak||0)`.
- Milestones unchanged (7/14/30/100, same rewards); ladder stays (aspirational).
- 🔥 → 🌱 everywhere. Subtitle: "N days tended — and counting." **Delete the "Miss up to 3
  days…" penalty note.** Milestone toast label → "A garden milestone."
- **Name:** Days in the Garden (backups: Days Tended, Mornings in the Garden). No "streak"/flame.

## 4. Remove
- **Color legend** ("What do the colors mean?"): delete the button, `#activityHelpPanel`, and the
  toggle handler. Self-contained.
- Scarcity phrasing in the post-breath toast — replaced above.
- No persistent topbar chrome.

## 5. Pass check
Copy says *possibility/texture* ("more moments," "softer," "more alive"), never a number/percent/
"yield/coins." **Calm** sheets close on "never spent"; **harmony** closes on the honest "rests when
away, always comes back, never costs you anything"; the **waste** fear is answered by "tending is
never wasted." No sheet claims harmony is "lost"-proof.

# Design V2 — simplification and the roguelike turn

**Status: PROPOSED. Not approved. Do not build this yet.**
When the owner picks a direction, record it at the top of this file with the
date, then build.

---

## 1. The problem, measured

After playtest 2 the owner said: *"There seems to be too many things to be
keeping track of. I want it to be a bit more simplistic with a more creative
and fitting design."*

That is correct, and the cause is structural rather than cosmetic. Five of the
ten headline stats are near-perfect restatements of a faction bar. Measured
across every authored option in the game (`military` vs `staff.loyalty` etc.,
counting how often both appear in the same effect and move the same way):

| Stat | Faction | Appear together | Same direction |
|---|---|---|---|
| ELITE | Business | 13× | **100%** |
| SECURITY | Security | 23× | **100%** |
| MILITARY | Army | 24× | **96%** |
| STABILITY | Unions | 28× | **89%** |
| PUBLIC | Public | 49× | **76%** |

The player is reading the same underlying fact twice, in two different visual
languages, in two different places on screen.

Trackable numbers visible at once today:

| Surface | Count |
|---|---|
| Stat bar | 10 |
| Faction bars (7 × loyalty/power/patience) | 21 |
| Character moods | 13 |
| Budget lines | 11 |
| **Total** | **55** |

For comparison, the roguelikes this wants to sit beside run on far less.
*Slay the Spire*: HP, gold, energy, block. *Balatro*: chips, mult, hands,
discards, money. Their depth is in **cards and combinations**, not in the
dashboard. Depth should come from what the cards do to each other, not from
how many meters are on screen.

## 2. Design principle for V2

> **Few legible resources. Deep combinatorial content.**

Every number on screen must be something the player makes a decision about.
If a number is only ever an echo of another number, it is not a resource, it
is noise — delete it or derive it.

## 3. Proposed target

### 3.1 Resources: 10 → 3 (+1 derived)

| Resource | What it means | Absorbs |
|---|---|---|
| **MONEY** | What you spend. Also the shop currency. | treasury |
| **GRIP** | Can you make the state actually obey you? | power, security, information |
| **LEGITIMACY** | Do people accept that you should be there? | legitimacy, support |
| *Income* (derived, shown beside MONEY as `+$3/day`) | The economy as a rate, not a meter | economy |

Lose conditions become legible: **GRIP 0** = you are a figurehead and get
replaced. **LEGITIMACY 0** = the street removes you. **MONEY deeply negative**
= the state stops functioning.

### 3.2 Factions: 7 → 5, one number each

**Army · Security · Money · Workers · Street.**
One value per faction, −100 hostile to +100 devoted, shown as a mood not a
stack of bars. That removes 14 numbers on its own.

`power`, `influence` and `patience` stop being displayed and become hidden
modifiers the player infers from behaviour. The **Civil Service** and the
**Provinces** stop being tracked factions and survive as characters and card
sources — Grebs and Kostyn still matter, they just do not own a meter.

### 3.3 Hidden pressure → visible threat cards

Ten hidden variables currently surface only as prose warnings. Replace with a
small **threat tray**: when a faction or pressure crosses a line, a physical
card appears with an escalating stage and a countdown.

```
┌──────────────────────────────┐
│ ⚠ THE ARMY IS TALKING        │
│ stage 2 of 3 · 2 days        │
└──────────────────────────────┘
```

This keeps the warning-sequence design the game already has, but makes it an
object you can point at instead of a paragraph you have to read carefully.
At most two or three exist at a time.

### 3.4 Economy: ledger → one line

Drop the 11-line budget panel. Show `$42B` and `+$3/day`. Keep a short list of
**commitments** only when the player has made some, because those are
decisions. The full ledger was accurate and nobody needs it every turn.

### 3.5 Net effect

| Surface | Now | V2 |
|---|---|---|
| Resources | 10 | 3 |
| Faction numbers | 21 | 5 |
| Characters (as numbers) | 13 | 0 — they appear on cards instead |
| Budget lines | 11 | 1 + commitments |
| **Total** | **55** | **~9** |

## 4. The roguelike layer

The owner wants unique runs, shops and meta-progression. The simplification
above is the precondition: shops and relics are unreadable on top of 55
numbers.

### 4.1 Run structure

A run becomes **3 acts of ~6 days** (18 days) instead of 30 flat days. Each
act ends with a **confidence vote** — a real check against your current state
rather than an arbitrary day counter.

### 4.2 Between acts: The Back Room

A shop screen. Spend MONEY on:

- **Advisors** — permanent passives. *"Grebs: you see one extra option on any
  ministry card."*
- **Policies** — permanent rule changes. *"Emergency Powers: Grip losses
  halved; Legitimacy decays 1 per day."*
- **Favours** — one-shot cards playable at any time. *"A Quiet Word: cancel one
  threat card."*
- **Burn a file** — remove a card permanently from your run's deck.

### 4.3 Mandate — how you took power

Chosen or rolled at the start of each run. Sets starting factions and adds one
unique rule for the whole run.

| Mandate | Start | Rule |
|---|---|---|
| **The Stairwell** | Army +20, Legitimacy −20 | The Security faction knows something. It will use it once. |
| **The Landslide** | Street +30, Money −20 | Legitimacy decays every day. You have to keep feeding it. |
| **The Handover** | Money +30, Street −20 | Every shop is 25% cheaper. Every Street threat escalates faster. |
| **The Accident** | everything neutral | You draw one extra card per day. |

This is where "unique runs" actually comes from — not from procedural noise,
but from a rule that changes how the whole run plays.

### 4.4 Deck

Today, events are drawn from a global weighted pool. In V2 the player has a
**run deck** that shops add to and remove from. Situation cards still get
injected by the world, but a growing share of what you see is what you built.
That is the difference between "random things happen to me" and "I built this
run".

### 4.5 Meta-progression

Completed runs unlock mandates, advisors and cards for future runs. Small,
persistent, stored in `localStorage` next to the save.

## 5. Visual direction — the desk

**Direction: a flat, top-down desk layout. Mockup: `docs/mockups/desk.html`.**

Not skeuomorphic. No wood texture, no lamp, no perspective, no illustrated
objects. A dark surface divided into zones, where **every piece of information
has one permanent physical home** and nothing is behind a tab.

```
┌──────────────────────────────────────────────────────────────┐
│ NAMEPLATE        DAY · ACT · STAGE            MONEY GRIP LEGIT│
├────────────┬───────────────────────────────┬─────────────────┤
│ IN TRAY    │                               │ FILES           │
│ (stack of  │        THE DOCUMENT           │ (5 factions,    │
│  papers)   │        (current card)         │  one bar each)  │
├────────────┤                               ├─────────────────┤
│ TODAY      │        [ option 1 ]           │ ON YOUR DESK    │
│ (running   │        [ option 2 ]           │ (threat cards)  │
│  order)    │        [ option 3 ]           │                 │
├────────────┤                               │                 │
│ DIARY      │                               │                 │
│ (delayed   │                               │                 │
│  effects)  │                               │                 │
└────────────┴───────────────────────────────┴─────────────────┘
```

### Why this direction

- **It solves the tracking problem differently and better than hiding things.**
  Tabs were the old answer: fewer things on screen, but the player has to
  remember where everything lives and go looking. On the desk everything is
  always in the same place and always visible — which only becomes possible
  once the model is collapsed to ~9 trackables.
- **Consequences become spatial.** You stamp the paper, it slides off, and the
  Army folder jolts and its bar moves. Cause and effect are something you
  watch happen rather than a row of +/- pills.
- **It needs no illustration.** Flat shapes, type, and CSS. No art assets, so
  no risk of half-finished skeuomorphism.
- **It fits the roguelike layer.** The shop is a drawer that opens over the
  desk. The run deck is a card box. Advisors are business cards under the
  blotter. These are all desk objects, so the metaphor survives contact with
  systems UI instead of being a skin on one screen.

### Measured: it fits

The mockup was rendered at **1366×700** — the viewport where the V1 scroll bug
appeared — with a real card at full length (132 words including options). The
whole game fits with room to spare and **no scrolling anywhere**. That was the
main risk and it is resolved.

### Risks that remain

1. **Fixed viewport is a hard constraint.** Everything visible at once means
   everything must fit at ~1280×640. This caps card length (~150 words total),
   the faction count (5), and how many threat cards can be live (2–3). These
   are healthy limits but they are real and content must respect them.
2. **Below ~1100px wide the three columns cannot hold.** Needs a stacked
   fallback, or accept desktop-only, which the original spec already does.
3. **Execution risk, not concept risk:** a flat desk can read as "a dashboard
   with different labels" unless the physical cues are committed to — paper
   stock colour, real drop shadows, slight rotation, tactile motion, stamps.
   Half-committing is the failure mode.

### Rejected: full skeuomorphic desk

An illustrated 3D-ish desk was considered and rejected. Our cards average 132
words, which is 4–8× a *Reigns* card, so a readable "sheet of paper" has to be
roughly 700×500px — it *is* the screen, and the desk would only survive as a
picture frame around it. It would also need illustration assets that cannot be
produced to a good standard here, and it fights the shop and deck screens.

## 6. How to execute it

**Refactor, do not rewrite.** The engine is the good part and is content- and
presentation-agnostic: `effects.ts`, the scheduler, the weighted draw, the
alert weighting and the save system all survive unchanged. What changes is the
*shape of the state* and the *UI on top of it*.

Suggested order, each step shippable and playtestable on its own:

1. **Collapse the model.** 10 stats → 3, 7 factions → 5, one bar each. Migrate
   every existing card's effects with a mapping table. Bump `SAVE_VERSION`.
   Keep all 42 cards — only their numbers get remapped.
2. **Threat cards.** Replace prose-only warnings with the threat tray.
3. **Rebuild the screen as the desk**, from `docs/mockups/desk.html`. This
   replaces the briefing screen too: the morning briefing becomes the desk at
   the start of a day, with the in-tray full and the diary showing.
4. **Acts and the shop.** 3 × 6 days, Back Room between acts.
5. **Mandates.** Run-start rules.
6. **Run deck + meta-progression.**

Steps 1–3 answer "too much to track" and "more creative and fitting".
Steps 4–6 are the roguelike turn.

## 7. Open questions for the owner

1. How radical should the mechanical cut be — the full 3-resource collapse
   (10 → 3 stats, 7 → 5 factions), or something more moderate?
2. Simplify first and add the roguelike layer after, or do both as one V2?

Visual direction is settled: the flat top-down desk, per section 5.

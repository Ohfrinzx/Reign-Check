# Systems reference — how Reign Check works today

**What this file is:** the current behaviour of every game system, with
the file to open and the numbers that matter. It replaces the dated
"slice notes" that used to pile up in `AGENTS.md` and `CLAUDE.md`.

**When to update it:** in the same session you change a system. Describe
what the code does now, not how it got there; the history lives in
`docs/archive/`. If a number here disagrees with the code, the code wins,
so fix this file.

**Last checked against the code:** 2026-09-23. At that point there were
165 unit tests, `SAVE_VERSION` 14, and a clean build.

---

## 1. The run

- **Length:** 3 acts of 6 days, 18 days in all (`ACT_LENGTH`, `NUM_ACTS` in
  `state.ts`). The masthead and front page show the day within the act,
  "Day X / 6" (`dayInAct()`). `GameState.day` still counts 1–18.
- **A day:** morning upkeep (`engine.ts dayUpkeep()`), then the front page
  (`briefing` phase). Then 3–5 cards, one per stage, with the exact number
  depending on pressure; The Accident mandate adds one. Breaking alerts
  may interrupt between cards. Then the night summary and the Back Room.
- **Morning upkeep order**, which matters:
  1. scheduled consequences;
  2. projects;
  3. lapsed promises;
  4. commitments and timed deals;
  5. advisors and policies;
  6. the budget, and debt damage if the treasury is below 0;
  7. economy and support drift;
  8. hidden pressures and scandals;
  9. faction patience and fading goodwill;
  10. **faction memory** (`tickFactionMemory`);
  11. **hostility** (`tickHostility`);
  12. **demands** (`tickDemands`);
  13. character plotting;
  14. **crises** (`tickCrises`);
  15. **character events** (`tickCharacterEvents`);
  16. the mandate's daily rule.

  Queued cards (crisis stage, private file) come first in the day's deck.
- **Mandates** (`content/mandates.ts`): six starts. Four are always open
  (`stairwell`, `landslide`, `handover`, `accident`); two unlock through
  meta-progression (`clean-hands`, `pay-deal`). Each changes the starting
  numbers and adds a rule for the whole run.
- **Endings** (`content/endings.ts`): coup, revolution, elite, collapse,
  fracture, foreign, scandal, hollow and noConfidence are checked
  automatically. `sable-removal` and `general-strike` only come from a
  faction's move. `survival` is reaching the end. The regime label is
  named at the end from what you did (`regimeLabel()`).

## 2. What the player sees (display layer)

- `display.ts` turns 10 stats and 7 factions into 3 resources (Money,
  Grip, Legitimacy) and 5 visible factions:

  | Label | Engine faction id |
  |---|---|
  | Army | `staff` |
  | Security | `sable` |
  | Elites | `concord` |
  | Workers | `combine` |
  | Street | `chorus` |

  Civil Service (`grey`) and the Provinces are simulated but not shown.
- **Faction mood words** come from loyalty. The bottom mood (loyalty below
  `HOSTILE_BELOW`, 20) means **hostile**.
- **Hidden pressures are never shown as numbers**, only as warnings in
  words.
- **Option order is shuffled per run** (`engine.ts orderedOptions()`,
  seeded by run and card id, and the same after a reload). Everything goes
  through it: every card layout, the number keys, the tests and the probe.
  **Never render or choose from `card.options` directly.**

## 3. The confidence vote

- **When:** at the end of each act (day 6, 12, 18). The result is frozen
  into `GameState.confidenceVote` and revealed by `Vote.tsx`, then applied
  once (`completeConfidenceVote()`).
- **How it's counted** (`content/endings.ts computeConfidenceVote()`):
  - **Seats:** 100 in five blocs (`VOTE_SEATS`): Army 15, Security 10,
    Elites 20, Workers 25, Street 30.
  - **Each bloc's lean** = 0.6 × that faction's loyalty + 0.4 × (Grip +
    Legitimacy)/2, minus a debt penalty. The penalty applies when the
    treasury is below 0: 8 + half the debt, capped at 25.
  - **The share voting for you** runs from 0 at lean 30 to all at lean 70.
  - **A hostile faction's bloc votes against you as one.**
- **Needed:** `VOTES_NEEDED` = 45 / 58 / 68 of 100.
- **No dice.** Everything that goes into the vote is on screen.

## 4. Money

- **The daily budget** comes from `economy.ts computeBudget()`:
  - **Revenue:** lithium, ports, taxes (1.2 × economy), and Ilvet.
  - **Spending:** payroll, energy, security, corruption leakage, debt
    service, commitments, and **Pensions & subsidies** (+$0.06B a day for
    every day in office).
- **Below 0:** debt damages support, stability and power every morning.
  Debt also costs votes, and at −$38B the run ends in collapse.

## 5. Factions: demands, hostility, memory

**Demands** (`demands.ts`, words in `content/demands.ts`):
- **Who and when:** a visible faction with patience below `ISSUE_BELOW`
  (45), **or one that is hostile**, issues a request.
- **Escalation:** request → formal demand → ultimatum, `STAGE_DAYS` (2)
  days each, costing loyalty and patience at each step. At most
  `MAX_LIVE` (2) are live at once, and one new one per morning.
- **Meet:** pay the stage price (×1 / 1.25 / 1.5, then × any memory
  multiplier) plus that demand's side effects.
- **Bribe:** pay about a third of the price for 2 more days. The odds are
  shown in words, and a refused bribe can't be retried until the demand
  escalates.
- **When an ultimatum runs out** (`resolveLapse()`): the faction may try
  to remove you, with odds from `moveOdds()`, its power, and
  `FACTION_MOVES[f].defence`. A success ends the run, a failure has
  effects, and if it doesn't try it punishes you instead.
- **Patience** drains 2.2 a day for a faction below loyalty 40.

**Hostility** (`demands.ts tickHostility()`, words in
`content/demands.ts HOSTILE_ACTIONS`):
- A faction below loyalty 20 gets a pop-up the first morning.
- After that it takes one action every morning (3 per faction, rotating
  by day), shown on the front page and the desk card as "working against
  you" (danger 3 of 3), and loses 5 patience a day.
- The actions: the Army builds coup pressure; the Elites and Workers cost
  money; Security leaks; the Street raises unrest.
- Flags: `hostileSince:<id>`, `hostileAct:<id>`. It stops when the faction
  climbs back.

**Faction memory** (balance slice D; `consequences.ts`, words in
`content/consequences.ts`):
- **Feelings:** every mark (§8) lists how each visible faction feels
  about it: `factions: { combine: -2, … }`.
- **On screen:** the Files rail shows up to two lines per faction:
  "▲/▼ Remembers: you … (day N)".
- **Mood drift:** for `MEMORY_DAYS` (4) mornings after the decision, that
  faction's loyalty moves by the weight each morning.
- **Triggered demands:** a decision can make a faction issue a **specific
  demand** (`TRIGGERED_DEMANDS` in `content/demands.ts`, field
  `triggeredBy`).
  - It is issued the morning after, or as soon as that faction has no
    live demand, within 6 days.
  - It ignores patience and cooldown, but not `MAX_LIVE`.
  - It shows "Because you …", and is never drawn at random.
  - There are 8 of them, e.g. the Street demanding Vel's release.
- **Demand reactions** (`DEMAND_REACTIONS`): a memory makes meeting that
  faction's demands cheaper (×0.6) or dearer (×1.5), or rules out bribes.
  - The reason shows in the demand ("CHEAPER / DEARER · Because you …")
    and under a disabled Bribe button.
  - There are 14 of them.
- **Other factions' opinions:** `effects.ts RELATION_SPILL` (0.25) —
  gaining loyalty with one faction costs its rivals.
- **Fading goodwill:** loyalty above 60 slides back a little every morning
  (`engine.ts EXPECTATION_FROM`).

## 6. Characters: private files

- **Where:** `characterEvents.ts`, cards in
  `content/characterEvents.ts` and `content/characterRequests.ts`.
- **When:** one private file a day, from day 2.
- **Priority:**
  1. a **betrayal** (a character who is turning, and was warned on an
     earlier morning);
  2. an **offer** (someone devoted);
  3. a **request** from anyone else in post.
- **Rotation:** characters who haven't had a file yet this run are
  favoured.
- **Loyalty signals:** wavering is loyalty below 40, or plotting of 40+,
  or 2+ grievances with loyalty below 55. Turning is below 30. Devoted is
  72+.
- **A warning always shows at least one morning before a betrayal.**
- **Betrayals never end a run by themselves.**
- **Layout:** these cards use the "private file" layout
  (`CharacterCardView`).

## 7. Crisis chains

- **Where:** `crises.ts`, cards in `content/crises.ts`.
- **The five chains:** Bread Riots, the Free Zone Ledger, the Kordiva
  Referendum, the Ostrene Gas Cutoff and the Stairwell Tapes, each with 3
  stages.
- **Starting:** from day 4 (`START_DAY`), when a hidden pressure reaches
  the chain's `startAt` (45; 50 for the Tapes). One chain runs at a time,
  each only once per run, with a 3-day cooldown between chains.
- **Pacing:** stages come `STAGE_GAP` (2) days apart, and only after the
  last stage's card has actually been played.
- **Calm or hot:** options add to `flags['crisis:<id>']`. A score of 0 or
  more brings the **calm** version of the next stage; below 0 brings the
  **hot** one.
- **Ending early:** `flags['crisisEnd:<id>']` ends the chain (so does a
  favour).
- **Layout:** each stage plays in the full-screen dark **situation room**
  (`App.tsx` early return, `.app.situation-room`, `CrisisCardView`).

## 8. Consequences: decisions that come back

- **Where:** `consequences.ts`, words in `content/consequences.ts`.
- **Marks:** 24 of them (`MARKS`), each left by specific options (`setBy`
  lists the card id and option id).
  - Stored as the flag `mark:<id>`, holding the day it was made, and set
    in `engine.ts chooseOption()` through `applyEffects()`.
  - The result screen says "ON THE RECORD: You … (day N). This will come
    up again."
  - The rail's **On the record** panel lists them.
- **Card reactions:** 50 of them on 27 cards (`CONSEQUENCES`), applied by
  `shownOptions()`:
  - **unlock** (10) adds a new option: "NEW OPTION · Because you …", with
    a teal edge.
  - **change** (24) replaces an option's hint and outcome: "CHANGED ·
    Because you …", with a mustard edge.
  - **lock** (16) blocks an option, shown disabled with "✕ Because you …:
    <reason>". A locked option can't be chosen.
  - With `faction` set (10 of the 50), the reason ends "— the army
    remembers" (or the Sable Office / the Elites / the unions / the
    Street).
- **Rule for content:** no card may ever have every option locked. A test
  sets every mark at once and checks each reacting card still has at least
  two usable options.
- **Measured** (100 random-play runs): about 7.6 cards per run show a
  reaction, in 99% of runs. A blocked option appears in about 76% of runs.
  Faction-triggered demands average about 1.6 per run.

## 9. The Back Room (shop) and favours

- **Where:** `shop.ts`, content in `content/shop.ts`.
- **Items:** 55 — 14 advisors, 20 policies, 12 favours, 9 deals.
- **Opening times:** it opens every night. The nightly room offers 3 items
  and you can buy one. The act room (after a passed vote) offers 5
  including the expensive tier, and you can buy as many as you can afford.
- **Caps:** at most 3 advisors and 3 deals (`ADVISOR_CAP`, `DEAL_CAP`).
  Fire an advisor or cut a deal to free a slot.
- **The run deck:** some policies change which cards you get. `deck.add`
  makes a card more likely; `deck.remove` bans it for the run.
- **Look:** the Back Room is fullscreen and dark (`.app.dark.shop-full`).
  The only way out is its own Leave button.
- **Favours** (`favours.ts`, `FavourDialog.tsx`):
  - Each is **aimed** at a named scandal, a faction's demand, or the
    running crisis, and ends with a **receipt** of what went away.
  - The rail says "Useful now: …" or "Keep it for: …".
  - A favour with nothing to aim at is disabled, with the reason shown.
- **Pricing:** run `src/game/__tests__/shop.probe.ts` before changing any
  shop rule.

## 10. Meta-progression (across runs)

- **Where:** `meta.ts`. It has its own localStorage key
  (`dictator-sandbox:legacy:v1`) and its own `META_VERSION`, deliberately
  separate from the run save and `SAVE_VERSION`.
- **The record:** every finished run is recorded (capped at 50), and the
  title screen shows a one-line summary.
- **Unlocks:**
  - Two mandates (`MANDATE_UNLOCKS`) and two rare shop items
    (`SHOP_UNLOCKS`) unlock by playing.
  - What's unlocked is a snapshot taken when a new game is created, so
    unlocking something mid-run applies to the next run.
  - The Unlocks screen (`Progress.tsx`) opens from the title screen and
    from a tab in Advisors & Deals.

## 11. Balance, measured

- **Tool:** the balance probe (`src/game/__tests__/balance.probe.ts`,
  printed by `balance.test.ts`, 120 runs per policy).
- **Policies:**
  - `random`;
  - `first` / `last` (the option in that position as shown, which is
    shuffled per run);
  - `careful`: picks the option that leaves the visible position best 3
    times in 4, and misjudges the rest.
- **Latest numbers:**

  | Policy | Survives |
  |---|---|
  | Careful | 59% |
  | Random | 3% |
  | Always first | 3% |
  | Always last | 3% |

- **The owner's target is "Hard"**, where careful human play survives
  about half the time.
- **Most runs end at the confidence vote.**
- **Re-run the probe after any change to numbers, and report what moved.**

# Systems reference — how Reign Check works today

**What this file is:** the current behaviour of every game system, with
the file to open and the numbers that matter. It replaces the dated
"slice notes" that used to pile up in `AGENTS.md` and `CLAUDE.md`.

**When to update it:** in the same session you change a system. Describe
what the code does now, not how it got there; the history lives in
`docs/archive/`. If a number here disagrees with the code, the code wins,
so fix this file.

**Last checked against the code:** 2026-10-07 (full audit before the
balancing pass; every count and number below re-read from the code). At
that point there were 299 unit tests, `SAVE_VERSION` 14, and a clean build.

**Balancing?** Read `docs/BALANCE.md` too: every tunable number and where
it lives, how the probe works and its blind spots, the baseline, and the
change log every balance change must be recorded in.

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
  15. **mini-game triggers** (`tickMinigames`: an officers' plot, §12);
  16. **character events** (`tickCharacterEvents`);
  17. the mandate's daily rule.

  Queued cards (crisis stage, a triggered mini-game, private file) come
  first in the day's deck. Then, from day 2, one of the drawn cards is
  replaced by the daily mini-game (§12).
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
- **What the three are made of** (`GRIP_PARTS`, `LEGITIMACY_PARTS`, the
  same constants `computeResources()` uses):
  - **Grip** = Power 45%, Security 25%, Military 15%, Information 15%.
  - **Legitimacy** = Legitimacy 50%, Support 35%, Stability 15%.
  - **Money** = the treasury. The Economy sets most of the daily income.
  - **Elite** feeds none of the three (it matters for the Elites' ending
    and their attempt to replace you).
- **The ten numbers are explained in the game** (owner, 2026-10-05: "No
  where is it explained in my game what information means or what it
  effects"). One source, `display.ts STAT_GUIDE` / `statGuide()`: each
  stat's player name (`STAT_PLAYER_LABEL`), what it feeds, and what it
  does, high and low. Used by:
  - **result pills** (`DeltaPills.tsx`, on card results and favour
    receipts): "INFORMATION +7.0 → GRIP" (no arrow on Legitimacy and Money,
    which are top numbers, or on Elite), and a **What do these mean?**
    button that opens one line per pill (a button, not hover);
  - **Brief me**: a section "The numbers under the three", one card each;
  - the **night summary**: the same names, plus a line saying what Grip
    and Legitimacy are made of;
  - the **Grip / Legitimacy / Money explanations** in the top bar
    ("Made of: …").
  If a rule behind one of these words changes (upkeep drift in
  `engine.ts`, `briefing.ts`, `effects.ts` coupling, endings,
  `FACTION_MOVES` defences), change `STAT_DOES` in `display.ts` too.
- **What Information does**, as an example of the detail: 15% of Grip;
  the lower it is, the faster leaked papers pile up (they become scandals
  and leak emergencies), and high Information dries them up; below 35 the
  front page drops the milder warnings; below 30 Support gains are cut by
  a quarter; above 72 the front page says you know what is happening; it
  is one of three things that protect you if Security tries to remove you.
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
  - **Each bloc's lean** = 0.6 × that faction's loyalty + 0.4 × that bloc's standing, minus a debt penalty. Army and Security
    standing is 80% Grip / 20% Legitimacy; Elites 50/50; Workers 30/70;
    Street 20/80. Debt penalty is 0.75 × debt in $B, capped at 25,
    starting continuously from zero.
  - **The share voting for you** runs from 0 at lean 30 to all at lean 70.
  - **A hostile faction's bloc votes against you as one.**
- **Needed:** `VOTES_NEEDED` = 45 / 58 / 68 of 100.
- **No dice.** Everything that goes into the vote is on screen.

## 4. Money

- **The daily budget** comes from `economy.ts computeBudget()`:
  - **Revenue** (e = economy ÷ 50, so 1.0 at a middling economy):
    lithium & salt 1.7 × e, port fees 0.8 × e, taxes 1.2 × e, the Ilvet
    Free Zone 0.35 (+0.3 with the ordinary-card transit levy). A Back Room levy pays its +0.3 through a commitment instead, never both; cutting that deal stops its income.
  - **Spending:** payroll 2.05, energy imports 0.5, police & armed forces
    0.6, corruption leakage (corruption ÷ 50), debt service (fiscal strain
    ÷ 42), **Pensions & subsidies** (0.06 × (day − 1)), every commitment
    (standing cost) and project upkeep. All in $B a day.
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
  escalates. An accepted bribe (like Meet) closes that demand's pop-up; a
  refused one leaves it open so Meet is still one tap away.
- **When an ultimatum runs out** (`resolveLapse()`): the faction may try
  to remove you, with odds from `moveOdds()`, its power, and
  `FACTION_MOVES[f].defence`. A success ends the run, a failure has
  effects, and if it doesn't try it punishes you instead.
  - **The Army is different (Phase 5):** if it tries, there is no dice
    roll. Its coup is played that morning as **Hold the Palace** (§12).
    Its success odds set how many columns come. Lose and the run ends in
    a coup; win and the failed-coup effects apply.
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
  - There are 13 of them: 8 from decisions (e.g. the Street demanding
    Vel's release) and 5 from Budget Night walk-outs ("… wants its budget
    back", §12).
- **Demand reactions** (`DEMAND_REACTIONS`): a memory makes meeting that
  faction's demands cheaper (×0.6) or dearer (×1.5), or rules out bribes.
  - The reason shows in the demand ("CHEAPER / DEARER · Because you …")
    and under a disabled Bribe button.
  - There are 29 of them: 14 from decisions, 3 from Hold the Palace and
    the Bulletin, 2 from Find the Mole (arrested → Security cheaper,
    exposed → dearer) and 10 from Budget Night (generous → cheaper,
    walked out → dearer, one pair per faction).
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
- **Marks:** 46 of them (`MARKS`). Most are left by specific options
  (`setBy` lists the card id and option id): 24 by ordinary cards, 3 by
  Hold the Palace and the Bulletin, 4 by Find the Mole's choices
  (`mole-arrested`, `mole-turned`, `mole-fired`, `mole-exposed`). 15 are
  set by a result instead of an option (`setBy: []`, listed in
  `CardOutcome.marks`): Budget Night's `budget-generous-<f>`,
  `budget-walkout-<f>`, `budget-claim-<f>` for the five factions.
  - Stored as the flag `mark:<id>`, holding the day it was made, and set
    in `engine.ts chooseOption()` through `applyEffects()` (a mark is set
    once per run; a repeat keeps the first day).
  - The result screen says "ON THE RECORD: You … (day N). This will come
    up again."
  - The rail's **On the record** panel lists them.
- **Card reactions:** 54 of them on 27 cards (`CONSEQUENCES`), applied by
  `shownOptions()`:
  - **unlock** (12) adds a new option: "NEW OPTION · Because you …", with
    a teal edge.
  - **change** (26) replaces an option's hint and outcome: "CHANGED ·
    Because you …", with a mustard edge.
  - **lock** (16) blocks an option, shown disabled with "✕ Because you …:
    <reason>". A locked option can't be chosen.
  - With `faction` set (12 of the 54), the reason ends "— the army
    remembers" (or the Sable Office / the Elites / the unions / the
    Street).
  - The Find the Mole marks drive 4 of them, all on "A Reporter Has the
    Documents" (`alert-leak`).
- **Rule for content:** no card may ever have every option locked. A test
  sets every mark at once and checks each reacting card still has at least
  two usable options.
- **Measured** (100 random-play runs, 2026-09-23 — before the mini-game
  marks; not re-measured since): about 7.6 cards per run show a reaction,
  in 99% of runs. A blocked option appears in about 76% of runs.
  Faction-triggered demands average about 1.6 per run.

## 9. The Back Room (shop) and favours

- **Where:** `shop.ts`, content in `content/shop.ts`.
- **Items:** 55 — 14 advisors, 20 policies, 12 favours, 9 deals.
- **Opening times:** it opens every night. The nightly room offers 3 items
  and you can buy one. The act room (after a passed vote) offers 5
  including the expensive tier, and you can buy as many as you can afford.
- **Starting toolkits:** on nights 1, 7 and 13, one of the three offers comes
  from the mandate's four-item `shopFocus` list, if eligible. Existing
  unlocks, purchase history, recent-offer exclusions and tier rules still
  apply. The other slots remain random; exhausted toolkits fall back to
  normal stock. The shop explains this on those nights.
- **Benefits match purchases:** the Convocation Clerk adds 0.3 loyalty to
  every faction each morning, with 0.5 corruption; firing ends that rule.
  The Pigeon endorsement adds 4 Support immediately, then 1 on each active
  morning. Its four-day countdown expires before the fourth morning, so
  there are three daily ticks; cutting it also ends the daily gain. Daily
  rules can now include faction effects and belong to active deals too.
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
  | Careful | 68% |
  | Random | 5% |
  | Always first | 5% |
  | Always last | 1% |

  (2026-10-07, after slice 3 part B. Careful was 63% before the mole
  choices; the arrest — the probe's choice on a won Find the Mole — and
  its mark add a few points. At 120 runs the probe moves ±4 points, at
  400 runs ±3, with any small change: see `docs/BALANCE.md` §3.)

  The probe plays mini-games as a result: `careful` wins 70% of them
  (`MINIGAME_SKILL`), the others half. Owner: careful play should be
  rewarding (~60%); mini-game win rewards were sized to get there (slice
  1 alone had dropped it to 46%).

- **Current target (2026-10-07)** supersedes the historical targets:
  intentional, learned decisions plus good mini-games should win nearly
  always; random decisions should remain weak. `docs/STRATEGIES.md` holds
  current per-start evidence and routes. The old probe is historical only;
  `tools/strategy-runner.mjs` measures starts, management and skill separately.
- **Most runs end at the confidence vote.**
- **Re-run the probe after any change to numbers, and report what moved.**

## 12. Mini-games (Phase 5)

- **Where:** rules in `src/game/minigames/` (one file per game; when
  they appear in `index.ts`); words and results in `content/minigames.ts`
  (slice 3's games each have their own file: `content/mgMole.ts`,
  `mgBudget.ts`, `mgPigeon.ts`, `mgStairwell.ts`, `mgAmbassador.ts`);
  screens in `src/ui/minigames/`.
- **A mini-game is a card** with a `minigame` key and two options, `won`
  and `lost`. The player never sees them as buttons: the full-screen game
  picks one when it ends (`engine.ts finishMinigame()`, which also stores
  how well it went, 0–100, in `flags.mgScore` for the result text). So
  every effect goes through `applyEffects()`, and the tests and the probe
  play past a mini-game with `chooseOption()`.
- **Each result replaces the previous result facts:** `finishMinigame()`
  converts supplied score/jar/mole facts into deltas for the additive flag
  system. Scores are clamped to 0–100. An old score cannot inflate a later
  reward tier, and an old Budget walk-out/surplus cannot be charged again
  when the new jars clear it. Historical faction memories and already
  incurred debts remain; only the current result facts are replaced.
- **The screen** (`MinigameScreen.tsx`, an `App.tsx` early return): a
  short title card first ("Mini-game", the name, one line of what is
  happening; ~2–2.5 s, its own style per game, tap or Enter skips — owner:
  the hard cut was "really abrupt"), then the story (built from the run), how to play (with what winning and losing
  mean), the game, a result stamp, then the card's outcome. The three
  resources stay visible. There is no skip; **Give up** asks first and
  counts as a loss. **A reload restarts the same game** at its story: the
  layout comes from `minigameSeed()` (run seed + card + day), so nothing
  extra is saved and `SAVE_VERSION` did not change.
- **Owner's rules for results:** a loss costs Legitimacy and the loyalty
  of the faction the game is about; a win is a reward worth chasing
  (current target: learned decisions and good mini-games win reliably). A daily win: Legitimacy +5, a stat bonus, +2 with
  the game's faction and **+0.5 with every faction** (that last part
  matters most: the vote leans on loyalty). A daily loss: Legitimacy −4
  or −5, the faction −4, and the game's pressure up. Results can leave a
  mark (the factions remember them, §8).
- **When they appear:**
  - **Daily:** from day 2 (`DAILY_FROM_DAY`), one drawn card is replaced by
    a daily game (`DAILY_MINIGAMES`, eight: the Bulletin, Bread Lines,
    Shred the Ledger, Find the Mole, Budget Night, The Pigeon Run, Who Was
    in the Stairwell?, The Ambassador's Table), at a
    random point in the day; never a queued card and never yesterday's
    game. Never on an act's first day (that day opens with The Last
    Kilometre). Picked by a hash of seed and day, not the run's RNG.
    **Events pick the game** (`eventMinigames()`, most urgent first):
    the Free Zone Ledger crisis → Shred the Ledger; the Bread Riots or a
    hostile Street → Bread Lines; the Ostrene gas cutoff or foreign
    pressure 60+ → The Ambassador's Table; the Stairwell Tapes (or scandal
    50+ on the Stairwell mandate) → Who Was in the Stairwell?; a hostile Sable Office, a character
    about to turn on you, or leaks at 62+ → Find the Mole; debt or a
    Workers/Elites demand → Budget Night; separatism 50+ → The Pigeon Run.
    **An event never brings yesterday's game** (`eventMinigame()`): the
    next event, or the usual draw, gets the day, so a long debt brings
    Budget Night at most every other day.
  - **An officers' plot:** from day 3, when hidden coup pressure reaches
    `PLOT_AT` (52, the front page's "The army is talking"), Hold the
    Palace comes that morning, **once per act**. Losing is a heavy hit,
    not the end. Measured: about 8% of careful runs see one.
  - **The Army's strike:** its lapsed ultimatum (§5). Losing ends the run.
  - A day with a triggered game gets no daily one.
- **Hold the Palace** (`palace.ts`; dark night map). A 5×6 grid of the old
  town, the Palace gates below it. Rebel columns enter at the top on a
  schedule (flares warn one turn ahead) and move a block a turn (trucks
  two). Three Guard units, **one order a turn** (move one block, diagonals
  too, never above the cordon; moving onto a column attacks it: ordinary
  columns surrender, armoured ones need two attacks). Columns swerve round
  a roadblock or stop. The gates take one column (two with the
  `vetted-garrison` mark); the next breaks them. Win when every column is
  stopped or dawn comes. Difficulty by act (plot) or by the Army's odds
  (strike). A greedy bot wins about 90% (act 1), 73% (act 2), 64% (act 3)
  and 40–64% (strike); doing nothing always loses. Results: plot won →
  coup pressure −30, Army power −10, Legitimacy +5; plot lost →
  Legitimacy −8, Grip stats down, Army loyalty −6; strike won → the
  failed-coup effects + Legitimacy +3; strike lost → the coup ending.
- **The 7pm Bulletin** (`bulletin.ts`; bright TV studio). 8/9/10 stories
  (by act), about half damaging, built from the run: your hottest
  scandals, decisions from the last two days, the pressures the front
  page warns about, plus fillers and "twists" (the second line changes
  the meaning). Each story has a clock (7 / 6.5 / 6 s by act; ×1.5 with Reduce
  Motion), which starts only once the story has slid in (owner,
  2026-10-05: not enough time to read; was 5 / 4.5 / 4 s); spike it or run it (swipe, buttons, ← →). An untouched story
  airs. Spikes = the damaging stories (+1 with `bought-news`, −1 with
  `threatened-loz`). Win with at most 2 mistakes. Won → Legitimacy +5,
  support +3, scandal pressure −6, Street +2, every faction +0.5; lost →
  Legitimacy −4, support −2, Street −4, scandal +5. (The Bulletin is the
  one reading game; owner: "2–3 games with mainly reading is fine", the
  rest should not feel like more reading.)
- **Bread Lines** (`breadlines.ts`; a sunlit street plan, Street).
  Real time (45 s), simulated in 100 ms steps. Seven districts flare up on
  a schedule; anger climbs (6.5 / 8 / 8.5 a second by act); at 100 a
  district burns; more than one burnt district loses. Two negotiator
  teams (2 s to arrive, then talk anger down; the district stays calm
  14 s) and two police squads (instant, but the district flares again 7 s
  later from 42 and 1.5× faster; only 5–6 baton charges a game). A
  human-paced bot (talk if there is time, police if hot) wins about 100 /
  80 / 73% by act; talking only fails from act 2; doing nothing always
  loses. Won: Legitimacy +5, stability +4, unrest −10; lost: −4, −4, +6.
- **The Last Kilometre: Walk in the Weather** (`weather.ts`; the act
  opener; a flat side view of a rainy avenue; Workers). Played first thing
  on the first day of every act (days 1, 7, 13), instead of that day's
  daily game (`ACT_OPENER`; owner: "like it's a new year", harder each
  act). The Chair walks the Dovra Day kilometre under an umbrella; gusts
  push it over (leaves blow in from that side 0.65 s before); hold ← or →
  to push back. Upright (within 20°): dry. Leaning: soaking, more the
  further it leans. Past 58° it turns inside out: +22 soak and 0.7 s with
  no grip. Reach the steps (30–40 s) before the soak meter fills.
  Drizzle → wind → storm (with lightning) by act; half a level worse while
  scandal pressure is 50+ (the weather shows how honest the government
  is); the `walked-dovra` mark widens the dry zone by 4°. A gust is never
  much stronger than the player's push, so it is always holdable.
  Simulated walkers (reaction 150 ms watching the leaves / 230 / 350 ms):
  100 / 100 / 73% (act 1), 100 / 100 / 7% (act 2), 97 / 58 / 0% (act 3);
  doing nothing always loses. **Sets the tone:** won → Legitimacy +7,
  support +4, every faction +1.5, Workers +2; lost → Legitimacy −7, support
  −4, every faction −1, Workers −3. (It replaced a rhythm game of the same
  name, whose look the owner did not like twice; the card id
  `mg-parade` was kept so saves still find it.)
- **Shred the Ledger** (`shred.ts`; a dark walnut desk, Elites). Papers
  ride two conveyor belts into the auditors' box, in waves that speed up.
  Tap a paper with the red square Ilvet stamp to shred it before it
  reaches the box; everything else must reach the box. Some papers arrive
  **face-down** (42–48%): the first tap turns one over, the second shreds
  it. Shredding a clean paper jams the shredder for 1.2 s (the belts keep
  moving); a dirty paper in the box is evidence. One mistake allowed. All
  tricks from act 1: VOID (a crossed-out red stamp, clean), a round red
  seal (clean), a pale red stamp (dirty). Speed (`SHRED_SPEED`):
  1.4× / 1.7× / 2× the previous tuning in acts 1 / 2 / 3, with more waves
  so a game lasts about as long. A paper crosses in 2.7 → 2.0 s (act 1,
  4 waves), 2.2 → 1.7 s (act 2, 5 waves), 1.9 → 1.4 s (act 3, 6 waves).
  History: static piles were "too easy" (2026-10-02); the first belts
  "still way too easy"; a quick player's tuning was then made *"2-3 times
  as fast"* (2026-10-03); after playing it the owner set act 1's 2× as
  the top difficulty (*"The first level is really what the top difficulty
  should be"*, 2026-10-04). Simulated players (one paper at a time, the
  odd mistap; very quick 70–100 ms / expert / fast / average):
  82 / 61 / 42 / 2% (act 1), 76 / 50 / 15 / 0% (act 2), 68 / 30 / 0 / 0%
  (act 3). Every paper is still reachable and doing nothing always
  loses. Won: Legitimacy +5, scandal −10; lost: Legitimacy −5, scandal +8.
  **Number keys (laptops):** with a mouse or trackpad (`any-pointer:
  fine`), each paper shows a digit; pressing it is the same as tapping the
  paper (owner, 2026-10-06: trackpad players "can't click the papers fast
  enough"; chose single digits). Digits are handed out 1 → 9, 0 in turn
  (`assignKeys()` in `shred.ts`), skipping any still on the belts plus
  0.25 s, so no two papers on screen share one (up to 10 can be on the
  belts at once, so all ten digits are used; a test checks 300 seeds per
  act). No randomness, so layouts are unchanged. Held keys don't repeat.
  Phones show no numbers.
- **Input:** real-time games act on pointer-down (a tap never also lands
  as a click on whatever appears under the finger next); keys too (Bread
  Lines 1–7 then T/P, the Kilometre ← → held, Shred the number on a paper). The
  clock (`useClock`) stops while "Give up?" asks and never jumps more than
  100 ms a frame, so a locked phone pauses the game.
- **Find the Mole** (`mole.ts`; dark, a night security camera; Security;
  slice 3). A floor plan of the Interior Ministry's night floor: six
  rooms off a corridor, lift at one end, stairs at the other. The contact
  (grey coat, amber box) comes up in the lift, visits 4–5 rooms over about
  42 s (36–52), and leaves. **The real meeting:** the mole is alone with
  the contact in a room and a white envelope changes hands. **Decoys:**
  people passing in the corridor, groups of 2–3, and lingerers alone with
  the contact as long as the mole (from act 2 they may hand over a coffee
  — not a clue). **Camera blackouts** (act 2+) cover a room with static;
  never the envelope, never more than 40% of the meeting. Tap a person
  (or their name in the staff list) to mark a suspect; on laptops each
  person shows a number. Then a **line-up** (20 s; 30 with Reduce Motion):
  pick one, confirm "Name the …". Wrong name or none loses. By act
  1 / 2 / 3: staff 5 / 6 / 8; walking speed 22 / 25 / 28; real meetings
  2 / 1 / 1; alone together 3.8 / 3.2 / 2.6 s; envelope on screen 1.5
  (big, ringed) / 0.9 / 0.8 s; lingerers 1 / 1 / 2; blackouts 0 / 2 / 3.
  Simulated watchers (attentive / average / distracted): 99 / 94 / 87%
  (act 1), 96 / 89 / 70% (act 2), 80 / 57 / 34% (act 3); a random guess
  ~1 in N; doing nothing always loses. 
  **What happens to the mole** (owner, 2026-10-06): a right name opens
  four choices (keys 1–4 on laptops), each its own card option and mark
  (`MOLE_CHOICES`; the job is stored in `flags.mgMole` for the text):
  **arrest** (`won`; Legitimacy +4, Security +4, leaks −12, fear +5, Sable
  +2, Street −2; mark `mole-arrested`), **turn** (Legitimacy +3, Security
  +6, leaks −6, scandal −8, Sable +3; `mole-turned`; the follow-up card
  `mole-double` four days later: feed one more story — a scandal if leaks
  are 45+ or Security under 40 — bring them in, or pay their way out),
  **fire quietly** (Legitimacy +4, Security +3, leaks −8; `mole-fired`),
  **expose** (Legitimacy +7, support +4, leaks −10, Street +3, Sable −3;
  `mole-exposed`). Every faction +0.5 on any win. The marks change "A
  Reporter Has the Documents": turned → a new "forged pages" option;
  arrested → a surer Find the Source; exposed → the injunction backfires
  harder; fired → a quiet word with the night floor. Arrested makes
  Security's demands cheaper, exposed dearer. Lost: Legitimacy −4,
  Security −3, leaks +6, Sable −4.
- **Budget Night** (`budget.ts`; bright, a Finance Ministry desk; Workers;
  slice 3). Owner: 90 seconds, *"plenty of time but still can't just sit
  there"*. Five jars (Army, Security, Elites, Workers, Street) and a $30B
  pot; each jar has a line (the least it accepts; a jar holds up to
  $14B). + / − move $1B between the unspent money and a jar (laptops: 1–5
  pick a jar, ↑ ↓ move). Below its line a jar's patience drains; at or
  above, it recovers; at 0 the faction **walks out** and its jar is
  sealed with its money in it. One walk-out allowed; the second loses;
  20:00 wins. Brask's first draft leaves one jar $2–3B short, so you act
  from second 0. **The jar in most danger flashes red with a "!"**
  (`dangerJar()`). **Events** on a seeded schedule, each on a slip a few
  seconds ahead: a line moves, a **cut** (from the unspent money first,
  then money above a line, then the fullest jar), or more money.
  **Squeezes:** at set points the lines add up to more than the pot, so
  someone must wait. Every evening is checked at layout (up to 40 tries):
  an expert must win it, doing nothing must lose it, and it must have a
  squeeze. **Retuned 2026-10-06** (owner: *"I have yet to even make it to
  the vote"*; chose "slower and clearer"). By act 1 / 2 / 3: drain 6.5 /
  8.5 / 9 a second (a walk-out ~15 s below the line in act 1; was 12 /
  13.5 / 14), recover 5 / 4 / 3.5, warning 5 / 4.5 / 4 s, squeezes 1 / 2 /
  2 (act 1's about 9 s, no swap needed), event gap 8–10 / 7–9 / 6.5–8.5 s.
  Simulated (attentive / average / slow; average and slow only act once a
  line turns red): 100 / 100 / 98% (act 1), 98 / 71 / 41% (act 2), 95 /
  51 / 26% (act 3); idle 0%. Reduce Motion: the evening runs 1.5× slower
  and the highlight holds still. Won: Legitimacy +5, stability +3, budget
  strain −8, Workers +2, every faction +0.5; lost: Legitimacy −4,
  stability −3, strain +5, Workers −4.
  **The jars at eight** (owner, 2026-10-06; `budgetAftermath()` in
  `content/mgBudget.ts`, fed by `budgetFlags()` → `bnDiff:<faction>`,
  `bnOut:<faction>`; win or lose): each faction judges its own jar. **Over
  its line:** loyalty +1 per $1B (up to +4); $3B+ over goes on the record
  (`budget-generous-<f>`: mood up, its demands ×0.6). **Short at eight:**
  −1 per $1B (down to −3). **Walked out:** loyalty −5, on the record
  (`budget-walkout-<f>`: mood down, its demands ×1.5), and it comes for its
  money, one of three ways (the run's RNG): a **demand** the next morning
  ("… wants its budget back", $3B base, via `budget-claim-<f>` and
  `TRIGGERED_DEMANDS`), **daily repayment** (shortfall × 1.25 over 5 days,
  a standing cost), or **the full sum in four days** (shortfall × 1.4, a
  scheduled cost). The result text lists every jar that moved. A card
  result can now carry its own marks (`CardOutcome.marks`).
- **The Pigeon Run** (`pigeon.ts`; a daylight sky over the Hadem hills;
  Army; slice 3). Drovna jams the radio, so the order to the border
  garrison goes by pigeon. **Hold to climb, let go to glide** (owner's
  pick over three lanes): hold anywhere on the game (touch or mouse), or
  Space / ↑ / W. Physics in 25 ms steps: climb 150 u/s² up to 52 u/s,
  glide down 115 u/s² up to 46 u/s, in a sky 100 units tall; the top is a
  soft limit. 40 s to the garrison. **Hits** cost a feather: hills and the
  valley floor (it bounces up), storm clouds (it flies through), and
  hawks — a hawk circles, then shows its dive as a red dashed line with a
  target ring (aimed where the pigeon is heading), then strikes. 1.3 s
  safe after a hit. **3 feathers** (the third hit loses); **the Pigeon
  Federation's champion** — when you helped the Federation earlier
  (flags `pigeonFriend` / `pigeonPatron`) — has 4. Every course follows a
  flyable guide path, with a way through at least 18 units wide; a
  planner proves the tested courses can be flown without a hit. By act
  1 / 2 / 3: speed 30 / 33 / 36; hawk strikes every 4.0–5.2 / 3.3–4.4 /
  2.8–3.7 s, a second hawk close behind 0 / 20 / 30%; warning 1000 / 900 /
  800 ms. Simulated (reaction 150 / 250 / 350 ms): 100 / 84 / 47% (act
  1), 89 / 59 / 20% (act 2), 67 / 34 / 4% (act 3); with the champion
  100 / 94 / 73, 98 / 87 / 32, 88 / 59 / 9%. Doing nothing, or holding
  all the time, always loses. Reduce Motion: 2/3 speed, no shake or
  flashes. Won: Legitimacy +5, Power +3, separatism −10, Army +2, every
  faction +0.5; lost: Legitimacy −4, Power −3, separatism +6, Army −4.
- **Who Was in the Stairwell?** (`stairwell.ts`; dark, a Sable Office
  archive under a desk lamp; the Street; slice 3 part B). A calm logic
  puzzle, no clock. Krast fell at 21:40; each file is a few typed
  statements about where people were at that minute ("X was in P", "X was
  not in P", "I was with X", "Nobody was in P", and from act 2 "X is
  lying" / "X is telling the truth"). Exactly one person lies (every one
  of their statements is false); exactly one person was in the stairwell.
  Eight places on a three-floor plan; tapping a line lights its place.
  Strike lines out as notes. Stamp one file LIAR and one IN THE STAIRWELL
  (stamps can be moved or lifted), then **Close the case**: a wrong
  stairwell name loses; score 100 with the right liar too, 60 without. By
  act 1 / 2 / 3: files 4 / 4 / 5, about 8 / 12 / 15 statements, accusation
  lines 0 / 1+ / 2+, a truthful red herring on the landing from act 2.
  Every puzzle is checked at layout (`stairwellSetup` + a solver) to have
  exactly one answer, reachable by plain deduction (`reasonOut`). Careful
  solver 100% in every act; a guess ~1 in N; "take whoever says they were
  in the stairwell" ~40%. Laptops: 1–5 files, ← → ↑ ↓, X strike, L / S
  stamp, Enter close. Phones: one file at a time behind tabs. Won:
  Legitimacy +5, support +3, scandal −10, Street +2, every faction +0.5;
  lost: Legitimacy −5, support −2, scandal +8, Street −4.
  **Picked by** the Stairwell Tapes crisis, or scandal 50+ on the Stairwell
  mandate.
- **The Ambassador's Table** (`ambassador.ts`; a candlelit claret dining
  room; the Elites; slice 3 part B). Five courses, five rounds, no clock.
  Gas is priced per 1,000 m³; he opens at $430–500. Each round: an offer
  (his price, or $20 / 40 / 60 / 80 under it; laptops 1–5) and a line
  (Flatter him, Shared history, Stand firm, Mention Sereth; 6–9), then
  Enter. At or above his secret floor he signs; below it he refuses,
  concedes a quarter of the way, and loses patience (more the further
  under); the line adds or takes patience by his hidden temper (vain /
  proud / trader / nervous). Patience 0: he walks out. No deal by dessert
  loses. **Tells** (face, glass, notebook): relaxed (60+) / irritated /
  about to stand (under 30), also written in words; act 2 freezes one tell
  at "relaxed", act 3 has one tell show a level too calm (two always stay
  honest). **Kel Brask's limit** (shown from the start: "Do not sign above
  $X"): a deal over it is a loss ("Over the limit"); the limit sits 0.4 /
  0.35 / 0.3 of the gap above his floor (never under $20 above it), so a
  deal under the limit always exists. Score 0–100 from his ask to his
  floor. **The better the price, the bigger the gain:** 85+ Legitimacy +6,
  economy +6, $1B, foreign −12, Elites +3; 75–84 Legitimacy +5, economy +4,
  foreign −10, Elites +2; under 75 Legitimacy +2, economy +2, foreign −6,
  Elites +1 (every faction +0.5 / +0.5 / +0.3). Lost: Legitimacy −4,
  economy −3, foreign +6, Elites −4. By act 1 / 2 / 3: annoy 6 / 8 / 10,
  hit 10 / 12 / 18. Simulated (win % / average score): a careful tell
  reader 100/95, 91/96, 84/90; a face-glancing reader 100/95, 81/96, 73/90;
  greedy 11 / 0 / 0%; caving (his price) 0%; timid 11 / 26 / 26%; offering
  just under the limit at once 100% but score ~71 (the small reward).
  **Picked by** the Ostrene gas cutoff or foreign pressure 60+.
- **Practice:** `?practice=palace|strike|bulletin|bread|kilometre|shred|mole|budget|pigeon|stairwell|ambassador`
  (optional `&seed=`, `&act=`) opens one game on its own, never saved —
  for playtesting. The browser tools use it too (`&freeze` or
  `&freeze=<ms>` holds the real-time clock still for pictures).

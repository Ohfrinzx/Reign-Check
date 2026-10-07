# Balance — the brief, the knobs and the change log

**Written 2026-10-07** for the balancing pass. Owner, verbatim: *"A new
agent will be making same big changes to core gameplay systems for proper
balancing before I move forward with anything else."*

Read this after `AGENTS.md`, `PROJECT_STATUS.md` and `docs/SYSTEMS.md`.
`SYSTEMS.md` says how each system works. This file says **which numbers
tune it, where they live, how to measure a change, and what has been
changed** (the change log, §5).

## 1. The brief and the process

**The job:** make the core systems play well — the money, the hidden
pressures, factions and their demands, the confidence vote, endings, the
cards' effects, and the mini-game rewards. No new features, cards or
mini-games unless the owner asks.

**Ask the owner first.** The record has only a few stated targets (§1a).
Before changing anything big, ask what feels wrong in their playtests and
what they want. Offer choices. Do not invent targets.

**Work in slices**, as the earlier balance phase did (slices A–D, each
playtested and approved before the next):
1. Agree the slice with the owner.
2. Run the probe **before** (§3), at 400 runs for the policy you are
   tuning. Write the numbers down.
3. Make the change. Keep it small enough to explain in one line per knob.
4. Run the probe **after**, same settings. If a number moved more than
   the noise (§3), say why.
5. **Add a row to the change log (§5) in the same commit**: what, why
   (with the owner's words), old → new values, probe before → after.
6. Update `docs/SYSTEMS.md` (how it works now) and §2 below if a knob
   moved, was renamed or was added.
7. `npm test`, `npm run build`, the browser checks; merge as `AGENTS.md`
   §10 says; the hand-off report (§3a) lists what to watch for in the
   playtest.
8. Wait for the owner's playtest before the next slice.

**Save version.** Changing a number does not need a new `SAVE_VERSION`.
Changing the **shape** of `GameState` (a new field, a renamed key) does:
bump it (now 14) and tell the owner it resets their run in progress.

**Things a balance change must not break** (from `AGENTS.md` §4):
- The player never sees exact odds or hidden numbers; words only
  ("They might take it.").
- Every option states its price, money first.
- Read options through `orderedOptions()`; the order is shuffled per run.
- Game logic stays in `src/game/`, no React or DOM.
- A mini-game is never lost by someone doing everything right (owner,
  2026-10-02: *"not in the way that even if you do everything right you
  automatically lose"*).

### 1a. What the owner has said about difficulty (the whole record)

| Date | Owner's words / choice | Where it shows |
|---|---|---|
| 2026-09-23 (slice A–B) | Difficulty **"Hard"**: careful play survives about half the time. Also: *"The difficulty needs to be higher so there is more incentive to read and think through decisions."* | `docs/archive/PROJECT_STATUS_HISTORY.md` |
| 2026-09-23 | "About half" was for a real reader. The probe's `careful` policy sees exact results, so it scored higher (62% at the time). | `docs/archive/SLICE_NOTES.md` |
| 2026-10-01 | *"I want careful play to be rewarding. Yes, they should have some strategy to them and skill it shouldn't be 100% pass every time either."* Taken as careful ≈ 60% in the probe. | `docs/MINIGAMES.md` |
| 2026-10-02 | A mini-game must not be lost *"even if you do everything right"*. | `docs/MINIGAMES.md` |
| 2026-10-06 | Budget Night: *"I have yet to even make it to the vote"* → retuned "slower and clearer". Hard is fine; impossible is not. | `PROJECT_STATUS.md` log |

**Open question for the owner:** careful play is now **68%** in the
probe, above both "about half" and "about 60%". Ask whether that is too
easy, and whether the target is for the probe or for their own play.

## 2. Where the numbers live (the knob inventory)

File and constant names, no line numbers (they move). "Inline" means a
bare number inside a function, not a named constant; §4 lists the ones
worth naming.

### 2.1 Starting position — `src/game/state.ts`

| Knob | Value | Notes |
|---|---|---|
| `ACT_LENGTH`, `NUM_ACTS` | 6, 3 | 18 days. `DEFAULT_MAX_DAYS` follows. |
| `BASE_STATS` | power 52, legitimacy 45, support 50, treasury 42, economy 48, elite 50, military 52, security 55, stability 55, information 60 | Each gets ±4 jitter at the start (inline). |
| Hidden pressures at start | 8 + a random −3..+5 each (inline) | |
| Faction loyalty at start | 50 ± 6 (inline) | Power, influence and patience: `BASE_FACTION` ± 5. |
| Characters at start (inline) | loyalty = their faction's ± 14; trust 45 −12..+18; fear 12..26; plotting 0..8 | |
| `BASE_FACTION` (power / influence / patience) | staff 78/60/70, sable 66/74/65, concord 70/62/60, combine 62/48/62, grey 52/70/72, provinces 58/54/58, chorus 30/66/55 | |

### 2.2 Mandates — `src/game/content/mandates.ts` (`MANDATES`)

Each mandate has a start block, a `daily` block (from day 2) and
optional rule fields (`priceMult`, `pressureGainMult`, `extraCards`, …).

| Mandate | Start | Rule |
|---|---|---|
| stairwell | Army +20; legitimacy, support, stability −20 | Sarran's "Stairwell Recording" card arrives on day 4 |
| landslide | Street +30, treasury −20 | daily −2 legitimacy, support, stability |
| handover | treasury +30, Street −20 | Back Room prices ×0.75; unrest gain ×1.5; Street patience loss ×1.5 |
| accident | — | +1 card a day |
| clean-hands | +10 legitimacy, support, stability; Sable −15 | daily corruption −1.5, scandal +1.5 |
| pay-deal | Workers +20, treasury −10, a $0.6B/day commitment | daily Workers +1 loyalty, +1 patience |

### 2.3 The morning — `src/game/engine.ts` `dayUpkeep()` (all inline unless named)

In this order each morning: scheduled consequences, projects, lapsed
promises, commitments, held deals, Back Room dailies, **the budget**,
the empty-account bite, support and economy drift, era drift, pressure
drift, scandal cooling, patience, faction memory, hostility, demands,
character plotting, crises, mini-game triggers, character events, the
mandate's daily block.

| What | Formula / value |
|---|---|
| Lapsed promise | faction loyalty −8, patience −10; character loyalty −8, plotting +8 |
| Empty account (treasury < 0) | bite = min(3, 1 + \|treasury\|/30); support −1.1×bite, stability −bite, power −0.5×bite, unrest +1.8×bite, fiscal +bite |
| Support follows the Street and Workers | mood = 0.45×Street + 0.35×Workers + 10; support moves 10% toward it |
| Economy target | 50 + (stability−50)×0.25 − corruption×0.18 − fiscal×0.12; economy moves 12% toward it |
| Era | era = day / max(10, maxDays) (0 → 1 over the run) |
| Era drift | fiscal +1.3×era; coup +0.45×era (+0.08 per Army power point over 80); unrest +0.6×era; separatism +0.35×era |
| Unrest | −1.9 + (55−support)×0.05 + (50−stability)×0.055 |
| Coup | −0.8 + (52−military)×0.075 + fear×0.014 + plot×0.05 + max(0, 45−Army loyalty)×0.06 (plot = Varkov's and Tern's plotting over 35) |
| Scandal | −2.9 + heat×0.02 + max(0, 40−legitimacy)×0.02 |
| Leak | −1 + (55−information)×0.035 |
| Foreign, corruption, cult, fear | −0.9, −0.4, −0.7, −0.9 a day |
| Fiscal | +2.2 if treasury < 15, else −0.6 |
| Separatism | −0.5 + (50−power)×0.02 |
| Scandal heat | −2.5 a day (−6 if buried); gone below 4 |
| Patience | −2.2 if loyalty < 40; +0.5 if > 65; −1.4×era more if > 72 |
| Goodwill fades (`EXPECTATION_FROM` 60) | loyalty over 60 drops by (loyalty−60)×(0.04 + 0.05×era) |
| Character plotting | drive = ambition/100 × (1 − loyalty/120) × (1 + 0.15×grievances); plotting += 1.5×drive (−1.2 if loyalty > 70, −0.01×fear) |
| Plotters over 60 | Varkov coup +1.2, Tern coup +1.4, Kostyn separatism +1.2, Sarran leak +1.0 a day |

`drift()` multiplies **gains** by the mandate's `pressureGainMult`.

### 2.4 Money — `src/game/economy.ts` `computeBudget()` (all inline)

e = economy / 50 (1.0 at 50).

| Line | $B a day |
|---|---|
| Lithium & salt | +1.7e |
| Port & transit | +0.8e |
| Taxes | +1.2e |
| Ilvet Free Zone | +0.35 (+0.3 with the levy flag) |
| Diverted | −corruption/50 |
| Payroll, energy, police & army | −2.05, −0.5, −0.6 |
| Pensions & subsidies | −0.06 × (day − 1) |
| Debt service | −fiscal/42 |
| Commitments, projects | from cards and deals |

### 2.5 How effects land — `src/game/effects.ts`

`applyEffects()` → `applyCoupling()` (inline):
- support gains ×(1 + cult/260); losses ×(1 − min(0.35, cult/300));
  gains ×0.75 when information < 30;
- power gains ×(1 + min(0.25, fear/400));
- economy losses ×1.2 if corruption > 50, gains ×0.8 if corruption > 60;
- stability gains ×0.7 if unrest > 55;
- legitimacy losses ×1.25 if scandal > 45.

Faction loyalty changes spill to related factions: `RELATION_SPILL`
(0.25) × the relation in `content/country.ts` `FACTIONS[id].relations`.
Owned Back Room items can scale stat changes (`ownedStatMult()` in
`shop.ts`).

### 2.6 The three numbers and the bars — `src/game/display.ts`

| Knob | Value |
|---|---|
| `GRIP_PARTS` | power 0.45, security 0.25, military 0.15, information 0.15 |
| `LEGITIMACY_PARTS` | legitimacy 0.5, support 0.35, stability 0.15 |
| `HOSTILE_BELOW` | 20 (a faction under this is hostile) |
| Mood words | 72 / 55 / 38 / 20 (inline in `factionMood()`) |
| Colour tones | 65 / 45 / 25 (inline; also in `stats.ts`) |

### 2.7 The confidence vote — `src/game/content/endings.ts`

| Knob | Value |
|---|---|
| `VOTE_SEATS` | Army 15, Sable 10, Concord 20, Workers 25, Street 30 (100) |
| `VOTES_NEEDED` | 45, 58, 68 (acts 1, 2, 3) |
| Lean (inline, `computeConfidenceVote()`) | 0.6×loyalty + 0.4×(Grip+Legitimacy)/2 − debt |
| Debt (inline) | if treasury < 0: min(25, 8 + 0.5×\|treasury\|) |
| Share of a bloc's seats | (lean − 30)/40, 0..1; a hostile bloc gives 0 |

### 2.8 Endings — `src/game/content/endings.ts` `ENDINGS[].check`

| Ending | Fires when |
|---|---|
| coup | coup ≥ 84, or military ≤ 10 with coup > 52 |
| revolution | unrest ≥ 92, or stability ≤ 6 with support < 20 |
| elite | elite ≤ 6 with power < 35 |
| collapse | treasury ≤ −38, or economy ≤ 6 with treasury < 5 |
| fracture | separatism ≥ 90 |
| foreign | foreign ≥ 92 |
| scandal | scandal ≥ 94, legitimacy < 18 and an unburied scandal with heat > 45 |
| hollow | power ≤ 5 |
| noConfidence | the vote fails at an act's end |

`DEMAND_ENDINGS` (exactly two: sable-removal, general-strike) fire only
from a faction's successful move (`demands.ts`). For the others, the
highest `priority` wins.

### 2.9 The day's cards and alerts — `src/game/engine.ts`

| Knob | Value |
|---|---|
| Cards a day (`buildAgenda()`, inline) | pressure = (unrest+coup+scandal+fiscal)/4; 4 if pressure > 45 else 3; +1 with chance 0.45 + pressure/220; max 5; +1 with The Accident |
| Recency (`cardWeight()`, inline) | seen ≤ 3 days ago: 0; ≤ 6: ×0.18; ≤ 10: ×0.55 |
| `RUN_DECK_WEIGHT_BONUS` | 6 per copy in the run deck |
| Card weights | each card's `base` or `weight(s)` in `content/cards*.ts` |
| Alerts (`rollAlert()`, inline) | from day 2; max 2 a day; p = min(0.62, 0.07 + total weight/225); second alert ×0.35; first alert forced (p ≥ 0.85) from day 3; same alert blocked 4 days |
| Alert weights | `weight(s)` formulas in `content/alerts.ts` (14 alerts) |

### 2.10 Factions: demands and hostility — `src/game/demands.ts`, `content/demands.ts`

| Knob | Value |
|---|---|
| `ISSUE_BELOW` / `DROP_AT` | 45 / 50 patience |
| `STAGE_DAYS`, `MAX_LIVE` | 2, 2 |
| `COOLDOWN_MET` / `COOLDOWN_LAPSED` | 4 / 5 days |
| `PRICE_MULT` | murmur 1, formal 1.25, ultimatum 1.5 |
| Escalation (inline) | loyalty −4, patience −6 |
| Meet (inline, `meetDemand()`) | loyalty +8, patience raised to 65 |
| Lapse (inline) | patience raised to 45 |
| `bribeCost()` | max(0.5, meet×0.35) × (1 + 0.5×bribes so far) |
| `bribeChance()` | 0.25 + 0.6×loyalty/100 + 0.3×patience/100 − 0.15×stage − 0.15×bribes, 0.1..0.9 |
| `moveOdds()` | attempt (55−loyalty)/55 × power/100 × 1.3, max 0.9; success 0.3 + (power − defence)/120, 0.1..0.75 |
| `DEMANDS`, `TRIGGERED_DEMANDS`, `FACTION_MOVES`, `HOSTILE_ACTIONS` | words, prices and effects per faction (content file) |
| Hostile actions | rotate (day + index) % 3; each also −5 patience |
| `TRIGGER_WINDOW` | 6 days for a triggered demand |

**Faction memory and reactions** (`src/game/consequences.ts`,
`content/consequences.ts`): `MEMORY_DAYS` 4; `MARKS`, `CONSEQUENCES`
(unlock / change / lock), `DEMAND_REACTIONS` (cheaper ×0.6, dearer ×1.5,
no bribe).

### 2.11 Characters and crises

- `src/game/characterEvents.ts`: `WARN_BELOW` 40, `TURN_BELOW` 30,
  `DEVOTED_AT` 72, `FIRST_DAY` 2.
- `src/game/crises.ts`: `START_DAY` 4, `STAGE_GAP` 2, `COOLDOWN` 3; each
  crisis starts at its pressure ≥ 45 (Tapes 50) in `content/crises.ts`.

### 2.12 The Back Room — `src/game/shop.ts`, `content/shop.ts`

`ADVISOR_CAP` 3, `DEAL_CAP` 3, `NIGHTLY_STOCK` 3, `ACT_STOCK` 5,
`RECENT_MEMORY` 9, `RARITY_WEIGHT_NIGHTLY` 100/34/7, `RARITY_WEIGHT_ACT`
60/72/26. Each item's price, effects and `daily` block are in
`SHOP_ITEMS`. The `handover` mandate scales prices.
`src/game/__tests__/shop.probe.ts` measures purchases per run.

### 2.13 Mini-games — `src/game/minigames/index.ts` and the content files

- When: `DAILY_FROM_DAY` 2, `PLOT_AT` 52, `PLOT_FROM_DAY` 3.
- Rewards: the `*_WON` / `*_LOST` effect blocks in
  `content/minigames.ts` (Bulletin, Plot, Bread, Kilometre = Walk in the
  Weather, Shred) and in `content/mgMole.ts`, `mgBudget.ts`,
  `mgPigeon.ts`, `mgStairwell.ts`, `mgAmbassador.ts`. A typical daily
  win: legitimacy +5, its pressure −6..−10, its faction +2, small gains
  elsewhere. A typical loss: legitimacy −4 (−5 for Shred and Stairwell),
  pressure +5..+8, faction −4. Exceptions:
  - Walk in the Weather (`KILOMETRE_WON` / `KILOMETRE_LOST`, its old
    name): legitimacy ±7, support ±4, every faction +1.5 / −1, Workers
    +2 / −3 — it sets the act's tone.
  - Hold the Palace (`PLOT_WON` / `PLOT_LOST`): a win is coup −30, Army
    −2, Sable +3; a loss is legitimacy −8, power −6, stability −6,
    military −4, Army −6. The Army's real strike can end the run
    (`strikeWonEffects()`).
  - Find the Mole: wins range legitimacy +3..+7 by the fate chosen.
  - The Ambassador: three win tiers by price (`AMBASSADOR_WON_GREAT` /
    `AMBASSADOR_WON` / `AMBASSADOR_WON_FAIR`), legitimacy +6 / +5 / +2.
- Find the Mole fates: `MOLE_ARREST`, `MOLE_TURN`, `MOLE_FIRE`,
  `MOLE_EXPOSE`.
- The Ambassador: `AMBASSADOR_GREAT` 85, `AMBASSADOR_FAIR_BELOW` 75.
- Budget Night's jars after eight: `OVER_MAX`, `SHORT_MAX`,
  `WALKOUT_LOYALTY` (−5), `GENEROUS_AT` ($3B), `DAILY_INTEREST`,
  `LUMP_INTEREST`, and `BUDGET_CLAIMS`.
- Difficulty inside each game: its own file in `src/game/minigames/`
  (`*Difficulty(act)` functions and the constants at the top).

### 2.14 Text that repeats numbers (edit by hand)

- `display.ts` `STAT_DOES` (the "What do these mean?" list) states
  thresholds in words.
- `briefing.ts` `WARNINGS` (the front-page warnings and their `at`
  levels).
- Brief me and how-to screens in `src/ui/`.
- `docs/SYSTEMS.md`.

## 3. How to measure

**The balance probe:** `src/game/__tests__/balance.probe.ts`. It plays
whole runs with four policies:
- `random` — any option;
- `first` / `last` — the first / last option as shown (shuffled per run,
  so these behave like random);
- `careful` — 3 times in 4 it picks the option that leaves the visible
  position best (`visibleScore()`), otherwise any. It wins mini-games
  `MINIGAME_SKILL` (70%) of the time; the others win half.

`npm test` runs it at 120 runs per policy (`balance.test.ts`, about 30
seconds). It **prints and asserts nothing**:

```bash
npx vitest run --dir src balance       # the probe alone
npx vitest run --dir src --exclude '**/balance*'   # everything else, fast
```

For a real comparison use **400 runs** for the policy you are tuning:
copy `balance.test.ts` to a scratch test calling `probe(400, 'careful')`,
run it, then delete it. **Noise:** ±4 points at 120 runs, ±3 at 400. A
smaller move is not a result.

Output fields: `survived`, `avgDays`, `avgAlerts`, `reachedMax` (reached
the last day), `voteMarginMedianByAct` (seats over or under the line),
and `endings` (count per ending id).

**Its blind spots:**
- `careful` sees exact results; a real reader sees hints. Real play is
  harder than its number.
- It never buys in the Back Room, never spends favours, never meets or
  bribes demands, never fires advisors.
- Mini-games are a coin weighted 70/50, not played.
- It does not measure how a run *feels*: variety, tension, how often a
  card repeats. The owner's playtest does.

### 3a. Baseline (2026-10-07, after mini-games slice 3 part B)

`npm test`, 120 runs each, `SAVE_VERSION` 14:

| Policy | Survived | Avg days | Reached day 18 | Vote margin by act (median) | Endings (of 120) |
|---|---|---|---|---|---|
| careful | **68%** | 17.4 | 88% | +30, +21, +14 | survival 81, noConfidence 28, elite 6, sable-removal 4, collapse 1 |
| random | 5% | 12.2 | 22% | +14, −1, −9 | noConfidence 87, elite 11, survival 6, revolution 5, foreign 3, sable-removal 2, collapse 2, fracture 2, hollow 1, scandal 1 |
| first | 5% | 11.9 | 24% | +15, +1, −6 | noConfidence 83, revolution 7, survival 6, elite 5, foreign 4, coup 4, sable-removal 4, scandal 3, hollow 2, fracture 2 |
| last | 1% | 11.6 | 22% | +12, −1, −13 | noConfidence 81, revolution 11, elite 9, foreign 5, fracture 4, collapse 3, general-strike 2, coup 2, survival 1, scandal 1, sable-removal 1 |

What it says: most runs end at the vote (as designed). Coup, revolution,
scandal and the others are rare for a careful player. Careful players
pass every vote with room to spare.

## 4. Known issues to look at

Found while writing this brief. None is fixed yet; each is a candidate
for the pass, not an order.

**Numbers written in more than one place** (change one, miss the other):
- Patience floors 45 / 65 / 50 appear inline in `demands.ts` and as
  constants; `ISSUE_BELOW` 45 and the lapse floor 45 are the same number
  by accident.
- The 72 "devoted / very happy" line: `DEVOTED_AT`, `factionMood()` and
  the patience rule in `dayUpkeep()`.
- `content/minigames.ts` `eventMinigames()` checks a hostile Street and
  a hostile Sable Office with bare `< 20` instead of `HOSTILE_BELOW`.
- Colour tones 65 / 45 / 25 are in both `display.ts` and `stats.ts`.
- Coup 52 appears in `PLOT_AT` and the coup ending.
- Three debt formulas: the morning bite (`dayUpkeep()`), the vote's debt
  (`computeConfidenceVote()`), and debt service (`computeBudget()`).
- `STAT_DOES` and `WARNINGS` repeat thresholds in words.

**Bare numbers that should probably be named** before tuning them:
support's 0.1 and economy's 0.12 drift rates; the alert numbers (0.07,
225, 0.62, 0.35, 0.85); the agenda numbers (0.45, 220, 45); pensions
0.06; debt service /42; the escalation −4 / −6 and meet +8.

**Mini-game rewards are copied by hand** across about ten
`*_WON` / `*_LOST` blocks. A shared "standard win / standard loss" would
make one change apply everywhere.

**Balance observations** (for the owner to decide on):
- Careful play is 68%, above the stated targets (§1a).
- Careful players' vote margins are wide (+30 in act 1). Act 1's vote
  rarely matters for them.
- Most endings other than the vote almost never happen to a careful
  player (coup 0, revolution 0 of 120).

## 5. Balance change log

**Every balance change adds a row here, in the same commit.** Newest
first. Probe numbers are `careful` survival unless stated, with the run
count. Quote the owner's words where they asked for it.

| Date | Change (what, old → new) | Why (owner's words) | Probe before → after | Commit / branch |
|---|---|---|---|---|
| *(next)* | | | | |

### History (before this log existed, from the record)

| Date | Change | Probe (careful) |
|---|---|---|
| 2026-10-07 | Mini-games slice 3 part B (Stairwell, Ambassador) added to the daily rotation | 68% (random 5%) |
| 2026-10-06 | Find the Mole's four fates; the arrest toned down (legitimacy +4, security +4, leak −12, fear +5, Sable +2, Street −2) after it pushed careful up; Budget Night retune and jars after eight | 63% → 68% |
| 2026-10-06 | Mini-games slice 3 part A (Mole, Budget, Pigeon) | 63% |
| 2026-10-03 | Walk in the Weather replaces the Kilometre (act opener, ±7 stakes); Shred harder | 63% |
| 2026-10-01 | Mini-games slice 2; win rewards raised | 46% → 59% |
| 2026-10-01 | Mini-games slice 1 (a daily game replaces a card) | 59% → 46% |
| 2026-09-23 | Balance slice D: factions remember; triggered demands; more locks | 67% → 59% (random 3%) |
| 2026-09-23 | Balance slice B "Hard": option shuffle, hostile factions, bloc vote, support follows Street/Workers, pensions line, taxes 1.6 → 1.2×economy, demands from patience < 45 (was 35), patience −2.2/day below 40 (was 1.6) | 62% (random 4%, first/last 1%; first was 91% before the shuffle) |

Details of each are in `PROJECT_STATUS.md`'s log and
`docs/archive/`.

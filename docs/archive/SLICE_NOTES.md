# Archived slice notes (from AGENTS.md §12–§22, up to 2026-09-23)

**History, not instructions.** These are the per-slice notes agents wrote
while building each feature. Some numbers here were later changed (for
example demand `ISSUE_BELOW` 35 → 45, the vote formula, character-event
pacing). **The current behaviour is in `docs/SYSTEMS.md`.** Read this only
to learn why something was built the way it was.

## 12. Mandate slice and review notes (2026-09-21)

- `NewGameOptions.mandateId` chooses an origin; omitted/unknown rolls one
  through the seeded RNG. Same seed shares baseline conditions across choices.
- Mandate daily effects start on day 2; the Pay Deal's permanent $0.60B budget
  commitment applies from day 1. All new effects use `applyEffects()`.
- `Effects.resolvePromise` / `deferPromise` update named promises. Do not use
  a report-counter flag as a substitute: that left paid promises open and
  caused false lapse penalties. Content uses helicopter/hadem-road/lithium-wages IDs.
- Generated effect IDs use `flags.__effectId`, not module-global state.
- The browser scripts use installed Playwright Chromium, or an explicit
  `PLAYWRIGHT_EXECUTABLE_PATH`; screenshots go to the OS temp directory's
  `reign-check-shots` folder (`REIGN_SHOTS` overrides it).
- Review details and remaining playtest risks: `docs/REVIEW_2026_09_21.md`.

## 13. Run deck slice notes (§4.4, 2026-09-21, later session)

- `Effects.deck.remove` bans a card id into `GameState.bannedCards` — it does
  NOT just strip that id back out of `runDeck`. Banning is permanent for the
  run and always wins, even over held copies of the same id; there is no
  "un-ban" mechanism, on purpose (nothing in the design calls for one).
- Only target `deck.add`/`deck.remove` at cards the global pool already
  draws unprompted — i.e. `base > 0` or a real `weight()`, not the
  `base: 0, weight: () => 0` cards that exist only to be reached via
  `schedule`/`queueCard` from another card's outcome (e.g. `mil-budget-due`,
  `strike-begins`). Those never go through `cardWeight()`'s weighted draw at
  all, so boosting or banning them would silently do nothing — a foot-gun
  the shop items in this slice deliberately avoid.
- The recency gate in `cardWeight()` (no repeat within 3 days) is NOT
  bypassed by the run-deck weight bonus — it still gates how often any card,
  boosted or not, can appear (roughly once per 4 days, ~5 times in an
  18-day run). `deck.test.ts` measures the boost as "noticeably more often,
  bounded by the ceiling," not "constantly" — that is the correct, intended
  shape, not a bug to fix later.
- `alertWeight()` also checks `bannedCards` (so a banned alert never fires),
  but alerts get no `runDeck` copies-boost — the run deck's "add" side only
  ever targets ordinary standard cards, matching the design doc's framing
  ("situation cards" — the world's own alerts stay unpredictable).

## 14. Meta-progression slice notes (§4.5 step 1, 2026-09-21, later session)

- `meta.ts` is deliberately its own localStorage key
  (`dictator-sandbox:legacy:v1`) and its own version constant
  (`META_VERSION`), not folded into `save.ts`'s key or `SAVE_VERSION`. This
  is load-bearing: `deleteSave()`/restart must never wipe cross-run history,
  and a `GameState` shape change (which bumps `SAVE_VERSION`) must never
  discard it either. If `MetaProgress`'s shape changes later, bump
  `META_VERSION`, not `SAVE_VERSION` — they are independent counters.
- `recordRun()` is a pure function (`(meta, state) => meta`) — it does not
  write to `localStorage` itself. The caller (`App.tsx`) decides when to
  persist, same separation `applyEffects()`/`save.ts` already have in the
  main save path. Call `saveMetaProgress()` yourself after `recordRun()`.
- The React-side recording effect in `App.tsx` guards against double-
  recording by comparing `game.ending` **by reference**, not by id — a new
  ending object is always a distinct reference (states are cloned, never
  mutated in place, ground rule 3), so this is safe without deep-equality
  checks and works even if two different runs happen to reach the same
  ending id.
- Step 1 shipped `isMandateUnlocked()`/`isShopItemUnlocked()` in `meta.ts`
  as stubs that always returned `true`. Step 2 (same session, see §15
  below) gave them real conditions — this bullet is kept as history, not
  current behaviour.
- `tools/legacy.mjs` is the dedicated browser check for step 1: confirms no
  record line before any run exists, drives one run to an ending, checks
  the line appears after "Back to title" (not "Try again", which skips the
  title screen entirely), and confirms it survives a real page reload.

## 15. Meta-progression step 2 notes (§4.5, same session as §14)

- `GameState.unlockedShopItemIds` is a **snapshot**, computed once in
  `createGame()` from `meta.ts`'s `isShopItemUnlocked()`, not re-evaluated
  mid-run. This is deliberate (see `meta.ts`'s file header and
  `types.ts`'s field comment): unlocking something by reaching Act 2 in
  the run you're currently playing should apply to your NEXT run's shop,
  not retroactively change what THIS run's Back Room offers mid-stream.
  The mandate check works the same way — `state.ts`'s `createGame()` only
  ever evaluates it once, at the moment a new game is created.
- `meta.ts` still imports nothing from `content/` — `MANDATE_UNLOCKS`/
  `SHOP_UNLOCKS` key by plain string id, and it's the *caller* (`App.tsx`,
  `Screens.tsx`, `Progress.tsx`) that cross-references those ids against
  `content/mandates.ts`/`content/shop.ts`. Keep it that way: `meta.ts` is a
  generic small rules engine, not something that needs to know the shape
  of a mandate or a shop item.
- `shop.ts`'s `eligible()` gates the **stock roll** (what can be offered);
  `engine.ts`'s `buyShopItem()` ALSO independently checks
  `unlockedShopItemIds` before letting a purchase through, even though
  `shopStock` should already only ever contain eligible ids. This mirrors
  the existing `capBlockReason()` pattern exactly — "the safety net", not
  the primary gate — and a test in `shop.test.ts` forces a locked item
  into `shopStock` directly (bypassing the normal roll) specifically to
  prove that safety net actually fires, not just that the roll filters
  correctly.
- `state.ts`'s `createGame()` never lets an unlock list lock out every
  mandate: if `opts.unlockedMandateIds` somehow filters `MANDATES` down to
  nothing, it falls back to the full list rather than crashing or rolling
  from an empty pool. This can't happen with the current two-rule
  `MANDATE_UNLOCKS` table (the four base mandates are never gated), but
  the guard exists so a future rule can't accidentally brick new-game
  creation.
- The title screen's mandate picker (`Screens.tsx`) filters `MANDATES` to
  `isMandateUnlocked()` before rendering radios — a locked mandate is not
  shown greyed-out, it simply isn't in the list. The Progress screen is
  where "what's locked and why" actually lives, per the owner's explicit
  placement request; don't reintroduce locked-but-visible entries in the
  picker itself without asking, since that was a deliberate choice, not
  an oversight.
- Two access points render the exact same `ProgressPanel` component
  (`Progress.tsx`): the title screen's "Unlocks" button (works without a
  live `GameState` — it only needs `MetaProgress`) and a "Roster"/"Unlocks"
  tab pair inside `Manage.tsx`'s "Advisors & Deals" screen (mid-run only,
  since that screen needs a live `GameState` for the roster half). Keep
  both reading the same component if you touch this — don't let a future
  edit update one copy and not the other.
- `tools/mandates.mjs` is the dedicated browser check for step 2: clears
  storage and confirms exactly 5 radios (4 unlocked mandates + "let fate
  decide") on a fresh run with `clean-hands`/`pay-deal` absent, seeds a
  3-run history that satisfies every unlock rule at once (2+ runs, an
  Act-2+ run, a survival, 3+ runs), reloads and confirms all 7 radios
  appear, actually selects and starts the previously-locked `clean-hands`
  mandate (not just that its radio renders), and checks both Unlocks
  access points — the title button and the in-game tab — agree nothing is
  locked. `page.waitForTimeout(300)` after opening it before any
  screenshot: the scrim's `.2s` fade-in animation is caught mid-transition
  otherwise, which looks like broken/overlapping layout in a screenshot
  even though the actual DOM and computed styles are already correct at
  that point — don't mistake that for a real bug if it happens again.

## 16. Faction demands slice notes (Phase 3 step 1, 2026-09-22)

- **Lifecycle** (`demands.ts` header has the full version): a visible
  faction with patience below `ISSUE_BELOW` (35) and no live demand issues
  a *request* (murmur) during the morning upkeep. Each stage lasts
  `STAGE_DAYS` (2) days; past the due day it escalates request → formal
  demand → ultimatum, costing that faction's support and patience each
  time. A request drops quietly if patience recovers to `DROP_AT` (50).
  At most `MAX_LIVE` (2) demands are live; one new one per morning.
- **Meet** pays the stage price (`meetCost` × 1 / 1.25 / 1.5) through
  `applyEffects()` plus the demand's own side effects (every demand has a
  downside for someone else). **Bribe** costs about a third of the meet
  price, more each time; `bribeChance()` rises with the faction's loyalty
  and patience and falls with stage and repeat bribes (10%–90%). Accepted:
  pay, +2 days. Refused: no money taken, a small support/patience hit, and
  no second try until the demand escalates. The player only ever sees odds
  as words (`bribeOddsWord()`), never a number (ground rule 6).
- **When an ultimatum runs out** (`resolveLapse()`): `moveOdds()` gives
  the chance the faction tries to remove you (only if its loyalty is
  below 55, scaled by its power) and the chance that works (its power vs.
  `FACTION_MOVES[f].defence(s)` — e.g. Army vs. Security's support,
  your security services and legitimacy). Success ends the run with that
  faction's ending via `forcedEnding()`; failure applies `failedEffects`;
  no attempt applies `punishEffects`. The player sees `protectedBy` and a
  plain danger sentence (`dangerWord()`) on any ultimatum.
- **Endings:** `sable-removal` and `general-strike` are new, in
  `DEMAND_ENDINGS` (no `check`, never auto-picked). Army/Elites/Street reuse
  `coup`/`elite`/`revolution`. `prepareDay()` sets phase `ended` if the
  upkeep ended the run.
- **State:** `FactionDemand` now stores only ids/numbers (`id`,
  `issuedDay`, `dueDay`, `severity`, `bribes`, `bribeRefused`) — the words
  live in content. `GameState.demandNotices` is the pop-up queue;
  `dismissDemandNotice()` removes the first. Notices for a demand that
  changes or ends are cleared automatically, so a pop-up is never stale.
  Cooldowns/used-demand bookkeeping live in `flags` (`demandCooldown:<id>`,
  `demandUsed:<id>`). `SAVE_VERSION` 10→11.
- **Only the five visible factions make demands** (`DEMAND_FACTIONS` =
  `DISPLAY_FACTIONS`), so nothing arrives from a group the player cannot
  track (ground rule 8). The briefing replaces its vague "patience running
  out" line with the real demand for those factions.
- **Adding a demand is content only:** append to `DEMANDS` in
  `content/demands.ts` — no engine change (ground rule 5). `canMeet`/
  `lockedText` exist for a demand that needs more than money.
- **Balance, measured, not tuned** (`balance.test.ts`, 120 runs each; the
  bots never meet or bribe): *first-option* play went from 100% survival
  to 90% (5 `sable-removal`, 6 `elite`, 1 `hollow`); *random* and
  *last-option* play barely moved. This partly addresses the known "same
  option every time wins" problem, but the real fix is still Phase 3's
  balance pass (step 4).
- **Pre-existing, not fixed here:** `Effects.ending` sets
  `__forceEnding`/`__ending:<id>` flags that nothing reads, so a card
  cannot currently force an ending that way (no content uses it). The
  demand system does not rely on it — it calls `forcedEnding()` directly.

## 17. Character-driven events slice notes (Phase 3 step 2, 2026-09-22)

- **Triggers** (`characterEvents.ts`): *wavering* = loyalty < 40, or
  plotting ≥ 40, or 2+ grievances (negative memories) with loyalty < 55.
  *Turning* = loyalty < 30, or plotting ≥ 55, or 2+ grievances with
  loyalty < 45. *Devoted* = loyalty ≥ 72 and plotting < 30. Loyalty is the
  main signal on purpose: measured over 120 simulated runs per play style,
  `plotting` only rises for Adamek (and sometimes Kostyn), while every
  character's loyalty swings.
- **Warning first, always.** The first morning a character wavers,
  `flags['charWarned:<id>']` records the day and the front page / desk
  shows their `warning` line ("<Name> is losing faith in you", or "… may
  act on their own" once turning). A betrayal is only queued on a LATER
  morning than the first warning, so the player always gets a day to react.
- **Delivery:** `tickCharacterEvents()` runs in `dayUpkeep()` and pushes
  the card into `s.queued` for today; `drawDeck()` (right after) puts
  queued cards first, so the event is normally the day's first card. At
  most one character event per day, never two days running
  (`flags.charEventLast`), none before day 3, only for characters alive
  and in post, each card once per run (`once: true`, plus
  `flags['charQueued:<card>']`). Betrayals take priority (least loyal
  first); otherwise one devoted character's offer, picked with the saved RNG.
- **Cards** are `base: 0, weight: () => 0` — never drawn at random — and
  tagged `character-event` + `betrayal`/`offer`. That tag is what switches
  `CardView` to `CharacterCardView`: a light "private file" with a manila
  tab and stamp ("Acted alone" / "An offer"), a portrait column in the
  character's accent colour with where they stand in words (never the
  number, ground rule 6), a typed memo body and side-by-side reply slips.
  It keeps the `.doc`, `h1` and `.opt` hooks, so keyboard shortcuts and the
  browser tools work unchanged. **Future mini-games should get their own
  look too** (owner's stated goal: variety, less visual redundancy).
- **No direct endings** (owner decision). Betrayal outcomes push the
  existing pressures (coup, leak, scandal, unrest, separatism, foreign,
  fiscal). "Remove/arrest/sack" options use `removeFromPost`.
- **Adding one** is content only: add the character to `CHARACTER_EVENTS`
  (a test checks every character in `country.ts` has an entry).
- **Measured frequency (not tuned):** ~4 events per run with random play
  (1.9 betrayals, 2.0 offers), ~5 with always-first (mostly offers), ~2
  with always-last (mostly betrayals); at least one in 97–100% of runs,
  first one around day 4–5. Balance probe survival barely moved.

## 18. Crisis chains slice notes (Phase 3 step 3, 2026-09-22)

- **Shape:** a chain (`CrisisDef` in `content/crises.ts`) has `stage1`,
  `stage2.{calm,hot}` and `stage3.{calm,hot}` — 5 cards. Stage names:
  "It starts", "It spreads", "It comes to a head".
- **Score, in content:** options add to `flags['crisis:<id>']` (+1/+2
  handled well, −1/−2 made worse). `crises.ts` picks the `calm` version of
  the next stage when the score is ≥ 0, `hot` when it is negative. An option
  can end the chain early with `flags['crisisEnd:<id>']` (two options do:
  accepting Kostyn's deal, accepting Ostrene's price). Adding a chain is
  content only.
- **Start:** from `START_DAY` (4), when no chain is running and the
  cooldown (3 days after the last one ended) is over, any chain whose
  `pressure` ≥ `startAt` (45; 50 for the tapes) can start; the most
  over-threshold one wins. One at a time; each once per run
  (`GameState.crisesDone`).
- **Advance / end:** `tickCrises()` in `dayUpkeep()` (after character
  events). A stage card is queued for that day (first in the deck); the next
  stage comes `STAGE_GAP` (2) days after, but only once the current card has
  actually been played (`seenOnce`). The morning after stage 3 (or an early
  end) the chain closes: `crisesDone`, a log line, and a `bigMoments` entry
  for the end-of-run summary ("Handled / Got through / Barely survived
  <name>").
- **No random rolls** in crises.ts — pressure decides which chain starts,
  the score decides which version arrives. No direct endings; outcomes move
  ordinary stats/pressures.
- **State:** `GameState.crisis?: ActiveCrisis` (`id`, `stage`, `cardId`,
  `startedDay`, `nextDay`) and `crisesDone: string[]`. `SAVE_VERSION` 11→12.
- **Look:** the `crisis-chain` tag switches `CardView` to `CrisisCardView`,
  a light "situation room": red crisis band with the name and a 3-step
  tracker, the story beside a **situation log** (earlier stage titles and
  what you ordered, read back from `s.log`) and "So far: holding / getting
  worse…" in words (`crisisMood()`, never the number), then the options as
  numbered **orders** side by side. Keeps the `.doc`/`h1`/`.opt` hooks.
  That is now three distinct card looks (lead story, private file,
  situation room) — keep future types (mini-games) distinct too.
- **Front page / desk:** `crisisBriefing()` adds "Crisis: <name> (stage N
  of 3)" as a warning with the summary, how it is going, and when the next
  development is due.
- **Measured (not tuned):** ~1 chain per run (0.8–1.2), in 78–95% of runs,
  first around day 7–12. Generous play almost always gets the Ledger
  (corruption); harsh play gets Bread, Gas and the Referendum; random play
  sees all five. Both versions of every stage were reached. Random-play
  survival moved 47% → 42% in the balance probe; always-first 92%.
- **Browser tools:** measure layout only after the card's `.42s` rise-in
  animation (`page.waitForTimeout(500)`) — two `boundingBox()` calls taken
  mid-animation report different `y` values. This bit both
  `characters.mjs` and `crises.mjs` once.

**What is next — Phase 3 step 4, the balance pass** (needs its own
go-ahead). Everything Phase 3 added was measured but deliberately not
tuned. The pass would, using the balance probe and the per-system probes
described in §16–§18:
1. **Fix "one option every time wins"** (known limitation #2): always-first
   play still survives ~90% of runs. Give the generous path a sharper
   late-game cost (e.g. patience that drains faster the more you give,
   bigger upkeep on accumulated commitments).
2. **Demand frequency** (owner noted demands felt rare: ~1.5–2 per run,
   first around day 6–9). Levers: `ISSUE_BELOW`, `STAGE_DAYS`, `MAX_LIVE`,
   patience drain in `dayUpkeep()`.
3. **Coup pressure almost never rises** (3–15% of runs reach 40), so the
   coup ending is rare (known limitation #3) and there is no coup crisis
   chain yet. Feed coup pressure from more military cards/events, then add
   a coup chain as content.
4. **Confidence-vote thresholds and margins** (40/47/54): re-check against
   real vote margins now that demands, character events and crises add
   pressure; random-play survival fell from ~51% to ~42% across Phase 3.
5. **Crisis and character-event pacing**: ~1 crisis and ~4 character
   events per run; decide whether that is the right density for 18 days.
After step 4, Phase 3 is complete; Phase 4 (mobile/iOS) stays unscheduled
and Phase 5 (mini-games, sound, remaining endings) needs its own go-ahead.

## 19. Balance slice A notes (feel and clarity, 2026-09-23)

- **Private files every day** (owner: "most runs I don't get one until act
  2 or later"). `characterEvents.ts` now runs from day 2 with no "never two
  days running" rule, one per day. Priority: betrayal (turning, warned on an
  earlier morning) → offer (devoted) → **request** (anyone else in post).
  Requests (`content/characterRequests.ts`, 13 cards, one per character) are
  personal asks — grant for loyalty, refuse and lose some — which is what
  later tips a character toward an offer or a betrayal. Characters with no
  file yet this run are favoured, so the cast rotates. Tag `request`; the
  private-file stamp reads "A request". Measured: a private file on
  **96–100% of days**, first on day 2; some late days (after day 13) come
  up empty once a character has used all three of theirs — more request
  cards are content-only if that needs filling.
- **Crisis stages are their own scene.** `tickCrises()` now runs BEFORE
  `tickCharacterEvents()` so a crisis stage is always the day's first card.
  `App.tsx` early-returns `<div className="app situation-room">` (like the
  Back Room's `shop-full`) whenever the current card is tagged
  `crisis-chain` and the phase is `stage` or `resolve`: a black top bar
  ("Situation room · Level B2", pulsing red light, the 3 resources), the
  crisis card, then its outcome with "Leave the situation room →". Dark
  tokens are swapped on `.app.situation-room` (same method as `.app.dark`).
  **Two screens are dark now — the Back Room and the situation room — both
  at the owner's request. Do not darken anything else without asking.**
  Browser tools find cards under `:is(.stage-col, .sr-stage)`.
- **Favours are aimed and give a receipt** (`favours.ts`). Each favour's
  `use` in `content/shop.ts` now has `targets` (`scandal`, `demand`,
  `demand:<faction>`, `crisis:<id>`), optional `needsTarget`, and
  `whenUseful` (plain words; shown in the shop as "Use it" and in the rail
  as "Keep it for"). The rail shows **"Useful now: <names>"** when a target
  exists; a `needsTarget` favour with nothing to aim at is **disabled with
  a reason**. "Use it…" opens `FavourDialog`: pick the target → the
  receipt names what went away ("\"The stairwell\" is gone…", "The Army
  dropped their demand…", "<crisis> is over… handled") plus the stat
  changes. Target effects: a scandal is removed from play; a demand is
  withdrawn unpaid (`demands.ts withdrawDemand()`); a crisis ends as
  handled (score +2, end flag; `crises.ts` now closes on the end flag even
  if today's card was never played, and the unplayed card is removed from
  today's deck and agenda). `engine.ts useFavour(s, id, target?)` is kept
  as a thin wrapper over `spendFavour()`.
- **Balance, measured (not tuned yet — that is slice B):** always-first
  survives ~91%, random ~43%, always-last ~1%. Option 1 is the best option
  on 45 of 81 standard cards; always-first's money grows $44B → $92B over a
  run; its vote margins sit at +11 to +44 over the line (median +30).

Slice A was playtested and approved; slice B (§20) came next.

## 20. Balance slice B notes (difficulty, 2026-09-23)

Owner playtest of slice A (approved: *"the named changes you made I can
confirm seem to work well"*), then: *"the game needs WAYYYYY more
balancing. I really only notice 2-3 factions … drop. Even when its
practically zero nothing happens."* Their end screen showed the Elites
hostile, the Street furious, the treasury at -$20.3B, and parliament
confirming them with the meter full ("100%").

- **Option order is shuffled per run.** `engine.ts orderedOptions(s, card)`
  derives the order from `hashString(seed + ':' + card.id)` — fixed for the
  run, the same after a reload, nothing stored. Every card view
  (`CardView`, `CharacterCardView`, `CrisisCardView`), the number-key
  shortcuts in `App.tsx`, and the balance probe go through it. **Browser
  tools must not assume option N is a particular choice** — find the option
  by its text, then press its shown number (`characters.mjs`,
  `crises.mjs` do this). Content order in the card files is untouched.
- **Hostile factions act.** `display.ts HOSTILE_BELOW` (20) is the bottom
  mood on a faction's bar; `isHostile(s, id)`. `demands.ts tickHostility()`
  runs in `dayUpkeep()` before `tickDemands()`: the first morning a
  `hostile` demand notice (pop-up, "<Faction> · hostile"), then one action
  from `content/demands.ts HOSTILE_ACTIONS` every morning (3 per faction,
  rotating by day — no dice), logged, on the front page as
  "<Faction>: working against you — <what they did>" (danger 3 of 3), and
  −5 patience. Flags: `hostileSince:<id>` (day, 0 when not hostile),
  `hostileAct:<id>` / `hostileAct:<id>:day`. A hostile faction makes a
  demand even while patient, and speaks first. Winning it back logs "The
  <Faction> stepped back". Army actions feed coup pressure; Elites and
  Workers cost money; Security leaks; the Street raises unrest.
- **The confidence vote counts faction blocs.** `content/endings.ts
  computeConfidenceVote()`: 100 seats (`VOTE_SEATS`: Army 15, Security 10,
  Elites 20, Workers 25, Street 30). Each bloc's lean = 0.6 × that
  faction's loyalty + 0.4 × (Grip + Legitimacy)/2 − a debt penalty
  (treasury < 0: 8 + half the debt, max 25); its share voting for you runs
  from 0 at lean 30 to all at lean 70. A hostile faction's bloc votes
  against as one. Needed: `VOTES_NEEDED` = 45 / 58 / 68 of 100 (acts 1–3).
  Still deterministic, still frozen before the reveal.
  `ConfidenceVoteResult` gained `blocs` and `debtCost` (**`SAVE_VERSION`
  12→13**). `Vote.tsx` now counts bloc by bloc: a row per faction with its
  seats (filled = for, red outline = against), "11 / 15", and a reason in
  words; the meter and "Votes for you" run to the needed line.
- **Rebalance** (all in upkeep, no card edits): faction relations spill
  0.12 → 0.25 (`effects.ts RELATION_SPILL`), so pleasing one faction costs
  its rivals; goodwill fades — loyalty above 60 slides back each morning,
  faster later in the run (`engine.ts EXPECTATION_FROM`); public support
  drifts toward the Street and Workers (it can no longer read 87 with the
  Street furious); a new budget line, **Pensions & subsidies**, grows
  $0.06B a day for every day in office; taxes 1.6 → 1.2 × economy; an
  unhappy army (loyalty < 45) adds coup pressure; demands start below 45
  patience (was 35) and patience drains 2.2/day (was 1.6) for a faction
  below 40 loyalty.
- **Measured** (`balance.probe.ts`, 120 runs each; the probe now has a
  `careful` policy — picks the option that leaves the visible position
  best 3 times in 4, misjudges the rest): careful **62%** survive (target
  "about half" for a real reader, who sees hints, not exact numbers);
  random 4%; always-first / always-last 1% (was 91% / 1%). Most deaths are
  the vote (`noConfidence`). Demands: ~2.5 per full run (was ~1.7); coup
  pressure now reaches 40 in some runs.
- **Also fixed:** the regime label read "Earnest a Security State"; now
  "An Earnest Security State" (`regimeLabel()`). The desk's threat pips say
  "DANGER N OF 3" instead of "STAGE N OF 3" (they were never stages). The
  "Brief me" screen explains the bloc vote and hostile factions.
- **Not done (possible later):** a coup crisis chain (coup pressure now
  rises, but there is no chain for it yet); no card content was edited — if
  one option type still dominates in play, that is card-level tuning.

Slice B was playtested and approved; slice C (§21) came next.

## 21. Balance slice C notes (consequences, 2026-09-23)

Owner, after playtesting slice B: *"Current playtesting checks out, move
onto Part C."* The goal (from the balance-phase brief): *"make sure that
certain decisions can trigger and influence certain choice options and
outcomes."*

- **Marks.** `content/consequences.ts MARKS`: 18 marks, each set by one or
  more existing options (`setBy`: card id + option id), e.g. `bought-news`
  (Channel Seven / pay), `arrested-vel`, `built-road`, `sold-port`,
  `paid-miners`, `told-truth`, `burned-file`. A mark is the flag
  `mark:<id>` holding the day it was made, set through `applyEffects()` in
  `engine.ts chooseOption()` via `consequences.ts marksSetBy()`. No card
  file was edited.
- **Reactions.** `CONSEQUENCES`: 36 rules, each mark + card + kind +
  option. **unlock** adds a new option (label/hint/outcome), **lock**
  blocks an existing option with `lockedText`, **change** replaces an
  option's hint and outcome. `consequences.ts shownOptions()` applies them;
  `engine.ts orderedOptions()` now shuffles the *shown* options, so the UI,
  number keys, the probe and `chooseOption()` all see the same set. A
  locked option cannot be chosen. **Tests/tooling that drive the game must
  pick from `orderedOptions()`, not `card.options`**: the sim, deck, shop
  and mandate tests were switched over.
- **Visible everywhere it matters.** Each shown option carries `because`
  (`types.ts ShownOption`/`Because`): the option shows "NEW OPTION ·
  Because you … (day N)" (teal edge) or "CHANGED · Because you …"
  (mustard edge); a locked one shows "✕ Because you … (day N): <reason>".
  The result repeats the reason (`lastOutcome.because`), and a decision
  that makes a mark says "ON THE RECORD: You … (day N). This will come up
  again." (`lastOutcome.marked`). The rail has a new **On the record**
  panel (`marksMade()`), under the Diary. "Brief me" explains it.
- **Rule for content:** a card must never have every option locked. A
  test sets every mark at once and checks each reacting card keeps at
  least two usable options. Adding a mark or reaction is content only.
- **State:** marks live in `flags` (no new field), but `lastOutcome` gained
  `because`/`marked`, so **`SAVE_VERSION` 13→14** (in-progress runs reset).
- **Measured** (100 random-play runs): a "Because you…" option on about
  **5.7 cards per run**, in 98% of runs, first around day 5; about 6 marks
  made per run; mostly changes (67%), then unlocks (29%), locks (4%).
  Balance probe: careful 62% → **67%** (reactions reward consistent
  choices), random 4%, first 2%, last 1%.
- **Not done:** reactions on demands and Back Room items (only cards react
  so far); more locks (they are the rarest kind); the coup crisis chain
  (still open from slice B).

**Slice C was playtested and approved** (*"Those playtests check out."*).
The balance phase, and with it Phase 3, is complete. Next is §22.

## 22. Next: mobile web + free hosting on GitHub Pages (2026-09-23)

The owner, verbatim: *"I am wanting to play this on my phone and maybe
share with family. I don't want to pay to host or publish obviously as this
is just a small side project for fun."* Then: *"I really don't care if it's
switched to a public repo as I am never going to share or promote it."*

- **Plan:** GitHub Pages (free static hosting) serves `npm run build`'s
  `dist/`. A GitHub Actions workflow deploys on every push to
  `claude/confident-meitner-lc0bgc`, so every verified merge goes live.
  Address: `https://ohfrinzx.github.io/Reign-Check/`. On the phone: open
  the link, then "Add to Home Screen". Saves stay in each device's
  browser (`localStorage`), with no accounts, and each family member has
  their own games. A `SAVE_VERSION` bump resets in-progress runs on
  every device.
- **Done by the owner:** repo is public (API: `visibility: public`); Pages
  on with source "GitHub Actions" (API: `has_pages: true`; the source
  setting can't be read from the cloud sandbox).
- **Not done:** the deploy workflow (a draft is in the brief), the first
  deploy, and the phone layout. Measured phone problems: masthead menu and
  ledger clipped, front page overlapping, result screen 82px too wide with
  Continue off-screen, faction rail hidden below 1080px.
- **Open decision for the owner:** publish now, or phone layout first.
- **The cloud sandbox cannot open `*.github.io`**, so the owner checks
  the live site.
- **Full brief:** `docs/MOBILE_AND_HOSTING.md`. It covers the plan, the
  status table, the draft workflow, troubleshooting, the measured
  problems, the suggested slice scope and guardrails (desktop at 1366×700
  unchanged, no `src/game/` changes, no hover-only info), and how to
  verify. `tools/phone-audit.mjs` is the starting measurement tool.

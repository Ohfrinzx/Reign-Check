# PROJECT STATUS — Reign Check (dev codename: Dictator Sandbox)


## ▶ WHERE WE STOPPED — 2026-09-23, later (BALANCE PHASE, SLICE B — BUILT, AWAITING PLAYTEST)

**Slice A was playtested and approved; the owner asked for much more
balancing.** Owner, verbatim: *"The changes you have added worked. Maybe
you haven't done it yet but the game needs WAYYYYY more balancing. I really
only notice 2-3 factions of the 6 drop. Even when its practically zero
nothing happens. Also look at these end game stats from my recent
playtest. I passed the last vote of confidence with 100% votes despite
these facts. as mentioned before the named changes you made I can confirm
seem to work well."* Their end screen: Elites **hostile**, Street
**furious**, treasury **-$20.3B**, public support 87, "Parliament confirmed
you", regime label "Earnest a Security State".

**What was wrong, measured:** the vote only read Grip and Legitimacy, never
the factions or the money; a faction at zero loyalty triggered nothing
unless its patience also ran out; always-first play had a visible faction
below 20 in 97% of runs and still survived 92%; public support was not tied
to the Street at all.

**Slice B, built:**
- **Option order shuffled per run** (seeded by run + card; same after a
  reload). Always-first survival: 91% → 1%.
- **Hostile factions act.** A faction at the bottom of its bar (loyalty
  below 20) pops up once ("The Elites turned against you"), then does
  something to you every morning — money leaves, leaks, strikes, protests,
  coup plotting — shown on the front page and desk ("working against you",
  danger 3 of 3), and makes a demand straight away. Stops when won back.
- **The confidence vote counts five faction blocs** (100 seats: Army 15,
  Security 10, Elites 20, Workers 25, Street 30). Each bloc follows its
  faction's mood plus Grip and Legitimacy; a hostile faction votes against
  as one; debt costs votes everywhere. Needed: 45 / 58 / 68. The reveal
  counts bloc by bloc. The owner's end state would now fail.
- **Rebalance:** rivals lose more when you please a faction; goodwill fades
  (keeping everyone happy takes constant work); public support follows the
  Street and Workers; a "Pensions & subsidies" cost that grows every day;
  lower taxes; an unhappy army raises coup pressure; demands come sooner
  and more often (~2.5 per full run, was ~1.7).
- **Fixed:** "Earnest a Security State" → "An Earnest Security State";
  desk threat pips now say "DANGER N OF 3" (they were never stages).
- **Measured after** (balance probe, 120 runs each): careful reader 62%,
  random 4%, always-first 1%, always-last 1%.
- **`SAVE_VERSION` 12→13** — the owner's in-progress run resets (the
  cross-run record and unlocks are untouched).
- 150 tests, production build, and the full browser suite (new
  `tools/hostile.mjs`) at 1366×700 pass with zero page errors.

**Next:** owner playtest of slice B. Then slice C (consequences: decisions
that unlock, lock or change later options, with a visible "Because you…"
note). Not done in B: a coup crisis chain; no card text was edited.

## ▶ WHERE WE STOPPED — 2026-09-23 (BALANCE PHASE, SLICE A — PLAYTESTED AND APPROVED)

**Crisis chains were played; the owner started the balance phase.** Owner,
verbatim: *"Lets move to the balance phase. 1st thing to address, Private
files should be apart of the daily events. most runs I don't get one until
act 2 or later. 2. Crisis screen should be isolated. Similarly to the
Breaking News alerts. 3. Favors are a good feature. However, though they may
be doing things in the back end. It never truly feels like it's been used.
If it's a favor to make something go away for example. It isn't clear if it
worked. when to use it. Or if you even used it for the thing you wanted to
use it on. It feels like a very empty button right now. 4. … as of now there
is no real strategy, I can spam 1 the entire game and still win. This needs
to be fixed. 5th. … It doesn't seem as if the vote of confidence is much of
a threat. The difficulty needs to be higher so there is more incentive to
read and think through decisions. During the balancing stage as well I want
to make sure that certain decisions can trigger and influence certain
choice options and outcomes."*

Answers to follow-up questions: private files **every day**; crisis stages
**full screen, "its own full dark screen mode with red accents… an
underground hidden situation room"**; option order **shuffled per run AND
rebalanced** ("Both"); difficulty **Hard** (careful play survives about
half the time).

**Plan — three playtested slices:** A (feel and clarity: items 1–3), B
(difficulty: items 4–5), C (consequences: decisions that unlock, lock or
change later options and outcomes, visibly).

**Measured before starting:** option 1 is the best choice on 45 of 81
standard cards (on average it gains support and loyalty, and even money);
always pressing 1 grows the treasury from $44B to $92B over a run and
passes every confidence vote by +11 to +44 (median +30).

**Slice A, built:**
- **A private file every day** from day 2 — 13 new "request" cards (one per
  character: Varkov's medal for a fallen sergeant, Doran's week with her
  sick mother, Brask publishing the real budget…). Grant for loyalty,
  refuse and lose some; that later decides offers and betrayals. Measured:
  a private file on 96–100% of days, the first on day 2.
- **The situation room** — every crisis stage now opens as its own
  full-screen dark scene with red accents (pulsing red light, "Situation
  room · Level B2", the three resources, the crisis card), then its
  outcome with "Leave the situation room →". It is always the day's first
  card.
- **Favours that visibly work** — each favour can be aimed at something
  you can see: a named scandal, a faction's demand, or a running crisis.
  The sidebar says "Useful now: <name>" or "Keep it for: <when>"; one with
  nothing to aim at is disabled with the reason. "Use it…" opens a dialog
  to pick the target, then a receipt names what went away ("'The
  stairwell' is gone…", "The Army dropped their demand…", "The Ostrene Gas
  Cutoff is over…") and what changed. Shop offers for favours now say when
  to use them.
- **Save:** no shape change — `SAVE_VERSION` stays 12; runs carry over.

**Verification:** 142/142 tests (7 new in `favours.test.ts`, 2 new/updated
in `characterEvents.test.ts`), build clean, full browser suite at 1366×700
with zero page errors, including new `tools/favours.mjs` and the updated
`tools/crises.mjs` (dark scene checked).

**What is next — slice B (difficulty):** shuffle option order per run and
rebalance so no single option type wins; make money actually run short;
retune the confidence vote so careful play survives about half the time;
raise demand frequency and coup pressure. **Then slice C
(consequences).**

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-22, latest (PHASE 3 STEP 3: CRISIS CHAINS — BUILT, AWAITING PLAYTEST)

**Step 2 (character-driven events, plus the Elites rename and the removed
Demands button) is owner-approved.** Owner, verbatim: *"all works. Go to
the next part. make sure documentation is up to date. Follow the previous
output guidelines but include a description of what is next."* So this
slice is step 3, and the hand-off below ends with what comes next.

**What was built:**
- **Five crisis chains** (`src/game/content/crises.ts`, 25 cards): The
  Bread Riots (unrest), The Free Zone Ledger (corruption), The Kordiva
  Referendum (separatism), The Ostrene Gas Cutoff (foreign), The Stairwell
  Tapes (scandal). Each is three stages — it starts, it spreads, it comes
  to a head — and stages 2 and 3 each have a **calm** and a **hot**
  version.
- **Rules** (`src/game/crises.ts`, no React, no random rolls): from day 4,
  when a pressure reaches its threshold (45; 50 for the tapes) and no chain
  is running, the most over-threshold chain starts. Stage cards arrive two
  days apart as the day's first card. Your choices add to a hidden score;
  a score below zero brings the hot version of the next stage. A couple of
  choices end a chain early (Kostyn's deal, Ostrene's price). One chain at
  a time, each once per run, 3-day gap between chains. The end-of-run
  summary records how you did ("Handled / Got through / Barely survived").
- **Why these five:** measured over 120 simulated runs per play style,
  these are the pressures that actually climb. Coup pressure almost never
  does (3–15% of runs reach 40), so a coup chain waits for the balance pass.
- **Look:** `CrisisCardView` — a third distinct card design, the
  "situation room": red crisis band with a 3-step tracker, the story beside
  a situation log of what you ordered at earlier stages and how it is going
  in words, and the options as numbered orders side by side.
- **Front page / desk** show "Crisis: <name> (stage N of 3)", how it is
  going, and when the next development is due.
- **Save:** `SAVE_VERSION` 11→12 — **in-progress runs reset**; the
  cross-run record is untouched.

**Measured (not tuned):** ~1 chain per run, in 78–95% of runs, the first
around day 7–12. Generous play almost always meets the Ledger; harsh play
meets Bread, Gas and the Referendum; random play sees all five. Both
versions of every stage get reached. Random-play survival 47% → 42%;
always-first 92%.

**Verification:** 135/135 tests (6 new in `crises.test.ts`), production
build clean, full browser suite at 1366×700 with zero page errors,
including new `tools/crises.mjs`. `tools/characters.mjs` needed a timing
fix (measure after the card's rise-in animation); it was a test issue,
not a layout bug.

**What is next — Phase 3 step 4, the balance pass** (the last piece of
Phase 3; needs a go-ahead). Everything Phase 3 added was measured, not
tuned. The pass would: (1) fix "one option every time wins" (always-first
still survives ~90%); (2) make demands more frequent (owner felt they were
rare); (3) make coup pressure actually rise, then add a coup crisis chain;
(4) re-check the confidence-vote thresholds (40/47/54) against the new
pressure — random-play survival fell ~51% → ~42% over Phase 3; (5) settle
crisis and character-event pacing. After that Phase 3 is complete. Full
list: `AGENTS.md` §18 "What is next" and `docs/DESIGN_V2.md` §9.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-22, latest (PHASE 3 STEP 2: CHARACTER-DRIVEN EVENTS — BUILT, AWAITING PLAYTEST)

**Step 1 (faction demands) is owner-approved** — see the block below. The
owner then said *"go ahead and move forward"*, and answered three design
questions for step 2:
- **Delivery:** *"just like the cards during the day. But with a different
  design and layout. I want there to be some variety between the cards and
  mini-games when we add them to reduce visual and gameplay redundancy."*
- **Scope:** betrayals **and** offers.
- **Endings:** a betrayal never ends the run by itself; only indirectly,
  through the existing pressures.

Mid-build, the owner also asked for two changes to step 1: *"No need to
have the demands tab at the top. and change the money factions name to
'Elites' or 'The Elites' depending on the context. Wording like 'Money
demands' doesn't make sense."* Both are done.

**What was built:**
- **Rules** — `src/game/characterEvents.ts` (no React). A character who
  starts losing faith (loyalty below 40, or rising plotting/grievances)
  gets a **front-page warning** in plain words. If they keep sliding
  (loyalty below 30, or more plotting/grievances), their **betrayal** card
  arrives on a later morning — never the same morning as the first
  warning. A character who is devoted to you (loyalty 72+) brings an
  **offer** instead. At most one per day, never two days running, none
  before day 3, each card once per run, only for characters still in post.
- **Why loyalty, not plotting:** measured over 120 simulated runs per play
  style, plotting only ever rises for Adamek (sometimes Kostyn); loyalty
  swings for everyone. The design doc's "plotting crosses a threshold" idea
  would have produced almost nothing but Adamek events.
- **Content** — `src/game/content/characterEvents.ts`: all 13 characters,
  each with a warning line, a betrayal (3–4 replies: confront, buy back,
  remove/arrest/sack, let it go) and an offer (3 replies, always with a
  catch). 26 cards. Betrayals raise existing pressures (coup, leaks,
  scandal, unrest, separatism…) and never end the run directly.
- **Look** — `CharacterCardView` in `CardView.tsx`: a light "private file"
  with a manila tab and stamp ("Acted alone" / "An offer"), a portrait
  column in the character's colour with where they stand in words, a typed
  memo, and reply slips side by side. Keyboard shortcuts still work.
- **Step 1 changes** — the masthead **Demands** button is removed (demands
  live in the pop-up and the rail panel only; below 1080px the pop-up is
  the only view); the **Money faction now reads "Elites"** everywhere it is
  shown ("the Elites" in sentences; the pop-up now says "A request from the
  Elites"). "Money" on the masthead ledger is still the treasury.
- **Save:** no `GameState` shape change — **`SAVE_VERSION` stays 11**, so
  an in-progress run from step 1 carries over.

**Measured (not tuned):** about 4 character events per run with random
play (1.9 betrayals, 2.0 offers), about 5 with always-first (mostly
offers — generous play earns loyalty), about 2 with always-last (mostly
betrayals); at least one in 97–100% of runs, the first around day 4–5.
Balance-probe survival barely moved (always-first 90% → 92%).

**Verification:** 129/129 tests (6 new in `characterEvents.test.ts`),
production build clean, and the full browser suite at 1366×700 with zero
page errors, including new `tools/characters.mjs` (warning first, the
betrayal the next morning in the private-file layout, side-by-side replies,
keyboard choice removes Piek, offer styling, Elites label) and an updated
`tools/demands.mjs` (no masthead button; the pop-up works at 1000px).

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-22, later (PHASE 3 STEP 1: FACTION DEMANDS — BUILT, AWAITING PLAYTEST)

**UPDATE (same day): step 1 is PLAYTESTED AND OWNER-APPROVED.** Owner,
verbatim: *"Ready all works. demands seemed relatively rare not sure if this
is normal? This can be adjusted in the balancing phase so go ahead and move
forward."* Measured afterwards (120 simulated runs per bot, no meeting or
bribing): about 1.4–2.1 demands per run, at least one in 93–100% of runs,
the first one around day 6–9. That is "relatively rare" by design — only a
faction below 35 patience asks, and patience drains slowly. **Frequency is
parked for the balance pass (step 4)**: the levers are `ISSUE_BELOW`,
`STAGE_DAYS`, `MAX_LIVE`, and how fast patience drains in `dayUpkeep()`.

**Phase 3 has started, one slice at a time. Step 1, faction demands, is
built and verified; it now needs the owner's playtest before step 2.**
Before starting, the branch was checked: the approved vote-reveal build
passed 113/113 tests, the build and the full browser suite, so nothing was
outstanding from Phase 2 or the reveal.

**The owner's spec, verbatim:** *"Demands should be pop-ups, being stored in
a menu or on the side where the user can expand, see which factions the
demand came from, the details of said demand, and an option to meet the
demand (if applicable), or bribe for extension of the demand (doesn't
always accept, If demands aren't met. It sometimes can lead to say a
military coup, or other means/attempts at removal. But it should depend on
the standing status with the faction and other conditions."* The agent
also chose (and reported) that the pop-up can be closed and dealt with
later from the panel.

**What was built:**
- **Rules** — `src/game/demands.ts` (no React). A visible faction whose
  patience falls below 35 issues a *request*; unmet, it becomes a *formal
  demand*, then an *ultimatum*, 2 days per stage, each escalation costing
  that faction's support. A request drops if patience recovers. At most 2
  live demands; one new one per morning.
- **Meet** — pays a price that rises with the stage (×1 / ×1.25 / ×1.5),
  plus side effects on someone else. **Bribe** — about a third of the price
  for 2 more days; the chance they accept depends on the faction's support
  and patience, the stage, and earlier bribes, shown only in words
  ("They will probably take it" / "might" / "will probably refuse"). A
  refused bribe costs nothing but offends them, and cannot be retried until
  the demand escalates.
- **Ultimatum runs out** — the faction either punishes you (heavy,
  survivable) or tries to remove you. Whether it tries depends on its
  support and power; whether it works depends on its power against what
  protects you (e.g. the Army against Security's support, your security
  services and your legitimacy). Success ends the run: Army → coup, Money →
  "a decision taken over lunch", Street → revolution, plus two new endings,
  Security → "The Sable Office opened your file" and Workers → "The country
  stopped working". Every ultimatum shows "What protects you: …" and a
  plain danger sentence.
- **Content** — `src/game/content/demands.ts`: 10 demands (2 each for
  Army, Security, Money, Workers, Street) with real numbers and named
  characters, and one move (attempt / failure / punishment) per faction.
- **UI** — `src/ui/components/Demands.tsx`: the pop-up (with Meet, Bribe,
  "Deal with it later"; or "Understood" for what a faction did), a
  **Demands** panel on the right rail whose rows expand in place, and a
  **Demands** button (with a count) in the masthead that opens the same
  list — the rail is hidden below 1080px. The front page lists live demands
  under Known issues instead of the old vague "patience running out" line.
- **Save** — `SAVE_VERSION` 10→11 (`FactionDemand` now stores ids/numbers
  only; new `demandNotices` queue). **In-progress runs reset**; the
  cross-run record is untouched.

**Verification:** 123/123 tests (10 new in `demands.test.ts`), production
build clean, and the full browser suite at 1366×700 with zero page errors,
including new `tools/demands.mjs` (pop-up, rail, meet, bribe
taken-or-refused, lapse pop-up, masthead access at 1000px). The older
browser scripts now close demand pop-ups as they walk through days;
`verify.mjs` met 2 demands in its real run.

**Balance, measured, not tuned** (120 runs per bot; the bots never meet or
bribe): *always-first-option* play went from 100% survival to 90% (5
Security removals, 6 Money removals, 1 other). Random and last-option play
barely changed. This helps with the known "one option every time wins"
problem but is not the fix — that is step 4, the balance pass.

**Found, not fixed (outside this slice):** `Effects.ending` sets flags that
nothing reads, so content can't force an ending through it (no content
uses it today). Separately, the regime name can read oddly (e.g. "Earnest a
Security State") when a modifier comes before "a". Both are recorded here
for a later slice.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-22 (confidence-vote reveal approved)

**The confidence-vote reveal is built, playtested, and owner-approved.**
After the merged implementation, the owner said: *"Play tested and working.
Please update all documentation on the REPO."* This approval closes the
reveal slice. After the earlier documentation-only pass, the owner gave
an explicit implementation go-ahead and allowed the recommended direction.
The selected design is a light Poster/Broadsheet **division board + clerk's
tally**, placed **before the Back Room** so purchases cannot retroactively
affect an already-calculated vote.

The engine now owns one pure `computeConfidenceVote()` calculation and saves
its exact result in `GameState.confidenceVote` during the new `vote` phase.
The UI only animates that frozen result; it never decides or rerolls it.
`completeConfidenceVote()` applies failure, intermediate act advancement, or
final survival exactly once. Higher-priority endings still pre-empt the vote.
The screen shows 24 clerk returns (not MPs or seats), the live score and
required line, Grip, Legitimacy, exact signed distance, and the final stamp.
It includes Reveal now, reduced-motion completion, reload safety, and one
screen-reader announcement at the result.

`SAVE_VERSION` bumped 9→10; old in-progress runs reset by design while meta
history remains separate. Verification: 113/113 tests, production build,
and the complete Playwright suite at 1366×700, including a dedicated partial
count/save/reload/final-result/Act-2 test, all passed with zero page errors.
No content or balance values changed. Phase 3 remains unstarted and still
needs explicit approval. Full implementation record: DESIGN_V2 §4.1a.

Carry forward the existing balance concern: repeatedly choosing the first
option can reach day 18 too reliably. Re-measure survival versus
noConfidence and actual vote margins; reaching the last day alone is not a
win. The previous approved Phase 2 handoff is preserved below as history.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-21 (later session, Phase 2 approved complete)

**PHASE 2 IS PLAYTESTED AND OWNER-APPROVED, IN FULL.** Owner, verbatim:
*"Playtest good, ready for next slice. Won't be doing it now. Just update
the current documentation for the next agent. Nothing more."* §4.5's both
steps (the cross-run record, and real unlock conditions with the Unlocks
screen) are approved alongside everything else — §4.1 through §4.5 are
now every one of them built, playtested, and approved. This turn was
documentation-only: no code changed, nothing was built. The owner has
**not** given the go-ahead to start Phase 3 — only confirmed Phase 2 is
done. Whoever picks this up next should wait for that explicit instruction
before starting faction demands, character-driven events, crisis chains,
or the balance pass (`docs/DESIGN_V2.md` §9), same staged-slice discipline
as every step of Phase 2.

**One concrete thing already on record for whenever Phase 3's balance pass
starts:** the owner played enough to notice you can win by picking the
same option repeatedly with little real risk — matches the balance
probe's own measurement (`npm test` → `balance.test.ts`): the "always
pick the first option" policy reaches day 18 in 100% of runs, only ever
ending in `survival`/`noConfidence`. Minigames (Phase 5) would not fix
this — it needs the Phase 3 balance pass specifically (known limitation
#2 in §5 below).

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-21 (later session, meta-progression step 2 — ALL OF PHASE 2 NOW BUILT)

**§4.5 (META-PROGRESSION), STEP 2 IS BUILT, AWAITING OWNER PLAYTEST — THIS
COMPLETES ALL OF PHASE 2 (§4.1 THROUGH §4.5).** The owner asked what
meta-progression would be; after the answer, asked whether minigames would
fix a separately-raised balance concern (no — that's Phase 3's balance
pass, not this), then specified where the unlock view should live: *"Add
it to a separate sub-menu within the advisors/deals tab along with a
button on the menu screen. That way users are able to see their progress
and can aim for specific goals to unlock certain cards."* Built the same
session as step 1, on `claude/exciting-dijkstra-jtlmbh`.

**What step 2 adds on top of step 1's record:** real unlock conditions,
now actually gating content, plus the UI to see them. `meta.ts` gains
`computeUnlockStats(meta)` (runsCompleted/survived/bestAct) and two plain
data tables — `MANDATE_UNLOCKS` (`clean-hands`: finish 2 runs; `pay-deal`:
reach Act 2 — the two mandates added after the original four) and
`SHOP_UNLOCKS` (`one-good-story`: survive once; `archivist`: finish 3
runs — the Back Room's only two `rarity: 'rare'` items). Everything not
listed in either table stays unlocked from run one, same as before this
slice. `isMandateUnlocked()`/`isShopItemUnlocked()` now evaluate these for
real, replacing step 1's `true`-always stubs.

`GameState.unlockedShopItemIds` (new field) is a snapshot taken once at
`createGame()` — deliberately not re-evaluated mid-run, so unlocking
something by playing doesn't retroactively change the run you're already
in. `state.ts`'s mandate roll/explicit-pick both respect a new
`NewGameOptions.unlockedMandateIds`, with a fallback that never locks out
every mandate. `shop.ts`'s stock roll and `engine.ts`'s `buyShopItem()`
(as an independent safety net, same pattern as the advisor/deal cap check)
both enforce the shop side. `SAVE_VERSION` bumped 8→9.

New `src/ui/screens/Progress.tsx` (`ProgressPanel` shared content +
`ProgressScreen` standalone overlay) is reused in exactly the two places
the owner asked for: a "Roster"/"Unlocks" tab pair inside `Manage.tsx`'s
"Advisors & Deals" screen, and a new "Unlocks" button on the title
screen's toolbar. The title screen's own mandate picker now filters down
to what's actually unlocked, rather than always listing all six.

**Verification:** 7 more new tests (107 total, up from 100) covering the
real unlock conditions, the mandate-roll/pick gating and its fallback, the
shop's default-everything-unlocked snapshot, a locked item never appearing
in stock, and `buyShopItem()`'s independent refusal. `tools/mandates.mjs`
extended significantly: confirms only 5 mandate options (4 unlocked +
random) on a cleared-storage fresh run, seeds a 3-run history that
satisfies every unlock rule at once, confirms all 7 options appear and the
previously-locked `clean-hands` mandate actually starts (not just renders),
and checks both Unlocks access points — the title button and the in-game
tab — agree on what's unlocked. Production build clean; all five
Playwright tools green at 1366×700 with zero page errors.

**Next:** owner playtests both steps of §4.5. Once played and approved,
**Phase 2 (docs/DESIGN_V2.md §4, §4.1–§4.5) is entirely done** — the next
phase is Phase 3 (content/systems depth: faction demands, character-driven
events, crisis chains, then the balance pass the owner already flagged a
concrete symptom for — see the "spam through and win" note in this
session's chat history) — but Phase 3 still needs its own explicit
go-ahead, same discipline as every step so far.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-21 (later session, meta-progression step 1)

**§4.5 (META-PROGRESSION), STEP 1 IS BUILT, AWAITING OWNER PLAYTEST.** The
owner asked what meta-progression would be; after the answer (below), said
"okay go ahead with that." The design doc's own suggested de-risking is a
two-step build — step 1: record every run, gate nothing; step 2 (a later,
separate slice): add real unlock conditions on top. This session built step
1 only, on `claude/exciting-dijkstra-jtlmbh`.

**What shipped:** a new file, `src/game/meta.ts` — `MetaProgress { version;
runs: RunRecord[] }`, its own localStorage key (`dictator-sandbox:legacy:v1`)
and its own version constant (`META_VERSION`, currently 1), deliberately
separate from `GameState`/`SAVE_VERSION` so deleting a save or restarting a
run never wipes cross-run history, and a future `GameState` shape bump never
discards it either. `recordRun(meta, s)` is a pure function that appends a
`RunRecord` (day, act, mandate id, ending id/kind/title, regime label,
leader name, timestamp), capped at the last 50 runs — it does not persist
itself; `App.tsx` calls `saveMetaProgress()` after it, in a `useEffect`
watching `game.ending`, guarded against double-recording by comparing the
ending object by reference (safe because states clone rather than mutate,
ground rule 3). The title screen shows a one-line summary once at least one
run exists (`TitleRecord` in `Screens.tsx`) — e.g. *"3 administrations so
far — 1 survived, 2 fell, most recently as A Security State (parliament
withdrew its confidence)."*

**Nothing is gated.** `isMandateUnlocked()`/`isShopItemUnlocked()` exist in
`meta.ts` as the hook step 2 will use, but both unconditionally `return
true` right now — no mandate or shop item is restricted by anything built
in this slice. No new content was needed (ground rule 5 holds): the record
only reads `GameState`, it doesn't change what `content/mandates.ts` or
`content/shop.ts` offer.

**Verification:** 7 new tests (`meta.test.ts`), 100 total (up from 93);
production build clean; a new dedicated browser check, `tools/legacy.mjs`
(no record line before any run exists, the line appears after a real
ending via "Back to title", the text survives a full page reload, and the
title screen still fits at 1366×700 with no scroll regression), plus the
four pre-existing Playwright tools re-run for regressions — all five green,
zero page errors.

**Next:** owner playtests step 1. Step 2 (real unlock conditions — e.g.
"played N runs" or "survived to Act 3 once" gating a specific mandate or
shop item) is a separate, not-yet-started slice and needs its own explicit
go-ahead, same staged discipline as every step so far.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-21 (later session, updated)

**§4.4 (THE RUN DECK) IS NOW PLAYTESTED AND OWNER-APPROVED.** Owner-played
and bug-checked by a ChatGPT-based agent — verbatim: *"Previous code was
playtested by me a bug checked by chatgpt agents. All approved and ready to
move onto the next slice."* §4.1, §4.2, §4.3, and §4.4 are now all built,
playtested, and owner-approved. **§4.5 (meta-progression) is next per the
staged order, but still needs its own explicit go-ahead** — the owner's
"ready to move onto the next slice" is a statement of intent, not yet a
start instruction for §4.5's specific scope, so this session held off
starting it and produced this documentation-audit-plus-report instead, as
asked.

This session (the one that built §4.4) worked on
`claude/exciting-dijkstra-jtlmbh`, merged forward from
`claude/confident-meitner-lc0bgc` first to pick up the mandates work (which
had landed on a separate branch, `codex/mandates-and-review`, since another
agent tool built it).

**The mechanic:** `GameState.runDeck: string[]` and `GameState.bannedCards:
string[]`, plus a new `Effects.deck?: { add?: string[]; remove?: string[] }`
field, handled in `effects.ts`. `add` pushes a card id into `runDeck`; each
copy held there raises that card's draw weight in `engine.ts`'s
`cardWeight()` — "a growing share of what you see is what you built,"
per the design doc. `remove` bans a card id into `bannedCards`, which
`cardWeight()`/`alertWeight()` both check first and always return 0 for —
banning always wins over held copies of the same id. Both only affect the
ordinary weighted draw; a card reached by `schedule`/`queueCard` still
arrives regardless, same as before. The recency gate (no repeat within 3
days) still applies on top, which caps how often even a heavily-boosted
card can show up — measured in `deck.test.ts`, this is a real, non-trivial
lift, not an unlimited one, and that is the intended shape.

**Content, folded into this slice per CLAUDE.md/AGENTS.md's rule that a
slice's content quota is authored as part of building it:**
- **8 new Back Room policies** in `content/shop.ts` that use `effects.deck`
  — 4 "add" (`sarran-standing-order`, `loz-standing-slot`,
  `piek-standing-invite`, `adamek-open-line`) and 4 "remove"
  (`automate-payroll`, `settle-with-gorsk`, `quiet-word-doran`,
  `close-free-zone-file`), each targeting a real, already-repeatable card
  from the existing pool so the effect is honest — buy one and that
  situation really does come back more, or stops coming back at all.
- **20 new standard cards** in a new `content/cards3.ts` (same authoring
  rules as `cards.ts`/`cards2.ts`), and **5 new alerts** appended to
  `content/alerts.ts` — this was also the content-volume top-up the design
  doc calls out (known limitation #1), and it filled in three drivers that
  had no alert at all before now: `scandal`, `corruption`, and `cult`
  (`alert-ledger-leak`, `alert-corruption-dossier`, `alert-cult-portrait`),
  plus `alert-currency-panic` (fiscal) and `alert-hadem-blockade`
  (separatism). `cards3.ts` is wired into `engine.ts`'s `ALL_CARDS`/
  `ALL_CARD_MAP`, zero further engine changes needed (ground rule 5).

**Save version 7→8: existing in-progress runs reset**, for `runDeck`/
`bannedCards`. Same discard-not-crash behaviour as every prior bump.

**Verification:** 93 tests pass (8 new: `deck.test.ts`'s 5 plus 3 more in
`shop.test.ts` for the new items), up from 85; production build clean; the
four Playwright tools (`verify.mjs`, `to-ending.mjs`, `playthrough.mjs`,
`mandates.mjs`, including save-version-8 rejection) all pass at 1366×700
with zero page errors — `playthrough.mjs` shows several of the new cards
and shop items surfacing naturally in a real run.

**Balance note, unmeasured before now:** the balance probe's `avgAlerts`
moved from 8.5 to 10.9 and `reachedMax` from 40% to 52% under the random
policy, from the 5 new alerts adding pressure to the pool. Flagging this
rather than tuning it blind — as with mandates, balance is a playtest
question, not one passing tests resolves.

**Next:** §4.5 (meta-progression) is the only unbuilt piece of Phase 2 left.
Wait for the owner's explicit go-ahead to start it — per
`docs/DESIGN_V2.md` §4.5's own suggestion, consider shipping it with
everything unlocked by default first (de-risking the slice the same way the
display-layer cut de-risked Phase 1), then layering in real unlock
conditions as a follow-up once that base loop is playtested.

**Post-merge review (Codex, 2026-09-21):** the full existing suite passed,
then adversarial review found one run-deck state invariant the original tests
missed: applying `deck.add` after a permanent ban put an undrawable, dead copy
back into `runDeck`. `applyEffects()` now ignores additions whose ids are
already in `bannedCards`, with a regression covering remove-then-add order.
The shop integrity suite now really verifies that every deck policy targets a
known card (the test name previously claimed this but the assertion was
missing), and a no-op `* 0` term was removed from the new casino card's
weight. Documentation now reports the actual alert count: 5 new alerts, 14
total, not 6 new. Verified after the fixes: 93 vitest tests, production build,
and the full 1366×700 Playwright gate, all clean with zero page errors.

---

## Previous handoff — historical, superseded by the block above

## ▶ WHERE WE STOPPED — 2026-09-21

**§4.3 MANDATES IS BUILT, AWAITING OWNER PLAYTEST.** The owner asked to begin
next steps and review existing code. This session implemented only the next
roadmap slice, plus concrete review fixes, on `codex/mandates-and-review`.
When asked whether the mandate table's Money means cash or business loyalty,
the owner selected **Treasury**.

Six mandates: Stairwell, Landslide, Handover, Accident, Clean Hands Promise,
and Pay Deal. Choose one or let the seeded RNG choose. The title screen shows
starting changes and the selected rule; the briefing, Brief me, and ending
retain the origin. The old randomized opening scenarios are replaced, not
stacked under a contradictory origin. Faction loyalty starts near neutral,
then the origin applies its changes with the existing relationship spillover.

Generic data hooks in `content/mandates.ts`: start effects, daily effects,
extra decisions, shop price multiplier, pressure-growth and patience-loss
multipliers. Daily effects begin on day 2; the Pay Deal's budget line starts
on day 1. The Stairwell schedules its one-time recording decision for day 4.
The Handover discounts positive prices only; payouts remain unchanged.

**Save version 6→7: existing in-progress runs reset.** The title no longer
offers Continue based solely on stale metadata for an unreadable old save.

Review fixes include deterministic effect IDs, duplicate-action protection,
paid promises wrongly lapsing later, construction charged twice, cash-paying
deals/zero-cash exits blocked while in debt, favour receipts replacing the
current decision, and the shop exit requiring scrolling. Browser tools now
use portable paths and fail on actual verification failures. Details and
validation evidence: `docs/REVIEW_2026_09_21.md`.

**Verification:** 85 tests pass (including 200 simulated runs and full-state
replay across every mandate); production build clean. Real Chromium checks
at 1366×700 cover all six starts, rules, save/reload, version-6 rejection,
keyboard activation, discount/payout behavior, shops, endings, restart and
act transition. `npm run test:browser` starts its own Vite server.

**Next:** owner playtests this slice. Do not begin §4.4 (run deck) or §4.5
(meta-progression) before feedback and an explicit instruction. Earlier acts
and shop approval remains valid. Phase 3 balance and Phase 4 mobile remain
deferred. The simulation still strongly rewards accommodating play; mandate
balance is a playtest question, not a claim resolved by passing tests.

---

## Previous handoff — historical, superseded by the block above

> Read `AGENTS.md` first (the shared, model-agnostic knowledge base for
> every agent on this project — Claude, ChatGPT, or otherwise), then
> `CLAUDE.md` (Claude Code's copy of the same handover), then this file,
> then `docs/DESIGN_V2.md`.
> Last updated: **the owner has playtested and approved everything built so
> far** — §4.1 (acts + confidence vote), §4.2 (the Back Room shop, both
> chunks, 47 items, dark fullscreen presentation, "Advisors & Deals",
> advisor/deal caps with held-panel), and the day-in-act display fix
> (`Day N / 6` instead of `Day N / 18`). Owner, verbatim: *"All up to date
> content has been playtested and is approved."* Nothing is mid-loop or
> awaiting feedback right now. §4.3 (mandates), §4.4 (the run deck), and
> §4.5 (meta-progression) are still **NOT started and still need an explicit
> owner go-ahead to begin** — approval of what's built so far is not by
> itself that go-ahead. See the block immediately below.

> ## ▶ WHERE WE STOPPED — READ THIS FIRST
>
> **EVERYTHING BUILT SO FAR IS OWNER-APPROVED.** The owner's own words:
> *"All up to date content has been playtested and is approved."* This
> closes out §4.1, §4.2 (both chunks), and the day-in-act display fix as
> playtested-and-signed-off, not just "built, awaiting playtest" — do not
> reopen or re-verify any of that work speculatively; if a fresh session
> hears new feedback on it, treat that as new information, not evidence the
> earlier approval didn't happen.
>
> **This does NOT mean §4.3/§4.4/§4.5 are greenlit.** Per the project's
> build → report → playtest → iterate discipline, approval of the shop/acts/
> display slice is not automatically a go-ahead for the next slice — that
> needs its own explicit owner instruction. If the owner's next message says
> to start mandates (§4.3), begin there per `docs/DESIGN_V2.md` §4.3's table
> and the content quota folded into it (the 4 already-specified mandates
> plus 2–4 more). Until then, there is no in-progress Phase 2 slice.
>
> **New, same message: the owner is bringing ChatGPT-based agents onto this
> project alongside Claude Code sessions, and wants every agent — regardless
> of model — working from one consistent knowledge base.** `AGENTS.md` (repo
> root, new) is that shared, model-agnostic file: project state, ground
> rules, writing rules, content-authoring format, commands, the code map,
> and the git/verification workflow, written so any coding agent can pick up
> the project cold without Claude Code-specific assumptions. `CLAUDE.md`
> still exists (Claude Code reads it automatically at session start) and now
> opens by pointing to `AGENTS.md` as the canonical copy of those sections —
> **if you edit ground rules, writing rules, the content format, the code
> map, or the git workflow, edit `AGENTS.md` and mirror the change into
> `CLAUDE.md`, in that order, so the two never drift.** `PROJECT_STATUS.md`
> (this file) and `docs/DESIGN_V2.md` are unaffected — they stay the
> narrative history/design record, not the ground-rules reference.
>
> ---
>
> ### The block below (the day-in-act display fix) is the previous slice, now superseded as the current task
>
> **DISPLAY FIX: the day counter now tracks the current act, not the whole
> run.** Owner: *"Instead of having it display <day>/18 change it to 6. I
> would rather track how many days are left in the act."* Both places the
> game shows a day fraction — the masthead's `Act N of 3 · Day X / Y` strap
> (`App.tsx`) and the front-page briefing's `ACT N OF 3 · DAY X OF Y` edition
> line (`Screens.tsx`) — now compute `X` as the day within the current act
> (1–6, via a new `dayInAct()` in `state.ts`) and `Y` as `ACT_LENGTH` (6),
> instead of the absolute run day (1–18) over `maxDays`. `GameState.day`
> itself is unchanged — it still counts 1–18 across the whole run, and every
> other place that reads it (save/load, endings, the confidence-vote day
> check, `dateLine()`) is untouched. `dayInAct()` is a pure derived read with
> no new state field, so **no `SAVE_VERSION` bump was needed** — old saves
> keep working. Two onboarding lines in `Intro.tsx` that mention day counts
> in prose (not as a `X / Y` fraction) were deliberately left as-is, per the
> owner's explicit "do not begin any additional content changes besides the
> stated change."
>
> **Verified:** a new vitest case (`dayInAct` in `sim.test.ts`) checks every
> day 1–18 maps to the right 1–6 value, including both act boundaries (day 7
> and day 13 reset to 1, days 6/12/18 read as 6) — 60/60 tests pass, `tsc
> --noEmit`/`npm run build` clean, and a targeted Playwright run at 1366×700
> drove through both act boundaries and recorded the masthead/edition text at
> each transition: `ACT 1 OF 3 · DAY 6 / 6` on day 6, flipping to
> `ACT 2 OF 3 · DAY 1 / 6` on day 7, and the same at the day 12→13 boundary
> into Act 3 — zero console errors.
>
> ---
>
> ### The block below (§4.2 chunk 2) is the slice before that, now superseded as the current task
>
> **§4.2 CHUNK 2 IS BUILT: THE ITEM POOL WENT 17 → 47.** Owner: *"aim for 30
> more."* 9 new advisors, 8 new policies, 8 new favours, 5 new deals — every
> one grounded in the existing cast and world (`content/country.ts`): Varkov,
> Sarran, Kostyn, Adamek, Vel, Loz, Hess, Grebs, Vask, Piek; the Grand
> Convocation, the Central Bank, Ostrene/Aureth/Sereth/Drovna, the Pigeon
> Federation, Dovra Day. Two of the new deals (`pigeon-endorsement`,
> `drovna-understanding`) run on a day-to-day timer, alongside the existing
> `three-judges` — 3 of 9 deals timed, "a few, not all," per the owner's
> instruction. No engine changes were needed; every new item uses the
> mechanisms chunk 1 already built (`fireCost`/`cutCost`, `durationDays`,
> commitments, the daily/lossMult hooks).
>
> **One real bug caught while authoring, not before:** `regime.cult` doesn't
> exist — "cult" is a `hidden` pressure, not a regime axis. `tsc` caught it
> immediately (`dovra-broadcast`'s effects), fixed by moving it to `hidden`.
>
> **One test bug caught by the new content, not a game bug:** `'never offers
> the same item twice in a run'` assumed every "affordable" purchase attempt
> succeeds. With the new deal cap, `pigeon-endorsement` was correctly
> refused (3/3 deal slots already held) but the test still recorded it as
> "bought", then saw it offered and refused again later and flagged a false
> duplicate. Fixed to check `shopBought` actually grew, the same pattern
> `shop.probe.ts` already used correctly.
>
> **Measured after adding the content** (`shop.probe.ts`, 150 runs ×4 buying
> styles): purchase frequency spread 0.01–0.9 across the pool, no item
> dominating, `avgDays`/`reachedDay18`/ending distributions all in line with
> the pre-chunk-2 baseline — no runaway outlier. The advisor/deal caps don't
> get stress-tested much by the probe's simple buyers (they buy globally
> cheapest/priciest regardless of kind, not "all advisors"), so this measures
> general economy health, not cap pressure specifically — the caps were
> already verified directly (engine tests + browser) when they were built.
>
> **Verified:** 59/59 vitest tests still pass (no new tests needed — the
> existing generic content-integrity tests, e.g. "every item states a price/
> upside/catch", automatically covered all 30 new items), `npm run build`
> clean, and all three Playwright tools at 1366×700 with zero console
> errors, including a screenshot confirming new content renders correctly in
> both the nightly and act rooms.
>
> ---
>
> ### The block below is chunk 1 + its owner follow-ups, now superseded as the current task
>
> **§4.2 (the Back Room shop) CHUNK 1 IS BUILT AND AWAITING PLAYTEST.** The
> owner greenlit it with one amendment to the spec: **the shop opens at the
> end of EVERY day**, not only between acts.
>
> **What chunk 1 is:** a two-size room. The **nightly room** offers 3 cheap-to-
> mid items and sells you exactly one — taking something closes the room. The
> **act room**, on the night an act's confidence vote is passed, offers 5 from
> the whole pool including at least one expensive item, and sells you as much
> as you can pay for. 17 items across four kinds: advisors (permanent
> passives), policies (permanent rule changes), favours (one-shot, kept in the
> right rail and spent on any later day) and deals (one-off transactions,
> several of which PAY you and charge the real price elsewhere). Every item
> states its price and its catch in plain text before you buy; only `rare`
> items have no catch.
>
> **Architecture:** one engine hook, as §4 demands — `buyShopItem()` resolves
> a purchase through `applyEffects()` exactly like a card option. Two small
> ongoing hooks: `applyCoupling()` in `effects.ts` reads owned items'
> `lossMult`, and `dayUpkeep()` in `engine.ts` applies their `daily` rules.
> Everything else is data in `src/game/content/shop.ts`. `SAVE_VERSION` 3→4,
> so **any in-progress owner save is discarded** — that is by design
> (ground rule 10) and the owner should be told their old run will reset.
>
> **Pricing and variety were MEASURED, not guessed** — `shop.probe.ts` is the
> instrument and it is kept in the repo for exactly that reason. First pass
> was wrong: an unrestricted buyer bought all 17 items in a single run. That
> produced the one-buy-a-night rule, a reprice against the real treasury curve
> (median ~$35–40B), and the once-per-run rule. See `docs/DESIGN_V2.md` §4.2
> for the table of what was found and what changed.
>
> **Known and deliberate:** 17 items is a small pool for 17 nightly visits —
> an efficient buyer still sees ~12 of them. That is the pool-size ceiling and
> it is what chunk 2 fixes (target ~35–40 items for a nightly shop, not the
> ~24 the original between-acts spec asked for). **If the owner says the shop
> feels samey, that is this, and the fix is content, not mechanics — run
> `shop.probe.ts` before changing any rule.**
>
> **The Back Room is DARK — the only dark screen in the game.** Owner request
> after the first build: *"I really want it to feel as if you are some place
> else."* Entering the shop swaps the whole viewport to a dark version of the
> same Poster system. **This is NOT the dark desk skin rejected in Phase 1**
> — that was different type proposed as the game's default. Dark here is the
> exception that makes the rest read as daylight, so do not darken anything
> else without asking. `.app.dark` in `index.css` does it as a token swap.
> Verified with a computed-style contrast probe in a real browser, not just
> screenshots — see `docs/DESIGN_V2.md` §4.2 for the `color`-inheritance trap
> it caught.
>
> **The Back Room is also FULLSCREEN — owner follow-up on the same request.**
> "The only thing on the screen is the shop": entering it now removes the
> masthead, strap and rail entirely, not just visually — `App.tsx` returns a
> separate `<div className="app dark shop-full">` early for `game.phase ===
> 'shop'`, with nothing in it but `<ShopScreen>`. (This also makes the earlier
> note about the masthead's `--bar` tokens moot for the shop specifically —
> the masthead simply isn't there anymore during it.) **The shop's own
> "Leave" button (`.shop-foot .btn-primary`) is now the only way out** — there
> is no `.strap-action` during the shop phase at all. All three Playwright
> tools broke on this exact point on first run of this round (they'd fall
> through to `.strap-action` and find nothing) and needed the same one-line
> fix each; any new tool that drives the shop needs to know this.
>
> **New: "Advisors & Deals" — a screen opened from the masthead during the
> main game**, showing everything the Back Room has sold you. Advisors can
> be FIRED here — `fireAdvisor()` in `engine.ts`, costing whatever
> `fireCost`/`fireEffects`/`endsCommitment` `content/shop.ts` gives that
> advisor (every advisor has *some* real cost or consequence to letting them
> go, same everything-has-a-downside rule as buying one — enforced by a test).
> Deals just report themselves: most are "Ongoing" (permanent); a few carry
> `durationDays`/`expireEffects` on `ShopItemDef` and count down on a
> day-to-day timer, ticked in `dayUpkeep()` next to commitments/projects.
> Only one item uses it so far — `three-judges`, 5 days, then a scandal bump
> as the arrangement becomes public — proving the mechanism works; more
> timed deals is future content, not a mechanics gap.
>
> **Second owner follow-up, same session: advisors and deals are CAPPED.**
> *"I want there to be a set number of deals AND Advisors that can be held
> at a time... to incentivize the player to choose wisely or even fire/cut
> deals in order to buy a new one."* `ADVISOR_CAP`/`DEAL_CAP` in `shop.ts`,
> both `3`, tracked separately. Past the cap, buying that kind is blocked
> (offer stays visible, disabled, with a plain-text reason) until you free a
> slot. This made EVERY deal — not just timed ones — occupy a slot:
> `GameState.heldDeals` replaces `activeDeals` (a permanent deal gets
> `daysLeft: undefined` and just sits there using a slot forever until
> cut). New `cutDeal()` in `engine.ts` is the deal equivalent of
> `fireAdvisor()` — pays `cutCost`, applies `cutEffects`, ends the
> commitment if any, frees the slot immediately; cutting a timed deal early
> skips its `expireEffects` (that only fires when the clock runs out on its
> own). `GameState.endedDeals` records whether a finished deal ran its
> course or was cut, so it never shows as "Ongoing" after the fact. Every
> deal now has a real cost or consequence to being cut short, same rule as
> firing, checked by a test. `SAVE_VERSION` bumped 5→6.
>
> **New UI, per the owner's explicit ask: a held-panel INSIDE the shop
> itself**, right-hand sidebar, showing your advisor/deal slots live with
> Fire/Cut buttons — freeing a slot to buy something new never means
> leaving the shop. Reuses `Manage.tsx`'s row/control components (now
> exported, plus a new `CutControl`) in a compact mode, so the shop's
> sidebar and the main-game "Advisors & Deals" screen share one visual
> language. The main-game screen also gained Cut buttons for deals (it only
> had Fire for advisors before) — same capability, both places, for
> consistency.
>
> **Measured, not assumed:** re-ran `shop.probe.ts` after adding the caps —
> with only 5 advisors/4 deals in the pool, `ADVISOR_CAP`/`DEAL_CAP` (3
> each) barely restricts a simulated buyer yet. Expected: the caps are
> sized for the bigger pool chunk 2 is adding, not the current one.
> Re-check after chunk 2's content lands.
>
> **Also fixed in passing:** `tools/verify.mjs`, `tools/to-ending.mjs` and
> `tools/playthrough.mjs` had been stale since the Poster rebuild (they still
> looked for `Take Office`, `.card`, `.action-bar`, `.dossier`, `.daychip` and
> the removed night-sheet button, so none of them could complete a run). All
> three now run clean, handle the shop step (including the fullscreen/
> `.shop-foot` change above), and are back to being a usable merge gate.
>
> **Verified before merge:** 59/59 vitest tests pass (was 32 → 44 → 59; the
> latest +15 cover cap enforcement for both kinds, cutting a permanent deal,
> cutting a timed deal early — confirming `expireEffects` is skipped —
> cap-then-cut-then-buy composition, and the content-integrity checks
> above), `npm run build` clean, and all three Playwright tools run at
> 1366×700 with zero console/page errors — a full 18-day run visiting 17
> shops, an aggressive run to a non-survival ending, a save/reload resume
> across the version bump, plus targeted browser checks confirming: the
> shop screen has literally nothing else on it; firing an advisor from
> "Advisors & Deals" removes it live; the held-panel fills to 3/3 and blocks
> a 4th advisor with the right message; firing/cutting from the held-panel
> frees the slot live; and the main-game "Advisors & Deals" screen shows the
> same Cut control.
>
> ---
>
> ### The §4.1 block below is the previous slice, now superseded as the current task
>
> **§4.1 (acts + confidence vote) is built and has had one playtest-and-fix
> round on top of it. Nothing else in Phase 2 (shop/mandates/run deck/
> meta-progression) has been started. If you are a new agent picking this
> up cold, read in this order:**
>
> **1. The slice itself:** a run is now **3 acts of 6 days (18 days
> total)** instead of a flat 30. Each act ends with a **confidence vote** — a
> real check of the player's Grip/Legitimacy composite (the same numbers
> already on the masthead), not a day-counter formality. The threshold rises
> each act (40 / 47 / 54, tuned against simulated play). Failing a vote ends
> the run immediately with a new ending (`noConfidence`,
> `src/game/content/endings.ts`). Passing the final act's vote is the
> existing survival ending. `GameState.act` was added (`types.ts`),
> `SAVE_VERSION` bumped 2→3 (`state.ts`), the vote logic lives in
> `finishDay()` (`engine.ts`) reusing the existing `checkEndings()`/
> `EndingDef` pattern.
>
> **2. Playtest round 1 — what the owner found, and what was fixed:**
> - Masthead was left-heavy (Brief me/Menu crowded the nameplate, the whole
>   right side past the red stripe was empty). Fixed by moving the buttons
>   to sit with the Ledger on the right.
> - Two duplicated elements: the bottom "Begin the day"/"Begin Day N" button
>   on the Briefing/Night screens (the top strap button already covers
>   reachability) and the Money/Grip/Legitimacy ledger repeated on the front
>   page (masthead already shows it). Both removed; the freed front-page
>   space now holds a real itemized daily budget (`computeBudget()`,
>   previously had no UI surface anywhere in the game).
> - The glossary's hover-only `<abbr>` was retired entirely — `Prose`/
>   `Glossed` (`src/ui/components/Prose.tsx`) now render plain text
>   everywhere. Replaced with a plain-text "Terms" footnote at the bottom of
>   the main decision card (`CardView.tsx`), listing any glossary term that
>   specific card actually uses.
> - Card voice: cut a recurring rhetorical tic — "[quiet action], which is
>   [somehow] worse than/the point of X" — that made the player decode an
>   implication instead of being told what happened (~30 instances across
>   `cards.ts`/`cards2.ts`/`followups.ts`/`alerts.ts`). Every flavor line
>   was rewritten to state a plain fact from the card's own body instead of
>   mood-setting. No effects/mechanics touched — prose only.
> - The header's red Act/Day badge was a fixed-width shape sized for the
>   old, shorter label; once "Act N of 3 ·" was added it straddled the text
>   messily. Now sized to the label text itself (padding, not a guessed
>   width) — see `.masthead .mid .lbl` in `src/styles/index.css`.
> - **Day-1 card repetition, diagnosed with data, not guesswork:** simulated
>   300 new games and found only 6 of 31 standard cards had no `minDay`
>   restriction, so day 1's 3–5 slots were drawing from the same tiny pool
>   every run (top card in 85% of games). 25 cards were gated to `minDay: 2`
>   or `3` for pure pacing reasons left over from the old flat-30-day
>   design, with no actual narrative dependency on elapsed time. Loosened
>   `minDay` on 19 of them and added 5 new day-1 cards
>   (`old-cabinet`/`first-address`/`welcome-gift`/`state-funeral`/
>   `hess-first-meeting` in `cards2.ts`). Day-1 variety is now 24 distinct
>   cards, top one at 29%. **If a future session hears "I keep seeing the
>   same cards" again for a LATER day (not day 1), run the same kind of
>   simulation before assuming it's fixed** — `minDay` gating on other days
>   was not audited, only day 1.
>
> All of round 2 is prose/UI/content-gating only — no engine mechanics were
> touched. 13/13 tests pass, build is clean, and every visual change was
> checked in a real headless-browser pass (Playwright, 1366×700) before
> being called done, not just eyeballed in source.
>
> **3. Where this stands / what to do next:** this is round 1 of live
> playtesting on the §4.1 slice, not round 1 of the whole Phase 2 feature.
> The owner's framing: keep "iron[ing] out" this build before moving to the
> next content-development step (§4.2, the Back Room shop). Concretely:
> - If the next session opens with more playtest feedback on this same
>   slice, handle it the same way this round was: don't guess at causes —
>   simulate/measure where the game's own vitest+Playwright tooling makes
>   that possible (see how the day-1 repetition question was answered
>   above), make the targeted fix, verify with `npm test` + `npm run build`
>   + a real browser check, commit with a clear message.
> - Do NOT start §4.2 (shop)/§4.3 (mandates)/§4.4 (run deck)/§4.5
>   (meta-progression) until the owner explicitly says this slice is done.
> - **Branch note:** this session's work happens on
>   `claude/exciting-dijkstra-jtlmbh` (per runtime instructions), which is
>   **not** the repo's default branch — that's `claude/confident-meitner-lc0bgc`
>   (per `CLAUDE.md`'s Git section). The owner has been merging one into the
>   other via PR after each session. If a fresh agent's pushes don't appear
>   where the owner is looking, check which branch they're viewing before
>   assuming anything went wrong — see git log on both branches.
>
> **The rest of this "WHERE WE STOPPED" block (below) is the PRE-EXISTING
> Phase 1 handover, kept for context on how the project got here — it is no
> longer the current task, the block above is:**
>
> The owner played the real Poster/Broadsheet build (3 resources, 5
> factions, the jargon glossary) and said, verbatim: *"Ok everything seems
> to run and look good. So I believe Phase one playtests are complete."*
> They then said: *"begin phase [t]wo of building... I will be starting a
> new [chat] to begin Phase 2 so the agent needs to be able to easily
> understand EXACTLY where to continue from and what to do."* This file, plus
> `CLAUDE.md` and `docs/DESIGN_V2.md`, is that handover — written for exactly
> this moment.
>
> **Timeline that got here:** V1 shipped → playtest 1 (context/scrolling/
> wording/economy) fixed in full → playtest 2 passed functionally but
> flagged the design direction ("too many things to keep track of") → three
> rounds of mockup review (dark desk rejected; owner picked the **Poster**
> skin, then the **Broadsheet** layout) → built, plus a glossary system for
> jargon → owner playtested the real build and passed it, twice (once after
> the initial build, again after the jargon-coverage follow-up) → **Phase 1
> closed.**
>
> **Both formerly-open questions are now resolved, not just Phase-1-complete
> in general:**
> 1. ~~Was the display-layer cut (3 resources/5 factions over the unchanged
>    engine) enough, or does it need the deeper data-model rewrite?~~ →
>    **Enough.** The owner played it and raised no density/tracking
>    complaint. Do not start the deeper rewrite in `docs/DESIGN_V2.md` §3
>    speculatively.
> 2. ~~Roguelike layer next, or more polish first?~~ → **Roguelike layer
>    next.** This is now the only outstanding work.
>
> **What to do next:** Start `docs/DESIGN_V2.md` §4 (the roguelike layer —
> acts, the Back Room shop, mandates, a run deck, meta-progression), in the
> staged order §6 gives, beginning with §4.1 (run structure: 3 acts of ~6
> days ending in a confidence vote) as its own shippable, playtestable slice.
> **Build that first slice, then STOP and report back for playtest before
> touching the shop/mandates/deck** — the same build → report → playtest →
> iterate loop that got Phase 1 right three times running. See `CLAUDE.md`'s
> "PHASE 2 IS GREENLIT" section for the concrete first steps (which files,
> which fields, the `SAVE_VERSION` bump this will need).
>
> Read `docs/DESIGN_V2.md` in full before touching the UI, the display
> layer, or starting Phase 2 — it records what was proposed vs. what
> actually shipped for Phase 1, and has the complete Phase 2 spec.
>
> **Since then, the owner asked for the full plan beyond Phase 2 too** —
> "finish and polish this game out with the proper architecture to continue
> adding and building," plus keeping future iOS/mobile support in mind
> without doing that work now. That plan now exists: `docs/DESIGN_V2.md` §4
> was expanded with a content quota folded into each Phase 2 sub-step (so
> "add more content" happens as part of building the systems, not as a
> separate pass), §9 lays out Phases 3–5 (content/systems depth → mobile/iOS
> → remaining nice-to-haves), and §10 gives the mobile guardrails to follow
> while building Phase 2 (mainly: keep new engine logic in `src/game/` with
> zero React/DOM, ground rule 11). None of this changes what to build right
> now — it's still §4.1 first, per above — it just means the next several
> check-ins after that already have a planned runway instead of stopping at
> "what next?"

---

## 1. Project overview

**Reign Check** (dev codename: Dictator Sandbox) is a browser-based,
card-driven political leadership simulation. The player is the **Executive Chair** of the fictional **Republic of
Velmorra** and must stay in power for 30 days while managing seven factions,
thirteen recurring characters, a real budget, and a schedule that is regularly
interrupted by **Breaking Alerts**.

Design pillars, in priority order:

1. **Interesting choices** — every option has a visible trade-off in its hint.
2. **Meaningful consequences** — every major decision schedules something later.
3. **Replayability** — five opening scenarios, seeded RNG, state-reactive deck.
4. **Surprise** — alerts interrupt mid-day, weighted by hidden pressures.
5. **Emergent identity** — the regime is *named at the end*, never selected.

The core rule the engine enforces: **every major decision changes the future
state of the game**, not just the current numbers.

**Stack:** React 18 + TypeScript + Vite. No backend. Hand-written CSS design
system (no Tailwind). `localStorage` save. Vitest for simulation tests,
Playwright scripts for real-browser playthroughs.

---

## 2. Current milestone

**MILESTONE 1 — PLAYABLE CORE: ✅ COMPLETE.**
**PLAYTEST ROUND 1 FIXES: ✅ COMPLETE.**
**PLAYTEST ROUND 2: ✅ PASSED functionally. Design direction question raised.**
**POSTER/BROADSHEET REBUILD + WORDING WIDENING: ✅ COMPLETE.**
**PLAYTEST ROUND 3 (the actual Poster/Broadsheet build): ✅ PASSED.** *"Ok
everything seems to run and look good."* **PHASE 1: ✅ DECLARED COMPLETE BY
THE OWNER.**
**PHASE 2 — THE ROGUELIKE LAYER: ✅ COMPLETE, PLAYTESTED, OWNER-APPROVED.**
§4.1 (acts + confidence vote), §4.2 (the Back Room shop, both chunks), §4.3
(mandates), §4.4 (the run deck), and §4.5 (meta-progression, both steps —
the cross-run record and real unlock conditions with the Unlocks UI) are
all **BUILT, PLAYTESTED, AND OWNER-APPROVED**. Nothing in Phase 2 remains.
Phase 3 has not been given its own go-ahead yet — see the "WHERE WE
STOPPED" block above, `AGENTS.md`, and `CLAUDE.md`.

### Playtest round 2 — what was reported, and what was done

> "Second play test checks out. I am not sure I love the design direction
> though. There seems to be too many things to be keeping track of. I want it
> to be a bit more simplistic with a more creative and fitting design. I want
> to eventually evolve this with rogue like elements like unique runs, shops,
> etc."

Measured cause, not a matter of taste: **five of the ten headline stats are
near-duplicates of a faction bar** (ELITE/Business and SECURITY/Security move
together 100% of the time; MILITARY/Army 96%; STABILITY/Unions 89%;
PUBLIC/Public 76%). **55 trackable numbers** can be on screen at once. Full
analysis and proposal in `docs/DESIGN_V2.md`.

Resolved through a design-exploration exchange (mockups reviewed, direction
picked each round), then built:

| What | Outcome |
|---|---|
| Visual direction | Dark desk mockup rejected ("way too similar to the last"). Three light skins mocked up; owner picked **Poster** (cream newsprint, condensed black type, one red). |
| Layout | Four Poster-skinned layouts mocked up; owner picked **Broadsheet** ("Go with 1") — masthead, front-page briefing, card-as-lead-story, right rail. |
| Information density | Implemented as a **display layer** (`src/game/display.ts`) over the unchanged engine: 3 resources (Money/Grip/Legitimacy) instead of 10 stats, 5 factions with one mood each instead of 7×3 bars, threat cards instead of a prose warning list. ~55 trackables → ~9–12. This was an engineering judgment on HOW to cut, not something the owner explicitly chose between (vs. a full data-model rewrite) — see `docs/DESIGN_V2.md` §3. |
| Roguelike elements | **Not built at the time of this table.** Proposed in `docs/DESIGN_V2.md` §4. Since greenlit by the owner — see the "WHERE WE STOPPED" block at the top of this file, this is now current work. |

### Playtest round 3 — what was reported, and what was done

> "Go with 1. Again though the text needs to be more clear for users who may
> not understand this sort of political language. Example being most people
> don't know what clearing the payroll means and how what their decision will
> effect. Everything else so far is perfect. Go ahead and build in this
> design and layout, fix wording some more, than check back with me."

("Round 3" here refers to the design-direction check-in above, not a full
gameplay playtest — the owner has not yet played the Poster/Broadsheet build.)

| Reported | Status | What changed |
|---|---|---|
| Build the chosen design (Poster skin + Broadsheet layout) into the real app | Done | Full UI rebuild: `src/styles/index.css` replaced with the Poster design system; `Ledger.tsx` (was `StatBar.tsx`), `Rail.tsx` (was the tabbed `SidePanel.tsx`), `CardView.tsx`, and all of `Screens.tsx`/`Intro.tsx` rebuilt. Fonts self-hosted (`public/fonts/`) since Google Fonts is blocked in this environment — every earlier screenshot in this project's history was rendered in fallback fonts, not the real design. |
| Text too dense with political/financial jargon for a general reader; example given: "clearing the payroll" | Done | New glossary system (`src/game/glossary.ts`): 18 recurring terms get a one-sentence plain definition, auto-applied as a hover/tap `<abbr>` on first occurrence in any rendered card text. The specific payroll card was also rewritten directly (not just glossed) to state what payroll is and what each option means in plain consequences. Scope was bounded to the reported failure mode (jargon with no accessible meaning), not a full rewrite of all card prose — see `docs/DESIGN_V2.md` §8 for what did and didn't ship. |

Two real bugs were found and fixed during this build, both the same class of
issue as the original V1 scroll bug — worth reading if you touch layout:
1. **Double scroll container.** `.screen` had its own `overflow-y:auto` while
   its parent `.stage-col` also scrolled. Same root cause as the V1 bug, in a
   new place. Fixed by making `.screen` a plain block (`min-height:100%`,
   no overflow) when nested in `.stage-col`, with a separate `.title-screen`
   rule for the one place `.screen` is used standalone.
2. **Sticky action bar overlapping tail content.** A `position:sticky;
   bottom:0` bar could sit on top of the last bit of scrollable content
   before the user had scrolled. Fixed by moving the primary action into the
   always-visible top strap (`.strap-action`) and dropping `position:sticky`
   from the bottom bar — it's now a plain convenience duplicate, not sticky,
   not load-bearing for reachability.

Both were caught by testing at 1366×700 specifically — keep testing there.

### Playtest round 3b — jargon-clarity follow-up

After the round 3 report above, the owner replied: *"If adding more text
and context into the cards is the best fix then go with that as long as
it's designed accordingly and seamlessly."* — read as: prefer inline
explanation over relying on the hover tooltip, where inline is the better
fix, per the writing rules' own stated preference.

| Reported | Status | What changed |
|---|---|---|
| Glossary coverage was incomplete | Done | The hover-tooltip system only covered card body and outcome text. Extended it to option hints, flavor/pull-quote text, and the right-rail threat cards (`Glossed` exported from `Prose.tsx`, wired into `CardView.tsx` and `Rail.tsx`). |
| The other genuinely dense economics moment besides payroll | Done | The currency-peg Breaking Alert (`alert-velk` in `alerts.ts`) was rewritten to explain the peg, floating the currency, and capital controls inline in the body/hints, not just via the glossary backstop. |
| Audit for mismatched tooltips | Done, found one | An outcome line used "commitment" in its ordinary English sense; the glossary would have shown the unrelated recurring-cost game-mechanic definition on hover. Reworded to "promise" to remove the false match. Full audit of all 18 glossary terms across every content file confirmed no other mismatches. |

13/13 tests still pass; verified live via Playwright that glossed terms
render correctly across a real playthrough.

### Playtest round 4 — the real thing, and Phase 1 closes

The owner then actually played the Poster/Broadsheet build (not just the
mockups) and said, verbatim: *"Ok everything seems to run and look good. So
I believe Phase one playtests are complete."* No specific bug or complaint
was raised — this is an unconditional pass. They then asked to prepare the
repo for Phase 2 with a fresh chat in mind: *"the agent needs to be able to
easily understand EXACTLY where to continue from and what to do."* This
document, `CLAUDE.md`, and `docs/DESIGN_V2.md` were rewritten (again) to
make that handover explicit — see the "WHERE WE STOPPED" block at the top
of this file.

### Playtest round 1 — what was reported and what was done

| Reported | Status | What changed |
|---|---|---|
| "First Citizen" was never explained; no context on who anyone is or why they matter | Fixed | New full-screen **opening brief** before Day 1 (`src/ui/screens/Intro.tsx`), reopenable any time via **Brief me** in the top bar. Covers who you are, how you got the job, the goal, the money, the six ways to lose, all seven factions and the six people you deal with most. Every card that features a person now carries a one-line "who is this and why do they matter" under the title, from the new `CharacterDef.why` field. |
| The daily briefing screen did not scroll — most of it was unreachable | Fixed | Real layout bug. `.screen` was a fixed-height column flex container, so its children shrank instead of overflowing, and `.dossier`'s `overflow:hidden` then clipped the rest — `scrollHeight === clientHeight` even with 4,900px of content. `.stage-col` is now the single scroll container and `.screen` is a plain block with `min-height:100%`. Also: briefing sections are capped at 4 items with a "+N more" pointer, and the primary action moved into a **pinned bar** that is always on screen. Verified in a real browser at 1366×700 and 1280×640. |
| Writing was "word salad", too archaic for a modern setting — "The Product" named as an example | Fixed | **Every line of prose in the game was rewritten** in plain modern English: short sentences, concrete nouns, humour from the situation rather than the phrasing. That is all 42 cards, 9 alerts, 9 endings, all faction and character text, the country description, all briefing warnings and every stat tooltip. "The Product" is now **"Buying the Evening News"** and states the offer and the price in the first three lines. |
| Money should be dollars, with a real economic system and visible prices | Fixed | Currency is now **$ (billions)**. New `src/game/economy.ts` computes a daily budget from live game state: itemised income (lithium/salt, port fees, taxes, Free Zone) and spending (payroll, energy, security, debt service, corruption leakage, plus every commitment you have made). New **Treasury tab** in the side panel shows all of it, the net per day, and a runway countdown when you are in deficit. Decisions can now create **recurring budget lines** (`Effects.commitments`) — a pay rise costs money every day, not once. Every option that costs money states the amount in its hint. |
| The player should be addressed as "sir" or similar | Fixed | The office is now **Executive Chair**. A picker on the title screen chooses **Sir / Ma'am / Chair**, and card text uses a `{sir}` token resolved at render (`src/game/text.ts`), so authored lines work for any choice. |

---

## 3. Completed features

### Simulation
- [x] Seeded, serialisable RNG (`mulberry32`) — whole runs are replayable and
      the RNG state lives inside the save file.
- [x] `GameState` is pure JSON. All behaviour lives in content modules keyed by
      string id, so saving is `JSON.stringify` and content is additive.
- [x] 10 visible stats with systemic coupling (a propaganda apparatus amplifies
      good news; corruption makes economic damage worse; scandal makes
      legitimacy losses bite harder; fear makes orders land harder).
- [x] 10 hidden pressure variables (`coup`, `unrest`, `scandal`, `leak`,
      `foreign`, `fiscal`, `corruption`, `cult`, `fear`, `separatism`). Never
      shown as numbers — only as symptoms in the briefing.
- [x] 10 regime-character axes that name the regime in the ending.
- [x] **Consequence engine** (`effects.ts`): one entry point for every change
      to the world — stats, hidden pressures, factions (with relationship
      spill-over), characters, memory, flags, delayed effects, promises,
      projects, scandals, queued cards, headlines.
- [x] **Delayed consequences**: choices schedule effects or whole cards for
      future days. Visible ones appear in the briefing Diary and the nightly
      "Still Coming" tray.
- [x] Promises with due dates that lapse and cost you if ignored.
- [x] Multi-day projects with completion payoffs and legacy lines.
- [x] Scandals with heat that decays and can be buried.
- [x] 7 factions with loyalty / power / influence / patience, inter-faction
      relationship spill-over, red lines and escalating impatience.
- [x] 13 characters with loyalty / trust / fear / influence / plotting, a
      **memory list** that drives future behaviour, and authored personality
      (ambition / competence / venality / candour) that barely moves.
- [x] Characters can be removed from post (`removeFromPost`) — resigned,
      arrested, reassigned, defected.
- [x] Ignored + ambitious characters accumulate `plotting`, which feeds the
      hidden coup/separatism/leak pressures.
- [x] Escalating late-game pressure: the longer you govern, the more the
      Republic expects. Generosity resets the baseline (patience decays faster
      for factions you have spoiled).
- [x] Negative treasury is modelled as missed payroll, with daily bite.

### Day / stage system
- [x] Days have **3–5 stages**, shape varies with total pressure.
- [x] Stage kinds: Government Business, Political Business, National
      Development, Afternoon Session (+ Briefing and Nightly Review).
- [x] Deck is drawn per day: queued cards first, then a **state-reactive
      weighted draw** with a recency window so cards do not repeat.
- [x] Start-of-day upkeep: scheduled consequences fire, projects tick, promises
      lapse, revenue accrues, pressures drift, factions lose patience.

### Daily Briefing
- [x] Full confidential-dossier screen: day number, Velmorran calendar date,
      capital, leader, weather (which Velmorrans treat as a referendum on
      government honesty), today's schedule with times.
- [x] Position ledger with overnight deltas.
- [x] Known Issues, Intelligence warnings, Diary (pending consequences),
      Opportunities, and one or two Notes hinting at what today may become.
- [x] Warnings are **derived from hidden state and written in the player's
      language** — never numbers. Warning text escalates in three severities.
- [x] **Information quality gates the briefing**: below 35 Information, the
      milder warnings stop reaching you.
- [x] Threat level indicator driven by live alert pressure.

### Cards & decisions
- [x] Data-driven card system: new cards need no engine changes.
- [x] **42 cards / 155 authored options**: 25 standard cards drawn from the
      weighted deck + 17 follow-up cards that are never drawn randomly — they
      exist only because an earlier decision scheduled them.
- [x] All card prose written in plain modern English, with every money cost
      stated explicitly in the option hint.
- [x] Cards featuring a person show a one-line explanation of who they are.
- [x] 2–4 options per card, each with a hint that telegraphs the obvious
      trade-off (hidden second-order effects stay hidden).
- [x] Options can be locked behind state (`enabled` + `lockedText`) — e.g. you
      cannot order the Sable Office to detain the opposition leader unless it
      is sufficiently yours.
- [x] Outcomes can be static or functions of `(state, rng)` for weighted,
      surprising results.
- [x] Keyboard: `1`–`4` to choose, `Enter`/`Space` to continue.

### Breaking Alerts
- [x] **9 Breaking Alerts**, each declaring the hidden pressure that drives it.
- [x] Event weighting: alert probability and selection are both computed from
      live game state. Cutting military spending really does make military
      incidents likelier; censorship really does make leak events likelier.
- [x] Full-screen red takeover presentation with banner animation and severity.
- [x] Alerts interrupt mid-day, max 2 per day, with a 4-day per-alert recency
      window and narratively-singular alerts marked once-per-run.
- [x] **Onboarding guarantee**: if the player reaches day 3 without seeing an
      alert, the world obliges.
- [x] Alerts scheduled by an earlier decision still arrive *as* Breaking Alerts,
      not as calm items on the agenda.

### End of day / endings
- [x] Nightly Review: day mood line, full 10-stat ledger with deltas, the Seven
      O'Clock Word headlines, what you decided, what came due, what is still
      coming.
- [x] **8 failure endings + 1 survival ending**, each the terminus of a pressure
      the player could see symptoms of for days: coup, revolution, elite ouster,
      economic collapse, provincial fracture, foreign takeover, archive/scandal
      removal, hollowing-out.
- [x] Legacy report: emergent **regime label** derived from the regime axes, a
      historical-style epitaph, a humorous multi-clause verdict, and a run
      statistics grid.

### UI / UX — Poster / Broadsheet (current, replaces the earlier dark theme)
- [x] **Poster design system** (`src/styles/index.css`): cream newsprint,
      condensed black display type (`Anton`/`Archivo Black`), one red accent,
      flat shapes, no dark surfaces anywhere. Self-hosted fonts
      (`public/fonts/`) — `Anton`, `Archivo Black`, `Libre Franklin`, `Lora`,
      `Courier Prime`, latin subset only, ~400KB.
- [x] **Broadsheet layout**: persistent masthead (name/honorific + the 3-
      resource ledger) and strap (day/act/threat + the primary "next" action,
      always reachable without scrolling — see the two scroll bugs fixed
      during this build, noted above); the daily briefing is a newspaper
      front page; each card renders as a "lead story" document with a boxed,
      numbered decision list; a right rail (not tabbed) shows Files
      (factions), On Your Desk (threat cards), Diary, and Standing Costs.
- [x] **Display layer** (`src/game/display.ts`): the masthead shows exactly
      **Money / Grip / Legitimacy** (aggregated live from the full 10 stats)
      and the rail shows exactly **5 factions** (Army/Security/Money/Workers/
      Street) each as one mood word + one bar, instead of the old 10-stat bar
      and 7×3-bar faction panel. The underlying engine and every card effect
      are completely unchanged — see `docs/DESIGN_V2.md` §3.
- [x] **Threat cards** (`buildThreats()` in `briefing.ts`, rendered by
      `Rail.tsx`): the hidden-pressure warning system now also surfaces as up
      to 3 physical-looking cards with a headline, body, and "stage N of 3"
      pips, reusing the same underlying data as the full prose briefing.
- [x] **Glossary system** (`src/game/glossary.ts` + `Prose.tsx`): 18
      recurring institutional/financial terms get a plain-language
      hover/tap definition on first occurrence in any card text.
- [x] Animations: card rise-in, alert banner wipe, scrim fade, delta pills.
- [x] Nothing is behind a tab in the right rail — the whole point of the
      desk-derived layout is that everything has one fixed, visible place.

### Economy
- [x] All money in **dollars, billions**. `usd()` / `usdFlow()` in `economy.ts`
      are the only formatters.
- [x] `computeBudget(state)` derives an itemised daily budget from live state —
      four income lines and up to a dozen spending lines, including every
      commitment the player has made.
- [x] **Commitments**: decisions can create recurring budget lines, permanent or
      time-limited (`Effects.commitments`, `Effects.endCommitment`). This is how
      a pay settlement or a loan keeps costing you.
- [x] Treasury side tab: balance, net per day, income and spending broken down
      line by line with explanatory notes, and a runway warning in deficit.
- [x] Going below zero is modelled as missed payroll with a daily penalty that
      scales with how far under you are.

### Save / load
- [x] `localStorage` autosave after every state change.
- [x] New Game / Continue / Restart / Delete save.
- [x] Refreshing the browser does not destroy the run. Verified in a real
      browser.
- [x] Version-guarded and defensive: unreadable or stale saves are ignored
      rather than crashing.

### Procedural variation
- [x] **5 opening scenarios** (The Stairwell Succession, The Inherited Hole, The
      Marches Are Awake, A Long Cold Quarter, The Reformer's Window) with
      distinct starting stats, pressures and faction tweaks.
- [x] Per-run jitter on every stat, faction value and character disposition.
- [x] Day length, deck contents, alert timing and many outcomes are all
      state-reactive rather than fixed.

---

## 4. What is NOT built yet

- **Confidence-vote reveal:** built, verified, playtested, and owner-approved.
  See DESIGN_V2 §4.1a. Balance values were left unchanged.

**Nothing in the roguelike layer (`docs/DESIGN_V2.md` §4) remains unbuilt
or unplaytested.** Acts (§4.1), the Back Room shop (§4.2), mandates (§4.3),
the run deck (§4.4), and meta-progression (§4.5, both steps) are all built,
playtested, and owner-approved — see the "WHERE WE STOPPED" block at the
top of this file. Phase 2 is entirely done. The open question is whether
to start Phase 3 (below) — genuinely open, since Phase 2 being done is not
itself the go-ahead for it.

Everything below is Phase 3, 4, or 5 per `docs/DESIGN_V2.md` §9 — Phase 2
being done and playtested clears the way for Phase 3 to start, but it
still needs to be explicitly asked for, same as every other item below:

**Phase 3 — content & systems depth (after Phase 2):**
- **Faction demands as a live mechanic.** `FactionState.demand` and the
  `FactionDemand` type exist and the briefing renders impatience, but nothing
  issues formal, dated faction demands yet (Milestone 2).
- **Character-initiated events** — deals, betrayals, defections driven by a
  character's own plotting score. `plotting` is tracked and feeds hidden
  pressures, but no card is yet spawned *by* a character crossing a threshold
  (Milestone 3).
- **Crisis chains** — multi-card escalating sequences (Milestone 4), worth
  building against the Phase 2 act structure rather than the old flat 30
  days.
- **A balance pass** on the difficulty asymmetry and coup-ending rarity
  below (limitations #2, #3) — deliberately held until Phase 2's shop
  economy and 18-day acts change the difficulty curve anyway.

**Phase 4 — mobile/iOS (not scheduled):**
- See `docs/DESIGN_V2.md` §10. Nothing to build now; §10 lists what to
  preserve (`src/game/` stays zero-React/DOM, including everything Phase 2
  adds) and what to avoid introducing (a second hover-only mechanism for
  anything gameplay-critical) so this stays possible later without a
  rewrite.

**Phase 5 — remaining nice-to-haves:**
- **Mini-games** (Milestone 5). `MinigameKey` and `CardDef.minigame` exist in
  the type system as the hook; no minigame components are implemented.
- **Assassination, election-defeat and constitutional-removal endings.**
- ~~**Run history / legacy across runs**~~ (Milestone 7) — **delivered as
  part of §4.5's meta-progression** (the title screen's record line, the
  Unlocks screen's "your record" summary), not built twice. Further
  enrichment (e.g. a fuller run-by-run history view) would still be a
  Phase 5 nice-to-have if wanted later.
- **Sound.**

---

## 5. Known bugs and limitations

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | ~~**Content volume.**~~ | Addressed | Was: 25 draftable standard cards for a 30-day run at 3–5 cards/day meant a long run exhausted fresh material and started reusing cards once the recency window passed. **Fixed as part of Phase 2 §4.4** (the run deck, 2026-09-21): 20 more standard cards (`content/cards3.ts`) and 5 more alerts, plus the 18-day act structure independently reducing exposure. Whether it feels sufficiently varied in a full playtest is still worth watching, but the raw pool-size gap this row described is closed. |
| 2 | **Difficulty is asymmetric.** A player who consistently takes the accommodating/generous option survives to day 30 in ~98% of simulated runs; random play dies around day 13; consistently aggressive play dies around day 6. | Medium | Arguably correct (cooperation works, it is just expensive), but the generous path needs a sharper late-game cost. Deliberately left for a Phase 3 balance pass (`docs/DESIGN_V2.md` §9) rather than tuned now, since Phase 2's shop economy will change the curve anyway. |
| 3 | The `coup` ending is reachable but rare (~1–5% of random runs) relative to revolution/fracture/scandal. | Low | Needs more military-pressure cards to feed it — part of the same Phase 3 balance pass. |
| 4 | ~~Google Fonts loaded from CDN~~ | Fixed | Fonts are now self-hosted (`public/fonts/`), no runtime network dependency. |
| 4b | Save format changes discard old in-progress runs rather than migrate them. | Low | Correct pre-release behaviour; `save.ts` is version-guarded and fails safe. Current `SAVE_VERSION` is 10: Phase 2 advanced it through 9, and the serialisable confidence-vote phase/result advanced it 9→10. The separate meta-progression history is unaffected. |
| 5 | Right rail is hidden below 1080px width. The game is desktop-first, as specified. | Low | No tablet/mobile layout yet — this is the real remaining gap for a future Phase 4 (mobile/iOS, `docs/DESIGN_V2.md` §10), not scheduled. |
| 6 | `CharacterMemory` weights and `RunStats.moneyTaken` are tracked but not yet surfaced anywhere in the UI. (`FactionState.demand` is now live — Phase 3 step 1.) | Low | Wiring, not rework. |
| 7 | No undo. Decisions are final by design. | By design | |
| 8 | The 2 provinces/civil-service factions (`grey`, `provinces`) have no display bar — by design (see `docs/DESIGN_V2.md` §3.2) — but a player who never happens to draw Grebs's or Kostyn's cards has no way to check their standing at all. | Low | They still fully drive effects underneath; this is a pure visibility gap, not a simulation gap. |
| 9 | ~~The display-layer cut has not been owner-playtested~~ | Resolved | The owner played it and said "everything seems to run and look good," raising no density/tracking complaint. Treat the cut as sufficient; do not start the deeper data-model rewrite speculatively. If it resurfaces during Phase 2 playtesting, treat that as new information. |

---

## 6. Recommended next task

**Current (2026-09-23): get the owner's playtest of balance slice A.** Then
slice B (difficulty), then slice C (consequences) — see the block at the
top. The history below is kept for context.

**All of Phase 2 (§4.1–§4.5, every step) is built, playtested, and
OWNER-APPROVED, per the "WHERE WE STOPPED" block at the top. Owner,
verbatim: *"Playtest good, ready for next slice. Won't be doing it now."*
That is not yet a go-ahead for Phase 3 — it confirms Phase 2 is done and
asks for documentation only. Status of each piece:**

1. ✅ **DONE, APPROVED.** `docs/DESIGN_V2.md` §4.1 — the run structure: 3
   acts of 6 days each (18 total), ending in a confidence vote checked
   against Grip/Legitimacy, replacing the flat 30-day run.
2. ✅ **DONE, APPROVED.** §4.2, the Back Room shop — both chunks (17 → 47
   items), dark fullscreen presentation, "Advisors & Deals", advisor/deal
   caps with a held-panel, and the day-in-act display fix. All confirmed by
   the owner: *"All up to date content has been playtested and is
   approved."*
3. ✅ **DONE, APPROVED.** §4.3 mandates (2026-09-21). Six origins and
   their rules.
4. ✅ **DONE, APPROVED.** §4.4 the run deck (2026-09-21, later session).
   `runDeck`/`bannedCards`, 8 new deck-affecting shop policies, 20 new
   standard cards, 5 new alerts. Owner-played and bug-checked by a
   ChatGPT-based agent.
5. ✅ **DONE, APPROVED.** §4.5 meta-progression, step 1 (2026-09-21, later
   session): `src/game/meta.ts`, the cross-run record, the title screen's
   one-line summary.
6. ✅ **DONE, APPROVED.** §4.5 meta-progression, step 2 (same session): real
   unlock conditions (`MANDATE_UNLOCKS`/`SHOP_UNLOCKS` in `meta.ts`)
   actually gate two mandates and two rare shop items now, plus a new
   Unlocks screen (`Progress.tsx`) reachable from the title screen and from
   a tab inside "Advisors & Deals" — see the "WHERE WE STOPPED" block at
   the top for the full detail. **This was the last piece of Phase 2 — it
   is now played and approved, so Phase 2 (§4.1–§4.5) is entirely done.**
7. **Do not start the deeper data-model rewrite** (`docs/DESIGN_V2.md` §3's
   original proposal, migrating from 10 stats/7 factions to a native 3/5
   model) — this was implicitly resolved by the same playtest approval and
   is not needed unless a future note specifically asks for it again.
8. **Phase 2 (§4.1–§4.5) has shipped and been playtested — Phase 3 still
   needs its own explicit go-ahead before starting**
   (`docs/DESIGN_V2.md` §9): faction demands as a live mechanic (Milestone
   2), character-driven events (Milestone 3), crisis chains (Milestone 4),
   then a balance pass on the difficulty asymmetry and coup-ending rarity
   (limitations #2/#3) — now sharpened by the owner's own playtest note
   above about spamming a single option to win — now that the shop economy
   and 18-day acts have changed the curve. The owner explicitly said "won't
   be doing it now" in this same turn; wait for a clear go-ahead rather than
   treating Phase 2's completion as one.

**Backlog — Phase 4/5 items, not scheduled, see `docs/DESIGN_V2.md` §9–10
for the full reasoning:**

- **Mobile/iOS (Phase 4).** Not scheduled. Keep `src/game/` free of React/
  DOM dependency as Phase 2 is built (ground rule 11) so this stays possible
  later without a rewrite.
- **Mini-games (Phase 5, Milestone 5).** Start with Budget Allocation and
  Cabinet Negotiation; the `minigame` hook already exists on `CardDef`.
- **Sound, remaining ending types (Phase 5).** Run history/legacy was
  delivered as part of §4.5, not deferred — see §4 above.

---

## 7. Architecture — important decisions

**Read this before changing anything.**

```
src/
  game/                     ← no React, no DOM, fully testable
    types.ts                ← the whole vocabulary. Start here.
    rng.ts                  ← seeded RNG; its state lives in the save
    stats.ts                ← stat metadata, bands, formatting (full 10 stats)
    state.ts                ← createGame(), opening scenarios
    effects.ts              ← THE CONSEQUENCE ENGINE — single entry point
    engine.ts               ← day loop, deck draw, alert weighting, endings
    briefing.ts             ← hidden state → plain-language warnings + threat cards
    display.ts              ← engine state → what the player sees (3 resources,
                               5 factions). READ THIS before touching UI stats.
    glossary.ts              ← jargon term → plain definition, auto-applied to prose
    economy.ts               ← the national accounts: budget lines, $ formatting
    text.ts                  ← {sir}/{leader} token replacement for card prose
    save.ts                  ← localStorage, defensive
    content/
      country.ts            ← Velmorra, 7 factions, 13 characters (unchanged
                               by the display cut — still the full model)
      cards.ts              ← standard cards + follow-ups (tranche 1)
      cards2.ts             ← standard cards (tranche 2)
      followups.ts          ← cards only reachable via scheduling
      alerts.ts             ← Breaking Alerts, each with a `driver`
      endings.ts            ← endings, regime labelling, legacy verdict
    __tests__/              ← vitest simulation + content-integrity tests
  ui/
    components/
      Ledger.tsx             ← the masthead's 3-resource ledger (was StatBar.tsx)
      Rail.tsx                ← Files/Threats/Diary/Standing costs, not tabbed
                                (was the tabbed SidePanel.tsx)
      CardView.tsx            ← the doc: card-as-lead-story + decision box
      Prose.tsx               ← renders card text, applies the glossary
    screens/Screens.tsx      ← Title, Briefing (front page), Night, Ending
    screens/Intro.tsx        ← the opening brief / "Brief me" overlay
  styles/index.css           ← the Poster design system (cream/red/black,
                               condensed display type, self-hosted fonts)
public/fonts/                ← self-hosted latin-subset fonts, ~400KB
docs/
  DESIGN_V2.md                ← the design decisions, measured evidence, and
                               what's still open — read before UI work
  mockups/                    ← design exploration that led here (reference;
                               poster.css there mirrors the app's real tokens)
tools/                        ← Playwright scripts for real-browser testing
```

### Non-negotiable rules

1. **`GameState` is pure serialisable data.** No functions, no class
   instances, no `Map`/`Set`. A save file is `JSON.stringify(state)`. Content is
   code keyed by string id and is *never* stored in the state.
2. **All world mutation goes through `applyEffects()`.** That is why global
   rules (stat coupling, faction relationship spill-over, memory→plotting) can
   live in one place. Do not mutate `state.stats` directly from a card.
3. **Engine functions take a state and return a new one** (`structuredClone`
   at the top). React sets the returned object. Never mutate the state React
   is holding.
4. **RNG state is threaded through the save.** Always use `withRng(s, fn)` in
   the engine so `s.rngState` advances. Never call `Math.random()` in game
   logic — it would break determinism and save/load.
5. **Adding content must never require engine changes.** A new card is an
   object in an array. A new alert is an object with a `driver` and a `weight`.
6. **Hidden variables are never shown as numbers.** They surface only as
   briefing warnings, alert likelihood, and endings. This is the core of the
   "don't make it a spreadsheet simulator" requirement.
7. **The regime is named, not chosen.** `regimeLabel()` reads the regime axes
   at the end. There are no government classes anywhere.
8. **The display layer shows a subset; it must never silently diverge from
   the engine.** `display.ts` decides what the player sees (3 resources, 5
   factions). If you add/change a stat or faction in the engine, decide
   deliberately whether `display.ts` should reflect it.
9. **The primary action on a screen must be reachable without scrolling.**
   Learned twice: the V1 scroll bug, then a sticky-bar overlap in the Poster
   rebuild. The fix both times: put the critical action somewhere always
   visible (now: the top strap's `.strap-action`), not only at the bottom of
   scrollable content.
10. **Bump `SAVE_VERSION` (`src/game/state.ts`) whenever `GameState`'s shape
    changes.** Bumped 2→3 for §4.1's `act` field — the next bump will likely
    be for mandates/run-deck/meta-progression state. `save.ts` discards
    mismatched-version saves rather than crashing, so this is safe as long
    as the bump actually happens.
11. **Keep all game logic, including everything Phase 2 adds, in
    `src/game/` with zero React or DOM dependency.** This is what keeps a
    future mobile/iOS port (`docs/DESIGN_V2.md` §10, not scheduled)
    possible without a rewrite. Also: don't add a second hover-only
    mechanism for anything gameplay-critical (a price, a trade-off, a
    required condition) — the glossary's hover tooltip can stay as-is, but
    nothing new should depend on hover alone for required information.

### Writing rules (added after playtest rounds 1 and 3)

The original draft was rewritten because it read as ornate and hard to parse.
A later pass added a glossary system because the remaining plain-English
prose still used institutional/financial terms a general reader wouldn't
know. Keep to these:

1. **Short sentences.** If a sentence needs a second read, rewrite it.
2. **Plain modern words.** No "which is to say", no inverted clauses, no
   stacked subordinate clauses. This is a contemporary setting.
3. **Concrete nouns and real numbers.** "The army wants $9 billion for
   helicopters", not "the Staff would like a number".
4. **Humour comes from the situation**, never from vocabulary.
5. **State the price in the hint**, money first: `'Cost: $9.0B. ...'`.
6. **Titles say what the card is about.** "Buying the Evening News", not
   "The Product".
7. Use `{sir}` when a character addresses the player directly.
8. **If a sentence needs a jargon term** (payroll, a currency peg, capital
   controls, a deficit, a subsidy, a commitment, runway, the gazette,
   procurement, a levy, a concession, a tranche...), either explain it in the
   same sentence (preferred) or make sure it's in `GLOSSARY` in
   `src/game/glossary.ts` — the first occurrence in any card gets an
   automatic hover/tap definition. Check the list before assuming a term is
   covered; it is a backstop, not a substitute for plain writing.

### Content authoring notes

- Every option needs a `hint` stating the **obvious** trade-off. Hide only
  second-order effects.
- At least one option per card should `schedule` something.
- `weight: (s) => number` should read game state so the deck feels like it is
  watching the player.
- Mark genuinely singular events (an annual festival, a one-time appointment)
  `once: true`.
- Follow-up cards use `base: 0, weight: () => 0` so they are never drawn at
  random.
- **Author options with one property per line and explicit closers on their
  own lines.** The compact single-line style caused repeated brace-balance
  errors during the first draft. Use:

  ```ts
  {
    id: 'fund',
    label: '…',
    hint: 'Cost: $9.0B. …',
    outcome: {
      text: '…',
      tone: 'good',
      effects: { … },
    },
  },
  ```

  Verify with `npx esbuild src/game/content/<file>.ts --outfile=/dev/null`
  (fast, precise parse errors) then `npx tsc --noEmit`.

---

## 8. How to run, build and test

The repository ships a `.devcontainer/` config, so **Code → Codespaces** on
GitHub gives a working environment with dependencies already installed. The
dev server binds `host: true` so it is reachable through container port
forwarding.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm test           # vitest: content integrity, 200 full simulated runs,
                   # determinism, variety, glossary, and a balance probe
```

Real-browser verification (`npm run test:browser` starts its own server;
individual scripts below require `npm run dev` running):

```bash
npx playwright install chromium
npm run test:browser
node tools/verify.mjs        # full pass: intro, scrolling, prices, ending, save
node tools/playthrough.mjs   # plays ~9 days, checks save/reload, screenshots
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/alert-shot.mjs    # captures a Breaking Alert
```

`tools/verify.mjs` runs at 1366×700 specifically because **both** real layout
bugs found so far (the V1 scroll bug, and the Poster-rebuild sticky-bar
overlap) only appeared on short viewports. Keep testing there. When taking
screenshots to eyeball a fix, wait for CSS animations to finish first
(`.doc`'s rise, `.alert-scrim`'s fade-in, `.delta-pill`'s fade) — several
apparent rendering bugs during this build turned out to just be screenshots
taken mid-animation, not real issues.

### Test coverage today

- Content integrity: unique ids, every card has ≥2 options with unique ids,
  every scheduled/queued `cardId` resolves, every referenced character exists.
- 200 full runs to an ending with random play — no crashes, all stats and
  hidden variables stay in legal range, >2 distinct endings, alerts fire,
  delayed consequences land.
- Determinism: same seed + same choices ⇒ identical terminal state.
- Variety: cards do not repeat within the recency window; <30% of days are
  short.
- Glossary: first occurrence of a term gets annotated, later ones don't; text
  with no glossary terms round-trips unchanged.
- Balance probe (prints, does not gate): average run length and ending
  distribution across three play policies.
- **Not covered by automated tests, verified manually instead:** the actual
  Poster/Broadsheet rendering, since these are CSS/layout concerns vitest
  can't see. That's what `tools/verify.mjs` + manual screenshot review is for
  — re-run it after any layout change, at 1366×700.

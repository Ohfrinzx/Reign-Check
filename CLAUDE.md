# CLAUDE.md — read this first

You are picking up **Reign Check** (development codename: Dictator Sandbox), a
browser-based, card-driven political leadership simulation set in the
fictional Republic of Velmorra. This file is the handover. Read it, then
`PROJECT_STATUS.md`, then `docs/DESIGN_V2.md`.

**Also read `AGENTS.md`.** The owner runs more than one agent tool on this
project (Claude Code and ChatGPT-based agents both), and `AGENTS.md` is the
shared, model-agnostic knowledge base every agent works from — the ground
rules, writing rules, content-authoring format, code map, and git/
verification workflow all live there as the canonical copy. **The Ground
Rules / Writing Rules / Content Authoring Format / Map of the Code / Git
sections below are Claude Code's copy of that same content — if you change
any of them, edit `AGENTS.md` first, then mirror the change here, so the two
never disagree.** This file's project-status prose (this section and the
next) stays Claude-Code-specific narrative; the short version of current
status also lives in `AGENTS.md` §2.

## Where the project actually is

**2026-09-22 — confidence-vote reveal built, playtested, and owner-approved.** The
owner authorized the recommended division-board + clerk-tally direction.
The reveal runs before the Back Room and preserves the existing deterministic
vote cutoff. The engine freezes a serialisable `ConfidenceVoteResult`, enters
the new `vote` phase, and applies that stored outcome exactly once when the
player continues. `Vote.tsx` supplies the timed/skip/reduced-motion reveal,
exact margin and accessible final announcement. `SAVE_VERSION` is 10, so
version-9 in-progress runs reset; meta history remains. All 113 tests, build,
and the full browser suite pass. The owner confirmed: *"Play tested and
working."* See `docs/DESIGN_V2.md` §4.1a. Phase 3 has not started; its
balance work still needs a separate go-ahead.

**PHASE 1 (playable core + the Poster/Broadsheet rebuild) IS DONE AND
OWNER-APPROVED.** The owner played the real build and said: *"Ok everything
seems to run and look good. So I believe Phase one playtests are complete."*
That closes out the whole V1 → playtest 1 → playtest 2 → Poster/Broadsheet
rebuild → wording pass arc. Nothing in Phase 1 needs more work unless a
future playtest of Phase 2 turns something up. In particular, the open
question that used to sit here — *"was the display-layer cut enough, or does
it need the deeper data-model rewrite?"* — is now **closed**: the owner
played it and raised no density/tracking complaint. Do not second-guess that
or start the deeper rewrite speculatively; see `docs/DESIGN_V2.md` §7.

The game runs in a light **Poster** skin (cream newsprint, condensed black
headlines, one red) in a **Broadsheet** layout (masthead + front-page
briefing + card-as-lead-story + a right rail of Files/Threats/Diary/Standing
costs), showing **3 resources and 5 factions** instead of the old 10 stats
and 7 faction-bars-of-three, via a **display layer**
(`src/game/display.ts`) over the full, untouched 10-stat/7-faction engine —
every card effect, every test, and the balance probe are unchanged
underneath. The current glossary uses plain-text Terms footnotes on cards
and shop offers; `Prose.tsx` does not use hover annotations. Current test
coverage and status are listed below and in the handoff.

## PHASE 3 — STEP 1 (FACTION DEMANDS) BUILT, AWAITING OWNER PLAYTEST

**2026-09-22 (later session).** The confidence-vote reveal (built by a
ChatGPT-based agent, DESIGN_V2 §4.1a) is playtested and approved. The owner
then started Phase 3 and specified faction demands: *pop-ups, stored in a
menu or on the side where the user can expand, see which faction the demand
came from, the details, an option to meet the demand (if applicable), or
bribe for an extension (which isn't always accepted). If demands aren't met
it can lead to a military coup or other attempts at removal — depending on
standing with the faction and other conditions.* Built exactly that, as
Phase 3 step 1 only:

- `src/game/demands.ts` (rules, no React) and `src/game/content/demands.ts`
  (10 demands, 2 per visible faction; one "move" per faction). Request →
  formal demand → ultimatum, 2 days per stage; Meet (price rises per
  stage); Bribe for +2 days (odds shown in words, can be refused); a
  lapsed ultimatum is punished or becomes a removal attempt whose odds
  depend on that faction's loyalty/power and on what protects you.
- `src/ui/components/Demands.tsx`: the pop-up, the rail's "Demands"
  panel (rows expand in place), and a masthead "Demands" button opening
  the same list (the rail is hidden below 1080px).
- Two new endings (`sable-removal`, `general-strike`); Army/Money/Street
  reuse `coup`/`elite`/`revolution`. `SAVE_VERSION` 10→11 (in-progress runs
  reset; meta history unaffected).
- 123 tests, build, and the full browser suite (new `tools/demands.mjs`)
  pass. Balance measured, not tuned — see the notes section at the end.

Phase 3 steps 2–4 (character events, crisis chains, balance pass) are not
started and each needs its own go-ahead. Full detail: `AGENTS.md` §16 and
`PROJECT_STATUS.md`'s "WHERE WE STOPPED" block.

## Required hand-off report — every agent, every time

(Mirror of `AGENTS.md` §3a.) **Owner request (2026-09-22): every agent must
end its output, whenever it has changed anything, with a plain report the
owner can act on without reading the diff.** Not optional, and not only
when asked. Two parts:

1. **What changed** — what was added, changed, or adjusted, in plain words,
   grouped by what the player will notice (new screens, new rules, new
   content, changed numbers) before internal/tooling changes. Include
   anything that resets the owner's in-progress run (`SAVE_VERSION` bumps),
   any balance numbers that moved, and anything you found but did not fix.
2. **What to look for in playtesting** — a short, concrete checklist: where
   to go in the game, what should happen, and what would count as a bug or
   a balance problem. Name the exact buttons/screens. If something is hard
   to reach in normal play, say how to reach it.

Also say what you verified (tests, build, browser checks) and whether you
merged into the default branch. Documentation-only turns still need part 1;
part 2 can say "nothing to playtest".

## PHASE 2 — §4.1–§4.5 (ALL STEPS) OWNER-APPROVED — PHASE 2 COMPLETE

**The owner has approved starting the roguelike layer, fully specified in
`docs/DESIGN_V2.md` section 4.** §4.1 (run structure — 3 acts of 6 days
each, ending in a confidence vote) and §4.2 (the Back Room shop, both
chunks, plus the day-in-act display fix) have all been built, playtested,
and approved by the owner — verbatim: *"All up to date content has been
playtested and is approved."* See `PROJECT_STATUS.md`'s "WHERE WE STOPPED"
block for the full history.

**§4.3 (mandates) is now playtested and owner-approved.** Six
selectable/seeded mandates, persistent rules, and the Stairwell recording
event; the owner confirmed Money means treasury. It was built by another
agent tool on this project (on `codex/mandates-and-review`, merged into
`claude/confident-meitner-lc0bgc`) — a reminder that `AGENTS.md` exists
because more than one agent works this codebase, and any of them can hand
off a slice to any other.

**As of 2026-09-21 (later session), §4.4 (the run deck) is now playtested
and owner-approved** — owner-played and bug-checked by a ChatGPT-based
agent. `GameState.runDeck`/`bannedCards`, a new `Effects.deck.add`/
`remove`, 8 new Back Room policies that use it, plus this slice's content
quota — 20 new standard cards (`content/cards3.ts`) and 5 new alerts. See
the "§4.4, the run deck" section below for the full detail. `SAVE_VERSION`
is 8; prior saves reset.

**§4.5 (meta-progression) — BOTH STEPS PLAYTESTED AND OWNER-APPROVED (same
later session) — this completes all of Phase 2.** Owner, verbatim:
*"Playtest good, ready for next slice."* §4.1 through §4.5 are now every
one of them built, playtested, and approved — Phase 2 is done. Step 1: the
owner asked
what meta-progression would be, then said to go ahead with the design
doc's own suggested de-risking approach — ship the cross-run record first,
nothing actually gated. New file `src/game/meta.ts` — `MetaProgress`/
`RunRecord`, own localStorage key (`dictator-sandbox:legacy:v1`) and own
version (`META_VERSION`), deliberately separate from `GameState`/
`SAVE_VERSION` so deleting a save or restarting a run never touches it.
Every finished run gets recorded (capped at 50); `App.tsx` does the
recording in a `useEffect` on `game.ending`, guarded by reference so it
can't double-fire. The title screen shows a one-line record once at least
one run exists (`TitleRecord` in `Screens.tsx`).

**Step 2, same session, built right after:** the owner asked where the
unlock view should live — a sub-menu inside "Advisors & Deals" plus a
button on the title screen ("the menu screen"), so players can see their
progress and aim at specific goals. `meta.ts` gained real conditions:
`MANDATE_UNLOCKS` (`clean-hands`: finish 2 runs; `pay-deal`: reach Act 2)
and `SHOP_UNLOCKS` (`one-good-story`: survive once; `archivist`: finish 3
runs — the shop's only two `rarity: 'rare'` items). `GameState.
unlockedShopItemIds` (new field) is a snapshot taken once at
`createGame()`, never re-evaluated mid-run — see the "§4.5 step 2" section
below for the full detail on why. `SAVE_VERSION` was 9 for that slice; prior
saves reset.
New `src/ui/screens/Progress.tsx` is reused in both places the owner
asked for: a "Roster"/"Unlocks" tab pair in `Manage.tsx`, and a new
"Unlocks" button on the title toolbar — which now also filters its own
mandate picker to what's actually unlocked. 7 new tests (100→107); build
clean; five Playwright tools green at 1366×700 with zero page errors.

**§4.2, the Back Room shop — BOTH CHUNKS BUILT AND APPROVED.** Owner
amendment to the spec: the shop opens at the **end of every day**, not only
between acts. The nightly room offers 3 items and sells you one; the act room
(the night a confidence vote is passed) offers 5 including the expensive tier
and sells you as much as you can pay for. **47 items** (14 advisors, 12
policies, 12 favours, 9 deals) in `src/game/content/shop.ts` — chunk 2 grew
this from 17 by 30 (owner request), grounded in the existing cast/world from
`content/country.ts` (Varkov, Sarran, Kostyn, Adamek, Vel, Loz, Hess, Grebs,
Vask, Piek; the Grand Convocation, the Central Bank, Ostrene/Aureth/Sereth/
Drovna, the Pigeon Federation, Dovra Day). 3 of the 9 deals run on a
day-to-day timer (three-judges plus two new: `pigeon-endorsement`,
`drovna-understanding`) — "a few, not all", per the owner. Logic in
`src/game/shop.ts`, one engine hook (`buyShopItem()` → `applyEffects()`),
`SAVE_VERSION` bumped 3→4→...→6 (see ground rule 10 for the full chain).
Pricing and variety were measured with `src/game/__tests__/shop.probe.ts` —
**run that probe before changing any shop rule.**

**The Back Room is the one dark screen in the game** (owner request: it should
feel like you are somewhere else). `.app.dark` in `src/styles/index.css` swaps
the surface tokens for the shop phase only. This is NOT a revival of the dark
desk skin rejected in Phase 1 — **do not darken any other screen without
asking.** If you touch theming, re-declare colours inside `.app`, not `body`:
body resolves tokens in the light scope and children inherit the resolved
value (see `docs/DESIGN_V2.md` §4.2).

**The Back Room is also FULLSCREEN** (owner follow-up: the shop should be the
only thing on screen). `App.tsx` has an early `return` for
`game.phase === 'shop'` that renders `<div className="app dark shop-full">`
with only `<ShopScreen>` inside — no masthead, no strap, no rail at all, not
just visually hidden. The masthead's old `--bar`/`--bar-text` tokens (kept
constant across light/dark) are dead weight now that the masthead doesn't
render during the shop, but harmless to leave for the rest of the game.
**If any tooling drives the shop by clicking `.strap-action`, it will find
nothing** — the shop's own "Leave" button (`.shop-foot .btn-primary`) is the
only way out; `tools/verify.mjs`, `to-ending.mjs` and `playthrough.mjs` were
all updated for this and broke once each before being fixed — check
`.shop-foot .btn-primary` first in any new tooling that walks the shop.

**Advisors and deals are CAPPED — `ADVISOR_CAP`/`DEAL_CAP` in `shop.ts`, both
`3`, tracked separately.** Owner request: past the cap, buying more means
firing/cutting one first, so the shop can't just be swept clean. Every
deal — permanent or timed — occupies a slot in `GameState.heldDeals` from
purchase until it ends: a timed one (`durationDays`) counts down and fires
`expireEffects` on its own via `tickHeldDeals()` in `engine.ts`'s
`dayUpkeep()`; ANY deal can also be cut short on purpose via `cutDeal()`
(the deal equivalent of `fireAdvisor()`), which skips `expireEffects` and
instead applies that deal's own `cutCost`/`cutEffects` — same
everything-has-a-downside rule as firing, tested in `shop.test.ts`.
`GameState.endedDeals` records whether a finished deal ran its course or
was cut, so it never shows as "Ongoing" after the fact.

**"Advisors & Deals" — a screen opened from the masthead during the main
game** (not the shop), showing what the Back Room has already sold you, with
its Fire/Cut buttons and live cap counts (e.g. "Advisors (2/3)").
`src/ui/screens/Manage.tsx`; `boughtDealDefs()`/`ownedAdvisorDefs()` in
`shop.ts` feed it. Policies and favours are deliberately NOT in this
screen — only what the owner asked for (deals and advisors).

**The Back Room's own held-panel — a second owner request, same session.**
The shop screen itself now has a right-hand sidebar (`.held-panel` in
`Shop.tsx`, reusing `Manage.tsx`'s `ManageRow`/`FireControl`/`CutControl`
components) showing your advisor and deal slots live, so freeing one to buy
something new never means leaving the shop. `SAVE_VERSION` bumped 5→6 for
the `heldDeals`/`endedDeals` shape (`activeDeals` no longer exists).

**Do this as its own vertical slice, the same way Milestone 1 and the
Poster/Broadsheet rebuild were done — build the smallest testable piece,
then STOP and report back for playtest before continuing.** This project has
now gone through that build → report → playtest → iterate loop three times
and it has worked well each time; don't abandon it just because the roguelike
layer is a bigger feature.

**"Add more content" is folded into this, not a separate task.** Each of
§4.2–§4.4 in `docs/DESIGN_V2.md` carries its own content quota (e.g. ~8
advisors/8 policies/8 favours for the shop; 2–4 more mandates beyond the 4
already specified; ~20 more standard cards + ~6 alerts as part of building
the run deck). Author that content as part of building the slice it belongs
to, not as a separate pass before or after.

**What comes after Phase 2, and how mobile/iOS fits in, is now planned in
`docs/DESIGN_V2.md` §9 and §10** — read those too before starting. Short
version: Phase 3 is content/systems depth (faction demands, character-driven
events, crisis chains, a balance pass), Phase 4 is mobile/iOS (explicitly
NOT scheduled), Phase 5 is remaining nice-to-haves (mini-games, sound). The
one thing that matters for Phase 2 *right now* re: mobile: **any new engine
logic (the shop, mandates, run deck, meta-progression) goes in
`src/game/` with zero React/DOM dependency**, same as everything else there
— that discipline, not any UI decision, is what keeps a later iOS port
possible without a rewrite. See §10 for the full reasoning and what to
avoid (mainly: don't add a second hover-only mechanism for anything
gameplay-critical).

**§4.1, the run structure — DONE.** The flat 30-day run is now 3 acts of 6
days (18 total) with a confidence-vote check at the end of each act (a real
check of the Grip/Legitimacy composite, not just a day counter — see §4.1 in
`docs/DESIGN_V2.md` for the as-built details). `GameState.act` was added
(`types.ts`), the vote runs through `engine.ts`'s `finishDay()` reusing the
existing `checkEndings()` pattern, and `SAVE_VERSION` was bumped 2→3
(`state.ts`). Owner-approved.

**Day counter now reads within-act, not absolute.** Owner: *"Instead of
having it display <day>/18 change it to 6. I would rather track how many
days are left in the act."* `dayInAct()` in `state.ts` is a pure derived
read (`((s.day - 1) % ACT_LENGTH) + 1`, no new state field, no
`SAVE_VERSION` bump) used by the masthead strap (`App.tsx`) and the
front-page edition line (`Screens.tsx`) so both now show `Day X / 6`
(progress toward this act's confidence vote) instead of `Day X / 18`
(progress through the whole 18-day run). `GameState.day` itself is
unchanged and still counts 1–18 everywhere else (saves, endings, the vote
check, `dateLine()`).

**§4.1 through §4.5 (both meta-progression steps — the cross-run record and
real unlock gating with its own UI) are all owner-approved. Phase 2 is
entirely done.** Owner, verbatim: *"Playtest good, ready for next slice.
Won't be doing it now."* That is confirmation the last slice is approved,
not yet an instruction to start Phase 3 — its own explicit go-ahead is
still needed before any Phase 3 work begins (see "What is deliberately NOT
built" below). See the current `PROJECT_STATUS.md` handoff and
`docs/REVIEW_2026_09_21.md`.

**§4.4, the run deck — BUILT AND OWNER-APPROVED.** `GameState.runDeck:
string[]` and `GameState.bannedCards: string[]`, plus a new
`Effects.deck?: { add?: string[]; remove?: string[] }` handled in
`effects.ts`. `add` pushes a card id into `runDeck`; `engine.ts`'s
`cardWeight()` gives each copy held there a flat weight bonus, so "a growing
share of what you see is what you built" (the design doc's own framing) —
bounded by the existing 3-day recency gate, which still caps how often any
card can appear (about once every 4 days, ~5 times in an 18-day run): the
boost is measured, in `deck.test.ts`, as a real and non-trivial lift, not an
unlimited one, and that ceiling is the intended shape, not a bug. `remove`
bans a card id into `bannedCards`, checked first by both `cardWeight()` and
`alertWeight()` and always returning 0 — banning always wins, even over held
copies of the same id, and there is no "un-ban." Both only affect the
ordinary weighted draw: a card reached by `schedule`/`queueCard` still
arrives regardless (ground rule 5 holds — the mechanic needed one engine
change, adding `deck` handling; every item and card built on top of it needs
none). Only target `deck.add`/`deck.remove` at cards the pool already draws
unprompted, not the `base: 0, weight: () => 0` followup-only cards (e.g.
`mil-budget-due`) — boosting or banning those would silently do nothing.

**8 new Back Room policies in `content/shop.ts` use `effects.deck`** — 4
"add" (`sarran-standing-order`, `loz-standing-slot`, `piek-standing-invite`,
`adamek-open-line`) and 4 "remove" (`automate-payroll`, `settle-with-gorsk`,
`quiet-word-doran`, `close-free-zone-file`), each targeting a real,
already-repeatable card so the shop copy is honest about what it does.

**This slice also folds in its content quota** (per the rule below: content
is authored as part of the slice it belongs to, not separately): **20 new
standard cards** in a new file, `content/cards3.ts` (wired into
`engine.ts`'s `ALL_CARDS`/`ALL_CARD_MAP`, same authoring rules as
`cards.ts`/`cards2.ts`), and **5 new alerts** appended to `content/alerts.ts`
— filling in three drivers (`scandal`, `corruption`, `cult`) that had no
alert at all before now. This is also the content-volume top-up the design
doc flags as known limitation #1. Balance is unmeasured before now: the
balance probe's `avgAlerts` moved 8.5→10.9 and `reachedMax` 40%→52% under
the random policy from the new alerts adding pressure — flagged, not tuned
blind; balance is a playtest question, same as it was for mandates.

**Verification:** 93 vitest tests pass (up from 85 — `deck.test.ts`'s 5 new,
plus 3 more in `shop.test.ts` for the new items), production build clean,
and all four Playwright tools (`verify.mjs`, `to-ending.mjs`,
`playthrough.mjs`, `mandates.mjs` — including save-version-8 rejection) pass
at 1366×700 with zero page errors; `playthrough.mjs` shows several of the
new cards and shop items surfacing naturally in a real run.

**§4.5, meta-progression, step 1 — PLAYTESTED AND OWNER-APPROVED.** New file
`src/game/meta.ts`: `MetaProgress { version; runs: RunRecord[] }`, its own
localStorage key (`dictator-sandbox:legacy:v1`) and its own version
(`META_VERSION`) — deliberately NOT `GameState`/`SAVE_VERSION`, so a save
delete or run restart never touches cross-run history, and a future
`GameState` shape change never discards it either. `recordRun(meta, s)` is
pure — appends a `RunRecord` (day, act, mandate, ending, regime label,
leader name, timestamp), capped at 50, and does not persist; the caller
persists. `App.tsx` calls it from a `useEffect` watching `game.ending`,
guarded by comparing `game.ending` by reference (a new ending is always a
new object, since states clone rather than mutate — ground rule 3) so it
cannot double-record. The title screen renders a one-line summary
(`TitleRecord` in `Screens.tsx`, e.g. *"3 administrations so far — 1
survived, 2 fell, most recently as A Security State (parliament withdrew
its confidence)."*) only once `runs.length > 0`, so a first-time player
sees nothing new.

**Step 1 shipped with nothing gated — `isMandateUnlocked()`/
`isShopItemUnlocked()` existed in `meta.ts` only as stubs that always
returned `true`.** That was deliberate, per the design doc's own
suggestion, and held only until step 2 (below), built in the same session.

**Verification (step 1):** 7 new tests (`meta.test.ts` — pure `recordRun()`
logic, a fake-localStorage round trip since vitest's default environment
has none, version-mismatch/corrupt-data fail-safe, the 50-run cap), 100
total (up from 93). New browser check `tools/legacy.mjs`: no record line
before any run exists, the line appears after a real run ends and "Back to
title" is clicked (not "Try again", which skips the title screen), the
exact text survives a full page reload, and the title screen still fits at
1366×700 with zero page errors. Production build clean.

**§4.5, meta-progression, step 2 — PLAYTESTED AND OWNER-APPROVED (same
session).** The owner asked what meta-progression would be; after the
answer, asked where the unlock view should live: *"Add it to a separate
sub-menu within the advisors/deals tab along with a button on the menu
screen. That way users are able to see their progress and can aim for
specific goals to unlock certain cards."*

`meta.ts` gains `computeUnlockStats(meta)` (runsCompleted/survived/
bestAct, derived from `MetaProgress.runs`) and two plain-data rule tables:
`MANDATE_UNLOCKS` (`clean-hands`: finish 2 runs; `pay-deal`: reach Act 2 —
the two mandates added after the original four, per §4.3's "As built"
note) and `SHOP_UNLOCKS` (`one-good-story`: survive one full run;
`archivist`: finish 3 runs — the Back Room's only two `rarity: 'rare'`
items, already special by the writing rules' own "no downside" carve-out).
`isMandateUnlocked()`/`isShopItemUnlocked()` now evaluate these for real.
`meta.ts` still imports nothing from `content/` — it stays a generic small
rules engine keyed by plain string ids; callers cross-reference those ids
against `content/mandates.ts`/`content/shop.ts` themselves.

**`GameState.unlockedShopItemIds: string[]`** (new field, `types.ts`) is a
**snapshot**, computed once in `state.ts`'s `createGame()` from
`isShopItemUnlocked()` and never re-evaluated mid-run — unlocking
something by reaching Act 2 in the run you're currently playing applies to
your NEXT run's shop, not retroactively to this one's. `shop.ts`'s
`eligible()` checks it when rolling stock; `engine.ts`'s `buyShopItem()`
ALSO independently checks it before completing a purchase, the same
"safety net, not the primary gate" pattern `capBlockReason()` already
uses. `state.ts`'s mandate roll and any explicit `mandateId` pick both
respect a new `NewGameOptions.unlockedMandateIds`, with a fallback to the
full pool if a filter would otherwise lock out every mandate — it can't
happen with today's two-rule table (the four base mandates are never
gated), but the guard exists so a future rule can't brick new-game
creation. `SAVE_VERSION` was 9 for that slice; version-8 saves reset.

**New `src/ui/screens/Progress.tsx`** — `ProgressPanel` (the shared list:
"Your record", then Mandates, then Rare offers, each row showing Unlocked
or Locked plus the plain-language condition when locked) and
`ProgressScreen` (a standalone overlay, same visual language as
`ManageScreen`/`IntroScreen`, needing only `MetaProgress` — no live
`GameState` — so it works from the title screen before a run exists).
Reused in exactly the two places the owner asked for: a "Roster"/"Unlocks"
tab pair inside `Manage.tsx`'s "Advisors & Deals" screen (the existing
`.seg`/`.seg-btn` segmented control, already used for the honorific
picker), and a new "Unlocks" button on the title screen's toolbar. The
title screen's own mandate picker now filters `MANDATES` to
`isMandateUnlocked()` — a locked mandate isn't shown greyed-out, it simply
isn't in the list; the Progress screen is the one place "what's locked and
why" lives, per the owner's explicit placement.

**Verification (step 2):** 7 more new tests (107 total) — `meta.test.ts`
gains real unlock-condition coverage (`computeUnlockStats`, both rule
tables), `mandates.test.ts` covers the mandate-roll/pick gating and its
never-lock-out-everything fallback, `shop.test.ts` covers the default
"everything unlocked" snapshot, a locked item never appearing in
`eligibleStock`/`rollStock`, and `buyShopItem()`'s independent safety-net
check. `tools/mandates.mjs` extended: confirms 5 radios (4 unlocked
mandates + "let fate decide") on a cleared-storage fresh run with
`clean-hands`/`pay-deal` entirely absent, seeds a 3-run history that
satisfies every rule in the two tables at once, reloads and confirms all 7
radios appear, actually selects and starts the previously-locked
`clean-hands` mandate (not just that its radio renders), and checks both
Unlocks access points agree nothing is locked. Production build clean;
five Playwright tools green at 1366×700 with zero page errors.

**Read `docs/DESIGN_V2.md` in full before touching UI, the display layer, or
starting Phase 2.** It has the measured evidence for Phase 1, what was
proposed vs. what actually shipped, the full Phase 2 spec, and the resolved
open questions.

## The one-paragraph state of the code

React 18 + TypeScript + Vite, no backend, hand-written CSS, self-hosted fonts
(`public/fonts/`, since Google Fonts is blocked in the sandbox this was built
in). `src/game/` is pure logic with no React in it and is fully testable.
`GameState` is plain serialisable JSON; all content is code keyed by string
id, so save/load is `JSON.stringify` and new content needs no engine changes.
123 vitest tests pass (see the `npm test` line in Commands below for the
current breakdown), including 200 full simulated runs. `src/game/display.ts`
is the one place that decides what the player sees vs. what the engine
tracks — read its header comment before changing what's on screen.

## Ground rules that must not be broken

1. **`GameState` is pure serialisable data.** No functions, class instances,
   `Map` or `Set`. Content lives in code, never in state.
2. **All world mutation goes through `applyEffects()`** in
   `src/game/effects.ts`. Never mutate `state.stats` from a card.
3. **Engine functions clone, mutate, return.** Never mutate the state React
   is holding.
4. **Never call `Math.random()` in game logic.** Use `withRng(s, fn)` so the
   RNG state advances inside the save and runs stay reproducible.
5. **Adding content must never require engine changes.**
6. **Hidden variables are never shown as numbers** — only as briefing
   warnings/threat cards in plain language, alert likelihood, and endings.
7. **The regime is named at the end, never chosen.** There are no selectable
   government types anywhere.
8. **The display layer (`display.ts`) shows a subset; it must never diverge
   from the engine's actual data.** If you add a faction or stat to the
   engine, decide deliberately whether it should surface in the display
   layer — don't let the two drift apart silently.
9. **The primary action on any screen must be reachable without scrolling.**
   Learned twice now — once as the V1 scroll bug, once as a sticky-bar
   overlap in the Poster rebuild. See `.action-bar`'s CSS comment and
   `.strap-action` in `App.tsx` for the current fix: the "next" action lives
   in the always-visible top strap, not only at the bottom of scrollable
   content.
10. **Bump `SAVE_VERSION` in `src/game/state.ts` (currently `11`) whenever
    `GameState`'s shape changes** — adding fields for mandates, the run deck,
    or meta-progression all count. `save.ts` already discards saves with a
    mismatched version rather than crashing, so this is safe by construction
    as long as the bump actually happens. Last bumped 10→11 for
    `FactionDemand`'s new shape plus `demandNotices` (Phase 3 step 1,
    faction demands); 9→10 was the saved confidence-vote phase/result. A bump discards the owner's
    in-progress run — say so when you report.
11. **Keep all game logic — including everything Phase 2 adds — in
    `src/game/` with zero React or DOM dependency.** This is the whole
    reason a future mobile/iOS port stays possible without a rewrite (see
    `docs/DESIGN_V2.md` §10). Don't add a second hover-only mechanism for
    anything gameplay-critical (a price, a trade-off, a required condition)
    either — the glossary already uses plain-text Terms footnotes. Nothing
    new should depend on hover alone to convey required information.

## Writing rules

The first draft was rewritten once for being ornate ("word salad, almost
medieval"), and touched again for jargon a non-political reader wouldn't
know ("what does clearing the payroll mean?").

1. Short sentences. If a sentence needs a second read, rewrite it.
2. Plain modern words. No "which is to say", no inverted clauses.
3. Concrete nouns and real numbers. "The army wants $9 billion for
   helicopters", not "the Staff would like a number".
4. Humour comes from the situation, never from vocabulary.
5. State the price in the option hint, money first: `'Cost: $9.0B. …'`.
6. Card titles say what the card is about: "Buying the Evening News", not
   "The Product".
7. Use the `{sir}` token when a character addresses the player.
8. **If a sentence needs an institutional/financial term a lay reader won't
   know, either say what it means in the same sentence (preferred), or add
   it to `GLOSSARY` in `src/game/glossary.ts`** — the first occurrence in any
   card gets a plain-text Terms definition. Don't assume the glossary
   covers something without checking; it's a backstop for terms that don't
   have a shorter plain-English substitute, not a license to leave jargon
   unexplained in the prose itself.

## Content authoring format

Author options with one property per line and closers on their own lines. The
compact single-line style caused repeated brace-balance errors:

```ts
{
  id: 'fund',
  label: 'Approve all $9 billion today.',
  hint: 'Cost: $9.0B. The army gets what it asked for and learns that asking works.',
  outcome: {
    text: '…',
    tone: 'good',
    effects: { … },
  },
},
```

Verify with `npx esbuild src/game/content/<file>.ts --outfile=/dev/null` for
fast, precise parse errors, then `npx tsc --noEmit`.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm test           # 123 tests: integrity, 200 full runs, determinism, variety,
                   #   glossary, dayInAct, mandates, the run deck (§4.4),
                   #   meta-progression (§4.5, record + real unlock gating),
                   #   the Back Room shop (stock/pricing, firing
                   #   advisors, held/timed/cut deals, caps), the
                   #   confidence-vote reveal, and faction demands
                   #   (Phase 3 step 1: issue/escalate/meet/bribe/lapse)
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the viewport that has caught every real layout bug so far, twice:

```bash
npx playwright install chromium  # once per environment
npm run test:browser        # starts Vite; all checks at 1366×700
node tools/verify.mjs        # with a separately running Vite: full pass
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/playthrough.mjs   # ~9 days, save/reload, screenshots
node tools/legacy.mjs        # §4.5 step 1: ending → title, record line
                             # tools/mandates.mjs also covers step 2's gating
node tools/demands.mjs       # Phase 3 step 1: demand pop-up, rail panel,
                             # meet, bribe, lapse pop-up, masthead access <1080px
```

**Cloud sessions (Claude Code on the web):** the pre-installed Chromium does
not match the Playwright version in `package.json`, so `npx playwright
install` is not an option there. Run `npm install`, then
`PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:browser`.

**Demand pop-ups cover the day until closed** (`.demand-scrim`). Any tooling
that walks through days must close `.demand-pop` first (its `.dm-foot
.btn`) — `verify.mjs`, `to-ending.mjs`, `playthrough.mjs` and `legacy.mjs`
all do. Keyboard shortcuts are disabled while one is open.

## Map of the code

```
src/game/                 no React, no DOM, fully testable
  types.ts                the whole vocabulary — start here
  rng.ts                  seeded RNG; its state lives in the save
  state.ts                createGame(), mandate selection, honorifics
  effects.ts              THE CONSEQUENCE ENGINE — single mutation entry point,
                           including Effects.deck (§4.4 run deck add/remove)
  engine.ts               day loop, deck draw, alert weighting, endings —
                           cardWeight()/alertWeight() read runDeck/bannedCards
  briefing.ts             hidden state → plain-language warnings + threat cards
  display.ts              engine state → what the player actually sees
                           (3 resources, 5 factions) — read this before
                           touching anything stat- or faction-related in the UI
  shop.ts                 THE BACK ROOM — stock rolling, prices, owned-item
                           rules, timed-deal ticking, firing advisors. No
                           React. Content lives in content/shop.ts
  glossary.ts             jargon term → plain definition, auto-applied to prose
  economy.ts              national accounts, budget lines, $ formatting
  stats.ts                stat metadata, bands, tooltips (still full 10 stats;
                           display.ts is what narrows this for the player)
  text.ts                 {sir}/{leader} token replacement
  save.ts                 localStorage, version-guarded, fails safe — THIS
                           run's save; separate from meta.ts's cross-run one
  demands.ts              PHASE 3 FACTION DEMANDS — issuing, escalation,
                           meet/bribe, what a faction does when an ultimatum
                           runs out (tickDemands() runs in dayUpkeep()).
                           Words live in content/demands.ts
  meta.ts                 §4.5 META-PROGRESSION — cross-run record, own
                           localStorage key/version, deliberately outside
                           GameState/SAVE_VERSION. Records runs AND real
                           unlock rules (MANDATE_UNLOCKS/SHOP_UNLOCKS, plain
                           data — a new locked mandate/item is a one-line
                           addition here, nowhere else)
  content/mandates.ts      six origins, generic rule data, Stairwell card
  content/demands.ts       Phase 3: DEMANDS (10, 2 per visible faction) and
                           FACTION_MOVES (per-faction removal attempt,
                           failure and punishment text/effects)
  content/                country, cards, cards2, cards3 (§4.4's content
                           top-up), followups, alerts, endings, shop (the
                           Back Room items, including the run deck's
                           add/remove policies — pure data)
                           (all UNCHANGED by the display-layer cut — still the
                           full 10-stat/7-faction effects)
src/ui/
  components/
    Ledger.tsx             the masthead's 3-resource ledger
    Rail.tsx                Files / Demands / On your desk / Diary /
                            Standing costs — NOT tabbed, everything visible
    Demands.tsx             Phase 3: demand pop-up (DemandPopup), the rail
                            panel (DemandsPanel, rows expand in place) and
                            the masthead overlay (DemandsScreen)
    CardView.tsx             the doc — card-as-lead-story + decision box
    Prose.tsx               renders card text, applies the glossary
  screens/
    Screens.tsx             Title (incl. TitleRecord — §4.5's cross-run
                            line; mandate picker filtered to unlocked ids;
                            "Unlocks" toolbar button), Briefing (front
                            page), Night, Ending
    Progress.tsx             §4.5 step 2 — ProgressPanel (locked/unlocked
                            mandates + rare items, shared) and ProgressScreen
                            (standalone overlay, opened from the title
                            screen). Reused as a tab inside Manage.tsx too
    Shop.tsx                 The Back Room (fullscreen, dark — see the
                            masthead's "PHASE 2" section above) + the rail's
                            compact "Back Room" panel (favours, quick-glance)
    Manage.tsx               "Advisors & Deals" — the fuller management
                            screen opened from the masthead: fire advisors,
                            see timed deals count down. Now tabbed: Roster /
                            Unlocks (ProgressPanel, §4.5 step 2)
    Intro.tsx                the "Brief me" explainer overlay
src/styles/index.css      the whole Poster design system
public/fonts/              self-hosted type (Anton, Archivo Black, Libre
                           Franklin, Lora, Courier Prime — latin subset only)
docs/
  DESIGN_V2.md              the design decisions, measured evidence, and what
                            is still open — read this before UI work
  mockups/                  the design exploration that led here (desk.html,
                            three skins, four layouts) — reference, not live
                            code, but poster.css there mirrors the app's
                            actual token names
tools/                     Playwright scripts for real-browser testing
AGENTS.md                 shared, model-agnostic knowledge base for every
                           agent on this project — canonical copy of the
                           ground rules/writing rules/content format/map/git
                           workflow; edit there first, mirror here
```

## What is deliberately NOT built

**The roguelike layer (acts/shop/mandates/run deck/meta-progression,
`docs/DESIGN_V2.md` §4) is DONE — see "PHASE 2" above.** All five sub-steps
(§4.1–§4.5) are built, playtested, and owner-approved. Phase 2 itself needs
no further work unless a future playtest turns something up.

Phase 3 step 1 (faction demands) is built and awaiting playtest — see
"PHASE 3" above. Everything below is genuinely deferred and needs an
explicit go-ahead before starting, one step at a time. Full detail and
ordering in `docs/DESIGN_V2.md` §9 (Phases 3–5): character-initiated
events, crisis chains, and a balance pass (the rest of Phase 3);
mobile/iOS (Phase 4, not scheduled — see §10 for the
guardrails to keep it possible without doing the work); mini-games, sound,
and the remaining ending types (Phase 5). Do not start any of these without
asking first.

## Git

`claude/confident-meitner-lc0bgc` is the repo's actual default branch — the
one the owner looks at. **Each Claude Code session gets its own separate
working branch** (a fresh auto-named one, e.g. `claude/exciting-dijkstra-
jtlmbh`), not `claude/confident-meitner-lc0bgc` directly, as a deliberate
safety net so an in-progress session can't land bad code straight on
default. Commit with clear messages. Do not open a pull request unless
asked — merge directly (see below).

**Standing workflow, owner-approved — do this every time, not just when
asked:**

1. Do the work, committing on the session's own branch as you go.
2. Before telling the owner it's ready to playtest, run the full
   verification pass: `npm test` (all suites must pass), `npm run build`
   (typecheck + production build must be clean), and a real-browser check
   for anything UI-facing (Playwright at 1366×700, or the existing
   `tools/*.mjs` scripts) — not just "should work," actually run it.
3. **Only if everything in step 2 passes**, merge the session branch into
   `claude/confident-meitner-lc0bgc` yourself (`git merge`, direct push —
   no PR needed) and push. If anything in step 2 fails, do NOT merge —
   fix it and re-verify first.
4. **Announce the merge explicitly, both before and after** — say you're
   about to merge into the default branch right before doing it, and
   confirm it succeeded (with the resulting commit) right after. The owner
   needs to know exactly when a merge happened without having to ask.
5. Only after the merge is confirmed, tell the owner it's ready to
   playtest.

If verification turns up a real failure, report that instead of merging —
never merge broken or unverified work just to close out a session.

## Mandate slice and review notes (2026-09-21)

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

## Run deck slice notes (§4.4, 2026-09-21, later session)

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
- This session also merged `claude/confident-meitner-lc0bgc` forward into
  its own working branch first, to pick up the §4.3 mandates work another
  agent tool had built on a separate branch (`codex/mandates-and-review`)
  and already merged to default — a session picking up a fresh branch after
  another agent's slice landed on default should do the same before
  building the next one.

## Meta-progression slice notes (§4.5 step 1, 2026-09-21, later session)

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
  as stubs that always returned `true`. Step 2 (same session, see the
  section below) gave them real conditions — this bullet is history now,
  not current behaviour.
- `tools/legacy.mjs` is the dedicated browser check for step 1: confirms no
  record line before any run exists, drives one run to an ending, checks
  the line appears after "Back to title" (not "Try again", which skips the
  title screen entirely), and confirms it survives a real page reload.

## Meta-progression step 2 notes (§4.5, same session as above)

- `GameState.unlockedShopItemIds` is a **snapshot**, computed once in
  `createGame()` from `meta.ts`'s `isShopItemUnlocked()`, not re-evaluated
  mid-run. This is deliberate (see `meta.ts`'s file header and
  `types.ts`'s field comment): unlocking something by reaching Act 2 in
  the run you're currently playing should apply to your NEXT run's shop,
  not retroactively change what THIS run's Back Room offers. The mandate
  check works the same way — `state.ts`'s `createGame()` only ever
  evaluates it once, at the moment a new game is created.
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

## Faction demands slice notes (Phase 3 step 1, 2026-09-22)

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
  `DEMAND_ENDINGS` (no `check`, never auto-picked). Army/Money/Street reuse
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

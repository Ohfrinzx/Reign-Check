# AGENTS.md — shared knowledge base for every agent on this project

**This file is the canonical, model-agnostic reference for anyone — human or
AI, Claude Code, a ChatGPT-based agent, or anything else — picking up work on
this repository.** The owner is deliberately running multiple agent tools on
this project and wants them all working from the same facts, the same rules,
and the same workflow, so there is no confusion or drift between sessions
regardless of which model touched the code last.

**If you are an agent and you change a ground rule, the writing rules, the
content-authoring format, the code map, or the git/verification workflow —
edit this file first, then mirror the same change into `CLAUDE.md` (which
Claude Code reads automatically at session start and otherwise defers to this
file). Never let the two disagree.** `PROJECT_STATUS.md` and
`docs/DESIGN_V2.md` are the narrative history and design record — read them
for how the project got here and what is still open; this file is the
reference for how to work in it correctly.

**Read this file first, in full, before touching any code.** Then read
`PROJECT_STATUS.md` (current status, "WHERE WE STOPPED" block at the top)
and `docs/DESIGN_V2.md` (the full design record) before starting real work.

---

## 1. What this project is

**Reign Check** (development codename: Dictator Sandbox) is a browser-based,
card-driven political leadership simulation set in the fictional Republic of
Velmorra. React 18 + TypeScript + Vite, no backend, hand-written CSS,
self-hosted fonts (`public/fonts/`, since Google Fonts is blocked in the
sandbox this was built in).

The game runs in a light **Poster** skin (cream newsprint, condensed black
headlines, one red) in a **Broadsheet** layout (masthead + front-page
briefing + card-as-lead-story + a right rail), showing **3 resources and 5
factions** via a **display layer** (`src/game/display.ts`) over the full,
untouched 10-stat/7-faction engine underneath. A glossary system
(`src/game/glossary.ts` + `CardView.tsx`) supplies plain-text Terms footnotes;
`Prose.tsx` renders prose without hover-only annotations.

## 2. Where the project actually is

**2026-09-23 (latest) — PHASE 3 STEP 4, THE BALANCE PHASE: SLICE C BUILT,
AWAITING OWNER PLAYTEST.** Slices A and B are playtested and approved
(*"Current playtesting checks out, move onto Part C."*). Slice C —
consequences: 18 **marks** left by existing decisions and 36 **reactions**
on later cards that **unlock** a new option, **lock** one, or **change**
one's outcome, each shown as "Because you … (day N)"
(`content/consequences.ts`, `src/game/consequences.ts`); results say
"On the record" when a mark is made, and the rail has an **On the record**
panel. About 5.7 cards per run show a reaction. **`SAVE_VERSION` 13→14**
(in-progress runs reset). 158 tests, build, and the full browser suite (new
`tools/consequences.mjs`) pass. See §21 (slice C), §20 (slice B), §19
(slice A).

Slice B (approved): options shuffled per run, hostile factions act every
morning, the confidence vote counts faction blocs, Hard tuning.

Slice A (approved): a private file every day, crises in a dark situation
room, favours aimed at a named target with a receipt.

**2026-09-22 (later) — PHASE 3 STEP 3, CRISIS CHAINS: BUILT AND PLAYED
(owner moved on to the balance phase).** Step 2 (character-driven events) is owner-approved
(*"all works. Go to the next part."*). Five crisis chains, each a situation
told in three stages over about a week — **The Bread Riots** (unrest),
**The Free Zone Ledger** (corruption), **The Kordiva Referendum**
(separatism), **The Ostrene Gas Cutoff** (foreign) and **The Stairwell
Tapes** (scandal). A chain starts when its hidden pressure boils over
(from day 4, one at a time, each once per run); stages 2 and 3 arrive in a
**calm** or **hot** version depending on how you handled the stage before.
Rules in `src/game/crises.ts`, 25 cards in `src/game/content/crises.ts`,
drawn by `CrisisCardView` in `CardView.tsx` as a "situation room" (third
distinct card look). The running crisis also shows on the front page and
desk. No direct endings. **`SAVE_VERSION` 11→12** (`crisis`/`crisesDone`),
so in-progress runs reset. 135 tests, build, and the full browser suite
(new `tools/crises.mjs`) pass. See §18. **Next: step 4, the balance pass**
— the last piece of Phase 3; see §18's "What is next".

**2026-09-22 (later) — PHASE 3 STEP 2, CHARACTER-DRIVEN EVENTS: BUILT AND
OWNER-APPROVED.** Owner decisions: events arrive as ordinary
cards in the day **but with their own design and layout** (the owner wants
visual and gameplay variety between ordinary cards, these, and future
mini-games); both **betrayals and offers**; a betrayal **never ends the run
by itself**. Rules in `src/game/characterEvents.ts`, 26 cards (a betrayal
and an offer for each of the 13 characters, plus a front-page warning line
each) in `src/game/content/characterEvents.ts`, drawn by
`CharacterCardView` in `CardView.tsx` as a "private file". Triggered by
**loyalty** (plus plotting and grievances), not plotting alone — measured,
plotting only ever rises for one or two characters. A warning always shows
at least one morning before a betrayal. No `GameState` shape change, so
`SAVE_VERSION` stays **11**. Two owner-requested changes to step 1 shipped
with it: the masthead **Demands button is gone** (demands live in the
pop-up and the rail panel only), and the **"Money" faction is now labelled
"Elites"** ("the Elites" in sentences) — "Money" still means the treasury
resource. 129 tests, build, and the full browser suite (new
`tools/characters.mjs`) pass. See §17.

**UPDATE (same day): step 1 is PLAYTESTED AND OWNER-APPROVED.** Owner,
verbatim: *"Ready all works. demands seemed relatively rare not sure if this
is normal? This can be adjusted in the balancing phase so go ahead and move
forward."* Measured afterwards (120 simulated runs per bot, no meeting or
bribing): about 1.4–2.1 demands per run, at least one in 93–100% of runs,
the first one around day 6–9. That is "relatively rare" by design — only a
faction below 35 patience asks, and patience drains slowly. **Frequency is
parked for the balance pass (step 4)**: the levers are `ISSUE_BELOW`,
`STAGE_DAYS`, `MAX_LIVE`, and how fast patience drains in `dayUpkeep()`.

**2026-09-22 (later) — PHASE 3 STEP 1, FACTION DEMANDS: BUILT, AWAITING
OWNER PLAYTEST.** The owner gave the go-ahead for Phase 3 and specified the
design: demands arrive as **pop-ups**, are **stored in a side panel** the
player can expand (which faction, the details, a **Meet** option where
applicable, and a **bribe for an extension that is not always accepted**),
and an unmet demand **can lead to a coup or another attempt at removal,
depending on standing with that faction and other conditions.** Rules in
`src/game/demands.ts`, words in `src/game/content/demands.ts` (10 demands,
2 per visible faction, plus one "move" per faction), UI in
`src/ui/components/Demands.tsx` (pop-up and rail "Demands" panel; a
masthead "Demands" button was later removed at the owner's request). Two
new endings (`sable-removal`, `general-strike`); Army, Elites
and Street moves reuse `coup`, `elite` and `revolution`. `SAVE_VERSION` is
**11**, so in-progress runs reset; meta history is unaffected. 123 tests,
production build, and the full browser suite (including new
`tools/demands.mjs`) pass. Balance was measured, not tuned: see §16.
Steps 2 (character events) and 3 (crisis chains) have since been built —
see above. Step 4 (balance pass) is not started and needs its own go-ahead.

**2026-09-22 — confidence-vote reveal built, playtested, and owner-approved.** The
owner authorized the recommended division-board + clerk-tally direction.
The reveal now runs before the Back Room, preserving the existing vote
cutoff. `finishDay()` freezes a deterministic `ConfidenceVoteResult` and
enters the serialisable `vote` phase; `completeConfidenceVote()` applies the
stored pass/fail exactly once. `Vote.tsx` reveals 24 clearly-labelled clerk
returns, the score threshold, Grip, Legitimacy, exact margin, and final stamp.
It supports skip, reduced motion, save/reload, and screen-reader result copy.
`SAVE_VERSION` is **10**, so version-9 in-progress runs reset; cross-run meta
history is unaffected. All 113 tests, production build, and the full browser
suite pass. The owner confirmed: *"Play tested and working."* See
`docs/DESIGN_V2.md` §4.1a. This approval closes the reveal slice; Phase 3
balance changes remain unbuilt and need their own go-ahead.

**Phase 1** (playable core, then the Poster/Broadsheet rebuild) is done and
owner-approved.

**Phase 2** (the roguelike layer: acts, the Back Room shop, mandates, a run
deck, meta-progression — full spec in `docs/DESIGN_V2.md` §4) is **COMPLETE
— all five sub-steps built, playtested, and owner-approved** (2026-09-21).
Owner, verbatim: *"Playtest good, ready for next slice. Won't be doing it
now."* That is Phase 2's final approval, not yet a go-ahead to start
Phase 3 — see §3's staged-slice discipline and the "not built yet" note
below §4.5.

- **§4.1, run structure** (3 acts of 6 days each, ending in a confidence
  vote) — **BUILT AND OWNER-APPROVED.**
- **§4.2, the Back Room shop** (both chunks, 47 items across advisors/
  policies/favours/deals, dark fullscreen presentation, the "Advisors &
  Deals" management screen, advisor/deal caps with a held-panel) —
  **BUILT AND OWNER-APPROVED.**
- A small display fix (the masthead/front-page day counter reads `Day X / 6`,
  progress within the current act, instead of `Day X / 18`) — **BUILT AND
  OWNER-APPROVED.**
- **§4.3 (mandates) — BUILT AND OWNER-APPROVED.** Six selectable/seeded
  origins, persistent rules, and a one-time Stairwell event.
  `content/mandates.ts` replaces the old `OPENINGS` scenarios. The owner
  confirmed that the mandate table's Money changes mean treasury.
- **§4.4 (the run deck) — BUILT AND OWNER-APPROVED (2026-09-21, later
  session).** Owner-playtested and bug-checked by a ChatGPT-based agent,
  approved. `GameState.runDeck`/`bannedCards` plus `Effects.deck.add`/
  `remove`, read by `cardWeight()`/`alertWeight()` in `engine.ts`: a card
  the player holds copies of draws more often (bounded by the existing
  3-day recency gate); a banned card never draws again. 8 new Back Room
  policies in `content/shop.ts` use it. Also folds in this slice's content
  quota: 20 new standard cards (`content/cards3.ts`, new file) and 5 new
  alerts (appended to `content/alerts.ts`, filling in the previously-unused
  `scandal`/`corruption`/`cult` drivers). `SAVE_VERSION` is **8**;
  version-7 in-progress runs reset.
- **§4.5 (meta-progression) — BOTH STEPS PLAYTESTED AND OWNER-APPROVED
  (2026-09-21, later session) — this completes all of Phase 2.** Step 1
  shipped the cross-run record: `src/game/meta.ts` (new file) —
  `MetaProgress`/`RunRecord`, its own localStorage key
  (`dictator-sandbox:legacy:v1`) and its own version (`META_VERSION`,
  currently 1), deliberately separate from `GameState`/`SAVE_VERSION` so
  deleting a save or restarting a run never touches it. Every finished run
  is appended (capped at 50); `App.tsx` records one on the `useEffect`
  watching `game.ending`, guarded by a ref so it never double-records. The
  title screen shows a one-line record ("N administrations so far — …",
  `TitleRecord` in `Screens.tsx`) once at least one run exists.
  **Step 2, same session, built right after**: the owner asked what
  meta-progression would be, then specified where the unlock view should
  live — real conditions now gate content. `meta.ts` adds
  `computeUnlockStats()`, `MANDATE_UNLOCKS` (`clean-hands`: finish 2 runs;
  `pay-deal`: reach Act 2), `SHOP_UNLOCKS` (`one-good-story`: survive
  once; `archivist`: finish 3 runs) — both `rarity: 'rare'` items in
  `content/shop.ts`. `isMandateUnlocked()`/`isShopItemUnlocked()` now do
  real work. `GameState.unlockedShopItemIds` (new field, `types.ts`) is a
  snapshot taken once at `createGame()` time — never re-evaluated mid-run.
  `state.ts`'s mandate roll/explicit-pick both respect
  `NewGameOptions.unlockedMandateIds`, with a safe fallback so the pool
  can never be locked out entirely. `shop.ts`'s `eligible()` and
  `engine.ts`'s `buyShopItem()` both check `unlockedShopItemIds` (the
  latter as a safety net, same pattern as `capBlockReason()`).
  `SAVE_VERSION` was **9** for this slice; version-8 in-progress runs reset. New
  `src/ui/screens/Progress.tsx` (`ProgressPanel` shared content +
  `ProgressScreen` standalone overlay) is reused in two places per the
  owner's spec: a "Roster"/"Unlocks" tab pair inside "Advisors & Deals"
  (`Manage.tsx`, reusing the `.seg`/`.seg-btn` segmented control already
  used for the honorific picker), and a new "Unlocks" button on the title
  screen's toolbar — which also now filters its own mandate picker down
  to what's actually unlocked. 7 new tests (100→107); `tools/mandates.mjs`
  extended to seed unlock history and verify both access points plus the
  gated picker; all five Playwright tools green at 1366×700.

For the exact, up-to-the-minute state (what shipped last, what's still
mid-loop, what the owner's own words were), read `PROJECT_STATUS.md`'s
"▶ WHERE WE STOPPED" block — it is kept current at the top of that file and
is the first thing to check at the start of any session.

**What is deliberately NOT built**, and needs an explicit owner go-ahead
before starting (full detail in `docs/DESIGN_V2.md` §9): the rest of
Phase 3's balance phase — slices B (difficulty) and C (consequences), each
after the previous slice's playtest (slice A is built and awaiting
playtest); mobile/iOS (Phase 4, not scheduled — see §10 for the
guardrails to keep it possible without doing the work now); mini-games,
sound, and remaining ending types (Phase 5).

## 3. The standing development discipline

This project has gone through the same loop repeatedly and it has worked
every time: **build the smallest testable, shippable slice, verify it for
real, report back, and wait for the owner's playtest before continuing to
the next slice.** Don't chain multiple roadmap items together speculatively
just because the owner approved the previous one — each slice gets its own
explicit go-ahead.

**"Add more content" is folded into the slice it belongs to, not a separate
pass.** Each of §4.2–§4.4 in `docs/DESIGN_V2.md` carries its own content
quota (item counts, mandate counts, card counts). Author that content as
part of building the slice, not before or after it.

## 3a. Required hand-off report — every agent, every time

**Owner request (2026-09-22): every agent must end its output, whenever it
has changed anything, with a plain report the owner can act on without
reading the diff.** Not optional, and not only when asked. The report has
two parts:

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
merged into the default branch (§10). Documentation-only turns still need
part 1 (what changed in the docs); part 2 can say "nothing to playtest".

## 4. Ground rules that must not be broken

1. **`GameState` is pure serialisable data.** No functions, class instances,
   `Map` or `Set`. Content lives in code, never in state.
2. **All world mutation goes through `applyEffects()`** in
   `src/game/effects.ts`. Never mutate `state.stats` from a card.
3. **Engine functions clone, mutate, return.** Never mutate the state the UI
   layer is holding.
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
   Learned twice — once as the V1 scroll bug, once as a sticky-bar overlap in
   the Poster rebuild. See `.action-bar`'s CSS comment and `.strap-action` in
   `App.tsx`: the "next" action lives in the always-visible top strap, not
   only at the bottom of scrollable content.
10. **Bump `SAVE_VERSION` in `src/game/state.ts` whenever `GameState`'s
    shape changes** — adding fields for mandates, the run deck, or
    meta-progression all count. `save.ts` already discards saves with a
    mismatched version rather than crashing, so this is safe by construction
    as long as the bump actually happens. Check `state.ts` for the current
    value and the change history in its comment. **A bump discards the
    owner's in-progress run — say so when you report.** A purely derived
    read with no new field (like `dayInAct()`) does not need a bump.
11. **Keep all game logic — including everything Phase 2 adds — in
    `src/game/` with zero React or DOM dependency.** This is the whole
    reason a future mobile/iOS port stays possible without a rewrite (see
    `docs/DESIGN_V2.md` §10). Don't add a second hover-only mechanism for
    anything gameplay-critical (a price, a trade-off, a required condition)
    — the glossary already uses plain-text Terms footnotes. Nothing new
    should depend on hover alone to convey required information.

## 5. Writing rules

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

## 6. Content authoring format

Author options with one property per line and closers on their own lines.
The compact single-line style caused repeated brace-balance errors:

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

## 7. Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm test           # vitest: content integrity, 200 full simulated runs,
                   #   determinism, variety, glossary, the Back Room shop
                   #   suite (stock/pricing, firing advisors, held/timed/cut
                   #   deals, caps), mandates, the run deck (§4.4),
                   #   meta-progression (§4.5, record + real unlock gating),
                   #   the confidence-vote reveal, and faction demands
                   #   (Phase 3 step 1: issue/escalate/meet/bribe/lapse),
                   #   character events (step 2: warn/betray/offer),
                   #   crisis chains (step 3: start/calm-hot/end),
                   #   favours (balance slice A: targets, receipts), and
                   #   difficulty (slice B: hostile factions, bloc vote,
                   #   option shuffle, regime label), and consequences
                   #   (slice C: marks, unlock/lock/change)
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the viewport that has caught every real layout bug so far:

```bash
npx playwright install chromium  # once per environment
npm run test:browser        # starts Vite; all checks at 1366×700
node tools/verify.mjs        # with a separately running Vite: full pass
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/playthrough.mjs   # ~9 days, save/reload, screenshots
node tools/legacy.mjs        # §4.5 step 1: ending → title, checks the record line
                             # tools/mandates.mjs also covers step 2's gating
                             # (seeds unlock history, checks both Unlocks
                             # access points and the filtered mandate picker)
node tools/demands.mjs       # Phase 3 step 1: demand pop-up, rail panel,
                             # meet, bribe, lapse pop-up, no masthead button,
                             # pop-up still works <1080px (rail hidden)
node tools/characters.mjs    # Phase 3 step 2: warning first, private-file
                             # betrayal card, reply slips, keyboard, offer
node tools/crises.mjs        # Phase 3 step 3 + slice A: front page, the dark
                             # situation-room scene, tracker, log, orders, hot stage 2
node tools/favours.mjs       # balance slice A: useful-now, disabled-with-reason,
                             # target dialog, named receipt, target really gone
node tools/hostile.mjs       # balance slice B: hostile pop-up, front-page action,
                             # desk danger 3 of 3, demand issued
node tools/consequences.mjs  # balance slice C: on-the-record note + rail panel,
                             # unlocked / locked / changed options with reasons
```

**Cloud sessions (Claude Code on the web):** the pre-installed Chromium does
not match the Playwright version in `package.json`, so `npx playwright
install` is not an option there. Run the browser checks with
`PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:browser`.
`npm install` is also needed first in a fresh container.

## 8. Map of the code

```
src/game/                 no React, no DOM, fully testable
  types.ts                the whole vocabulary — start here
  rng.ts                  seeded RNG; its state lives in the save
  state.ts                createGame(), mandate selection, honorifics,
                           dayInAct()/isActEndDay()/justAdvancedAct()
  effects.ts              THE CONSEQUENCE ENGINE — single mutation entry point,
                           including Effects.deck (§4.4 run deck add/remove)
  engine.ts               day loop, deck draw, alert weighting, endings —
                           cardWeight()/alertWeight() read runDeck/bannedCards
  briefing.ts             hidden state → plain-language warnings + threat cards
  display.ts              engine state → what the player actually sees
                           (3 resources, 5 factions) — read this before
                           touching anything stat- or faction-related in the UI
  shop.ts                 THE BACK ROOM — stock rolling, prices, owned-item
                           rules, timed-deal ticking, firing advisors, deal
                           caps. No React. Content lives in content/shop.ts
  glossary.ts             jargon term → plain definition, auto-applied to prose
  economy.ts              national accounts, budget lines, $ formatting
  stats.ts                stat metadata, bands, tooltips (still full 10 stats;
                           display.ts is what narrows this for the player)
  text.ts                 {sir}/{leader} token replacement
  save.ts                 localStorage, version-guarded, fails safe — THIS
                           run's save; separate from meta.ts's cross-run one
  consequences.ts         BALANCE SLICE C — marks (flags 'mark:<id>') and
                           shownOptions(): unlock/lock/change later options
                           with a "Because you…" note. Words live in
                           content/consequences.ts
  favours.ts              BALANCE SLICE A — favour targets (scandal/demand/
                           crisis), block reasons, spendFavour() + receipt
  crises.ts               PHASE 3 CRISIS CHAINS — start/advance/end the
                           running chain (tickCrises() runs in dayUpkeep()).
                           Cards live in content/crises.ts
  characterEvents.ts      PHASE 3 CHARACTER EVENTS — warnings, betrayals,
                           offers (tickCharacterEvents() runs in dayUpkeep()).
                           Cards live in content/characterEvents.ts
  demands.ts              PHASE 3 FACTION DEMANDS — issuing, escalation,
                           meet/bribe, what a faction does when an ultimatum
                           runs out (tickDemands() runs in dayUpkeep()).
                           Also HOSTILE factions (balance slice B:
                           tickHostility(), before tickDemands()).
                           Words live in content/demands.ts
  meta.ts                 §4.5 META-PROGRESSION — cross-run record, own
                           localStorage key/version, deliberately outside
                           GameState/SAVE_VERSION. Records runs AND real
                           unlock rules (MANDATE_UNLOCKS/SHOP_UNLOCKS, plain
                           data — a new locked mandate/item is a one-line
                           addition here, nowhere else)
  content/mandates.ts      six origins, generic rule data, Stairwell card
  content/characterRequests.ts  balance slice A: 13 everyday private-file
                           requests (one per character)
  content/crises.ts        Phase 3 step 3: CRISES — 5 chains × 5 cards
                           (stage 1, stage 2 calm/hot, stage 3 calm/hot)
  content/characterEvents.ts  Phase 3 step 2: CHARACTER_EVENTS — per
                           character a warning line, a betrayal card and an
                           offer card (26 cards)
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
    Demands.tsx             Phase 3: demand pop-up (DemandPopup) and the rail
                            panel (DemandsPanel, rows expand in place)
    FavourDialog.tsx        balance slice A: pick a favour's target, then a
                            receipt of what it did
    CardView.tsx             the doc — card-as-lead-story + decision box;
                            CharacterCardView, the "private file" layout for
                            character events (Phase 3 step 2);
                            CrisisCardView, the "situation room" layout for
                            crisis chains (Phase 3 step 3)
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
    Shop.tsx                 The Back Room (fullscreen, dark) + the rail's
                            compact "Back Room" panel (favours, quick-glance)
    Manage.tsx               "Advisors & Deals" — the fuller management
                            screen opened from the masthead: fire advisors,
                            cut deals, see timed deals count down, live caps.
                            Now tabbed: Roster (the above) / Unlocks
                            (ProgressPanel, §4.5 step 2's second access point)
    Intro.tsx                the "Brief me" explainer overlay
src/styles/index.css      the whole Poster design system
public/fonts/              self-hosted type (Anton, Archivo Black, Libre
                           Franklin, Lora, Courier Prime — latin subset only)
docs/
  DESIGN_V2.md              the design decisions, measured evidence, and what
                            is still open — read this before UI work
  mockups/                  the design exploration that led here — reference,
                            not live code
tools/                     Playwright scripts; run-browser.mjs starts Vite
                           and runs checks in one process tree
```

## 9. Special UI notes worth knowing before touching them

- **The Back Room shop was the first of two dark screens** (the other is the
  crisis situation room, balance slice A — see below) (owner request:
  it should feel like you are somewhere else). `.app.dark` in
  `src/styles/index.css` swaps the surface tokens for the shop phase only.
  This is NOT the dark desk skin rejected in Phase 1 — do not darken any
  other screen without asking. Re-declare colours inside `.app`, not `body`:
  `body` resolves tokens in the light scope and children inherit the
  resolved value.
- **The Back Room is also fullscreen.** `App.tsx` has an early `return` for
  `game.phase === 'shop'` rendering a separate `<div className="app dark
  shop-full">` with only `<ShopScreen>` inside — no masthead, no strap, no
  rail. **The shop's own "Leave" button (`.shop-foot .btn-primary`) is the
  only way out** — there is no `.strap-action` during the shop phase. Any
  tooling that drives the shop needs to check `.shop-foot .btn-primary`
  first, not `.strap-action`.
- **The "Money" faction is labelled "Elites"** (owner request; `concord`'s
  label in `DISPLAY_FACTIONS`). Write "the Elites" in sentences. "Money"
  on the masthead ledger is the treasury resource, a different thing.
- **There is no masthead Demands button** (owner removed it). Demands live
  in the pop-up and the rail's Demands panel only; below 1080px, where the
  rail is hidden, the pop-up is the only view.
- **Crisis stages play in their own full-screen dark scene** (balance
  slice A, owner request): `App.tsx` early-returns `.app.situation-room`
  for a `crisis-chain` card in `stage`/`resolve`. With the Back Room, that
  makes two dark screens, both requested — do not darken others unasked.
- **Crisis-chain cards use a third layout** (`CrisisCardView`, "situation
  room"). Measure layout in browser tools only after the card's rise-in
  animation finishes (wait ~500ms).
- **Character-event cards use their own layout** (`CharacterCardView`), not
  the lead-story `.doc` header. Keep it visually distinct; the owner wants
  variety between card types and future mini-games.
- **Option order is shuffled per run** (balance slice B,
  `engine.ts orderedOptions()`). Render options and map number keys through
  it — never `card.options` directly. Browser tools that need a specific
  choice find it by text and press its shown number.
- **Options can carry a "Because you…" note** (balance slice C,
  `OptionText` in `CardView.tsx`, used by all three card layouts): teal
  edge = new option, mustard = changed, a locked one shows its reason.
  Results show `.outcome-because` and `.outcome-marked`; the rail has an
  "On the record" panel (`.record-panel`).
- **The confidence vote is counted in faction blocs** (`Vote.tsx`, balance
  slice B): one row per visible faction, seats filled for / outlined
  against, then the stamp. Hostile factions (bottom mood, loyalty < 20) vote
  against as one; they also get a `hostile` demand pop-up the first morning.
- **Demand pop-ups cover the day until closed** (`.demand-scrim`). Any
  tooling that walks through days must close `.demand-pop` first (its
  `.dm-foot .btn`) — `verify.mjs`, `to-ending.mjs`, `playthrough.mjs` and
  `legacy.mjs` all do. While a pop-up is open, keyboard shortcuts (1–9,
  Enter) are disabled so they cannot act on the card underneath.
- **Advisors and deals are capped** (`ADVISOR_CAP`/`DEAL_CAP` in `shop.ts`).
  Past the cap, buying more of that kind is blocked until a slot is freed by
  firing an advisor or cutting a deal — every deal (permanent or timed)
  occupies a slot in `GameState.heldDeals` until it ends or is cut.

## 10. Git and verification workflow

`claude/confident-meitner-lc0bgc` is the repo's actual default branch — the
one the owner looks at. **Every agent session works on its own branch**, not
the default branch directly, as a safety net so in-progress work can't land
straight on default. Commit with clear messages. Do not open a pull request
unless asked — merge directly.

**Standing workflow — do this every time, not just when asked:**

1. Do the work, committing on the session's own branch as you go.
2. Before telling the owner it's ready to playtest, run the full
   verification pass: `npm test` (all suites must pass), `npm run build`
   (typecheck + production build must be clean), and a real-browser check
   for anything UI-facing (Playwright at 1366×700, or the existing
   `tools/*.mjs` scripts) — not just "should work," actually run it.
3. **Only if everything in step 2 passes**, merge the session branch into
   `claude/confident-meitner-lc0bgc` (`git merge`, direct push — no PR
   needed) and push. If anything in step 2 fails, do NOT merge — fix it and
   re-verify first.
4. **Announce the merge explicitly, both before and after** — say you're
   about to merge into the default branch right before doing it, and
   confirm it succeeded (with the resulting commit) right after. The owner
   needs to know exactly when a merge happened without having to ask.
5. Only after the merge is confirmed, tell the owner it's ready to
   playtest.

If verification turns up a real failure, report that instead of merging —
never merge broken or unverified work just to close out a session.

## 11. Keeping this file current

**Every agent that changes project state, ground rules, the workflow, or the
code map is responsible for updating this file in the same session** —
don't leave it to "whoever reads this next." Specifically:

- A new completed/approved slice, or a status change (built → playtested →
  approved), belongs in `PROJECT_STATUS.md`'s "WHERE WE STOPPED" block
  first (that's the detailed, dated history) — then reflect the short
  version here in §2 so a cold read of this file alone gives the right
  current state.
- A new or changed ground rule, writing rule, content format, code-map
  entry, or workflow step belongs here first, then mirrored into
  `CLAUDE.md`.
- If you're unsure whether something belongs in this file vs.
  `PROJECT_STATUS.md` vs. `docs/DESIGN_V2.md`: this file is "how to work
  here, and where things currently stand in one paragraph"; the other two
  are the detailed narrative and design history. When in doubt, put the
  fact in `PROJECT_STATUS.md` and put a short pointer here.

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

**What is next.** Owner playtest of slice C. After that the balance phase
(Phase 3 step 4) is complete unless the playtest turns something up; Phase
4 (mobile/iOS) stays unscheduled and Phase 5 (mini-games, sound, remaining
endings) needs its own go-ahead.

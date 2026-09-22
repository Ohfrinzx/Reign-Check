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

**2026-09-22 (latest) — PHASE 3 STEP 2, CHARACTER-DRIVEN EVENTS: BUILT,
AWAITING OWNER PLAYTEST.** Owner decisions: events arrive as ordinary
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
Step 2 (character events) has since been built — see above. Steps 3–4
(crisis chains, balance pass) are not started; each needs its own go-ahead.

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
Phase 3 — crisis chains and a balance pass (step 1, faction demands, is
owner-approved; step 2, character events, is built and awaiting playtest;
each later step still gets its own go-ahead); mobile/iOS (Phase 4, not scheduled — see §10 for the
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
                   #   and character events (step 2: warn/betray/offer)
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
  characterEvents.ts      PHASE 3 CHARACTER EVENTS — warnings, betrayals,
                           offers (tickCharacterEvents() runs in dayUpkeep()).
                           Cards live in content/characterEvents.ts
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
    CardView.tsx             the doc — card-as-lead-story + decision box;
                            CharacterCardView, the "private file" layout for
                            character events (Phase 3 step 2)
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

- **The Back Room shop is the one dark screen in the game** (owner request:
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
- **Character-event cards use their own layout** (`CharacterCardView`), not
  the lead-story `.doc` header. Keep it visually distinct; the owner wants
  variety between card types and future mini-games.
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

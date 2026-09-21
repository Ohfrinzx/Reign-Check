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

**Phase 1** (playable core, then the Poster/Broadsheet rebuild) is done and
owner-approved.

**Phase 2** (the roguelike layer: acts, the Back Room shop, mandates, a run
deck, meta-progression — full spec in `docs/DESIGN_V2.md` §4) is greenlit and
in progress:

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
- **§4.4 (the run deck) — BUILT, awaiting owner playtest (2026-09-21, later
  session).** `GameState.runDeck`/`bannedCards` plus `Effects.deck.add`/
  `remove`, read by `cardWeight()`/`alertWeight()` in `engine.ts`: a card
  the player holds copies of draws more often (bounded by the existing
  3-day recency gate); a banned card never draws again. 8 new Back Room
  policies in `content/shop.ts` use it. Also folds in this slice's content
  quota: 20 new standard cards (`content/cards3.ts`, new file) and 6 new
  alerts (appended to `content/alerts.ts`, filling in the previously-unused
  `scandal`/`corruption`/`cult` drivers). `SAVE_VERSION` is **8**;
  version-7 in-progress runs reset.
- **§4.5 (meta-progression) — NOT started.** Wait for run-deck playtest and
  an explicit instruction before beginning another slice.

For the exact, up-to-the-minute state (what shipped last, what's still
mid-loop, what the owner's own words were), read `PROJECT_STATUS.md`'s
"▶ WHERE WE STOPPED" block — it is kept current at the top of that file and
is the first thing to check at the start of any session.

**What is deliberately NOT built**, and needs an explicit owner go-ahead
before starting (full detail in `docs/DESIGN_V2.md` §9): faction demands as
a live mechanic, character-initiated events, crisis chains, and a balance
pass (Phase 3, after Phase 2 is done and playtested); mobile/iOS (Phase 4,
not scheduled — see §10 for the guardrails to keep it possible without doing
the work now); mini-games, sound, and remaining ending types (Phase 5).

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
                   #   deals, caps), mandates, and the run deck (§4.4)
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the viewport that has caught every real layout bug so far:

```bash
npx playwright install chromium  # once per environment
npm run test:browser        # starts Vite; all checks at 1366×700
node tools/verify.mjs        # with a separately running Vite: full pass
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/playthrough.mjs   # ~9 days, save/reload, screenshots
```

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
  save.ts                 localStorage, version-guarded, fails safe
  content/mandates.ts      six origins, generic rule data, Stairwell card
  content/                country, cards, cards2, cards3 (§4.4's content
                           top-up), followups, alerts, endings, shop (the
                           Back Room items, including the run deck's
                           add/remove policies — pure data)
                           (all UNCHANGED by the display-layer cut — still the
                           full 10-stat/7-faction effects)
src/ui/
  components/
    Ledger.tsx             the masthead's 3-resource ledger
    Rail.tsx                Files / On your desk / Diary / Standing costs —
                            NOT tabbed, everything always visible
    CardView.tsx             the doc — card-as-lead-story + decision box
    Prose.tsx               renders card text, applies the glossary
  screens/
    Screens.tsx             Title, Briefing (front page), Night, Ending
    Shop.tsx                 The Back Room (fullscreen, dark) + the rail's
                            compact "Back Room" panel (favours, quick-glance)
    Manage.tsx               "Advisors & Deals" — the fuller management
                            screen opened from the masthead: fire advisors,
                            cut deals, see timed deals count down, live caps
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

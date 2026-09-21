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

## PHASE 2 — §4.1/§4.2 APPROVED; §4.3 BUILT, AWAITING PLAYTEST

**The owner has approved starting the roguelike layer, fully specified in
`docs/DESIGN_V2.md` section 4.** §4.1 (run structure — 3 acts of 6 days
each, ending in a confidence vote) and §4.2 (the Back Room shop, both
chunks, plus the day-in-act display fix) have all been built, playtested,
and approved by the owner — verbatim: *"All up to date content has been
playtested and is approved."* See `PROJECT_STATUS.md`'s "WHERE WE STOPPED"
block for the full history. **As of 2026-09-21, §4.3 is built and awaiting
owner playtest:** six selectable/seeded mandates, persistent rules, and the
Stairwell recording event. The owner confirmed Money means treasury.
`SAVE_VERSION` is 7; prior saves reset. §4.4 and §4.5 remain unstarted and
need an explicit instruction after this slice is playtested.

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

**§4.1, §4.2, and the day counter fix remain owner-approved. §4.3 is now
built, awaiting owner playtest.** Next, after feedback and an explicit
instruction: §4.4 run deck, then §4.5 meta-progression. See the current
`PROJECT_STATUS.md` handoff and `docs/REVIEW_2026_09_21.md`.

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
85 vitest tests pass (see the `npm test` line in Commands below for the
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
10. **Bump `SAVE_VERSION` in `src/game/state.ts` (currently `7`) whenever
    `GameState`'s shape changes** — adding fields for mandates, the run deck,
    or meta-progression all count. `save.ts` already discards saves with a
    mismatched version rather than crashing, so this is safe by construction
    as long as the bump actually happens. Last bumped 6→7 for `mandateId`
    and saved generated-ID bookkeeping. A bump discards the owner's
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
npm test           # 85 tests: integrity, 200 full runs, determinism, variety,
                   #   glossary, dayInAct, and 46 covering the Back Room shop (stock/
                   #   pricing, firing advisors, held/timed/cut deals, caps)
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the viewport that has caught every real layout bug so far, twice:

```bash
npx playwright install chromium  # once per environment
npm run test:browser        # starts Vite; all checks at 1366×700
node tools/verify.mjs        # with a separately running Vite: full pass
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/playthrough.mjs   # ~9 days, save/reload, screenshots
```

## Map of the code

```
src/game/                 no React, no DOM, fully testable
  types.ts                the whole vocabulary — start here
  rng.ts                  seeded RNG; its state lives in the save
  state.ts                createGame(), mandate selection, honorifics
  effects.ts              THE CONSEQUENCE ENGINE — single mutation entry point
  engine.ts               day loop, deck draw, alert weighting, endings
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
  save.ts                 localStorage, version-guarded, fails safe
  content/mandates.ts      six origins, generic rule data, Stairwell card
  content/                country, cards, cards2, followups, alerts, endings,
                           shop (the 47 Back Room items — pure data)
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
    Shop.tsx                 The Back Room (fullscreen, dark — see the
                            masthead's "PHASE 2" section above) + the rail's
                            compact "Back Room" panel (favours, quick-glance)
    Manage.tsx               "Advisors & Deals" — the fuller management
                            screen opened from the masthead: fire advisors,
                            see timed deals count down
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
`docs/DESIGN_V2.md` §4) IS greenlit — see "PHASE 2" above.** Build it in the
staged order §4/§6 lay out, checking back in after each shippable slice,
same as everything else in this project so far.

Everything else is genuinely deferred and needs an explicit go-ahead before
starting — full detail and ordering in `docs/DESIGN_V2.md` §9 (Phases 3–5):
faction demands as a live mechanic, character-initiated events, crisis
chains, and a balance pass (Phase 3, comes after Phase 2 is done and
playtested); mobile/iOS (Phase 4, not scheduled — see §10 for the
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

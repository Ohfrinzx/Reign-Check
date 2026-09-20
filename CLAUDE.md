# CLAUDE.md — read this first

You are picking up **Dictator Sandbox**, a browser-based, card-driven political
leadership simulation set in the fictional Republic of Velmorra. This file is
the handover. Read it, then `PROJECT_STATUS.md`, then `docs/DESIGN_V2.md`.

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
underneath. A glossary system (`src/game/glossary.ts` + `Prose.tsx`)
auto-annotates jargon with plain-language hover/tap definitions across card
body, outcome text, option hints, flavor text, and threat cards. 13 vitest
tests pass and this was verified end to end in a real browser at 1366×700,
the viewport that has caught every real layout bug so far.

## PHASE 2 IS GREENLIT — §4.1 IS BUILT, ONE PLAYTEST ROUND IN

**The owner has approved starting the roguelike layer, fully specified in
`docs/DESIGN_V2.md` section 4.** §4.1 (run structure — 3 acts of 6 days
each, ending in a confidence vote) has been built AND has been through one
full round of owner playtesting and fixes (header balance, duplicate UI
removed, glossary moved off hover, a card-voice rewrite, and a day-1
card-variety fix found by simulation) — see `PROJECT_STATUS.md`'s "WHERE WE
STOPPED" block for the full list and how each was verified. **Do not start
§4.2 (the Back Room shop), §4.3 (mandates), §4.4 (the run deck), or §4.5
(meta-progression) until the owner says §4.1 itself is done** — same
build → report → playtest → iterate discipline as every milestone before
this one, and this slice is still mid-loop. If a fresh session opens with
more feedback on §4.1, keep iterating on it the same way round 1 was
handled (measure before guessing where the game's tests/tooling allow it)
rather than treating the feedback as done and moving on. Read
`docs/DESIGN_V2.md` section 4 in full before touching any of §4.2–§4.5 — it
has the exact mandate table, shop item categories, and the reasoning for
why depth should live in cards/combinations, not more UI.

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
(`state.ts`). The shop, mandates, and run deck were deliberately NOT
touched — those are §4.2–§4.5 and remain separate, later slices, not to be
started until §4.1 is playtested and approved.

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
13 vitest tests pass, including 200 full simulated runs. `src/game/display.ts`
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
10. **Bump `SAVE_VERSION` in `src/game/state.ts` (currently `3`) whenever
    `GameState`'s shape changes** — adding fields for mandates, the run deck,
    or meta-progression all count. `save.ts` already discards saves with a
    mismatched version rather than crashing, so this is safe by construction
    as long as the bump actually happens. Last bumped 2→3 for §4.1's `act`
    field; mandates/run-deck/meta-progression will likely be the next time.
11. **Keep all game logic — including everything Phase 2 adds — in
    `src/game/` with zero React or DOM dependency.** This is the whole
    reason a future mobile/iOS port stays possible without a rewrite (see
    `docs/DESIGN_V2.md` §10). Don't add a second hover-only mechanism for
    anything gameplay-critical (a price, a trade-off, a required condition)
    either — the glossary's hover tooltip is allowed to stay as-is, but
    nothing new should depend on hover alone to convey required information.

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
   card gets an automatic hover/tap definition. Don't assume the glossary
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
npm test           # 13 tests: integrity, 200 full runs, determinism, variety, glossary
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the viewport that has caught every real layout bug so far, twice:

```bash
node tools/verify.mjs        # full pass: intro, scrolling, prices, ending, save
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/playthrough.mjs   # ~9 days, save/reload, screenshots
```

## Map of the code

```
src/game/                 no React, no DOM, fully testable
  types.ts                the whole vocabulary — start here
  rng.ts                  seeded RNG; its state lives in the save
  state.ts                createGame(), opening scenarios, honorifics
  effects.ts              THE CONSEQUENCE ENGINE — single mutation entry point
  engine.ts               day loop, deck draw, alert weighting, endings
  briefing.ts             hidden state → plain-language warnings + threat cards
  display.ts              engine state → what the player actually sees
                           (3 resources, 5 factions) — read this before
                           touching anything stat- or faction-related in the UI
  glossary.ts             jargon term → plain definition, auto-applied to prose
  economy.ts              national accounts, budget lines, $ formatting
  stats.ts                stat metadata, bands, tooltips (still full 10 stats;
                           display.ts is what narrows this for the player)
  text.ts                 {sir}/{leader} token replacement
  save.ts                 localStorage, version-guarded, fails safe
  content/                country, cards, cards2, followups, alerts, endings
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

# CLAUDE.md — read this first

You are picking up **Dictator Sandbox**, a browser-based, card-driven political
leadership simulation set in the fictional Republic of Velmorra. This file is
the handover. Read it, then `PROJECT_STATUS.md`, then `docs/DESIGN_V2.md`.

## Where the project actually is

**V1 (the original dark-dossier UI) is done and was superseded, not lost.**
After two playtests the owner asked for a visual overhaul and a simpler
information model. That is now built: the game runs in a light **Poster**
skin (cream newsprint, condensed black headlines, one red) in a **Broadsheet**
layout (masthead + front-page briefing + card-as-lead-story + a right rail of
Files/Threats/Diary), showing **3 resources and 5 factions** instead of the
old 10 stats and 7 faction-bars-of-three. All 13 vitest tests pass (11
original + 2 for the new glossary system) and this was verified end to end in
a real browser at 1366×700, the viewport that caught the original scroll bug.

**The underlying simulation did not change.** The 3-resource/5-faction cut is
a *display layer* (`src/game/display.ts`) over the full, untouched 10-stat/
7-faction engine — every card effect, every test, and the balance probe are
identical to before this pass. This was a deliberate engineering choice, not
something the owner explicitly signed off on as the specific approach — see
`docs/DESIGN_V2.md` section 3 for the reasoning and the escape hatch if it
turns out not to be enough.

**Still open / not built:** the roguelike layer (acts, a between-act shop,
run-start mandates, a run deck, meta-progression) from `docs/DESIGN_V2.md`
section 4. Nothing there has been started. Do not start it without asking —
it is a genuinely large addition and the owner has not greenlit it yet.

**Read `docs/DESIGN_V2.md` in full before touching UI or the display layer.**
It has the measured evidence, what was proposed vs. what actually shipped
(they differ in some specifics — the doc says where), and the open questions
for whoever picks this up next.

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

Mini-games, live faction demands as a formal mechanic, character-initiated
betrayals, crisis chains, the roguelike layer (acts/shop/mandates/run deck/
meta-progression), sound. Listed in `PROJECT_STATUS.md`. Do not start any of
these without asking first — the project is between two large, owner-directed
phases (the Poster/Broadsheet rebuild just finished; the roguelike layer has
not been greenlit).

## Git

Work on `claude/confident-meitner-lc0bgc` (this is the repo's default branch).
Commit with clear messages. Do not open a pull request unless asked.

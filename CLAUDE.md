# CLAUDE.md — read this first

You are picking up **Dictator Sandbox**, a browser-based, card-driven political
leadership simulation set in the fictional Republic of Velmorra. This file is
the handover. Read it, then `PROJECT_STATUS.md`, then `docs/DESIGN_V2.md`.

## Where the project actually is

**The V1 vertical slice is complete, playable, tested, and the owner has
playtested it twice.** It works. Do not rebuild it.

**It is also paused, pending a design decision.** After playtest 2 the owner
said the design has "too many things to keep track of", wants something more
simplistic with a more creative and fitting visual direction, and wants to
evolve toward roguelike elements (unique runs, shops, meta-progression).

**`docs/DESIGN_V2.md` contains the diagnosis, the measured evidence, and a
concrete proposal. If the owner has approved a direction it will say so at the
top. If it does not say so, the direction is still open — ask before building
V2, and do not start a large refactor on a guess.**

## The one-paragraph state of the code

React 18 + TypeScript + Vite, no backend, hand-written CSS. `src/game/` is
pure logic with no React in it and is fully testable. `GameState` is plain
serialisable JSON; all content is code keyed by string id, so save/load is
`JSON.stringify` and new content needs no engine changes. 11 vitest tests
pass, including 200 full simulated runs. Verified end to end in a real browser.

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
6. **Hidden variables are never shown as numbers** — only as briefing warnings
   written in plain language, alert likelihood, and endings.
7. **The regime is named at the end, never chosen.** There are no selectable
   government types anywhere.

## Writing rules

The first draft was rewritten because it read as ornate and hard to parse.
The owner's exact feedback was "word salad" and "almost medieval".

1. Short sentences. If a sentence needs a second read, rewrite it.
2. Plain modern words. No "which is to say", no inverted clauses.
3. Concrete nouns and real numbers. "The army wants $9 billion for
   helicopters", not "the Staff would like a number".
4. Humour comes from the situation, never from vocabulary.
5. State the price in the option hint, money first: `'Cost: $9.0B. …'`.
6. Card titles say what the card is about: "Buying the Evening News", not
   "The Product".
7. Use the `{sir}` token when a character addresses the player.

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
npm test           # 11 tests: integrity, 200 full runs, determinism, variety
```

Browser verification (needs `npm run dev` running). **Test at 1366×700** —
the one serious layout bug so far only appeared on short viewports:

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
  briefing.ts             hidden state → plain-language warnings
  economy.ts              national accounts, budget lines, $ formatting
  stats.ts                stat metadata, bands, tooltips
  text.ts                 {sir}/{leader} token replacement
  save.ts                 localStorage, version-guarded, fails safe
  content/                country, cards, cards2, followups, alerts, endings
src/ui/                   components/ and screens/
src/styles/index.css      the whole design system
tools/                    Playwright scripts for real-browser testing
```

## What is deliberately NOT built

Mini-games, live faction demands, character-initiated betrayals, crisis chains,
cross-run meta-progression, sound. These are Milestones 3–7 and are listed in
`PROJECT_STATUS.md`. Do not start them while the V2 design question is open.

## Git

Work on `claude/confident-meitner-lc0bgc` (this is the repo's default branch).
Commit with clear messages. Do not open a pull request unless asked.

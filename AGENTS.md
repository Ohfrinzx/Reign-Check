# AGENTS.md — start here (every agent, every tool)

**This is the canonical guide for anyone working on this repository** —
Claude Code, a ChatGPT-based agent, or a person. The owner runs more than
one agent tool on this project and wants them all working from the same
facts and rules. `CLAUDE.md` only points here; **this file is the single
source for the rules and workflow.** If you change a rule, the workflow or
the code map, change it here.

**Read in this order before touching code:**
1. This file, in full.
2. `PROJECT_STATUS.md` — where things stand today and what is next (short).
3. `docs/SYSTEMS.md` — how every game system works now, with the numbers.
4. For the phone layout and GitHub Pages hosting: `docs/MOBILE_AND_HOSTING.md`
   (§0 is what was built).
5. `docs/DESIGN_V2.md` before UI or design work — the design record.

`docs/archive/` holds old handovers and slice notes. It is history, not
instructions; parts of it are out of date.

---

## 1. What this project is

**Reign Check** (development codename: Dictator Sandbox) is a browser-based,
card-driven political leadership simulation set in the fictional Republic
of Velmorra. You are the new Executive Chair and must survive 3 acts of 6
days, each ending in a confidence vote. React 18 + TypeScript + Vite, no
backend, hand-written CSS, self-hosted fonts (`public/fonts/`).

The game runs in a light **Poster** skin (cream newsprint, condensed black
headlines, one red) in a **Broadsheet** layout (masthead + front page +
card-as-lead-story + a right rail). A **display layer** (`src/game/
display.ts`) shows 3 resources and 5 factions over a fuller 10-stat,
7-faction engine. Two screens are deliberately dark, both at the owner's
request: the Back Room shop and the crisis situation room. **Do not darken
anything else without asking.**

## 2. Where the project stands (2026-09-23)

- **Phases 1, 2 and 3 are complete and owner-approved**: the playable core
  and Poster/Broadsheet look; the roguelike layer (acts, confidence vote,
  Back Room shop, mandates, run deck, meta-progression); faction demands,
  character events, crisis chains; and the balance phase (slices A–C).
- **Balance slice D — factions remember your decisions — is built, merged
  and awaiting the owner's playtest.** Factions show what they remember,
  make demands because of your decisions, and handle demands differently
  (cheaper, dearer, no bribes); more blocked options on cards. Details in
  `docs/SYSTEMS.md` §5 and §8.
- **Mobile web version + free GitHub Pages hosting — built, verified,
  awaiting the owner's playtest on a real phone.** Every merge into the
  default branch now tests, builds and publishes the game to
  https://ohfrinzx.github.io/Reign-Check/ (`.github/workflows/deploy.yml`).
  At 1080px and narrower the game uses a phone layout (☰ menu, faction
  strip + Files drawer, bottom action bar); desktop is pixel-identical to
  before. Details: `docs/MOBILE_AND_HOSTING.md` §0.
- **Later, with the owner's go-ahead:** mini-games (build them mobile-first,
  each with its own look), sound, a coup crisis chain.
- `SAVE_VERSION` is **14**. Tests: **165**, all passing.

## 3. How work is done here

**Build the smallest testable slice, verify it for real, report, and wait
for the owner's playtest before the next slice.** Don't chain roadmap items
together because the previous one was approved; each slice gets its own
go-ahead. Content (cards, items, lines) is written as part of the slice it
belongs to, not as a separate pass.

**The owner's preferences:** concise answers without filler; ask
clarifying questions when a request is unclear or leaves something out;
when using material from the web, always list the source so it can be
checked.

## 3a. Required hand-off report — every agent, every time

**Owner request: every agent must end its output, whenever it has changed
anything, with a plain report the owner can act on without reading the
diff.** Two parts:

1. **What changed** — in plain words, grouped by what the player will
   notice (new screens, rules, content, changed numbers) before
   internal/tooling changes. Include anything that resets the owner's
   in-progress run (`SAVE_VERSION` bumps), balance numbers that moved, and
   anything you found but did not fix.
2. **What to look for in playtesting** — a short, concrete checklist: where
   to go, what should happen, what would count as a bug or a balance
   problem. Name the exact buttons and screens; say how to reach anything
   hard to reach.

Also say what you verified (tests, build, browser checks), whether you
merged into the default branch (§10), and what is next. Documentation-only
turns still need part 1; part 2 can say "nothing to playtest".

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
10. **Bump `SAVE_VERSION` in `src/game/state.ts` (currently `14`) whenever
    `GameState`'s shape changes** — adding fields for mandates, the run deck, or
    meta-progression all count. `save.ts` already discards saves with a
    mismatched version rather than crashing, so this is safe by construction
    as long as the bump actually happens. Check `state.ts` for the current
    value and the change history in its comment. **A bump discards the
    owner's in-progress run — say so when you report.** A purely derived
    read with no new field (like `dayInAct()`) does not need a bump.
11. **Keep all game logic in `src/game/` with zero React or DOM
    dependency.** This is the whole
    reason a future mobile/iOS port stays possible without a rewrite (see
    `docs/DESIGN_V2.md` §10). Don't add a second hover-only mechanism for
    anything gameplay-critical (a price, a trade-off, a required condition)
    — the glossary already uses plain-text Terms footnotes. Nothing new
    should depend on hover alone to convey required information.
12. **Options are always read through `engine.ts orderedOptions(s, card)`**
    — never `card.options`. It shuffles the order per run and applies the
    consequence rules (new, changed and locked options). The UI, the number
    keys, the tests, the balance probe and the browser tools all use it; a
    tool that needs a particular choice finds it by its text and presses
    its shown number.

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
npm run build      # typecheck + production build (to dist/)
npm test           # vitest, 165 tests: content integrity, 200 full
                   #   simulated runs, determinism, every system, and the
                   #   balance probe (prints survival per play style)
```

Browser checks (Playwright). **Desktop is tested at 1366×700** — the
viewport that has caught every real layout bug so far.

```bash
npm run test:browser         # starts Vite, runs the default list below
node tools/run-browser.mjs X # just check X (e.g. consequences)
```

| Check (`tools/`) | What it covers |
|---|---|
| `mandates.mjs` | title screen, mandates, unlock gating, save/reload, keyboard, shop, act change |
| `vote.mjs` | confidence vote reveal, bloc count, reload, narrow fit, reduced motion |
| `demands.mjs` | demand pop-up, rail panel, meet, bribe, lapse, narrow pop-up |
| `characters.mjs` | private files: warning, betrayal, offer, keyboard |
| `crises.mjs` | front page, dark situation room, stages, hot version |
| `favours.mjs` | aimed favours, disabled-with-reason, receipt |
| `hostile.mjs` | hostile faction pop-up, daily action, desk danger |
| `consequences.mjs` | on-the-record, new/locked/changed options, faction memory, faction-triggered demand, no-bribe |
| `verify.mjs`, `to-ending.mjs`, `playthrough.mjs` | full days, an ending and restart, save/reload |
| `phone.mjs` | the phone layout: 20 screens × 4 sizes (390×844, 360×800, 768×1024, 844×390) with touch — no sideways overflow, primary action on screen and uncovered; ☰ menu, ledger, faction strip, Files drawer; two days by tapping |
| `legacy.mjs` (not in the default list) | cross-run record on the title screen |
| `desktop-snap.mjs` (not in the default list) | desktop before/after, pixel by pixel, 20 screens at 1366×700 and 1100×700. `SNAP_MODE=save node tools/run-browser.mjs desktop-snap` BEFORE a UI change, then `node tools/run-browser.mjs desktop-snap` after |
| `pages-preview.mjs` (no dev server; run after `npm run build`) | serves `dist/` from `/Reign-Check/` like GitHub Pages: no failed requests, all fonts load, manifest + icons, game starts |
| `phone-audit.mjs` | the original measuring tool (screenshots + numbers), superseded by `phone.mjs` |

`tools/scenes.mjs` reaches each of those 20 screens from a fixed seed; both
`phone.mjs` and `desktop-snap.mjs` use it. `tools/make-icons.mjs` redraws
the Home Screen icons in `public/icons/`.

**Cloud sessions (Claude Code on the web):** run `npm install` first. The
pre-installed Chromium does not match the Playwright version, so use
`PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:browser`.
The sandbox cannot reach `*.github.io`, so it cannot open the live site.
Screenshots go to `<OS temp>/reign-check-shots/` (`REIGN_SHOTS` overrides).

**Tooling gotchas that have bitten agents before:**
- Close demand pop-ups (`.demand-pop .dm-foot .btn`) before driving a day;
  keyboard shortcuts are disabled while one is open.
- The Back Room has no `.strap-action`; leave with `.shop-foot .btn-primary`.
- Cards are under `:is(.stage-col, .sr-stage)` (the situation room is
  separate).
- Measure layout only after the card's ~0.42s rise-in (`waitForTimeout(500)`).
- Favours open `FavourDialog` (pick a target, then a receipt).
- Choose options by their text (see ground rule 12), never by position.
- **At 1080px and narrower** the masthead buttons are in the ☰ menu
  (`.m-menu-btn`), the rail is a drawer opened by the faction strip
  (`.m-files-btn` → `.rail.open`), and `.strap-action` is a bar fixed to
  the bottom. `tools/scenes.mjs` has `openMenuItem()` / `openFiles()` that
  work on both layouts.

## 8. Map of the code

```
src/game/            pure logic, no React/DOM, fully testable
  types.ts           the whole vocabulary — start here
  state.ts           createGame(), SAVE_VERSION, acts (dayInAct/isActEndDay)
  engine.ts          day loop, upkeep order, deck draw, alerts, endings,
                     orderedOptions() (shuffle + consequences)
  effects.ts         applyEffects(): the single mutation entry point
  display.ts         what the player sees: 3 resources, 5 factions, moods
  briefing.ts        hidden state → plain-language front page and desk cards
  economy.ts         the daily budget
  demands.ts         faction demands, hostility, faction moves
  consequences.ts    marks, card reactions, faction memory, demand reactions
  characterEvents.ts private files (betrayal / offer / request)
  crises.ts          crisis chains
  favours.ts         aimed favours and their receipts
  shop.ts            the Back Room: stock, prices, caps, timed deals
  meta.ts            cross-run record and unlocks (own save key/version)
  save.ts            this run's save (version-guarded)
  rng.ts, text.ts, stats.ts, glossary.ts   helpers
  content/           ALL words and numbers of content, keyed by string id:
                     cards, cards2, cards3, followups, alerts, endings (incl.
                     the confidence vote), mandates, country (cast, factions),
                     demands (+ hostile actions, triggered demands),
                     consequences (marks, reactions), characterEvents,
                     characterRequests, crises, shop
src/ui/
  components/        CardView (3 card layouts + OptionText), Rail (also the
                     phone Files drawer), Ledger, Demands (pop-up + panel),
                     FavourDialog, Prose, FactionStrip (phone only)
  useMedia.ts        media-query hook for the few words that differ on a phone
  screens/           Screens (title, front page, night, ending), Vote, Shop,
                     Manage (Advisors & Deals), Progress (Unlocks), Intro
                     (Brief me)
src/App.tsx          phases → screens; keyboard; the early returns for the
                     Back Room and the situation room
src/styles/index.css the whole design system; PHONE LAYOUT block at the end
public/              fonts/ (relative URLs — required under /Reign-Check/),
                     icons/ + manifest.webmanifest (Home Screen)
.github/workflows/   deploy.yml — test, build, publish to GitHub Pages
tools/               Playwright browser checks (§7)
docs/                SYSTEMS.md, MOBILE_AND_HOSTING.md, DESIGN_V2.md,
                     mockups/ (design exploration), archive/ (history)
```

## 9. UI notes worth knowing

- **Three card layouts, kept visually distinct** (the owner wants variety,
  and future mini-games should get their own look too): the lead story
  (`CardView`), the private file (`CharacterCardView`), the situation room
  (`CrisisCardView`). All keep the `.doc`, `h1` and `.opt` hooks.
- **Options can carry a "Because you…" note** (`OptionText`): teal edge =
  new option, mustard = changed, a locked one is disabled and shows its
  reason. Results show `.outcome-because` and `.outcome-marked`.
- **The rail** (Files with faction memories, Demands, On your desk, the
  Back Room favours, Diary, On the record, Standing costs) sits on the
  right on desktop; **at 1080px and narrower it is the Files drawer**,
  opened from the faction strip.
- **The "Money" faction is labelled "Elites"** ("the Elites" in sentences);
  "Money" on the masthead is the treasury.
- **There is no masthead Demands button** (the owner removed it).
- **The Back Room and the situation room are fullscreen early returns in
  `App.tsx`**, with their own dark tokens re-declared on `.app` (never on
  `body`).
- **Advisors and deals are capped at 3 each**; freeing a slot means firing
  or cutting one.
- **Phone layout (1080px and narrower, tablets included).** All of it is in
  the PHONE LAYOUT block at the end of `index.css` plus a few small
  components (`FactionStrip`, the ☰ menu in `App.tsx`, `Rail`'s drawer
  mode). **Desktop must not change:** run `desktop-snap.mjs` before and
  after any UI work. Don't wrap existing desktop text in new spans (it
  shifts glyphs); build phone-only wording as one string with `useMedia`.
  Anything new that is gameplay-critical must be reachable on a phone too
  (in the drawer, the menu, or on the page).

## 10. Git and verification workflow

`claude/confident-meitner-lc0bgc` is the default branch — the one the owner
looks at, and **the one GitHub Pages publishes from: every push to it goes
live** at https://ohfrinzx.github.io/Reign-Check/ within a few minutes (if
`npm test` passes in the workflow). A `SAVE_VERSION` bump therefore resets
in-progress runs on every family member's device — say so before merging. **Every agent session works on its own branch.** Commit
with clear messages. Do not open a pull request unless asked — merge
directly.

**Every time:**

1. Do the work, committing on your own branch.
2. Verify for real: `npm test` (all pass), `npm run build` (clean), and the
   browser checks for anything UI-facing — including `phone.mjs`, and
   `desktop-snap.mjs` before/after for layout work.
3. **Only if all of that passes**, merge your branch into
   `claude/confident-meitner-lc0bgc` and push. If anything fails, fix it
   and re-verify; never merge broken or unverified work.
4. **Announce the merge before and after** — say you are about to merge,
   then confirm it with the resulting commit.
5. Only then tell the owner it is ready to playtest.

The owner wants unused branches cleaned up. Once a branch is fully merged
it can go, but **cloud sessions are not allowed to delete remote branches**
(git returns 403). List the merged ones for the owner instead; they delete
them at https://github.com/Ohfrinzx/Reign-Check/branches. Never delete
the default branch or the current session's branch.

## 11. Keeping the docs current

Update in the same session, not "later":

- **`PROJECT_STATUS.md`** — replace its "Now" section when status changes
  (built → playtested → approved) and add a dated line to its log. Keep it
  short; move anything long into `docs/archive/`.
- **`AGENTS.md` (this file)** — rules, workflow, commands, code map, §2's
  status summary.
- **`docs/SYSTEMS.md`** — whenever a system's behaviour or numbers change.
  Describe how it works now, not the history.
- **`docs/DESIGN_V2.md`** — design decisions and the roadmap.
- **`CLAUDE.md`** — only if the reading order changes; it just points here.

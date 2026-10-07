# CLAUDE.md — Reign Check

**Read `AGENTS.md` first, in full. It is the single source for the ground
rules, writing rules, content format, commands, code map and git workflow.**
This file deliberately repeats none of it, so the two can never disagree.
Other agent tools on this project (ChatGPT-based ones too) read the same
`AGENTS.md`.

Then read, in order:
1. `PROJECT_STATUS.md` — where things stand today and what is next.
2. `docs/SYSTEMS.md` — how every game system works now, with the numbers.
3. `docs/MOBILE_AND_HOSTING.md` — the phone layout and GitHub Pages
   hosting (§0 is what was built).
4. `docs/BALANCE.md` — **the brief for the next job (a balancing pass on
   the core systems)**: every tuning number and where it lives, how to
   measure, and the balance change log every balance change must add to.
5. `docs/MINIGAMES.md` — the mini-games record and how to add one.
6. `docs/DESIGN_V2.md` — before any UI or design work.

`docs/archive/` is history, not instructions.

## The few things Claude Code sessions must not miss

- **Status (2026-10-07):** **next job: a balancing pass on the core
  gameplay systems** (`docs/BALANCE.md`). Ask the owner what they want
  first; work in playtested slices; **every balance change adds a row to
  the change log in `docs/BALANCE.md` §5, in the same commit.** No new
  mini-games or features until the owner says so. Everything built is
  approved except **mini-games slice 3 part B** (Who Was in the
  Stairwell?, The Ambassador's Table): built, live, waiting for the
  owner's playtest. **Every merge into the default branch publishes the
  live site.**
- **Work on your session branch; merge into `claude/confident-meitner-lc0bgc`
  only after `npm test`, `npm run build` and the browser checks pass.
  Announce the merge before and after** (`AGENTS.md` §10). No pull request
  unless asked.
- **End every output that changed anything with the hand-off report**
  (`AGENTS.md` §3a): what changed, what to look for in playtesting, what you
  verified, whether you merged, what is next.
- **Cloud sessions:** `npm install`, then
  `PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:browser`.
  The sandbox cannot open `*.github.io`, so the owner checks the live site.
- **Bump `SAVE_VERSION` (now 14) on any `GameState` shape change, and say
  it resets the owner's run.** Read options through `orderedOptions()`,
  never `card.options`. Game logic stays in `src/game/` with no React/DOM.
- **The owner wants** concise answers, clarifying questions when a request
  is unclear, and sources listed for anything taken from the web.

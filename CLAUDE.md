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
4. `docs/MINIGAMES.md` — the brief for the next job (mini-games). The
   owner will describe their ideas; ask them first.
5. `docs/DESIGN_V2.md` — before any UI or design work.

`docs/archive/` is history, not instructions.

## The few things Claude Code sessions must not miss

- **Status (2026-10-06):** Phases 1–3, balance slice D (factions remember
  your decisions) and the mobile web version + GitHub Pages deploy are all
  approved. **Mini-games slices 1 and 2** are approved, as are the number
  explanations, the slower Bulletin and Shred's laptop keys.
  **Mini-games slice 3 part A** (Find the Mole, Budget Night, The Pigeon
  Run) is approved; **part B** (Who Was in the Stairwell?, The
  Ambassador's Table) is built and waiting for the owner's playtest
  (`docs/MINIGAMES.md`). Ask before
  designing the next games. **Every
  merge into the default branch now publishes the live site.**
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

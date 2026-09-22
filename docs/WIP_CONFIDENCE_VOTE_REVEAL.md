# Work in progress — confidence-vote reveal

**Branch:** `codex/confidence-vote-reveal`
**Base:** `20d0da908f8fd2c36ff033269cce256740bcebb1`
**Started:** 2026-09-22
**Status:** implementation in progress; do not treat this branch as merged or playtest-ready.

## Authorized scope

Implement the previously documented confidence-vote reveal. No unrelated content additions.
The selected direction is the recommended **division board + clerk's tally** treatment.

## Decisions applied

- Reveal happens **before the Back Room**. The vote is calculated from the same end-of-day state as the existing mechanic; purchases cannot retroactively affect it.
- The animation presents the deterministic Grip/Legitimacy score. It does not add MP, seat, bloc, or ballot simulation.
- The engine freezes one serialisable result snapshot. React animates that snapshot and never decides the outcome.
- The screen uses the light Poster/Broadsheet visual language. The Back Room remains the only dark screen.
- Players can reveal immediately; reduced-motion users get the completed result without staged motion.

## Planned integration

1. Add a serialisable confidence-vote result and vote phase.
2. Expose one pure vote calculation used by both ending logic and the reveal.
3. Route act-boundary days through the reveal, then apply the existing fail/pass/final-survival transitions exactly once.
4. Add the division-board/clerk-tally screen and responsive styles.
5. Update phase-driving tests and browser tools.
6. Add focused tests for thresholds, act transitions, save-safe frozen results, and determinism.
7. Run all tests, production build, and browser verification at 1366×700.
8. Update this file and project handoff docs with final state before merge.

## Resume notes

Start by reading `AGENTS.md`, then `docs/DESIGN_V2.md` §4.1/§4.1a.
Primary files: `src/game/types.ts`, `src/game/content/endings.ts`,
`src/game/engine.ts`, `src/App.tsx`, `src/ui/screens/Screens.tsx`,
`src/styles/index.css`, tests under `src/game/__tests__`, and phase-driving
scripts under `tools/`.

If this file still says "implementation in progress", inspect the branch diff and continue from the first unchecked step. Do not merge until the full repository gates pass.

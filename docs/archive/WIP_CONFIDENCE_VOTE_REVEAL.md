# Implementation record — confidence-vote reveal

**Branch:** `codex/confidence-vote-reveal`
**Base:** `20d0da908f8fd2c36ff033269cce256740bcebb1`
**Started:** 2026-09-22
**Merged:** `ed3f12b489669e77143483328e467d6c5af38c9d` into `claude/confident-meitner-lc0bgc` on 2026-09-22.
**Status:** built, verified, playtested, and owner-approved. The owner confirmed: *"Play tested and working."*

## Authorized scope

Implement the previously documented confidence-vote reveal. No unrelated content additions.
The selected direction is the recommended **division board + clerk's tally** treatment.

## Decisions applied

- Reveal happens **before the Back Room**. The vote is calculated from the same end-of-day state as the existing mechanic; purchases cannot retroactively affect it.
- The animation presents the deterministic Grip/Legitimacy score. It does not add MP, seat, bloc, or ballot simulation.
- The engine freezes one serialisable result snapshot. React animates that snapshot and never decides the outcome.
- The screen uses the light Poster/Broadsheet visual language. The Back Room remains the only dark screen.
- Players can reveal immediately; reduced-motion users get the completed result without staged motion.

## Completed integration

- [x] Add a serialisable confidence-vote result and vote phase.
- [x] Expose one pure vote calculation used by both ending logic and the reveal.
- [x] Route act-boundary days through the reveal, then apply the existing fail/pass/final-survival transitions exactly once.
- [x] Add the division-board/clerk-tally screen and responsive styles.
- [x] Update phase-driving tests and browser tools.
- [x] Add focused tests for thresholds, act transitions, save-safe frozen results, and determinism.
- [x] Run all tests, production build, and the full browser verification suite at 1366×700.
- [x] Update this file and project handoff docs with final state before merge.

## Checkpoint verification

- Focused confidence-vote suite: **6 passed**.
- Production build: **passed** (existing bundle-size advisory remains).
- Dedicated `tools/vote.mjs` browser test: **passed** at 1366×700, including partial reveal, exact save/reload result, completed tally, viewport fit, and Act 2 continuation.
- Visual check: `/tmp/reign-check-shots/V-confidence-result.png` in the implementation workspace.
- Full Vitest suite: **113 passed**.
- Default browser suite: **passed** with zero page errors; general phase drivers traverse vote screens without stalling.

## Future maintenance notes

Start by reading `AGENTS.md`, then `docs/DESIGN_V2.md` §4.1/§4.1a.
Primary files: `src/game/types.ts`, `src/game/content/endings.ts`,
`src/game/engine.ts`, `src/App.tsx`, `src/ui/screens/Screens.tsx`,
`src/styles/index.css`, tests under `src/game/__tests__`, and phase-driving
scripts under `tools/`.

The implementation checklist is complete. Future vote-rule changes should
update the pure result calculation and verify the revealed margins, save
behavior, and act transitions. Phase 3 balance work is a separate slice.

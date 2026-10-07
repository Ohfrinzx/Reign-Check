# Strategy balance — working handoff

## Authorization and target (2026-10-07)
Owner requests start-specific winning/losing strategies, meaningful purchases and decisions, and nearly always winning with strong choices **and good mini-game play**. Random choice spam must remain weak. This supersedes historical 50–60% careful-play targets.

Work branch: `codex/strategy-balance`, from live default `claude/confident-meitner-lc0bgc`. **Do not merge or push the live default. Owner must playtest this branch first. No PR requested.**

## Findings so far
- Six implemented mandates (four base, two unlocks), not five. Include all six.
- Legacy 68% probe mixes randomly rolled mandates, deliberately randomizes 25% of decisions, wins 70% of mini-games, never buys or handles demands. It also looks ahead at actual seeded outcomes. Not a mastery metric.
- Read AGENTS, PROJECT_STATUS, SYSTEMS, BALANCE and shop/mandate/probe implementation.

## Work in progress
- Lead: complete audit, choose systemic adjustments based on measured failures, integrate and verify, write docs/STRATEGIES.md.
- `audit` agent: read-only independent systemic review.
- `measurement` agent: own worktree, new strategy measurement files only; baseline across all mandates, skill and random controls.
- Dependencies installing. No gameplay changes yet.

## Remaining gates
Baseline before tuning; meaningful engine regression tests; all tests/build; affected browser checks; updated SYSTEMS/BALANCE/PROJECT_STATUS/AGENTS; committed and pushed feature branch only; exact local playtest commands and brief strategy report to owner.

## Baseline checkpoint
Legacy careful, 400 runs: 274/400 wins (68.5%); elite 25, noConfidence 82, sable-removal 14, collapse 2, coup 3. Output `/tmp/reign-baseline.log`. New strategy harness still running in agent worktree.

## Implementation checkpoint
- Integrated shop fixes and expected-outcome measurement harness.
- Added distinct bloc preferences, continuous debt penalty, opening-night mandate toolkits.
- Found/reproduced/fixed additive mini-game result corruption (95+70 became165; old Budget walk-outs survived new zero flags). Regression tests pass.
- All initial314 tests passed; final rerun needed after result fix and stress harness. Build passed. Browser vote/mandates/favours passed; phone/desktop ongoing.
- Baseline mastery400/start complete: 98/96.8/99.8/99.3/99.8/99.8%. This was already near-reliable; avoid claiming blanket difficulty fix from old69%.
- After400/start still running, outputs scratch strategy-after-*.json; standard simulations bypass finishMinigame so result bug does not change those macro comparisons. Optional stress harness pending agent.

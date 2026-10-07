# Strategy balance — working handoff

## Authorization and target (2026-10-07)
Owner requests start-specific winning/losing strategies, meaningful purchases and decisions, and nearly always winning with strong choices **and good mini-game play**. Random choice spam must remain weak. This supersedes historical 50–60% careful-play targets.

Work branch: `codex/strategy-balance`, from live default `claude/confident-meitner-lc0bgc`. **Do not merge or push the live default. Owner must playtest this branch first. No PR requested.**

## Findings so far
- Six implemented mandates (four base, two unlocks), not five. Include all six.
- Legacy 68% probe only uses default Accident, deliberately randomizes 25% of decisions, wins 70% of mini-games, never buys or handles demands. It also looks ahead at actual seeded outcomes. Not a mastery metric.
- Read AGENTS, PROJECT_STATUS, SYSTEMS, BALANCE and shop/mandate/probe implementation.

## Work in progress
- Lead: complete audit, choose systemic adjustments based on measured failures, integrate and verify, write docs/STRATEGIES.md.
- `audit` agent: read-only independent systemic review.
- `measurement` agent: own worktree, new strategy measurement files only; baseline across all mandates, skill and random controls.
- Dependencies installing. No gameplay changes yet.

## Remaining gates
Baseline before tuning; meaningful engine regression tests; all tests/build; affected browser checks; updated SYSTEMS/BALANCE/PROJECT_STATUS/AGENTS; committed and pushed feature branch only; exact local playtest commands and brief strategy report to owner.

# Strategy balance — resumable handoff

## Owner authorization
2026-10-07: distinct winning/losing routes by start, meaningful choices and purchases,
near-reliable survival with learned decisions **and good mini-games**. This supersedes
historical 50–60% careful-play targets. Owner permits non-Astra delegation; two
GPT-6.1 Sol agents assisted with audit and measurements.

**Branch: `codex/strategy-balance`. Do not merge until the owner playtests and approves.**
Live default is `claude/confident-meitner-lc0bgc`, not `main`. No PR was requested.
Every push to the live default deploys to family devices; never use it for this playtest.

## Completed
- Carefully read AGENTS, status, systems, balance, design, mobile and mini-game docs.
- Six mandates confirmed (four standard + two unlocks), not five.
- Found old 68% probe is a weaker policy, not mastery: 25% random choices,
  70% games, no purchases/favours/demand handling, actual-outcome peeking.
- Added expected-outcome per-start harness, management controls, independent
  seed offsets, optional explicit Budget/Ambassador stress aftermath.
- Distinct bloc priorities (Grip weights .8/.8/.5/.3/.2), same loyalty weight,
  seats and thresholds; continuous debt penalty .75 per $B capped25.
- One eligible mandate toolkit offer within the existing three nightly slots
  on days1/7/13, with normal unlock/purchase/recency filters and fallback.
- Clerk goodwill, Pigeon recurring support and double Ilvet levy income fixed;
  later ordinary levy works after a deal is cut.
- Critical real-play bug reproduced and fixed: finishMinigame now replaces
  score/jar/mole facts via deltas, rather than adding old snapshots. Old Budget
  walk-outs no longer create new penalties after clean games; score95 then70
  is now70, not165. Historical memories and legitimate debts remain.
- No save shape change; SAVE_VERSION14 remains. Start fresh for balance testing.
- Developer strategy guide: `docs/STRATEGIES.md`; exact summary evidence in
  `docs/balance-results/`. Core docs updated with explicit no-merge override.

## Measured evidence
400 runs/start, adaptive experienced policy, 90% simulated games:
before98/96.8/99.8/99.3/99.8/99.8%; branch99.5/99.3/99.8/99.8/100/100%.
Order: Stairwell/Landslide/Handover/Accident/CleanHands/PayDeal.
Baseline was already near-reliable; do not claim 69% human wins became100%.
Independent stress120/start offset10000:100/96.7/100/100/99.2/100%.
Legacy random weak-games control remains6/120=5%; strategy guide includes
random-card/strong-games and rational-management controls honestly.
These are content-aware heuristics, not human forecasts or exhaustive solutions.
Standard macro simulations omit Budget jar aftermath and Ambassador tiers;
stress explicitly exercises them. See guide for remaining information advantages.

## Verification
- Resumed session: all319 tests pass, production build passes (existing large
  bundle advisory only), GitHub Pages path preview passes.
- Browser vote/mandates/favours passed again on resume; five affected screens
  across all five phone sizes and touch interactions pass with Chromium141 headless.
- Full initial phone run blocked by Chromium131 lacking safe-area CDP support.
  Regular newer Chrome then hit environment socket restrictions; the standard
  newer headless shell launches successfully. No game/tool permissions bypass.
- Desktop before snapshots were taken but transient files were lost at resume;
  affected-screen desktop fit checks replace any claim of a completed pixel diff.
- Desktop: five affected screens at 1366×700 and 1100×700 passed overflow
  checks; shop/vote/result controls reachable. Existing desktop Brief me
  scroll-to-close limitation remains and is documented in the strategy guide.

## Handoff status and next steps
Implementation, measurements, verification and documentation are complete.
`codex/strategy-balance` is published on GitHub and remains unmerged.
Remote verification confirmed the live default is unchanged at
`abe32e8b93ac70c87875feb3e4194f7ce12904ff`.

All source commits were uploaded through the connected GitHub app with identical
source trees. See `docs/balance-results/PROVENANCE.md` for local-to-GitHub commit
IDs; evidence retains its original local IDs. The local checkout tracks the
published feature branch and the original history remains on the local-only
`codex/strategy-balance-local-evidence` branch.

Next: owner playtests using `docs/STRATEGIES.md` and reports start, choices,
purchases, mini-game results, vote margin and ending. Do not merge or deploy
until the owner approves. Inspect current branch and remote refs on resume.

# Winning and losing strategies — developer playtest guide

Status: strategy-balance branch under verification, **not merged**. Numbers below will be filled from the final measured matrix. Target agreed 2026-10-07: near-reliable survival with strong decisions **and good mini-games**, while random decision spam remains weak. Six mandates exist: four base starts and two unlocks. "Let fate decide" is not another mandate.

## What a winning strategy means

A route is a set of priorities, not an option-number script. Options shuffle, cards react to earlier decisions, and purchases have catches. The same choice can be right early and wrong just before a vote. All routes need enough parliamentary allies, a funded budget, and an answer to hostile factions. Army plus Security alone hold only 25 of 100 seats: military backing cannot substitute for a governing coalition.

The old 68% headline is not a mastery win rate. Its bot picks randomly one quarter of the time, models 70% mini-game success, mixes mandates, never buys anything or handles demands, and evaluates actual seeded outcomes before choosing. It is retained only as a historical comparison.

## What changed in this branch

- Different parliamentary blocs now value different governing strengths. Loyalty
  remains 60% of their lean; the remaining 40% is Army/Security 80% Grip,
  Elites 50% Grip, Workers 30% Grip and Street 20% Grip, with the rest Legitimacy.
  Seats remain 15/10/20/25/30 and thresholds 45/58/68. You still need a coalition.
- Debt's vote penalty starts smoothly at zero: 0.75 lean per $1B, capped at 25.
  Previously even a $0.1B deficit could remove about 20 seats in one step.
- Each act's opening-night shop (days 1/7/13) draws one eligible offer from
  the start's four-item toolkit, within its normal three slots. Choices,
  costs, unlocks and catches remain. Toolkit lists are in `content/mandates.ts`.
- Clerk goodwill and the Pigeon endorsement's recurring Support now work;
  the Ilvet levy pays its promised $0.30B once, and cutting it stops that
  deal's income. A later ordinary levy can start income again.
- **Mini-game result accumulation fixed:** the latest score and jar facts
  replace the previous game. Previously an old Budget walk-out could be
  charged again despite a later clean budget; a prior score could inflate
  the Ambassador's current reward. Existing memories and legitimate old
  debts are not erased. No save-version reset is required.

## Routes by start

| Start | Winning priorities | Useful purchases to consider | Losing habits |
|---|---|---|---|
| The Stairwell | Use Army backing as breathing room to rebuild public legitimacy. Preserve institutional control, recruit Workers or Street and keep Security from becoming hostile. Plan for Sarran's day-4 recording. | A Fixer on Retainer / The Salt Communion's Man protect legitimacy; a public favour can bridge a vote; a Clerk builds coalition goodwill. Tern's Liaison reduces coups but angers Security, so it is conditional. | Treating Army loyalty as enough votes; repressing the already-cold public at every opportunity; releasing the tape while Security is near revolt without a repair plan; spending the recording money without choosing a no-cash response. |
| The Landslide | Turn public goodwill into a durable coalition. Protect legitimacy against its daily erosion, fund promises selectively, and preserve a cash reserve. | The Salt Communion's Man or Fixer softens losses; Publish the Accounts brings recurring legitimacy with an Elites/scandal cost; save broadcast favours for a weak vote. | Assuming the initial crowd lasts forever; stacking expensive permanent subsidies; buying Grip at the expense of every public ally; buying short-lived help too early. |
| The Handover | Invest the large treasury and discount in lasting help early. Repair the excluded Street before it spirals into hostile daily action. Preserve Workers and Elites as alternative allies. | Bread Subsidy if affordable after recurring bills; a Clerk; targeted public favours; deck policies that remove recurring problems you cannot afford. | Hoarding cash while the Street collapses; buying every discount because it is cheap; making repeated anti-public concessions; draining the reserve before threats arrive. |
| The Accident | Use the extra daily decision to adapt: repair the weakest essential resource, then build a coalition. Use deck policies to make recurring opportunities useful and remove repeated liabilities. | Flexible advisors and favours; standing slots/open lines only when their recurring cards fit the budget and coalition. | Taking an extra decision as permission to gamble; repeatedly farming one stat while another approaches an ending; indiscriminate deck additions. |
| The Clean Hands Promise | Preserve public trust while making audits survivable. Watch Security first, control leaks and scandals, and repair relations before adding more anti-Elite measures. | Night Reader for leaks/scandals; legitimacy protection; targeted scandal or demand favours. Publish the Accounts only if you can afford its additional political cost. | Treating every anti-corruption option as automatically safe; humiliating Security repeatedly; creating scandals faster than you can resolve them; stacking graft perks against the audit pressure. |
| The Pay Deal | Keep the Workers' pact funded; add public or institutional allies without alienating every business faction. Improve revenue, avoid redundant wage promises, and watch the initial Elites/Security weakness. | Revenue help when the faction cost is manageable; a Clerk; cheap targeted favours. Compare a loan's remaining total payments with its immediate payout. | Selling the Gorsk lease blindly against your worker coalition; adding subsidy commitments to an already strained budget; assuming Workers alone can supply 68 votes; ignoring Elites and Security. |

These are viable families to test, not a claim that every named purchase is mandatory or that every combination has been exhaustively solved. Re-route when stock, threats, or previous choices make the original plan unsafe.

## Opening relations include spillover

Starting faction bonuses also affect rivals through the normal relation rules. For example, Stairwell's Army bonus cools the Street, Workers and Security; Pay Deal's Workers bonus cools the Elites and Security; Clean Hands' Security penalty warms the public. Read the actual opening faction bars, not just the headline start description. Initial seeded jitter also matters.

## Mini-games belong to the strategy

- Win the act-opening Walk in the Weather: its legitimacy, support and broad faction effect sets the act's position.
- Budget Night is not just pass/fail. Short jars and walk-outs damage those specific factions, and walk-outs can create future bills or demands. Protect an endangered ally, not only the easiest jar.
- Find the Mole: expose for public trust when Security can absorb the loss; arrest for Security/leak control when the Street can absorb the cost; turn for information/security advantages with a later follow-up; quiet dismissal avoids those larger faction trades.
- The Ambassador: a legal bargain under Brask's limit wins, and a better price earns more. Accepting his first price is not success.
- Hold the Palace can rescue a coup crisis but should not be the whole Army policy. The real strike ends the run if lost.
- Prior decisions already help particular games: the Dovra mark makes the walk more forgiving, and helping the Pigeon Federation can grant an extra feather. Games also leave memories and change later card/demand responses.

## Losing patterns across starts

Random clicks, always picking the same position, spending all cash, ignoring ultimata, and maximizing a single headline number are distinct failure modes. A respectable Grip/Legitimacy display does not protect a depleted Elite stat or erase a live removal demand. Favours must be used before the danger resolves; the act shop happens **after** the vote, so it cannot save a vote already lost.

## Measurement and limits

Final baseline/after tables are added below. Automated strategies are diagnostics, not predictions of a human player's exact win rate. Mini-game skill is an input to the macro simulation; actual timing/puzzle feasibility is tested by each game's existing tests and the owner's playtest. The final evidence must separate strong cards/strong games, strong cards/weak games, and random cards/strong games.

Additional limits: standard macro runs omit Budget Night jar aftermath and
use the Ambassador's default reward tier. The optional stress scenario checks
those consequences explicitly, with assumed outcomes rather than measured
human performance. The evaluator retains some exact faction/character state,
does not suppress mild warnings at low Information, and does not price future
faction memories or unknown follow-up cards/deck draws. Its rational style
variants retain shared safety rules; high win rates across styles do not mean
blindly repeating a political ideology is safe. Purchases help but are not
mandatory keys: the baseline strong bot could often win without management.

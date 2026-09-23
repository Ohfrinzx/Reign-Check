/**
 * SHOP BALANCE PROBE — how the Back Room behaves across many simulated runs.
 *
 * Written because chunk 1's first pricing pass was guessed, and the numbers
 * said it was wrong: an unrestricted buyer bought all 17 items in a single
 * 18-day run (every item at ~1.00 purchases/run), which is the opposite of
 * "each run feels different". That measurement produced the one-buy-a-night
 * rule, the reprice, and the once-per-run rule now in shop.ts.
 *
 * If a future session is asked "the shop feels samey" or "I can never afford
 * anything", RUN THIS FIRST rather than guessing — same discipline that
 * diagnosed the day-1 card repetition (see PROJECT_STATUS.md).
 *
 * Reads: purchases per run, which items get bought and how often, and what
 * the endings distribution does compared with a player who buys nothing.
 */
import { createGame } from '../state';
import { prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert, activeCard, openShop, buyShopItem, useFavour, leaveShop, completeConfidenceVote, orderedOptions } from '../engine';
import { SHOP_MAP } from '../content/shop';
import { shopPrice } from '../shop';
import { makeRng } from '../rng';
import type { GameState } from '../types';

type Buyer = 'none' | 'cheapest' | 'greedy' | 'random';

function run(seed: number, buyer: Buyer, policy: 'random' | 'first') {
  const rng = makeRng(seed + 99);
  let s: GameState = prepareDay(createGame({ seed }));
  let g = 0;
  const bought: string[] = [];
  while (s.phase !== 'ended' && g++ < 3000) {
    if (s.phase === 'briefing') s = beginStages(s);
    else if (s.phase === 'stage' || s.phase === 'alert') {
      const c = activeCard(s)!;
      const usable = orderedOptions(s, c).filter((o) => !o.enabled || o.enabled(s));
      const opts = usable.length ? usable : orderedOptions(s, c);
      s = chooseOption(s, opts[policy === 'random' ? rng.int(opts.length) : 0].id);
      // spend favours as soon as you have them
      for (const f of [...s.heldFavours]) s = useFavour(s, f);
    }
    else if (s.phase === 'resolve') s = continueAfterResolve(s);
    else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
    else if (s.phase === 'vote') s = completeConfidenceVote(s);
    else if (s.phase === 'night') s = openShop(s);
    else if (s.phase === 'shop') {
      if (buyer !== 'none') {
        let loops = 0;
        while (loops++ < 6) {
          const afford = s.shopStock.filter((id) => shopPrice(s, SHOP_MAP[id]) <= s.stats.treasury - (buyer === 'greedy' ? 0 : 12));
          if (!afford.length) break;
          const sorted = [...afford].sort((a, b) => shopPrice(s, SHOP_MAP[a]) - shopPrice(s, SHOP_MAP[b]));
          const pick = buyer === 'cheapest' ? sorted[0] : buyer === 'greedy' ? sorted[sorted.length - 1] : afford[rng.int(afford.length)];
          const next = buyShopItem(s, pick);
          if (next.shopBought.length === s.shopBought.length) break;
          bought.push(pick);
          s = next;
          if (buyer === 'cheapest') break; // one a night
        }
      }
      s = leaveShop(s);
    }
  }
  return { s, bought };
}

function report(buyer: Buyer, policy: 'random' | 'first', n: number) {
  const endings: Record<string, number> = {};
  let days = 0, deals = 0, reachedMax = 0;
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const { s, bought } = run(i * 7717 + 3, buyer, policy);
    endings[s.ending?.id ?? 'none'] = (endings[s.ending?.id ?? 'none'] ?? 0) + 1;
    days += s.day; deals += s.stat.dealsStruck;
    if (s.day >= s.maxDays) reachedMax++;
    for (const b of bought) counts[b] = (counts[b] ?? 0) + 1;
  }
  console.log(`${policy.padEnd(6)} buyer=${buyer.padEnd(9)} avgDays=${(days / n).toFixed(1)} reachedDay18=${((reachedMax / n) * 100).toFixed(0)}% avgBuys=${(deals / n).toFixed(1)}`);
  console.log('   endings:', JSON.stringify(endings));
  if (buyer !== 'none') {
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log('   items  :', top.map(([k, v]) => `${k}=${(v / n).toFixed(2)}`).join(' '));
    const never = Object.keys(SHOP_MAP).filter((k) => !counts[k]);
    if (never.length) console.log('   NEVER BOUGHT:', never.join(', '));
  }
}

/**
 * Print the whole table. Not part of `npm test` — it takes ~40s and it is a
 * measuring instrument, not an assertion. Run it from a scratch test file:
 *
 *   import { shopProbe } from './shop.probe';
 *   it('probe', () => shopProbe(), 240000);
 */
export function shopProbe(n = 120) {
  for (const policy of ['random', 'first'] as const) {
    for (const buyer of ['none', 'cheapest', 'greedy', 'random'] as Buyer[]) report(buyer, policy, n);
  }
}

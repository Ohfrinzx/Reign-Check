import { createGame } from '../state';
import { prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert, activeCard, openShop, leaveShop } from '../engine';
import { makeRng } from '../rng';
import type { GameState } from '../types';

export function probe(n: number, policy: 'random' | 'first' | 'last') {
  const endings: Record<string, number> = {};
  let totalDays = 0, alerts = 0, reachedMax = 0;
  for (let i = 0; i < n; i++) {
    const rng = makeRng(i + 99);
    let s: GameState = prepareDay(createGame({ seed: i * 7717 + 3 }));
    let g = 0;
    while (s.phase !== 'ended' && g++ < 3000) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') {
        const c = activeCard(s)!;
        const usable = c.options.filter((o) => !o.enabled || o.enabled(s));
        const opts = usable.length ? usable : c.options;
        const idx = policy === 'random' ? rng.int(opts.length) : policy === 'first' ? 0 : opts.length - 1;
        s = chooseOption(s, opts[idx].id);
      } else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') s = leaveShop(s);
    }
    endings[s.ending?.id ?? 'none'] = (endings[s.ending?.id ?? 'none'] ?? 0) + 1;
    totalDays += s.day; alerts += s.stat.alertsSurvived;
    if (s.day >= s.maxDays) reachedMax++;
  }
  return { policy, avgDays: (totalDays / n).toFixed(1), avgAlerts: (alerts / n).toFixed(1), reachedMax: `${((reachedMax / n) * 100).toFixed(0)}%`, endings };
}

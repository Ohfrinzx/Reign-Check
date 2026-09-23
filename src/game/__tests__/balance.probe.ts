import { createGame } from '../state';
import { prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert, activeCard, openShop, leaveShop, completeConfidenceVote, orderedOptions } from '../engine';
import { makeRng } from '../rng';
import { computeResources, DISPLAY_FACTIONS } from '../display';
import type { GameState } from '../types';

/**
 * The balance probe. Policies:
 *   random  — ignores the text entirely
 *   first / last — always the first / last option AS SHOWN (the order is
 *             shuffled per run since balance slice B, so these now behave
 *             like random)
 *   careful — a reader: 3 times in 4 it picks the option that leaves the
 *             visible position best (Grip, Legitimacy, money, the faction
 *             bars, and the pressures the front page warns about); the rest
 *             of the time it misjudges. The owner's "Hard" target is that
 *             this kind of play survives about half the time.
 */
export type ProbePolicy = 'random' | 'first' | 'last' | 'careful';

/** How good the position looks from what the player can see. */
export function visibleScore(s: GameState): number {
  if (s.ending && s.ending.id !== 'survival') return -1000;
  const r = computeResources(s);
  const grip = r.find((x) => x.key === 'grip')!.value;
  const legit = r.find((x) => x.key === 'legitimacy')!.value;
  const loy = DISPLAY_FACTIONS.map((d) => s.factions[d.id].loyalty);
  const avg = loy.reduce((a, b) => a + b, 0) / loy.length;
  const h = s.hidden;
  const warned = [h.coup, h.unrest, h.foreign, h.separatism, h.scandal, h.fiscal].reduce((a, v) => a + Math.max(0, v - 45), 0);
  return grip + legit + 0.35 * Math.min(s.stats.treasury, 50) + 0.4 * avg + 0.5 * Math.min(...loy) - 0.6 * warned;
}

export function probe(n: number, policy: ProbePolicy) {
  const endings: Record<string, number> = {};
  let totalDays = 0, alerts = 0, reachedMax = 0;
  const margins: number[][] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const rng = makeRng(i + 99);
    let s: GameState = prepareDay(createGame({ seed: i * 7717 + 3 }));
    let g = 0;
    while (s.phase !== 'ended' && g++ < 3000) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') {
        const c = activeCard(s)!;
        const usable = orderedOptions(s, c).filter((o) => !o.enabled || o.enabled(s));
        const opts = usable.length ? usable : orderedOptions(s, c);
        let id = opts[policy === 'first' ? 0 : policy === 'last' ? opts.length - 1 : rng.int(opts.length)].id;
        if (policy === 'careful' && rng.chance(0.75)) {
          let best = -Infinity;
          for (const o of opts) {
            const v = visibleScore(chooseOption(s, o.id));
            if (v > best) { best = v; id = o.id; }
          }
        }
        s = chooseOption(s, id);
      } else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'vote') { margins[s.act - 1]?.push(s.confidenceVote!.margin); s = completeConfidenceVote(s); }
      else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') s = leaveShop(s);
    }
    endings[s.ending?.id ?? 'none'] = (endings[s.ending?.id ?? 'none'] ?? 0) + 1;
    totalDays += s.day; alerts += s.stat.alertsSurvived;
    if (s.day >= s.maxDays) reachedMax++;
  }
  const median = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  return {
    policy,
    survived: `${(((endings.survival ?? 0) / n) * 100).toFixed(0)}%`,
    avgDays: (totalDays / n).toFixed(1),
    avgAlerts: (alerts / n).toFixed(1),
    reachedMax: `${((reachedMax / n) * 100).toFixed(0)}%`,
    voteMarginMedianByAct: margins.map(median),
    endings,
  };
}

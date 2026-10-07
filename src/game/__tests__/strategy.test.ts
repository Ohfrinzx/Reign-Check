import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { beginStages, prepareDay, activeCard } from '../engine';
import { makeRng } from '../rng';
import { MANDATES } from '../content/mandates';
import { expectedOptionValue, readerPosition, strategyChoice, strategyMatrix, strategyProbe, STRATEGY_POLICIES } from './strategy.probe';

describe('strategy measurement', () => {
  it('evaluates a gamble without inspecting the saved random outcome or mutating the run', () => {
    const state = createGame({ seed: 111, mandateId: 'accident' });
    const before = JSON.stringify(state);
    const option = {
      id: 'gamble', label: 'A gamble',
      outcome: (_s: typeof state, rng: ReturnType<typeof makeRng>) => ({
        text: 'Result', effects: { stats: { treasury: rng.chance(0.5) ? 20 : -20 } },
      }),
    };
    const changedRng = { ...state, seed: 9999, rngState: 987654321 };
    expect(expectedOptionValue(state, option, 'adaptive')).toBe(expectedOptionValue(changedRng, option, 'adaptive'));
    expect(JSON.stringify(state)).toBe(before);
  });

  it('uses the same pressure estimate within a front-page warning band', () => {
    const state = createGame({ seed: 111 });
    state.hidden.unrest = 33;
    const other = structuredClone(state);
    other.hidden.unrest = 54;
    expect(readerPosition(state).hidden.unrest).toBe(readerPosition(other).hidden.unrest);
    other.hidden.unrest = 56;
    expect(readerPosition(state).hidden.unrest).not.toBe(readerPosition(other).hidden.unrest);
  });

  it('chooses legally and identically when only the saved RNG changes', () => {
    const state = beginStages(prepareDay(createGame({ seed: 4, mandateId: 'accident' })));
    const other = { ...state, rngState: 77291 };
    const choice = strategyChoice(state, 'adaptive', makeRng(17));
    expect(strategyChoice(other, 'adaptive', makeRng(17))).toBe(choice);
    expect(activeCard(state)!.options.some((o) => o.id === choice)).toBe(true);
  });

  it('runs every start deterministically and records actions and endings', () => {
    for (const mandate of MANDATES) {
      const settings = { n: 2, mandateId: mandate.id, policy: 'adaptive' as const, minigameSkill: 0.9 };
      const result = strategyProbe(settings);
      expect(result).toEqual(strategyProbe(settings));
      expect(Object.values(result.endings).reduce((a, b) => a + b, 0)).toBe(2);
      expect(result.avgPurchases).toBeGreaterThan(0);
    }
  }, 120000);
});

// Explicit opt-in; normal npm test stays small. Commands:
// STRATEGY_COUNT=400 STRATEGY_SKILL=0.9 npx vitest run src/game/__tests__/strategy.test.ts
// STRATEGY_COUNT=400 STRATEGY_SKILL=0.5 STRATEGY_OFFSET=10000 ...
// STRATEGY_POLICIES=adaptive,random narrows a requested control comparison.
const env = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
if (env.STRATEGY_COUNT) {
  it('prints the requested reproducible strategy matrix', () => {
    const policies = env.STRATEGY_POLICIES?.split(',') ?? STRATEGY_POLICIES;
    if (policies.some((p) => !STRATEGY_POLICIES.includes(p as typeof STRATEGY_POLICIES[number]))) throw new Error('Unknown STRATEGY_POLICIES');
    for (const result of strategyMatrix(Number(env.STRATEGY_COUNT), Number(env.STRATEGY_SKILL ?? 0.9), Number(env.STRATEGY_OFFSET ?? 0), policies as typeof STRATEGY_POLICIES)) {
      console.log(`STRATEGY_RESULT ${JSON.stringify(result)}`);
    }
  }, 3600000);
}

import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { beginStages, prepareDay, activeCard } from '../engine';
import { makeRng } from '../rng';
import { MANDATES } from '../content/mandates';
import { expectedOptionValue, readerPosition, resolveProbeMinigame, strategyChoice, strategyMatrix, strategyProbe, STRATEGY_POLICIES } from './strategy.probe';
import { BUDGET_CARD_ID } from '../content/mgBudget';
import { AMBASSADOR_CARD_ID } from '../content/mgAmbassador';
import { BUDGET_FACTIONS } from '../minigames/budget';
import { hasMark } from '../consequences';
import { tickDemands } from '../demands';

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

  it('stress Budget losses reach actual walkout memories, repayment bills and demand claims', () => {
    let bills = 0, claims = 0;
    for (let seed = 0; seed < 20; seed++) {
      const state = createGame({ seed, mandateId: 'accident' });
      state.day = 4;
      state.phase = 'stage';
      state.current = { cardId: BUDGET_CARD_ID, isAlert: false };
      const after = resolveProbeMinigame(state, false, 'lost', 'stress');
      const walked = BUDGET_FACTIONS.filter((f) => hasMark(after, `budget-walkout-${f}`));
      expect(walked).toHaveLength(2);
      expect(walked.every((f) => after.flags[`bnDiff:${f}`] === -4)).toBe(true);
      expect(after.factions.staff.loyalty).toBeLessThan(state.factions.staff.loyalty);
      bills += after.commitments.filter((c) => c.id.startsWith('budget-repay-') && c.perDay === 1 && c.daysLeft === 5).length;
      bills += after.scheduled.filter((s) => s.effects?.stats?.treasury === -5.6 && s.day === 8).length;
      const morning = structuredClone(after);
      morning.day++;
      tickDemands(morning, makeRng(71));
      claims += BUDGET_FACTIONS.filter((f) => morning.factions[f].demand?.id === `budget-claim-${f}`).length;
      const win = resolveProbeMinigame(state, true, 'won', 'stress');
      expect(BUDGET_FACTIONS.every((f) => win.flags[`bnDiff:${f}`] === 0 && win.flags[`bnOut:${f}`] === 0)).toBe(true);
      expect(win.commitments.some((c) => c.id.startsWith('budget-repay-'))).toBe(false);
    }
    expect(bills).toBeGreaterThan(0);
    expect(claims).toBeGreaterThan(0);
  });

  it('stress Ambassador wins reach the low reward tier and preserve standard results', () => {
    const state = createGame({ seed: 9, mandateId: 'accident' });
    state.phase = 'stage';
    state.current = { cardId: AMBASSADOR_CARD_ID, isAlert: false };
    const standard = resolveProbeMinigame(state, true, 'won');
    const stress = resolveProbeMinigame(state, true, 'won', 'stress');
    expect(stress.flags.mgScore).toBe(70);
    expect(stress.stats.legitimacy - state.stats.legitimacy).toBe(2);
    expect(stress.stats.economy - state.stats.economy).toBe(2);
    expect(standard.stats.legitimacy - state.stats.legitimacy).toBe(5);
    expect(standard.stats.economy - state.stats.economy).toBe(4);
    const loss = resolveProbeMinigame(state, false, 'lost', 'stress');
    expect(loss.flags.mgScore).toBe(0);
    expect(loss.stats.legitimacy).toBeLessThan(state.stats.legitimacy);
  });
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

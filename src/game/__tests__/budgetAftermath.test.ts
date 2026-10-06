import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { activeCard, beginStages, finishMinigame, prepareDay } from '../engine';
import { hasMark } from '../consequences';
import { makeRng } from '../rng';
import { DISPLAY_FACTIONS } from '../display';
import { BUDGET_FACTIONS } from '../minigames/budget';
import { MG_CARD } from '../content/minigames';
import {
  BUDGET_FACTION_IDS, GENEROUS_AT, OVER_MAX, SHORT_MAX, WALKOUT_LOYALTY, budgetAftermath, budgetMark,
} from '../content/mgBudget';
import type { GameState } from '../types';

/**
 * Owner (2026-10-06): money over a faction's line should raise its support
 * (and be remembered); short at eight a small drop; a walk-out costs loyalty
 * and the faction uses the budget against you — sometimes a demand,
 * sometimes daily repayment or the full sum later, with interest.
 */

function budgetDay(seed = 5): GameState {
  let s = createGame({ seed, mandateId: 'accident' });
  s.day = 4; s.act = 1;
  for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; f.demand = undefined; }
  s = prepareDay(s);
  s.todayDeck = [MG_CARD.budget];
  s.agenda = ['government'];
  s = beginStages(s);
  expect(activeCard(s)?.id).toBe(MG_CARD.budget);
  return s;
}
/** Flags as BudgetGame.tsx sends them: every faction exactly at its line, unless given. */
function jars(over: Partial<Record<string, number>> = {}, out: string[] = []): Record<string, number> {
  const f: Record<string, number> = {};
  for (const id of BUDGET_FACTION_IDS) { f[`bnDiff:${id}`] = over[id] ?? 0; f[`bnOut:${id}`] = out.includes(id) ? 1 : 0; }
  return f;
}

describe('Budget Night: the jars at eight', () => {
  it('the jars are the five visible factions, in the same order', () => {
    expect([...BUDGET_FACTIONS]).toEqual(DISPLAY_FACTIONS.map((d) => d.id));
    expect([...BUDGET_FACTION_IDS]).toEqual([...BUDGET_FACTIONS]);
  });

  it('over the line: +1 loyalty per $1B (capped), remembered from $3B; short: −1 per $1B (capped)', () => {
    const s = { ...budgetDay(), flags: { ...budgetDay().flags, ...jars({ staff: 2, sable: GENEROUS_AT, concord: 9, combine: -2, chorus: -7 }) } };
    const a = budgetAftermath(s, makeRng(1));
    const loy = (f: string) => (a.effects.factions as Record<string, { loyalty: number }>)[f]?.loyalty;
    expect(loy('staff')).toBe(2);
    expect(loy('sable')).toBe(GENEROUS_AT);
    expect(loy('concord')).toBe(OVER_MAX);
    expect(loy('combine')).toBe(-2);
    expect(loy('chorus')).toBe(-SHORT_MAX);
    expect(a.marks.sort()).toEqual([budgetMark('generous', 'concord'), budgetMark('generous', 'sable')].sort());
    expect(a.lines.length).toBe(5);
  });

  it('a walk-out: loyalty down, remembered, and the faction comes for its money one of three ways', () => {
    const s = { ...budgetDay(), flags: { ...budgetDay().flags, ...jars({ staff: -3 }, ['staff']) } };
    const kinds = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const a = budgetAftermath(s, makeRng(i));
      expect((a.effects.factions as Record<string, { loyalty: number }>).staff.loyalty).toBe(WALKOUT_LOYALTY);
      expect(a.marks).toContain(budgetMark('walkout', 'staff'));
      if (a.marks.includes(budgetMark('claim', 'staff'))) kinds.add('demand');
      if (a.effects.commitments?.length) {
        kinds.add('daily');
        const c = a.effects.commitments[0];
        expect(c.perDay * (c.days ?? 0)).toBeGreaterThan(3); // with interest
      }
      if (a.effects.schedule?.length) {
        kinds.add('later');
        expect(a.effects.schedule[0].effects?.stats?.treasury).toBeLessThan(-3); // with interest
      }
    }
    expect([...kinds].sort()).toEqual(['daily', 'demand', 'later']);
  });

  it('through the card: the result names the jars, adds to the game\'s own loyalty, and goes on the record', () => {
    const open = budgetDay();
    const s = finishMinigame(open, true, 80, undefined, jars({ staff: 4 }));
    expect(s.factions.staff.loyalty).toBeGreaterThan(open.factions.staff.loyalty + 3);
    expect(s.lastOutcome?.text).toMatch(/The jars at eight: the Army got \$4B more/i);
    expect(hasMark(s, budgetMark('generous', 'staff'))).toBe(true);
    expect(s.lastOutcome?.marked?.join(' ')).toMatch(/more than it asked for/);
    // no jars played (a simulation): the plain result
    const plain = finishMinigame(open, true, 80);
    expect(plain.lastOutcome?.text).not.toMatch(/jars at eight/);
  });

  it('a claim becomes the faction\'s demand the next morning', () => {
    let seed = 0, s: GameState | undefined;
    for (; seed < 40; seed++) {
      const open = budgetDay(seed + 1);
      const t = finishMinigame(open, false, 0, undefined, jars({ combine: -3, chorus: -2 }, ['combine', 'chorus']));
      if (hasMark(t, budgetMark('claim', 'combine'))) { s = t; break; }
    }
    expect(s, 'some seed picks the demand').toBeTruthy();
    const next = prepareDay({ ...s!, day: s!.day + 1, phase: 'night' });
    expect(next.factions.combine.demand?.id).toBe('budget-claim-combine');
  });
});

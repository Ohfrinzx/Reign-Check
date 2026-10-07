import { expect, it } from 'vitest';
import { createGame } from '../state';
import { beginStages, finishMinigame, prepareDay } from '../engine';
import { MG_CARD } from '../content/minigames';
import { BUDGET_FACTION_IDS } from '../content/mgBudget';
import type { GameState } from '../types';

function game(id: string, previous?: GameState) {
  let s = previous ? structuredClone(previous) : createGame({ seed: 5, mandateId: 'accident' });
  s.day = previous ? previous.day + 2 : 4;
  s.phase = 'briefing'; s.current = undefined; s.lastOutcome = undefined;
  s = prepareDay(s); s.todayDeck = [id]; s.agenda = ['government'];
  return beginStages(s);
}

it('a later low-scoring Ambassador deal does not inherit an earlier high score', () => {
  const first = finishMinigame(game(MG_CARD.ambassador), true, 95);
  const next = game(MG_CARD.ambassador, first);
  const old = JSON.stringify(next);
  const result = finishMinigame(next, true, 70);
  expect(result.flags.mgScore).toBe(70);
  expect(result.stats.economy - next.stats.economy).toBeCloseTo(2);
  expect(result.lastOutcome?.text).toMatch(/limit/);
  expect(JSON.stringify(next)).toBe(old);
});

it('a later clean Budget Night does not replay an old walk-out or surplus', () => {
  const jars = Object.fromEntries(BUDGET_FACTION_IDS.flatMap(f => [[`bnDiff:${f}`, 0], [`bnOut:${f}`, 0]]));
  const first = finishMinigame(game(MG_CARD.budget), false, 0, undefined,
    { ...jars, 'bnDiff:staff': -3, 'bnOut:staff': 1, 'bnDiff:chorus': 4 });
  const next = game(MG_CARD.budget, first);
  const result = finishMinigame(next, true, 80, undefined, jars);
  expect(result.flags['bnOut:staff']).toBe(0);
  expect(result.flags['bnDiff:chorus']).toBe(0);
  expect(result.lastOutcome?.text).not.toMatch(/walked out|got \$4B/);
  expect(result.commitments).toEqual(next.commitments);
  expect(result.scheduled).toEqual(next.scheduled);
});

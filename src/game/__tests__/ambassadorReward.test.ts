import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { activeCard, beginStages, finishMinigame, prepareDay } from '../engine';
import { MG_CARD } from '../content/minigames';
import { AMBASSADOR_FAIR_BELOW, AMBASSADOR_GREAT } from '../content/mgAmbassador';
import type { GameState } from '../types';

/** Any deal under Brask's limit wins, so the price you get sets the size of the win. */
function dinner(): GameState {
  let s = createGame({ seed: 5, mandateId: 'accident' });
  s.day = 4; s.act = 1;
  for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
  s = prepareDay(s);
  s.todayDeck = [MG_CARD.ambassador];
  s.agenda = ['government'];
  s = beginStages(s);
  expect(activeCard(s)?.id).toBe(MG_CARD.ambassador);
  return s;
}

describe('The Ambassador\'s Table: the better the price, the bigger the gain', () => {
  it('a great deal beats a fair one, which beats one just under the limit', () => {
    const open = dinner();
    const great = finishMinigame(open, true, AMBASSADOR_GREAT + 5);
    const fair = finishMinigame(open, true, AMBASSADOR_FAIR_BELOW + 2);
    const poor = finishMinigame(open, true, AMBASSADOR_FAIR_BELOW - 10);
    const gain = (s: GameState) => s.stats.economy - open.stats.economy;
    expect(gain(great)).toBeGreaterThan(gain(fair));
    expect(gain(fair)).toBeGreaterThan(gain(poor));
    expect(gain(poor)).toBeGreaterThan(0);
    expect(great.hidden.foreign).toBeLessThan(poor.hidden.foreign);
    expect(poor.lastOutcome?.text).toMatch(/limit/);
    const lost = finishMinigame(open, false, 0);
    expect(lost.stats.economy).toBeLessThan(open.stats.economy);
  });
});

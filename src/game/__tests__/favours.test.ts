import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay } from '../engine';
import { favourBlockReason, favourTargets, spendFavour } from '../favours';
import { SHOP_ITEMS, SHOP_MAP } from '../content/shop';
import { STAGE_DAYS } from '../demands';
import type { GameState } from '../types';

/** A morning with nothing in play, holding the given favours. */
function morning(favours: string[]): GameState {
  const s = createGame({ seed: 17, mandateId: 'accident' });
  s.day = 5;
  s.phase = 'briefing';
  s.scandals = [];
  s.heldFavours = [...favours];
  return s;
}

describe('favours that visibly do something (balance slice A)', () => {
  it('content: every favour says when it is useful; aimed favours only aim at known kinds of thing', () => {
    for (const d of SHOP_ITEMS.filter((x) => x.kind === 'favour')) {
      expect(d.use?.whenUseful, d.id).toBeTruthy();
      for (const t of d.use?.targets ?? []) expect(t, d.id).toMatch(/^(scandal|demand|demand:\w+|crisis:\w+)$/);
    }
  });

  it('a favour that needs a target is blocked, with a plain reason, when there is nothing to aim it at', () => {
    const s = morning(['quiet-word']);
    expect(favourTargets(s, SHOP_MAP['quiet-word'])).toEqual([]);
    expect(favourBlockReason(s, 'quiet-word')).toMatch(/Nothing to use it on yet/);
    expect(spendFavour(s, 'quiet-word').state).toBe(s);
  });

  it('aimed at a named scandal: the scandal is gone, and the receipt says so by name', () => {
    const s = morning(['quiet-word']);
    s.scandals = [
      { id: 'sc-a', name: 'The stairwell', detail: 'x', heat: 45, buried: false, day: 2 },
      { id: 'sc-b', name: 'The Ilvet appointment', detail: 'y', heat: 30, buried: false, day: 3 },
    ];
    expect(favourTargets(s, SHOP_MAP['quiet-word']).map((t) => t.key)).toEqual(['scandal:sc-a', 'scandal:sc-b']);
    const { state, result } = spendFavour(s, 'quiet-word', 'scandal:sc-b');
    expect(state.scandals.map((x) => x.id)).toEqual(['sc-a']);
    expect(state.heldFavours).toEqual([]);
    expect(result?.lines.join(' ')).toMatch(/"The Ilvet appointment" is gone/);
    expect(s.scandals).toHaveLength(2); // input untouched
  });

  it('aimed at a demand: the faction drops it, unpaid', () => {
    const s = morning(['garrison-envelope']);
    s.factions.staff.demand = { id: 'army-pay-rise', issuedDay: 5, dueDay: 5 + STAGE_DAYS, severity: 'formal', bribes: 0 };
    const money = s.stats.treasury;
    const { state, result } = spendFavour(s, 'garrison-envelope', 'demand:staff');
    expect(state.factions.staff.demand).toBeUndefined();
    expect(state.stats.treasury).toBe(money);
    expect(result?.lines[0]).toMatch(/Army dropped their demand: "The army wants its pay rise"/);
  });

  it('aimed at a running crisis: it ends as handled, and today\'s unplayed stage card is taken away', () => {
    let s = morning(['ambassadors-favour']);
    for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
    s.hidden.foreign = 70;
    s = prepareDay(s);
    expect(s.crisis?.id).toBe('gas');
    expect(s.todayDeck).toContain('crisis-gas-1');
    const { state, result } = spendFavour(s, 'ambassadors-favour', 'crisis:gas');
    expect(state.todayDeck).not.toContain('crisis-gas-1');
    expect(state.todayDeck.length).toBe(state.agenda.length);
    expect(result?.lines[0]).toMatch(/Ostrene Gas Cutoff is over/);
    const tomorrow = prepareDay({ ...state, day: state.day + 1, phase: 'night' });
    expect(tomorrow.crisis).toBeUndefined();
    expect(tomorrow.crisesDone).toContain('gas');
    expect(tomorrow.stat.bigMoments.some((m) => /Handled The Ostrene Gas Cutoff/.test(m.text))).toBe(true);
  });

  it('an untargeted favour still gives a receipt with what changed', () => {
    const s = morning(['adamek-card']);
    const { state, result } = spendFavour(s, 'adamek-card');
    expect(state.stats.treasury).toBeGreaterThan(s.stats.treasury);
    expect(result?.deltas.treasury).toBeGreaterThan(0);
  });
});

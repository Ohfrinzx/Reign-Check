import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay, lookupCard } from '../engine';
import { buildBriefing } from '../briefing';
import { CRISES, CRISIS_CARDS, CRISIS_MAP } from '../content/crises';
import { START_DAY, STAGE_GAP, endFlag, scoreFlag } from '../crises';
import type { GameState } from '../types';

/** A calm morning: no pressure anywhere, nobody angry. */
function morning(day = 5, seed = 21): GameState {
  const s = createGame({ seed, mandateId: 'accident' });
  s.day = day;
  for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
  for (const f of Object.values(s.factions)) f.patience = 70;
  for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
  return s;
}

/** Next morning, pretending the player played every card queued today. */
function nextDay(s: GameState): GameState {
  const t = structuredClone(s);
  for (const id of t.todayDeck) if (!t.seenOnce.includes(id)) t.seenOnce.push(id);
  t.day += 1;
  t.phase = 'night';
  return prepareDay(t);
}

describe('crisis chains (Phase 3 step 3)', () => {
  it('content: five chains, three stages each (calm/hot for 2 and 3), queued-only, once per run, no direct endings', () => {
    expect(CRISES.length).toBeGreaterThanOrEqual(5);
    expect(CRISIS_CARDS).toHaveLength(CRISES.length * 5);
    for (const c of CRISIS_CARDS) {
      expect(lookupCard(c.id), c.id).toBe(c);
      expect(c.tags).toContain('crisis-chain');
      expect(c.once).toBe(true);
      expect(c.weight!(morning())).toBe(0);
      expect(c.options.length).toBeGreaterThanOrEqual(3);
      for (const o of c.options) {
        const out = typeof o.outcome === 'function' ? undefined : o.outcome;
        expect(out?.effects?.ending, `${c.id}/${o.id}`).toBeUndefined();
      }
    }
  });

  it('a chain starts when its pressure boils over, and not before day 4', () => {
    const early = morning(START_DAY - 1);
    early.hidden.unrest = 70;
    expect(prepareDay(early).crisis).toBeUndefined();

    const s = morning();
    s.hidden.unrest = 70;
    const t = prepareDay(s);
    expect(t.crisis?.id).toBe('bread');
    expect(t.todayDeck[0]).toBe('crisis-bread-1');
    const item = buildBriefing(t).items.find((i) => i.source === 'Crisis');
    expect(item?.headline).toMatch(/Bread Riots \(stage 1 of 3\)/);
  });

  it('the most over-threshold pressure wins, and only one chain runs at a time', () => {
    const s = morning();
    s.hidden.unrest = 50;
    s.hidden.separatism = 80;
    const t = prepareDay(s);
    expect(t.crisis?.id).toBe('referendum');
    const u = nextDay(t);
    expect(u.crisis?.id).toBe('referendum');
    expect(u.todayDeck.filter((id) => id.startsWith('crisis-'))).toHaveLength(0);
  });

  it('handled well → calm stages; made worse → hot stages; then it ends and is recorded', () => {
    const run = (score: number) => {
      let s = morning();
      s.hidden.foreign = 70;
      s = prepareDay(s);
      s.flags[scoreFlag('gas')] = score;
      const seen: string[] = [...s.todayDeck.filter((id) => id.startsWith('crisis-'))];
      for (let i = 0; i < 8 && s.crisis; i++) {
        s = nextDay(s);
        seen.push(...s.todayDeck.filter((id) => id.startsWith('crisis-')));
      }
      return { s, seen };
    };
    const calm = run(1);
    expect(calm.seen).toEqual(['crisis-gas-1', 'crisis-gas-2-calm', 'crisis-gas-3-calm']);
    expect(calm.s.crisis).toBeUndefined();
    expect(calm.s.crisesDone).toContain('gas');
    expect(calm.s.stat.bigMoments.some((m) => /Ostrene Gas Cutoff/.test(m.text))).toBe(true);

    const hot = run(-2);
    expect(hot.seen).toEqual(['crisis-gas-1', 'crisis-gas-2-hot', 'crisis-gas-3-hot']);
  });

  it('stages are STAGE_GAP days apart, a chain can end early, and it never repeats', () => {
    let s = morning();
    s.hidden.separatism = 70;
    s = prepareDay(s);
    const started = s.day;
    s = nextDay(s);
    expect(s.crisis?.stage).toBe(1);
    s = nextDay(s);
    expect(s.day).toBe(started + STAGE_GAP);
    expect(s.crisis?.stage).toBe(2);

    s.flags[endFlag('referendum')] = 1;
    s = nextDay(s);
    expect(s.crisis).toBeUndefined();
    expect(s.crisesDone).toEqual(['referendum']);

    // pressure is still high, but the chain is done — and the cooldown holds
    s.hidden.separatism = 90;
    for (let i = 0; i < 6; i++) s = nextDay(s);
    expect(s.crisis?.id).not.toBe('referendum');
    expect(CRISIS_MAP.referendum).toBeTruthy();
  });

  it('survives a save round trip and is reproducible', () => {
    const s = morning();
    s.hidden.scandal = 80;
    const t = prepareDay(s);
    expect(JSON.parse(JSON.stringify(t)).crisis).toEqual(t.crisis);
    expect(prepareDay(s).todayDeck).toEqual(t.todayDeck);
  });
});

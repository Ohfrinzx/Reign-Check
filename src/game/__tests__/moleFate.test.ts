import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { activeCard, beginStages, finishMinigame, lookupCard, orderedOptions, prepareDay } from '../engine';
import { hasMark, markFlag } from '../consequences';
import { MG_CARD } from '../content/minigames';
import { MOLE_CHOICES, MOLE_JOB_FLAG, moleJob } from '../content/mgMole';
import { STAFF } from '../minigames/mole';
import type { GameState } from '../types';

/**
 * Owner (2026-10-06): "With find the mole I'd like the option to choose what
 * happens to the mole and have that have an effect on the game." Chosen:
 * arrest / turn / fire quietly / expose, each on the record.
 */

function moleDay(seed = 5): GameState {
  let s = createGame({ seed, mandateId: 'accident' });
  s.day = 4; s.act = 1;
  for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
  s = prepareDay(s);
  s.todayDeck = [MG_CARD.mole];
  s.agenda = ['government'];
  s = beginStages(s);
  expect(activeCard(s)?.id).toBe(MG_CARD.mole);
  return s;
}
const clerk = { [MOLE_JOB_FLAG]: STAFF.findIndex((x) => x.id === 'clerk') + 1 };

describe('Find the Mole: what happens to the mole', () => {
  it('each of the four choices resolves the card, names the mole and goes on the record', () => {
    const marks: Record<string, string> = { won: 'mole-arrested', turn: 'mole-turned', fire: 'mole-fired', expose: 'mole-exposed' };
    expect(MOLE_CHOICES.map((c) => c.id)).toEqual(['won', 'turn', 'fire', 'expose']);
    for (const c of MOLE_CHOICES) {
      const open = moleDay();
      const s = finishMinigame(open, true, 90, c.id, clerk);
      expect(s.phase, c.id).toBe('resolve');
      expect(s.lastOutcome?.text, c.id).toMatch(/Clerk/);
      expect(hasMark(s, marks[c.id]), c.id).toBe(true);
      expect(s.flags[markFlag(marks[c.id])]).toBe(open.day);
      expect(s.stats.legitimacy, c.id).toBeGreaterThan(open.stats.legitimacy);
      expect(s.hidden.leak, c.id).toBeLessThan(open.hidden.leak);
    }
  });

  it('the choices really differ: arrest pleases Security, exposing pleases the Street and annoys Security, turning brings a card back in four days', () => {
    const open = moleDay();
    const arrest = finishMinigame(open, true, 90, 'won');
    const expose = finishMinigame(open, true, 90, 'expose');
    const turn = finishMinigame(open, true, 90, 'turn');
    expect(arrest.factions.sable.loyalty).toBeGreaterThan(expose.factions.sable.loyalty);
    expect(expose.factions.chorus.loyalty).toBeGreaterThan(arrest.factions.chorus.loyalty);
    expect(turn.scheduled.some((x) => x.cardId === 'mole-double' && x.day === open.day + 4)).toBe(true);
    expect(arrest.scheduled.some((x) => x.cardId === 'mole-double')).toBe(false);
    expect(lookupCard('mole-double')?.options.length).toBe(3);
  });

  it('a loss ignores any choice; an unknown choice falls back to the plain win (the arrest)', () => {
    const open = moleDay();
    const lost = finishMinigame(open, false, 0, 'expose');
    expect(lost.lastOutcome?.optionLabel).toMatch(/got away/);
    expect(hasMark(lost, 'mole-exposed')).toBe(false);
    const odd = finishMinigame(open, true, 80, 'lost');
    expect(hasMark(odd, 'mole-arrested')).toBe(true);
    expect(moleJob({ ...open, flags: {} } as GameState)).toBe('the mole');
  });

  it('the record changes a later emergency: a turned mole unlocks an option, an exposed one changes the injunction, a fired one unlocks a quiet word', () => {
    const leak = lookupCard('alert-leak')!;
    const base = moleDay();
    const ids = (s: GameState) => orderedOptions(s, leak).map((o) => o.id);
    const withMark = (m: string) => { const s = structuredClone(base); s.flags[markFlag(m)] = 2; return s; };
    expect(ids(base)).not.toContain('double-agent');
    expect(ids(withMark('mole-turned'))).toContain('double-agent');
    expect(ids(withMark('mole-fired'))).toContain('quiet-word');
    const inj = orderedOptions(withMark('mole-exposed'), leak).find((o) => o.id === 'injunct');
    expect(inj?.because?.kind).toBe('change');
  });
});

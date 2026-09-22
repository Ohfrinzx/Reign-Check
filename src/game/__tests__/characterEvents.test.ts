import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay, lookupCard } from '../engine';
import { buildBriefing } from '../briefing';
import { CHARACTERS } from '../content/country';
import { CHARACTER_EVENTS, CHARACTER_EVENT_CARDS } from '../content/characterEvents';
import { betrayalId, offerId, TURN_BELOW, WARN_BELOW, DEVOTED_AT } from '../characterEvents';
import type { GameState } from '../types';

/** A quiet mid-act morning where nobody feels strongly about you. */
function morning(day = 4, seed = 11): GameState {
  const s = createGame({ seed, mandateId: 'accident' });
  s.day = day;
  for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
  for (const f of Object.values(s.factions)) f.patience = 70; // keep demands out of the way
  return s;
}

const next = (s: GameState) => prepareDay({ ...s, day: s.day + 1, phase: 'night' });

describe('character-driven events (Phase 3 step 2)', () => {
  it('content: every character has a betrayal and an offer, queued-only, once per run, never ending the run', () => {
    expect(CHARACTER_EVENTS.map((e) => e.character).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
    for (const ev of CHARACTER_EVENTS) {
      expect(ev.warning.length).toBeGreaterThan(10);
      expect(ev.betrayal.id).toBe(betrayalId(ev.character));
      expect(ev.offer.id).toBe(offerId(ev.character));
    }
    for (const c of CHARACTER_EVENT_CARDS) {
      expect(lookupCard(c.id), c.id).toBe(c);
      expect(c.tags).toContain('character-event');
      expect(c.once).toBe(true);
      expect(c.weight!(morning())).toBe(0);
      expect(c.options.length).toBeGreaterThanOrEqual(3);
      for (const o of c.options) {
        const out = typeof o.outcome === 'function' ? undefined : o.outcome;
        expect(out?.effects?.ending, `${c.id}/${o.id} ends the run`).toBeUndefined();
      }
    }
  });

  it('a wavering character is warned about first; their betrayal cannot arrive the same morning', () => {
    const s = morning();
    s.characters.piek.loyalty = TURN_BELOW - 5; // already turning
    const t = prepareDay(s);
    expect(t.flags['charWarned:piek']).toBe(t.day);
    expect(t.todayDeck).not.toContain(betrayalId('piek'));
    const warn = buildBriefing(t).items.find((i) => i.source === 'Orlan Piek');
    expect(warn?.kind).toBe('warning');
    expect(warn?.text).toMatch(/embassy dinners/);

    const u = next(t);
    expect(u.todayDeck).toContain(betrayalId('piek'));
  });

  it('a character who only wavers is warned, but not betrayed', () => {
    const s = morning();
    s.characters.grebs.loyalty = WARN_BELOW - 3;
    let t = prepareDay(s);
    t = next(next(t));
    expect(t.flags['charWarned:grebs']).toBeDefined();
    expect(t.seenOnce).not.toContain(betrayalId('grebs'));
    expect(t.queued.some((q) => q.cardId === betrayalId('grebs'))).toBe(false);
    expect(t.todayDeck).not.toContain(betrayalId('grebs'));
  });

  it('a devoted character brings an offer; one event per day and never two days running', () => {
    const s = morning();
    s.characters.hess.loyalty = DEVOTED_AT + 5;
    s.characters.brask.loyalty = DEVOTED_AT + 5;
    const t = prepareDay(s);
    const offers = t.todayDeck.filter((id) => id.startsWith('char-offer-'));
    expect(offers).toHaveLength(1);
    expect(next(t).todayDeck.filter((id) => id.startsWith('char-'))).toHaveLength(0);
  });

  it('nothing before day 3, and nothing for characters out of post', () => {
    const early = morning(2);
    early.characters.hess.loyalty = 90;
    expect(prepareDay(early).todayDeck.some((id) => id.startsWith('char-'))).toBe(false);

    const gone = morning();
    gone.characters.hess.loyalty = 90;
    gone.characters.hess.inPost = false;
    expect(prepareDay(gone).todayDeck).not.toContain(offerId('hess'));
  });

  it('is reproducible from the same state', () => {
    const s = morning();
    for (const id of ['hess', 'brask', 'vask', 'loz']) s.characters[id].loyalty = 90;
    expect(prepareDay(s).todayDeck).toEqual(prepareDay(s).todayDeck);
  });
});

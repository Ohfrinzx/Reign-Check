import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { lookupCard, orderedOptions, chooseOption } from '../engine';
import { MARKS, CONSEQUENCES, DEMAND_REACTIONS } from '../content/consequences';
import { TRIGGERED_DEMANDS } from '../content/demands';
import { hasMark, markFlag, shownOptions } from '../consequences';
import type { GameState } from '../types';

/** A day-7 state sitting on the given card, ready for a decision. */
function onCard(cardId: string, marks: string[] = []): GameState {
  const s = createGame({ seed: 77, mandateId: 'accident' });
  s.day = 7;
  s.phase = 'stage';
  s.current = { cardId, isAlert: false };
  for (const m of marks) s.flags[markFlag(m)] = 3;
  return s;
}

describe('balance slice C: consequences content', () => {
  it('every mark is set by a real option and changes something later', () => {
    for (const m of MARKS) {
      expect(m.because, m.id).toMatch(/^[a-z]/);
      for (const k of m.setBy) {
        const card = lookupCard(k.card);
        expect(card, `${m.id} → ${k.card}`).toBeTruthy();
        expect(card!.options.some((o) => o.id === k.option), `${m.id} → ${k.card}/${k.option}`).toBe(true);
      }
      const reacts = CONSEQUENCES.some((c) => c.mark === m.id)
        || DEMAND_REACTIONS.some((r) => r.mark === m.id)
        || TRIGGERED_DEMANDS.some((d) => d.triggeredBy === m.id);
      expect(reacts, `${m.id} has no reaction`).toBe(true);
    }
  });

  it('every reaction points at a real mark, card and option, and is complete for its kind', () => {
    const ids = new Set(MARKS.map((m) => m.id));
    for (const c of CONSEQUENCES) {
      const where = `${c.mark} → ${c.card}/${c.option}`;
      expect(ids.has(c.mark), where).toBe(true);
      const card = lookupCard(c.card);
      expect(card, where).toBeTruthy();
      const exists = card!.options.some((o) => o.id === c.option);
      if (c.kind === 'unlock') {
        expect(exists, `${where} clashes with an existing option`).toBe(false);
        expect(c.label && c.hint && c.outcome?.text, where).toBeTruthy();
        expect(c.hint!.length, where).toBeGreaterThan(10);
      } else {
        expect(exists, where).toBe(true);
        if (c.kind === 'change') expect(c.outcome?.text, where).toBeTruthy();
        if (c.kind === 'lock') expect(c.lockedText, where).toBeTruthy();
      }
    }
  });

  it('no card can ever have every option locked, even with every mark made', () => {
    const everything = MARKS.map((m) => m.id);
    for (const cardId of new Set(CONSEQUENCES.map((c) => c.card))) {
      const s = onCard(cardId, everything);
      const usable = shownOptions(s, lookupCard(cardId)!).filter((o) => !o.enabled || o.enabled(s));
      expect(usable.length, cardId).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('balance slice C: marks change later cards', () => {
  it('a decision leaves a mark, dated, and the result says it is on the record', () => {
    const s = chooseOption(onCard('channel-seven'), 'buy');
    expect(hasMark(s, 'bought-news')).toBe(true);
    expect(s.flags[markFlag('bought-news')]).toBe(7);
    expect(s.lastOutcome?.marked?.[0]).toMatch(/^You paid Loz \$5 billion.*\(day 7\)$/);
    expect(JSON.parse(JSON.stringify(s)).flags[markFlag('bought-news')]).toBe(7);
  });

  it('without the mark nothing changes: same options, no notes', () => {
    const card = lookupCard('stairwell-question')!;
    const s = onCard('stairwell-question');
    expect(shownOptions(s, card)).toEqual(card.options);
    expect(orderedOptions(s, card).some((o) => o.because)).toBe(false);
  });

  it('unlock: a new option appears, says why, and does what it says', () => {
    const s = onCard('stairwell-question', ['bought-news']);
    const opt = orderedOptions(s, lookupCard('stairwell-question')!).find((o) => o.id === 'channel-seven-first');
    expect(opt?.because?.kind).toBe('unlock');
    expect(opt?.because?.text).toMatch(/^Because you paid Loz .*\(day 3\)$/);
    const t = chooseOption(s, 'channel-seven-first');
    expect(t.phase).toBe('resolve');
    expect(t.lastOutcome?.because?.kind).toBe('unlock');
    expect(t.hidden.scandal).toBeLessThan(s.hidden.scandal);
  });

  it('lock: the option is shown but blocked with the reason, and cannot be chosen', () => {
    const s = onCard('port-crane-deal', ['sold-port']);
    const sign = orderedOptions(s, lookupCard('port-crane-deal')!).find((o) => o.id === 'sign')!;
    expect(sign.enabled?.(s)).toBe(false);
    expect(sign.lockedText).toMatch(/^Because you sold forty per cent of the Mavro port.*: their two-page contract/);
    expect(chooseOption(s, 'sign')).toEqual(s);
  });

  it('change: the same option leads somewhere different, and the result says why', () => {
    const good = chooseOption(onCard('hadem-census', ['built-road']), 'ask');
    const bad = chooseOption(onCard('hadem-census', ['troops-hadem']), 'ask');
    expect(good.lastOutcome?.because?.text).toMatch(/built the third Hadem road/);
    expect(bad.lastOutcome?.because?.text).toMatch(/sent troops to Hadem/);
    expect(good.hidden.separatism).toBeLessThan(bad.hidden.separatism);
  });
});

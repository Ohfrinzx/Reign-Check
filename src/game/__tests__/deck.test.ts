import { describe, it, expect } from 'vitest';
import { createGame, SAVE_VERSION } from '../state';
import { applyEffects } from '../effects';
import { prepareDay, beginStages, activeCard, chooseOption, continueAfterResolve, continueAfterAlert, openShop, leaveShop, completeConfidenceVote } from '../engine';
import { makeRng } from '../rng';
import type { GameState } from '../types';

/** Play forward day by day, always taking the first available option and
 *  leaving the Back Room untouched, recording which cards were drawn. */
function playAndCount(s: GameState, days: number, cardId: string): number {
  let seen = 0;
  let guard = 0;
  const stop = s.day + days;
  while (s.day < stop && s.phase !== 'ended' && guard++ < 4000) {
    if (s.phase === 'briefing') {
      if (s.todayDeck.includes(cardId)) seen++;
      s = beginStages(s);
    } else if (s.phase === 'stage' || s.phase === 'alert') {
      const c = activeCard(s)!;
      const usable = c.options.filter((o) => !o.enabled || o.enabled(s));
      s = chooseOption(s, (usable.length ? usable : c.options)[0].id);
    } else if (s.phase === 'resolve') s = continueAfterResolve(s);
    else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
    else if (s.phase === 'vote') s = completeConfidenceVote(s);
    else if (s.phase === 'night') s = openShop(s);
    else if (s.phase === 'shop') s = leaveShop(s);
  }
  return seen;
}

describe('the run deck (§4.4)', () => {
  it('bumps SAVE_VERSION for runDeck/bannedCards', () => {
    // >= 8, not === 8: later slices (e.g. §4.5 step 2) bump it further for
    // their own fields, and this test only cares that runDeck/bannedCards
    // exist and that a save's version tracks the current one.
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(8);
    const s = createGame({ seed: 1 });
    expect(s.runDeck).toEqual([]);
    expect(s.bannedCards).toEqual([]);
    expect(s.version).toBe(SAVE_VERSION);
  });

  it('deck.add pushes ids into runDeck and deck.remove bans and clears them', () => {
    const s = createGame({ seed: 1 });
    const rng = makeRng(1);
    applyEffects(s, { deck: { add: ['sarran-file', 'sarran-file'] } }, rng, 'test');
    expect(s.runDeck).toEqual(['sarran-file', 'sarran-file']);
    expect(s.bannedCards).toEqual([]);

    applyEffects(s, { deck: { remove: ['sarran-file'] } }, rng, 'test');
    expect(s.runDeck).toEqual([]);
    expect(s.bannedCards).toEqual(['sarran-file']);

    // banning is idempotent — buying a second ban on the same id never duplicates it
    applyEffects(s, { deck: { remove: ['sarran-file'] } }, rng, 'test');
    expect(s.bannedCards).toEqual(['sarran-file']);

    // A permanent ban also wins when effects arrive in the opposite order.
    // Do not retain dead copies that can never be drawn.
    applyEffects(s, { deck: { add: ['sarran-file'] } }, rng, 'test');
    expect(s.runDeck).toEqual([]);
    expect(s.bannedCards).toEqual(['sarran-file']);
  });

  it('a card held in the run deck is drawn noticeably more often than the baseline', () => {
    // The recency gate (no repeat within 3 days, engine.ts's cardWeight()) puts
    // a hard ceiling on how often ANY card can appear — about once every 4
    // days, ~5 times in an 18-day run — so the run deck cannot make a card
    // show up constantly, only push it toward that ceiling more reliably than
    // an unboosted draw does. That is the intended shape, not a bug: see
    // ground rule 9's sibling concern, variety.test.ts's 4-day floor.
    const cardId = 'sarran-file'; // repeatable (not `once`), positive base weight
    let baseline = 0;
    let boosted = 0;
    let boostedAtLeastAsOften = 0;
    for (let seed = 0; seed < 12; seed++) {
      const b = playAndCount(prepareDay(createGame({ seed })), 18, cardId);

      const s = createGame({ seed });
      s.runDeck = [cardId, cardId, cardId];
      const boostedCount = playAndCount(prepareDay(s), 18, cardId);

      baseline += b;
      boosted += boostedCount;
      if (boostedCount >= b) boostedAtLeastAsOften++;
    }
    // a real, non-trivial lift in total appearances across seeds...
    expect(boosted).toBeGreaterThan(baseline);
    expect(boosted - baseline).toBeGreaterThanOrEqual(6);
    // ...and the boost helps (or at worst does not hurt) almost every seed
    expect(boostedAtLeastAsOften).toBeGreaterThanOrEqual(10);
  });

  it('a banned card never appears in the weighted draw again', () => {
    const cardId = 'channel-seven';
    for (let seed = 0; seed < 8; seed++) {
      const s = createGame({ seed });
      s.bannedCards = [cardId];
      const seen = playAndCount(prepareDay(s), 18, cardId);
      expect(seen).toBe(0);
    }
  });

  it('banning wins over holding copies of the same card', () => {
    const cardId = 'doran-warning';
    for (let seed = 0; seed < 6; seed++) {
      const s = createGame({ seed });
      s.runDeck = [cardId, cardId, cardId];
      s.bannedCards = [cardId];
      const seen = playAndCount(prepareDay(s), 18, cardId);
      expect(seen).toBe(0);
    }
  });
});

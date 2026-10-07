import { describe, expect, it } from 'vitest';
import * as A from '../minigames/ambassador';
import { makeRng } from '../rng';

/** The Ambassador's Table (mini-games slice 3, part B): the rules and the balance. */

const SEEDS = (n: number, salt = 0) => Array.from({ length: n }, (_, i) => i * 37 + 11 + salt);

/** A small dinner for the rule tests: his ask $480, his floor $430. */
function dinner(over: Partial<A.AmbassadorSetup> = {}, d: Partial<A.AmbassadorDifficulty> = {}): A.AmbassadorState {
  return A.ambassadorStart({
    seed: 1,
    d: { ...A.ambassadorDifficulty(1), ...d },
    ask: 480, floor: 430, temper: 'vain', frozen: null, bluff: null, soft: [0, 0, 0, 0, 0],
    ...over,
  });
}

/* ------------------------------------------------ simulated players */

type Maker = (seed: number) => A.AmbassadorPolicy;

/**
 * A person who pushes while he looks relaxed: the second-lowest or the
 * lowest price (half and half), a small push when he is irritated, his price
 * when he is about to stand. Reads all three tells (believing the middle
 * one) only `1 − faceOnly` of the time; the rest of the time glances at the
 * face alone, as people do. Sometimes says the wrong line (`sloppy`).
 */
function reader(faceOnly: number, sloppy: number): Maker {
  return (seed) => {
    const rng = makeRng(seed * 31 + 7);
    return (v) => {
      const line = rng.chance(sloppy) ? rng.pick(A.LINES) : A.chooseLine(v.history, v.round <= 2);
      if (v.round >= A.ROUNDS) return { offer: A.OFFER_COUNT - 1, line };
      const level = rng.chance(faceOnly) ? v.tells.face.level : A.consensusLevel(v.tells);
      if (level === 2) return { offer: rng.chance(0.5) ? 0 : 1, line };
      if (level === 1) return { offer: 3, line };
      return { offer: A.OFFER_COUNT - 1, line };
    };
  };
}
const PLAYERS: Record<string, Maker> = {
  // reads all three tells, learns the line he likes, bids as boldly as is safe
  expert: () => A.EXPERT,
  // a person reading all three tells most of the time
  careful: reader(0.4, 0),
  // a person glancing at the face most of the time, sometimes saying the wrong line
  reader: reader(0.6, 0.2),
  // always the lowest price, always "Stand firm"
  greedy: () => () => ({ offer: 0, line: 'firm' }),
  // a mild offer first, then his price
  timid: () => (v) => (v.round === 1 ? { offer: 3, line: 'flatter' } : { offer: A.OFFER_COUNT - 1, line: A.chooseLine(v.history, false) }),
  // his price straight away
  caves: () => () => ({ offer: A.OFFER_COUNT - 1, line: 'flatter' }),
};

interface Result { win: number; score: number; walked: number; dessert: number; rounds: number }
function play(act: number, make: Maker, n = 600, salt = 0): Result {
  const d = A.ambassadorDifficulty(act);
  let won = 0; let score = 0; let walked = 0; let dessert = 0; let rounds = 0;
  for (const seed of SEEDS(n, salt)) {
    const s = A.ambassadorPlay(A.ambassadorSetup(seed, d), make(seed));
    if (s.over === 'won') { won++; score += A.ambassadorScore(s); rounds += s.round; }
    else if (s.over === 'walked') walked++;
    else dessert++;
  }
  return { win: won / n, score: won ? score / won : 0, walked: walked / n, dessert: dessert / n, rounds: won ? rounds / won : 0 };
}

describe("The Ambassador's Table (rules)", () => {
  it('the same seed lays out the same dinner; another seed a different one', () => {
    for (const act of [1, 2, 3]) {
      const d = A.ambassadorDifficulty(act);
      expect(A.ambassadorSetup(42, d)).toEqual(A.ambassadorSetup(42, d));
      expect(A.ambassadorSetup(42, d)).not.toEqual(A.ambassadorSetup(43, d));
    }
  });

  it('every dinner: his ask is $430–$500 in $5 steps, his floor under it by the act\'s gap, and the noise is the act\'s', () => {
    for (const act of [1, 2, 3]) {
      const d = A.ambassadorDifficulty(act);
      for (const seed of SEEDS(200)) {
        const s = A.ambassadorSetup(seed, d);
        expect(s.ask).toBeGreaterThanOrEqual(430);
        expect(s.ask).toBeLessThanOrEqual(500);
        expect(s.ask % 5).toBe(0);
        expect(s.ask - s.floor).toBeGreaterThanOrEqual(d.slack[0]);
        expect(s.ask - s.floor).toBeLessThanOrEqual(d.slack[1]);
        expect(s.floor % 5).toBe(0);
        expect(A.TEMPERS).toContain(s.temper);
        expect(s.soft).toHaveLength(A.ROUNDS);
        expect(s.soft.every((x) => x === 0 || x === 5)).toBe(true);
        // act 1: honest tells; act 2: one frozen; act 3: one bluffs
        expect(s.frozen !== null).toBe(act === 2);
        expect(s.bluff !== null).toBe(act === 3);
      }
    }
  });

  it('five offers, $20 apart, the top one his price', () => {
    const s = dinner();
    expect(A.offerPrices(s)).toEqual([400, 420, 440, 460, 480]);
    const later = { ...s, price: 455 };
    expect(A.offerPrices(later)).toEqual([375, 395, 415, 435, 455]);
  });

  it('an offer at or above his floor is accepted: the dinner ends at that price', () => {
    let s = A.ambassadorOffer(dinner(), 1, 'flatter'); // $420, floor $430: refused
    expect(s.over).toBeUndefined();
    s = A.ambassadorOffer(dinner({ floor: 440 }), 2, 'flatter'); // $440 = the floor
    expect(s.over).toBe('won');
    expect(s.deal).toBe(440);
    expect(A.ambassadorScore(s)).toBe(100);
    s = A.ambassadorOffer(dinner({ floor: 400 }), 0, 'flatter'); // $400 = the floor, the lowest offer
    expect(s.over).toBe('won');
    expect(s.deal).toBe(400);
    // his own price is always accepted, whatever the patience
    for (const patience of [100, 60, 30, 1]) {
      const d = { ...dinner(), patience };
      expect(A.ambassadorOffer(d, A.OFFER_COUNT - 1, 'firm').over).toBe('won');
    }
    // a signed dinner stays signed
    const done = A.ambassadorOffer(dinner(), 4, 'firm');
    expect(A.ambassadorOffer(done, 0, 'firm')).toBe(done);
  });

  it('refused: he gives 1/giveBy of the way to your offer (never under his floor), the round moves on, patience drops', () => {
    const d = A.ambassadorDifficulty(1); // annoy 6, hit 10, giveBy 4
    // $400 offered, floor $430, price $480: the offer is $80 under his price and $30 under his floor
    let s = A.ambassadorOffer(dinner(), 0, 'firm'); // vain: Stand firm is +4
    const log = s.log[0];
    expect(log.verdict).toBe('counter');
    expect(log.counter).toBe(480 - 20); // a quarter of $80
    expect(s.price).toBe(460);
    expect(s.round).toBe(2);
    // 6 + 10 × (30/20) = 21 lost, +4 for a line he likes a little
    expect(s.patience).toBe(100 - 21 + 4);
    expect(d.annoy + (d.hit * 30) / A.OFFER_STEP).toBe(21);
    // never below his floor
    s = A.ambassadorOffer(dinner({ floor: 475 }), 0, 'firm');
    expect(s.price).toBe(475);
    s = A.ambassadorOffer(s, 0, 'firm'); // now his price is his floor: nothing more to give
    expect(s.price).toBe(475);
    // the soft rounds give $5 more
    s = A.ambassadorOffer(dinner({ soft: [5, 0, 0, 0, 0] }), 0, 'firm');
    expect(s.price).toBe(455);
  });

  it('the lines: each temper likes one line a lot, one a little, and dislikes two; every temper has all four', () => {
    for (const temper of A.TEMPERS) {
      const effects = A.LINES.map((l) => A.LINE_EFFECT[temper][l]).sort((a, b) => b - a);
      expect(effects).toEqual([12, 4, -6, -12]);
    }
    const seen = new Set<A.Reaction>();
    for (const l of A.LINES) {
      const s = A.ambassadorOffer(dinner({ temper: 'proud' }), 0, l);
      seen.add(s.log[0].reaction);
    }
    expect([...seen].sort()).toEqual(['cool', 'delighted', 'offended', 'pleased']);
    // a liked line wins patience back; a disliked one costs it (same offer, same refusal)
    const liked = A.ambassadorOffer(dinner({ temper: 'proud' }), 0, 'history');
    const hated = A.ambassadorOffer(dinner({ temper: 'proud' }), 0, 'firm');
    expect(liked.patience - hated.patience).toBe(24);
    // in act 3 a line lands half as hard again
    const act3 = A.ambassadorOffer(dinner({ temper: 'proud' }, A.ambassadorDifficulty(3)), 0, 'history');
    expect(act3.log[0].reaction).toBe('delighted');
  });

  it('empty patience: he walks out and the dinner is lost; refused at dessert is lost', () => {
    let s = { ...dinner(), patience: 10 };
    s = A.ambassadorOffer(s, 0, 'threaten'); // a big insult with a line he hates
    expect(s.over).toBe('walked');
    expect(s.patience).toBe(0);
    expect(s.log[0].verdict).toBe('walkout');
    expect(A.ambassadorScore(s)).toBe(0);
    // no deal by dessert
    let d = { ...dinner({ floor: 445 }, { annoy: 0, hit: 0 }), round: 5, price: 450 };
    d = A.ambassadorOffer(d, 0, 'flatter');
    expect(d.over).toBe('dessert');
    expect(d.log[0].verdict).toBe('dessert');
    // sitting through the five courses and saying nothing loses, every time
    for (const act of [1, 2, 3]) {
      for (const seed of SEEDS(40)) {
        const end = A.ambassadorPlay(A.ambassadorSetup(seed, A.ambassadorDifficulty(act)), null);
        expect(end.over).toBe('dessert');
        expect(A.ambassadorScore(end)).toBe(0);
      }
    }
  });

  it('the score: 100 at his floor, 0 at his opening ask, in between by how far you took him', () => {
    const won = (deal: number) => ({ ...dinner(), over: 'won' as const, deal });
    expect(A.ambassadorScore(won(430))).toBe(100);
    expect(A.ambassadorScore(won(480))).toBe(0);
    expect(A.ambassadorScore(won(455))).toBe(50);
    expect(A.ambassadorScore(won(440))).toBe(80);
    expect(A.ambassadorScore(won(435))).toBe(90);
    // a better price is never a worse score
    let prev = -1;
    for (let p = 480; p >= 430; p -= 5) {
      const sc = A.ambassadorScore(won(p));
      expect(sc).toBeGreaterThanOrEqual(prev);
      prev = sc;
    }
  });

  it('the same moves give the same dinner', () => {
    const setup = A.ambassadorSetup(9, A.ambassadorDifficulty(2));
    const p = reader(0.6, 0.2)(9);
    expect(A.ambassadorPlay(setup, p)).toEqual(A.ambassadorPlay(setup, reader(0.6, 0.2)(9)));
    const a = A.ambassadorOffer(A.ambassadorOffer(A.ambassadorStart(setup), 0, 'flatter'), 1, 'history');
    const b = A.ambassadorOffer(A.ambassadorOffer(A.ambassadorStart(setup), 0, 'flatter'), 1, 'history');
    expect(a).toEqual(b);
    // moves never change the state they were given
    const start = A.ambassadorStart(setup);
    const frozen = JSON.stringify(start);
    A.ambassadorOffer(start, 0, 'firm');
    expect(JSON.stringify(start)).toBe(frozen);
  });
});

describe("The Ambassador's Table (the tells)", () => {
  it('his patience shows as three states: 60+ relaxed, 30–59 irritated, 1–29 about to stand', () => {
    expect(A.levelOf(100)).toBe(2);
    expect(A.levelOf(60)).toBe(2);
    expect(A.levelOf(59)).toBe(1);
    expect(A.levelOf(30)).toBe(1);
    expect(A.levelOf(29)).toBe(0);
    expect(A.levelOf(1)).toBe(0);
    // act 1: the face, the glass and the notes always agree, and always say the truth
    for (let p = 1; p <= 100; p++) {
      const t = A.readTells({ ...dinner(), patience: p });
      expect(t.face.level).toBe(A.levelOf(p));
      expect(t.glass.level).toBe(A.levelOf(p));
      expect(t.notes.level).toBe(A.levelOf(p));
    }
  });

  it('act 2: one tell is frozen at relaxed all night; the other two tell the truth', () => {
    for (const frozen of A.TELLS) {
      for (const p of [100, 70, 45, 10]) {
        const t = A.readTells({ ...dinner({ frozen }), patience: p });
        for (const id of A.TELLS) {
          if (id === frozen) { expect(t[id].level).toBe(2); expect(t[id].frozen).toBe(true); }
          else { expect(t[id].level).toBe(A.levelOf(p)); expect(t[id].frozen).toBeUndefined(); }
        }
      }
    }
  });

  it('act 3: one tell shows one level too calm (never above relaxed); the other two tell the truth', () => {
    for (const bluff of A.TELLS) {
      for (const p of [100, 70, 45, 10]) {
        const t = A.readTells({ ...dinner({ bluff }), patience: p });
        const truth = A.levelOf(p);
        for (const id of A.TELLS) expect(t[id].level).toBe(id === bluff ? Math.min(2, truth + 1) : truth);
      }
    }
  });

  it('in every act, the middle tell of the three is the truth: "believe the two that agree" always works', () => {
    for (const act of [1, 2, 3]) {
      for (const seed of SEEDS(60)) {
        const setup = A.ambassadorSetup(seed, A.ambassadorDifficulty(act));
        for (const p of [100, 80, 60, 59, 45, 30, 29, 12, 1]) {
          const t = A.readTells({ ...A.ambassadorStart(setup), patience: p });
          expect(A.consensusLevel(t)).toBe(A.levelOf(p));
        }
      }
    }
  });

  it('the tells depend only on his patience (the same patience, the same picture)', () => {
    const setup = A.ambassadorSetup(5, A.ambassadorDifficulty(3));
    const a = A.readTells({ ...A.ambassadorStart(setup), patience: 47 });
    const b = A.readTells({ ...A.ambassadorStart(setup), patience: 47, round: 4, price: 450 });
    expect(a).toEqual(b);
  });
});

describe("The Ambassador's Table (the dinner and the balance)", () => {
  it('harder each act: a tighter gap, a shorter fuse, lines that land harder, noisier tells', () => {
    const [a1, a2, a3] = [1, 2, 3].map(A.ambassadorDifficulty);
    expect(a1.slack[1]).toBeGreaterThan(a2.slack[1]);
    expect(a2.slack[1]).toBeGreaterThan(a3.slack[1]);
    expect(a1.annoy).toBeLessThan(a2.annoy);
    expect(a2.annoy).toBeLessThan(a3.annoy);
    expect(a1.hit).toBeLessThan(a2.hit);
    expect(a2.hit).toBeLessThan(a3.hit);
    expect(a1.lineScale).toBeLessThan(a2.lineScale);
    expect(a2.lineScale).toBeLessThan(a3.lineScale);
    expect(a1.startPatience).toBeGreaterThan(a3.startPatience);
    expect([a1.noise, a2.noise, a3.noise]).toEqual(['none', 'frozen', 'bluff']);
    expect(A.ambassadorDifficulty(0).act).toBe(1);
    expect(A.ambassadorDifficulty(9).act).toBe(3);
  });

  it('a careful player never loses: every dinner, every act, is closed by the player who reads the tells', () => {
    for (const act of [1, 2, 3]) {
      const d = A.ambassadorDifficulty(act);
      for (const seed of SEEDS(1500, 2)) {
        const s = A.ambassadorPlay(A.ambassadorSetup(seed, d), A.EXPERT);
        expect(s.over).toBe('won');
        expect(A.ambassadorScore(s)).toBeGreaterThan(0);
      }
    }
  });

  it('why: from "relaxed" the bolder offer cannot take all his patience; from "irritated" he is never asked for more than he has; his price is always there', () => {
    for (const act of [1, 2, 3]) {
      const d = A.ambassadorDifficulty(act);
      for (const seed of SEEDS(300, 4)) {
        let s = A.ambassadorStart(A.ambassadorSetup(seed, d));
        while (!s.over) {
          const m = A.EXPERT(A.ambassadorView(s), d);
          s = A.ambassadorOffer(s, m.offer, m.line);
          // he never walks out on the careful player, and on the last course the careful player takes his price
          expect(s.over).not.toBe('walked');
          expect(s.over).not.toBe('dessert');
          if (!s.over) expect(s.patience).toBeGreaterThan(0);
        }
      }
    }
  });

  it('the dinners are laid out as they come: the careful player closes the first layout (no re-laying out was needed in any of these seeds)', () => {
    for (const act of [1, 2, 3]) {
      const d = A.ambassadorDifficulty(act);
      let again = 0;
      for (const seed of SEEDS(1500, 6)) {
        if (A.ambassadorPlay(A.layoutDinner(seed, d, 0), A.EXPERT).over !== 'won') again++;
      }
      expect(again).toBe(0);
    }
  });

  it('simulated players by skill (win rate / average score / how it ended)', () => {
    const table: Record<string, Result[]> = {};
    for (const [name, make] of Object.entries(PLAYERS)) table[name] = [1, 2, 3].map((act) => play(act, make));
    // eslint-disable-next-line no-console
    console.log(`The Ambassador's Table, acts 1 / 2 / 3 (600 dinners each): win% / average score of the wins / walked out%\n${Object.entries(table)
      .map(([n, r]) => `  ${n.padEnd(8)} ${r.map((x) => `${String(Math.round(x.win * 100)).padStart(3)}% / ${String(Math.round(x.score)).padStart(3)} / ${String(Math.round(x.walked * 100)).padStart(3)}%`).join('   ')}`).join('\n')}`);
    const within = (x: number, lo: number, hi: number) => {
      expect(x).toBeGreaterThanOrEqual(lo);
      expect(x).toBeLessThanOrEqual(hi);
    };
    const win = (n: string) => table[n].map((r) => r.win);
    // the careful player closes every dinner
    expect(win('expert')).toEqual([1, 1, 1]);
    // a person reading the tells: ~100% in act 1, 75–90% in act 2, 60–75% in act 3
    within(win('reader')[0], 0.95, 1);
    within(win('reader')[1], 0.7, 0.9);
    within(win('reader')[2], 0.55, 0.78);
    within(win('careful')[0], 0.97, 1);
    within(win('careful')[1], 0.8, 0.96);
    within(win('careful')[2], 0.7, 0.92);
    for (let a = 0; a < 3; a++) expect(win('careful')[a]).toBeGreaterThanOrEqual(win('reader')[a]);
    // harder each act, for a person
    expect(win('reader')[1]).toBeLessThan(win('reader')[0]);
    expect(win('reader')[2]).toBeLessThan(win('reader')[1]);
    // a greedy player is clearly worse: he walks out
    within(win('greedy')[0], 0, 0.3);
    within(win('greedy')[1], 0, 0.05);
    within(win('greedy')[2], 0, 0.05);
    for (let a = 0; a < 3; a++) {
      expect(table.greedy[a].walked).toBeGreaterThan(0.7);
      expect(win('greedy')[a]).toBeLessThan(win('reader')[a] - 0.25);
    }
    // a timid player who caves wins, but with a low score
    for (let a = 0; a < 3; a++) {
      expect(win('timid')[a]).toBeGreaterThanOrEqual(0.97);
      within(table.timid[a].score, 20, 60);
      expect(table.timid[a].score).toBeLessThan(table.reader[a].score - 30);
      expect(table.caves[a].score).toBe(0);
      expect(table.expert[a].score).toBeGreaterThan(table.timid[a].score);
    }
    // the careful player's average score is high
    expect(table.expert[0].score).toBeGreaterThan(90);
    expect(table.expert[1].score).toBeGreaterThan(80);
    expect(table.expert[2].score).toBeGreaterThan(65);
    // a dinner lasts a few courses, not one
    expect(table.reader[0].rounds).toBeGreaterThan(2.5);
  });

  it('laying out a dinner is quick', () => {
    const t0 = Date.now();
    for (const act of [1, 2, 3]) for (const seed of SEEDS(200, 9)) A.ambassadorSetup(seed, A.ambassadorDifficulty(act));
    expect((Date.now() - t0) / 600).toBeLessThan(5);
  });

  it('chooseLine tries each line once, then keeps the best one he liked', () => {
    expect(A.chooseLine([])).toBe('flatter');
    const h = (line: A.LineId, reaction: A.Reaction): A.RoundLog => ({ round: 1, offer: 400, line, verdict: 'counter', reaction });
    expect(A.chooseLine([h('flatter', 'offended')])).toBe('history');
    expect(A.chooseLine([h('flatter', 'offended'), h('history', 'cool')])).toBe('firm');
    expect(A.chooseLine([h('flatter', 'pleased'), h('history', 'delighted')])).toBe('history');
    expect(A.chooseLine([h('flatter', 'pleased')], false)).toBe('flatter');
  });
});

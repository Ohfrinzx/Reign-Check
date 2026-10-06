import { describe, expect, it } from 'vitest';
import * as B from '../minigames/budget';

/** Budget Night (mini-games slice 3, part A): the rules and the balance. */

const SEEDS = (n: number, salt = 0) => Array.from({ length: n }, (_, i) => i * 37 + 11 + salt);

/** A small evening for the rule tests: no events unless given. */
function evening(over: Partial<B.BudgetSetup> = {}, d: Partial<B.BudgetDifficulty> = {}): B.BudgetState {
  return B.budgetStart({
    seed: 1,
    d: { ...B.budgetDifficulty(1), ...d },
    lines: [5, 5, 5, 5, 5],
    money: [5, 5, 5, 5, 5],
    pot: 28,
    events: [],
    ...over,
  });
}
const total = (s: B.BudgetState) => s.jars.reduce((a, j) => a + j.money, 0) + B.unspent(s);

/** Simulated players, by skill. Reaction = from a change to the first tap. */
const PLAYERS: Record<string, B.BudgetPlayer | null> = {
  // reacts within ~1.5 s, reads the slips and pays a rise early, rarely picks the wrong jar
  attentive: { reactMs: 1500, tapMs: 250, preload: true, mistake: 0.05 },
  // ~3 s, waits for the line to move, sometimes the wrong jar
  average: { reactMs: 3000, tapMs: 350, preload: false, mistake: 0.2 },
  // ~5 s, slow taps, often the wrong jar
  slow: { reactMs: 5000, tapMs: 500, preload: false, mistake: 0.3 },
  idle: null,
};

function winRate(act: number, player: B.BudgetPlayer | null, n = 150): number {
  const d = B.budgetDifficulty(act);
  let won = 0;
  SEEDS(n).forEach((seed, i) => {
    if (B.budgetPlay(B.budgetSetup(seed, d), player ? { ...player, seed: i } : null).over === 'won') won++;
  });
  return won / n;
}

describe('Budget Night (rules)', () => {
  it('the same seed gives the same evening; another seed a different one', () => {
    for (const act of [1, 2, 3]) {
      const d = B.budgetDifficulty(act);
      expect(B.budgetSetup(42, d)).toEqual(B.budgetSetup(42, d));
      expect(B.budgetSetup(42, d)).not.toEqual(B.budgetSetup(43, d));
    }
  });

  it('the same taps at the same moments give the same result', () => {
    const setup = B.budgetSetup(9, B.budgetDifficulty(2));
    const p = { ...PLAYERS.average!, seed: 3 };
    expect(B.budgetPlay(setup, p)).toEqual(B.budgetPlay(setup, p));
    // by hand, in uneven chunks: the steps are fixed, so chunking does not matter
    const run = (chunks: number[]) => {
      let s = B.budgetStart(setup);
      for (const ms of chunks) { s = B.budgetTick(s, ms); s = B.budgetMove(s, 0, 1); }
      return s;
    };
    const a = run([1000, 1000, 1000]);
    let b = B.budgetStart(setup);
    b = B.budgetTickTo(b, 1050); b = B.budgetMove(b, 0, 1);
    b = B.budgetTickTo(b, 2099); b = B.budgetMove(b, 0, 1);
    b = B.budgetTickTo(b, 3000); b = B.budgetMove(b, 0, 1);
    expect(b).toEqual(a);
  });

  it('Brask\'s draft: lines leave the spare money unspent, and one jar starts short', () => {
    for (const act of [1, 2, 3]) {
      const d = B.budgetDifficulty(act);
      for (const seed of SEEDS(60)) {
        const st = B.budgetSetup(seed, d);
        expect(st.lines.reduce((a, b) => a + b, 0)).toBe(d.pot - d.spare);
        expect(st.money.reduce((a, b) => a + b, 0)).toBe(d.pot - d.spare);
        expect(st.lines.filter((l, i) => st.money[i] < l)).toHaveLength(1);
        expect(st.lines.every((l) => l >= 3 && l <= 9)).toBe(true);
      }
    }
  });

  it('+ and − move $1B between the unspent money and a jar; the budget is conserved', () => {
    let s = evening(); // 25 in the jars, 3 unspent
    expect(B.unspent(s)).toBe(3);
    s = B.budgetMove(s, 2, 1);
    expect(s.jars[2].money).toBe(6);
    expect(B.unspent(s)).toBe(2);
    s = B.budgetMove(s, 4, -1);
    expect(s.jars[4].money).toBe(4);
    expect(B.unspent(s)).toBe(3);
    expect(total(s)).toBe(28);
    expect(s.moved).toBe(2);
    // nothing unspent: + does nothing; an empty jar: − does nothing
    for (let i = 0; i < 3; i++) s = B.budgetMove(s, 0, 1);
    expect(B.unspent(s)).toBe(0);
    expect(B.budgetMove(s, 1, 1)).toBe(s);
    let e = evening({ money: [0, 5, 5, 5, 5] });
    expect(B.budgetMove(e, 0, -1)).toBe(e);
    // a jar holds at most JAR_CAP
    e = evening({ money: [B.JAR_CAP, 0, 0, 0, 0], pot: 28 });
    expect(B.canPut(e, 0)).toBe(false);
  });

  it('a jar below its line loses patience; at its line or above, it slowly comes back', () => {
    const d = B.budgetDifficulty(1);
    let s = evening({ money: [3, 5, 5, 5, 7] });
    s = B.budgetTick(s, 2000);
    expect(s.jars[0].patience).toBeCloseTo(100 - 2 * d.drain, 5);
    expect(s.jars[0].shortMs).toBe(2000);
    expect(s.jars[1].patience).toBe(100);
    // fill it: patience recovers at the slow rate
    s = B.budgetMove(B.budgetMove(s, 0, 1), 0, 1);
    s = B.budgetTick(s, 2000);
    expect(s.jars[0].patience).toBeCloseTo(100 - 2 * d.drain + 2 * d.recover, 5);
  });

  it('empty patience: the faction walks out, its jar is sealed with its money; one more walk-out loses', () => {
    const d = B.budgetDifficulty(1);
    let s = evening({ money: [2, 5, 5, 5, 5] });
    s = B.budgetTick(s, Math.ceil(100 / d.drain) * 1000 + 200);
    expect(s.jars[0].out).toBe(true);
    expect(s.walkouts).toBe(1);
    expect(s.over).toBeUndefined();
    expect(s.log.some((l) => l.kind === 'walk' && l.jar === 0)).toBe(true);
    expect(s.jars[0].money).toBe(2);
    expect(B.canPut(s, 0) || B.canTake(s, 0)).toBe(false);
    expect(B.budgetMove(s, 0, 1)).toBe(s);
    // a second faction short: it walks out too, and the evening is lost at once
    s = B.budgetMove(s, 1, -1);
    s = B.budgetTick(s, Math.ceil(100 / d.drain) * 1000 + 200);
    expect(s.walkouts).toBe(2);
    expect(s.over).toBe('lost');
    expect(s.t).toBeLessThan(d.durationMs);
  });

  it('reaching 20:00 with no more than one walk-out wins; the clock runs 18:30 → 20:00', () => {
    const s = B.budgetTick(evening(), 90000);
    expect(s.over).toBe('won');
    expect(B.budgetScore(s)).toBe(100);
    expect(B.budgetClock(0)).toBe('18:30');
    expect(B.budgetClock(29999)).toBe('18:59');
    expect(B.budgetClock(30000)).toBe('19:00');
    expect(B.budgetClock(90000)).toBe('20:00');
  });

  it('events: a slip shows ahead; lines move; a cut comes out of the unspent money, then money above a line, then the fullest jar', () => {
    const events: B.BudgetEvent[] = [
      { id: 0, at: 5000, kind: 'up', jar: 1, amount: 2, why: 'overtime' },
      { id: 1, at: 10000, kind: 'down', jar: 2, amount: 3, why: 'settles for less' },
      { id: 2, at: 15000, kind: 'cut', jar: -1, amount: 5, why: 'Aid is late' },
      { id: 3, at: 20000, kind: 'add', jar: -1, amount: 4, why: 'Customs windfall' },
    ];
    const d = B.budgetDifficulty(1);
    let s = evening({ events, money: [5, 5, 5, 5, 6] }, { drain: 1 }); // 26 in jars, 2 unspent
    s = B.budgetTick(s, 5000 - d.leadMs - 100);
    expect(B.announced(s)).toHaveLength(0);
    s = B.budgetTick(s, 100);
    expect(B.announced(s).map((e) => e.id)).toEqual([0]);
    s = B.budgetTickTo(s, 5000);
    expect(s.jars[1].line).toBe(7);
    expect(B.announced(s).map((e) => e.id)).toEqual([]);
    s = B.budgetTickTo(s, 10000);
    expect(s.jars[2].line).toBe(2);
    // the $5B cut: the $2B unspent, then $3B from above the lines, the biggest
    // surplus first (the Elites have $3B above theirs, the Street $1B)
    s = B.budgetTickTo(s, 15000);
    expect(s.pot).toBe(23);
    expect(B.unspent(s)).toBe(0);
    const cut = s.log.find((l) => l.id === 2)!;
    expect(cut.took).toEqual([0, 0, 3, 0, 0]);
    expect(s.jars[2].money).toBe(2);
    expect(s.jars[4].money).toBe(6);
    expect(total(s)).toBe(23);
    s = B.budgetTickTo(s, 20000);
    expect(s.pot).toBe(27);
    expect(B.unspent(s)).toBe(4);
    // with nothing above a line left, Brask takes from the fullest jar
    let f = evening({ money: [5, 5, 9, 5, 5], lines: [5, 5, 9, 5, 5], pot: 29, events: [{ id: 0, at: 1000, kind: 'cut', jar: -1, amount: 2, why: '' }] });
    f = B.budgetTickTo(f, 1000);
    expect(f.log[0].took).toEqual([0, 0, 2, 0, 0]);
    expect(f.jars[2].money).toBe(7);
  });

  it('an event aimed at a faction that walked out lands on the next one along', () => {
    let s = evening({ events: [{ id: 0, at: 12000, kind: 'up', jar: 0, amount: 2, why: '' }], money: [1, 5, 5, 5, 5] });
    s = B.budgetTickTo(s, 11000);
    expect(s.jars[0].out).toBe(true);
    expect(B.eventTarget(s, s.setup.events[0])).toBe(1);
    s = B.budgetTickTo(s, 12000);
    expect(s.jars[1].line).toBe(7);
    expect(s.jars[0].line).toBe(5);
  });

  it('score: 85 or more only with nobody walking out', () => {
    for (const act of [1, 3]) {
      for (const seed of SEEDS(40)) {
        const s = B.budgetPlay(B.budgetSetup(seed, B.budgetDifficulty(act)), { ...PLAYERS.average!, seed });
        const sc = B.budgetScore(s);
        expect(sc).toBeGreaterThanOrEqual(0);
        expect(sc).toBeLessThanOrEqual(100);
        if (sc >= 85) expect(s.walkouts).toBe(0);
        if (s.over === 'lost') expect(sc).toBeLessThanOrEqual(40);
      }
    }
  });
});

describe('Budget Night (the evening and the balance)', () => {
  it('events every ~6–12 s, the first within ~8 s, and the lines go above the pot at least once', () => {
    for (const act of [1, 2, 3]) {
      const d = B.budgetDifficulty(act);
      for (const seed of SEEDS(100)) {
        const st = B.budgetSetup(seed, d);
        const at = st.events.map((e) => e.at);
        expect(at[0]).toBeLessThanOrEqual(8000);
        expect(at[at.length - 1]).toBeGreaterThan(d.durationMs - 16000);
        for (let i = 1; i < at.length; i++) {
          expect(at[i]).toBeGreaterThan(at[i - 1]);
          expect(at[i] - at[i - 1]).toBeLessThanOrEqual(12000);
        }
        // a squeeze: at some point the lines need more than there is
        const lines = st.lines.slice();
        let pot = st.pot;
        let squeezed = false;
        for (const e of st.events) {
          if (e.kind === 'up') lines[e.jar] += e.amount;
          if (e.kind === 'down') lines[e.jar] -= e.amount;
          if (e.kind === 'cut') pot -= e.amount;
          if (e.kind === 'add') pot += e.amount;
          if (lines.reduce((a, b) => a + b, 0) > pot) squeezed = true;
          expect(lines.every((l) => l >= 2 && l <= 11)).toBe(true);
        }
        expect(squeezed).toBe(true);
      }
    }
  });

  it('doing nothing always loses (every seed, every act)', () => {
    for (const act of [1, 2, 3]) {
      const d = B.budgetDifficulty(act);
      for (const seed of SEEDS(300, 1)) expect(B.budgetPlay(B.budgetSetup(seed, d), null).over).toBe('lost');
    }
  });

  it('a quick, careful player never loses: every evening is winnable', () => {
    for (const act of [1, 2, 3]) {
      const d = B.budgetDifficulty(act);
      for (const seed of SEEDS(300, 2)) expect(B.budgetPlay(B.budgetSetup(seed, d), B.EXPERT).over).toBe('won');
    }
  });

  it('simulated players by skill: attentive wins nearly always in act 1 and most of the time in act 3; average and slow clearly less', () => {
    const table: Record<string, number[]> = {};
    for (const [name, p] of Object.entries(PLAYERS)) table[name] = [1, 2, 3].map((act) => winRate(act, p));
    // eslint-disable-next-line no-console
    console.log(`Budget Night win rates (acts 1/2/3, 150 seeds each):\n${Object.entries(table)
      .map(([n, r]) => `  ${n.padEnd(9)} ${r.map((x) => `${Math.round(x * 100)}%`.padStart(4)).join(' / ')}`).join('\n')}`);
    const { attentive, average, slow, idle } = table;
    expect(attentive[0]).toBeGreaterThanOrEqual(0.95);
    expect(attentive[2]).toBeGreaterThanOrEqual(0.7);
    expect(attentive[2]).toBeLessThanOrEqual(0.9);
    for (let a = 0; a < 3; a++) {
      expect(average[a]).toBeLessThan(attentive[a] - 0.1);
      expect(slow[a]).toBeLessThan(average[a]);
      expect(idle[a]).toBe(0);
    }
    // harder each act
    expect(average[2]).toBeLessThan(average[0]);
    expect(attentive[2]).toBeLessThan(attentive[0]);
  });
});

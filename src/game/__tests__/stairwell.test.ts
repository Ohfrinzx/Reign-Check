import { describe, expect, it } from 'vitest';
import { makeRng } from '../rng';
import * as W from '../minigames/stairwell';

/**
 * Mini-games slice 3, part B: Who Was in the Stairwell? (rules, fairness,
 * simulated players). Every puzzle must have exactly ONE answer, found by
 * plain deduction, in every act.
 */

const seeds = (n: number, act: number) => Array.from({ length: n }, (_, i) => i * 7919 + act * 101 + 5);
const ACTS = [1, 2, 3];
const SEEDS = 320;

// the puzzles are made once per act and shared by the tests below
const made = new Map<number, W.StairwellSetup[]>();
const all = (act: number, n = SEEDS) => {
  if (!made.has(act)) {
    const d = W.stairwellDifficulty(act);
    made.set(act, seeds(400, act).map((seed) => W.stairwellSetup(seed, d)));
  }
  return made.get(act)!.slice(0, Math.max(n, 0));
};

/** Plays a puzzle through the rules: stamp, close, return the final state. */
function play(setup: W.StairwellSetup, liar: number, stairs: number): W.StairwellState {
  let s = W.stairwellStart();
  s = W.stampFile(s, 'liar', liar);
  s = W.stampFile(s, 'stairs', stairs);
  return W.closeCase(setup, s);
}

describe('Who Was in the Stairwell? (the puzzle)', () => {
  it('the same seed gives the same puzzle; different seeds differ', () => {
    for (const act of ACTS) {
      const d = W.stairwellDifficulty(act);
      expect(W.stairwellSetup(42, d)).toEqual(W.stairwellSetup(42, d));
      expect(W.stairwellSetup(42, d)).not.toEqual(W.stairwellSetup(43, d));
    }
  });

  it('the maker never has to fall back: every seed gives a fair puzzle', () => {
    for (const act of ACTS) {
      for (const seed of seeds(SEEDS, act)) {
        expect(W.tryStairwell(seed, W.stairwellDifficulty(act)), `act ${act} seed ${seed}`).not.toBeNull();
      }
    }
  });

  it('every puzzle has exactly one consistent answer (300+ seeds per act)', () => {
    for (const act of ACTS) {
      for (const p of all(act)) {
        const sols = W.stairwellSolutions(p);
        expect(sols, `act ${act} seed ${p.seed}`).toEqual([{ liar: p.liar, stairs: p.stairs }]);
      }
    }
  });

  it('the answer can be reasoned out: each wrong liar breaks, and the right one names the stairwell', () => {
    for (const act of ACTS) {
      for (const p of all(act)) {
        const r = W.reasonOut(p, 1);
        expect(r.alive, `act ${act} seed ${p.seed}`).toEqual([{ liar: p.liar, stairs: p.stairs }]);
        expect(r.deadByLiar).toBe(p.files.length - 1);
      }
    }
  });

  it("the liar's statements are all false, everyone else's all true, and one person was in the stairwell", () => {
    for (const act of ACTS) {
      for (const p of all(act, 120)) {
        expect(p.world.filter((x) => x === 'stairs')).toHaveLength(1);
        expect(p.world.indexOf('stairs')).toBe(p.stairs);
        p.files.forEach((f, i) => {
          for (const l of f.lines) expect(W.stmtHolds(l.st, p.world, p.liar), `act ${act} seed ${p.seed} file ${i}: ${l.text}`).toBe(i !== p.liar);
        });
      }
    }
  });

  it('what each file says is plain typed text, built from the statements', () => {
    for (const act of ACTS) {
      for (const p of all(act, 80)) {
        const calls = p.files.map((f) => f.call);
        expect(new Set(calls).size).toBe(calls.length);
        p.files.forEach((f, i) => {
          expect(f.lines.length).toBeGreaterThanOrEqual(p.d.min);
          expect(f.lines.length).toBeLessThanOrEqual(p.d.max);
          for (const l of f.lines) {
            expect(l.text).toBe(W.say(l.st, i, calls));
            expect(l.text.length).toBeGreaterThan(8);
            expect(l.text.length).toBeLessThan(60);
            expect(l.text).toMatch(/[.]$/);
          }
          const texts = f.lines.map((l) => l.text);
          expect(new Set(texts).size).toBe(texts.length);
        });
      }
    }
  });

  it('no file argues with itself: each file could be all true, so a file never gives its writer away', () => {
    for (const act of ACTS) {
      for (const p of all(act, 150)) {
        p.files.forEach((f, i) => {
          const only = p.files.map((g, k) => (k === i ? g : { ...g, lines: [] }));
          const fits = W.stairwellSolutions({ files: only }).filter((x) => x.liar !== i);
          expect(fits.length, `act ${act} seed ${p.seed} file ${i}: ${f.lines.map((l) => l.text).join(' ')}`).toBeGreaterThan(0);
        });
      }
    }
  });

  it('says things plainly', () => {
    const calls = ['Rosk', 'Pell', 'Henn'];
    expect(W.say({ k: 'at', who: 0, place: 'archive' }, 0, calls)).toBe('I was in the archive.');
    expect(W.say({ k: 'at', who: 1, place: 'landing' }, 0, calls)).toBe('Pell was on the 3rd-floor landing.');
    expect(W.say({ k: 'notAt', who: 2, place: 'stairs' }, 0, calls)).toBe('Henn was not in the stairwell.');
    expect(W.say({ k: 'with', a: 0, b: 1 }, 0, calls)).toBe('I was with Pell.');
    expect(W.say({ k: 'with', a: 1, b: 2 }, 0, calls)).toBe('Pell and Henn were together.');
    expect(W.say({ k: 'empty', place: 'kitchen' }, 0, calls)).toBe('Nobody was in the kitchen.');
    expect(W.say({ k: 'lies', who: 2 }, 0, calls)).toBe('Henn is lying.');
    expect(W.say({ k: 'honest', who: 2 }, 1, calls)).toBe('Henn is telling the truth.');
  });

  it('difficulty grows by act: more files, more to read, accusations and a red herring later', () => {
    const stats = ACTS.map((act) => {
      const ps = all(act, 150);
      const lines = ps.map((p) => p.files.reduce((a, f) => a + f.lines.length, 0));
      const kinds = ps.flatMap((p) => p.files.flatMap((f) => f.lines.map((l) => l.st.k)));
      return {
        people: ps[0].files.length,
        lines: lines.reduce((a, b) => a + b, 0) / ps.length,
        accuse: ps.filter((p) => p.files.some((f) => f.lines.some((l) => l.st.k === 'lies' || l.st.k === 'honest'))).length / ps.length,
        extras: kinds.filter((k) => k === 'empty' || k === 'apart' || k === 'lies' || k === 'honest').length,
        herring: ps.filter((p) => p.world.some((w, i) => w === 'landing' && i !== p.liar && i !== p.stairs)).length / ps.length,
      };
    });
    expect(stats.map((s) => s.people)).toEqual([4, 4, 5]);
    expect(stats[1].lines).toBeGreaterThan(stats[0].lines + 1);
    expect(stats[2].lines).toBeGreaterThan(stats[1].lines + 1);
    expect(stats[0].accuse).toBe(0);
    expect(stats[0].extras).toBe(0); // act 1 has only "was in", "was not in" and "with"
    expect(stats[1].accuse).toBe(1);
    expect(stats[2].accuse).toBe(1);
    expect(stats[1].herring).toBe(1); // acts 2 and 3: a truthful person on the landing, beside the stairwell
    expect(stats[2].herring).toBe(1);
    expect(W.stairwellDifficulty(1).depth).toBe(1);
    expect(W.stairwellDifficulty(0).act).toBe(1);
    expect(W.stairwellDifficulty(9).act).toBe(3);
  });

  it('the red herring is real: that person says they were on the landing, and is not the liar or the stairwell', () => {
    for (const act of [2, 3]) {
      for (const p of all(act, 120)) {
        const near = p.world.map((w, i) => (w === 'landing' && i !== p.liar && i !== p.stairs ? i : -1)).filter((i) => i >= 0);
        expect(near.length, `act ${act} seed ${p.seed}`).toBeGreaterThan(0);
        expect(near.some((i) => p.files[i].lines[0].st.k === 'at' && p.files[i].lines[0].text === 'I was on the 3rd-floor landing.')).toBe(true);
      }
    }
  });

  it('answers vary: any person can be the liar or in the stairwell, and sometimes they are the same', () => {
    for (const act of ACTS) {
      const ps = all(act, 200);
      const n = ps[0].files.length;
      for (let i = 0; i < n; i++) {
        expect(ps.some((p) => p.liar === i)).toBe(true);
        expect(ps.some((p) => p.stairs === i)).toBe(true);
      }
      const same = ps.filter((p) => p.liar === p.stairs).length / ps.length;
      expect(same).toBeGreaterThan(0.1);
      expect(same).toBeLessThan(0.7);
    }
  });
});

describe('Who Was in the Stairwell? (playing it)', () => {
  it('stamps: put down, moved, lifted; the case closes only with both', () => {
    const p = W.stairwellSetup(7, W.stairwellDifficulty(1));
    let s = W.stairwellStart();
    expect(W.canClose(s)).toBe(false);
    expect(W.closeCase(p, s)).toBe(s); // nothing happens
    s = W.stampFile(s, 'liar', 1);
    expect(s.liar).toBe(1);
    expect(W.canClose(s)).toBe(false);
    s = W.stampFile(s, 'liar', 2); // a mistap is only moved
    expect(s.liar).toBe(2);
    expect(s.moves).toBe(1);
    s = W.stampFile(s, 'liar', 2); // the same file again lifts it
    expect(s.liar).toBeNull();
    s = W.stampFile(s, 'liar', 0);
    s = W.stampFile(s, 'stairs', 0); // both stamps can sit on one file
    expect(W.canClose(s)).toBe(true);
    expect(s.over).toBeNull();
  });

  it('striking a line out is only a note', () => {
    const p = W.stairwellSetup(7, W.stairwellDifficulty(2));
    let s = W.stairwellStart();
    s = W.strikeLine(s, 0, 1);
    expect(s.struck).toEqual([W.lineKey(0, 1)]);
    s = W.strikeLine(s, 2, 0);
    s = W.strikeLine(s, 0, 1); // again brings it back
    expect(s.struck).toEqual([W.lineKey(2, 0)]);
    s = W.stampFile(W.stampFile(s, 'liar', p.liar), 'stairs', p.stairs);
    expect(W.closeCase(p, s).over).toBe('won');
  });

  it('the right name wins, a wrong one loses, and the liar stamp only changes the score', () => {
    for (const act of ACTS) {
      for (const p of all(act, 60)) {
        const n = p.files.length;
        const right = play(p, p.liar, p.stairs);
        expect(right.over).toBe('won');
        expect(right.score).toBe(100);
        const otherLiar = (p.liar + 1) % n;
        const half = play(p, otherLiar, p.stairs);
        expect(half.over).toBe('won');
        expect(half.score).toBe(60);
        const wrong = play(p, p.liar, (p.stairs + 1) % n);
        expect(wrong.over).toBe('lost');
        expect(wrong.score).toBe(0);
      }
    }
  });

  it('after the case is closed nothing changes', () => {
    const p = W.stairwellSetup(3, W.stairwellDifficulty(1));
    const done = play(p, p.liar, p.stairs);
    expect(W.stampFile(done, 'stairs', 1)).toBe(done);
    expect(W.strikeLine(done, 0, 0)).toBe(done);
    expect(W.closeCase(p, done)).toBe(done);
  });

  it('the result words name the right people, in plain short sentences', () => {
    for (const act of ACTS) {
      for (const p of all(act, 40)) {
        const n = p.files.length;
        const won = W.stairwellWords(p, play(p, p.liar, p.stairs));
        expect(won.headline).toContain(p.files[p.stairs].name);
        expect(won.detail).toContain(p.files[p.liar].call);
        const lost = W.stairwellWords(p, play(p, p.liar, (p.stairs + 1) % n));
        expect(lost.headline).toContain(p.files[p.stairs].call);
        expect(lost.headline.length + lost.detail.length).toBeLessThan(160);
      }
    }
  });
});

describe('Who Was in the Stairwell? (simulated players)', () => {
  it('a careful player (takes each person as the liar and deduces) wins every puzzle, with the right liar', () => {
    for (const act of ACTS) {
      for (const p of all(act, 200)) {
        const r = W.reasonOut(p, 1);
        expect(r.alive).toHaveLength(1);
        const { liar, stairs } = r.alive[0];
        const end = play(p, liar, stairs);
        expect(end.over).toBe('won');
        expect(end.score).toBe(100);
      }
    }
  });

  it('a guesser wins about one time in the number of files', () => {
    for (const act of ACTS) {
      const ps = all(act, 400);
      const n = ps[0].files.length;
      const rng = makeRng(99 + act);
      let won = 0;
      for (const p of ps) if (play(p, rng.int(n), rng.int(n)).over === 'won') won++;
      const rate = won / ps.length;
      expect(rate, `act ${act}`).toBeGreaterThan(1 / n - 0.07);
      expect(rate, `act ${act}`).toBeLessThan(1 / n + 0.07);
    }
  });

  it('a skimmer who trusts what the files say does not win reliably', () => {
    // takes the first person who says they were in the stairwell, else the first file
    for (const act of ACTS) {
      const ps = all(act, 300);
      let won = 0;
      for (const p of ps) {
        const said = p.files.findIndex((f) => f.lines.some((l) => l.st.k === 'at' && l.st.who === p.files.indexOf(f) && l.st.place === 'stairs'));
        const pick = said >= 0 ? said : 0;
        if (play(p, 0, pick).over === 'won') won++;
      }
      expect(won / ps.length, `act ${act}`).toBeLessThan(0.65);
      expect(won / ps.length, `act ${act}`).toBeGreaterThan(0.1);
    }
  });

  it('a player who stamps whoever is named most often as being in the stairwell is no better than a guess', () => {
    for (const act of ACTS) {
      const ps = all(act, 300);
      let won = 0;
      for (const p of ps) {
        const named = new Array(p.files.length).fill(0);
        for (const f of p.files) for (const l of f.lines) if (l.st.k === 'at' && l.st.place === 'stairs') named[l.st.who]++;
        const top = Math.max(...named);
        const pick = named.indexOf(top);
        if (top > 0 && play(p, 0, pick).over === 'won') won++;
      }
      expect(won / ps.length, `act ${act}`).toBeLessThan(0.45);
    }
  });
});

describe('Who Was in the Stairwell? (the deduction solver)', () => {
  it('finds every consistent answer, including when a puzzle is not unique', () => {
    // two files that say nothing: every liar and every stairwell person fits
    const empty: W.StairwellFile[] = [0, 1, 2].map((i) => ({ id: `x${i}`, name: `X${i}`, call: `X${i}`, role: '', lines: [] }));
    expect(W.stairwellSolutions({ files: empty })).toHaveLength(9);
    expect(W.reasonOut({ files: empty }, 1).alive.length).toBeGreaterThan(1);
  });

  it('uses accusations: "Y is lying" from X means the liar is X or Y', () => {
    const f = (i: number, st: W.Stmt[]): W.StairwellFile => ({ id: `p${i}`, name: `P${i}`, call: `P${i}`, role: '', lines: st.map((s) => ({ text: '', st: s })) });
    const files = [f(0, [{ k: 'lies', who: 1 }]), f(1, []), f(2, [])];
    const liars = new Set(W.stairwellSolutions({ files }).map((s) => s.liar));
    expect([...liars].sort()).toEqual([0, 1]);
    const vouch = [f(0, [{ k: 'honest', who: 1 }]), f(1, []), f(2, [])];
    const liars2 = new Set(W.stairwellSolutions({ files: vouch }).map((s) => s.liar));
    expect([...liars2].sort()).toEqual([2]);
  });

  it('a liar cannot be the one who says "I was in the archive" when somebody else says nobody was there', () => {
    const f = (i: number, st: W.Stmt[]): W.StairwellFile => ({ id: `p${i}`, name: `P${i}`, call: `P${i}`, role: '', lines: st.map((s) => ({ text: '', st: s })) });
    const files = [f(0, [{ k: 'at', who: 0, place: 'archive' }]), f(1, [{ k: 'empty', place: 'archive' }]), f(2, [])];
    const liars = new Set(W.stairwellSolutions({ files }).map((s) => s.liar));
    // one of the two lies; the third file cannot be the liar
    expect([...liars].sort()).toEqual([0, 1]);
  });
});

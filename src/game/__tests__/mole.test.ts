import { describe, expect, it } from 'vitest';
import { makeRng } from '../rng';
import * as M from '../minigames/mole';

/** Mini-games slice 3: Find the Mole (rules, fairness, simulated watchers). */

const seeds = (n: number, act: number) => Array.from({ length: n }, (_, i) => i * 7919 + act * 101 + 17);

/**
 * A watcher, as a person in front of the screen: they follow the grey coat
 * but look away now and then (`lapsePerS`, for `lapseMs`), a camera cutting
 * out elsewhere can pull their eye (`glitchPull`), a cue must be on screen
 * `reactMs` before they take it in (and then only `see` of the time), they
 * can mix two people up (`confuse`, more likely with more staff), and if they
 * missed the envelope a coffee may fool them (`coffeeFooled`).
 */
interface Watcher {
  name: string;
  lapsePerS: number;
  lapseMs: [number, number];
  reactMs: number;
  see: number;
  confuse: number;
  coffeeFooled: number;
  glitchPull: number;
}
const ATTENTIVE: Watcher = { name: 'attentive', lapsePerS: 0.05, lapseMs: [400, 900], reactMs: 250, see: 0.97, confuse: 0.02, coffeeFooled: 0.1, glitchPull: 0.35 };
const AVERAGE: Watcher = { name: 'average', lapsePerS: 0.15, lapseMs: [700, 1800], reactMs: 380, see: 0.88, confuse: 0.05, coffeeFooled: 0.4, glitchPull: 0.6 };
const DISTRACTED: Watcher = { name: 'distracted', lapsePerS: 0.35, lapseMs: [1200, 3500], reactMs: 500, see: 0.75, confuse: 0.1, coffeeFooled: 0.6, glitchPull: 0.8 };

/**
 * How likely a cue is to register once it has been watched for reactMs: a
 * short one is easy to miss (what is left of it after reacting, over 0.7 s);
 * act 1's bigger envelope helps.
 */
const salience = (c: M.Cue, big: boolean, w: Watcher) => Math.min(1, ((c.ms - w.reactMs) / 700) * (big ? 1.25 : 1));

/** Plays one night through the rules (moleTick, toggleMark, pickSuspect, nameMole). */
function play(setup: M.MoleSetup, w: Watcher, seed: number): M.MoleState {
  const rng = makeRng(seed * 31 + 7);
  const ids = setup.staff.map((p) => p.id);
  const confuse = w.confuse * (ids.length / 5);
  const recall = (id: string) => (rng.chance(confuse) ? rng.pick(ids.filter((x) => x !== id)) : id);
  const envelope: Record<string, number> = {};
  const coffee: Record<string, number> = {};
  const alone: Record<string, number> = {};
  const watched = new Map<M.Cue, number>();
  let away = 0;
  let s = M.moleStart(setup);
  while (s.phase === 'watch') {
    const t = s.t;
    const where = M.areaAt(M.contactAt(setup, t));
    for (const b of setup.blackouts) {
      if (b.from >= t && b.from < t + M.STEP_MS && b.room !== where && rng.chance(w.glitchPull)) away = Math.max(away, t + rng.range(500, 900));
    }
    if (t >= away && rng.chance((w.lapsePerS * M.STEP_MS) / 1000)) away = t + rng.range(w.lapseMs[0], w.lapseMs[1]);
    if (t >= away) {
      for (const c of M.cuesAt(setup, t)) {
        if (M.blackedOut(setup, c.room, t)) continue;
        const ms = (watched.get(c) ?? 0) + M.STEP_MS;
        watched.set(c, ms);
        if (ms === Math.ceil(w.reactMs / M.STEP_MS) * M.STEP_MS && rng.chance(w.see * salience(c, setup.d.bigCue, w))) {
          const who = recall(c.from);
          if (c.kind === 'envelope') {
            envelope[who] = (envelope[who] ?? 0) + 1;
            if (!s.marks.includes(who)) s = M.toggleMark(s, who);
          } else coffee[who] = (coffee[who] ?? 0) + 1;
        }
      }
      if (where !== 'hall' && where !== 'out' && !M.blackedOut(setup, where, t)) {
        const co = M.staffIn(setup, where, t);
        if (co.length === 1) alone[co[0]] = (alone[co[0]] ?? 0) + M.STEP_MS;
      }
    }
    s = M.moleTick(s, M.STEP_MS);
  }
  const best = (score: Record<string, number>) => {
    const top = Math.max(...Object.values(score));
    const all = ids.filter((id) => score[id] === top);
    return all.length ? rng.pick(all) : undefined;
  };
  let pick: string | undefined;
  if (Object.keys(envelope).length) pick = best(envelope);
  else {
    const score: Record<string, number> = {};
    for (const id of ids) score[id] = (alone[id] ?? 0) + (coffee[id] && rng.chance(w.coffeeFooled) ? 4000 : 0);
    pick = Math.max(...Object.values(score)) >= 800 ? recall(best(score)!) : rng.pick(ids);
  }
  s = M.moleTick(s, 1500 + w.reactMs * 4); // a moment to find them in the line-up
  s = M.pickSuspect(s, pick!);
  return M.nameMole(s);
}

const rate = (act: number, w: Watcher, n = 200) => {
  let won = 0;
  for (const seed of seeds(n, act)) if (play(M.moleSetup(seed, M.moleDifficulty(act)), w, seed).over === 'won') won++;
  return won / n;
};

describe('Find the Mole (rules)', () => {
  it('the same seed gives the same night; different seeds differ', () => {
    for (const act of [1, 2, 3]) {
      const d = M.moleDifficulty(act);
      expect(M.moleSetup(42, d)).toEqual(M.moleSetup(42, d));
      expect(M.moleSetup(42, d)).not.toEqual(M.moleSetup(43, d));
    }
  });

  it('ticks are deterministic, in any step size', () => {
    const setup = M.moleSetup(9, M.moleDifficulty(2));
    let a = M.moleStart(setup);
    for (let i = 0; i < 300; i++) a = M.moleTick(a, M.STEP_MS);
    const b = M.moleTick(M.moleStart(setup), 30000);
    expect(a).toEqual(b);
    expect(a.t).toBe(30000);
    expect(M.posAt(setup.staff[0].track, 12345)).toEqual(M.posAt(setup.staff[0].track, 12345));
  });

  it('marking: tap to mark, tap again to unmark, only while watching', () => {
    const setup = M.moleSetup(5, M.moleDifficulty(1));
    const [p, q] = setup.staff.map((x) => x.id);
    let s = M.moleStart(setup);
    s = M.toggleMark(s, p);
    s = M.toggleMark(s, q);
    expect(s.marks).toEqual([p, q]);
    s = M.toggleMark(s, p);
    expect(s.marks).toEqual([q]);
    expect(M.toggleMark(s, 'nobody')).toBe(s);
    // number keys follow the roster: 1..N
    expect(setup.staff.map((x) => x.key)).toEqual(setup.staff.map((_, i) => i + 1));
    expect(M.staffForKey(setup, 2)?.id).toBe(q);
    s = M.moleTick(s, setup.watchMs);
    expect(s.phase).toBe('lineup');
    expect(M.toggleMark(s, p)).toBe(s);
  });

  it('the line-up opens when the contact leaves; the right name wins, a wrong one loses', () => {
    const setup = M.moleSetup(11, M.moleDifficulty(2));
    const wrong = setup.staff.find((x) => x.id !== setup.mole)!.id;
    let s = M.moleStart(setup);
    // no naming while the contact is still on the floor
    expect(M.nameMole(s, setup.mole)).toBe(s);
    s = M.moleTick(s, setup.watchMs - M.STEP_MS);
    expect(s.phase).toBe('watch');
    expect(M.contactOnFloor(setup, s.t - 2000)).toBe(true);
    s = M.moleTick(s, M.STEP_MS);
    expect(s.phase).toBe('lineup');
    expect(M.contactOnFloor(setup, s.t)).toBe(false);
    // picking someone is not naming them
    const picked = M.pickSuspect(s, wrong);
    expect(picked.picked).toBe(wrong);
    expect(picked.over).toBeUndefined();
    expect(M.nameMole(picked).over).toBe('lost');
    expect(M.nameMole(picked).named).toBe(wrong);
    const right = M.nameMole(M.pickSuspect(s, setup.mole));
    expect(right.over).toBe('won');
    expect(M.moleScore(right)).toBeGreaterThanOrEqual(70);
    expect(M.moleScore(M.nameMole(picked))).toBe(0);
    // one name only
    expect(M.nameMole(right, wrong)).toBe(right);
  });

  it('doing nothing always loses: nobody named, the mole goes home', () => {
    for (const act of [1, 2, 3]) {
      for (const seed of seeds(20, act)) {
        const s = M.moleTick(M.moleStart(M.moleSetup(seed, M.moleDifficulty(act))), 200000);
        expect(s.over).toBe('lost');
        expect(s.named).toBeUndefined();
      }
    }
    const setup = M.moleSetup(3, M.moleDifficulty(1));
    const s = M.moleTick(M.moleStart(setup), setup.watchMs + M.LINEUP_MS - M.STEP_MS);
    expect(s.over).toBeUndefined();
    expect(M.lineupSecondsLeft(s)).toBe(1);
    expect(M.moleTick(s, M.STEP_MS).over).toBe('lost');
  });

  it('the camera clock reads like a CCTV timestamp', () => {
    expect(M.cctvClock(0)).toBe('23:40:00');
    expect(M.cctvClock(83500)).toBe('23:41:23');
  });

  it('gets harder each act: more staff, faster walking, shorter meetings and cues, more decoys and blackouts', () => {
    const [a, b, c] = [1, 2, 3].map(M.moleDifficulty);
    expect(a.staff).toBeLessThan(b.staff);
    expect(b.staff).toBeLessThan(c.staff);
    expect(a.speed).toBeLessThan(b.speed);
    expect(b.speed).toBeLessThan(c.speed);
    expect(a.meetings).toBeGreaterThan(c.meetings);
    expect(a.cueMs).toBeGreaterThan(b.cueMs);
    expect(b.cueMs).toBeGreaterThan(c.cueMs);
    expect(a.meetMs).toBeGreaterThan(c.meetMs);
    expect(a.lingerers).toBeLessThan(c.lingerers);
    expect(a.blackouts).toBe(0);
    expect(b.blackouts).toBeGreaterThan(0);
    expect(c.blackouts).toBeGreaterThan(b.blackouts);
    expect(a.bigCue && !b.bigCue && !c.bigCue).toBe(true);
  });
});

describe('Find the Mole (every night is fair)', () => {
  it('the meeting is always on screen: the envelope is never blacked out, and most of the meeting is visible', () => {
    for (const act of [1, 2, 3]) {
      const d = M.moleDifficulty(act);
      for (const seed of seeds(300, act)) {
        const s = M.moleSetup(seed, d);
        expect(M.checkNight(s)).toEqual({ ok: true });
        const env = s.cues.filter((c) => c.kind === 'envelope');
        expect(env.length).toBe(d.meetings);
        for (const c of env) {
          expect(c.from).toBe(s.mole);
          for (let t = c.at; t < c.at + c.ms; t += M.STEP_MS) {
            expect(M.blackedOut(s, c.room, t)).toBe(false);
            expect(M.staffIn(s, c.room, t)).toEqual([s.mole]);
            expect(M.areaAt(M.contactAt(s, t))).toBe(c.room);
          }
          // the mole and the contact alone together in that room, mostly in view
          let together = 0;
          let seen = 0;
          for (let t = 0; t < s.watchMs; t += M.STEP_MS) {
            if (M.areaAt(M.contactAt(s, t)) !== c.room || Math.abs(t - c.at) > 8000) continue;
            const co = M.staffIn(s, c.room, t);
            if (co.length !== 1 || co[0] !== s.mole) continue;
            together += M.STEP_MS;
            if (!M.blackedOut(s, c.room, t)) seen += M.STEP_MS;
          }
          expect(together).toBeGreaterThanOrEqual(d.meetMs);
          expect(seen / together).toBeGreaterThanOrEqual(0.5);
        }
      }
    }
  });

  it('only the mole hands over an envelope; decoys are alone with the contact only on purpose', () => {
    for (const act of [1, 2, 3]) {
      const d = M.moleDifficulty(act);
      for (const seed of seeds(100, act)) {
        const s = M.moleSetup(seed, d);
        expect(s.staff.length).toBe(d.staff);
        expect(s.staff.map((p) => p.id)).toContain(s.mole);
        expect(s.cues.filter((c) => c.kind === 'envelope').every((c) => c.from === s.mole)).toBe(true);
        expect(s.cues.filter((c) => c.kind === 'coffee').every((c) => c.from !== s.mole)).toBe(true);
        expect(s.stops.filter((x) => x.kind === 'lone').every((x) => x.who.length === 1 && x.who[0] !== s.mole)).toBe(true);
        expect(s.stops.filter((x) => x.kind === 'group').every((x) => x.who.length >= 2)).toBe(true);
        if (!d.coffee) expect(s.cues.some((c) => c.kind === 'coffee')).toBe(false);
        // a game lasts about 40 seconds of watching
        expect(s.watchMs).toBeGreaterThan(30000);
        expect(s.watchMs).toBeLessThan(55000);
        expect(s.blackouts.length).toBe(d.blackouts);
      }
    }
  });
});

describe('Find the Mole (simulated watchers)', () => {
  it('careful watching wins most nights; a guess is one in N; doing nothing never wins', () => {
    const rows: string[] = [];
    const table: Record<string, number[]> = {};
    for (const w of [ATTENTIVE, AVERAGE, DISTRACTED]) table[w.name] = [1, 2, 3].map((act) => rate(act, w));
    table.guess = [1, 2, 3].map((act) => {
      let won = 0;
      for (const seed of seeds(300, act)) {
        const setup = M.moleSetup(seed, M.moleDifficulty(act));
        const r = makeRng((seed ^ 0x9e3779b9) >>> 0);
        if (M.nameMole(M.pickSuspect(M.moleTick(M.moleStart(setup), setup.watchMs), r.pick(setup.staff).id)).over === 'won') won++;
      }
      return won / 300;
    });
    for (const [k, v] of Object.entries(table)) rows.push(`${k.padEnd(11)} ${v.map((x) => `${Math.round(x * 100)}%`.padStart(5)).join(' ')}`);
    console.log(`Find the Mole — win rate by act (1 / 2 / 3), 200 nights each:\n${rows.join('\n')}`);

    const [a1, a2, a3] = table.attentive;
    expect(a1).toBeGreaterThanOrEqual(0.9);
    expect(a3).toBeGreaterThanOrEqual(0.68);
    expect(a3).toBeLessThanOrEqual(0.88);
    expect(a2).toBeLessThanOrEqual(a1);
    // average clearly lower than attentive, distracted lower still
    const mean = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
    expect(mean(table.average)).toBeLessThan(mean(table.attentive) - 0.08);
    expect(mean(table.distracted)).toBeLessThan(mean(table.average));
    // a random name is right about 1 time in N
    [5, 6, 8].forEach((n, i) => expect(Math.abs(table.guess[i] - 1 / n)).toBeLessThan(0.07));
  });
});

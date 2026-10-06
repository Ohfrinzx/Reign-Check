import { describe, expect, it } from 'vitest';
import * as P from '../minigames/pigeon';
import { hashString, makeRng } from '../rng';
import { createGame } from '../state';
import { pigeonIntro } from '../content/mgPigeon';

/** THE PIGEON RUN (mini-games slice 3): the rules, the planner proof, and simulated players. */

const seeds = (n: number, salt: string) => Array.from({ length: n }, (_, i) => hashString(`pigeon:${salt}:${i}`));

/** An empty sky to test the physics in: no hills, no clouds, no hawks. */
function sky(over: Partial<P.PigeonSetup> = {}, d: Partial<P.PigeonDifficulty> = {}): P.PigeonSetup {
  const dd = { ...P.pigeonDifficulty(1), durationMs: 60000, ...d };
  return { seed: 1, d: dd, length: (dd.speed * dd.durationMs) / 1000, clouds: [], hills: [], hawks: [], guide: [], ...over };
}

/** Fly with a function of the state deciding, step by step. */
function flyWith(s: P.PigeonState, ms: number, hold: (s: P.PigeonState) => boolean): P.PigeonState {
  const end = s.t + ms;
  while (!s.over && s.t < end) s = P.pigeonTick(s, P.STEP_MS, hold(s));
  return s;
}
/** Fly until `done` (or the end). */
function flyUntil(s: P.PigeonState, done: (s: P.PigeonState) => boolean, hold: (s: P.PigeonState) => boolean): P.PigeonState {
  while (!s.over && !done(s)) s = P.pigeonTick(s, P.STEP_MS, hold(s));
  return s;
}

/**
 * A player. Hawk warnings are seen `react` ms late; the pigeon's own height
 * 0.7 × react late, half predicted (a player knows what their finger is
 * doing); they hold or let go every 50-100 ms (never perfectly regular) and
 * aim a few units off. Doing nothing and holding all the time are players too.
 */
function player(setup: P.PigeonSetup, react: number | 'idle' | 'hold'): P.PigeonState {
  let s = P.pigeonStart(setup);
  if (react === 'idle' || react === 'hold') return flyWith(s, 1e6, () => react === 'hold');
  const r = makeRng(setup.seed ^ (react * 7919));
  const hist: P.PigeonState[] = [];
  const lag = react * 0.7;
  let held = false;
  let next = 0;
  let aim = 0;
  while (!s.over) {
    hist.push(s);
    if (s.t >= next) {
      next = s.t + Math.round((75 * (0.7 + r.next() * 0.6)) / P.STEP_MS) * P.STEP_MS;
      if (s.t % 600 < 75) aim = (r.next() * 2 - 1) * 3;
      const seen = hist[Math.max(0, hist.length - 1 - Math.round(lag / P.STEP_MS))];
      const warned = hist[Math.max(0, hist.length - 1 - Math.round(react / P.STEP_MS))];
      const est = { t: s.t, y: seen.y + seen.vy * (lag / 1000) * 0.5, vy: seen.vy, locks: warned.locks };
      held = P.pilotHold(est, P.pilotTarget(setup, est, 5) + aim);
    }
    s = P.pigeonTick(s, P.STEP_MS, held);
  }
  return s;
}

/** The course's own guide path at x (only the planner's compass; the flight is real physics). */
function guideAt(setup: P.PigeonSetup, x: number): number {
  const g = setup.guide;
  for (let i = 1; i < g.length; i++) {
    if (x <= g[i][0]) {
      const [x0, y0] = g[i - 1];
      const [x1, y1] = g[i];
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return g[g.length - 1][1];
}

/**
 * A planner: beam search over hold / let go every 100 ms with the real
 * rules (hawks aim at where the pigeon really is). Returns the fewest hits it
 * found on a flight that reaches the garrison (99: none found).
 */
function plan(setup: P.PigeonSetup, width: number): number {
  let beam: P.PigeonState[] = [P.pigeonStart(setup)];
  for (let n = 0; n < 1000 && beam.length; n++) {
    const next: P.PigeonState[] = [];
    for (const s of beam) {
      if (s.over === 'won') return s.hits;
      if (!s.over) next.push(P.pigeonTick(s, 100, true), P.pigeonTick(s, 100, false));
    }
    const score = new Map(next.map((s) => {
      const x = P.pigeonX(setup, s.t);
      let ahead = 12;
      for (let tau = 0; tau <= 1.2; tau += 0.2) ahead = Math.min(ahead, P.clearance(setup, x + setup.d.speed * tau, s.y + s.vy * tau * 0.5));
      let hawk = 0;
      setup.hawks.forEach((h, k) => {
        const l = s.locks[k];
        if (l !== null && h.at > s.t && h.at < s.t + 1500) hawk += Math.max(0, P.HAWK_R + 3 - Math.abs(s.y - l)) * 4;
      });
      return [s, s.hits * 1000 + Math.abs(s.y - guideAt(setup, x)) * 0.25 - ahead + hawk + (s.over === 'lost' ? 1e6 : 0)] as const;
    }));
    const seen = new Set<string>();
    beam = next.filter((s) => s.over !== 'lost').sort((a, b) => score.get(a)! - score.get(b)!).filter((s) => {
      const k = `${Math.round(s.y / 1.5)}:${Math.round(s.vy / 8)}:${s.hits}:${s.locks.map((l) => (l === null ? '' : Math.round(l / 3))).join(',')}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, width);
  }
  return 99;
}

describe('The Pigeon Run (rules)', () => {
  it('the same seed gives the same flight, and the same hands give the same result', () => {
    for (const act of [1, 2, 3]) {
      const d = P.pigeonDifficulty(act);
      expect(P.pigeonSetup(77, d)).toEqual(P.pigeonSetup(77, d));
      expect(P.pigeonSetup(77, d)).not.toEqual(P.pigeonSetup(78, d));
      const hands = (s: P.PigeonState) => Math.floor(s.t / 350) % 3 !== 0;
      const a = flyWith(P.pigeonStart(P.pigeonSetup(77, d)), 20000, hands);
      const b = flyWith(P.pigeonStart(P.pigeonSetup(77, d)), 20000, hands);
      expect(a).toEqual(b);
      // one big tick is the same as many small ones
      let c = P.pigeonStart(P.pigeonSetup(77, d));
      for (let i = 0; i < 40; i++) c = P.pigeonTick(c, 100, true);
      expect(P.pigeonTick(P.pigeonStart(P.pigeonSetup(77, d)), 4000, true)).toEqual(c);
    }
  });

  it('holding climbs, letting go glides down, both with a top speed; the top of the sky is soft', () => {
    const s0 = { ...P.pigeonStart(sky()), y: 50, vy: 0 };
    const up = P.pigeonTick(s0, 200, true);
    expect(up.vy).toBeLessThan(0);
    expect(up.y).toBeLessThan(50);
    const fast = P.pigeonTick({ ...s0, y: 80 }, 900, true);
    expect(fast.vy).toBe(-P.MAX_UP);
    const down = P.pigeonTick(s0, 200, false);
    expect(down.vy).toBeGreaterThan(0);
    expect(down.y).toBeGreaterThan(50);
    expect(P.pigeonTick({ ...s0, y: 10 }, 900, false).vy).toBe(P.MAX_DOWN);
    // a glide is not a fall: from a full climb, letting go takes a moment to turn
    const turning = P.pigeonTick({ ...s0, vy: -P.MAX_UP }, 250, false);
    expect(turning.vy).toBeLessThan(0);
    // the top of the sky: the pigeon stops there, nothing is lost
    const top = P.pigeonTick(s0, 5000, true);
    expect(top.y).toBe(P.CEIL);
    expect(top.hits).toBe(0);
  });

  it('a hill or the valley floor bounces the pigeon and costs a feather (not in the first moments)', () => {
    const early = P.pigeonTick({ ...P.pigeonStart(sky()), y: 80, vy: 20 }, 1200, false);
    expect(early.bounces).toBeGreaterThan(0);
    expect(early.hits).toBe(0); // the opening grace
    const s = flyWith({ ...P.pigeonStart(sky()), t: P.GRACE_MS, y: 70, vy: 20 }, 1500, () => false);
    expect(s.bounces).toBeGreaterThan(0);
    expect(s.hits).toBe(1);
    expect(s.by.hill).toBe(1);
    expect(s.last?.kind).toBe('hill');
    expect(s.y).toBeLessThan(P.BASE - P.R);
  });

  it('a storm cloud costs a feather; then a moment safe (it blinks); the last feather brings the pigeon down', () => {
    const d = P.pigeonDifficulty(1);
    // a long cloud right across the pigeon's path, and a pigeon holding its height inside it
    const setup = sky({ clouds: [{ x0: 100, x1: 900, top: 40, bot: 60, kind: 'mid' }] });
    const hover = (s: P.PigeonState) => P.pilotHold(s, 50);
    let s = flyUntil({ ...P.pigeonStart(setup), t: 3000, y: 50, vy: 0 }, (x) => x.hits > 0, hover);
    expect(P.pigeonX(setup, s.t)).toBeGreaterThan(100 - P.R - 1); // on touching it
    expect(s.hits).toBe(1);
    expect(s.by.cloud).toBe(1);
    expect(P.isSafe(s)).toBe(true);
    const hitAt = s.last!.at;
    s = flyWith(s, P.SAFE_MS - 100, hover);
    expect(s.hits).toBe(1); // still blinking
    s = flyWith(s, 200, hover);
    expect(s.hits).toBe(2);
    expect(s.last!.at - hitAt).toBeGreaterThanOrEqual(P.SAFE_MS);
    s = flyWith(s, 10000, hover);
    expect(s.hits).toBe(d.feathers);
    expect(s.over).toBe('lost');
    expect(P.feathersLeft(s)).toBe(0);
    expect(P.pigeonScore(s)).toBeLessThan(30);
  });

  it('the Pigeon Federation\'s champion takes one more hit', () => {
    for (const act of [1, 2, 3]) {
      expect(P.pigeonDifficulty(act, true).feathers).toBe(P.pigeonDifficulty(act).feathers + 1);
      // the champion is only sturdier: the same course, the same hawks
      const a = P.pigeonSetup(5, P.pigeonDifficulty(act));
      const b = P.pigeonSetup(5, P.pigeonDifficulty(act, true));
      expect(b.clouds).toEqual(a.clouds);
      expect(b.hawks).toEqual(a.hawks);
    }
    const cloud: P.Cloud = { x0: 100, x1: 900, top: 40, bot: 60, kind: 'mid' };
    const run = (champion: boolean) => {
      const setup = sky({ clouds: [cloud] }, { feathers: P.pigeonDifficulty(1, champion).feathers });
      const hover = (s: P.PigeonState) => P.pilotHold(s, 50);
      // inside the cloud until the third hit, and a little longer (not long enough for a fourth)
      const third = flyUntil({ ...P.pigeonStart(setup), t: 3000, y: 50, vy: 0 }, (s) => s.hits >= 3, hover);
      return flyWith(third, P.SAFE_MS - 100, hover);
    };
    expect(run(false).hits).toBe(3);
    expect(run(false).over).toBe('lost');
    expect(run(true).hits).toBe(3);
    expect(run(true).over).toBeUndefined();
  });

  it('a hawk shows its line where the pigeon is heading, then strikes along it; being off the line dodges it', () => {
    const d = P.pigeonDifficulty(1);
    const hawk: P.Hawk = { at: 6000, y0: 14 };
    const setup = sky({ hawks: [hawk] });
    const lockAt = P.lockTime(setup, hawk);
    expect(lockAt).toBe(6000 - d.diveMs - d.warnMs);
    expect(P.hawkPhase(setup, hawk, lockAt - 1)).toBe('circle');
    expect(P.hawkPhase(setup, hawk, lockAt + 1)).toBe('warn');
    expect(P.hawkPhase(setup, hawk, hawk.at - 1)).toBe('dive');
    // a pigeon holding still at 50 is hit
    const still = flyWith({ ...P.pigeonStart(setup), y: 50, vy: 0 }, 6500, (s) => P.pilotHold(s, 50));
    expect(still.locks[0]).toBeCloseTo(50, -1);
    expect(still.hits).toBe(1);
    expect(still.by.hawk).toBe(1);
    // a pigeon that moves off the line once it shows is not
    const quick = flyWith({ ...P.pigeonStart(setup), y: 50, vy: 0 }, 6500, (s) => P.pilotHold(s, s.locks[0] === null ? 50 : 30));
    expect(quick.hits).toBe(0);
    expect(quick.dodged).toBe(1);
    // it aims ahead along a climb
    expect(P.aimAt(50, -40)).toBeLessThan(50);
    expect(P.aimAt(50, 40)).toBeGreaterThan(50);
    // the dive passes through its line at the pigeon at the strike
    expect(P.hawkPos(setup, hawk, hawk.at, 42)).toEqual({ dx: 0, y: 42 });
  });

  it('every course leaves a way through everywhere, and never a thin slot next to a floating cloud', () => {
    for (const act of [1, 2, 3]) {
      for (const seed of seeds(40, `room${act}`)) {
        const setup = P.pigeonSetup(seed, P.pigeonDifficulty(act));
        expect(setup.clouds.length + setup.hills.length).toBeGreaterThanOrEqual(6);
        for (let x = 0; x <= setup.length; x += 2) {
          // free heights for the pigeon's centre at x
          let free: [number, number][] = [[P.CEIL, P.groundAt(setup, x) - P.R]];
          for (const c of setup.clouds) {
            if (x < c.x0 - P.R || x > c.x1 + P.R) continue;
            free = free.flatMap(([a, b]) => [[a, Math.min(b, c.top - P.R)], [Math.max(a, c.bot + P.R), b]] as [number, number][]).filter(([a, b]) => b > a);
          }
          const widest = Math.max(0, ...free.map(([a, b]) => b - a));
          expect(widest, `act ${act} seed ${seed} x ${x}`).toBeGreaterThanOrEqual(P.ROOM);
        }
        for (const c of setup.clouds.filter((k) => k.kind === 'mid')) {
          const above = c.top - P.R - P.CEIL;
          const below = P.BASE - c.bot - 2 * P.R;
          expect(above < 0 || above >= P.ROOM).toBe(true);
          expect(below < 0 || below >= P.ROOM).toBe(true);
        }
      }
    }
  });

  it('doing nothing always loses, and so does holding all the time (every act)', () => {
    for (const act of [1, 2, 3]) {
      for (const champion of [false, true]) {
        for (const seed of seeds(60, `idle${act}`)) {
          const setup = P.pigeonSetup(seed, P.pigeonDifficulty(act, champion));
          const idle = player(setup, 'idle');
          expect(idle.over).toBe('lost');
          expect(idle.t).toBeLessThan(15000);
          expect(player(setup, 'hold').over).toBe('lost');
        }
      }
    }
  });

  it('every seed is winnable without a hit by a planner that obeys the same physics', () => {
    const worst: Record<number, number> = {};
    for (const act of [1, 2, 3]) {
      worst[act] = 0;
      for (const seed of seeds(40, `plan${act}`)) {
        const setup = P.pigeonSetup(seed, P.pigeonDifficulty(act));
        let hits = plan(setup, 40);
        if (hits > 0) hits = plan(setup, 250);
        expect(hits, `act ${act} seed ${seed}`).toBe(0);
        worst[act] = Math.max(worst[act], hits);
      }
    }
    expect(worst).toEqual({ 1: 0, 2: 0, 3: 0 });
  }, 240000);

  it('harder each act: simulated players by reaction time (quick ~100% → ~70%, idle 0%)', () => {
    const N = 100;
    const rate = (act: number, react: number) => {
      let won = 0;
      for (const seed of seeds(N, `players${act}`)) if (player(P.pigeonSetup(seed, P.pigeonDifficulty(act)), react).over === 'won') won++;
      return won / N;
    };
    const table: Record<string, number[]> = {};
    for (const react of [150, 250, 350]) table[`${react} ms`] = [1, 2, 3].map((a) => Math.round(rate(a, react) * 100));
    // eslint-disable-next-line no-console
    console.log('Pigeon Run win % by act (1/2/3):', JSON.stringify(table));
    const [q, a, sl] = [table['150 ms'], table['250 ms'], table['350 ms']];
    expect(q[0]).toBeGreaterThanOrEqual(90);
    expect(q[2]).toBeGreaterThanOrEqual(60);
    expect(q[2]).toBeLessThanOrEqual(85);
    for (const row of [q, a, sl]) expect(row[2]).toBeLessThan(row[0]); // harder each act
    for (let i = 1; i < 3; i++) {
      expect(a[i]).toBeLessThan(q[i]); // an average player clearly does worse
      expect(sl[i]).toBeLessThan(a[i]);
    }
    expect(a[2]).toBeLessThanOrEqual(q[2] - 15);
  }, 240000);

  it('the how-to gives the real number of feathers (the champion\'s too)', () => {
    for (const act of [1, 2, 3]) {
      for (const champion of [false, true]) {
        const s = createGame({ seed: 3, leaderName: 'T' });
        s.act = act;
        if (champion) s.flags.pigeonFriend = 1;
        const text = pigeonIntro(s).howTo.join(' ');
        expect(text).toContain(`${P.pigeonDifficulty(act, champion).feathers} feathers`);
        expect(text).toMatch(/Space/);
      }
    }
  });
});

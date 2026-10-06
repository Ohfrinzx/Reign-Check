import { makeRng } from '../rng';

/**
 * THE PIGEON RUN — the rules. No React, no DOM (ground rule 11). The UI runs
 * the clock and passes whether the player is holding (finger, mouse, Space,
 * ↑ or W) on every tick; the same seed and the same hands always give the
 * same flight.
 *
 * Drovna is jamming the radio in the Hadem hills, so the order to the border
 * garrison goes by racing pigeon. The pigeon flies right on its own (about
 * 40 s to the garrison). HOLD to climb, LET GO to glide down (owner's pick
 * over three lanes: "more skill, closer to Flappy Bird") — smooth physics:
 * holding pushes up, letting go lets it sink, both with a top speed.
 *
 * The world is 100 units tall (0 = the top of the sky, BASE = the valley
 * floor). x is distance flown, in the same units.
 *   - HILLS rise from the valley floor. Touching a hill or the valley floor
 *     is a hit and a bounce (not an instant loss).
 *   - STORM CLOUDS hang from the top of the sky or float in the middle.
 *     Flying into one is a hit (the pigeon flies on through it).
 *   - HAWKS circle ahead of the pigeon, then pick their line: a dashed red
 *     line shows where the dive will cross the pigeon (aimed where it is
 *     going), WARN ms before the dive. Be somewhere else when it strikes.
 *   - The top of the sky is a soft limit: the pigeon just can't climb higher.
 * Every hit costs a feather; the last feather lost brings the pigeon down.
 * After a hit the pigeon can't be hit again for SAFE_MS (it blinks).
 *
 * Every course is laid along a GUIDE path that a real flight can follow
 * (bounded climbs and dives, a gap at every obstacle), and the tests prove
 * each seed is winnable without a hit by a planner that obeys the same
 * physics. Doing nothing always loses (the pigeon glides into the ground,
 * again and again); so does holding all the time (clouds and hawks).
 *
 * Harder each act: faster, obstacles closer together, tighter gaps, more
 * storm clouds, more hawks with shorter warnings. Calibrated with simulated
 * players who react late (see src/game/__tests__/pigeon.test.ts).
 */

export const STEP_MS = 25;
/** the valley floor (y); hills rise from it */
export const BASE = 93;
/** the pigeon's body: hits are measured from its centre */
export const R = 3.2;
/** up while held, down while gliding (units/s²) */
export const LIFT = 150;
export const GRAV = 115;
/** fastest climb and fastest sink (units/s) */
export const MAX_UP = 52;
export const MAX_DOWN = 46;
/** bounced off a hill or the floor: thrown up this fast */
export const BOUNCE = 38;
/** after a hit, no more hits for this long (ms) */
export const SAFE_MS = 1300;
/** the first moments: the ground bounces the pigeon but costs nothing */
export const GRACE_MS = 2500;
/** a hawk hits if its dive crosses the pigeon within this of its centre */
export const HAWK_R = 7;
/** where hawks circle: this far ahead of the pigeon */
export const HAWK_DX = 58;
/** a hawk aims ahead along the pigeon's climb or sink, this many seconds' worth */
export const HAWK_LEAD_S = 0.3;
/** the top of the sky: the pigeon cannot climb past this */
export const CEIL = R + 0.5;

export interface PigeonDifficulty {
  act: number;
  champion: boolean;
  /** forward speed, units/s */
  speed: number;
  durationMs: number;
  /** hits allowed + 1: the last one lost brings the pigeon down */
  feathers: number;
  /** clear sky between obstacles (units) */
  spacing: [number, number];
  /** the gap left between a cloud and a hill under it */
  gap: number;
  /** how often each kind of obstacle comes */
  mix: Record<ObstacleKind, number>;
  /** time between hawk strikes (ms) */
  hawkEvery: [number, number];
  /** chance a second hawk follows close behind the first */
  pairs: number;
  /** a hawk circles this long, then shows its line this long, then dives this long (ms) */
  circleMs: number;
  warnMs: number;
  diveMs: number;
}

export type ObstacleKind = 'hill' | 'high' | 'gate' | 'mid' | 'tunnel';

/**
 * Act 1: a gentle flight; act 2: tighter and busier; act 3: fast, narrow,
 * with hawks in pairs. The Pigeon Federation's champion (you helped the
 * Federation earlier in the run) takes one more hit.
 */
export function pigeonDifficulty(act: number, champion = false): PigeonDifficulty {
  const a = Math.min(3, Math.max(1, Math.round(act)));
  const base = a === 1
    ? {
      speed: 30, feathers: 3, spacing: [62, 100] as [number, number], gap: 42,
      mix: { hill: 3, high: 3, gate: 3, mid: 2, tunnel: 0 },
      hawkEvery: [4000, 5200] as [number, number], pairs: 0, circleMs: 1200, warnMs: 1000, diveMs: 420,
    }
    : a === 2
      ? {
        speed: 33, feathers: 3, spacing: [50, 86] as [number, number], gap: 37,
        mix: { hill: 2, high: 2, gate: 4, mid: 3, tunnel: 1 },
        hawkEvery: [3300, 4400] as [number, number], pairs: 0.2, circleMs: 1000, warnMs: 900, diveMs: 380,
      }
      : {
        speed: 36, feathers: 3, spacing: [42, 76] as [number, number], gap: 33,
        mix: { hill: 2, high: 2, gate: 4, mid: 3, tunnel: 2 },
        hawkEvery: [2800, 3700] as [number, number], pairs: 0.3, circleMs: 900, warnMs: 800, diveMs: 340,
      };
  return { act: a, champion, durationMs: 40000, ...base, feathers: base.feathers + (champion ? 1 : 0) };
}

/**
 * A storm cloud: a box in the sky (drawn as puffs a little bigger). 'high'
 * hangs from the top of the sky, 'low' sits in the valley, 'mid' floats.
 */
export interface Cloud { x0: number; x1: number; top: number; bot: number; kind: 'high' | 'mid' | 'low' }
/**
 * The narrowest way through anywhere (for the pigeon's centre): wide enough
 * to dodge a hawk (2 × HAWK_R) from anywhere in it.
 */
export const ROOM = 18;
/** A hill: centre, a flat top `flat` wide each side, slopes `w` wide, `h` tall above the floor. */
export interface Hill { x: number; flat: number; w: number; h: number }
/** A hawk: strikes at `at` ms; circles at height `y0` before it dives. */
export interface Hawk { at: number; y0: number }

export interface PigeonSetup {
  seed: number;
  d: PigeonDifficulty;
  /** distance to the garrison */
  length: number;
  clouds: Cloud[];
  hills: Hill[];
  hawks: Hawk[];
  /** the path the course was laid along: [x, y] points (a flight that works) */
  guide: [number, number][];
}

export type HitKind = 'cloud' | 'hill' | 'hawk';

export interface PigeonState {
  setup: PigeonSetup;
  t: number;
  y: number;
  /** vertical speed, units/s; negative = climbing */
  vy: number;
  held: boolean;
  hits: number;
  /** no hits until this time (after a hit) */
  safeUntil: number;
  /** per hawk: the height its dive will cross the pigeon (set when it picks its line) */
  locks: (number | null)[];
  /** hawks that dived and missed */
  dodged: number;
  /** hits by what did it */
  by: Record<HitKind, number>;
  bounces: number;
  /** the last hit, for the feather puff */
  last?: { kind: HitKind; at: number; y: number };
  over?: 'won' | 'lost';
}

/* ------------------------------------------------------------- the course */

export const pigeonX = (setup: PigeonSetup, t: number) => (setup.d.speed * t) / 1000;

export function hillHeight(h: Hill, x: number): number {
  const d = Math.abs(x - h.x) - h.flat;
  if (d <= 0) return h.h;
  if (d >= h.w) return 0;
  return h.h * (1 + Math.cos((Math.PI * d) / h.w)) / 2;
}

/** The height of the ground (hills or the valley floor) at x. */
export function groundAt(setup: PigeonSetup, x: number): number {
  let g = BASE;
  for (const h of setup.hills) {
    if (Math.abs(x - h.x) >= h.flat + h.w) continue;
    g = Math.min(g, BASE - hillHeight(h, x));
  }
  return g;
}

/** How far the pigeon's body at (x, y) is from a cloud (negative = inside). */
function cloudGap(c: Cloud, x: number, y: number): number {
  const dx = Math.max(c.x0 - x, 0, x - c.x1);
  const dy = Math.max(c.top - y, 0, y - c.bot);
  if (dx === 0 && dy === 0) return -Math.min(x - c.x0, c.x1 - x, y - c.top, c.bot - y) - R;
  return Math.hypot(dx, dy) - R;
}

/** What is in the column at x: the ground under the pigeon's body, and the clouds near. */
interface Column { x: number; ground: number; clouds: Cloud[] }
function column(setup: PigeonSetup, x: number): Column {
  return { x, ground: groundUnder(setup, x), clouds: setup.clouds.filter((c) => c.x1 >= x - 30 && c.x0 <= x + 30) };
}
/** The ground under the pigeon's body: the body is round, so under its front and back counts too. */
function groundUnder(setup: PigeonSetup, x: number): number {
  return Math.min(groundAt(setup, x), groundAt(setup, x - R * 0.7) + R * 0.3, groundAt(setup, x + R * 0.7) + R * 0.3);
}
function clearIn(col: Column, y: number): number {
  let best = col.ground - y - R;
  for (const c of col.clouds) best = Math.min(best, cloudGap(c, col.x, y));
  return best;
}

/**
 * The clearance of a pigeon at (x, y): how far its body is from the nearest
 * cloud or the ground (negative = touching). Used by the rules and the pilot.
 */
export function clearance(setup: PigeonSetup, x: number, y: number): number {
  return clearIn(column(setup, x), y);
}

function groundClear(setup: PigeonSetup, x: number, y: number): number {
  return groundUnder(setup, x) - y - R;
}

/** Lay out the flight: hills, storm clouds and hawks. Same seed, same flight. */
export function pigeonSetup(seed: number, d: PigeonDifficulty): PigeonSetup {
  const rng = makeRng(seed);
  const length = (d.speed * d.durationMs) / 1000;
  const clouds: Cloud[] = [];
  const hills: Hill[] = [];
  const guide: [number, number][] = [[0, 42]];
  // the slowest a guide path climbs or dives (units of height per unit flown):
  // well inside what the pigeon can do, so a real flight can always follow it
  const slope = 0.62;
  const gates: [number, number, number][] = []; // narrow places: x0, x1, gap
  let c = 42;
  let x = d.speed * 2.9; // the first obstacle comes after the start's grace
  const end = length - d.speed * 2.4; // clear sky over the garrison approach
  const kinds = (Object.keys(d.mix) as ObstacleKind[]).filter((k) => d.mix[k] > 0);
  let prev: ObstacleKind | null = null;
  for (let n = 0; n < 60; n++) {
    // the first obstacle is always a plain one, so the start is gentle
    let kind: ObstacleKind = n === 0 ? (rng.chance(0.5) ? 'hill' : 'high') : rng.weighted(kinds, (k) => d.mix[k]) ?? 'hill';
    if (kind === prev && kind === 'tunnel') kind = 'gate';
    const g = d.gap;
    let want: number;
    let lo: number;
    let hi: number;
    // the height range the guide may cross this obstacle at
    switch (kind) {
      case 'hill': lo = 16; hi = 52; break;
      case 'high': lo = 52; hi = BASE - 16; break;
      case 'gate': case 'tunnel': lo = g / 2 + 14; hi = BASE - g / 2 - 12; break;
      // mid: over the cloud (room to the sky) or under it (room to the floor)
      default: lo = g / 2 + 16; hi = BASE - g / 2 - 6; break;
    }
    // within reach of where the guide is now (it has `x - last` to get there)
    const reach = slope * Math.max(0, x - guide[guide.length - 1][0]);
    want = rng.range(Math.max(lo, c - reach), Math.min(hi, c + reach));
    if (!(want >= lo && want <= hi)) want = c < lo ? lo : hi; // out of reach: go as far as needed
    const need = Math.abs(want - c) - reach;
    if (need > 0) x += need / slope; // and give it room to get there
    let x0 = x;
    let x1 = x;
    if (kind === 'hill') {
      // a hill whose top sits well under the guide
      const top = Math.min(BASE - 14, want + R + rng.range(12, 22));
      const w = rng.range(34, 52);
      const flat = rng.range(0, 10);
      const h: Hill = { x: x + w + flat, flat, w, h: BASE - top };
      hills.push(h);
      x0 = h.x - flat - w * 0.5;
      x1 = h.x + flat + w * 0.5;
    } else if (kind === 'high') {
      const bot = Math.max(18, want - R - rng.range(12, 22));
      const len = rng.range(44, 96);
      clouds.push({ x0: x, x1: x + len, top: -40, bot, kind: 'high' });
      x1 = x + len;
    } else if (kind === 'gate' || kind === 'tunnel') {
      const len = kind === 'gate' ? rng.range(34, 56) : rng.range(120, 170);
      const bot = want - g / 2;
      const top = want + g / 2;
      clouds.push({ x0: x, x1: x + len, top: -40, bot, kind: 'high' });
      // the hill's top is under the whole cloud (a ridge for a tunnel)
      const w = rng.range(30, 40);
      hills.push({ x: x + len / 2, flat: len / 2 - 4, w, h: BASE - top });
      gates.push([x - R, x + len + R, g]);
      x0 = x;
      x1 = x + len;
    } else {
      // a floating cloud: the guide passes under it (when it is low) or over
      // it, with half a gap to the cloud. The way round on its other side is
      // either a real way (ROOM wide) or closed: never a thin slot where a
      // hawk could corner the pigeon.
      const thick = rng.range(16, 26);
      const len = rng.range(48, 90);
      const under = want > 50;
      let top = under ? want - g / 2 - thick : want + g / 2;
      let bot = under ? want - g / 2 : top + thick;
      let kind: Cloud['kind'] = 'mid';
      if (under && top - R - CEIL < ROOM) { top = -40; kind = 'high'; }
      if (!under && BASE - bot - 2 * R < ROOM) { bot = BASE + 40; kind = 'low'; }
      clouds.push({ x0: x, x1: x + len, top, bot, kind });
      x1 = x + len;
    }
    if (x1 > end) {
      // didn't fit before the garrison: take it back
      if (kind === 'hill' || kind === 'gate' || kind === 'tunnel') {
        if (kind !== 'hill') { clouds.pop(); gates.pop(); }
        hills.pop();
      } else clouds.pop();
      break;
    }
    guide.push([x0, want], [x1, want]);
    c = want;
    prev = kind;
    x = x1 + rng.range(d.spacing[0], d.spacing[1]);
  }
  guide.push([length, Math.min(c, 60)]);

  // hawks: a strike every few seconds, from 5 s until just before the end;
  // in act 1 never over a gate (the gaps are for learning there)
  const hawks: Hawk[] = [];
  const pigeonAt = (ms: number) => (d.speed * ms) / 1000;
  const inGate = (ms: number) => gates.some(([a, b]) => pigeonAt(ms) > a - 8 && pigeonAt(ms) < b + 8);
  let t = 5000 + rng.range(0, 800);
  while (t < d.durationMs - 1800) {
    let at = t;
    if (d.act === 1) for (let k = 0; k < 20 && inGate(at); k++) at += 200;
    if (at >= d.durationMs - 1800) break;
    hawks.push({ at: Math.round(at), y0: Math.round(rng.range(12, 20)) });
    if (rng.chance(d.pairs) && at + 900 < d.durationMs - 1800) {
      // a second hawk, close behind: it picks its line while the first dives
      hawks.push({ at: Math.round(at + rng.range(700, 950)), y0: Math.round(rng.range(12, 20)) });
      at += 900;
    }
    t = at + rng.range(d.hawkEvery[0], d.hawkEvery[1]);
  }
  return { seed, d, length, clouds, hills, hawks, guide };
}

/* ------------------------------------------------------------- the hawks */

export type HawkPhase = 'off' | 'circle' | 'warn' | 'dive' | 'gone';

export function hawkPhase(setup: PigeonSetup, h: Hawk, t: number): HawkPhase {
  const { circleMs, warnMs, diveMs } = setup.d;
  if (t < h.at - diveMs - warnMs - circleMs) return 'off';
  if (t < h.at - diveMs - warnMs) return 'circle';
  if (t < h.at - diveMs) return 'warn';
  if (t < h.at + diveMs * 1.4) return 'dive';
  return 'gone';
}

/** When a hawk picks its line. */
export const lockTime = (setup: PigeonSetup, h: Hawk) => h.at - setup.d.diveMs - setup.d.warnMs;

/** Where a hawk aims: where the pigeon is going (a short lead on its climb or sink). */
export function aimAt(y: number, vy: number): number {
  return Math.max(2, Math.min(98, y + vy * HAWK_LEAD_S));
}

/**
 * A hawk's position relative to the pigeon at time t: dx ahead of it (units)
 * and its height. While circling it loops above and ahead; while warning it
 * hangs still; then it dives in a straight line through (0, lock).
 */
export function hawkPos(setup: PigeonSetup, h: Hawk, t: number, lock: number | null): { dx: number; y: number } {
  const ph = hawkPhase(setup, h, t);
  if (ph === 'off' || ph === 'circle' || lock === null) {
    const a = (t - h.at) / 260;
    return { dx: HAWK_DX + Math.sin(a) * 7, y: h.y0 + Math.cos(a) * 3.5 };
  }
  const start = { dx: HAWK_DX + Math.sin((lockTime(setup, h) - h.at) / 260) * 7, y: h.y0 + Math.cos((lockTime(setup, h) - h.at) / 260) * 3.5 };
  if (ph === 'warn') return start;
  const k = (t - (h.at - setup.d.diveMs)) / setup.d.diveMs; // 0 → 1 at the strike, then on past
  return { dx: start.dx * (1 - k), y: start.y + (lock - start.y) * k };
}

/* ------------------------------------------------------------- the flight */

export function pigeonStart(setup: PigeonSetup): PigeonState {
  return {
    setup, t: 0, y: 46, vy: -30, held: false, hits: 0, safeUntil: 0,
    locks: setup.hawks.map(() => null), dodged: 0, bounces: 0, by: { hawk: 0, cloud: 0, hill: 0 },
  };
}

export const feathersLeft = (s: PigeonState) => Math.max(0, s.setup.d.feathers - s.hits);
/** The pigeon can't be hit right now (just hit, or the start's grace). */
export const isSafe = (s: PigeonState) => s.t < s.safeUntil || s.t < GRACE_MS;

function hit(s: PigeonState, kind: HitKind) {
  s.hits += 1;
  s.by = { ...s.by, [kind]: s.by[kind] + 1 };
  s.safeUntil = s.t + SAFE_MS;
  s.last = { kind, at: s.t, y: s.y };
  if (s.hits >= s.setup.d.feathers) s.over = 'lost';
}

/** Advance the flight by `ms` with the player holding (true) or not. */
export function pigeonTick(prev: PigeonState, ms: number, held: boolean): PigeonState {
  if (prev.over) return prev;
  const s: PigeonState = { ...prev, held };
  const { setup } = s;
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  const dt = STEP_MS / 1000;
  for (let i = 0; i < steps && !s.over; i++) {
    const t0 = s.t;
    s.t += STEP_MS;
    s.vy = Math.max(-MAX_UP, Math.min(MAX_DOWN, s.vy + (held ? -LIFT : GRAV) * dt));
    s.y += s.vy * dt;
    if (s.y < CEIL) { s.y = CEIL; s.vy = Math.max(0, s.vy); }
    const x = pigeonX(setup, s.t);

    // hawks pick their line, then strike
    for (let k = 0; k < setup.hawks.length; k++) {
      const h = setup.hawks[k];
      const lt = lockTime(setup, h);
      if (t0 < lt && s.t >= lt && s.locks[k] === null) {
        s.locks = [...s.locks];
        s.locks[k] = aimAt(s.y, s.vy);
      }
      if (t0 < h.at && s.t >= h.at) {
        const lock = s.locks[k] ?? aimAt(s.y, s.vy);
        if (Math.abs(s.y - lock) < HAWK_R && !isSafe(s)) hit(s, 'hawk');
        else s.dodged += 1;
      }
    }
    if (s.over) break;

    // the ground: a bounce, and a hit unless the pigeon is safe
    if (groundClear(setup, x, s.y) < 0) {
      s.y = Math.min(s.y, groundAt(setup, x) - R - 0.5);
      s.vy = -BOUNCE;
      s.bounces += 1;
      if (!isSafe(s)) hit(s, 'hill');
      if (s.over) break;
    }
    // storm clouds: a hit, and the pigeon flies on through
    if (!isSafe(s)) {
      for (const c of setup.clouds) {
        if (c.x1 < x - R || c.x0 > x + R) continue;
        if (cloudGap(c, x, s.y) < 0) { hit(s, 'cloud'); break; }
      }
    }
    if (s.over) break;
    if (s.t >= setup.d.durationMs) s.over = 'won';
  }
  return s;
}

/** 0 … 1 of the way to the garrison. */
export const flown = (s: PigeonState) => Math.min(1, s.t / s.setup.d.durationMs);

/** 0..100 for the result text: a clean flight is 100, each hit costs its share. */
export function pigeonScore(s: PigeonState): number {
  if (s.over !== 'won') return Math.round(flown(s) * 30);
  return Math.max(0, Math.round(100 * (1 - s.hits / s.setup.d.feathers)));
}

/* ------------------------------------------------- the pilot (tests, tools) */

/**
 * A simple pilot: picks the safest height for the next second and a half
 * (clear of clouds and hills, off any hawk's line), and holds or lets go to
 * get there. Not used in play: the tests wrap it in a player who reacts late,
 * and the browser check flies a real flight with it. `margin` is how much
 * room it wants around the pigeon.
 */
export interface PilotView { t: number; y: number; vy: number; locks: (number | null)[] }

export function pilotTarget(setup: PigeonSetup, v: PilotView, margin = 5): number {
  const x0 = pigeonX(setup, v.t);
  // on the way to a height: a moment to react, then about 30 units a second
  const path = (yc: number, tau: number) => {
    const reach = 30 * Math.max(0, tau - 0.12);
    return v.y + Math.max(-reach, Math.min(reach, yc - v.y));
  };
  const cols: { tau: number; col: Column }[] = [];
  for (let i = 1; i <= 11; i++) cols.push({ tau: i * 0.15, col: column(setup, x0 + setup.d.speed * i * 0.15) });
  let best = v.y;
  let bestCost = Infinity;
  for (let yc = 6; yc <= 92; yc += 2) {
    let cost = 0.02 * Math.abs(yc - v.y);
    for (const { tau, col } of cols) {
      // the middle of a gap is best, near an edge costs, inside costs a lot;
      // what is just ahead matters most, further on can be dealt with later
      const clear = clearIn(col, path(yc, tau));
      const w = tau < 0.3 ? 0.7 : tau < 1.0 ? 1 : 0.45;
      if (clear < 14) cost += w * 0.15 * (14 - clear);
      if (clear < margin) cost += w * (margin - clear) * (clear < 0 ? 3 : 1);
    }
    // be off every hawk's line when it strikes
    for (let k = 0; k < setup.hawks.length; k++) {
      const h = setup.hawks[k];
      const lock = v.locks[k];
      if (lock === null || h.at <= v.t || h.at > v.t + 2200) continue;
      const d = Math.abs(path(yc, (h.at - v.t) / 1000) - lock);
      const keep = HAWK_R + margin + 3;
      if (d < keep) cost += 25 * (keep - d);
    }
    if (cost < bestCost) { bestCost = cost; best = yc; }
  }
  return best;
}

/** Hold to climb or let go, to bring the pigeon to `want`. */
export function pilotHold(v: { y: number; vy: number }, want: number, gain = 3.2): boolean {
  const vWant = Math.max(-MAX_UP * 0.9, Math.min(MAX_DOWN * 0.9, (want - v.y) * gain));
  return v.vy > vWant;
}

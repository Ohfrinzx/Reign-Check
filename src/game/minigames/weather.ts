import { makeRng } from '../rng';

/**
 * THE LAST KILOMETRE: WALK IN THE WEATHER — the act-opening mini-game's
 * rules. No React, no DOM (ground rule 11). The UI runs the clock and passes
 * what the player is holding (-1 left, 0 nothing, 1 right) every tick; the
 * same seed and the same input always give the same walk.
 *
 * Dovra Day: the head of state walks the last kilometre on foot, "in
 * whatever weather there is", and Velmorrans believe the capital's weather
 * shows how honest the government is. You walk under an umbrella. Gusts push
 * it over; push back (hold left or right) to keep it upright.
 *   - Upright (within SAFE degrees): you stay dry.
 *   - Leaning: the rain gets in, the more the further it leans.
 *   - Too far (FLIP degrees): the umbrella turns inside out — a soaking, and
 *     a moment before you can hold it again.
 * A gust is signalled a moment before it hits (leaves blow across). You win
 * if you reach the Palace steps before you are soaked through.
 *
 * Harder each act (owner: played at the start of every act, "like it's a
 * new year", getting harder): drizzle, then wind, then a storm. Worse
 * weather while scandals are piling up — the country's belief made real.
 *
 * Calibrated with simulated walkers who react after a delay (good 150 ms
 * and watching for the leaves, average 230 ms, slow 350 ms): about
 * 100 / 100 / 73% in act 1, 100 / 100 / 7% in act 2, 97 / 58 / 0% in act 3.
 * A gust is never much stronger than the player's own push, so a walk is
 * always winnable by reacting in time; doing nothing always loses.
 */

export const STEP_MS = 50;
export const SAFE = 20;
export const FLIP = 58;
/** degrees per second² of push while a side is held */
export const PUSH = 240;
const DAMP = 2.6;
/** the umbrella wants to fall over a little: a top-heavy pole */
const TOPPLE = 0.6;
/** how long a gust is signalled before it hits */
export const WARN_MS = 650;
const FLIP_SOAK = 22;
const STUN_MS = 700;

export interface WeatherDifficulty {
  /** 1 drizzle … 3 storm (+0.5 with heavy scandal) */
  severity: number;
  durationMs: number;
  /** soak per second when leaning as far as it goes before flipping */
  rain: number;
  /** gusts: how many a minute, how strong (deg/s²), how long (ms) */
  gustsPerMin: number;
  gustForce: [number, number];
  gustMs: [number, number];
  /** the steady sway between gusts (deg/s²) */
  sway: number;
}

export function weatherDifficulty(act: number, scandal = 0): WeatherDifficulty {
  const severity = Math.min(3.5, Math.max(1, act) + (scandal >= 50 ? 0.5 : 0));
  return weatherAt(severity, SEVERITY_F[severity] ?? 1);
}

/** severity → how hard (0 … 1). Calibrated, see the header. */
const SEVERITY_F: Record<number, number> = { 1: 0.4, 1.5: 0.55, 2: 0.65, 2.5: 0.8, 3: 0.95, 3.5: 1.05 };

export function weatherAt(severity: number, f: number): WeatherDifficulty {
  return {
    severity,
    durationMs: 30000 + Math.round(f * 10000),
    rain: 26 + f * 18,
    gustsPerMin: 18 + f * 18,
    // never much stronger than the player's own push (PUSH): a gust is
    // always something you can hold, if you react in time
    gustForce: [150 + f * 60, 215 + f * 60],
    gustMs: [600, 1100 + f * 600],
    sway: 40 + f * 45,
  };
}

export interface Gust { at: number; ms: number; force: number; dir: -1 | 1 }
export interface WeatherSetup { gusts: Gust[]; d: WeatherDifficulty; swayPhase: number }

export interface WeatherState {
  setup: WeatherSetup;
  t: number;
  /** umbrella tilt in degrees (negative = left) and its angular speed */
  angle: number;
  speed: number;
  /** 0 … 100: soaked through at 100 */
  soak: number;
  flips: number;
  /** after a flip, no grip on the umbrella until this time */
  stunUntil: number;
  /** extra margin for a Chair the crowd already likes (walked-dovra) */
  dryBonus: number;
  last?: { kind: 'flip'; at: number };
  over?: 'won' | 'lost';
}

/** Lay out the day's weather. Same seed, same gusts. */
export function weatherSetup(seed: number, d: WeatherDifficulty): WeatherSetup {
  const rng = makeRng(seed);
  const gusts: Gust[] = [];
  const mean = 60000 / d.gustsPerMin;
  let t = 2200;
  let lastDir: -1 | 1 = rng.chance(0.5) ? 1 : -1;
  while (t < d.durationMs - 1500) {
    // gusts mostly switch sides, sometimes come twice from the same side
    const dir: -1 | 1 = rng.chance(0.7) ? (lastDir === 1 ? -1 : 1) : lastDir;
    gusts.push({
      at: Math.round(t), dir,
      ms: Math.round(rng.range(d.gustMs[0], d.gustMs[1])),
      force: Math.round(rng.range(d.gustForce[0], d.gustForce[1])),
    });
    lastDir = dir;
    t += mean * rng.range(0.6, 1.4);
  }
  return { gusts, d, swayPhase: rng.range(0, Math.PI * 2) };
}

export function weatherStart(setup: WeatherSetup, dryBonus = 0): WeatherState {
  return { setup, t: 0, angle: 0, speed: 0, soak: 0, flips: 0, stunUntil: 0, dryBonus };
}

/** The wind's push at time t (deg/s²): the steady sway plus any gust. */
export function windAt(setup: WeatherSetup, t: number): number {
  let w = Math.sin(t / 1300 + setup.swayPhase) * setup.d.sway;
  for (const g of setup.gusts) {
    if (t >= g.at && t < g.at + g.ms) {
      // a gust builds and fades
      const k = (t - g.at) / g.ms;
      w += g.dir * g.force * Math.sin(Math.PI * k);
    }
  }
  return w;
}

/** Gusts about to hit (for the leaves that warn of them). */
export function gustsComing(setup: WeatherSetup, t: number): Gust[] {
  return setup.gusts.filter((g) => t >= g.at - WARN_MS && t < g.at + g.ms);
}

/** Advance the walk by `ms` with the player holding `input`. */
export function weatherTick(prev: WeatherState, ms: number, input: -1 | 0 | 1): WeatherState {
  if (prev.over) return prev;
  const s: WeatherState = { ...prev };
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  const dt = STEP_MS / 1000;
  for (let i = 0; i < steps && !s.over; i++) {
    s.t += STEP_MS;
    const grip = s.t >= s.stunUntil ? input : 0;
    const acc = windAt(s.setup, s.t) + grip * PUSH - DAMP * s.speed + TOPPLE * s.angle;
    s.speed += acc * dt;
    s.angle += s.speed * dt;
    const lean = Math.abs(s.angle);
    if (lean >= FLIP) {
      s.soak += FLIP_SOAK;
      s.flips += 1;
      s.angle = 0;
      s.speed = 0;
      s.stunUntil = s.t + STUN_MS;
      s.last = { kind: 'flip', at: s.t };
    } else if (lean > SAFE + s.dryBonus) {
      // a small wobble costs little, a deep lean a lot
      s.soak += s.setup.d.rain * Math.pow((lean - SAFE - s.dryBonus) / (FLIP - SAFE), 1.5) * dt;
    }
    if (s.soak >= 100) { s.soak = 100; s.over = 'lost'; break; }
    if (s.t >= s.setup.d.durationMs) s.over = 'won';
  }
  return s;
}

/** 0 … 1 of the kilometre walked. */
export const walked = (s: WeatherState) => Math.min(1, s.t / s.setup.d.durationMs);

/** 0..100 for the result text. */
export function weatherScore(s: WeatherState): number {
  return Math.max(0, Math.round(100 - s.soak));
}

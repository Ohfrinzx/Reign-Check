import { makeRng } from '../rng';

/**
 * THE LAST KILOMETRE — the walkabout mini-game's rules. No React, no DOM
 * (ground rule 11). The UI runs the clock and calls paradePress() and
 * paradeTick() with the time; the same seed and the same presses at the same
 * moments always give the same result.
 *
 * The Chair walks the last kilometre on foot, as on Dovra Day. Things come
 * down the road at you and reach you at a set moment. Each one wants ONE
 * move, pressed close to that moment:
 *   egg → DUCK · child with flowers → STOP · cheering crowd → WAVE ·
 *   protest sign → nothing (react to it and the cameras catch you).
 * A wrong move, a move at the wrong moment or a miss costs composure. Lose
 * all of it and the walk is over. Pictures, not reading.
 *
 * Calibrated with simulated walkers whose timing spreads by σ ms (and who
 * press the wrong move 4% of the time, flinch at 15% of signs): σ 90 / 130
 * / 170 win about 95 / 89 / 62% in act 1, 88 / 81 / 49% in act 2 and
 * 83 / 71 / 38% in act 3. Doing nothing always loses.
 */

export type ParadeAction = 'duck' | 'wave' | 'stop';
export type ParadeKind = 'egg' | 'flowers' | 'cheer' | 'sign';
export const ANSWER: Record<ParadeKind, ParadeAction | null> = { egg: 'duck', flowers: 'stop', cheer: 'wave', sign: null };

/** ms either side of the moment that still count */
export const WINDOW_MS = 320;
/** ms either side that count as perfect */
export const PERFECT_MS = 150;
export const COMPOSURE = 3;

export interface ParadeDifficulty {
  events: number;
  /** ms an item takes to come down the road (what the player sees) */
  travelMs: number;
  /** ms between items (a range) */
  gapMs: [number, number];
  /** share of protest signs (do nothing) */
  signShare: number;
}

export function paradeDifficulty(act: number): ParadeDifficulty {
  if (act <= 1) return { events: 18, travelMs: 1900, gapMs: [950, 1400], signShare: 0.12 };
  if (act === 2) return { events: 22, travelMs: 1650, gapMs: [850, 1250], signShare: 0.16 };
  return { events: 26, travelMs: 1450, gapMs: [760, 1120], signShare: 0.2 };
}

export interface ParadeItem { id: string; kind: ParadeKind; t: number }
export interface ParadeSetup { items: ParadeItem[]; d: ParadeDifficulty; endMs: number }
export type Verdict = 'perfect' | 'good' | 'wrong' | 'early' | 'miss' | 'ignored' | 'flinched';
export interface ParadeState {
  setup: ParadeSetup;
  /** verdict per item id once judged */
  judged: Record<string, Verdict>;
  composure: number;
  /** what the last press or tick decided, for the UI */
  last?: { id?: string; verdict: Verdict; at: number };
  over?: 'won' | 'lost';
}

export function paradeSetup(seed: number, d: ParadeDifficulty): ParadeSetup {
  const rng = makeRng(seed);
  const items: ParadeItem[] = [];
  let t = d.travelMs + 600; // the first item is seen coming from the start
  let lastKind: ParadeKind | null = null;
  for (let i = 0; i < d.events; i++) {
    let kind: ParadeKind;
    if (i < 3) kind = (['cheer', 'egg', 'flowers'] as const)[i]; // one of each to start
    else if (rng.chance(d.signShare) && lastKind !== 'sign') kind = 'sign';
    else kind = rng.pick(['egg', 'flowers', 'cheer'] as const);
    items.push({ id: `p${i + 1}`, kind, t });
    lastKind = kind;
    t += Math.round(rng.range(d.gapMs[0], d.gapMs[1]));
  }
  return { items, d, endMs: t };
}

export function paradeStart(setup: ParadeSetup, composure = COMPOSURE): ParadeState {
  return { setup, judged: {}, composure };
}

function settle(s: ParadeState) {
  if (s.composure <= 0) { s.over = 'lost'; return; }
  if (s.setup.items.every((x) => s.judged[x.id])) s.over = 'won';
}

const costly = (v: Verdict) => v === 'wrong' || v === 'early' || v === 'miss' || v === 'flinched';

/** The player pressed a move at `now` (ms since the walk began). */
export function paradePress(prev: ParadeState, action: ParadeAction, now: number): ParadeState {
  if (prev.over) return prev;
  const s: ParadeState = { ...prev, judged: { ...prev.judged } };
  // the nearest unjudged item within reach of this moment
  const open = s.setup.items.filter((x) => !s.judged[x.id] && Math.abs(x.t - now) <= WINDOW_MS * 1.6);
  open.sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now));
  const it = open[0];
  let verdict: Verdict;
  if (!it) verdict = 'early'; // nothing there: a nervous Chair
  else if (it.kind === 'sign') verdict = 'flinched';
  else if (Math.abs(it.t - now) > WINDOW_MS) verdict = now < it.t ? 'early' : 'miss';
  else if (ANSWER[it.kind] !== action) verdict = 'wrong';
  else verdict = Math.abs(it.t - now) <= PERFECT_MS ? 'perfect' : 'good';
  // a press with nothing near it costs composure but judges nothing
  if (it && verdict !== 'early') s.judged[it.id] = verdict;
  if (it && verdict === 'early' && Math.abs(it.t - now) <= WINDOW_MS * 1.6) s.judged[it.id] = 'early';
  if (costly(verdict)) s.composure -= 1;
  s.last = { ...(it ? { id: it.id } : {}), verdict, at: now };
  settle(s);
  return s;
}

/** Time passes: items that went by without the right move are judged. */
export function paradeTick(prev: ParadeState, now: number): ParadeState {
  if (prev.over) return prev;
  const late = prev.setup.items.filter((x) => !prev.judged[x.id] && now > x.t + WINDOW_MS);
  if (!late.length) return prev;
  const s: ParadeState = { ...prev, judged: { ...prev.judged } };
  for (const it of late) {
    const v: Verdict = it.kind === 'sign' ? 'ignored' : 'miss';
    s.judged[it.id] = v;
    if (costly(v)) s.composure -= 1;
    s.last = { id: it.id, verdict: v, at: now };
    if (s.composure <= 0) break;
  }
  settle(s);
  return s;
}

/** 0..100 for the result text. */
export function paradeScore(s: ParadeState): number {
  const n = s.setup.items.length || 1;
  const pts = Object.values(s.judged).reduce((a, v) => a + (v === 'perfect' || v === 'ignored' ? 1 : v === 'good' ? 0.7 : 0), 0);
  return Math.round((pts / n) * 100);
}

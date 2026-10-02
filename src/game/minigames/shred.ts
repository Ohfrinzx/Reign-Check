import { makeRng } from '../rng';

/**
 * SHRED THE LEDGER — the cover-up mini-game's rules. No React, no DOM
 * (ground rule 11). The UI passes the time (ms since the game began).
 *
 * Auditors are going through your office. Papers ride two conveyor belts
 * across the desk towards the auditors' box. Tap every paper with the red
 * square Ilvet stamp to shred it before it falls into the box. Everything
 * else must reach the box untouched.
 *   - A dirty paper that reaches the box is EVIDENCE.
 *   - Shredding a clean paper JAMS the shredder for a moment (and the belts
 *     keep moving). It counts as a mistake.
 *   - Some papers arrive FACE-DOWN: the first tap turns one over (free),
 *     the second shreds it. Checking costs time, so you choose.
 *   - The belts speed up wave by wave. Tricks: a crossed-out red stamp
 *     (VOID — clean) from act 1, a round red seal (clean) from act 2, a pale
 *     red stamp (still dirty) in act 3.
 * Win with at most `allowed` mistakes (one in acts 1-2, two in act 3). Everything is reachable in
 * time by a player who keeps up: the difficulty is speed and attention,
 * never an impossible pile. Shapes and colours, not reading.
 *
 * Owner (2026-10-02): the first version (static piles) was "too easy"; this
 * one should be "a little more challenging", but never a game you lose
 * while doing everything right.
 */

export type PaperKind =
  | 'dirty'      // the red Ilvet stamp: shred
  | 'faded'      // a pale Ilvet stamp: still shred (act 3)
  | 'clean'      // a blue ministry seal: keep
  | 'plain'      // no stamp: keep
  | 'void'       // the red stamp crossed out: keep (act 2+)
  | 'redseal';   // a round red seal, not the square stamp: keep (act 3)
export const SHRED_KINDS: PaperKind[] = ['dirty', 'faded'];
export const isDirty = (k: PaperKind) => SHRED_KINDS.includes(k);

export const JAM_MS = 1200;
export const LANES = 2;
/** a paper's width as a share of the belt, in % (the UI draws it this wide) */
export const PAPER_W = 22;

export interface ShredDifficulty {
  /** waves of papers; the belts get faster each wave */
  waves: number;
  /** papers per wave */
  perWave: number;
  /** ms a paper takes to cross the belt, first wave → last wave */
  crossMs: [number, number];
  /** ms between papers entering (a range), shrinking with the waves too */
  gapMs: [number, number];
  /** share of papers that arrive face-down */
  faceDown: number;
  /** which tricks can appear */
  tricks: PaperKind[];
  /** share of the papers to keep that are tricks */
  trickShare: number;
  /** mistakes allowed (evidence + jams); one more loses */
  allowed: number;
}

export function shredDifficulty(act: number): ShredDifficulty {
  // Calibrated with simulated players who look at one paper at a time and
  // sometimes mistap a moving paper (fast / average / slow): about
  // 88 / 82 / 67% in act 1, 84 / 81 / 47% in act 2, 85 / 75 / 30% in act 3.
  // The old static piles: an average player won 95% in act 1 ("too easy").
  // The speed stays where a slower player can keep up; the challenge is
  // attention: face-down papers, tricks from act 1, one mistake allowed in
  // acts 1-2. Doing nothing always loses.
  if (act <= 1) return { waves: 3, perWave: 8, crossMs: [4800, 3700], gapMs: [480, 820], faceDown: 0.3, tricks: ['void'], trickShare: 0.3, allowed: 1 };
  if (act === 2) return { waves: 3, perWave: 9, crossMs: [4900, 3700], gapMs: [460, 800], faceDown: 0.35, tricks: ['void', 'redseal'], trickShare: 0.35, allowed: 1 };
  return { waves: 3, perWave: 9, crossMs: [4700, 3500], gapMs: [440, 770], faceDown: 0.4, tricks: ['void', 'faded', 'redseal'], trickShare: 0.45, allowed: 2 };
}

export interface Paper {
  id: string;
  kind: PaperKind;
  lane: number;
  /** when it comes onto the belt */
  enterAt: number;
  /** ms it takes to cross */
  crossMs: number;
  faceDown: boolean;
  wave: number;
  /** a slight tilt, for the look */
  rot: number;
}
export interface ShredSetup { papers: Paper[]; d: ShredDifficulty; endMs: number }

export type PaperFate = 'shredded' | 'jammed' | 'boxed' | 'evidence';
export interface ShredState {
  setup: ShredSetup;
  /** papers turned face-up */
  flipped: string[];
  fate: Record<string, PaperFate>;
  /** the shredder is jammed until this time */
  jamUntil: number;
  jams: number;
  evidence: number;
  /** the last thing that happened, for the UI */
  last?: { kind: 'shred' | 'jam' | 'evidence' | 'flip'; id: string; at: number };
  over?: 'won' | 'lost';
}

/** Lay out the papers. Same seed, same papers on the same belts at the same moments. */
export function shredSetup(seed: number, d: ShredDifficulty): ShredSetup {
  const rng = makeRng(seed);
  const papers: Paper[] = [];
  let t = 400;
  let n = 0;
  for (let w = 0; w < d.waves; w++) {
    const f = d.waves > 1 ? w / (d.waves - 1) : 0;
    const crossMs = Math.round(d.crossMs[0] + (d.crossMs[1] - d.crossMs[0]) * f);
    const shrink = 1 - 0.15 * f;
    const dirty = Math.round(d.perWave * rng.range(0.4, 0.55));
    const kinds: PaperKind[] = [];
    for (let i = 0; i < d.perWave; i++) {
      if (i < dirty) kinds.push(d.tricks.includes('faded') && rng.chance(d.trickShare) ? 'faded' : 'dirty');
      else {
        const keepTricks = d.tricks.filter((k) => !isDirty(k));
        kinds.push(keepTricks.length && rng.chance(d.trickShare) ? rng.pick(keepTricks) : rng.pick(['clean', 'plain'] as PaperKind[]));
      }
    }
    rng.shuffle(kinds);
    const lastAt: number[] = Array(LANES).fill(-1e9);
    for (const kind of kinds) {
      // the lane that has been free longest, so papers on one belt never overlap
      const lane = lastAt[0] <= lastAt[1] ? 0 : 1;
      const minGap = crossMs * (PAPER_W + 4) / (100 + PAPER_W);
      const at = Math.max(t, lastAt[lane] + minGap);
      lastAt[lane] = at;
      papers.push({
        id: `d${++n}`, kind, lane, enterAt: Math.round(at), crossMs,
        faceDown: rng.chance(d.faceDown), wave: w, rot: Math.round(rng.range(-6, 6)),
      });
      t = at + rng.range(d.gapMs[0], d.gapMs[1]) * shrink;
    }
    t += 1200; // a breath between waves
  }
  const endMs = Math.max(...papers.map((p) => p.enterAt + p.crossMs)) + 200;
  return { papers, d, endMs };
}

export function shredStart(setup: ShredSetup): ShredState {
  return { setup, flipped: [], fate: {}, jamUntil: 0, jams: 0, evidence: 0 };
}

/** Where a paper is on its belt at `now`: -PAPER_W (entering) … 100 (at the box). */
export function paperX(p: Paper, now: number): number {
  return -PAPER_W + ((now - p.enterAt) / p.crossMs) * (100 + PAPER_W);
}

/** Papers on the belts now, not yet dealt with. */
export function onBelt(s: ShredState, now: number): Paper[] {
  return s.setup.papers.filter((p) => !s.fate[p.id] && now >= p.enterAt && paperX(p, now) < 100);
}

export const isFaceUp = (s: ShredState, p: Paper) => !p.faceDown || s.flipped.includes(p.id);

function settle(s: ShredState) {
  if (s.evidence + s.jams > s.setup.d.allowed) { s.over = 'lost'; return; }
  if (s.setup.papers.every((p) => s.fate[p.id])) s.over = 'won';
}

/** Tap a paper: turn it over if it is face-down, otherwise shred it. */
export function tapPaper(prev: ShredState, id: string, now: number): ShredState {
  if (prev.over) return prev;
  const p = onBelt(prev, now).find((x) => x.id === id);
  if (!p) return prev;
  if (!isFaceUp(prev, p)) {
    return { ...prev, flipped: [...prev.flipped, id], last: { kind: 'flip', id, at: now } };
  }
  if (now < prev.jamUntil) return prev; // jammed: nothing goes in
  const s: ShredState = { ...prev, fate: { ...prev.fate } };
  if (isDirty(p.kind)) {
    s.fate[id] = 'shredded';
    s.last = { kind: 'shred', id, at: now };
  } else {
    s.fate[id] = 'jammed';
    s.jams += 1;
    s.jamUntil = now + JAM_MS;
    s.last = { kind: 'jam', id, at: now };
  }
  settle(s);
  return s;
}

/** Time passes: papers that reach the box are judged. */
export function shredTick(prev: ShredState, now: number): ShredState {
  if (prev.over) return prev;
  const arriving = prev.setup.papers.filter((p) => !prev.fate[p.id] && paperX(p, now) >= 100);
  if (!arriving.length) return prev;
  const s: ShredState = { ...prev, fate: { ...prev.fate } };
  for (const p of arriving) {
    if (isDirty(p.kind)) {
      s.fate[p.id] = 'evidence';
      s.evidence += 1;
      s.last = { kind: 'evidence', id: p.id, at: now };
    } else s.fate[p.id] = 'boxed';
  }
  settle(s);
  return s;
}

/** Which wave is on the belts (for the HUD). */
export function currentWave(s: ShredState, now: number): number {
  const live = s.setup.papers.filter((p) => !s.fate[p.id] && now >= p.enterAt - 1500);
  return Math.min(s.setup.d.waves, (live[0]?.wave ?? s.setup.d.waves - 1) + 1);
}

/** 0..100 for the result text. */
export function shredScore(s: ShredState): number {
  const dirty = s.setup.papers.filter((p) => isDirty(p.kind)).length || 1;
  return Math.max(0, Math.round(100 - ((s.evidence + s.jams) / dirty) * 100));
}

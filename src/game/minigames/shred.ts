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
 *   - The belts speed up wave by wave. Tricks from act 1: a crossed-out red
 *     stamp (VOID — clean), a round red seal (clean), a pale red stamp
 *     (still dirty).
 * Win with at most `allowed` mistakes (one). Everything is reachable in
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

/**
 * How much faster than the "still too easy" tuning, by act. Owner
 * (2026-10-03): "2-3 times as fast"; then (2026-10-04), after 2x in act 1:
 * "The first level is really what the top difficulty should be". So act 3
 * is that 2x game, and acts 1 and 2 ramp up to it.
 */
export const SHRED_SPEED: Record<number, number> = { 1: 1.4, 2: 1.7, 3: 2 };

/** The settings before the speed-up (the previous, "still too easy" tuning). */
const SHRED_BASE: ShredDifficulty = {
  waves: 3, perWave: 10, crossMs: [3800, 2850], gapMs: [400, 690],
  faceDown: 0.42, tricks: ['void', 'redseal', 'faded'], trickShare: 0.38, allowed: 1,
};

export function shredDifficulty(act: number): ShredDifficulty {
  // History: static piles "too easy" (2026-10-02); belts "still way too
  // easy"; tuned for a quick player, then "2-3 times as fast" (2026-10-03);
  // then act 1's 2x became the top (2026-10-04). Belts and papers come
  // faster by act, with more waves so a game lasts about as long. See
  // docs/SYSTEMS.md §12 for the measured win rates.
  const k = SHRED_SPEED[Math.min(3, Math.max(1, act))];
  const b = SHRED_BASE;
  return {
    ...b,
    waves: Math.round(b.waves * k),
    crossMs: [Math.round(b.crossMs[0] / k), Math.round(b.crossMs[1] / k)],
    gapMs: [Math.round(b.gapMs[0] / k), Math.round(b.gapMs[1] / k)],
  };
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
  /** its number key, 0–9: pressing it is the same as tapping the paper.
   *  Never shared by two papers on the belts at once (assignKeys). */
  key: number;
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
        faceDown: rng.chance(d.faceDown), wave: w, rot: Math.round(rng.range(-6, 6)), key: 0,
      });
      t = at + rng.range(d.gapMs[0], d.gapMs[1]) * shrink;
    }
    t += 1200; // a breath between waves
  }
  assignKeys(papers);
  const endMs = Math.max(...papers.map((p) => p.enterAt + p.crossMs)) + 200;
  return { papers, d, endMs };
}

/** The number keys, in the order they are handed out (0 last, as on the
 *  keyboard). Up to 10 papers can be on the belts at once, counting a key's
 *  rest, so all ten digits are needed. */
export const SHRED_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
/** A key is only reused this long after its last paper reached the box, so
 *  a quick player never presses a number that has just changed papers. */
const KEY_REST_MS = 250;

/**
 * Number keys for laptop players (owner, 2026-10-06: trackpad users "can't
 * click the papers fast enough"; chose "numbers instead. single digits").
 * Handed out in turn, 1 → 9, 0, 1 …, skipping any number still on the belts.
 * No randomness, so the layout and the RNG are untouched.
 */
function assignKeys(papers: Paper[]) {
  const freeAt: number[] = SHRED_KEYS.map(() => -Infinity);
  let next = 0;
  for (const p of [...papers].sort((a, b) => a.enterAt - b.enterAt)) {
    let pick = -1;
    for (let i = 0; i < SHRED_KEYS.length; i++) {
      const k = (next + i) % SHRED_KEYS.length;
      if (freeAt[k] <= p.enterAt) { pick = k; break; }
    }
    // never happens at the shipped speeds (a test checks); the safest fallback
    if (pick < 0) pick = freeAt.indexOf(Math.min(...freeAt));
    p.key = SHRED_KEYS[pick];
    freeAt[pick] = p.enterAt + p.crossMs + KEY_REST_MS;
    next = (pick + 1) % SHRED_KEYS.length;
  }
}

/** The paper on the belts now that answers to this number key, if any. */
export function paperForKey(s: ShredState, key: number, now: number): Paper | undefined {
  return onBelt(s, now).find((p) => p.key === key);
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

import { makeRng } from '../rng';

/**
 * SHRED THE LEDGER — the cover-up mini-game's rules. No React, no DOM
 * (ground rule 11). The UI passes the time (ms since the game began).
 *
 * Auditors are coming down the corridor. A pile of papers lands on the desk;
 * tap every one with the red Ilvet stamp to shred it before the footsteps
 * reach the door, then the next pile. Everything else must stay: shredding
 * a clean paper jams the shredder for a moment, and it is a mistake. Tricks
 * come in later acts: a red stamp crossed out (VOID — clean), a pale red
 * stamp (still dirty), a red ministry seal (clean). A dirty paper left on
 * the desk when the auditors arrive is evidence. Shapes and colours, not
 * reading. Win with at most MISTAKES_ALLOWED mistakes (evidence + jams).
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

export const MISTAKES_ALLOWED = 2;
export const JAM_MS = 1200;

export interface ShredDifficulty {
  piles: number;
  /** papers per pile (a range) */
  papers: [number, number];
  /** ms the auditors take to reach the door, per pile */
  pileMs: number;
  /** which tricks can appear */
  tricks: PaperKind[];
  /** share of the papers to keep that are tricks */
  trickShare: number;
}

export function shredDifficulty(act: number): ShredDifficulty {
  // Calibrated with a simulated player who looks at each paper, then taps
  // (an average one wins about 95% / 70% / 60% by act; a slow one fooled
  // more often by the tricks, about 70% / 45% / 30%).
  if (act <= 1) return { piles: 5, papers: [6, 8], pileMs: 4200, tricks: [], trickShare: 0 };
  if (act === 2) return { piles: 6, papers: [6, 8], pileMs: 5400, tricks: ['void'], trickShare: 0.4 };
  return { piles: 5, papers: [7, 9], pileMs: 6200, tricks: ['void', 'faded', 'redseal'], trickShare: 0.25 };
}

export interface Paper { id: string; kind: PaperKind; x: number; y: number; rot: number }
export interface ShredSetup { piles: Paper[][]; d: ShredDifficulty }
export interface ShredState {
  setup: ShredSetup;
  pile: number;
  /** when the current pile landed */
  pileAt: number;
  shredded: string[];
  /** the shredder is jammed until this time */
  jamUntil: number;
  jams: number;
  evidence: number;
  /** the last thing that happened, for the UI */
  last?: { kind: 'shred' | 'jam' | 'evidence' | 'pile'; id?: string; at: number };
  over?: 'won' | 'lost';
}

/** Lay out the piles. Same seed, same papers in the same places. */
export function shredSetup(seed: number, d: ShredDifficulty): ShredSetup {
  const rng = makeRng(seed);
  const piles: Paper[][] = [];
  let n = 0;
  for (let p = 0; p < d.piles; p++) {
    const count = d.papers[0] + rng.int(d.papers[1] - d.papers[0] + 1);
    const dirty = Math.max(2, Math.round(count * rng.range(0.35, 0.55)));
    const kinds: PaperKind[] = [];
    for (let i = 0; i < count; i++) {
      if (i < dirty) kinds.push(d.tricks.includes('faded') && rng.chance(d.trickShare) ? 'faded' : 'dirty');
      else {
        const pool: PaperKind[] = ['clean', 'plain', ...d.tricks.filter((k) => !isDirty(k))];
        // tricks appear often enough to matter once they are in play
        kinds.push(d.tricks.length && rng.chance(d.trickShare) ? rng.pick(d.tricks.filter((k) => !isDirty(k))) : rng.pick(pool));
      }
    }
    rng.shuffle(kinds);
    // scattered on a 3×3 grid of spots, nudged, so papers never hide each other
    const spots = rng.shuffle(Array.from({ length: 9 }, (_, i) => i)).slice(0, count);
    piles.push(kinds.map((kind, i) => ({
      id: `d${++n}`,
      kind,
      x: (spots[i] % 3) * 33 + 4 + rng.range(-3, 3),
      y: Math.floor(spots[i] / 3) * 33 + 3 + rng.range(-3, 3),
      rot: Math.round(rng.range(-12, 12)),
    })));
  }
  return { piles, d };
}

export function shredStart(setup: ShredSetup, now = 0): ShredState {
  return { setup, pile: 0, pileAt: now, shredded: [], jamUntil: 0, jams: 0, evidence: 0 };
}

export const currentPile = (s: ShredState): Paper[] => s.setup.piles[s.pile] ?? [];

/** ms left before the auditors reach the door. */
export function shredTimeLeft(s: ShredState, now: number): number {
  return Math.max(0, s.setup.d.pileMs - (now - s.pileAt));
}

function settle(s: ShredState) {
  if (s.evidence + s.jams > MISTAKES_ALLOWED) s.over = 'lost';
}

/** Close the current pile: any dirty paper still on the desk is evidence. */
function closePile(s: ShredState, now: number) {
  const left = currentPile(s).filter((p) => isDirty(p.kind) && !s.shredded.includes(p.id)).length;
  s.evidence += left;
  if (left) s.last = { kind: 'evidence', at: now };
  settle(s);
  if (s.over) return;
  s.pile += 1;
  s.pileAt = now;
  s.jamUntil = 0;
  if (s.pile >= s.setup.piles.length) s.over = 'won';
  else s.last = { kind: 'pile', at: now };
}

/** Tap a paper: into the shredder it goes (unless the shredder is jammed). */
export function shredPaper(prev: ShredState, id: string, now: number): ShredState {
  if (prev.over || now < prev.jamUntil) return prev;
  const paper = currentPile(prev).find((p) => p.id === id);
  if (!paper || prev.shredded.includes(id)) return prev;
  const s: ShredState = { ...prev, shredded: [...prev.shredded, id] };
  if (isDirty(paper.kind)) {
    s.last = { kind: 'shred', id, at: now };
    // the last dirty paper gone: the pile is done early
    if (currentPile(s).every((p) => !isDirty(p.kind) || s.shredded.includes(p.id))) closePile(s, now);
  } else {
    s.jams += 1;
    s.jamUntil = now + JAM_MS;
    s.last = { kind: 'jam', id, at: now };
    settle(s);
  }
  return s;
}

/** Time passes: when the footsteps reach the door, the pile is closed. */
export function shredTick(prev: ShredState, now: number): ShredState {
  if (prev.over || shredTimeLeft(prev, now) > 0) return prev;
  const s: ShredState = { ...prev };
  closePile(s, now);
  return s;
}

/** 0..100 for the result text. */
export function shredScore(s: ShredState): number {
  const dirty = s.setup.piles.flat().filter((p) => isDirty(p.kind)).length || 1;
  return Math.max(0, Math.round(100 - ((s.evidence + s.jams) / dirty) * 100));
}

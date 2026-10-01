import { makeRng } from '../rng';

/**
 * HOLD THE PALACE — the coup mini-game's rules. No React, no DOM (ground
 * rule 11); the UI only shows a PalaceState and sends the player's taps.
 *
 * The board is Sarnica's old town: COLS avenues by ROWS blocks, with the
 * Palace gates below the last row. Rebel columns enter at the top on a
 * schedule (the Sable Office warns you one turn ahead) and move one block
 * towards the Palace every turn. You command three Guard units.
 *
 *   - Your turn: one order (MOVES_PER_TURN). An order moves one Guard unit
 *     one block in any direction (diagonals too), but never above the cordon
 *     (CORDON_ROW). Moving onto a rebel column attacks it: an ordinary column
 *     surrenders and your unit takes its block; an armoured one loses its
 *     armour and your unit stays put. You may also hold position.
 *   - Their turn: every column moves one block down (trucks two). A Guard
 *     unit in the way is a roadblock: the column swerves diagonally round it
 *     if it can, and otherwise stops in front of it.
 *   - A column that moves past the last row reaches the gates. GATES is how
 *     many columns break them: the first is held off, the second is not.
 *
 * Calibrated with a greedy bot (one order per turn was the setting where
 * skill matters: with two, it won every night): it holds the Palace about
 * 90% of nights in act 1, 64% in act 3, and 40-64% against the Army's real
 * strike. A player who does nothing always loses.
 *   - You win when every column has been stopped, or when dawn comes with the
 *     gates still standing.
 *
 * Every function is pure: it returns a new state. The same seed and the same
 * difficulty always give the same night, so a reload replays the same game.
 */

export const COLS = 5;
export const ROWS = 6;
export const MOVES_PER_TURN = 1;
export const GATES = 2;
/** Guard units hold the inner city: they cannot go above this row (the
 *  outer streets belong to whoever gets there first). */
export const CORDON_ROW = 2;
/** The clock shown to the player: turn 0 is 03:00, each turn 15 minutes. */
export const START_MINUTES = 3 * 60;
export const MINUTES_PER_TURN = 15;

export interface PalaceDifficulty {
  /** how many rebel columns come */
  columns: number;
  /** how many of them are armoured (take two attacks) */
  armoured: number;
  /** chance that a second column arrives in the same turn */
  pairChance: number;
  /** how many are trucks, which move two blocks a turn */
  fast: number;
}

export interface Spawn { turn: number; col: number; armour: 1 | 2; fast?: boolean }

export interface PalaceSetup {
  spawns: Spawn[];
  /** the turn dawn comes: the gates only have to hold until then */
  dawnTurn: number;
}

export interface Guard { id: string; col: number; row: number }
export interface Rebel { id: string; col: number; row: number; armour: 1 | 2; fast?: boolean }

export type PalaceEventKind = 'spawn' | 'advance' | 'swerve' | 'stall' | 'hit' | 'capture' | 'breach' | 'move';
export interface PalaceEvent { kind: PalaceEventKind; id: string; col: number; row: number }

export interface PalaceState {
  setup: PalaceSetup;
  turn: number;
  movesLeft: number;
  guards: Guard[];
  rebels: Rebel[];
  gates: number;
  /** how many the gates started with */
  gatesMax: number;
  /** spawns already on the board */
  spawned: number;
  captured: number;
  breaches: number;
  /** what happened in the last action, for the UI's animations */
  events: PalaceEvent[];
  over?: 'won' | 'lost';
}

export function palaceDifficulty(kind: 'plot' | 'strike', act: number, strikeOdds = 0.4): PalaceDifficulty {
  if (kind === 'strike') {
    // The Army's real move: the stronger it was, the more of it comes.
    if (strikeOdds < 0.35) return { columns: 8, armoured: 2, pairChance: 0.5, fast: 2 };
    if (strikeOdds < 0.55) return { columns: 8, armoured: 2, pairChance: 0.55, fast: 3 };
    return { columns: 9, armoured: 2, pairChance: 0.6, fast: 3 };
  }
  if (act <= 1) return { columns: 7, armoured: 1, pairChance: 0.4, fast: 2 };
  if (act === 2) return { columns: 7, armoured: 2, pairChance: 0.45, fast: 2 };
  return { columns: 8, armoured: 2, pairChance: 0.5, fast: 2 };
}

/** Lay out one night's attack from a seed. Same seed, same night. */
export function palaceSetup(seed: number, d: PalaceDifficulty): PalaceSetup {
  const rng = makeRng(seed);
  const spawns: Spawn[] = [];
  let turn = 0;
  let lastCol = -1;
  while (spawns.length < d.columns) {
    const pair = spawns.length < d.columns - 1 && spawns.length > 0 && rng.chance(d.pairChance);
    const n = pair ? 2 : 1;
    const used: number[] = [];
    for (let i = 0; i < n; i++) {
      let col = rng.int(COLS);
      for (let g = 0; g < 8 && (col === lastCol || used.includes(col)); g++) col = rng.int(COLS);
      used.push(col);
      spawns.push({ turn, col, armour: 1 });
    }
    lastCol = used[used.length - 1];
    // a breathing space now and then, so it is a fight and not a flood
    turn += rng.chance(0.3) ? 2 : 1;
  }
  // Armour goes on columns after the first two, so the opening is readable.
  const armourable = spawns.map((_, i) => i).filter((i) => i >= 2);
  rng.shuffle(armourable);
  for (const i of armourable.slice(0, d.armoured)) spawns[i].armour = 2;
  const fastable = spawns.map((_, i) => i).filter((i) => i >= 1 && spawns[i].armour === 1);
  rng.shuffle(fastable);
  for (const i of fastable.slice(0, d.fast)) spawns[i].fast = true;
  const lastTurn = spawns[spawns.length - 1].turn;
  return { spawns, dawnTurn: lastTurn + ROWS + 2 };
}

export function palaceStart(setup: PalaceSetup, gates = GATES): PalaceState {
  const s: PalaceState = {
    setup,
    turn: 0,
    movesLeft: MOVES_PER_TURN,
    guards: [
      { id: 'g1', col: 0, row: ROWS - 2 },
      { id: 'g2', col: 2, row: ROWS - 1 },
      { id: 'g3', col: 4, row: ROWS - 2 },
    ],
    rebels: [],
    gates,
    gatesMax: gates,
    spawned: 0,
    captured: 0,
    breaches: 0,
    events: [],
  };
  spawnDue(s);
  return s;
}

function clone(s: PalaceState): PalaceState {
  return {
    ...s,
    guards: s.guards.map((g) => ({ ...g })),
    rebels: s.rebels.map((r) => ({ ...r })),
    events: [],
  };
}

const guardAt = (s: PalaceState, col: number, row: number) => s.guards.find((g) => g.col === col && g.row === row);
const rebelAt = (s: PalaceState, col: number, row: number) => s.rebels.find((r) => r.col === col && r.row === row);
const inside = (col: number, row: number) => col >= 0 && col < COLS && row >= 0 && row < ROWS;

function spawnDue(s: PalaceState) {
  const due = s.setup.spawns.filter((sp, i) => i >= s.spawned && sp.turn <= s.turn);
  for (const sp of due) {
    const idx = s.spawned++;
    // The entry block is taken: the column waits a turn behind the city line.
    if (rebelAt(s, sp.col, 0) || guardAt(s, sp.col, 0)) { s.spawned--; break; }
    const r: Rebel = { id: `r${idx + 1}`, col: sp.col, row: 0, armour: sp.armour, ...(sp.fast ? { fast: true } : {}) };
    s.rebels.push(r);
    s.events.push({ kind: 'spawn', id: r.id, col: r.col, row: r.row });
  }
}

/** Columns the Sable Office says will enter next turn (shown as flares). */
export function nextSpawns(s: PalaceState): Spawn[] {
  return s.setup.spawns.filter((sp, i) => i >= s.spawned && sp.turn <= s.turn + 1);
}

/** Blocks a Guard unit can be ordered to this turn. */
export function guardTargets(s: PalaceState, guardId: string): { col: number; row: number; attack: boolean }[] {
  const g = s.guards.find((x) => x.id === guardId);
  if (!g || s.over || s.movesLeft <= 0) return [];
  const out: { col: number; row: number; attack: boolean }[] = [];
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const col = g.col + dc, row = g.row + dr;
      if (!inside(col, row) || row < CORDON_ROW || guardAt(s, col, row)) continue;
      out.push({ col, row, attack: !!rebelAt(s, col, row) });
    }
  }
  return out;
}

/** One order: move a Guard unit, or attack the column in that block. */
export function moveGuard(prev: PalaceState, guardId: string, col: number, row: number): PalaceState {
  if (!guardTargets(prev, guardId).some((t) => t.col === col && t.row === row)) return prev;
  const s = clone(prev);
  const g = s.guards.find((x) => x.id === guardId)!;
  const r = rebelAt(s, col, row);
  if (r) {
    r.armour = (r.armour - 1) as 1 | 2;
    if (r.armour <= 0) {
      s.rebels = s.rebels.filter((x) => x !== r);
      s.captured += 1;
      g.col = col; g.row = row;
      s.events.push({ kind: 'capture', id: r.id, col, row });
    } else {
      s.events.push({ kind: 'hit', id: r.id, col, row });
    }
  } else {
    g.col = col; g.row = row;
    s.events.push({ kind: 'move', id: g.id, col, row });
  }
  s.movesLeft -= 1;
  checkWin(s);
  return s;
}

/** The rebels move, new columns arrive, and a new turn begins. */
export function endTurn(prev: PalaceState): PalaceState {
  if (prev.over) return prev;
  const s = clone(prev);
  // Closest to the Palace moves first, so columns never block each other by accident.
  const order = [...s.rebels].sort((a, b) => b.row - a.row || a.col - b.col);
  for (const r of order) {
    if (!stepRebel(s, r)) continue;
    // a truck gets a second block, unless it was stopped or swerved
    if (r.fast && s.rebels.includes(r) && s.events[s.events.length - 1]?.kind === 'advance') stepRebel(s, r);
  }
  if (s.gates <= 0) { s.over = 'lost'; return s; }
  s.turn += 1;
  s.movesLeft = MOVES_PER_TURN;
  spawnDue(s);
  checkWin(s);
  if (!s.over && s.turn >= s.setup.dawnTurn) s.over = 'won';
  return s;
}

/** One block towards the Palace. Returns false once the column is gone. */
function stepRebel(s: PalaceState, r: Rebel): boolean {
  const row = r.row + 1;
  if (row >= ROWS) {
    s.rebels = s.rebels.filter((x) => x !== r);
    s.gates -= 1;
    s.breaches += 1;
    s.events.push({ kind: 'breach', id: r.id, col: r.col, row: ROWS });
    return false;
  }
  if (!guardAt(s, r.col, row) && !rebelAt(s, r.col, row)) {
    r.row = row;
    s.events.push({ kind: 'advance', id: r.id, col: r.col, row });
    return true;
  }
  if (guardAt(s, r.col, row)) {
    // Swerve round the roadblock, towards the side with more open road.
    const sides = [r.col - 1, r.col + 1].filter((c) => inside(c, row) && !guardAt(s, c, row) && !rebelAt(s, c, row));
    sides.sort((a, b) => openRoad(s, b) - openRoad(s, a) || Math.abs(a - 2) - Math.abs(b - 2));
    if (sides.length) {
      r.col = sides[0]; r.row = row;
      s.events.push({ kind: 'swerve', id: r.id, col: r.col, row });
      return true;
    }
  }
  s.events.push({ kind: 'stall', id: r.id, col: r.col, row: r.row });
  return true;
}

/** An order, then (once the turn's orders are used) the rebels' move. */
export function playOrder(prev: PalaceState, guardId: string, col: number, row: number): PalaceState {
  const s = moveGuard(prev, guardId, col, row);
  if (s === prev || s.over || s.movesLeft > 0) return s;
  const after = endTurn(s);
  return { ...after, events: [...s.events, ...after.events] };
}

/** Fewer Guard units down an avenue = more open road for a column. */
function openRoad(s: PalaceState, col: number): number {
  return -s.guards.filter((g) => g.col === col).length;
}

function checkWin(s: PalaceState) {
  if (s.gates <= 0) { s.over = 'lost'; return; }
  if (s.spawned >= s.setup.spawns.length && !s.rebels.length) s.over = 'won';
}

/** "03:45" for the clock. */
export function palaceClock(turn: number): string {
  const m = START_MINUTES + turn * MINUTES_PER_TURN;
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** 0..100: how well it went, for the result text (never shown as a number). */
export function palaceScore(s: PalaceState): number {
  const total = s.setup.spawns.length || 1;
  return Math.round((s.captured / total) * 70 + (s.gates / s.gatesMax) * 30);
}

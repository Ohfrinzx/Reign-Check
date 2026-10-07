import { makeRng } from '../rng';
import type { Rng } from '../types';

/**
 * WHO WAS IN THE STAIRWELL? — rules (mini-games slice 3, part B). Pure logic:
 * no React, no DOM, no Math.random (ground rules 4 and 11). The screen is
 * src/ui/minigames/StairwellGame.tsx; the card and story are in
 * content/mgStairwell.ts.
 *
 * The puzzle. The Sable Office kept a file on each of four or five people
 * who were in the Palace when Krast died (21:40). Every file holds a few
 * short statements about where people were at that minute. The rules the
 * player is told:
 *   - exactly ONE person lies, and every statement the liar makes is false;
 *   - everyone else tells the truth, in every statement;
 *   - exactly ONE person was in the stairwell.
 * The player stamps the liar and the person in the stairwell, then closes
 * the case. A wrong name for the stairwell loses.
 *
 * Fairness. `stairwellSetup` writes a night (who was where, who lies), has
 * each person say things that are true (or, for the liar, false), and then
 * KEEPS ADDING statements until a solver says there is exactly one answer:
 * one liar and one person in the stairwell that fit every statement. It
 * also asks a second, human-sized solver (`reasonOut`) whether the answer
 * can be found by plain deduction (no guessing and checking a whole room
 * layout), so a careful player is never beaten by a puzzle that only a
 * computer could finish. If a night cannot be made fair it is thrown away
 * and a new one is written. The same seed always gives the same puzzle.
 */

/* ------------------------------------------------------------ the Palace */

export type PlaceId = 'stairs' | 'landing' | 'archive' | 'office' | 'press' | 'clinic' | 'kitchen' | 'post';

export interface PlaceDef {
  id: PlaceId;
  /** the plan label */
  name: string;
  /** how it reads in a sentence: "in the archive" */
  at: string;
  /** plan position, 1-based columns and rows (3rd floor on top); `span` rows */
  col: number;
  row: number;
  span: number;
}

/**
 * The stairwell runs down the middle of the plan; the 3rd-floor landing is
 * the corridor outside its top door (a person there is NEAR the stairwell
 * but not in it: the red herring).
 */
export const PLACES: PlaceDef[] = [
  { id: 'stairs', name: 'Stairwell', at: 'in the stairwell', col: 2, row: 2, span: 2 },
  { id: 'landing', name: '3rd-floor landing', at: 'on the 3rd-floor landing', col: 2, row: 1, span: 1 },
  { id: 'archive', name: 'Archive', at: 'in the archive', col: 1, row: 1, span: 1 },
  { id: 'office', name: "Krast's office", at: "in Krast's office", col: 3, row: 1, span: 1 },
  { id: 'press', name: 'Press office', at: 'in the press office', col: 1, row: 2, span: 1 },
  { id: 'clinic', name: 'Clinic', at: 'in the clinic', col: 3, row: 2, span: 1 },
  { id: 'kitchen', name: 'Kitchen', at: 'in the kitchen', col: 1, row: 3, span: 1 },
  { id: 'post', name: 'Guard post', at: 'at the guard post', col: 3, row: 3, span: 1 },
];
const PLACE_IDS = PLACES.map((p) => p.id);
const PI = (id: PlaceId) => PLACE_IDS.indexOf(id);
const STAIRS = 0;
const N_PLACES = PLACES.length;
export const placeById = (id: PlaceId): PlaceDef => PLACES[PI(id)];

/** Palace staff on the night (call name is what the statements use). */
export interface Person { id: string; name: string; call: string; role: string }
export const PEOPLE: Person[] = [
  { id: 'rosk', name: 'Tavi Rosk', call: 'Rosk', role: "Krast's aide" },
  { id: 'pell', name: 'Joren Pell', call: 'Pell', role: 'Palace guard' },
  { id: 'henn', name: 'Dr. Mara Henn', call: 'Henn', role: 'Palace doctor' },
  { id: 'dorva', name: 'Esk Dorva', call: 'Dorva', role: 'Night cook' },
  { id: 'orrow', name: 'Lenk Orrow', call: 'Orrow', role: "Krast's driver" },
  { id: 'quill', name: 'Ilsa Quill', call: 'Quill', role: 'Archive clerk' },
  { id: 'utt', name: 'Col. Brav Utt', call: 'Utt', role: 'Army liaison' },
  { id: 'kord', name: 'Nessa Kord', call: 'Kord', role: 'Press secretary' },
  { id: 'marek', name: 'Old Marek', call: 'Marek', role: 'Night cleaner' },
  { id: 'vash', name: 'Teo Vash', call: 'Vash', role: 'Electrician' },
];

/* ------------------------------------------------------------ statements */

export type Stmt =
  | { k: 'at'; who: number; place: PlaceId }
  | { k: 'notAt'; who: number; place: PlaceId }
  | { k: 'with'; a: number; b: number }
  | { k: 'apart'; a: number; b: number }
  | { k: 'empty'; place: PlaceId }
  | { k: 'lies'; who: number }
  | { k: 'honest'; who: number };

export type StmtKind = Stmt['k'];

/** Is the statement true, in a night where `loc[i]` is person i's place (an index) and `liar` lies? */
function holds(s: Stmt, loc: ArrayLike<number>, liar: number): boolean {
  switch (s.k) {
    case 'at': return loc[s.who] === PI(s.place);
    case 'notAt': return loc[s.who] !== PI(s.place);
    case 'with': return loc[s.a] === loc[s.b];
    case 'apart': return loc[s.a] !== loc[s.b];
    case 'empty': {
      const p = PI(s.place);
      for (let i = 0; i < loc.length; i++) if (loc[i] === p) return false;
      return true;
    }
    case 'lies': return s.who === liar;
    case 'honest': return s.who !== liar;
  }
}

/** Is a statement true, given where everyone was (place ids by file) and who lies? (The tests use it.) */
export function stmtHolds(s: Stmt, world: PlaceId[], liar: number): boolean {
  return holds(s, world.map(PI), liar);
}

/** The statement as the file types it. */
export function say(s: Stmt, speaker: number, calls: string[]): string {
  switch (s.k) {
    case 'at': return s.who === speaker ? `I was ${placeById(s.place).at}.` : `${calls[s.who]} was ${placeById(s.place).at}.`;
    case 'notAt': return s.who === speaker ? `I was not ${placeById(s.place).at}.` : `${calls[s.who]} was not ${placeById(s.place).at}.`;
    case 'with':
      if (s.a === speaker) return `I was with ${calls[s.b]}.`;
      if (s.b === speaker) return `I was with ${calls[s.a]}.`;
      return `${calls[s.a]} and ${calls[s.b]} were together.`;
    case 'apart':
      if (s.a === speaker) return `I was not with ${calls[s.b]}.`;
      if (s.b === speaker) return `I was not with ${calls[s.a]}.`;
      return `${calls[s.a]} and ${calls[s.b]} were not together.`;
    case 'empty': return `Nobody was ${placeById(s.place).at}.`;
    case 'lies': return `${calls[s.who]} is lying.`;
    case 'honest': return `${calls[s.who]} is telling the truth.`;
  }
}

/** What a statement points at on the plan (for the highlight): a place, and whom it is about. */
export interface StmtMark { place?: PlaceId; who?: number; mode: 'at' | 'not' | 'empty' }
export function stmtMarks(s: Stmt): StmtMark[] {
  switch (s.k) {
    case 'at': return [{ place: s.place, who: s.who, mode: 'at' }];
    case 'notAt': return [{ place: s.place, who: s.who, mode: 'not' }];
    case 'empty': return [{ place: s.place, mode: 'empty' }];
    default: return [];
  }
}

/* ------------------------------------------------------------ difficulty */

export interface StairwellDifficulty {
  act: number;
  /** files on the desk */
  people: number;
  /** statements per file: at least / at most */
  min: number;
  max: number;
  /** the kinds of statement that can appear */
  kinds: StmtKind[];
  /**
   * How much guessing the answer may need. 1: take each person as the liar
   * and plain deduction finds the contradiction (or the answer). 2: for each
   * possible liar the player may also have to try each possible stairwell
   * person. Every act uses 1 (the maker never needed 2).
   */
  depth: 1 | 2;
  /** a truthful person on the landing, next to the stairwell */
  herring: boolean;
  /** files that accuse or vouch for someone (a statement about who lies), at least */
  accuse: number;
  /** extra statements added once the puzzle is already fair (more to read, more red herrings) */
  extra: number;
  /** how often the liar is also the person in the stairwell */
  liarIsStairs: number;
}

export function stairwellDifficulty(act: number): StairwellDifficulty {
  const a = Math.min(3, Math.max(1, Math.round(act) || 1));
  if (a === 1) {
    return { act: 1, people: 4, min: 2, max: 3, kinds: ['at', 'notAt', 'with'], depth: 1, herring: false, accuse: 0, extra: 0, liarIsStairs: 0.35 };
  }
  if (a === 2) {
    return { act: 2, people: 4, min: 2, max: 3, kinds: ['at', 'notAt', 'with', 'apart', 'empty', 'lies', 'honest'], depth: 1, herring: true, accuse: 1, extra: 3, liarIsStairs: 0.3 };
  }
  return { act: 3, people: 5, min: 2, max: 3, kinds: ['at', 'notAt', 'with', 'apart', 'empty', 'lies', 'honest'], depth: 1, herring: true, accuse: 2, extra: 3, liarIsStairs: 0.25 };
}

/* ------------------------------------------------------------- the setup */

export interface StairwellLine { text: string; st: Stmt }
export interface StairwellFile {
  id: string;
  name: string;
  call: string;
  role: string;
  lines: StairwellLine[];
}

export interface StairwellSetup {
  seed: number;
  d: StairwellDifficulty;
  files: StairwellFile[];
  /** the answer: file indexes */
  liar: number;
  stairs: number;
  /** the night as it was (place ids by file); only the rules and tests read it */
  world: PlaceId[];
}

/* ------------------------------------------------------------- the solver */

/** Every night with exactly one person in the stairwell (place indexes by file). */
const worldCache = new Map<number, Uint8Array[]>();
function worlds(n: number): Uint8Array[] {
  let all = worldCache.get(n);
  if (all) return all;
  all = [];
  const cur = new Uint8Array(n);
  const rec = (i: number, inStairs: number) => {
    if (i === n) {
      if (inStairs === 1) all!.push(Uint8Array.from(cur));
      return;
    }
    for (let p = 0; p < N_PLACES; p++) {
      const ins = inStairs + (p === STAIRS ? 1 : 0);
      if (ins > 1) continue;
      cur[i] = p;
      rec(i + 1, ins);
    }
  };
  rec(0, 0);
  worldCache.set(n, all);
  return all;
}

/** A way the night could have gone: who lied and where everyone was. */
interface Fit { w: number; liar: number }

function allFits(n: number): Fit[] {
  const out: Fit[] = [];
  const ws = worlds(n);
  for (let w = 0; w < ws.length; w++) for (let liar = 0; liar < n; liar++) out.push({ w, liar });
  return out;
}

/** Does this way fit one person's statement (true from everyone but the liar, false from the liar)? */
function fitsStmt(n: number, f: Fit, speaker: number, st: Stmt): boolean {
  return holds(st, worlds(n)[f.w], f.liar) === (speaker !== f.liar);
}

/** Every (liar, stairs person) pair that some night fits. */
function pairsOf(n: number, fits: Fit[]): Map<number, number> {
  const ws = worlds(n);
  const out = new Map<number, number>();
  for (const f of fits) {
    const stairs = ws[f.w].indexOf(STAIRS);
    const key = f.liar * n + stairs;
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

/** All fits for a set of files. */
function fitsFor(n: number, says: Stmt[][]): Fit[] {
  let fits = allFits(n);
  for (let i = 0; i < n; i++) for (const st of says[i]) fits = fits.filter((f) => fitsStmt(n, f, i, st));
  return fits;
}

export interface Solution { liar: number; stairs: number }
/** Every (liar, stairs) answer that fits all the statements. A fair puzzle has exactly one. */
export function stairwellSolutions(setup: Pick<StairwellSetup, 'files'>): Solution[] {
  const n = setup.files.length;
  const fits = fitsFor(n, setup.files.map((f) => f.lines.map((l) => l.st)));
  return [...pairsOf(n, fits).keys()].map((k) => ({ liar: Math.floor(k / n), stairs: k % n })).sort((a, b) => a.liar - b.liar || a.stairs - b.stairs);
}

/**
 * The human-sized solver. For each possible liar (and, at depth 2, each
 * possible stairwell person) it applies only plain deductions: a statement
 * that must be true or false pins a person to a place or rules one out,
 * "together" makes two places equal, "nobody was in..." empties a place,
 * somebody must be in the stairwell and only one person can be. If those
 * run into a contradiction, that guess is dead. Returns the guesses that
 * survive. A puzzle is fair to read when exactly one is left.
 */
export interface Reasoning { alive: Solution[]; deadByLiar: number }

const BIT = (p: number) => 1 << p;
const ALL = (1 << N_PLACES) - 1;
const single = (m: number) => m !== 0 && (m & (m - 1)) === 0;

/** Plain deduction for one guess. Returns false when it hits a contradiction. */
function propagate(says: Stmt[][], liar: number, stairs: number | null): { ok: boolean; dom: number[] } {
  const n = says.length;
  const dom = new Array<number>(n).fill(ALL);
  type Con =
    | { t: 'eq'; a: number; b: number }
    | { t: 'ne'; a: number; b: number }
    | { t: 'some'; place: number };
  const cons: Con[] = [];
  const fail = { ok: false, dom };
  for (let i = 0; i < n; i++) {
    const pol = i !== liar;
    for (const s of says[i]) {
      switch (s.k) {
        case 'at': dom[s.who] &= pol ? BIT(PI(s.place)) : ~BIT(PI(s.place)); break;
        case 'notAt': dom[s.who] &= pol ? ~BIT(PI(s.place)) : BIT(PI(s.place)); break;
        case 'with': cons.push(pol ? { t: 'eq', a: s.a, b: s.b } : { t: 'ne', a: s.a, b: s.b }); break;
        case 'apart': cons.push(pol ? { t: 'ne', a: s.a, b: s.b } : { t: 'eq', a: s.a, b: s.b }); break;
        case 'empty':
          if (pol) for (let j = 0; j < n; j++) dom[j] &= ~BIT(PI(s.place));
          else cons.push({ t: 'some', place: PI(s.place) });
          break;
        case 'lies': if ((s.who === liar) !== pol) return fail; break;
        case 'honest': if ((s.who !== liar) !== pol) return fail; break;
      }
    }
  }
  if (stairs !== null) {
    for (let j = 0; j < n; j++) dom[j] = j === stairs ? dom[j] & BIT(STAIRS) : dom[j] & ~BIT(STAIRS);
  }
  for (let round = 0; round < 40; round++) {
    const before = dom.join(',');
    for (const c of cons) {
      if (c.t === 'eq') {
        // two people together cannot be in the stairwell (only one was)
        const m = dom[c.a] & dom[c.b] & ~BIT(STAIRS);
        dom[c.a] = m; dom[c.b] = m;
      } else if (c.t === 'ne') {
        if (single(dom[c.a])) dom[c.b] &= ~dom[c.a];
        if (single(dom[c.b])) dom[c.a] &= ~dom[c.b];
      } else {
        const holders = dom.map((m, j) => (m & BIT(c.place) ? j : -1)).filter((j) => j >= 0);
        if (holders.length === 0) return fail;
        if (holders.length === 1) dom[holders[0]] = BIT(c.place);
      }
    }
    // exactly one person in the stairwell
    const inStairs = dom.map((m, j) => (m & BIT(STAIRS) ? j : -1)).filter((j) => j >= 0);
    if (inStairs.length === 0) return fail;
    if (inStairs.length === 1) dom[inStairs[0]] = BIT(STAIRS);
    for (let j = 0; j < n; j++) if (dom[j] === BIT(STAIRS)) for (let k = 0; k < n; k++) if (k !== j) dom[k] &= ~BIT(STAIRS);
    if (dom.some((m) => m === 0)) return fail;
    if (dom.join(',') === before) break;
  }
  return { ok: !dom.some((m) => m === 0), dom };
}

export function reasonOut(setup: Pick<StairwellSetup, 'files'>, depth: 1 | 2): Reasoning {
  const n = setup.files.length;
  const says = setup.files.map((f) => f.lines.map((l) => l.st));
  const alive: Solution[] = [];
  let deadByLiar = 0;
  for (let liar = 0; liar < n; liar++) {
    const base = propagate(says, liar, null);
    if (!base.ok) { deadByLiar++; continue; }
    const holders = base.dom.map((m, j) => (m & BIT(STAIRS) ? j : -1)).filter((j) => j >= 0);
    if (depth === 1) {
      if (holders.length === 1) alive.push({ liar, stairs: holders[0] });
      else for (const j of holders) alive.push({ liar, stairs: j });
      continue;
    }
    for (const j of holders) if (propagate(says, liar, j).ok) alive.push({ liar, stairs: j });
  }
  return { alive, deadByLiar };
}

/* -------------------------------------------------------------- the maker */

const KIND_WEIGHT: Record<StmtKind, number> = {
  at: 3, notAt: 3.2, with: 1.6, apart: 1.2, empty: 1.4, lies: 1.7, honest: 1.1,
};

/** Every statement that could be made about this many people, on this plan. */
function universe(n: number, kinds: StmtKind[]): Stmt[] {
  const out: Stmt[] = [];
  const has = (k: StmtKind) => kinds.includes(k);
  for (let who = 0; who < n; who++) {
    for (const place of PLACE_IDS) {
      if (has('at')) out.push({ k: 'at', who, place });
      if (has('notAt')) out.push({ k: 'notAt', who, place });
    }
    if (has('lies')) out.push({ k: 'lies', who });
    if (has('honest')) out.push({ k: 'honest', who });
  }
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (has('with')) out.push({ k: 'with', a, b });
      if (has('apart')) out.push({ k: 'apart', a, b });
    }
  }
  // ("nobody was in the stairwell" is false for everyone, so a liar would give themselves away: left out)
  if (has('empty')) for (const place of PLACE_IDS) if (place !== 'stairs') out.push({ k: 'empty', place });
  return out;
}

const sameStmt = (a: Stmt, b: Stmt) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Could one file's statements all be true at once? A file that argues with
 * itself would give its writer away (a truthful file never does), so the
 * maker keeps every file's lines consistent with each other. Plain deduction
 * is enough here (it is the same deduction the player has).
 */
function selfConsistent(stmts: Stmt[], speaker: number, n: number): boolean {
  const says: Stmt[][] = Array.from({ length: n }, (_, k) => (k === speaker ? stmts : []));
  for (let liar = 0; liar < n; liar++) {
    if (liar !== speaker && propagate(says, liar, null).ok) return true;
  }
  return false;
}

/** Exact version: is there some night, with somebody else lying, where every one of these statements is true? */
function couldAllBeTrue(n: number, stmts: Stmt[], speaker: number): boolean {
  const ws = worlds(n);
  for (let liar = 0; liar < n; liar++) {
    if (liar === speaker) continue;
    for (let w = 0; w < ws.length; w++) {
      if (stmts.every((st) => holds(st, ws[w], liar))) return true;
    }
  }
  return false;
}

/** How bad a statement is to read next to the others a person already made. */
function clashes(s: Stmt, have: Stmt[], speaker: number, n: number): boolean {
  for (const h of have) {
    if (sameStmt(h, s)) return true;
    // two statements about the same person and place, or the same pair
    if ((h.k === 'at' || h.k === 'notAt') && (s.k === 'at' || s.k === 'notAt') && h.who === s.who && h.place === s.place) return true;
    if ((h.k === 'with' || h.k === 'apart') && (s.k === 'with' || s.k === 'apart') && h.a === s.a && h.b === s.b) return true;
    if ((h.k === 'lies' || h.k === 'honest') && (s.k === 'lies' || s.k === 'honest') && h.who === s.who) return true;
    if (h.k === 'empty' && s.k === 'empty') return true;
  }
  // nobody lies about themselves being honest, and "at" about the speaker twice is silly
  if ((s.k === 'lies' || s.k === 'honest') && s.who === speaker) return true;
  if ((s.k === 'at' || s.k === 'notAt') && s.who === speaker && have.some((h) => (h.k === 'at' || h.k === 'notAt') && h.who === speaker)) return true;
  return !selfConsistent([...have, s], speaker, n);
}

interface Night { world: number[]; liar: number; stairs: number }

/** Write one night: who was where, who lies. */
function writeNight(rng: Rng, d: StairwellDifficulty): Night {
  const n = d.people;
  const stairs = rng.int(n);
  const liar = rng.chance(d.liarIsStairs) ? stairs : (stairs + 1 + rng.int(n - 1)) % n;
  const world = new Array<number>(n).fill(0);
  const others = PLACE_IDS.map((_, i) => i).filter((i) => i !== STAIRS);
  // spread people over the rooms a bit, but let two share one now and then
  const pool = rng.shuffle([...others]);
  for (let i = 0; i < n; i++) {
    if (i === stairs) { world[i] = STAIRS; continue; }
    world[i] = rng.chance(0.28) && i > 0 ? world[rng.int(i)] || pool[i % pool.length] : pool[i % pool.length];
  }
  if (d.herring) {
    // a truthful person right outside the stairwell door
    const cands = Array.from({ length: n }, (_, i) => i).filter((i) => i !== liar && i !== stairs);
    world[rng.pick(cands)] = PI('landing');
  }
  return { world, liar, stairs };
}

function make(seed: number, d: StairwellDifficulty, attempt: number): StairwellSetup | null {
  const rng = makeRng((seed * 2654435761 + attempt * 40503 + 17) >>> 0);
  const n = d.people;
  const night = writeNight(rng, d);
  const { world, liar } = night;
  const people = rng.shuffle(PEOPLE.slice()).slice(0, n);
  const calls = people.map((p) => p.call);
  const uni = universe(n, d.kinds);
  /** statements person i could truthfully (or, the liar, falsely) say about this night */
  const sayable = (i: number) => uni.filter((s) => holds(s, world, liar) === (i !== liar));
  const says: Stmt[][] = Array.from({ length: n }, () => []);

  // 1. each file starts with where that person says they were
  for (let i = 0; i < n; i++) {
    const own = sayable(i).filter((s) => (s.k === 'at' && s.who === i) || (s.k === 'notAt' && s.who === i && s.place === 'stairs'));
    let first: Stmt | undefined;
    if (d.herring && i !== liar && world[i] === PI('landing')) first = { k: 'at', who: i, place: 'landing' };
    else if (i === night.stairs && i !== liar && rng.chance(0.4)) first = { k: 'at', who: i, place: 'stairs' }; // an honest witness who was there
    else {
      // the culprit never admits it; a liar's claim is false anyway
      const where = own.filter((s) => s.k === 'at' && !(s.place === 'stairs' && i !== liar));
      first = rng.chance(0.85) && where.length
        ? rng.weighted(where, (s) => (s.k === 'at' && s.place === 'landing' ? 0.6 : 1))
        : rng.pick(own.filter((s) => s.k === 'notAt')) ?? rng.pick(where);
    }
    if (first) says[i].push(first);
  }

  // 2. a few files accuse someone or vouch for someone (two steps of reasoning), then everyone says one more thing
  for (let k = 0; k < d.accuse; k++) {
    const free = Array.from({ length: n }, (_, i) => i).filter((i) => !says[i].some((x) => x.k === 'lies' || x.k === 'honest'));
    const i = rng.pick(free);
    const cand = sayable(i).filter((x) => (x.k === 'lies' || x.k === 'honest') && !clashes(x, says[i], i, n));
    const x = rng.pick(cand);
    if (!x) return null;
    says[i].push(x);
  }
  const addOne = (i: number): boolean => {
    const cand = sayable(i).filter((s) => !clashes(s, says[i], i, n));
    const s = rng.weighted(cand, (c) => KIND_WEIGHT[c.k] * (c.k === 'at' && c.place === 'stairs' ? 0.35 : 1) * (c.k === 'notAt' && c.place === 'stairs' ? 1.6 : 1));
    if (!s) return false;
    says[i].push(s);
    return true;
  };
  for (let i = 0; i < n; i++) if (!addOne(i)) return null;
  for (let i = 0; i < n; i++) while (says[i].length < d.min) if (!addOne(i)) return null;

  // 3. add statements until the answer is unique and can be reasoned out
  const check = () => {
    const fits = fitsFor(n, says);
    const pairs = pairsOf(n, fits);
    if (pairs.size !== 1) return { fits, pairs, fair: false };
    const r = reasonOut({ files: says.map((ss, i) => ({ id: '', name: '', call: calls[i], role: '', lines: ss.map((st) => ({ text: '', st })) })) }, d.depth);
    return { fits, pairs, fair: r.alive.length === 1 };
  };
  let state = check();
  let guard = 0;
  while (!state.fair && guard++ < 40) {
    // the file with room for one more, and the statement that narrows the answer most
    const open = Array.from({ length: n }, (_, i) => i).filter((i) => says[i].length < d.max);
    if (!open.length) return null;
    let best: { i: number; s: Stmt; score: number }[] = [];
    let bestScore = Infinity;
    for (const i of open) {
      for (const s of sayable(i)) {
        if (clashes(s, says[i], i, n)) continue;
        const left = state.fits.filter((f) => fitsStmt(n, f, i, s));
        if (!left.length) continue;
        const pairs = pairsOf(n, left).size;
        const score = pairs * 1000 + new Set(left.map((f) => worlds(n)[f.w].join())).size / 100;
        if (score < bestScore - 1e-9) { bestScore = score; best = [{ i, s, score }]; }
        else if (Math.abs(score - bestScore) < 1e-9) best.push({ i, s, score });
      }
    }
    if (!best.length) return null;
    const pick = rng.weighted(best, (b) => KIND_WEIGHT[b.s.k] * (b.s.k === 'at' && b.s.place === 'stairs' ? 0.3 : 1));
    if (!pick) return null;
    says[pick.i].push(pick.s);
    state = check();
  }
  if (!state.fair) return null;

  // 4. more to read: true (or, for the liar, false) statements never undo a fair puzzle
  for (let k = 0; k < d.extra; k++) {
    const open = Array.from({ length: n }, (_, i) => i).filter((i) => says[i].length < d.max);
    if (!open.length) break;
    const i = rng.pick(open);
    addOne(i);
  }

  // a last, exact look: no file may argue with itself (it could be all true on some night)
  for (let i = 0; i < n; i++) {
    if (!couldAllBeTrue(n, says[i], i)) return null;
  }

  const files: StairwellFile[] = people.map((p, i) => ({
    id: p.id, name: p.name, call: p.call, role: p.role,
    lines: says[i].map((st) => ({ text: say(st, i, calls), st })),
  }));
  return {
    seed, d, files, liar, stairs: night.stairs,
    world: world.map((p) => PLACE_IDS[p]),
  };
}

/** The maker alone: null when no fair night turned up in 60 tries (the tests check it never does). */
export function tryStairwell(seed: number, d: StairwellDifficulty): StairwellSetup | null {
  for (let attempt = 0; attempt < 60; attempt++) {
    const s = make(seed, d, attempt);
    if (s) return s;
  }
  return null;
}

/** The puzzle for a seed. Always has exactly one answer (see tests). */
export function stairwellSetup(seed: number, d: StairwellDifficulty): StairwellSetup {
  return tryStairwell(seed, d) ?? fallback(seed, d);
}

/** Never used in practice (the tests prove the maker succeeds); kept so a bad seed cannot break the game. */
function fallback(seed: number, d: StairwellDifficulty): StairwellSetup {
  const file = (i: number, lines: Stmt[]): StairwellFile => {
    const p = PEOPLE[i];
    return { id: p.id, name: p.name, call: p.call, role: p.role, lines: lines.map((st) => ({ text: '', st })) };
  };
  const files = [
    file(0, [{ k: 'at', who: 0, place: 'archive' }, { k: 'notAt', who: 1, place: 'stairs' }]),
    file(1, [{ k: 'at', who: 1, place: 'kitchen' }, { k: 'notAt', who: 2, place: 'stairs' }]),
    file(2, [{ k: 'at', who: 2, place: 'clinic' }, { k: 'notAt', who: 0, place: 'stairs' }]),
    file(3, [{ k: 'at', who: 3, place: 'post' }, { k: 'at', who: 1, place: 'archive' }]),
  ];
  const calls = files.map((f) => f.call);
  files.forEach((f, i) => f.lines.forEach((l) => { l.text = say(l.st, i, calls); }));
  const found = stairwellSolutions({ files })[0] ?? { liar: 3, stairs: 3 };
  return { seed, d, files, liar: found.liar, stairs: found.stairs, world: ['archive', 'kitchen', 'clinic', 'stairs'] };
}

/* ------------------------------------------------------------- the player */

export interface StairwellState {
  /** the stamps: which file wears each (null = not placed yet) */
  liar: number | null;
  stairs: number | null;
  /** lines struck out as notes: "file:line" (a note only; it changes nothing) */
  struck: string[];
  /** how many times a stamp was moved to another file after it was first placed */
  moves: number;
  over: null | 'won' | 'lost';
  /** 0–100, set when the case is closed */
  score: number;
}

export function stairwellStart(): StairwellState {
  return { liar: null, stairs: null, struck: [], moves: 0, over: null, score: 0 };
}

export type Stamp = 'liar' | 'stairs';

/** Put a stamp on a file; the same stamp on the same file takes it off again. */
export function stampFile(s: StairwellState, stamp: Stamp, file: number): StairwellState {
  if (s.over) return s;
  const now = s[stamp];
  if (now === file) return { ...s, [stamp]: null };
  return { ...s, [stamp]: file, moves: s.moves + (now === null ? 0 : 1) };
}

export const lineKey = (file: number, line: number) => `${file}:${line}`;
/** Strike a line out (or bring it back). A note for the player. */
export function strikeLine(s: StairwellState, file: number, line: number): StairwellState {
  if (s.over) return s;
  const k = lineKey(file, line);
  return { ...s, struck: s.struck.includes(k) ? s.struck.filter((x) => x !== k) : [...s.struck, k] };
}

export const canClose = (s: StairwellState) => !s.over && s.liar !== null && s.stairs !== null;

/**
 * Score: a wrong name for the stairwell is 0. A right one is 100 when the
 * liar is right too, 60 when the liar stamp was wrong.
 */
export function stairwellScore(setup: StairwellSetup, s: StairwellState): number {
  if (s.stairs !== setup.stairs) return 0;
  return s.liar === setup.liar ? 100 : 60;
}

/** Close the case: one answer, no way back. */
export function closeCase(setup: StairwellSetup, s: StairwellState): StairwellState {
  if (!canClose(s)) return s;
  const won = s.stairs === setup.stairs;
  return { ...s, over: won ? 'won' : 'lost', score: stairwellScore(setup, s) };
}

/** The words on the result stamp, short and plain. */
export function stairwellWords(setup: StairwellSetup, s: StairwellState): { headline: string; detail: string } {
  const who = (i: number | null) => (i === null ? 'nobody' : setup.files[i].call);
  const culprit = setup.files[setup.stairs];
  const liar = setup.files[setup.liar];
  const same = setup.liar === setup.stairs;
  if (s.stairs === setup.stairs) {
    return {
      headline: `${culprit.name} was in the stairwell.`,
      detail: s.liar === setup.liar
        ? (same ? `${liar.call} lied about it, and you caught the lie.` : `${liar.call} was the liar, and you found the story that did not fit.`)
        : `Right name, wrong liar. ${same ? `${liar.call} lied to hide it.` : `The liar was ${liar.call}.`}`,
    };
  }
  return {
    headline: `Not ${who(s.stairs)}. It was ${culprit.call}.`,
    detail: same ? `${liar.call} lied, and was the one in the stairwell.` : `${liar.call} lied. ${culprit.call} was in the stairwell.`,
  };
}

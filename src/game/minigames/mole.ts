import { makeRng } from '../rng';
import type { Rng } from '../types';

/**
 * FIND THE MOLE — the leak mini-game's rules. No React, no DOM (ground rule
 * 11). Real time, but everything that moves is laid out in advance from the
 * seed (every person's walk is a list of timed points), and the game itself
 * advances in fixed steps (moleTick), so the same seed and the same taps at
 * the same moments always give the same result.
 *
 * The Interior Ministry's night floor on a security camera: six rooms on
 * either side of a corridor, a lift at one end and the stairs at the other.
 * Staff walk between the rooms. The newspaper's CONTACT (grey coat, hat)
 * comes up in the lift, visits a few rooms and leaves. Encounters:
 *   - THE MEETING (the mole): alone together in a room, and halfway through
 *     the mole hands over a white ENVELOPE (a small, short cue). Act 1 has two
 *     meetings and a bigger, longer cue; acts 2-3 one, shorter.
 *   - Decoys: someone ALONE with the contact for a while but no envelope
 *     (from act 2 they offer a COFFEE cup instead: not the cue), a GROUP in a
 *     room with the contact, and people passing in the corridor.
 *   - From act 2 a room's camera cuts out for a few seconds (static). It can
 *     hide a decoy, or the start or end of the real meeting, but NEVER the
 *     envelope, and never most of the meeting (moleSetup checks this).
 * Tap people to mark suspects (a memory aid). When the contact leaves, the
 * line-up: name ONE person within LINEUP_MS. The mole wins; anyone else, or
 * no name in time, loses. Doing nothing always loses.
 *
 * Owner (2026-10-06): live watching, dark security camera, "skill + attention,
 * little reading"; never a game you lose while doing everything right (the
 * envelope is always on screen), but not 100% every time.
 */

export const STEP_MS = 100;
/** how long the line-up waits for a name */
export const LINEUP_MS = 20000;
/** the contact steps out of the lift */
const ENTER_AT = 1200;
/** the camera clock starts at 23:40:00 */
const CLOCK_START_S = 23 * 3600 + 40 * 60;

/* ------------------------------------------------------------ the floor */

export type RoomId = 'archive' | 'typing' | 'office' | 'copy' | 'kitchen' | 'records';
export type Area = RoomId | 'hall' | 'out';
export interface Pt { x: number; y: number }
export interface Room { id: RoomId; name: string; x0: number; y0: number; x1: number; y1: number; doorX: number; top: boolean }

/**
 * Floor units: 0..100 across and down. The screen may stretch the box, or
 * turn it on its side on a phone (the corridor then runs down the middle).
 */
export const CORRIDOR = { y0: 42, y1: 58 } as const;
export const DOOR_W = 9;
export const ROOMS: readonly Room[] = [
  { id: 'archive', name: 'Archive', x0: 0, y0: 0, x1: 33, y1: 42, doorX: 16.5, top: true },
  { id: 'typing', name: 'Typing pool', x0: 33, y0: 0, x1: 67, y1: 42, doorX: 50, top: true },
  { id: 'office', name: 'Office', x0: 67, y0: 0, x1: 100, y1: 42, doorX: 83.5, top: true },
  { id: 'copy', name: 'Copy room', x0: 0, y0: 58, x1: 33, y1: 100, doorX: 16.5, top: false },
  { id: 'kitchen', name: 'Kitchen', x0: 33, y0: 58, x1: 67, y1: 100, doorX: 50, top: false },
  { id: 'records', name: 'Records', x0: 67, y0: 58, x1: 100, y1: 100, doorX: 83.5, top: false },
];
const ROOM: Record<RoomId, Room> = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>;
export const roomById = (id: RoomId): Room => ROOM[id];
const isRoom = (a: Area): a is RoomId => a !== 'hall' && a !== 'out';

/** keep right: walking towards the lift on the upper lane, back on the lower */
const LANE_R = 47.8;
const LANE_L = 52.2;
/** the lift is at the right end of the corridor, the stairs at the left */
export const LIFT_X = 104;
export const STAIRS_X = -4;

/**
 * Places to stand in a room, as (across, depth): depth 0 is the corridor
 * wall (the door), 1 the outer wall. 0 is the contact's, 1 the person meeting
 * them, 2-3 the rest of a group, 4-7 everyone else (desks in the corners).
 */
const SPOTS: readonly [number, number][] = [
  [0.35, 0.46], [0.67, 0.46],
  [0.3, 0.74], [0.74, 0.76],
  [0.12, 0.8], [0.9, 0.82], [0.12, 0.22], [0.88, 0.2],
];
const FILLER_SPOTS = [4, 5, 6, 7];
/** spots in the corridor (a water cooler, a bench, a notice board, a window) */
export const HALL_SPOTS: readonly Pt[] = [
  { x: 7, y: 44.7 }, { x: 33.5, y: 55.3 }, { x: 66.5, y: 44.7 }, { x: 93, y: 55.3 },
];

export function spotPt(room: RoomId, i: number): Pt {
  const r = ROOM[room];
  const [u, v] = SPOTS[i];
  return {
    x: r.x0 + u * (r.x1 - r.x0),
    y: r.top ? r.y1 - v * (r.y1 - r.y0) : r.y0 + v * (r.y1 - r.y0),
  };
}

interface Place extends Pt { area: Area; spot: number }
function roomPlace(room: RoomId, spot: number): Place { return { area: room, spot, ...spotPt(room, spot) }; }
function hallPlace(i: number): Place { return { area: 'hall', spot: i, ...HALL_SPOTS[i] }; }
function outPlace(lift: boolean): Place { return { area: 'out', spot: lift ? 0 : 1, x: lift ? LIFT_X : STAIRS_X, y: 50 }; }

const innerDoor = (r: Room): Pt => ({ x: r.doorX, y: r.top ? r.y1 - 3.5 : r.y0 + 3.5 });
const corridorX = (p: Place): number => (isRoom(p.area) ? ROOM[p.area].doorX : p.x);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** The way from one place to another: out of the door, along the corridor (keeping right), in. */
function route(a: Place, b: Place): Pt[] {
  if (isRoom(a.area) && a.area === b.area) return [{ x: b.x, y: b.y }];
  const ax = corridorX(a);
  const bx = corridorX(b);
  const lane = bx >= ax ? LANE_R : LANE_L;
  const pts: Pt[] = [];
  if (isRoom(a.area)) pts.push(innerDoor(ROOM[a.area]));
  pts.push({ x: ax, y: lane }, { x: bx, y: lane });
  if (isRoom(b.area)) pts.push(innerDoor(ROOM[b.area]));
  pts.push({ x: b.x, y: b.y });
  // no zero-length legs
  return pts.filter((p, i) => dist(p, i ? pts[i - 1] : a) > 0.01);
}
function pathLen(a: Pt, pts: Pt[]): number {
  let n = 0;
  let c = a;
  for (const p of pts) { n += dist(c, p); c = p; }
  return n;
}
const walkMs = (a: Place, b: Place, speed: number) => Math.round((pathLen(a, route(a, b)) / speed) * 1000);
/** ms between a person's spot and the room's wall (walking in or out) */
const doorMs = (p: Place, speed: number) => (isRoom(p.area) ? Math.round(((dist(p, innerDoor(ROOM[p.area])) + 3.5) / speed) * 1000) : 0);

/** Which room a point is in ('hall' for the corridor, 'out' off the floor). */
export function areaAt(p: Pt): Area {
  if (p.x < 0 || p.x > 100) return 'out';
  if (p.y > CORRIDOR.y0 && p.y < CORRIDOR.y1) return 'hall';
  for (const r of ROOMS) if (p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) return r.id;
  return 'hall';
}

/* ------------------------------------------------------------ the people */

/** The staff who can be on the night floor, in roster order (number keys follow it). */
export const STAFF: readonly { id: string; job: string }[] = [
  { id: 'clerk', job: 'Clerk' },
  { id: 'typist', job: 'Typist' },
  { id: 'guard', job: 'Guard' },
  { id: 'cleaner', job: 'Cleaner' },
  { id: 'driver', job: 'Driver' },
  { id: 'archivist', job: 'Archivist' },
  { id: 'secretary', job: 'Secretary' },
  { id: 'aide', job: 'Aide' },
];

/** A timed point on someone's walk: they are here at t, and move in a straight line to the next one. */
export interface Key { t: number; x: number; y: number }
export interface Person { id: string; job: string; key: number; track: Key[] }

export type StopKind = 'meet' | 'lone' | 'group' | 'empty';
export interface Stop {
  kind: StopKind;
  room: RoomId;
  /** the contact at its spot */
  from: number;
  to: number;
  /** the contact crosses the room's wall */
  inAt: number;
  outAt: number;
  /** who is there on purpose: the mole (meet), a decoy (lone), a group */
  who: string[];
}
export interface Cue {
  kind: 'envelope' | 'coffee';
  /** the person handing it over (to the contact) */
  from: string;
  room: RoomId;
  at: number;
  ms: number;
  /** the giver's spot and the contact's, for the drawing */
  a: Pt;
  b: Pt;
}
export interface Blackout { room: RoomId; from: number; to: number }

export interface MoleDifficulty {
  act: number;
  staff: number;
  /** walking speed, floor units a second (the contact walks at 95%) */
  speed: number;
  meetings: number;
  /** ms the mole and the contact are alone together at their spots */
  meetMs: number;
  /** ms the envelope is on screen */
  cueMs: number;
  /** act 1: a bigger, brighter envelope */
  bigCue: boolean;
  /** decoys alone with the contact */
  lingerers: number;
  /** decoys hand over a coffee (from act 2) */
  coffee: boolean;
  groups: number;
  empties: number;
  blackouts: number;
  blackoutMs: number;
  /** a camera cuts out elsewhere just as the envelope changes hands (act 3) */
  distract: number;
}

export function moleDifficulty(act: number): MoleDifficulty {
  // Calibrated with simulated watchers (src/game/__tests__/mole.test.ts),
  // win rates by act: attentive about 99 / 96 / 80%, average 94 / 89 / 57%,
  // distracted 87 / 70 / 34%, a random name 1 in 5 / 6 / 8.
  if (act <= 1) {
    return {
      act: 1, staff: 5, speed: 22, meetings: 2, meetMs: 3800, cueMs: 1500, bigCue: true,
      lingerers: 1, coffee: false, groups: 1, empties: 0, blackouts: 0, blackoutMs: 0, distract: 0,
    };
  }
  if (act === 2) {
    return {
      act: 2, staff: 6, speed: 25, meetings: 1, meetMs: 3200, cueMs: 900, bigCue: false,
      lingerers: 1, coffee: true, groups: 2, empties: 1, blackouts: 2, blackoutMs: 2500, distract: 0.35,
    };
  }
  return {
    act: 3, staff: 8, speed: 28, meetings: 1, meetMs: 2600, cueMs: 800, bigCue: false,
    lingerers: 2, coffee: true, groups: 2, empties: 0, blackouts: 3, blackoutMs: 2800, distract: 0.5,
  };
}

export interface MoleSetup {
  seed: number;
  d: MoleDifficulty;
  /** the staff on the floor, in roster order; key = their number key (1..N) */
  staff: Person[];
  contact: Key[];
  mole: string;
  stops: Stop[];
  cues: Cue[];
  blackouts: Blackout[];
  /** the contact is off the floor; the line-up opens */
  watchMs: number;
  /** the contact leaves by the lift (or the stairs) */
  exitLift: boolean;
}

/* --------------------------------------------------------------- planning */

interface Stay { place: Place; from: number; to: number; fixed?: boolean }
interface Block { area: RoomId; p0: number; p1: number; allow: string[] }
interface Resv { area: Area; spot: number; t0: number; t1: number; who: string }

class Planner {
  blocks: Block[] = [];
  resv: Resv[] = [];
  constructor(readonly rng: Rng, readonly end: number) {}

  /** May this person be inside this area during [t0, t1]? */
  canBe(id: string, area: Area, t0: number, t1: number): boolean {
    if (!isRoom(area)) return true;
    return this.blocks.every((b) => b.area !== area || b.allow.includes(id) || t1 <= b.p0 || t0 >= b.p1);
  }

  /** The latest a person who arrived at p at `from` can stay (capped at `limit`); -1 if not even arriving is allowed. */
  maxDwell(id: string, p: Place, from: number, speed: number, limit: number): number {
    if (!isRoom(p.area)) return limit;
    const dm = doorMs(p, speed);
    let lim = limit;
    for (const b of this.blocks) {
      if (b.area !== p.area || b.allow.includes(id) || b.p1 <= from - dm) continue;
      if (b.p0 <= from + dm) return -1;
      lim = Math.min(lim, b.p0 - dm);
    }
    return lim;
  }

  spotFree(p: Place, t0: number, t1: number, who: string): boolean {
    if (p.area === 'out') return true;
    return !this.resv.some((r) => r.who !== who && r.area === p.area && r.spot === p.spot && r.t0 < t1 + 400 && r.t1 > t0 - 400);
  }

  reserve(p: Place, t0: number, t1: number, who: string) {
    if (p.area !== 'out') this.resv.push({ area: p.area, spot: p.spot, t0, t1, who });
  }

  /** A random place to go to: a free corner of another room, or a spot in the corridor. */
  randomPlace(not: Area): Place {
    if (this.rng.chance(0.22)) return hallPlace(this.rng.int(HALL_SPOTS.length));
    const rooms = ROOMS.filter((r) => r.id !== not);
    return roomPlace(this.rng.pick(rooms).id, this.rng.pick(FILLER_SPOTS));
  }

  /**
   * Fill the time between stay `s` and the next fixed stay `n` (or the end):
   * stay put, or run errands, never entering a room the contact is in
   * (unless invited). Sets s.to (when s is not fixed), may make n.from
   * earlier (arriving early and waiting), pushes errand stays into `out`.
   */
  fill(id: string, speed: number, s: Stay, n: Stay | null, depth: number, out: Stay[]): boolean {
    const rng = this.rng;
    if (n) {
      const w = walkMs(s.place, n.place, speed);
      if (s.fixed) {
        const arrive = s.to + w;
        if (arrive > n.from) return false;
        const slack = n.from - arrive;
        const dn = doorMs(n.place, speed);
        if ((slack < 5000 || depth > 5) && this.canBe(id, n.place.area, arrive - dn, n.to + dn) && this.spotFree(n.place, arrive, n.to, id)) {
          n.from = arrive;
          return true;
        }
      } else {
        const depart = n.from - w;
        const stayOk = depart >= s.from + 300 && this.maxDwell(id, s.place, s.from, speed, depart) >= depart;
        if (stayOk && (depart - s.from < 5000 || depth > 5 || rng.chance(0.2))) { s.to = depart; return true; }
      }
    } else if (!s.fixed) {
      const stayOk = this.maxDwell(id, s.place, s.from, speed, this.end) >= this.end;
      if (stayOk && (this.end - s.from < 5000 || depth > 5 || rng.chance(0.2))) { s.to = this.end; return true; }
    }
    if (depth > 8) return false;
    // an errand somewhere else first
    const nextFrom = n ? n.from : this.end;
    const dwellLim = s.fixed ? s.to : this.maxDwell(id, s.place, s.from, speed, nextFrom);
    for (let a = 0; a < 12; a++) {
      const x = this.randomPlace(s.place.area);
      const wSX = walkMs(s.place, x, speed);
      const wXN = n ? walkMs(x, n.place, speed) : 0;
      const lMin = s.fixed ? s.to : s.from + 500;
      const lMax = s.fixed ? s.to : Math.min(dwellLim, nextFrom - wXN - 1800 - wSX);
      if (lMax < lMin) continue;
      const leave = s.fixed ? s.to : Math.round(lMin + rng.next() * Math.min(lMax - lMin, 5500));
      const arrive = leave + wSX;
      if (n && arrive + 1800 + wXN > n.from) continue;
      if (this.maxDwell(id, x, arrive, speed, arrive + 1800) < arrive + 1800) continue;
      const xs: Stay = { place: x, from: arrive, to: arrive };
      const mark = out.length;
      const nFrom = n?.from;
      out.push(xs);
      if (this.fill(id, speed, xs, n, depth + 1, out) && this.spotFree(x, xs.from, xs.to, id)) {
        if (!s.fixed) s.to = leave;
        return true;
      }
      out.length = mark;
      if (n && nFrom !== undefined) n.from = nFrom;
    }
    // nothing better: stay put if allowed
    if (!s.fixed) {
      const depart = n ? n.from - walkMs(s.place, n.place, speed) : this.end;
      if (depart >= s.from + 300 && this.maxDwell(id, s.place, s.from, speed, depart) >= depart) { s.to = depart; return true; }
    }
    return false;
  }
}

/** Timed points for a list of stays: stand still during each, walk between them. */
function buildTrack(stays: Stay[]): Key[] {
  const keys: Key[] = [];
  const push = (t: number, p: Pt) => {
    const k = { t: Math.round(t), x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
    const last = keys[keys.length - 1];
    if (last && k.t <= last.t) {
      if (last.x === k.x && last.y === k.y) return;
      k.t = last.t + 1;
    }
    keys.push(k);
  };
  stays.forEach((s, i) => {
    if (i === 0) push(s.from, s.place);
    else {
      const prev = stays[i - 1];
      const pts = route(prev.place, s.place);
      const total = pathLen(prev.place, pts) || 1;
      let acc = 0;
      let c: Pt = prev.place;
      for (const p of pts) {
        acc += dist(c, p);
        c = p;
        push(prev.to + ((s.from - prev.to) * acc) / total, p);
      }
    }
    push(s.to, s.place);
  });
  return keys;
}

/** Where someone is at time t (and which way they are heading). */
export function posAt(track: Key[], t: number): { x: number; y: number; dx: number; dy: number; moving: boolean } {
  const n = track.length;
  if (t <= track[0].t) return { x: track[0].x, y: track[0].y, dx: 0, dy: 0, moving: false };
  if (t >= track[n - 1].t) return { x: track[n - 1].x, y: track[n - 1].y, dx: 0, dy: 0, moving: false };
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = track[lo];
  const b = track[hi];
  const f = (t - a.t) / (b.t - a.t || 1);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { x: a.x + dx * f, y: a.y + dy * f, dx, dy, moving: dx !== 0 || dy !== 0 };
}

/* ------------------------------------------------------------------ setup */

/** Lay out the night. Same seed, same night. */
export function moleSetup(seed: number, d: MoleDifficulty): MoleSetup {
  const rng = makeRng(seed);
  let last: MoleSetup | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const setup = tryNight(seed, d, rng);
    if (setup && checkNight(setup).ok) return setup;
    if (setup) last = setup;
  }
  // never seen at the shipped settings (a test runs hundreds of seeds); a
  // night with fewer decoys is still a fair game
  if (last) return last;
  return tryNight(seed, { ...d, lingerers: 0, groups: 0, empties: 2, blackouts: 0, distract: 0 }, makeRng(seed ^ 0x5bd1e995))!;
}

function tryNight(seed: number, d: MoleDifficulty, rng: Rng): MoleSetup | null {
  const cast = rng.shuffle(STAFF.map((s) => s.id)).slice(0, d.staff);
  const ids = STAFF.filter((s) => cast.includes(s.id)).map((s) => s.id);
  const mole = rng.pick(ids);
  const cSpeed = d.speed * 0.95;

  // ---- the contact's visit
  const kinds: StopKind[] = [
    ...Array<StopKind>(d.meetings).fill('meet'),
    ...Array<StopKind>(d.lingerers).fill('lone'),
    ...Array<StopKind>(d.groups).fill('group'),
    ...Array<StopKind>(d.empties).fill('empty'),
  ];
  for (let i = 0; i < 20; i++) {
    rng.shuffle(kinds);
    // not straight into the meeting, and never two meetings in a row
    if (kinds[0] !== 'meet' && !kinds.some((k, j) => k === 'meet' && kinds[j + 1] === 'meet')) break;
  }
  const exitLift = rng.chance(0.5);
  const cStays: Stay[] = [{ place: outPlace(true), from: 0, to: ENTER_AT }];
  const stops: Stop[] = [];
  const meetWin: { from: number; to: number }[] = [];
  let t = ENTER_AT;
  let cur: Place = outPlace(true);
  let prevRoom: RoomId | null = null;
  const used: RoomId[] = [];
  for (const kind of kinds) {
    const choices = ROOMS.filter((r) => r.id !== prevRoom).map((r) => r.id);
    const fresh = choices.filter((r) => !used.includes(r));
    const room = rng.pick(fresh.length ? fresh : choices);
    used.push(room);
    prevRoom = room;
    const place = roomPlace(room, 0);
    const from = t + walkMs(cur, place, cSpeed);
    let dur: number;
    let win = { from: 0, to: 0 };
    if (kind === 'meet' || kind === 'lone') {
      const wait = Math.round(rng.range(600, 1000));
      // a decoy lingers at least as long as the mole meets: time alone
      // together is not the tell, the envelope is
      const len = kind === 'meet' ? d.meetMs : Math.round(d.meetMs * rng.range(1, 1.4));
      const post = Math.round(rng.range(350, 700));
      win = { from: from + wait, to: from + wait + len };
      dur = wait + len + post;
    } else if (kind === 'group') dur = Math.round(rng.range(3000, 4000));
    else dur = Math.round(rng.range(2000, 2800));
    const to = from + dur;
    const dm = doorMs(place, cSpeed);
    stops.push({ kind, room, from, to, inAt: from - dm, outAt: to + dm, who: [] });
    meetWin.push(win);
    cStays.push({ place, from, to });
    t = to;
    cur = place;
  }
  const exit = outPlace(exitLift);
  const exitAt = t + walkMs(cur, exit, cSpeed);
  cStays.push({ place: exit, from: exitAt, to: exitAt + 30000 });
  const watchMs = Math.ceil((exitAt + 600) / STEP_MS) * STEP_MS;
  const end = watchMs + 4000;

  const plan = new Planner(rng, end);
  // the contact's spots are taken while it stands there
  for (const s of cStays) plan.reserve(s.place, s.from, s.to, 'contact');

  // ---- homes: everyone starts at a desk in a corner (or in the corridor)
  const speeds: Record<string, number> = {};
  const homes: Record<string, Place> = {};
  const taken = new Set<string>();
  for (const id of ids) {
    speeds[id] = d.speed * rng.range(0.94, 1.06);
    let p: Place;
    do {
      p = rng.chance(0.12) ? hallPlace(rng.int(HALL_SPOTS.length)) : roomPlace(rng.pick(ROOMS).id, rng.pick(FILLER_SPOTS));
    } while (taken.has(`${p.area}${p.spot}`));
    taken.add(`${p.area}${p.spot}`);
    homes[id] = p;
    // held until this person's plan says when they leave
    plan.reserve(p, 0, Infinity, id);
  }

  // ---- who is where on purpose
  const fixed: Record<string, Stay[]> = Object.fromEntries(ids.map((id) => [id, []]));
  const fits = (id: string, st: Stay): boolean => {
    const sp = speeds[id];
    const list = [...fixed[id], st].sort((a, b) => a.from - b.from);
    const i = list.indexOf(st);
    const prev = list[i - 1];
    const next = list[i + 1];
    const from = prev ? prev.to : 0;
    const at = prev ? prev.place : homes[id];
    if (from + walkMs(at, st.place, sp) + 600 > st.from) return false;
    if (next && st.to + walkMs(st.place, next.place, sp) + 600 > next.from) return false;
    return true;
  };
  const commit = (id: string, st: Stay) => {
    fixed[id].push(st);
    fixed[id].sort((a, b) => a.from - b.from);
  };
  const lingerers = rng.shuffle(ids.filter((x) => x !== mole));
  for (let k = 0; k < stops.length; k++) {
    const st = stops[k];
    const w = meetWin[k];
    if (st.kind === 'meet') {
      const s: Stay = { place: roomPlace(st.room, 1), from: w.from, to: w.to, fixed: true };
      if (!fits(mole, s)) return null;
      commit(mole, s);
      st.who = [mole];
    } else if (st.kind === 'lone') {
      const s: Stay = { place: roomPlace(st.room, 1), from: w.from, to: w.to, fixed: true };
      const who = lingerers.find((id) => !stops.some((x) => x.kind === 'lone' && x.who.includes(id)) && fits(id, s));
      if (!who) return null;
      commit(who, s);
      st.who = [who];
    } else if (st.kind === 'group') {
      const size = d.staff >= 6 && rng.chance(0.5) ? 3 : 2;
      const spots = rng.shuffle([1, 2, 3]).slice(0, size);
      for (const id of rng.shuffle([...ids])) {
        if (st.who.length >= size) break;
        const s: Stay = {
          place: roomPlace(st.room, spots[st.who.length]),
          from: st.inAt - Math.round(rng.range(800, 2400)),
          to: st.outAt + Math.round(rng.range(300, 1600)),
          fixed: true,
        };
        if (s.from < 900 || !fits(id, s)) continue;
        commit(id, s);
        st.who.push(id);
      }
      if (st.who.length < 2) return null;
    }
  }
  for (const st of stops) plan.blocks.push({ area: st.room, p0: st.inAt - 1200, p1: st.outAt + 800, allow: st.who });
  for (const id of ids) for (const s of fixed[id]) plan.reserve(s.place, s.from - 2500, s.to, id);

  // ---- everyone's night, one person at a time
  const staff: Person[] = [];
  for (const id of rng.shuffle([...ids])) {
    const sp = speeds[id];
    // free this person's own home reservation; it is re-made from the plan
    plan.resv = plan.resv.filter((r) => !(r.who === id && r.t1 === Infinity));
    const home: Stay = { place: homes[id], from: 0, to: 0 };
    const stays: Stay[] = [home];
    let s = home;
    for (const f of [...fixed[id], null]) {
      const out: Stay[] = [];
      if (!plan.fill(id, sp, s, f, 0, out)) return null;
      stays.push(...out);
      if (f) { stays.push(f); s = f; } else s = out[out.length - 1] ?? s;
    }
    for (const st of stays) plan.reserve(st.place, st.from, st.to, id);
    staff.push({ id, job: STAFF.find((x) => x.id === id)!.job, key: 0, track: buildTrack(stays) });
  }
  staff.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  staff.forEach((p, i) => { p.key = i + 1; });

  // ---- the hand-overs
  const cues: Cue[] = [];
  stops.forEach((st, k) => {
    const w = meetWin[k];
    const a = spotPt(st.room, 1);
    const b = spotPt(st.room, 0);
    if (st.kind === 'meet') {
      cues.push({ kind: 'envelope', from: mole, room: st.room, at: Math.round((w.from + w.to - d.cueMs) / 2), ms: d.cueMs, a, b });
    } else if (st.kind === 'lone' && d.coffee && rng.chance(0.8)) {
      const ms = Math.round(d.cueMs * 1.3);
      cues.push({ kind: 'coffee', from: st.who[0], room: st.room, at: Math.round(w.from + (w.to - w.from - ms) * rng.range(0.3, 0.7)), ms, a, b });
    }
  });

  // ---- the cameras that cut out
  const blackouts: Blackout[] = [];
  const add = (room: RoomId, from: number) => {
    const b = { room, from: Math.round(from), to: Math.round(from + d.blackoutMs) };
    if (b.from < 1500 || b.to > watchMs - 400) return false;
    if (blackouts.some((x) => x.room === room && x.from < b.to + 1500 && x.to > b.from - 1500)) return false;
    // never the envelope, and never most of a meeting
    for (const c of cues) {
      if (c.kind !== 'envelope' || c.room !== room) continue;
      if (b.from < c.at + c.ms + 350 && b.to > c.at - 350) return false;
    }
    for (let k = 0; k < stops.length; k++) {
      if (stops[k].kind !== 'meet' || stops[k].room !== room) continue;
      const w = meetWin[k];
      const hidden = Math.max(0, Math.min(w.to, b.to) - Math.max(w.from, b.from));
      if (hidden > (w.to - w.from) * 0.4) return false;
    }
    blackouts.push(b);
    return true;
  };
  if (d.blackouts > 0) {
    const want = d.blackouts;
    const env = cues.find((c) => c.kind === 'envelope');
    const meetK = stops.findIndex((s) => s.kind === 'meet');
    const lone = rng.shuffle(stops.map((st, k) => ({ st, w: meetWin[k] })).filter((x) => x.st.kind === 'lone'));
    const hideLone = (x: { st: Stop; w: { from: number; to: number } }) => add(x.st.room, x.w.from + (x.w.to - x.w.from) * rng.range(0.1, 0.35));
    // 1. the middle of a decoy's time alone with the contact: what happened in there?
    if (lone.length) hideLone(lone.shift()!);
    // 2. act 3: the start or the end of the real meeting (never the envelope)
    if (env && meetK >= 0 && blackouts.length < want && d.act >= 3) {
      if (rng.chance(0.5)) add(env.room, env.at - 400 - d.blackoutMs);
      else add(env.room, env.at + env.ms + 400);
    }
    // 3. act 3: a camera elsewhere cuts out just as the envelope changes hands
    if (env && blackouts.length < want && rng.chance(d.distract)) {
      const far = rng.shuffle(ROOMS.filter((r) => r.id !== env.room).map((r) => r.id));
      for (const r of far) if (add(r, env.at - rng.range(150, 450))) break;
    }
    // 4. the rest: another decoy, a group, or anywhere
    for (const x of lone) if (blackouts.length < want) hideLone(x);
    for (let i = 0; i < 30 && blackouts.length < want; i++) {
      const g = stops.filter((s) => s.kind === 'group' || s.kind === 'empty');
      if (g.length && rng.chance(0.6)) {
        const st = rng.pick(g);
        add(st.room, st.inAt + rng.range(-600, 1200));
      } else add(rng.pick(ROOMS).id, rng.range(2500, watchMs - 3500));
    }
    blackouts.sort((a, b) => a.from - b.from);
  }

  return { seed, d, staff, contact: buildTrack(cStays), mole, stops, cues, blackouts, watchMs, exitLift };
}

/* ---------------------------------------------------------- what is seen */

export const contactAt = (s: MoleSetup, t: number) => posAt(s.contact, t);
/** The contact is on the floor (between the lift doors opening and leaving). */
export function contactOnFloor(s: MoleSetup, t: number): boolean {
  const p = posAt(s.contact, t);
  return p.x > -1.5 && p.x < 101.5 && t < s.watchMs;
}

/** Staff inside a room at time t. */
export function staffIn(s: MoleSetup, room: RoomId, t: number): string[] {
  return s.staff.filter((p) => areaAt(posAt(p.track, t)) === room).map((p) => p.id);
}

/** Is this room's camera out at time t? */
export function blackedOut(s: MoleSetup, room: Area, t: number): boolean {
  return s.blackouts.some((b) => b.room === room && t >= b.from && t < b.to);
}

/** Hand-overs on screen at time t (a cue in a blacked-out room is not seen). */
export function cuesAt(s: MoleSetup, t: number): Cue[] {
  return s.cues.filter((c) => t >= c.at && t < c.at + c.ms);
}

/**
 * Checks a night is fair: the mole really is alone with the contact at the
 * meeting, nobody else is alone with the contact unless they are a decoy
 * placed there on purpose (or only for a moment), and the envelope is never
 * hidden by a camera cutting out.
 */
export function checkNight(s: MoleSetup): { ok: boolean; why?: string } {
  const env = s.cues.filter((c) => c.kind === 'envelope');
  if (!env.length || env.length !== s.stops.filter((x) => x.kind === 'meet').length) return { ok: false, why: 'envelopes' };
  for (const c of env) {
    if (c.from !== s.mole) return { ok: false, why: 'envelope from someone else' };
    for (let t = c.at; t < c.at + c.ms; t += STEP_MS) {
      const co = staffIn(s, c.room, t);
      if (co.length !== 1 || co[0] !== s.mole) return { ok: false, why: `not alone at the envelope (${co.join(',')})` };
      if (areaAt(posAt(s.contact, t)) !== c.room) return { ok: false, why: 'contact not there' };
    }
    if (s.blackouts.some((b) => b.room === c.room && b.from < c.at + c.ms && b.to > c.at)) return { ok: false, why: 'envelope blacked out' };
  }
  let run = { id: '', ms: 0 };
  for (let t = 0; t < s.watchMs; t += STEP_MS) {
    const area = areaAt(posAt(s.contact, t));
    if (!isRoom(area)) { run = { id: '', ms: 0 }; continue; }
    const co = staffIn(s, area, t);
    const stop = s.stops.find((x) => x.room === area && t >= x.inAt - 200 && t <= x.outAt + 200);
    if (co.length === 1) {
      const invited = stop && (stop.kind === 'meet' || stop.kind === 'lone') && stop.who[0] === co[0];
      if (!invited) {
        run = run.id === co[0] ? { id: co[0], ms: run.ms + STEP_MS } : { id: co[0], ms: STEP_MS };
        if (run.ms > 700) return { ok: false, why: `${co[0]} alone with the contact in ${area} at ${t}` };
      } else run = { id: '', ms: 0 };
    } else run = { id: '', ms: 0 };
    if (stop && (stop.kind === 'meet' || stop.kind === 'lone') && co.some((x) => x !== stop.who[0])) {
      return { ok: false, why: `someone walked into a private meeting in ${area} at ${t}` };
    }
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ play */

export type MolePhase = 'watch' | 'lineup' | 'over';
export interface MoleState {
  setup: MoleSetup;
  t: number;
  phase: MolePhase;
  /** staff marked as suspects while watching (a memory aid) */
  marks: string[];
  /** picked in the line-up, not yet named */
  picked?: string;
  named?: string;
  over?: 'won' | 'lost';
}

export function moleStart(setup: MoleSetup): MoleState {
  return { setup, t: 0, phase: 'watch', marks: [] };
}

/** Advance the night by `ms` (in STEP_MS steps). */
export function moleTick(prev: MoleState, ms: number): MoleState {
  if (prev.over) return prev;
  const s: MoleState = { ...prev };
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 0; i < steps && !s.over; i++) {
    s.t += STEP_MS;
    if (s.phase === 'watch' && s.t >= s.setup.watchMs) s.phase = 'lineup';
    if (s.phase === 'lineup' && s.t >= s.setup.watchMs + LINEUP_MS) {
      // nobody named: the mole goes home
      s.phase = 'over';
      s.over = 'lost';
    }
  }
  return s;
}

const known = (s: MoleState, id: string) => s.setup.staff.some((p) => p.id === id);

/** Mark or unmark a suspect while watching. */
export function toggleMark(prev: MoleState, id: string): MoleState {
  if (prev.phase !== 'watch' || !known(prev, id)) return prev;
  const marks = prev.marks.includes(id) ? prev.marks.filter((x) => x !== id) : [...prev.marks, id];
  return { ...prev, marks };
}

/** In the line-up: step someone forward (not yet named). */
export function pickSuspect(prev: MoleState, id: string): MoleState {
  if (prev.phase !== 'lineup' || !known(prev, id)) return prev;
  return { ...prev, picked: id };
}

/** Name the mole (the picked person, or `id`). One name: right wins, wrong loses. */
export function nameMole(prev: MoleState, id = prev.picked): MoleState {
  if (prev.phase !== 'lineup' || !id || !known(prev, id)) return prev;
  return { ...prev, picked: id, named: id, phase: 'over', over: id === prev.setup.mole ? 'won' : 'lost' };
}

/** The person with this number key (1..N). */
export function staffForKey(s: MoleSetup, key: number): Person | undefined {
  return s.staff.find((p) => p.key === key);
}

/** Seconds left in the line-up. */
export function lineupSecondsLeft(s: MoleState): number {
  return Math.max(0, Math.ceil((s.setup.watchMs + LINEUP_MS - s.t) / 1000));
}

/** The camera's clock: 23:40:00 plus the time watched. */
export function cctvClock(t: number): string {
  const sec = CLOCK_START_S + Math.floor(t / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(sec / 3600) % 24)}:${p(Math.floor(sec / 60) % 60)}:${p(sec % 60)}`;
}

/** 0..100 for the result text: the right name, marked early, few wrong marks. */
export function moleScore(s: MoleState): number {
  if (s.over !== 'won') return 0;
  const wrong = s.marks.filter((x) => x !== s.setup.mole).length;
  return Math.max(0, Math.min(100, 70 + (s.marks.includes(s.setup.mole) ? 15 : 0) + Math.max(0, 15 - wrong * 5)));
}

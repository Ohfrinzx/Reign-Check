import { makeRng } from '../rng';

/**
 * BREAD LINES — the unrest mini-game's rules. No React, no DOM (ground rule
 * 11). Real time, but simulated in fixed steps (breadTick), so the same
 * seed and the same taps at the same moments always give the same result.
 *
 * A map of Sarnica with DISTRICTS. Flare-ups start on a schedule; a flaring
 * district's heat climbs every second, and at 100 it burns (lost for the
 * rest of the game). You have two kinds of team, both limited:
 *   - NEGOTIATORS: slow. They walk there, then talk the heat down. When they
 *     finish, the district is calm for good.
 *   - POLICE: fast. The heat drops to zero at once. But the district
 *     remembers: it flares again soon, hotter, and climbing faster. And
 *     there are only so many baton charges (`charges`) in the afternoon.
 * The strategy is triage: talk where there is time, use police where there
 * is not, and never run out of both at once. You win if no more than
 * `burnsAllowed` districts burn before the clock runs out.
 */

export const DISTRICTS = [
  { id: 'market', name: 'Old Market', x: 30, y: 30 },
  { id: 'uni', name: 'University', x: 70, y: 22 },
  { id: 'docks', name: 'Docks Road', x: 14, y: 62 },
  { id: 'cathedral', name: 'Cathedral', x: 50, y: 50 },
  { id: 'rail', name: 'Rail Yards', x: 86, y: 52 },
  { id: 'east', name: 'East Flats', x: 66, y: 80 },
  { id: 'tram', name: 'Tram Depot', x: 32, y: 84 },
] as const;
export type DistrictId = (typeof DISTRICTS)[number]['id'];

export const STEP_MS = 100;
/** heat a new flare-up starts at */
const START_HEAT = 18;
/** heat the police leave behind when it comes back */
const REFLARE_HEAT = 42;
const TALK_TRAVEL_MS = 2000;
const TALK_RATE = 8;         // heat per second the negotiators take off
/** a calmed district stays calm this long, then it is just quiet again */
const CALM_FOR_MS = 14000;
const TALK_RETURN_MS = 800;
const POLICE_TRAVEL_MS = 400;
const POLICE_BUSY_MS = 4000; // after clearing, before the squad is free again
const REFLARE_AFTER_MS = 7000;
const REFLARE_RATE_MULT = 1.5;

export interface BreadDifficulty {
  durationMs: number;
  /** heat per second of a fresh flare-up */
  rate: number;
  /** ms between flare-ups (a range) */
  gapMs: [number, number];
  negotiators: number;
  police: number;
  /** how many times the police may be sent in all: every charge costs */
  charges: number;
  burnsAllowed: number;
}

export function breadDifficulty(act: number): BreadDifficulty {
  // Calibrated with a human-paced bot (one order every 0.7 s): talk where
  // there is time, police when it is hot. It holds about 100% / 80% / 70%
  // by act; talking only, or policing only, fails from act 2; doing
  // nothing always fails.
  if (act <= 1) return { durationMs: 45000, rate: 6.5, gapMs: [2200, 3000], negotiators: 2, police: 2, charges: 5, burnsAllowed: 1 };
  if (act === 2) return { durationMs: 45000, rate: 8, gapMs: [2000, 2800], negotiators: 2, police: 2, charges: 5, burnsAllowed: 1 };
  return { durationMs: 45000, rate: 8.5, gapMs: [1800, 2600], negotiators: 2, police: 2, charges: 6, burnsAllowed: 1 };
}

export interface Flare { at: number; district: DistrictId }
export interface BreadSetup { flares: Flare[]; d: BreadDifficulty }

export type DistrictMood = 'quiet' | 'flaring' | 'talking' | 'calm' | 'policed' | 'burning';
export interface DistrictState {
  id: DistrictId;
  mood: DistrictMood;
  heat: number;
  /** heat per second while flaring */
  rate: number;
  /** when the police leave, the time it flares again */
  reflareAt?: number;
  /** when the team sent here arrives */
  arriveAt?: number;
}
export interface Team { kind: 'talk' | 'police'; freeAt: number; at?: DistrictId }
export type BreadEventKind = 'flare' | 'reflare' | 'burn' | 'calm' | 'cleared' | 'sent';
export interface BreadEvent { kind: BreadEventKind; district: DistrictId; t: number }

export interface BreadState {
  setup: BreadSetup;
  t: number;
  districts: DistrictState[];
  teams: Team[];
  next: number;
  /** police sent so far */
  charged: number;
  burned: number;
  calmed: number;
  cleared: number;
  events: BreadEvent[];
  over?: 'won' | 'lost';
}

/** Lay out the afternoon's flare-ups. Same seed, same afternoon. */
export function breadSetup(seed: number, d: BreadDifficulty): BreadSetup {
  const rng = makeRng(seed);
  const flares: Flare[] = [];
  let t = 800;
  let last = '';
  while (t < d.durationMs - 6000) {
    let pick = rng.pick(DISTRICTS).id as DistrictId;
    for (let g = 0; g < 6 && pick === last; g++) pick = rng.pick(DISTRICTS).id as DistrictId;
    flares.push({ at: t, district: pick });
    last = pick;
    t += Math.round(rng.range(d.gapMs[0], d.gapMs[1]));
  }
  return { flares, d };
}

export function breadStart(setup: BreadSetup): BreadState {
  return {
    setup,
    t: 0,
    districts: DISTRICTS.map((x) => ({ id: x.id, mood: 'quiet', heat: 0, rate: 0 })),
    teams: [
      ...Array.from({ length: setup.d.negotiators }, () => ({ kind: 'talk' as const, freeAt: 0 })),
      ...Array.from({ length: setup.d.police }, () => ({ kind: 'police' as const, freeAt: 0 })),
    ],
    next: 0,
    charged: 0,
    burned: 0,
    calmed: 0,
    cleared: 0,
    events: [],
  };
}

function clone(s: BreadState): BreadState {
  return { ...s, districts: s.districts.map((x) => ({ ...x })), teams: s.teams.map((x) => ({ ...x })), events: [] };
}

/** A free team of this kind, if any. */
export function freeTeams(s: BreadState, kind: 'talk' | 'police'): number {
  return s.teams.filter((x) => x.kind === kind && x.freeAt <= s.t && !x.at).length;
}

/** Can a team of this kind be sent to this district now? */
export function canSend(s: BreadState, id: DistrictId, kind: 'talk' | 'police'): boolean {
  const d = s.districts.find((x) => x.id === id);
  if (!d || s.over) return false;
  if (d.mood !== 'flaring') return false;
  if (kind === 'police' && s.charged >= s.setup.d.charges) return false;
  return freeTeams(s, kind) > 0;
}

export function sendTeam(prev: BreadState, id: DistrictId, kind: 'talk' | 'police'): BreadState {
  if (!canSend(prev, id, kind)) return prev;
  const s = clone(prev);
  const team = s.teams.find((x) => x.kind === kind && x.freeAt <= s.t && !x.at)!;
  const d = s.districts.find((x) => x.id === id)!;
  team.at = id;
  if (kind === 'police') s.charged += 1;
  d.mood = kind === 'talk' ? 'talking' : 'policed';
  d.arriveAt = s.t + (kind === 'talk' ? TALK_TRAVEL_MS : POLICE_TRAVEL_MS);
  s.events.push({ kind: 'sent', district: id, t: s.t });
  return s;
}

/** Advance the afternoon by `ms` (in STEP_MS steps). */
export function breadTick(prev: BreadState, ms: number): BreadState {
  if (prev.over) return prev;
  const s = clone(prev);
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 0; i < steps && !s.over; i++) step(s);
  return s;
}

function step(s: BreadState) {
  s.t += STEP_MS;
  const dt = STEP_MS / 1000;
  // new flare-ups
  while (s.next < s.setup.flares.length && s.setup.flares[s.next].at <= s.t) {
    const f = s.setup.flares[s.next++];
    // aimed at a district that is busy? the next quiet one along goes up instead
    const from = s.districts.findIndex((x) => x.id === f.district);
    const d = [...s.districts.slice(from), ...s.districts.slice(0, from)].find((x) => x.mood === 'quiet');
    if (d) {
      d.mood = 'flaring'; d.heat = START_HEAT; d.rate = s.setup.d.rate;
      s.events.push({ kind: 'flare', district: d.id, t: s.t });
    }
  }
  for (const d of s.districts) {
    const team = s.teams.find((x) => x.at === d.id);
    if (d.mood === 'flaring') {
      d.heat = Math.min(100, d.heat + d.rate * dt);
      if (d.heat >= 100) {
        d.mood = 'burning';
        s.burned += 1;
        s.events.push({ kind: 'burn', district: d.id, t: s.t });
      }
    } else if (d.mood === 'talking' && team) {
      if (s.t < (d.arriveAt ?? 0)) {
        // still walking there: the crowd does not wait
        d.heat = Math.min(100, d.heat + d.rate * dt);
        if (d.heat >= 100) {
          d.mood = 'burning'; s.burned += 1; team.at = undefined; team.freeAt = s.t + TALK_RETURN_MS;
          s.events.push({ kind: 'burn', district: d.id, t: s.t });
        }
      } else {
        d.heat = Math.max(0, d.heat - TALK_RATE * dt);
        if (d.heat <= 0) {
          d.mood = 'calm'; s.calmed += 1; d.reflareAt = s.t + CALM_FOR_MS;
          team.at = undefined; team.freeAt = s.t + TALK_RETURN_MS;
          s.events.push({ kind: 'calm', district: d.id, t: s.t });
        }
      }
    } else if (d.mood === 'calm' && d.reflareAt !== undefined && s.t >= d.reflareAt) {
      d.mood = 'quiet'; d.reflareAt = undefined;
    } else if (d.mood === 'policed') {
      if (team && s.t >= (d.arriveAt ?? 0)) {
        d.heat = 0; s.cleared += 1;
        team.at = undefined; team.freeAt = s.t + POLICE_BUSY_MS;
        d.reflareAt = s.t + REFLARE_AFTER_MS;
        s.events.push({ kind: 'cleared', district: d.id, t: s.t });
      } else if (!team && d.reflareAt !== undefined && s.t >= d.reflareAt) {
        // the district remembers the batons
        d.mood = 'flaring'; d.heat = REFLARE_HEAT; d.rate *= REFLARE_RATE_MULT; d.reflareAt = undefined;
        s.events.push({ kind: 'reflare', district: d.id, t: s.t });
      }
    }
  }
  if (s.burned > s.setup.d.burnsAllowed) { s.over = 'lost'; return; }
  if (s.t >= s.setup.d.durationMs) s.over = 'won';
}

/** Seconds left, for the clock. */
export function breadSecondsLeft(s: BreadState): number {
  return Math.max(0, Math.ceil((s.setup.d.durationMs - s.t) / 1000));
}

/** 0..100: how well it went, for the result text. */
export function breadScore(s: BreadState): number {
  const peace = s.calmed * 2 + s.cleared;
  const total = Math.max(1, s.setup.flares.length * 2);
  return Math.max(0, Math.min(100, Math.round((peace / total) * 80 + (s.burned === 0 ? 20 : 0))));
}

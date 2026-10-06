import { makeRng } from '../rng';
import type { Rng } from '../types';

/**
 * BUDGET NIGHT — the budget mini-game's rules. No React, no DOM (ground rule
 * 11). Real time, but simulated in fixed steps (budgetTick), so the same
 * seed and the same taps at the same moments always give the same evening.
 *
 * Owner (2026-10-06): "#6 Budget Night — split a fixed budget; each faction
 * has a minimum", against the clock, 90 seconds: "plenty of time but still
 * can't just sit there". So the pressure is not raw speed: the evening keeps
 * changing, and waiting costs you.
 *
 * Five jars, one per visible faction (Army, Security, Elites, Workers,
 * Street), and a pot of money. Each jar has a LINE: the least that faction
 * accepts. The player moves money $1B at a time between the unspent money
 * and a jar (+ / −). The pot is conserved: money is only ever in a jar or
 * unspent, except when an event cuts or grows the budget.
 *   - A jar BELOW its line drains that faction's PATIENCE; at its line or
 *     above, patience slowly comes back. Empty patience: the faction WALKS
 *     OUT, and its jar is sealed with whatever is in it.
 *   - EVENTS on a seeded schedule, each shown on one of Brask's slips a few
 *     seconds before it lands: a line goes up ('up') or down ('down'), the
 *     budget is cut ('cut') or grows ('add'). A cut comes out of the unspent
 *     money first; if that is short, Brask takes the rest from the jars
 *     (money above a line first, then the fullest jar).
 *   - SQUEEZES: some events push the lines above what there is to spend, so
 *     someone must wait below their line. Act 1 has one short squeeze; the
 *     longer ones (acts 2–3) can need the player to swap who waits before
 *     anyone runs out.
 *   - The jar IN MOST DANGER (below its line, least patience: dangerJar) is
 *     highlighted on the screen, so the player always knows where to look.
 * Win: reach 20:00 (90 s) with no more than `walkoutsAllowed` walk-outs.
 *
 * Every evening is checked when it is laid out: a quick, careful player
 * (EXPERT) must win it, and doing nothing must lose it. If not, the
 * schedule is laid out again (same seed, same result every time), so
 * nobody loses while doing everything right, and nobody wins by waiting.
 */

export const STEP_MS = 100;
export const JAR_COUNT = 5;
/** the most a jar holds, in $B (the UI draws it this tall) */
export const JAR_CAP = 14;
const LINE_MIN = 2;
const LINE_MAX = 11;

export type BudgetEventKind = 'up' | 'down' | 'cut' | 'add';

export interface BudgetEvent {
  id: number;
  /** when it lands, in ms of play */
  at: number;
  kind: BudgetEventKind;
  /** the jar (faction) it is aimed at, 0–4 in the display order; -1 for cut/add */
  jar: number;
  /** $B */
  amount: number;
  /** a few words for Brask's slip */
  why: string;
}

export interface BudgetDifficulty {
  act: number;
  durationMs: number;
  /** $B to split at 18:30 */
  pot: number;
  /** the pot minus the sum of the lines at 18:30 */
  spare: number;
  /** $B Brask's draft puts in the wrong jar (one jar short, one over) */
  draftOff: number;
  /** ms between events (a range) */
  gapMs: [number, number];
  /** a slip shows this long before its event lands */
  leadMs: number;
  /** $B an event moves (a range) */
  size: [number, number];
  /** patience lost per second below the line (patience is 0–100) */
  drain: number;
  /** patience regained per second at or above the line */
  recover: number;
  walkoutsAllowed: number;
  /** the furthest the lines go above the pot in a squeeze (a negative spare) */
  squeezeFloor: number;
  /** a squeeze is relieved after about this long */
  squeezeMs: number;
  /** squeezes in an evening */
  squeezes: number;
}

export function budgetDifficulty(act: number): BudgetDifficulty {
  // Harder each act: more and bigger events, less spare money, faster
  // drain, slower recovery, and longer squeezes (act 2's and 3's can need
  // a swap). Owner's playtest (2026-10-06): "I have yet to even make it to
  // the vote", so "slower and clearer": patience drains about half as fast
  // as before (act 1: a walk-out after ~15 s below the line, was ~8 s),
  // the slips warn earlier, and act 1 has one short squeeze. Calibrated
  // with simulated players (budget.test.ts prints the win rates by skill
  // and act).
  const base = { durationMs: 90000, pot: 30, walkoutsAllowed: 1 };
  if (act <= 1) {
    return {
      ...base, act: 1, spare: 3, draftOff: 2, gapMs: [8000, 10000], leadMs: 5000, size: [2, 3],
      drain: 6.5, recover: 5, squeezeFloor: -3, squeezeMs: 9000, squeezes: 1,
    };
  }
  if (act === 2) {
    return {
      ...base, act: 2, spare: 2, draftOff: 3, gapMs: [7000, 9000], leadMs: 4500, size: [2, 3],
      drain: 8.5, recover: 4, squeezeFloor: -3, squeezeMs: 15000, squeezes: 2,
    };
  }
  return {
    ...base, act: 3, spare: 1, draftOff: 3, gapMs: [6500, 8500], leadMs: 4000, size: [2, 4],
    drain: 9, recover: 3.5, squeezeFloor: -3, squeezeMs: 15000, squeezes: 2,
  };
}

export interface BudgetSetup {
  seed: number;
  d: BudgetDifficulty;
  /** each faction's line at 18:30 */
  lines: number[];
  /** Brask's draft: what each jar holds at 18:30 */
  money: number[];
  pot: number;
  events: BudgetEvent[];
}

export interface JarState {
  line: number;
  money: number;
  /** 0–100 */
  patience: number;
  /** walked out: the jar is sealed */
  out: boolean;
  /** ms spent below the line (for the score) */
  shortMs: number;
}

export interface BudgetLog {
  /** the event's id, or -1 for a walk-out */
  id: number;
  t: number;
  kind: BudgetEventKind | 'walk';
  jar: number;
  amount: number;
  /** a cut: $B Brask took from each jar */
  took?: number[];
}

export interface BudgetState {
  setup: BudgetSetup;
  t: number;
  /** the whole budget: money in the jars plus the unspent money */
  pot: number;
  jars: JarState[];
  /** the next event to land */
  next: number;
  walkouts: number;
  /** $B the player moved */
  moved: number;
  /** what has happened, in order (the UI animates new entries) */
  log: BudgetLog[];
  over?: 'won' | 'lost';
}

/* -------------------------------------------------------------- words */

/** Brask's few words on a slip. Index = jar (display order: Army, Security, Elites, Workers, Street). */
const WHY_UP = [
  ['new trucks', 'officers\' pay', 'border posts'],
  ['overtime', 'new cameras', 'informers'],
  ['a tax break', 'a port deal', 'a bank rescue'],
  ['pensions', 'a pay rise', 'rail jobs'],
  ['bread prices', 'bus fares', 'clinics'],
];
const WHY_DOWN = ['settles for less', 'drops a demand', 'takes a deal'];
const WHY_CUT = ['A loan is recalled', 'Oil price falls', 'Aid is late'];
const WHY_ADD = ['Customs windfall', 'Ostrene pays up', 'A loan comes in'];

/* -------------------------------------------------------------- setup */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Brask's draft: lines that leave `spare` unspent, and one jar short. */
function draft(rng: Rng, d: BudgetDifficulty): { lines: number[]; money: number[] } {
  const total = d.pot - d.spare;
  const lines = Array.from({ length: JAR_COUNT }, () => 4 + rng.int(5));
  let s = sum(lines);
  for (let g = 0; g < 400 && s !== total; g++) {
    const i = rng.int(JAR_COUNT);
    if (s < total && lines[i] < 9) { lines[i]++; s++; }
    else if (s > total && lines[i] > 3) { lines[i]--; s--; }
  }
  const money = lines.slice();
  const short = rng.int(JAR_COUNT);
  let over = rng.int(JAR_COUNT - 1);
  if (over >= short) over++;
  const off = Math.min(d.draftOff, money[short] - 1);
  money[short] -= off;
  money[over] += off;
  return { lines, money };
}

/**
 * The evening's events. The spare money (pot minus the lines) is steered:
 * it stays between 0 and about 3 most of the time, and `squeezes` times it
 * dips below zero (someone must wait) until a relief event lands.
 */
function schedule(rng: Rng, d: BudgetDifficulty, lines0: number[]): BudgetEvent[] {
  const events: BudgetEvent[] = [];
  const lines = lines0.slice();
  let pot = d.pot;
  const spare = () => pot - sum(lines);
  const end = d.durationMs - 5000;
  let t = Math.round(d.leadMs + rng.range(1800, 3200));
  // spread the squeezes over the evening
  const squeezeAt: number[] = [];
  for (let k = 0; k < d.squeezes; k++) {
    const from = 18000 + (k * (end - 30000)) / d.squeezes;
    squeezeAt.push(Math.round(from + rng.range(0, (end - 30000) / d.squeezes - 4000)));
  }
  let squeezeFrom = -1;
  let last = -1;
  // when each faction last had an event: the ones left alone longest come next
  const lastHit = [0, 0, 0, 0, 0].map(() => -1);
  const since = (i: number) => (lastHit[i] < 0 ? events.length + 2 : events.length - lastHit[i]);
  const size = () => d.size[0] + rng.int(d.size[1] - d.size[0] + 1);

  const push = (kind: BudgetEventKind, amount: number) => {
    if (amount <= 0) return false;
    let jar = -1;
    if (kind === 'up') {
      const ok = [0, 1, 2, 3, 4].filter((i) => i !== last && lines[i] + amount <= LINE_MAX);
      if (!ok.length) return false;
      jar = rng.weighted(ok, (i) => since(i) ** 2)!;
      lines[jar] += amount;
    } else if (kind === 'down') {
      const ok = [0, 1, 2, 3, 4].filter((i) => i !== last && lines[i] - amount >= LINE_MIN);
      if (!ok.length) return false;
      // the bigger asks are the ones that come down
      jar = rng.weighted(ok, (i) => (lines[i] - LINE_MIN) * since(i))!;
      lines[jar] -= amount;
    } else if (kind === 'cut') {
      if (pot - amount < sum(lines) + d.squeezeFloor || pot - amount < 20) return false;
      pot -= amount;
    } else {
      pot += amount;
    }
    if (jar >= 0) lastHit[jar] = events.length;
    const why = kind === 'up' ? rng.pick(WHY_UP[jar]) : kind === 'down' ? rng.pick(WHY_DOWN) : kind === 'cut' ? rng.pick(WHY_CUT) : rng.pick(WHY_ADD);
    events.push({ id: events.length, at: t, kind, jar, amount, why });
    last = jar;
    return true;
  };
  const tighten = (amount: number) => (rng.chance(0.7) ? push('up', amount) || push('cut', amount) : push('cut', amount) || push('up', amount));
  const relieve = (amount: number) => (rng.chance(0.65) ? push('down', amount) || push('add', amount) : push('add', amount) || push('down', amount));

  while (t <= end) {
    const g = spare();
    if (squeezeFrom >= 0) {
      // in a squeeze: relieve it once it has lasted long enough, or deepen it once
      if (t - squeezeFrom >= d.squeezeMs * 0.55 || t + d.gapMs[1] > end) {
        relieve(-g + rng.int(2));
        squeezeFrom = -1;
      } else if (g > d.squeezeFloor && rng.chance(0.5)) {
        tighten(Math.min(size(), g - d.squeezeFloor));
      } else if (push('down', 1)) {
        // a swap that does not end it: one line down now, another up a moment later
        t += 1500;
        push('up', 1);
      }
    } else if (squeezeAt.length && t >= squeezeAt[0] && t + d.squeezeMs * 0.6 < end) {
      // into a squeeze: the lines go above the pot (too big a jump waits a slot)
      const target = -1 - rng.int(-d.squeezeFloor);
      if (g - target > d.size[1] + 1) tighten(Math.min(size(), g));
      else if (tighten(Math.max(1, g - target))) { squeezeAt.shift(); squeezeFrom = t; }
    } else if (g >= 3) {
      tighten(Math.min(size(), g));
    } else if (g <= 0) {
      relieve(size());
    } else if (rng.chance(0.55)) {
      tighten(Math.min(size(), g));
    } else {
      relieve(size());
    }
    t += Math.round(rng.range(d.gapMs[0], d.gapMs[1]));
  }
  return events;
}

/** A quick, careful player: every evening must be winnable by one. */
export const EXPERT: BudgetPlayer = { reactMs: 700, tapMs: 180, preload: true, mistake: 0 };

/** Does the schedule ever push the lines above the money (a squeeze)? */
export function hasSqueeze(setup: BudgetSetup): boolean {
  const lines = setup.lines.slice();
  let pot = setup.pot;
  for (const e of setup.events) {
    if (e.kind === 'up') lines[e.jar] += e.amount;
    else if (e.kind === 'down') lines[e.jar] -= e.amount;
    else if (e.kind === 'cut') pot -= e.amount;
    else pot += e.amount;
    if (sum(lines) > pot) return true;
  }
  return false;
}

/** the most layouts budgetSetup tries for one seed */
const LAYOUT_TRIES = 40;

/**
 * Lay out the evening. Same seed, same evening. An evening the EXPERT
 * cannot win, that doing nothing does not lose, or with no squeeze (when
 * the act has squeezes), is laid out again. Bounded: at most LAYOUT_TRIES
 * layouts, each a few hundred cheap steps (about 1 ms per evening).
 */
export function budgetSetup(seed: number, d: BudgetDifficulty): BudgetSetup {
  let fallback: BudgetSetup | null = null;
  let last: BudgetSetup | null = null;
  for (let attempt = 0; attempt < LAYOUT_TRIES; attempt++) {
    const rng = makeRng((seed ^ Math.imul(attempt, 0x9e3779b1)) >>> 0);
    const { lines, money } = draft(rng, d);
    const setup: BudgetSetup = { seed, d, lines, money, pot: d.pot, events: schedule(rng, d, lines) };
    last = setup;
    if (d.squeezes > 0 && !hasSqueeze(setup)) continue;
    if (budgetPlay(setup, null).over === 'won') continue; // waiting must never win
    fallback ??= setup;
    if (budgetPlay(setup, EXPERT).over === 'won') return setup;
  }
  // not reached in 3,000 seeds per act: act 1 needs at most 5 layouts, acts 2–3 at most 2
  return (fallback ?? last)!;
}

/* -------------------------------------------------------------- the evening */

export function budgetStart(setup: BudgetSetup): BudgetState {
  return {
    setup,
    t: 0,
    pot: setup.pot,
    jars: setup.lines.map((line, i) => ({ line, money: setup.money[i], patience: 100, out: false, shortMs: 0 })),
    next: 0,
    walkouts: 0,
    moved: 0,
    log: [],
  };
}

function clone(s: BudgetState): BudgetState {
  return { ...s, jars: s.jars.map((j) => ({ ...j })), log: s.log.slice() };
}

/** Money not in any jar. */
export function unspent(s: BudgetState): number {
  return s.pot - sum(s.jars.map((j) => j.money));
}

export function canPut(s: BudgetState, jar: number): boolean {
  const j = s.jars[jar];
  return !!j && !s.over && !j.out && j.money < JAR_CAP && unspent(s) > 0;
}

export function canTake(s: BudgetState, jar: number): boolean {
  const j = s.jars[jar];
  return !!j && !s.over && !j.out && j.money > 0;
}

/** + (dir 1): $1B from the unspent money into the jar. − (dir -1): $1B back out. */
export function budgetMove(prev: BudgetState, jar: number, dir: 1 | -1): BudgetState {
  if (dir === 1 ? !canPut(prev, jar) : !canTake(prev, jar)) return prev;
  const s = clone(prev);
  s.jars[jar].money += dir;
  s.moved += 1;
  return s;
}

/** The jar an event lands on: if its faction has walked out, the next one along that has not. */
export function eventTarget(s: BudgetState, ev: BudgetEvent): number {
  if (ev.jar < 0 || !s.jars[ev.jar].out) return ev.jar;
  for (let k = 1; k < JAR_COUNT; k++) {
    const i = (ev.jar + k) % JAR_COUNT;
    if (!s.jars[i].out) return i;
  }
  return ev.jar;
}

/** Slips on the desk now: events shown but not landed yet, soonest first. */
export function announced(s: BudgetState): BudgetEvent[] {
  const lead = s.setup.d.leadMs;
  return s.setup.events.filter((e, i) => i >= s.next && e.at - lead <= s.t);
}

function land(s: BudgetState, ev: BudgetEvent) {
  const jar = eventTarget(s, ev);
  const entry: BudgetLog = { id: ev.id, t: s.t, kind: ev.kind, jar, amount: ev.amount };
  if (ev.kind === 'up') s.jars[jar].line = Math.min(JAR_CAP, s.jars[jar].line + ev.amount);
  else if (ev.kind === 'down') s.jars[jar].line = Math.max(1, s.jars[jar].line - ev.amount);
  else if (ev.kind === 'add') s.pot += ev.amount;
  else {
    s.pot -= ev.amount;
    // the unspent money pays first; then Brask takes from the jars:
    // money above a line first, then the fullest jar
    const took = s.jars.map(() => 0);
    let owe = -unspent(s);
    while (owe > 0) {
      let pick = -1;
      let best = 0;
      s.jars.forEach((j, i) => {
        if (!j.out && j.money - j.line > best) { best = j.money - j.line; pick = i; }
      });
      if (pick < 0) {
        s.jars.forEach((j, i) => {
          if (!j.out && j.money > best) { best = j.money; pick = i; }
        });
      }
      if (pick < 0) { s.pot += owe; break; } // nothing left to take (only sealed jars)
      s.jars[pick].money -= 1;
      took[pick] += 1;
      owe -= 1;
    }
    if (took.some((x) => x > 0)) entry.took = took;
  }
  s.log.push(entry);
}

function step(s: BudgetState) {
  const d = s.setup.d;
  s.t += STEP_MS;
  while (s.next < s.setup.events.length && s.setup.events[s.next].at <= s.t) land(s, s.setup.events[s.next++]);
  const dt = STEP_MS / 1000;
  s.jars.forEach((j, i) => {
    if (j.out) return;
    if (j.money < j.line) {
      j.patience = Math.max(0, j.patience - d.drain * dt);
      j.shortMs += STEP_MS;
      if (j.patience <= 0) {
        j.out = true;
        s.walkouts += 1;
        s.log.push({ id: -1, t: s.t, kind: 'walk', jar: i, amount: 0 });
      }
    } else {
      j.patience = Math.min(100, j.patience + d.recover * dt);
    }
  });
  if (s.walkouts > d.walkoutsAllowed) { s.over = 'lost'; return; }
  if (s.t >= d.durationMs) s.over = 'won';
}

/** Advance the evening by `ms` (in STEP_MS steps). */
export function budgetTick(prev: BudgetState, ms: number): BudgetState {
  if (prev.over || ms < STEP_MS) return prev;
  const s = clone(prev);
  const steps = Math.floor(ms / STEP_MS);
  for (let i = 0; i < steps && !s.over; i++) step(s);
  return s;
}

/** Advance the evening to `t` ms of play (whole steps). */
export function budgetTickTo(prev: BudgetState, t: number): BudgetState {
  return budgetTick(prev, Math.floor(t / STEP_MS) * STEP_MS - prev.t);
}

/** The jar in most danger: below its line, with the least patience (-1: none). The screen highlights it. */
export function dangerJar(s: BudgetState): number {
  let best = -1;
  s.jars.forEach((j, i) => {
    if (!j.out && j.money < j.line && (best < 0 || j.patience < s.jars[best].patience)) best = i;
  });
  return best;
}

/** The desk clock: 18:30 at the start, 20:00 at the end (a second of play is a minute). */
export function budgetClock(t: number): string {
  const m = 30 + Math.min(90, Math.floor(t / 1000));
  return `${18 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

/** 0..100: how well it went, for the result text (85+ means nobody walked out). */
export function budgetScore(s: BudgetState): number {
  const shortMs = sum(s.jars.map((j) => j.shortMs));
  let score = 100 - 30 * s.walkouts - Math.round((40 * shortMs) / (s.setup.d.durationMs * 2));
  if (s.over === 'lost') score = Math.min(score, 40);
  return Math.max(0, Math.min(100, score));
}

/* ------------------------------------------- a player's plan */

/**
 * What a player wants each jar to hold right now: every line met; an
 * announced line rise paid in advance if there is money for it (with
 * `preload`); and in a squeeze, the shortfall taken from ONE faction.
 *   - The careful rule (`swapBelow` unset): the most patient one waits,
 *     swapped when it is running 30 points lower than another.
 *   - A person's rule (`swapBelow` set): whoever is short when the squeeze
 *     starts waits, until its patience bar turns red (below `swapBelow`);
 *     then the most patient other one waits instead.
 * `memo.victim` remembers who is waiting between calls. `wrongVictim` may
 * pick a random faction instead (a mistake).
 */
export function budgetPlan(
  s: BudgetState, memo: { victim?: number }, preload: boolean,
  wrongVictim?: (from: number[]) => number | undefined, swapBelow?: number,
): number[] {
  const T = s.jars.map((j) => (j.out ? j.money : j.line));
  const active = s.jars.map((_, i) => i).filter((i) => !s.jars[i].out);
  const avail = s.pot - sum(s.jars.filter((j) => j.out).map((j) => j.money));
  const need = sum(active.map((i) => s.jars[i].line));
  if (need <= avail) {
    memo.victim = undefined;
    let spare = avail - need;
    if (preload) {
      for (const ev of announced(s)) {
        if (ev.kind === 'cut') spare -= ev.amount;
        if (spare <= 0) break;
        if (ev.kind === 'up') {
          const i = eventTarget(s, ev);
          const add = Math.min(ev.amount, spare, JAR_CAP - T[i]);
          T[i] += add;
          spare -= add;
        }
      }
    }
    return T;
  }
  let deficit = need - avail;
  const byPatience = [...active].sort((a, b) => s.jars[b].patience - s.jars[a].patience || a - b);
  let v = memo.victim;
  if (swapBelow === undefined) {
    if (v === undefined || s.jars[v].out || s.jars[byPatience[0]].patience - s.jars[v].patience > 30) {
      v = wrongVictim?.(active) ?? byPatience[0];
    }
  } else if (v === undefined || s.jars[v].out) {
    // the squeeze starts: whoever is short now waits (the most patient of them)
    v = wrongVictim?.(active) ?? byPatience.find((i) => s.jars[i].money < s.jars[i].line) ?? byPatience[0];
  } else if (s.jars[v].patience < swapBelow) {
    // its bar has turned red: someone else waits now
    const others = active.filter((i) => i !== v);
    v = wrongVictim?.(others) ?? others.sort((a, b) => s.jars[b].patience - s.jars[a].patience || a - b)[0] ?? v;
  }
  memo.victim = v;
  for (const i of [v, ...byPatience.filter((x) => x !== v)]) {
    const cut = Math.min(deficit, T[i]);
    T[i] -= cut;
    deficit -= cut;
    if (deficit <= 0) break;
  }
  return T;
}

/** how much longer a lapse of attention makes a reaction */
const LAPSE_MS = 2000;

/** A simulated player (tests, and the check every evening must pass). */
export interface BudgetPlayer {
  /** ms from a change (an event landing, a jar going short) to the first tap; [min, max] varies it each time */
  reactMs: number | [number, number];
  /** ms per tap (each tap moves $1B) */
  tapMs: number;
  /**
   * reads the slips: pays a rise before it lands, keeps money back for a
   * cut, takes back money above a line. Without it, the player acts only
   * when a jar is below its line (its line has turned red).
   */
  preload: boolean;
  /** chance a tap lands on the jar next door (halved); chance a squeeze's waiting faction is picked at random */
  mistake: number;
  /** a person's squeeze rule (see budgetPlan): swap who waits once its patience is below this */
  swapBelow?: number;
  /** ms to find another button (a different jar, or + after −); a person watching five jars needs a moment */
  lookMs?: number;
  /** chance a reaction takes LAPSE_MS longer (looking at the wrong thing) */
  lapse?: number;
  /** seed for the mistakes and the reaction times */
  seed?: number;
}

/** Play a whole evening as `player` (null: do nothing). Deterministic. */
export function budgetPlay(setup: BudgetSetup, player: BudgetPlayer | null): BudgetState {
  let s = budgetStart(setup);
  if (!player) return budgetTick(s, setup.d.durationMs + STEP_MS);
  const rng = makeRng(((player.seed ?? 0) * 7919 + setup.seed * 31 + 17) >>> 0);
  const memo: { victim?: number } = {};
  const wrong = (from: number[]) => (player.mistake > 0 && from.length > 0 && rng.chance(player.mistake) ? rng.pick(from) : undefined);
  const react = () => (typeof player.reactMs === 'number' ? player.reactMs : rng.range(player.reactMs[0], player.reactMs[1]))
    + (player.lapse && rng.chance(player.lapse) ? LAPSE_MS : 0);
  /** when the player acts on what they have noticed (-1: nothing noticed) */
  let actAt = -1;
  let working = false;
  let nextTap = 0;
  /** the button last pressed, and the one the player has just looked for */
  let lastKey = -1;
  let lookedFor = -1;
  /** a tap that slips lands on the jar next door */
  const slip = (i: number) => (player.mistake > 0 && rng.chance(player.mistake / 2) ? Math.max(0, Math.min(JAR_COUNT - 1, i + (rng.chance(0.5) ? 1 : -1))) : i);
  let seen = `${s.next}/${s.walkouts}`;
  while (!s.over) {
    s = budgetTick(s, STEP_MS);
    if (s.over) break;
    // something landed (or someone walked out): it takes a moment to take
    // in (a person busy at the jars only glances up)
    const now = `${s.next}/${s.walkouts}`;
    if (now !== seen) {
      seen = now;
      if (working && player.lookMs) nextTap = Math.max(nextTap, s.t + player.lookMs);
      else { working = false; actAt = s.t + react(); }
    }
    const T = budgetPlan(s, memo, player.preload, wrong, player.swapBelow);
    if (!hasWork(s, T, player.preload)) { working = false; actAt = -1; continue; }
    if (!working) {
      if (actAt < 0) actAt = s.t + react();
      if (s.t < actAt) continue;
      working = true;
      nextTap = s.t;
      lastKey = -1;
    }
    while (working && nextTap <= s.t) {
      const mv = chooseTap(s, T, !!player.lookMs && lastKey >= 0 && lastKey % 2 === 0);
      if (!mv) { working = false; break; }
      // moving to another button: a moment to find it
      const key = mv.jar * 2 + (mv.dir > 0 ? 1 : 0);
      if (lastKey >= 0 && key !== lastKey && lookedFor !== key && player.lookMs) {
        lookedFor = key;
        nextTap += player.lookMs;
        continue;
      }
      s = budgetMove(s, slip(mv.jar), mv.dir);
      lastKey = key;
      nextTap += player.tapMs;
      if (!hasWork(s, T, player.preload)) working = false;
    }
  }
  return s;
}

/** Anything to do? A jar short of the plan (and money to fill it); a tidy player also takes back money above the plan. */
function hasWork(s: BudgetState, T: number[], tidy: boolean): boolean {
  const u = unspent(s);
  const over = s.jars.some((j, i) => !j.out && j.money > T[i]);
  return s.jars.some((j, i) => !j.out && ((j.money < T[i] && (u > 0 || over)) || (tidy && j.money > T[i])));
}

/**
 * The next tap towards the plan: fill the most urgent short jar, else take
 * back a surplus. `taking`: a person who has started taking money out keeps
 * going until there is enough to fill every short jar (no back and forth).
 */
function chooseTap(s: BudgetState, T: number[], taking: boolean): { jar: number; dir: 1 | -1 } | null {
  const short = s.jars.map((_, i) => i)
    .filter((i) => !s.jars[i].out && s.jars[i].money < T[i])
    .sort((a, b) => Number(s.jars[a].money >= s.jars[a].line) - Number(s.jars[b].money >= s.jars[b].line)
      || s.jars[a].patience - s.jars[b].patience || a - b);
  const u = unspent(s);
  const gap = sum(short.map((i) => T[i] - s.jars[i].money));
  if (short.length && u > 0 && !(taking && u < gap && s.jars.some((j, i) => !j.out && j.money > T[i]))) return { jar: short[0], dir: 1 };
  const over = s.jars.map((_, i) => i)
    .filter((i) => !s.jars[i].out && s.jars[i].money > T[i])
    .sort((a, b) => (s.jars[b].money - T[b]) - (s.jars[a].money - T[a]) || a - b);
  return over.length ? { jar: over[0], dir: -1 } : null;
}

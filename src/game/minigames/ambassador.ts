import { makeRng } from '../rng';

/**
 * THE AMBASSADOR'S TABLE — the dinner's rules. No React, no DOM (ground rule
 * 11). Calm and turn-based: no clock, so there is nothing to simulate in
 * steps; every move is one pure function call.
 *
 * Owner (2026-10-06): "#7 The Ambassador's Table — haggle with Ostrene's
 * ambassador; know when to stop", chosen as "Rounds + his tells": 5 rounds;
 * each round you pick a gas price offer and a line to say; his face, his
 * glass and his notes show how close he is to walking out. Calm, no timer;
 * reading his tells is the skill.
 *
 * THE DINNER. Five courses, one round each (soup, fish, roast, cheese,
 * dessert). Prices are dollars per 1,000 m³ of gas, in $5 steps. Ostrene
 * opens at its ASK. Hidden from the player:
 *   - his FLOOR: the lowest price he will sign (always below the ask);
 *   - his PATIENCE (0–100): at 0 he stands up and leaves;
 *   - his TEMPER: how each of the four lines lands on him.
 * Each round you choose one of five OFFERS — his current price, and four
 * prices $10, $20, $30 and $40 under it — and a LINE:
 *   - an offer at or above his floor is ACCEPTED: the dinner ends at that
 *     price;
 *   - below it, he REFUSES and COUNTERS: he splits the difference between
 *     his price and your offer (rounded up to $5, and now and then $5 less)
 *     but never goes below his floor. The offer cost him patience: a flat
 *     `annoy` for being refused, plus `hit` for every $10 you were under
 *     his floor. The line then adds or takes patience, by his temper;
 *   - at 0 patience he WALKS OUT (lost); no deal after the dessert is lost.
 * His current price is always an offer he accepts, so a careful player can
 * always reach a deal. The score is how far down you took him: 100 for his
 * floor, 0 for his opening ask.
 *
 * THE TELLS. His patience is shown three ways, always the same:
 *   level 2 (60–100) relaxed:      smiling · sipping wine · writing numbers
 *   level 1 (30–59)  irritated:    frowning · glass untouched · crossing out
 *   level 0 (1–29)   about to stand: jaw set · glass pushed away · notebook closed
 * ACT 2: one tell is FROZEN at "relaxed" all night (a man who drinks all
 * night, writes all night, or never stops smiling): it tells you nothing.
 * ACT 3: one tell BLUFFS: it shows one level calmer than the truth. In both,
 * two tells stay honest, so "believe the two that agree" always works.
 *
 * Every dinner is checked when it is laid out: a careful player (EXPERT, who
 * sees only what the screen shows) must reach a deal. If not, the dinner is
 * laid out again (same seed, same result every time).
 */

export const ROUNDS = 5;
export const OFFER_COUNT = 5;
/** the offers are his price and this many dollars under it, four times */
export const OFFER_STEP = 20;
/** prices are in steps of this many dollars */
export const PRICE_STEP = 5;
export const COURSES = ['Soup', 'Fish', 'Roast', 'Cheese', 'Dessert'] as const;

export const LINES = ['flatter', 'history', 'firm', 'threaten'] as const;
export type LineId = (typeof LINES)[number];
export type Temper = 'vain' | 'proud' | 'trader' | 'nervous';
export const TEMPERS: Temper[] = ['vain', 'proud', 'trader', 'nervous'];
export type Reaction = 'delighted' | 'pleased' | 'cool' | 'offended';
export type TellId = 'face' | 'glass' | 'notes';
export const TELLS: TellId[] = ['face', 'glass', 'notes'];
export type TellNoise = 'none' | 'frozen' | 'bluff';
/** 2 relaxed, 1 irritated, 0 about to stand */
export type Level = 0 | 1 | 2;

/** The patience at which the face, glass and notes drop a level. */
export const LEVEL_HIGH = 60;
export const LEVEL_LOW = 30;

/** How each line lands, by temper: patience gained or lost. */
export const LINE_EFFECT: Record<Temper, Record<LineId, number>> = {
  vain: { flatter: 12, firm: 4, history: -6, threaten: -12 },
  proud: { history: 12, flatter: 4, threaten: -6, firm: -12 },
  trader: { firm: 12, threaten: 4, flatter: -12, history: -6 },
  nervous: { threaten: 12, history: 4, firm: -6, flatter: -12 },
};

export function reactionOf(effect: number): Reaction {
  return effect >= 10 ? 'delighted' : effect > 0 ? 'pleased' : effect > -10 ? 'cool' : 'offended';
}

export interface AmbassadorDifficulty {
  act: number;
  startPatience: number;
  /** patience lost whenever he refuses an offer */
  annoy: number;
  /** patience lost for every $10 an offer is under his floor */
  hit: number;
  /** how hard a line lands: ×1 in act 1, more later (a liked line helps more, a disliked one hurts more) */
  lineScale: number;
  /** how much more likely the face is the tell that is frozen or bluffs (1: no more likely than the others) */
  faceBias: number;
  /** when he refuses he gives 1/giveBy of the way to your offer */
  giveBy: number;
  /** the gap between his opening ask and his floor, in dollars [min, max] */
  slack: [number, number];
  noise: TellNoise;
}

export function ambassadorDifficulty(act: number): AmbassadorDifficulty {
  // Harder each act: a tighter gap to haggle over (less room, so every refusal
  // costs more of his patience), a shorter fuse, lines that land harder, and
  // noisier tells (act 2: one tell is frozen; act 3: one tell bluffs, mostly
  // the face). Calibrated with simulated players (ambassador.test.ts prints
  // the win rates by act).
  if (act <= 1) return { act: 1, startPatience: 100, annoy: 6, hit: 10, lineScale: 1, faceBias: 2, giveBy: 4, slack: [40, 80], noise: 'none' };
  if (act === 2) return { act: 2, startPatience: 100, annoy: 8, hit: 12, lineScale: 1.25, faceBias: 2, giveBy: 4, slack: [30, 65], noise: 'frozen' };
  return { act: 3, startPatience: 90, annoy: 9, hit: 16, lineScale: 1.5, faceBias: 5, giveBy: 4, slack: [25, 60], noise: 'bluff' };
}

export interface AmbassadorSetup {
  seed: number;
  d: AmbassadorDifficulty;
  /** Ostrene's opening price, $ per 1,000 m³ */
  ask: number;
  /** the lowest price he will sign (hidden) */
  floor: number;
  temper: Temper;
  /** the tell that never changes (act 2), or null */
  frozen: TellId | null;
  /** the tell that shows one level too calm (act 3), or null */
  bluff: TellId | null;
  /** per round: $0 or $5 he gives away on top of splitting the difference */
  soft: number[];
}

export interface RoundLog {
  round: number;
  offer: number;
  line: LineId;
  verdict: 'deal' | 'counter' | 'walkout' | 'dessert';
  /** his new price (a counter) */
  counter?: number;
  reaction: Reaction;
}

export interface AmbassadorState {
  setup: AmbassadorSetup;
  /** 1–5: the course being served */
  round: number;
  /** his current price */
  price: number;
  patience: number;
  log: RoundLog[];
  over?: 'won' | 'walked' | 'dessert';
  /** the signed price */
  deal?: number;
}

/* -------------------------------------------------------------- setup */

const LAYOUT_TRIES = 40;

/** One way to lay out the dinner for this seed (attempt 0 is the usual one). */
export function layoutDinner(seed: number, d: AmbassadorDifficulty, attempt = 0): AmbassadorSetup {
  const rng = makeRng((seed ^ Math.imul(attempt, 0x9e3779b1)) >>> 0);
  const ask = 430 + PRICE_STEP * rng.int(15); // $430–$500
  const steps = (d.slack[1] - d.slack[0]) / PRICE_STEP;
  const slack = d.slack[0] + PRICE_STEP * rng.int(steps + 1);
  const temper = rng.pick(TEMPERS);
  // a trained diplomat's face is the one most likely to be controlled
  const tell = rng.weighted(TELLS, (k) => (k === 'face' ? d.faceBias : 1))!;
  return {
    seed, d, ask, floor: ask - slack, temper,
    frozen: d.noise === 'frozen' ? tell : null,
    bluff: d.noise === 'bluff' ? tell : null,
    soft: Array.from({ length: ROUNDS }, () => (rng.chance(0.5) ? PRICE_STEP : 0)),
  };
}

/**
 * Lay out the dinner. Same seed, same dinner. A dinner the EXPERT cannot
 * close is laid out again (bounded; in practice never needed).
 */
export function ambassadorSetup(seed: number, d: AmbassadorDifficulty): AmbassadorSetup {
  let last: AmbassadorSetup | null = null;
  for (let attempt = 0; attempt < LAYOUT_TRIES; attempt++) {
    const setup = layoutDinner(seed, d, attempt);
    last = setup;
    if (ambassadorPlay(setup, EXPERT).over === 'won') return setup;
  }
  return last!;
}

/* -------------------------------------------------------------- the dinner */

export function ambassadorStart(setup: AmbassadorSetup): AmbassadorState {
  return { setup, round: 1, price: setup.ask, patience: setup.d.startPatience, log: [] };
}

/** The five offers, lowest first: his price minus $40, $30, $20, $10, and his price. */
export function offerPrices(s: AmbassadorState): number[] {
  return Array.from({ length: OFFER_COUNT }, (_, i) => s.price - OFFER_STEP * (OFFER_COUNT - 1 - i));
}

/** 2 relaxed, 1 irritated, 0 about to stand. */
export function levelOf(patience: number): Level {
  return patience >= LEVEL_HIGH ? 2 : patience >= LEVEL_LOW ? 1 : 0;
}

export interface Tell {
  level: Level;
  /** the tell never changes tonight (act 2) */
  frozen?: boolean;
}
export type Tells = Record<TellId, Tell>;

/** What the face, the glass and the notebook show right now. */
export function readTells(s: AmbassadorState): Tells {
  const truth = levelOf(s.patience);
  const { frozen, bluff } = s.setup;
  const one = (id: TellId): Tell => {
    if (id === frozen) return { level: 2, frozen: true };
    if (id === bluff) return { level: Math.min(2, truth + 1) as Level };
    return { level: truth };
  };
  return { face: one('face'), glass: one('glass'), notes: one('notes') };
}

/** The signed price's score: 100 at his floor, 0 at his opening ask. */
export function ambassadorScore(s: AmbassadorState): number {
  if (s.over !== 'won' || s.deal === undefined) return 0;
  const { ask, floor } = s.setup;
  return Math.max(0, Math.min(100, Math.round((100 * (ask - s.deal)) / (ask - floor))));
}

/** Round a price up to the next $5. */
const up5 = (x: number) => Math.ceil(x / PRICE_STEP) * PRICE_STEP;

/**
 * Make offer number `index` (0 = the lowest, 4 = his price) and say `line`.
 * Returns the next state; the log's last entry says what he did.
 */
export function ambassadorOffer(prev: AmbassadorState, index: number, line: LineId): AmbassadorState {
  if (prev.over || index < 0 || index >= OFFER_COUNT) return prev;
  const { setup } = prev;
  const d = setup.d;
  const s: AmbassadorState = { ...prev, log: prev.log.slice() };
  const offer = offerPrices(prev)[index];
  const base = LINE_EFFECT[setup.temper][line];
  const effect = Math.round(base * d.lineScale);
  const reaction = reactionOf(base);
  if (offer >= setup.floor) {
    s.over = 'won';
    s.deal = offer;
    s.log.push({ round: s.round, offer, line, verdict: 'deal', reaction });
    return s;
  }
  // refused: he gives 1/giveBy of the way to your offer (and now and then
  // $5 more), but never goes below his floor
  const counter = Math.max(setup.floor, s.price - up5((s.price - offer) / d.giveBy) - setup.soft[s.round - 1]);
  const cost = Math.round(d.annoy + (d.hit * (setup.floor - offer)) / OFFER_STEP);
  s.patience = Math.min(100, s.patience - cost + effect);
  if (s.patience <= 0) {
    s.patience = 0;
    s.over = 'walked';
    s.log.push({ round: s.round, offer, line, verdict: 'walkout', reaction });
    return s;
  }
  if (s.round >= ROUNDS) {
    s.over = 'dessert';
    s.log.push({ round: s.round, offer, line, verdict: 'dessert', reaction });
    return s;
  }
  s.price = counter;
  s.log.push({ round: s.round, offer, line, verdict: 'counter', counter, reaction });
  s.round += 1;
  return s;
}

/* ------------------------------------------- what a player can see */

/** Everything a player can read off the screen — never the floor, patience or temper. */
export interface AmbassadorView {
  round: number;
  /** his price now */
  price: number;
  /** the five offers, lowest first */
  offers: number[];
  tells: Tells;
  /** what has happened so far: the offer, the line, how it landed, and his counter */
  history: RoundLog[];
}

export function ambassadorView(s: AmbassadorState): AmbassadorView {
  return { round: s.round, price: s.price, offers: offerPrices(s), tells: readTells(s), history: s.log };
}

export interface Move { offer: number; line: LineId }
/** A player: sees the screen, remembers what it likes. */
export type AmbassadorPolicy = (v: AmbassadorView, d: AmbassadorDifficulty) => Move;

/** Play a whole dinner as `policy` (null: sit through the courses and say nothing). Deterministic. */
export function ambassadorPlay(setup: AmbassadorSetup, policy: AmbassadorPolicy | null): AmbassadorState {
  let s = ambassadorStart(setup);
  if (!policy) return { ...s, round: ROUNDS, over: 'dessert' };
  for (let guard = 0; !s.over && guard < ROUNDS + 2; guard++) {
    const m = policy(ambassadorView(s), setup.d);
    s = ambassadorOffer(s, m.offer, m.line);
  }
  return s;
}

/* ------------------------------------------- how a person plays */

/** How each reaction ranks, for choosing a line. */
const LIKE: Record<Reaction, number> = { delighted: 3, pleased: 2, cool: 1, offended: 0 };

/**
 * The line to say: the best one he has shown he likes; if none landed well
 * yet, the next one not tried. (`explore` false: never try a new one.)
 */
export function chooseLine(history: RoundLog[], explore = true): LineId {
  let best: LineId | null = null;
  let bestScore = -1;
  for (const h of history) {
    if (LIKE[h.reaction] > bestScore) { bestScore = LIKE[h.reaction]; best = h.line; }
  }
  if (best && (bestScore >= 3 || !explore)) return best;
  const untried = LINES.find((l) => !history.some((h) => h.line === l));
  return untried ?? best ?? LINES[0];
}

/** What a line does, as far as the player knows from how he took it. */
export function knownEffect(history: RoundLog[], line: LineId, d: AmbassadorDifficulty): number | null {
  const h = history.find((x) => x.line === line);
  if (!h) return null;
  return Math.round({ delighted: 12, pleased: 4, cool: -6, offended: -12 }[h.reaction] * d.lineScale);
}

/** The level most of the visible tells agree on: the middle one of three, or the lower of two. */
export function consensusLevel(t: Tells): Level {
  const lv = TELLS.map((k) => t[k].level).sort((a, b) => a - b);
  return lv[1];
}

/**
 * The boldest offer that cannot cost more patience than he has at the bottom
 * of his current level (the worst a line can do is 12; a line known to be
 * liked is better). This is how a person who knows the numbers plays safe.
 */
function safeOffer(level: Level, d: AmbassadorDifficulty, history: RoundLog[], line: LineId): number {
  const floorOfLevel = level === 2 ? LEVEL_HIGH : level === 1 ? LEVEL_LOW : 1;
  const effect = knownEffect(history, line, d) ?? -Math.round(12 * d.lineScale);
  for (let i = 0; i < OFFER_COUNT - 1; i++) {
    const underBy = OFFER_COUNT - 1 - i; // the most an offer can be under his floor, in offer steps
    const worst = Math.round(d.annoy + d.hit * underBy) - effect;
    if (worst < floorOfLevel) return i;
  }
  return OFFER_COUNT - 1;
}

/**
 * A careful player: reads all three tells and believes the two that agree,
 * learns which line he likes from how it lands, bids as boldly as is safe
 * for the patience he is showing, and takes his price on the last course.
 * Every dinner is laid out so this player closes it.
 */
export const EXPERT: AmbassadorPolicy = (v, d) => {
  const line = chooseLine(v.history, v.round <= 2);
  if (v.round >= ROUNDS) return { offer: OFFER_COUNT - 1, line };
  return { offer: safeOffer(consensusLevel(v.tells), d, v.history, line), line };
};

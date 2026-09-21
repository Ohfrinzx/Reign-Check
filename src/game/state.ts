import type {
  GameState, Stats, Hidden, Regime, FactionState, CharacterState, FactionId, RunStats,
} from './types';
import { STAT_KEYS, HIDDEN_KEYS, REGIME_KEYS } from './types';
import { FACTION_ORDER, CHARACTERS } from './content/country';
import { makeRng, randomSeed } from './rng';
import { clampStat } from './stats';
import { MANDATES, MANDATE_MAP } from './content/mandates';
import { applyEffects } from './effects';

/** Bump whenever GameState's shape changes — save.ts discards mismatched
 *  saves rather than crashing (ground rule 10). 3→4: the Back Room's
 *  shopStock/owned/heldFavours/shopBought/shopRecent fields and
 *  RunStats.dealsStruck. 4→5: GameState.activeDeals, for timed deals.
 *  5→6: activeDeals replaced by heldDeals (every deal now occupies a slot,
 *  not just timed ones) plus endedDeals, for the advisor/deal cap.
 *  6→7: mandateId; generated effect IDs now use a saved flags counter.
 *  7→8: runDeck/bannedCards, for the run deck (§4.4). */
export const SAVE_VERSION = 8;

/** A run is 3 acts of ACT_LENGTH days each, every act ending in a confidence
 *  vote (see checkEndings' 'noConfidence' entry in content/endings.ts) rather
 *  than running as one flat block of days. */
export const ACT_LENGTH = 6;
export const NUM_ACTS = 3;
export const DEFAULT_MAX_DAYS = ACT_LENGTH * NUM_ACTS;

/** True on the last day of the current act — the day its confidence vote is held. */
export function isActEndDay(s: GameState): boolean {
  return s.day === s.act * ACT_LENGTH;
}

/** True on the Night Review for the day whose confidence vote was just passed —
 *  by then `act` has already advanced, so this looks one act back. */
export function justAdvancedAct(s: GameState): boolean {
  return s.act > 1 && s.day === (s.act - 1) * ACT_LENGTH;
}

/**
 * Where you are inside the CURRENT act, 1..ACT_LENGTH — not the absolute run
 * day. Owner preference: the masthead/front-page should read "Day 3 / 6"
 * (progress toward this act's confidence vote), not "Day 15 / 18" (progress
 * toward the whole run), so the number in front of the player is the one
 * that actually matters day to day.
 */
export function dayInAct(s: GameState): number {
  return ((s.day - 1) % ACT_LENGTH) + 1;
}

const BASE_STATS: Stats = {
  power: 52, legitimacy: 45, support: 50, treasury: 42, economy: 48,
  elite: 50, military: 52, security: 55, stability: 55, information: 60,
};

const BASE_FACTION: Record<FactionId, Omit<FactionState, 'id' | 'loyalty'>> = {
  staff:     { power: 78, influence: 60, patience: 70, grudges: [], favours: [], revealed: 0 },
  sable:     { power: 66, influence: 74, patience: 65, grudges: [], favours: [], revealed: 0 },
  concord:   { power: 70, influence: 62, patience: 60, grudges: [], favours: [], revealed: 0 },
  combine:   { power: 62, influence: 48, patience: 62, grudges: [], favours: [], revealed: 0 },
  grey:      { power: 52, influence: 70, patience: 72, grudges: [], favours: [], revealed: 0 },
  provinces: { power: 58, influence: 54, patience: 58, grudges: [], favours: [], revealed: 0 },
  chorus:    { power: 30, influence: 66, patience: 55, grudges: [], favours: [], revealed: 0 },
};

function emptyRunStats(): RunStats {
  return {
    decisions: 0, dealsStruck: 0, alertsSurvived: 0, moneySpent: 0, moneyTaken: 0,
    peopleJailed: 0, peoplePromoted: 0, protestsCrushed: 0, protestsAppeased: 0,
    liesTold: 0, promisesKept: 0, promisesBroken: 0, coupAttempts: 0, ministersLost: 0,
    projectsBuilt: [], bigMoments: [],
  };
}

export const HONORIFICS = [
  { id: 'sir', label: 'Sir', word: 'sir' },
  { id: 'maam', label: "Ma'am", word: "ma'am" },
  { id: 'chair', label: 'Chair', word: 'Chair' },
] as const;

export interface NewGameOptions {
  leaderName?: string;
  honorific?: string;
  seed?: number;
  maxDays?: number;
  mandateId?: string;
}

export function createGame(opts: NewGameOptions = {}): GameState {
  const seed = opts.seed ?? randomSeed();
  const rng = makeRng(seed);

  // Roll even for a chosen mandate, so equal seeds share baseline conditions.
  const rolled = rng.pick(MANDATES);
  const mandate = MANDATE_MAP[opts.mandateId ?? ''] ?? rolled;

  // ---- stats, with jitter so no two runs start identically
  const stats = {} as Stats;
  for (const k of STAT_KEYS) {
    const base = BASE_STATS[k];
    stats[k] = clampStat(k, base + rng.range(-4, 4));
  }

  const hidden = {} as Hidden;
  for (const k of HIDDEN_KEYS) {
    hidden[k] = Math.max(0, Math.min(100, 8 + rng.range(-3, 5)));
  }

  const regime = {} as Regime;
  for (const k of REGIME_KEYS) regime[k] = 0;

  // ---- neutral faction support, with seeded variation; mandates apply below
  const factions = {} as Record<FactionId, FactionState>;
  for (const id of FACTION_ORDER) {
    const base = BASE_FACTION[id];
    factions[id] = {
      id,
      loyalty: clamp(50 + rng.range(-6, 6)),
      power: clamp(base.power + rng.range(-5, 5)),
      influence: clamp(base.influence + rng.range(-5, 5)),
      patience: clamp(base.patience + rng.range(-5, 5)),
      grudges: [],
      favours: [],
      revealed: 0,
    };
  }

  // ---- characters: personality is authored, disposition is rolled
  const characters: Record<string, CharacterState> = {};
  for (const def of CHARACTERS) {
    const f = factions[def.faction];
    characters[def.id] = {
      id: def.id,
      loyalty: clamp(f.loyalty + rng.range(-14, 14)),
      trust: clamp(45 + rng.range(-12, 18)),
      fear: clamp(12 + rng.range(0, 14)),
      influence: clamp(40 + def.ambition * 0.3 + rng.range(-8, 12)),
      alive: true,
      inPost: true,
      exiled: false,
      memory: [],
      plotting: Math.max(0, rng.range(-6, 8)),
    };
  }

  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    mandateId: mandate.id,
    rngState: rng.state(),
    leaderName: (opts.leaderName || '').trim() || 'Adrin Vo',
    leaderTitle: 'Executive Chair',
    honorific: HONORIFICS.find((h) => h.id === opts.honorific || h.word === opts.honorific)?.word ?? 'sir',
    startedAt: Date.now(),

    day: 1,
    maxDays: opts.maxDays ?? DEFAULT_MAX_DAYS,
    act: 1,
    phase: 'briefing',

    agenda: [],
    stageIndex: 0,

    stats,
    statsAtDayStart: { ...stats },
    trend: {},
    hidden,
    regime,

    factions,
    characters,

    flags: {},
    scheduled: [],
    promises: [],
    projects: [],
    scandals: [],
    commitments: [],

    todayDeck: [],
    queued: [],
    seenOnce: [],
    runDeck: [],
    bannedCards: [],

    alertsToday: 0,
    lastAlertDay: 0,

    shopStock: [],
    owned: [],
    heldFavours: [],
    shopBought: [],
    shopRecent: [],
    shopBuysTonight: 0,
    heldDeals: [],
    endedDeals: [],

    log: [
      {
        day: 1,
        kind: 'system',
        title: mandate.name,
        text: mandate.summary,
        tone: 'neutral',
      },
    ],
    history: [],
    newsQueue: [],

    stat: emptyRunStats(),
  };

  applyEffects(state, mandate.startEffects, rng, 'mandate:start');
  state.rngState = rng.state();
  state.statsAtDayStart = { ...state.stats };

  return state;
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

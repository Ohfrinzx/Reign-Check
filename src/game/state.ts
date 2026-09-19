import type {
  GameState, Stats, Hidden, Regime, FactionState, CharacterState, FactionId, RunStats,
} from './types';
import { STAT_KEYS, HIDDEN_KEYS, REGIME_KEYS } from './types';
import { FACTION_ORDER, CHARACTERS } from './content/country';
import { makeRng, randomSeed } from './rng';
import { clampStat } from './stats';

export const SAVE_VERSION = 1;
export const DEFAULT_MAX_DAYS = 30;

/** Opening conditions vary run to run, so no two First Citizens inherit the same mess. */
export interface OpeningScenario {
  id: string;
  name: string;
  summary: string;
  stats: Partial<Stats>;
  hidden: Partial<Hidden>;
  factionTweak: Partial<Record<FactionId, Partial<FactionState>>>;
  openingNote: string;
}

export const OPENINGS: OpeningScenario[] = [
  {
    id: 'stairwell',
    name: 'The Stairwell Succession',
    summary:
      'Marshal Krast is nine days dead and the Sable Office has still not named who was in the stairwell with him. You were sworn in at 04:00 by a judge who asked no questions.',
    stats: { power: 46, legitimacy: 34, security: 62, elite: 52, military: 48 },
    hidden: { scandal: 18, fear: 22, coup: 14 },
    factionTweak: { sable: { loyalty: 62, influence: 70 }, chorus: { loyalty: 28 } },
    openingNote:
      'Nobody in this building believes you will last the month. Two of them have already drafted the statement.',
  },
  {
    id: 'empty-vault',
    name: 'The Inherited Hole',
    summary:
      'Krast left you the office, the residence, and a treasury with a hole in it the Finance Ministry has been describing, for two years, as "a timing difference".',
    stats: { treasury: 24, economy: 41, legitimacy: 44, elite: 44 },
    hidden: { fiscal: 34, corruption: 26 },
    factionTweak: { concord: { loyalty: 44, power: 72 }, combine: { patience: 44 } },
    openingNote:
      'Brask has asked for eleven minutes of your time. Brask never asks for eleven minutes about good news.',
  },
  {
    id: 'restive-south',
    name: 'The Marches Are Awake',
    summary:
      'Three weeks of Hadeni-language broadcasts from across the Drovnan border, two burned customs posts, and a governor who has stopped returning calls from the capital.',
    stats: { stability: 38, security: 52, support: 48, military: 56 },
    hidden: { separatism: 32, foreign: 24, unrest: 20 },
    factionTweak: { provinces: { loyalty: 40, patience: 42 }, staff: { loyalty: 58 } },
    openingNote:
      'The Staff would like a decision about the Marches. The Staff would like it this week.',
  },
  {
    id: 'cold-winter',
    name: 'A Long Cold Quarter',
    summary:
      'Gas came in eleven per cent over budget, the Gorsk shafts are running short shifts, and the Combine has scheduled a "consultative meeting" that everyone understands is a countdown.',
    stats: { economy: 38, support: 42, stability: 44, treasury: 36 },
    hidden: { unrest: 28, fiscal: 26 },
    factionTweak: { combine: { loyalty: 38, power: 68 }, concord: { loyalty: 56 } },
    openingNote:
      'Hess has requested a meeting. He has never once requested a meeting that was about nothing.',
  },
  {
    id: 'clean-hands',
    name: 'The Reformer\'s Window',
    summary:
      'You came in on a promise of "an honest audit of everything", which was a superb line at 04:00 and is now a policy commitment that thirty thousand officials are reading very carefully.',
    stats: { legitimacy: 58, support: 58, elite: 38, security: 44 },
    hidden: { scandal: 10, corruption: 34, fear: 10 },
    factionTweak: { chorus: { loyalty: 58 }, grey: { patience: 45 }, concord: { loyalty: 40 } },
    openingNote:
      'Everyone is waiting to see whether you meant it. Including, if you are honest, you.',
  },
];

const BASE_STATS: Stats = {
  power: 52, legitimacy: 45, support: 50, treasury: 42, economy: 48,
  elite: 50, military: 52, security: 55, stability: 55, information: 60,
};

const BASE_FACTION: Record<FactionId, Omit<FactionState, 'id'>> = {
  staff:     { loyalty: 55, power: 78, influence: 60, patience: 70, grudges: [], favours: [], revealed: 0 },
  sable:     { loyalty: 58, power: 66, influence: 74, patience: 65, grudges: [], favours: [], revealed: 0 },
  concord:   { loyalty: 50, power: 70, influence: 62, patience: 60, grudges: [], favours: [], revealed: 0 },
  combine:   { loyalty: 46, power: 62, influence: 48, patience: 62, grudges: [], favours: [], revealed: 0 },
  grey:      { loyalty: 54, power: 52, influence: 70, patience: 72, grudges: [], favours: [], revealed: 0 },
  provinces: { loyalty: 48, power: 58, influence: 54, patience: 58, grudges: [], favours: [], revealed: 0 },
  chorus:    { loyalty: 40, power: 30, influence: 66, patience: 55, grudges: [], favours: [], revealed: 0 },
};

function emptyRunStats(): RunStats {
  return {
    decisions: 0, alertsSurvived: 0, moneySpent: 0, moneyTaken: 0,
    peopleJailed: 0, peoplePromoted: 0, protestsCrushed: 0, protestsAppeased: 0,
    liesTold: 0, promisesKept: 0, promisesBroken: 0, coupAttempts: 0, ministersLost: 0,
    projectsBuilt: [], bigMoments: [],
  };
}

export interface NewGameOptions {
  leaderName?: string;
  seed?: number;
  maxDays?: number;
  openingId?: string;
}

export function createGame(opts: NewGameOptions = {}): GameState {
  const seed = opts.seed ?? randomSeed();
  const rng = makeRng(seed);

  const opening =
    OPENINGS.find((o) => o.id === opts.openingId) ?? rng.pick(OPENINGS);

  // ---- stats, with jitter so no two runs start identically
  const stats = {} as Stats;
  for (const k of STAT_KEYS) {
    const base = opening.stats[k] ?? BASE_STATS[k];
    stats[k] = clampStat(k, base + rng.range(-4, 4));
  }

  const hidden = {} as Hidden;
  for (const k of HIDDEN_KEYS) {
    hidden[k] = Math.max(0, Math.min(100, (opening.hidden[k] ?? 8) + rng.range(-3, 5)));
  }

  const regime = {} as Regime;
  for (const k of REGIME_KEYS) regime[k] = 0;

  // ---- factions, with jitter and scenario tweaks
  const factions = {} as Record<FactionId, FactionState>;
  for (const id of FACTION_ORDER) {
    const base = BASE_FACTION[id];
    const tweak = opening.factionTweak[id] ?? {};
    factions[id] = {
      id,
      loyalty: clamp(((tweak.loyalty ?? base.loyalty) + rng.range(-6, 6))),
      power: clamp(((tweak.power ?? base.power) + rng.range(-5, 5))),
      influence: clamp(((tweak.influence ?? base.influence) + rng.range(-5, 5))),
      patience: clamp(((tweak.patience ?? base.patience) + rng.range(-5, 5))),
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
    rngState: rng.state(),
    leaderName: (opts.leaderName || '').trim() || 'Adrin Vo',
    leaderTitle: 'First Citizen',
    startedAt: Date.now(),

    day: 1,
    maxDays: opts.maxDays ?? DEFAULT_MAX_DAYS,
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

    flags: { openingId: 0 },
    scheduled: [],
    promises: [],
    projects: [],
    scandals: [],

    todayDeck: [],
    queued: [],
    seenOnce: [],

    alertsToday: 0,
    lastAlertDay: 0,

    log: [
      {
        day: 1,
        kind: 'system',
        title: opening.name,
        text: opening.summary,
        tone: 'neutral',
      },
    ],
    history: [],
    newsQueue: [],

    stat: emptyRunStats(),
  };

  state.flags[`opening:${opening.id}`] = 1;
  state.newsQueue.push(opening.openingNote);

  return state;
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

export function currentOpening(s: GameState): OpeningScenario {
  const found = OPENINGS.find((o) => s.flags[`opening:${o.id}`]);
  return found ?? OPENINGS[0];
}

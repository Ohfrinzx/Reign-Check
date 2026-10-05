import type { GameState, FactionId, StatKey } from './types';
import { computeBudget } from './economy';

/**
 * DISPLAY LAYER — the only place the "3 resources / 5 factions" design
 * decision lives.
 *
 * The engine underneath still tracks all 10 stats and all 7 factions in full
 * — nothing here changes GameState, effects.ts, or any card. This module
 * only decides what the PLAYER SEES. That keeps the simulation's depth and
 * every existing test intact while cutting the on-screen trackable count
 * from ~55 to ~10, per docs/DESIGN_V2.md.
 *
 * If a deeper mechanical cut is ever wanted (fewer underlying stats, not
 * just fewer displayed ones), that is a separate, much bigger change and
 * should not be assumed from this file.
 */

export type ResourceKey = 'money' | 'grip' | 'legitimacy';

export interface ResourceReading {
  key: ResourceKey;
  label: string;
  value: number;      // 0-100, except money which is raw $ (see money field)
  display: string;     // pre-formatted for the ledger
  sub?: string;        // small line under the value (rate, etc.)
  tone: 'good' | 'ok' | 'warn' | 'bad';
  tip: string;
}

function tone(v: number): 'good' | 'ok' | 'warn' | 'bad' {
  if (v >= 65) return 'good';
  if (v >= 45) return 'ok';
  if (v >= 25) return 'warn';
  return 'bad';
}

function weighted(parts: [number, number][]): number {
  let sum = 0, w = 0;
  for (const [v, weight] of parts) { sum += v * weight; w += weight; }
  return w ? sum / w : 0;
}

/* ------------------------------------------- the numbers under the three */

/** What Grip and Legitimacy are made of. computeResources() reads these, and
 *  so does every explanation below, so the words can never drift from the
 *  maths. */
export const GRIP_PARTS: [StatKey, number][] = [
  ['power', 0.45], ['security', 0.25], ['military', 0.15], ['information', 0.15],
];
export const LEGITIMACY_PARTS: [StatKey, number][] = [
  ['legitimacy', 0.5], ['support', 0.35], ['stability', 0.15],
];

export interface StatGuide {
  key: StatKey;
  /** the name the player sees, matching the result pills */
  label: string;
  /** which of the three top numbers it moves, or null for none */
  feeds: ResourceKey | null;
  /** "15% of Grip", "your daily income", "none of the three" */
  feedsText: string;
  /** what it is and what it does, high and low, in plain words */
  does: string;
}

const RESOURCE_LABEL: Record<ResourceKey, string> = { money: 'Money', grip: 'Grip', legitimacy: 'Legitimacy' };

function partOf(k: StatKey): { feeds: ResourceKey; share: number } | null {
  const g = GRIP_PARTS.find(([p]) => p === k);
  if (g) return { feeds: 'grip', share: g[1] };
  const l = LEGITIMACY_PARTS.find(([p]) => p === k);
  if (l) return { feeds: 'legitimacy', share: l[1] };
  return null;
}

/** The label each engine stat goes by on a result pill and in the guide. */
export const STAT_PLAYER_LABEL: Record<StatKey, string> = {
  power: 'Power', legitimacy: 'Legitimacy', support: 'Support', treasury: 'Money',
  economy: 'Economy', elite: 'Elite', military: 'Military', security: 'Security',
  stability: 'Stability', information: 'Information',
};

/** What each number does. Checked against the engine (engine.ts upkeep,
 *  briefing.ts, effects.ts coupling, content/endings.ts, FACTION_MOVES in
 *  content/demands.ts). Change these words when those rules change. */
const STAT_DOES: Record<StatKey, string> = {
  power: 'How much of the government obeys you. Low Power lets the provinces drift away. At 5 or below, orders stop arriving and the run ends.',
  security: 'How well the secret police see trouble coming. Higher Security makes arrests and raids in emergencies more likely to work, and helps stop an army coup or the Street taking the square.',
  military: 'Whether the army obeys your orders (not the same as the Army\'s mood). The lower it is, the faster coup talk grows and the likelier army emergencies get. Very low, with the officers already talking, the army moves.',
  information: 'How much of what you are told is true. The lower it is, the faster leaked papers pile up, and leaks turn into scandals and emergencies; high Information dries them up. Below 35, the front page stops showing the milder warnings. Below 30, good news lifts Support less. Above 72, the front page tells you so. It also helps stop Security removing you.',
  legitimacy: 'Whether people accept your right to rule. Below 40, scandals take longer to die down. It helps stop an army coup or the Elites replacing you.',
  support: 'What the public thinks of you this week. It drifts towards the Street\'s and the Workers\' mood. The lower it is, the faster anger on the street builds.',
  stability: 'How close the country is to strikes and riots. The lower it is, the faster anger on the street builds, and it slowly drags the Economy down with it. At 6 or below, with Support under 20, the street removes you.',
  treasury: 'Money in the bank, in billions of dollars. Below zero, debt costs Support, Stability and Power every morning, and votes in parliament.',
  economy: 'Output and jobs. Exports, port fees and taxes all grow or shrink with it, so it sets most of your daily income. At 6 or below, with almost no money left, the state collapses.',
  elite: 'Whether the rich and well-connected still back you (not the same as the Elites\' mood). At 6 or below, with Power under 35, the rich replace you. It helps stop the Elites\' attempt to replace you.',
};

function statGuideFor(k: StatKey): StatGuide {
  const part = partOf(k);
  let feeds: ResourceKey | null = part?.feeds ?? null;
  let feedsText = part ? `${Math.round(part.share * 100)}% of ${RESOURCE_LABEL[part.feeds]}` : 'none of the three';
  if (k === 'treasury') { feeds = 'money'; feedsText = 'Money itself'; }
  if (k === 'economy') { feeds = 'money'; feedsText = 'your daily income (Money)'; }
  return { key: k, label: STAT_PLAYER_LABEL[k], feeds, feedsText, does: STAT_DOES[k] };
}

/** In the order the guide lists them: Grip's parts, Legitimacy's, Money's, the rest. */
export const STAT_GUIDE: StatGuide[] = (
  [...GRIP_PARTS.map(([k]) => k), ...LEGITIMACY_PARTS.map(([k]) => k), 'treasury', 'economy', 'elite'] as StatKey[]
).map(statGuideFor);

export function statGuide(k: StatKey): StatGuide {
  return STAT_GUIDE.find((g) => g.key === k) ?? statGuideFor(k);
}

function partsText(parts: [StatKey, number][]): string {
  return parts.map(([k, w]) => `${STAT_PLAYER_LABEL[k]} ${Math.round(w * 100)}%`).join(', ');
}

export function computeResources(s: GameState): ResourceReading[] {
  const budget = computeBudget(s);
  const moneyTone: 'good' | 'ok' | 'warn' | 'bad' =
    s.stats.treasury > 45 ? 'good' : s.stats.treasury > 22 ? 'ok' : s.stats.treasury > 6 ? 'warn' : 'bad';

  const grip = weighted(GRIP_PARTS.map(([k, w]) => [s.stats[k], w]));
  const legitimacy = weighted(LEGITIMACY_PARTS.map(([k, w]) => [s.stats[k], w]));

  return [
    {
      key: 'money', label: 'Money',
      value: s.stats.treasury,
      display: `$${s.stats.treasury.toFixed(1)}B`,
      sub: `${budget.net >= 0 ? '+' : '-'}$${Math.abs(budget.net).toFixed(2)}B / day`,
      tone: moneyTone,
      tip: 'What the country has in the bank, and what it is earning or losing per day. Every price tag on a card comes out of this. Below zero, the state starts missing payroll. The Economy sets most of your daily income.',
    },
    {
      key: 'grip', label: 'Grip',
      value: grip, display: String(Math.round(grip)),
      tone: tone(grip),
      tip: `How much of the government actually does what you tell it to — the army, the police, and how good your information is. At zero, you are a figurehead. Made of: ${partsText(GRIP_PARTS)}.`,
    },
    {
      key: 'legitimacy', label: 'Legitimacy',
      value: legitimacy, display: String(Math.round(legitimacy)),
      tone: tone(legitimacy),
      tip: `Whether people accept that you are supposed to have this job. At zero, removing you stops looking like a crime and starts looking like a duty. Made of: ${partsText(LEGITIMACY_PARTS)}.`,
    },
  ];
}

/* ------------------------------------------------------------- factions */

export interface DisplayFactionDef {
  id: FactionId;
  label: string;
  icon: string;
  /** short mood word per loyalty tier, high to low */
  moods: [string, string, string, string, string];
}

/** The five factions shown on the desk. Civil Service and the Provinces are
 *  still fully simulated — they drive effects and appear as characters and
 *  card sources (Grebs, Kostyn) — they just do not get a permanent bar. */
export const DISPLAY_FACTIONS: DisplayFactionDef[] = [
  { id: 'staff',   label: 'Army',     icon: '★', moods: ['devoted', 'backing you', 'uneasy', 'hostile', 'ready to move'] },
  { id: 'sable',   label: 'Security', icon: '◈', moods: ['loyal', 'watchful', 'guarded', 'suspicious', 'turning on you'] },
  { id: 'concord', label: 'Elites',   icon: '◆', moods: ['invested', 'content', 'wary', 'pulling out', 'hostile'] },
  { id: 'combine', label: 'Workers',  icon: '⚒', moods: ['on side', 'calm', 'restless', 'angry', 'ready to strike'] },
  { id: 'chorus',  label: 'Street',   icon: '◎', moods: ['warm', 'quiet', 'restless', 'furious', 'in the square'] },
];

/** Balance slice B: a faction below this loyalty is HOSTILE — the bottom mood
 *  on its bar. It works against you every morning (demands.ts tickHostility())
 *  and its deputies vote against you as one (content/endings.ts). */
export const HOSTILE_BELOW = 20;

export function isHostile(s: GameState, id: FactionId): boolean {
  return s.factions[id].loyalty < HOSTILE_BELOW;
}

export function factionMood(def: DisplayFactionDef, loyalty: number): { word: string; tone: 'good' | 'ok' | 'warn' | 'bad' } {
  const idx = loyalty >= 72 ? 0 : loyalty >= 55 ? 1 : loyalty >= 38 ? 2 : loyalty >= HOSTILE_BELOW ? 3 : 4;
  const toneByIdx: ('good' | 'ok' | 'warn' | 'bad')[] = ['good', 'good', 'ok', 'warn', 'bad'];
  return { word: def.moods[idx], tone: idx <= 1 ? 'good' : toneByIdx[idx] };
}

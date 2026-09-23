import type { GameState, FactionId } from './types';
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

export function computeResources(s: GameState): ResourceReading[] {
  const budget = computeBudget(s);
  const moneyTone: 'good' | 'ok' | 'warn' | 'bad' =
    s.stats.treasury > 45 ? 'good' : s.stats.treasury > 22 ? 'ok' : s.stats.treasury > 6 ? 'warn' : 'bad';

  const grip = weighted([
    [s.stats.power, 0.45], [s.stats.security, 0.25],
    [s.stats.military, 0.15], [s.stats.information, 0.15],
  ]);
  const legitimacy = weighted([
    [s.stats.legitimacy, 0.5], [s.stats.support, 0.35], [s.stats.stability, 0.15],
  ]);

  return [
    {
      key: 'money', label: 'Money',
      value: s.stats.treasury,
      display: `$${s.stats.treasury.toFixed(1)}B`,
      sub: `${budget.net >= 0 ? '+' : '-'}$${Math.abs(budget.net).toFixed(2)}B / day`,
      tone: moneyTone,
      tip: 'What the country has in the bank, and what it is earning or losing per day. Every price tag on a card comes out of this. Below zero, the state starts missing payroll.',
    },
    {
      key: 'grip', label: 'Grip',
      value: grip, display: String(Math.round(grip)),
      tone: tone(grip),
      tip: 'How much of the government actually does what you tell it to — the army, the police, and how good your information is. At zero, you are a figurehead.',
    },
    {
      key: 'legitimacy', label: 'Legitimacy',
      value: legitimacy, display: String(Math.round(legitimacy)),
      tone: tone(legitimacy),
      tip: 'Whether people accept that you are supposed to have this job. At zero, removing you stops looking like a crime and starts looking like a duty.',
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

import type { StatKey, Stats, HiddenKey, RegimeKey } from './types';
import { STAT_KEYS } from './types';

export interface StatMeta {
  key: StatKey;
  label: string;
  short: string;
  icon: string;
  /** what it means, in the player's language */
  tip: string;
  /** what happens if it hits zero */
  danger: string;
  accent: string;
  /** treasury is displayed as money, not a bar */
  money?: boolean;
}

export const STAT_META: Record<StatKey, StatMeta> = {
  power: {
    key: 'power', label: 'Power', short: 'POW', icon: '⬢', accent: '#e0b654',
    tip: 'How much of the state actually does what you tell it to.',
    danger: 'At zero you are a figurehead, and figureheads are replaced quietly.',
  },
  legitimacy: {
    key: 'legitimacy', label: 'Legitimacy', short: 'LEG', icon: '⚖', accent: '#9db4d0',
    tip: 'Whether people believe you are supposed to be in that chair.',
    danger: 'At zero, removing you stops being a crime and becomes a duty.',
  },
  support: {
    key: 'support', label: 'Public Support', short: 'PUB', icon: '☗', accent: '#7fc99a',
    tip: 'What the country thinks of you this week. Volatile. Shallow. Decisive.',
    danger: 'At zero the street belongs to somebody else.',
  },
  treasury: {
    key: 'treasury', label: 'Treasury', short: 'TRE', icon: '₩', accent: '#d9c47a', money: true,
    tip: 'Liquid funds, in billions of velks. Everything costs this.',
    danger: 'Below zero the Republic misses payroll, and payroll is one in six adults.',
  },
  economy: {
    key: 'economy', label: 'Economy', short: 'ECO', icon: '◱', accent: '#6fb3c9',
    tip: 'Output, employment, and the exchange rate, rolled into one number.',
    danger: 'At zero the velk goes, and when the velk goes, everything goes.',
  },
  elite: {
    key: 'elite', label: 'Elite Loyalty', short: 'ELI', icon: '◆', accent: '#c9a36f',
    tip: 'Whether the people who matter are still investing in your survival.',
    danger: 'At zero they will simply agree on a successor over lunch.',
  },
  military: {
    key: 'military', label: 'Military Loyalty', short: 'MIL', icon: '★', accent: '#c8a45c',
    tip: 'Whether the General Staff treats your orders as orders.',
    danger: 'At zero the garrison takes instructions from somebody else.',
  },
  security: {
    key: 'security', label: 'Security', short: 'SEC', icon: '◈', accent: '#8f9fb5',
    tip: 'Your ability to detect a plot before it becomes an event.',
    danger: 'At zero the first you hear of anything is on the news.',
  },
  stability: {
    key: 'stability', label: 'Social Stability', short: 'STA', icon: '▦', accent: '#b58ec9',
    tip: 'How close the country is to strikes, riots, and worse.',
    danger: 'At zero the Republic stops being governable from a desk.',
  },
  information: {
    key: 'information', label: 'Information', short: 'INF', icon: '◉', accent: '#9ec4a0',
    tip: 'How much of what you are told is true. Censorship lowers this.',
    danger: 'At zero your briefings are fiction and you are the last to know.',
  },
};

export const STAT_ORDER: StatKey[] = [...STAT_KEYS];

export const HIDDEN_LABEL: Record<HiddenKey, string> = {
  coup: 'appetite in the officer corps',
  unrest: 'street temperature',
  scandal: 'unexploded press material',
  leak: 'documents outside the state',
  foreign: 'external impatience',
  fiscal: 'structural budget strain',
  corruption: 'how much of the state is for sale',
  cult: 'personality-cult saturation',
  fear: 'how frightened your elite are',
  separatism: 'centrifugal pull in the provinces',
};

export const REGIME_LABEL: Record<RegimeKey, string> = {
  repression: 'Repression',
  populism: 'Populism',
  graft: 'Graft',
  militarism: 'Militarism',
  technocracy: 'Technocracy',
  reform: 'Reform',
  patronage: 'Patronage',
  personalism: 'Personalism',
  devolution: 'Devolution',
  isolation: 'Isolation',
};

export function clampStat(key: StatKey, v: number): number {
  if (key === 'treasury') return Math.max(-200, Math.min(999, Math.round(v * 10) / 10));
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

export function clamp01to100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

export function statDelta(before: Stats, after: Stats): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const d = Math.round((after[k] - before[k]) * 10) / 10;
    if (Math.abs(d) >= 0.05) out[k] = d;
  }
  return out;
}

/** Player-facing qualitative band, used for tooltips and the briefing. */
export function band(v: number): string {
  if (v >= 85) return 'commanding';
  if (v >= 70) return 'strong';
  if (v >= 55) return 'adequate';
  if (v >= 40) return 'strained';
  if (v >= 25) return 'poor';
  if (v >= 12) return 'critical';
  return 'collapsing';
}

export function bandTone(v: number): 'good' | 'ok' | 'warn' | 'bad' {
  if (v >= 65) return 'good';
  if (v >= 45) return 'ok';
  if (v >= 25) return 'warn';
  return 'bad';
}

export function money(v: number): string {
  const sign = v < 0 ? '−' : '';
  return `${sign}₩${Math.abs(v).toFixed(1)}bn`;
}

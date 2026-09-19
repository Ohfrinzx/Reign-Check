import type { GameState } from './types';
import { SAVE_VERSION } from './state';

const KEY = 'dictator-sandbox:save:v1';
const META = 'dictator-sandbox:meta:v1';

export interface SaveMeta {
  day: number;
  leaderName: string;
  savedAt: number;
  ended: boolean;
  endingTitle?: string;
}

function available(): boolean {
  try {
    const k = '__ds_probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function saveGame(s: GameState): boolean {
  if (!available()) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    const meta: SaveMeta = {
      day: s.day,
      leaderName: s.leaderName,
      savedAt: Date.now(),
      ended: s.phase === 'ended',
      endingTitle: s.ending?.title,
    };
    localStorage.setItem(META, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  if (!available()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || parsed.version !== SAVE_VERSION) return null;
    if (typeof parsed.day !== 'number' || !parsed.stats) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadMeta(): SaveMeta | null {
  if (!available()) return null;
  try {
    const raw = localStorage.getItem(META);
    return raw ? (JSON.parse(raw) as SaveMeta) : null;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  if (!available()) return;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(META);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  return loadMeta() !== null;
}

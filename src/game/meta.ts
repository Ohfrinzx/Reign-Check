import type { GameState, EndingDef } from './types';

/**
 * META-PROGRESSION (§4.5, docs/DESIGN_V2.md).
 *
 * A completed run's record, kept across runs — separate from any one run's
 * save (`save.ts`), its own localStorage key, its own version. Deleting a
 * save or restarting a run must never touch this (ground rule: meta-
 * progression is cross-run data, not part of GameState).
 *
 * Step 1 of this slice, per the design doc's own suggested de-risking: keep
 * everything unlocked (nothing in this file gates anything — every mandate
 * and shop item stays selectable/offerable regardless of `MetaProgress`),
 * and ship only the real, working part of the loop that step needs first:
 * runs get recorded, and the title screen shows your record. Real unlock
 * conditions are a follow-up slice on top of this, once it's played.
 *
 * No React, no DOM (ground rule 11) beyond the same `localStorage` use
 * `save.ts` already established as the pattern for this kind of I/O.
 */

export interface RunRecord {
  day: number;
  act: number;
  mandateId: string;
  endingId: string;
  endingKind: EndingDef['kind'];
  endingTitle: string;
  regimeLabel: string;
  leaderName: string;
  at: number;
}

export interface MetaProgress {
  version: number;
  /** most recent last; capped at MAX_RUNS so this never grows unbounded */
  runs: RunRecord[];
}

export const META_VERSION = 1;
const KEY = 'dictator-sandbox:legacy:v1';
const MAX_RUNS = 50;

function empty(): MetaProgress {
  return { version: META_VERSION, runs: [] };
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

/** Version-guarded and defensive, same as save.ts's loadGame(): a missing,
 *  stale, or corrupt record never crashes the title screen — it just reads
 *  as "no history yet". */
export function loadMetaProgress(): MetaProgress {
  if (!available()) return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as MetaProgress;
    if (!parsed || parsed.version !== META_VERSION || !Array.isArray(parsed.runs)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

export function saveMetaProgress(m: MetaProgress): void {
  if (!available()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore — a failed write just means this run's record is not kept */
  }
}

/** Append a finished run's record. Pure: returns a new MetaProgress, does
 *  not write it — the caller decides when to persist (see App.tsx). A
 *  state with no `ending` is not a finished run and is left unchanged. */
export function recordRun(meta: MetaProgress, s: GameState): MetaProgress {
  if (!s.ending) return meta;
  const record: RunRecord = {
    day: s.day,
    act: s.act,
    mandateId: s.mandateId,
    endingId: s.ending.id,
    endingKind: s.ending.kind,
    endingTitle: s.ending.title,
    regimeLabel: s.ending.regimeLabel,
    leaderName: s.leaderName,
    at: Date.now(),
  };
  return { ...meta, runs: [...meta.runs, record].slice(-MAX_RUNS) };
}

/**
 * Step 1 of §4.5: always true. This is the hook a follow-up slice replaces
 * with a real check against `meta` (e.g. "played at least one run"), not a
 * promise that unlocking is live yet — see the file header.
 */
export function isMandateUnlocked(_id: string, _meta: MetaProgress): boolean {
  return true;
}

/** Same shape and same caveat as isMandateUnlocked() above, for shop items. */
export function isShopItemUnlocked(_id: string, _meta: MetaProgress): boolean {
  return true;
}

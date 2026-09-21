import type { GameState, EndingDef } from './types';

/**
 * META-PROGRESSION (§4.5, docs/DESIGN_V2.md).
 *
 * A completed run's record, kept across runs — separate from any one run's
 * save (`save.ts`), its own localStorage key, its own version. Deleting a
 * save or restarting a run must never touch this (ground rule: meta-
 * progression is cross-run data, not part of GameState).
 *
 * Step 1 shipped the record only, nothing gated. Step 2 (this file, as of
 * 2026-09-21) adds real unlock conditions: `MANDATE_UNLOCKS`/`SHOP_UNLOCKS`
 * are the whole ruleset, as plain data — adding another locked mandate or
 * shop item is a one-line addition here, no other file needs to change
 * (ground rule 5's spirit, applied to this system too). Everything not
 * listed in either table stays unlocked from run one, same as before.
 *
 * `GameState.unlockedShopItemIds` (see types.ts) is a per-run SNAPSHOT of
 * this file's unlock check, taken once at `createGame()` time — not
 * re-evaluated mid-run. That is deliberate: unlocking something mid-run
 * (by, say, reaching Act 2) should apply to your NEXT run, not retroactively
 * change what this one's Back Room offers. The mandate check works the same
 * way — it only ever runs once, when a new game is created.
 *
 * No React, no DOM (ground rule 11) beyond the same `localStorage` use
 * `save.ts` already established as the pattern for this kind of I/O. This
 * file still does not import anything from `content/` — callers (App.tsx)
 * pass the ids to check, keeping this a generic rules engine rather than
 * something that needs to know the shape of a mandate or a shop item.
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

/** Stats derived from history, purely for evaluating unlock conditions —
 *  never shown to the player as raw numbers on their own (ground rule 6 is
 *  about hidden game-state pressures, not this, but the same instinct
 *  applies: a condition like "finish 2 runs" is shown as that plain
 *  sentence, in `UnlockRule.hint`, not as a progress-bar of this struct). */
export interface UnlockStats {
  runsCompleted: number;
  survived: number;
  /** the furthest act reached in any single run (1..NUM_ACTS) */
  bestAct: number;
}

export function computeUnlockStats(meta: MetaProgress): UnlockStats {
  return {
    runsCompleted: meta.runs.length,
    survived: meta.runs.filter((r) => r.endingKind === 'survival').length,
    bestAct: meta.runs.reduce((best, r) => Math.max(best, r.act), 0),
  };
}

export interface UnlockRule {
  id: string;
  /** plain-language condition, shown on the Progress screen */
  hint: string;
  condition: (u: UnlockStats) => boolean;
}

/** Mandates not listed here (the original four: stairwell/landslide/
 *  handover/accident) stay unlocked from run one. These two were the pair
 *  added after that base set (docs/DESIGN_V2.md §4.3's "As built" note) —
 *  the natural first candidates for "prove yourself first" content. */
export const MANDATE_UNLOCKS: UnlockRule[] = [
  { id: 'clean-hands', hint: 'Finish 2 runs, any ending.', condition: (u) => u.runsCompleted >= 2 },
  { id: 'pay-deal', hint: 'Reach Act 2 in any run.', condition: (u) => u.bestAct >= 2 },
];

/** The shop's two `rarity: 'rare'` items (content/shop.ts) — the only kind
 *  the writing rules allow to skip stating a downside, which already marks
 *  them as special. Everything else in the 47-item catalog stays eligible
 *  from run one. */
export const SHOP_UNLOCKS: UnlockRule[] = [
  { id: 'one-good-story', hint: 'Survive one full run.', condition: (u) => u.survived >= 1 },
  { id: 'archivist', hint: 'Finish 3 runs, any ending.', condition: (u) => u.runsCompleted >= 3 },
];

export function isMandateUnlocked(id: string, meta: MetaProgress): boolean {
  const rule = MANDATE_UNLOCKS.find((r) => r.id === id);
  return !rule || rule.condition(computeUnlockStats(meta));
}

export function isShopItemUnlocked(id: string, meta: MetaProgress): boolean {
  const rule = SHOP_UNLOCKS.find((r) => r.id === id);
  return !rule || rule.condition(computeUnlockStats(meta));
}

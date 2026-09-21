import { describe, it, expect, beforeEach } from 'vitest';
import { createGame } from '../state';
import { checkEndings } from '../content/endings';
import {
  loadMetaProgress, saveMetaProgress, recordRun, isMandateUnlocked, isShopItemUnlocked,
  META_VERSION, type MetaProgress,
} from '../meta';
import type { GameState } from '../types';

/** A minimal in-memory localStorage, since vitest's default (node)
 *  environment has none — meta.ts's available() fails safe without it, so
 *  round-tripping load/save needs this to actually exercise that path. */
function installFakeLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
  return store;
}

function endedState(): GameState {
  // Push a run to day 18 with strong stats so it reaches the survival ending.
  const s = createGame({ seed: 1 });
  s.day = 18;
  const ending = checkEndings(s, true);
  s.ending = ending ?? undefined;
  return s;
}

describe('meta-progression (§4.5, step 1: record only, nothing gated)', () => {
  beforeEach(() => {
    installFakeLocalStorage();
  });

  it('loads an empty record when nothing has been saved yet', () => {
    const meta = loadMetaProgress();
    expect(meta.version).toBe(META_VERSION);
    expect(meta.runs).toEqual([]);
  });

  it('recordRun() appends a run and leaves the input untouched (pure)', () => {
    const meta: MetaProgress = { version: META_VERSION, runs: [] };
    const s = endedState();
    const next = recordRun(meta, s);
    expect(meta.runs).toEqual([]); // original unchanged
    expect(next.runs).toHaveLength(1);
    expect(next.runs[0]).toMatchObject({
      day: 18,
      mandateId: s.mandateId,
      endingId: s.ending!.id,
      leaderName: s.leaderName,
    });
  });

  it('recordRun() is a no-op on a state with no ending', () => {
    const meta: MetaProgress = { version: META_VERSION, runs: [] };
    const s = createGame({ seed: 2 }); // no ending set
    expect(recordRun(meta, s)).toBe(meta);
  });

  it('save then load round-trips through localStorage', () => {
    const s = endedState();
    const meta = recordRun(loadMetaProgress(), s);
    saveMetaProgress(meta);
    const reloaded = loadMetaProgress();
    expect(reloaded.runs).toHaveLength(1);
    expect(reloaded.runs[0].endingId).toBe(s.ending!.id);
  });

  it('caps history at 50 runs, dropping the oldest first', () => {
    let meta: MetaProgress = { version: META_VERSION, runs: [] };
    for (let i = 0; i < 55; i++) {
      const s = endedState();
      s.leaderName = `Leader ${i}`;
      meta = recordRun(meta, s);
    }
    expect(meta.runs).toHaveLength(50);
    expect(meta.runs[0].leaderName).toBe('Leader 5'); // the first 5 fell off
    expect(meta.runs[49].leaderName).toBe('Leader 54');
  });

  it('discards a corrupt or version-mismatched record rather than crashing', () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(
      'dictator-sandbox:legacy:v1', JSON.stringify({ version: META_VERSION - 1, runs: [] }),
    );
    expect(loadMetaProgress().runs).toEqual([]);

    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(
      'dictator-sandbox:legacy:v1', 'not json at all',
    );
    expect(loadMetaProgress().runs).toEqual([]);
  });

  it('nothing is gated yet — every mandate/shop item reads as unlocked regardless of history', () => {
    const empty: MetaProgress = { version: META_VERSION, runs: [] };
    expect(isMandateUnlocked('the-stairwell', empty)).toBe(true);
    expect(isShopItemUnlocked('fixer', empty)).toBe(true);
    expect(isMandateUnlocked('anything-at-all', empty)).toBe(true);
  });
});

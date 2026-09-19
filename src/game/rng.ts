import type { Rng } from './types';

/**
 * mulberry32 — small, fast, seedable, and its entire state is one uint32,
 * which means the RNG can live inside the save file and runs are replayable.
 */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (max) => Math.floor(next() * Math.max(1, max)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(arr, weight) {
      let total = 0;
      const ws = arr.map((t) => {
        const w = Math.max(0, weight(t));
        total += w;
        return w;
      });
      if (total <= 0) return undefined;
      let r = next() * total;
      for (let i = 0; i < arr.length; i++) {
        r -= ws[i];
        if (r <= 0) return arr[i];
      }
      return arr[arr.length - 1];
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    state: () => a >>> 0,
  };
  return rng;
}

export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

/** Deterministic string hash, used for content-stable ids. */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

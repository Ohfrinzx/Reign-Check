import { useEffect, useRef, useState } from 'react';

/**
 * A game clock for the real-time mini-games: milliseconds of PLAY, advanced
 * every animation frame while `running`. It stops while "Give up?" asks,
 * and a frame never adds more than 100 ms, so a phone that locks or a tab
 * in the background pauses the game instead of skipping ahead.
 * `?freeze` in the URL holds it still (at 0, or at `?freeze=<ms>`): the
 * browser checks take still, repeatable pictures of the game screens.
 */
const Q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
const FROZEN = !!Q?.has('freeze');
const FROZEN_AT = Number(Q?.get('freeze')) || 0;

export function useClock(running: boolean): number {
  const [now, setNow] = useState(FROZEN ? FROZEN_AT : 0);
  const acc = useRef(0);
  useEffect(() => {
    if (!running || FROZEN) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      acc.current += Math.max(0, Math.min(100, t - last));
      last = t;
      setNow(acc.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return now;
}

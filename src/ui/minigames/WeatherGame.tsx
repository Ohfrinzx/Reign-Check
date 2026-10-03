import { useEffect, useRef, useState } from 'react';
import type { WeatherSetup, WeatherState } from '../../game/minigames/weather';
import {
  FLIP, gustsComing, SAFE, STEP_MS, walked, weatherScore, weatherStart, weatherTick,
} from '../../game/minigames/weather';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * THE LAST KILOMETRE: WALK IN THE WEATHER — the walk. Rules in
 * game/minigames/weather.ts; this runs the clock and passes what is held.
 *
 * Look (owner, 2026-10-03: drop the 3D street; a new game for the act
 * opener): a flat, side-on view of a rainy avenue. Buildings, lamp posts and
 * a crowd under their own umbrellas scroll past as the Chair walks; rain
 * slants with the wind; leaves blow in from the side a gust is coming from;
 * the Chair holds a big black umbrella that tips with the wind, with a gauge
 * above it showing how far it can lean. Drizzle in act 1, wind in act 2, a
 * storm with lightning in act 3. Two big buttons: hold ◀ or ▶.
 */

export function WeatherGame({ setup, dryBonus, reduced, paused, onEnd }: {
  setup: WeatherSetup; dryBonus: number; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<WeatherState>(() => weatherStart(setup, dryBonus));
  const now = useClock(!paused && !st.over);
  const input = useRef<-1 | 0 | 1>(0);
  const [held, setHeld] = useState<-1 | 0 | 1>(0);
  const ended = useRef(false);

  const hold = (dir: -1 | 0 | 1) => { input.current = dir; setHeld(dir); };

  // advance the walk to the clock, with whatever is held right now
  useEffect(() => {
    if (st.over) return;
    const due = Math.floor(now / STEP_MS) * STEP_MS - st.t;
    if (due >= STEP_MS) setSt((s) => weatherTick(s, due, paused ? 0 : input.current));
  }, [now, st.t, st.over, paused]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    hold(0);
    const won = st.over === 'won';
    const t = window.setTimeout(() => onEnd({
      won,
      score: weatherScore(st),
      headline: won
        ? (st.soak < 15 ? 'You reached the steps bone dry.' : 'Damp, but on your feet and under the umbrella.')
        : 'Soaked through, short of the steps.',
      detail: `The umbrella turned inside out ${st.flips} time${st.flips === 1 ? '' : 's'}.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, onEnd, reduced]);

  // keys: ← and → while held
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); hold(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); hold(1); }
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' && input.current === -1) || (e.key === 'ArrowRight' && input.current === 1)) hold(0);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const sev = setup.d.severity;
  const coming = gustsComing(setup, st.t);
  const warn = coming.find((g) => g.at > st.t);
  const blowing = coming.find((g) => g.at <= st.t);
  const lean = Math.abs(st.angle);
  const zone = lean <= SAFE + st.dryBonus ? 'dry' : lean < FLIP * 0.8 ? 'wet' : 'danger';
  const flipped = st.last && st.t - st.last.at < 700;
  const progress = walked(st);
  // rain slants with the wind
  const slant = Math.max(-35, Math.min(35, (blowing ? blowing.dir * 22 : 0) + Math.sin(st.t / 1300) * 8));
  const lightning = sev >= 3 && !reduced && Math.floor(st.t / 2300) % 4 === 3 && st.t % 2300 < 140;

  const btn = (dir: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); hold(dir); },
    onPointerUp: () => { if (input.current === dir) hold(0); },
    onPointerCancel: () => { if (input.current === dir) hold(0); },
    onLostPointerCapture: () => { if (input.current === dir) hold(0); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className={`wx sev${Math.round(sev)}`}>
      <div className="wx-hud">
        <div className="wx-soak" aria-label={`Soaked ${Math.round(st.soak)} of 100`}>
          <span className="wx-drop" aria-hidden="true"><i style={{ height: `${st.soak}%` }} /></span>
          <span className="wx-soakbar"><i style={{ width: `${st.soak}%` }} /></span>
        </div>
        <div className="wx-route" aria-label={`${Math.round(progress * 1000)} of 1000 metres`}>
          <span className="wx-route-fill" style={{ width: `${progress * 100}%` }} />
          <span className="wx-steps" aria-hidden="true" />
        </div>
      </div>

      <div className={`wx-stage${lightning ? ' flash' : ''}${flipped ? ' soaked' : ''}`} data-clip>
        <div className="wx-sky" aria-hidden="true" />
        <div className="wx-palace" aria-hidden="true" style={{ transform: `translateX(-50%) scale(${0.55 + progress * 0.6})`, opacity: 0.35 + progress * 0.6 }} />
        <div className="wx-far" aria-hidden="true" style={{ backgroundPositionX: `${-st.t * 0.012}px` }} />
        <div className="wx-near" aria-hidden="true" style={{ backgroundPositionX: `${-st.t * 0.05}px` }} />
        <div className="wx-crowd" aria-hidden="true" style={{ backgroundPositionX: `${-st.t * 0.09}px` }} />
        <div className="wx-ground" aria-hidden="true" style={{ backgroundPositionX: `${-st.t * 0.12}px` }} />
        <div className="wx-rain" aria-hidden="true" style={{ ['--slant' as string]: `${slant}deg`, opacity: 0.45 + sev * 0.15 }} />

        {warn && (
          <div key={warn.at} className={`wx-leaves from-${warn.dir === 1 ? 'left' : 'right'}`} aria-hidden="true">
            <i /><i /><i /><i /><i />
          </div>
        )}

        {/* the dial: green while the umbrella keeps you dry, red where it flips */}
        <div className={`wx-gauge ${zone}`} aria-hidden="true" style={{ ['--safe' as string]: `${((SAFE + st.dryBonus) / FLIP) * 90}deg` }}>
          <span className="needle" style={{ transform: `rotate(${(st.angle / FLIP) * 90}deg)` }} />
        </div>

        <div className="wx-chair" aria-hidden="true">
          <div className="wx-umbrella" style={{ transform: `rotate(${st.angle}deg)` }}>
            <svg viewBox="0 0 120 120" className={flipped ? 'inside-out' : ''}>
              <path className="canopy" d="M8,52 Q60,-6 112,52 Q99,44 86,52 Q73,44 60,52 Q47,44 34,52 Q21,44 8,52 Z" />
              <path className="canopy-inv" d="M8,40 Q60,98 112,40 Q99,52 86,44 Q73,56 60,44 Q47,56 34,44 Q21,52 8,40 Z" />
              <line x1="60" y1="50" x2="60" y2="112" className="pole" />
              <path d="M60,112 Q60,119 54,119" className="pole" fill="none" />
            </svg>
          </div>
          <svg className="wx-body" viewBox="0 0 60 110">
            <circle cx="30" cy="16" r="10" fill="#e8b48a" />
            <path d="M16,32 Q30,24 44,32 L46,78 H14 Z" fill="#20232b" />
            <path d="M28,32 L30,44 L32,32 Z" fill="#cc2b1d" />
            <rect x="17" y="78" width="10" height="28" rx="3" fill="#20232b" className="leg l" />
            <rect x="33" y="78" width="10" height="28" rx="3" fill="#20232b" className="leg r" />
          </svg>
        </div>

        {flipped && <div className="wx-say" key={st.last!.at}>Inside out!</div>}
      </div>

      <div className="wx-controls">
        <button className={`btn wx-btn${held === -1 ? ' on' : ''}`} aria-label="Push left" {...btn(-1)}>◀</button>
        <span className={`wx-tilt ${zone}`} aria-live="polite">
          {zone === 'dry' ? 'Dry' : zone === 'wet' ? 'Getting wet' : 'Hold on!'}
        </span>
        <button className={`btn wx-btn${held === 1 ? ' on' : ''}`} aria-label="Push right" {...btn(1)}>▶</button>
      </div>
    </div>
  );
}

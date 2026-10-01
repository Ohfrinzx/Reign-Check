import { useEffect, useRef, useState } from 'react';
import type { ParadeAction, ParadeKind, ParadeSetup, ParadeState, Verdict } from '../../game/minigames/parade';
import { paradePress, paradeScore, paradeStart, paradeTick, WINDOW_MS } from '../../game/minigames/parade';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * THE LAST KILOMETRE — the walk. Rules in game/minigames/parade.ts; this runs
 * the clock and turns taps (or arrow keys) into moves.
 *
 * Look: a sunny avenue in perspective with Dovra Day bunting, the road
 * running away to a vanishing point. Things come down it, growing as they
 * near the gold line at your feet; each needs one move as it crosses. The
 * moves are three big picture buttons. Pictures, not words.
 */

const KEYS: Record<string, ParadeAction> = { ArrowLeft: 'duck', ArrowUp: 'wave', ArrowRight: 'stop' };
const SAY: Partial<Record<Verdict, string>> = {
  perfect: 'Perfect', good: 'Good', wrong: 'Wrong move', early: 'Too early', miss: 'Missed', flinched: 'Flinched',
};

function ItemArt({ kind }: { kind: ParadeKind }) {
  if (kind === 'egg') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="11" ry="14" fill="#fffaf0" stroke="#c9b48a" strokeWidth="2" /><ellipse cx="16" cy="17" rx="3" ry="5" fill="#fff" opacity=".8" /></svg>;
  }
  if (kind === 'flowers') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="27" r="6" fill="#f2c9a0" /><rect x="15" y="31" width="10" height="9" rx="3" fill="#2a6fd6" />
        <line x1="20" y1="21" x2="20" y2="10" stroke="#3d8a3a" strokeWidth="2" />
        <circle cx="16" cy="8" r="4" fill="#e3262f" /><circle cx="24" cy="8" r="4" fill="#f2b33d" /><circle cx="20" cy="5" r="4" fill="#d24fa0" />
      </svg>
    );
  }
  if (kind === 'cheer') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        {[8, 20, 32].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={i === 1 ? 16 : 19} r="5" fill={['#f2c9a0', '#c98e62', '#8d5a3b'][i]} />
            <rect x={x - 5} y={i === 1 ? 22 : 25} width="10" height="14" rx="3" fill={['#cc2b1d', '#15525c', '#c8890f'][i]} />
            <line x1={x - 4} y1={i === 1 ? 23 : 26} x2={x - 8} y2={i === 1 ? 10 : 13} stroke={['#f2c9a0', '#c98e62', '#8d5a3b'][i]} strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <line x1="20" y1="22" x2="20" y2="40" stroke="#6b4a2b" strokeWidth="3" />
      <rect x="4" y="4" width="32" height="20" rx="2" fill="#fff" stroke="#16130f" strokeWidth="2" />
      <line x1="9" y1="10" x2="31" y2="10" stroke="#cc2b1d" strokeWidth="3" />
      <line x1="9" y1="17" x2="25" y2="17" stroke="#16130f" strokeWidth="3" />
    </svg>
  );
}

const MOVE_ART: Record<ParadeAction, JSX.Element> = {
  duck: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 26 L6 14 h6 V5 h8 v9 h6 Z" fill="currentColor" /></svg>,
  wave: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 28c-3-2-6-7-6-10l2-1 4 4V6a2 2 0 0 1 4 0v9-11a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v12-7a2 2 0 0 1 4 0v10c0 6-4 9-9 9z" fill="currentColor" /></svg>,
  stop: <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="9" r="5" fill="currentColor" /><path d="M8 30v-9a8 8 0 0 1 16 0v9h-5v-7h-6v7z" fill="currentColor" /></svg>,
};

export function ParadeGame({ setup, composure, reduced, paused, onEnd }: {
  setup: ParadeSetup; composure: number; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<ParadeState>(() => paradeStart(setup, composure));
  const now = useClock(!paused && !st.over);
  const nowRef = useRef(0);
  nowRef.current = now;
  const ended = useRef(false);
  const [pressed, setPressed] = useState<ParadeAction | null>(null);

  useEffect(() => { setSt((s) => paradeTick(s, now)); }, [now]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const perfect = Object.values(st.judged).filter((v) => v === 'perfect').length;
    const t = window.setTimeout(() => onEnd({
      won,
      score: paradeScore(st),
      headline: won ? (st.composure === composure ? 'Not one slip, all the way.' : 'You made it to the end on foot.') : 'The security detail put you in the car.',
      detail: `${perfect} perfect moment${perfect === 1 ? '' : 's'} out of ${setup.items.length}.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, setup.items.length, composure, onEnd, reduced]);

  const press = (a: ParadeAction) => {
    if (paused || st.over) return;
    setPressed(a);
    window.setTimeout(() => setPressed((p) => (p === a ? null : p)), 140);
    setSt((s) => paradePress(s, a, nowRef.current));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = KEYS[e.key];
      if (!a || e.repeat) return;
      e.preventDefault();
      press(a);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const travel = setup.d.travelMs;
  const visible = setup.items.filter((x) => now >= x.t - travel && now <= x.t + 450);
  const last = st.last && now - st.last.at < 650 ? st.last : undefined;
  const walked = Math.min(1, now / setup.endMs);

  return (
    <div className="pd">
      <div className="pd-hud">
        <div className="pd-composure" aria-label={`Composure ${Math.max(0, st.composure)} of ${composure}`}>
          {Array.from({ length: composure }, (_, i) => <i key={i} className={`rosette${i < st.composure ? '' : ' lost'}`} />)}
        </div>
        <div className="pd-route" aria-label={`${Math.round(walked * 1000)} of 1000 metres`}>
          <span className="pd-route-fill" style={{ width: `${walked * 100}%` }} />
          <span className="pd-route-me" style={{ left: `${walked * 100}%` }} />
        </div>
      </div>

      <div className={`pd-street${last && ['wrong', 'miss', 'flinched', 'early'].includes(last.verdict) ? ' oops' : ''}`}>
        <div className="pd-sky" aria-hidden="true" />
        <div className="pd-bunting" aria-hidden="true" />
        <div className="pd-road" aria-hidden="true"><span className="pd-dash" style={{ animationPlayState: paused || st.over ? 'paused' : 'running' }} /></div>
        <div className="pd-line" aria-hidden="true" />
        {visible.map((it) => {
          const p = Math.max(0, Math.min(1.25, 1 - (it.t - now) / travel));
          const v = st.judged[it.id];
          return (
            <div
              key={it.id}
              className={`pd-item ${it.kind}${v ? ` done ${v}` : ''}`}
              style={{
                top: `${10 + p * 66}%`,
                transform: `translate(-50%, -50%) scale(${0.3 + p * 0.85})`,
                opacity: p < 0.08 ? p / 0.08 : 1,
              }}
              aria-hidden="true"
            >
              <ItemArt kind={it.kind} />
            </div>
          );
        })}
        {last && SAY[last.verdict] && (
          <div key={last.at} className={`pd-say ${last.verdict}`} aria-live="polite">{SAY[last.verdict]}</div>
        )}
        {/* the next item's cue, in case the picture is small on a phone */}
        <div className="pd-window" aria-hidden="true" style={{ height: `${(WINDOW_MS / travel) * 66 * 2}%` }} />
      </div>

      <div className="pd-moves">
        {(['duck', 'wave', 'stop'] as const).map((a) => (
          <button
            key={a}
            className={`btn pd-btn ${a}${pressed === a ? ' hit' : ''}`}
            // pointer-down for timing, and never a second press from the click
            // that follows a tap; the arrow keys (or Enter on a focused button) also work
            onPointerDown={(e) => { e.preventDefault(); press(a); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(a); } }}
            aria-label={a}
          >
            {MOVE_ART[a]}
            <span>{a}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ParadeAction, ParadeItem, ParadeKind, ParadeSetup, ParadeState, Verdict } from '../../game/minigames/parade';
import { paradePress, paradeScore, paradeStart, paradeTick, PERFECT_MS } from '../../game/minigames/parade';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * THE LAST KILOMETRE — the walk, seen through the Chair's eyes. Rules in
 * game/minigames/parade.ts; this runs the clock and turns taps (or arrow
 * keys) into moves.
 *
 * Look (owner, 2026-10-02: keep the idea, the first look "sucks"; chosen:
 * a polished first-person street): an illustrated avenue in perspective —
 * terracotta and cream facades with lit windows and flags on the balconies,
 * bunting strung across the street, an animated crowd behind the barriers,
 * cobbles that scroll as you walk. Things come out of the crowd: eggs are
 * thrown in an arc, a child steps out with flowers, cheering groups and
 * protest signs lean in from the sides. A ring around each one shrinks onto
 * it: when the ring closes, make the move. The Chair's own hands are at the
 * bottom of the screen and do the move. Pictures, not words.
 */

const KEYS: Record<string, ParadeAction> = { ArrowLeft: 'duck', ArrowUp: 'wave', ArrowRight: 'stop' };
const SAY: Partial<Record<Verdict, string>> = {
  perfect: 'Perfect', good: 'Good', wrong: 'Wrong move', early: 'Too early', miss: 'Missed', flinched: 'Flinched',
};

/* ------------------------------------------------------------ the street
 * Scene coordinates are 0..100 both ways (the SVG stretches to the box).
 * The horizon is at y = HZ; depth d runs 0 (far) .. 1 (at your feet).
 */
const HZ = 30;
const depthY = (d: number) => HZ + (100 - HZ) * d * d;
type Pt = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (p: Pt, q: Pt, t: number): Pt => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const pts = (ps: Pt[]) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

/** A facade as a quad: near-top, far-top, far-bottom, near-bottom. */
const LEFT: Pt[] = [[-30, -50], [41, 13], [41, HZ], [-30, 100]];
const RIGHT: Pt[] = LEFT.map(([x, y]) => [100 - x, y] as Pt);
/** a point on a facade: u 0 (near) .. 1 (far), v 0 (top) .. 1 (bottom) */
const onFacade = (q: Pt[], u: number, v: number): Pt => mix(mix(q[0], q[1], u), mix(q[3], q[2], u), v);
/** perspective: equal steps along the street get closer together with distance */
const persp = (k: number) => 1 - Math.pow(1 - k, 0.45);

const Facade = memo(function Facade({ q, tone, flip }: { q: Pt[]; tone: string; flip: boolean }) {
  const windows: JSX.Element[] = [];
  const cols = 9;
  for (let c = 0; c < cols; c++) {
    const u0 = persp(c / cols) * 0.97 + 0.02, u1 = persp((c + 0.55) / cols) * 0.97 + 0.02;
    for (let r = 0; r < 4; r++) {
      const v0 = 0.36 + r * 0.13, v1 = v0 + 0.07;
      const lit = (c * 7 + r * 3 + (flip ? 2 : 0)) % 5 === 0;
      windows.push(
        <polygon key={`w${c}-${r}`} className={`pd-win${lit ? ' lit' : ''}`}
          points={pts([onFacade(q, u0, v0), onFacade(q, u1, v0), onFacade(q, u1, v1), onFacade(q, u0, v1)])} />,
      );
      if (r === 1 && c % 3 === 1) {
        // a flag hanging from a balcony
        const top = onFacade(q, (u0 + u1) / 2, v0 - 0.02);
        const len = (onFacade(q, u0, v1)[1] - onFacade(q, u0, v0)[1]) * 1.3;
        const w = Math.abs(onFacade(q, u1, v0)[0] - onFacade(q, u0, v0)[0]) * 0.55;
        windows.push(
          <g key={`f${c}`} className="pd-flag">
            <rect x={top[0] - w / 2} y={top[1]} width={w} height={len} fill="#cc2b1d" />
            <rect x={top[0] - w / 2} y={top[1] + len * 0.38} width={w} height={len * 0.24} fill="#fff" />
          </g>,
        );
      }
    }
  }
  return (
    <g>
      <polygon className="pd-facade" style={{ fill: tone }} points={pts(q)} />
      {/* storefronts along the bottom */}
      {Array.from({ length: 6 }, (_, i) => {
        const u0 = persp(i / 6) * 0.96 + 0.02, u1 = persp((i + 0.7) / 6) * 0.96 + 0.02;
        return <polygon key={`s${i}`} className="pd-shop" points={pts([onFacade(q, u0, 0.86), onFacade(q, u1, 0.86), onFacade(q, u1, 0.99), onFacade(q, u0, 0.99)])} />;
      })}
      {/* the awning stripe */}
      <polygon className="pd-awning" points={pts([onFacade(q, 0, 0.8), onFacade(q, 1, 0.8), onFacade(q, 1, 0.85), onFacade(q, 0, 0.85)])} />
      {windows}
    </g>
  );
});

/** The crowd behind one barrier: heads and shoulders, bobbing. */
const Crowd = memo(function Crowd({ side }: { side: -1 | 1 }) {
  const people: JSX.Element[] = [];
  const skins = ['#f2c9a0', '#c98e62', '#8d5a3b', '#e8b48a', '#a46a43'];
  const coats = ['#15525c', '#cc2b1d', '#c8890f', '#2a6fd6', '#4a443a', '#7a3b8f'];
  for (let i = 0; i < 16; i++) {
    const d = 0.25 + (i / 16) * 0.78;
    const y = depthY(d);
    const edge = lerp(47, 6, d * d * 1.02); // the road's edge at this depth
    const x = side < 0 ? edge - 1.5 - d * 6 - (i % 2) * d * 4 : 100 - (edge - 1.5 - d * 6 - (i % 2) * d * 4);
    const s = 0.5 + d * 3.4;
    people.push(
      <g key={i} className={`pd-person b${i % 4}`} transform={`translate(${x} ${y - s * 1.1})`}>
        <ellipse cx="0" cy={s * 1.3} rx={s * 1.05} ry={s * 0.9} fill={coats[(i * 3 + (side > 0 ? 1 : 0)) % coats.length]} />
        <circle cx="0" cy="0" r={s * 0.62} fill={skins[(i + (side > 0 ? 2 : 0)) % skins.length]} />
        {i % 5 === 2 && <line x1={side * s * 0.8} y1={s * 0.6} x2={side * s * 1.4} y2={-s * 1.1} stroke={skins[i % skins.length]} strokeWidth={s * 0.35} strokeLinecap="round" className="pd-arm" />}
      </g>,
    );
  }
  return <g>{people}</g>;
});

function Street({ phase }: { phase: number }) {
  // road markings and bunting drift towards you as you walk (phase 0..1)
  const dashes = [0, 1, 2, 3, 4, 5].map((k) => {
    const d0 = ((k + phase) / 6), d1 = d0 + 0.07;
    const w0 = 0.25 + d0 * 1.6, w1 = 0.25 + d1 * 1.6;
    return <polygon key={k} className="pd-dash2" points={pts([[50 - w0 / 2, depthY(d0)], [50 + w0 / 2, depthY(d0)], [50 + w1 / 2, depthY(d1)], [50 - w1 / 2, depthY(d1)]])} />;
  });
  const bunting = [0, 1, 2].map((k) => {
    const d = ((k + phase) / 3) * 0.85 + 0.05;
    const s = d * d;
    const l = onFacade(LEFT, 1 - s, 0.42), r = onFacade(RIGHT, 1 - s, 0.42);
    const sag = 2 + d * 10;
    const flags: JSX.Element[] = [];
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const x = lerp(l[0], r[0], t), y = lerp(l[1], r[1], t) + Math.sin(Math.PI * t) * sag;
      const fw = 0.6 + d * 2.6;
      flags.push(<polygon key={i} points={pts([[x - fw / 2, y], [x + fw / 2, y], [x, y + fw * 1.5]])} fill={i % 2 ? '#cc2b1d' : '#fff'} />);
    }
    return (
      <g key={k} className="pd-bunt" style={{ opacity: Math.min(1, d * 3) }}>
        <path d={`M${l[0]},${l[1]} Q50,${(l[1] + r[1]) / 2 + sag * 2} ${r[0]},${r[1]}`} fill="none" stroke="#5c4237" strokeWidth={0.15 + d * 0.3} />
        {flags}
      </g>
    );
  });
  return (
    <svg className="pd-scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fb8e8" /><stop offset="1" stopColor="#d7eef9" /></linearGradient>
        <pattern id="pdCobble" width="4" height="2" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill="#a8977c" /><rect x=".2" y=".2" width="1.7" height="1.5" rx=".4" fill="#b9a88c" /><rect x="2.2" y=".2" width="1.6" height="1.5" rx=".4" fill="#b19f83" />
        </pattern>
      </defs>
      <rect width="100" height={HZ + 1} fill="url(#pdSky)" />
      <circle cx="78" cy="9" r="5" className="pd-sun" />
      <g className="pd-clouds"><ellipse cx="20" cy="8" rx="7" ry="2" /><ellipse cx="25" cy="7" rx="4" ry="2" /><ellipse cx="62" cy="14" rx="6" ry="1.6" /></g>
      {/* the far skyline: the Palace dome at the end of the avenue */}
      <path className="pd-skyline" d={`M38,${HZ} V22 H41 V18 H43 V22 H45 V16 Q50,9 55,16 V22 H57 V19 H59 V22 H62 V${HZ} Z`} />
      <rect x="49.6" y="8" width=".8" height="3" className="pd-skyline" />
      <polygon className="pd-road" points={pts([[47, HZ], [53, HZ], [94, 100], [6, 100]])} style={{ fill: 'url(#pdCobble)' }} />
      <polygon className="pd-walk" points={pts([[41, HZ], [47, HZ], [6, 100], [-30, 100]])} />
      <polygon className="pd-walk" points={pts([[53, HZ], [59, HZ], [130, 100], [94, 100]])} />
      {dashes}
      <Facade q={LEFT} tone="#c9643a" flip={false} />
      <Facade q={RIGHT} tone="#e9c98a" flip />
      {bunting}
      <Crowd side={-1} />
      <Crowd side={1} />
      {/* barriers along both kerbs */}
      <polyline className="pd-barrier" points={pts([[46.5, HZ + 2], [6.5, 98]])} />
      <polyline className="pd-barrier" points={pts([[53.5, HZ + 2], [93.5, 98]])} />
    </svg>
  );
}

/* ------------------------------------------------------- what comes at you */

function ItemArt({ kind }: { kind: ParadeKind }) {
  if (kind === 'egg') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="21" rx="10" ry="13" fill="#fffaf0" stroke="#c9b48a" strokeWidth="2" /><ellipse cx="16" cy="16" rx="3" ry="5" fill="#fff" /></svg>;
  }
  if (kind === 'flowers') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="22" r="6" fill="#f2c9a0" /><path d="M14,40 V31 Q20,27 26,31 V40 Z" fill="#2a6fd6" />
        <line x1="25" y1="26" x2="30" y2="12" stroke="#3d8a3a" strokeWidth="2" />
        <circle cx="27" cy="9" r="4" fill="#e3262f" /><circle cx="33" cy="10" r="4" fill="#f2b33d" /><circle cx="30" cy="5" r="4" fill="#d24fa0" />
        <circle cx="18" cy="21" r="1" fill="#2a1712" /><circle cx="22" cy="21" r="1" fill="#2a1712" />
      </svg>
    );
  }
  if (kind === 'cheer') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        {[8, 20, 32].map((x, i) => (
          <g key={x}>
            <line x1={x - 3} y1={i === 1 ? 21 : 24} x2={x - 7} y2={i === 1 ? 6 : 9} stroke={['#f2c9a0', '#c98e62', '#8d5a3b'][i]} strokeWidth="3" strokeLinecap="round" />
            <line x1={x + 3} y1={i === 1 ? 21 : 24} x2={x + 7} y2={i === 1 ? 6 : 9} stroke={['#f2c9a0', '#c98e62', '#8d5a3b'][i]} strokeWidth="3" strokeLinecap="round" />
            <circle cx={x} cy={i === 1 ? 16 : 19} r="5" fill={['#f2c9a0', '#c98e62', '#8d5a3b'][i]} />
            <rect x={x - 5} y={i === 1 ? 22 : 25} width="10" height="14" rx="3" fill={['#cc2b1d', '#15525c', '#c8890f'][i]} />
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <line x1="20" y1="22" x2="20" y2="40" stroke="#6b4a2b" strokeWidth="3" />
      <rect x="3" y="3" width="34" height="21" rx="2" fill="#fff" stroke="#16130f" strokeWidth="2" />
      <line x1="8" y1="10" x2="32" y2="10" stroke="#cc2b1d" strokeWidth="3.5" />
      <line x1="8" y1="17" x2="26" y2="17" stroke="#16130f" strokeWidth="3.5" />
    </svg>
  );
}

/** Where an item is when its progress is p (0 seen far away .. 1 at the moment). */
function itemPos(it: ParadeItem, idx: number, p: number): { x: number; y: number; s: number } {
  const side = idx % 2 ? 1 : -1;
  const q = Math.min(1.15, Math.max(0, p));
  const endX = 50 + side * (it.kind === 'egg' ? 4 : it.kind === 'flowers' ? 8 : 17);
  if (it.kind === 'egg') {
    // thrown from the crowd in an arc
    const x = lerp(50 + side * 30, endX, q);
    const y = lerp(44, 66, q) - Math.sin(Math.PI * Math.min(1, q)) * 22;
    return { x, y, s: 0.35 + q * 0.75 };
  }
  // people come out of the crowd and walk up to you
  const d = 0.35 + q * 0.5;
  return { x: lerp(50 + side * 22, endX, q), y: depthY(d) - 6, s: 0.3 + q * 0.9 };
}

/** One hand in a suit sleeve, palm facing the street (drawn as a right hand). */
function HandArt() {
  const skin = '#e8b48a', line = '#b9825a';
  return (
    <svg viewBox="0 0 60 96" aria-hidden="true">
      <path d="M12,96 L17,58 Q18,52 24,52 H38 Q44,52 45,58 L50,96 Z" fill="#20232b" />
      <rect x="17" y="50" width="28" height="7" rx="2" fill="#f4f1ea" />
      {/* fingers */}
      {[19, 25, 31, 37].map((x, k) => (
        <rect key={x} x={x} y={[12, 6, 7, 13][k]} width="6" height={[24, 30, 29, 22][k]} rx="3" fill={skin} stroke={line} strokeWidth=".8" />
      ))}
      {/* palm and thumb */}
      <path d="M18,30 H44 V44 Q44,52 36,52 H26 Q18,52 18,44 Z" fill={skin} stroke={line} strokeWidth=".8" />
      <rect x="8" y="28" width="7" height="20" rx="3.5" fill={skin} stroke={line} strokeWidth=".8" transform="rotate(-32 14 44)" />
    </svg>
  );
}

/** The Chair's hands, doing the last move. */
function Hands({ pose }: { pose: ParadeAction | 'idle' }) {
  return (
    <div className={`pd-hands ${pose}`} aria-hidden="true">
      <span className="pd-hand l"><HandArt /></span>
      <span className="pd-hand r"><HandArt /></span>
    </div>
  );
}

const MOVE_ART: Record<ParadeAction, JSX.Element> = {
  duck: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 L6 15 h6 V5 h8 v10 h6 Z" fill="currentColor" /></svg>,
  wave: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 28c-3-2-6-7-6-10l2-1 4 4V6a2 2 0 0 1 4 0v9-11a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v12-7a2 2 0 0 1 4 0v10c0 6-4 9-9 9z" fill="currentColor" /></svg>,
  stop: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 17V9a2 2 0 0 1 4 0v6V6a2 2 0 0 1 4 0v9V7a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v10c0 6-4 9-8 9-3 0-5-1-7-4l-3-5c-1-2 1-3 2-2z" fill="currentColor" /></svg>,
};

export function ParadeGame({ setup, composure, reduced, paused, onEnd }: {
  setup: ParadeSetup; composure: number; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<ParadeState>(() => paradeStart(setup, composure));
  const now = useClock(!paused && !st.over);
  const nowRef = useRef(0);
  nowRef.current = now;
  const ended = useRef(false);
  const [pose, setPose] = useState<{ a: ParadeAction; at: number } | null>(null);
  const index = useMemo(() => Object.fromEntries(setup.items.map((x, i) => [x.id, i])), [setup.items]);

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
    setPose({ a, at: nowRef.current });
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
  const visible = setup.items.filter((x) => now >= x.t - travel && now <= x.t + 420);
  const last = st.last && now - st.last.at < 650 ? st.last : undefined;
  const hurt = last && ['wrong', 'miss', 'flinched', 'early'].includes(last.verdict);
  const splat = last && last.id && setup.items[index[last.id]]?.kind === 'egg' && (last.verdict === 'miss' || last.verdict === 'wrong');
  const walked = Math.min(1, now / setup.endMs);
  const handPose = pose && now - pose.at < 380 ? pose.a : 'idle';

  return (
    <div className="pd">
      <div className={`pd-street${hurt ? ' oops' : ''}${handPose === 'duck' ? ' ducking' : ''}`}>
        <div className="pd-world" style={{ ['--walk' as string]: walked }}>
          <Street phase={reduced ? 0 : (now / 2600) % 1} />
        </div>

        <div className="pd-hud">
          <div className="pd-composure" aria-label={`Composure ${Math.max(0, st.composure)} of ${composure}`}>
            {Array.from({ length: composure }, (_, i) => <i key={i} className={`rosette${i < st.composure ? '' : ' lost'}`} />)}
          </div>
          <div className="pd-route" aria-label={`${Math.round(walked * 1000)} of 1000 metres`}>
            <span className="pd-route-fill" style={{ width: `${walked * 100}%` }} />
            <span className="pd-route-me" style={{ left: `${walked * 100}%` }} />
            <span className="pd-route-end" aria-hidden="true">★</span>
          </div>
        </div>

        {visible.map((it) => {
          const p = 1 - (it.t - now) / travel;
          const pos = itemPos(it, index[it.id], p);
          const v = st.judged[it.id];
          // the ring closes onto the item at the moment to act
          const ring = Math.max(1, 1 + (it.t - now) / travel * 1.6);
          const inWindow = Math.abs(it.t - now) <= PERFECT_MS;
          return (
            <div
              key={it.id}
              className={`pd-item ${it.kind}${v ? ` done ${v}` : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-50%, -50%) scale(${pos.s})`, opacity: p < 0.06 ? p / 0.06 : 1 }}
              aria-hidden="true"
            >
              <ItemArt kind={it.kind} />
              {!v && it.kind !== 'sign' && <span className={`pd-ring${inWindow ? ' now' : ''}`} style={{ transform: `translate(-50%, -50%) scale(${ring})` }} />}
              {!v && it.kind === 'sign' && <span className="pd-ring sign" style={{ transform: `translate(-50%, -50%) scale(${ring})` }} />}
            </div>
          );
        })}

        {splat && <div key={`splat${last!.at}`} className="pd-splat" aria-hidden="true" />}
        {last && SAY[last.verdict] && (
          <div key={last.at} className={`pd-say ${last.verdict}`} aria-live="polite">{SAY[last.verdict]}</div>
        )}

        <Hands pose={handPose} />
      </div>

      <div className="pd-moves">
        {(['duck', 'wave', 'stop'] as const).map((a) => (
          <button
            key={a}
            className={`btn pd-btn ${a}${handPose === a ? ' hit' : ''}`}
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

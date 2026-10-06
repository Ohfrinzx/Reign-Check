import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Cloud, Hawk, PigeonSetup, PigeonState } from '../../game/minigames/pigeon';
import {
  BASE, GRACE_MS, feathersLeft, flown, groundAt, hawkPhase, hawkPos, isSafe, lockTime, pigeonScore, pigeonStart,
  pigeonTick, pigeonX, STEP_MS,
} from '../../game/minigames/pigeon';
import { useMedia } from '../useMedia';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * THE PIGEON RUN — the flight. Rules in game/minigames/pigeon.ts; this runs
 * the clock and passes whether the player is holding.
 *
 * Look (owner, 2026-10-06: daylight): a bright sky over the green Hadem
 * hills, drawn as one SVG in world units (100 tall; as wide as the stage
 * is, so nothing is ever stretched). Far ridges, drifting white clouds and
 * village hills slide past slower than the hills you fly over (parallax).
 * The racing pigeon carries a red message tube on its leg; its wings beat
 * hard while you hold and spread into a glide when you let go, and it
 * tips nose-up or nose-down with its climb. Drovnan hawks circle ahead,
 * show their dive as a red dashed line with a target on the pigeon's
 * path, then stoop. Storm clouds are dark and flicker with lightning. The
 * garrison's fort and flag come into view at the end. Hold anywhere (the
 * whole game area, with pointer capture) or hold Space / ↑ / W.
 *
 * Reduce Motion: the whole flight runs at 2/3 speed (×1.5 time, easier to
 * react), the far layers move less, and nothing shakes or flashes.
 */

/** A mouse or trackpad is attached: show the keys. */
const FINE_POINTER = '(any-pointer: fine)';
/** where the pigeon sits across the stage (share of its width) */
const PIGEON_AT = 0.22;
const HOLD_KEYS = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W']);
/** the garrison's fort: this far past the finish; its pigeon loft at this height */
const FORT_DX = 34;
const LOFT_Y = BASE - 24 - 31;

/* ------------------------------------------------------------ drawings */

/** The racing pigeon, facing right, about 20 × 10 world units. */
function PigeonBird({ climbing }: { climbing: boolean }) {
  return (
    <g className={`pg-bird${climbing ? ' flap' : ' glide'}`}>
      <g className="pg-wing far"><path d="M-1,-1.2 C-3,-6 -7,-9.5 -11,-9.8 C-8.5,-7 -6.5,-4 -4,-1.2 Z" /></g>
      <path className="pg-tail" d="M-6.5,-0.6 L-11.6,-2 L-12,0.6 L-11.4,2.2 L-6.5,1.2 Z" />
      <path className="pg-tail-band" d="M-11,-1.85 L-12,0.6 L-11.4,2.2 L-10.6,2 L-11.1,0.5 L-10.2,-1.6 Z" />
      <ellipse className="pg-body" cx="-1" cy="0.4" rx="6.6" ry="3.3" />
      <path className="pg-neck" d="M2.6,-1.9 C4,-2.6 5.6,-2 6.2,-0.4 C6,1.2 4.6,2.6 3,2.8 C3.6,1 3.4,-0.4 2.6,-1.9 Z" />
      <circle className="pg-head" cx="5.9" cy="-1.9" r="2.25" />
      <path className="pg-beak" d="M7.9,-2.1 L10,-1.4 L7.9,-0.9 Z" />
      <circle className="pg-cere" cx="7.7" cy="-2.15" r="0.45" />
      <circle className="pg-eye" cx="6.5" cy="-2.3" r="0.62" />
      <circle className="pg-pupil" cx="6.62" cy="-2.32" r="0.28" />
      <g className="pg-leg"><path d="M-0.6,3.3 L-1.6,4.6" /><rect className="pg-tube" x="-2.9" y="3.9" width="2.6" height="1.25" rx="0.6" /></g>
      <g className="pg-wing near">
        <path d="M0.8,-0.6 C-1,-6.6 -5.5,-10.6 -11.5,-11 C-9.2,-8.2 -7.2,-5 -5.2,-0.4 C-3,0.6 -0.6,0.6 0.8,-0.6 Z" />
        <path className="pg-bars" d="M-4.2,-2.4 L-6.6,-6.2 M-2.6,-2.1 L-4.6,-5.6" />
      </g>
    </g>
  );
}

/** A Drovnan hawk, facing left: broad fingered wings while it circles, folded back when it dives. */
function HawkBird({ diving }: { diving: boolean }) {
  return (
    <g className={`pg-hawk-bird${diving ? ' dive' : ''}`}>
      <g className="pg-hwing far">
        <path d="M-2.6,-1.4 C-3.6,-5 -3.2,-9 -1.2,-12.6 L0.2,-14 L0.9,-12.5 L2.3,-13.6 L2.6,-11.9 L4.1,-12.4 C3.5,-8.2 2.5,-4.6 1,-1.1 Z" />
      </g>
      <path className="pg-htail" d="M5.4,-1.1 L11.6,-2.9 L12.3,0.2 L11.6,3.1 L5.4,1.5 Z" />
      <path className="pg-htail-band" d="M9.6,-2.3 L10.2,2.5 M11,-2.7 L11.6,2.9" />
      <ellipse className="pg-hbody" cx="0.9" cy="0.2" rx="5.8" ry="2.7" />
      <path className="pg-hbelly" d="M-3.8,1 C-1,3 2.6,3 5.2,1.4 C2.6,2.1 -1,2.1 -3.8,1 Z" />
      <circle className="pg-hhead" cx="-4.7" cy="-0.7" r="2.05" />
      <path className="pg-hbrow" d="M-6.2,-1.9 C-5.2,-2.5 -4,-2.3 -3.2,-1.6" />
      <path className="pg-hbeak" d="M-6.5,-1.2 L-8.2,-0.4 L-7.2,0.3 L-6.3,0.1 Z" />
      <circle className="pg-heye" cx="-5.2" cy="-1.15" r="0.5" />
      <g className="pg-hwing near">
        <path d="M-1,-1.4 C-1.6,-5 -0.2,-9.6 2.8,-13 L4.4,-14.8 L5.3,-13.2 L6.7,-14.5 L7.2,-12.7 L8.8,-13.5 L8.6,-11.5 L10.2,-11.7 C9.2,-7.6 7.2,-3.6 4.3,-0.2 C2.6,0.6 0.5,0.4 -1,-1.4 Z" />
        <path className="pg-hbars" d="M2.4,-4 C3.6,-3.4 5,-3.4 6.2,-4.2 M3.2,-7.4 C4.6,-6.8 6,-6.8 7.4,-7.6" />
      </g>
    </g>
  );
}

/** A steady pseudo-random number in 0..1 for drawing (never used by the rules). */
const wobble = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * A storm cloud: one billowy shape (a body and bumps along every open edge,
 * never more than a unit or two outside what counts as a hit), filled by a
 * single gradient so it reads as one cloud: light on top, dark underneath,
 * a dark rim, lighter billows inside, and lightning that lights it up.
 */
function StormCloud({ c, i, uid }: { c: Cloud; i: number; uid: string }) {
  const id = `${uid}c${i}`;
  const top = Math.max(c.top, -10);
  const bot = Math.min(c.bot, 110);
  const puffs: { x: number; y: number; r: number; edge: 'b' | 't' | 's' }[] = [];
  const row = (y: number, dir: 1 | -1, edge: 'b' | 't') => {
    const n = Math.max(2, Math.round((c.x1 - c.x0) / 8));
    for (let k = 0; k <= n; k++) {
      const r = 4.4 + wobble(i, k + (dir > 0 ? 0 : 40)) * 2.6;
      const x = c.x0 + ((c.x1 - c.x0) * k) / n + (k > 0 && k < n ? (wobble(i, k + 80) - 0.5) * 2.4 : 0);
      // the bump's edge sits about a unit outside the hit box
      puffs.push({ x, y: y + dir * (1 - r), r, edge });
    }
  };
  const side = (x: number, dir: 1 | -1) => {
    const y0 = c.kind === 'high' ? top : top + 4;
    const y1 = c.kind === 'low' ? bot : bot - 4;
    const n = Math.max(1, Math.round((y1 - y0) / 8));
    for (let k = 0; k <= n; k++) {
      const r = 4.2 + wobble(i + 7, k + (dir > 0 ? 0 : 30)) * 1.8;
      puffs.push({ x: x + dir * (1 - r), y: y0 + ((y1 - y0) * k) / n, r, edge: 's' });
    }
  };
  if (c.kind !== 'low') row(c.bot, 1, 'b');
  if (c.kind !== 'high') row(c.top, -1, 't');
  side(c.x0, -1);
  side(c.x1, 1);
  const by0 = c.kind === 'high' ? top : c.top + 2.5;
  const by1 = c.kind === 'low' ? bot : c.bot - 2.5;
  const box = { x: c.x0 - 8, y: top - 8, w: c.x1 - c.x0 + 16, h: bot - top + 16 };
  // lightning: one bolt, two on a long cloud
  const bolts: string[] = [];
  const nb = c.x1 - c.x0 > 90 ? 2 : 1;
  for (let b = 0; b < nb; b++) {
    const lx = c.x0 + (c.x1 - c.x0) * ((b + 0.3 + wobble(i, b + 99) * 0.4) / nb);
    const ly = Math.max(top + 4, c.kind === 'low' ? c.top + 14 : c.bot - 15);
    bolts.push(`M${lx.toFixed(1)},${ly.toFixed(1)} l2.6,4.4 l-2.2,0.7 l3.2,5.6 l-1.2,-4.2 l2,-0.6 l-2.4,-4.6 Z`);
  }
  const clip = `url(#${id})`;
  return (
    <g className={`pg-storm ${c.kind}`} style={{ ['--d' as string]: `${((i * 0.83) % 3.1).toFixed(2)}s` }}>
      <defs>
        <clipPath id={id}>
          <rect x={c.x0 + 2.5} y={by0} width={Math.max(0, c.x1 - c.x0 - 5)} height={Math.max(0, by1 - by0)} />
          {puffs.map((p, k) => <circle key={k} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={p.r.toFixed(2)} />)}
        </clipPath>
      </defs>
      <g transform="translate(0.7 0.9)">
        <rect className="pg-storm-rim" x={box.x} y={box.y} width={box.w} height={box.h} clipPath={clip} />
      </g>
      <rect className="pg-storm-fill" x={box.x} y={box.y} width={box.w} height={box.h} clipPath={clip} />
      <g className="pg-storm-billows" clipPath={clip}>
        {puffs.filter((p) => p.edge !== 's').map((p, k) => (
          <circle key={k} cx={(p.x - 0.6).toFixed(2)} cy={(p.y + (p.edge === 'b' ? -0.8 : 0.6)).toFixed(2)} r={(p.r * 1.05).toFixed(2)} />
        ))}
      </g>
      <rect className="pg-storm-flash" x={box.x} y={box.y} width={box.w} height={box.h} clipPath={clip} />
      {bolts.map((d, k) => <path key={k} className="pg-bolt" d={d} style={{ animationDelay: `calc(var(--d) + ${k * 0.9}s)` }} />)}
    </g>
  );
}

/** Rolling ridges for a background layer: a closed path `span` wide. */
function ridgePath(seed: number, span: number, base: number, amp: number, wave: number): string {
  const a = (seed % 97) / 15;
  const b = (seed % 89) / 11;
  let d = `M-20,110 L-20,${base}`;
  for (let x = -20; x <= span + 20; x += 5) {
    const y = base - amp * (0.55 * Math.sin(x / wave + a) + 0.3 * Math.sin(x / (wave * 0.43) + b) + 0.15 * Math.sin(x / (wave * 0.19)));
    d += ` L${x},${y.toFixed(1)}`;
  }
  return `${d} L${span + 20},110 Z`;
}

/** The world that does not move by itself: hills, storm clouds, the garrison. Drawn once. */
const World = memo(function World({ setup }: { setup: PigeonSetup }) {
  const { length } = setup;
  // (far enough past the garrison to fill the widest screen at the finish)
  const far = length + 420;
  let terrain = `M-60,112 L-60,${BASE}`;
  for (let x = -60; x <= far; x += 2.5) terrain += ` L${x},${groundAt(setup, x).toFixed(2)}`;
  terrain += ` L${far},112 Z`;
  // the garrison's own hill, past the finish (it can't be hit)
  const gx = length + FORT_DX;
  let fortHill = `M${gx - 70},112`;
  for (let x = gx - 70; x <= gx + 70; x += 4) fortHill += ` L${x},${(BASE - 24 * (1 + Math.cos((Math.PI * (x - gx)) / 70)) / 2).toFixed(2)}`;
  fortHill += ` L${gx + 70},112 Z`;
  // bushes on the hillsides (always inside the hill, below its edge)
  const bushes: JSX.Element[] = [];
  for (let x = 4, k = 0; x < far; x += 9 + wobble(k, 3) * 9, k++) {
    const g = groundAt(setup, x);
    if (g > BASE - 9) continue;
    const rx = 1.6 + wobble(k, 5) * 1.3;
    bushes.push(<ellipse key={k} cx={x.toFixed(1)} cy={(g + 4 + wobble(k, 7) * (BASE - g - 6)).toFixed(1)} rx={rx.toFixed(2)} ry={(rx * 0.62).toFixed(2)} />);
  }
  // pines along the valley floor, in front
  const pines: JSX.Element[] = [];
  for (let x = 6, k = 0; x < far; x += 11 + ((k * 13) % 9), k++) {
    const h = 3.4 + ((k * 7) % 5) * 0.5;
    const g = Math.max(groundAt(setup, x), BASE - 1);
    if (g < BASE - 0.5) continue;
    pines.push(<path key={k} d={`M${x},${g + 4.5 - h * 1.6} l${h * 0.55},${h * 1.6} h${-h * 1.1} Z`} />);
  }
  return (
    <g>
      {setup.clouds.map((c, i) => <StormCloud key={i} c={c} i={i} uid={`pg${setup.seed}`} />)}
      <path className="pg-fort-hill" d={fortHill} />
      <path className="pg-terrain" d={terrain} />
      <g className="pg-bushes">{bushes}</g>
      <path className="pg-terrain-light" d={terrain} transform="translate(0 1.4)" />
      <path className="pg-terrain-edge" d={terrain} />
      <g className="pg-pines">{pines}</g>
      <g className="pg-fort" transform={`translate(${gx} ${BASE - 24})`}>
        <rect className="pg-wall" x="-15" y="-13" width="30" height="14" />
        <path className="pg-wall-top" d="M-16,-13 v-2.6 h3.2 v1.6 h3.2 v-1.6 h3.2 v1.6 h3.2 v-1.6 h3.2 v1.6 h3.2 v-1.6 h3.2 v1.6 h3.2 v-1.6 h3.2 v2.6 Z" />
        <rect className="pg-wall dark" x="-5" y="-27" width="10" height="16" />
        <path className="pg-wall-top" d="M-6,-27 v-2.4 h2.4 v1.4 h2.4 v-1.4 h2.4 v1.4 h2.4 v-1.4 h2.4 v2.4 Z" />
        <path className="pg-loft" d="M-3.4,-29.4 L0,-33 L3.4,-29.4 Z" />
        <rect className="pg-door" x="-2.6" y="-6" width="5.2" height="7" rx="2.6" />
        <rect className="pg-slit" x="-1" y="-22" width="2" height="4" rx="1" />
        <line className="pg-pole" x1="0" y1="-33" x2="0" y2="-48" />
        <g transform="translate(0 -48)">
          <g className="pg-flag">
            <path className="pg-flag-red" d="M0,0 C3,-0.8 6,0.8 11,0 V6.6 C6,7.4 3,5.8 0,6.6 Z" />
            <path className="pg-flag-band" d="M0,0 C1,-0.27 2,-0.4 3,-0.4 V6.2 C2,6.2 1,6.33 0,6.6 Z" />
            <circle className="pg-flag-star" cx="7" cy="3.3" r="1.1" />
          </g>
        </g>
      </g>
    </g>
  );
});

/* --------------------------------------------------------------- the game */

interface Puff { key: string; x: number; y: number; kind: string }

export function PigeonGame({ setup, reduced, paused, onEnd }: {
  setup: PigeonSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<PigeonState>(() => pigeonStart(setup));
  const now = useClock(!paused && !st.over);
  // Reduce Motion: the flight runs at 2/3 speed (×1.5 time)
  const gameNow = reduced ? now / 1.5 : now;
  const input = useRef(false);
  const pointers = useRef(new Set<number>());
  const keys = useRef(new Set<string>());
  const [held, setHeld] = useState(false);
  const [everHeld, setEverHeld] = useState(false);
  const ended = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.8);
  const fine = useMedia(FINE_POINTER);

  const sync = () => {
    const h = pointers.current.size > 0 || keys.current.size > 0;
    input.current = h;
    setHeld(h);
    if (h) setEverHeld(true);
  };

  // the stage's shape sets how much sky is shown (never stretched)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setAspect(r.width / r.height); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // advance the flight to the clock, with whatever is held right now (the
  // target time is worked out inside the update, so running it twice is harmless)
  useEffect(() => {
    if (st.over) return;
    const to = Math.floor(gameNow / STEP_MS) * STEP_MS;
    if (to - st.t >= STEP_MS) setSt((s) => (to - s.t >= STEP_MS ? pigeonTick(s, to - s.t, paused ? false : input.current) : s));
  }, [gameNow, st.t, st.over, paused]);

  // keys: Space, ↑ or W, held
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!HOLD_KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      if ((e.target as HTMLElement)?.closest?.('button') && e.key === ' ') (e.target as HTMLElement).blur();
      if (!keys.current.has(e.key.toLowerCase())) { keys.current.add(e.key.toLowerCase()); sync(); }
    };
    const up = (e: KeyboardEvent) => {
      if (!HOLD_KEYS.has(e.key)) return;
      e.preventDefault();
      keys.current.delete(e.key.toLowerCase());
      sync();
    };
    const drop = () => { keys.current.clear(); pointers.current.clear(); sync(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', drop);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', drop);
    };
  }, []);

  // the end: a landing at the fort, or a fall
  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    keys.current.clear();
    pointers.current.clear();
    sync();
    const won = st.over === 'won';
    const kinds = ([['hawk', 'hawk'], ['cloud', 'storm cloud'], ['hill', 'hill']] as const)
      .filter(([k]) => st.by[k] > 0)
      .map(([k, name]) => `${st.by[k]} ${name}${st.by[k] === 1 ? '' : 's'}`);
    const t = window.setTimeout(() => onEnd({
      won,
      score: pigeonScore(st),
      headline: won
        ? (st.hits === 0 ? 'Not a feather out of place.' : 'Ruffled, but the order got through.')
        : 'The pigeon went down short of the garrison.',
      detail: won
        ? (st.hits === 0
          ? `The order reached the garrison. ${st.dodged} hawk${st.dodged === 1 ? '' : 's'} dived and missed.`
          : `It lost ${st.hits} feather${st.hits === 1 ? '' : 's'} on the way (${kinds.join(', ')}).`)
        : `It made it ${Math.round(flown(st) * 100)}% of the way. Hit by: ${kinds.join(', ')}.`,
    }), reduced ? 400 : 1200);
    return () => window.clearTimeout(t);
  }, [st, onEnd, reduced]);

  // feather puffs where the pigeon was hit (they stay in the sky and drift past)
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const lastHit = st.last?.at;
  useEffect(() => {
    if (lastHit === undefined || !st.last) return;
    const p: Puff = { key: `h${lastHit}`, x: pigeonX(setup, lastHit), y: st.last.y, kind: st.last.kind };
    setPuffs((ps) => [...ps.slice(-3), p]);
    const t = window.setTimeout(() => setPuffs((ps) => ps.filter((x) => x !== p)), 1100);
    return () => window.clearTimeout(t);
  }, [lastHit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- where everything is, this frame ---- */
  const VW = 100 * aspect;
  const PX = Math.max(18, VW * PIGEON_AT);
  // between two steps, move the pigeon on smoothly (it is never more than one step ahead)
  const ahead = st.over ? 0 : Math.max(0, Math.min(STEP_MS * 2, gameNow - st.t)) / 1000;
  const renderT = st.t + ahead * 1000;
  const camX = pigeonX(setup, renderT);
  const y = Math.max(0, st.y + st.vy * ahead);
  const tilt = Math.max(-28, Math.min(30, st.vy * 0.5));
  const safe = isSafe(st) && st.t >= GRACE_MS;
  const flying = !st.over;
  const climbing = flying && held;
  const progress = flown(st);
  const hitNow = st.last && st.t - st.last.at < 380;
  const span = VW + setup.length * 0.5 + 60;
  const backdrop = useMemo(() => ({
    far: ridgePath(setup.seed, span, 70, 10, 34),
    mid: ridgePath(setup.seed * 7 + 3, span, 82, 8, 21),
  }), [setup.seed, span]);
  const houses = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let x = 30, k = 0; x < span; x += 41 + ((k * 17) % 29), k++) {
      out.push(
        <g key={k} transform={`translate(${x} ${80.5 + ((k * 5) % 3)})`}>
          <rect className="wall" x="-1.7" y="-2.3" width="3.4" height="2.6" />
          <path className="roof" d="M-2.3,-2.2 L0,-4.1 L2.3,-2.2 Z" />
        </g>,
      );
    }
    return out;
  }, [span]);
  const drift = gameNow * 0.0012;
  // parallax: the far layers slide slower; gentler still with Reduce Motion
  const k = reduced ? 0.5 : 1;

  const end = st.over === 'won' ? 'won' : st.over === 'lost' ? 'lost' : '';
  const hawks = setup.hawks.map((h, i) => ({ h, i, phase: hawkPhase(setup, h, renderT) }))
    .filter((x) => x.phase !== 'off' && x.phase !== 'gone');

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.add(e.pointerId);
    sync();
  };
  const onUp = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;
    sync();
  };

  return (
    <div
      className={`pg${held ? ' held' : ''}`}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pg-hud">
        <div className="pg-feathers" aria-label={`${feathersLeft(st)} of ${setup.d.feathers} feathers left`}>
          {Array.from({ length: setup.d.feathers }, (_, i) => (
            <svg key={i} viewBox="0 0 12 24" className={`pg-feather${i >= feathersLeft(st) ? ' lost' : ''}`} aria-hidden="true">
              <path d="M6,1 C10,5 10.5,13 7,20 L6,23 L5,20 C1.5,13 2,5 6,1 Z" />
              <path className="quill" d="M6,3 L6,23" />
            </svg>
          ))}
        </div>
        <div className="pg-route" aria-label={`${Math.round(progress * 100)}% of the way to the garrison`}>
          <span className="pg-route-line" />
          <span className="pg-route-fill" style={{ width: `${progress * 100}%` }} />
          <span className="pg-route-bird" style={{ left: `${progress * 100}%` }} />
          <span className="pg-route-flag" aria-hidden="true" />
        </div>
      </div>

      <div
        ref={stageRef}
        className={`pg-stage${hitNow ? ' hit' : ''}${end ? ` over-${end}` : ''}`}
        data-clip
        data-t={st.t}
        data-y={st.y.toFixed(2)}
        data-vy={st.vy.toFixed(2)}
        data-held={held ? 1 : 0}
        data-hits={st.hits}
        data-feathers={feathersLeft(st)}
        data-over={st.over ?? ''}
      >
        <svg className="pg-svg" viewBox={`0 0 ${VW.toFixed(2)} 100`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="pgSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3f9be6" />
              <stop offset="0.55" stopColor="#8fcaf2" />
              <stop offset="0.85" stopColor="#d9f0fb" />
            </linearGradient>
            <radialGradient id="pgSun">
              <stop offset="0" stopColor="#fffbe0" />
              <stop offset="0.35" stopColor="#ffe9a3" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pgStorm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#808a9b" />
              <stop offset="0.55" stopColor="#5b6374" />
              <stop offset="1" stopColor="#353b48" />
            </linearGradient>
            <radialGradient id="pgBillow" cx="0.42" cy="0.36" r="0.6">
              <stop offset="0" stopColor="#c3cad6" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#a7afbd" stopOpacity="0.18" />
              <stop offset="1" stopColor="#a7afbd" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pgGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cc456" />
              <stop offset="0.5" stopColor="#5aa443" />
              <stop offset="1" stopColor="#3f8236" />
            </linearGradient>
          </defs>
          <rect className="pg-sky" x="0" y="-10" width={VW} height="120" fill="url(#pgSky)" />
          <circle cx={VW - 22} cy="16" r="20" fill="url(#pgSun)" />
          <circle className="pg-sun" cx={VW - 22} cy="16" r="6" />

          <g transform={`translate(${(-camX * 0.12 * k).toFixed(2)} 0)`}>
            <path className="pg-far" d={backdrop.far} />
          </g>
          <g className="pg-fluff" transform={`translate(${(-(camX * 0.22 + drift * 4) * k % 240 + 0).toFixed(2)} 0)`}>
            {[0, 240, 480].map((o) => (
              <g key={o} transform={`translate(${o} 0)`}>
                <path d="M14,24 a5,5 0 0 1 8,-4 a7,7 0 0 1 12,1 a5,5 0 0 1 4,7 h-26 a4,4 0 0 1 2,-4 Z" />
                <path d="M92,12 a4,4 0 0 1 6,-3 a6,6 0 0 1 10,1 a4,4 0 0 1 3,6 h-21 a3,3 0 0 1 2,-4 Z" />
                <path d="M160,30 a5,5 0 0 1 8,-4 a8,8 0 0 1 13,2 a5,5 0 0 1 4,7 h-27 a4,4 0 0 1 2,-5 Z" />
                <path d="M210,8 a3,3 0 0 1 5,-2 a5,5 0 0 1 8,1 a3,3 0 0 1 2,4 h-16 a3,3 0 0 1 1,-3 Z" />
              </g>
            ))}
          </g>
          <g transform={`translate(${(-camX * 0.45 * k).toFixed(2)} 0)`}>
            <path className="pg-mid" d={backdrop.mid} />
            <g className="pg-houses">{houses}</g>
          </g>

          <g transform={`translate(${(PX - camX).toFixed(2)} 0)`}>
            <World setup={setup} />
            {puffs.map((p) => (
              <g key={p.key} className={`pg-puff ${p.kind}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
                {p.kind === 'hill' && <circle className="pg-dust" cy="3" r="4" />}
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <path key={j} style={{ ['--a' as string]: `${j * 60 + 20}deg` }} d="M0,-1.6 C1.2,-0.6 1.2,0.8 0,1.8 C-1.2,0.8 -1.2,-0.6 0,-1.6 Z" />
                ))}
              </g>
            ))}
          </g>

          {/* hawks: circling, then the line of the dive, then the dive */}
          {hawks.map(({ h, i, phase }) => (
            <HawkView key={i} h={h} lock={st.locks[i]} phase={phase} t={renderT} setup={setup} px={PX} />
          ))}

          <g
            className={`pg-pigeon${safe ? ' safe' : ''}${end ? ` ${end}` : ''}`}
            transform={`translate(${PX.toFixed(2)} ${y.toFixed(2)})`}
            // a won flight lands on the fort's loft (FORT_DX ahead, at LOFT_Y)
            style={{ ['--land-dx' as string]: `${FORT_DX}px`, ['--land-dy' as string]: `${(LOFT_Y - y).toFixed(1)}px` }}
          >
            <g transform={`rotate(${end ? 0 : tilt.toFixed(1)})`}>
              <PigeonBird climbing={climbing} />
            </g>
          </g>
        </svg>

        {!everHeld && !st.over && (
          <div className="pg-hint" aria-live="polite">
            {fine ? <>Hold <kbd>Space</kbd> to climb · let go to glide</> : <>Hold to climb · let go to glide</>}
          </div>
        )}
      </div>

      <div className="pg-pad" aria-hidden="true">
        <span className="pg-pad-icon" />
        <span className="pg-pad-text">
          {fine ? (
            <>Hold <kbd>Space</kbd> <kbd>↑</kbd> <kbd>W</kbd> or the mouse to climb</>
          ) : held ? 'Climbing' : 'Hold anywhere to climb'}
        </span>
      </div>
    </div>
  );
}

/** One hawk, drawn where it is this frame, with its dive line while it warns. */
function HawkView({ h, lock, phase, t, setup, px }: {
  h: Hawk; lock: number | null; phase: string; t: number; setup: PigeonSetup; px: number;
}) {
  const pos = hawkPos(setup, h, t, lock);
  const x = px + pos.dx;
  const lt = lockTime(setup, h);
  const from = hawkPos(setup, h, lt, lock);
  const diving = phase === 'dive';
  const warn = phase === 'warn';
  // heading: along the dive (toward the lower or upper left)
  const ang = diving && lock !== null ? (Math.atan2(lock - from.y, -from.dx) * 180) / Math.PI - 180 : 0;
  const bank = phase === 'circle' ? Math.sin((t - h.at) / 260) * 14 : 0;
  // the warning line runs from the hawk through the target and a little past
  const lineEnd = lock === null ? null : { x: px - 14, y: from.y + ((lock - from.y) * (from.dx + 14)) / from.dx };
  return (
    <g className={`pg-hawk ${phase}`} data-strike={h.at} data-lock={lock === null ? '' : lock.toFixed(2)} data-phase={phase}>
      {warn && lock !== null && lineEnd && (
        <g className="pg-dive-line">
          <line x1={px + from.dx} y1={from.y} x2={lineEnd.x} y2={lineEnd.y} />
          <g transform={`translate(${px} ${lock})`}>
            <g className="pg-target">
              <circle r="5.4" />
              <path d="M-8,0 h4 M4,0 h4 M0,-8 v4 M0,4 v4" />
            </g>
          </g>
        </g>
      )}
      <g transform={`translate(${x.toFixed(2)} ${pos.y.toFixed(2)}) rotate(${(diving ? ang : bank).toFixed(1)})`}>
        <HawkBird diving={diving} />
      </g>
      {warn && (
        <g transform={`translate(${(x - 11).toFixed(2)} ${(pos.y - 6).toFixed(2)})`}>
          <g className="pg-cry">
            <circle r="3.6" />
            <path d="M0,-2 v2.4 M0,1.6 v0.3" />
          </g>
        </g>
      )}
    </g>
  );
}

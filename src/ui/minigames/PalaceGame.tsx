import { useCallback, useEffect, useRef, useState } from 'react';
import type { PalaceSetup, PalaceState, PalaceEvent } from '../../game/minigames/palace';
import {
  COLS, ROWS, CORDON_ROW, endTurn, guardTargets, nextSpawns, palaceClock, palaceScore, palaceStart, playOrder,
} from '../../game/minigames/palace';
import type { MinigameEnd } from './MinigameScreen';

/**
 * HOLD THE PALACE — the board. All rules are in game/minigames/palace.ts;
 * this only draws a PalaceState and turns taps (or keys) into orders.
 *
 * Look: Sarnica's old town at night, seen from the Palace Guard's command
 * table — dark navy map, amber streets, a slow searchlight. Units glide
 * between blocks (CSS transforms on --c/--r), captures burst, a breach shakes
 * the gates. With Reduce Motion the movement is a short fade instead.
 */

const ANIM_MS = 420;

/** Effects that outlive a token (a captured column's burst, a breach). */
interface Fx { key: string; kind: PalaceEvent['kind']; col: number; row: number }

export function PalaceGame({ setup, gates, reduced, paused, onEnd }: {
  setup: PalaceSetup; gates: number; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<PalaceState>(() => palaceStart(setup, gates));
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fx, setFx] = useState<Fx[]>([]);
  const [shake, setShake] = useState(0);
  const fxId = useRef(0);
  const ended = useRef(false);

  const apply = useCallback((next: PalaceState) => {
    if (next === st) return;
    setSt(next);
    setSel(null);
    const burst = next.events.filter((e) => e.kind === 'capture' || e.kind === 'hit' || e.kind === 'breach');
    if (burst.length) {
      const items = burst.map((e) => ({ key: `fx${fxId.current++}`, kind: e.kind, col: e.col, row: e.row }));
      setFx((f) => [...f, ...items]);
      window.setTimeout(() => setFx((f) => f.filter((x) => !items.includes(x))), 900);
    }
    if (next.events.some((e) => e.kind === 'breach')) setShake((n) => n + 1);
    // a short lock while the columns move, so the board never jumps under a tap
    setBusy(true);
    window.setTimeout(() => setBusy(false), reduced ? 120 : ANIM_MS);
  }, [st, reduced]);

  // The night is over: let the last move play, then hand the result up.
  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const t = window.setTimeout(() => onEnd({
      won,
      score: palaceScore(st),
      headline: won
        ? (st.breaches === 0 ? 'Not one column reached the gates.' : 'The gates held. Just.')
        : 'The columns broke through the gates.',
      detail: `You stopped ${st.captured} of ${setup.spawns.length} columns. It is ${palaceClock(st.turn)}.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, setup.spawns.length, onEnd, reduced]);

  const locked = busy || paused || !!st.over;
  const targets = sel ? guardTargets(st, sel) : [];
  const flares = nextSpawns(st);

  const tapCell = (col: number, row: number) => {
    if (locked) return;
    const g = st.guards.find((x) => x.col === col && x.row === row);
    if (g) { setSel(sel === g.id ? null : g.id); return; }
    if (sel && targets.some((t) => t.col === col && t.row === row)) apply(playOrder(st, sel, col, row));
    else setSel(null);
  };
  const hold = () => { if (!locked) apply(endTurn(st)); };

  // Keyboard: 1-3 pick a unit; arrows (and Q/E/Z/C for diagonals) give the
  // order; H or Space holds position.
  useEffect(() => {
    const dirs: Record<string, [number, number]> = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      q: [-1, -1], e: [1, -1], z: [-1, 1], c: [1, 1],
    };
    const onKey = (ev: KeyboardEvent) => {
      if (locked) return;
      const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      if (/^[1-3]$/.test(k)) { ev.preventDefault(); const g = st.guards[Number(k) - 1]; if (g) setSel(g.id); return; }
      if (k === 'h' || (k === ' ' && !(ev.target as HTMLElement)?.closest('button'))) { ev.preventDefault(); hold(); return; }
      const d = dirs[k];
      if (d && sel) {
        const g = st.guards.find((x) => x.id === sel)!;
        const t = guardTargets(st, sel).find((x) => x.col === g.col + d[0] && x.row === g.row + d[1]);
        if (t) { ev.preventDefault(); apply(playOrder(st, sel, t.col, t.row)); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = targets.find((x) => x.col === col && x.row === row);
      const cls = ['pz-cell', row < CORDON_ROW ? 'outer' : '', t ? (t.attack ? 'tgt atk' : 'tgt') : ''].filter(Boolean).join(' ');
      cells.push(
        <button
          key={`${col}-${row}`}
          type="button"
          className={cls}
          style={{ gridColumn: col + 1, gridRow: row + 1 }}
          aria-label={`Block ${String.fromCharCode(65 + col)}${row + 1}${t ? (t.attack ? ', attack' : ', move here') : ''}`}
          onClick={() => tapCell(col, row)}
        />,
      );
    }
  }

  const left = setup.spawns.length - st.captured - st.breaches;
  return (
    <div className="pz">
      <div className="pz-hud">
        <div className="pz-clock" aria-label={`Time ${palaceClock(st.turn)}`}>
          <span className="pz-time" key={st.turn}>{palaceClock(st.turn)}</span>
          <span className="pz-dawn">dawn {palaceClock(setup.dawnTurn)}</span>
        </div>
        <div className="pz-stat"><b>{st.captured}</b> stopped</div>
        <div className="pz-stat"><b>{Math.max(0, left)}</b> still coming</div>
      </div>

      <div className="pz-intel" aria-label="Sable Office intelligence: where the next columns enter">
        {Array.from({ length: COLS }, (_, c) => (
          <span key={c} className={`pz-flare${flares.some((f) => f.col === c) ? ' on' : ''}`}>
            {flares.some((f) => f.col === c) ? '▼' : ''}
          </span>
        ))}
      </div>

      <div className="pz-board" style={{ ['--cols' as string]: COLS, ['--rows' as string]: ROWS }}>
        <div className="pz-sweep" aria-hidden="true" />
        {shake > 0 && <div className="pz-flash" key={`f${shake}`} aria-hidden="true" />}
        <div className="pz-cordon" aria-hidden="true" style={{ top: `${(CORDON_ROW / ROWS) * 100}%` }}><span>cordon</span></div>
        <div className="pz-grid">{cells}</div>
        <div className="pz-tokens" aria-hidden="true">
          {st.rebels.map((r) => (
            <span
              key={r.id}
              className={`pz-tok rebel${r.armour > 1 ? ' armour' : ''}${r.fast ? ' fast' : ''}`}
              style={{ ['--c' as string]: r.col, ['--r' as string]: r.row }}
            >
              <span className="body">{r.fast ? '»' : '■'}</span>
              {r.armour > 1 && <span className="pips">●●</span>}
            </span>
          ))}
          {st.guards.map((g, i) => (
            <span
              key={g.id}
              className={`pz-tok guard${sel === g.id ? ' sel' : ''}`}
              style={{ ['--c' as string]: g.col, ['--r' as string]: g.row }}
            >
              <span className="body">{i + 1}</span>
            </span>
          ))}
          {fx.map((f) => (
            <span key={f.key} className={`pz-fx ${f.kind}`} style={{ ['--c' as string]: f.col, ['--r' as string]: Math.min(f.row, ROWS - 1) }} />
          ))}
        </div>
      </div>

      <div className={`pz-palace${shake ? ' hit' : ''}`} key={`p${shake}`}>
        <span className="pz-gate-label">Palace gates</span>
        <span className="pz-gates">
          {Array.from({ length: st.gatesMax }, (_, i) => (
            <span key={i} className={`gate${i < st.gates ? '' : ' broken'}`} />
          ))}
        </span>
      </div>

      <div className="pz-orders">
        <span className="pz-help" aria-live="polite">
          {st.over ? (st.over === 'won' ? 'The columns are turning back.' : 'The gates are down.')
            : sel ? 'Tap a lit block to move there. Red means attack.'
              : 'Tap a Guard unit (blue) to give it an order.'}
        </span>
        <button className="btn pz-hold" onClick={hold} disabled={locked}>Hold position</button>
      </div>
    </div>
  );
}

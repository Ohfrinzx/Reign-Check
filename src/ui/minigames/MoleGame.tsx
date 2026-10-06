import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MoleSetup, MoleState, Pt, RoomId } from '../../game/minigames/mole';
import {
  CORRIDOR, DOOR_W, LINEUP_MS, ROOMS, STEP_MS, blackedOut, cctvClock, contactAt, cuesAt, lineupSecondsLeft, moleScore,
  moleStart, moleTick, nameMole, pickSuspect, posAt, roomById, staffForKey, toggleMark, areaAt, STAFF,
} from '../../game/minigames/mole';
import { MOLE_CHOICES, MOLE_JOB_FLAG } from '../../game/content/mgMole';
import { useMedia } from '../useMedia';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * FIND THE MOLE — the security monitor. Rules in game/minigames/mole.ts;
 * this runs the clock, draws the floor at that moment and turns taps (or
 * number keys) into marks and the final name.
 *
 * Look: a night-time security camera on the Interior Ministry's floor. A
 * top-down plan in CCTV green and grey with scanlines, a REC light and a
 * timestamp; people are small coloured figures (shoulders, and a head with
 * their symbol) that turn and sway as they walk; the contact is a grey coat
 * and hat in an amber tracking box. A camera that cuts out fills its room
 * with static and makes the picture jump. When the contact has gone, the
 * screen switches off and the staff stand in a line-up against a height
 * chart. Under Reduce Motion everything moves at two-thirds speed (all
 * timers 1.5x) and the scanlines, static and glitches keep still.
 *
 * Laptops (a mouse or trackpad): every person carries a number; pressing it
 * marks them, and in the line-up picks them (Enter names). Phones: tap the
 * person on the floor or their name below.
 */

const FINE_POINTER = '(any-pointer: fine)';
/** a phone held upright: the floor plan is turned on its side (corridor down the middle) */
const TALL = '(max-width: 700px)';
/** Reduce Motion: everything 1.5x slower */
const CALM = 1.5;
/** how long the screen takes to switch off before the line-up */
const SWITCH_OFF_MS = 700;

/** Each person's colour, symbol and height in the line-up (the job is in the rules). */
const LOOK: Record<string, { c: string; s: string; h: number }> = {
  clerk: { c: '#f2b33d', s: 'square', h: 0 },
  typist: { c: '#ff7eb6', s: 'circle', h: -10 },
  guard: { c: '#5aa8ff', s: 'triangle', h: 12 },
  cleaner: { c: '#9be15d', s: 'plus', h: -4 },
  driver: { c: '#ff6a3d', s: 'diamond', h: 6 },
  archivist: { c: '#b48cff', s: 'star', h: -12 },
  secretary: { c: '#3fe0d0', s: 'cross', h: 2 },
  aide: { c: '#f4ecc2', s: 'hex', h: 8 },
};

/** Furniture, in a room's own terms: (across, depth from the door wall), size as a share of the room. */
const DECOR: Record<RoomId, { k: string; u: number; v: number; w: number; h: number }[]> = {
  archive: [{ k: 'shelf', u: 0.5, v: 0.95, w: 0.9, h: 0.07 }, { k: 'shelf', u: 0.04, v: 0.6, w: 0.07, h: 0.55 }, { k: 'desk', u: 0.85, v: 0.6, w: 0.2, h: 0.16 }],
  typing: [{ k: 'desk', u: 0.2, v: 0.62, w: 0.18, h: 0.13 }, { k: 'desk', u: 0.8, v: 0.62, w: 0.18, h: 0.13 }, { k: 'desk', u: 0.2, v: 0.96, w: 0.18, h: 0.07 }, { k: 'desk', u: 0.8, v: 0.96, w: 0.18, h: 0.07 }],
  office: [{ k: 'desk big', u: 0.52, v: 0.78, w: 0.42, h: 0.17 }, { k: 'plant', u: 0.08, v: 0.93, w: 0.1, h: 0.1 }, { k: 'sofa', u: 0.95, v: 0.5, w: 0.08, h: 0.38 }],
  copy: [{ k: 'copier', u: 0.5, v: 0.94, w: 0.3, h: 0.1 }, { k: 'cabinet', u: 0.04, v: 0.55, w: 0.07, h: 0.4 }, { k: 'cabinet', u: 0.96, v: 0.55, w: 0.07, h: 0.4 }],
  kitchen: [{ k: 'counter', u: 0.5, v: 0.95, w: 0.94, h: 0.08 }, { k: 'table', u: 0.5, v: 0.66, w: 0.26, h: 0.14 }, { k: 'fridge', u: 0.05, v: 0.62, w: 0.09, h: 0.16 }],
  records: [{ k: 'cabinet', u: 0.5, v: 0.95, w: 0.9, h: 0.07 }, { k: 'cabinet', u: 0.96, v: 0.6, w: 0.07, h: 0.5 }, { k: 'desk', u: 0.18, v: 0.62, w: 0.2, h: 0.15 }],
};

interface Box { left: number; top: number; width: number; height: number }

/** Floor units → % of the drawn floor (turned on its side on a phone). */
function useFloor(tall: boolean) {
  const at = (p: Pt): CSSProperties => (tall ? { left: `${p.y}%`, top: `${p.x}%` } : { left: `${p.x}%`, top: `${p.y}%` });
  const box = (x0: number, y0: number, x1: number, y1: number): Box => (tall
    ? { left: y0, top: x0, width: y1 - y0, height: x1 - x0 }
    : { left: x0, top: y0, width: x1 - x0, height: y1 - y0 });
  const pct = (b: Box): CSSProperties => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` });
  /** a direction of travel in floor units → degrees on screen (0 = up) */
  const angle = (dx: number, dy: number) => {
    // the floor is drawn 4:3 (3:4 on its side), so a unit across is longer than a unit down
    const sx = tall ? dy * 3 : dx * 4;
    const sy = tall ? dx * 4 : dy * 3;
    return (Math.atan2(sy, sx) * 180) / Math.PI + 90;
  };
  return { at, box, pct, angle };
}

/** A point inside a room, from the room's own (across, depth) terms. */
function roomPoint(room: RoomId, u: number, v: number): Pt {
  const r = roomById(room);
  return { x: r.x0 + u * (r.x1 - r.x0), y: r.top ? r.y1 - v * (r.y1 - r.y0) : r.y0 + v * (r.y1 - r.y0) };
}

function Sym({ shape }: { shape: string }) {
  return <i className={`mo-sym s-${shape}`} aria-hidden="true" />;
}

export function MoleGame({ setup, reduced, paused, onEnd }: {
  setup: MoleSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<MoleState>(() => moleStart(setup));
  const clock = useClock(!paused && !st.over);
  const now = reduced ? clock / CALM : clock;
  const ended = useRef(false);
  // after a right name: what happens to the mole (owner, 2026-10-06)
  const [fate, setFate] = useState<string | null>(null);
  const heading = useRef<Record<string, number>>({});
  const showKeys = useMedia(FINE_POINTER);
  const tall = useMedia(TALL);
  const F = useFloor(tall);

  // advance the rules to the clock, in whole steps (worked out from the
  // latest state, so a repeated effect never advances it twice)
  useEffect(() => {
    if (st.over) return;
    if (Math.floor(now / STEP_MS) * STEP_MS - st.t < STEP_MS) return;
    setSt((s) => {
      const due = Math.floor(now / STEP_MS) * STEP_MS - s.t;
      return due >= STEP_MS ? moleTick(s, due) : s;
    });
  }, [now, st.t, st.over]);

  // the end: show who it was for a moment, then hand the result up
  useEffect(() => {
    if (!st.over || ended.current) return;
    const won = st.over === 'won';
    if (won && !fate) return; // waiting for the player to choose
    ended.current = true;
    const chosen = MOLE_CHOICES.find((c) => c.id === fate);
    const job = (id?: string) => setup.staff.find((p) => p.id === id)?.job ?? '';
    const env = setup.cues.find((c) => c.kind === 'envelope')!;
    const where = `in the ${roomById(env.room).name.toLowerCase()} at ${cctvClock(env.at)}`;
    const t = window.setTimeout(() => onEnd({
      won,
      score: moleScore(st),
      choice: won ? fate ?? undefined : undefined,
      flags: { [MOLE_JOB_FLAG]: STAFF.findIndex((x) => x.id === setup.mole) + 1 },
      headline: won
        ? `You named the mole: the ${job(st.named)}. ${chosen ? `${chosen.label}.` : ''}`.trim()
        : st.named ? `Wrong desk. It was the ${job(setup.mole)}.` : 'No name. The mole went home.',
      detail: won
        ? `The ${job(setup.mole)} handed the contact an envelope ${where}.`
        : st.named
          ? `You named the ${job(st.named)}. The ${job(setup.mole)} handed over an envelope ${where}.`
          : `It was the ${job(setup.mole)}. The envelope changed hands ${where}.`,
    }), won ? 350 : reduced ? 900 : 1800);
    return () => window.clearTimeout(t);
  }, [st, setup, onEnd, reduced, fate]);

  // the choice: buttons, or 1–4 on a keyboard
  const choosing = st.over === 'won' && !fate;
  useEffect(() => {
    if (!choosing || paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = /^[1-4]$/.test(e.key) ? Number(e.key) : /^Numpad[1-4]$/.test(e.code) ? Number(e.code.slice(6)) : 0;
      if (!n) return;
      e.preventDefault();
      setFate(MOLE_CHOICES[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choosing, paused]);

  const watching = st.phase === 'watch';
  const lineup = st.phase !== 'watch' && (st.over || now >= setup.watchMs + SWITCH_OFF_MS);

  // number keys: mark while watching; in the line-up pick (arrows move, Enter names)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || st.over || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const digit = /^[0-9]$/.test(e.key) ? Number(e.key) : /^Numpad[0-9]$/.test(e.code) ? Number(e.code.slice(6)) : null;
      if (digit !== null) {
        const p = staffForKey(setup, digit);
        if (!p) return;
        e.preventDefault();
        setSt((s) => (s.phase === 'watch' ? toggleMark(s, p.id) : pickSuspect(s, p.id)));
        return;
      }
      if (st.phase !== 'lineup') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const n = setup.staff.length;
        const i = setup.staff.findIndex((p) => p.id === st.picked);
        const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        const next = i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n;
        setSt((s) => pickSuspect(s, setup.staff[next].id));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setSt((s) => nameMole(s));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, st.over, st.phase, st.picked, setup]);

  const mark = (id: string) => { if (!paused) setSt((s) => toggleMark(s, id)); };
  const pick = (id: string) => { if (!paused) setSt((s) => pickSuspect(s, id)); };

  // what the camera shows: the floor at this moment (frozen once the contact has gone)
  const tt = Math.min(now, setup.watchMs);
  const dark = ROOMS.filter((r) => blackedOut(setup, r.id, tt)).map((r) => r.id);
  const glitch = !reduced && setup.blackouts.some((b) => tt >= b.from && tt < b.from + 260);
  const c = contactAt(setup, tt);
  const cArea = areaAt(c);
  const contactShown = c.x > -3 && c.x < 103 && !dark.includes(cArea as RoomId);
  const liftOpen = Math.abs(c.x - 100) < 7;
  const stairsUsed = Math.abs(c.x) < 7;
  // which way each person faces; turning the short way round at corners
  const turn = (id: string, dx: number, dy: number, moving: boolean) => {
    const was = heading.current[id] ?? 180;
    if (!moving) return was;
    const delta = ((((F.angle(dx, dy) - was) % 360) + 540) % 360) - 180;
    heading.current[id] = was + delta;
    return was + delta;
  };
  const tape = Math.min(1, tt / setup.watchMs);
  const left = lineupSecondsLeft(st);
  // on a phone: the staff in rows of 3 (5-6 people) or 4
  const n = setup.staff.length;
  const cols = n <= 4 ? n : n <= 6 ? 3 : 4;

  const job = (id?: string) => setup.staff.find((p) => p.id === id)?.job ?? '';

  return (
    <div className={`mo${tall ? ' tall' : ''}${lineup ? ' at-lineup' : ''}`} data-phase={st.phase}>
      {!lineup ? (
        <>
          <div className={`mo-monitor${glitch ? ' glitch' : ''}${st.phase !== 'watch' ? ' off' : ''}`}>
            <div className="mo-osd" aria-hidden="true">
              <span className="mo-rec"><i />REC</span>
              <span className="mo-cam">CAM 3 · Interior Ministry · night floor</span>
              <span className="mo-time">{cctvClock(tt)}</span>
            </div>
            <div className="mo-floor" data-clip>
              <div className="mo-hall" style={F.pct(F.box(0, CORRIDOR.y0, 100, CORRIDOR.y1))} aria-hidden="true">
                <span className="mo-runner" />
              </div>
              {ROOMS.map((r) => {
                const b = F.box(r.x0, r.y0, r.x1, r.y1);
                const wallY = r.top ? r.y1 : r.y0;
                const door = F.box(r.doorX - DOOR_W / 2, wallY - 1.2, r.doorX + DOOR_W / 2, wallY + 1.2);
                return (
                  <div key={r.id} className="mo-room-wrap" aria-hidden="true">
                    <div className="mo-room" style={F.pct(b)}>
                      <span className="mo-label">{r.name}</span>
                    </div>
                    {DECOR[r.id].map((f, i) => {
                      const p = roomPoint(r.id, f.u, f.v);
                      const w = f.w * (r.x1 - r.x0);
                      const h = f.h * (r.y1 - r.y0);
                      return <i key={i} className={`mo-decor ${f.k}`} style={F.pct(F.box(p.x - w / 2, p.y - h / 2, p.x + w / 2, p.y + h / 2))} />;
                    })}
                    <i className={`mo-door ${tall ? 'v' : 'h'}`} style={F.pct(door)} />
                  </div>
                );
              })}
              <div className={`mo-lift${tall ? ' v' : ''}${liftOpen ? ' open' : ''}`} style={F.pct(F.box(97, CORRIDOR.y0 + 2.5, 100, CORRIDOR.y1 - 2.5))} aria-hidden="true">
                <i /><i />
              </div>
              <div className={`mo-stairs${tall ? ' v' : ''}${stairsUsed ? ' used' : ''}`} style={F.pct(F.box(0, CORRIDOR.y0 + 2.5, 3, CORRIDOR.y1 - 2.5))} aria-hidden="true" />

              {setup.staff.map((p) => {
                const pos = posAt(p.track, tt);
                const area = areaAt(pos);
                if (dark.includes(area as RoomId)) return null;
                const look = LOOK[p.id];
                const marked = st.marks.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`mo-p${pos.moving ? ' walk' : ''}${marked ? ' marked' : ''}`}
                    style={{ ...F.at(pos), ['--c' as string]: look.c }}
                    data-id={p.id}
                    disabled={!watching || paused}
                    // pointer-down, not click: people keep moving under the finger
                    onPointerDown={(e) => { e.preventDefault(); mark(p.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mark(p.id); } }}
                    aria-label={`${p.job} (${p.key})${marked ? ', marked as a suspect' : ''}`}
                  >
                    <span className="mo-turn" style={{ transform: `rotate(${turn(p.id, pos.dx, pos.dy, pos.moving)}deg)` }}>
                      <span className="mo-sway"><i className="mo-shoulders" /></span>
                    </span>
                    <span className="mo-head"><Sym shape={look.s} /></span>
                    {marked && <span className="mo-lock" aria-hidden="true" />}
                    {showKeys && <span className="mo-key" aria-hidden="true">{p.key}</span>}
                  </button>
                );
              })}

              {contactShown && (
                <div className={`mo-contact${c.moving ? ' walk' : ''}`} style={F.at(c)} aria-label="The contact">
                  <span className="mo-turn" style={{ transform: `rotate(${turn('contact', c.dx, c.dy, c.moving)}deg)` }}>
                    <span className="mo-sway"><i className="mo-coat" /></span>
                  </span>
                  <span className="mo-hat" />
                  <span className="mo-track"><b>Contact</b></span>
                </div>
              )}

              {cuesAt(setup, tt).filter((q) => !dark.includes(q.room)).map((q) => {
                const f = Math.min(1, Math.max(0, (tt - q.at) / q.ms));
                // across the middle of the gap, so it never hides either face
                const e = 0.22 + 0.56 * (f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f));
                const p = { x: q.a.x + (q.b.x - q.a.x) * e, y: q.a.y + (q.b.y - q.a.y) * e };
                const scale = Math.min(1, f / 0.15, (1 - f) / 0.15 + 0.35);
                return (
                  <span
                    key={`${q.kind}${q.at}`}
                    className={`mo-cue ${q.kind}${setup.d.bigCue ? ' big' : ''}`}
                    style={{ ...F.at(p), ['--k' as string]: scale.toFixed(3) }}
                    data-cue={q.kind}
                    data-from={q.from}
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                );
              })}

              {dark.map((id) => {
                const r = roomById(id);
                return (
                  <div key={id} className="mo-static" style={F.pct(F.box(r.x0, r.y0, r.x1, r.y1))} aria-hidden="true">
                    <span>No signal</span>
                  </div>
                );
              })}
              {st.phase !== 'watch' && <div className="mo-gone" aria-live="polite"><span>Contact has left the building</span></div>}
            </div>
            <div className="mo-tape" aria-hidden="true"><i style={{ transform: `scaleX(${tape})` }} /></div>
          </div>

          <aside className="mo-roster" aria-label="Staff on the floor">
            <div className="mo-roster-h">Staff on the floor</div>
            <div className="mo-chips" style={{ ['--nc' as string]: cols }}>
              {setup.staff.map((p) => {
                const look = LOOK[p.id];
                const marked = st.marks.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`mo-chip${marked ? ' marked' : ''}`}
                    style={{ ['--c' as string]: look.c }}
                    data-id={p.id}
                    disabled={!watching || paused}
                    onPointerDown={(e) => { e.preventDefault(); mark(p.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mark(p.id); } }}
                    aria-pressed={marked}
                    aria-label={`${p.job} (${p.key})${marked ? ', marked as a suspect' : ''}`}
                  >
                    {showKeys && <span className="mo-key" aria-hidden="true">{p.key}</span>}
                    <span className="mo-ico"><Sym shape={look.s} /></span>
                    <span className="mo-job">{p.job}</span>
                    <span className="mo-flag" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="mo-help">
              {showKeys ? 'Watch the grey coat. Press a number to mark a suspect.' : 'Watch the grey coat. Tap a person to mark a suspect.'}
            </div>
            <ul className="mo-legend" aria-label="What you see">
              <li><i className="mo-lg contact" aria-hidden="true" />The contact</li>
              <li><i className="mo-lg envelope" aria-hidden="true" />Envelope: the mole</li>
              {setup.d.coffee && <li><i className="mo-lg coffee" aria-hidden="true" />Coffee: no clue</li>}
              {setup.d.blackouts > 0 && <li><i className="mo-lg static" aria-hidden="true" />Camera out</li>}
            </ul>
          </aside>
        </>
      ) : (
        <section className={`mo-lineup${st.over ? ` done ${st.over}` : ''}`} aria-label="Line-up">
          <div className="mo-lu-head">
            <span className="mo-lu-kicker">Line-up · {cctvClock(setup.watchMs)}</span>
            <h2>{st.over ? (st.over === 'won' ? 'That is the mole.' : st.named ? 'Not the mole.' : 'Too late.') : 'Who met the contact?'}</h2>
            {!st.over && (
              <div className="mo-lu-clock" aria-label={`${left} seconds left`}>
                <span><i style={{ transform: `scaleX(${Math.max(0, (setup.watchMs + LINEUP_MS - now) / (LINEUP_MS - SWITCH_OFF_MS))})` }} /></span>
                <b>{left}s</b>
              </div>
            )}
          </div>
          <div className="mo-wall">
            <div className="mo-heights" aria-hidden="true">
              {[200, 190, 180, 170, 160, 150].map((h) => <i key={h} data-h={h} />)}
            </div>
            <div className="mo-row" style={{ ['--n' as string]: setup.staff.length, ['--nc' as string]: cols }}>
              {setup.staff.map((p) => {
                const look = LOOK[p.id];
                const verdict = st.over && (p.id === setup.mole ? 'mole' : p.id === st.named ? 'wrong' : '');
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`mo-sus${st.picked === p.id ? ' picked' : ''}${st.marks.includes(p.id) ? ' marked' : ''}${verdict ? ` ${verdict}` : ''}`}
                    style={{ ['--c' as string]: look.c, ['--h' as string]: `${look.h}px` }}
                    disabled={!!st.over || paused}
                    data-id={p.id}
                    onClick={() => pick(p.id)}
                    aria-pressed={st.picked === p.id}
                    aria-label={`${p.job} (${p.key})${st.marks.includes(p.id) ? ', you marked them' : ''}`}
                  >
                    <span className="mo-fig" aria-hidden="true">
                      <i className="mo-fhead" />
                      <i className="mo-ftorso"><span className="mo-badge"><Sym shape={look.s} /></span></i>
                      <i className="mo-flegs" />
                    </span>
                    <span className="mo-plate">
                      {showKeys && <span className="mo-key" aria-hidden="true">{p.key}</span>}
                      {p.job}
                    </span>
                    {st.marks.includes(p.id) && <span className="mo-tag" aria-hidden="true">Suspect</span>}
                    {verdict && <span className="mo-verdict">{verdict === 'mole' ? 'Mole' : 'Not them'}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {choosing ? (
            <div className="mo-fate" role="group" aria-label={`What happens to the ${job(setup.mole)}?`}>
              <div className="mo-fate-q">What happens to the {job(setup.mole)}?</div>
              <div className="mo-fate-opts">
                {MOLE_CHOICES.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`mo-fate-btn ${c.id}`}
                    disabled={paused}
                    data-choice={c.id}
                    onClick={() => setFate(c.id)}
                  >
                    <span className="mo-fate-l">
                      {showKeys && <span className="mo-key" aria-hidden="true">{i + 1}</span>}
                      {c.label}
                    </span>
                    <span className="mo-fate-h">{c.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <div className="mo-lu-foot">
            <span className="mo-lu-help">{showKeys ? 'Press a number to pick, Enter to name.' : 'Tap a person, then name them.'}</span>
            <button
              type="button"
              className="btn btn-primary mo-name"
              disabled={!st.picked || !!st.over || paused}
              onClick={() => setSt((s) => nameMole(s))}
            >
              {st.picked ? `Name the ${job(st.picked)}` : 'Name the mole'}
            </button>
          </div>
          )}
        </section>
      )}
    </div>
  );
}

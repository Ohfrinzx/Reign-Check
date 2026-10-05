import { useCallback, useEffect, useRef, useState } from 'react';
import type { BulletinCall, BulletinSetup } from '../../game/minigames/bulletin';
import { MISTAKES_ALLOWED, scoreBulletin, spikesLeft } from '../../game/minigames/bulletin';
import type { MinigameEnd } from './MinigameScreen';

/**
 * THE 7PM BULLETIN — the studio. Rules in game/minigames/bulletin.ts; this
 * runs the clock and turns swipes, taps and keys into calls.
 *
 * Look: a bright TV control room — cool white desk, Channel Seven blue, a red
 * ON AIR light, an LED clock running down to 19:00. Each story slides onto
 * the desk with its own shrinking clock; a spiked story flies off left under
 * a red SPIKED stamp, a story you run (or let air) drops right onto the
 * monitor. Reduce Motion: longer clocks (×1.5) and fades instead of flights.
 */

const EXIT_MS = 340;
/** The story's slide-in (btIn, .42s; the Reduce Motion fade is .2s). Its
 *  clock waits for it, so the full time is spent with the story readable
 *  (owner: "Players don't have enough time to read the story"). */
const IN_MS = 420;
const IN_MS_REDUCED = 200;
const SWIPE_AT = 70;

type Exit = { call: BulletinCall; correct: boolean } | null;

export function BulletinGame({ setup, reduced, paused, onEnd }: {
  setup: BulletinSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const n = setup.stories.length;
  const [calls, setCalls] = useState<BulletinCall[]>([]);
  const [exit, setExit] = useState<Exit>(null);
  const [drag, setDrag] = useState(0);
  const dragFrom = useRef<number | null>(null);
  const idx = calls.length;
  const story = setup.stories[idx];
  const seconds = setup.seconds * (reduced ? 1.5 : 1);
  const lead = reduced ? IN_MS_REDUCED : IN_MS;
  const remaining = useRef(lead + seconds * 1000);
  const startedAt = useRef(0);
  const ended = useRef(false);

  const left = spikesLeft(setup, calls);
  const sofar = scoreBulletin({ ...setup, stories: setup.stories.slice(0, idx) }, calls);

  const decide = useCallback((call: BulletinCall) => {
    if (exit || !story) return;
    if (call === 'spike' && left <= 0) return;
    const correct = story.bad ? call === 'spike' : call !== 'spike';
    setExit({ call, correct });
    setDrag(0);
    window.setTimeout(() => {
      setExit(null);
      setCalls((c) => [...c, call]);
    }, reduced ? 160 : EXIT_MS);
  }, [exit, story, left, reduced]);

  // Each story's clock. It pauses while "Give up?" is asking.
  useEffect(() => { remaining.current = lead + seconds * 1000; }, [idx, seconds, lead]);
  useEffect(() => {
    if (!story || exit || paused) return;
    startedAt.current = performance.now();
    const t = window.setTimeout(() => decide(null), remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    };
  }, [idx, story, exit, paused, decide]);

  // The last story is done: judge the bulletin.
  useEffect(() => {
    if (idx < n || ended.current) return;
    ended.current = true;
    const r = scoreBulletin(setup, calls);
    const t = window.setTimeout(() => onEnd({
      won: r.won,
      score: r.score,
      headline: r.won
        ? (r.mistakes === 0 ? 'Not one bad story went out.' : `${r.mistakes} mistake${r.mistakes === 1 ? '' : 's'}. Nothing that will last.`)
        : `${r.mistakes} mistakes. The country saw it.`,
      detail: `${r.badAired} damaging stor${r.badAired === 1 ? 'y' : 'ies'} aired; ${r.goodSpiked} good one${r.goodSpiked === 1 ? '' : 's'} spiked. You were allowed ${MISTAKES_ALLOWED}.`,
    }), reduced ? 200 : 600);
    return () => window.clearTimeout(t);
  }, [idx, n, setup, calls, onEnd, reduced]);

  // Keys: ← or S spikes, → or R runs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'ArrowLeft' || k === 's') { e.preventDefault(); decide('spike'); }
      if (k === 'ArrowRight' || k === 'r') { e.preventDefault(); decide('run'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, paused]);

  // Swipe: the story follows the finger; let go past SWIPE_AT to call it.
  const onDown = (e: React.PointerEvent) => {
    if (exit || paused) return;
    dragFrom.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragFrom.current === null) return;
    setDrag(e.clientX - dragFrom.current);
  };
  const onUp = () => {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    if (drag <= -SWIPE_AT && left > 0) decide('spike');
    else if (drag >= SWIPE_AT) decide('run');
    else setDrag(0);
  };

  const minute = 40 + Math.floor((idx / Math.max(1, n)) * 20);
  const clock = minute >= 60 ? '19:00' : `18:${String(minute).padStart(2, '0')}`;
  const exitCls = exit ? (exit.call === 'spike' ? ' out-spike' : ' out-run') : '';
  const lean = drag < -20 ? ' lean-spike' : drag > 20 ? ' lean-run' : '';

  return (
    <div className="bt">
      <div className="bt-hud">
        <div className="bt-onair"><span className="bt-lamp" /> Live at 7pm</div>
        <div className="bt-clock" aria-label={`Time ${clock}`}>{clock}</div>
        <div className="bt-count">
          <span><b>{Math.max(0, left)}</b> spike{left === 1 ? '' : 's'} left</span>
          <span className={sofar.mistakes > MISTAKES_ALLOWED ? 'over' : ''}><b>{sofar.mistakes}</b> / {MISTAKES_ALLOWED} mistakes</span>
        </div>
      </div>

      <ol className="bt-rundown" aria-label="Tonight's running order">
        {setup.stories.map((st, i) => {
          const c = calls[i];
          const done = i < idx;
          const ok = done && (st.bad ? c === 'spike' : c !== 'spike');
          return (
            <li key={st.id} className={done ? (ok ? 'ok' : 'miss') : i === idx ? 'now' : ''}>
              <span className="sr-only">{done ? (ok ? 'right call' : 'mistake') : i === idx ? 'on the desk' : 'to come'}</span>
            </li>
          );
        })}
      </ol>

      <div className="bt-desk">
        {story && (
          <article
            key={story.id}
            className={`bt-story${exitCls}${lean}${exit && !exit.correct ? ' wrong' : ''}`}
            style={drag ? { transform: `translateX(${drag}px) rotate(${drag / 22}deg)`, transition: 'none' } : undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="bt-slug">Story {idx + 1} of {n}</div>
            <h2>{story.headline}</h2>
            <p>{story.dek}</p>
            <div className="bt-timer" aria-hidden="true">
              <span
                className="bt-fill"
                style={{ animationDuration: `${seconds}s`, animationDelay: `${lead}ms`, animationPlayState: paused || exit ? 'paused' : 'running' }}
              />
            </div>
            <span className="bt-stamp spike" aria-hidden="true">Spiked</span>
            <span className="bt-stamp run" aria-hidden="true">{exit?.call === null ? 'Aired' : 'Run it'}</span>
            {exit && <span className={`bt-verdict ${exit.correct ? 'ok' : 'miss'}`}>{exit.correct ? '✓ Right call' : story.bad ? '✕ That hurt you' : '✕ That one helped you'}</span>}
          </article>
        )}
        {!story && <div className="bt-wrap">That's the bulletin.</div>}
      </div>

      <div className="bt-actions">
        <button className="btn bt-spike" onClick={() => decide('spike')} disabled={!story || !!exit || left <= 0}>
          ✕ Spike it{left <= 0 ? ' (none left)' : ''}
        </button>
        <button className="btn bt-run" onClick={() => decide('run')} disabled={!story || !!exit}>
          Run it ✓
        </button>
      </div>
    </div>
  );
}

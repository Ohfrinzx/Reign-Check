import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Stamp, StairwellSetup, StairwellState, StmtMark } from '../../game/minigames/stairwell';
import {
  PLACES, canClose, closeCase, lineKey, placeById, stairwellStart, stairwellWords, stampFile, stmtMarks, strikeLine,
} from '../../game/minigames/stairwell';
import { useMedia } from '../useMedia';
import type { MinigameEnd } from './MinigameScreen';

/**
 * WHO WAS IN THE STAIRWELL? — the Sable Office archive. Rules in
 * game/minigames/stairwell.ts; this lays the files on the desk and turns taps
 * (or keys) into stamps.
 *
 * Look: dark, one desk lamp. Manila folders with a typed page each (a
 * paper clip, a name label), a tracing-paper plan of the Palace's stairwell
 * pinned beside them, two rubber stamps (LIAR in red, IN THE STAIRWELL in
 * blue). The files slide out of a pile when the game opens, a page turns
 * when you open another file (phones), a stamp thumps down and blooms, a
 * struck line is crossed out like a pen stroke. Closing the case dims the
 * other files and thumps the true stamps down. Reduce Motion (.mg-calm):
 * fades only, no sliding, thumping or turning.
 *
 * Controls. Phones: tap a tab to open a file, tap a line to see where it
 * points on the plan, tap LIAR or STAIRWELL on the open file to stamp it
 * (tap again to lift the stamp), then Close the case. Laptops (a mouse or
 * trackpad, `any-pointer: fine`): 1–5 open a file, ← → move between files,
 * ↑ ↓ between its lines, X strikes a line out, L stamps the liar, S stamps
 * the stairwell, Enter closes the case. Nothing is lost by a mistap: the
 * stamps move, and the case closes only on Close the case.
 */

const FINE_POINTER = '(any-pointer: fine)';
/** a phone (upright or on its side): one open file at a time, behind tabs */
const TABBED = '(max-width: 700px), (max-width: 1080px) and (max-height: 500px)';
/** how long the true stamps take to land before the result (ms) */
const REVEAL_MS = 2500;
const REVEAL_CALM_MS = 1200;

interface Look { file: number; line: number }

/** After a mouse or finger tap, give focus back so Enter closes the case (keys keep focus). */
function letGo(e: MouseEvent<HTMLElement>) {
  if (e.detail > 0) e.currentTarget.blur();
}

/** The tracing-paper plan of the Palace's stairs. The place a statement points at lights up. */
function Plan({ marks, reveal, calls, showFloors }: { marks: StmtMark[]; reveal: boolean; calls: string[]; showFloors: boolean }) {
  return (
    <div className={`sw-plan${reveal ? ' reveal' : ''}`} role="img" aria-label="Plan of the Palace stairwell, three floors">
      <div className="sw-plan-grid">
        {showFloors && (
          <>
            <span className="sw-floor" style={{ gridColumn: 1, gridRow: 1 }}>3rd</span>
            <span className="sw-floor" style={{ gridColumn: 1, gridRow: 2 }}>2nd</span>
            <span className="sw-floor" style={{ gridColumn: 1, gridRow: 3 }}>Gnd</span>
          </>
        )}
        {PLACES.map((p) => {
          const here = marks.filter((m) => m.place === p.id);
          const mode = here[0]?.mode;
          return (
            <div
              key={p.id}
              className={`sw-room r-${p.id}${mode ? ` hl ${mode}` : ''}`}
              style={{ gridColumn: p.col + 1, gridRow: `${p.row} / span ${p.span}` }}
              data-place={p.id}
            >
              <span className="sw-room-name">{p.name}</span>
              {p.id === 'stairs' && (
                <svg className="sw-flights" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
                  <path className="rail" d="M6 4 V96 M34 4 V96" />
                  <path className="steps" d="M6 12 H34 M6 20 H34 M6 28 H34 M6 36 H34 M6 44 H34 M6 52 H34 M6 60 H34 M6 68 H34 M6 76 H34 M6 84 H34 M6 92 H34" />
                  <path className="floor" d="M2 4 H38 M2 50 H38" />
                </svg>
              )}
              {here.map((m, i) => (m.mode === 'empty'
                ? <span key={i} className="sw-void" aria-hidden="true">empty</span>
                : (
                  <span key={i} className={`sw-pin ${m.mode}`} aria-hidden="true">
                    <i>{m.who !== undefined ? m.who + 1 : ''}</i>
                    <b>{m.who !== undefined ? calls[m.who] : ''}</b>
                  </span>
                )))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StairwellGame({ setup, reduced, paused, onEnd }: {
  setup: StairwellSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const n = setup.files.length;
  const calls = setup.files.map((f) => f.call);
  const [st, setSt] = useState<StairwellState>(stairwellStart);
  const [sel, setSel] = useState(0);
  const [look, setLook] = useState<Look | null>(null);
  const showKeys = useMedia(FINE_POINTER);
  const tabbed = useMedia(TABBED);
  const over = st.over;
  const locked = !!over || paused;

  /* the end: let the true stamps land, then hand the result up */
  const stRef = useRef(st);
  stRef.current = st;
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  useEffect(() => {
    if (!over) return;
    setSel(setup.stairs);
    const t = window.setTimeout(() => {
      const w = stairwellWords(setup, stRef.current);
      endRef.current({ won: over === 'won', score: stRef.current.score, headline: w.headline, detail: w.detail });
    }, reducedRef.current ? REVEAL_CALM_MS : REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [over, setup]);

  const open = (file: number, line: number | null = null) => {
    setSel(file);
    setLook(line === null ? null : { file, line });
  };
  const stamp = (kind: Stamp, file: number) => {
    if (locked) return;
    setSt((s) => stampFile(s, kind, file));
    setSel(file);
  };
  const strike = (file: number, line: number) => {
    if (locked) return;
    setSt((s) => strikeLine(s, file, line));
  };
  const close = () => {
    if (locked || !canClose(st)) return;
    setSt((s) => closeCase(setup, s));
  };

  /* laptop keys: 1–5 open a file, ← → files, ↑ ↓ lines, X strike, L / S stamp, Enter close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const onButton = !!(e.target as HTMLElement | null)?.closest?.('button');
      const k = e.key;
      const digit = /^[1-9]$/.test(k) ? Number(k) : /^Numpad[1-9]$/.test(e.code) ? Number(e.code.slice(6)) : 0;
      if (digit) {
        if (digit > n) return;
        e.preventDefault();
        setSel(digit - 1);
        setLook({ file: digit - 1, line: 0 });
        return;
      }
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        const next = (sel + (k === 'ArrowLeft' ? -1 : 1) + n) % n;
        setSel(next);
        setLook({ file: next, line: 0 });
        return;
      }
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        const len = setup.files[sel].lines.length;
        const at = look && look.file === sel ? look.line : -1;
        const next = at < 0 ? (k === 'ArrowDown' ? 0 : len - 1) : (at + (k === 'ArrowUp' ? -1 : 1) + len) % len;
        setLook({ file: sel, line: next });
        return;
      }
      const low = k.toLowerCase();
      if (low === 'l') { e.preventDefault(); setSt((s) => stampFile(s, 'liar', sel)); return; }
      if (low === 's') { e.preventDefault(); setSt((s) => stampFile(s, 'stairs', sel)); return; }
      if (low === 'x') {
        if (look && look.file === sel) { e.preventDefault(); setSt((s) => strikeLine(s, look.file, look.line)); }
        return;
      }
      // Enter belongs to a focused button; anywhere else it closes the case
      if (k === 'Enter' && !onButton && canClose(st)) { e.preventDefault(); setSt((s) => closeCase(setup, s)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, n, sel, look, st, setup]);

  /* what the plan shows: the line you are looking at */
  const lookLine = look ? setup.files[look.file]?.lines[look.line] : undefined;
  const marks = lookLine ? stmtMarks(lookLine.st) : [];
  const caption = !lookLine
    ? 'Tap a line to find it on the plan.'
    : marks.length
      ? marks.map((m) => {
        const place = m.place ? placeById(m.place).name : '';
        return m.mode === 'empty' ? `Nobody: ${place}` : m.mode === 'not' ? `${calls[m.who ?? 0]}, not: ${place}` : `${calls[m.who ?? 0]}: ${place}`;
      }).join(' · ')
      : 'That line is not about one place.';

  const who = (i: number | null) => (i === null ? '—' : calls[i]);
  const cols = n <= 4 ? 2 : 3;
  const ready = canClose(st);

  return (
    <div
      className={`sw${tabbed ? ' tabbed' : ''}${over ? ` over ${over}` : ''}`}
      style={{ ['--n' as string]: n, ['--cols' as string]: cols }}
      data-seed={setup.seed}
      data-act={setup.d.act}
      data-files={n}
    >
      <div className="sw-planbox">
        <Plan marks={marks} reveal={!!over} calls={calls} showFloors />
        <div className="sw-caption" aria-live="polite">{caption}</div>
      </div>

      <section className="sw-desk" aria-label="The files">
        {tabbed && (
          <div className="sw-tabs" role="tablist" aria-label="Files">
            {setup.files.map((f, i) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={sel === i}
                className={`sw-tab${sel === i ? ' on' : ''}`}
                style={{ ['--i' as string]: i }}
                data-file={i}
                onClick={(e) => { letGo(e); open(i); }}
              >
                <span className="sw-tab-n">{i + 1}</span>
                <span className="sw-tab-name">{f.call}</span>
                {st.liar === i && <i className="sw-pip liar" aria-label="stamped liar" />}
                {st.stairs === i && <i className="sw-pip stairs" aria-label="stamped stairwell" />}
              </button>
            ))}
          </div>
        )}

        <div className="sw-files">
          {setup.files.map((f, i) => {
            const isLiar = setup.liar === i;
            const isStairs = setup.stairs === i;
            // a file's place in the pile it slides out of
            const col = i % cols;
            const row = Math.floor(i / cols);
            const rows = Math.ceil(n / cols);
            const style = {
              ['--i' as string]: i,
              ['--sx' as string]: `${(((cols - 1) / 2) - col) * 105}%`,
              ['--sy' as string]: `${(((rows - 1) / 2) - row) * 105}%`,
              ['--tilt' as string]: `${[-5, 4, -3, 6, -4][i % 5]}deg`,
            } as CSSProperties;
            return (
              <article
                key={f.id}
                className={`sw-file${sel === i ? ' sel' : ''}${over && isLiar ? ' truth-liar' : ''}${over && isStairs ? ' truth-stairs' : ''}${over && !isLiar && !isStairs ? ' dim' : ''}`}
                style={style}
                data-file={i}
                data-id={f.id}
                aria-label={`File ${i + 1}: ${f.name}, ${f.role}`}
                onClick={() => { if (sel !== i) open(i); }}
              >
                <div className="sw-label">
                  {showKeys && <span className="sw-key" aria-hidden="true">{i + 1}</span>}
                  <span className="sw-no">File {i + 1}</span>
                  <b>{f.name}</b>
                  <em>{f.role}</em>
                </div>
                <div className="sw-sheet">
                  <i className="sw-clip" aria-hidden="true" />
                  <div className="sw-head">Statement · 21:40</div>
                  <ul className="sw-lines">
                    {f.lines.map((l, li) => {
                      const struck = st.struck.includes(lineKey(i, li));
                      const looking = look?.file === i && look.line === li;
                      return (
                        <li key={li} className={`sw-row${struck ? ' struck' : ''}${looking ? ' look' : ''}`}>
                          <button
                            type="button"
                            className="sw-line"
                            data-line={li}
                            aria-pressed={looking}
                            disabled={paused}
                            onClick={(e) => { letGo(e); open(i, li); }}
                          >
                            <span className="sw-txt">{l.text}</span>
                          </button>
                          <button
                            type="button"
                            className="sw-strike"
                            data-strike={li}
                            aria-pressed={struck}
                            aria-label={struck ? 'Bring this line back' : 'Strike this line out'}
                            disabled={locked}
                            onClick={(e) => { letGo(e); strike(i, li); }}
                          >
                            <span aria-hidden="true">{struck ? '↺' : '✕'}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="sw-inkrow">
                    {st.liar === i && <span key={`liar${i}`} className={`sw-ink liar${over ? (isLiar ? ' right' : ' wrong') : ''}`}>Liar</span>}
                    {st.stairs === i && <span key={`stairs${i}`} className={`sw-ink stairs${over ? (isStairs ? ' right' : ' wrong') : ''}`}>In the stairwell</span>}
                    {over && isLiar && st.liar !== i && <span className="sw-ink liar truth" aria-hidden="true">Liar</span>}
                    {over && isStairs && st.stairs !== i && <span className="sw-ink stairs truth" aria-hidden="true">In the stairwell</span>}
                  </div>
                </div>
                <div className="sw-stamps">
                  <button
                    type="button"
                    className={`sw-sbtn liar${st.liar === i ? ' on' : ''}`}
                    data-stamp="liar"
                    aria-pressed={st.liar === i}
                    disabled={locked}
                    onClick={(e) => { letGo(e); stamp('liar', i); }}
                  >
                    {showKeys && sel === i && <span className="sw-key" aria-hidden="true">L</span>}
                    {st.liar === i ? `Liar ${over && !isLiar ? '✗' : '✓'}` : 'Stamp liar'}
                  </button>
                  <button
                    type="button"
                    className={`sw-sbtn stairs${st.stairs === i ? ' on' : ''}`}
                    data-stamp="stairs"
                    aria-pressed={st.stairs === i}
                    disabled={locked}
                    onClick={(e) => { letGo(e); stamp('stairs', i); }}
                  >
                    {showKeys && sel === i && <span className="sw-key" aria-hidden="true">S</span>}
                    {st.stairs === i ? `Stairwell ${over && !isStairs ? '✗' : '✓'}` : 'Stamp stairwell'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="sw-bar">
        <ul className="sw-slips" aria-label="Your stamps">
          <li className={`liar${st.liar !== null ? ' set' : ''}`}>
            <span>Liar</span><b data-slip="liar">{who(st.liar)}</b>
            {over && <em className={st.liar === setup.liar ? 'ok' : 'bad'}>{st.liar === setup.liar ? 'Right' : `It was ${calls[setup.liar]}`}</em>}
          </li>
          <li className={`stairs${st.stairs !== null ? ' set' : ''}`}>
            <span>In the stairwell</span><b data-slip="stairs">{who(st.stairs)}</b>
            {over && <em className={st.stairs === setup.stairs ? 'ok' : 'bad'}>{st.stairs === setup.stairs ? 'Right' : `It was ${calls[setup.stairs]}`}</em>}
          </li>
        </ul>
        <button type="button" className="btn btn-primary sw-close" disabled={!ready || locked} onClick={(e) => { letGo(e); close(); }}>
          {showKeys && ready && <span className="sw-key" aria-hidden="true">Enter</span>}
          Close the case
        </button>
        <div className="sw-help">
          {over
            ? ''
            : showKeys
              ? `1–${n} files · ← → · ↑ ↓ lines · X strike · L liar · S stairwell`
              : ready ? 'Both stamps are down. Close the case when you are sure.' : 'Stamp the liar and who was in the stairwell.'}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BudgetEvent, BudgetSetup, BudgetState } from '../../game/minigames/budget';
import {
  announced, budgetClock, budgetMove, budgetScore, budgetStart, budgetTickTo, canPut, canTake, eventTarget, JAR_CAP, unspent,
} from '../../game/minigames/budget';
import { DISPLAY_FACTIONS } from '../../game/display';
import { useMedia } from '../useMedia';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * BUDGET NIGHT — the Finance Ministry desk. Rules in game/minigames/
 * budget.ts; this runs the clock and turns taps and keys into $1B moves.
 *
 * Look: a bright desk (owner's choice) — light oak, a sage-green leather
 * blotter, Kel Brask's slips on cream paper, a brass cash box for the
 * unspent money, and five glass jars of banknotes, one per faction, each
 * with a red line (the least it accepts) and a patience bar above it. A desk
 * clock runs from 18:30 to 20:00 (a second of play is a minute). Notes fly
 * between the cash box and the jars; a slip slides in before every change
 * and drops onto the desk when it lands; a faction that walks out gets a
 * red stamp and its jar is sealed.
 *
 * Touch: + and − under each jar (pointer-down, so a quick tap never also
 * lands on something else). Keyboard (laptops; owner, 2026-10-06: trackpad
 * players "can't click fast enough"): 1–5 pick a jar, ↑/↓ (or +/−) move
 * $1B, ←/→ move along. The keys are shown only with a mouse or trackpad.
 * Reduce Motion: the evening runs 1.5× slower and things fade instead of fly.
 */

/** A mouse or trackpad is attached: show the keys. */
const FINE_POINTER = '(any-pointer: fine)';
/** Reduce Motion: the evening runs this much slower */
const CALM_SLOW = 1.5;
/** the factions as they appear in a sentence */
const IN_A_SENTENCE = ['the Army', 'Security', 'the Elites', 'the Workers', 'the Street'];
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

interface Flyer { key: number; x0: number; y0: number; x1: number; y1: number }

function slipTitle(ev: BudgetEvent, jar: number) {
  if (ev.kind === 'cut' || ev.kind === 'add') return { icon: '$', name: 'Budget' };
  const f = DISPLAY_FACTIONS[jar];
  return { icon: f.icon, name: f.label };
}

export function BudgetGame({ setup, reduced, paused, onEnd }: {
  setup: BudgetSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  // every change goes through stRef, so a tap and a tick never overwrite each other
  const first = useRef<BudgetState | null>(null);
  first.current ??= budgetStart(setup);
  const stRef = useRef<BudgetState>(first.current);
  const [st, setSt] = useState<BudgetState>(first.current);
  const commit = (s: BudgetState) => { if (s !== stRef.current) { stRef.current = s; setSt(s); } };

  const clock = useClock(!paused && !st.over);
  const now = reduced ? clock / CALM_SLOW : clock;
  const [sel, setSel] = useState(0);
  // the selected jar is shown once the keyboard has been used
  const [usedKeys, setUsedKeys] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [nudge, setNudge] = useState<{ jar: number; n: number } | null>(null);
  const flyKey = useRef(0);
  const ended = useRef(false);
  const deskRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const glassRefs = useRef<(HTMLDivElement | null)[]>([]);
  const showKeys = useMedia(FINE_POINTER);

  // advance the evening to the clock, in whole steps
  useEffect(() => { commit(budgetTickTo(stRef.current, now)); }, [now]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const gone = st.log.filter((l) => l.kind === 'walk').map((l) => IN_A_SENTENCE[l.jar]);
    const t = window.setTimeout(() => onEnd({
      won,
      score: budgetScore(st),
      headline: won
        ? (gone.length === 0 ? 'The numbers added up at eight.' : 'One walk-out, but the budget passed.')
        : 'Two walk-outs. The budget fell apart.',
      detail: won
        ? `${gone.length === 0 ? 'Nobody walked out.' : `${cap(gone[0])} walked out.`} You moved $${st.moved}B between the jars.`
        : `${cap(gone[0] ?? 'one faction')} and ${gone[1] ?? 'another'} walked out at ${budgetClock(st.t)}. One walk-out was allowed.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, onEnd, reduced]);

  /** a banknote flying between the cash box and a jar */
  const fly = (jar: number, dir: 1 | -1) => {
    if (reduced) return;
    const desk = deskRef.current?.getBoundingClientRect();
    const tray = trayRef.current?.getBoundingClientRect();
    const glass = glassRefs.current[jar]?.getBoundingClientRect();
    if (!desk || !tray || !glass) return;
    const a = { x: tray.left + tray.width / 2 - desk.left, y: tray.top + tray.height / 2 - desk.top };
    const b = { x: glass.left + glass.width / 2 - desk.left, y: glass.top + 6 - desk.top };
    const [p, q] = dir === 1 ? [a, b] : [b, a];
    const key = ++flyKey.current;
    setFlyers((f) => [...f.slice(-11), { key, x0: p.x, y0: p.y, x1: q.x, y1: q.y }]);
    window.setTimeout(() => setFlyers((f) => f.filter((x) => x.key !== key)), 520);
  };

  const press = (jar: number, dir: 1 | -1) => {
    if (paused || stRef.current.over) return;
    setSel(jar);
    const before = stRef.current;
    const after = budgetMove(before, jar, dir);
    if (after === before) { setNudge({ jar, n: (nudge?.n ?? 0) + 1 }); return; }
    commit(after);
    fly(jar, dir);
  };

  // keys: 1–5 pick a jar, ↑/↓ or +/− move $1B, ←/→ move along
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || stRef.current.over || e.ctrlKey || e.metaKey || e.altKey) return;
      const digit = /^[1-5]$/.test(e.key) ? Number(e.key) : /^Numpad[1-5]$/.test(e.code) ? Number(e.code.slice(6)) : null;
      if (digit !== null) { e.preventDefault(); setUsedKeys(true); setSel(digit - 1); return; }
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') { e.preventDefault(); setUsedKeys(true); press(sel, 1); }
      else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') { e.preventDefault(); setUsedKeys(true); press(sel, -1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setUsedKeys(true); setSel((x) => (x + 4) % 5); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setUsedKeys(true); setSel((x) => (x + 1) % 5); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const d = setup.d;
  const u = unspent(st);
  const slips = announced(st);
  const cutComing = slips.find((e) => e.kind === 'cut');
  // slips that just landed drop onto the desk for a moment
  const landed = st.log.filter((l) => l.kind !== 'walk' && st.t - l.t < 700);
  const recent = st.log.filter((l) => st.t - l.t < 1100);
  const active = st.jars.filter((j) => !j.out);
  const avail = st.pot - st.jars.filter((j) => j.out).reduce((a, j) => a + j.money, 0);
  const need = active.reduce((a, j) => a + j.line, 0);
  const squeeze = need > avail;
  const short = st.jars.some((j) => !j.out && j.money < j.line);
  const surplus = st.jars.some((j) => !j.out && j.money > j.line);
  const minute = Math.min(90, st.t / 1000);

  const help = st.over
    ? (st.over === 'won' ? 'Eight o\'clock. The budget goes in.' : 'Too many walk-outs.')
    : squeeze ? 'Not enough for everyone. Choose who waits, and swap before anyone runs out.'
      : short && u > 0 ? 'A red line is not met: put money in that jar.'
        : short ? 'Take money out of a jar above its line, then put it where it is short.'
          : cutComing && u < cutComing.amount ? 'A cut is coming. Keep some money unspent, or Brask takes it from a jar.'
            : slips.some((e) => e.kind === 'up') ? 'A line is about to go up. Put the money in now.'
              : surplus ? 'Money above a line does nothing. Take it back for later.'
                : 'Every line is met. Watch for Brask\'s next slip.';

  return (
    <div className={`bn${squeeze ? ' squeeze' : ''}`} data-t={st.t}>
      <div className="bn-desk" ref={deskRef} data-clip>
        <div className="bn-top">
          <div className="bn-hud">
            <div className="bn-clock" aria-label={`${budgetClock(st.t)}. The vote is at 20:00.`}>
              <span className="bn-face" aria-hidden="true" style={{ ['--hr' as string]: `${195 + minute * 0.5}deg`, ['--mn' as string]: `${180 + minute * 6}deg` } as CSSProperties}>
                <i className="h" /><i className="m" /><i className="pin" />
              </span>
              <span className="bn-time"><b>{budgetClock(st.t)}</b><em>vote at 20:00</em></span>
            </div>
            <div className="bn-walks" aria-label={`${st.walkouts} walk-out${st.walkouts === 1 ? '' : 's'}, ${d.walkoutsAllowed} allowed`}>
              <em>Walk-outs</em>
              {Array.from({ length: d.walkoutsAllowed + 1 }, (_, i) => <i key={i} className={i < st.walkouts ? 'x' : ''} />)}
            </div>
          </div>
          <div className="bn-slips" aria-live="polite">
            {slips.length === 0 && landed.length === 0 && <span className="bn-noslip">Brask's next slip…</span>}
            {landed.map((l) => {
              const ev = setup.events[l.id];
              const { icon, name } = slipTitle(ev, l.jar);
              return (
                <div key={`s${l.id}`} className={`bn-slip k-${ev.kind} landed`} aria-hidden="true" style={{ ['--to' as string]: l.jar < 0 ? '0px' : `${(l.jar - 2) * 60}px` } as CSSProperties}>
                  <span className="bn-slip-who"><i>{icon}</i>{name}</span>
                  <b className="bn-slip-amt">{ev.kind === 'up' || ev.kind === 'add' ? '+' : '−'}${ev.amount}B</b>
                  <span className="bn-slip-why">{ev.why}</span>
                </div>
              );
            })}
            {slips.map((ev) => {
              const jar = eventTarget(st, ev);
              const { icon, name } = slipTitle(ev, jar);
              const left = Math.max(0, ev.at - st.t);
              return (
                <div
                  key={`s${ev.id}`}
                  className={`bn-slip k-${ev.kind}`}
                  data-kind={ev.kind}
                  data-jar={jar}
                  data-amount={ev.amount}
                  data-in={left}
                  aria-label={`${name}: ${ev.kind === 'up' ? 'line up' : ev.kind === 'down' ? 'line down' : ev.kind === 'cut' ? 'budget cut' : 'more money'} by $${ev.amount}B in ${Math.ceil(left / 1000)} seconds`}
                >
                  <span className="bn-slip-who"><i>{icon}</i>{name}</span>
                  <b className="bn-slip-amt">{ev.kind === 'up' || ev.kind === 'add' ? '+' : '−'}${ev.amount}B</b>
                  <span className="bn-slip-why">{ev.kind === 'up' ? `line up · ${ev.why}` : ev.kind === 'down' ? `line down · ${ev.why}` : ev.why}</span>
                  <span className="bn-slip-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (left / d.leadMs) * 100)}%` }} /></span>
                </div>
              );
            })}
          </div>
          <div
            ref={trayRef}
            className={`bn-tray${u === 0 ? ' empty' : ''}${cutComing && u < cutComing.amount ? ' warn' : ''}${recent.some((l) => l.kind === 'cut') ? ' hit' : ''}${recent.some((l) => l.kind === 'add') ? ' gain' : ''}`}
            data-unspent={u}
            aria-label={`$${u}B unspent`}
          >
            <span className="bn-notes" aria-hidden="true">
              {Array.from({ length: Math.min(6, u) }, (_, i) => <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />)}
            </span>
            <span className="bn-tray-txt"><em>Unspent</em><b>${u}B</b></span>
            {squeeze && <span className="bn-short">Short ${need - avail}B</span>}
          </div>
        </div>

        <div className="bn-jars">
          {st.jars.map((j, i) => {
            const f = DISPLAY_FACTIONS[i];
            const isShort = !j.out && j.money < j.line;
            const pat = Math.round(j.patience);
            const pop = recent.filter((l) => l.jar === i && (l.kind === 'up' || l.kind === 'down')).pop();
            const took = recent.filter((l) => l.kind === 'cut' && l.took?.[i]).pop()?.took?.[i] ?? 0;
            const walked = recent.some((l) => l.kind === 'walk' && l.jar === i);
            return (
              <div
                key={f.id}
                className={`bn-jar${isShort ? ' short' : ''}${!j.out && pat < 35 ? ' low' : ''}${j.out ? ' out' : ''}${!j.out && j.money > j.line ? ' over' : ''}${showKeys && usedKeys && sel === i ? ' sel' : ''}${walked ? ' slam' : ''}${nudge?.jar === i ? ` nudge${nudge.n % 2}` : ''}`}
                data-jar={i}
                data-money={j.money}
                data-line={j.line}
                data-patience={pat}
                data-out={j.out ? 1 : 0}
                onPointerDown={() => setSel(i)}
              >
                <div className="bn-who">
                  <span className="bn-ico" aria-hidden="true">{f.icon}</span>
                  <span className="bn-name">{f.label}</span>
                  {showKeys && <kbd className="bn-key">{i + 1}</kbd>}
                </div>
                <div className="bn-pat" role="meter" aria-label={`${f.label} patience`} aria-valuenow={pat} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${pat}%` }} />
                </div>
                <div className="bn-glass" ref={(el) => { glassRefs.current[i] = el; }}>
                  <div className="bn-fill" style={{ height: `${(Math.min(JAR_CAP, j.money) / JAR_CAP) * 100}%` }} />
                  {j.money > j.line && (
                    // money above the line does nothing: hatched
                    <div className="bn-waste" aria-hidden="true" style={{ bottom: `${(j.line / JAR_CAP) * 100}%`, height: `${((Math.min(JAR_CAP, j.money) - j.line) / JAR_CAP) * 100}%` }} />
                  )}
                  <div className="bn-line" style={{ bottom: `${(Math.min(JAR_CAP, j.line) / JAR_CAP) * 100}%` }}>
                    <span className="bn-tag">${j.line}B</span>
                  </div>
                  {pop && (
                    <span key={`p${pop.id}`} className={`bn-pop ${pop.kind}`} aria-hidden="true">
                      {pop.kind === 'up' ? '+' : '−'}${pop.amount}B
                    </span>
                  )}
                  {took > 0 && <span key={`t${st.next}`} className="bn-pop took" aria-hidden="true">−${took}B</span>}
                  {j.out && <span className="bn-stamp">Walked out</span>}
                </div>
                <div className="bn-amt"><b>${j.money}B</b></div>
                <div className="bn-btns">
                  <button
                    type="button"
                    className="bn-btn minus"
                    disabled={paused || !canTake(st, i)}
                    aria-label={`Take $1B out of the ${f.label} jar`}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); press(i, -1); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(i, -1); } }}
                  >−</button>
                  <button
                    type="button"
                    className="bn-btn plus"
                    disabled={paused || !canPut(st, i)}
                    aria-label={`Put $1B into the ${f.label} jar`}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); press(i, 1); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(i, 1); } }}
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>

        {flyers.map((x) => (
          <span
            key={x.key}
            className="bn-flyer"
            aria-hidden="true"
            style={{ left: x.x0, top: x.y0, ['--dx' as string]: `${x.x1 - x.x0}px`, ['--dy' as string]: `${x.y1 - x.y0}px` } as CSSProperties}
          />
        ))}
      </div>

      <div className="bn-help" aria-live="polite">{help}</div>
      {showKeys && <div className="bn-keys">Keys: <kbd>1</kbd>–<kbd>5</kbd> pick a jar · <kbd>↑</kbd> <kbd>↓</kbd> move $1B</div>}
    </div>
  );
}

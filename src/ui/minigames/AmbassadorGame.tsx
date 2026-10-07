import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { AmbassadorSetup, AmbassadorState, LineId, Reaction, RoundLog, Tells } from '../../game/minigames/ambassador';
import {
  ambassadorOffer, ambassadorScore, ambassadorStart, COURSES, LINES, offerPrices, OFFER_COUNT, OFFER_STEP, readTells, ROUNDS, TELLS,
} from '../../game/minigames/ambassador';
import { useMedia } from '../useMedia';
import type { MinigameEnd } from './MinigameScreen';

/**
 * THE AMBASSADOR'S TABLE — a candlelit dinner. Rules in game/minigames/
 * ambassador.ts; this plays the scene and turns taps and keys into an offer
 * and a line.
 *
 * Look (owner: warm and rich, not dark like the archive): a claret dining
 * room, a white tablecloth, two candles that flicker, and the ambassador
 * across the table. Five courses arrive, one per round. His three tells are
 * drawn, not written: his FACE (smile → frown → jaw set), his GLASS (sipped →
 * left alone → pushed away) and his NOTEBOOK (numbers → crossed out →
 * closed). Under the picture the same three are named in words, so nobody has
 * to guess what a drawing means. Your offer slides across the table on a
 * card; he answers; the glass, the notebook and the face change. A deal is
 * signed on the card and toasted. A walk-out: the napkin drops, the chair
 * scrapes back and he leaves.
 *
 * Calm, no timer. Touch: tap a price, tap a line, tap "Make the offer".
 * Keyboard (laptops): 1–5 pick the price, 6–9 pick the line, Enter to say
 * it (Enter also skips the wait). The keys show only with a mouse or
 * trackpad. Reduce Motion: shorter pauses, fades instead of movement, the
 * tells keep a still picture of each state.
 */

const FINE_POINTER = '(any-pointer: fine)';

const LINE_WORDS: Record<LineId, { label: string; say: string }> = {
  flatter: { label: 'Flatter him', say: 'Everyone says you are the best negotiator in Ostrene.' },
  history: { label: 'Shared history', say: 'Our countries have shared one pipe for sixty years.' },
  firm: { label: 'Stand firm', say: 'That is my offer. I will not move.' },
  threaten: { label: 'Mention Sereth', say: 'Sereth would sell us gas tomorrow.' },
};
const REACTION_WORDS: Record<Reaction, { tag: string; note: string }> = {
  delighted: { tag: 'Loved it', note: 'He loved that.' },
  pleased: { tag: 'Liked it', note: 'He liked that.' },
  cool: { tag: 'Went cold', note: 'That went cold.' },
  offended: { tag: 'Offended him', note: 'That offended him.' },
};
const TELL_NAMES = { face: 'Face', glass: 'Glass', notes: 'Notes' } as const;
/** by level: 0 about to stand, 1 irritated, 2 relaxed */
const TELL_STATES = {
  face: ['About to stand', 'Irritated', 'Relaxed'],
  glass: ['Pushed away', 'Untouched', 'Sipping'],
  notes: ['Closed', 'Crossing out', 'Writing numbers'],
} as const;
const HEAD_NOD = { delighted: 'laugh', pleased: 'nod', cool: 'cool', offended: 'shake' } as const;

const money = (n: number) => `$${n}`;

/** What he says. Same dinner, same words (picked by round and offer, never by chance). */
function hisWords(e: RoundLog, round: number, index: number): string {
  if (e.verdict === 'deal') return ['Done. We have a price.', `Agreed. ${money(e.offer)} it is.`, 'Done. Now we can eat.'][(round + index) % 3];
  if (e.verdict === 'walkout') return 'I think I have heard enough. Good evening.';
  if (e.verdict === 'dessert') return 'We have run out of courses. We will talk again, perhaps.';
  const pre = { delighted: 'Ha! ', pleased: 'Hm. ', cool: '', offended: 'Please. ' }[e.reaction];
  const c = money(e.counter ?? e.offer);
  const body = [`Too low. I can do ${c}.`, `${c}. That is already generous.`, `Come now. ${c}, and we eat.`, `${c}. I will not say it twice.`, `You flatter yourself. ${c}.`][(round * 2 + index) % 5];
  return pre + body;
}

type Stage = 'offer' | 'line' | 'reply';
interface Beat { key: number; index: number; line: LineId; entry: RoundLog; next: AmbassadorState; stage: Stage }
type Phase = 'choose' | 'speak' | 'over';

export function AmbassadorGame({ setup, reduced, paused, onEnd }: {
  setup: AmbassadorSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const first = useRef<AmbassadorState | null>(null);
  first.current ??= ambassadorStart(setup);
  const [st, setSt] = useState<AmbassadorState>(first.current);
  const [course, setCourse] = useState(0);
  const [phase, setPhase] = useState<Phase>('choose');
  const [pick, setPick] = useState<number | null>(null);
  const [line, setLine] = useState<LineId | null>(null);
  const [beat, setBeat] = useState<Beat | null>(null);
  const [finished, setFinished] = useState(false);
  /** the course the waiter is taking away while the next one arrives */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [usedKeys, setUsedKeys] = useState(false);
  const showKeys = useMedia(FINE_POINTER);

  const beatRef = useRef<Beat | null>(null);
  const stRef = useRef(st);
  const replied = useRef(false);
  const beatKey = useRef(0);
  const timers = useRef<number[]>([]);
  const ended = useRef(false);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clearTimers, []);

  /** all the pauses shrink under Reduce Motion */
  const k = reduced ? 0.45 : 1;
  const tells: Tells = readTells(st);
  const prices = offerPrices(st);
  const over = st.over;

  /** after his answer: the next course, or the end of the dinner */
  const settle = (next: AmbassadorState) => {
    if (next.over) return;
    setLeaving(course);
    later(900 * k, () => setLeaving(null));
    setCourse(next.round - 1);
    setPhase('choose');
    setBeat(null);
    beatRef.current = null;
    setPick(null);
  };

  /** his answer: the tells, the price and his words all change now */
  const reply = () => {
    const b = beatRef.current;
    if (!b || replied.current) return;
    replied.current = true;
    const next = b.next;
    stRef.current = next;
    setSt(next);
    const nb = { ...b, stage: 'reply' as Stage };
    beatRef.current = nb;
    setBeat(nb);
    if (next.over) {
      setPhase('over');
      later(2300 * k, () => setFinished(true));
    } else {
      later(1700 * k, () => settle(next));
    }
  };

  const confirm = () => {
    if (phase !== 'choose' || pick === null || line === null || paused || stRef.current.over) return;
    const next = ambassadorOffer(stRef.current, pick, line);
    const entry = next.log[next.log.length - 1];
    const b: Beat = { key: ++beatKey.current, index: pick, line, entry, next, stage: 'offer' };
    beatRef.current = b;
    replied.current = false;
    setBeat(b);
    setPhase('speak');
    later(650 * k, () => { const cur = beatRef.current; if (cur && !replied.current) { const nb = { ...cur, stage: 'line' as Stage }; beatRef.current = nb; setBeat(nb); } });
    later(1700 * k, reply);
  };

  /** Enter or a tap on the scene while he is answering: skip the wait */
  const skip = () => {
    if (phase !== 'speak') return;
    clearTimers();
    if (!replied.current) { reply(); return; }
    settle(stRef.current);
  };

  // the end: words for the result, once the last animation has played
  useEffect(() => {
    if (!finished || paused || ended.current) return;
    ended.current = true;
    const e = describeEnd(st);
    onEnd(e);
  }, [finished, paused, st, onEnd]);

  // keys: 1–5 the price, 6–9 the line, Enter to say it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || e.ctrlKey || e.metaKey || e.altKey) return;
      const digit = /^[1-9]$/.test(e.key) ? Number(e.key) : /^Numpad[1-9]$/.test(e.code) ? Number(e.code.slice(6)) : null;
      if (digit !== null) {
        if (phase !== 'choose') return;
        e.preventDefault();
        setUsedKeys(true);
        if (digit <= OFFER_COUNT) setPick(digit - 1);
        else if (digit - OFFER_COUNT <= LINES.length) setLine(LINES[digit - OFFER_COUNT - 1]);
        return;
      }
      if (e.key === 'Enter') {
        const t = e.target as HTMLElement | null;
        // a focused chip keeps its own Enter (it selects itself)
        if (t && t !== document.body && !t.classList.contains('am-go')) return;
        e.preventDefault();
        setUsedKeys(true);
        if (phase === 'choose') confirm(); else skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const blurMouse = (e: MouseEvent<HTMLElement>) => { if (e.detail > 0) e.currentTarget.blur(); };

  /** what each line did last time he heard it */
  const seen: Partial<Record<LineId, Reaction>> = {};
  for (const h of st.log) seen[h.line] = h.reaction;

  const last = st.log[st.log.length - 1];
  const stage = beat?.stage;
  const shownEntry = stage === 'reply' ? beat!.entry : null;
  const summary = last
    ? `${COURSES[Math.max(0, Math.min(ROUNDS - 1, last.round - 1))]}: you offered ${money(last.offer)} and said "${LINE_WORDS[last.line].label}". ${REACTION_WORDS[last.reaction].note}${last.verdict === 'counter' ? ` He asks ${money(last.counter!)}.` : last.verdict === 'deal' ? ' He signed.' : last.verdict === 'walkout' ? ' He left.' : ' No deal.'}`
    : 'Pick a price to offer and a line to say.';

  const goLabel = pick === null ? 'Pick a price' : line === null ? 'Pick a line' : 'Make the offer →';
  const ready = phase === 'choose' && pick !== null && line !== null && !paused;
  const dealPrice = st.deal;

  return (
    <div
      className={`am${reduced ? ' calm' : ''}`}
      data-phase={phase}
      data-round={st.round}
      data-price={st.price}
      data-over={over ?? ''}
      data-pick={pick ?? ''}
    >
      <div className="am-hud">
        <ol className="am-courses" aria-label={`Course ${course + 1} of ${ROUNDS}: ${COURSES[course]}`}>
          {COURSES.map((c, i) => (
            <li key={c} className={i < course ? 'done' : i === course ? 'now' : ''} data-course={i}>
              <span className="am-pl" aria-hidden="true" />
              <span className="am-cn">{c}</span>
            </li>
          ))}
        </ol>
        <div className="am-board" aria-label={`He asks ${money(st.price)} per 1,000 cubic metres`}>
          <span className="am-board-k">{over === 'won' ? 'Signed at' : 'He asks'}</span>
          <b key={over === 'won' ? `d${dealPrice}` : st.price} className="am-board-v">{money(over === 'won' && dealPrice !== undefined ? dealPrice : st.price)}</b>
          <span className="am-board-u">per 1,000 m³ of gas</span>
          {st.log.length > 0 && over !== 'won' && <span className="am-board-was">opened at {money(setup.ask)}</span>}
        </div>
      </div>

      <div className="am-stage" onClick={skip} data-clip>
        <Scene
          tells={tells}
          course={course}
          leaving={leaving}
          round={st.round}
          price={st.price}
          beat={beat}
          shown={shownEntry}
          over={over}
          reduced={reduced}
        />
        {beat && beat.stage !== 'offer' && (
          <div key={`m${beat.key}`} className="am-say me" aria-hidden="true">{LINE_WORDS[beat.line].say}</div>
        )}
        {shownEntry && (
          <div key={`h${beat!.key}`} className={`am-say him r-${shownEntry.reaction} v-${shownEntry.verdict}`} data-reaction={shownEntry.reaction}>
            {hisWords(shownEntry, shownEntry.round, beat!.index)}
          </div>
        )}
      </div>

      <ul className="am-tells" aria-label="His tells">
        {TELLS.map((t) => {
          const lv = tells[t].level;
          return (
            <li key={t} className="am-tell" data-tell={t} data-level={lv}>
              <span className="am-tell-k"><TellIcon tell={t} />{TELL_NAMES[t]}</span>
              <span className="am-tell-v"><i aria-hidden="true" />{TELL_STATES[t][lv]}</span>
            </li>
          );
        })}
      </ul>

      <p className="am-last" aria-live="polite">{summary}</p>

      <div className="am-panel">
        <div className="am-group">
          <div className="am-label">Your offer <span>per 1,000 m³</span></div>
          <div className="am-offers" role="group" aria-label="Your offer">
            {prices.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`am-offer${pick === i ? ' on' : ''}${i === OFFER_COUNT - 1 ? ' his' : ''}`}
                data-idx={i}
                data-price={p}
                aria-pressed={pick === i}
                disabled={phase !== 'choose' || paused}
                onClick={(e) => { blurMouse(e); setPick(i); }}
              >
                {showKeys && usedKeys && <kbd>{i + 1}</kbd>}
                <b>{money(p)}</b>
                <em>{i === OFFER_COUNT - 1 ? 'his price' : `−$${(OFFER_COUNT - 1 - i) * OFFER_STEP}`}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="am-group">
          <div className="am-label">Your line</div>
          <div className="am-lines" role="group" aria-label="Your line">
            {LINES.map((l, i) => {
              const r = seen[l];
              return (
                <button
                  key={l}
                  type="button"
                  className={`am-line${line === l ? ' on' : ''}${r ? ` s-${r}` : ''}`}
                  data-line={l}
                  data-seen={r ?? ''}
                  aria-pressed={line === l}
                  disabled={phase !== 'choose' || paused}
                  onClick={(e) => { blurMouse(e); setLine(l); }}
                >
                  {showKeys && usedKeys && <kbd>{OFFER_COUNT + 1 + i}</kbd>}
                  <b>{LINE_WORDS[l].label}</b>
                  {r && <em>{REACTION_WORDS[r].tag}</em>}
                </button>
              );
            })}
          </div>
        </div>
        <button type="button" className="am-go btn btn-primary" disabled={!ready} onClick={(e) => { blurMouse(e); confirm(); }}>
          {phase === 'choose' ? goLabel : over ? '…' : 'He is answering…'}
        </button>
        {showKeys && (
          <div className="am-keys">
            Keys: <kbd>1</kbd>–<kbd>{OFFER_COUNT}</kbd> price · <kbd>{OFFER_COUNT + 1}</kbd>–<kbd>{OFFER_COUNT + LINES.length}</kbd> line · <kbd>Enter</kbd> say it
          </div>
        )}
      </div>
    </div>
  );
}

/** A small drawing of the thing a tell is about, so the words and the picture go together. */
function TellIcon({ tell }: { tell: 'face' | 'glass' | 'notes' }) {
  return (
    <svg className="am-ti" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {tell === 'face' && (<><circle cx="8" cy="8" r="6" /><circle cx="5.6" cy="6.6" r=".5" fill="currentColor" /><circle cx="10.4" cy="6.6" r=".5" fill="currentColor" /><path d="M5.4,10 Q8,12 10.6,10" /></>)}
      {tell === 'glass' && (<><path d="M4.6,1.8 L11.4,1.8 C11.6,6.4 10,8.4 8,8.6 C6,8.4 4.4,6.4 4.6,1.8Z" /><path d="M8,8.6 L8,13.4 M5.4,14 L10.6,14" /></>)}
      {tell === 'notes' && (<><rect x="3" y="2" width="10" height="12" rx="1.2" /><path d="M5.6,5.4 L10.4,5.4 M5.6,8 L10.4,8 M5.6,10.6 L8.6,10.6" /></>)}
    </svg>
  );
}

/** The words of the result screen. */
function describeEnd(st: AmbassadorState): MinigameEnd {
  const { ask, floor } = st.setup;
  const last = st.log[st.log.length - 1];
  const course = COURSES[Math.max(0, Math.min(ROUNDS - 1, (last?.round ?? 1) - 1))].toLowerCase();
  if (st.over === 'won' && st.deal !== undefined) {
    const score = ambassadorScore(st);
    return {
      won: true,
      score,
      headline: score >= 85 ? `He signed at ${money(st.deal)}. Better than hoped.` : `A deal at ${money(st.deal)}.`,
      detail: `He opened at ${money(ask)} per 1,000 m³ and signed ${money(ask - st.deal)} lower. He would have gone as low as ${money(floor)}.`,
    };
  }
  if (st.over === 'walked') {
    return {
      won: false,
      score: 0,
      headline: `He walked out during the ${course}.`,
      detail: `You offered ${money(last.offer)}. It was too far under his price. Watch his face, his glass and his notes, and take his price when they turn.`,
    };
  }
  return {
    won: false,
    score: 0,
    headline: 'Dessert came and went with no deal.',
    detail: 'You went through all five courses without agreeing a price. His price was always there to take.',
  };
}

/* ====================================================================== */
/*                               THE SCENE                                */
/* ====================================================================== */

function Flame({ x, y, s = 1, d = 0 }: { x: number; y: number; s?: number; d?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="am-flame" style={{ animationDelay: `${d}s` }}>
        <path d="M0,0 C-5.5,-6 -4,-14 0,-24 C4,-14 5.5,-6 0,0Z" fill="url(#amz-flame)" />
        <path d="M0,-1 C-2.2,-4 -1.6,-9 0,-14 C1.6,-9 2.2,-4 0,-1Z" fill="#fff6cf" opacity=".9" />
      </g>
    </g>
  );
}

function Candle({ x, d }: { x: number; d: number }) {
  return (
    <g className="am-candle">
      <circle className="am-glow" cx={x} cy="150" r="82" fill="url(#amz-glow)" style={{ animationDelay: `${d}s` }} />
      {/* brass stick, taper candle, flame */}
      <ellipse cx={x} cy="198" rx="15" ry="4.5" fill="#8a6418" />
      <path d={`M${x - 3},197 L${x - 2},174 L${x + 2},174 L${x + 3},197Z`} fill="#c79a3b" />
      <ellipse cx={x} cy="173" rx="7" ry="2.2" fill="#e0b455" />
      <rect x={x - 3.6} y="136" width="7.2" height="38" rx="1.6" fill="url(#amz-wax)" />
      <ellipse cx={x} cy="136" rx="3.6" ry="1.2" fill="#fff3d4" />
      <path d={`M${x - 3.6},140 q-1.4,7 0,10`} stroke="#fff6e0" strokeWidth="1.6" fill="none" opacity=".8" />
      <Flame x={x} y={134} s={1.15} d={d} />
    </g>
  );
}

/** A sleeve and cuff reaching in from behind the table to a hand. */
function Sleeve({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = to[0] - (dx / len) * 6;
  const cy = to[1] - (dy / len) * 6;
  return (
    <g>
      <path d={`M${from[0]},${from[1]} L${to[0]},${to[1]}`} stroke="#2a3050" strokeWidth="13" strokeLinecap="round" />
      <path d={`M${cx - (dy / len) * 6.5},${cy + (dx / len) * 6.5} L${cx + (dy / len) * 6.5},${cy - (dx / len) * 6.5}`} stroke="#fbf8f0" strokeWidth="4" strokeLinecap="butt" />
    </g>
  );
}

/** One course on his plate, drawn flat on the cloth. */
function Dish({ course }: { course: number }) {
  return (
    <g>
      <ellipse cx="0" cy="3.5" rx="47" ry="10.5" fill="rgba(60,30,10,.22)" />
      <ellipse cx="0" cy="0" rx="46" ry="10.5" fill="#fffdf8" stroke="#d8c9a8" strokeWidth=".8" />
      <ellipse cx="0" cy="0" rx="35" ry="7.2" fill="none" stroke="#d9b65a" strokeWidth=".9" />
      {course === 0 && (
        <g>
          <ellipse cx="0" cy="-1" rx="27" ry="6.2" fill="#fff" stroke="#e7dcc3" strokeWidth=".7" />
          <ellipse cx="0" cy="-1.4" rx="23" ry="4.8" fill="#d9772a" />
          <ellipse cx="-5" cy="-2.4" rx="9" ry="1.8" fill="#eca24f" opacity=".8" />
          <path d="M-9,-1 q5,-3 10,0 q5,3 10,0" stroke="#fbe9c8" strokeWidth="1.6" fill="none" />
          <circle cx="4" cy="-2.2" r="1" fill="#4f8a3c" /><circle cx="-7" cy="0" r=".9" fill="#4f8a3c" /><circle cx="9" cy="-0.6" r=".8" fill="#4f8a3c" />
          <g className="am-steam" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".65">
            <path d="M-8,-6 q-4,-6 0,-11 q4,-5 0,-10" /><path d="M2,-7 q-4,-6 0,-11 q4,-5 0,-10" style={{ animationDelay: '.5s' }} /><path d="M11,-6 q-4,-6 0,-11 q4,-5 0,-10" style={{ animationDelay: '1s' }} />
          </g>
        </g>
      )}
      {course === 1 && (
        <g>
          <path d="M-28,0 C-19,-8 8,-9 25,-2 L33,-8 L32,4 L25,2 C12,6 -12,6 -28,0Z" fill="#f3d2ad" stroke="#d6a577" strokeWidth=".7" />
          <path d="M-16,-3 q4,-2 7,0 M-4,-4 q4,-2 7,0 M8,-3 q4,-2 7,0" stroke="#b97a46" strokeWidth="1.3" fill="none" />
          <path d="M-20,1 q20,3 42,-1" stroke="#fff3df" strokeWidth="1" fill="none" opacity=".7" />
          <path d="M16,3 a9,5.5 0 0 1 17,0Z" fill="#f2d64b" stroke="#c9a823" strokeWidth=".6" />
          <path d="M20,3 a5,3 0 0 1 9,0Z" fill="#fbeb8a" />
          <path d="M-30,-3 l-5,-3 M-31,2 l-5,1 M-29,-1 l-6,-1" stroke="#4f8a3c" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
      {course === 2 && (
        <g>
          <path d="M-14,4 q22,3 40,-3" stroke="#6d3a1e" strokeWidth="2.4" fill="none" opacity=".7" strokeLinecap="round" />
          <ellipse cx="-14" cy="-1.4" rx="14" ry="5" fill="#8a4b2b" transform="rotate(-5 -14 -1.4)" />
          <ellipse cx="-14" cy="-2.2" rx="11" ry="3.6" fill="#c97a6a" transform="rotate(-5 -14 -2.2)" />
          <ellipse cx="-5" cy="-3" rx="13" ry="4.6" fill="#8a4b2b" transform="rotate(4 -5 -3)" />
          <ellipse cx="-5" cy="-3.8" rx="10" ry="3.3" fill="#d08777" transform="rotate(4 -5 -3.8)" />
          <ellipse cx="17" cy="-1" rx="6" ry="3.6" fill="#e0b25a" /><ellipse cx="24" cy="2" rx="5" ry="3" fill="#d4a24a" /><ellipse cx="11" cy="3" rx="4.5" ry="2.6" fill="#e6bd6a" />
          <path d="M-31,0 l9,2 M-30,-3 l10,1 M-30,3 l9,1" stroke="#3d7a3a" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {course === 3 && (
        <g>
          <ellipse cx="0" cy="0" rx="34" ry="8.2" fill="#a7743f" stroke="#7d5229" strokeWidth=".8" />
          <path d="M-24,2 L-6,-8 L12,-4 L12,3 L-24,5Z" fill="#f2cf62" stroke="#caa43a" strokeWidth=".7" />
          <path d="M-6,-8 L12,-4 L12,3 L-6,-1Z" fill="#fbe08a" opacity=".85" />
          <circle cx="-10" cy="1.2" r="1.3" fill="#d7b445" /><circle cx="-1" cy="2.2" r="1" fill="#d7b445" /><circle cx="4" cy="-1" r="1" fill="#d9b94d" />
          <circle cx="20" cy="-2" r="2.7" fill="#5a2f6f" /><circle cx="24.5" cy="-0.5" r="2.7" fill="#6a3a80" /><circle cx="17.5" cy="1.4" r="2.7" fill="#5a2f6f" /><circle cx="22" cy="2.6" r="2.7" fill="#4c2860" />
          <rect x="-33" y="-2" width="7" height="5" rx="1" fill="#e3c692" transform="rotate(-12 -29 0)" />
        </g>
      )}
      {course === 4 && (
        <g>
          <path d="M-16,-2 L10,-9 L16,0 L-10,5Z" fill="#fff0cf" stroke="#dcc08b" strokeWidth=".7" />
          <path d="M-16,-2 L-10,5 L-10,8 L-16,1Z" fill="#6a3a22" />
          <path d="M-10,5 L16,0 L16,3.4 L-10,8Z" fill="#8a4b2b" />
          <path d="M-10,5 L16,0 L16,1.2 L-10,6.2Z" fill="#fff0cf" />
          <circle cx="4" cy="-4.4" r="3.4" fill="#b8202c" /><circle cx="3" cy="-5.4" r="1" fill="#f4838b" />
          <path d="M4,-7 q2,-4 6,-4" stroke="#3d7a3a" strokeWidth="1" fill="none" />
          <path d="M18,3 q8,4 14,0 q-4,-3 -8,-1" fill="#a8243a" opacity=".85" />
          <path d="M-30,3 l14,-2" stroke="#d9c6a0" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function Scene({ tells, course, leaving, round, price, beat, shown, over, reduced }: {
  tells: Tells; course: number; leaving: number | null; round: number; price: number; beat: Beat | null;
  shown: RoundLog | null; over: AmbassadorState['over']; reduced: boolean;
}) {
  // when the deal is signed he is content, whatever his tells were
  const won = over === 'won';
  const fv = won ? 2 : tells.face.level;
  const g = won ? 2 : tells.glass.level;
  const n = won ? 2 : tells.notes.level;
  const react = shown ? HEAD_NOD[shown.reaction] : 'none';
  const cardPrice = beat ? beat.entry.offer : null;
  const cardOn = beat !== null;
  const pourKey = round > 1 && !over ? round : 0;
  const answered = shown !== null;

  return (
    <svg className={`am-svg${over ? ` end-${over}` : ''}`} viewBox="0 -18 400 316" role="img" aria-label="Ostrene's ambassador at the dinner table" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="amz-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a2c3b" /><stop offset=".6" stopColor="#64202d" /><stop offset="1" stopColor="#41121c" />
        </linearGradient>
        <pattern id="amz-damask" width="30" height="38" patternUnits="userSpaceOnUse">
          <path d="M15,3 C20,10 20,15 15,19 C10,15 10,10 15,3Z M15,19 C20,23 20,28 15,35 C10,28 10,23 15,19Z M0,19 C4,15 4,12 0,8 M30,19 C26,15 26,12 30,8" fill="none" stroke="#d9a441" strokeWidth=".8" opacity=".16" />
        </pattern>
        <linearGradient id="amz-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a2e1b" /><stop offset="1" stopColor="#2f160b" /></linearGradient>
        <linearGradient id="amz-velvet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2f6b58" /><stop offset="1" stopColor="#173f33" /></linearGradient>
        <linearGradient id="amz-suit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a4160" /><stop offset="1" stopColor="#1d2138" /></linearGradient>
        <linearGradient id="amz-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3c9a1" /><stop offset="1" stopColor="#d9a074" /></linearGradient>
        <linearGradient id="amz-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffdf6" /><stop offset=".7" stopColor="#f5ead4" /><stop offset="1" stopColor="#e8d9b8" /></linearGradient>
        <linearGradient id="amz-drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0e4cb" /><stop offset="1" stopColor="#d8c6a0" /></linearGradient>
        <linearGradient id="amz-wax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9dcbd" /><stop offset=".5" stopColor="#fff6df" /><stop offset="1" stopColor="#d9c9a4" /></linearGradient>
        <linearGradient id="amz-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff8a1f" /><stop offset=".55" stopColor="#ffc247" /><stop offset="1" stopColor="#fff0a0" /></linearGradient>
        <radialGradient id="amz-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe7a8" stopOpacity=".9" /><stop offset=".4" stopColor="#ffb04a" stopOpacity=".3" /><stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="amz-vig" cx=".5" cy=".52" r=".75">
          <stop offset=".55" stopColor="#1a0508" stopOpacity="0" /><stop offset="1" stopColor="#1a0508" stopOpacity=".5" />
        </radialGradient>
        <linearGradient id="amz-wine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a3203a" /><stop offset="1" stopColor="#5c0f22" /></linearGradient>
        <clipPath id="amz-bowl"><path d="M-11,-30 L11,-30 C13,-14 8,-2 0,-1 C-8,-2 -13,-14 -11,-30Z" /></clipPath>
        <clipPath id="amz-eyeL"><ellipse cx="-12.5" cy="-3" rx="6.4" ry="4" /></clipPath>
        <clipPath id="amz-eyeR"><ellipse cx="12.5" cy="-3" rx="6.4" ry="4" /></clipPath>
      </defs>

      {/* ---------------------------------------------- the room */}
      <rect y="-18" width="400" height="208" fill="url(#amz-wall)" />
      <rect y="-18" width="400" height="208" fill="url(#amz-damask)" />
      <rect y="-18" width="400" height="22" fill="url(#amz-wood)" /><rect y="4" width="400" height="2.4" fill="#c79a3b" /><rect y="6.4" width="400" height="5" fill="#000" opacity=".16" />
      <rect y="128" width="400" height="64" fill="url(#amz-wood)" />
      <rect y="126" width="400" height="3.4" fill="#c79a3b" />
      {[10, 96, 256, 342].map((x) => (<rect key={x} x={x} y="138" width="52" height="44" rx="2" fill="none" stroke="#7a4a2a" strokeWidth="1.4" opacity=".7" />))}
      {/* a gilt-framed landscape */}
      <g transform="translate(30 24) scale(.9)">
        <rect width="70" height="56" fill="#d9a441" />
        <rect x="4" y="4" width="62" height="48" fill="#a9c8d8" />
        <path d="M4,38 C16,26 26,34 36,28 C48,22 56,32 66,26 L66,52 L4,52Z" fill="#5e8a52" />
        <path d="M4,44 C20,38 40,46 66,40 L66,52 L4,52Z" fill="#44703c" />
        <circle cx="50" cy="16" r="5" fill="#ffe9a0" />
        <rect x="1.5" y="1.5" width="67" height="53" fill="none" stroke="#8a6418" strokeWidth="1.5" />
      </g>
      {/* a curtain with a tassel */}
      <g>
        <path d="M338,0 L400,0 L400,150 C384,150 378,140 372,120 C366,92 360,50 338,0Z" fill="#7d1f2c" />
        <path d="M352,0 C356,40 368,92 376,134 M368,0 C372,40 382,90 388,138" stroke="#4a0f19" strokeWidth="3" fill="none" opacity=".55" />
        <path d="M340,6 C350,30 362,70 366,104" stroke="#b8505e" strokeWidth="2" fill="none" opacity=".5" />
        <path d="M368,92 q10,6 20,0" stroke="#d9a441" strokeWidth="3" fill="none" />
        <circle cx="372" cy="100" r="3.4" fill="#d9a441" /><path d="M372,102 l-3,12 M372,102 l0,13 M372,102 l3,12" stroke="#d9a441" strokeWidth="1.4" />
      </g>
      {/* two wall sconces */}
      {[114, 286].map((x, i) => (
        <g key={x}>
          <circle className="am-glow" cx={x} cy="62" r="46" fill="url(#amz-glow)" opacity=".55" style={{ animationDelay: `${0.6 + i * 0.5}s` }} />
          <path d={`M${x - 8},74 L${x + 8},74 L${x + 5},82 L${x - 5},82Z`} fill="#c79a3b" />
          <rect x={x - 2.6} y="60" width="5.2" height="15" fill="url(#amz-wax)" />
          <Flame x={x} y={60} s={0.8} d={0.3 + i * 0.4} />
        </g>
      ))}

      {/* the chair behind him */}
      <g className="am-chair">
        <path d="M128,206 L128,64 Q128,26 164,26 L236,26 Q272,26 272,64 L272,206Z" fill="url(#amz-wood)" />
        <path d="M140,200 L140,70 Q140,40 168,40 L232,40 Q260,40 260,70 L260,200Z" fill="url(#amz-velvet)" />
        {[56, 90, 124, 158].map((y) => (<g key={y}><circle cx="143" cy={y} r="1.8" fill="#d9a441" /><circle cx="257" cy={y} r="1.8" fill="#d9a441" /></g>))}
        <path d="M128,64 Q128,26 164,26 L236,26 Q272,26 272,64" fill="none" stroke="#d9a441" strokeWidth="1.4" opacity=".7" />
        <circle cx="200" cy="30" r="4.5" fill="#d9a441" />
      </g>

      {/* ---------------------------------------------- the ambassador */}
      <g className="am-man" data-face={fv}>
       <g className="am-breathe">
        <g className="am-body">
          <path d="M186,114 L186,150 L214,150 L214,114Z" fill="#cf966c" />
          <path d="M112,290 L118,200 C121,168 142,152 176,146 L224,146 C258,152 279,168 282,200 L288,290Z" fill="url(#amz-suit)" />
          <path d="M176,146 L198,184 L180,214 L146,172Z" fill="#2a3050" stroke="#14172a" strokeWidth="1" />
          <path d="M224,146 L202,184 L220,214 L254,172Z" fill="#2a3050" stroke="#14172a" strokeWidth="1" />
          <polygon points="182,146 200,190 218,146 212,138 200,152 188,138" fill="#fbf8f0" />
          <path d="M196,154 L204,154 L207,192 L200,202 L193,192Z" fill="#a3262e" />
          <path d="M222,148 L244,158 L186,230 L158,214Z" fill="#2f7a55" />
          <path d="M222,148 L244,158 M158,214 L186,230" stroke="#e0b455" strokeWidth="2" />
          <circle cx="172" cy="200" r="7.4" fill="#e0b455" stroke="#a87a1c" strokeWidth="1.2" /><circle cx="172" cy="200" r="3.6" fill="#a3262e" />
          <path d="M168,193 l-3,-10 M176,193 l3,-10" stroke="#2f7a55" strokeWidth="2.6" />
          <g className="am-napkin"><path d="M186,152 L214,152 L208,170 L192,170Z" fill="#fffdf6" stroke="#e1d6bd" strokeWidth=".8" /></g>
        </g>

        <g className="am-headwrap" data-react={react} key={beat ? `r${beat.key}${beat.stage === 'reply' ? 'y' : 'x'}` : 'r0'}>
          <g className="am-head" transform="translate(200 98)">
            <ellipse cx="-31" cy="2" rx="5.6" ry="8.4" fill="#d39a70" /><ellipse cx="31" cy="2" rx="5.6" ry="8.4" fill="#d39a70" />
            <path d="M-31,-4 C-31,-30 -17,-38 0,-38 C17,-38 31,-30 31,-4 C31,22 17,38 0,40 C-17,38 -31,22 -31,-4Z" fill="url(#amz-skin)" />
            <path className="am-flush" d="M-31,-4 C-31,-30 -17,-38 0,-38 C17,-38 31,-30 31,-4 C31,22 17,38 0,40 C-17,38 -31,22 -31,-4Z" fill="#d6402c" />
            <path d="M-33,-4 C-37,-36 -18,-47 0,-47 C18,-47 37,-36 33,-4 C31,-18 23,-30 0,-31 C-23,-30 -31,-18 -33,-4Z" fill="#cfccc6" />
            <path d="M-26,-30 C-14,-40 12,-40 24,-31" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".5" />
            <path d="M-33,-4 C-35,2 -33,8 -31,10 L-31,-2Z M33,-4 C35,2 33,8 31,10 L31,-2Z" fill="#cfccc6" />
            {/* eyes: the lids close a little as he gets angrier */}
            {[-12.5, 12.5].map((x, i) => (
              <g key={x} clipPath={`url(#amz-eye${i ? 'R' : 'L'})`}>
                <ellipse cx={x} cy="-3" rx="6.4" ry="4" fill="#fffdf8" />
                <circle className="am-iris" cx={x} cy="-3" r="2.9" fill="#3a2a22" />
                <circle cx={x + 1} cy="-4" r=".9" fill="#fff" />
                <rect className="am-lid" x={x - 8} y="-8" width="16" height="9" fill="#e0aa80" />
              </g>
            ))}
            <g className="am-brow l"><path d="M-21,-14 Q-13,-19.6 -4,-15.4" stroke="#7a756d" strokeWidth="3.6" strokeLinecap="round" fill="none" /></g>
            <g className="am-brow r"><path d="M4,-15.4 Q13,-19.6 21,-14" stroke="#7a756d" strokeWidth="3.6" strokeLinecap="round" fill="none" /></g>
            <path d="M0,-6 C3.4,3 5.4,7 0.6,11 M-3.6,9 C-1,12 2,12 4,9" stroke="#b97d57" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path className="am-stache" d="M-15,17 C-9,10 -3.4,12 0,14.4 C3.4,12 9,10 15,17 C9,20.4 3.4,18 0,18 C-3.4,18 -9,20.4 -15,17Z" fill="#8f8a83" />
            <g className="am-mouth">
              <path className="m2" d="M-9,24 Q0,32.5 9,24" stroke="#7a3b2e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path className="m1" d="M-8,26.4 L8,26.4" stroke="#7a3b2e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path className="m0" d="M-8.4,28 Q0,22.6 8.4,28" stroke="#6c2f25" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </g>
            <path className="am-jaw" d="M-24,12 q4,7 0,14 M24,12 q-4,7 0,14" stroke="#a96c47" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path className="am-sweat" d="M25,-20 C28,-15 28,-12 25,-10 C22,-12 22,-15 25,-20Z" fill="#bfe4f2" stroke="#7fb6cf" strokeWidth=".7" />
            <g className="am-puffs" fill="#fff" opacity=".8"><circle cx="-38" cy="-8" r="3.4" /><circle cx="39" cy="-8" r="3.4" /><circle cx="-43" cy="-14" r="2.2" /><circle cx="44" cy="-14" r="2.2" /></g>
          </g>
          <ReactionMark shown={shown} />
        </g>
       </g>
      </g>

      {/* ---------------------------------------------- the table */}
      <path d="M0,176 L400,176 L400,252 Q200,266 0,252Z" fill="url(#amz-cloth)" />
      <path d="M0,176 L400,176" stroke="#d9a441" strokeWidth="1.6" opacity=".8" />
      <path d="M0,252 Q200,266 400,252 L400,300 L0,300Z" fill="url(#amz-drop)" />
      <path d="M40,256 L32,300 M92,260 L86,300 M150,263 L148,300 M214,264 L216,300 M276,262 L284,300 M334,258 L344,300 M382,254 L394,300" stroke="#b9a47c" strokeWidth="1.4" opacity=".4" />
      <path d="M0,252 Q200,266 400,252" fill="none" stroke="#d9a441" strokeWidth="1.8" opacity=".8" />

      <Candle x={56} d={0} />
      <Candle x={344} d={0.45} />

      {/* his glass: sipped, left alone, or pushed away */}
      <g className="am-glassbox" data-glass={g} transform="translate(112 196)">
        <g className="am-hand rest"><Sleeve from={[64, -20]} to={[34, -3]} /><ellipse cx="28" cy="-2" rx="9.5" ry="6" fill="#d99f74" /><path d="M21,-4 q-5,1 -6,4" stroke="#d99f74" strokeWidth="3.4" strokeLinecap="round" fill="none" /></g>
        <g className="am-glassmove">
          <ellipse cx="0" cy="1" rx="14" ry="3.6" fill="rgba(60,30,10,.22)" />
          <g className={`am-glass${pourKey > 0 && !reduced ? ' pour' : ''}`} key={pourKey}>
            <path d="M-11,-30 L11,-30 C13,-14 8,-2 0,-1 C-8,-2 -13,-14 -11,-30Z" fill="rgba(255,255,255,.35)" stroke="#9fb4c0" strokeWidth="1" />
            <g clipPath="url(#amz-bowl)"><rect className="am-wine" x="-14" y="-24" width="28" height="30" fill="url(#amz-wine)" /></g>
            <path d="M-8,-27 C-9,-16 -6,-8 -3,-5" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".7" strokeLinecap="round" />
            <path d="M0,-1 L0,9 M-8,10 Q0,6 8,10" stroke="#9fb4c0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <ellipse cx="0" cy="10" rx="8" ry="2" fill="rgba(255,255,255,.5)" stroke="#9fb4c0" strokeWidth=".8" />
          </g>
          <g className="am-hand hold"><Sleeve from={[30, -26]} to={[8, 0]} /><ellipse cx="3" cy="3" rx="8" ry="6" fill="#d99f74" /><path d="M-3,-1 q-3,-3 -1,-6" stroke="#d99f74" strokeWidth="3" strokeLinecap="round" fill="none" /></g>
        </g>
      </g>
      {pourKey > 0 && !reduced && (
        <g key={`pour${pourKey}`} className="am-bottle" transform="translate(112 150)">
          <g className="am-bottle-in">
            <rect x="-6" y="-30" width="12" height="30" rx="3" fill="#1f3b2c" /><rect x="-2.6" y="-46" width="5.2" height="18" rx="1.4" fill="#1f3b2c" /><rect x="-3.4" y="-49" width="6.8" height="4" fill="#a3262e" />
            <rect x="-5" y="-20" width="10" height="10" fill="#f4ead2" opacity=".85" />
            <path className="am-stream" d="M0,2 L0,24" stroke="#8a1c33" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* his plate and the course on it */}
      <g transform="translate(200 204)">
        {leaving !== null && <g className="am-plate out" key={`out${leaving}`}><Dish course={leaving} /></g>}
        <g className="am-plate" key={course} data-course={course}><Dish course={course} /></g>
      </g>
      <g className="am-napkin-drop" transform="translate(150 206) rotate(-14)"><path d="M-12,-6 L12,-8 L14,6 L-10,8Z" fill="#fffdf6" stroke="#e1d6bd" strokeWidth=".8" /><path d="M-2,-6 L0,7 M4,-7 L6,6" stroke="#eadfc6" strokeWidth=".8" /></g>
      <path d="M150,196 L148,214 M146,196 l0,6 M150,196 l0,6 M154,196 l0,6" stroke="#b9bcc4" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      <path d="M252,196 L254,216" stroke="#b9bcc4" strokeWidth="2.6" strokeLinecap="round" opacity=".9" />

      {/* his notebook: numbers, crossing out, closed */}
      <g className="am-notebox" data-notes={n} transform="translate(286 202)">
        <ellipse cx="0" cy="8" rx="38" ry="5" fill="rgba(60,30,10,.2)" />
        <g className="am-nb-open">
          <path d="M-34,-8 L0,-12 L34,-8 L34,8 L0,12 L-34,8Z" fill="#2b1a12" />
          <path d="M-32,-7 L-1,-10.5 L-1,10 L-32,6.6Z" fill="#fdf8ea" /><path d="M1,-10.5 L32,-7 L32,6.6 L1,10Z" fill="#faf3df" />
          <path d="M-29,-3 L-5,-5.6 M-29,1.4 L-5,-1.2 M-29,5.6 L-5,3" stroke="#c9b98f" strokeWidth=".7" />
          <path d="M5,-5.6 L29,-3 M5,-1.2 L29,1.4 M5,3 L29,5.6" stroke="#c9b98f" strokeWidth=".7" />
          <g className="am-nb-nums" key={price}>
            <text x="-27" y="-1.4" fontFamily="'Courier Prime', monospace" fontSize="8.4" fontWeight="700" fill="#33261c" transform="rotate(-4 -27 -1.4)">{`$${price}`}</text>
            <path className="am-nb-ink" d="M7,-3 q3,-2 5,0 t5,0 t5,0 M7,2 q3,-2 5,0 t5,0" stroke="#33261c" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
          <g className="am-nb-strike"><path d="M-30,-1.6 L-12,-3.6" stroke="#c4202c" strokeWidth="1.8" strokeLinecap="round" /><path d="M6,-2 L28,0.4" stroke="#c4202c" strokeWidth="1.8" strokeLinecap="round" /></g>
          <g className="am-pen"><path d="M30,-14 L8,-2" stroke="#1a1410" strokeWidth="2.6" strokeLinecap="round" /><path d="M9,-2.8 L6.6,-1.6" stroke="#d9a441" strokeWidth="2.6" strokeLinecap="round" /></g>
        </g>
        <g className="am-nb-closed">
          <path d="M-22,-9 L0,-12 L22,-9 L22,7 L0,11 L-22,7Z" fill="#2b1a12" stroke="#4a2c1c" strokeWidth="1" />
          <path d="M-22,-9 L0,-12 L22,-9" fill="none" stroke="#d9a441" strokeWidth="1.2" />
          <path d="M-14,-2 L14,-5" stroke="#d9a441" strokeWidth="1" opacity=".7" />
          <path d="M24,-8 L-20,3" stroke="#1a1410" strokeWidth="2.6" strokeLinecap="round" /><path d="M-19,2.8 L-21,3.4" stroke="#d9a441" strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <g className="am-hand pen"><Sleeve from={[10, -26]} to={[34, -11]} /><ellipse cx="38" cy="-9" rx="9.5" ry="6" fill="#d99f74" /></g>
      </g>

      {/* the offer card, signed on a deal */}
      {cardOn && (
        <g key={`card${beat!.key}`} className={`am-card${over === 'won' ? ' signed' : ''}${answered && beat!.entry.verdict === 'counter' ? ' back' : ''}`}>
          <g transform="translate(236 228)">
            <rect x="-30" y="-17" width="60" height="34" rx="3" fill="#fffaf0" stroke="#d9a441" strokeWidth="1.6" />
            <rect x="-26.5" y="-13.5" width="53" height="27" rx="1.6" fill="none" stroke="#e9d5a2" strokeWidth=".8" />
            <text x="0" y="-1" textAnchor="middle" fontFamily="'Archivo Black', sans-serif" fontSize="15" fill="#4a1620">{`$${cardPrice}`}</text>
            <text x="0" y="9" textAnchor="middle" fontFamily="'Libre Franklin', sans-serif" fontSize="5" letterSpacing=".4" fill="#6b4a3a">PER 1,000 M³</text>
            <path className="am-sign" d="M-22,13 q4,-8 8,-1 t8,-1 q4,-6 8,0 t8,-1" stroke="#1d2a6b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle className="am-seal" cx="22" cy="10" r="5.4" fill="#a3262e" stroke="#7a1820" strokeWidth=".8" />
          </g>
        </g>
      )}
      {over === 'won' && (
        <g className="am-sparks" key="sparks">
          {[[120, 150], [150, 132], [250, 138], [286, 156], [200, 126], [178, 160], [226, 164]].map(([x, y], i) => (
            <path key={i} d={`M${x},${y - 6} L${x + 1.6},${y - 1.6} L${x + 6},${y} L${x + 1.6},${y + 1.6} L${x},${y + 6} L${x - 1.6},${y + 1.6} L${x - 6},${y} L${x - 1.6},${y - 1.6}Z`} fill="#ffd96a" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </g>
      )}
      {/* a foreground edge, a place setting and the candle light over everything */}
      <path d="M0,274 Q200,286 400,274 L400,300 L0,300Z" fill="#c9b78e" opacity=".35" />
      <path d="M62,244 L66,270 M70,246 l0,10 M74,246 l0,10 M78,246 l0,10" stroke="#aeb2bd" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M338,246 L334,272" stroke="#aeb2bd" strokeWidth="3.2" strokeLinecap="round" opacity=".8" />
      <rect className="am-flicker" y="-18" width="400" height="316" fill="url(#amz-glow)" opacity="0" style={{ mixBlendMode: 'screen' }} />
      <rect y="-18" width="400" height="316" fill="url(#amz-vig)" pointerEvents="none" />
    </svg>
  );
}

/** A little mark beside his head showing how the line landed. */
function ReactionMark({ shown }: { shown: RoundLog | null }) {
  if (!shown) return null;
  const r = shown.reaction;
  return (
    <g className={`am-mark r-${r}`} transform="translate(250 56)" aria-hidden="true">
      {r === 'delighted' && (<g fill="#ffd96a"><path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2Z" /><path d="M12,-12 L13,-8 L17,-7 L13,-6 L12,-2 L11,-6 L7,-7 L11,-8Z" /><path d="M-11,9 L-10,12 L-7,13 L-10,14 L-11,17 L-12,14 L-15,13 L-12,12Z" /></g>)}
      {r === 'pleased' && (<g><circle r="9" fill="#2f7a55" /><path d="M-4.4,0 L-1,3.6 L5,-3.4" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
      {r === 'cool' && (<g><circle r="9" fill="#8a96a8" /><circle cx="-4" r="1.4" fill="#fff" /><circle r="1.4" fill="#fff" /><circle cx="4" r="1.4" fill="#fff" /></g>)}
      {r === 'offended' && (<g><circle r="9" fill="#c4202c" /><path d="M0,-5 L0,1.4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cy="5" r="1.4" fill="#fff" /></g>)}
    </g>
  );
}


import { useEffect, useRef, useState } from 'react';
import type { Paper, PaperKind, ShredSetup, ShredState } from '../../game/minigames/shred';
import {
  currentWave, isDirty, isFaceUp, LANES, onBelt, PAPER_W, paperX, shredScore, shredStart, shredTick, tapPaper,
} from '../../game/minigames/shred';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * SHRED THE LEDGER — the desk. Rules in game/minigames/shred.ts; this runs
 * the clock and turns taps into flips and shreds.
 *
 * Look: a dark walnut desk under a lamp. Two rubber conveyor belts carry
 * papers left to right into the auditors' box (a grey crate with a
 * magnifying glass). A tapped paper drops into the shredder below and comes
 * out as ribbons; a clean one jams it (it shakes, a red light). Face-down
 * papers show a manila back with a "?" until you turn them over. The stamps
 * are drawn, not written: red square = shred.
 */

function Stamp({ kind }: { kind: PaperKind }) {
  switch (kind) {
    case 'dirty':
    case 'faded':
      return <span className={`sh-stamp ilvet${kind === 'faded' ? ' faded' : ''}`}><b /><b /><b /></span>;
    case 'void':
      return <span className="sh-stamp ilvet void"><b /><b /><b /><i /></span>;
    case 'clean':
      return <span className="sh-stamp seal"><b /></span>;
    case 'redseal':
      return <span className="sh-stamp seal red"><b /></span>;
    default:
      return null;
  }
}

/** A paper leaving the belt: into the shredder, or into the box. */
interface Ghost { key: string; p: Paper; x: number; how: 'shred' | 'jam' | 'box' | 'evidence' }

export function ShredGame({ setup, reduced, paused, onEnd }: {
  setup: ShredSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<ShredState>(() => shredStart(setup));
  const now = useClock(!paused && !st.over);
  const nowRef = useRef(0);
  nowRef.current = now;
  const ended = useRef(false);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const prevFate = useRef<Record<string, string>>({});

  useEffect(() => { setSt((s) => shredTick(s, now)); }, [now]);

  // every paper that just left the belt gets a short exit animation
  useEffect(() => {
    const fresh: Ghost[] = [];
    for (const p of setup.papers) {
      const f = st.fate[p.id];
      if (!f || prevFate.current[p.id]) continue;
      prevFate.current[p.id] = f;
      const how = f === 'shredded' ? 'shred' : f === 'jammed' ? 'jam' : f === 'evidence' ? 'evidence' : 'box';
      fresh.push({ key: `${p.id}-${how}`, p, x: Math.min(100 - PAPER_W / 2, paperX(p, nowRef.current)), how });
    }
    if (!fresh.length) return;
    setGhosts((g) => [...g, ...fresh]);
    window.setTimeout(() => setGhosts((g) => g.filter((x) => !fresh.includes(x))), 650);
  }, [st.fate, setup.papers]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const allowed = setup.d.allowed;
    const t = window.setTimeout(() => onEnd({
      won,
      score: shredScore(st),
      headline: won
        ? (st.evidence + st.jams === 0 ? 'Not a scrap left for them.' : 'They found a jammed shredder and nothing else.')
        : 'The auditors have the papers.',
      detail: `${st.evidence} paper${st.evidence === 1 ? '' : 's'} reached the box, ${st.jams} jam${st.jams === 1 ? '' : 's'}. You were allowed ${allowed} mistake${allowed === 1 ? '' : 's'}.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, setup.d.allowed, onEnd, reduced]);

  const tap = (id: string) => {
    if (paused) return;
    setSt((s) => tapPaper(s, id, nowRef.current));
  };

  const belt = onBelt(st, now);
  const jammed = now < st.jamUntil;
  const mistakes = st.evidence + st.jams;
  const left = setup.papers.filter((p) => !st.fate[p.id]).length;
  const boxHit = st.last?.kind === 'evidence' && now - st.last.at < 700;
  const beltSpeed = belt[0]?.crossMs ?? setup.d.crossMs[0];

  return (
    <div className="sh">
      <div className="sh-hud">
        <span className="sh-pile">Wave <b>{currentWave(st, now)}</b> / {setup.d.waves}</span>
        <span className="sh-left"><b>{left}</b> papers</span>
        <span className={`sh-mistakes${mistakes >= setup.d.allowed ? ' warn' : ''}`} aria-label={`${mistakes} mistakes, ${setup.d.allowed} allowed`}>
          {Array.from({ length: setup.d.allowed + 1 }, (_, i) => <i key={i} className={i < mistakes ? 'x' : ''} />)}
        </span>
      </div>

      <div className="sh-desk" data-clip>
        <div className="sh-lamp" aria-hidden="true" />
        <div className={`sh-box${boxHit ? ' hit' : ''}`} aria-label="The auditors' box">
          <span className="sh-glass" aria-hidden="true" />
        </div>
        {Array.from({ length: LANES }, (_, lane) => (
          <div key={lane} className="sh-belt" style={{ top: `${8 + lane * 46}%` }}>
            <span
              className="sh-rollers"
              aria-hidden="true"
              style={{ animationDuration: `${beltSpeed / 10}ms`, animationPlayState: paused || st.over ? 'paused' : 'running' }}
            />
            {belt.filter((p) => p.lane === lane).map((p) => {
              const up = isFaceUp(st, p);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`sh-paper${up ? '' : ' down'}${st.flipped.includes(p.id) ? ' flipped' : ''}${isDirty(p.kind) && paperX(p, now) > 70 && up ? ' late' : ''}`}
                  style={{ left: `${paperX(p, now)}%`, width: `${PAPER_W}%`, ['--rot' as string]: `${p.rot}deg` }}
                  disabled={paused || !!st.over}
                  // pointer-down, not click: a tap must never also land on the next paper
                  onPointerDown={(e) => { e.preventDefault(); tap(p.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(p.id); } }}
                  aria-label={up ? `Paper ${p.id}` : `Face-down paper ${p.id}: tap to turn it over`}
                >
                  {up ? (
                    <>
                      <span className="sh-lines" aria-hidden="true"><i /><i /><i /><i /></span>
                      <Stamp kind={p.kind} />
                    </>
                  ) : <span className="sh-back" aria-hidden="true">?</span>}
                </button>
              );
            })}
            {ghosts.filter((g) => g.p.lane === lane).map((g) => (
              <span key={g.key} className={`sh-paper ghost ${g.how}`} style={{ left: `${g.x}%`, width: `${PAPER_W}%`, ['--rot' as string]: `${g.p.rot}deg` }} aria-hidden="true">
                <span className="sh-lines"><i /><i /><i /><i /></span>
                <Stamp kind={g.p.kind} />
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className={`sh-shredder${jammed ? ' jam' : ''}${st.last?.kind === 'shred' && now - st.last.at < 400 ? ' chew' : ''}`}>
        <span className="sh-slot" aria-hidden="true" />
        <span className="sh-light" aria-hidden="true" />
        <span className="sh-ribbons" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <span className="sh-label">{jammed ? 'Jammed' : 'Shredder'}</span>
      </div>
    </div>
  );
}

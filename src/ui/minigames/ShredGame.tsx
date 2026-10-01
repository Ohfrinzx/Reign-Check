import { useEffect, useRef, useState } from 'react';
import type { Paper, PaperKind, ShredSetup, ShredState } from '../../game/minigames/shred';
import {
  currentPile, isDirty, MISTAKES_ALLOWED, shredPaper, shredScore, shredStart, shredTick, shredTimeLeft,
} from '../../game/minigames/shred';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * SHRED THE LEDGER — the desk. Rules in game/minigames/shred.ts; this runs
 * the clock and turns taps into papers fed to the shredder.
 *
 * Look: a dark walnut desk under a lamp, white papers scattered on it, a
 * steel shredder at the bottom. A tapped paper flies into the slot and comes
 * out as ribbons; a clean one jams it (it shakes, a red light). Along the
 * top, the auditors' footsteps cross the corridor towards the door. The
 * stamps are drawn, not written: red square = shred.
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

function PaperCard({ p, gone, jammed, onTap }: { p: Paper; gone: boolean; jammed: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      className={`sh-paper${gone ? ` gone${isDirty(p.kind) ? '' : ' wrong'}` : ''}`}
      style={{ left: `${p.x}%`, top: `${p.y}%`, ['--rot' as string]: `${p.rot}deg` }}
      disabled={gone || jammed}
      // pointer-down, not click: a tap that finishes a pile must not land as a
      // click on the next pile's paper under the finger. Keys: Enter/Space.
      onPointerDown={(e) => { e.preventDefault(); onTap(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } }}
      aria-label={`Paper ${p.id}`}
    >
      <span className="sh-lines" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <Stamp kind={p.kind} />
    </button>
  );
}

export function ShredGame({ setup, reduced, paused, onEnd }: {
  setup: ShredSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<ShredState>(() => shredStart(setup, 0));
  const now = useClock(!paused && !st.over);
  const nowRef = useRef(0);
  nowRef.current = now;
  const ended = useRef(false);

  useEffect(() => { setSt((s) => shredTick(s, now)); }, [now]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const t = window.setTimeout(() => onEnd({
      won,
      score: shredScore(st),
      headline: won
        ? (st.evidence + st.jams === 0 ? 'Not a scrap left for them.' : 'They found a jammed shredder and nothing else.')
        : 'The auditors have the papers.',
      detail: `${st.evidence} paper${st.evidence === 1 ? '' : 's'} left as evidence, ${st.jams} jam${st.jams === 1 ? '' : 's'}. You were allowed ${MISTAKES_ALLOWED} mistakes.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, onEnd, reduced]);

  const tap = (id: string) => {
    if (paused) return;
    setSt((s) => shredPaper(s, id, nowRef.current));
  };

  const pile = currentPile(st);
  const left = shredTimeLeft(st, now);
  const walk = 1 - left / st.setup.d.pileMs;
  const jammed = now < st.jamUntil;
  const mistakes = st.evidence + st.jams;

  return (
    <div className="sh">
      <div className="sh-corridor" aria-label="The auditors are coming">
        <span className="sh-door" aria-hidden="true" />
        <span className="sh-feet" aria-hidden="true" style={{ left: `${Math.min(1, walk) * 88}%` }}>
          <i /><i />
        </span>
      </div>
      <div className="sh-hud">
        <span className="sh-pile">Pile <b>{Math.min(st.pile + 1, st.setup.piles.length)}</b> / {st.setup.piles.length}</span>
        <span className={`sh-mistakes${mistakes >= MISTAKES_ALLOWED ? ' warn' : ''}`}>
          {Array.from({ length: MISTAKES_ALLOWED + 1 }, (_, i) => <i key={i} className={i < mistakes ? 'x' : ''} />)}
        </span>
      </div>

      <div className={`sh-desk${st.last?.kind === 'evidence' && now - st.last.at < 700 ? ' caught' : ''}`}>
        <div className="sh-lamp" aria-hidden="true" />
        <div className="sh-pilezone" key={st.pile}>
          {pile.map((p) => (
            <PaperCard key={p.id} p={p} gone={st.shredded.includes(p.id)} jammed={jammed || paused || !!st.over} onTap={() => tap(p.id)} />
          ))}
        </div>
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

import { useEffect, useRef, useState } from 'react';
import type { BreadSetup, BreadState, DistrictId } from '../../game/minigames/breadlines';
import {
  DISTRICTS, breadScore, breadSecondsLeft, breadStart, breadTick, canSend, freeTeams, sendTeam, STEP_MS,
} from '../../game/minigames/breadlines';
import type { MinigameEnd } from './MinigameScreen';
import { useClock } from './useClock';

/**
 * BREAD LINES — the city map. Rules in game/minigames/breadlines.ts; this
 * runs the clock and turns taps into teams sent.
 *
 * Look: a sunlit street plan of Sarnica (sand and terracotta, not the
 * newspaper and not the night map). A district's anger is a ring that fills
 * around it; at full it bursts into flame. Negotiators (green) and police
 * (blue) travel across the map from the Palace to where you sent them.
 * Few words: a tap on a district opens two big buttons, TALK and POLICE.
 */

const HQ = { x: 50, y: 104 };

export function BreadLinesGame({ setup, reduced, paused, onEnd }: {
  setup: BreadSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  const [st, setSt] = useState<BreadState>(() => breadStart(setup));
  const [sel, setSel] = useState<DistrictId | null>(null);
  const now = useClock(!paused && !st.over);
  const ended = useRef(false);
  const [trails, setTrails] = useState<{ key: string; kind: 'talk' | 'police'; x: number; y: number; ms: number }[]>([]);

  // advance the simulation to the clock, in whole steps
  useEffect(() => {
    if (st.over) return;
    const due = Math.floor(now / STEP_MS) * STEP_MS - st.t;
    if (due >= STEP_MS) setSt((s) => breadTick(s, due));
  }, [now, st.t, st.over]);

  // a selected district that stopped flaring closes its menu
  useEffect(() => {
    if (sel && st.districts.find((d) => d.id === sel)?.mood !== 'flaring') setSel(null);
  }, [st, sel]);

  useEffect(() => {
    if (!st.over || ended.current) return;
    ended.current = true;
    const won = st.over === 'won';
    const t = window.setTimeout(() => onEnd({
      won,
      score: breadScore(st),
      headline: won
        ? (st.burned === 0 ? 'Not one district burned.' : 'One district burned. The city held.')
        : 'The city is burning.',
      detail: `You calmed ${st.calmed} crowd${st.calmed === 1 ? '' : 's'} by talking and cleared ${st.cleared} with the police.`,
    }), reduced ? 300 : 900);
    return () => window.clearTimeout(t);
  }, [st, onEnd, reduced]);

  const send = (kind: 'talk' | 'police') => {
    if (!sel || !canSend(st, sel, kind)) return;
    const d = DISTRICTS.find((x) => x.id === sel)!;
    setSt((s) => sendTeam(s, sel, kind));
    const key = `${kind}${st.t}${sel}`;
    const ms = kind === 'talk' ? 2000 : 400;
    setTrails((tr) => [...tr, { key, kind, x: d.x, y: d.y, ms }]);
    window.setTimeout(() => setTrails((tr) => tr.filter((x) => x.key !== key)), ms + 400);
    setSel(null);
  };

  // keys: 1-7 pick a district (in map order), T talks, P sends the police
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || st.over) return;
      const k = e.key.toLowerCase();
      if (/^[1-7]$/.test(k)) { e.preventDefault(); setSel(DISTRICTS[Number(k) - 1].id); }
      if (k === 't') { e.preventDefault(); send('talk'); }
      if (k === 'p') { e.preventDefault(); send('police'); }
      if (k === 'escape') setSel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const charges = st.setup.d.charges - st.charged;
  const selD = sel ? st.districts.find((d) => d.id === sel) : undefined;
  const selPos = sel ? DISTRICTS.find((d) => d.id === sel)! : undefined;

  return (
    <div className="bl">
      <div className="bl-hud">
        <div className="bl-time"><b>{breadSecondsLeft(st)}</b><span>s to evening</span></div>
        <div className="bl-teams" aria-label="Teams free">
          <span className="bl-chip talk"><i className="ico talk" /> {freeTeams(st, 'talk')}<em>talk</em></span>
          <span className="bl-chip police"><i className="ico police" /> {freeTeams(st, 'police')}<em>police</em></span>
          <span className={`bl-chip charges${charges <= 1 ? ' low' : ''}`} aria-label={`${charges} baton charges left`}>
            {Array.from({ length: st.setup.d.charges }, (_, i) => <i key={i} className={`baton${i < charges ? '' : ' used'}`} />)}
          </span>
        </div>
        <div className="bl-burns" aria-label={`${st.burned} burned, ${st.setup.d.burnsAllowed} allowed`}>
          {Array.from({ length: st.setup.d.burnsAllowed + 1 }, (_, i) => <i key={i} className={`flame${i < st.burned ? ' lit' : ''}`} />)}
        </div>
      </div>

      <div className="bl-map" onClick={() => setSel(null)}>
        <div className="bl-river" aria-hidden="true" />
        <div className="bl-streets" aria-hidden="true" />
        <div className="bl-hq" aria-hidden="true" style={{ left: `${HQ.x}%`, top: '96%' }}>★</div>
        {trails.map((t) => (
          <span
            key={t.key}
            className={`bl-trail ${t.kind}`}
            aria-hidden="true"
            style={{ ['--tx' as string]: `${t.x}%`, ['--ty' as string]: `${t.y}%`, animationDuration: `${t.ms}ms` }}
          />
        ))}
        {st.districts.map((d, i) => {
          const pos = DISTRICTS[i];
          const ring = Math.round(d.heat);
          return (
            <button
              key={d.id}
              type="button"
              className={`bl-d ${d.mood}${sel === d.id ? ' sel' : ''}${d.heat > 70 && d.mood === 'flaring' ? ' hot' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, ['--heat' as string]: `${ring * 3.6}deg` }}
              aria-label={`${pos.name}: ${d.mood}${d.mood === 'flaring' ? `, anger ${ring} of 100` : ''}`}
              onClick={(e) => { e.stopPropagation(); if (d.mood === 'flaring') setSel(sel === d.id ? null : d.id); }}
            >
              <span className="ring" />
              <span className="core">
                {d.mood === 'burning' ? <i className="ico fire" /> : d.mood === 'talking' ? <i className="ico talk" /> : d.mood === 'policed' ? <i className="ico police" /> : d.mood === 'calm' ? <i className="ico dove" /> : <i className="ico crowd" />}
              </span>
              <span className="nm">{pos.name}</span>
            </button>
          );
        })}

        {selD && selPos && (
          <div
            className={`bl-menu${selPos.y > 55 ? ' up' : ''}${selPos.x > 70 ? ' left' : selPos.x < 30 ? ' right' : ''}`}
            style={{ left: `${selPos.x}%`, top: `${selPos.y}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn bl-talk" disabled={!canSend(st, selD.id, 'talk')} onClick={() => send('talk')}>
              <i className="ico talk" /> Talk
            </button>
            <button className="btn bl-police" disabled={!canSend(st, selD.id, 'police')} onClick={() => send('police')}>
              <i className="ico police" /> Police
            </button>
          </div>
        )}
      </div>

      <div className="bl-help" aria-live="polite">
        {st.over ? (st.over === 'won' ? 'Evening. The city held.' : 'Too many fires.')
          : sel ? 'Talk: slow, lasting. Police: instant, but it comes back.'
            : 'Tap a district that is lighting up.'}
      </div>
    </div>
  );
}

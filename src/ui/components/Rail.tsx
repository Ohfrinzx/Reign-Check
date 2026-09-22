import type { GameState } from '../../game/types';
import { DISPLAY_FACTIONS, factionMood } from '../../game/display';
import { buildThreats } from '../../game/briefing';
import { fill } from '../../game/text';
import { Glossed } from './Prose';
import { Pocket } from '../screens/Shop';
import { DemandsPanel } from './Demands';
import type { DemandActions } from './Demands';
/**
 * The right-hand rail: Files (factions), Demands (Phase 3), On Your Desk
 * (threats), Diary.
 *
 * Deliberately NOT tabbed. The whole point of the desk design is that
 * nothing is hidden behind a click — everything that matters has one fixed,
 * always-visible place. See docs/DESIGN_V2.md.
 */
export function Rail({ s, onUseFavour, demandActions }: {
  s: GameState;
  onUseFavour: (id: string) => void;
  demandActions: DemandActions;
}) {
  const threats = buildThreats(s, 3);
  const diary = s.scheduled.filter((d) => d.visible).slice(0, 5);

  return (
    <aside className="rail">
      <div className="panel">
        <h3>Files</h3>
        {DISPLAY_FACTIONS.map((def) => {
          const f = s.factions[def.id];
          const mood = factionMood(def, f.loyalty);
          return (
            <div className="fac" key={def.id}>
              <div className="hd">
                <span className="icon">{def.icon}</span>
                <span className="nm">{def.label}</span>
                <span className={`md tone-${mood.tone}`}>{mood.word}</span>
              </div>
              <div className="bar"><div className={`bg-${mood.tone}`} style={{ width: `${Math.max(3, f.loyalty)}%`, height: '100%' }} /></div>
            </div>
          );
        })}
      </div>

      <DemandsPanel s={s} actions={demandActions} />

      <div className="panel">
        <h3>On your desk {threats.length > 0 && <span>{threats.length}</span>}</h3>
        {threats.length === 0 && <div className="empty">Nothing urgent. Historically, this is when things happen.</div>}
        {threats.map((t, i) => (
          <div className={`threat ${t.severity === 1 ? 'low' : ''}`} key={i}>
            <div className="t">{t.headline}</div>
            <div className="d"><Glossed text={fill(t.body, s)} /></div>
            <div className="m">
              STAGE {t.severity} OF 3
              {[1, 2, 3].map((n) => (
                <span key={n} className={`pip ${n <= t.severity ? 'on' : ''}`} />
              ))}
              {t.source && <> &middot; {t.source.toUpperCase()}</>}
            </div>
          </div>
        ))}
      </div>

      <Pocket s={s} onUseFavour={onUseFavour} />

      <div className="panel">
        <h3>Diary</h3>
        {diary.length === 0 && <div className="empty">Nothing scheduled ahead yet.</div>}
        {diary.map((d) => (
          <div className="slip" key={d.id}>
            <div className="d">DAY {d.day}</div>
            <div className="t">{fill(d.label, s)}</div>
          </div>
        ))}
      </div>

      {s.commitments.length > 0 && (
        <div className="panel">
          <h3>Standing costs</h3>
          {s.commitments.map((c) => (
            <div className="cmt" key={c.id}>
              <span className="n">{c.label}{c.daysLeft !== undefined ? ` · ${c.daysLeft}d left` : ''}</span>
              <span className="v">{c.perDay >= 0 ? '-' : '+'}${Math.abs(c.perDay).toFixed(2)}B/day</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

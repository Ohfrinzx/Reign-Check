import { useState } from 'react';
import { becauseText, demandReactions, hasMark } from '../../game/consequences';
import type { DemandNotice, FactionId, GameState } from '../../game/types';
import {
  STAGE_LABEL, bribeBlockReason, bribeCost, bribeOddsWord, dangerWord, factionLabel,
  liveDemands, meetBlockReason, meetCost, STAGE_DAYS,
} from '../../game/demands';
import type { LiveDemand } from '../../game/demands';
import { FACTION_MOVES } from '../../game/content/demands';
import { CHARACTER_MAP } from '../../game/content/country';
import { DISPLAY_FACTIONS } from '../../game/display';
import { usd } from '../../game/economy';

/**
 * FACTION DEMANDS (Phase 3 step 1) — the UI half. Rules live in
 * src/game/demands.ts; this file only reads them.
 *
 *  - DemandsPanel: the rail's "Demands" list. Each entry expands in place to
 *    show who is asking, what they want, and the Meet / Buy time buttons.
 *  - DemandPopup: the pop-up for the oldest unseen notice (a new demand, an
 *    escalation, or what a faction did when an ultimatum ran out).
 *
 * Everything the player needs — price, odds, deadline, what protects them —
 * is plain visible text. Nothing depends on hover (ground rule 11).
 */

export interface DemandActions {
  onMeet: (f: FactionId) => void;
  onBribe: (f: FactionId) => void;
}

function icon(f: FactionId) {
  return DISPLAY_FACTIONS.find((d) => d.id === f)?.icon ?? '•';
}

function dueWord(s: GameState, dueDay: number): string {
  const left = dueDay - s.day;
  if (left <= 0) return `due today (day ${dueDay})`;
  return `due by day ${dueDay} — ${left} day${left === 1 ? '' : 's'} left`;
}

/** The full detail of one demand plus its two buttons. Shared by all three views. */
export function DemandDetail({ s, live, actions }: { s: GameState; live: LiveDemand; actions: DemandActions }) {
  const { faction, demand, def } = live;
  const who = CHARACTER_MAP[def.from];
  const move = FACTION_MOVES[faction];
  const cost = meetCost(s, faction);
  const meetBlock = meetBlockReason(s, faction);
  const bCost = bribeCost(s, faction);
  const bribeBlock = bribeBlockReason(s, faction);
  // The no-bribe reason shows under the Bribe button itself (bribeBlockReason).
  const reactions = demandReactions(s, faction).filter((r) => r.kind !== 'no-bribe');
  const next = demand.severity === 'murmur'
    ? 'If ignored, this becomes a formal demand and they lose support for you.'
    : demand.severity === 'formal'
      ? 'If ignored, this becomes an ultimatum and they lose more support for you.'
      : dangerWord(s, faction);

  return (
    <div className="dm-detail">
      {who && <div className="dm-from">From {who.name}, {who.title}</div>}
      {def.triggeredBy && hasMark(s, def.triggeredBy) && (
        <div className="dm-because">{becauseText(s, def.triggeredBy)}.</div>
      )}
      <p className="dm-ask">{def.ask}</p>
      <div className={`dm-next ${demand.severity}`}>{next}</div>
      {demand.severity === 'ultimatum' && move && (
        <div className="dm-protect">What protects you: {move.protectedBy}.</div>
      )}

      {reactions.length > 0 && (
        <ul className="dm-memory">
          {reactions.map((r) => (
            <li key={r.text} className={r.kind}>
              <b>{r.kind === 'cheaper' ? 'Cheaper' : 'Dearer'}</b> · {r.text}
            </li>
          ))}
        </ul>
      )}

      <div className="dm-actions">
        <div className="dm-act">
          <button className="btn btn-primary" disabled={!!meetBlock} onClick={() => actions.onMeet(faction)}>
            {def.meetLabel}
          </button>
          <div className="dm-hint">Cost: {usd(cost)}. {def.meetHint}</div>
          {meetBlock && <div className="dm-block">{meetBlock}</div>}
        </div>
        <div className="dm-act">
          <button className="btn" disabled={!!bribeBlock} onClick={() => actions.onBribe(faction)}>
            Bribe for {STAGE_DAYS} more days
          </button>
          <div className="dm-hint">Cost: {usd(bCost)}, only if they accept. {bribeOddsWord(s, faction)}</div>
          {bribeBlock && <div className="dm-block">{bribeBlock}</div>}
        </div>
      </div>
    </div>
  );
}

function DemandRow({ s, live, actions, open, onToggle }: {
  s: GameState; live: LiveDemand; actions: DemandActions; open: boolean; onToggle: () => void;
}) {
  const { faction, demand, def } = live;
  return (
    <div className={`dm-row ${demand.severity} ${open ? 'open' : ''}`}>
      <button className="dm-head" onClick={onToggle} aria-expanded={open}>
        <span className="dm-fac">{icon(faction)} {factionLabel(faction)}</span>
        <span className="dm-stage">{STAGE_LABEL[demand.severity]}</span>
        <span className="dm-title">{def.title}</span>
        <span className="dm-due">{dueWord(s, demand.dueDay)} &middot; {open ? 'hide' : 'open'}</span>
      </button>
      {open && <DemandDetail s={s} live={live} actions={actions} />}
    </div>
  );
}

function DemandList({ s, actions }: { s: GameState; actions: DemandActions }) {
  const live = liveDemands(s);
  const [open, setOpen] = useState<FactionId | null>(null);
  if (!live.length) {
    return <div className="empty">No faction is making demands. Keep their patience up and it stays that way.</div>;
  }
  return (
    <>
      {live.map((l) => (
        <DemandRow
          key={l.faction}
          s={s}
          live={l}
          actions={actions}
          open={open === l.faction}
          onToggle={() => setOpen(open === l.faction ? null : l.faction)}
        />
      ))}
    </>
  );
}

export function DemandsPanel({ s, actions }: { s: GameState; actions: DemandActions }) {
  const n = liveDemands(s).length;
  return (
    <div className="panel demands-panel">
      <h3>Demands {n > 0 && <span>{n}</span>}</h3>
      <DemandList s={s} actions={actions} />
    </div>
  );
}

/**
 * The pop-up for the oldest unseen notice. "Deal with it later" only closes
 * the pop-up — the demand stays in the Demands panel until it is met or
 * runs out.
 */
export function DemandPopup({ s, notice, actions, onDismiss }: {
  s: GameState; notice: DemandNotice; actions: DemandActions; onDismiss: () => void;
}) {
  const label = factionLabel(notice.faction);
  const live = liveDemands(s).find((l) => l.faction === notice.faction);

  if (notice.kind === 'attemptFailed' || notice.kind === 'punished' || notice.kind === 'hostile') {
    return (
      <div className="demand-scrim" role="dialog" aria-modal="true" aria-label={notice.title}>
        <div className="demand-pop bad">
          <div className="dm-banner">
            {icon(notice.faction)} {label} &middot; {notice.kind === 'hostile' ? 'hostile' : 'ultimatum ran out'}
          </div>
          <div className="dm-body">
            <h2 className="dm-h">{notice.title}</h2>
            <p className="dm-ask">{notice.text}</p>
          </div>
          <div className="dm-foot">
            <button className="btn btn-primary" onClick={onDismiss} autoFocus>Understood</button>
          </div>
        </div>
      </div>
    );
  }

  if (!live) return null;
  const kicker = notice.kind === 'issued'
    ? `A request from the ${label}`
    : `${label}: now ${STAGE_LABEL[live.demand.severity].toLowerCase()}`;

  return (
    <div className="demand-scrim" role="dialog" aria-modal="true" aria-label={live.def.title}>
      <div className={`demand-pop ${live.demand.severity}`}>
        <div className="dm-banner">
          {icon(notice.faction)} {kicker}
          <span className="dm-banner-due">{dueWord(s, live.demand.dueDay)}</span>
        </div>
        <div className="dm-body">
          <h2 className="dm-h">{live.def.title}</h2>
          <DemandDetail s={s} live={live} actions={actions} />
        </div>
        <div className="dm-foot">
          <button className="btn" onClick={onDismiss} autoFocus>Deal with it later</button>
          <span className="dm-foot-note">It stays in the Demands panel on the right.</span>
        </div>
      </div>
    </div>
  );
}

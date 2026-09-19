import type { GameState, CardDef, AlertDef, CardCategory } from '../../game/types';
import { CHARACTER_MAP, FACTIONS } from '../../game/content/country';
import { fill } from '../../game/text';
import { Prose, Glossed } from './Prose';

/**
 * The document — a card rendered as the day's "lead story". Options are the
 * decision box beneath it. See docs/mockups/layout-1-broadsheet.html for the
 * design this is built from.
 */
export function CardView({
  s, card, onChoose, alert,
}: {
  s: GameState;
  card: CardDef | AlertDef;
  onChoose: (optionId: string) => void;
  alert?: boolean;
}) {
  const actor = card.actor ? CHARACTER_MAP[card.actor] : undefined;
  const faction = card.faction ? FACTIONS[card.faction] : undefined;
  const cat = (card.category ?? 'decision') as CardCategory;

  return (
    <div className="doc-wrap">
      <div className={`doc ${alert ? 'alert' : ''}`} key={card.id}>
        <div className="dh">
          <span className="k">{CAT_LABEL[cat] ?? cat}</span>
          {faction && <span className="fct">{faction.icon} {faction.name}</span>}
          {actor && (
            <span className="f">
              <b>{actor.name}</b>
              {actor.title}
            </span>
          )}
        </div>
        <div className="db">
          {actor && (
            <div className="who-context">
              <b>{actor.name}</b> — {actor.title}. {actor.why}
            </div>
          )}
          <h1>{card.title}</h1>
          <Prose text={fill(card.body, s)} />
          {card.flavor && <div className="q"><Glossed text={fill(card.flavor, s)} /></div>}
        </div>
        <div className="opts">
          {card.options.map((o, i) => {
            const locked = o.enabled ? !o.enabled(s) : false;
            return (
              <button
                key={o.id}
                className="opt"
                disabled={locked}
                onClick={() => onChoose(o.id)}
              >
                <span className="n">{i + 1}</span>
                <span className="body">
                  <span className="lab">{fill(o.label, s)}</span>
                  {o.hint && <span className="hint"><Glossed text={fill(o.hint, s)} /></span>}
                  {locked && <span className="locked">✕ {o.lockedText ?? 'Not available to you.'}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CAT_LABEL: Partial<Record<CardCategory, string>> = {
  decision: 'Decision', person: 'People', crisis: 'Crisis', opportunity: 'Opportunity',
  policy: 'Policy', scandal: 'Scandal', intelligence: 'Intelligence', foreign: 'Foreign',
  economy: 'Treasury', security: 'Security', alert: 'Alert', minigame: 'Special',
};

export function OutcomeView({
  s, onContinue, alert,
}: { s: GameState; onContinue: () => void; alert?: boolean }) {
  const o = s.lastOutcome;
  if (!o) return null;
  const tone = o.tone ?? 'neutral';
  return (
    <div className="doc-wrap">
      <div className={`outcome ${tone}`}>
        <div className="outcome-top">
          <div className="kicker">{alert ? 'RESOLVED' : 'RECORDED'} &middot; DAY {s.day}</div>
          <h3>{o.cardTitle}</h3>
          <div className="chose">“{fill(o.optionLabel, s)}”</div>
        </div>
        <div className="outcome-body"><Prose text={fill(o.text, s)} /></div>
        {Object.keys(o.deltas).length > 0 && (
          <div className="deltas">
            {Object.entries(o.deltas).map(([k, v], i) => (
              <span
                key={k}
                className={`delta-pill ${(v as number) > 0 ? 'pos' : 'neg'}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {k.toUpperCase()} {(v as number) > 0 ? '+' : '−'}{Math.abs(v as number).toFixed(1)}
              </span>
            ))}
          </div>
        )}
        <div className="outcome-foot">
          <button className="btn btn-primary" onClick={onContinue}>Continue →</button>
          <span className="note">or press Enter</span>
        </div>
      </div>
    </div>
  );
}

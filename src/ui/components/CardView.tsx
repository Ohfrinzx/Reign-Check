import type { GameState, CardDef, AlertDef, CardCategory } from '../../game/types';
import { CHARACTER_MAP, FACTIONS } from '../../game/content/country';

const CAT_COLOR: Record<CardCategory, string> = {
  decision: '#9db4d0', person: '#b58ec9', crisis: '#d9635e', opportunity: '#6bbf8a',
  policy: '#6fa8dc', scandal: '#e0a54e', intelligence: '#8f9fb5', foreign: '#5fa8a0',
  economy: '#d9c47a', security: '#c8a45c', alert: '#d9534f', minigame: '#a98bc9',
};

function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i}>{p.split('\n').map((line, j, arr) => (
          <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
        ))}</p>
      ))}
    </>
  );
}

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
    <div className={alert ? 'alert-card' : 'card'} key={card.id}>
      {!alert && (
        <div className="card-top">
          <span className="cat-chip" style={{ color: CAT_COLOR[cat] }}>{cat}</span>
          {faction && <span className="stamp">{faction.icon} {faction.short}</span>}
          {actor && (
            <span className="who">
              <b>{actor.name}</b>
              {actor.title}
            </span>
          )}
        </div>
      )}
      <div className="card-body">
        {alert && actor && (
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="portrait" style={{ color: actor.accent }}>{actor.portrait}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{actor.name}</div>
              <div className="stamp">{actor.title}</div>
            </div>
          </div>
        )}
        <h2 className="card-title">{card.title}</h2>
        <div className="card-prose"><Prose text={card.body} /></div>
        {card.flavor && <div className="card-flavor">{card.flavor}</div>}
      </div>
      <div className="options">
        {card.options.map((o, i) => {
          const locked = o.enabled ? !o.enabled(s) : false;
          return (
            <button
              key={o.id}
              className="opt"
              disabled={locked}
              onClick={() => onChoose(o.id)}
              title={locked ? o.lockedText : undefined}
            >
              <span className="opt-key">{i + 1}</span>
              <div className="opt-label">{o.label}</div>
              {o.hint && <div className="opt-hint">{o.hint}</div>}
              {locked && <div className="opt-locked">✕ {o.lockedText ?? 'Not available to you.'}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OutcomeView({
  s, onContinue, alert,
}: { s: GameState; onContinue: () => void; alert?: boolean }) {
  const o = s.lastOutcome;
  if (!o) return null;
  const tone = o.tone ?? 'neutral';
  return (
    <div className={`outcome ${tone} ${alert ? 'alert-outcome' : ''}`}>
      <div className="outcome-top">
        <div className="stamp">{alert ? 'Alert resolved' : 'Decision recorded'} · Day {s.day}</div>
        <h3>{o.cardTitle}</h3>
        <div className="chose">“{o.optionLabel}”</div>
      </div>
      <div className="outcome-body"><Prose text={o.text} /></div>
      {Object.keys(o.deltas).length > 0 && (
        <div className="deltas">
          {Object.entries(o.deltas).map(([k, v], i) => (
            <span
              key={k}
              className={`delta-pill ${(v as number) > 0 ? 'pos' : 'neg'}`}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              {k.toUpperCase()} {(v as number) > 0 ? '+' : '−'}{Math.abs(v as number).toFixed(1)}
            </span>
          ))}
        </div>
      )}
      <div className="outcome-foot">
        <button className="btn btn-primary" onClick={onContinue} autoFocus>
          Continue →
        </button>
        <span className="stamp">or press Enter</span>
      </div>
    </div>
  );
}

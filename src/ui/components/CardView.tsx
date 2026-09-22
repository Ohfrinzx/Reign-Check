import type { GameState, CardDef, AlertDef, CardCategory } from '../../game/types';
import { CHARACTER_MAP, FACTIONS } from '../../game/content/country';
import { fill } from '../../game/text';
import { termsIn } from '../../game/glossary';
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
  if (card.tags?.includes('character-event') && card.actor && CHARACTER_MAP[card.actor]) {
    return <CharacterCardView s={s} card={card} onChoose={onChoose} />;
  }
  const actor = card.actor ? CHARACTER_MAP[card.actor] : undefined;
  const faction = card.faction ? FACTIONS[card.faction] : undefined;
  const cat = (card.category ?? 'decision') as CardCategory;
  const glossaryTerms = termsIn([
    fill(card.body, s),
    card.flavor ? fill(card.flavor, s) : '',
    ...card.options.map((o) => (o.hint ? fill(o.hint, s) : '')),
  ]);

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
        {glossaryTerms.length > 0 && (
          <div className="card-glossary">
            {glossaryTerms.map((t) => (
              <span key={t.term}><b>{t.term}</b>: {t.def}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Where a character stands with you, in words — never the number (ground rule 6). */
function standing(loyalty: number): { word: string; tone: 'good' | 'ok' | 'warn' | 'bad' } {
  if (loyalty >= 72) return { word: 'devoted to you', tone: 'good' };
  if (loyalty >= 55) return { word: 'on your side', tone: 'good' };
  if (loyalty >= 40) return { word: 'undecided', tone: 'ok' };
  if (loyalty >= 30) return { word: 'losing faith', tone: 'warn' };
  return { word: 'against you', tone: 'bad' };
}

/**
 * PHASE 3 STEP 2 — a character-driven event, drawn as a PRIVATE FILE rather
 * than the day's lead story (owner request: these should look and read
 * differently from ordinary cards, and later mini-games will get their own
 * looks too). Portrait column + typed memo + response slips side by side.
 *
 * Keeps the `.doc`, `h1` and `.opt` hooks the browser tools and keyboard
 * shortcuts rely on; everything visual is overridden under `.char-card`.
 */
function CharacterCardView({
  s, card, onChoose,
}: {
  s: GameState;
  card: CardDef | AlertDef;
  onChoose: (optionId: string) => void;
}) {
  const actor = CHARACTER_MAP[card.actor!];
  const who = s.characters[actor.id];
  const kind = card.tags?.includes('betrayal') ? 'betrayal' : 'offer';
  const stand = standing(who?.loyalty ?? 50);
  const glossaryTerms = termsIn([
    fill(card.body, s),
    ...card.options.map((o) => (o.hint ? fill(o.hint, s) : '')),
  ]);

  return (
    <div className="doc-wrap">
      <div
        className={`doc char-card ${kind}`}
        key={card.id}
        style={{ ['--acc' as string]: actor.accent }}
      >
        <div className="cc-tab">
          <span>Private file &middot; {actor.name}</span>
          <span className="cc-stamp">{kind === 'betrayal' ? 'Acted alone' : 'An offer'}</span>
        </div>
        <div className="cc-grid">
          <aside className="cc-who">
            <div className="cc-portrait" aria-hidden="true">{actor.portrait}</div>
            <div className="cc-name">{actor.name}</div>
            <div className="cc-title">{actor.title}</div>
            <div className="cc-stand">
              Where they stand: <b className={`tone-${stand.tone}`}>{stand.word}</b>
            </div>
            <div className="cc-why">{actor.why}</div>
          </aside>
          <div className="cc-memo">
            <div className="cc-kicker">
              {kind === 'betrayal' ? `${actor.name.split(' ')[0]} did this without asking you` : `${actor.name.split(' ')[0]} came to you with this`}
            </div>
            <h1>{card.title}</h1>
            <Prose text={fill(card.body, s)} />
            <div className="cc-quirk">Known for: {actor.quirk}</div>
          </div>
        </div>
        <div className="cc-replies">
          <div className="cc-replies-h">Your reply</div>
          <div className="cc-slips">
            {card.options.map((o, i) => {
              const locked = o.enabled ? !o.enabled(s) : false;
              return (
                <button key={o.id} className="opt" disabled={locked} onClick={() => onChoose(o.id)}>
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
        {glossaryTerms.length > 0 && (
          <div className="card-glossary">
            {glossaryTerms.map((t) => (
              <span key={t.term}><b>{t.term}</b>: {t.def}</span>
            ))}
          </div>
        )}
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

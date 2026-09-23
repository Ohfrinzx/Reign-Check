import type { GameState, CardDef, AlertDef, CardCategory, ShownOption } from '../../game/types';
import { CHARACTER_MAP, FACTIONS } from '../../game/content/country';
import { fill } from '../../game/text';
import { termsIn } from '../../game/glossary';
import { Prose, Glossed } from './Prose';
import { crisisOfCard, STAGE_NAMES } from '../../game/content/crises';
import type { CrisisDef } from '../../game/content/crises';
import { crisisMood } from '../../game/crises';
import { orderedOptions } from '../../game/engine';

/** Balance slice C: an option added, changed or blocked by an earlier decision. */
function optClass(o: ShownOption): string {
  return o.because ? `opt because-${o.because.kind}` : 'opt';
}

/** The inside of an option button, shared by every card layout. */
function OptionText({ s, o, locked }: { s: GameState; o: ShownOption; locked: boolean }) {
  return (
    <>
      {o.because && o.because.kind !== 'lock' && (
        <span className={`because ${o.because.kind}`}>
          <b>{o.because.kind === 'unlock' ? 'New option' : 'Changed'}</b> · {o.because.text}
        </span>
      )}
      <span className="lab">{fill(o.label, s)}</span>
      {o.hint && <span className="hint"><Glossed text={fill(o.hint, s)} /></span>}
      {locked && <span className="locked">✕ {o.lockedText ?? 'Not available to you.'}</span>}
    </>
  );
}

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
  if (card.tags?.includes('crisis-chain')) {
    const where = crisisOfCard(card as CardDef);
    if (where) return <CrisisCardView s={s} card={card} onChoose={onChoose} chain={where.chain} stage={where.stage} />;
  }
  const actor = card.actor ? CHARACTER_MAP[card.actor] : undefined;
  const faction = card.faction ? FACTIONS[card.faction] : undefined;
  const cat = (card.category ?? 'decision') as CardCategory;
  const glossaryTerms = termsIn([
    fill(card.body, s),
    card.flavor ? fill(card.flavor, s) : '',
    ...orderedOptions(s, card).map((o) => (o.hint ? fill(o.hint, s) : '')),
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
          {orderedOptions(s, card).map((o, i) => {
            const locked = o.enabled ? !o.enabled(s) : false;
            return (
              <button
                key={o.id}
                className={optClass(o)}
                disabled={locked}
                onClick={() => onChoose(o.id)}
              >
                <span className="n">{i + 1}</span>
                <span className="body">
                  <OptionText s={s} o={o} locked={locked} />
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
  const kind = card.tags?.includes('betrayal') ? 'betrayal' : card.tags?.includes('request') ? 'request' : 'offer';
  const stand = standing(who?.loyalty ?? 50);
  const glossaryTerms = termsIn([
    fill(card.body, s),
    ...orderedOptions(s, card).map((o) => (o.hint ? fill(o.hint, s) : '')),
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
          <span className="cc-stamp">{kind === 'betrayal' ? 'Acted alone' : kind === 'request' ? 'A request' : 'An offer'}</span>
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
              {kind === 'betrayal'
                ? `${actor.name.split(' ')[0]} did this without asking you`
                : kind === 'request'
                  ? `${actor.name.split(' ')[0]} asked to see you privately`
                  : `${actor.name.split(' ')[0]} came to you with this`}
            </div>
            <h1>{card.title}</h1>
            <Prose text={fill(card.body, s)} />
            <div className="cc-quirk">Known for: {actor.quirk}</div>
          </div>
        </div>
        <div className="cc-replies">
          <div className="cc-replies-h">Your reply</div>
          <div className="cc-slips">
            {orderedOptions(s, card).map((o, i) => {
              const locked = o.enabled ? !o.enabled(s) : false;
              return (
                <button key={o.id} className={optClass(o)} disabled={locked} onClick={() => onChoose(o.id)}>
                  <span className="n">{i + 1}</span>
                  <span className="body">
                    <OptionText s={s} o={o} locked={locked} />
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

/**
 * PHASE 3 STEP 3 — a crisis-chain stage, drawn as a SITUATION ROOM sheet:
 * a band with the crisis name and a three-stage tracker, the stage's story,
 * a situation log of what you ordered at earlier stages, and the options as
 * numbered orders side by side. Deliberately unlike both the lead story and
 * the character "private file" (owner request: card types should differ).
 * Keeps the `.doc`, `h1` and `.opt` hooks for tooling and keyboard use.
 */
function CrisisCardView({
  s, card, onChoose, chain, stage,
}: {
  s: GameState;
  card: CardDef | AlertDef;
  onChoose: (optionId: string) => void;
  chain: CrisisDef;
  stage: number;
}) {
  // Earlier stages of this chain, and what you chose — read back from the log.
  const earlier = [chain.stage1, chain.stage2.calm, chain.stage2.hot, chain.stage3.calm, chain.stage3.hot]
    .filter((c) => c.id !== card.id && s.seenOnce.includes(c.id));
  const history = earlier.map((c) => {
    const entry = s.log.find((l) => l.kind === 'decision' && l.title === c.title);
    return { title: c.title, day: entry?.day, chose: entry?.text.split(' — ')[0] };
  });
  const glossaryTerms = termsIn([
    fill(card.body, s),
    ...orderedOptions(s, card).map((o) => (o.hint ? fill(o.hint, s) : '')),
  ]);

  return (
    <div className="doc-wrap">
      <div className={`doc crisis-card stage-${stage}`} key={card.id}>
        <div className="cr-band">
          <span className="cr-tag">Crisis</span>
          <span className="cr-name">{chain.name}</span>
          <ol className="cr-track" aria-label={`Stage ${stage} of 3`}>
            {STAGE_NAMES.map((n, i) => (
              <li key={n} className={i + 1 < stage ? 'done' : i + 1 === stage ? 'now' : ''}>
                <span className="dot">{i + 1 < stage ? '✓' : i + 1}</span>
                <span className="lbl">{n}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="cr-grid">
          <div className="cr-main">
            <div className="cr-kicker">Stage {stage} of 3 &middot; {STAGE_NAMES[stage - 1]} &middot; Day {s.day}</div>
            <h1>{card.title}</h1>
            <Prose text={fill(card.body, s)} />
          </div>
          <aside className="cr-log">
            <div className="cr-log-h">Situation log</div>
            {history.length === 0 && <div className="cr-log-empty">This is where it starts.</div>}
            {history.map((h) => (
              <div className="cr-log-row" key={h.title}>
                <div className="d">{h.day ? `Day ${h.day}` : 'Earlier'}</div>
                <div className="t">{h.title}</div>
                {h.chose && <div className="c">You: {fill(h.chose, s)}</div>}
              </div>
            ))}
            <div className="cr-mood">So far: <b>{crisisMood(s, chain.id)}</b></div>
          </aside>
        </div>
        <div className="cr-orders">
          <div className="cr-orders-h">Your orders</div>
          <div className="cr-order-row">
            {orderedOptions(s, card).map((o, i) => {
              const locked = o.enabled ? !o.enabled(s) : false;
              return (
                <button key={o.id} className={optClass(o)} disabled={locked} onClick={() => onChoose(o.id)}>
                  <span className="n">{i + 1}</span>
                  <span className="body">
                    <OptionText s={s} o={o} locked={locked} />
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
  s, onContinue, alert, continueLabel = 'Continue →',
}: { s: GameState; onContinue: () => void; alert?: boolean; continueLabel?: string }) {
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
        {o.because && <div className={`outcome-because ${o.because.kind}`}>{o.because.text}.</div>}
        <div className="outcome-body"><Prose text={fill(o.text, s)} /></div>
        {o.marked && o.marked.length > 0 && (
          <div className="outcome-marked">
            {o.marked.map((m) => (
              <div key={m}><b>On the record:</b> {m}. This will come up again.</div>
            ))}
          </div>
        )}
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
          <button className="btn btn-primary" onClick={onContinue}>{continueLabel}</button>
          <span className="note kbd-hint">or press Enter</span>
        </div>
      </div>
    </div>
  );
}

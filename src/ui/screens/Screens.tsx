import type { GameState, StatKey } from '../../game/types';
import { COUNTRY } from '../../game/content/country';
import { STAT_ORDER, money } from '../../game/stats';
import { buildBriefing, dateLine } from '../../game/briefing';
import { currentOpening, HONORIFICS, NUM_ACTS, isActEndDay } from '../../game/state';
import { usd, usdFlow, computeBudget } from '../../game/economy';
import { fill } from '../../game/text';

const MAX_PER_SECTION = 4;

/* ------------------------------------------------------------- TITLE */

export function TitleScreen({
  name, setName, honorific, setHonorific, onNew, onContinue, savedDay, onDelete,
}: {
  name: string; setName: (v: string) => void;
  honorific: string; setHonorific: (v: string) => void;
  onNew: () => void; onContinue?: () => void; savedDay?: number; onDelete?: () => void;
}) {
  return (
    <div className="screen title-screen">
      <div className="sheet">
        <div className="title-mast">
          <div className="mark">★</div>
        </div>
        <h1 className="title-main">REIGN<br />CHECK</h1>
        <div className="title-sub">Office of the {COUNTRY.office} &middot; {COUNTRY.shortName}</div>
        <p className="title-blurb">
          The man who ran this country for nineteen years died in a stairwell nine days ago.
          You were his deputy. It was a job nobody wanted and nobody watched, which is exactly
          why you are still alive and now in charge.
          <br /><br />
          You have {COUNTRY.population} people, an army, a secret police, five power blocs that all
          want something, and a treasury held together by optimism. Parliament holds a confidence
          vote roughly every six days, three times in all. Nobody thinks you will survive the first one.
        </p>

        <div className="name-field">
          <span className="kicker">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adrin Vo"
            maxLength={28}
            spellCheck={false}
            onKeyDown={(e) => { if (e.key === 'Enter') onNew(); }}
          />
        </div>

        <div className="name-field">
          <span className="kicker">They address you as</span>
          <div className="seg">
            {HONORIFICS.map((h) => (
              <button
                key={h.id}
                className={`seg-btn ${honorific === h.id ? 'on' : ''}`}
                onClick={() => setHonorific(h.id)}
                type="button"
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="title-actions">
          <button className="btn btn-primary" onClick={onNew}>Take the job</button>
          {onContinue && (
            <button className="btn" onClick={onContinue}>Continue — Day {savedDay}</button>
          )}
          {onDelete && <button className="btn btn-ghost" onClick={onDelete}>Delete save</button>}
        </div>

        <p className="title-foot">
          {COUNTRY.name} is invented, and so are its factions, ministers, neighbours and pigeons.
          Any resemblance to a real country is a coincidence the security service would like to
          discuss with you.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- BRIEFING */

export function BriefingScreen({ s }: { s: GameState }) {
  const b = buildBriefing(s);
  const budget = computeBudget(s);
  const opening = currentOpening(s);
  const issues = b.items.filter((i) => i.kind === 'issue' || i.kind === 'demand');
  const warnings = b.items.filter((i) => i.kind === 'warning');
  const opps = b.items.filter((i) => i.kind === 'opportunity');
  const pending = b.items.filter((i) => i.kind === 'pending');
  const hints = b.items.filter((i) => i.kind === 'hint');

  return (
    <div className="screen">
      <div className="frontpage">
        <div className="fp-mast">
          <div className="edition">ACT {s.act} OF {NUM_ACTS} &middot; DAY {s.day} OF {s.maxDays}<br />{dateLine(s.day)}<br />{COUNTRY.capital}</div>
          <div className="title">The Velmorran<small>Office of the {COUNTRY.office}</small></div>
          <div className="weather">{b.weather}</div>
        </div>

        <div className="fp-strap">
          <span><b>{b.threatLevel.toUpperCase()}</b></span>
          <span>{b.threatNote}</span>
          {isActEndDay(s) && <span className="sp">Parliament holds its confidence vote tonight.</span>}
          {s.day === 1 && <span className="sp">{opening.name}</span>}
        </div>

        <div className="fp-grid">
          <div className="fp-lead">
            <h2>Today&apos;s schedule</h2>
            {b.agenda.map((a, i) => (
              <div className="run" key={i}>
                <span className="t">{a.time}</span>
                <span className="n"><b>{a.label}</b> — {a.blurb}</span>
              </div>
            ))}

            {s.day === 1 && (
              <>
                <h2>Situation</h2>
                <div className="headline-item">
                  <div className="src">{opening.name}</div>
                  <div className="b">{fill(opening.summary, s)}</div>
                </div>
              </>
            )}

            {issues.length > 0 && <h2>Known issues</h2>}
            {issues.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div className="headline-item" key={`i${i}`}>
                <div className="h">{it.headline}</div>
                {it.source && <div className="src">{it.source}</div>}
                <div className="b">{fill(it.text, s)}</div>
              </div>
            ))}
            {issues.length > MAX_PER_SECTION && <div className="more-note">+{issues.length - MAX_PER_SECTION} more — see the Dossier</div>}

            {warnings.length > 0 && <h2>What security is watching</h2>}
            {warnings.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div className="headline-item" key={`w${i}`}>
                <div className="h"><span className="sev">⚠</span> {it.headline}</div>
                {it.source && <div className="src">{it.source}</div>}
                <div className="b">{fill(it.text, s)}</div>
              </div>
            ))}
          </div>

          <div className="fp-rail">
            <h2>The budget</h2>
            <div className="cmt budget-net">
              <span className="n">Net today</span>
              <span className={`v ${budget.net >= 0 ? 'pos' : 'neg'}`}>{usdFlow(budget.net)}</span>
            </div>
            {budget.lines.map((l, i) => (
              <div className="cmt" key={i}>
                <span className="n">{l.label}{l.note ? ` · ${l.note}` : ''}</span>
                <span className={`v ${l.kind === 'revenue' ? 'pos' : 'neg'}`}>
                  {l.kind === 'revenue' ? '+' : '-'}{usd(l.amount, 2)}/day
                </span>
              </div>
            ))}
            {budget.runwayDays !== null && (
              <div className="more-note">
                At this rate, the treasury runs out in {budget.runwayDays} day{budget.runwayDays === 1 ? '' : 's'}.
              </div>
            )}

            {pending.length > 0 && <h2>Coming up</h2>}
            {pending.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div className="headline-item" key={`p${i}`}>
                <div className="h">{it.headline}</div>
                <div className="b">{fill(it.text, s)}</div>
              </div>
            ))}

            {opps.length > 0 && <h2>Opportunities</h2>}
            {opps.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div className="headline-item op" key={`o${i}`}>
                <div className="h">{it.headline}</div>
                <div className="b">{fill(it.text, s)}</div>
              </div>
            ))}

            {hints.length > 0 && <h2>Notes</h2>}
            {hints.map((it, i) => (
              <div className="headline-item" key={`h${i}`}>
                <div className="h">{it.headline}</div>
                <div className="b">{fill(it.text, s)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- NIGHT */

export function NightScreen({ s }: { s: GameState }) {
  const day = s.history[s.history.length - 1];
  const decisions = s.log.filter((l) => l.day === s.day && (l.kind === 'decision' || l.kind === 'alert'));
  const consequences = s.log.filter((l) => l.day === s.day && l.kind === 'consequence');

  return (
    <div className="screen">
      <div className="night-sheet">
        <div className="night-head">
          <div className="kicker">Evening edition &middot; {COUNTRY.capital}</div>
          <h2>End of Day {s.day}</h2>
          <div className="kicker">{dateLine(s.day)}</div>
          <div className="mood">{day?.mood}</div>
        </div>
        <div className="night-body">
          <h2 style={{ fontFamily: 'var(--black)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>The day in numbers</h2>
          <div className="ledger-grid">
            {STAT_ORDER.map((k) => {
              const before = day?.statsBefore[k] ?? s.stats[k];
              const after = s.stats[k];
              const d = Math.round((after - before) * 10) / 10;
              return (
                <div className="ledger-cell" key={k}>
                  <div className="l">{STAT_LABEL[k]}</div>
                  <div className="v">{k === 'treasury' ? money(after) : Math.round(after)}</div>
                  <div className="c" style={{ color: d > 0 ? 'var(--teal)' : d < 0 ? 'var(--red)' : 'var(--ash)' }}>
                    {d === 0 ? '—' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`}
                  </div>
                </div>
              );
            })}
          </div>

          {day && day.headlines.length > 0 && (
            <>
              <SectionTitle>On the evening news</SectionTitle>
              {day.headlines.map((h, i) => (
                <div className="headline-item" key={i}><div className="h">{h}</div></div>
              ))}
            </>
          )}

          <SectionTitle>What you decided</SectionTitle>
          {decisions.length === 0 && <div className="empty">Nothing that will be remembered.</div>}
          {decisions.map((l, i) => (
            <div className="headline-item" key={i}>
              <div className="src">{l.kind === 'alert' ? 'Breaking alert' : 'Decision'}</div>
              <div className="h">{l.title}</div>
              <div className="b">{fill(l.text.split(' — ')[0], s)}</div>
            </div>
          ))}

          {consequences.length > 0 && (
            <>
              <SectionTitle>What came due today</SectionTitle>
              {consequences.map((l, i) => (
                <div className="slip" key={i}><div className="t">{fill(l.text, s)}</div></div>
              ))}
            </>
          )}

          {s.scheduled.filter((x) => x.visible).length > 0 && (
            <>
              <SectionTitle>Still coming</SectionTitle>
              {s.scheduled.filter((x) => x.visible).slice(0, 6).map((d) => (
                <div className="slip" key={d.id}>
                  <div className="d">DAY {d.day}</div>
                  <div className="t">{fill(d.label, s)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--black)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', margin: '20px 0 10px', borderBottom: '2px solid var(--ink)', paddingBottom: 6 }}>
      {children}
    </h2>
  );
}

const STAT_LABEL: Record<StatKey, string> = {
  power: 'POWER', legitimacy: 'LEGIT', support: 'PUBLIC', treasury: 'CASH', economy: 'ECON',
  elite: 'ELITE', military: 'ARMY', security: 'SEC', stability: 'STABLE', information: 'INFO',
};

/* ------------------------------------------------------------ ENDING */

export function EndingScreen({ s, onRestart, onTitle }: { s: GameState; onRestart: () => void; onTitle: () => void }) {
  const e = s.ending;
  if (!e) return null;
  return (
    <div className="screen">
      <div className="ending-sheet">
        <div className="ending-kind">{e.kind === 'survival' ? 'You made it' : 'It is over'}</div>
        <h1 className="ending-title">{e.title}</h1>
        <div className="ending-regime">{e.regimeLabel} &middot; {e.day} days</div>

        <div className="ending-prose">
          {e.epitaph.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          <div className="ending-verdict">{e.verdict}</div>
        </div>

        <div className="legacy-grid">
          <div className="legacy-cell"><div className="l">DAYS IN OFFICE</div><div className="v">{e.day}</div></div>
          <div className="legacy-cell"><div className="l">DECISIONS TAKEN</div><div className="v">{s.stat.decisions}</div></div>
          <div className="legacy-cell"><div className="l">EMERGENCIES</div><div className="v">{s.stat.alertsSurvived}</div></div>
          <div className="legacy-cell"><div className="l">TREASURY</div><div className="v">{usd(s.stats.treasury)}</div></div>
          <div className="legacy-cell"><div className="l">TOTAL SPENT</div><div className="v">{usd(s.stat.moneySpent)}</div></div>
          <div className="legacy-cell"><div className="l">PUBLIC SUPPORT</div><div className="v">{Math.round(s.stats.support)}</div></div>
          <div className="legacy-cell"><div className="l">PROMISES KEPT</div><div className="v">{s.stat.promisesKept}</div></div>
          <div className="legacy-cell"><div className="l">PROMISES BROKEN</div><div className="v">{s.stat.promisesBroken}</div></div>
          <div className="legacy-cell"><div className="l">MINISTERS LOST</div><div className="v">{s.stat.ministersLost}</div></div>
          <div className="legacy-cell"><div className="l">DETENTIONS</div><div className="v">{s.stat.peopleJailed}</div></div>
        </div>

        {s.stat.projectsBuilt.length > 0 && (
          <div style={{ textAlign: 'left', marginBottom: 18 }}>
            <SectionTitle>What you left behind</SectionTitle>
            {s.stat.projectsBuilt.map((p, i) => <div key={i} className="headline-item op"><div className="b">{p}</div></div>)}
          </div>
        )}

        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onRestart}>Try again →</button>
          <button className="btn btn-ghost" onClick={onTitle}>Back to title</button>
        </div>
      </div>
    </div>
  );
}

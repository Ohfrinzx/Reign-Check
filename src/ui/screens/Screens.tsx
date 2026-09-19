import type { GameState, StatKey } from '../../game/types';
import { COUNTRY } from '../../game/content/country';
import { STAT_META, STAT_ORDER, money } from '../../game/stats';
import { buildBriefing, dateLine } from '../../game/briefing';
import { currentOpening, HONORIFICS } from '../../game/state';
import { computeBudget, usd, usdFlow } from '../../game/economy';
import { fill } from '../../game/text';

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
        <div className="title-seal">⬢</div>
        <h1 className="title-main">DICTATOR SANDBOX</h1>
        <div className="title-sub">Office of the {COUNTRY.office} · {COUNTRY.shortName}</div>
        <p className="title-blurb">
          The man who ran this country for nineteen years died in a stairwell nine days ago.
          You were his deputy. It was a job nobody wanted and nobody watched, which is exactly
          why you are still alive and now in charge.
          <br /><br />
          You have {COUNTRY.population} people, an army, a secret police, seven factions that all
          want something, and a treasury held together by optimism. Parliament votes on confirming
          you in thirty days. Nobody thinks you will get there.
        </p>

        <div className="name-field">
          <span className="stamp">Your name</span>
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
          <span className="stamp">They address you as</span>
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

const MAX_PER_SECTION = 4;

export function BriefingScreen({ s, onBegin }: { s: GameState; onBegin: () => void }) {
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
      <div className="dossier">
        <div className="dossier-head">
          <div className="classified">EYES ONLY</div>
          <div className="stamp">Morning Briefing · {COUNTRY.name}</div>
          <h1>Day {s.day}</h1>
          <div className="sub">{dateLine(s.day)} · {COUNTRY.capital} · {s.leaderTitle} {s.leaderName}</div>
          <div className="weather">{b.weather}</div>
        </div>

        <div className="dossier-grid">
          <div className="dossier-col">
            <div className="stamp side-section-title">Today&apos;s schedule</div>
            {b.agenda.map((a, i) => (
              <div className="agenda-item" key={i}>
                <span className="t">{a.time}</span>
                <span>
                  <span className="n">{a.label}</span>
                  <br />
                  <span className="d">{a.blurb}</span>
                </span>
              </div>
            ))}

            <div className="stamp side-section-title" style={{ marginTop: 20 }}>
              The money
            </div>
            <div className="ledger">
              <div className="ledger-cell">
                <div className="l">IN THE ACCOUNT</div>
                <div className="v" style={{ color: s.stats.treasury < 0 ? 'var(--bad)' : undefined }}>{usd(s.stats.treasury)}</div>
                <div className="c" style={{ color: budget.net >= 0 ? 'var(--good)' : 'var(--bad)' }}>{usdFlow(budget.net)}</div>
              </div>
              <div className="ledger-cell">
                <div className="l">COMING IN</div>
                <div className="v">{usd(budget.revenue, 2)}</div>
                <div className="c">per day</div>
              </div>
              <div className="ledger-cell">
                <div className="l">GOING OUT</div>
                <div className="v">{usd(budget.spending, 2)}</div>
                <div className="c">per day</div>
              </div>
              {budget.runwayDays !== null && (
                <div className="ledger-cell">
                  <div className="l">RUNWAY</div>
                  <div className="v" style={{ color: 'var(--bad)' }}>{budget.runwayDays}d</div>
                  <div className="c" style={{ color: 'var(--bad)' }}>until empty</div>
                </div>
              )}
            </div>

            <div className="stamp side-section-title" style={{ marginTop: 16 }}>
              Where you stand
            </div>
            <div className="ledger">
              {(['power', 'legitimacy', 'support', 'treasury', 'economy', 'stability'] as StatKey[]).map((k) => {
                const d = s.trend[k];
                return (
                  <div className="ledger-cell" key={k}>
                    <div className="l">{STAT_META[k].short}</div>
                    <div className="v">{k === 'treasury' ? money(s.stats[k]) : Math.round(s.stats[k])}</div>
                    {d !== undefined && (
                      <div className="c" style={{ color: d > 0 ? 'var(--good)' : 'var(--bad)' }}>
                        {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} overnight
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dossier-col">
            {s.day === 1 && (
              <>
                <div className="stamp side-section-title">Situation</div>
                <div className="dossier-item s2" style={{ marginBottom: 14 }}>
                  <span className="src">{opening.name}</span>
                  {opening.summary}
                </div>
              </>
            )}

            {issues.length > 0 && <div className="stamp side-section-title">Known Issues</div>}
            {issues.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div key={`i${i}`} className={`dossier-item s${it.severity ?? 1}`}>
                {it.source && <span className="src">{it.source}</span>}{it.text}
              </div>
            ))}

            {issues.length > MAX_PER_SECTION && <MoreNote n={issues.length - MAX_PER_SECTION} />}

            {warnings.length > 0 && <div className="stamp side-section-title" style={{ marginTop: 14 }}>What security is worried about</div>}
            {warnings.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div key={`w${i}`} className={`dossier-item s${it.severity ?? 1}`}>
                {it.source && <span className="src">{it.source}</span>}{it.text}
              </div>
            ))}

            {warnings.length > MAX_PER_SECTION && <MoreNote n={warnings.length - MAX_PER_SECTION} />}

            {pending.length > 0 && <div className="stamp side-section-title" style={{ marginTop: 14 }}>Coming up</div>}
            {pending.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div key={`p${i}`} className="dossier-item pending">
                {it.source && <span className="src">{it.source}</span>}{it.text}
              </div>
            ))}

            {pending.length > MAX_PER_SECTION && <MoreNote n={pending.length - MAX_PER_SECTION} />}

            {opps.length > 0 && <div className="stamp side-section-title" style={{ marginTop: 14 }}>Opportunities</div>}
            {opps.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div key={`o${i}`} className="dossier-item op">
                {it.source && <span className="src">{it.source}</span>}{it.text}
              </div>
            ))}

            {hints.length > 0 && <div className="stamp side-section-title" style={{ marginTop: 14 }}>Notes</div>}
            {hints.slice(0, MAX_PER_SECTION).map((it, i) => (
              <div key={`h${i}`} className="dossier-item">
                {it.source && <span className="src">{it.source}</span>}{it.text}
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="action-bar">
        <div className={`threat threat-${b.threatLevel}`}>
          <span className="threat-dot" /> {b.threatLevel}
        </div>
        <div className="note">{b.threatNote}</div>
        <button className="btn btn-primary" onClick={onBegin}>Begin the day →</button>
      </div>
    </div>
  );
}

function MoreNote({ n }: { n: number }) {
  return <div className="empty">+{n} more in the Dossier tab →</div>;
}

/* ------------------------------------------------------------- NIGHT */

export function NightScreen({ s, onNext }: { s: GameState; onNext: () => void }) {
  const day = s.history[s.history.length - 1];
  const decisions = s.log.filter((l) => l.day === s.day && (l.kind === 'decision' || l.kind === 'alert'));
  const consequences = s.log.filter((l) => l.day === s.day && l.kind === 'consequence');

  return (
    <div className="screen">
      <div className="night-sheet">
        <div className="night-head">
          <div className="stamp">Nightly Review · 22:30 · {COUNTRY.capital}</div>
          <h2>End of Day {s.day}</h2>
          <div className="stamp">{dateLine(s.day)}</div>
          <div className="mood">{day?.mood}</div>
        </div>
        <div className="night-body">
          <div className="stamp side-section-title">The day in numbers</div>
          <div className="ledger">
            {STAT_ORDER.map((k) => {
              const before = day?.statsBefore[k] ?? s.stats[k];
              const after = s.stats[k];
              const d = Math.round((after - before) * 10) / 10;
              return (
                <div className="ledger-cell" key={k}>
                  <div className="l">{STAT_META[k].short}</div>
                  <div className="v">{k === 'treasury' ? money(after) : Math.round(after)}</div>
                  <div className="c" style={{ color: d > 0 ? 'var(--good)' : d < 0 ? 'var(--bad)' : 'var(--ink-4)' }}>
                    {d === 0 ? '—' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`}
                  </div>
                </div>
              );
            })}
          </div>

          {day && day.headlines.length > 0 && (
            <>
              <div className="stamp side-section-title" style={{ marginTop: 16 }}>On the evening news</div>
              {day.headlines.map((h, i) => <div className="headline" key={i}>{h}</div>)}
            </>
          )}

          <div className="stamp side-section-title" style={{ marginTop: 18 }}>What you decided</div>
          {decisions.length === 0 && <div className="empty">Nothing that will be remembered.</div>}
          {decisions.map((l, i) => (
            <div key={i} className={`dossier-item s${l.tone === 'bad' ? 3 : l.tone === 'mixed' ? 2 : 1}`}>
              <span className="src">{l.kind === 'alert' ? 'Breaking Alert' : 'Decision'}</span>
              <b>{l.title}</b> — {fill(l.text.split(' — ')[0], s)}
            </div>
          ))}

          {consequences.length > 0 && (
            <>
              <div className="stamp side-section-title" style={{ marginTop: 18 }}>What came due today</div>
              {consequences.map((l, i) => (
                <div key={i} className="dossier-item pending">{fill(l.text, s)}</div>
              ))}
            </>
          )}

          {s.scheduled.filter((x) => x.visible).length > 0 && (
            <>
              <div className="stamp side-section-title" style={{ marginTop: 18 }}>Still coming</div>
              {s.scheduled.filter((x) => x.visible).slice(0, 6).map((d) => (
                <div key={d.id} className="dossier-item pending">
                  <span className="src">Day {d.day}</span>{fill(d.label, s)}
                </div>
              ))}
            </>
          )}

        </div>
      </div>

      <div className="action-bar">
        <span className="stamp">Day {s.day} of {s.maxDays}</span>
        <div className="note">{day?.mood}</div>
        <button className="btn btn-primary" onClick={onNext}>
          {s.day >= s.maxDays ? 'Face the confirmation vote →' : `Begin Day ${s.day + 1} →`}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ ENDING */

export function EndingScreen({ s, onRestart, onTitle }: { s: GameState; onRestart: () => void; onTitle: () => void }) {
  const e = s.ending;
  if (!e) return null;
  return (
    <div className="screen">
      <div className="ending-sheet">
        <div className="ending-kind">{e.kind === 'survival' ? 'You made it' : 'It is over'}</div>
        <h1 className="ending-title">{e.title}</h1>
        <div className="ending-regime">{e.regimeLabel} · {e.day} days</div>

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
            <div className="stamp side-section-title">What you left behind</div>
            {s.stat.projectsBuilt.map((p, i) => <div key={i} className="dossier-item op">{p}</div>)}
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

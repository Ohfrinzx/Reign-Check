import { COUNTRY, FACTIONS, FACTION_ORDER, CHARACTERS } from '../../game/content/country';
import type { GameState } from '../../game/types';
import { computeBudget, usd, usdFlow } from '../../game/economy';
import { currentOpening } from '../../game/state';

/**
 * Shown once before Day 1, and reachable any time from the top bar.
 * Answers, in order: who am I, what is this place, what am I trying to do,
 * how do I lose, who are these people, and how do I play.
 */
export function IntroScreen({ s, onBegin, returning }: { s: GameState; onBegin: () => void; returning?: boolean }) {
  const opening = currentOpening(s);
  const budget = computeBudget(s);
  const keyPeople = CHARACTERS.filter((c) => ['varkov', 'sarran', 'brask', 'doran', 'adamek', 'hess'].includes(c.id));

  return (
    <div className="screen">
      <div className="intro">
        <div className="intro-head">
          <div className="stamp">Briefing for the incoming {COUNTRY.office}</div>
          <h1>You are the {COUNTRY.office} of {COUNTRY.shortName}.</h1>
          <p className="intro-lead">
            Everyone in this building will call you <b>{honorificWord(s)}</b>. Your name is{' '}
            <b>{s.leaderName}</b>. You have had the job for nine hours.
          </p>
        </div>

        <Section title="How you got here">
          {COUNTRY.pitch.map((p, i) => <p key={i}>{p}</p>)}
        </Section>

        <Section title="What you are trying to do">
          <p>
            Stay in the job for <b>{s.maxDays} days</b>. On day {s.maxDays}, parliament votes on whether to
            confirm you. Get there still holding the office and you have won.
          </p>
          <p>
            Every day you will be handed three to five <b>cards</b>: a minister with a request, a crisis,
            an offer, a bill. You pick an option. There is no undo, and most choices solve one problem
            by creating another one later.
          </p>
        </Section>

        <Section title="The money">
          <p>
            This is a dictatorship, so there is no line between the national treasury and your money. It
            is all one pot and it is on the top bar as <b>CASH</b>.
          </p>
          <div className="intro-ledger">
            <div><span className="l">IN THE ACCOUNT</span><span className="v">{usd(s.stats.treasury)}</span></div>
            <div><span className="l">COMING IN</span><span className="v" style={{ color: 'var(--good)' }}>{usdFlow(budget.revenue)}</span></div>
            <div><span className="l">GOING OUT</span><span className="v" style={{ color: 'var(--bad)' }}>{usdFlow(-budget.spending)}</span></div>
            <div><span className="l">NET</span><span className="v" style={{ color: budget.net >= 0 ? 'var(--good)' : 'var(--bad)' }}>{usdFlow(budget.net)}</span></div>
          </div>
          <p>
            Options that cost money say so on the card. Some decisions also create a permanent line in
            the budget — a pay rise does not happen once, it happens every day forever. The{' '}
            <b>Treasury</b> tab on the right shows exactly where the money goes.
          </p>
          <p>
            If the account goes below zero the state starts missing payroll, and one in six working
            adults is on the state payroll.
          </p>
        </Section>

        <Section title="How you lose">
          <ul className="intro-list">
            <li><b>The army removes you.</b> Underfund them, break a promise to them, or order them to shoot at civilians.</li>
            <li><b>The street removes you.</b> Let public anger build with nothing to release it.</li>
            <li><b>The money runs out.</b> Spend faster than you earn for long enough.</li>
            <li><b>The rich remove you.</b> Lose the banks and the business families entirely.</li>
            <li><b>The provinces stop sending money.</b> Ignore the countryside until it stops pretending to be governed.</li>
            <li><b>A foreign government replaces you.</b> Push your main trading partner too far.</li>
          </ul>
          <p className="intro-note">
            None of these happen out of nowhere. Each one builds for days, and your morning briefing
            will tell you it is building — in words, not numbers.
          </p>
        </Section>

        <Section title="Who you have to manage">
          <div className="intro-grid">
            {FACTION_ORDER.map((id) => {
              const f = FACTIONS[id];
              return (
                <div className="intro-card" key={id}>
                  <div className="intro-card-head"><span style={{ color: 'var(--gold)' }}>{f.icon}</span> {f.name}</div>
                  <p>{f.blurb}</p>
                  <div className="intro-threat">Can do to you: {f.threat}</div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="People you will deal with constantly">
          <div className="intro-grid">
            {keyPeople.map((c) => (
              <div className="intro-card" key={c.id}>
                <div className="intro-card-head"><span style={{ color: c.accent }}>{c.portrait}</span> {c.name}</div>
                <div className="intro-role">{c.title}</div>
                <p>{c.why}</p>
              </div>
            ))}
          </div>
          <p className="intro-note">
            They remember what you do to them. The <b>People</b> tab on the right shows what each of
            them is currently thinking about you.
          </p>
        </Section>

        <Section title="Two things that will surprise you">
          <p>
            <b>Breaking alerts.</b> At unpredictable moments the day stops and something urgent takes
            over the screen. These are not random — each one is driven by pressure your own decisions
            have been building.
          </p>
          <p>
            <b>Consequences arrive late.</b> Promise the army money today and they will come back for
            it on a specific day. Your briefing keeps a diary of what is coming.
          </p>
        </Section>

        <Section title="Today's situation">
          <div className="dossier-item s2">
            <span className="src">{opening.name}</span>
            {opening.summary}
          </div>
        </Section>

        <div className="intro-foot">
          <button className="btn btn-primary" onClick={onBegin}>
            {returning ? 'Back to the day →' : 'Start Day 1 →'}
          </button>
          <span className="stamp">You can reopen this from the top bar at any time</span>
        </div>
      </div>
    </div>
  );
}

function honorificWord(s: GameState) {
  return s.honorific === 'maam' ? "ma'am" : s.honorific === 'chair' ? 'Chair' : 'sir';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="intro-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

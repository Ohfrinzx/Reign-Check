import { COUNTRY, CHARACTERS } from '../../game/content/country';
import type { GameState } from '../../game/types';
import { computeResources, DISPLAY_FACTIONS } from '../../game/display';
import { FACTIONS } from '../../game/content/country';
import { currentOpening, HONORIFICS } from '../../game/state';

/**
 * Shown once before Day 1, and reachable any time from the "Brief me" button.
 * Answers, in order: who am I, what is this place, what am I trying to do,
 * how does the money work, how do I lose, who are these people.
 */
export function IntroScreen({ s, onBegin, returning }: { s: GameState; onBegin: () => void; returning?: boolean }) {
  const opening = currentOpening(s);
  const resources = computeResources(s);
  const keyPeople = CHARACTERS.filter((c) => ['varkov', 'sarran', 'brask', 'doran', 'adamek', 'hess'].includes(c.id));
  const honorific = HONORIFICS.find((h) => h.id === s.honorific) ?? HONORIFICS[0];

  return (
    <div className="screen">
      <div className="intro">
        <div className="intro-head">
          <div className="kicker">Briefing for the incoming {COUNTRY.office}</div>
          <h1>You are the {COUNTRY.office} of {COUNTRY.shortName}.</h1>
          <p className="intro-lead">
            Everyone in this building will call you <b>{honorific.word}</b>. Your name is{' '}
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

        <Section title="The three numbers that matter">
          <p>
            Everything you are tracking boils down to three things, always visible at the top of the screen.
          </p>
          <div className="intro-ledger">
            {resources.map((r) => (
              <div key={r.key}>
                <div className="l">{r.label.toUpperCase()}</div>
                <div className="v">{r.display}</div>
              </div>
            ))}
          </div>
          <p>
            <b>Money</b> is the national treasury, and since this is a dictatorship, it is also, in practice,
            your money — one pot, no separate personal fortune. Options that cost money say so, and some
            decisions create a standing cost that repeats every day until it ends (shown as a red line item
            in Files &rarr; Standing costs).
          </p>
          <p>
            <b>Grip</b> is whether the machinery of state — the army, the police, your own information — still
            does what you tell it. <b>Legitimacy</b> is whether people accept you are supposed to have this job
            at all. Both run 0 to 100. If either one hits zero, the game usually ends badly within days.
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
            None of these happen out of nowhere. Each one builds for days, and you will see it coming as a
            card on your desk — under &ldquo;On your desk&rdquo; on the right — with a stage number and what it is about.
          </p>
        </Section>

        <Section title="Who you have to manage">
          <div className="intro-grid">
            {DISPLAY_FACTIONS.map((def) => {
              const full = FACTIONS[def.id];
              return (
                <div className="intro-card" key={def.id}>
                  <div className="intro-card-head">{def.icon} {def.label}</div>
                  <p>{full.blurb}</p>
                  <div className="intro-threat">Can do to you: {full.threat}</div>
                </div>
              );
            })}
          </div>
          <p className="intro-note">
            Two more groups matter but do not get their own file — the civil service and the provincial
            governors. You will meet them through the people below instead.
          </p>
        </Section>

        <Section title="People you will deal with constantly">
          <div className="intro-grid">
            {keyPeople.map((c) => (
              <div className="intro-card" key={c.id}>
                <div className="intro-card-head">{c.portrait} {c.name}</div>
                <div className="intro-role">{c.title}</div>
                <p>{c.why}</p>
              </div>
            ))}
          </div>
          <p className="intro-note">
            They remember what you do to them. Every card that features someone shows a line explaining who
            they are and why it matters, right under the headline.
          </p>
        </Section>

        <Section title="Today's situation">
          <div className="headline-item">
            <div className="src">{opening.name}</div>
            <div className="b">{opening.summary}</div>
          </div>
        </Section>

        <div className="intro-foot">
          <button className="btn btn-primary" onClick={onBegin}>
            {returning ? 'Back to the day →' : `Start Day ${s.day} →`}
          </button>
          <span className="note">You can reopen this from &ldquo;Brief me&rdquo; at any time</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="intro-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

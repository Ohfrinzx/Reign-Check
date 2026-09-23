import { useEffect, useMemo, useState } from 'react';
import type { ConfidenceVoteResult, GameState } from '../../game/types';
import { NUM_ACTS } from '../../game/state';
import { DISPLAY_FACTIONS } from '../../game/display';
import { TOTAL_SEATS } from '../../game/content/endings';

function marginLine(vote: ConfidenceVoteResult): string {
  const d = Math.abs(vote.margin);
  if (d === 0) return 'Exactly the number needed';
  return `${d} vote${d === 1 ? '' : 's'} ${vote.passed ? 'more' : 'fewer'} than needed`;
}

function blocName(faction: string): { label: string; icon: string } {
  const d = DISPLAY_FACTIONS.find((x) => x.id === faction);
  return { label: d?.label ?? faction, icon: d?.icon ?? '' };
}

/**
 * The confidence vote, counted bloc by bloc (balance slice B). Each row is
 * one faction's deputies; filled seats voted for you. Everything that decides
 * it is already on screen elsewhere — the faction bars, Grip, Legitimacy and
 * Money — so the reveal only shows the count, never a hidden number.
 */
export function ConfidenceVoteScreen({
  s,
  onContinue,
}: {
  s: GameState;
  onContinue: () => void;
}) {
  const vote = s.confidenceVote;
  const blocs = vote?.blocs ?? [];
  const returns = blocs.length;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!vote) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setRevealed(returns);
      return;
    }

    let cancelled = false;
    let current = 0;
    let timer = 0;
    const tick = () => {
      if (cancelled) return;
      current += 1;
      setRevealed(current);
      if (current < returns) timer = window.setTimeout(tick, current >= returns - 1 ? 900 : 620);
    };
    timer = window.setTimeout(tick, 650);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [vote, returns]);

  const complete = revealed >= returns;
  const shownScore = useMemo(
    () => blocs.slice(0, revealed).reduce((a, b) => a + b.votesFor, 0),
    [blocs, revealed],
  );

  if (!vote) return null;
  const pct = (v: number) => `${(v / TOTAL_SEATS) * 100}%`;

  const continuation = vote.passed && vote.act < NUM_ACTS
    ? 'To the evening edition →'
    : 'Read the verdict →';

  return (
    <main className="vote-screen" aria-labelledby="vote-title">
      <div className="vote-paper">
        <header className="vote-heading">
          <div className="kicker">Assembly of the Republic · Act {vote.act} confidence division</div>
          <h1 id="vote-title">PARLIAMENT IS COUNTING</h1>
          <p>The clerk is counting the blocs. The government needs {vote.threshold} of {TOTAL_SEATS} votes.</p>
        </header>

        <section className="vote-board" aria-label="Confidence count">
          <div className="vote-board-top">
            <span>Blocs counted</span>
            <b>{revealed} / {returns}</b>
          </div>
          <ol className="vote-blocs">
            {blocs.map((b, i) => {
              const { label, icon } = blocName(b.faction);
              const counted = i < revealed;
              return (
                <li key={b.faction} className={counted ? 'counted' : ''}>
                  <span className="vb-name">{icon} {label}</span>
                  <span className="vb-seats" aria-hidden="true">
                    {Array.from({ length: b.seats }, (_, n) => (
                      <i key={n} className={counted ? (n < b.votesFor ? 'for' : 'against') : ''} />
                    ))}
                  </span>
                  <span className="vb-count">{counted ? `${b.votesFor} / ${b.seats}` : '…'}</span>
                  <span className="vb-why">{counted ? b.why : 'counting'}</span>
                </li>
              );
            })}
          </ol>
          <div
            className="vote-meter"
            role="progressbar"
            aria-label="Votes for the government so far"
            aria-valuemin={0}
            aria-valuemax={TOTAL_SEATS}
            aria-valuenow={shownScore}
          >
            <span className="vote-meter-fill" style={{ width: pct(Math.max(0, Math.min(TOTAL_SEATS, shownScore))) }} />
            <span className="vote-threshold" style={{ left: pct(vote.threshold) }}>
              <b>{vote.threshold}</b>
              <small>needed</small>
            </span>
          </div>
          <div className="vote-live-number" aria-hidden={!complete}>
            <span>Votes for you</span>
            <b>{shownScore}</b>
          </div>
        </section>

        <section className={`vote-clerk ${complete ? 'revealed' : ''}`} aria-hidden={!complete}>
          <div className={`vote-stamp ${vote.passed ? 'passed' : 'failed'}`}>
            {vote.passed ? 'CONFIDENCE RETAINED' : 'CONFIDENCE WITHDRAWN'}
          </div>
          <p className="vote-margin">
            {marginLine(vote)}.
            {vote.debtCost && ' The empty treasury cost you votes in every bloc.'}
          </p>
        </section>

        <div className="vote-actions">
          {!complete ? (
            <button className="btn btn-primary" type="button" onClick={() => setRevealed(returns)}>
              Reveal now
            </button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={onContinue} autoFocus>
              {continuation}
            </button>
          )}
        </div>

        <p className="vote-method">
          Each bloc follows its faction&apos;s mood, plus your Grip and Legitimacy. A hostile faction votes against you as one. Debt costs votes everywhere. No ballot is random.
        </p>
        <div className="sr-only" aria-live="polite">
          {complete
            ? `${vote.passed ? 'Confidence retained' : 'Confidence withdrawn'}. ${vote.score} votes for, ${vote.threshold} needed. ${marginLine(vote)}.`
            : 'Parliament is counting.'}
        </div>
      </div>
    </main>
  );
}

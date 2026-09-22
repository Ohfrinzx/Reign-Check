import { useEffect, useMemo, useState } from 'react';
import type { ConfidenceVoteResult, GameState } from '../../game/types';
import { NUM_ACTS } from '../../game/state';

const RETURN_COUNT = 24;

function displayNumber(value: number): string {
  return Math.abs(value - Math.round(value)) < 0.005
    ? String(Math.round(value))
    : value.toFixed(1);
}

function marginLine(vote: ConfidenceVoteResult): string {
  const distance = Math.abs(vote.margin);
  if (distance < 0.01) {
    return vote.passed ? 'Exactly on the required line' : 'Less than 0.01 below the required line';
  }
  return `${displayNumber(distance)} point${distance >= 1.5 ? 's' : ''} ${vote.passed ? 'above' : 'below'} the required line`;
}

export function ConfidenceVoteScreen({
  s,
  onContinue,
}: {
  s: GameState;
  onContinue: () => void;
}) {
  const vote = s.confidenceVote;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!vote) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setRevealed(RETURN_COUNT);
      return;
    }

    let cancelled = false;
    let current = 0;
    let timer = 0;
    const tick = () => {
      if (cancelled) return;
      current += 1;
      setRevealed(current);
      if (current < RETURN_COUNT) {
        timer = window.setTimeout(tick, current >= RETURN_COUNT - 5 ? 270 : 125);
      }
    };
    timer = window.setTimeout(tick, 650);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [vote]);

  const complete = revealed >= RETURN_COUNT;
  const shownScore = vote ? vote.score * (revealed / RETURN_COUNT) : 0;
  const cells = useMemo(() => Array.from({ length: RETURN_COUNT }, (_, i) => i), []);

  if (!vote) return null;

  const continuation = vote.passed && vote.act < NUM_ACTS
    ? 'To the evening edition →'
    : 'Read the verdict →';

  return (
    <main className="vote-screen" aria-labelledby="vote-title">
      <div className="vote-paper">
        <header className="vote-heading">
          <div className="kicker">Assembly of the Republic · Act {vote.act} confidence division</div>
          <h1 id="vote-title">PARLIAMENT IS COUNTING</h1>
          <p>The clerk is entering the chamber&apos;s returns. The government needs {displayNumber(vote.threshold)}.</p>
        </header>

        <section className="vote-board" aria-label="Confidence count">
          <div className="vote-board-top">
            <span>Returns received</span>
            <b>{revealed} / {RETURN_COUNT}</b>
          </div>
          <div className="vote-lamps" aria-hidden="true">
            {cells.map((cell) => (
              <i key={cell} className={cell < revealed ? 'counted' : ''} />
            ))}
          </div>
          <div
            className="vote-meter"
            role="progressbar"
            aria-label="Current confidence count"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(shownScore)}
          >
            <span className="vote-meter-fill" style={{ width: `${Math.max(0, Math.min(100, shownScore))}%` }} />
            <span className="vote-threshold" style={{ left: `${vote.threshold}%` }}>
              <b>{displayNumber(vote.threshold)}</b>
              <small>required</small>
            </span>
          </div>
          <div className="vote-live-number" aria-hidden={!complete}>
            <span>Recorded confidence</span>
            <b>{displayNumber(shownScore)}</b>
          </div>
        </section>

        <section className={`vote-clerk ${complete ? 'revealed' : ''}`} aria-hidden={!complete}>
          <div className="vote-factors">
            <div><span>Grip</span><b>{displayNumber(vote.grip)}</b></div>
            <div><span>Legitimacy</span><b>{displayNumber(vote.legitimacy)}</b></div>
            <div><span>Required</span><b>{displayNumber(vote.threshold)}</b></div>
          </div>
          <div className={`vote-stamp ${vote.passed ? 'passed' : 'failed'}`}>
            {vote.passed ? 'CONFIDENCE RETAINED' : 'CONFIDENCE WITHDRAWN'}
          </div>
          <p className="vote-margin">{marginLine(vote)}.</p>
        </section>

        <div className="vote-actions">
          {!complete ? (
            <button className="btn btn-primary" type="button" onClick={() => setRevealed(RETURN_COUNT)}>
              Reveal now
            </button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={onContinue} autoFocus>
              {continuation}
            </button>
          )}
        </div>

        <p className="vote-method">The result combines the government&apos;s Grip and Legitimacy. No ballot is random.</p>
        <div className="sr-only" aria-live="polite">
          {complete
            ? `${vote.passed ? 'Confidence retained' : 'Confidence withdrawn'}. Score ${displayNumber(vote.score)}, required ${displayNumber(vote.threshold)}. ${marginLine(vote)}.`
            : 'Parliament is counting.'}
        </div>
      </div>
    </main>
  );
}


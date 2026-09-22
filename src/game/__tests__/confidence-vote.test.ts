import { describe, expect, it } from 'vitest';
import { computeConfidenceVote } from '../content/endings';
import { beginStages, completeConfidenceVote, openShop } from '../engine';
import { createGame, SAVE_VERSION } from '../state';
import type { GameState } from '../types';

function voteDay(act: 1 | 2 | 3, value: number): GameState {
  const s = createGame({ seed: 71, mandateId: 'accident' });
  s.day = act * 6;
  s.act = act;
  s.phase = 'briefing';
  s.todayDeck = [];
  s.stats.power = value;
  s.stats.security = value;
  s.stats.military = value;
  s.stats.information = value;
  s.stats.legitimacy = value;
  s.stats.support = value;
  s.stats.stability = value;
  return s;
}

describe('confidence-vote reveal', () => {
  it('bumps the save version and stores a serialisable, exact result snapshot', () => {
    expect(SAVE_VERSION).toBe(10);
    const s = beginStages(voteDay(1, 40));
    expect(s.phase).toBe('vote');
    expect(s.confidenceVote).toEqual({
      act: 1,
      day: 6,
      grip: 40,
      legitimacy: 40,
      score: 40,
      threshold: 40,
      margin: 0,
      passed: true,
    });
    expect(JSON.parse(JSON.stringify(s.confidenceVote))).toEqual(s.confidenceVote);
  });

  it('uses unrounded values and equality passes at every act threshold', () => {
    for (const [act, threshold] of [[1, 40], [2, 47], [3, 54]] as const) {
      expect(computeConfidenceVote(voteDay(act, threshold)).passed).toBe(true);
      const below = computeConfidenceVote(voteDay(act, threshold - 0.1));
      expect(below.passed).toBe(false);
      expect(below.margin).toBeCloseTo(-0.1);
    }
  });

  it('blocks the shop until a passing reveal is completed, then advances once', () => {
    const pending = beginStages(voteDay(1, 45));
    expect(openShop(pending)).toEqual(pending);

    const completed = completeConfidenceVote(pending);
    expect(completed.phase).toBe('night');
    expect(completed.act).toBe(2);
    expect(completed.log.filter((l) => l.title === 'Confidence vote')).toHaveLength(1);
    expect(completeConfidenceVote(completed)).toEqual(completed);
  });

  it('applies the frozen failure exactly once', () => {
    const pending = beginStages(voteDay(2, 46.9));
    expect(pending.phase).toBe('vote');
    expect(pending.confidenceVote?.passed).toBe(false);

    // The snapshot, rather than a second live-stat calculation, owns the
    // transition once the result has been put in front of the player.
    pending.stats.power = 100;
    pending.stats.security = 100;
    pending.stats.military = 100;
    pending.stats.information = 100;
    pending.stats.legitimacy = 100;
    pending.stats.support = 100;
    pending.stats.stability = 100;

    const ended = completeConfidenceVote(pending);
    expect(ended.phase).toBe('ended');
    expect(ended.ending?.id).toBe('noConfidence');
    expect(ended.log.filter((l) => l.title === 'PARLIAMENT WITHDREW ITS CONFIDENCE')).toHaveLength(1);
    expect(completeConfidenceVote(ended)).toEqual(ended);
  });

  it('turns a passing third-act reveal into survival', () => {
    const pending = beginStages(voteDay(3, 60));
    expect(pending.phase).toBe('vote');
    const ended = completeConfidenceVote(pending);
    expect(ended.phase).toBe('ended');
    expect(ended.ending?.id).toBe('survival');
  });
});

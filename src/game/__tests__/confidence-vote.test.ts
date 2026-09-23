import { describe, expect, it } from 'vitest';
import { computeConfidenceVote, TOTAL_SEATS, VOTES_NEEDED } from '../content/endings';
import { DISPLAY_FACTIONS } from '../display';
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
  s.stats.treasury = 30;
  for (const d of DISPLAY_FACTIONS) s.factions[d.id].loyalty = value;
  return s;
}

describe('confidence-vote reveal', () => {
  it('bumps the save version and stores a serialisable snapshot, counted in faction blocs', () => {
    expect(SAVE_VERSION).toBe(14);
    const s = beginStages(voteDay(1, 50));
    expect(s.phase).toBe('vote');
    const v = s.confidenceVote!;
    expect(v.blocs.map((b) => b.faction)).toEqual(['staff', 'sable', 'concord', 'combine', 'chorus']);
    expect(v.blocs.reduce((a, b) => a + b.seats, 0)).toBe(TOTAL_SEATS);
    expect(v.score).toBe(v.blocs.reduce((a, b) => a + b.votesFor, 0));
    expect(v.threshold).toBe(VOTES_NEEDED[0]);
    expect(v.margin).toBe(v.score - v.threshold);
    expect(v.passed).toBe(true);
    expect(v.debtCost).toBe(false);
    expect(JSON.parse(JSON.stringify(v))).toEqual(v);
  });

  it('the bar rises each act: the same government passes act 1 and fails act 3', () => {
    expect(VOTES_NEEDED[0]).toBeLessThan(VOTES_NEEDED[1]);
    expect(VOTES_NEEDED[1]).toBeLessThan(VOTES_NEEDED[2]);
    expect(computeConfidenceVote(voteDay(1, 52)).passed).toBe(true);
    expect(computeConfidenceVote(voteDay(3, 52)).passed).toBe(false);
    expect(computeConfidenceVote(voteDay(3, 70)).score).toBe(TOTAL_SEATS);
  });

  it('a hostile faction votes against you as one bloc (owner playtest: Elites hostile, still 100%)', () => {
    const s = voteDay(3, 75);
    const before = computeConfidenceVote(s);
    expect(before.passed).toBe(true);
    s.factions.concord.loyalty = 10; // Elites hostile
    s.factions.chorus.loyalty = 25; // Street furious
    const after = computeConfidenceVote(s);
    const elites = after.blocs.find((b) => b.faction === 'concord')!;
    expect(elites.votesFor).toBe(0);
    expect(elites.why).toMatch(/hostile/);
    expect(after.score).toBeLessThan(before.score - elites.seats);
    expect(after.passed).toBe(false);
  });

  it('an empty treasury costs votes in every bloc', () => {
    const s = voteDay(2, 62);
    const solvent = computeConfidenceVote(s);
    s.stats.treasury = -20;
    const broke = computeConfidenceVote(s);
    expect(broke.debtCost).toBe(true);
    for (const [i, b] of broke.blocs.entries()) expect(b.votesFor).toBeLessThanOrEqual(solvent.blocs[i].votesFor);
    expect(broke.score).toBeLessThan(solvent.score - 20);
  });

  it('blocks the shop until a passing reveal is completed, then advances once', () => {
    const pending = beginStages(voteDay(1, 55));
    expect(openShop(pending)).toEqual(pending);

    const completed = completeConfidenceVote(pending);
    expect(completed.phase).toBe('night');
    expect(completed.act).toBe(2);
    expect(completed.log.filter((l) => l.title === 'Confidence vote')).toHaveLength(1);
    expect(completeConfidenceVote(completed)).toEqual(completed);
  });

  it('lets a higher-priority ending pre-empt the reveal on a vote day', () => {
    const state = voteDay(1, 60);
    state.hidden.coup = 100;
    const ended = beginStages(state);
    expect(ended.phase).toBe('ended');
    expect(ended.ending?.id).toBe('coup');
    expect(ended.confidenceVote).toBeUndefined();
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

import { describe, expect, it } from 'vitest';
import { computeConfidenceVote } from '../content/endings';
import { createGame } from '../state';
import type { GameState } from '../types';

function position(grip: number, legitimacy: number): GameState {
  const s = createGame({ seed: 73, mandateId: 'accident' });
  Object.assign(s.stats, { power: grip, security: grip, military: grip, information: grip,
    legitimacy, support: legitimacy, stability: legitimacy, treasury: 20 });
  for (const f of Object.values(s.factions)) f.loyalty = 50;
  return s;
}

describe('coalition strategy', () => {
  it('institutional and public blocs reward different governing strengths', () => {
    const institution = computeConfidenceVote(position(80, 40));
    const publicTrust = computeConfidenceVote(position(40, 80));
    const votes = (v: typeof institution, id: string) => v.blocs.find(b => b.faction === id)!.votesFor;
    for (const id of ['staff', 'sable']) expect(votes(institution, id)).toBeGreaterThan(votes(publicTrust, id));
    for (const id of ['combine', 'chorus']) expect(votes(publicTrust, id)).toBeGreaterThan(votes(institution, id));
    expect(votes(publicTrust, 'concord')).toBe(votes(institution, 'concord'));
  });

  it('a tiny deficit does not suddenly throw away twenty seats', () => {
    const s = position(60, 60);
    s.stats.treasury = 0;
    const solvent = computeConfidenceVote(s).score;
    s.stats.treasury = -0.1;
    expect(solvent - computeConfidenceVote(s).score).toBeLessThanOrEqual(2);
    let previous = solvent;
    for (const debt of [0.1, 1, 5, 10, 20, 35]) {
      s.stats.treasury = -debt;
      const v = computeConfidenceVote(s);
      expect(v.score).toBeLessThanOrEqual(previous);
      expect(v.debtCost).toBe(true);
      previous = v.score;
    }
    expect(previous).toBeLessThan(solvent - 30);
  });

  it('neither governing strength buys a hostile faction and the vote uses no RNG', () => {
    const s = position(100, 100);
    s.factions.staff.loyalty = 19;
    const before = JSON.stringify(s);
    expect(computeConfidenceVote(s).blocs[0].votesFor).toBe(0);
    expect(JSON.stringify(s)).toBe(before);
  });
});

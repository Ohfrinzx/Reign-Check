import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay } from '../engine';
import {
  ISSUE_BELOW, MAX_LIVE, STAGE_DAYS, bribeBlockReason, bribeDemand, dismissDemandNotice,
  liveDemands, meetBlockReason, meetCost, meetDemand, moveOdds,
} from '../demands';
import { DEMANDS, DEMAND_MAP, FACTION_MOVES } from '../content/demands';
import { DISPLAY_FACTIONS } from '../display';
import { forcedEnding } from '../content/endings';
import type { FactionId, GameState } from '../types';

/** A mid-act morning, ready for prepareDay() to run the upkeep. */
function morning(seed = 5, day = 3): GameState {
  const s = createGame({ seed, mandateId: 'accident' });
  s.day = day;
  for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
  return s;
}

/** A state holding a live demand for `faction`, in the day's first stage. */
function withDemand(faction: FactionId, severity: 'murmur' | 'formal' | 'ultimatum' = 'murmur', seed = 5): GameState {
  const s = morning(seed);
  const def = DEMANDS.find((d) => d.faction === faction)!;
  s.factions[faction].demand = { id: def.id, issuedDay: s.day, dueDay: s.day + STAGE_DAYS, severity, bribes: 0 };
  s.phase = 'stage';
  s.stats.treasury = 40;
  return s;
}

describe('faction demands (Phase 3 step 1)', () => {
  it('content: every demand belongs to a visible faction, every visible faction has demands and a move, every move has an ending', () => {
    const shown = new Set(DISPLAY_FACTIONS.map((d) => d.id));
    for (const d of DEMANDS) {
      expect(shown.has(d.faction), d.id).toBe(true);
      expect(d.meetCost).toBeGreaterThan(0);
      expect(d.meet, `${d.id} has no downside`).toBeTruthy();
    }
    for (const id of shown) {
      expect(DEMANDS.filter((d) => d.faction === id).length, id).toBeGreaterThanOrEqual(2);
      const move = FACTION_MOVES[id];
      expect(move, id).toBeTruthy();
      expect(forcedEnding(morning(), move!.endingId), move!.endingId).toBeTruthy();
    }
  });

  it('a visible faction below the patience line issues a request, with a pop-up notice', () => {
    const s = morning();
    s.factions.staff.patience = ISSUE_BELOW - 15;
    const t = prepareDay(s);
    const d = t.factions.staff.demand;
    expect(d).toBeTruthy();
    expect(d!.severity).toBe('murmur');
    expect(d!.dueDay).toBe(t.day + STAGE_DAYS);
    expect(DEMAND_MAP[d!.id].faction).toBe('staff');
    expect(t.demandNotices).toEqual([{ faction: 'staff', kind: 'issued', day: t.day }]);
    // survives a save round trip as plain data
    expect(JSON.parse(JSON.stringify(t)).factions.staff.demand).toEqual(d);
  });

  it('hidden factions never make demands, and at most MAX_LIVE are live at once', () => {
    const s = morning();
    s.factions.grey.patience = 5;
    s.factions.provinces.patience = 5;
    let t = prepareDay(s);
    expect(t.factions.grey.demand).toBeUndefined();
    expect(t.factions.provinces.demand).toBeUndefined();

    for (const id of DISPLAY_FACTIONS.map((d) => d.id)) t.factions[id].patience = 5;
    for (let i = 0; i < 4; i++) { t.phase = 'night'; t = prepareDay({ ...t, day: t.day + 1 }); }
    expect(liveDemands(t).length).toBeLessThanOrEqual(MAX_LIVE);
  });

  it('an unmet demand escalates past its due day and costs support; a request drops if patience recovers', () => {
    const s = withDemand('combine');
    s.factions.combine.patience = 20;
    s.factions.combine.demand!.dueDay = s.day - 1;
    const before = s.factions.combine.loyalty;
    const t = prepareDay(s);
    expect(t.factions.combine.demand!.severity).toBe('formal');
    expect(t.factions.combine.loyalty).toBeLessThan(before);
    expect(t.demandNotices.some((n) => n.faction === 'combine' && n.kind === 'escalated')).toBe(true);
    expect(meetCost(t, 'combine')).toBeGreaterThan(DEMAND_MAP[t.factions.combine.demand!.id].meetCost);

    const r = withDemand('combine');
    r.factions.combine.patience = 80;
    expect(prepareDay(r).factions.combine.demand).toBeUndefined();
  });

  it('meeting a demand pays the stage price, clears it and its pop-up, and is blocked without the money', () => {
    const s = withDemand('staff', 'formal');
    s.demandNotices = [{ faction: 'staff', kind: 'escalated', day: s.day }];
    const cost = meetCost(s, 'staff');
    const t = meetDemand(s, 'staff');
    expect(t.factions.staff.demand).toBeUndefined();
    expect(t.stats.treasury).toBeCloseTo(s.stats.treasury - cost, 1);
    expect(t.factions.staff.loyalty).toBeGreaterThan(s.factions.staff.loyalty);
    expect(t.demandNotices).toEqual([]);
    expect(s.factions.staff.demand, 'input state was not mutated').toBeTruthy();

    const poor = withDemand('staff');
    poor.stats.treasury = 0.2;
    expect(meetBlockReason(poor, 'staff')).toMatch(/Not enough money/);
    expect(meetDemand(poor, 'staff').factions.staff.demand).toBeTruthy();

    const midAlert = withDemand('staff');
    midAlert.phase = 'alert';
    expect(meetBlockReason(midAlert, 'staff')).toBeTruthy();
  });

  it('a bribe is sometimes taken (pay, more time) and sometimes refused (no charge, no second try)', () => {
    let taken = 0, refused = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = withDemand('concord', 'formal', seed);
      const due = s.factions.concord.demand!.dueDay;
      const t = bribeDemand(s, 'concord');
      const d = t.factions.concord.demand!;
      if (d.dueDay > due) {
        taken++;
        expect(d.dueDay).toBe(due + STAGE_DAYS);
        expect(t.stats.treasury).toBeLessThan(s.stats.treasury);
      } else {
        refused++;
        expect(d.bribeRefused).toBe(true);
        expect(t.stats.treasury).toBe(s.stats.treasury);
        expect(bribeBlockReason(t, 'concord')).toMatch(/refused/);
        expect(bribeDemand(t, 'concord')).toEqual(t);
      }
    }
    expect(taken).toBeGreaterThan(0);
    expect(refused).toBeGreaterThan(0);
  });

  it('a lapsed ultimatum from a loyal-enough faction is punished but never ends the run', () => {
    const s = withDemand('chorus', 'ultimatum');
    s.phase = 'night';
    s.factions.chorus.loyalty = 60;
    s.factions.chorus.demand!.dueDay = s.day - 1;
    expect(moveOdds(s, 'chorus').attempt).toBe(0);
    const t = prepareDay(s);
    expect(t.factions.chorus.demand).toBeUndefined();
    expect(t.ending).toBeUndefined();
    expect(t.demandNotices.some((n) => n.kind === 'punished')).toBe(true);
  });

  it('a lapsed ultimatum from a hostile, strong faction can remove you — or fail — depending on the roll, reproducibly', () => {
    const results: string[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const s = withDemand('staff', 'ultimatum', seed);
      s.phase = 'night';
      s.factions.staff.loyalty = 5;
      s.factions.staff.power = 100;
      s.factions.staff.patience = 5;
      s.factions.sable.loyalty = 5;
      s.stats.security = 5;
      s.factions.staff.demand!.dueDay = s.day - 1;
      const t = prepareDay(s);
      const again = prepareDay(s);
      expect(again.ending?.id).toBe(t.ending?.id);
      if (t.ending) {
        expect(t.ending.id).toBe('coup');
        expect(t.phase).toBe('ended');
        results.push('removed');
      } else {
        expect(t.demandNotices.some((n) => n.kind === 'attemptFailed' || n.kind === 'punished')).toBe(true);
        results.push('survived');
      }
    }
    expect(results).toContain('removed');
    expect(results).toContain('survived');
  });

  it('dismissing a pop-up removes only that notice, not the demand', () => {
    const s = withDemand('sable');
    s.demandNotices = [
      { faction: 'sable', kind: 'issued', day: s.day },
      { faction: 'staff', kind: 'punished', day: s.day, title: 'x', text: 'y' },
    ];
    const t = dismissDemandNotice(s);
    expect(t.demandNotices).toHaveLength(1);
    expect(t.demandNotices[0].faction).toBe('staff');
    expect(t.factions.sable.demand).toBeTruthy();
  });

  it('demand characters exist in the cast', () => {
    for (const d of DEMANDS) expect(morning().characters[d.from], `${d.id} from ${d.from}`).toBeTruthy();
  });
});

import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay, chooseOption, orderedOptions, lookupCard } from '../engine';
import { MARKS, DEMAND_REACTIONS, CONSEQUENCES } from '../content/consequences';
import { TRIGGERED_DEMANDS, DEMAND_MAP } from '../content/demands';
import { DISPLAY_FACTIONS } from '../display';
import { factionMemories, markFlag, MEMORY_DAYS } from '../consequences';
import { bribeBlockReason, meetCost, DEMAND_FACTIONS } from '../demands';
import { buildBriefing } from '../briefing';
import type { GameState } from '../types';

const VISIBLE = new Set(DISPLAY_FACTIONS.map((d) => d.id));

/** A calm morning: nobody angry, nothing boiling over, no demands. */
function morning(marks: Record<string, number> = {}, day = 7): GameState {
  const s = createGame({ seed: 91, mandateId: 'accident' });
  s.day = day;
  for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
  for (const f of Object.values(s.factions)) { f.patience = 80; f.loyalty = 50; }
  for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
  for (const [m, d] of Object.entries(marks)) s.flags[markFlag(m)] = d;
  return s;
}

describe('balance slice D: content', () => {
  it('faction feelings, demand reactions and triggered demands only name real marks and visible factions', () => {
    const ids = new Set(MARKS.map((m) => m.id));
    for (const m of MARKS) for (const f of Object.keys(m.factions ?? {})) expect(VISIBLE.has(f as never), `${m.id}/${f}`).toBe(true);
    for (const r of DEMAND_REACTIONS) {
      expect(ids.has(r.mark), r.mark).toBe(true);
      expect(DEMAND_FACTIONS).toContain(r.faction);
    }
    for (const d of TRIGGERED_DEMANDS) {
      expect(ids.has(d.triggeredBy!), d.id).toBe(true);
      expect(DEMAND_FACTIONS).toContain(d.faction);
      expect(DEMAND_MAP[d.id]).toBe(d);
    }
    for (const c of CONSEQUENCES) if (c.faction) expect(VISIBLE.has(c.faction), `${c.card}/${c.option}`).toBe(true);
  });

  it('there are now plenty of blocked options, and most marks have feelings', () => {
    expect(CONSEQUENCES.filter((c) => c.kind === 'lock').length).toBeGreaterThanOrEqual(14);
    expect(MARKS.filter((m) => m.factions).length).toBe(MARKS.length);
  });
});

describe('balance slice D: factions remember', () => {
  it('a decision shows under the faction and nudges its mood for a few mornings, then stops', () => {
    const s = chooseOption({ ...morning(), phase: 'stage', current: { cardId: 'strike-begins', isAlert: false } }, 'soldiers');
    expect(factionMemories(s, 'combine')[0]).toMatchObject({ id: 'soldiers-gorsk', weight: -2, day: 7 });
    const control = structuredClone(s);
    delete control.flags[markFlag('soldiers-gorsk')];
    const next = (x: GameState) => prepareDay({ ...structuredClone(x), day: x.day + 1, phase: 'night' });
    let a = s, b = control;
    for (let i = 0; i < MEMORY_DAYS; i++) { a = next(a); b = next(b); }
    expect(a.factions.combine.loyalty).toBeLessThan(b.factions.combine.loyalty - MEMORY_DAYS);
    const gap = b.factions.combine.loyalty - a.factions.combine.loyalty;
    a = next(a); b = next(b);
    expect(Math.abs((b.factions.combine.loyalty - a.factions.combine.loyalty) - gap)).toBeLessThan(1.5);
  });
});

describe('balance slice D: decisions trigger faction demands', () => {
  it('the morning after a decision, that faction makes its demand, and says why', () => {
    const s = prepareDay(morning({ 'arrested-vel': 6 }));
    expect(s.factions.chorus.demand?.id).toBe('street-release-vel');
    expect(s.demandNotices.some((n) => n.faction === 'chorus' && n.kind === 'issued')).toBe(true);
    const item = buildBriefing(s).items.find((i) => /Sanna Vel released/.test(i.headline));
    expect(item?.text).toMatch(/^Because you had Sanna Vel arrested live on air \(day 6\)\./);
  });

  it('a triggered demand is never drawn at random, and goes stale after its window', () => {
    const late = prepareDay(morning({ 'arrested-vel': 1 }, 12));
    expect(late.factions.chorus.demand?.id).not.toBe('street-release-vel');
    const none = prepareDay(morning());
    for (const f of DEMAND_FACTIONS) expect(TRIGGERED_DEMANDS.map((d) => d.id)).not.toContain(none.factions[f].demand?.id);
  });
});

describe('balance slice D: memories change how demands can be handled', () => {
  function withDemand(marks: Record<string, number>, faction: 'combine' | 'chorus', id: string): GameState {
    const s = morning(marks);
    s.phase = 'briefing';
    s.factions[faction].demand = { id, issuedDay: 7, dueDay: 9, severity: 'murmur', bribes: 0 };
    return s;
  }
  it('cheaper, dearer and no-bribe, each with its reason', () => {
    const base = meetCost(withDemand({}, 'combine', 'workers-mine-wages'), 'combine');
    expect(meetCost(withDemand({ 'paid-miners': 3 }, 'combine', 'workers-mine-wages'), 'combine')).toBeLessThan(base);
    expect(meetCost(withDemand({ 'refused-miners': 3 }, 'combine', 'workers-mine-wages'), 'combine')).toBeGreaterThan(base);
    const why = bribeBlockReason(withDemand({ 'soldiers-gorsk': 3 }, 'combine', 'workers-mine-wages'), 'combine');
    expect(why).toMatch(/^Because you sent soldiers to the Gorsk mines \(day 3\): the unions will not take money/);
  });
});

describe('balance slice D: faction reactions on cards', () => {
  it('a faction-held reason says who remembers', () => {
    const s = morning({ 'soldiers-gorsk': 4 });
    const clear = orderedOptions(s, lookupCard('alert-square')!).find((o) => o.id === 'clear')!;
    expect(clear.enabled?.(s)).toBe(false);
    expect(clear.lockedText).toMatch(/^Because you sent soldiers to the Gorsk mines \(day 4\) — the army remembers: Varkov/);
  });
});

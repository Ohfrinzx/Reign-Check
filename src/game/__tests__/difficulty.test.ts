import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay, orderedOptions, lookupCard } from '../engine';
import { buildBriefing } from '../briefing';
import { HOSTILE_ACTIONS } from '../content/demands';
import { DEMAND_FACTIONS, hostileSinceFlag } from '../demands';
import { HOSTILE_BELOW, isHostile } from '../display';
import { regimeLabel } from '../content/endings';
import { CARDS } from '../content/cards';
import type { GameState } from '../types';

/** A calm morning where nobody is angry and nothing is boiling over. */
function morning(seed = 31): GameState {
  const s = createGame({ seed, mandateId: 'accident' });
  s.day = 5;
  for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
  for (const f of Object.values(s.factions)) { f.patience = 80; f.loyalty = 50; }
  for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
  return s;
}
const nextMorning = (s: GameState) => prepareDay({ ...structuredClone(s), day: s.day + 1, phase: 'night' });

describe('balance slice B: hostile factions act', () => {
  it('content: every visible faction has a pop-up and rotating hostile actions that do something', () => {
    for (const id of DEMAND_FACTIONS) {
      const def = HOSTILE_ACTIONS[id];
      expect(def?.turned, id).toBeTruthy();
      expect(def!.actions.length, id).toBeGreaterThanOrEqual(3);
      for (const a of def!.actions) expect(Object.keys(a.effects).length, `${id}/${a.title}`).toBeGreaterThan(0);
    }
  });

  it('a faction at the bottom of its bar turns hostile: one pop-up, an action every morning, a front-page line', () => {
    const calm = prepareDay(morning());
    const s = morning();
    s.factions.concord.loyalty = HOSTILE_BELOW - 8; // Elites hostile
    expect(isHostile(s, 'concord')).toBe(true);
    const t = prepareDay(s);
    expect(t.demandNotices.filter((n) => n.kind === 'hostile' && n.faction === 'concord')).toHaveLength(1);
    expect(t.flags[hostileSinceFlag('concord')]).toBe(t.day);
    expect(t.stats.treasury).toBeLessThan(calm.stats.treasury);
    const line = buildBriefing(t).items.find((i) => i.source === 'Elites' && /working against you/.test(i.headline));
    expect(line?.severity).toBe(3);

    const u = nextMorning({ ...t, demandNotices: [] });
    expect(u.demandNotices.filter((n) => n.kind === 'hostile')).toHaveLength(0);
    const acts = u.log.filter((l) => l.title.startsWith('Elites: ') && l.tone === 'bad' && l.kind === 'consequence');
    expect(acts.length).toBeGreaterThanOrEqual(2);
    expect(acts[acts.length - 1].title).not.toBe(acts[acts.length - 2].title);
  });

  it('a hostile faction makes a demand even while patient, and stops acting once won back', () => {
    const s = morning();
    s.factions.combine.loyalty = 10;
    const t = prepareDay(s);
    expect(t.factions.combine.demand).toBeTruthy();
    t.factions.combine.loyalty = 45;
    const u = nextMorning(t);
    expect(u.flags[hostileSinceFlag('combine')]).toBe(0);
    expect(u.log.some((l) => l.title === 'The Workers stepped back')).toBe(true);
  });

  it('public support follows the Street and the Workers', () => {
    const s = morning();
    s.stats.support = 87;
    s.factions.chorus.loyalty = 15;
    s.factions.combine.loyalty = 30;
    let t = prepareDay(s);
    for (let i = 0; i < 5; i++) t = nextMorning(t);
    expect(t.stats.support).toBeLessThan(65);
  });
});

describe('balance slice B: option order is shuffled per run', () => {
  it('is a permutation, stable for a run (reloads show the same order), different across runs', () => {
    const a = createGame({ seed: 101 });
    const b = createGame({ seed: 202 });
    let differs = 0;
    for (const c of CARDS) {
      const oa = orderedOptions(a, c).map((o) => o.id);
      expect([...oa].sort()).toEqual(c.options.map((o) => o.id).sort());
      expect(orderedOptions(JSON.parse(JSON.stringify(a)), c).map((o) => o.id)).toEqual(oa);
      if (orderedOptions(b, c)[0].id !== oa[0]) differs++;
    }
    expect(differs).toBeGreaterThan(CARDS.length / 3);
    expect(lookupCard(CARDS[0].id)!.options).toBe(CARDS[0].options); // content untouched
  });
});

describe('balance slice B: the regime label reads as English', () => {
  it('puts the modifier after the article', () => {
    const s = createGame({ seed: 1 });
    for (const k of Object.keys(s.regime) as (keyof GameState['regime'])[]) s.regime[k] = 0;
    s.regime.repression = 30;
    s.regime.reform = 20;
    expect(regimeLabel(s)).toBe('An Earnest Security State');
    s.regime.reform = 0;
    expect(regimeLabel(s)).toBe('A Security State');
  });
});

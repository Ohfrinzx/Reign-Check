import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, finishMinigame, lookupCard, activeCard, orderedOptions,
} from '../engine';
import * as P from '../minigames/palace';
import { bulletinSetup, scoreBulletin, rundownLength, MISTAKES_ALLOWED } from '../minigames/bulletin';
import type { BulletinCall } from '../minigames/bulletin';
import { DAILY_FROM_DAY, PLOT_AT, isMinigameCard, minigameSeed } from '../minigames';
import { MINIGAME_CARDS, MG_CARD, DAILY_MINIGAMES, minigameIntro } from '../content/minigames';
import { markFlag } from '../consequences';
import type { GameState } from '../types';

/** A greedy commander: attack when it can, otherwise close on the nearest column. */
function greedy(start: P.PalaceState): P.PalaceState {
  let s = start;
  for (let g = 0; g < 200 && !s.over; g++) {
    let best: { v: number; g: string; t: { col: number; row: number } } | null = null;
    for (const gu of s.guards) for (const t of P.guardTargets(s, gu.id)) if (t.attack) {
      const r = s.rebels.find((x) => x.col === t.col && x.row === t.row)!;
      const v = r.row * 10 + (r.armour === 1 ? 5 : 0);
      if (!best || v > best.v) best = { v, g: gu.id, t };
    }
    if (!best && s.rebels.length) {
      const threat = [...s.rebels].sort((a, b) => b.row - a.row)[0];
      const goal = { col: threat.col, row: Math.min(P.ROWS - 1, threat.row + 1) };
      for (const gu of s.guards) for (const t of P.guardTargets(s, gu.id)) {
        const v = -Math.max(Math.abs(t.col - goal.col), Math.abs(t.row - goal.row)) * 10 + t.row;
        if (!best || v > best.v) best = { v, g: gu.id, t };
      }
    }
    s = best ? P.playOrder(s, best.g, best.t.col, best.t.row) : P.endTurn(s);
  }
  return s;
}

function idle(start: P.PalaceState): P.PalaceState {
  let s = start;
  for (let g = 0; g < 100 && !s.over; g++) s = P.endTurn(s);
  return s;
}

/** A run on the morning of `day`, factions calm. */
function morning(day: number, seed = 5): GameState {
  const s = createGame({ seed, mandateId: 'accident' });
  s.day = day;
  s.act = Math.ceil(day / 6);
  for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
  for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
  return s;
}

describe('Hold the Palace (rules)', () => {
  it('the same seed gives the same night', () => {
    const d = P.palaceDifficulty('plot', 2);
    expect(P.palaceSetup(42, d)).toEqual(P.palaceSetup(42, d));
    expect(P.palaceSetup(42, d)).not.toEqual(P.palaceSetup(43, d));
    expect(P.palaceSetup(42, d).spawns.length).toBe(d.columns);
  });

  it('units stay inside the cordon and never stack', () => {
    const s = P.palaceStart(P.palaceSetup(1, P.palaceDifficulty('plot', 1)));
    for (const g of s.guards) {
      for (const t of P.guardTargets(s, g.id)) {
        expect(t.row).toBeGreaterThanOrEqual(P.CORDON_ROW);
        expect(s.guards.some((o) => o.col === t.col && o.row === t.row)).toBe(false);
      }
    }
  });

  it('attacking stops a column; an armoured one takes two attacks; an order is the whole turn', () => {
    const setup: P.PalaceSetup = { spawns: [{ turn: 0, col: 2, armour: 2 }, { turn: 0, col: 0, armour: 1 }], dawnTurn: 20 };
    let s = P.palaceStart(setup);
    s = { ...s, rebels: [{ id: 'r1', col: 2, row: 4, armour: 2 }, { id: 'r2', col: 0, row: 3, armour: 1 }] };
    const hit = P.moveGuard(s, 'g2', 2, 4);
    expect(hit.rebels.find((r) => r.id === 'r1')?.armour).toBe(1);
    expect(hit.guards.find((g) => g.id === 'g2')).toMatchObject({ col: 2, row: 5 }); // stayed put
    expect(hit.movesLeft).toBe(0);
    const capture = P.moveGuard(s, 'g1', 0, 3);
    expect(capture.rebels.some((r) => r.id === 'r2')).toBe(false);
    expect(capture.captured).toBe(1);
    expect(capture.guards.find((g) => g.id === 'g1')).toMatchObject({ col: 0, row: 3 });
  });

  it('a roadblock makes a column swerve, or stop when it cannot', () => {
    const setup: P.PalaceSetup = { spawns: [{ turn: 0, col: 2, armour: 1 }], dawnTurn: 20 };
    const s = P.palaceStart(setup);
    const blocked = { ...s, rebels: [{ id: 'r1', col: 2, row: 3, armour: 1 as const }], guards: [{ id: 'g1', col: 2, row: 4 }] };
    const after = P.endTurn(blocked);
    const r = after.rebels.find((x) => x.id === 'r1')!;
    expect(r.row).toBe(4);
    expect(Math.abs(r.col - 2)).toBe(1);
    const walled = { ...blocked, guards: [{ id: 'g1', col: 1, row: 4 }, { id: 'g2', col: 2, row: 4 }, { id: 'g3', col: 3, row: 4 }] };
    expect(P.endTurn(walled).rebels.find((x) => x.id === 'r1')).toMatchObject({ col: 2, row: 3 });
  });

  it('columns past the last row break the gates; GATES of them lose the Palace', () => {
    const setup: P.PalaceSetup = { spawns: [{ turn: 0, col: 2, armour: 1 }, { turn: 0, col: 4, armour: 1 }], dawnTurn: 20 };
    let s = P.palaceStart(setup);
    s = { ...s, guards: [], rebels: [{ id: 'a', col: 1, row: P.ROWS - 1, armour: 1 }, { id: 'b', col: 3, row: P.ROWS - 1, armour: 1 }], spawned: 2 };
    const after = P.endTurn(s);
    expect(after.breaches).toBe(2);
    expect(after.over).toBe('lost');
    // an extra gate (the vetted garrison) holds one more
    const sturdy = { ...s, gates: 3, gatesMax: 3 };
    expect(P.endTurn(sturdy).over).not.toBe('lost');
  });

  it('a player who does nothing always loses; a decent one usually wins, less often later', () => {
    const rate = (d: P.PalaceDifficulty, play: (s: P.PalaceState) => P.PalaceState) => {
      let won = 0;
      for (let i = 0; i < 120; i++) if (play(P.palaceStart(P.palaceSetup(i * 991 + 7, d))).over === 'won') won++;
      return won / 120;
    };
    for (const d of [P.palaceDifficulty('plot', 1), P.palaceDifficulty('strike', 3, 0.75)]) {
      expect(rate(d, idle)).toBe(0);
    }
    const act1 = rate(P.palaceDifficulty('plot', 1), greedy);
    const act3 = rate(P.palaceDifficulty('plot', 3), greedy);
    const strike = rate(P.palaceDifficulty('strike', 2, 0.75), greedy);
    expect(act1).toBeGreaterThan(0.75);
    expect(act3).toBeLessThan(act1);
    expect(act3).toBeGreaterThan(0.45);
    expect(strike).toBeGreaterThan(0.25);
    expect(strike).toBeLessThan(0.7);
  });

  it('every night ends by dawn', () => {
    for (let i = 0; i < 40; i++) {
      const s = idle(P.palaceStart(P.palaceSetup(i, P.palaceDifficulty('plot', 2))));
      expect(s.over).toBeDefined();
    }
  });
});

describe('The 7pm Bulletin (rules)', () => {
  it('the same state and seed give the same rundown; it grows by act; about half is damaging', () => {
    for (const act of [1, 2, 3]) {
      const s = morning(act * 6 - 3);
      const a = bulletinSetup(s, 99), b = bulletinSetup(s, 99);
      expect(a).toEqual(b);
      expect(a.stories.length).toBe(rundownLength(act));
      const bad = a.stories.filter((x) => x.bad).length;
      expect(bad).toBeGreaterThanOrEqual(Math.floor(a.stories.length / 2) - 1);
      expect(bad).toBeLessThanOrEqual(Math.ceil(a.stories.length / 2) + 1);
      expect(a.spikes).toBe(bad);
      expect(new Set(a.stories.map((x) => x.headline)).size).toBe(a.stories.length);
    }
  });

  it('is woven from the run: your scandals and the front page\'s warnings make the news', () => {
    const s = morning(4);
    s.scandals = [{ id: 'sc-1', name: 'The stairwell', detail: 'Nobody has said who was in it.', heat: 60, buried: false, day: 2 }];
    s.hidden.unrest = 70;
    const found = new Set<string>();
    for (let seed = 0; seed < 30; seed++) for (const st of bulletinSetup(s, seed).stories) found.add(st.headline);
    expect([...found]).toContain('New questions: The stairwell');
    expect([...found]).toContain('Bread queues on the east side');
  });

  it('paying Loz earlier buys a spike; threatening him costs one', () => {
    const s = morning(4);
    const base = bulletinSetup(s, 7).spikes;
    s.flags[markFlag('bought-news')] = 2;
    expect(bulletinSetup(s, 7).spikes).toBe(base + 1);
    expect(bulletinSetup(s, 7).spikeNote).toMatch(/Because you paid Loz/);
    delete s.flags[markFlag('bought-news')];
    s.flags[markFlag('threatened-loz')] = 2;
    expect(bulletinSetup(s, 7).spikes).toBe(base - 1);
  });

  it('scoring: a perfect bulletin wins, running everything loses, untouched stories air', () => {
    const setup = bulletinSetup(morning(4), 3);
    const perfect: BulletinCall[] = setup.stories.map((x) => (x.bad ? 'spike' : 'run'));
    expect(scoreBulletin(setup, perfect)).toMatchObject({ won: true, mistakes: 0, score: 100 });
    const careless: BulletinCall[] = setup.stories.map(() => 'run');
    expect(scoreBulletin(setup, careless).won).toBe(false);
    const asleep = setup.stories.map(() => null);
    expect(scoreBulletin(setup, asleep).badAired).toBe(setup.stories.filter((x) => x.bad).length);
    // exactly MISTAKES_ALLOWED mistakes still wins
    const two = [...perfect];
    let made = 0;
    for (let i = 0; i < two.length && made < MISTAKES_ALLOWED; i++) if (setup.stories[i].bad) { two[i] = 'run'; made++; }
    expect(scoreBulletin(setup, two).won).toBe(true);
  });
});

describe('mini-games in the run', () => {
  it('content: every mini-game card has exactly `won` and `lost`, a key, and is never drawn at random', () => {
    for (const c of MINIGAME_CARDS) {
      expect(c.minigame, c.id).toBeTruthy();
      expect(c.options.map((o) => o.id).sort()).toEqual(['lost', 'won']);
      expect(c.base).toBe(0);
      expect(isMinigameCard(c.id)).toBe(true);
      expect(lookupCard(c.id)).toBe(c);
      const intro = minigameIntro(morning(4), c.id);
      expect(intro.story.length).toBeGreaterThan(1);
      expect(intro.howTo.length).toBeGreaterThan(2);
    }
    for (const id of DAILY_MINIGAMES) expect(isMinigameCard(id)).toBe(true);
  });

  it('daily: from day 2 one drawn card becomes a mini-game; the day keeps its length; never on day 1', () => {
    const d1 = prepareDay(morning(1));
    expect(d1.todayDeck.some(isMinigameCard)).toBe(false);
    for (let seed = 1; seed <= 30; seed++) {
      const s = prepareDay(morning(DAILY_FROM_DAY + (seed % 10), seed));
      if (s.phase !== 'briefing') continue;
      expect(s.todayDeck.filter(isMinigameCard).length, `seed ${seed}`).toBe(1);
      expect(s.todayDeck.length).toBe(s.agenda.length);
    }
  });

  it('daily: a queued card (a crisis stage, a private file) is never the one replaced', () => {
    const s = morning(5, 9090);
    s.hidden.unrest = 70; // starts a crisis: its stage-1 card is queued first
    const t = prepareDay(s);
    expect(t.todayDeck[0]).toMatch(/^crisis-|bread/);
    expect(isMinigameCard(t.todayDeck[0])).toBe(false);
    expect(t.todayDeck.some(isMinigameCard)).toBe(true);
  });

  it('an officers\' plot comes when coup pressure is high — once per act — and replaces the daily game', () => {
    const s = morning(4);
    s.hidden.coup = PLOT_AT + 5;
    const t = prepareDay(s);
    expect(t.todayDeck[0]).toBe(MG_CARD.palacePlot);
    expect(t.todayDeck.filter(isMinigameCard)).toEqual([MG_CARD.palacePlot]);
    // the next morning, same act: no second plot
    const u = { ...structuredClone(t), day: 5, phase: 'night' as const };
    u.hidden.coup = PLOT_AT + 5;
    expect(prepareDay(u).todayDeck.includes(MG_CARD.palacePlot)).toBe(false);
  });

  it('winning or losing goes through the card: Legitimacy, the faction, the record', () => {
    const s = morning(4);
    s.hidden.coup = PLOT_AT + 5;
    const open = beginStages(prepareDay(s));
    expect(activeCard(open)?.id).toBe(MG_CARD.palacePlot);
    const won = finishMinigame(open, true, 90);
    expect(won.phase).toBe('resolve');
    expect(won.hidden.coup).toBeLessThan(open.hidden.coup - 20);
    expect(won.flags.mgScore).toBe(90);
    expect(won.flags[markFlag('held-palace')]).toBe(open.day);
    expect(won.lastOutcome?.text).toMatch(/Not one column/);
    const lost = finishMinigame(open, false, 10);
    expect(lost.stats.legitimacy).toBeLessThan(open.stats.legitimacy);
    expect(lost.factions.staff.loyalty).toBeLessThan(open.factions.staff.loyalty);
    expect(lost.ending).toBeUndefined(); // a plot is a heavy hit, not the end
    expect(continueAfterResolve(lost).phase).not.toBe('ended');
    // and the same result through chooseOption (how the tests and probe play it)
    expect(chooseOption(open, 'lost').stats.legitimacy).toBe(lost.stats.legitimacy);
  });

  it('finishMinigame does nothing on an ordinary card; the same game comes back after a reload', () => {
    const s = beginStages(prepareDay(morning(1)));
    const card = activeCard(s)!;
    expect(card.minigame).toBeUndefined();
    expect(finishMinigame(s, true, 50)).toBe(s);
    expect(orderedOptions(s, card).length).toBeGreaterThan(1);
    const d = morning(4);
    const t = prepareDay(d);
    const id = t.todayDeck.find(isMinigameCard)!;
    expect(minigameSeed(JSON.parse(JSON.stringify(t)), id)).toBe(minigameSeed(t, id));
  });
});

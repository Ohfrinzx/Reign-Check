import { describe, it, expect } from 'vitest';
import { createGame } from '../state';
import { fill } from '../text';
import { applyEffects } from '../effects';
import { makeRng } from '../rng';
import { SHOP_ITEMS } from '../content/shop';
import { canAfford, canCutNow, canFireNow } from '../shop';
import {
  prepareDay, beginStages, activeCard, chooseOption, continueAfterResolve,
  buyShopItem, useFavour,
} from '../engine';
import type { GameState } from '../types';

describe('review regressions', () => {
  it('uses spoken honorifics instead of UI IDs', () => {
    expect(fill('Yes, {sir}.', createGame({ seed: 1, honorific: 'maam' }))).toBe("Yes, ma'am.");
    expect(fill('Yes, {sir}.', createGame({ seed: 1, honorific: 'chair' }))).toBe('Yes, Chair.');
    expect(createGame({ seed: 1, honorific: "ma'am" }).honorific).toBe("ma'am");
  });
  it('generates stable unique effect IDs from a save, regardless of other runs', () => {
    const saved = createGame({ seed: 5, mandateId: 'accident' });
    const a = structuredClone(saved), b = structuredClone(saved);
    const effects = { schedule: [{ inDays: 1, label: 'first' }, { inDays: 1, label: 'second' }], commitments: [{ label: 'fee', perDay: 1 }] };
    applyEffects(a, effects, makeRng(1));
    applyEffects(createGame({ seed: 99 }), effects, makeRng(1));
    applyEffects(b, effects, makeRng(1));
    expect(a).toEqual(b);
    expect(new Set(a.scheduled.map((d) => d.id)).size).toBe(2);
    const resumed = JSON.parse(JSON.stringify(a)) as GameState;
    applyEffects(resumed, effects, makeRng(1));
    expect(new Set(resumed.scheduled.map((d) => d.id)).size).toBe(4);
  });

  it('a repeated decision cannot charge, resolve, or advance twice', () => {
    const s = beginStages(prepareDay(createGame({ seed: 50, mandateId: 'accident' })));
    const before = structuredClone(s);
    const option = activeCard(s)!.options.find((o) => !o.enabled || o.enabled(s))!;
    const chosen = chooseOption(s, option.id);
    expect(chooseOption(chosen, option.id)).toEqual(chosen);
    const next = continueAfterResolve(chosen);
    expect(continueAfterResolve(next)).toEqual(next);
    expect(s).toEqual(before);
  });

  it('even an empty day creates a summary and runs the confidence vote', () => {
    const s = createGame({ seed: 50, mandateId: 'accident' });
    s.day = 6; s.stats.power = 0;
    const ended = beginStages(s);
    expect(ended.history).toHaveLength(1);
    expect(ended.phase).toBe('ended');
    expect(ended.ending).toBeTruthy();
  });

  it('cash-paying deals and zero-cash exits work in debt', () => {
    const s = createGame({ seed: 50, mandateId: 'accident' });
    s.stats.treasury = -30; s.phase = 'shop';
    const deal = SHOP_ITEMS.find((d) => d.cost < 0)!;
    s.shopStock = [deal.id];
    expect(canAfford(s, deal)).toBe(true);
    const bought = buyShopItem(s, deal.id);
    expect(bought.shopBought).toContain(deal.id);
    expect(bought.stats.treasury).toBeGreaterThan(s.stats.treasury);
    expect(canCutNow(s, { ...deal, cutCost: 0 })).toBe(true);
    expect(canFireNow(s, { ...deal, fireCost: 0 })).toBe(true);
    expect(canAfford(s, { ...deal, cost: 1 })).toBe(false);
  });

  it('a favour preserves the active decision receipt and cannot change an ended run', () => {
    const s = beginStages(prepareDay(createGame({ seed: 8, mandateId: 'accident' })));
    const favour = SHOP_ITEMS.find((d) => d.kind === 'favour')!;
    s.heldFavours = [favour.id];
    // Balance slice A: a favour that needs a target (A Quiet Word needs a
    // scandal) cannot be spent with nothing to aim it at.
    s.scandals = [{ id: 'sc-test', name: 'The test story', detail: 'x', heat: 40, buried: false, day: 1 }];
    const chosen = chooseOption(s, activeCard(s)!.options[0].id);
    const spent = useFavour(chosen, favour.id);
    expect(spent.lastOutcome).toEqual(chosen.lastOutcome);
    expect(spent.heldFavours).toHaveLength(0);
    chosen.phase = 'ended';
    expect(useFavour(chosen, favour.id)).toEqual(chosen);
  });

  it('construction is charged once per day, including the day it completes', () => {
    const s = createGame({ seed: 4, mandateId: 'accident' });
    for (const daysLeft of [1, 2, 3]) {
      const building = structuredClone(s);
      building.projects.push({ id: 'test-road', name: 'Road', detail: 'Work', daysLeft, upkeep: 2 });
      const baseline = prepareDay(s), actual = prepareDay(building);
      expect(baseline.stats.treasury - actual.stats.treasury).toBeCloseTo(2);
      expect(actual.projects.length).toBe(daysLeft === 1 ? 0 : 1);
    }
  });

  it.each([
    ['helicopter', 'mil-budget-due', 'pay'],
    ['hadem-road', 'hadem-road-due', 'fund'],
    ['lithium-wages', 'lithium-clause-due', 'pay'],
  ])('kept promise %s is closed and never later penalised as broken', (id, cardId, optionId) => {
    const s = createGame({ seed: 20, mandateId: 'accident' });
    s.phase = 'stage'; s.current = { cardId, isAlert: false };
    s.promises = [{ id, text: 'Test promise', to: 'staff', dueDay: 1 }];
    const kept = chooseOption(s, optionId);
    expect(kept.promises[0].kept).toBe(true);
    expect(kept.stat.promisesKept).toBe(1);
    const later = prepareDay({ ...kept, day: 4 });
    expect(later.stat.promisesBroken).toBe(0);
    expect(later.promises[0].broken).toBeUndefined();
  });

  it('explicitly broken promises count once and negotiated extensions move the due date', () => {
    const s = createGame({ seed: 20, mandateId: 'accident' });
    s.phase = 'stage'; s.current = { cardId: 'mil-budget-due', isAlert: false };
    s.promises = [{ id: 'helicopter', text: 'Helicopters', to: 'staff', dueDay: 1 }];
    const broken = chooseOption(s, 'renege');
    expect(prepareDay({ ...broken, day: 4 }).stat.promisesBroken).toBe(1);
    const extended = chooseOption(s, 'part');
    expect(extended.promises[0].dueDay).toBe(7);
    expect(prepareDay({ ...extended, day: 4 }).stat.promisesBroken).toBe(0);
  });
});

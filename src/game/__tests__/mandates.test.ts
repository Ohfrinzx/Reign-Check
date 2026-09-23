import { describe, it, expect } from 'vitest';
import { createGame, SAVE_VERSION } from '../state';
import { MANDATES, MANDATE_MAP } from '../content/mandates';
import { SHOP_ITEMS } from '../content/shop';
import { applyEffects } from '../effects';
import { makeRng } from '../rng';
import { computeResources } from '../display';
import { computeBudget } from '../economy';
import { shopPrice } from '../shop';
import {
  prepareDay, beginStages, activeCard, chooseOption, continueAfterResolve,
  continueAfterAlert, openShop, leaveShop, completeConfidenceVote,
  orderedOptions,
} from '../engine';
import type { GameState } from '../types';

function step(s: GameState): GameState {
  if (s.phase === 'briefing') return beginStages(s);
  if (s.phase === 'stage' || s.phase === 'alert') {
    const option = orderedOptions(s, activeCard(s)!).find((o) => !o.enabled || o.enabled(s))!;
    return chooseOption(s, option.id);
  }
  if (s.phase === 'resolve') return continueAfterResolve(s);
  if (s.phase === 'alertResolve') return continueAfterAlert(s);
  if (s.phase === 'vote') return completeConfidenceVote(s);
  if (s.phase === 'night') return openShop(s);
  if (s.phase === 'shop') return leaveShop(s);
  return s;
}

const legitimacy = (s: GameState) => computeResources(s).find((r) => r.key === 'legitimacy')!.value;

describe('mandates', () => {
  it('provides six unique, explained starts and rolls all of them reproducibly', () => {
    expect(MANDATES).toHaveLength(6);
    expect(new Set(MANDATES.map((m) => m.id)).size).toBe(6);
    const rolled = new Set<string>();
    for (let seed = 0; seed < 80; seed++) {
      const s = createGame({ seed });
      rolled.add(s.mandateId);
      expect(s.mandateId).toBe(createGame({ seed }).mandateId);
      expect(MANDATE_MAP[s.mandateId].ruleText.length).toBeGreaterThan(20);
      expect(s.version).toBe(SAVE_VERSION);
    }
    expect(rolled.size).toBe(6);
  });

  it('opts.unlockedMandateIds restricts both the roll and an explicit pick (§4.5 step 2)', () => {
    const allowed = ['stairwell', 'landslide'];
    for (let seed = 0; seed < 40; seed++) {
      expect(allowed).toContain(createGame({ seed, unlockedMandateIds: allowed }).mandateId);
    }
    // an explicit pick outside the allowed set falls back to a roll from the
    // allowed set, never the locked id itself
    const denied = createGame({ seed: 3, mandateId: 'pay-deal', unlockedMandateIds: allowed });
    expect(allowed).toContain(denied.mandateId);
    expect(denied.mandateId).not.toBe('pay-deal');
    // an explicit pick inside the allowed set is honoured as usual
    expect(createGame({ seed: 3, mandateId: 'landslide', unlockedMandateIds: allowed }).mandateId).toBe('landslide');
    // an allow-list matching nothing never locks out every mandate — falls back to the full pool
    const nothingAllowed = createGame({ seed: 5, unlockedMandateIds: ['not-a-real-id'] });
    expect(MANDATES.map((m) => m.id)).toContain(nothingAllowed.mandateId);
  });

  it('sets the specified starting money, factions, and displayed legitimacy', () => {
    const baseline = createGame({ seed: 41, mandateId: 'accident' });
    const start = (mandateId: string) => createGame({ seed: 41, mandateId });
    expect(start('landslide').stats.treasury - baseline.stats.treasury).toBeCloseTo(-20);
    expect(start('landslide').factions.chorus.loyalty - baseline.factions.chorus.loyalty).toBeCloseTo(30);
    expect(start('handover').stats.treasury - baseline.stats.treasury).toBeCloseTo(30);
    expect(start('handover').factions.chorus.loyalty - baseline.factions.chorus.loyalty).toBeCloseTo(-20);
    expect(start('stairwell').factions.staff.loyalty - baseline.factions.staff.loyalty).toBeCloseTo(20);
    expect(legitimacy(start('stairwell')) - legitimacy(baseline)).toBeCloseTo(-20, 0);
    expect(legitimacy(start('clean-hands')) - legitimacy(baseline)).toBeCloseTo(10, 0);
    expect(start('clean-hands').factions.sable.loyalty - baseline.factions.sable.loyalty).toBeCloseTo(-15);
    expect(start('pay-deal').stats.treasury - baseline.stats.treasury).toBeCloseTo(-10);
    expect(start('pay-deal').factions.combine.loyalty - baseline.factions.combine.loyalty).toBeCloseTo(20);
  });

  it('applies daily decay after the first morning and composes with owned protection', () => {
    const s = createGame({ seed: 20, mandateId: 'accident' });
    const first = prepareDay({ ...s, mandateId: 'landslide' });
    expect(first.stats).toEqual(prepareDay({ ...s, mandateId: 'clean-hands' }).stats);
    const baseline = prepareDay({ ...s, day: 2 });
    const decayed = prepareDay({ ...s, day: 2, mandateId: 'landslide' });
    expect(legitimacy(baseline) - legitimacy(decayed)).toBeCloseTo(2, 0);
    const protectedRun = prepareDay({ ...s, day: 2, mandateId: 'landslide', owned: ['fixer'] });
    expect(protectedRun.stats.legitimacy).toBeGreaterThan(decayed.stats.legitimacy);
    expect(s.day).toBe(1);
  });

  it('discounts every positive shop price but never reduces a payout', () => {
    const s = createGame({ seed: 7, mandateId: 'handover' });
    for (const item of SHOP_ITEMS) {
      const expected = item.cost > 0 ? Math.round(item.cost * 0.75 * 10) / 10 : item.cost;
      expect(shopPrice(s, item), item.id).toBe(expected);
    }
  });

  it('makes Street escalation faster without amplifying relief or other factions', () => {
    const s = createGame({ seed: 7, mandateId: 'accident' });
    const h = structuredClone(s); h.mandateId = 'handover';
    const e = { hidden: { unrest: 10, coup: 10 }, factions: { chorus: { patience: -10 }, staff: { patience: -10 } } };
    applyEffects(s, e, makeRng(1)); applyEffects(h, e, makeRng(1));
    expect(h.hidden.unrest - s.hidden.unrest).toBeCloseTo(5);
    expect(h.hidden.coup).toBe(s.hidden.coup);
    expect(h.factions.chorus.patience - s.factions.chorus.patience).toBeCloseTo(-5);
    expect(h.factions.staff.patience).toBe(s.factions.staff.patience);
    const before = h.hidden.unrest;
    applyEffects(h, { hidden: { unrest: -4 } }, makeRng(1));
    expect(h.hidden.unrest).toBeCloseTo(before - 4);
    s.factions.chorus.loyalty = 20; h.factions.chorus.loyalty = 20;
    const a = prepareDay(s), b = prepareDay(h);
    expect(h.factions.chorus.patience - b.factions.chorus.patience).toBeGreaterThan(s.factions.chorus.patience - a.factions.chorus.patience);
  });

  it('adds one actual decision for the Accident without repeating a card', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = createGame({ seed, mandateId: 'accident' });
      const ordinary = prepareDay({ ...s, mandateId: 'clean-hands' });
      const extra = prepareDay(s);
      expect(extra.todayDeck.length).toBe(ordinary.todayDeck.length + 1);
      expect(extra.agenda.length).toBe(extra.todayDeck.length);
      expect(new Set(extra.todayDeck).size).toBe(extra.todayDeck.length);
    }
  });

  it('runs the audit and wage rules, and shows the wage cost in the budget', () => {
    const s = createGame({ seed: 40, mandateId: 'accident' }); s.day = 2;
    const base = prepareDay(s);
    const audit = prepareDay({ ...s, mandateId: 'clean-hands' });
    expect(audit.hidden.corruption).toBeCloseTo(base.hidden.corruption - 1.5);
    expect(audit.hidden.scandal).toBeCloseTo(base.hidden.scandal + 1.5);
    const wages = prepareDay({ ...s, mandateId: 'pay-deal' });
    expect(wages.factions.combine.loyalty).toBeCloseTo(base.factions.combine.loyalty + 1);
    expect(wages.factions.combine.patience).toBeCloseTo(base.factions.combine.patience + 1);
    const pay = createGame({ seed: 40, mandateId: 'pay-deal' });
    expect(computeBudget(pay).lines.find((l) => l.label === 'The wage agreement')?.amount).toBe(0.6);
  });

  it('delivers the Stairwell recording once on day 4, including after reload', () => {
    let s = prepareDay(createGame({ seed: 5150, mandateId: 'stairwell' }));
    const seen: number[] = [];
    for (let i = 0; i < 1000 && s.phase !== 'ended'; i++) {
      if (s.phase === 'stage' && s.current?.cardId === 'mandate-stairwell-file') seen.push(s.day);
      s = step(JSON.parse(JSON.stringify(s)));
    }
    expect(seen).toEqual([4]);
    expect(s.phase).toBe('ended');
  });

  it.each(MANDATES.map((m) => m.id))('%s plays to an ending and survives full-state save/replay', (mandateId) => {
    let a = prepareDay(createGame({ seed: 424242, mandateId }));
    let b = JSON.parse(JSON.stringify(a)) as GameState;
    for (let i = 0; i < 1000 && a.phase !== 'ended'; i++) {
      a = step(a);
      b = step(JSON.parse(JSON.stringify(b)));
      expect(JSON.parse(JSON.stringify(a))).toEqual(JSON.parse(JSON.stringify(b)));
    }
    expect(a.phase).toBe('ended');
    expect(a.ending).toBeTruthy();
    expect(a.day).toBeLessThanOrEqual(18);
  });
});

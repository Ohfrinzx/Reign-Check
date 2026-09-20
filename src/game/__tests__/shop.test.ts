import { describe, it, expect } from 'vitest';
import { createGame } from '../state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert,
  activeCard, openShop, buyShopItem, useFavour, leaveShop,
} from '../engine';
import { SHOP_ITEMS, SHOP_MAP } from '../content/shop';
import { ACT_STOCK, NIGHTLY_STOCK, buyLimit, eligibleStock, roomIsClosed, shopPrice } from '../shop';
import { makeRng } from '../rng';
import { applyEffects } from '../effects';
import type { GameState } from '../types';

/**
 * Plays until the shop opens on `untilDay`, buying nothing along the way.
 * Returns the state sitting in the Back Room, or the terminal state if the
 * run ended first.
 */
function playToShop(seed: number, untilDay: number, choose = (n: number) => n - 1): GameState {
  let s = prepareDay(createGame({ seed }));
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 3000) {
    if (s.phase === 'shop' && s.day >= untilDay) return s;
    if (s.phase === 'briefing') s = beginStages(s);
    else if (s.phase === 'stage' || s.phase === 'alert') {
      const c = activeCard(s)!;
      const usable = c.options.filter((o) => !o.enabled || o.enabled(s));
      const opts = usable.length ? usable : c.options;
      s = chooseOption(s, opts[choose(opts.length) % opts.length].id);
    } else if (s.phase === 'resolve') s = continueAfterResolve(s);
    else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
    else if (s.phase === 'night') s = openShop(s);
    else if (s.phase === 'shop') s = leaveShop(s);
  }
  return s;
}

describe('shop content integrity', () => {
  it('has unique ids', () => {
    const ids = SHOP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item states a price, an upside and a plain-language catch', () => {
    for (const d of SHOP_ITEMS) {
      expect(d.name.length, `${d.id} has no name`).toBeGreaterThan(0);
      expect(d.seller.length, `${d.id} has no seller line`).toBeGreaterThan(0);
      expect(d.upside.length, `${d.id} has no upside`).toBeGreaterThan(0);
      expect(Number.isFinite(d.cost), `${d.id} has a non-numeric cost`).toBe(true);
      // The owner's rule: everything has a downside UNLESS it is rare.
      if (d.rarity !== 'rare') {
        expect(d.downside, `${d.id} is not rare and must state a catch`).toBeTruthy();
      }
    }
  });

  it('only rare items are allowed to have no catch, and there are some of each', () => {
    const noCatch = SHOP_ITEMS.filter((d) => !d.downside);
    expect(noCatch.length, 'there should be at least one no-catch rare item').toBeGreaterThan(0);
    for (const d of noCatch) expect(d.rarity).toBe('rare');
    for (const kind of ['advisor', 'policy', 'favour', 'deal'] as const) {
      expect(SHOP_ITEMS.some((d) => d.kind === kind), `no ${kind} items`).toBe(true);
    }
  });

  it('every favour can actually be spent', () => {
    for (const d of SHOP_ITEMS.filter((x) => x.kind === 'favour')) {
      expect(d.use, `${d.id} is a favour with no use`).toBeTruthy();
      expect(d.use!.label.length).toBeGreaterThan(0);
      expect(d.use!.text.length).toBeGreaterThan(0);
    }
  });

  it('only advisors and policies carry ongoing rules', () => {
    for (const d of SHOP_ITEMS) {
      if (d.kind === 'advisor' || d.kind === 'policy') continue;
      expect(d.daily, `${d.id} is a ${d.kind} but has a daily rule`).toBeUndefined();
      expect(d.lossMult, `${d.id} is a ${d.kind} but has a lossMult`).toBeUndefined();
    }
  });
});

describe('the Back Room', () => {
  it('opens at the end of every day except the last', () => {
    let s = playToShop(4242, 1);
    expect(s.phase).toBe('shop');
    expect(s.day).toBe(1);
    expect(s.shopStock.length).toBe(NIGHTLY_STOCK);

    // Walking straight through it must land on the next morning's briefing.
    s = leaveShop(s);
    expect(s.day).toBe(2);
    expect(s.phase).toBe('briefing');
  });

  it('opens a bigger room on the night an act vote is passed', () => {
    let found = 0;
    for (let i = 0; i < 25 && found < 3; i++) {
      const s = playToShop(i * 3301 + 11, 6, () => 0);
      if (s.phase !== 'shop' || s.day !== 6) continue;
      found += 1;
      expect(s.act).toBe(2);
      expect(s.shopStock.length).toBeGreaterThan(NIGHTLY_STOCK);
      expect(s.shopStock.length).toBeLessThanOrEqual(ACT_STOCK);
      // ...and it must contain at least one of the expensive items.
      expect(s.shopStock.some((id) => SHOP_MAP[id].tier === 'big')).toBe(true);
    }
    expect(found, 'no run reached the act-1 vote').toBeGreaterThan(0);
  });

  it('never offers a `big` item in an ordinary nightly room', () => {
    for (let i = 0; i < 40; i++) {
      const s = playToShop(i * 733 + 5, 1);
      if (s.phase !== 'shop') continue;
      for (const id of s.shopStock) {
        expect(SHOP_MAP[id].tier, `${id} leaked into a nightly room`).toBe('small');
      }
    }
  });

  it('charges the price, records the purchase, and takes the item off the shelf', () => {
    const s = playToShop(90210, 1);
    expect(s.phase).toBe('shop');
    const id = s.shopStock.find((x) => shopPrice(s, SHOP_MAP[x]) > 0 && shopPrice(s, SHOP_MAP[x]) <= s.stats.treasury);
    expect(id, 'nothing affordable on day 1').toBeTruthy();

    const def = SHOP_MAP[id!];
    const before = s.stats.treasury;
    const after = buyShopItem(s, id!);

    expect(after.stats.treasury).toBeCloseTo(before - shopPrice(s, def), 1);
    expect(after.shopBought).toContain(def.id);
    expect(after.shopStock).not.toContain(def.id);
    expect(after.stat.dealsStruck).toBe(1);
    expect(after.log.some((l) => l.kind === 'purchase' && l.title === def.name)).toBe(true);

    if (def.kind === 'advisor' || def.kind === 'policy') expect(after.owned).toContain(def.id);
    if (def.kind === 'favour') expect(after.heldFavours).toContain(def.id);
    if (def.kind === 'deal') {
      expect(after.owned).not.toContain(def.id);
      expect(after.heldFavours).not.toContain(def.id);
    }
  });

  it('sells you exactly one thing a night, and closes the room after', () => {
    const s = playToShop(90210, 1);
    expect(s.phase).toBe('shop');
    expect(buyLimit(s)).toBe(1);
    expect(roomIsClosed(s)).toBe(false);

    const id = s.shopStock.find((x) => shopPrice(s, SHOP_MAP[x]) <= s.stats.treasury);
    expect(id).toBeTruthy();
    const after = buyShopItem(s, id!);

    expect(after.shopBuysTonight).toBe(1);
    expect(roomIsClosed(after)).toBe(true);
    // the other offers are gone, and a second attempt changes nothing
    expect(after.shopStock).toEqual([]);
    const twice = buyShopItem(after, s.shopStock.find((x) => x !== id) ?? id!);
    expect(twice.shopBought).toEqual(after.shopBought);
    expect(twice.stats.treasury).toBe(after.stats.treasury);
  });

  it('lets you buy more than one thing in an act room', () => {
    for (let i = 0; i < 25; i++) {
      const s = playToShop(i * 3301 + 11, 6, () => 0);
      if (s.phase !== 'shop' || s.day !== 6) continue;
      expect(buyLimit(s)).toBe(Number.POSITIVE_INFINITY);
      const id = s.shopStock.find((x) => shopPrice(s, SHOP_MAP[x]) <= s.stats.treasury);
      if (!id) continue;
      const after = buyShopItem(s, id);
      // the rest of the shelf is still there
      expect(after.shopStock.length).toBe(s.shopStock.length - 1);
      expect(roomIsClosed(after)).toBe(false);
      return;
    }
  });

  it('never offers the same item twice in a run', () => {
    let s = prepareDay(createGame({ seed: 5150 }));
    const offered: string[] = [];
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 3000) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') s = chooseOption(s, activeCard(s)!.options[0].id);
      else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') {
        const id = s.shopStock.find((x) => shopPrice(s, SHOP_MAP[x]) <= s.stats.treasury);
        if (id) { offered.push(id); s = buyShopItem(s, id); }
        s = leaveShop(s);
      }
    }
    expect(new Set(offered).size, 'an item was bought twice in one run').toBe(offered.length);
  });

  it('refuses a purchase you cannot pay for', () => {
    const s = playToShop(555, 1);
    expect(s.phase).toBe('shop');
    const broke: GameState = { ...s, stats: { ...s.stats, treasury: 0 } };
    const id = broke.shopStock.find((x) => SHOP_MAP[x].cost > 0);
    if (!id) return;
    const after = buyShopItem(broke, id);
    expect(after.shopBought).not.toContain(id);
    expect(after.stats.treasury).toBe(0);
  });

  it('pays you for a deal with a negative cost', () => {
    const s = playToShop(777, 1);
    const seeded: GameState = {
      ...s,
      shopStock: ['gorsk-lease'],
      shopBought: [],
      flags: { ...s.flags, gorskLeaseSold: 0 },
    };
    const after = buyShopItem(seeded, 'gorsk-lease');
    expect(after.stats.treasury).toBeGreaterThan(s.stats.treasury);
    // ...and the catch actually lands: a permanent revenue line and angry workers.
    expect(after.commitments.some((c) => c.id === 'cmt-gorsk')).toBe(true);
    expect(after.factions.combine.loyalty).toBeLessThan(s.factions.combine.loyalty);
  });

  it('holds a favour until it is spent, then consumes it', () => {
    const s = playToShop(31337, 1);
    const seeded: GameState = { ...s, shopStock: ['one-good-story'], shopBought: [], heldFavours: [] };
    const bought = buyShopItem(seeded, 'one-good-story');
    expect(bought.heldFavours).toEqual(['one-good-story']);

    const spent = useFavour(bought, 'one-good-story');
    expect(spent.heldFavours).toEqual([]);
    expect(spent.stats.legitimacy).toBeGreaterThan(bought.stats.legitimacy);

    // Spending it twice must do nothing at all.
    const again = useFavour(spent, 'one-good-story');
    expect(again.stats.legitimacy).toBe(spent.stats.legitimacy);
  });

  it("applies an owned policy's daily rule and its loss modifier", () => {
    const s = playToShop(1234, 1);
    const withPolicy: GameState = { ...s, owned: ['emergency-powers'] };

    // The daily rule bites overnight...
    const tomorrow = leaveShop(withPolicy);
    expect(tomorrow.stats.legitimacy).toBeLessThan(
      leaveShop({ ...s, owned: [] }).stats.legitimacy,
    );

    // ...and grip losses are halved while it is owned.
    const hit = { stats: { power: -10 } };
    const rng = makeRng(7);
    const plain = structuredClone({ ...s, owned: [] });
    const shielded = structuredClone(withPolicy);
    // applyEffects is exercised through chooseOption elsewhere; here we go
    // through the same entry point directly.
    applyEffects(plain, hit, rng, 'test');
    applyEffects(shielded, hit, rng, 'test');
    const plainLoss = s.stats.power - plain.stats.power;
    const shieldedLoss = s.stats.power - shielded.stats.power;
    expect(shieldedLoss).toBeLessThan(plainLoss);
  });

  it('does not offer an item whose `requires` has already been satisfied', () => {
    const s = playToShop(8080, 1);
    const sold: GameState = { ...s, flags: { ...s.flags, gorskLeaseSold: 1 } };
    expect(eligibleStock(sold, true).some((d) => d.id === 'gorsk-lease')).toBe(false);
    expect(eligibleStock(sold, true).some((d) => d.id === 'ilvet-levy')).toBe(true);
  });

  it('does not repeat the same stock two nights running', () => {
    let s = playToShop(24680, 1);
    expect(s.phase).toBe('shop');
    const firstNight = [...s.shopStock];

    s = leaveShop(s);
    let guard = 0;
    while (s.phase !== 'shop' && s.phase !== 'ended' && guard++ < 400) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') s = chooseOption(s, activeCard(s)!.options[0].id);
      else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'night') s = openShop(s);
    }
    if (s.phase !== 'shop') return;
    for (const id of s.shopStock) {
      expect(firstNight, `${id} was offered two nights running`).not.toContain(id);
    }
  });

  it('is reproducible: the same seed rolls the same stock', () => {
    const a = playToShop(191919, 1);
    const b = playToShop(191919, 1);
    expect(a.shopStock).toEqual(b.shopStock);
  });
});

import { expect, it } from 'vitest';
import { MANDATES } from '../content/mandates';
import { SHOP_MAP } from '../content/shop';
import { createGame } from '../state';
import { makeRng } from '../rng';
import { eligibleStock, rollStock, NIGHTLY_STOCK } from '../shop';

it('each opening night offers an eligible start-specific tool without adding a fourth slot', () => {
  for (const mandate of MANDATES) for (const day of [1, 7, 13]) {
    const s = createGame({ seed: 11, mandateId: mandate.id });
    s.day = day;
    s.act = Math.ceil(day / 6);
    const focus = mandate.shopFocus!;
    expect(focus.length).toBeGreaterThan(1);
    for (const id of focus) expect(SHOP_MAP[id]?.tier).toBe('small');
    const stock = rollStock(s, makeRng(91));
    expect(stock).toHaveLength(NIGHTLY_STOCK);
    expect(new Set(stock).size).toBe(stock.length);
    expect(stock.some(id => focus.includes(id))).toBe(true);
    expect(rollStock(s, makeRng(91))).toEqual(stock);
  }
});

it('toolkits respect unlocks, purchases, recent offers and fallback when exhausted', () => {
  for (const mandate of MANDATES) {
    const s = createGame({ seed: 11, mandateId: mandate.id });
    const focus = mandate.shopFocus!;
    s.shopBought = [focus[0]];
    s.shopRecent = [focus[1]];
    s.unlockedShopItemIds = s.unlockedShopItemIds.filter(id => !focus.slice(2).includes(id));
    const stock = rollStock(s, makeRng(91));
    expect(stock).toHaveLength(NIGHTLY_STOCK);
    expect(stock.some(id => focus.includes(id))).toBe(false);
    expect(stock.every(id => eligibleStock(s).some(d => d.id === id))).toBe(true);
  }
});

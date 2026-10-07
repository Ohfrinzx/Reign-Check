import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { buyShopItem, cutDeal, fireAdvisor, leaveShop } from '../engine';
import { dailyFromOwned, tickHeldDeals } from '../shop';
import { computeBudget } from '../economy';
import { applyEffects } from '../effects';
import { makeRng } from '../rng';
import { FACTION_ORDER } from '../content/country';

function shopWith(item: string) {
  const s = createGame({ seed: 812, mandateId: 'accident' });
  s.phase = 'shop';
  s.shopStock = [item];
  s.stats.treasury = 100;
  s.hidden.cult = 0;
  s.hidden.corruption = 10;
  return s;
}

describe('Back Room benefits match their promises', () => {
  it('the Convocation clerk builds goodwill each morning, with corruption, until fired', () => {
    const bought = buyShopItem(shopWith('convocation-clerk'), 'convocation-clerk');
    const before = structuredClone(bought);
    applyEffects(bought, dailyFromOwned(bought), makeRng(bought.rngState), 'shop:daily');
    for (const id of FACTION_ORDER) {
      expect(bought.factions[id].loyalty - before.factions[id].loyalty).toBeCloseTo(0.3);
    }
    expect(bought.hidden.corruption - before.hidden.corruption).toBeCloseTo(0.5);
    const fired = fireAdvisor(bought, 'convocation-clerk');
    expect(fired.owned).not.toContain('convocation-clerk');
    expect(dailyFromOwned(fired)).toBeUndefined();
  });

  it('the clerk works through morning upkeep, independently of ordinary mood drift', () => {
    const shop = shopWith('convocation-clerk');
    const bought = buyShopItem(shop, 'convocation-clerk');
    const control = structuredClone(bought);
    control.owned = [];
    const withClerk = leaveShop(bought);
    const withoutClerk = leaveShop(control);
    for (const id of FACTION_ORDER) {
      expect(withClerk.factions[id].loyalty - withoutClerk.factions[id].loyalty).toBeCloseTo(0.3);
    }
  });

  it('pigeon support arrives while held and stops on season expiry', () => {
    const shop = shopWith('pigeon-endorsement');
    const bought = buyShopItem(shop, 'pigeon-endorsement');
    expect(bought.stats.support - shop.stats.support).toBeCloseTo(4);
    for (let morning = 1; morning <= 4; morning++) {
      const expired = tickHeldDeals(bought);
      if (morning < 4) {
        expect(expired).toHaveLength(0);
        const before = bought.stats.support;
        applyEffects(bought, dailyFromOwned(bought), makeRng(bought.rngState), 'shop:daily');
        expect(bought.stats.support - before).toBeCloseTo(1);
      } else {
        expect(expired.map((item) => item.id)).toEqual(['pigeon-endorsement']);
        expect(dailyFromOwned(bought)).toBeUndefined();
      }
    }
  });

  it('cutting a pigeon endorsement stops future support immediately', () => {
    const bought = buyShopItem(shopWith('pigeon-endorsement'), 'pigeon-endorsement');
    expect(dailyFromOwned(bought)?.stats?.support).toBe(1);
    const cut = cutDeal(bought, 'pigeon-endorsement');
    expect(cut.heldDeals).toHaveLength(0);
    expect(dailyFromOwned(cut)).toBeUndefined();
    expect(tickHeldDeals(cut)).toHaveLength(0);
  });

  it('the Ilvet deal pays exactly $0.30B daily and ends that revenue when cut', () => {
    const shop = shopWith('ilvet-levy');
    const before = computeBudget(shop);
    const bought = buyShopItem(shop, 'ilvet-levy');
    const after = computeBudget(bought);
    expect(bought.stats.treasury - shop.stats.treasury).toBeCloseTo(7);
    expect(after.revenue - before.revenue).toBeCloseTo(0.3);
    expect(after.net - before.net).toBeCloseTo(0.3);
    const cut = cutDeal(bought, 'ilvet-levy');
    expect(cut.commitments.some((c) => c.id === 'cmt-ilvet')).toBe(false);
    expect(computeBudget(cut).revenue).toBe(before.revenue);
    expect(computeBudget(cut).net).toBe(before.net);
  });

  it('the ordinary Ilvet levy card still earns $0.30B without the Back Room deal', () => {
    const s = createGame({ seed: 812, mandateId: 'accident' });
    const before = computeBudget(s);
    s.flags.ilvetLevy = 1;
    expect(computeBudget(s).revenue - before.revenue).toBeCloseTo(0.3);
  });
});

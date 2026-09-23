import { describe, it, expect } from 'vitest';
import { createGame } from '../state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert,
  activeCard, openShop, buyShopItem, useFavour, leaveShop, fireAdvisor, cutDeal,
  ALL_CARD_MAP, completeConfidenceVote,
} from '../engine';
import { SHOP_ITEMS, SHOP_MAP } from '../content/shop';
import {
  ACT_STOCK, ADVISOR_CAP, DEAL_CAP, NIGHTLY_STOCK, boughtDealDefs, buyLimit, canCutNow,
  canFireNow, canHoldMoreAdvisors, canHoldMoreDeals, capBlockReason, cutCostOf, eligibleStock,
  fireCostOf, heldDealEntries, ownedAdvisorDefs, rollStock, roomIsClosed, shopPrice,
} from '../shop';
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
    else if (s.phase === 'vote') s = completeConfidenceVote(s);
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

  it('only advisors carry fire terms', () => {
    for (const d of SHOP_ITEMS) {
      if (d.kind === 'advisor') continue;
      expect(d.fireCost, `${d.id} is a ${d.kind} but has a fireCost`).toBeUndefined();
      expect(d.fireEffects, `${d.id} is a ${d.kind} but has fireEffects`).toBeUndefined();
    }
  });

  it('only deals carry cut terms', () => {
    for (const d of SHOP_ITEMS) {
      if (d.kind === 'deal') continue;
      expect(d.cutCost, `${d.id} is a ${d.kind} but has a cutCost`).toBeUndefined();
      expect(d.cutEffects, `${d.id} is a ${d.kind} but has cutEffects`).toBeUndefined();
    }
  });

  it('endsCommitment is only used by advisors and deals', () => {
    for (const d of SHOP_ITEMS) {
      if (d.kind === 'advisor' || d.kind === 'deal') continue;
      expect(d.endsCommitment, `${d.id} is a ${d.kind} but has endsCommitment`).toBeUndefined();
    }
  });

  it('every advisor has a real cost or consequence to being let go', () => {
    // The same everything-has-a-downside rule that governs buying an advisor
    // extends to firing one: zero cost AND zero consequence would make
    // hiring risk-free to walk back, which defeats the point of the price.
    for (const d of SHOP_ITEMS.filter((x) => x.kind === 'advisor')) {
      expect(
        (d.fireCost ?? 0) > 0 || !!d.fireEffects,
        `${d.id} can be fired for free with no consequence`,
      ).toBe(true);
    }
  });

  it('every deal has a real cost or consequence to being cut short', () => {
    // Every deal now occupies a slot until it ends; the same
    // everything-has-a-downside rule that governs firing an advisor extends
    // to cutting a deal short, or the cap would be a free-swap mechanic.
    for (const d of SHOP_ITEMS.filter((x) => x.kind === 'deal')) {
      expect(
        (d.cutCost ?? 0) > 0 || !!d.cutEffects,
        `${d.id} can be cut for free with no consequence`,
      ).toBe(true);
    }
  });

  it('every deal that creates a commitment can also end it (fired or cut)', () => {
    // Otherwise firing/cutting frees a slot but leaves the bill running.
    for (const d of SHOP_ITEMS) {
      if (d.kind !== 'advisor' && d.kind !== 'deal') continue;
      const commitmentIds = (d.effects?.commitments ?? []).map((c) => c.id).filter(Boolean);
      if (!commitmentIds.length) continue;
      expect(d.endsCommitment, `${d.id} creates a commitment but has no endsCommitment`).toBeTruthy();
      expect(commitmentIds, `${d.id}'s endsCommitment doesn't match a commitment it creates`).toContain(d.endsCommitment);
    }
  });

  it('only deals carry a duration', () => {
    for (const d of SHOP_ITEMS) {
      if (d.kind === 'deal') continue;
      expect(d.durationDays, `${d.id} is a ${d.kind} but has durationDays`).toBeUndefined();
      expect(d.expireEffects, `${d.id} is a ${d.kind} but has expireEffects`).toBeUndefined();
    }
  });

  it('at least one deal is permanent and at least one runs on a timer', () => {
    const timed = SHOP_ITEMS.filter((d) => d.kind === 'deal' && d.durationDays);
    const permanent = SHOP_ITEMS.filter((d) => d.kind === 'deal' && !d.durationDays);
    expect(timed.length, 'no timed deals — "some, not all" needs at least one').toBeGreaterThan(0);
    expect(permanent.length, 'no permanent deals').toBeGreaterThan(0);
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
      // every deal, permanent or timed, now occupies a held-deal slot
      expect(after.heldDeals.some((h) => h.itemId === def.id)).toBe(true);
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
    const bought: string[] = [];
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 3000) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') s = chooseOption(s, activeCard(s)!.options[0].id);
      else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'vote') s = completeConfidenceVote(s);
      else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') {
        // An affordable offer can still no-op if it's blocked by the
        // advisor/deal cap — only count it as bought if shopBought actually
        // grew, same check shop.probe.ts uses.
        const id = s.shopStock.find((x) => shopPrice(s, SHOP_MAP[x]) <= s.stats.treasury);
        if (id) {
          const before = s.shopBought.length;
          s = buyShopItem(s, id);
          if (s.shopBought.length > before) bought.push(id);
        }
        s = leaveShop(s);
      }
    }
    expect(new Set(bought).size, 'an item was bought twice in one run').toBe(bought.length);
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
      else if (s.phase === 'vote') s = completeConfidenceVote(s);
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

/** A shop sitting on exactly one item, with money to buy it — for testing a
 *  single item's purchase effects without playing to a real Back Room. */
function shopStateWith(seed: number, itemId: string): GameState {
  const s = createGame({ seed });
  s.phase = 'shop';
  s.shopStock = [itemId];
  s.stats.treasury = 999;
  return s;
}

describe('the run deck (§4.4 shop items)', () => {
  it('every deck-affecting item declares an add or a remove, targeting a real card', () => {
    const deckItems = SHOP_ITEMS.filter((d) => d.effects?.deck);
    expect(deckItems.length).toBeGreaterThan(0);
    for (const def of deckItems) {
      const { add, remove } = def.effects!.deck!;
      expect(add?.length || remove?.length, `${def.id} declares deck effects but no ids`).toBeTruthy();
      for (const id of [...(add ?? []), ...(remove ?? [])]) {
        expect(ALL_CARD_MAP[id], `${def.id} targets unknown card ${id}`).toBeTruthy();
      }
    }
  });

  it('buying an "add" item puts the card in runDeck', () => {
    const def = SHOP_ITEMS.find((d) => d.effects?.deck?.add?.length)!;
    expect(def).toBeTruthy();
    const s = shopStateWith(1, def.id);
    const after = buyShopItem(s, def.id);
    for (const id of def.effects!.deck!.add!) expect(after.runDeck).toContain(id);
  });

  it('buying a "remove" item bans the card and it never comes up in the weighted draw again', () => {
    const def = SHOP_ITEMS.find((d) => d.effects?.deck?.remove?.length)!;
    expect(def).toBeTruthy();
    const s = shopStateWith(2, def.id);
    const after = buyShopItem(s, def.id);
    for (const id of def.effects!.deck!.remove!) expect(after.bannedCards).toContain(id);
  });
});

describe('meta-progression unlocks (§4.5 step 2)', () => {
  it('defaults to every item unlocked when createGame() is called without unlock history', () => {
    const s = createGame({ seed: 1 });
    expect(s.unlockedShopItemIds.sort()).toEqual(SHOP_ITEMS.map((i) => i.id).sort());
  });

  it('a locked item never appears in eligibleStock or a rolled stock, even in the act room', () => {
    const s = createGame({ seed: 1, unlockedShopItemIds: SHOP_ITEMS.filter((i) => i.id !== 'archivist').map((i) => i.id) });
    expect(eligibleStock(s, true).some((d) => d.id === 'archivist')).toBe(false);
    for (let seed = 0; seed < 30; seed++) {
      const rolled = rollStock({ ...s, rngState: seed }, makeRng(seed), true);
      expect(rolled).not.toContain('archivist');
    }
  });

  it('buyShopItem() refuses a locked item even if it were somehow offered', () => {
    const s = shopStateWith(1, 'archivist');
    const locked = { ...s, unlockedShopItemIds: s.unlockedShopItemIds.filter((id) => id !== 'archivist') };
    const after = buyShopItem(locked, 'archivist');
    expect(after.owned).not.toContain('archivist');
    expect(after.stats.treasury).toBe(locked.stats.treasury);
  });
});

describe('firing an advisor', () => {
  it('pays the fire cost, applies the consequence, ends the commitment, and drops it from owned', () => {
    const s = playToShop(42, 1);
    // 'fixer' has a fireCost, an endsCommitment, and fireEffects — exercises all three.
    const withFixer: GameState = {
      ...s,
      owned: ['fixer'],
      commitments: [{ id: 'cmt-fixer', label: 'The fixer', perDay: 0.25 }],
    };
    const cost = fireCostOf(SHOP_MAP.fixer);
    expect(cost).toBeGreaterThan(0);

    const before = withFixer.stats.treasury;
    const after = fireAdvisor(withFixer, 'fixer');

    expect(after.owned).not.toContain('fixer');
    expect(after.commitments.some((c) => c.id === 'cmt-fixer')).toBe(false);
    expect(after.stats.treasury).toBeCloseTo(before - cost, 1);
    // the figurative cost (fireEffects: hidden.leak +3) actually landed
    expect(after.hidden.leak).toBeGreaterThan(withFixer.hidden.leak);
    expect(after.log.some((l) => l.kind === 'purchase' && l.title.includes('Fixer'))).toBe(true);
  });

  it('refuses to fire someone you cannot afford to let go', () => {
    const s = playToShop(42, 1);
    const broke: GameState = { ...s, owned: ['fixer'], stats: { ...s.stats, treasury: 0 } };
    expect(canFireNow(broke, SHOP_MAP.fixer)).toBe(false);
    const after = fireAdvisor(broke, 'fixer');
    expect(after.owned).toContain('fixer');
    expect(after.stats.treasury).toBe(0);
  });

  it('does nothing for an item you do not own, or one that is not an advisor', () => {
    const s = playToShop(42, 1);
    const untouched = fireAdvisor(s, 'fixer'); // not owned
    expect(untouched.owned).toEqual(s.owned);

    const withPolicy: GameState = { ...s, owned: ['emergency-powers'] };
    const stillOwned = fireAdvisor(withPolicy, 'emergency-powers'); // a policy, not an advisor
    expect(stillOwned.owned).toContain('emergency-powers');
  });

  it('a free-to-fire advisor still costs nothing in money but still lands its consequence', () => {
    const s = playToShop(42, 1);
    const withLiaison: GameState = { ...s, owned: ['garrison-liaison'] };
    expect(fireCostOf(SHOP_MAP['garrison-liaison'])).toBe(0);

    const before = withLiaison.stats.treasury;
    const after = fireAdvisor(withLiaison, 'garrison-liaison');
    expect(after.stats.treasury).toBe(before);
    expect(after.owned).not.toContain('garrison-liaison');
    expect(after.factions.staff.loyalty).toBeLessThan(withLiaison.factions.staff.loyalty);
  });

  it('ownedAdvisorDefs only returns advisors, never policies or favours', () => {
    const s = playToShop(42, 1);
    const mixed: GameState = { ...s, owned: ['fixer', 'emergency-powers'], heldFavours: ['quiet-word'] };
    const advisors = ownedAdvisorDefs(mixed);
    expect(advisors.map((d) => d.id)).toEqual(['fixer']);
  });
});

describe('held deals', () => {
  it('starts a clock when a durationDays deal is bought, and reports it as active', () => {
    const s = playToShop(42, 1);
    const seeded: GameState = { ...s, shopStock: ['three-judges'], shopBought: [], flags: { ...s.flags, judgesBought: 0 } };
    const after = buyShopItem(seeded, 'three-judges');

    expect(after.heldDeals).toEqual([{ itemId: 'three-judges', daysLeft: 5 }]);
    const entry = boughtDealDefs(after).find((e) => e.def.id === 'three-judges');
    expect(entry?.status).toBe('active');
    expect(entry?.daysLeft).toBe(5);
  });

  it('holds a permanent deal with no clock, still occupying a slot', () => {
    const s = playToShop(42, 1);
    const seeded: GameState = { ...s, shopStock: ['ilvet-levy'], shopBought: [], flags: { ...s.flags, ilvetLevy: 0 } };
    const after = buyShopItem(seeded, 'ilvet-levy');
    expect(after.heldDeals).toEqual([{ itemId: 'ilvet-levy', daysLeft: undefined }]);
    const entry = boughtDealDefs(after).find((e) => e.def.id === 'ilvet-levy');
    expect(entry?.status).toBe('ongoing');
    // ...and it never ticks away on its own, however many days pass
    let cur = after;
    for (let i = 0; i < 10; i++) cur = leaveShop(cur);
    expect(cur.heldDeals.some((h) => h.itemId === 'ilvet-levy')).toBe(true);
  });

  it('ilvet-levy actually creates the recurring revenue its upside text promises', () => {
    // Regression: this deal's text said "$0.30B a day from then on" but the
    // effects never created a commitment for it.
    const s = playToShop(42, 1);
    const seeded: GameState = { ...s, shopStock: ['ilvet-levy'], shopBought: [], flags: { ...s.flags, ilvetLevy: 0 } };
    const after = buyShopItem(seeded, 'ilvet-levy');
    expect(after.commitments.some((c) => c.id === 'cmt-ilvet' && c.perDay < 0)).toBe(true);
  });

  it('expires after durationDays ticks and never negative-counts', () => {
    // Buy the deal, then play forward real days (each one ticks dayUpkeep
    // exactly once) until the clock the purchase started runs out.
    let s = playToShop(42, 1);
    s = { ...s, shopStock: ['three-judges'], shopBought: [], flags: { ...s.flags, judgesBought: 0 } };
    s = buyShopItem(s, 'three-judges');
    expect(s.heldDeals).toEqual([{ itemId: 'three-judges', daysLeft: 5 }]);
    const scandalAtPurchase = s.hidden.scandal;

    s = leaveShop(s); // advances to the next day, running dayUpkeep once (daysLeft -> 4)
    // A day is many transitions (several cards, alerts, night, shop), so the
    // guard here bounds total transitions across the whole walk, not days.
    let guard = 0;
    while (s.heldDeals.length > 0 && s.phase !== 'ended' && guard++ < 800) {
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') s = chooseOption(s, activeCard(s)!.options[0].id);
      else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'vote') s = completeConfidenceVote(s);
      else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') s = leaveShop(s);
      else break;
    }
    expect(guard).toBeLessThan(800);
    expect(s.heldDeals).toEqual([]);
    // expireEffects (hidden.scandal +6) landed exactly once
    const entry = boughtDealDefs(s).find((e) => e.def.id === 'three-judges');
    expect(entry?.status).toBe('expired');
    void scandalAtPurchase; // other systems move scandal day to day; check the expiry fired exactly once instead
    expect(s.log.filter((l) => l.title.includes('Three Judges') && l.kind === 'consequence')).toHaveLength(1);
    expect(s.endedDeals).toContainEqual({ itemId: 'three-judges', reason: 'expired' });
  });
});

describe('advisor and deal caps', () => {
  it('blocks a 4th advisor once ADVISOR_CAP is reached', () => {
    const s = playToShop(42, 1);
    expect(ADVISOR_CAP).toBe(3);
    const atCap: GameState = { ...s, owned: ['fixer', 'channel-seven-man', 'garrison-liaison'] };
    expect(canHoldMoreAdvisors(atCap)).toBe(false);
    expect(capBlockReason(atCap, SHOP_MAP['second-books'])).toMatch(/advisors/i);

    const seeded: GameState = { ...atCap, shopStock: ['second-books'], shopBought: [] };
    const after = buyShopItem(seeded, 'second-books');
    expect(after.owned).not.toContain('second-books');
    expect(after.stats.treasury).toBe(seeded.stats.treasury);
  });

  it('blocks a 4th deal once DEAL_CAP is reached, even mixing permanent and timed', () => {
    const s = playToShop(42, 1);
    expect(DEAL_CAP).toBe(3);
    const atCap: GameState = {
      ...s,
      shopBought: ['gorsk-lease', 'ilvet-levy', 'three-judges'],
      heldDeals: [
        { itemId: 'gorsk-lease', daysLeft: undefined },
        { itemId: 'ilvet-levy', daysLeft: undefined },
        { itemId: 'three-judges', daysLeft: 3 },
      ],
      flags: { ...s.flags, gorskLeaseSold: 1, ilvetLevy: 1, judgesBought: 1, ostreneLoan: 0 },
    };
    expect(canHoldMoreDeals(atCap)).toBe(false);
    expect(capBlockReason(atCap, SHOP_MAP['ostrene-loan'])).toMatch(/deals/i);

    const seeded: GameState = { ...atCap, shopStock: ['ostrene-loan'] };
    const after = buyShopItem(seeded, 'ostrene-loan');
    expect(after.heldDeals.some((h) => h.itemId === 'ostrene-loan')).toBe(false);
    expect(after.stats.treasury).toBe(seeded.stats.treasury);
  });

  it('does not block a purchase under the cap, or one of a different kind', () => {
    const s = playToShop(42, 1);
    const twoAdvisors: GameState = { ...s, owned: ['fixer', 'channel-seven-man'] };
    expect(canHoldMoreAdvisors(twoAdvisors)).toBe(true);
    expect(capBlockReason(twoAdvisors, SHOP_MAP['garrison-liaison'])).toBeUndefined();
    // an advisor cap never blocks buying a favour or a policy
    expect(capBlockReason(twoAdvisors, SHOP_MAP['quiet-word'])).toBeUndefined();
    expect(capBlockReason(twoAdvisors, SHOP_MAP['night-courts'])).toBeUndefined();
  });

  it('cutting a deal frees a slot so a new one can be bought the same visit', () => {
    let s = playToShop(42, 1);
    s = {
      ...s,
      shopBought: ['gorsk-lease', 'ilvet-levy', 'three-judges'],
      heldDeals: [
        { itemId: 'gorsk-lease', daysLeft: undefined },
        { itemId: 'ilvet-levy', daysLeft: undefined },
        { itemId: 'three-judges', daysLeft: 3 },
      ],
      flags: { ...s.flags, gorskLeaseSold: 1, ilvetLevy: 1, judgesBought: 1 },
    };
    expect(canHoldMoreDeals(s)).toBe(false);

    s = cutDeal(s, 'ilvet-levy');
    expect(s.heldDeals.some((h) => h.itemId === 'ilvet-levy')).toBe(false);
    expect(canHoldMoreDeals(s)).toBe(true);

    s = { ...s, shopStock: ['ostrene-loan'] };
    const after = buyShopItem(s, 'ostrene-loan');
    expect(after.heldDeals.some((h) => h.itemId === 'ostrene-loan')).toBe(true);
  });

  it('firing an advisor frees a slot so a new one can be bought', () => {
    let s = playToShop(42, 1);
    s = { ...s, owned: ['fixer', 'channel-seven-man', 'garrison-liaison'] };
    expect(canHoldMoreAdvisors(s)).toBe(false);

    s = fireAdvisor(s, 'channel-seven-man');
    expect(s.owned).not.toContain('channel-seven-man');
    expect(canHoldMoreAdvisors(s)).toBe(true);

    s = { ...s, shopStock: ['second-books'] };
    const after = buyShopItem(s, 'second-books');
    expect(after.owned).toContain('second-books');
  });
});

describe('cutting a deal', () => {
  it('pays the cut cost, applies the consequence, ends the commitment, and frees the slot', () => {
    const s = playToShop(42, 1);
    // gorsk-lease has a cutCost, an endsCommitment, and cutEffects — exercises all three.
    const withLease: GameState = {
      ...s,
      shopBought: ['gorsk-lease'],
      heldDeals: [{ itemId: 'gorsk-lease', daysLeft: undefined }],
      commitments: [{ id: 'cmt-gorsk', label: 'Gorsk revenue, sold', perDay: 0.35 }],
      flags: { ...s.flags, gorskLeaseSold: 1 },
    };
    const cost = cutCostOf(SHOP_MAP['gorsk-lease']);
    expect(cost).toBeGreaterThan(0);

    const before = withLease.stats.treasury;
    const after = cutDeal(withLease, 'gorsk-lease');

    expect(after.heldDeals.some((h) => h.itemId === 'gorsk-lease')).toBe(false);
    expect(after.commitments.some((c) => c.id === 'cmt-gorsk')).toBe(false);
    expect(after.stats.treasury).toBeCloseTo(before - cost, 1);
    // the figurative cost (cutEffects: concord loyalty -6) landed
    expect(after.factions.concord.loyalty).toBeLessThan(withLease.factions.concord.loyalty);
    expect(after.endedDeals).toContainEqual({ itemId: 'gorsk-lease', reason: 'cut' });
    expect(after.log.some((l) => l.kind === 'purchase' && l.title.includes('Gorsk'))).toBe(true);
    // boughtDealDefs must now report it as 'cut', not 'ongoing' or 'expired'
    const entry = boughtDealDefs(after).find((e) => e.def.id === 'gorsk-lease');
    expect(entry?.status).toBe('cut');
  });

  it('cutting a timed deal early skips its expireEffects entirely', () => {
    const s = playToShop(42, 1);
    const withJudges: GameState = {
      ...s,
      shopBought: ['three-judges'],
      heldDeals: [{ itemId: 'three-judges', daysLeft: 3 }],
      flags: { ...s.flags, judgesBought: 1 },
    };
    const scandalBefore = withJudges.hidden.scandal;
    const after = cutDeal(withJudges, 'three-judges');

    expect(after.heldDeals).toEqual([]);
    const entry = boughtDealDefs(after).find((e) => e.def.id === 'three-judges');
    expect(entry?.status).toBe('cut');
    // only the (smaller) cutEffects scandal bump applies, not expireEffects too
    const cutScandal = after.hidden.scandal - scandalBefore;
    expect(cutScandal).toBeCloseTo(4, 1);
  });

  it('refuses to cut a deal you cannot afford to end, and does nothing for a deal you do not hold', () => {
    const s = playToShop(42, 1);
    const broke: GameState = {
      ...s,
      shopBought: ['ostrene-loan'],
      heldDeals: [{ itemId: 'ostrene-loan', daysLeft: undefined }],
      stats: { ...s.stats, treasury: 0 },
      flags: { ...s.flags, ostreneLoan: 1 },
    };
    expect(canCutNow(broke, SHOP_MAP['ostrene-loan'])).toBe(false);
    const after = cutDeal(broke, 'ostrene-loan');
    expect(after.heldDeals.some((h) => h.itemId === 'ostrene-loan')).toBe(true);
    expect(after.stats.treasury).toBe(0);

    const untouched = cutDeal(s, 'gorsk-lease'); // never held
    expect(untouched.heldDeals).toEqual(s.heldDeals);
  });

  it('does nothing for an item that is not a deal', () => {
    const s = playToShop(42, 1);
    const withPolicy: GameState = { ...s, owned: ['emergency-powers'] };
    const stillOwned = cutDeal(withPolicy, 'emergency-powers');
    expect(stillOwned.owned).toContain('emergency-powers');
  });

  it('heldDealEntries only returns deals still held, never expired or cut ones', () => {
    const s = playToShop(42, 1);
    const mixed: GameState = {
      ...s,
      shopBought: ['gorsk-lease', 'ilvet-levy', 'three-judges'],
      heldDeals: [{ itemId: 'gorsk-lease', daysLeft: undefined }],
      endedDeals: [
        { itemId: 'ilvet-levy', reason: 'cut' },
        { itemId: 'three-judges', reason: 'expired' },
      ],
    };
    expect(heldDealEntries(mixed).map((e) => e.def.id)).toEqual(['gorsk-lease']);
  });
});

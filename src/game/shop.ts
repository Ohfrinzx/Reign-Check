import type { Effects, GameState, HeldDeal, Rng, StatKey } from './types';
import type { ShopItemDef, ShopRarity } from './content/shop';
import { SHOP_ITEMS, SHOP_MAP } from './content/shop';
import { NUM_ACTS, justAdvancedAct } from './state';
import { currentMandate } from './content/mandates';

/**
 * How many advisors, and how many deals, you can hold at once. Past the cap,
 * buying a new one means letting an old one go first — that trade-off, not
 * more UI, is the point (owner request). Advisors and deals are capped
 * separately: filling up on one never blocks the other. Policies and
 * favours are NOT capped.
 */
export const ADVISOR_CAP = 3;
export const DEAL_CAP = 3;

/**
 * THE BACK ROOM — logic only. No React, no DOM (ground rule 11).
 *
 * The shop opens at the end of every day. Two sizes:
 *   - the nightly room: NIGHTLY_STOCK cheap-to-mid offers from the `small` pool
 *   - the act room:     ACT_STOCK offers from the whole pool, on the night an
 *                       act's confidence vote is passed, guaranteed to include
 *                       at least one expensive `big` item
 *
 * Everything an item DOES goes through applyEffects() like a card option —
 * see buyShopItem() in engine.ts, which is the single engine hook this whole
 * system needs (docs/DESIGN_V2.md §4's architecture principle).
 */

export const NIGHTLY_STOCK = 3;
export const ACT_STOCK = 5;

/** How many past offers to remember, so the same three items don't recur nightly. */
const RECENT_MEMORY = 9;

const RARITY_WEIGHT_NIGHTLY: Record<ShopRarity, number> = {
  common: 100,
  uncommon: 34,
  rare: 7,
};

/** The act room is where the good stuff surfaces. */
const RARITY_WEIGHT_ACT: Record<ShopRarity, number> = {
  common: 60,
  uncommon: 72,
  rare: 26,
};

/**
 * How many things the room will sell you tonight.
 *
 * The nightly room sells ONE. You get three offers and you pick between them,
 * which is a real decision; being able to sweep the shelf every night is not,
 * and it also means a run sees the whole catalogue instead of a slice of it
 * (measured: an unrestricted buyer bought all 17 items in a single 18-day run).
 * The act room, twice a run, sells you as much as you can pay for.
 */
export function buyLimit(s: GameState): number {
  return isActRoom(s) ? Number.POSITIVE_INFINITY : 1;
}

/** True once tonight's room has sold you everything it is going to. */
export function roomIsClosed(s: GameState): boolean {
  return s.shopBuysTonight >= buyLimit(s) || s.shopStock.length === 0;
}

/* --------------------------------------------------------------- queries */

/** True on the night an act's confidence vote was just passed. */
export function isActRoom(s: GameState): boolean {
  return justAdvancedAct(s);
}

/**
 * The Back Room opens at the end of every day except the last one — on day 18
 * the run is over before you could spend anything.
 */
export function shopOpensTonight(s: GameState): boolean {
  if (s.ending || s.phase === 'ended') return false;
  return s.day < s.maxDays;
}

/** What this item actually costs tonight, after any owned price modifiers. */
export function shopPrice(s: GameState, def: ShopItemDef): number {
  let mult = currentMandate(s).priceMult ?? 1;
  for (const id of s.owned) {
    const owned = SHOP_MAP[id];
    if (owned?.priceMult !== undefined) mult *= owned.priceMult;
  }
  // A deal that pays you is not made cheaper by a discount; only real prices move.
  const price = def.cost > 0 ? def.cost * mult : def.cost;
  return Math.round(price * 10) / 10;
}

export function canAfford(s: GameState, def: ShopItemDef): boolean {
  const price = shopPrice(s, def);
  return price <= 0 || price <= s.stats.treasury;
}

/**
 * Nothing is offered twice in a run, favours included.
 *
 * Measured reason: with the shop opening 17 times and a pool this size, a
 * re-buyable favour was bought 2.7 times per run and crowded out items the
 * player had never seen. One-per-run is what makes a small pool feel varied.
 * Worth revisiting once the pool is big enough that repeats cost nothing.
 */
function eligible(s: GameState, def: ShopItemDef, big: boolean): boolean {
  if (!big && def.tier === 'big') return false;
  if (def.requires && !def.requires(s)) return false;
  if (s.owned.includes(def.id)) return false;
  if (s.heldFavours.includes(def.id)) return false;
  if (s.shopBought.includes(def.id)) return false;
  if (s.shopRecent.includes(def.id)) return false;
  // §4.5 step 2: a snapshot taken once at createGame() — see
  // GameState.unlockedShopItemIds in types.ts for why this never changes
  // mid-run even if meta-progression would unlock more by the end of it.
  if (!s.unlockedShopItemIds.includes(def.id)) return false;
  return true;
}

/** Everything that could legally appear in tonight's room. Exported for tests. */
export function eligibleStock(s: GameState, big = isActRoom(s)): ShopItemDef[] {
  return SHOP_ITEMS.filter((d) => eligible(s, d, big));
}

/* ------------------------------------------------------------ stock roll */

/**
 * Roll tonight's offers. Must be called inside withRng() so the RNG state
 * advances inside the save and runs stay reproducible (ground rule 4).
 */
export function rollStock(s: GameState, rng: Rng, big = isActRoom(s)): string[] {
  const want = big ? ACT_STOCK : NIGHTLY_STOCK;
  const weights = big ? RARITY_WEIGHT_ACT : RARITY_WEIGHT_NIGHTLY;
  const pool = eligibleStock(s, big);
  const picked: ShopItemDef[] = [];

  // The act room always leads with something expensive, or it isn't an event.
  if (big) {
    const bigOnes = pool.filter((d) => d.tier === 'big');
    const lead = rng.weighted(bigOnes, (d) => weights[d.rarity]);
    if (lead) picked.push(lead);
  }

  let guard = 0;
  while (picked.length < want && guard++ < 40) {
    const rest = pool.filter((d) => !picked.includes(d));
    if (!rest.length) break;
    const pick = rng.weighted(rest, (d) => weights[d.rarity]);
    if (!pick) break;
    picked.push(pick);
  }

  // A room with one kind of thing in it is a boring room. Sort so the player
  // reads them in a consistent order rather than whatever the roll produced.
  const order: Record<ShopItemDef['kind'], number> = { deal: 0, favour: 1, advisor: 2, policy: 3 };
  picked.sort((a, b) => order[a.kind] - order[b.kind] || a.cost - b.cost);
  return picked.map((d) => d.id);
}

/** Add tonight's offers to the rolling memory that stops stock repeating. */
export function rememberOffers(s: GameState, ids: string[]): string[] {
  return [...ids, ...s.shopRecent].slice(0, RECENT_MEMORY);
}

/* ------------------------------------------------------- ongoing effects */

export function ownedDefs(s: GameState): ShopItemDef[] {
  return s.owned.map((id) => SHOP_MAP[id]).filter(Boolean);
}

/** Advisors only, out of `owned` — the only kind that can be fired. */
export function ownedAdvisorDefs(s: GameState): ShopItemDef[] {
  return ownedDefs(s).filter((d) => d.kind === 'advisor');
}

export function heldFavourDefs(s: GameState): ShopItemDef[] {
  return s.heldFavours.map((id) => SHOP_MAP[id]).filter(Boolean);
}

/**
 * Every owned advisor's / policy's per-day rule, merged into one Effects so
 * engine.ts can push it through the normal applyEffects() path.
 */
export function dailyFromOwned(s: GameState): Effects | undefined {
  const defs = ownedDefs(s).filter((d) => d.daily);
  if (!defs.length) return undefined;

  const out: Effects = {};
  for (const def of defs) {
    if (def.daily?.stats) {
      out.stats = out.stats ?? {};
      for (const [k, v] of Object.entries(def.daily.stats)) {
        const key = k as StatKey;
        out.stats[key] = (out.stats[key] ?? 0) + (v as number);
      }
    }
    if (def.daily?.hidden) {
      out.hidden = out.hidden ?? {};
      for (const [k, v] of Object.entries(def.daily.hidden)) {
        const key = k as keyof GameState['hidden'];
        out.hidden[key] = (out.hidden[key] ?? 0) + (v as number);
      }
    }
  }
  return out;
}

/**
 * The multiplier owned items put on an incoming stat change. Read by
 * effects.ts's applyCoupling() — the one place a raw stat delta is bent.
 */
export function ownedStatMult(s: GameState, k: StatKey, d: number): number {
  if (!s.owned?.length) return 1;
  let mult = 1;
  for (const id of s.owned) {
    const def = SHOP_MAP[id];
    if (!def) continue;
    if (d < 0 && def.lossMult?.[k] !== undefined) mult *= def.lossMult[k]!;
    if (d > 0 && def.gainMult?.[k] !== undefined) mult *= def.gainMult[k]!;
  }
  return mult;
}

/* ----------------------------------------------------------- held deals */

/**
 * Start holding a deal. Called from buyShopItem() for EVERY deal purchase,
 * timed or permanent — a permanent deal gets `daysLeft: undefined` and just
 * sits in `heldDeals` (occupying a slot) until it is cut; a timed one counts
 * down on its own too. This is what makes every deal, not just the timed
 * ones, subject to DEAL_CAP and cuttable from the held-panel.
 */
export function startHeldDeal(s: GameState, def: ShopItemDef): void {
  if (def.kind !== 'deal') return;
  s.heldDeals.push({ itemId: def.id, daysLeft: def.durationDays });
}

/**
 * Count down every TIMED held deal by a day (permanent ones, `daysLeft`
 * undefined, are never touched here — they only ever leave via cutDeal()),
 * removing any that just ran out. Mutates `s.heldDeals` in place, the same
 * shape as how commitments tick in engine.ts's dayUpkeep(). Returns the defs
 * that expired THIS tick, so the caller can push each one's own
 * `expireEffects` through applyEffects() individually (this file never calls
 * applyEffects itself, to avoid a circular import with effects.ts, which
 * already imports from here for ownedStatMult()).
 */
export function tickHeldDeals(s: GameState): ShopItemDef[] {
  const remaining: HeldDeal[] = [];
  const expired: ShopItemDef[] = [];
  for (const held of s.heldDeals) {
    if (held.daysLeft === undefined) {
      remaining.push(held);
      continue;
    }
    const daysLeft = held.daysLeft - 1;
    if (daysLeft > 0) {
      remaining.push({ itemId: held.itemId, daysLeft });
      continue;
    }
    const def = SHOP_MAP[held.itemId];
    if (def) expired.push(def);
  }
  s.heldDeals = remaining;
  return expired;
}

export type DealStatus = 'ongoing' | 'active' | 'expired' | 'cut';

/**
 * Every deal ever bought this run, in one of four states:
 *   'ongoing'  — held, permanent, no clock (most deals: a sold lease, a loan)
 *   'active'   — held, timed, still running; `daysLeft` is live
 *   'expired'  — a timed deal that ran its own course (tickHeldDeals())
 *   'cut'      — ended on purpose, before its time or with no time to run out
 * Kept distinct so a finished deal never reads as "Ongoing", and so cutting
 * one on purpose reads differently from one that simply ran out.
 */
export interface DealEntry {
  def: ShopItemDef;
  status: DealStatus;
  /** only meaningful when status === 'active' */
  daysLeft?: number;
}

export function boughtDealDefs(s: GameState): DealEntry[] {
  const heldById = new Map(s.heldDeals.map((h) => [h.itemId, h.daysLeft]));
  const endedById = new Map(s.endedDeals.map((e) => [e.itemId, e.reason]));
  return s.shopBought
    .map((id) => SHOP_MAP[id])
    .filter((d): d is ShopItemDef => !!d && d.kind === 'deal')
    .map((def): DealEntry => {
      if (heldById.has(def.id)) {
        const daysLeft = heldById.get(def.id);
        return daysLeft !== undefined ? { def, status: 'active', daysLeft } : { def, status: 'ongoing' };
      }
      return { def, status: endedById.get(def.id) === 'cut' ? 'cut' : 'expired' };
    });
}

/** Deals currently held (either status), for the cap display and the shop's held-panel. */
export function heldDealEntries(s: GameState): DealEntry[] {
  return boughtDealDefs(s).filter((e) => e.status === 'ongoing' || e.status === 'active');
}

/* --------------------------------------------------------------- slots */

export function advisorSlotsUsed(s: GameState): number {
  return ownedAdvisorDefs(s).length;
}

export function dealSlotsUsed(s: GameState): number {
  return s.heldDeals.length;
}

export function canHoldMoreAdvisors(s: GameState): boolean {
  return advisorSlotsUsed(s) < ADVISOR_CAP;
}

export function canHoldMoreDeals(s: GameState): boolean {
  return dealSlotsUsed(s) < DEAL_CAP;
}

/** Plain-language reason a purchase is blocked by the cap, or undefined if it isn't. */
export function capBlockReason(s: GameState, def: ShopItemDef): string | undefined {
  if (def.kind === 'advisor' && !canHoldMoreAdvisors(s)) {
    return `You already have ${ADVISOR_CAP} advisors. Fire one first.`;
  }
  if (def.kind === 'deal' && !canHoldMoreDeals(s)) {
    return `You already have ${DEAL_CAP} deals running. Cut one first.`;
  }
  return undefined;
}

/* --------------------------------------------------------- firing / cutting */

/** What it costs, in money, to fire this advisor right now. */
export function fireCostOf(def: ShopItemDef): number {
  return def.fireCost ?? 0;
}

export function canFireNow(s: GameState, def: ShopItemDef): boolean {
  return fireCostOf(def) === 0 || fireCostOf(def) <= s.stats.treasury;
}

/** What it costs, in money, to cut this deal short right now. */
export function cutCostOf(def: ShopItemDef): number {
  return def.cutCost ?? 0;
}

export function canCutNow(s: GameState, def: ShopItemDef): boolean {
  return cutCostOf(def) === 0 || cutCostOf(def) <= s.stats.treasury;
}

/* ------------------------------------------------------------- reporting */

/** Plain-language price line for the UI. Money first, per the writing rules. */
export function priceLine(s: GameState, def: ShopItemDef): string {
  const p = shopPrice(s, def);
  if (p < 0) return `They pay you $${Math.abs(p).toFixed(1)}B.`;
  return `Cost: $${p.toFixed(1)}B.`;
}

export function shopHeading(s: GameState): { title: string; sub: string } {
  if (isActRoom(s)) {
    return {
      title: 'The Back Room',
      sub: `You survived the vote. Act ${Math.min(s.act, NUM_ACTS)} people want to be seen with you tonight.`,
    };
  }
  return {
    title: 'The Back Room',
    sub: 'The building is empty. Three people waited for it to be empty.',
  };
}

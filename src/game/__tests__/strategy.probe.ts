import { createGame } from '../state';
import { prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert, activeCard, openShop, leaveShop, completeConfidenceVote, orderedOptions, buyShopItem, useFavour } from '../engine';
import { makeRng } from '../rng';
import { applyEffects } from '../effects';
import { computeBudget } from '../economy';
import { computeResources, DISPLAY_FACTIONS } from '../display';
import { MANDATES } from '../content/mandates';
import { SHOP_MAP } from '../content/shop';
import { computeConfidenceVote } from '../content/endings';
import { shopPrice, capBlockReason, roomIsClosed } from '../shop';
import { liveDemands, meetDemand, meetBlockReason, meetCost } from '../demands';
import { favourTargets, favourBlockReason } from '../favours';
import { visibleScore } from './balance.probe';
import type { CardOption, Effects, GameState, HiddenKey, Rng } from '../types';

/** These are scripted, learned policies, not human win-rate estimates.
 * Expected policies know authored trade-offs, but cannot inspect a future
 * seeded roll. They use pressure warning bands rather than exact pressures.
 * They do not search future card draws, optimise minigame layouts, or tune
 * themselves to a seed. All shop items are unlocked for the experienced
 * player comparison. Legacy-careful intentionally retains the old oracle.
 * Minigames use chooseOption(won/lost), so they omit Budget Night jar
 * aftermath and Ambassador price-tier flags. This is a macro comparison,
 * with optimistic generic wins, not a full simulation of those games.
 */
export type StrategyPolicy = 'adaptive' | 'coalition' | 'command' | 'reform' | 'economy' | 'random' | 'random-managed' | 'legacy-careful';
export const STRATEGY_POLICIES: StrategyPolicy[] = ['adaptive', 'coalition', 'command', 'reform', 'economy', 'random', 'random-managed', 'legacy-careful'];
type Style = 'coalition' | 'command' | 'reform' | 'economy';
export const START_STYLE: Record<string, Style> = {
  stairwell: 'command', landslide: 'coalition', handover: 'economy',
  accident: 'coalition', 'clean-hands': 'reform', 'pay-deal': 'economy',
};

// Same thresholds as briefing.ts. Band midpoint estimates are deliberate:
// removing raw pressure precision also removes perfect threshold timing.
const WARNING_BANDS: Record<HiddenKey, number[]> = {
  coup: [30, 52, 72], unrest: [32, 55, 75], scandal: [35, 58, 78],
  leak: [38, 62], fiscal: [38, 60, 80], foreign: [35, 62],
  separatism: [35, 62], corruption: [48], fear: [55], cult: [55],
};
export function readerPosition(s: GameState): GameState {
  // These display transcripts cannot affect an authored option outcome.
  // Omit them only in estimates, never in the live simulated run.
  const observed = structuredClone({ ...s, log: [], history: [], lastOutcome: undefined,
    stat: { ...s.stat, bigMoments: [] } });
  observed.rngState = 1;
  observed.seed = 1;
  for (const key of Object.keys(WARNING_BANDS) as HiddenKey[]) {
    const thresholds = [0, ...WARNING_BANDS[key], 100];
    const at = thresholds.findIndex((v) => v > s.hidden[key]);
    const upper = at < 0 ? thresholds.length - 1 : at;
    observed.hidden[key] = (thresholds[Math.max(0, upper - 1)] + thresholds[upper]) / 2;
  }
  // Plotting is a qualitative warning in the Files, not a visible number.
  for (const c of Object.values(observed.characters)) c.plotting = c.plotting >= 60 ? 75 : c.plotting >= 40 ? 50 : 20;
  return observed;
}

function styleFor(s: GameState, policy: StrategyPolicy): Style {
  return policy === 'adaptive' || policy === 'random-managed' ? START_STYLE[s.mandateId] ?? 'coalition'
    : policy === 'command' || policy === 'reform' || policy === 'economy' ? policy : 'coalition';
}

function positionScore(s: GameState, style: Style): number {
  const r = computeResources(s);
  const grip = r.find((x) => x.key === 'grip')!.value;
  const legitimacy = r.find((x) => x.key === 'legitimacy')!.value;
  const vote = computeConfidenceVote(s);
  const treasury = s.stats.treasury;
  // Money has diminishing value beyond the reserve needed for the next few
  // mornings. Debt and dangerous loyalty remain costly under every style.
  let score = vote.score * 1.35 + grip * (style === 'command' ? 0.7 : 0.3)
    + legitimacy * (style === 'reform' ? 0.8 : 0.35)
    + Math.min(treasury, 35) * (style === 'economy' ? 0.65 : 0.35)
    + Math.min(0, treasury) * 1.2
    + computeBudget(s).net * (style === 'economy' ? 5 : 3);
  for (const d of DISPLAY_FACTIONS) {
    const f = s.factions[d.id];
    const ally = style === 'command' && (d.id === 'staff' || d.id === 'sable')
      || style === 'coalition' && (d.id === 'chorus' || d.id === 'combine')
      || style === 'economy' && (d.id === 'concord' || d.id === 'combine');
    score += Math.min(75, f.loyalty) * (ally ? 0.35 : 0.12)
      - Math.max(0, 38 - f.loyalty) * 1.8 - Math.max(0, 35 - f.patience) * 0.2;
  }
  for (const key of ['coup', 'unrest', 'scandal', 'foreign', 'fiscal', 'separatism', 'leak'] as HiddenKey[]) {
    const h = s.hidden[key];
    score -= h * 0.06 + Math.max(0, h - 40) * 0.3 + Math.max(0, h - 65) * 0.8;
  }
  if (style === 'reform') score -= s.hidden.corruption * 0.45;
  if (s.flags.__forceEnding || (s.ending && s.ending.id !== 'survival')) score -= 1000;
  return score;
}

/** Small bounded horizon: known bills, scheduled effects and completed
 * projects count; unknown queued cards and future draws do not. */
function expectedEffectValue(s: GameState, effects: Effects | undefined, style: Style, sampleSeed: number): number {
  const after = structuredClone(s);
  const rng = makeRng(sampleSeed);
  const before = positionScore(s, style);
  applyEffects(after, effects, rng, 'strategy-estimate');
  let value = positionScore(after, style) - before;
  const days = Math.min(5, s.maxDays - s.day);
  for (const spec of effects?.schedule ?? []) {
    if (spec.inDays > s.maxDays - s.day || !spec.effects) continue;
    value += expectedEffectValue(after, { ...spec.effects, schedule: undefined }, style, sampleSeed) * 0.65;
  }
  if (effects?.project?.onComplete && effects.project.days <= s.maxDays - s.day) {
    value += expectedEffectValue(after, effects.project.onComplete, style, sampleSeed) * 0.65;
  }
  for (const c of effects?.commitments ?? []) value -= c.perDay * Math.min(days, c.days ?? days) * (style === 'economy' ? 0.8 : 0.5);
  if (effects?.promise) value -= 1; // follow-up must still be honoured
  return value;
}

// Fixed samples are independent of the saved run RNG. Functions
// receive a fresh observation and cannot mutate the live game state.
const EXPECTATION_SEEDS = [17, 503, 13007, 91283, 400009, 770003];
export function expectedOptionValue(s: GameState, option: CardOption, policy: StrategyPolicy): number {
  const observed = readerPosition(s);
  const style = styleFor(s, policy);
  const seeds = typeof option.outcome === 'function' ? EXPECTATION_SEEDS : [17];
  let total = 0;
  for (const seed of seeds) {
    const snapshot = structuredClone(observed);
    const result = typeof option.outcome === 'function' ? option.outcome(snapshot, makeRng(seed)) : option.outcome;
    total += expectedEffectValue(observed, result.effects, style, seed);
  }
  return total / seeds.length;
}

export function strategyChoice(s: GameState, policy: StrategyPolicy, rng: Rng): string {
  const card = activeCard(s)!;
  const options = orderedOptions(s, card).filter((o) => !o.enabled || o.enabled(s));
  if (!options.length) throw new Error(`No legal option on ${card.id}`);
  if (policy === 'random' || policy === 'random-managed') return options[rng.int(options.length)].id;
  if (policy === 'legacy-careful') {
    if (!rng.chance(0.75)) return options[rng.int(options.length)].id;
    return [...options].sort((a, b) => visibleScore(chooseOption(s, b.id)) - visibleScore(chooseOption(s, a.id)))[0].id;
  }
  // Sort ties by stable option ID so the shuffled visual order cannot
  // become another source of implicit seed knowledge.
  return options.map((o) => ({ id: o.id, value: expectedOptionValue(s, o, policy) }))
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))[0].id;
}

function managePosition(s: GameState, policy: StrategyPolicy): GameState {
  // Both controls omit the shop/actions as the original probe did.
  if (policy === 'random' || policy === 'legacy-careful') return s;
  const style = styleFor(s, policy);
  for (const id of [...s.heldFavours]) {
    if (favourBlockReason(s, id)) continue;
    const def = SHOP_MAP[id];
    const targets = favourTargets(s, def);
    const target = [...targets].sort((a, b) => {
      const urgency = (key: string) => {
        if (key.startsWith('demand:')) {
          const f = s.factions[key.slice(7) as keyof GameState['factions']];
          return f.demand?.severity === 'ultimatum' ? 100 : 40 + meetCost(s, f.id);
        }
        return key.startsWith('crisis:') ? 75 : 50;
      };
      return urgency(b.key) - urgency(a.key);
    })[0];
    if (target || expectedEffectValue(readerPosition(s), def.use?.effects, style, 17) > 2) s = useFavour(s, id, target?.key);
  }
  for (const { faction, demand } of liveDemands(s)) {
    if (meetBlockReason(s, faction)) continue;
    const cost = meetCost(s, faction);
    const reserve = Math.max(3, -computeBudget(s).net * 3);
    if (demand.severity === 'ultimatum' || s.factions[faction].loyalty < 38
      || (demand.dueDay <= s.day && s.stats.treasury - cost >= reserve)) s = meetDemand(s, faction);
  }
  return s;
}

function shopValue(s: GameState, id: string, policy: StrategyPolicy): number {
  const def = SHOP_MAP[id];
  const style = styleFor(s, policy);
  const observed = readerPosition(s);
  const price = shopPrice(s, def);
  const reserve = Math.max(4, -computeBudget(s).net * 3);
  if (price > 0 && s.stats.treasury - price < reserve) return -Infinity;
  let value = expectedEffectValue(observed, { stats: { treasury: -price } }, style, 17)
    + expectedEffectValue(observed, def.effects, style, 17);
  const days = Math.min(6, s.maxDays - s.day);
  if (def.daily) value += expectedEffectValue(observed, def.daily, style, 17) * days * 0.7;
  if (def.use) value += expectedEffectValue(observed, def.use.effects, style, 17) * 0.65
    + (favourTargets(s, def).length ? 5 : 1);
  for (const [key, mult] of Object.entries(def.lossMult ?? {})) {
    value += (1 - mult!) * days * (key === 'legitimacy' ? 3 : 1);
  }
  for (const [key, mult] of Object.entries(def.gainMult ?? {})) {
    value += (mult! - 1) * days * (key === 'legitimacy' ? 3 : 1);
  }
  if (def.priceMult) value += (1 - def.priceMult) * days * 1.5;
  if (def.expireEffects && (def.durationDays ?? Infinity) <= s.maxDays - s.day) value += expectedEffectValue(observed, def.expireEffects, style, 17) * 0.7;
  return value;
}

export interface StrategySettings {
  n: number;
  mandateId: string;
  policy: StrategyPolicy;
  minigameSkill: number;
  /** Holdout uses an untouched offset, preserving the same policy code. */
  seedOffset?: number;
  /** Ablation removes purchases, held favour use and demand intervention. */
  management?: boolean;
}

export function strategyProbe(settings: StrategySettings) {
  const { n, mandateId, policy, minigameSkill, seedOffset = 0, management = true } = settings;
  const endings: Record<string, number> = {};
  const purchases: Record<string, number> = {};
  const choices: Record<string, Record<string, number>> = {};
  const margins: number[][] = [[], [], []];
  let days = 0, totalPurchases = 0, demandsMet = 0, favoursUsed = 0, minigamesWon = 0, minigamesPlayed = 0;
  for (let i = 0; i < n; i++) {
    const sequence = i + seedOffset;
    const rng = makeRng(sequence + 99);
    let s = prepareDay(createGame({ seed: sequence * 7717 + 3, mandateId }));
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 3000) {
      if (management) s = managePosition(s, policy);
      if (s.phase === 'briefing') s = beginStages(s);
      else if (s.phase === 'stage' || s.phase === 'alert') {
        const card = activeCard(s)!;
        let id: string;
        if (card.minigame) {
          minigamesPlayed++;
          const won = rng.chance(minigameSkill);
          if (won) minigamesWon++;
          // A won mole game still has a meaningful policy choice.
          id = won ? card.minigame === 'mole' && policy !== 'random' && policy !== 'legacy-careful'
            ? strategyChoice(s, policy, rng) : 'won' : 'lost';
          if (won && card.minigame === 'mole' && id === 'lost') id = 'won';
        } else id = strategyChoice(s, policy, rng);
        choices[card.id] ??= {};
        choices[card.id][id] = (choices[card.id][id] ?? 0) + 1;
        s = chooseOption(s, id);
      } else if (s.phase === 'resolve') s = continueAfterResolve(s);
      else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
      else if (s.phase === 'vote') {
        margins[s.act - 1]?.push(s.confidenceVote!.margin);
        s = completeConfidenceVote(s);
      } else if (s.phase === 'night') s = openShop(s);
      else if (s.phase === 'shop') {
        if (management && policy !== 'random' && policy !== 'legacy-careful' && !roomIsClosed(s)) {
          const best = s.shopStock.filter((id) => !capBlockReason(s, SHOP_MAP[id]) && shopPrice(s, SHOP_MAP[id]) <= s.stats.treasury)
            .map((id) => ({ id, value: shopValue(s, id, policy) }))
            .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))[0];
          if (best && best.value > 0.75) { s = buyShopItem(s, best.id); continue; }
        }
        s = leaveShop(s);
      } else throw new Error(`Unhandled phase ${s.phase}`);
    }
    if (guard >= 3000) throw new Error(`Strategy stalled: ${mandateId} / ${policy} / ${sequence}`);
    const ending = s.ending?.id ?? 'none';
    endings[ending] = (endings[ending] ?? 0) + 1;
    days += s.day;
    totalPurchases += s.shopBought.length;
    for (const id of s.shopBought) purchases[id] = (purchases[id] ?? 0) + 1;
    demandsMet += s.log.filter((l) => l.title.startsWith('Met:')).length;
    favoursUsed += s.shopBought.filter((id) => SHOP_MAP[id].kind === 'favour' && !s.heldFavours.includes(id)).length;
  }
  const median = (a: number[]) => a.length ? [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)] : null;
  const rate = (endings.survival ?? 0) / n;
  // Wilson 95% interval, sensible even for a 0% or 100% observed result.
  const z2 = 1.96 ** 2;
  const center = (rate + z2 / (2 * n)) / (1 + z2 / n);
  const spread = 1.96 * Math.sqrt(rate * (1 - rate) / n + z2 / (4 * n * n)) / (1 + z2 / n);
  return {
    ...settings, seedOffset, management,
    survived: Math.round(rate * 1000) / 10,
    survival95: [Math.round((center - spread) * 1000) / 10, Math.round((center + spread) * 1000) / 10],
    avgDays: Math.round(days / n * 10) / 10,
    voteMarginMedianByAct: margins.map(median), reachedVotes: margins.map((m) => m.length),
    avgPurchases: Math.round(totalPurchases / n * 10) / 10,
    avgDemandsMet: Math.round(demandsMet / n * 10) / 10,
    avgFavoursUsed: Math.round(favoursUsed / n * 10) / 10,
    minigameWinRate: Math.round(minigamesWon / Math.max(1, minigamesPlayed) * 1000) / 10,
    endings, purchases, choices,
  };
}

export function strategyMatrix(n: number, minigameSkill = 0.9, seedOffset = 0, policies = STRATEGY_POLICIES) {
  return MANDATES.flatMap((m) => policies.map((policy) => strategyProbe({ n, mandateId: m.id, policy, minigameSkill, seedOffset })));
}

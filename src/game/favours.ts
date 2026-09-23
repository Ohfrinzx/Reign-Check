import type { FactionId, GameState, Rng, Stats } from './types';
import { makeRng } from './rng';
import { applyEffects, mergeDeltas } from './effects';
import { SHOP_MAP } from './content/shop';
import type { ShopItemDef } from './content/shop';
import { CRISIS_MAP } from './content/crises';
import { DEMAND_MAP } from './content/demands';
import { endFlag, scoreFlag } from './crises';
import { DEMAND_FACTIONS, factionLabel, withdrawDemand } from './demands';

/**
 * BALANCE SLICE A — FAVOURS THAT VISIBLY DO SOMETHING. No React, no DOM.
 *
 * Owner: favours "never truly feel like they've been used… it isn't clear if
 * it worked, when to use it, or if you even used it for the thing you
 * wanted." Before this, spending one just nudged hidden numbers.
 *
 * Now a favour can be AIMED (`use.targets` in content/shop.ts) at something
 * the player can see — a named scandal, a faction's demand, a running crisis
 * — and that thing goes away, by name:
 *   - scandal: removed from play (and scandal pressure falls with it)
 *   - demand:  the faction withdraws it, unpaid (demands.ts withdrawDemand)
 *   - crisis:  it ends early as "handled" (crises.ts closes it next morning,
 *              and its stage card for today, if unplayed, is taken away)
 * The favour's own `use.effects` still apply either way. `needsTarget`
 * favours are disabled, with a plain reason, while there is nothing to aim
 * them at. spendFavour() returns a FavourResult the UI shows as a receipt.
 */

export interface FavourTarget {
  /** 'scandal:<id>' | 'demand:<faction>' | 'crisis:<id>' */
  key: string;
  label: string;
  detail: string;
}

export interface FavourResult {
  name: string;
  text: string;
  /** plain-language lines: what went away, what changed */
  lines: string[];
  deltas: Partial<Stats>;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function withRng<T>(s: GameState, fn: (rng: Rng) => T): T {
  const rng = makeRng(s.rngState);
  const out = fn(rng);
  s.rngState = rng.state();
  return out;
}

/** Everything this favour could be aimed at right now. */
export function favourTargets(s: GameState, def: ShopItemDef | undefined): FavourTarget[] {
  const out: FavourTarget[] = [];
  for (const t of def?.use?.targets ?? []) {
    if (t === 'scandal') {
      for (const sc of s.scandals) {
        if (!out.some((o) => o.key === `scandal:${sc.id}`)) out.push({ key: `scandal:${sc.id}`, label: sc.name, detail: `Scandal. ${sc.detail}` });
      }
    } else if (t === 'demand' || t.startsWith('demand:')) {
      const want = t === 'demand' ? DEMAND_FACTIONS : [t.slice(7) as FactionId];
      for (const f of want) {
        const d = s.factions[f]?.demand;
        const dd = d && DEMAND_MAP[d.id];
        if (dd && !out.some((o) => o.key === `demand:${f}`)) {
          out.push({ key: `demand:${f}`, label: `${factionLabel(f)}: ${dd.title}`, detail: `Demand, due by day ${d.dueDay}.` });
        }
      }
    } else if (t.startsWith('crisis:')) {
      const id = t.slice(7);
      if (s.crisis?.id === id && CRISIS_MAP[id]) {
        out.push({ key: `crisis:${id}`, label: CRISIS_MAP[id].name, detail: `Crisis, stage ${s.crisis.stage} of 3.` });
      }
    }
  }
  return out;
}

/** Why the favour cannot be spent right now, in plain words — or undefined. */
export function favourBlockReason(s: GameState, itemId: string): string | undefined {
  const def = SHOP_MAP[itemId];
  if (!def?.use || !s.heldFavours.includes(itemId)) return 'You do not hold this favour.';
  // Never mid-alert or mid-vote; fine on the front page, between cards,
  // after a result, at night, or in the Back Room right after buying one.
  if (!['briefing', 'stage', 'resolve', 'alertResolve', 'night', 'shop'].includes(s.phase)) return 'Finish the current item first.';
  if (def.use.needsTarget && favourTargets(s, def).length === 0) {
    return `Nothing to use it on yet. ${def.use.whenUseful ?? ''}`.trim();
  }
  return undefined;
}

/**
 * Spend a favour, optionally aimed at `targetKey` (from favourTargets()).
 * A favour that `needsTarget` uses the first valid target if none is given.
 * Returns the new state and a receipt; the input state is never mutated.
 */
export function spendFavour(prev: GameState, itemId: string, targetKey?: string): { state: GameState; result?: FavourResult } {
  if (favourBlockReason(prev, itemId)) return { state: prev };
  const s = clone(prev);
  const def = SHOP_MAP[itemId]!;
  const use = def.use!;
  const targets = favourTargets(s, def);
  const target = targets.find((t) => t.key === targetKey) ?? (use.needsTarget ? targets[0] : undefined);

  s.heldFavours.splice(s.heldFavours.indexOf(itemId), 1);
  const lines: string[] = [];
  let deltas = withRng(s, (rng) => applyEffects(s, use.effects, rng, `favour:${def.id}`));

  if (target) {
    const [kind, id] = [target.key.slice(0, target.key.indexOf(':')), target.key.slice(target.key.indexOf(':') + 1)];
    if (kind === 'scandal') {
      const sc = s.scandals.find((x) => x.id === id);
      if (sc) {
        s.scandals = s.scandals.filter((x) => x.id !== id);
        const d = withRng(s, (rng) => applyEffects(s, { hidden: { scandal: -Math.round(sc.heat * 0.4) } }, rng, `favour:${def.id}`));
        deltas = mergeDeltas(deltas, d);
        lines.push(`"${sc.name}" is gone. It will not be on the front page again.`);
      }
    } else if (kind === 'demand') {
      const title = withRng(s, (rng) => withdrawDemand(s, id as FactionId, rng, `favour:${def.id}`));
      if (title) lines.push(`The ${factionLabel(id as FactionId)} dropped their demand: "${title}". You paid nothing for it.`);
    } else if (kind === 'crisis' && s.crisis?.id === id) {
      const crisis = CRISIS_MAP[id];
      s.flags[endFlag(id)] = 1;
      s.flags[scoreFlag(id)] = (s.flags[scoreFlag(id)] ?? 0) + 2;
      // Take today's unplayed stage card away, if there is one.
      const card = s.crisis.cardId;
      if (!s.seenOnce.includes(card)) {
        s.queued = s.queued.filter((q) => q.cardId !== card);
        const at = s.todayDeck.indexOf(card);
        // Only cards still ahead of the player today: any, before the day
        // starts; later ones, once it has.
        if (at >= 0 && (s.phase === 'briefing' || at > s.stageIndex)) {
          s.todayDeck.splice(at, 1);
          s.agenda.splice(at, 1);
        }
      }
      lines.push(`${crisis.name} is over. It will be recorded as handled.`);
    }
  } else if (targets.length === 0 && use.targets?.length) {
    lines.push('There was nothing specific to aim it at, so only its general effect applied.');
  }

  s.log.push({ day: s.day, kind: 'purchase', title: def.name, text: [use.text, ...lines].join(' '), tone: 'good' });
  // Keep the existing receipt behaviour for the day's card, as before.
  if (s.phase !== 'resolve' && s.phase !== 'alertResolve') {
    s.lastOutcome = { text: use.text, tone: 'good', cardTitle: def.name, optionLabel: use.label, deltas };
  }
  return { state: s, result: { name: def.name, text: use.text, lines, deltas } };
}

export function favourUsefulNow(s: GameState, itemId: string): FavourTarget[] {
  return favourTargets(s, SHOP_MAP[itemId]);
}

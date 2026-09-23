import type { CardDef, AlertDef, GameState, ShownOption, FactionId, Rng } from './types';
import { CONSEQUENCES, DEMAND_REACTIONS, MARKS } from './content/consequences';
import type { ConsequenceDef, DemandReactionDef } from './content/consequences';
import { applyEffects } from './effects';

/**
 * BALANCE SLICE C — CONSEQUENCES. No React, no DOM (ground rule 11).
 *
 * A mark is a flag, `mark:<id>`, holding the day it was made. It is set
 * through applyEffects() when the player picks an option listed in a mark's
 * `setBy` (engine.ts chooseOption()). shownOptions() applies every reaction
 * whose mark is set: unlocked options are added, locked ones are blocked
 * with a reason, changed ones get their new hint and outcome. Each carries a
 * `because` line for the UI. The player never sees a number (ground rule 6),
 * only what they did and when.
 */

export const markFlag = (id: string) => `mark:${id}`;

/** Grammatical "X remembers" per visible faction (the labels mix singular and plural). */
const REMEMBERS: Partial<Record<FactionId, string>> = {
  staff: 'the army remembers',
  sable: 'the Sable Office remembers',
  concord: 'the Elites remember',
  combine: 'the unions remember',
  chorus: 'the Street remembers',
};

const MARK_MAP = Object.fromEntries(MARKS.map((m) => [m.id, m]));

const BY_CARD: Record<string, ConsequenceDef[]> = {};
for (const c of CONSEQUENCES) (BY_CARD[c.card] ??= []).push(c);

const SET_BY: Record<string, string[]> = {};
for (const m of MARKS) for (const k of m.setBy) (SET_BY[`${k.card}/${k.option}`] ??= []).push(m.id);

export function hasMark(s: GameState, id: string): boolean {
  return (s.flags[markFlag(id)] ?? 0) > 0;
}

/** "Because you bought Channel Seven's coverage (day 3)" */
export function becauseText(s: GameState, id: string, faction?: FactionId): string {
  const def = MARK_MAP[id];
  const day = s.flags[markFlag(id)];
  const who = faction ? REMEMBERS[faction] : undefined;
  return `Because you ${def?.because ?? id}${day ? ` (day ${day})` : ''}${who ? ` — ${who}` : ''}`;
}

/** Marks the given decision leaves, if any. */
export function marksSetBy(cardId: string, optionId: string): string[] {
  return SET_BY[`${cardId}/${optionId}`] ?? [];
}

/** Every mark made so far this run, oldest first — for the record panel. */
export function marksMade(s: GameState): { id: string; day: number; because: string }[] {
  return MARKS.filter((m) => hasMark(s, m.id))
    .map((m) => ({ id: m.id, day: s.flags[markFlag(m.id)], because: m.because }))
    .sort((a, b) => a.day - b.day);
}

/**
 * The options as this run shows them: the card's own, with any lock or
 * change applied, then any unlocked extras. Order is decided afterwards by
 * engine.ts orderedOptions().
 */
export function shownOptions(s: GameState, card: CardDef | AlertDef): ShownOption[] {
  const rules = BY_CARD[card.id];
  if (!rules) return card.options;
  const out: ShownOption[] = card.options.map((o) => {
    const r = rules.find((x) => x.kind !== 'unlock' && x.option === o.id && hasMark(s, x.mark));
    if (!r) return o;
    const text = becauseText(s, r.mark, r.faction);
    if (r.kind === 'lock') {
      return { ...o, enabled: () => false, lockedText: `${text}: ${r.lockedText ?? 'this is off the table.'}`, because: { kind: 'lock', text } };
    }
    return { ...o, hint: r.hint ?? o.hint, outcome: r.outcome ?? o.outcome, because: { kind: 'change', text } };
  });
  for (const r of rules) {
    if (r.kind !== 'unlock' || !hasMark(s, r.mark) || !r.outcome) continue;
    out.push({ id: r.option, label: r.label ?? r.option, hint: r.hint, outcome: r.outcome, because: { kind: 'unlock', text: becauseText(s, r.mark, r.faction) } });
  }
  return out;
}

/* ------------------------------------------------------------------------
 * BALANCE SLICE D — factions react to what you did.
 * -------------------------------------------------------------------- */

/** mornings a faction's mood keeps drifting after a decision it has feelings about */
export const MEMORY_DAYS = 4;

/** What one faction remembers, newest first: the decision, when, and whether it liked it. */
export function factionMemories(s: GameState, faction: FactionId): { id: string; day: number; because: string; weight: number }[] {
  return MARKS.filter((m) => m.factions?.[faction] && hasMark(s, m.id))
    .map((m) => ({ id: m.id, day: s.flags[markFlag(m.id)], because: m.because, weight: m.factions![faction]! }))
    .sort((a, b) => b.day - a.day);
}

/**
 * Morning upkeep (engine.ts dayUpkeep()): for MEMORY_DAYS mornings after a
 * decision, each visible faction with feelings about it drifts that way,
 * one loyalty point per weight per morning — so a decision keeps echoing
 * for a few days instead of landing once and vanishing.
 */
export function tickFactionMemory(s: GameState, rng: Rng): void {
  for (const m of MARKS) {
    if (!m.factions || !hasMark(s, m.id)) continue;
    const age = s.day - s.flags[markFlag(m.id)];
    if (age < 1 || age > MEMORY_DAYS) continue;
    const factions: Partial<Record<FactionId, { loyalty: number }>> = {};
    for (const [f, w] of Object.entries(m.factions) as [FactionId, number][]) factions[f] = { loyalty: w };
    applyEffects(s, { factions }, rng, `memory:${m.id}`);
  }
}

export interface ActiveDemandReaction {
  kind: DemandReactionDef['kind'];
  /** "Because you … (day N): <text>" */
  text: string;
}

/** Every memory that changes how this faction's demands can be handled. */
export function demandReactions(s: GameState, faction: FactionId): ActiveDemandReaction[] {
  return DEMAND_REACTIONS.filter((r) => r.faction === faction && hasMark(s, r.mark))
    .map((r) => ({ kind: r.kind, text: `${becauseText(s, r.mark)}: ${r.text}` }));
}

/** Price multiplier on meeting this faction's demands: ×0.6 per "cheaper", ×1.5 per "dearer". */
export function meetMultiplier(s: GameState, faction: FactionId): number {
  return demandReactions(s, faction).reduce((m, r) => m * (r.kind === 'cheaper' ? 0.6 : r.kind === 'dearer' ? 1.5 : 1), 1);
}

/** Why this faction will not take a bribe at all, if a memory rules it out. */
export function noBribeBecause(s: GameState, faction: FactionId): string | undefined {
  return demandReactions(s, faction).find((r) => r.kind === 'no-bribe')?.text;
}

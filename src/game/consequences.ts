import type { CardDef, AlertDef, GameState, ShownOption } from './types';
import { CONSEQUENCES, MARKS } from './content/consequences';
import type { ConsequenceDef } from './content/consequences';

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

const MARK_MAP = Object.fromEntries(MARKS.map((m) => [m.id, m]));

const BY_CARD: Record<string, ConsequenceDef[]> = {};
for (const c of CONSEQUENCES) (BY_CARD[c.card] ??= []).push(c);

const SET_BY: Record<string, string[]> = {};
for (const m of MARKS) for (const k of m.setBy) (SET_BY[`${k.card}/${k.option}`] ??= []).push(m.id);

export function hasMark(s: GameState, id: string): boolean {
  return (s.flags[markFlag(id)] ?? 0) > 0;
}

/** "Because you bought Channel Seven's coverage (day 3)" */
export function becauseText(s: GameState, id: string): string {
  const def = MARK_MAP[id];
  const day = s.flags[markFlag(id)];
  return `Because you ${def?.because ?? id}${day ? ` (day ${day})` : ''}`;
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
    const text = becauseText(s, r.mark);
    if (r.kind === 'lock') {
      return { ...o, enabled: () => false, lockedText: `${text}: ${r.lockedText ?? 'this is off the table.'}`, because: { kind: 'lock', text } };
    }
    return { ...o, hint: r.hint ?? o.hint, outcome: r.outcome ?? o.outcome, because: { kind: 'change', text } };
  });
  for (const r of rules) {
    if (r.kind !== 'unlock' || !hasMark(s, r.mark) || !r.outcome) continue;
    out.push({ id: r.option, label: r.label ?? r.option, hint: r.hint, outcome: r.outcome, because: { kind: 'unlock', text: becauseText(s, r.mark) } });
  }
  return out;
}

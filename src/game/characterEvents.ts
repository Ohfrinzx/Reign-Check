import type { CharacterState, GameState, Rng } from './types';
import { CHARACTER_EVENTS, CHARACTER_EVENT_MAP } from './content/characterEvents';
import type { CharacterEventDef } from './content/characterEvents';

/**
 * PHASE 3 STEP 2 — CHARACTER-DRIVEN EVENTS. No React, no DOM (ground rule 11).
 *
 * Characters act on their own, based on how they feel about you:
 *
 *   - WARNING. When a character starts to waver (isWavering()), the front
 *     page says so in plain words (content's `warning` line). The day it
 *     first happens is remembered in `flags['charWarned:<id>']`.
 *   - BETRAYAL. If they keep sliding until they are turning (isTurning()),
 *     their betrayal card is queued into the day — but never on the same
 *     morning as the first warning, so the player always gets at least one
 *     day to win them back.
 *   - OFFER. A character who is firmly on your side (isDevoted()) brings
 *     you their offer card instead.
 *
 * Why loyalty and not just `plotting`: measured over 120 simulated runs per
 * play style, `plotting` only ever climbs for one or two characters, while
 * loyalty swings for all of them. Plotting and grievances still count.
 *
 * Limits: at most one character event per day, never two days running,
 * nothing before day 3, each card once per run (the cards are `once`), and
 * only for characters still alive and in post. A betrayal never ends the run
 * by itself (owner decision); its cards raise the existing pressures instead.
 *
 * State lives in `flags` only, so no GameState shape change.
 */

export const TURN_BELOW = 30;
export const WARN_BELOW = 40;
export const DEVOTED_AT = 72;
const FIRST_DAY = 3;

export const betrayalId = (id: string) => `char-betray-${id}`;
export const offerId = (id: string) => `char-offer-${id}`;

function grievances(c: CharacterState): number {
  return c.memory.filter((m) => m.weight < 0).length;
}

/** Losing faith: shown as a front-page warning. */
export function isWavering(c: CharacterState): boolean {
  return c.loyalty < WARN_BELOW || c.plotting >= 40 || (grievances(c) >= 2 && c.loyalty < 55);
}

/** Lost faith: their betrayal can arrive (after a warning on an earlier day). */
export function isTurning(c: CharacterState): boolean {
  return c.loyalty < TURN_BELOW || c.plotting >= 55 || (grievances(c) >= 2 && c.loyalty < 45);
}

/** Firmly on your side: their offer can arrive. */
export function isDevoted(c: CharacterState): boolean {
  return c.loyalty >= DEVOTED_AT && c.plotting < 30;
}

const active = (c: CharacterState | undefined): c is CharacterState => !!c && c.alive && c.inPost;
const used = (s: GameState, cardId: string) =>
  s.seenOnce.includes(cardId) || s.queued.some((q) => q.cardId === cardId) || !!s.flags[`charQueued:${cardId}`];

/**
 * Run once per morning from engine.ts's dayUpkeep(). Records new warnings
 * and queues at most one character card for today. Returns briefing notes.
 */
export function tickCharacterEvents(s: GameState, rng: Rng): string[] {
  // 1. warnings — remembered the first morning a character wavers
  for (const ev of CHARACTER_EVENTS) {
    const c = s.characters[ev.character];
    if (!active(c) || used(s, betrayalId(ev.character))) continue;
    if (isWavering(c) && !s.flags[`charWarned:${ev.character}`]) s.flags[`charWarned:${ev.character}`] = s.day;
  }

  // 2. at most one event, not two days running, not before day 3
  if (s.day < FIRST_DAY) return [];
  const last = s.flags.charEventLast;
  if (last !== undefined && s.day - last < 2) return [];

  const betrayals = CHARACTER_EVENTS.filter((ev) => {
    const c = s.characters[ev.character];
    const warned = s.flags[`charWarned:${ev.character}`];
    return active(c) && isTurning(c) && warned !== undefined && warned < s.day && !used(s, betrayalId(ev.character));
  });
  if (betrayals.length) {
    // The least loyal acts first.
    betrayals.sort((a, b) => s.characters[a.character].loyalty - s.characters[b.character].loyalty);
    return [queue(s, betrayals[0], betrayalId(betrayals[0].character), 'has acted on their own')];
  }

  const offers = CHARACTER_EVENTS.filter((ev) => {
    const c = s.characters[ev.character];
    return active(c) && isDevoted(c) && !used(s, offerId(ev.character));
  });
  if (offers.length) {
    const pick = rng.pick(offers);
    return [queue(s, pick, offerId(pick.character), 'has an offer')];
  }
  return [];
}

function queue(s: GameState, ev: CharacterEventDef, cardId: string, what: string): string {
  s.queued.push({ cardId, day: s.day });
  s.flags[`charQueued:${cardId}`] = 1;
  s.flags.charEventLast = s.day;
  return `${ev.character} ${what}.`;
}

/**
 * Front-page warnings: characters who are wavering and whose betrayal has
 * not happened yet. Plain words only — never the loyalty number (ground
 * rule 6). Used by briefing.ts.
 */
export function characterWarnings(s: GameState): { character: string; text: string; turning: boolean }[] {
  const out: { character: string; text: string; turning: boolean }[] = [];
  for (const ev of CHARACTER_EVENTS) {
    const c = s.characters[ev.character];
    if (!active(c) || used(s, betrayalId(ev.character)) || !isWavering(c)) continue;
    out.push({ character: ev.character, text: ev.warning, turning: isTurning(c) });
  }
  return out;
}

export { CHARACTER_EVENT_MAP };

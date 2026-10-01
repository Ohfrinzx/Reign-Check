import type { GameState, Rng } from '../types';
import { hashString, makeRng } from '../rng';
import { DAILY_MINIGAMES, MG_CARD, eventMinigame } from '../content/minigames';

/**
 * PHASE 5 — MINI-GAMES: when they appear. No React, no DOM (ground rule 11).
 *
 * A mini-game is a card (content/minigames.ts) with a `minigame` key and two
 * options, `won` and `lost`, whose outcomes carry the result. The UI plays the
 * game full screen and then picks the option (engine.ts finishMinigame()), so
 * every effect goes through applyEffects() like any other decision, and the
 * tests and the balance probe can play past it with chooseOption().
 *
 *   - DAILY. From DAILY_FROM_DAY, one of the day's drawn cards is replaced by
 *     a daily mini-game, at a random point in the day. An event can pick
 *     which one (content/minigames.ts eventMinigame()): the Bread Riots or
 *     a hostile Street → Bread Lines; the Free Zone Ledger → Shred. Never a card that an
 *     earlier decision queued (crisis stages, private files, follow-ups).
 *     A day that already has a triggered mini-game gets no daily one.
 *   - THE ARMY'S STRIKE. When the Army's ultimatum runs out and it moves
 *     against you (demands.ts resolveLapse()), the old dice roll is replaced
 *     by Hold the Palace that same morning. Losing it ends the run in a coup.
 *   - AN OFFICERS' PLOT. When the hidden coup pressure reaches PLOT_AT (from
 *     PLOT_FROM_DAY), the officers try their luck: Hold the Palace, at most
 *     once per act. Losing it is a heavy hit, not the end.
 *
 * Which game and where in the day come from a hash of the run's seed and the
 * day, not the run's RNG stream, so adding mini-games did not reshuffle every
 * other draw. The game's own layout is seeded the same way (minigameSeed()),
 * so a reload replays the same game.
 */

export const DAILY_FROM_DAY = 2;
export const PLOT_AT = 52;
export const PLOT_FROM_DAY = 3;

const plotFlag = (act: number) => `mgPlotAct:${act}`;
/** The Army's odds of success when it struck, ×100 — sets how many columns come. */
export const STRIKE_ODDS_FLAG = 'mgStrikeOdds';
/** How well the last mini-game went, 0..100, for its result text. */
export const SCORE_FLAG = 'mgScore';

export function isMinigameCard(cardId: string | undefined): boolean {
  return !!cardId && (Object.values(MG_CARD) as string[]).includes(cardId);
}

/** The seed for today's game on this card. Same run, day and card → same game. */
export function minigameSeed(s: GameState, cardId: string): number {
  return hashString(`${s.seed}:${cardId}:${s.day}`);
}

function queueToday(s: GameState, cardId: string) {
  if (!s.queued.some((q) => q.cardId === cardId && q.day <= s.day)) s.queued.push({ cardId, day: s.day });
}

/** demands.ts: the Army's ultimatum ran out and it is moving on the Palace. */
export function queueArmyStrike(s: GameState, successOdds: number) {
  s.flags[STRIKE_ODDS_FLAG] = Math.round(successOdds * 100);
  queueToday(s, MG_CARD.palaceStrike);
}

/**
 * Morning upkeep (engine.ts dayUpkeep(), after crises). Starts an officers'
 * plot when coup pressure is high. Returns briefing notes.
 */
export function tickMinigames(s: GameState, _rng: Rng): string[] {
  const strikeToday = s.queued.some((q) => q.cardId === MG_CARD.palaceStrike && q.day <= s.day);
  if (strikeToday) return ['The army is moving on the Palace.'];
  if (s.day < PLOT_FROM_DAY || s.flags[plotFlag(s.act)]) return [];
  if (s.hidden.coup < PLOT_AT) return [];
  s.flags[plotFlag(s.act)] = s.day;
  queueToday(s, MG_CARD.palacePlot);
  s.log.push({
    day: s.day, kind: 'event', title: 'Officers move on the Palace',
    text: 'Before dawn, units from the capital garrison left their barracks without orders.', tone: 'bad',
  });
  return ['Officers are moving on the Palace.'];
}

/**
 * Put today's daily mini-game into the drawn deck (engine.ts drawDeck()).
 * `queuedCount` is how many cards at the front came from the queue; those are
 * never replaced. Returns the deck to use.
 */
export function placeDailyMinigame(s: GameState, deck: string[], queuedCount: number): string[] {
  if (s.day < DAILY_FROM_DAY || !DAILY_MINIGAMES.length) return deck;
  if (deck.some(isMinigameCard)) return deck;
  const rng = makeRng(hashString(`${s.seed}:daily-minigame:${s.day}`));
  const yesterday = s.flags.mgDailyLast;
  const pool = DAILY_MINIGAMES.length > 1
    ? DAILY_MINIGAMES.filter((_, i) => i + 1 !== yesterday)
    : DAILY_MINIGAMES;
  // an event (the Bread Riots, a hostile Street, the Ledger crisis) picks
  // its own game; otherwise any daily game but yesterday's
  const id = eventMinigame(s) ?? rng.pick(pool);
  s.flags.mgDailyLast = DAILY_MINIGAMES.indexOf(id) + 1;
  const out = [...deck];
  const free = out.map((_, i) => i).filter((i) => i >= queuedCount);
  if (!free.length) {
    // Every slot came from the queue (rare): the game goes last instead.
    out.push(id);
    s.agenda = [...s.agenda, s.agenda[s.agenda.length - 1] ?? 'afternoon'];
    return out;
  }
  out[rng.pick(free)] = id;
  return out;
}

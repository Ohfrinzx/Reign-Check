import type { GameState } from '../../game/types';
import { createGame } from '../../game/state';
import { beginStages, prepareDay } from '../../game/engine';
import { MG_CARD } from '../../game/content/minigames';
import { STRIKE_ODDS_FLAG } from '../../game/minigames';

/**
 * `?practice=<game>` — one mini-game on its own, for playtesting the rare ones
 * (a coup may never come in a careful run). Optional `&seed=N` and `&act=N`.
 * Not saved and not recorded (App.tsx keeps it apart from the real run).
 */
const PRACTICE: Record<string, string> = {
  bulletin: MG_CARD.bulletin,
  palace: MG_CARD.palacePlot,
  strike: MG_CARD.palaceStrike,
};

export function practiceGame(search: string): GameState | null {
  const q = new URLSearchParams(search);
  const cardId = PRACTICE[q.get('practice') ?? ''];
  if (!cardId) return null;
  const seed = Number(q.get('seed')) || undefined;
  const act = Math.min(3, Math.max(1, Number(q.get('act')) || 1));
  let s = createGame({ seed, leaderName: 'Practice' });
  s.act = act;
  s.day = (act - 1) * 6 + 3;
  s = prepareDay(s);
  if (s.phase !== 'briefing') return null;
  s.flags[STRIKE_ODDS_FLAG] = 50;
  s.todayDeck = [cardId];
  s.agenda = ['government'];
  return beginStages(s);
}

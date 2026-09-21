import type { GameState } from './types';
import { COUNTRY } from './content/country';
import { HONORIFICS } from './state';

/**
 * Card text uses tokens so the same authored line works whatever the player
 * chose to be called. Keep the token list tiny and obvious.
 */
export function fill(text: string, s: GameState): string {
  const h = HONORIFICS.find((x) => x.id === s.honorific || x.word === s.honorific) ?? HONORIFICS[0];
  return text
    .replace(/\{sir\}/g, h.word)
    .replace(/\{Sir\}/g, h.label)
    .replace(/\{leader\}/g, s.leaderName)
    .replace(/\{title\}/g, s.leaderTitle)
    .replace(/\{country\}/g, COUNTRY.shortName);
}

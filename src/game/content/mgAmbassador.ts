import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';

/**
 * THE AMBASSADOR'S TABLE — the card and its story (mini-games slice 3,
 * part B). Rules: src/game/minigames/ambassador.ts. Screen:
 * src/ui/minigames/AmbassadorGame.tsx. Owner's choices (2026-10-06): five
 * rounds; each round you pick a gas-price offer and a line to say; his
 * face, his glass and his notes are the tells; calm, no timer; in the daily
 * rotation; the Ostrene gas cutoff brings it.
 */

export const AMBASSADOR_CARD_ID = 'mg-ambassador';

const score = (s: GameState) => s.flags.mgScore;

const AMBASSADOR_WON: Effects = {
  stats: { legitimacy: 5, economy: 4 },
  hidden: { foreign: -10 },
  factions: { all: { loyalty: 0.5 }, concord: { loyalty: 2 } },
};
const AMBASSADOR_LOST: Effects = {
  stats: { legitimacy: -4, economy: -3 },
  hidden: { foreign: 6 },
  factions: { concord: { loyalty: -4 } },
};

export const AMBASSADOR_CARD: CardDef = {
  id: AMBASSADOR_CARD_ID,
  title: 'The Ambassador\'s Table',
  category: 'minigame',
  tags: ['minigame'],
  faction: 'concord',
  minigame: 'ambassador',
  base: 0,
  body: 'Ostrene\'s ambassador is coming to dinner. By dessert, you need a price for the gas.',
  options: [
    {
      id: 'won',
      label: 'You got the gas deal.',
      hint: 'Legitimacy and the economy go up, every faction warms a little, the Elites most; Ostrene\'s patience grows.',
      outcome: (s): CardOutcome => ({
        text: (score(s) ?? 0) >= 85
          ? 'The ambassador signed on the tablecloth, which in Ostrene counts. The price is better than the Finance Ministry hoped for.\n\nThe Elites have their gas, and nobody had to be humiliated in public.'
          : 'It was not the price you wanted, but it was a price, and he signed it. The pipes stay full this winter.',
        tone: 'good',
        effects: AMBASSADOR_WON,
      }),
    },
    {
      id: 'lost',
      label: 'The ambassador walked out.',
      hint: 'Legitimacy, the economy and the Elites go down; Ostrene\'s patience runs shorter.',
      outcome: {
        text: 'The ambassador folded his napkin, thanked you for the soup, and left before the main course.\n\nBy morning Ostrene had "technical difficulties" at the border valve. The Elites want to know who was at that table.',
        tone: 'bad',
        effects: AMBASSADOR_LOST,
      },
    },
  ],
};

export function ambassadorIntro(s: GameState): MinigameIntro {
  const crisis = s.crisis?.id === 'gas';
  return {
    kicker: `The Palace dining room · Day ${s.day} · 20:00`,
    title: 'The Ambassador\'s Table',
    teaser: 'Five courses. One gas price. Read the man across the table.',
    story: [
      crisis
        ? 'Ostrene has cut the gas. Its ambassador has agreed to dinner, which is the closest Ostrene comes to saying sorry.'
        : 'Velmorra buys most of its gas from Ostrene. The contract runs out this winter, and Ostrene\'s ambassador is coming to dinner.',
      'He wants a high price. You want a low one. He will walk out if you push too far, and he will not tell you when that is.',
      'But his face, his glass and his notes will.',
    ],
    howTo: [
      'Five courses, five rounds. Each round, pick a price to offer and a line to say.',
      'Watch his face, his wine glass and his notebook. They show how close he is to walking out.',
      'Push for a low price while he is relaxed. Give ground when he is not.',
      'There is no clock. Agree a price by dessert, without him walking out.',
    ],
    stakes: {
      win: 'Win: Legitimacy and the economy go up, every faction warms a little (the Elites most), and Ostrene\'s patience grows.',
      lose: 'Lose: Legitimacy, the economy and the Elites\' loyalty drop, and Ostrene runs shorter of patience.',
    },
    ...(crisis ? { because: 'Today\'s game comes from the Ostrene gas cutoff.' } : {}),
  };
}

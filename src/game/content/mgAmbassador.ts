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
      'He opens at about $450 to $500 for every 1,000 cubic metres. His lowest price is a secret, and he will walk out if you push too far.',
      'Brask, your Finance Minister, has left a note by your plate: he will not sign above his limit. Ostrene opens over it, so you will have to push.',
      'He will not tell you when to stop. But his face, his glass and his notes will.',
    ],
    howTo: [
      'Five courses, five rounds. Each round, pick a price to offer and a line to say.',
      'If your price is high enough, he signs. If it is too low, he refuses, comes down a little and loses patience. The further under, the more he loses.',
      'Brask will not sign above the limit on his note. Ostrene opens over it, and any deal over it is lost. Prices over the limit are marked in red.',
      'Watch his face, his glass and his notebook. Smiling, sipping and writing numbers: relaxed. Frowning, an untouched glass and crossing out: irritated. A glass pushed away and a closed notebook: he is about to stand.',
      'Every man likes different lines. Watch how each one lands. Some men hide one tell or fake one. When two tells agree, believe them.',
      'Push while he is relaxed, and settle when he is not. If he leaves, or there is no deal under the limit by dessert, you lose.',
    ],
    stakes: {
      win: 'Win: Legitimacy and the economy go up, every faction warms a little (the Elites most), and Ostrene\'s patience grows.',
      lose: 'Lose: Legitimacy, the economy and the Elites\' loyalty drop, and Ostrene runs shorter of patience.',
    },
    ...(crisis ? { because: 'Today\'s game comes from the Ostrene gas cutoff.' } : {}),
  };
}

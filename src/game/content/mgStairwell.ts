import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';

/**
 * WHO WAS IN THE STAIRWELL? — the card and its story (mini-games slice 3,
 * part B). Rules: src/game/minigames/stairwell.ts. Screen:
 * src/ui/minigames/StairwellGame.tsx. Owner's choices (2026-10-06): a calm
 * logic puzzle (four suspects, the Sable Office's files, one of them lies),
 * no timer; dark (a Sable Office archive under a desk lamp); in the daily
 * rotation; the Stairwell Tapes crisis brings it.
 */

export const STAIRWELL_CARD_ID = 'mg-stairwell';

const score = (s: GameState) => s.flags.mgScore;

const STAIRWELL_WON: Effects = {
  stats: { legitimacy: 5, support: 3 },
  hidden: { scandal: -10 },
  factions: { all: { loyalty: 0.5 }, chorus: { loyalty: 2 } },
};
const STAIRWELL_LOST: Effects = {
  stats: { legitimacy: -5, support: -2 },
  hidden: { scandal: 8 },
  factions: { chorus: { loyalty: -4 } },
};

export const STAIRWELL_CARD: CardDef = {
  id: STAIRWELL_CARD_ID,
  title: 'Who Was in the Stairwell?',
  category: 'minigame',
  tags: ['minigame'],
  actor: 'sarran',
  faction: 'chorus',
  minigame: 'stairwell',
  base: 0,
  body: 'The Sable Office has four files on the night Krast died. One of the four is lying about where they were.',
  options: [
    {
      id: 'won',
      label: 'You found who was in the stairwell.',
      hint: 'Legitimacy and support go up, every faction warms a little, the Street most; the scandals cool.',
      outcome: (s): CardOutcome => ({
        text: (score(s) ?? 0) >= 85
          ? 'You laid the four files side by side and the lie fell out of them on the first reading. Sarran closed the folder and said, "Yes."\n\nThe Street has wanted a straight answer about that stairwell since the day you took office. Tonight it has one.'
          : 'It took a second reading and a wrong turn. But the story that did not fit was the one you named, and Sarran agreed.\n\nThe Street gets its answer, a little late.',
        tone: 'good',
        effects: STAIRWELL_WON,
      }),
    },
    {
      id: 'lost',
      label: 'You named the wrong person.',
      hint: 'Legitimacy, support and the Street go down; the scandals get hotter.',
      outcome: {
        text: 'The person you named had a witness, and the witness went to the papers.\n\nNow the Street has two questions about the stairwell instead of one, and the second is about you.',
        tone: 'bad',
        effects: STAIRWELL_LOST,
      },
    },
  ],
};

export function stairwellIntro(s: GameState): MinigameIntro {
  const crisis = s.crisis?.id === 'tapes';
  return {
    kicker: `Sable Office archive · Day ${s.day} · 01:15`,
    title: 'Who Was in the Stairwell?',
    teaser: 'Four files. Four stories. One of them is a lie.',
    story: [
      'Krast died in a stairwell in the Palace. The army put you in his chair before anyone asked who was with him.',
      'The Sable Office has kept four files on that night. Four people say where they were. One of them is lying.',
      'Read the files. Find the lie. Name who was in the stairwell.',
    ],
    howTo: [
      'Each file says where that person was, and what they saw.',
      'Exactly one person is lying. Everyone else tells the truth.',
      'Find the story that does not fit with the others. Then name who was in the stairwell.',
      'There is no clock. One name. A wrong name loses.',
    ],
    stakes: {
      win: 'Win: Legitimacy and support go up, every faction warms a little (the Street most), and the scandals cool.',
      lose: 'Lose: Legitimacy, support and the Street\'s loyalty drop, and the scandals get hotter.',
    },
    ...(crisis ? { because: 'Today\'s game comes from the Stairwell Tapes crisis.' } : {}),
  };
}

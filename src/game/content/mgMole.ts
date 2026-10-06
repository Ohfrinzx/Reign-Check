import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';

/**
 * FIND THE MOLE — the card and its story (mini-games slice 3, part A).
 * Rules: src/game/minigames/mole.ts. Screen: src/ui/minigames/MoleGame.tsx.
 * Owner's choices (2026-10-06): live watching on a floor plan, dark (a night
 * security camera), in the daily rotation; Security turning hostile or a
 * betrayal warning brings it (content/minigames.ts eventMinigames()).
 */

export const MOLE_CARD_ID = 'mg-mole';

const score = (s: GameState) => s.flags.mgScore;

const MOLE_WON: Effects = {
  stats: { legitimacy: 5, security: 4 },
  hidden: { leak: -10 },
  factions: { all: { loyalty: 0.5 }, sable: { loyalty: 2 } },
};
const MOLE_LOST: Effects = {
  stats: { legitimacy: -4, security: -3 },
  hidden: { leak: 6 },
  factions: { sable: { loyalty: -4 } },
};

export const MOLE_CARD: CardDef = {
  id: MOLE_CARD_ID,
  title: 'Find the Mole',
  category: 'minigame',
  tags: ['minigame'],
  actor: 'sarran',
  faction: 'sable',
  minigame: 'mole',
  base: 0,
  body: 'Someone in the Interior Ministry is passing papers to the press. Tonight their contact is coming into the building.',
  options: [
    {
      id: 'won',
      label: 'You found the mole.',
      hint: 'Legitimacy and Security go up, every faction warms a little, Security most; leaks dry up.',
      outcome: (s): CardOutcome => ({
        text: (score(s) ?? 0) >= 85
          ? 'You named the right person before the contact reached the car park. The Sable Office had them in a quiet room by midnight.\n\nSarran sent a one-word note: "Noted." From her, that is a medal.'
          : 'It took a while, and you nearly named the wrong desk. But it was the right one. The leaks stop tonight.',
        tone: 'good',
        effects: MOLE_WON,
      }),
    },
    {
      id: 'lost',
      label: 'The mole got away.',
      hint: 'Legitimacy, Security and the Sable Office\'s loyalty go down; more papers leak.',
      outcome: {
        text: 'The wrong person spent the night in a quiet room. The right one went home, and the papers went to the press.\n\nThe Sable Office is not pleased to have watched you guess.',
        tone: 'bad',
        effects: MOLE_LOST,
      },
    },
  ],
};

export function moleIntro(s: GameState): MinigameIntro {
  const hostile = s.factions.sable.loyalty < 20;
  return {
    kicker: `Interior Ministry · Day ${s.day} · 23:10`,
    title: 'Find the Mole',
    teaser: 'Someone in this building talks to the press. Tonight you watch.',
    story: [
      'Internal papers keep turning up in the Sarnica Courier, word for word. Someone on the Interior Ministry\'s night floor is passing them on.',
      'Tonight the Courier\'s contact is coming into the building. The Sable Office has given you the security cameras.',
      'Watch who meets the contact. Then name the mole.',
    ],
    howTo: [
      'The night floor is on the screen. Staff walk between rooms. The contact (in the grey coat) comes in and moves around.',
      'The mole is the one who meets the contact. Watch closely: others pass by too.',
      'Tap a person to mark them as a suspect while you watch.',
      'When the contact leaves, name the mole. A wrong name loses.',
    ],
    stakes: {
      win: 'Win: Legitimacy and Security go up, every faction warms a little (Security most), and the leaks dry up.',
      lose: 'Lose: Legitimacy, Security and the Sable Office\'s loyalty drop, and more papers leak.',
    },
    ...(hostile ? { because: 'Today\'s game comes from the Sable Office turning against you: it wants to see whether you can find a leak yourself.' } : {}),
  };
}

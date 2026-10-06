import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';

/**
 * THE PIGEON RUN — the card and its story (mini-games slice 3, part A).
 * Rules: src/game/minigames/pigeon.ts. Screen: src/ui/minigames/PigeonGame.tsx.
 * Owner's choices (2026-10-06): hold to climb, let go to glide; a daylight
 * sky; in the daily rotation; trouble in the provinces brings it.
 * A run where you helped the Pigeon Federation (flags pigeonFriend /
 * pigeonPatron) gets its champion bird: one more hit allowed.
 */

export const PIGEON_CARD_ID = 'mg-pigeon';

const score = (s: GameState) => s.flags.mgScore;

/** The Federation lends its champion when you have helped it this run. */
export function pigeonChampion(s: GameState): boolean {
  return !!(s.flags.pigeonFriend || s.flags.pigeonPatron);
}

const PIGEON_WON: Effects = {
  stats: { legitimacy: 5, power: 3 },
  hidden: { separatism: -10 },
  factions: { all: { loyalty: 0.5 }, staff: { loyalty: 2 } },
};
const PIGEON_LOST: Effects = {
  stats: { legitimacy: -4, power: -3 },
  hidden: { separatism: 6 },
  factions: { staff: { loyalty: -4 } },
};

export const PIGEON_CARD: CardDef = {
  id: PIGEON_CARD_ID,
  title: 'The Pigeon Run',
  category: 'minigame',
  tags: ['minigame'],
  faction: 'staff',
  minigame: 'pigeon',
  base: 0,
  body: 'Drovna is jamming the radio in the Hadem hills. Your order to the border garrison has to go by pigeon.',
  options: [
    {
      id: 'won',
      label: 'The pigeon got through.',
      hint: 'Legitimacy and Power go up, every faction warms a little, the Army most; the provinces pull away less.',
      outcome: (s): CardOutcome => ({
        text: (score(s) ?? 0) >= 85
          ? 'The bird landed on the garrison roof without a feather out of place. The order was read out at the gate by noon.\n\nThe Pigeon Federation wants to put it on a stamp. The army wants to know why it took a pigeon.'
          : 'It arrived late and missing a few feathers, but it arrived. The garrison has its orders, and Drovna\'s radio has nothing to say about it.',
        tone: 'good',
        effects: PIGEON_WON,
      }),
    },
    {
      id: 'lost',
      label: 'The hawks got the pigeon.',
      hint: 'Legitimacy, Power and the Army go down; the provinces pull away.',
      outcome: {
        text: 'The message never reached the garrison. A Drovnan radio host read it out on air the next morning, with feeling.\n\nThe army is asking why its orders now go by bird, and why the bird lost.',
        tone: 'bad',
        effects: PIGEON_LOST,
      },
    },
  ],
};

export function pigeonIntro(s: GameState): MinigameIntro {
  const champion = pigeonChampion(s);
  return {
    kicker: `Hadem hills · Day ${s.day} · 07:00`,
    title: 'The Pigeon Run',
    teaser: 'The radio is jammed. Your order goes by pigeon.',
    story: [
      'Drovna\'s radio station is jamming every frequency in the Hadem hills. The border garrison has not heard from the capital in two days.',
      champion
        ? 'The Pigeon Federation has lent you its champion, Velmorra\'s fastest bird. It is carrying your order.'
        : 'The Pigeon Federation has lent you a bird. It is carrying your order.',
      'Drovnan hawks hunt over the border. Get the pigeon to the garrison.',
    ],
    howTo: [
      'The pigeon flies on its own. Hold anywhere on the screen to climb; let go to glide down.',
      'Hawks dive at you. Their shadow warns you first. Dodge them, and the storm clouds.',
      'Each hit costs feathers. Too many hits and the pigeon goes down.',
      'Reach the garrison flag. On a keyboard: hold Space or ↑.',
    ],
    stakes: {
      win: 'Win: Legitimacy and Power go up, every faction warms a little (the Army most), and the provinces pull away less.',
      lose: 'Lose: Legitimacy, Power and the Army\'s loyalty drop, and the provinces pull away.',
    },
    ...(champion ? { because: 'The Pigeon Federation lent you its champion: it can take one more hit. Because you helped the Federation earlier.' } : {}),
  };
}

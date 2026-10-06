import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';

/**
 * BUDGET NIGHT — the card and its story (mini-games slice 3, part A).
 * Rules: src/game/minigames/budget.ts. Screen: src/ui/minigames/BudgetGame.tsx.
 * Owner's choices (2026-10-06): against the clock, 90 seconds — "plenty of
 * time but still can't just sit there"; a bright Finance Ministry desk; in
 * the daily rotation; debt or a Workers/Elites demand brings it.
 */

export const BUDGET_CARD_ID = 'mg-budget';

const score = (s: GameState) => s.flags.mgScore;

const BUDGET_WON: Effects = {
  stats: { legitimacy: 5, stability: 3 },
  hidden: { fiscal: -8 },
  factions: { all: { loyalty: 0.5 }, combine: { loyalty: 2 } },
};
const BUDGET_LOST: Effects = {
  stats: { legitimacy: -4, stability: -3 },
  hidden: { fiscal: 5 },
  factions: { combine: { loyalty: -4 } },
};

export const BUDGET_CARD: CardDef = {
  id: BUDGET_CARD_ID,
  title: 'Budget Night',
  category: 'minigame',
  tags: ['minigame'],
  actor: 'brask',
  faction: 'combine',
  minigame: 'budget',
  base: 0,
  body: 'The budget goes to parliament at eight. Every faction has a number it will not go below.',
  options: [
    {
      id: 'won',
      label: 'The budget passed.',
      hint: 'Legitimacy and stability go up, every faction warms a little, the Workers most; the budget strain eases.',
      outcome: (s): CardOutcome => ({
        text: (score(s) ?? 0) >= 85
          ? 'Brask read it out at eight o\'clock and nobody walked out. The unions called it "a budget". From the unions, that is praise.\n\nThe chamber went home early, which in Velmorra is the highest compliment.'
          : 'It was close, and somebody will grumble in the morning. But the numbers added up, and the budget passed.',
        tone: 'good',
        effects: BUDGET_WON,
      }),
    },
    {
      id: 'lost',
      label: 'The budget fell apart.',
      hint: 'Legitimacy, stability and the Workers go down; the budget strain grows.',
      outcome: {
        text: 'By eight o\'clock two factions had walked out and the numbers did not add up. Brask read out what was left to an empty chamber.\n\nThe unions say the government cannot count. Tonight they have a point.',
        tone: 'bad',
        effects: BUDGET_LOST,
      },
    },
  ],
};

export function budgetIntro(s: GameState): MinigameIntro {
  const debt = s.stats.treasury < 0;
  const demand = s.factions.combine.demand ? 'Workers' : s.factions.concord.demand ? 'Elites' : null;
  return {
    kicker: `Finance Ministry · Day ${s.day} · 18:30`,
    title: 'Budget Night',
    teaser: 'Parliament votes on the budget at eight. Make the numbers add up.',
    story: [
      'Kel Brask brings the budget to your desk at half past six. It goes to parliament at eight.',
      'Every faction has a number it will not go below. They are watching the figures, and they keep changing their minds.',
      'Split the money so nobody walks out before eight.',
    ],
    howTo: [
      'Five jars, one per faction. Each has a line: the least it will accept.',
      'Tap + and − on a jar to move money in and out. The total you can spend is fixed.',
      'A jar below its line loses patience. Empty patience: that faction walks out.',
      'The lines move as the evening goes on. You cannot just sit there.',
      'Reach eight o\'clock (90 seconds) without too many walk-outs.',
    ],
    stakes: {
      win: 'Win: Legitimacy and stability go up, every faction warms a little (the Workers most), and the budget strain eases.',
      lose: 'Lose: Legitimacy, stability and the Workers\' loyalty drop, and the budget strain grows.',
    },
    ...(debt
      ? { because: 'Today\'s game comes from the debt: the treasury is below zero, so every number is a fight.' }
      : demand ? { because: `Today's game comes from the ${demand}' demand on your desk.` } : {}),
  };
}

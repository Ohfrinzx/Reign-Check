import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import { FACTION_MOVES } from './demands';
import { hasMark, becauseText } from '../consequences';

/**
 * PHASE 5 — MINI-GAME CONTENT. The words and numbers of every mini-game:
 * its card (the result options), the story that opens it, and how to play.
 * The rules of each game are in src/game/minigames/<game>.ts; when each one
 * appears is in src/game/minigames/index.ts.
 *
 * Every mini-game card has exactly two options, `won` and `lost`. The player
 * never sees them as buttons: the game picks one when it ends. Owner's rules:
 * losing costs Legitimacy and the loyalty of the faction the game is about;
 * winning gives a small reward (and a coup game also ends the threat).
 */

export const MG_CARD = {
  bulletin: 'mg-bulletin',
  palacePlot: 'mg-palace-plot',
  palaceStrike: 'mg-palace-strike',
} as const;

/** The games that can be today's daily one. A day never repeats yesterday's
 *  when there is more than one. */
export const DAILY_MINIGAMES: string[] = [MG_CARD.bulletin];

/** How well it went, 0..100 (set by engine.ts finishMinigame()); undefined in simulations. */
const score = (s: GameState) => s.flags.mgScore;

/* ------------------------------------------------------- the 7pm bulletin */

const BULLETIN_WON: Effects = {
  stats: { legitimacy: 3, support: 2 },
  hidden: { scandal: -5 },
  factions: { chorus: { loyalty: 3 } },
};
const BULLETIN_LOST: Effects = {
  stats: { legitimacy: -4, support: -2 },
  hidden: { scandal: 5 },
  factions: { chorus: { loyalty: -4 } },
};

/* ------------------------------------------------------- hold the palace */

const PLOT_WON: Effects = {
  stats: { legitimacy: 3, power: 2 },
  hidden: { coup: -30, fear: 4 },
  factions: { staff: { power: -10, loyalty: -2 }, sable: { loyalty: 3 } },
  news: ['Arrests in the capital garrison overnight. The Palace says the Republic is "calm and governed".'],
};
const PLOT_LOST: Effects = {
  stats: { legitimacy: -8, power: -6, stability: -6, military: -4 },
  hidden: { coup: 6 },
  factions: { staff: { loyalty: -6, power: 5 } },
  news: ['Armoured cars in Palace Square at dawn. By lunch they had gone, and so had half your authority.'],
};

function strikeWonEffects(): Effects {
  const failed = FACTION_MOVES.staff?.failedEffects ?? {};
  return {
    ...failed,
    stats: { ...(failed.stats ?? {}), legitimacy: (failed.stats?.legitimacy ?? 0) + 3 },
  };
}

function plotLeader(s: GameState): string {
  const tern = s.characters.tern, varkov = s.characters.varkov;
  if (tern?.inPost && tern.alive && (!varkov?.inPost || tern.plotting >= varkov.plotting)) return 'Colonel Ravik Tern of the capital garrison';
  if (varkov?.inPost && varkov.alive) return 'officers loyal to General Dessa Varkov';
  return 'a group of colonels from the capital garrison';
}

export const MINIGAME_CARDS: CardDef[] = [
  {
    id: MG_CARD.bulletin,
    title: 'The 7pm Bulletin',
    category: 'minigame',
    tags: ['minigame'],
    actor: 'loz',
    faction: 'chorus',
    minigame: 'bulletin',
    base: 0,
    body: 'Channel Seven\'s 7pm news goes out in twenty minutes. You get to decide what stays in it.',
    options: [
      {
        id: 'won',
        label: 'You cleaned up the bulletin.',
        hint: 'Legitimacy and the Street go up a little.',
        outcome: (s): CardOutcome => ({
          text: (score(s) ?? 0) >= 90
            ? 'Not one bad story made it to air. Channel Seven ran the harvest, the trams and a long piece about pigeons.\n\nThe Street went to bed thinking the country was in safe hands. Loz sent a note: "Clean work."'
            : 'A story or two got through, but nothing that will still be news on Thursday.\n\nThe bulletin ended on the weather. The weather was good, which in Velmorra people take personally.',
          tone: 'good',
          effects: BULLETIN_WON,
        }),
      },
      {
        id: 'lost',
        label: 'The bulletin got away from you.',
        hint: 'Legitimacy and the Street go down.',
        outcome: {
          text: 'Too much went out. Six adults in ten watched it, and by the late edition the papers were running Channel Seven\'s stories as their own.\n\nThe Street is angry. Your Legitimacy took the hit.',
          tone: 'bad',
          effects: BULLETIN_LOST,
        },
      },
    ],
  },
  {
    id: MG_CARD.palacePlot,
    title: 'Hold the Palace',
    category: 'minigame',
    tags: ['minigame', 'coup'],
    actor: 'tern',
    faction: 'staff',
    minigame: 'palace',
    base: 0,
    body: 'Officers from the capital garrison are moving on the Palace. You have three units of the Palace Guard and the rest of the night.',
    options: [
      {
        id: 'won',
        label: 'You held the Palace.',
        hint: 'The coup threat ends. Legitimacy goes up a little; the army loses power.',
        outcome: (s): CardOutcome => ({
          text: `${(score(s) ?? 0) >= 85 ? 'Not one column reached the gates.' : 'It was closer than anyone will admit.'} By six in the morning the last trucks were back in their barracks, and the officers who led them were in the Sable Office's basement.\n\nThe army is quieter now. It is also smaller, and it remembers.`,
          tone: 'good',
          effects: PLOT_WON,
        }),
      },
      {
        id: 'lost',
        label: 'The Palace fell.',
        hint: 'Heavy losses: Legitimacy, Grip and the army\'s loyalty.',
        outcome: {
          text: 'The gates gave way at a quarter to six. The officers did not arrest you. They did something worse: they sat you down and told you what you would be doing from now on.\n\nYou are still Chair. Everyone in the country saw the armoured cars, and everyone knows who sent them home.',
          tone: 'bad',
          effects: PLOT_LOST,
        },
      },
    ],
  },
  {
    id: MG_CARD.palaceStrike,
    title: 'The Army Moves',
    category: 'minigame',
    tags: ['minigame', 'coup'],
    actor: 'varkov',
    faction: 'staff',
    minigame: 'palace',
    base: 0,
    body: 'The army\'s ultimatum ran out at midnight. Now it is coming for the Palace.',
    options: [
      {
        id: 'won',
        label: 'You held the Palace.',
        hint: 'The coup fails. The army loses power and loyalty.',
        outcome: {
          text: `${FACTION_MOVES.staff?.failedText ?? ''}\n\nYou were awake for all of it. People will remember that the Chair did not leave the building.`,
          tone: 'good',
          effects: strikeWonEffects(),
        },
      },
      {
        id: 'lost',
        label: 'The Palace fell.',
        hint: 'The coup succeeds. Your time in office is over.',
        outcome: {
          text: 'The gates gave way before dawn. The soldiers who came up the stairs were polite, and very young, and had clearly been told exactly what to say.',
          tone: 'bad',
          effects: { ending: 'coup' },
        },
      },
    ],
  },
];

/* ---------------------------------------- the story that opens each game */

export interface MinigameIntro {
  /** small label over the title, e.g. "Channel Seven · 18:40" */
  kicker: string;
  title: string;
  /** the story so far, in short paragraphs */
  story: string[];
  /** how to play, one step per line */
  howTo: string[];
  /** what winning and losing mean, in plain words */
  stakes: { win: string; lose: string };
  /** a reason from earlier in the run that changes tonight, if any */
  because?: string;
}

export function minigameIntro(s: GameState, cardId: string, extra?: { spikes?: number; spikeNote?: string; stories?: number }): MinigameIntro {
  if (cardId === MG_CARD.bulletin) {
    const lead = [...s.scandals].sort((a, b) => b.heat - a.heat)[0];
    return {
      kicker: `Channel Seven · Day ${s.day} · 18:40`,
      title: 'The 7pm Bulletin',
      story: [
        'Channel Seven\'s 7pm news reaches six adults in ten. What it says tonight, the country believes by Thursday.',
        lead
          ? `Tonight's rundown has "${lead.name}" near the top. Dmitar Loz, who owns the channel, has agreed to let your office see the running order first.`
          : 'Dmitar Loz, who owns the channel, has agreed to let your office see the running order first.',
        `He will pull ${extra?.spikes ?? 'a few'} stories for you. Not one more.`,
      ],
      howTo: [
        `${extra?.stories ?? 8} stories come across the desk, one at a time, each on a short clock.`,
        'SPIKE a story that would hurt you. RUN a story that helps you.',
        'A story you don\'t touch before its clock runs out goes on air.',
        'Read the second line: some stories are not what the headline says.',
        'Swipe left to spike and right to run, or use the buttons. On a keyboard: ← and →.',
      ],
      stakes: {
        win: 'Win: two mistakes or fewer. Legitimacy and the Street go up a little.',
        lose: 'Lose: Legitimacy and the Street\'s loyalty drop, and the scandals get hotter.',
      },
      ...(extra?.spikeNote ? { because: extra.spikeNote } : {}),
    };
  }

  const strike = cardId === MG_CARD.palaceStrike;
  const vetted = hasMark(s, 'vetted-garrison');
  return {
    kicker: `Palace Guard command · Day ${s.day} · 03:00`,
    title: strike ? 'The Army Moves' : 'Hold the Palace',
    story: strike
      ? [
        'The army\'s ultimatum ran out at midnight. You did not meet it.',
        'At ten to three the Sable Office rang: columns of the capital garrison are moving on Sarnica\'s old town. General Varkov has not called. She does not need to.',
        'You have three units of the Palace Guard. If the Palace falls tonight, so do you.',
      ]
      : [
        `The front page has been warning you for days. Tonight ${plotLeader(s)} decided to stop waiting.`,
        'Columns of trucks and armoured cars are moving through the old town towards the Palace. The Sable Office can see them coming, one turn ahead.',
        'You have three units of the Palace Guard and the rest of the night. Hold until the columns give up, or until dawn.',
      ],
    howTo: [
      'Each turn, give ONE order: tap a Guard unit (blue), then tap a highlighted block next to it.',
      'Move onto a rebel column to stop it. Armoured columns (two pips) take two attacks.',
      'Columns move one block towards the Palace each turn; trucks (») move two. A Guard unit in the way is a roadblock: they swerve round it or stop.',
      'Your units cannot leave the inner city (the bottom four rows). Flares at the top show where the next columns will enter.',
      `${vetted ? 'The gates can take two columns' : 'The gates can take one column'}. One more and the Palace falls. Or tap "Hold position" to let a turn pass.`,
    ],
    stakes: strike
      ? { win: 'Win: the coup fails. The army loses power and loyalty, and you gain Legitimacy.', lose: 'Lose: the coup succeeds and your run ends.' }
      : { win: 'Win: the plot is broken and coup pressure drops sharply. A little Legitimacy.', lose: 'Lose: you stay in office, but Legitimacy, Grip and the army\'s loyalty take a heavy hit.' },
    ...(vetted ? { because: `The gate guards are loyal: they can hold off one more column. ${becauseText(s, 'vetted-garrison')}.` } : {}),
  };
}

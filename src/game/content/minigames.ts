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
  breadlines: 'mg-breadlines',
  parade: 'mg-parade',
  shred: 'mg-shred',
} as const;

/** The games that can be today's daily one. A day never repeats yesterday's
 *  when there is more than one. */
export const DAILY_MINIGAMES: string[] = [MG_CARD.bulletin, MG_CARD.breadlines, MG_CARD.parade, MG_CARD.shred];

/**
 * Events steer the daily game (owner: "certain events should trigger
 * specific mini games"): the Bread Riots, or a hostile Street, bring Bread
 * Lines; the Free Zone Ledger crisis brings Shred the Ledger. Returns the
 * card id to play today, if an event calls for one.
 */
export function eventMinigame(s: GameState): string | undefined {
  if (s.crisis?.id === 'ledger') return MG_CARD.shred;
  if (s.crisis?.id === 'bread' || s.factions.chorus.loyalty < 20) return MG_CARD.breadlines;
  return undefined;
}

/** How well it went, 0..100 (set by engine.ts finishMinigame()); undefined in simulations. */
const score = (s: GameState) => s.flags.mgScore;

/* ------------------------------------------------------- the 7pm bulletin */

const BULLETIN_WON: Effects = {
  stats: { legitimacy: 5, support: 3 },
  hidden: { scandal: -6 },
  factions: { all: { loyalty: 0.5 }, chorus: { loyalty: 2 } },
};
const BULLETIN_LOST: Effects = {
  stats: { legitimacy: -4, support: -2 },
  hidden: { scandal: 5 },
  factions: { chorus: { loyalty: -4 } },
};

/* ------------------------------------------------------- hold the palace */

const PLOT_WON: Effects = {
  stats: { legitimacy: 5, power: 3 },
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

/* ----------------------------------------------------------- bread lines */

const BREAD_WON: Effects = {
  stats: { legitimacy: 5, stability: 4 },
  hidden: { unrest: -10 },
  factions: { all: { loyalty: 0.5 }, chorus: { loyalty: 2 } },
};
const BREAD_LOST: Effects = {
  stats: { legitimacy: -4, stability: -4 },
  hidden: { unrest: 6 },
  factions: { chorus: { loyalty: -4 } },
};

/* ------------------------------------------------------ the last kilometre */

const PARADE_WON: Effects = {
  stats: { legitimacy: 5, support: 4 },
  factions: { all: { loyalty: 0.5 }, combine: { loyalty: 2 } },
};
const PARADE_LOST: Effects = {
  stats: { legitimacy: -4, support: -3 },
  factions: { combine: { loyalty: -4 } },
};

/* ------------------------------------------------------ shred the ledger */

const SHRED_WON: Effects = {
  stats: { legitimacy: 5 },
  hidden: { scandal: -10 },
  factions: { all: { loyalty: 0.5 }, concord: { loyalty: 2 } },
};
const SHRED_LOST: Effects = {
  stats: { legitimacy: -5 },
  hidden: { scandal: 8 },
  factions: { concord: { loyalty: -4 } },
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
        hint: 'Legitimacy goes up, every faction warms a little, the Street most.',
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
  {
    id: MG_CARD.breadlines,
    title: 'Bread Lines',
    category: 'minigame',
    tags: ['minigame'],
    faction: 'chorus',
    minigame: 'breadlines',
    base: 0,
    body: 'The bread queues in Sarnica are turning into crowds. Keep the city from burning until the evening.',
    options: [
      {
        id: 'won',
        label: 'You kept the city calm.',
        hint: 'Legitimacy and stability go up, every faction warms a little, the Street most; unrest goes down.',
        outcome: (s): CardOutcome => ({
          text: (score(s) ?? 0) >= 80
            ? 'Not one district burned. By evening the queues were queues again, and in two of them someone was handing out tea.\n\nThe Street noticed that you talked first.'
            : 'It was close in places. But the city got through the afternoon in one piece, and the bakeries opened again by six.',
          tone: 'good',
          effects: BREAD_WON,
        }),
      },
      {
        id: 'lost',
        label: 'Parts of the city burned.',
        hint: 'Legitimacy, stability and the Street go down; unrest goes up.',
        outcome: {
          text: 'Two districts went up before the evening. The pictures were on every channel by seven, and the Street has decided whose fault it was.',
          tone: 'bad',
          effects: BREAD_LOST,
        },
      },
    ],
  },
  {
    id: MG_CARD.parade,
    title: 'The Last Kilometre',
    category: 'minigame',
    tags: ['minigame'],
    faction: 'combine',
    minigame: 'parade',
    base: 0,
    body: 'You walk the last kilometre on foot, through the crowd, with the cameras running.',
    options: [
      {
        id: 'won',
        label: 'You walked the whole kilometre.',
        hint: 'Legitimacy and support go up, every faction warms a little, the Workers most.',
        outcome: (s): CardOutcome => ({
          text: (score(s) ?? 0) >= 85
            ? 'You did not put a foot wrong. The picture on tonight\'s news is you crouching to take a child\'s flowers, and nobody remembers the egg.'
            : 'A wobble or two, but you finished on foot and on time. The crowd at the end was bigger than the crowd at the start.',
          tone: 'good',
          effects: PARADE_WON,
        }),
      },
      {
        id: 'lost',
        label: 'You did not finish the walk.',
        hint: 'Legitimacy, support and the Workers go down.',
        outcome: {
          text: 'The security detail put you in the car with four hundred metres to go. Every camera caught it.\n\nThe Workers who came out to see you went home talking about the car.',
          tone: 'bad',
          effects: PARADE_LOST,
        },
      },
    ],
  },
  {
    id: MG_CARD.shred,
    title: 'Shred the Ledger',
    category: 'minigame',
    tags: ['minigame'],
    actor: 'adamek',
    faction: 'concord',
    minigame: 'shred',
    base: 0,
    body: 'Auditors are in the building. Some of the papers on your desk should not be there when they arrive.',
    options: [
      {
        id: 'won',
        label: 'The auditors found nothing.',
        hint: 'Legitimacy goes up, every faction warms a little, the Elites most; scandal pressure goes down.',
        outcome: (s): CardOutcome => ({
          text: (score(s) ?? 0) >= 85
            ? 'The auditors went through every drawer and found a very tidy office. Their report calls your record-keeping "a model for the ministries".\n\nAdamek sent flowers. The card was blank.'
            : 'They found a jammed shredder and some confetti, and nothing they could use. The Elites are relieved, and slightly impressed.',
          tone: 'good',
          effects: SHRED_WON,
        }),
      },
      {
        id: 'lost',
        label: 'The auditors found the papers.',
        hint: 'Legitimacy and the Elites go down; scandal pressure goes up.',
        outcome: {
          text: 'The auditors left with a folder they were not expecting to find. By tomorrow it will have a name and a page number.\n\nThe Elites want to know why their names were in your office.',
          tone: 'bad',
          effects: SHRED_LOST,
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
  /** one line for the title card that opens the game (the transition) */
  teaser: string;
  /** the story so far, in short paragraphs */
  story: string[];
  /** how to play, one step per line */
  howTo: string[];
  /** what winning and losing mean, in plain words */
  stakes: { win: string; lose: string };
  /** a reason from earlier in the run that changes tonight, if any */
  because?: string;
}

/** Where today's walk is: a different place on different days. */
const WALKS = [
  'the Gorsk mine gates', 'the Mavro docks', 'the new tram line in Sarnica', 'the Kordiva grain market', 'the Hadem border crossing',
];

export function minigameIntro(s: GameState, cardId: string, extra?: { spikes?: number; spikeNote?: string; stories?: number }): MinigameIntro {
  if (cardId === MG_CARD.breadlines) {
    const crisis = s.crisis?.id === 'bread';
    return {
      kicker: `Sarnica · Day ${s.day} · 14:00`,
      title: 'Bread Lines',
      teaser: 'The bread queues are turning into crowds. Keep the city from burning.',
      story: [
        crisis
          ? 'The Bread Riots are not over. This afternoon the queues in Sarnica turned into crowds again.'
          : 'The price of bread went up again this morning. By two o\'clock the queues in Sarnica were turning into crowds.',
        'You have two teams of negotiators and two police squads. The police have only so many baton charges before the whole city turns on them.',
        'Keep the city from burning until the evening.',
      ],
      howTo: [
        'Districts light up as crowds gather. The ring fills as they get angrier. Full ring: the district burns.',
        'Tap a district, then choose: TALK (slow, but it stays calm) or POLICE (instant, but it flares up again soon, angrier).',
        'Talking takes time to arrive and time to work. Send it early. Use police when there is no time left.',
        'Baton charges are limited: watch the counter.',
        'More than one district burns and you lose.',
      ],
      stakes: {
        win: 'Win: Legitimacy and stability go up, every faction warms a little (the Street most), and the city cools down.',
        lose: 'Lose: Legitimacy, stability and the Street\'s loyalty drop, and unrest rises.',
      },
      ...(crisis ? { because: 'Today\'s game comes from the Bread Riots, which are still going on.' } : {}),
    };
  }
  if (cardId === MG_CARD.parade) {
    const where = WALKS[(s.day + s.seed) % WALKS.length];
    const walked = hasMark(s, 'walked-dovra');
    return {
      kicker: `Walkabout · Day ${s.day} · ${where}`,
      title: 'The Last Kilometre',
      teaser: `One kilometre on foot at ${where}. Every camera is on you.`,
      story: [
        `Today you walk the last kilometre to ${where} on foot, through the crowd, the way the head of state does on Dovra Day.`,
        'Your security detail hates it. The cameras love it. Most of the crowd is friendly. Most.',
      ],
      howTo: [
        'Things come out of the crowd towards you. A ring closes around each one: make the right move as the ring closes.',
        'Egg → DUCK. Child with flowers → STOP. Cheering crowd → WAVE.',
        'Protest sign → do nothing. React to it and the cameras catch you.',
        `A wrong move, a move at the wrong moment, or a miss costs one composure. You have ${walked ? 4 : 3}.`,
        'Tap the three buttons, or use the keys ← (duck), ↑ (wave) and → (stop).',
      ],
      stakes: {
        win: 'Win: Legitimacy and support go up, and every faction warms a little, the Workers most.',
        lose: 'Lose: Legitimacy, support and the Workers\' loyalty drop.',
      },
      ...(walked ? { because: `The crowd gives you one more chance. ${becauseText(s, 'walked-dovra')}.` } : {}),
    };
  }
  if (cardId === MG_CARD.shred) {
    const crisis = s.crisis?.id === 'ledger';
    const allowed = s.act >= 3 ? 2 : 1;
    return {
      kicker: `Your office · Day ${s.day} · 16:20`,
      title: 'Shred the Ledger',
      teaser: 'The auditors are in your office. Some papers must never reach them.',
      story: [
        crisis
          ? 'The Free Zone Ledger has brought the auditors to your floor. Everything on your desk is going into their box.'
          : 'The Aureth Union sent auditors, and the Finance Ministry let them in. Everything on your desk is going into their box.',
        'Some of those papers came from the Ilvet Free Zone. They carry its red stamp. They need to be confetti before they get there.',
      ],
      howTo: [
        'Papers ride two belts towards the auditors\' box. Tap a paper with the red square stamp to shred it before it gets there.',
        'Everything else must reach the box: blue seals, plain papers. Shredding a clean paper jams the shredder for a moment.',
        'Some papers come face-down. Tap once to turn one over, again to shred it.',
        'Tricks: a red stamp crossed out (VOID) is clean.'
          + (s.act >= 2 ? ' A round red seal is not the square stamp: let it go.' : '')
          + (s.act >= 3 ? ' A pale red stamp is still dirty.' : ''),
        'The belts speed up wave by wave.',
        `A red-stamped paper in the box, or a jam, is a mistake. ${allowed === 1 ? 'One is allowed' : 'Two are allowed'}; one more and you lose.`,
      ],
      stakes: {
        win: 'Win: Legitimacy goes up, every faction warms a little (the Elites most), and scandal pressure falls.',
        lose: 'Lose: Legitimacy and the Elites\' loyalty drop, and scandal pressure rises.',
      },
      ...(crisis ? { because: 'Today\'s game comes from the Free Zone Ledger crisis.' } : {}),
    };
  }
  if (cardId === MG_CARD.bulletin) {
    const lead = [...s.scandals].sort((a, b) => b.heat - a.heat)[0];
    return {
      kicker: `Channel Seven · Day ${s.day} · 18:40`,
      title: 'The 7pm Bulletin',
      teaser: 'Channel Seven goes live at seven. You decide what airs.',
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
        win: 'Win: two mistakes or fewer. Legitimacy goes up and every faction warms a little, the Street most.',
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
    teaser: strike ? 'The army is coming for the Palace. Hold it, or it is over.' : 'Troops are moving on the Palace. You take command.',
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
      : { win: 'Win: the plot is broken and coup pressure drops sharply. Legitimacy goes up.', lose: 'Lose: you stay in office, but Legitimacy, Grip and the army\'s loyalty take a heavy hit.' },
    ...(vetted ? { because: `The gate guards are loyal: they can hold off one more column. ${becauseText(s, 'vetted-garrison')}.` } : {}),
  };
}

import type { CardDef, CardOutcome, Effects, GameState } from '../types';
import type { MinigameIntro } from './minigames';
import { STAFF } from '../minigames/mole';

/**
 * FIND THE MOLE — the card and its story (mini-games slice 3, part A).
 * Rules: src/game/minigames/mole.ts. Screen: src/ui/minigames/MoleGame.tsx.
 * Owner's choices (2026-10-06): live watching on a floor plan, dark (a night
 * security camera), in the daily rotation; Security turning hostile or a
 * betrayal warning brings it (content/minigames.ts eventMinigames()).
 */

export const MOLE_CARD_ID = 'mg-mole';

const score = (s: GameState) => s.flags.mgScore;

/** engine.ts finishMinigame() stores which job the mole had (STAFF index + 1). */
export const MOLE_JOB_FLAG = 'mgMole';
/** "the Clerk", for the result text (or "the mole" in a simulation). */
export function moleJob(s: GameState): string {
  const i = (s.flags[MOLE_JOB_FLAG] ?? 0) - 1;
  return STAFF[i] ? `the ${STAFF[i].job}` : 'the mole';
}
const Cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/**
 * What happens to the mole (owner, 2026-10-06: "I'd like the option to
 * choose what happens to the mole and have that have an effect on the
 * game"). A right name opens these four choices in the line-up; each is an
 * option on the card, so its effects go through applyEffects() and each
 * leaves a mark the factions remember (content/consequences.ts). 'won' is
 * the arrest, so the tests and the balance probe (which choose 'won') play
 * the plain win.
 */
export const MOLE_CHOICES: { id: string; label: string; hint: string }[] = [
  { id: 'won', label: 'Arrest them', hint: 'The Sable Office takes them tonight. Leaks dry up; the Street hears about it.' },
  { id: 'turn', label: 'Turn them', hint: 'They keep meeting the press, with papers you write. Scandals cool, if nobody finds out.' },
  { id: 'fire', label: 'Fire them quietly', hint: 'Gone by morning, no fuss. A small, safe result.' },
  { id: 'expose', label: 'Expose them', hint: 'Name them on the news. The public likes it; the Sable Office does not.' },
];

const BASE_WON = { all: { loyalty: 0.5 } } as const;

const MOLE_ARREST: Effects = {
  stats: { legitimacy: 4, security: 5 },
  hidden: { leak: -14, fear: 5 },
  factions: { ...BASE_WON, sable: { loyalty: 4 }, chorus: { loyalty: -2 } },
  news: ['NIGHT-SHIFT WORKER DETAINED AT INTERIOR MINISTRY'],
};
const MOLE_TURN: Effects = {
  stats: { legitimacy: 3, security: 6 },
  hidden: { leak: -6, scandal: -8 },
  factions: { ...BASE_WON, sable: { loyalty: 3 } },
  schedule: [{ inDays: 4, visible: true, label: 'Your double agent reports back', cardId: 'mole-double' }],
};
const MOLE_FIRE: Effects = {
  stats: { legitimacy: 4, security: 3 },
  hidden: { leak: -8 },
  factions: { ...BASE_WON },
};
const MOLE_EXPOSE: Effects = {
  stats: { legitimacy: 7, support: 4 },
  hidden: { leak: -10 },
  factions: { ...BASE_WON, chorus: { loyalty: 3 }, sable: { loyalty: -3 } },
  news: ['CHAIR NAMES MINISTRY LEAKER ON LIVE TELEVISION'],
};
const MOLE_LOST: Effects = {
  stats: { legitimacy: -4, security: -3 },
  hidden: { leak: 6 },
  factions: { sable: { loyalty: -4 } },
};

const caught = (s: GameState) => (score(s) ?? 0) >= 85
  ? 'You named the right person before the contact reached the car park.'
  : 'It took a while, and you nearly named the wrong desk. But it was the right one.';

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
      label: 'Arrest the mole.',
      hint: 'Legitimacy and Security go up, the Sable Office most; leaks dry up. The Street cools a little.',
      outcome: (s): CardOutcome => ({
        text: `${caught(s)} The Sable Office had ${moleJob(s)} in a quiet room by midnight.\n\nSarran sent a one-word note: "Noted." From her, that is a medal. The Street heard about the arrest by breakfast.`,
        tone: 'good',
        effects: MOLE_ARREST,
      }),
    },
    {
      id: 'turn',
      label: 'Turn the mole into a double agent.',
      hint: 'Legitimacy and Security go up; scandals cool. They will report back in four days.',
      outcome: (s): CardOutcome => ({
        text: `${caught(s)} ${Cap(moleJob(s))} sat in your office for an hour and agreed to keep meeting the Courier, with papers you write.\n\nThe next story the Courier runs will be one you chose. That works for as long as nobody notices.`,
        tone: 'good',
        effects: MOLE_TURN,
      }),
    },
    {
      id: 'fire',
      label: 'Fire the mole quietly.',
      hint: 'Legitimacy and Security go up a little; leaks drop. Nobody is upset.',
      outcome: (s): CardOutcome => ({
        text: `${caught(s)} ${Cap(moleJob(s))} cleared their desk at six in the morning, with a reference that says nothing.\n\nThe leaks stop. Nobody outside the building will ever know there was a mole.`,
        tone: 'good',
        effects: MOLE_FIRE,
      }),
    },
    {
      id: 'expose',
      label: 'Expose the mole on the news.',
      hint: 'Legitimacy and the Street go up; leaks drop. The Sable Office wanted to handle it quietly.',
      outcome: (s): CardOutcome => ({
        text: `${caught(s)} At nine you named ${moleJob(s)} on Channel Seven, with the camera stills.\n\nThe public liked a Chair who catches leakers in the open. Sarran watched it from her office and said nothing, which is worse than a note.`,
        tone: 'good',
        effects: MOLE_EXPOSE,
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

/** Four days after you turn the mole: never drawn at random. */
export const MOLE_FOLLOWUPS: CardDef[] = [
  {
    id: 'mole-double',
    title: 'Your Double Agent Reports Back',
    category: 'intelligence',
    actor: 'sarran',
    faction: 'sable',
    base: 0,
    weight: () => 0,
    body: 'For four days the mole you turned has carried your papers to the Sarnica Courier. Two of its stories this week were ones you wrote.\n\nNow the Courier\'s editor is asking where the scoops are coming from.',
    flavor: 'Two stories this week were yours. The editor has noticed the timing.',
    options: [
      {
        id: 'feed',
        label: 'Feed them one more story.',
        hint: 'Free. A big win if the Courier still trusts its source. A scandal if it does not.',
        outcome: (s): CardOutcome => (s.hidden.leak >= 45 || s.stats.security < 40
          ? {
              text: 'The Courier checked the story against a second source. There was no second source.\n\nBy Thursday the front page was about the government planting stories, with your double agent\'s name in the second paragraph.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -6, support: -4 },
                hidden: { scandal: 12 },
                factions: { chorus: { loyalty: -4 }, sable: { loyalty: -2 } },
                scandal: { name: 'The planted stories', detail: 'The Courier found out who was writing its scoops.', heat: 40 },
                news: ['COURIER: GOVERNMENT WROTE OUR LEAKS'],
              },
            }
          : {
              text: 'The Courier ran it on the front page: a story about your government that happened to be exactly the one you wanted told.\n\nThe editor still trusts the source. For now.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 4, information: 4 },
                hidden: { scandal: -10 },
                factions: { sable: { loyalty: 2 } },
              },
            }),
      },
      {
        id: 'reel',
        label: 'Bring them in now, quietly.',
        hint: 'Free. A small, safe gain. The Courier loses its source and never learns why.',
        outcome: {
          text: 'The Sable Office collected them from a bus stop at seven. The Courier\'s source simply stopped calling.\n\nSarran files it under "finished business".',
          tone: 'good',
          effects: {
            stats: { legitimacy: 2, security: 2 },
            hidden: { leak: -6 },
            factions: { sable: { loyalty: 2 } },
          },
        },
      },
      {
        id: 'cut',
        label: 'Let them go, with a ticket out of the country.',
        hint: 'Cost: $0.5B. No story, no trial. The Sable Office thinks you are soft.',
        outcome: {
          text: 'They were on the morning train to Aureth with a new passport and a reason never to come back.\n\nThe Sable Office calls it a waste of a good asset. Nobody else will ever hear of it.',
          tone: 'mixed',
          effects: {
            stats: { treasury: -0.5, legitimacy: 1 },
            hidden: { leak: -4 },
            factions: { sable: { loyalty: -2 } },
          },
        },
      },
    ],
  },
];

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
      'The night floor is on camera. Staff walk between the rooms. The contact (grey coat, hat, amber box) comes up in the lift.',
      'The mole meets the contact alone in a room and hands over a white envelope. It takes a moment. Watch for it.',
      s.act >= 2
        ? 'Others pass the contact in the corridor, share a room with them, or bring them a coffee. A coffee is not an envelope.'
        : 'Others pass the contact in the corridor, share a room with them, or stop for a chat. Only the envelope counts.',
      ...(s.act >= 2 ? ['Some cameras cut out for a few seconds. Keep watching.'] : []),
      'Tap a person, or their name in the staff list, to mark a suspect. On a laptop, press their number.',
      'When the contact leaves, pick one person in the line-up and name them. A wrong name loses. So does no name before the clock runs out.',
      'Name the right one and you decide what happens to them: arrest, turn them into your own source, fire them quietly, or expose them on the news. The factions will remember.',
    ],
    stakes: {
      win: 'Win: Legitimacy and Security go up, every faction warms a little (Security most), and the leaks dry up.',
      lose: 'Lose: Legitimacy, Security and the Sable Office\'s loyalty drop, and more papers leak.',
    },
    ...(hostile ? { because: 'Today\'s game comes from the Sable Office turning against you: it wants to see whether you can find a leak yourself.' } : {}),
  };
}

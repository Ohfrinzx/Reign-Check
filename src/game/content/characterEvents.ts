import type { CardDef } from '../types';
import { CHARACTER_REQUESTS } from './characterRequests';

/**
 * PHASE 3 STEP 2 — CHARACTER-DRIVEN EVENTS (content only; the rules that
 * decide when one arrives live in src/game/characterEvents.ts).
 *
 * Every character has two cards:
 *   - a BETRAYAL: they have lost faith in you and acted on their own. It is
 *     already done when the card arrives; the choice is what you do about it.
 *   - an OFFER: they are firmly on your side and bring you something useful.
 *     Every offer has a catch (writing rules: nothing is free).
 * Plus a one-line WARNING the front page shows a day or more before a
 * betrayal can arrive, so the player gets a chance to win them back.
 *
 * These cards are never drawn at random (`base: 0`, `weight: () => 0`) —
 * characterEvents.ts queues them. Each can appear once per run (`once`).
 * Owner decision: a betrayal never ends the run by itself; it raises the
 * existing pressures (coup, leaks, unrest, separatism…) instead.
 *
 * The `character-event` tag switches CardView to its own "private file"
 * layout, so these do not look like every other card (owner request).
 */
export interface CharacterEventDef {
  character: string;
  /** front-page warning, plain words, shown before a betrayal can happen */
  warning: string;
  betrayal: CardDef;
  offer: CardDef;
}

const never = () => 0;

export const CHARACTER_EVENTS: CharacterEventDef[] = [
  /* ------------------------------------------------------------ Varkov */
  {
    character: 'varkov',
    warning: 'Varkov has stopped copying you on her memos to the General Staff.',
    betrayal: {
      id: 'char-betray-varkov',
      title: 'Varkov Met the Aureth Attaché Without You',
      category: 'person',
      actor: 'varkov',
      faction: 'staff',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'General Varkov had lunch yesterday with the Aureth defence attaché. Nobody told you. The Sable Office found out from the restaurant bill.\n\nThis morning she told the General Staff that the army "cannot guarantee order" if its budget is cut again. She said it in front of forty officers. She meant you to hear about it.',
      options: [
        {
          id: 'confront',
          label: 'Call her in and ask her about the lunch, directly.',
          hint: 'Free. She will not lie to you. She may not like being asked.',
          outcome: {
            text: 'She does not deny it. "They asked what the army would do if you fell," she says. "I told them it would do its job." You are not sure which job she means.',
            tone: 'mixed',
            effects: {
              characters: { varkov: { plotting: -10, trust: 4, fear: 6 } },
              factions: { staff: { loyalty: -3 } },
              remember: [{ who: 'varkov', text: 'Was asked to explain herself, to her face.', weight: -1 }],
            },
          },
        },
        {
          id: 'buy',
          label: 'Restore the army\'s budget cut, quietly.',
          hint: 'Cost: $3.0B. She gets the message. So does everyone else who wants something.',
          outcome: {
            text: 'The money comes back without an announcement. Varkov sends a one-line note: "Received." The army is calmer. The next person with a threat now knows it works.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -3, military: 4 },
              characters: { varkov: { loyalty: 12, plotting: -15 } },
              factions: { staff: { loyalty: 5 } },
              regime: { militarism: 2 },
            },
          },
        },
        {
          id: 'retire',
          label: 'Retire her. Promote her deputy.',
          hint: 'Free. It removes the problem and angers the army that loved her.',
          outcome: {
            text: 'Varkov accepts retirement with a salute and no expression. Her deputy is loyal, grateful and much less capable. Half the General Staff goes to her leaving dinner. You are not invited.',
            tone: 'mixed',
            effects: {
              stats: { military: -6, power: 3 },
              factions: { staff: { loyalty: -8 } },
              hidden: { coup: -6 },
              removeFromPost: [{ who: 'varkov', reason: 'retired after meeting a foreign attaché without permission' }],
            },
          },
        },
        {
          id: 'ignore',
          label: 'Say nothing. Let her think you did not notice.',
          hint: 'Free. It keeps the peace today and teaches her something for later.',
          outcome: {
            text: 'Nothing happens, which Varkov reads correctly. The next lunch is with two attachés.',
            tone: 'bad',
            effects: {
              hidden: { coup: 9 },
              characters: { varkov: { plotting: 10 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-varkov',
      title: 'Varkov Offers to Retire Three Colonels',
      category: 'person',
      actor: 'varkov',
      faction: 'staff',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Varkov brings you three names. They are colonels who have been talking, in bars, about what the army would do "if the Chair lost control".\n\n"I can retire them this week," she says. "Quietly, with pensions. I want to choose who replaces them." She is not asking permission for that part.',
      options: [
        {
          id: 'accept',
          label: 'Let her retire them and pick the replacements.',
          hint: 'Free. The talk stops. The army becomes a little more hers, and a little less yours.',
          outcome: {
            text: 'Three colonels leave with full pensions and no fuss. Their replacements are good officers, and every one of them owes Varkov the job.',
            tone: 'good',
            effects: {
              hidden: { coup: -10 },
              characters: { varkov: { loyalty: 5, influence: 8 } },
              factions: { staff: { power: 4 } },
            },
          },
        },
        {
          id: 'own-picks',
          label: 'Retire them, but you choose the replacements.',
          hint: 'Free. The talk stops and the new men are yours. Varkov notices you did not trust her.',
          outcome: {
            text: 'She agrees, stiffly. The new colonels are loyal to you and new to their jobs. Varkov does not say anything, which is how she says a great deal.',
            tone: 'mixed',
            effects: {
              hidden: { coup: -7 },
              stats: { power: 2 },
              characters: { varkov: { loyalty: -6, trust: -4 } },
            },
          },
        },
        {
          id: 'decline',
          label: 'Leave them where they are. Talk in bars is just talk.',
          hint: 'Free. Varkov thinks you are naive. She may be right.',
          outcome: {
            text: '"Your decision," she says, and writes something down. The colonels keep drinking. The talk keeps going.',
            tone: 'neutral',
            effects: {
              hidden: { coup: 4 },
              characters: { varkov: { trust: -3 } },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------ Sarran */
  {
    character: 'sarran',
    warning: 'Sarran\'s weekly report arrived two days late and three pages shorter.',
    betrayal: {
      id: 'char-betray-sarran',
      title: 'Sarran Has Opened a File on You',
      category: 'intelligence',
      actor: 'sarran',
      faction: 'sable',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Doran brings you a photocopy. It is the front page of a Sable Office file. The name on it is yours.\n\nIt was opened eleven days ago, on Sarran\'s own signature. The first entry is about the night in the stairwell. Nobody else has seen it yet. Sarran has made sure you know it exists.',
      options: [
        {
          id: 'confront',
          label: 'Put the photocopy on her desk and wait.',
          hint: 'Free. It shows her you can see her. It does not close the file.',
          outcome: {
            text: 'Sarran looks at it for a long time. "Every head of state has a file," she says. "Yours is the thinnest I have ever kept." She does not offer to close it.',
            tone: 'mixed',
            effects: {
              characters: { sarran: { plotting: -8, fear: 8, trust: -4 } },
              hidden: { leak: 3 },
            },
          },
        },
        {
          id: 'buy',
          label: 'Give the Sable Office the new headquarters it wants.',
          hint: 'Cost: $2.5B. The file stays in a drawer. Sarran learns that a file is worth $2.5 billion.',
          outcome: {
            text: 'The building is approved. The file does not come up again. You assume it still exists, because it does.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -2.5, security: 3 },
              characters: { sarran: { loyalty: 12, plotting: -15 } },
              factions: { sable: { loyalty: 5 } },
              regime: { repression: 1 },
            },
          },
        },
        {
          id: 'remove',
          label: 'Replace her as Director.',
          hint: 'Free. Dangerous. She keeps copies of everything, and she is leaving angry.',
          outcome: {
            text: 'Sarran clears her desk in eleven minutes. She takes nothing with her, which is how you know she did not need to. The new Director is loyal and knows nothing.',
            tone: 'bad',
            effects: {
              stats: { information: -8, security: -4 },
              hidden: { leak: 10, scandal: 6 },
              factions: { sable: { loyalty: -8 } },
              removeFromPost: [{ who: 'sarran', reason: 'replaced after opening a file on the head of state' }],
            },
          },
        },
        {
          id: 'ignore',
          label: 'Do nothing. Let her keep her file.',
          hint: 'Free. Nothing happens today. The file gets thicker.',
          outcome: {
            text: 'You leave it. So does she. Her reports get shorter and more useful to her.',
            tone: 'bad',
            effects: {
              hidden: { leak: 8, scandal: 5 },
              characters: { sarran: { plotting: 10 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-sarran',
      title: 'Sarran Offers You a File on Kostyn',
      category: 'intelligence',
      actor: 'sarran',
      faction: 'sable',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Sarran puts a thin grey folder on your desk. "Governor Kostyn," she says. "Her road contracts. Her brother-in-law. Enough to keep her quiet for a year."\n\nShe does not slide it across. "It is yours if you want it. You should know that once you open it, you are the kind of Chair who opens them."',
      options: [
        {
          id: 'take',
          label: 'Take the folder.',
          hint: 'Free. Kostyn becomes much easier to handle. The Sable Office now knows what you will use.',
          outcome: {
            text: 'You read it that night. It is very good work. Kostyn is warm to you at the next meeting, and you know exactly why she has reason to be.',
            tone: 'mixed',
            effects: {
              stats: { information: 4 },
              characters: { kostyn: { plotting: -15, fear: 12 }, sarran: { loyalty: 4, influence: 6 } },
              hidden: { separatism: -5, fear: 3 },
              regime: { repression: 2 },
            },
          },
        },
        {
          id: 'shelve',
          label: 'Tell her to keep it, unread, in case you ever need it.',
          hint: 'Free. You keep the option without using it. Sarran keeps it too.',
          outcome: {
            text: '"Of course," she says. The folder goes back into her bag. It is exactly as useful to her as it would have been to you.',
            tone: 'neutral',
            effects: {
              characters: { sarran: { influence: 4, trust: 2 } },
              flags: { kostynFileHeld: 1 },
            },
          },
        },
        {
          id: 'refuse',
          label: 'Refuse. You do not govern with folders.',
          hint: 'Free. Sarran respects it and thinks it will not last.',
          outcome: {
            text: 'She nods as if you have passed a test she does not expect you to keep passing. The folder is shredded in front of you. There is, you assume, a copy.',
            tone: 'good',
            effects: {
              stats: { legitimacy: 2 },
              characters: { sarran: { trust: 5 } },
              regime: { reform: 1 },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------- Brask */
  {
    character: 'brask',
    warning: 'Brask has started leaving his green notebook at home.',
    betrayal: {
      id: 'char-betray-brask',
      title: 'Brask Gave the Real Numbers to the Aureth Union',
      category: 'economy',
      actor: 'brask',
      faction: 'grey',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'The Aureth Union — the group of foreign lenders who hold most of the country\'s debt — asked Brask for the real budget figures. He gave them the green notebook. All of it.\n\nHe is not sorry. "They were going to find out," he says, sweating. "I would rather they heard it from someone who can count."',
      options: [
        {
          id: 'back',
          label: 'Back him in public. Say the government chose to be honest.',
          hint: 'Free. The lenders trust you a little more. Your own ministers learn Brask cannot be controlled.',
          outcome: {
            text: 'You call it a new era of transparency. The lenders are pleasantly surprised. Brask looks at you like a man who has just been rescued from something he walked into on purpose.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 3, elite: -3 },
              hidden: { foreign: -5, fiscal: 3 },
              characters: { brask: { loyalty: 10, plotting: -10 } },
              regime: { technocracy: 2 },
            },
          },
        },
        {
          id: 'reprimand',
          label: 'Reprimand him in writing and take the notebook.',
          hint: 'Free. He keeps his job. He keeps his opinion of you.',
          outcome: {
            text: 'He hands over the notebook. It is the only copy, he says. It is not the only copy.',
            tone: 'mixed',
            effects: {
              hidden: { foreign: 4 },
              characters: { brask: { loyalty: -6, trust: -6 } },
              remember: [{ who: 'brask', text: 'Was reprimanded for telling the truth about money.', weight: -2 }],
            },
          },
        },
        {
          id: 'sack',
          label: 'Sack him.',
          hint: 'Free. Nobody else in the building has read the whole budget.',
          outcome: {
            text: 'Brask leaves with his green notebook under his arm. His replacement asks for a week to understand the budget, then for a second week.',
            tone: 'bad',
            effects: {
              stats: { economy: -5 },
              hidden: { fiscal: 8, foreign: 3 },
              removeFromPost: [{ who: 'brask', reason: 'sacked for giving foreign lenders the real budget figures' }],
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-brask',
      title: 'Brask Found $4 Billion in the Wrong Account',
      category: 'economy',
      actor: 'brask',
      faction: 'grey',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Brask is almost smiling. He has found $4 billion sitting in a state pension fund account, put there by mistake in 2019 and never moved.\n\n"It is legal to move it back," he says. "Probably. The pensioners will be paid a month late while it is sorted out."',
      options: [
        {
          id: 'take',
          label: 'Move all $4 billion back to the treasury.',
          hint: 'The treasury gains $4.0B. Pensions go out a month late, and pensioners vote.',
          outcome: {
            text: 'The money moves. So do the pensioners, to the square outside the ministry, with folding chairs.',
            tone: 'mixed',
            effects: {
              stats: { treasury: 4, support: -3 },
              factions: { chorus: { loyalty: -2 } },
              characters: { brask: { loyalty: 3 } },
            },
          },
        },
        {
          id: 'half',
          label: 'Move half now and half after pensions are paid.',
          hint: 'The treasury gains $2.0B now. Slower, but nobody is paid late.',
          outcome: {
            text: 'Brask does it properly, in two stages, with a memo for each. It is the most satisfied you have ever seen him.',
            tone: 'good',
            effects: {
              stats: { treasury: 2 },
              schedule: [{ inDays: 3, label: 'The second $2B moves back from the pension fund.', visible: true, effects: { stats: { treasury: 2 } } }],
              characters: { brask: { loyalty: 5, trust: 4 } },
              regime: { technocracy: 1 },
            },
          },
        },
        {
          id: 'leave',
          label: 'Leave it in the pension fund.',
          hint: 'Free. The pensioners get a slightly richer fund. Brask thinks you are wasting $4 billion.',
          outcome: {
            text: 'The pension fund has a good year. Nobody thanks you, because nobody knows. Brask writes the figure in his notebook and underlines it twice.',
            tone: 'neutral',
            effects: {
              stats: { support: 1 },
              characters: { brask: { trust: -2 } },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------- Doran */
  {
    character: 'doran',
    warning: 'Doran has started using your title even when the room is empty.',
    betrayal: {
      id: 'char-betray-doran',
      title: 'Doran Has Met Kostyn Twice',
      category: 'person',
      actor: 'doran',
      faction: 'grey',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Your Chief of Staff has met Governor Kostyn twice this week. Both meetings were in your diary as "dentist".\n\nDoran got you this job. She keeps a running total of what you owe her. It seems she has decided the total is high enough to start shopping around.',
      options: [
        {
          id: 'confront',
          label: 'Ask her how her teeth are.',
          hint: 'Free. She will know you know. That may be enough.',
          outcome: {
            text: '"Much better, {sir}," she says, and then, after a pause, uses your first name for the first time in a week. It is an apology, or a warning. Possibly both.',
            tone: 'mixed',
            effects: {
              characters: { doran: { plotting: -12, fear: 6, trust: 3 } },
            },
          },
        },
        {
          id: 'pay',
          label: 'Settle the total. Give her the ambassadorship she wants for her husband.',
          hint: 'Free in money. The foreign ministry loses a good post to a bad ambassador.',
          outcome: {
            text: 'Her husband goes to Sereth with a new title and no qualifications. Doran stops going to the dentist.',
            tone: 'mixed',
            effects: {
              hidden: { corruption: 4, foreign: 3 },
              characters: { doran: { loyalty: 14, plotting: -18 }, piek: { loyalty: -5 } },
              regime: { patronage: 2 },
            },
          },
        },
        {
          id: 'remove',
          label: 'Replace her as Chief of Staff.',
          hint: 'Free. She knows where everything is, including the things you would rather she forgot.',
          outcome: {
            text: 'She leaves with a smile that worries you and a box of files that worries you more. By Friday she is working for Kostyn, openly.',
            tone: 'bad',
            effects: {
              stats: { power: -5 },
              hidden: { leak: 8 },
              characters: { kostyn: { influence: 8 } },
              removeFromPost: [{ who: 'doran', reason: 'replaced after secret meetings with Governor Kostyn' }],
            },
          },
        },
        {
          id: 'ignore',
          label: 'Let it go. Everyone keeps their options open.',
          hint: 'Free. She keeps running your diary. And someone else\'s.',
          outcome: {
            text: 'The dentist appointments continue. Kostyn starts knowing your schedule before you do.',
            tone: 'bad',
            effects: {
              hidden: { leak: 6 },
              characters: { doran: { plotting: 8 }, kostyn: { influence: 5 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-doran',
      title: 'Doran Offers to Make a Story Go Away',
      category: 'person',
      actor: 'doran',
      faction: 'grey',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Doran has heard that two newspapers are working on stories about your government. She thinks she can stop both.\n\n"Don\'t ask me how," she says. "I will add it to the total." She is only half joking about the total.',
      options: [
        {
          id: 'yes',
          label: 'Let her handle it.',
          hint: 'Free. The stories die. You owe Doran one more thing.',
          outcome: {
            text: 'Both stories vanish. One editor is suddenly on holiday. You do not ask. Doran writes something in a small book she keeps in her jacket.',
            tone: 'good',
            effects: {
              hidden: { scandal: -10 },
              characters: { doran: { influence: 8, loyalty: 3 } },
              flags: { doranFavourOwed: 1 },
            },
          },
        },
        {
          id: 'one',
          label: 'Only the worse of the two stories.',
          hint: 'Free. Half the risk, half the debt.',
          outcome: {
            text: 'One story dies. The other runs on page six, where nobody reads it except the people it is about.',
            tone: 'mixed',
            effects: {
              hidden: { scandal: -5 },
              characters: { doran: { influence: 4 } },
            },
          },
        },
        {
          id: 'no',
          label: 'Let the papers print what they have.',
          hint: 'Free. You owe her nothing. The stories run.',
          outcome: {
            text: 'Doran shrugs. Both stories run. They are less bad than she said, which makes you wonder why she offered.',
            tone: 'neutral',
            effects: {
              hidden: { scandal: 4 },
              stats: { legitimacy: 1 },
              characters: { doran: { trust: -2 } },
            },
          },
        },
      ],
    },
  },

  /* -------------------------------------------------------------- Piek */
  {
    character: 'piek',
    warning: 'Piek has been to three embassy dinners this week. You were invited to none of them.',
    betrayal: {
      id: 'char-betray-piek',
      title: 'Piek Leaked the Trade Position',
      category: 'foreign',
      actor: 'piek',
      faction: 'grey',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'The Aureth embassy knows exactly how low you are willing to go in next month\'s lithium talks. Only four people knew that number. One of them is your Foreign Minister.\n\nPiek says the embassy "must have guessed". He says it while wearing a new watch.',
      options: [
        {
          id: 'confront',
          label: 'Ask where the watch came from.',
          hint: 'Free. He will lie badly. It will still be a lie.',
          outcome: {
            text: '"A gift from my mother," says Piek, whose mother died in 2011. He stops going to the Aureth embassy, for now.',
            tone: 'mixed',
            effects: {
              characters: { piek: { plotting: -10, fear: 10 } },
              hidden: { foreign: 3 },
            },
          },
        },
        {
          id: 'use',
          label: 'Leave him in place and feed him a false number.',
          hint: 'Free. Clever if it works. Aureth will know who fooled them.',
          outcome: {
            text: 'Piek passes on the new number within a day. Aureth opens the talks with an offer far better than you expected. They will not forgive this, but they will pay for it.',
            tone: 'mixed',
            effects: {
              stats: { treasury: 2, information: 3 },
              hidden: { foreign: 6 },
              characters: { piek: { plotting: 4 } },
            },
          },
        },
        {
          id: 'sack',
          label: 'Sack him.',
          hint: 'Free. The embassy loses its source. The foreign ministry loses its only charming person.',
          outcome: {
            text: 'Piek leaves with eleven navy suits and a job offer from an Aureth bank. The dinners get noticeably quieter.',
            tone: 'good',
            effects: {
              hidden: { foreign: 4, leak: -5 },
              stats: { legitimacy: 2 },
              removeFromPost: [{ who: 'piek', reason: 'sacked for leaking the lithium trade position' }],
            },
          },
        },
        {
          id: 'ignore',
          label: 'Do nothing. You need him for the talks.',
          hint: 'Free. He stays. So does his other employer.',
          outcome: {
            text: 'The talks go badly, in exactly the way the embassy planned. Piek is very apologetic, and very well dressed.',
            tone: 'bad',
            effects: {
              stats: { treasury: -2 },
              hidden: { foreign: 5, leak: 5 },
              characters: { piek: { plotting: 6 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-piek',
      title: 'Piek Has Arranged a Dinner With Ostrene',
      category: 'foreign',
      actor: 'piek',
      faction: 'grey',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Piek has done something useful. He has arranged a private dinner with the Ostrene ambassador, who has been refusing to meet you for weeks.\n\nThere is one small thing, he says. His nephew would very much like to be consul in Sereth.',
      options: [
        {
          id: 'both',
          label: 'Go to the dinner. Give the nephew the post.',
          hint: 'Free. Ostrene calms down. The foreign service gets a consul who cannot find Sereth on a map.',
          outcome: {
            text: 'The dinner goes well. The ambassador laughs at your jokes, which he has never done. The nephew arrives in Sereth and immediately loses a diplomatic bag.',
            tone: 'mixed',
            effects: {
              hidden: { foreign: -10, corruption: 3 },
              characters: { piek: { loyalty: 6 } },
              regime: { patronage: 2 },
            },
          },
        },
        {
          id: 'dinner',
          label: 'Go to the dinner. No post for the nephew.',
          hint: 'Free. Ostrene calms down a little. Piek sulks.',
          outcome: {
            text: 'The dinner is polite and cautious. Piek is visibly disappointed all evening, which the ambassador finds very funny.',
            tone: 'good',
            effects: {
              hidden: { foreign: -6 },
              characters: { piek: { loyalty: -3 } },
            },
          },
        },
        {
          id: 'skip',
          label: 'Decline. You will meet Ostrene on your own terms.',
          hint: 'Free. Ostrene stays cold. Piek is embarrassed in front of an ambassador.',
          outcome: {
            text: 'Piek has to cancel the dinner himself. The ambassador is not surprised. Ostrene\'s silence continues.',
            tone: 'neutral',
            effects: {
              hidden: { foreign: 2 },
              characters: { piek: { loyalty: -5, trust: -3 } },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------ Kostyn */
  {
    character: 'kostyn',
    warning: 'Kostyn\'s honey jars have stopped arriving at your office.',
    betrayal: {
      id: 'char-betray-kostyn',
      title: 'Kostyn Is Keeping the Basin\'s Taxes',
      category: 'crisis',
      actor: 'kostyn',
      faction: 'provinces',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'The Kordiva Basin Council has voted to hold back 20% of the region\'s tax payments to the capital "until the roads budget is settled". Governor Kostyn proposed the motion. It passed 41 to 2.\n\nIt is not legal. It is also very popular in the Basin, and Kostyn wins her region with 78%.',
      options: [
        {
          id: 'order',
          label: 'Order the money paid by Friday, or the Council is suspended.',
          hint: 'Free. Legal and firm. It turns a tax dispute into a fight about who runs the Basin.',
          outcome: {
            text: 'The money arrives on Friday afternoon, all of it, with a covering letter that is polite in a way that reads like a threat. Kostyn gives a speech about "the capital\'s boot". It is widely shared.',
            tone: 'mixed',
            effects: {
              stats: { power: 3 },
              hidden: { separatism: 6 },
              factions: { provinces: { loyalty: -6 } },
              characters: { kostyn: { plotting: 5, fear: 5 } },
            },
          },
        },
        {
          id: 'pay',
          label: 'Settle the roads budget. Give her what she wants.',
          hint: 'Cost: $3.0B. The money flows again. Every other governor is taking notes.',
          outcome: {
            text: 'The roads money is found. The taxes are paid the same day. Two other governors ask for meetings about their own roads.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -3 },
              hidden: { separatism: -4 },
              factions: { provinces: { loyalty: 6 } },
              characters: { kostyn: { loyalty: 10, plotting: -12 } },
              regime: { devolution: 2 },
            },
          },
        },
        {
          id: 'remove',
          label: 'Remove her as Governor.',
          hint: 'Free. Legal on paper. She won with 78% and the Basin will remember.',
          outcome: {
            text: 'The decree is signed. Kostyn leaves the governor\'s building on foot, through a crowd of thousands, waving. She is now a private citizen with nothing to do but oppose you.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -4 },
              hidden: { separatism: 10, unrest: 4 },
              factions: { provinces: { loyalty: -12 } },
              removeFromPost: [{ who: 'kostyn', reason: 'removed as governor after withholding the Basin\'s taxes' }],
            },
          },
        },
        {
          id: 'wait',
          label: 'Wait. Let the courts deal with it.',
          hint: 'Free. The courts take months. The money does not arrive in the meantime.',
          outcome: {
            text: 'The case is filed. The first hearing is in spring. Two other regional councils read the Basin\'s motion with interest.',
            tone: 'bad',
            effects: {
              stats: { treasury: -2 },
              hidden: { separatism: 9 },
              characters: { kostyn: { plotting: 6, influence: 5 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-kostyn',
      title: 'Kostyn Offers to Deliver the Basin',
      category: 'person',
      actor: 'kostyn',
      faction: 'provinces',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Governor Kostyn says the Basin\'s eleven members of parliament will vote with you in the next confidence vote. All eleven. She has already told them.\n\nIn return, she wants a road. A specific road, from Kordiva to the coast, 120 kilometres. She has brought the map.',
      options: [
        {
          id: 'build',
          label: 'Build her road.',
          hint: 'Cost: $0.4B a day for 6 days. The Basin backs you. Kostyn gets something to cut a ribbon on.',
          outcome: {
            text: 'Work starts within a week. Kostyn is photographed in a hard hat. The Basin\'s members stand up in parliament to praise the government, unprompted.',
            tone: 'good',
            effects: {
              stats: { legitimacy: 4 },
              commitments: [{ label: 'The Kordiva coast road', perDay: 0.4, days: 6 }],
              factions: { provinces: { loyalty: 8 } },
              characters: { kostyn: { loyalty: 6, influence: 5 } },
            },
          },
        },
        {
          id: 'promise',
          label: 'Promise the road after the vote.',
          hint: 'Free today. She will hold you to it, and so will the Basin.',
          outcome: {
            text: 'Kostyn smiles and folds the map very neatly. "After the vote, then." She has made promises like this herself. She knows exactly what they are worth.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 2 },
              promise: { text: 'Build the Kordiva coast road', to: 'kostyn', inDays: 6 },
              characters: { kostyn: { trust: -3 } },
            },
          },
        },
        {
          id: 'decline',
          label: 'Decline. Parliament votes are not for sale.',
          hint: 'Free. Principled. Kostyn keeps her eleven votes for later.',
          outcome: {
            text: '"Of course not," she says, and takes the map home. The eleven votes are still hers, and now she knows you will not buy them.',
            tone: 'neutral',
            effects: {
              characters: { kostyn: { loyalty: -5 } },
              regime: { reform: 1 },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------ Adamek */
  {
    character: 'adamek',
    warning: 'Adamek\'s football club has started paying for Vel\'s rallies to be filmed.',
    betrayal: {
      id: 'char-betray-adamek',
      title: 'Adamek Is Funding the Opposition',
      category: 'scandal',
      actor: 'adamek',
      faction: 'concord',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Rulf Adamek\'s football club has "sponsored" six of Sanna Vel\'s rallies. The payments total $40 million. Vel says she did not know where the money came from. Adamek says nothing, as usual.\n\nHe has chosen four ministers in his life. It looks like he has started choosing the next Chair.',
      options: [
        {
          id: 'audit',
          label: 'Send the tax office into Ilvet Instruments.',
          hint: 'Free. It hurts him. It also tells every investor what happens to people who cross you.',
          outcome: {
            text: 'The auditors arrive on Monday with forty boxes. Adamek\'s shares fall 9%. So does foreign investment, in sympathy.',
            tone: 'mixed',
            effects: {
              stats: { economy: -4, power: 3 },
              factions: { concord: { loyalty: -8 } },
              characters: { adamek: { fear: 12, plotting: -8 } },
              regime: { repression: 1 },
            },
          },
        },
        {
          id: 'buy',
          label: 'Give him the port crane contract he has been asking for.',
          hint: 'Cost: $2.0B in lost port fees. The payments to Vel stop. Adamek learns that this works.',
          outcome: {
            text: 'The contract is signed. The next Vel rally has much worse lighting. Adamek sends you a football shirt with your name on it.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -2 },
              hidden: { corruption: 5 },
              characters: { adamek: { loyalty: 14, plotting: -15 } },
              regime: { graft: 2 },
            },
          },
        },
        {
          id: 'expose',
          label: 'Leak the payments to the press.',
          hint: 'Free. It damages Vel as much as Adamek. Neither will forget it.',
          outcome: {
            text: 'The story runs everywhere. Vel returns the money on live television. Adamek\'s club is fined. Both of them now have a reason to want you gone.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 2 },
              factions: { chorus: { loyalty: -4 }, concord: { loyalty: -4 } },
              characters: { adamek: { plotting: 5 }, vel: { loyalty: -6 } },
            },
          },
        },
        {
          id: 'ignore',
          label: 'Ignore it. Vel was going to have rallies anyway.',
          hint: 'Free. The rallies get bigger, better lit and better filmed.',
          outcome: {
            text: 'Vel\'s next rally has a stage, a light show and a drone. Forty thousand people come. Adamek watches it from a hotel balcony.',
            tone: 'bad',
            effects: {
              hidden: { unrest: 7 },
              stats: { support: -3 },
              characters: { adamek: { plotting: 8 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-adamek',
      title: 'Adamek Offers a Loan at Zero Interest',
      category: 'economy',
      actor: 'adamek',
      faction: 'concord',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Adamek writes a number on a card and slides it across the table: $5 billion. His bank will lend it to the treasury at zero interest.\n\nHe writes a second, smaller thing on the back of the card. It is the name of a judge he would like promoted to the Supreme Court.',
      options: [
        {
          id: 'both',
          label: 'Take the loan. Promote the judge.',
          hint: 'The treasury gains $5.0B. Repayments cost $0.5B a day for 8 days. Adamek owns a Supreme Court judge.',
          outcome: {
            text: 'The money arrives the same afternoon. The judge is sworn in the following week and thanks "those who believed in me", looking at nobody in particular.',
            tone: 'mixed',
            effects: {
              stats: { treasury: 5, legitimacy: -3 },
              commitments: [{ label: 'Repaying Adamek\'s loan', perDay: 0.5, days: 8 }],
              hidden: { corruption: 6 },
              characters: { adamek: { loyalty: 6, influence: 6 } },
              regime: { graft: 2 },
            },
          },
        },
        {
          id: 'loan',
          label: 'Take the loan. Ignore the back of the card.',
          hint: 'The treasury gains $5.0B. Repayments cost $0.6B a day for 8 days. Adamek does not like being ignored.',
          outcome: {
            text: 'The loan goes through, at zero interest as promised. The repayment schedule, you notice later, has a "handling charge".',
            tone: 'mixed',
            effects: {
              stats: { treasury: 5 },
              commitments: [{ label: 'Repaying Adamek\'s loan', perDay: 0.6, days: 8 }],
              characters: { adamek: { loyalty: -4 } },
            },
          },
        },
        {
          id: 'no',
          label: 'Hand the card back.',
          hint: 'Free. You owe him nothing. He remembers the refusal.',
          outcome: {
            text: 'Adamek puts the card back in his pocket without looking at it. "Another time," he says. There will be another time.',
            tone: 'neutral',
            effects: {
              characters: { adamek: { loyalty: -5, trust: -2 } },
              regime: { reform: 1 },
            },
          },
        },
      ],
    },
  },

  /* --------------------------------------------------------------- Vel */
  {
    character: 'vel',
    warning: 'Vel has stopped taking your office\'s calls and started taking notes on live stream.',
    betrayal: {
      id: 'char-betray-vel',
      title: 'Vel Has Called a March on Parliament',
      category: 'crisis',
      actor: 'vel',
      faction: 'chorus',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Sanna Vel has ended her party\'s agreement to "keep disagreements inside parliament". She has called a march on parliament for Saturday. Her stream has had two million views since breakfast.\n\nIt is her legal right. She has a copy of the constitution open to the relevant page, on screen, for the whole stream.',
      options: [
        {
          id: 'meet',
          label: 'Invite her to talk before Saturday, on camera.',
          hint: 'Free. It might calm things. It will definitely make her look important.',
          outcome: {
            text: 'She comes. She is better on camera than you are. The march goes ahead, but smaller, and it ends with speeches instead of windows.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 3, support: -1 },
              hidden: { unrest: -4 },
              characters: { vel: { plotting: -10, influence: 6 } },
            },
          },
        },
        {
          id: 'permit',
          label: 'Let the march happen. Police it lightly.',
          hint: 'Free. It is legal and you look calm. It will be very big.',
          outcome: {
            text: 'Sixty thousand people march. Nothing is broken. The pictures are extraordinary, and none of them are of you.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 2, support: -4 },
              hidden: { unrest: 5 },
              characters: { vel: { influence: 8 } },
              regime: { reform: 1 },
            },
          },
        },
        {
          id: 'arrest',
          label: 'Have her arrested for "incitement".',
          hint: 'Free. It stops the march. It will start something much larger.',
          outcome: {
            text: 'She is arrested live, mid-sentence. The stream keeps running from a phone on the floor. By evening the square is full, and nobody called that one.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -8, support: -5 },
              hidden: { unrest: 12, foreign: 5 },
              factions: { chorus: { loyalty: -10 } },
              removeFromPost: [{ who: 'vel', reason: 'arrested for leading a march on parliament' }],
              regime: { repression: 3 },
              flags: { peopleJailed: 1 },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-vel',
      title: 'Vel Proposes an Anti-Corruption Commission',
      category: 'policy',
      actor: 'vel',
      faction: 'chorus',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'The Leader of the Opposition has an offer. Her party will back one of your bills — any one — if you set up an independent anti-corruption commission, with her party choosing half the members.\n\n"You say you are clean," she says. "Prove it. Or tell me why you would rather not."',
      options: [
        {
          id: 'agree',
          label: 'Agree to the commission, as she designed it.',
          hint: 'Free. A big gain in legitimacy. The commission will look at your own people too.',
          outcome: {
            text: 'The commission is announced to real applause. Within a week it has requested files from three ministries and one of your advisors has hired a lawyer.',
            tone: 'good',
            effects: {
              stats: { legitimacy: 7, elite: -5 },
              hidden: { corruption: -8, scandal: 4 },
              factions: { chorus: { loyalty: 6 }, concord: { loyalty: -4 } },
              characters: { vel: { loyalty: 5, trust: 6 } },
              regime: { reform: 3 },
            },
          },
        },
        {
          id: 'weaker',
          label: 'Agree, but you choose all the members.',
          hint: 'Free. A smaller gain. Vel calls it a fake in public, and she is not wrong.',
          outcome: {
            text: 'The commission is set up. Vel calls it "a mirror you bought yourself". It investigates very little, very slowly.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 2 },
              characters: { vel: { loyalty: -6, trust: -5 } },
            },
          },
        },
        {
          id: 'decline',
          label: 'Decline. Corruption is a matter for the courts.',
          hint: 'Free. Vel tells her two hundred thousand viewers you said no.',
          outcome: {
            text: 'She reads your answer out on her stream, word for word, without comment. The comment section does the rest.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -2, support: -2 },
              characters: { vel: { loyalty: -4 } },
            },
          },
        },
      ],
    },
  },

  /* --------------------------------------------------------------- Loz */
  {
    character: 'loz',
    warning: 'Channel Seven has started running your speeches without the sound.',
    betrayal: {
      id: 'char-betray-loz',
      title: 'Channel Seven Is Making a Documentary About You',
      category: 'scandal',
      actor: 'loz',
      faction: 'concord',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Dmitar Loz has told his staff to make a three-part documentary about "how the Chair came to power". It airs next week, at 7pm, on the channel 60% of the country watches.\n\nHe has not asked you to take part. He has booked the stairwell for filming.',
      options: [
        {
          id: 'pay',
          label: 'Buy advertising until the documentary is "rescheduled".',
          hint: 'Cost: $2.0B. It goes away. Loz learns what his silence costs.',
          outcome: {
            text: 'The ministries buy a lot of advertising. The documentary is moved to "later in the year". Loz sends a fruit basket.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -2 },
              hidden: { scandal: -4, corruption: 4 },
              characters: { loz: { loyalty: 10, plotting: -12 } },
              regime: { graft: 2 },
            },
          },
        },
        {
          id: 'licence',
          label: 'Remind him his broadcast licence is up for review.',
          hint: 'Free. It works. Every journalist in the country hears about it by lunchtime.',
          outcome: {
            text: 'The documentary becomes a cookery programme. Two Channel Seven journalists resign and tell the story to a foreign paper instead.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: -4, information: -2 },
              hidden: { fear: 4, scandal: 3 },
              characters: { loz: { fear: 10, plotting: 4 } },
              regime: { repression: 2 },
            },
          },
        },
        {
          id: 'interview',
          label: 'Offer him an exclusive interview instead.',
          hint: 'Free. You get to tell your side. He gets the ratings, and the edit.',
          outcome: {
            text: 'The documentary airs with your interview in it. It is fair to you for about forty minutes out of ninety. The other fifty are in the stairwell.',
            tone: 'mixed',
            effects: {
              stats: { support: -2, legitimacy: 1 },
              hidden: { scandal: 3 },
              characters: { loz: { loyalty: 4 } },
            },
          },
        },
        {
          id: 'ignore',
          label: 'Let it air.',
          hint: 'Free. Sixty per cent of the country watches it at 7pm.',
          outcome: {
            text: 'It airs. It is very well made. Your approval ratings take three days to stop falling.',
            tone: 'bad',
            effects: {
              stats: { support: -6 },
              hidden: { scandal: 8 },
              characters: { loz: { plotting: 5 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-loz',
      title: 'Loz Offers You a Good Week',
      category: 'opportunity',
      actor: 'loz',
      faction: 'concord',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Loz takes the best chair in your office, as usual. He is offering "a good week": seven days of friendly coverage on Channel Seven and in all three of his papers.\n\n"The product is excellent this season," he says. He means you. The price is $1.5 billion in government advertising.',
      options: [
        {
          id: 'buy',
          label: 'Buy the good week.',
          hint: 'Cost: $1.5B. People like you more for a while. Other newsrooms notice who is being paid.',
          outcome: {
            text: 'You are on every front page, in every good light. Your approval rises. So does the number of people who mention it is suspicious.',
            tone: 'good',
            effects: {
              stats: { treasury: -1.5, support: 6 },
              hidden: { cult: 5, corruption: 2 },
              factions: { chorus: { loyalty: -2 } },
              characters: { loz: { loyalty: 5 } },
            },
          },
        },
        {
          id: 'haggle',
          label: 'Offer half the price for half the week.',
          hint: 'Cost: $0.8B. A smaller boost. Loz respects a haggle.',
          outcome: {
            text: 'He laughs and agrees. Three friendly days. He calls it "the sample".',
            tone: 'good',
            effects: {
              stats: { treasury: -0.8, support: 3 },
              hidden: { cult: 2 },
              characters: { loz: { loyalty: 2 } },
            },
          },
        },
        {
          id: 'no',
          label: 'No. The government does not buy coverage.',
          hint: 'Free. Loz is not offended. His coverage becomes exactly as fair as you are paying for.',
          outcome: {
            text: 'Loz shrugs and stands up. "Everyone buys," he says. "Some of them pay later." The next week of coverage is scrupulously neutral, which on Channel Seven feels hostile.',
            tone: 'neutral',
            effects: {
              stats: { legitimacy: 1 },
              characters: { loz: { loyalty: -4 } },
            },
          },
        },
      ],
    },
  },

  /* -------------------------------------------------------------- Hess */
  {
    character: 'hess',
    warning: 'Hess has been seen at the Gorsk pitheads with a clipboard.',
    betrayal: {
      id: 'char-betray-hess',
      title: 'Hess Has Called a Strike Vote at Gorsk',
      category: 'crisis',
      actor: 'hess',
      faction: 'combine',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Bogdan Hess has called a strike vote at the Gorsk mines without telling you first. He has never done that before. He always called.\n\nThe vote is on Thursday. It will pass. Every lithium shipment for the next month is in the balance.',
      options: [
        {
          id: 'go',
          label: 'Go to Gorsk yourself and talk to the miners.',
          hint: 'Free. Brave. It could win them over, or look like a stunt.',
          outcome: {
            text: 'You go down the Number Four shaft in a borrowed helmet. The miners listen. The vote still passes, but by less, and the strike is called off after one day.',
            tone: 'mixed',
            effects: {
              stats: { support: 3, economy: -2 },
              factions: { combine: { loyalty: 5 } },
              characters: { hess: { plotting: -10, trust: 6 } },
            },
          },
        },
        {
          id: 'pay',
          label: 'Offer a 5% pay rise before the vote.',
          hint: 'Cost: $2.5B. The vote is cancelled. The mine owners are furious.',
          outcome: {
            text: 'Hess cancels the vote with a short statement that does not mention you. The owners send a delegation. It is longer.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -2.5 },
              factions: { combine: { loyalty: 6 }, concord: { loyalty: -5 } },
              characters: { hess: { loyalty: 10, plotting: -12 } },
              regime: { populism: 2 },
            },
          },
        },
        {
          id: 'arrest',
          label: 'Arrest him for organising an illegal strike.',
          hint: 'Free. The strike has no leader. It still has twelve thousand miners.',
          outcome: {
            text: 'Hess is arrested at the pithead. He goes quietly and tells the miners not to do anything stupid. They do not listen. Gorsk stops for a week.',
            tone: 'bad',
            effects: {
              stats: { economy: -7, legitimacy: -4 },
              hidden: { unrest: 10 },
              factions: { combine: { loyalty: -12 } },
              removeFromPost: [{ who: 'hess', reason: 'arrested for calling a strike vote at Gorsk' }],
              regime: { repression: 2 },
              flags: { peopleJailed: 1 },
            },
          },
        },
        {
          id: 'wait',
          label: 'Let the vote happen.',
          hint: 'Free. The mines stop. You find out how long the treasury lasts without lithium.',
          outcome: {
            text: 'The vote passes 91%. The mines stop on Friday. Ostrene asks, politely and daily, where its lithium is.',
            tone: 'bad',
            effects: {
              stats: { economy: -6, treasury: -2 },
              hidden: { unrest: 6, foreign: 4 },
              characters: { hess: { plotting: 4 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-hess',
      title: 'Hess Offers a No-Strike Pledge',
      category: 'person',
      actor: 'hess',
      faction: 'combine',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Hess stands in your office, as always. He is offering a written pledge: no strikes anywhere in the country until the end of this act.\n\nIn return, public-sector wages rise with prices for the same period. "It is fair," he says. It is also not cheap.',
      options: [
        {
          id: 'sign',
          label: 'Sign it.',
          hint: 'Cost: $0.3B a day for 6 days. No strikes. The mine owners call it a surrender.',
          outcome: {
            text: 'Hess signs first and shakes your hand exactly once. The country goes quiet in a way it has not for months.',
            tone: 'good',
            effects: {
              stats: { stability: 5 },
              hidden: { unrest: -8 },
              commitments: [{ label: 'Wages rising with prices (Hess pledge)', perDay: 0.3, days: 6 }],
              factions: { combine: { loyalty: 6 }, concord: { loyalty: -3 } },
              characters: { hess: { loyalty: 5 } },
            },
          },
        },
        {
          id: 'mines',
          label: 'Sign it for the mines only.',
          hint: 'Cost: $0.15B a day for 6 days. The mines are safe. The ports and railways are not.',
          outcome: {
            text: 'Hess thinks about it for a full minute, then agrees. "The mines are the ones that matter," he says. He is right.',
            tone: 'good',
            effects: {
              stats: { stability: 2 },
              hidden: { unrest: -4 },
              commitments: [{ label: 'Miners\' wages rising with prices', perDay: 0.15, days: 6 }],
              characters: { hess: { loyalty: 2 } },
            },
          },
        },
        {
          id: 'no',
          label: 'Decline. Wages are set by the budget, not by pledges.',
          hint: 'Free. Hess takes the pledge home with him.',
          outcome: {
            text: '"Then there is no pledge," he says. He does not sound angry. He sounds like a man making a note.',
            tone: 'neutral',
            effects: {
              characters: { hess: { loyalty: -5 } },
            },
          },
        },
      ],
    },
  },

  /* ------------------------------------------------------------- Grebs */
  {
    character: 'grebs',
    warning: 'Grebs has started asking for your instructions in writing.',
    betrayal: {
      id: 'char-betray-grebs',
      title: 'Grebs Is Reading Your Decrees Very Carefully',
      category: 'decision',
      actor: 'grebs',
      faction: 'grey',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Your last six decrees are all "under legal review". So are the four before that. Ilyana Grebs, who runs the civil service, says each one raises "questions of form".\n\nShe has served nine heads of state. She has decided you are not going to be one of the ones who lasts.',
      options: [
        {
          id: 'meet',
          label: 'Meet her in person and ask what she wants.',
          hint: 'Free. She gives opinions freely in person, once. This is your once.',
          outcome: {
            text: '"Consistency," she says. "Nine governments. The ones that lasted let the civil service do its job." The decrees are unfrozen the next morning, with notes in the margins.',
            tone: 'mixed',
            effects: {
              stats: { power: 3 },
              characters: { grebs: { plotting: -12, trust: 6 } },
              regime: { technocracy: 1 },
            },
          },
        },
        {
          id: 'budget',
          label: 'Exempt the civil service from this year\'s budget cuts.',
          hint: 'Cost: $0.3B a day for 6 days. The decrees move. The unions ask why civil servants got protected first.',
          outcome: {
            text: 'The exemption is announced. The decrees clear review in a single afternoon, all ten of them.',
            tone: 'mixed',
            effects: {
              stats: { power: 5 },
              commitments: [{ label: 'Civil service spared from cuts', perDay: 0.3, days: 6 }],
              factions: { grey: { loyalty: 8 }, combine: { loyalty: -3 } },
              characters: { grebs: { loyalty: 10, plotting: -12 } },
            },
          },
        },
        {
          id: 'remove',
          label: 'Replace her with someone who signs things.',
          hint: 'Free. The new Permanent Secretary signs everything. Nobody knows where anything is.',
          outcome: {
            text: 'Grebs locks her room on the way out and takes the only key. Her replacement signs your decrees within the hour. Three of them contradict each other.',
            tone: 'bad',
            effects: {
              stats: { power: 3, economy: -4, stability: -3 },
              factions: { grey: { loyalty: -10 } },
              hidden: { fiscal: 5 },
              removeFromPost: [{ who: 'grebs', reason: 'replaced for stalling the Chair\'s decrees' }],
            },
          },
        },
        {
          id: 'ignore',
          label: 'Wait her out.',
          hint: 'Free. Nothing you sign happens for a while.',
          outcome: {
            text: 'The decrees stay under review. The civil service has outlasted nine governments by doing exactly this.',
            tone: 'bad',
            effects: {
              stats: { power: -6 },
              characters: { grebs: { plotting: 6 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-grebs',
      title: 'Grebs Offers to Clear the Backlog',
      category: 'decision',
      actor: 'grebs',
      faction: 'grey',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Grebs has a list of 214 permits, contracts and appointments waiting for signatures across the ministries. Some have waited two years.\n\nShe can clear them all by Friday. She wants one thing: a written promise that you will not reorganise the ministries this year.',
      options: [
        {
          id: 'promise',
          label: 'Give her the written promise.',
          hint: 'Free. The country starts working a little faster. You lose the option to shake up the ministries.',
          outcome: {
            text: '214 things are signed by Friday. Two factories open. A bridge gets its permit. Grebs files your promise in the room only she has the key to.',
            tone: 'good',
            effects: {
              stats: { economy: 4, power: 2 },
              factions: { grey: { loyalty: 6 } },
              characters: { grebs: { loyalty: 5, influence: 5 } },
              flags: { noMinistryReorg: 1 },
              regime: { technocracy: 2 },
            },
          },
        },
        {
          id: 'spoken',
          label: 'Promise it out loud, not in writing.',
          hint: 'Free. Half the backlog moves. Grebs does not work for spoken promises.',
          outcome: {
            text: 'She clears exactly half the list. "The other half," she says, "will clear when I have something to file."',
            tone: 'mixed',
            effects: {
              stats: { economy: 2 },
              characters: { grebs: { trust: -3 } },
            },
          },
        },
        {
          id: 'no',
          label: 'Decline. You may need to reorganise.',
          hint: 'Free. The backlog stays. Grebs is not surprised.',
          outcome: {
            text: '"Then the backlog will wait," she says, "as it always has." It does.',
            tone: 'neutral',
            effects: {
              characters: { grebs: { loyalty: -4 } },
            },
          },
        },
      ],
    },
  },

  /* -------------------------------------------------------------- Tern */
  {
    character: 'tern',
    warning: 'Tern\'s handwritten notes after meetings have stopped arriving.',
    betrayal: {
      id: 'char-betray-tern',
      title: 'The Capital Garrison Rehearsed Something at Night',
      category: 'security',
      actor: 'tern',
      faction: 'staff',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'At three this morning, two companies of the capital garrison practised "securing key buildings". The key buildings included the broadcasting centre, the airport and this one.\n\nCommander Tern ordered the exercise himself. It was not on any schedule you have seen. He has sent a handwritten note calling it "routine".',
      options: [
        {
          id: 'split',
          label: 'Split the garrison. Put half under the Sable Office.',
          hint: 'Free. It makes a night move much harder. The army sees it as an insult.',
          outcome: {
            text: 'The order goes out at noon. Tern complies within the hour, which is somehow more worrying than if he had argued. Varkov asks for a meeting.',
            tone: 'mixed',
            effects: {
              hidden: { coup: -10 },
              factions: { staff: { loyalty: -6 }, sable: { loyalty: 4 } },
              characters: { tern: { plotting: -8, fear: 10 }, varkov: { loyalty: -4 } },
            },
          },
        },
        {
          id: 'promote',
          label: 'Promote him to a desk job with a bigger title.',
          hint: 'Free. He leaves the garrison. He also gets a bigger office and more friends.',
          outcome: {
            text: 'Tern becomes Deputy Chief of Defence Planning. He thanks you in a handwritten note. The garrison gets a new commander who has never met anyone important.',
            tone: 'mixed',
            effects: {
              hidden: { coup: -6 },
              stats: { military: -3 },
              characters: { tern: { influence: 6, plotting: -6 } },
              removeFromPost: [{ who: 'tern', reason: 'moved from the capital garrison to a planning post' }],
            },
          },
        },
        {
          id: 'arrest',
          label: 'Arrest him.',
          hint: 'Free. Decisive. The garrison may not agree with your decision.',
          outcome: {
            text: 'He is arrested at breakfast by Sable Office officers. Two of his captains refuse orders for four hours before standing down. Four hours is a long time.',
            tone: 'bad',
            effects: {
              stats: { military: -6, stability: -4 },
              hidden: { coup: 6, fear: 8 },
              factions: { staff: { loyalty: -10 } },
              removeFromPost: [{ who: 'tern', reason: 'arrested after an unscheduled night exercise' }],
              regime: { repression: 2 },
              flags: { peopleJailed: 1 },
            },
          },
        },
        {
          id: 'ignore',
          label: 'Accept the note. It was routine.',
          hint: 'Free. Next time it is a little less of a rehearsal.',
          outcome: {
            text: 'You file the note. The next exercise is scheduled, officially, for the week of the confidence vote.',
            tone: 'bad',
            effects: {
              hidden: { coup: 12 },
              characters: { tern: { plotting: 10 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-tern',
      title: 'Tern Offers a Personal Guard',
      category: 'security',
      actor: 'tern',
      faction: 'staff',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Commander Tern wants to give you a personal guard: sixty hand-picked soldiers from the capital garrison, loyal to you and only you.\n\n"Every Chair should have people who will stand in a doorway for them," he says. They would, of course, be his hand-picked soldiers.',
      options: [
        {
          id: 'accept',
          label: 'Accept the guard.',
          hint: 'Cost: $0.2B a day for 6 days. You feel safer. Tern knows exactly where you are, at all times.',
          outcome: {
            text: 'Sixty soldiers in new uniforms appear in the corridors. They salute you crisply. Each one reports to Tern at the end of every shift.',
            tone: 'mixed',
            effects: {
              stats: { security: 5 },
              commitments: [{ label: 'The Chair\'s personal guard', perDay: 0.2, days: 6 }],
              characters: { tern: { loyalty: 6, influence: 8 } },
              regime: { militarism: 2 },
            },
          },
        },
        {
          id: 'sable',
          label: 'Accept, but let the Sable Office choose the soldiers.',
          hint: 'Cost: $0.2B a day for 6 days. Safer and less his. Tern hides his disappointment well.',
          outcome: {
            text: 'Sarran picks sixty names. Tern signs the order with a smile that does not reach anywhere. You feel safer. He feels watched.',
            tone: 'good',
            effects: {
              stats: { security: 4 },
              hidden: { coup: -4 },
              commitments: [{ label: 'The Chair\'s personal guard', perDay: 0.2, days: 6 }],
              characters: { tern: { loyalty: -3 }, sarran: { loyalty: 3 } },
            },
          },
        },
        {
          id: 'no',
          label: 'Decline. The building has enough soldiers in it.',
          hint: 'Free. Tern is gracious about it, in writing.',
          outcome: {
            text: 'A handwritten note arrives that afternoon: "Of course. The offer stands." It is signed, dated, and, you assume, copied.',
            tone: 'neutral',
            effects: {
              characters: { tern: { loyalty: -3 } },
            },
          },
        },
      ],
    },
  },

  /* -------------------------------------------------------------- Vask */
  {
    character: 'vask',
    warning: 'Vask has started saying he "would want to reflect" on everything your office sends him.',
    betrayal: {
      id: 'char-betray-vask',
      title: 'Vask Called Your Government "a Season That Will Pass"',
      category: 'person',
      actor: 'vask',
      faction: 'provinces',
      tags: ['character-event', 'betrayal'],
      base: 0,
      weight: never,
      once: true,
      body:
        'In Sunday\'s sermon, broadcast to all six regions, Petru Vask said the country was "in a hard season, and seasons pass". He did not name you. Everyone understood.\n\nFor a man who never says no, it is the clearest no he has ever given.',
      options: [
        {
          id: 'visit',
          label: 'Visit the shrine and ask for his blessing in person.',
          hint: 'Free. Humble. He may give it, in words vague enough to mean anything.',
          outcome: {
            text: 'You kneel. He blesses you. The blessing mentions "patience" four times. Both sides quote it by evening.',
            tone: 'mixed',
            effects: {
              stats: { legitimacy: 2 },
              factions: { provinces: { loyalty: 4 } },
              characters: { vask: { plotting: -10, loyalty: 6 } },
            },
          },
        },
        {
          id: 'grant',
          label: 'Restore the Communion\'s state grant.',
          hint: 'Cost: $1.0B. The next sermon is about gratitude. The capital thinks you bought a priest.',
          outcome: {
            text: 'The grant is restored. The next sermon is about "the blessing of good government". The capital\'s newspapers print the two sermons side by side.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -1, legitimacy: 1 },
              factions: { provinces: { loyalty: 6 }, chorus: { loyalty: -3 } },
              characters: { vask: { loyalty: 10, plotting: -12 } },
            },
          },
        },
        {
          id: 'tax',
          label: 'Announce a review of church land taxes.',
          hint: 'Free. It hurts him. It also makes you the Chair who attacked the church.',
          outcome: {
            text: 'The review is announced. Vask\'s next sermon is about "the persecuted". Four regions ring their bells at noon for a week.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -4, treasury: 1 },
              hidden: { separatism: 6, unrest: 3 },
              factions: { provinces: { loyalty: -8 } },
              characters: { vask: { fear: 6, plotting: 4 } },
            },
          },
        },
        {
          id: 'ignore',
          label: 'Ignore it. It was a sermon.',
          hint: 'Free. The provinces heard it. They are waiting to see what you do.',
          outcome: {
            text: 'You do nothing. In the provinces, that is read as agreement that the season will pass.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -3 },
              hidden: { separatism: 5 },
              factions: { provinces: { loyalty: -4 } },
            },
          },
        },
      ],
    },
    offer: {
      id: 'char-offer-vask',
      title: 'Vask Offers Church Land to Landless Farmers',
      category: 'policy',
      actor: 'vask',
      faction: 'provinces',
      tags: ['character-event', 'offer'],
      base: 0,
      weight: never,
      once: true,
      body:
        'Vask wants to lease 30,000 hectares of Communion land to landless farmers in the Kordiva Basin, at almost no rent. He would like the government to announce it with him.\n\nThe big landowners who rent that land now will lose it. Several of them are friends of Adamek.',
      options: [
        {
          id: 'announce',
          label: 'Announce it together, on the shrine steps.',
          hint: 'Free. The countryside loves it. The landowners and their friends in the capital do not.',
          outcome: {
            text: 'Four thousand families get land. The photographs of you and Vask on the steps are on every regional front page. Adamek cancels a lunch.',
            tone: 'good',
            effects: {
              stats: { support: 4, legitimacy: 3 },
              hidden: { separatism: -5 },
              factions: { provinces: { loyalty: 8 }, concord: { loyalty: -5 } },
              characters: { vask: { loyalty: 6 }, adamek: { loyalty: -4 } },
              regime: { reform: 2 },
            },
          },
        },
        {
          id: 'quiet',
          label: 'Support it quietly. Let Vask take the credit.',
          hint: 'Free. The land still moves. You avoid the landowners\' anger, and the farmers\' thanks.',
          outcome: {
            text: 'Vask announces it alone. The farmers thank the church. The landowners blame the church. Everyone is correct.',
            tone: 'mixed',
            effects: {
              stats: { support: 1 },
              hidden: { separatism: -3 },
              characters: { vask: { loyalty: 2, influence: 5 } },
            },
          },
        },
        {
          id: 'block',
          label: 'Ask him to wait until after the confidence vote.',
          hint: 'Free. No one is angry today. Vask would want to reflect on that.',
          outcome: {
            text: '"I would want to reflect on that," says Vask. The land stays where it is. So do the farmers.',
            tone: 'neutral',
            effects: {
              characters: { vask: { loyalty: -4, trust: -3 } },
            },
          },
        },
      ],
    },
  },
];

/** Every character-event card — betrayals, offers and (balance slice A)
 *  the everyday requests in characterRequests.ts — for engine.ts's registries. */
export const CHARACTER_EVENT_CARDS: CardDef[] = [
  ...CHARACTER_EVENTS.flatMap((e) => [e.betrayal, e.offer]),
  ...CHARACTER_REQUESTS,
];

export const CHARACTER_EVENT_MAP: Record<string, CharacterEventDef> = Object.fromEntries(
  CHARACTER_EVENTS.map((e) => [e.character, e]),
);

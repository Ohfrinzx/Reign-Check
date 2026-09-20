import type { CardDef } from '../types';

/** Second tranche of standard cards. Same authoring rules as cards.ts. */
export const CARDS2: CardDef[] = [

{
  id: 'cabinet-vacancy',
  once: true,
  title: 'The Interior Ministry Is Empty',
  category: 'decision',
  faction: 'grey',
  stages: ['government', 'politics'],
  base: 8,
  minDay: 1,
  weight: (s) => 7 + (50 - s.stats.power) * 0.12,
  body:
    'The Interior Minister resigned on Tuesday citing his health, which around here means either his health or a phone call.\n\nInterior runs the police, the provincial administration and the electoral register. It is the third most important job in the country and nobody outside this building can name who holds it.\n\nThere are three names on your desk.',
  flavor: 'Interior runs the police, the provinces, and the electoral register.',
  options: [
    {
      id: 'grebs-pick',
      label: 'Grebs\'s candidate: a career official nobody has heard of.',
      hint: 'Free. Competent, procedural, dull. Interior will run properly and answer to the civil service.',
      outcome: {
        text:
          'He is sworn in on Thursday and by Monday has already found $400 million of duplicated provincial payments.\n\nGrebs does not thank you. Grebs never thanks anyone. But the ministries move a little faster for you now.',
        tone: 'good',
        effects: {
          stats: { power: +3, treasury: +2, security: +3, information: +5, legitimacy: +3 },
          hidden: { corruption: -7 },
          regime: { technocracy: +12 },
          factions: { grey: { loyalty: +10, influence: +5 }, provinces: { loyalty: -3 }, concord: { loyalty: -3 } },
          characters: { grebs: { loyalty: +9, influence: +6 }, doran: { loyalty: -3 }, adamek: { loyalty: -4 } },
          remember: [{ who: 'grebs', text: 'You took her candidate for Interior.', weight: 2 }],
        },
      },
    },
    {
      id: 'loyalist',
      label: 'Someone who owes you personally. Competence secondary.',
      hint: 'Free. Interior becomes yours. It also becomes worse at its job.',
      outcome: {
        text:
          'She is loyal, grateful and out of her depth. That combination works perfectly for about six weeks.\n\nThe police answer to you in a way they did not last month. So does the electoral register, which several people notice without saying anything.',
        tone: 'mixed',
        effects: {
          stats: { power: +8, security: +2, legitimacy: -6, information: -4 },
          hidden: { fear: +6, corruption: +7 },
          regime: { personalism: +13, patronage: +8 },
          factions: { grey: { loyalty: -7, patience: -6 }, chorus: { loyalty: -6 }, sable: { loyalty: +3 } },
          characters: { grebs: { loyalty: -7, trust: -5 }, sarran: { loyalty: +3 } },
          schedule: [{ inDays: 6, visible: false, label: 'Interior is out of its depth', effects: { stats: { security: -5, information: -3 }, hidden: { unrest: +5 } } }],
        },
      },
    },
    {
      id: 'adamek-pick',
      label: 'Adamek\'s name, and the $6B that arrives with it.',
      hint: 'Gains $6.0B. A businessman now controls the police and the electoral register.',
      outcome: {
        text:
          'The money clears before the appointment is even announced.\n\nThe new minister is genuinely good at the job — good for whoever is paying him, which for now is you.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +6, power: -3, legitimacy: -6, security: +4, economy: +2 },
          hidden: { corruption: +16, leak: +5 },
          regime: { graft: +15, patronage: +9 },
          factions: { concord: { loyalty: +11, influence: +8 }, grey: { loyalty: -8 }, chorus: { loyalty: -6 } },
          characters: { adamek: { loyalty: +11, influence: +9 }, grebs: { loyalty: -8, trust: -6 } },
          scandal: { name: 'The Interior appointment', detail: 'A ministry running the electoral register, chosen by a man who has never stood for election.', heat: 28 },
        },
      },
    },
  ],
},

{
  id: 'sable-budget',
  once: true,
  title: 'A Budget Line Nobody Sees',
  category: 'security',
  actor: 'sarran',
  faction: 'sable',
  stages: ['government'],
  base: 7,
  minDay: 1,
  weight: (s) => 6 + s.hidden.fear * 0.12 + (50 - s.factions.sable.loyalty) * 0.1,
  body:
    'Director Sarran wants a budget line that does not appear in the accounts laid before parliament.\n\n"$3 billion. It pays for the things that cannot be paid for openly, which are the things that have kept every government in this building alive since 1979." A pause. "Your predecessor approved it for nineteen years. I am telling you it exists because you are entitled to be the first person not to."',
  flavor: '$3 billion, off the books, since 1979.',
  options: [
    {
      id: 'approve',
      label: 'Approve it. Ask nothing about what it pays for.',
      hint: 'Cost: $3.0B a year, off the books. The Office gets better and less accountable at the same time.',
      outcome: {
        text:
          'She thanks you once, and the line goes into a schedule that is shown to nobody.\n\nWithin a week the daily intelligence summary is noticeably better. Within a month you will notice you no longer know why it got better.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -3, security: +10, information: +7, legitimacy: -4 },
          hidden: { fear: +8, coup: -6, leak: -6, corruption: +6 },
          regime: { repression: +14 },
          factions: { sable: { loyalty: +12, power: +7, influence: +6 }, chorus: { loyalty: -4 }, grey: { loyalty: -5 } },
          characters: { sarran: { loyalty: +11, influence: +8 }, grebs: { trust: -4 } },
          commitments: [{ label: 'Unlisted security budget', perDay: 0.12 }],
          schedule: [{ inDays: 7, visible: false, label: 'The Office spends its unexamined money', effects: { stats: { security: +4, information: +3 }, hidden: { fear: +6 } } }],
        },
      },
    },
    {
      id: 'approve-audit',
      label: 'Approve it, but you personally review the ledger every month.',
      hint: 'Cost: $3.0B. You keep the capability and the knowledge. She keeps neither entirely.',
      outcome: {
        text:
          '"Every month," she repeats. "Very well."\n\nThe first ledger arrives on the 30th. It is complete, legible, and the single most alarming document you have ever read.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -3, security: +7, information: +12, power: +5, legitimacy: -2 },
          hidden: { fear: +4, coup: -4 },
          regime: { repression: +8, technocracy: +7 },
          factions: { sable: { loyalty: +3, patience: -6 } },
          characters: { sarran: { loyalty: -3, trust: +9, fear: +7 } },
          commitments: [{ label: 'Security budget (reviewed)', perDay: 0.12 }],
          remember: [{ who: 'sarran', text: 'You took the secret budget line and then asked to read it.', weight: 1 }],
          schedule: [{ inDays: 5, visible: true, label: 'The first Sable ledger arrives', effects: { stats: { information: +6 }, hidden: { scandal: +6 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. Everything the Office spends goes in the public accounts.',
      hint: 'Saves $3.0B and is genuinely unprecedented. They will find the money another way.',
      outcome: {
        text:
          '"As you wish, {sir}." She does not argue.\n\nThe accounts are published, the press is astonished, and the Aureth Union sends a letter. Three weeks later the Office\'s capabilities are exactly what they were and nobody can explain where the money came from.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +11, security: -5, information: -4 },
          hidden: { fear: -7, corruption: +9, leak: +6 },
          regime: { reform: +13 },
          factions: { sable: { loyalty: -10, patience: -9 }, chorus: { loyalty: +10 }, grey: { loyalty: +6 } },
          characters: { sarran: { loyalty: -9, plotting: +8 }, vel: { trust: +7 } },
          news: ['SECURITY BUDGET PUBLISHED IN FULL FOR FIRST TIME SINCE 1979'],
          schedule: [{ inDays: 6, visible: false, label: 'Nobody can explain where the money came from', effects: { hidden: { corruption: +9, leak: +5 } } }],
        },
      },
    },
  ],
},

{
  id: 'power-cuts',
  title: 'Gas Is 11% Short',
  category: 'economy',
  stages: ['development', 'government'],
  base: 7,
  minDay: 1,
  weight: (s) => 6 + Math.max(0, 48 - s.stats.economy) * 0.25 + s.hidden.fiscal * 0.12,
  body:
    'Gas came in eleven per cent under contract and the cold snap in Gorsk has another nine days to run.\n\nSomething has to be rationed. The grid engineers have brought three plans and a pot of extremely bad coffee, and they are standing rather than sitting, which means they expect this to be quick.',
  flavor: 'Gas is 11% short. Nine days of cold remain.',
  options: [
    {
      id: 'industry',
      label: 'Ration industry. Keep the houses warm.',
      hint: 'Free, popular and humane. Costs the economy a week of output and the banks will say so.',
      outcome: {
        text:
          'Every home in the country stays warm and the Free Zone smelters run at forty per cent for nine days.\n\nThe Concord\'s letter of complaint is four pages and the first three are about the principle of the thing.',
        tone: 'good',
        effects: {
          stats: { support: +8, stability: +6, economy: -6, treasury: -1 },
          hidden: { unrest: -8 },
          regime: { populism: +9 },
          factions: { combine: { loyalty: +7 }, provinces: { loyalty: +5 }, concord: { loyalty: -9, patience: -7 } },
          characters: { adamek: { loyalty: -7 }, hess: { loyalty: +6 } },
          news: ['HOMES PRIORITISED IN GAS SHORTAGE; SMELTERS CUT TO FORTY PER CENT'],
        },
      },
    },
    {
      id: 'homes',
      label: 'Ration households. Keep industry running.',
      hint: 'Protects output and the treasury. Cold houses in a country that keeps score.',
      outcome: {
        text:
          'Rolling four-hour cuts to households, starting in the provinces because that is where the grid is weakest.\n\nThe Concord is delighted. Kordiva is in the dark.',
        tone: 'bad',
        effects: {
          stats: { support: -11, stability: -7, economy: +5, treasury: +2 },
          hidden: { unrest: +14, separatism: +8 },
          regime: { technocracy: +6 },
          factions: { concord: { loyalty: +9 }, provinces: { loyalty: -11 }, combine: { loyalty: -8 } },
          characters: { adamek: { loyalty: +7 }, kostyn: { loyalty: -8, plotting: +6 } },
          news: ['ROLLING POWER CUTS BEGIN IN THE PROVINCES'],
          schedule: [{ inDays: 4, visible: true, label: 'Nine days of cuts in the farm belt', effects: { hidden: { unrest: +8, separatism: +6 }, stats: { support: -4 } } }],
        },
      },
    },
    {
      id: 'buy',
      label: 'Buy gas on the open market at whatever it costs.',
      hint: 'Cost: $9.0B. Nobody gets rationed. Ostrene sets the price and learns what cold is worth to you.',
      outcome: {
        text:
          'Nobody in the country notices anything at all.\n\nThe Ostrene trading desk is delighted to help. Their price is not friendly, and they now know exactly how cold it has to get before Velmorra will pay anything.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -9, support: +3, stability: +3, economy: +2 },
          hidden: { fiscal: +11, foreign: +8 },
          factions: { all: { loyalty: +1 }, concord: { loyalty: +3 } },
          schedule: [{ inDays: 6, visible: false, label: 'Ostrene knows what cold is worth to you', effects: { hidden: { foreign: +7 } } }],
        },
      },
    },
  ],
},

{
  id: 'honours-list',
  once: true,
  title: 'The Honours List',
  category: 'opportunity',
  stages: ['politics'],
  base: 6,
  minDay: 2,
  weight: () => 6,
  body:
    'The country decorates forty people a year. It is entirely symbolic, costs about $20 million in medals, and is followed with an intensity that baffles every foreign diplomat who has tried to explain it home.\n\nThe list is drafted. There is room for one name that will be read as a statement, and everyone in the building knows which slot that is.',
  flavor: 'Krast once gave a medal to a man purely to see what his rival would do. It worked.',
  options: [
    {
      id: 'hess',
      label: 'Decorate Bogdan Hess for fifty years of the Gorsk mines.',
      hint: 'Free. The unions will be astonished. The banks will be furious. Both are useful.',
      outcome: {
        text:
          'Hess accepts it on stage in a suit he has clearly borrowed and says eleven words: "This is for the men who did not come up."\n\nIt is the most-watched thirty seconds of the year. Adamek attends. Adamek applauds. Adamek does not speak to you afterwards.',
        tone: 'good',
        effects: {
          stats: { support: +7, legitimacy: +5, stability: +4 },
          hidden: { unrest: -8 },
          regime: { populism: +8 },
          factions: { combine: { loyalty: +12 }, concord: { loyalty: -6 }, chorus: { loyalty: +4 } },
          characters: { hess: { loyalty: +12, trust: +9 }, adamek: { loyalty: -5 } },
          remember: [{ who: 'hess', text: 'You decorated him for the mines.', weight: 3 }],
          news: ['"THIS IS FOR THE MEN WHO DID NOT COME UP"'],
        },
      },
    },
    {
      id: 'varkov',
      label: 'Decorate General Varkov.',
      hint: 'Free. The army is pleased and becomes, in the public mind, a bit more central than you.',
      outcome: {
        text:
          'She accepts it correctly and thanks the country rather than you.\n\nThe officer corps is delighted. Three newspapers run profiles of her. One uses the phrase "the steadiest hand in the country."',
        tone: 'mixed',
        effects: {
          stats: { military: +8, power: -2, legitimacy: +2 },
          hidden: { coup: -5 },
          regime: { militarism: +10 },
          factions: { staff: { loyalty: +10 }, chorus: { loyalty: -4 } },
          characters: { varkov: { loyalty: +9, influence: +8 } },
          schedule: [{ inDays: 6, visible: false, label: '"The steadiest hand in the country"', effects: { characters: { varkov: { influence: +6 } }, stats: { power: -3 } } }],
        },
      },
    },
    {
      id: 'pigeons',
      label: 'Decorate the Pigeon Federation\'s oldest living champion.',
      hint: 'Free. Absurd, beloved, and offends absolutely nobody.',
      outcome: {
        text:
          'She is ninety-one, she raced birds through two coups and a currency reform, and she gives a fourteen-minute acceptance speech covering the 1974 season in detail.\n\nThe country adores it. 400,000 Federation members adore it. Three of your ministers privately call it the best political decision you have made.',
        tone: 'good',
        effects: {
          stats: { support: +9, legitimacy: +3, stability: +3 },
          hidden: { unrest: -6, cult: +5 },
          regime: { populism: +10 },
          factions: { all: { loyalty: +2 }, provinces: { loyalty: +4 }, combine: { loyalty: +3 } },
          flags: { pigeonFriend: 1 },
          news: ['NATION TRANSFIXED BY FOURTEEN-MINUTE ACCOUNT OF THE 1974 SEASON'],
        },
      },
    },
    {
      id: 'self',
      label: 'Put yourself on the list.',
      hint: 'Free. Nobody can stop you. Everybody will notice.',
      outcome: {
        text:
          'It is entirely within your power. You award it to yourself in a ceremony that is, by prior arrangement, brief.\n\nChannel Seven covers it warmly. Everyone else covers it in a tone that is technically neutral and unmistakably delighted.',
        tone: 'bad',
        effects: {
          stats: { support: -7, legitimacy: -9, power: +3 },
          hidden: { cult: +18, fear: +4 },
          regime: { personalism: +20 },
          factions: { chorus: { loyalty: -11 }, grey: { loyalty: -6 }, staff: { loyalty: -4 } },
          characters: { doran: { trust: -6 }, vel: { influence: +7 } },
          news: ['CHAIR AWARDS SELF NATIONAL HONOUR'],
          schedule: [{ inDays: 5, visible: false, label: 'The medal is still being mentioned', effects: { stats: { legitimacy: -4 }, hidden: { cult: +6 } } }],
        },
      },
    },
  ],
},

{
  id: 'vel-debate',
  once: true,
  title: 'She Has Challenged You to a Debate',
  category: 'decision',
  actor: 'vel',
  faction: 'chorus',
  stages: ['afternoon', 'politics'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + s.characters.vel.influence * 0.1 + Math.max(0, 50 - s.stats.legitimacy) * 0.1,
  body:
    'Sanna Vel has challenged you to ninety minutes, live, no moderator, no agreed questions.\n\nShe announced it on her walk to work, to two hundred thousand people, so the challenge is already a fact whatever you do about it.\n\nShe is thirty-four, a constitutional lawyer, and has never been caught out on a detail.',
  flavor: 'No Velmorran head of state has debated an opponent since 1961. The 1961 one lost.',
  options: [
    {
      id: 'accept',
      label: 'Accept. Ninety minutes, no conditions.',
      hint: 'Free and enormously risky. If it goes well it buys you something money cannot.',
      outcome: (s, rng) => {
        const win = rng.chance(0.35 + s.stats.legitimacy / 250 + s.stats.information / 300);
        return win
          ? {
              text:
                'It is the most-watched broadcast in the country\'s history and you do not win it. Nobody wins ninety minutes against a constitutional lawyer.\n\nBut you turn up, you answer, you concede two points because they are correct, and at minute seventy-one you say "I don\'t know" about the Krast file.\n\nThat is the clip. Nobody has heard a head of state say that in living memory.',
              tone: 'good',
              effects: {
                stats: { legitimacy: +16, support: +9, power: +4 },
                hidden: { unrest: -10, cult: -5 },
                regime: { reform: +14 },
                factions: { chorus: { loyalty: +14 }, grey: { loyalty: +6 }, combine: { loyalty: +5 }, sable: { loyalty: -5 } },
                characters: { vel: { loyalty: +7, trust: +12, influence: +6 }, sarran: { loyalty: -4 } },
                news: ['"I DON\'T KNOW" — MINUTE SEVENTY-ONE'],
              },
            }
          : {
              text:
                'It is the most-watched broadcast in the country\'s history and she takes you apart in the first twenty minutes over the payroll figures, which you had, and had read, and could not recall under studio lights.\n\nThe remaining seventy minutes are technically a debate.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -12, support: -11, power: -6 },
                hidden: { unrest: +10 },
                factions: { chorus: { loyalty: -6 }, grey: { loyalty: -4 } },
                characters: { vel: { influence: +16 }, doran: { trust: -4 } },
                news: ['NINETY MINUTES'],
              },
            };
      },
    },
    {
      id: 'conditions',
      label: 'Accept, with a moderator and agreed topics.',
      hint: 'Free and safer. Everyone can see it is safer, including the 200,000 people watching.',
      outcome: {
        text:
          'Negotiating the conditions takes nine days and is reported daily by everyone.\n\nBy the time the debate happens it is forty minutes long, extremely polite, and the most discussed thing about it is the negotiation.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +2, support: -2 },
          hidden: { unrest: +2 },
          factions: { chorus: { loyalty: -3 } },
          characters: { vel: { influence: +6, trust: -3 } },
        },
      },
    },
    {
      id: 'decline',
      label: 'Decline. The office does not debate.',
      hint: 'Free, defensible, traditional, and exactly what she expected you to say.',
      outcome: {
        text:
          'Your office issues a statement about the dignity of the position.\n\nVel does the ninety minutes anyway, alone, with an empty chair, answering the questions she would have asked you. By general agreement it is better television than a debate would have been.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -8, support: -6 },
          hidden: { unrest: +8, cult: -4 },
          factions: { chorus: { loyalty: -10 }, sable: { loyalty: +3 } },
          characters: { vel: { influence: +13, loyalty: -4 } },
          news: ['NINETY MINUTES WITH AN EMPTY CHAIR'],
        },
      },
    },
  ],
},

{
  id: 'hadem-census',
  once: true,
  title: 'Question 9 on the Census Form',
  category: 'policy',
  faction: 'provinces',
  stages: ['government', 'development'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + s.hidden.separatism * 0.2,
  body:
    'The ten-yearly census goes to print in eleven days and the civil service needs a decision on Question 9.\n\nQuestion 9 asks what language you speak at home. It has not been asked since 1994, when the answer was inconvenient. If it is asked, the country will officially learn how many Hadeni speakers live in the border region.\n\nNobody in this building knows the real number. Several people have guesses they will not say out loud.',
  flavor: 'Question 9 has not been asked since 1994.',
  options: [
    {
      id: 'ask',
      label: 'Ask the question. Publish whatever comes back.',
      hint: 'Free, honest and modern. It may also hand the region a number to point at forever.',
      outcome: (_s, rng) => {
        const pct = 9 + rng.int(9);
        return {
          text: `The question is asked. The answer is ${pct}% — well above the 1994 figure and, awkwardly, above every guess in this building.\n\nThe Hadem councils are delighted. Drovnan radio is ecstatic. The civil service, which now has real data for the first time in thirty years, quietly starts redesigning four public services around it. Over ten years that will matter far more than the headline.`,
          tone: 'mixed',
          effects: {
            stats: { legitimacy: +8, information: +11, stability: -3 },
            hidden: { separatism: +10, foreign: +4 },
            regime: { reform: +11, technocracy: +9, devolution: +7 },
            factions: { provinces: { loyalty: +7 }, grey: { loyalty: +7 }, chorus: { loyalty: +7 }, staff: { loyalty: -5 }, sable: { loyalty: -5 } },
            characters: { grebs: { loyalty: +7 }, varkov: { trust: -3 } },
            news: [`CENSUS: ${pct}% SPEAK HADENI AT HOME IN THE BORDER REGION`],
            schedule: [{ inDays: 6, visible: true, label: 'The border region has a number now', effects: { hidden: { separatism: +7 }, stats: { legitimacy: +3 } } }],
          },
        };
      },
    },
    {
      id: 'omit',
      label: 'Leave Question 9 off the form.',
      hint: 'Free. Nothing is learned and nothing is claimed. Everyone will know why.',
      outcome: {
        text:
          'The form goes to print with eight questions.\n\nThe Hadem councils run their own count with volunteers and publish it four months later. Because it is unofficial nobody can check it, and because nobody can check it everybody believes it.',
        tone: 'bad',
        effects: {
          stats: { information: -6, legitimacy: -5 },
          hidden: { separatism: +12, leak: +4 },
          regime: { repression: +6 },
          factions: { provinces: { loyalty: -8 }, chorus: { loyalty: -5 }, sable: { loyalty: +4 }, grey: { loyalty: -4 } },
          schedule: [{ inDays: 8, visible: true, label: 'The border region publishes its own count', effects: { hidden: { separatism: +10 }, stats: { legitimacy: -4 } } }],
        },
      },
    },
    {
      id: 'ask-hold',
      label: 'Ask it, then classify the result.',
      hint: 'Free. You will know. Nobody else will — except the twelve thousand people who collected it.',
      outcome: {
        text:
          'The question is asked and the answer is classified at the Sable Office\'s recommendation, which is to say at its insistence.\n\nYou now know the number. So do the twelve thousand census staff who collected it, one of whom will mention it to somebody within the next two years.',
        tone: 'mixed',
        effects: {
          stats: { information: +9, legitimacy: -4 },
          hidden: { separatism: +4, leak: +13, fear: +5 },
          regime: { repression: +11 },
          factions: { sable: { loyalty: +6 }, grey: { loyalty: -5 }, provinces: { loyalty: -4 } },
          characters: { sarran: { loyalty: +5 } },
          schedule: [{ inDays: 9, visible: false, label: 'One of twelve thousand people mentions it', effects: { hidden: { leak: +10, scandal: +8 } } }],
        },
      },
    },
  ],
},

{
  id: 'sereth-offer',
  once: true,
  title: 'Sereth Want to Buy the Port',
  category: 'foreign',
  stages: ['development', 'government'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + (s.stats.treasury < 35 ? 7 : 0),
  body:
    'Sereth would like to buy forty per cent of the Mavro container terminal, the naming rights to the national stadium, and Mavro Dockers FC.\n\nThe offer is $22 billion. There are no conditions and the paperwork is two pages. Their representative flew in this morning and would like to conclude today.\n\nSereth money arrives fast. What they want in return arrives later.',
  flavor: 'The offer is $22 billion. There are no conditions on paper.',
  options: [
    {
      id: 'all',
      label: 'Sell all three. Today.',
      hint: 'Gains $22.0B immediately, no conditions. That is what makes it frightening.',
      outcome: {
        text:
          'It clears on the Thursday, as advertised.\n\nMavro Dockers sign three very good players within a fortnight and win the league for the first time since 1988. It is extremely difficult to explain to anyone in Mavro why this is a problem.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +22, economy: +6, support: +5, legitimacy: -6, elite: +5 },
          hidden: { foreign: +12, corruption: +11, fiscal: -12 },
          regime: { graft: +10, isolation: +5 },
          factions: { concord: { loyalty: +9 }, combine: { loyalty: +5 }, chorus: { loyalty: -8 }, grey: { loyalty: -5 } },
          characters: { adamek: { loyalty: +6 }, hess: { loyalty: +4 }, grebs: { trust: -5 } },
          news: ['SERETH BUY INTO MAVRO PORT; DOCKERS SIGN THREE'],
          schedule: [{ inDays: 8, visible: true, label: 'Sereth explain what they want in return', cardId: 'sereth-expect' }],
        },
      },
    },
    {
      id: 'stadium',
      label: 'Sell the stadium and the football club. Keep the port.',
      hint: 'Gains $7.0B. Sensible, and slightly humiliating.',
      outcome: {
        text:
          'They take it without blinking, which suggests the port was the point and you have just been told so.\n\nThe stadium is renamed. Nobody in the country uses the new name. Everybody in the country knows the new name.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +7, economy: +2, support: -2, legitimacy: -2 },
          hidden: { foreign: +5, corruption: +4 },
          factions: { concord: { loyalty: +4 }, chorus: { loyalty: -3 } },
          news: ['NATIONAL STADIUM RENAMED; NOBODY USES THE NEW NAME'],
        },
      },
    },
    {
      id: 'none',
      label: 'Turn all of it down.',
      hint: 'Turns down $22.0B. The port stays Velmorran. So does the hole in the accounts.',
      outcome: {
        text:
          'The representative is gracious, leaves a gift that protocol requires you to log, and flies out the same afternoon.\n\nBrask wanted the money and said so, and files a note saying he wanted the money. Separately, off the record, he says it was the right call. That is the most Brask thing that has ever happened.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +7, treasury: -1, power: +3 },
          hidden: { foreign: +3, corruption: -5, fiscal: +6 },
          regime: { reform: +7 },
          factions: { chorus: { loyalty: +6 }, grey: { loyalty: +5 }, concord: { loyalty: -6 } },
          characters: { brask: { loyalty: +6, trust: +5 }, adamek: { loyalty: -5 } },
        },
      },
    },
  ],
},

{
  id: 'sereth-expect',
  title: 'What Sereth Want in Return',
  category: 'foreign',
  base: 0,
  weight: () => 0,
  body:
    'The Sereth representative is back. He is as pleasant as before and this time he has three pages.\n\nThey would like: a Velmorran vote at an international body that has never once mattered to Velmorra, an aviation agreement that costs you nothing, and the release of a man currently held by the Sable Office on charges nobody has ever seen.\n\nThe first two are free. The third is the point.',
  flavor: 'The first two requests are free. The third is a prisoner.',
  options: [
    {
      id: 'all',
      label: 'Give them all three.',
      hint: 'Free in money. The Sable Office will want to know who is running its prisons.',
      outcome: {
        text:
          'The vote is cast, the agreement is signed, and the man walks out of a facility that does not officially exist into a car that is not officially waiting.\n\nSarran does not object. She files a note. The note is one line long and consists entirely of the date.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: -6, security: -4, power: -3, treasury: +2 },
          hidden: { foreign: -8, corruption: +10, leak: +6 },
          regime: { graft: +9, isolation: +6 },
          factions: { sable: { loyalty: -9, patience: -8 }, concord: { loyalty: +5 }, chorus: { loyalty: -4 } },
          characters: { sarran: { loyalty: -8, trust: -6, plotting: +7 } },
          remember: [{ who: 'sarran', text: 'A foreign government asked for a prisoner and you handed him over.', weight: -3 }],
        },
      },
    },
    {
      id: 'two',
      label: 'Give the vote and the aviation deal. Keep the prisoner.',
      hint: 'Free. Splits the difference on the one thing they actually came for.',
      outcome: {
        text:
          '"Of course," he says, entirely pleasantly, and mentions on the way out that the port investment schedule is under review "in the normal way".\n\nIt was not under review before.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +2, economy: -3, treasury: -2 },
          hidden: { foreign: +7 },
          factions: { sable: { loyalty: +5 }, concord: { loyalty: -4 } },
          characters: { sarran: { loyalty: +5, trust: +4 } },
          schedule: [{ inDays: 5, visible: true, label: 'The port investment schedule, under review', effects: { stats: { economy: -4, treasury: -3 } } }],
        },
      },
    },
    {
      id: 'none',
      label: 'Refuse all three and say publicly why.',
      hint: 'Free. A very good speech, and a $22B investor who now knows what you are.',
      outcome: {
        text:
          'You describe the request on the record, in general terms, without naming the country. Everyone watching already knows which country you mean.\n\nThe country is briefly magnificent about it. Sereth suspend the remaining investment within a week, and the stadium keeps its new name, because they own that outright.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +12, support: +8, economy: -7, treasury: -5 },
          hidden: { foreign: +11, corruption: -8, fiscal: +8 },
          regime: { reform: +11, populism: +7 },
          factions: { chorus: { loyalty: +10 }, sable: { loyalty: +7 }, concord: { loyalty: -9 } },
          characters: { sarran: { loyalty: +7, trust: +7 }, adamek: { loyalty: -7 } },
          news: ['CHAIR DESCRIBES "A REQUEST WE TURNED DOWN", DECLINES TO NAME COUNTRY'],
        },
      },
    },
  ],
},

/* --------------------------------------------------------------- DAY ONE */

{
  id: 'old-cabinet',
  title: 'The Cabinet You Inherited',
  category: 'decision',
  actor: 'grebs',
  faction: 'grey',
  stages: ['government'],
  base: 8,
  minDay: 1,
  weight: (s) => 8 + s.hidden.corruption * 0.1,
  body:
    'Six of your ministers were appointed by your predecessor. None of them owe you anything, and all of them know their own ministry better than you do.\n\nGrebs puts a one-page list on your desk: who is competent, who is loyal to the old government, and who is both.\n\n"You can keep them, replace them, or wait. Every option tells the building something about you."',
  flavor: 'Six ministers. Krast chose all of them.',
  options: [
    {
      id: 'keep',
      label: 'Keep the cabinet exactly as it is.',
      hint: 'Free. Steady start. None of them owe their job to you.',
      outcome: {
        text:
          'Nothing changes on the surface. The ministries keep running the way they always have, which this week counts as an achievement.\n\nGrebs approves in her own quiet way: she stops bringing you memos about them.',
        tone: 'good',
        effects: {
          stats: { stability: +5, power: +1 },
          regime: { technocracy: +5 },
          factions: { grey: { loyalty: +6, patience: +4 } },
          characters: { grebs: { loyalty: +5, trust: +4 } },
        },
      },
    },
    {
      id: 'replace',
      label: 'Replace three of them with your own people.',
      hint: 'Free in money. Three ministries stop working properly while new appointees learn the job.',
      outcome: {
        text:
          'The three new ministers are loyal to you personally and understand almost nothing about their departments yet.\n\nGrebs says nothing about the decision. She says a great deal about the paperwork it generates.',
        tone: 'mixed',
        effects: {
          stats: { power: +6, information: -6, economy: -2 },
          hidden: { corruption: +4 },
          regime: { personalism: +9, patronage: +6 },
          factions: { grey: { loyalty: -8, patience: -6 } },
          characters: { grebs: { loyalty: -6, trust: -5 } },
          remember: [{ who: 'grebs', text: 'You replaced three ministers in your first week.', weight: -2 }],
        },
      },
    },
    {
      id: 'wait',
      label: 'Make no changes yet. Watch them work first.',
      hint: 'Free. You learn who is competent before you decide who is loyal.',
      outcome: {
        text:
          'You say nothing to any of them. Two ministers report to you unprompted within the week. Four do not.\n\nGrebs approves of patience. She has seen impatience end governments.',
        tone: 'good',
        effects: {
          stats: { information: +6 },
          factions: { grey: { loyalty: +3 } },
          characters: { grebs: { loyalty: +4, trust: +5 } },
        },
      },
    },
  ],
},

{
  id: 'first-address',
  title: 'Your First Address',
  category: 'decision',
  actor: 'doran',
  stages: ['politics', 'afternoon'],
  base: 7,
  minDay: 1,
  weight: () => 7,
  body:
    'The country has not heard your voice yet. Doran has booked ten minutes on every channel at 7pm, whether you use them or not.\n\n"They are not listening for policy," she says. "They are listening to find out what kind of person you are. You have ten minutes to show them, or they will decide it themselves."',
  flavor: 'Ten minutes, on every channel, tonight.',
  options: [
    {
      id: 'honest',
      label: 'Tell them the truth: you do not have a plan yet.',
      hint: 'Free. Honest, and untested leaders are not usually rewarded for saying so.',
      outcome: {
        text:
          'You say, plainly, that you took this job nine days ago and are still finding out what is in it.\n\nThe clip runs everywhere. Some of the country finds it refreshing. Some finds it alarming. Both reactions are about equally loud.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +7, support: -2 },
          regime: { reform: +7 },
          characters: { doran: { trust: +4 } },
        },
      },
    },
    {
      id: 'confident',
      label: 'Project total confidence. Promise stability.',
      hint: 'Free. Reassures people tonight with a promise you have not earned yet.',
      outcome: {
        text:
          'You speak for ten minutes about steady hands and continuity, and mean perhaps six of those minutes.\n\nSupport rises overnight. Nobody has actually been reassured about anything specific.',
        tone: 'mixed',
        effects: {
          stats: { support: +7, legitimacy: -2 },
          hidden: { cult: +3 },
          regime: { personalism: +6 },
        },
      },
    },
    {
      id: 'skip',
      label: 'Use the slot for a retrospective on your predecessor instead.',
      hint: 'Free. Safe, forgettable, and says nothing about you at all.',
      outcome: {
        text:
          'Ten minutes of Krast\'s old speeches run instead, with a short introduction from you at the start and end.\n\nNobody is offended. Nobody is impressed either.',
        tone: 'neutral',
        effects: {
          stats: { legitimacy: +1 },
          characters: { doran: { trust: -2 } },
        },
      },
    },
  ],
},

{
  id: 'welcome-gift',
  title: 'A Welcome Gift',
  category: 'opportunity',
  actor: 'adamek',
  faction: 'concord',
  stages: ['government', 'politics'],
  base: 7,
  minDay: 1,
  weight: (s) => 7 + (s.stats.treasury < 40 ? 5 : 0),
  body:
    'Adamek sends a card before he sends himself: congratulations on the office, and a $4 billion "infrastructure contribution" to the treasury, no conditions attached, no meeting requested.\n\nEveryone in this building has learned what an unconditional gift from Adamek is worth. It has never once turned out to be unconditional.',
  flavor: 'Rulf Adamek owns the port cranes, a bank, and a football club.',
  options: [
    {
      id: 'accept',
      label: 'Accept the money. Say thank you, nothing more.',
      hint: 'Gains $4.0B. Owed to a man who collects debts precisely.',
      outcome: {
        text:
          'The money clears the same day. Adamek sends no further message.\n\nHe does not need to send one. Everyone in the Free Zone already knows you took it.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +4 },
          hidden: { corruption: +6 },
          regime: { graft: +7 },
          factions: { concord: { loyalty: +7, influence: +4 } },
          characters: { adamek: { loyalty: +6, influence: +5 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Return the gift. Publicly.',
      hint: 'Turns down $4.0B. Costs him nothing and tells everyone where you stand.',
      outcome: {
        text:
          'Your office returns the money with a one-line statement about the appearance of impropriety.\n\nAdamek has been refused before, by people who later took the second offer.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +6 },
          hidden: { corruption: -4 },
          regime: { reform: +6 },
          factions: { concord: { loyalty: -4 }, chorus: { loyalty: +4 } },
          characters: { adamek: { loyalty: -3 } },
        },
      },
    },
    {
      id: 'redirect',
      label: 'Accept it, and put it toward Gorsk\'s back pay instead of general funds.',
      hint: 'Gains $4.0B, earmarked. Adamek notices what you spent his money on.',
      outcome: {
        text:
          'The money clears and is gone again within the week, into wages the mines were already owed.\n\nHess notices where it went before Adamek\'s office issues a single statement about it.',
        tone: 'good',
        effects: {
          stats: { treasury: +4, support: +4 },
          hidden: { corruption: +2 },
          factions: { concord: { loyalty: +2 }, combine: { loyalty: +6 } },
          characters: { adamek: { loyalty: +2 }, hess: { loyalty: +5, trust: +4 } },
        },
      },
    },
  ],
},

{
  id: 'state-funeral',
  title: 'Arrangements for Krast',
  category: 'decision',
  stages: ['government', 'development'],
  base: 6,
  minDay: 1,
  weight: () => 6,
  body:
    'Krast has been dead for nine days and has not yet been buried. The state funeral committee wants a decision on scale: a full state funeral with a public lying-in-state, or a private burial with a brief public notice.\n\nHis widow has not been consulted about either option. Nobody has thought to ask her.',
  flavor: 'Nine days dead. Not yet buried.',
  options: [
    {
      id: 'full',
      label: 'Full state funeral. Three days of public mourning.',
      hint: 'Cost: $2.0B. Nineteen years in office gets a send-off to match. You inherit the comparison.',
      outcome: {
        text:
          'The lying-in-state draws lines that stretch for blocks. Three days of coverage, all of it about Krast.\n\nBy the fourth day the coverage is still about Krast, and you are the person standing next to the coffin in every photograph.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -2, legitimacy: +4, stability: +3 },
          regime: { technocracy: +3 },
          factions: { all: { loyalty: +1 } },
        },
      },
    },
    {
      id: 'private',
      label: 'A private burial. A short public notice.',
      hint: 'Cost: $0.2B. Quick and cheap. Some people will call it disrespectful.',
      outcome: {
        text:
          'The burial is small and over by Tuesday. The public notice is four sentences long.\n\nA few commentators call it graceless. Most people have already moved on to asking what you intend to do about the helicopters, the payroll, or the weather.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -0.2, legitimacy: -3, stability: +1 },
        },
      },
    },
    {
      id: 'ask-widow',
      label: 'Ask his widow what she wants, and do that.',
      hint: 'Free. Costs you the chance to make it about you.',
      outcome: {
        text:
          'She asks for a quiet service and a single line in the gazette: "He served." Nothing else.\n\nYou grant it exactly as asked. It is the least political funeral this country has held in decades.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +6, support: +3 },
          regime: { reform: +4 },
        },
      },
    },
  ],
},

{
  id: 'hess-first-meeting',
  title: 'Hess Wants to Take Your Measure',
  category: 'person',
  actor: 'hess',
  faction: 'combine',
  stages: ['politics'],
  base: 7,
  minDay: 1,
  weight: (s) => 7 + (50 - s.factions.combine.loyalty) * 0.1,
  body:
    'Bogdan Hess has asked for twenty minutes. He is not bringing a demand, a list, or a lawyer — he says he just wants to see who he will be dealing with for the next few years.\n\nHe does not sit down. He never does. He says the chairs are a tactic.',
  flavor: 'Twenty-two years underground. Eighteen running the union.',
  options: [
    {
      id: 'listen',
      label: 'Give him the full twenty minutes. Let him talk.',
      hint: 'Free. Costs you time and nothing else. He remembers who listens.',
      outcome: {
        text:
          'He talks about the mines, his father, and a strike in 1994 that you were not alive for. He does not ask you for anything.\n\nHe shakes your hand on the way out. Doran later tells you he does not do that for everyone.',
        tone: 'good',
        effects: {
          stats: { support: +2 },
          factions: { combine: { loyalty: +6, patience: +4 } },
          characters: { hess: { loyalty: +6, trust: +6 } },
        },
      },
    },
    {
      id: 'brief',
      label: 'Give him ten minutes. You have a full schedule.',
      hint: 'Free. Efficient. He notices which of the twenty minutes you kept.',
      outcome: {
        text:
          'He finishes what he came to say in nine minutes and leaves on the tenth, exactly on time.\n\n"Efficient," he says, on his way out. It is not a compliment.',
        tone: 'mixed',
        effects: {
          factions: { combine: { patience: -3 } },
          characters: { hess: { trust: -2 } },
        },
      },
    },
    {
      id: 'reschedule',
      label: 'Reschedule. Today is full.',
      hint: 'Free today. He will remember being the one who got rescheduled.',
      outcome: {
        text:
          'Doran reschedules him for next month. Hess says that is fine.\n\nHe does not raise his voice about it. He does not raise it again, either — he simply remembers.',
        tone: 'bad',
        effects: {
          factions: { combine: { loyalty: -4, patience: -6 } },
          characters: { hess: { trust: -5 } },
        },
      },
    },
  ],
},

];

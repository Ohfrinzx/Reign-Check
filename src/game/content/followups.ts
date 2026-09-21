import type { CardDef } from '../types';

/**
 * Follow-up cards. Never drawn at random (weight 0) — they exist only because
 * an earlier decision scheduled them. This is the visible half of the
 * consequence engine.
 */
export const FOLLOWUPS: CardDef[] = [

{
  id: 'concord-response',
  title: 'Lunch, Without You',
  category: 'crisis',
  faction: 'concord',
  base: 0,
  weight: () => 0,
  body:
    'Eleven people had lunch in the Free Zone on Tuesday. Between them they own the port cranes, the cement, the banks and the football.\n\nNo agenda, no minutes. By Wednesday afternoon the currency had moved three per cent and two scheduled bond auctions were "postponed for technical reasons".\n\nAdamek has sent his regrets that he was unable to invite you.',
  flavor: 'The currency moved three per cent on Tuesday. Two bond auctions were postponed.',
  options: [
    {
      id: 'settle',
      label: 'Call Adamek and find out the price.',
      hint: 'Restores the money. Confirms in public who sets the terms.',
      outcome: {
        text:
          '"A misunderstanding," Adamek says warmly, and names a set of regulatory changes that are not individually outrageous. Together they put the Free Zone back exactly where it was, plus a little.\n\nThe currency recovers by Friday. Everyone agrees it was technical.',
        tone: 'mixed',
        effects: {
          stats: { economy: +5, treasury: +2, legitimacy: -6, power: -5 },
          hidden: { corruption: +12 },
          regime: { graft: +10, patronage: +6 },
          factions: { concord: { loyalty: +11, influence: +7 }, chorus: { loyalty: -5 }, grey: { loyalty: -4 } },
          characters: { adamek: { loyalty: +9, influence: +8 } },
        },
      },
    },
    {
      id: 'hold',
      label: 'Hold. Let the currency find its own level.',
      hint: 'Costs the economy real damage. Establishes that you cannot be moved by a lunch.',
      outcome: {
        text:
          'You say nothing for six days. It is the longest six days of your life so far and the exchange rate is on every front page.\n\nOn the seventh day the Concord starts buying, because eleven men who own the port also own a great deal of currency. The lesson is mutual and expensive.',
        tone: 'mixed',
        effects: {
          stats: { economy: -9, treasury: -4, power: +10, legitimacy: +6 },
          hidden: { corruption: -6, fiscal: +6 },
          regime: { reform: +8 },
          factions: { concord: { loyalty: -6, power: -6 }, combine: { loyalty: +7 }, chorus: { loyalty: +7 } },
          characters: { adamek: { loyalty: -5, fear: +9 }, brask: { trust: +6 } },
          news: ['CURRENCY STEADIES AFTER SIX DAYS; NOBODY EXPLAINS WHY'],
        },
      },
    },
    {
      id: 'nationalise',
      label: 'Seize the Mavro port concession.',
      hint: 'Gains $9.0B and the port. Crosses the Concord\'s stated red line permanently.',
      enabled: (s) => s.stats.power > 50 && s.stats.military > 45,
      lockedText: 'You would need the army behind you, and you do not have it.',
      outcome: {
        text:
          'Customs officers and two companies of military police take the container terminal at 5am. It goes smoothly, because taking things is always the easy part.\n\nBy noon four foreign banks have suspended Velmorran credit lines and Sereth have "paused" a $40 billion investment. By the evening you are the most popular you have ever been.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +9, economy: -14, support: +13, elite: -22, power: +6, legitimacy: -4 },
          hidden: { corruption: -14, foreign: +18, fiscal: +10 },
          regime: { populism: +14, repression: +10, isolation: +12 },
          factions: { concord: { loyalty: -30, power: -12, patience: -30 }, combine: { loyalty: +14 }, chorus: { loyalty: +3 }, staff: { loyalty: -4 } },
          characters: { adamek: { loyalty: -30, plotting: +22 }, hess: { loyalty: +10 } },
          news: ['STATE SEIZES MAVRO TERMINAL AT DAWN', 'FOUR FOREIGN BANKS SUSPEND VELMORRAN CREDIT'],
          schedule: [{ inDays: 4, visible: true, label: 'The credit lines do not come back on their own', effects: { stats: { economy: -5, treasury: -4 }, hidden: { fiscal: +8 } } }],
        },
      },
    },
  ],
},

{
  id: 'adamek-favour',
  title: 'Adamek Calls In the Loan',
  category: 'person',
  actor: 'adamek',
  faction: 'concord',
  base: 0,
  weight: () => 0,
  body:
    'Adamek does not mention the loan. Adamek never mentions the loan.\n\nHe mentions instead that the head of Mavro customs has retired, that he has "a name", and that the name is a serious person who would bring continuity.\n\nWhoever runs Mavro customs decides what the country is allowed to know about its own trade figures.',
  flavor: 'He has never held office. He has chosen four ministers.',
  options: [
    {
      id: 'appoint',
      label: 'Appoint his name.',
      hint: 'Settles the debt. Mavro customs stops being yours.',
      outcome: {
        text:
          'The appointment is uncontroversial because the man is genuinely qualified.\n\nIn six weeks the country\'s customs data will be extremely tidy and completely fictional. That is six weeks away.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +3, information: -9, elite: +6 },
          hidden: { corruption: +16, leak: +4 },
          regime: { graft: +14, patronage: +10 },
          factions: { concord: { loyalty: +10, influence: +8 }, grey: { loyalty: -6 } },
          characters: { adamek: { loyalty: +10 }, grebs: { loyalty: -6, trust: -5 } },
          endCommitment: 'Concord loan repayments',
          schedule: [{ inDays: 6, visible: false, label: 'Mavro customs data becomes tidy', effects: { stats: { information: -5, treasury: -3 }, hidden: { corruption: +8 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Appoint someone of your own.',
      hint: 'Keeps the customs service. The loan stops being a favour and becomes a debt.',
      outcome: {
        text:
          '"Of course." Adamek is entirely gracious. He is gracious for the rest of the meeting, gracious in the corridor, and gracious to the press outside.\n\nThe next repayment notice arrives eight days early with the full schedule attached and a covering letter so polite you could frame it.',
        tone: 'mixed',
        effects: {
          stats: { power: +6, information: +5, treasury: -5 },
          hidden: { corruption: -5, fiscal: +6 },
          regime: { reform: +7 },
          factions: { concord: { loyalty: -8, patience: -8 }, grey: { loyalty: +6 } },
          characters: { adamek: { loyalty: -7, plotting: +7 }, grebs: { loyalty: +5 } },
          schedule: [{ inDays: 4, visible: true, label: 'Concord repayment, accelerated', effects: { stats: { treasury: -6 } } }],
        },
      },
    },
  ],
},

{
  id: 'minute-count',
  title: 'Somebody Counted the Airtime',
  category: 'scandal',
  faction: 'chorus',
  base: 0,
  weight: () => 0,
  body:
    'A twenty-six-year-old with a spreadsheet has published thirty days of Channel Seven airtime, sorted by subject.\n\nYou: 312 minutes. Every opposition figure combined: 11 minutes. The weather: 40 minutes, which several commentators have pointed out is four times the opposition.\n\nThe spreadsheet is now the most-shared document in the country.',
  flavor: 'Nobody leaked anything. They watched television and wrote it down.',
  options: [
    {
      id: 'lean',
      label: 'Have the Sable Office find out who they are.',
      hint: 'Free. Solves the spreadsheet. Creates the story about the spreadsheet.',
      outcome: {
        text:
          'They are a statistics postgraduate in the Ninth District with four hundred followers, who now has nine hundred thousand.\n\nThe Office is discreet, as always. It does not matter: the student photographs the two officers\' car, and the number plate is a Sable Office plate, and every Velmorran over forty knows that prefix.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -11, support: -6, security: +2 },
          hidden: { unrest: +12, leak: +9, scandal: +10, fear: +6 },
          regime: { repression: +14 },
          factions: { chorus: { loyalty: -15 }, sable: { loyalty: +5 } },
          characters: { vel: { influence: +8 }, sarran: { loyalty: +3 } },
          scandal: { name: 'The spreadsheet', detail: 'A statistics student, two officers in a car, and a number plate everyone over forty recognises.', heat: 40 },
          news: ['SABLE OFFICE PLATE PHOTOGRAPHED OUTSIDE STUDENT FLAT'],
        },
      },
    },
    {
      id: 'laugh',
      label: 'Join in. Give the opposition a guaranteed weekly slot.',
      hint: 'Free. Costs you airtime and pride. Buys something this country has not seen in years.',
      outcome: {
        text:
          'You announce a guaranteed weekly opposition slot on Channel Seven, and you announce it by reading the student\'s numbers out yourself.\n\nLoz is appalled. The press is disoriented. Sanna Vel, given eleven minutes a week on national television, uses the first four to thank you.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +13, support: +5, information: +7, power: -4 },
          hidden: { cult: -8, unrest: -7, leak: -5 },
          regime: { reform: +15 },
          factions: { chorus: { loyalty: +16 }, concord: { loyalty: -4 }, sable: { loyalty: -6 } },
          characters: { vel: { loyalty: +9, trust: +10, influence: +10 }, loz: { loyalty: -7 } },
          news: ['OPPOSITION GIVEN WEEKLY TV SLOT — "AN ASTONISHING DECISION," SAYS EVERYONE'],
          schedule: [{ inDays: 6, visible: false, label: 'Vel is very good on television', effects: { characters: { vel: { influence: +8 } }, stats: { support: -3 } } }],
        },
      },
    },
    {
      id: 'ignore',
      label: 'Ignore it. It is a spreadsheet.',
      hint: 'Free. It is a spreadsheet with nine hundred thousand readers.',
      outcome: {
        text:
          'It is indeed a spreadsheet. It is updated weekly. Six other people start their own.\n\nBy the end of the month there is a small, cheerful and entirely legal industry devoted to counting what the state broadcaster does not say.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: -4, information: +2 },
          hidden: { leak: +7 },
          factions: { chorus: { loyalty: +2, influence: +6 } },
        },
      },
    },
  ],
},

{
  id: 'hadem-road-due',
  title: 'The Small Notebook',
  category: 'decision',
  faction: 'provinces',
  base: 0,
  weight: () => 0,
  body:
    'The Hadem delegation is back. The same older woman is with them and she has brought the notebook.\n\nShe opens it and reads out, without emphasis, the dates on which fourteen previous governments promised the third road. Then she reads out yours.\n\n"We are not angry, {sir}. We are keeping the list."',
  flavor: 'Two paved roads in. Everyone counts them.',
  options: [
    {
      id: 'fund',
      label: 'Fund it today. Put it in the official gazette.',
      hint: 'Cost: $8.0B you may not have. The list stops here.',
      outcome: {
        text:
          'She closes the notebook without writing anything in it. The civil service liaison tells you afterwards that this is the first time that has happened.\n\nThe tarmac starts on the ninth.',
        tone: 'good',
        effects: {
          stats: { treasury: -8, legitimacy: +9, support: +5, stability: +5 },
          hidden: { separatism: -18, fiscal: +5 },
          regime: { reform: +10, devolution: +9 },
          factions: { provinces: { loyalty: +13, patience: +12 } },
          characters: { kostyn: { loyalty: +5 } },
          resolvePromise: { id: 'hadem-road', status: 'kept' },
          project: {
            name: 'The third Hadem road',
            days: 6,
            upkeep: 0.3,
            detail: 'Fifty-seven years late. Now being built.',
            legacy: 'built the third Hadem road after fourteen governments did not',
            onComplete: { stats: { legitimacy: +5, economy: +3 }, hidden: { separatism: -10 }, news: ['THIRD HADEM ROAD OPENS'] },
          },
        },
      },
    },
    {
      id: 'partial',
      label: 'Fund the survey work. Tarmac next cycle.',
      hint: 'Cost: $1.0B. She has a notebook full of next cycles.',
      outcome: {
        text: 'She writes the date down.',
        tone: 'bad',
        effects: {
          stats: { treasury: -1, legitimacy: -3 },
          hidden: { separatism: +7 },
          factions: { provinces: { loyalty: -5, patience: -10 } },
          schedule: [{ inDays: 6, visible: false, label: 'Drovnan radio has a very good week', effects: { hidden: { separatism: +8, foreign: +5 } } }],
        },
      },
    },
    {
      id: 'drop',
      label: 'Tell her honestly that it will not be built.',
      hint: 'Free and brutal. Also the first true sentence the region has had from a head of state.',
      outcome: {
        text:
          'She stops, looks at you for a long moment, and closes the notebook.\n\n"Thank you," she says, and means it.\n\nThe Hadem councils withdraw from the regional assembly eleven days later. They give no reason.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +4, support: -4 },
          hidden: { separatism: +14 },
          regime: { reform: +5 },
          factions: { provinces: { loyalty: -8, patience: -6 }, chorus: { loyalty: +3 } },
          resolvePromise: { id: 'hadem-road', status: 'broken' },
          schedule: [{ inDays: 8, visible: true, label: 'The Hadem councils withdraw from the assembly', effects: { hidden: { separatism: +10 }, stats: { stability: -6 } } }],
        },
      },
    },
  ],
},

{
  id: 'wage-contagion',
  title: 'Everyone Else Wants the Same Deal',
  category: 'economy',
  faction: 'combine',
  base: 0,
  weight: () => 0,
  body:
    'The railway workers have opened talks. So have the teachers, the hospital porters, the Mavro crane operators who are already covered by the last settlement but would like to discuss it again, and — seriously — the Pigeon Federation\'s paid staff.\n\nBrask has costed settling all of them at the mining rate. He has written it on one line and underlined it twice. $14 billion.',
  flavor: 'Every union in the country now knows what a settlement costs.',
  options: [
    {
      id: 'settle-all',
      label: 'Settle them all at the same rate.',
      hint: 'Cost: $14.0B plus a very large permanent wage bill. Total industrial peace.',
      outcome: {
        text:
          'It is the largest single act of public generosity in the country\'s history and for about three weeks it is magnificent.\n\nBrask does not resign. He does something worse: he prepares a fifteen-year projection, has it bound, and leaves a copy on your desk every Monday.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -14, stability: +16, support: +11, economy: -4 },
          hidden: { unrest: -20, fiscal: +22 },
          regime: { populism: +16 },
          factions: { combine: { loyalty: +16 }, concord: { loyalty: -9 }, grey: { patience: -8 } },
          characters: { hess: { loyalty: +10 }, brask: { loyalty: -8, trust: -4 } },
          commitments: [{ label: 'Public sector pay settlement', perDay: 0.55 }],
          schedule: [{ inDays: 5, visible: true, label: 'The fifteen-year projection starts arriving on Mondays', effects: { stats: { treasury: -4 }, hidden: { fiscal: +8 } } }],
        },
      },
    },
    {
      id: 'tier',
      label: 'Settle essential services only.',
      hint: 'Cost: $6.0B. Half the unions learn they are the half that does not matter.',
      outcome: {
        text:
          'Hospitals and railways settle. Teachers and crane operators do not.\n\nThe unions\' internal politics get extremely interesting extremely fast, and Hess spends a week in rooms he would rather not be in.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -6, stability: +5, support: +2 },
          hidden: { unrest: -4, fiscal: +8 },
          regime: { technocracy: +7 },
          factions: { combine: { loyalty: -3, power: -5 }, grey: { loyalty: +4 } },
          characters: { hess: { loyalty: -4, influence: -6 }, brask: { loyalty: +4 } },
          commitments: [{ label: 'Essential services pay deal', perDay: 0.22 }],
        },
      },
    },
    {
      id: 'hold',
      label: 'Hold the line. No further settlements.',
      hint: 'Saves everything. Tests whether the mining deal was an exception or a template.',
      outcome: (s, rng) =>
        rng.chance(0.45 + s.factions.combine.loyalty / 300)
          ? {
              text:
                'It holds. The talks stay exploratory, the Federation staff quietly drop out, and the moment passes.\n\nHess, asked about it, says only: "There is a difference between what is owed and what is possible." It is the most generous thing anyone in the unions has said about a government since 1961.',
              tone: 'good',
              effects: {
                stats: { power: +7, treasury: +1, stability: +3 },
                hidden: { unrest: +3, fiscal: -4 },
                factions: { combine: { patience: -6 } },
                characters: { hess: { trust: +6 } },
              },
            }
          : {
              text:
                'It does not hold. The railway workers walk out on the eleventh, and because this is Velmorra, railway workers walking out means the grain does not move, and because the grain does not move the farm belt is now involved.',
              tone: 'bad',
              effects: {
                stats: { stability: -12, economy: -7, support: -6 },
                hidden: { unrest: +18, separatism: +5 },
                factions: { combine: { loyalty: -7 }, provinces: { loyalty: -5 } },
                news: ['RAIL STOPPAGE HALTS GRAIN; FARM BELT "GRAVELY CONCERNED"'],
                schedule: [{ inDays: 3, visible: true, label: 'The rail stoppage spreads', cardId: 'strike-begins' }],
              },
            },
    },
  ],
},

{
  id: 'grebs-review',
  title: 'The Review Reports',
  category: 'policy',
  actor: 'grebs',
  faction: 'grey',
  base: 0,
  weight: () => 0,
  body:
    'Grebs has never chaired a review that produced nothing, and she has not started now.\n\nThe report is 340 pages. The recommendation is one sentence: repeal Article 19 and replace it with a 14-day detention power that requires a judge.\n\nShe has brought two copies. One is for you. The other, she mentions in passing, is lodged with the parliamentary library, where it becomes a public document in thirty days whatever you decide.',
  flavor: 'She keeps copies of everything. This is what that looks like at scale.',
  options: [
    {
      id: 'adopt',
      label: 'Adopt it in full.',
      hint: 'Free. A real reform with the whole civil service behind it.',
      outcome: {
        text:
          'It goes through, and because it came from the ministries rather than the street, it goes through without anyone losing face. That is the entire reason Grebs exists.\n\nSarran accepts it without comment. Two weeks later her daily summary is shorter, and better, and nobody has said a word about why.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +14, support: +5, security: -6, information: +3, power: +3 },
          hidden: { fear: -10, unrest: -8 },
          regime: { reform: +16, technocracy: +12 },
          factions: { grey: { loyalty: +12 }, chorus: { loyalty: +12 }, sable: { loyalty: -9, patience: -7 } },
          characters: { grebs: { loyalty: +12, trust: +10 }, vel: { loyalty: +9, trust: +8 }, sarran: { loyalty: -8 } },
          news: ['ARTICLE 19 REPLACED WITH JUDGE-APPROVED DETENTION POWER'],
        },
      },
    },
    {
      id: 'water',
      label: 'Adopt a watered-down version: 45 days, no judge.',
      hint: 'Free. Looks like reform. Is not. Grebs will read it very carefully.',
      outcome: {
        text:
          'Grebs reads the amended text in front of you, slowly, and says: "This is forty-five days without a judge," in the tone of someone confirming a delivery address.\n\nIt passes. The press notices within an afternoon. The second copy is still in the parliamentary library.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +2, security: +2 },
          hidden: { fear: +3, leak: +6 },
          regime: { repression: +6, technocracy: +4 },
          factions: { chorus: { loyalty: -7 }, sable: { loyalty: +4 }, grey: { loyalty: -5, patience: -6 } },
          characters: { grebs: { loyalty: -6, trust: -6 }, vel: { loyalty: -6 } },
          schedule: [{ inDays: 5, visible: true, label: 'The library copy becomes public', effects: { hidden: { scandal: +9, leak: +8 }, stats: { legitimacy: -5 } } }],
        },
      },
    },
    {
      id: 'shelve',
      label: 'Shelve the report.',
      hint: 'Free. Nothing changes for thirty days. Then the library copy publishes itself.',
      outcome: {
        text:
          '"Of course, {sir}."\n\nShe squares the edges and files it, and somewhere in the parliamentary library a thirty-day clock you cannot stop, and which she told you about to your face, starts running.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -4 },
          hidden: { scandal: +6, leak: +8 },
          regime: { repression: +5 },
          factions: { grey: { loyalty: -8, patience: -9 }, chorus: { loyalty: -5 }, sable: { loyalty: +5 } },
          characters: { grebs: { loyalty: -9, trust: -7 } },
          remember: [{ who: 'grebs', text: 'She built you a way out and you shelved it.', weight: -2 }],
          schedule: [{ inDays: 8, visible: true, label: 'The library copy becomes public', effects: { stats: { legitimacy: -9, support: -5 }, hidden: { scandal: +14, leak: +10 } } }],
        },
      },
    },
  ],
},

{
  id: 'circular-transfer',
  title: 'The Transfer With No Legal Basis',
  category: 'economy',
  actor: 'brask',
  faction: 'grey',
  base: 0,
  weight: () => 0,
  body:
    'Three ministries have been covering each other\'s deficits in a circle since 2021. Two of the three transfers are merely irregular.\n\nThe third has no legal basis at all. $3.1 billion a year moving between Health and Regional Development through an account opened in 2021 on the verbal instruction of a man who is now dead.\n\n"It is not theft," says Brask. "That is the problem. If it were theft I would know what to do."',
  flavor: 'This is what happens when you look at the real numbers.',
  options: [
    {
      id: 'disclose',
      label: 'Disclose it. Refer it to parliament.',
      hint: 'Cost: $3.0B and eleven days of terrible headlines. Legally clean.',
      outcome: {
        text:
          'It is the first voluntary budget self-report in the country\'s history. The press is stunned. The Aureth Union sends an actual letter of commendation, which Piek frames.\n\nAnd for eleven days every headline contains the words "illegal" and "government" in the same sentence.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +11, support: -7, treasury: -3, information: +6 },
          hidden: { scandal: +12, corruption: -14, foreign: -8 },
          regime: { reform: +16, technocracy: +9 },
          factions: { grey: { loyalty: +9 }, chorus: { loyalty: +11 }, concord: { loyalty: -5 } },
          characters: { brask: { loyalty: +12, trust: +11 }, piek: { loyalty: +5 } },
          news: ['GOVERNMENT DISCLOSES ILLEGAL TRANSFER — NO GOVERNMENT HAS DONE THIS BEFORE'],
          schedule: [{ inDays: 5, visible: false, label: 'Eleven days of headlines end', effects: { stats: { legitimacy: +5, support: +4 }, hidden: { scandal: -10 } } }],
        },
      },
    },
    {
      id: 'legalise',
      label: 'Quietly legalise it, backdated.',
      hint: 'Free, tidy and invisible. Exactly the machinery every scandal is made of.',
      outcome: {
        text:
          'It takes one clause in a technical amendment and nobody notices at all.\n\nGrebs notices. Grebs files it. Grebs files everything.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +2, legitimacy: -2, information: -3 },
          hidden: { corruption: +11, leak: +9 },
          regime: { graft: +10 },
          factions: { grey: { loyalty: -4 } },
          characters: { brask: { loyalty: -6, trust: -5 }, grebs: { trust: -4 } },
          scandal: { name: 'The backdated clause', detail: 'One clause in a technical amendment. Grebs filed it.', heat: 25 },
          schedule: [{ inDays: 9, visible: false, label: 'Somebody reads the technical amendment', effects: { hidden: { scandal: +12, leak: +8 } } }],
        },
      },
    },
    {
      id: 'close',
      label: 'Close the account. Absorb the gap into Finance.',
      hint: 'Cost: $5.0B now. Ends it with no disclosure and no crime.',
      outcome: {
        text:
          'Brask does it in a fortnight, badly, at cost, and with a degree of professional satisfaction you have not seen from him before.\n\n"There," he says. "Now it is only a deficit."',
        tone: 'good',
        effects: {
          stats: { treasury: -5, economy: -1, information: +4, legitimacy: +3 },
          hidden: { corruption: -10, fiscal: +5 },
          regime: { technocracy: +11 },
          factions: { grey: { loyalty: +7 } },
          characters: { brask: { loyalty: +10, trust: +8 }, grebs: { loyalty: +4 } },
        },
      },
    },
  ],
},

{
  id: 'ostrene-second',
  title: 'Ostrene Want the Deep-Water Berths',
  category: 'foreign',
  base: 0,
  weight: () => 0,
  body:
    'The Ostrene ambassador has scheduled a meeting for Tuesday.\n\nThey want a forty-year lease on the deep-water berths at Mavro. Commercial, they stress. Entirely commercial. The rent is generous.\n\nThe deep-water berths are the ones big enough for naval vessels. Nobody mentions this. Everybody knows it.',
  flavor: 'The price lock was the first thing.',
  options: [
    {
      id: 'grant',
      label: 'Grant the lease.',
      hint: 'Gains $13.0B. Puts a foreign navy\'s berths inside your only real port.',
      outcome: {
        text:
          'The money is real and arrives on time, which is more than can be said for most things here.\n\nThe Aureth Union expresses concern. Drovna expresses something considerably stronger. The General Staff expresses nothing at all, in writing, at length.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +13, economy: +4, legitimacy: -8, military: -6 },
          hidden: { foreign: +14, coup: +7 },
          regime: { isolation: +12 },
          factions: { concord: { loyalty: +7 }, staff: { loyalty: -10, patience: -9 }, chorus: { loyalty: -8 } },
          characters: { varkov: { loyalty: -9, trust: -7, plotting: +8 }, adamek: { loyalty: +6 } },
          news: ['FORTY-YEAR MAVRO BERTH LEASE SIGNED; "ENTIRELY COMMERCIAL," SAYS MINISTRY'],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. Politely and firmly.',
      hint: 'Keeps the port. They buy 44% of your exports and reprice gas every year.',
      outcome: {
        text:
          'The ambassador accepts the refusal with complete calm.\n\nThe gas contract is renewed on the forty-first day, eleven per cent higher, with a note regretting market conditions.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +7, military: +6, economy: -4, treasury: -3 },
          hidden: { foreign: +9, coup: -5 },
          regime: { reform: +5 },
          factions: { staff: { loyalty: +9 }, chorus: { loyalty: +6 }, concord: { loyalty: -5 } },
          characters: { varkov: { loyalty: +8, trust: +7 } },
          schedule: [{ inDays: 5, visible: true, label: 'Gas renewed eleven per cent higher', effects: { stats: { treasury: -4, economy: -3 } } }],
        },
      },
    },
    {
      id: 'auction',
      label: 'Offer the berths to Sereth instead.',
      hint: 'The money without the neighbour. Ostrene will notice being outbid.',
      outcome: (_s, rng) =>
        rng.chance(0.55)
          ? {
              text:
                'The Sereth money arrives fast, as Sereth money does, and the expectations arrive quietly, later, as Sereth expectations do.\n\nOstrene says nothing for six days and then cuts lithium purchases by nine per cent, citing inventory.',
              tone: 'mixed',
              effects: {
                stats: { treasury: +11, economy: -3, legitimacy: -2, military: +2 },
                hidden: { foreign: +8 },
                regime: { graft: +5 },
                factions: { concord: { loyalty: +8 }, staff: { loyalty: +3 } },
                schedule: [{ inDays: 6, visible: true, label: 'Sereth expectations arrive, quietly, later', effects: { hidden: { corruption: +9, foreign: +4 } } }],
              },
            }
          : {
              text:
                'Sereth pass. Politely, elegantly, and with a gift.\n\nOstrene, having learned that you shopped the berths around, withdraw both the lease offer and the lithium price lock in the same letter.',
              tone: 'bad',
              effects: {
                stats: { treasury: -2, economy: -6, legitimacy: -3 },
                hidden: { foreign: +16, fiscal: +7 },
                factions: { concord: { loyalty: -7 } },
                characters: { piek: { loyalty: -6 } },
                news: ['OSTRENE WITHDRAW LITHIUM PRICE AGREEMENT'],
              },
            },
    },
  ],
},

{
  id: 'lithium-clause-due',
  title: 'He Has Brought the Gazette',
  category: 'economy',
  actor: 'hess',
  faction: 'combine',
  base: 0,
  weight: () => 0,
  body:
    'Hess has brought the official gazette. The actual printed copy, folded to the page, with the clause circled in pencil.\n\n"Lithium revenue is up nine per cent on the quarter. The clause says the top-up follows the revenue." He puts it on the desk. "I am not here to argue, {sir}. I am here to point at it."\n\nThe top-up is $5 billion.',
  flavor: 'The first written commitment to the unions since 1961.',
  options: [
    {
      id: 'pay',
      label: 'Pay the top-up.',
      hint: 'Cost: $5.0B. A written promise kept, in a country where those are legends.',
      outcome: {
        text:
          'It is paid within the week without argument. The effect in the mines is not gratitude — gratitude would be patronising — but something far more useful: the belief that the paper means what it says.\n\nHess sits down. In the chair. For the first time.',
        tone: 'good',
        effects: {
          stats: { treasury: -5, stability: +10, legitimacy: +8, support: +4 },
          hidden: { unrest: -14 },
          regime: { reform: +9 },
          factions: { combine: { loyalty: +15, patience: +14 }, grey: { loyalty: +4 } },
          characters: { hess: { loyalty: +14, trust: +14 } },
          remember: [{ who: 'hess', text: 'He pointed at the clause and you paid it without argument.', weight: 3 }],
          resolvePromise: { id: 'lithium-wages', status: 'kept' },
        },
      },
    },
    {
      id: 'delay',
      label: 'Delay one quarter. The revenue has not cleared yet.',
      hint: 'Saves $5.0B for now. He is holding the gazette in his hand.',
      outcome: {
        text:
          'Hess folds the gazette carefully and puts it in his inside pocket.\n\n"One quarter," he says. He does not say what happens after one quarter.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +1, stability: -4 },
          hidden: { unrest: +9 },
          factions: { combine: { loyalty: -8, patience: -12 } },
          characters: { hess: { loyalty: -7, trust: -9 } },
          deferPromise: { id: 'lithium-wages', inDays: 5 },
          schedule: [{ inDays: 5, visible: true, label: 'One quarter', cardId: 'lithium-clause-due' }],
        },
      },
    },
    {
      id: 'renege',
      label: 'Repeal the clause. Cite fiscal necessity.',
      hint: 'Saves $5.0B permanently. Breaks the only written promise in sixty years.',
      outcome: {
        text:
          'The repeal is one line and takes an afternoon.\n\nHess does not come to the meeting where it is explained. He sends a deputy, who reads a two-sentence statement and leaves. The second sentence is: "We will not ask again."',
        tone: 'bad',
        effects: {
          stats: { treasury: +3, stability: -14, legitimacy: -12, support: -8 },
          hidden: { unrest: +24 },
          regime: { repression: +7 },
          factions: { combine: { loyalty: -22, patience: -22, power: +5 }, chorus: { loyalty: -7 } },
          characters: { hess: { loyalty: -20, trust: -20, plotting: +12 } },
          remember: [{ who: 'hess', text: 'You repealed the clause in the gazette. "We will not ask again."', weight: -3 }],
          resolvePromise: { id: 'lithium-wages', status: 'broken' },
          news: ['WAGE CLAUSE REPEALED; UNIONS: "WE WILL NOT ASK AGAIN"'],
          schedule: [{ inDays: 4, visible: true, label: 'The unions stop asking', cardId: 'strike-begins' }],
        },
      },
    },
  ],
},

{
  id: 'gorsk-report',
  title: 'The 2022 Inspection Report',
  category: 'scandal',
  faction: 'combine',
  base: 0,
  weight: () => 0,
  body:
    'Somebody has the 2022 report. It recommended closing the Number Four shaft on structural grounds. It was signed by an inspector who still works for the government. It was overruled by a directorate that no longer exists, because it was folded into another directorate in 2023.\n\nThat is exactly the sort of detail that makes a scandal impossible to kill.\n\nThe inspector has agreed to be interviewed. She has been waiting three years to be asked.',
  flavor: 'Eight men. The report is about eight men.',
  options: [
    {
      id: 'inspector',
      label: 'Put the inspector on state television. Let her say all of it.',
      hint: 'Free. Ends any chance of containing the story, and therefore ends the story.',
      outcome: {
        text:
          'She is on the 7pm news for twenty-six minutes, which is longer than any interview in its history. She is devastating, precise and entirely fair, including about the parts that are not your fault.\n\nLoz did not want to run it. He later describes it as "the best product we have ever had".',
        tone: 'good',
        effects: {
          stats: { legitimacy: +14, support: +8, information: +9, economy: -2 },
          hidden: { scandal: -18, unrest: -9, corruption: -7 },
          regime: { reform: +14 },
          factions: { combine: { loyalty: +12 }, chorus: { loyalty: +11 }, grey: { loyalty: +6 }, concord: { loyalty: -5 } },
          characters: { hess: { loyalty: +10, trust: +9 }, loz: { loyalty: +3 }, vel: { trust: +8 } },
          news: ['TWENTY-SIX MINUTES: THE INSPECTOR SPEAKS'],
        },
      },
    },
    {
      id: 'blame-directorate',
      label: 'Blame the abolished directorate. It cannot answer back.',
      hint: 'Free and technically accurate. Everyone can see what you are doing.',
      outcome: {
        text:
          'The statement names a directorate that ceased to exist in 2023 and four officials who have retired.\n\nAll of it is true. The press does not bother attacking it — they simply reprint it next to a photograph of the mine.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -9, support: -6 },
          hidden: { scandal: +11, unrest: +8 },
          regime: { graft: +6 },
          factions: { combine: { loyalty: -9 }, chorus: { loyalty: -7 }, grey: { loyalty: -5 } },
          characters: { hess: { loyalty: -8 }, grebs: { trust: -5 } },
          flags: { liesTold: 1 },
          scandal: { name: 'The abolished directorate', detail: 'A statement blaming an organisation that no longer exists, printed next to a photograph of the mine.', heat: 40 },
        },
      },
    },
    {
      id: 'close-all',
      label: 'Close every shaft flagged in that inspection round.',
      hint: 'Cost: $6.0B and four thousand jobs. Nobody will ever say you did nothing.',
      outcome: {
        text:
          'Eleven shafts close by order within a week. Four thousand people are out of work and on full state pay — a ruinous cost, announced in the same breath as the closures so nobody can say you hid it.\n\nHess supports it publicly and privately tells you it will cost you Gorsk for a generation. You are both right.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -6, economy: -6, legitimacy: +12, support: -4, stability: +3 },
          hidden: { scandal: -16, unrest: +5, fiscal: +8 },
          regime: { reform: +13, technocracy: +8 },
          factions: { combine: { loyalty: +6, patience: +8 }, concord: { loyalty: -7 }, chorus: { loyalty: +8 } },
          characters: { hess: { loyalty: +8, trust: +10 }, brask: { loyalty: -4 } },
          commitments: [{ label: 'Redundancy pay, closed shafts', perDay: 0.25, days: 20 }],
          news: ['ELEVEN SHAFTS CLOSED BY ORDER; FOUR THOUSAND ON FULL STATE PAY'],
        },
      },
    },
  ],
},

{
  id: 'aureth-loan',
  title: 'The Aureth Loan, and Its Conditions',
  category: 'foreign',
  base: 0,
  weight: () => 0,
  body:
    'The Aureth Union will lend Velmorra $18 billion at a rate so good it is almost rude.\n\nThe term sheet is four pages. The conditions are on page three: an independent judicial appointments board, publication of the Free Zone ownership register, and an external audit of defence procurement.\n\nBrask has read it twice. "The money is real," he says. "So is page three."',
  flavor: 'They will lend you anything at all in exchange for a judiciary.',
  options: [
    {
      id: 'accept',
      label: 'Sign it. All of page three.',
      hint: 'Gains $18.0B and a genuinely different country. Three institutions will fight all of it.',
      outcome: {
        text:
          'The money lands within a fortnight, faster than any Velmorran government has received anything.\n\nSo does page three. The judicial board is announced and the Sable Office discovers, for the first time since 1979, that there is a body it has no one on. The defence audit is announced and Varkov reads about it in the gazette rather than being told.\n\nBoth of those facts will matter later.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +18, legitimacy: +14, economy: +5, elite: -9, military: -7, security: -6 },
          hidden: { foreign: -20, corruption: -16, coup: +10, fiscal: -10 },
          regime: { reform: +22, technocracy: +12 },
          factions: { chorus: { loyalty: +14 }, grey: { loyalty: +8 }, concord: { loyalty: -12 }, sable: { loyalty: -11, patience: -10 }, staff: { loyalty: -9, patience: -8 } },
          characters: { vel: { loyalty: +10, trust: +9 }, brask: { loyalty: +9, trust: +8 }, sarran: { loyalty: -10, plotting: +8 }, varkov: { loyalty: -8, trust: -7, plotting: +7 }, adamek: { loyalty: -9 } },
          commitments: [{ label: 'Aureth loan repayments', perDay: 0.38, days: 25 }],
          news: ['AURETH LOAN SIGNED IN FULL; JUDICIAL BOARD ANNOUNCED'],
          schedule: [
            { inDays: 5, visible: true, label: 'The defence procurement audit begins', effects: { hidden: { coup: +8, corruption: -8 }, stats: { military: -4, legitimacy: +4 } } },
            { inDays: 7, visible: true, label: 'The Free Zone ownership register publishes', effects: { hidden: { corruption: -10, scandal: +10 }, stats: { elite: -6, legitimacy: +5 } } },
          ],
        },
      },
    },
    {
      id: 'partial',
      label: 'Take half the money. Accept only the ownership register.',
      hint: 'Gains $9.0B. One reform, two institutions left alone.',
      outcome: {
        text:
          'Aureth accept, because Aureth always accept a first step. They have an entire department devoted to first steps.\n\nThe register publishes. Eleven names surprise nobody and two surprise everybody, and one of the two sits on the Council of the Republic.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +9, legitimacy: +7, elite: -5 },
          hidden: { foreign: -10, corruption: -9, scandal: +8, fiscal: -5 },
          regime: { reform: +11, technocracy: +5 },
          factions: { chorus: { loyalty: +7 }, concord: { loyalty: -8 }, grey: { loyalty: +5 } },
          characters: { adamek: { loyalty: -7 }, brask: { loyalty: +5 }, vel: { trust: +5 } },
          commitments: [{ label: 'Aureth loan repayments', perDay: 0.2, days: 25 }],
          news: ['FREE ZONE OWNERSHIP REGISTER PUBLISHED; TWO NAMES CAUSE COMMENT'],
          schedule: [{ inDays: 6, visible: true, label: 'The two surprising names', effects: { hidden: { scandal: +10 }, stats: { elite: -4 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse the whole thing, publicly.',
      hint: 'Turns down $18.0B. A speech that writes itself, and Ostrene notices you had a choice.',
      outcome: {
        text:
          'You refuse it on the record in one sentence, and the sentence is good: "We are poor. We are not for sale, and we are certainly not for rent."\n\nIt is the most-shared thing you have ever said. The country is broke and delighted. Ostrene, who have been watching this negotiation from the start, send a warm and entirely unsolicited note.',
        tone: 'mixed',
        effects: {
          stats: { support: +11, legitimacy: +6, military: +6, treasury: -2, economy: -4 },
          hidden: { foreign: +9, fiscal: +9, corruption: +4 },
          regime: { populism: +12, isolation: +10 },
          factions: { staff: { loyalty: +8 }, chorus: { loyalty: -5 }, provinces: { loyalty: +6 }, grey: { loyalty: -4 } },
          characters: { varkov: { loyalty: +7 }, sarran: { loyalty: +6 }, brask: { loyalty: -6, trust: -4 }, vel: { loyalty: -4 } },
          news: ['"WE ARE POOR. WE ARE NOT FOR SALE."'],
          schedule: [{ inDays: 6, visible: true, label: 'The country is still poor', effects: { stats: { treasury: -5, economy: -3 }, hidden: { fiscal: +7 } } }],
        },
      },
    },
  ],
},

];

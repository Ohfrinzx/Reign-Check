import type { CardDef } from '../types';
import { CHARACTER_MAP } from './country';

/**
 * Standard event cards.
 *
 * Voice: plain modern English. Short sentences. The humour comes from what is
 * happening, not from how it is phrased. If a sentence needs a second read,
 * rewrite it.
 *
 * Rules:
 *  - Every option states its obvious cost in `hint`, money first.
 *  - Hidden second-order effects stay hidden.
 *  - At least one option per card should schedule something for a later day.
 *  - `{sir}` is replaced with how the player has chosen to be addressed.
 */

export const CARDS: CardDef[] = [

/* ------------------------------------------------------------ GOVERNMENT */

{
  id: 'mil-budget',
  title: 'The Army Wants $9 Billion',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  stages: ['government'],
  base: 10,
  minDay: 1,
  tags: ['military', 'budget'],
  weight: (s) => 10 + (55 - s.factions.staff.loyalty) * 0.3 + s.hidden.coup * 0.2,
  body:
    'General Varkov reports that the army\'s transport helicopters are nineteen years old. Only two of the nineteen can currently fly.\n\n"I am not asking you to like the number. I am asking you to say it out loud so that it exists."\n\nThe number is $9 billion.',
  flavor: 'Nineteen helicopters. Two can fly.',
  options: [
    {
      id: 'fund',
      label: 'Approve all $9 billion today.',
      hint: 'Cost: $9.0B now. The army gets what it asked for and learns that asking works.',
      outcome: {
        text:
          'Varkov reads the figure, folds the paper, and says thank you.\n\nBy the evening, three officers who had been avoiding your calls have returned them.',
        tone: 'good',
        effects: {
          stats: { treasury: -9, military: +8, power: +3, economy: -1 },
          hidden: { coup: -8, fiscal: +6 },
          regime: { militarism: +12 },
          factions: { staff: { loyalty: +10, power: +4 }, grey: { patience: -4 }, combine: { loyalty: -3 } },
          characters: { varkov: { loyalty: +10, trust: +8 } },
          remember: [{ who: 'varkov', text: 'You approved the helicopter money without arguing.', weight: 2 }],
          commitments: [{ label: 'Helicopter programme', perDay: 0.35, days: 12 }],
          news: ['DEFENCE MINISTRY CONFIRMS $9BN HELICOPTER PURCHASE'],
          schedule: [
            { inDays: 7, visible: false, label: 'The army comes back with another number', cardId: 'mil-budget-encore' },
          ],
        },
      },
    },
    {
      id: 'promise',
      label: 'Promise it for next quarter.',
      hint: 'Costs nothing today. Creates a debt to the army with a date attached.',
      outcome: {
        text:
          '"Next quarter," she says, and writes it down.\n\nThe army will expect it delivered on that date.',
        tone: 'mixed',
        effects: {
          stats: { military: +4, power: +1 },
          hidden: { coup: -3, fiscal: +2 },
          regime: { militarism: +4 },
          factions: { staff: { loyalty: +5, patience: -6 } },
          characters: { varkov: { loyalty: +4, trust: -2 } },
          promise: { text: '$9B for the helicopter programme, promised to the army', to: 'staff', inDays: 5 },
          schedule: [{ inDays: 5, visible: true, label: 'The army expects its $9B', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'half',
      label: 'Approve half. Call it a first instalment.',
      hint: 'Cost: $4.0B. Satisfies nobody completely.',
      outcome: {
        text:
          'Varkov accepts the partial payment without objection.\n\nColonel Tern separately sends a note thanking you for supporting the armed forces.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -4, military: +4 },
          hidden: { coup: -3, fiscal: +3 },
          regime: { militarism: +5 },
          factions: { staff: { loyalty: +4, patience: -3 } },
          characters: { varkov: { loyalty: +3 }, tern: { loyalty: +4, influence: +2 } },
          commitments: [{ label: 'Helicopter programme (part-funded)', perDay: 0.18, days: 12 }],
          schedule: [{ inDays: 6, visible: false, label: 'The army asks about the second instalment', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Say no. The helicopters can wait.',
      hint: 'Saves $9.0B. The army finds out what your word is worth under pressure.',
      outcome: {
        text:
          'Varkov takes the sheet back, unread by you, and leaves.\n\nAt 9:40pm the Sable Office logs a dinner in Gorsk attended by four officers who do not normally eat together. Director Sarran notes it and says nothing yet.',
        tone: 'bad',
        effects: {
          stats: { military: -7, power: -2, treasury: +1 },
          hidden: { coup: +11, fear: +2 },
          factions: { staff: { loyalty: -9, patience: -10 }, grey: { loyalty: +2 } },
          characters: { varkov: { loyalty: -8, plotting: +6 }, tern: { plotting: +4 } },
          remember: [{ who: 'varkov', text: 'You refused the helicopter money to her face with no alternative.', weight: -2 }],
          schedule: [{ inDays: 3, visible: false, label: 'Officers who do not normally eat together', effects: { hidden: { coup: +5 } } }],
        },
      },
    },
  ],
},

{
  id: 'grain-subsidy',
  title: 'The Farm Subsidy',
  category: 'policy',
  actor: 'kostyn',
  faction: 'provinces',
  stages: ['government', 'politics'],
  base: 9,
  weight: (s) => 9 + (50 - s.factions.provinces.loyalty) * 0.25 + s.hidden.separatism * 0.15,
  body:
    'Governor Kostyn arrives with a jar of honey and a spreadsheet.\n\n"Fertiliser is up forty per cent. The subsidy has not moved since 2019. I am not asking you for a favour, {sir}. I am showing you what the harvest looks like if nobody does anything, and letting you decide whose harvest it is."\n\nRaising it costs $7 billion a year.',
  flavor: 'The honey jars are numbered. They are always numbered.',
  options: [
    {
      id: 'raise',
      label: 'Raise the subsidy. Announce it in Kordiva.',
      hint: 'Cost: $7.0B plus an ongoing budget line. Buys the countryside — and Kostyn gets the photograph.',
      outcome: {
        text:
          'You announce it on a platform in Kordiva with Kostyn three feet to your left, waving.\n\nThe clip that runs on the 7pm news is framed so that she is in the middle of it. The countryside is delighted. It is not entirely clear who with.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -7, support: +7, stability: +4, economy: -1 },
          hidden: { fiscal: +7, separatism: -5 },
          regime: { populism: +8, patronage: +5 },
          factions: { provinces: { loyalty: +11 }, concord: { loyalty: -3 }, grey: { patience: -4 } },
          characters: { kostyn: { loyalty: +6, influence: +7 }, brask: { trust: -3 } },
          remember: [{ who: 'kostyn', text: 'You raised the subsidy and let her stand in the middle of the shot.', weight: 2 }],
          commitments: [{ label: 'Increased farm subsidy', perDay: 0.28 }],
          news: ['FARM SUBSIDY RAISED — GOVERNOR KOSTYN "DELIGHTED FOR THE COUNTRY"'],
        },
      },
    },
    {
      id: 'target',
      label: 'Raise it only for small farms.',
      hint: 'Cost: $3.0B. Cheaper and fairer, and it cuts the big farm lobby out entirely.',
      outcome: {
        text:
          'Brask is close to tearful with gratitude. The measure is efficient, defensible, and costs a third of the headline version.\n\nThe grain lobby issues a statement welcoming "this first step". The phrase "first step" is doing a lot of work.',
        tone: 'good',
        effects: {
          stats: { treasury: -3, support: +3, economy: +2, legitimacy: +2 },
          hidden: { fiscal: +2 },
          regime: { technocracy: +10, reform: +6 },
          factions: { provinces: { loyalty: +2, patience: -5 }, grey: { loyalty: +5 }, combine: { loyalty: +3 } },
          characters: { brask: { loyalty: +8, trust: +6 }, kostyn: { loyalty: -3 } },
          remember: [{ who: 'brask', text: 'You took the efficient option over the popular one.', weight: 2 }],
          commitments: [{ label: 'Smallholder subsidy', perDay: 0.12 }],
          schedule: [{ inDays: 5, visible: false, label: 'The grain lobby takes its second step', effects: { factions: { provinces: { patience: -8 } }, hidden: { separatism: +4 } } }],
        },
      },
    },
    {
      id: 'freeze',
      label: 'Freeze it. Blame the deficit you inherited.',
      hint: 'Saves $7.0B. The farm belt has ended governments over less.',
      outcome: {
        text:
          '"The deficit you inherited," Kostyn repeats. "Of course." She leaves the honey on the desk anyway, which means you have now accepted it.\n\nBy the weekend four Kordiva mayors have given interviews about the capital\'s understanding of rural life.',
        tone: 'bad',
        effects: {
          stats: { support: -5, stability: -4, treasury: +1 },
          hidden: { separatism: +9, unrest: +5 },
          regime: { technocracy: +4 },
          factions: { provinces: { loyalty: -10, patience: -12 }, concord: { loyalty: +3 } },
          characters: { kostyn: { loyalty: -7, plotting: +7 }, brask: { loyalty: +3 } },
          remember: [{ who: 'kostyn', text: 'You froze the subsidy and called her harvest a deficit.', weight: -2 }],
          schedule: [{ inDays: 4, visible: false, label: 'Four mayors give interviews', cardId: 'kordiva-cold' }],
        },
      },
    },
  ],
},

{
  id: 'ilvet-audit',
  title: 'Auditing the Free Zone',
  category: 'economy',
  faction: 'concord',
  stages: ['government', 'development'],
  base: 7,
  minDay: 1,
  weight: (s) => 7 + s.hidden.corruption * 0.22 + (s.stats.treasury < 30 ? 6 : 0),
  body:
    'Ilyana Grebs brings you a memo herself, which means it matters.\n\n"The Ilvet Free Zone moved $61 billion last quarter and paid $400 million in tax. That is not a loophole, {sir}. A loophole is an accident. This was built on purpose."',
  flavor: 'Grebs keeps copies of everything. She has brought some.',
  options: [
    {
      id: 'audit',
      label: 'Order a full audit of the Free Zone.',
      hint: 'Could recover billions. Also declares war on every bank in the country.',
      enabled: (s) => s.stats.power > 32,
      lockedText: 'You do not currently have the authority to make an audit stick.',
      outcome: (s, rng) => {
        const strong = s.stats.power > 55 && s.factions.grey.loyalty > 50;
        return strong
          ? {
              text:
                'The auditors go in on a Tuesday with the civil service behind them and the Sable Office watching the doors. Three banks freeze their own accounts before anyone knocks.\n\nYou recover $11 billion. Adamek does not call. That is the part that should worry you.',
              tone: 'mixed',
              effects: {
                stats: { treasury: +11, legitimacy: +7, elite: -12, economy: -4 },
                hidden: { corruption: -16, scandal: +8, fiscal: -6 },
                regime: { reform: +16, technocracy: +9 },
                factions: { concord: { loyalty: -18, patience: -15 }, grey: { loyalty: +9 }, chorus: { loyalty: +10 }, combine: { loyalty: +6 } },
                characters: { adamek: { loyalty: -16, plotting: +14 }, grebs: { loyalty: +9, trust: +7 } },
                remember: [{ who: 'adamek', text: 'You sent auditors into Ilvet.', weight: -3 }],
                news: ['AUDITORS ENTER FREE ZONE — CURRENCY WOBBLES, THEN HOLDS'],
                schedule: [
                  { inDays: 3, visible: true, label: 'Money leaving the Free Zone', effects: { stats: { economy: -3, treasury: +4 } } },
                  { inDays: 6, visible: false, label: 'The Concord responds', cardId: 'concord-response' },
                ],
              },
            }
          : {
              text:
                `The auditors go in and hit a wall of lawyers so expensive they have their own waiting room. Within ${rng.int(3) + 2} days you have four hundred pages, two junior resignations and a currency that has moved eight per cent the wrong way.\n\nYou made the enemy without getting the money.`,
              tone: 'bad',
              effects: {
                stats: { treasury: +2, economy: -7, elite: -11, power: -4, legitimacy: +3 },
                hidden: { corruption: -4, scandal: +10 },
                regime: { reform: +9 },
                factions: { concord: { loyalty: -15, patience: -12 }, chorus: { loyalty: +6 }, grey: { loyalty: +4 } },
                characters: { adamek: { loyalty: -14, plotting: +12 } },
                remember: [{ who: 'adamek', text: 'You sent auditors into Ilvet and they bounced off.', weight: -2 }],
                schedule: [{ inDays: 5, visible: false, label: 'The Concord responds', cardId: 'concord-response' }],
              },
            };
      },
    },
    {
      id: 'levy',
      label: 'Skip the audit. Charge a flat transit levy instead.',
      hint: 'Brings in about $0.3B a day, permanently. No investigation, no reform.',
      outcome: {
        text:
          'Adamek takes the call himself. "A levy," he says, in the voice of a man being asked for something reasonable. "Yes. A levy is a cost. An audit is a question." He agrees the number in ninety seconds.\n\nHe has just told you exactly what he is afraid of.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +6, economy: -1, elite: -3 },
          hidden: { corruption: +5, fiscal: -4 },
          regime: { graft: +6, patronage: +5 },
          flags: { ilvetLevy: 1 },
          factions: { concord: { loyalty: -4 }, grey: { loyalty: -3 }, chorus: { loyalty: -4 } },
          characters: { adamek: { loyalty: +3, trust: +4 }, grebs: { loyalty: -5, trust: -4 } },
          remember: [{ who: 'grebs', text: 'You took the levy instead of the audit. She filed the memo anyway.', weight: -1 }],
          schedule: [{ inDays: 8, visible: false, label: 'The memo Grebs filed anyway', effects: { hidden: { leak: +9 } } }],
        },
      },
    },
    {
      id: 'shelve',
      label: 'Drop it. Thank Grebs for the memo.',
      hint: 'Costs nothing today. Grebs files everything, and files are permanent.',
      outcome: {
        text:
          '"Of course, {sir}." Grebs takes the memo back, squares the edges and files it — in the room she has the only key to, alongside nine other governments\' worth of documents that were also, at the time, inconvenient.',
        tone: 'neutral',
        effects: {
          hidden: { corruption: +6, leak: +5 },
          regime: { graft: +4 },
          factions: { concord: { loyalty: +4 }, grey: { patience: -6 } },
          characters: { grebs: { loyalty: -4, trust: -3 }, adamek: { loyalty: +5 } },
          remember: [{ who: 'grebs', text: 'She brought you the Ilvet memo and you buried it.', weight: -1 }],
        },
      },
    },
  ],
},

{
  id: 'payroll-crunch',
  title: 'Payroll Is Short',
  category: 'economy',
  actor: 'brask',
  faction: 'grey',
  stages: ['government'],
  base: 6,
  weight: (s) => (s.stats.treasury < 25 ? 30 : s.stats.treasury < 40 ? 12 : 2) + s.hidden.fiscal * 0.2,
  requires: (s) => s.stats.treasury < 45,
  body:
    'Brask has the green notebook open, which means these are the real numbers.\n\n"State payroll — the wages the government owes every soldier, teacher, and clerk on its books — clears on the 28th. That is one in six working adults in this country. We are $11 billion short. If nothing changes, none of them get paid that day."',
  flavor: 'Short by $11 billion. Due on the 28th.',
  options: [
    {
      id: 'borrow-concord',
      label: 'Borrow $12B from the Concord at their rate.',
      hint: 'Everyone gets paid on time. In return you owe the banks $12.0B, taken out of the treasury bit by bit until it is repaid.',
      outcome: {
        text:
          'Adamek writes the rate on a card and slides it across. It is not a good rate and it is not an insulting one — it is the rate of a man who already knows exactly how short you are. The number reached him before you offered it.\n\nPayroll clears on time. From now on, a slice of the treasury goes to repaying this loan before anything else gets funded.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +12, elite: +3, economy: -1 },
          hidden: { fiscal: +12, corruption: +4, leak: +6 },
          regime: { patronage: +8 },
          factions: { concord: { loyalty: +8, influence: +5 } },
          characters: { adamek: { loyalty: +7, influence: +6 }, brask: { trust: -3 } },
          commitments: [{ label: 'Concord loan repayments', perDay: 0.45, days: 20 }],
          schedule: [{ inDays: 9, visible: false, label: 'Adamek calls in the favour', cardId: 'adamek-favour' }],
        },
      },
    },
    {
      id: 'print',
      label: 'Have the central bank print the difference.',
      hint: 'Everyone gets paid tonight, in money that did not exist yesterday. That extra money makes every dollar already out there worth a little less.',
      outcome: {
        text:
          'The central bank is independent in law. It is also physically inside the Finance Ministry, and the governor takes the lift up when asked.\n\nPayroll clears — but creating money without anything backing it means there is more of it chasing the same goods. On Thursday the currency opens four per cent weaker, imported goods cost more by the weekend, and three people who do not speak to each other all call it "a technical adjustment".',
        tone: 'mixed',
        effects: {
          stats: { treasury: +13, economy: -6, support: +2 },
          hidden: { fiscal: +14 },
          regime: { populism: +6 },
          factions: { concord: { loyalty: -6 }, combine: { loyalty: +4 } },
          characters: { brask: { loyalty: -6, trust: -5 } },
          remember: [{ who: 'brask', text: 'You printed money through payroll over his objection.', weight: -2 }],
          news: ['CENTRAL BANK CALLS CURRENCY DROP "TECHNICAL"'],
          schedule: [{ inDays: 4, visible: false, label: 'The technical adjustment stops being technical', effects: { stats: { economy: -4 }, hidden: { unrest: +6 } } }],
        },
      },
    },
    {
      id: 'delay',
      label: 'Delay payroll nine days. Say so publicly.',
      hint: 'Saves the $8.0B you would otherwise have to borrow or print. Nobody gets paid for nine extra days — two million people notice immediately.',
      outcome: {
        text:
          'You go on the 7pm news and say plainly that the government cannot pay everyone on time this month — the first time any Velmorran government has admitted that since 1994.\n\nThe press is startled into something close to respect. The unions are not startled at all: nobody who is owed nine extra days of waiting for wages they were counting on finds that reassuring. Hess notes the date and says, on the record, "Nine days."',
        tone: 'mixed',
        effects: {
          stats: { treasury: +8, legitimacy: +6, support: -9, stability: -6 },
          hidden: { unrest: +11, fiscal: -4 },
          regime: { reform: +8, technocracy: +6 },
          factions: { combine: { loyalty: -9, patience: -14 }, chorus: { loyalty: +8 }, grey: { loyalty: +5 } },
          characters: { brask: { loyalty: +10, trust: +9 }, hess: { loyalty: -7 }, vel: { trust: +6 } },
          remember: [{ who: 'hess', text: 'You delayed payroll nine days and told the truth about why.', weight: -1 }],
          schedule: [{ inDays: 9, visible: true, label: 'Payroll, nine days late, as promised', effects: { stats: { treasury: -9, legitimacy: +3 }, hidden: { unrest: -5 } } }],
        },
      },
    },
  ],
},

/* -------------------------------------------------------------- POLITICS */

{
  id: 'sarran-file',
  title: 'She Has a File on Someone',
  category: 'intelligence',
  actor: 'sarran',
  faction: 'sable',
  stages: ['politics', 'afternoon'],
  base: 8,
  minDay: 1,
  weight: (s) => 8 + s.factions.sable.loyalty * 0.08 + s.hidden.fear * 0.1,
  body:
    'Director Sarran brings you a folder. It is eleven pages and it concerns somebody currently in your cabinet. She has not opened it.\n\n"You may have it, {sir}. I would only point out that once you know a thing, everyone can see that you know it."',
  flavor: 'The Sable Office keeps files on every minister in the cabinet.',
  options: [
    {
      id: 'read',
      label: 'Read it.',
      hint: 'You get leverage over someone. Sarran gets leverage over you.',
      outcome: (s, rng) => {
        const pool = ['piek', 'doran', 'brask', 'tern', 'grebs'].filter((id) => s.characters[id]?.inPost);
        const target = rng.pick(pool.length ? pool : ['piek']);
        const lines: Record<string, string> = {
          piek: 'Orlan Piek has been briefing the Aureth embassy over dinner for two years. He is not being paid. He is being flattered, which is cheaper.',
          doran: 'Yvet Doran opened a numbered account in the Free Zone eleven days before you took office. The balance is not large. The timing is.',
          brask: 'Kel Brask has been quietly covering a $200 million gap in a rural hospital programme out of a contingency fund he is not authorised to touch. It is the least corrupt corruption you have ever read about.',
          tern: 'Colonel Tern has had four dinners in Gorsk this quarter with officers outside his chain of command. He wrote a charming note after each one.',
          grebs: 'Ilyana Grebs has kept copies of everything for nineteen years. Including, the file notes, things about the Sable Office itself.',
        };
        return {
          text: `You read it.\n\n${lines[target]}\n\nSarran takes the folder back. "It will be in the archive," she says, "under your name, as the person who asked for it."`,
          tone: 'mixed',
          effects: {
            stats: { information: +8, security: +4, power: +3 },
            hidden: { fear: +6, leak: +3 },
            regime: { repression: +7 },
            flags: { [`dirt:${target}`]: 1 },
            factions: { sable: { loyalty: +6, influence: +5 } },
            characters: { sarran: { loyalty: +5, influence: +6 }, [target]: { fear: +10, trust: -6 } },
            remember: [{ who: 'sarran', text: 'You took the file. She noted who asked for it.', weight: 1 }],
            schedule: [{ inDays: 5, visible: false, label: 'The person in the file learns there is a file', effects: { hidden: { fear: +4 } } }],
          },
        };
      },
    },
    {
      id: 'refuse',
      label: 'Refuse it. Tell her to destroy it.',
      hint: 'Costs you information. She will not destroy it.',
      outcome: {
        text:
          '"Destroy it," you say. Sarran tilts her head about four degrees. "As you wish, {sir}."\n\nIt is not destroyed and you both know it. But you have shown her the kind of government you intend to run, and the civil service hears about it by lunchtime, because Grebs hears about everything by lunchtime.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +5, information: -3, power: -2 },
          hidden: { fear: -5 },
          regime: { reform: +8 },
          factions: { sable: { loyalty: -6, patience: -5 }, grey: { loyalty: +6 }, chorus: { loyalty: +4 } },
          characters: { sarran: { loyalty: -5, trust: +4 }, grebs: { loyalty: +6, trust: +5 } },
          remember: [{ who: 'sarran', text: 'You told her to destroy a file. She now knows where your limit is.', weight: -1 }],
        },
      },
    },
    {
      id: 'ask-hers',
      label: 'Ask her whether there is a file on you.',
      hint: 'A direct question. You may not enjoy how accurately she answers it.',
      outcome: (_s, rng) => {
        const bold = rng.chance(0.5);
        return bold
          ? {
              text:
                'Sarran does not blink. "There is a file on everyone, {sir}. Yours is four pages. It was nineteen before you took office."\n\nShe lets that sit. "Fifteen pages were moved into the file on your predecessor\'s death."\n\nThen she leaves.',
              tone: 'mixed',
              effects: {
                stats: { information: +6, legitimacy: -2 },
                hidden: { fear: +4, scandal: +7 },
                factions: { sable: { loyalty: +3, influence: +4 } },
                characters: { sarran: { trust: +8, influence: +5 } },
                flags: { knowsAboutStairwell: 1 },
                remember: [{ who: 'sarran', text: 'You asked her the direct question. She respected that.', weight: 2 }],
                schedule: [{ inDays: 6, visible: false, label: 'Fifteen pages, somewhere', cardId: 'stairwell-question' }],
              },
            }
          : {
              text:
                '"There is a file on everyone, {sir}." She says it pleasantly and moves on to shipping manifests.\n\nAbout ten minutes later you realise she never actually answered.',
              tone: 'neutral',
              effects: {
                stats: { information: +2 },
                hidden: { fear: +2 },
                characters: { sarran: { trust: +3 } },
              },
            };
      },
    },
  ],
},

{
  id: 'channel-seven',
  title: 'Buying the Evening News',
  category: 'scandal',
  actor: 'loz',
  faction: 'concord',
  stages: ['politics', 'afternoon'],
  base: 8,
  weight: (s) => 8 + s.hidden.scandal * 0.2 + (s.stats.support < 45 ? 7 : 0),
  body:
    'Dmitar Loz owns Channel Seven. Its 7pm bulletin is the most-watched programme in the country — about six adults in ten see it.\n\nHe is offering to sell you coverage: eleven minutes a night for a month, positive stories about you, placed in the main bulletin.\n\n"I am not offering you propaganda, {sir}. Propaganda is obvious and people switch off. I am offering you eleven minutes a night of looking competent. That has a price, like anything else."\n\nHis price is $5 billion.',
  flavor: 'He has called the news "the product" in front of parliament. Twice.',
  options: [
    {
      id: 'buy',
      label: 'Pay the $5 billion.',
      hint: 'Cost: $5.0B. Support climbs. You stop hearing bad news, including the bad news you need.',
      outcome: {
        text:
          'Within a week Channel Seven has established that you are calm in meetings, good with the elderly, and — in a segment nobody asked for — surprisingly well informed about pigeons.\n\nSupport goes up four points. Somewhere a twenty-six-year-old with a spreadsheet starts counting how many minutes of airtime you get compared to everybody else.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -5, support: +8, legitimacy: -3, information: -5 },
          hidden: { cult: +12, leak: +5 },
          regime: { personalism: +11, graft: +5 },
          factions: { concord: { loyalty: +5 }, chorus: { loyalty: -9 } },
          characters: { loz: { loyalty: +9 }, vel: { loyalty: -6 } },
          news: ['CHANNEL SEVEN LAUNCHES NIGHTLY "THE CHAIR AT WORK" SEGMENT'],
          schedule: [{ inDays: 7, visible: false, label: 'Somebody counts the airtime', cardId: 'minute-count' }],
        },
      },
    },
    {
      id: 'threaten',
      label: 'Remind him who issues his broadcast licence.',
      hint: 'Free. Loz is not a man who forgets being leaned on.',
      enabled: (s) => s.stats.power > 40,
      lockedText: 'He would laugh at you, and you cannot currently afford to be laughed at.',
      outcome: {
        text:
          'Loz\'s face does something complicated and then settles into a smile. "Of course, {sir}. The product serves the nation."\n\nCoverage turns positive within two days. It also turns slightly strange — a shade too glowing, in the way that anyone who has lived under three governments recognises instantly.',
        tone: 'mixed',
        effects: {
          stats: { support: +5, legitimacy: -5, power: +3, information: -7 },
          hidden: { cult: +9, leak: +10, scandal: +5 },
          regime: { repression: +11, personalism: +6 },
          factions: { concord: { loyalty: -5 }, chorus: { loyalty: -11 }, sable: { loyalty: +4 } },
          characters: { loz: { loyalty: -8, fear: +14, plotting: +8 } },
          remember: [{ who: 'loz', text: 'You threatened his broadcast licence.', weight: -2 }],
          schedule: [{ inDays: 6, visible: false, label: 'Loz finds somewhere else to put his opinions', effects: { hidden: { leak: +8, scandal: +6 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Turn it down. Let the coverage be whatever it is.',
      hint: 'Costs nothing and buys nothing. He will sell the airtime to somebody else.',
      outcome: {
        text:
          'Loz shrugs with his whole upper body. "Then I will sell them to someone who wants them."\n\nHe does. Two weeks of unusually flattering coverage of a certain popular provincial governor starts the following Monday, and everyone in the building pretends not to notice.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +3, information: +3 },
          regime: { reform: +4 },
          factions: { chorus: { loyalty: +4 }, provinces: { influence: +5 } },
          characters: { loz: { loyalty: -3 }, kostyn: { influence: +8 } },
          schedule: [{ inDays: 5, visible: false, label: 'Somebody else bought the airtime', effects: { characters: { kostyn: { influence: +6 } }, hidden: { separatism: +3 } } }],
        },
      },
    },
  ],
},

{
  id: 'garrison-rotation',
  title: 'The Garrison Rotation',
  category: 'security',
  actor: 'tern',
  faction: 'staff',
  stages: ['politics', 'government'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + s.hidden.coup * 0.35,
  body:
    'Colonel Tern requests the routine six-monthly rotation of the Capital Garrison. Two battalions out to Gorsk, two fresh battalions in from the Kordiva depots.\n\nIt is genuinely routine. It has happened twenty-two times since 1994.\n\nIt is also the most consequential piece of paperwork on your desk this week, because the Capital Garrison is the only armed force inside the capital.',
  flavor: 'The rotation window runs from 2am to 5am.',
  options: [
    {
      id: 'approve',
      label: 'Approve it as submitted.',
      hint: 'Normal and correct. You will not know who is in those barracks.',
      outcome: {
        text:
          'You sign. Tern sends a handwritten note thanking you for your trust — he keeps a copy of every note he sends.',
        tone: 'neutral',
        effects: {
          stats: { military: +3, security: -2 },
          hidden: { coup: +4 },
          factions: { staff: { loyalty: +4, power: +3 } },
          characters: { tern: { loyalty: +5, influence: +4 } },
          schedule: [{ inDays: 5, visible: false, label: 'The new battalions settle in', effects: { hidden: { coup: +3 } } }],
        },
      },
    },
    {
      id: 'vet',
      label: 'Approve it, but have the Sable Office vet the incoming officers.',
      hint: 'You will know who is in the barracks. The army will know you checked.',
      outcome: {
        text:
          'Sarran\'s people go through the officer lists overnight. Two names are quietly moved. Nobody says why.\n\nVarkov does not raise it. Tern raises it pleasantly, twice, then stops.',
        tone: 'mixed',
        effects: {
          stats: { security: +8, military: -4, information: +5 },
          hidden: { coup: -7, fear: +6 },
          regime: { repression: +8 },
          factions: { sable: { loyalty: +7, influence: +5 }, staff: { loyalty: -6, patience: -7 } },
          characters: { sarran: { loyalty: +6 }, tern: { loyalty: -6, fear: +9, plotting: +4 }, varkov: { trust: -4 } },
          remember: [{ who: 'tern', text: 'You had the Sable Office read his officer lists.', weight: -2 }],
        },
      },
    },
    {
      id: 'freeze',
      label: 'Freeze the rotation. Nobody moves this quarter.',
      hint: 'Nothing changes, which is the point. The army will want to know why.',
      outcome: {
        text:
          'The order goes out and the garrison stays exactly as Krast left it.\n\nVarkov asks you directly, in a corridor, whether there is something she should know.',
        tone: 'mixed',
        effects: {
          stats: { power: +4, military: -5, security: +3 },
          hidden: { coup: -4, fear: +5 },
          regime: { repression: +6, personalism: +5 },
          factions: { staff: { loyalty: -7, patience: -8 } },
          characters: { tern: { loyalty: -4, fear: +7 }, varkov: { trust: -5, plotting: +3 } },
          schedule: [{ inDays: 6, visible: true, label: 'The frozen rotation cannot stay frozen', cardId: 'garrison-rotation' }],
        },
      },
    },
  ],
},

/* ----------------------------------------------------------- DEVELOPMENT */

{
  id: 'hadem-road',
  once: true,
  title: 'The Road They Were Promised',
  category: 'opportunity',
  faction: 'provinces',
  stages: ['development'],
  base: 7,
  weight: (s) => 6 + s.hidden.separatism * 0.3,
  body:
    'There are two paved roads into the Hadem border region. A third has been "under consideration" since 1968 and is, in practice, a riverbed.\n\nThe Hadem councils have sent a delegation. They send one every four years. This is the first time a head of state has agreed to see them within two weeks of taking office.\n\nBuilding it costs $8 billion.',
  flavor: 'Two paved roads in. A third has waited since 1968.',
  options: [
    {
      id: 'build',
      label: 'Build the road. Tell the delegation yourself.',
      hint: 'Cost: $8.0B over several days. Ties the border region in — and opens it up.',
      outcome: {
        text:
          'The delegation does not cheer. One of them, an older woman who has been on four of these delegations, just says: "We will believe it when there is tarmac."\n\nThe army files a note observing that a third road runs in both directions.',
        tone: 'good',
        effects: {
          stats: { treasury: -8, support: +4, stability: +5, legitimacy: +5 },
          hidden: { separatism: -14, fiscal: +5 },
          regime: { reform: +9, devolution: +8 },
          factions: { provinces: { loyalty: +9 }, staff: { loyalty: -3 }, combine: { loyalty: +4 } },
          characters: { kostyn: { loyalty: +4 }, varkov: { trust: -2 } },
          project: {
            name: 'The third Hadem road',
            days: 6,
            upkeep: 0.3,
            detail: 'Tarmac into the border region. Fifty-seven years late.',
            legacy: 'built the third road into the Hadem region, fifty-seven years late',
            onComplete: {
              stats: { legitimacy: +5, support: +4, economy: +3 },
              hidden: { separatism: -10 },
              news: ['THIRD HADEM ROAD OPENS — "WE WILL BELIEVE IT WHEN THERE IS TARMAC," SAYS WOMAN STANDING ON TARMAC'],
            },
          },
          news: ['GOVERNMENT COMMITS TO THIRD HADEM ROAD'],
        },
      },
    },
    {
      id: 'garrison',
      label: 'Send troops instead. Roads can wait, order cannot.',
      hint: 'Cost: $2.0B. Immediate and cheap. The region learns what it is to you.',
      outcome: {
        text:
          'Two companies go in on Thursday. The burned customs posts stop burning immediately.\n\nDrovnan radio has an excellent week. Folk music, then arson, then folk music.',
        tone: 'bad',
        effects: {
          stats: { treasury: -2, stability: +7, security: +5, legitimacy: -6, support: -3 },
          hidden: { separatism: +12, unrest: +5, foreign: +7 },
          regime: { repression: +12, militarism: +7 },
          factions: { staff: { loyalty: +6 }, provinces: { loyalty: -10, patience: -9 }, chorus: { loyalty: -7 } },
          characters: { varkov: { loyalty: +4 }, vel: { loyalty: -6 } },
          schedule: [{ inDays: 5, visible: false, label: 'The border region reacts to the troops', effects: { hidden: { separatism: +7, unrest: +5 } } }],
        },
      },
    },
    {
      id: 'promise',
      label: 'Promise the road. Fund it next cycle.',
      hint: 'Free today. They have heard this exact sentence fourteen times.',
      outcome: {
        text:
          'The older woman on the delegation writes the date in a small notebook. It is not the first date she has written in it.',
        tone: 'mixed',
        effects: {
          stats: { support: +2, legitimacy: -2 },
          hidden: { separatism: +3 },
          regime: { populism: +4 },
          factions: { provinces: { loyalty: +3, patience: -7 } },
          promise: { text: 'The third road into the Hadem region', to: 'provinces', inDays: 7 },
          schedule: [{ inDays: 7, visible: true, label: 'The Hadem councils ask about the road', cardId: 'hadem-road-due' }],
        },
      },
    },
  ],
},

{
  id: 'saint-dovra',
  once: true,
  title: 'Dovra Day',
  category: 'decision',
  actor: 'vask',
  faction: 'provinces',
  stages: ['development', 'politics'],
  base: 6,
  minDay: 1,
  weight: (s) => 6 + (s.stats.support < 45 ? 6 : 0) + s.hidden.unrest * 0.1,
  body:
    'Dovra Day is the national holiday. Four-hour parade, two hundred thousand people, and one tradition: the head of state walks the last kilometre on foot, in whatever weather there is.\n\nIt has rained in the capital for nine days straight. A lot of Velmorrans think the weather in the capital reflects how honest the government is.\n\nArchon Vask would like to know your plans.',
  flavor: 'Nine days of rain, straight.',
  options: [
    {
      id: 'walk',
      label: 'Walk it. In the rain.',
      hint: 'Costs nothing except your dignity. Velmorrans remember who walked.',
      outcome: (s, rng) => {
        const great = rng.chance(0.55 + s.stats.support / 400);
        return great
          ? {
              text:
                'You walk it. It rains sideways the entire way and by the four-hundred-metre mark you have stopped pretending to be dry, which is the moment the crowd decides it likes you.\n\nThe photograph — soaked, grinning, holding a child\'s umbrella that is achieving nothing — runs on every front page in the country. Loz runs it for free, which has never happened before.',
              tone: 'good',
              effects: {
                stats: { support: +11, legitimacy: +7, stability: +4 },
                hidden: { cult: +8, unrest: -7 },
                regime: { populism: +11, personalism: +7 },
                factions: { all: { loyalty: +2 }, provinces: { loyalty: +5 }, chorus: { loyalty: +4 } },
                characters: { vask: { loyalty: +8, trust: +6 }, loz: { loyalty: +3 } },
                news: ['"THE ONE WHO WALKED" — SOAKED CHAIR FINISHES DOVRA KILOMETRE'],
                schedule: [{ inDays: 8, visible: false, label: 'The photograph takes on a life of its own', effects: { hidden: { cult: +6 }, stats: { support: +3 } } }],
              },
            }
          : {
              text:
                'You walk it. Eight hundred metres in, a gust takes the ceremonial sash into a storm drain and you spend a genuinely difficult forty seconds deciding whether to go after it.\n\nYou go after it. The clip is watched four million times. Opinion is split on whether it was humble or humiliating.',
              tone: 'mixed',
              effects: {
                stats: { support: +4, legitimacy: +2 },
                hidden: { cult: +3, unrest: -3 },
                regime: { populism: +7 },
                factions: { provinces: { loyalty: +3 }, chorus: { loyalty: +2 } },
                characters: { vask: { loyalty: +5 } },
                news: ['SASH RETRIEVED FROM DRAIN; NATION DIVIDED'],
              },
            };
      },
    },
    {
      id: 'car',
      label: 'Take the car. Cite security.',
      hint: 'Dry and safe. Also exactly the thing this country notices.',
      outcome: {
        text:
          'The motorcade covers the last kilometre in ninety seconds behind tinted glass.\n\nNobody boos. That would be rude. Two hundred thousand people just stand in the rain and watch a car go past, and by Thursday the phrase "the one who took the car" exists, and a week later it has stopped being a joke.',
        tone: 'bad',
        effects: {
          stats: { support: -8, legitimacy: -5, security: +2 },
          hidden: { unrest: +6, cult: -5 },
          regime: { repression: +4 },
          factions: { provinces: { loyalty: -6 }, chorus: { loyalty: -5 }, sable: { loyalty: +3 } },
          characters: { vask: { loyalty: -7 } },
          news: ['CHAIR COMPLETES DOVRA KILOMETRE BY MOTORCADE'],
          schedule: [{ inDays: 6, visible: false, label: '"The one who took the car"', effects: { stats: { support: -3 }, hidden: { cult: -4 } } }],
        },
      },
    },
    {
      id: 'expand',
      label: 'Walk it, and have the state pay for the whole festival.',
      hint: 'Cost: $4.0B. A very good day, and a very visible use of money you may not have.',
      outcome: {
        text:
          'Free drinks in six regions, the parade extended to two days, and the Pigeon Federation given a ceremonial flypast that goes about as well as a ceremonial pigeon flypast can go.\n\nThe country has a wonderful time. Brask watches the invoices arrive with the expression of a man watching a building settle.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -4, support: +13, stability: +6, legitimacy: +3 },
          hidden: { cult: +11, unrest: -9, fiscal: +5 },
          regime: { populism: +14, personalism: +8 },
          factions: { all: { loyalty: +2 }, provinces: { loyalty: +6 }, combine: { loyalty: +4 } },
          characters: { vask: { loyalty: +9 }, brask: { loyalty: -4, trust: -3 } },
          news: ['TWO-DAY DOVRA FESTIVAL DECLARED; PIGEON FLYPAST "MOSTLY SUCCESSFUL"'],
          schedule: [{ inDays: 5, visible: true, label: 'Festival invoices clear', effects: { stats: { treasury: -2 } } }],
        },
      },
    },
  ],
},

/* ------------------------------------------------------- FOREIGN / CRISIS */

{
  id: 'ostrene-lithium',
  title: 'Ostrene Wants a Five-Year Price Lock',
  category: 'foreign',
  actor: 'piek',
  stages: ['government', 'afternoon'],
  base: 7,
  minDay: 1,
  weight: (s) => 7 + s.hidden.foreign * 0.15 + (s.stats.treasury < 35 ? 5 : 0),
  body:
    'Ostrene wants to fix the price of Velmorran lithium for five years. Their offer is eleven per cent below today\'s market price and sixteen per cent above what Brask thinks the market will be doing in a year.\n\nOstrene buys 44% of your exports. Their ambassador does not request meetings, he schedules them. He has scheduled this one for Thursday and sent the draft in advance.',
  flavor: 'Piek thinks it is a good deal. Piek thinks most things are a good deal.',
  options: [
    {
      id: 'sign',
      label: 'Sign it. Five years of certainty.',
      hint: 'Gains $9.0B now and steady income. Hands your only real leverage to one buyer.',
      outcome: {
        text:
          'The signing is warm and takes eleven minutes. The ambassador calls Velmorra "a mature partner", which is the highest compliment Ostrene has ever paid a country it can see from its own border.\n\nBrask files a one-page note recommending against it — after you have already signed.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +9, economy: +4, legitimacy: -3 },
          hidden: { foreign: -12, fiscal: -6 },
          regime: { technocracy: +4, isolation: +6 },
          factions: { concord: { loyalty: +6 }, combine: { loyalty: +3 }, chorus: { loyalty: -6 } },
          characters: { piek: { loyalty: +7, influence: +4 }, brask: { trust: -2 } },
          commitments: [{ label: 'Ostrene lithium contract', perDay: -0.25 }],
          schedule: [{ inDays: 8, visible: false, label: 'Ostrene asks for a second thing', cardId: 'ostrene-second' }],
        },
      },
    },
    {
      id: 'counter',
      label: 'Counter: three years, and they pay for the Gorsk rail line.',
      hint: 'A real negotiation. They may respect it. They are not in the habit.',
      outcome: (s, rng) => {
        const win = rng.chance(0.35 + s.stats.power / 250 + CHARACTER_MAP.piek.competence / 600);
        return win
          ? {
              text:
                'They take it. The ambassador is visibly annoyed for about four seconds before the professional face comes back, and four seconds is a substantial diplomatic win for a country this size.\n\nGorsk gets its rail line. Hess sends a one-word message: "Noted."',
              tone: 'good',
              effects: {
                stats: { treasury: +5, economy: +5, legitimacy: +6, power: +4 },
                hidden: { foreign: -5 },
                regime: { technocracy: +9, reform: +5 },
                factions: { combine: { loyalty: +8 }, concord: { loyalty: +4 }, chorus: { loyalty: +4 } },
                characters: { piek: { loyalty: +6, trust: +5 }, hess: { loyalty: +7 } },
                project: {
                  name: 'Gorsk rail line',
                  days: 7,
                  detail: 'Paid for by Ostrene. Moves lithium faster and gives the unions something to lose.',
                  legacy: 'got Ostrene to pay for the Gorsk rail line, which had not been done before',
                  onComplete: { stats: { economy: +5, treasury: +3 }, factions: { combine: { loyalty: +5 } }, news: ['GORSK RAIL LINE OPENS AHEAD OF SCHEDULE'] },
                },
                news: ['VELMORRA WINS RAIL CONCESSION IN LITHIUM TALKS'],
              },
            }
          : {
              text:
                'They do not take it. The ambassador smiles, closes the folder, and mentions — apparently at random — that gas contracts are also renewed annually.\n\nThe offer is withdrawn. The mention of gas contracts was a warning, not small talk.',
              tone: 'bad',
              effects: {
                stats: { economy: -4, treasury: -1, legitimacy: +2 },
                hidden: { foreign: +14, fiscal: +5 },
                regime: { isolation: +5 },
                factions: { concord: { loyalty: -5 } },
                characters: { piek: { loyalty: -4, trust: -3 } },
                schedule: [{ inDays: 5, visible: true, label: 'Ostrene reviews the gas price', effects: { stats: { economy: -3, treasury: -2 }, hidden: { foreign: +6 } } }],
              },
            };
      },
    },
    {
      id: 'aureth',
      label: 'Stall, and quietly ask the Aureth Union what they would pay.',
      hint: 'Leverage, if it works. Ostrene finds out about these things.',
      outcome: {
        text:
          'Piek makes the approach at a dinner and thoroughly enjoys himself. The Aureth response is warm, vague, and uses the word "conditions" three times.\n\nOn Friday the Ostrene ambassador mentions in passing that he hopes the dinner was enjoyable. He does not say which dinner.',
        tone: 'mixed',
        effects: {
          stats: { information: +4, economy: -2, legitimacy: +2 },
          hidden: { foreign: +9, leak: +6 },
          regime: { reform: +4 },
          factions: { chorus: { loyalty: +4 }, concord: { loyalty: -3 } },
          characters: { piek: { loyalty: +3, trust: -4 } },
          flags: { aurethContact: 1 },
          schedule: [
            { inDays: 4, visible: false, label: 'The Aureth Union names its conditions', cardId: 'aureth-loan' },
            { inDays: 6, visible: false, label: 'Ostrene registers its displeasure', effects: { hidden: { foreign: +7 } } },
          ],
        },
      },
    },
  ],
},

{
  id: 'gorsk-strike-notice',
  title: 'Ten Days\' Strike Notice',
  category: 'crisis',
  actor: 'hess',
  faction: 'combine',
  stages: ['politics', 'afternoon'],
  base: 7,
  weight: (s) => 6 + (55 - s.factions.combine.loyalty) * 0.3 + s.hidden.unrest * 0.2,
  body:
    'Bogdan Hess will not sit down. He says the chairs are a tactic.\n\n"Ten days\' notice. The Gorsk mines and the Mavro cranes, together. Not a protest — a stoppage. I am giving you notice because the law requires it, and because my father gave notice to your predecessor\'s predecessor and got shot at for it. I would like this one to go differently."\n\nThe wage claim is worth about $6 billion a year.',
  flavor: 'The wage claim is worth $6 billion a year.',
  options: [
    {
      id: 'meet-wages',
      label: 'Meet the wage claim in full.',
      hint: 'Cost: $6.0B plus a permanent wage bill. Ends it cleanly. Every other union is watching.',
      outcome: {
        text:
          'Hess shakes your hand, which he has not done before, and leaves without finishing his sentence about the chairs.\n\nWithin four days the railway workers, the teachers and — seriously — the Pigeon Federation\'s paid staff have all opened "exploratory discussions".',
        tone: 'mixed',
        effects: {
          stats: { treasury: -6, stability: +9, support: +4, economy: -2 },
          hidden: { unrest: -12, fiscal: +6 },
          regime: { populism: +7 },
          factions: { combine: { loyalty: +13 }, concord: { loyalty: -7 }, grey: { patience: -4 } },
          characters: { hess: { loyalty: +11, trust: +8 }, adamek: { loyalty: -5 }, brask: { trust: -3 } },
          remember: [{ who: 'hess', text: 'You met the wage claim without a fight.', weight: 3 }],
          commitments: [{ label: 'Mining and dock wage settlement', perDay: 0.22 }],
          schedule: [{ inDays: 5, visible: true, label: 'Other unions open "exploratory discussions"', cardId: 'wage-contagion' }],
        },
      },
    },
    {
      id: 'negotiate',
      label: 'Offer half now, half tied to lithium revenue.',
      hint: 'Cost: $3.0B now. Hess is not stupid, but he is tired of being right.',
      outcome: (s, rng) => {
        const accept = rng.chance(0.45 + s.characters.hess.trust / 250 + s.factions.combine.loyalty / 400);
        return accept
          ? {
              text:
                'Hess thinks about it for an uncomfortably long time — long enough that you can hear the air conditioning — and then says: "Half now. And you put the lithium clause in the official gazette, where I can point at it."\n\nYou do. It is the first written commitment a Velmorran government has made to the unions since 1961.',
              tone: 'good',
              effects: {
                stats: { treasury: -3, stability: +7, legitimacy: +4 },
                hidden: { unrest: -9 },
                regime: { reform: +7, technocracy: +5 },
                factions: { combine: { loyalty: +8 }, concord: { loyalty: -3 } },
                characters: { hess: { loyalty: +8, trust: +9 } },
                commitments: [{ label: 'Partial wage settlement', perDay: 0.11 }],
                promise: { text: 'Lithium-linked wage top-up for the unions', to: 'combine', inDays: 8 },
                schedule: [{ inDays: 8, visible: true, label: 'The lithium clause comes due', cardId: 'lithium-clause-due' }],
              },
            }
          : {
              text:
                '"Half," says Hess. "And the other half depends on a price set in Ostrene." He puts his coat on. "I will take that to the mines. I will not recommend it."\n\nThe notice stands. Eight days.',
              tone: 'bad',
              effects: {
                stats: { treasury: -3, stability: -4 },
                hidden: { unrest: +8 },
                factions: { combine: { loyalty: -5, patience: -8 } },
                characters: { hess: { loyalty: -3, trust: -2 } },
                schedule: [{ inDays: 4, visible: true, label: 'The stoppage begins', cardId: 'strike-begins' }],
              },
            };
      },
    },
    {
      id: 'refuse',
      label: 'Refuse, and point out that strikes in strategic sectors are illegal.',
      hint: 'Costs nothing now. The unions have never forgotten a law used against them.',
      outcome: {
        text:
          'Hess listens to the whole sentence without moving. Then: "My father was told that too."\n\nHe leaves without slamming the door. Men like Hess never slam doors. By the evening the phrase "strategic sectors" is on a handmade sign in Gorsk, which is quick work for a mining town.',
        tone: 'bad',
        effects: {
          stats: { stability: -8, support: -5, power: +2 },
          hidden: { unrest: +14 },
          regime: { repression: +10 },
          factions: { combine: { loyalty: -14, patience: -16 }, concord: { loyalty: +6 }, chorus: { loyalty: -5 } },
          characters: { hess: { loyalty: -12, plotting: +6 }, adamek: { loyalty: +5 } },
          remember: [{ who: 'hess', text: 'You quoted the strategic-sectors law at him. His father was told the same thing.', weight: -3 }],
          schedule: [{ inDays: 3, visible: true, label: 'The stoppage begins', cardId: 'strike-begins' }],
        },
      },
    },
  ],
},

{
  id: 'pigeon-schism',
  once: true,
  title: 'The Pigeon Federation Has Split',
  category: 'decision',
  stages: ['development', 'politics'],
  base: 5,
  minDay: 1,
  weight: () => 5,
  body:
    'The Velmorran Pigeon Federation has split in two.\n\nThe northern clubs say a bird released from a moving vehicle has not been properly released. The coastal clubs say that is "rich talk from people who own cars". Both have written to you. Between them they have 400,000 members and all of them vote.\n\nThey want a ruling from the head of state. They are completely serious.',
  flavor: 'Krast laughed at them in 2014 and lost the coast for six years.',
  options: [
    {
      id: 'north',
      label: 'Rule for the northern clubs.',
      hint: 'Free. The farm belt is delighted. The ports are not.',
      outcome: {
        text:
          'The ruling goes out on official paper with the state seal, because anything less would be an insult and everyone involved is entirely serious.\n\nKordiva is delighted. Mavro is furious. A dockworker on the 7pm news describes it as "the capital telling the sea how to fly".',
        tone: 'mixed',
        effects: {
          stats: { support: +2, stability: -2 },
          factions: { provinces: { loyalty: +6 }, combine: { loyalty: -4 } },
          characters: { kostyn: { loyalty: +4 }, hess: { loyalty: -3 } },
          news: ['STATE SEAL USED ON PIGEON RULING; MAVRO FURIOUS'],
        },
      },
    },
    {
      id: 'coast',
      label: 'Rule for the coastal clubs.',
      hint: 'Free. The ports are delighted. The countryside adds it to the list.',
      outcome: {
        text:
          'Mavro celebrates. The Kordiva clubs announce they will "compete independently", which is a split inside a split, and which the civil service informs you may require actual legislation.',
        tone: 'mixed',
        effects: {
          stats: { support: +2, stability: -2 },
          factions: { combine: { loyalty: +5 }, provinces: { loyalty: -5 } },
          characters: { hess: { loyalty: +3 }, kostyn: { loyalty: -3 } },
          news: ['COASTAL RULING SPLITS FEDERATION FURTHER; LEGISLATION MAY BE NEEDED'],
        },
      },
    },
    {
      id: 'unify',
      label: 'Refuse to rule. Pay for a unity conference instead.',
      hint: 'Cost: $1.0B and some dignity. Might actually work.',
      outcome: (_s, rng) => {
        const ok = rng.chance(0.55);
        return ok
          ? {
              text:
                'Three days in a conference hall, an enormous drinks bill, and a compromise on vehicle releases that nobody is happy with and everybody signs.\n\nThey make you Honorary Patron of the reunified Federation. It is the silliest title you hold. It is also 400,000 people who will now take your calls.',
              tone: 'good',
              effects: {
                stats: { treasury: -1, support: +6, legitimacy: +4, stability: +3 },
                hidden: { cult: +4, unrest: -4 },
                regime: { populism: +6 },
                factions: { all: { loyalty: +2 }, provinces: { loyalty: +4 }, combine: { loyalty: +4 } },
                flags: { pigeonPatron: 1 },
                news: ['PIGEON FEDERATION REUNIFIED; CHAIR NAMED HONORARY PATRON'],
              },
            }
          : {
              text:
                'Three days in a conference hall, an enormous drinks bill, and a fistfight on the second evening that is filmed from four angles.\n\nThe Federation is now in three pieces. You paid for this.',
              tone: 'bad',
              effects: {
                stats: { treasury: -1, support: -4, legitimacy: -3 },
                factions: { provinces: { loyalty: -3 }, combine: { loyalty: -3 }, chorus: { loyalty: -2 } },
                news: ['UNITY CONFERENCE ENDS IN FIGHT; FEDERATION NOW IN THREE PIECES'],
              },
            };
      },
    },
  ],
},

{
  id: 'student-petition',
  once: true,
  title: 'Forty Thousand Signatures',
  category: 'decision',
  actor: 'vel',
  faction: 'chorus',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 1,
  weight: (s) => 5 + (50 - s.stats.legitimacy) * 0.15 + s.hidden.unrest * 0.12,
  body:
    'Sanna Vel walks the petition to your gate herself, live, with two hundred thousand people watching the stream.\n\nForty thousand signatures. One demand: repeal Article 19, the law that lets the Sable Office hold someone for ninety days without charge.\n\n"You did not write Article 19," she says. "That is exactly why you can repeal it."',
  flavor: 'Forty thousand signatures. Two hundred thousand watching live.',
  options: [
    {
      id: 'repeal',
      label: 'Repeal Article 19.',
      hint: 'Free, and a real reform. The Sable Office loses its favourite tool and notices.',
      outcome: {
        text:
          'The repeal goes through parliament in one afternoon, because parliament approves what it is handed.\n\nSarran says nothing. No note, no objection, no memo. Three days later the daily intelligence summary arrives four pages shorter, with no explanation.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +12, support: +7, security: -9, information: -5 },
          hidden: { unrest: -8, fear: -9, leak: +4 },
          regime: { reform: +16 },
          factions: { chorus: { loyalty: +15 }, sable: { loyalty: -14, patience: -12 }, staff: { loyalty: -4 }, grey: { loyalty: +5 } },
          characters: { vel: { loyalty: +12, trust: +10 }, sarran: { loyalty: -12, plotting: +7 } },
          remember: [
            { who: 'vel', text: 'You repealed Article 19 when she asked.', weight: 3 },
            { who: 'sarran', text: 'You took Article 19 away from her.', weight: -3 },
          ],
          news: ['ARTICLE 19 REPEALED — "THE FIRST HONEST THING IN A DECADE," SAYS VEL'],
          schedule: [{ inDays: 6, visible: false, label: 'The Sable Office adjusts to the new law', effects: { stats: { security: -3, information: -3 }, hidden: { leak: +5 } } }],
        },
      },
    },
    {
      id: 'review',
      label: 'Announce a review. Put Grebs in charge of it.',
      hint: 'Buys time. Grebs will actually do the review, which may not be what you meant.',
      outcome: {
        text:
          'Vel looks at you for a long moment. "A review," she says, with no inflection at all.\n\nGrebs accepts. In nineteen years she has never chaired a review that produced nothing.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +3, support: +1, information: +2 },
          hidden: { unrest: +2 },
          regime: { technocracy: +7 },
          factions: { chorus: { loyalty: -3 }, grey: { loyalty: +6 }, sable: { patience: -5 } },
          characters: { grebs: { loyalty: +6, influence: +5 }, vel: { trust: -4 } },
          schedule: [{ inDays: 7, visible: true, label: 'The Grebs review reports', cardId: 'grebs-review' }],
        },
      },
    },
    {
      id: 'ignore',
      label: 'Thank her for the petition. File it.',
      hint: 'Costs nothing. She live-streamed the walk to your gate.',
      outcome: {
        text:
          'The petition is received, photographed and filed. Vel does not complain.\n\nShe reads the names out instead. All forty thousand of them, in shifts, on the stream, over nine days. By day four it is the most-watched thing in the country.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -6, support: -4 },
          hidden: { unrest: +9, leak: +4 },
          regime: { repression: +5 },
          factions: { chorus: { loyalty: -11 }, sable: { loyalty: +5 } },
          characters: { vel: { loyalty: -8, influence: +9 }, sarran: { loyalty: +4 } },
          remember: [{ who: 'vel', text: 'You filed forty thousand signatures without reading one.', weight: -2 }],
          schedule: [{ inDays: 4, visible: false, label: 'She is still reading out the names', effects: { stats: { support: -3, legitimacy: -3 }, hidden: { unrest: +6 } } }],
        },
      },
    },
    {
      id: 'arrest',
      label: 'Have the Sable Office arrest her under Article 19.',
      hint: 'Ninety days without charge. Nothing about this can be undone.',
      enabled: (s) => s.stats.power > 45 && s.factions.sable.loyalty > 40,
      lockedText: 'The Sable Office would not carry out that order for you today.',
      outcome: {
        text:
          'They take her at 4:40am, on the stream, mid-sentence.\n\nThe country is very quiet for about eleven hours. Then the main square starts filling, and the Sable Office reports that it is filling faster than they can count.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -18, support: -14, security: +5, power: +4, stability: -10 },
          hidden: { unrest: +26, fear: +16, leak: +8, scandal: +12 },
          regime: { repression: +22, personalism: +9 },
          factions: { chorus: { loyalty: -28, patience: -25 }, sable: { loyalty: +10 }, combine: { loyalty: -9 }, grey: { loyalty: -6 } },
          characters: { vel: { loyalty: -25, influence: +14 }, sarran: { loyalty: +9 }, doran: { fear: +8 } },
          scandal: { name: 'The 4:40am arrest', detail: 'The opposition leader taken live on air, under a law you had been asked to repeal.', heat: 55 },
          news: ['OPPOSITION LEADER ARRESTED LIVE ON AIR'],
          schedule: [{ inDays: 2, visible: true, label: 'The main square is filling', cardId: 'alert-square' }],
        },
      },
    },
  ],
},

{
  id: 'doran-warning',
  title: 'Someone Is Taking Meetings Off the Books',
  category: 'person',
  actor: 'doran',
  stages: ['politics', 'night', 'afternoon'],
  base: 7,
  minDay: 1,
  weight: (s) => 6 + s.hidden.coup * 0.15 + s.hidden.scandal * 0.12,
  body:
    'Doran shuts the door and uses your first name, which is how you know it is serious.\n\n"Somebody in this building is taking meetings they are not putting in the diary. I know because I am the person who keeps the diary." She lets that sit. "I can find out who. It will cost you something, and I want to be straight with you about what."',
  flavor: 'She got you this job. She is keeping a running total of what you owe her.',
  options: [
    {
      id: 'let-her',
      label: '"Find out. Whatever it costs."',
      hint: 'You learn something real. Doran gets a bigger claim on you.',
      outcome: (s, rng) => {
        const candidates = ['tern', 'piek', 'kostyn', 'adamek', 'loz'].filter((c) => s.characters[c]?.inPost);
        const who = rng.weighted(candidates, (c) => 1 + s.characters[c].plotting * 0.2) ?? 'tern';
        const lines: Record<string, string> = {
          tern: 'Colonel Tern. Four dinners, none in the diary, all in Gorsk.',
          piek: 'Orlan Piek. Three lunches at the Aureth residence, all logged as personal.',
          kostyn: 'Governor Kostyn. Two trips to the capital that appear on no schedule, both to the same address in the Free Zone.',
          adamek: 'Rulf Adamek. Six meetings in this building. None of them with you.',
          loz: 'Dmitar Loz. Editorial meetings that three of your ministers attended. Not as guests.',
        };
        return {
          text: `Two days later she puts one page on your desk. Not a file — Doran does not do files. Times, rooms, and one name.\n\n${lines[who]}\n\n"That's yours now," she says. "I'd like you to remember that I gave it to you."`,
          tone: 'mixed',
          effects: {
            stats: { information: +10, security: +4 },
            hidden: { fear: +4 },
            flags: { [`watching:${who}`]: 1, doranOwed: 1 },
            characters: { doran: { loyalty: +5, influence: +8 }, [who]: { fear: +6 } },
            remember: [{ who: 'doran', text: 'You let her do the digging, and she is keeping score.', weight: 1 }],
            schedule: [{ inDays: 5, visible: false, label: 'Doran mentions what she is owed', cardId: 'doran-collects' }],
          },
        };
      },
    },
    {
      id: 'sable',
      label: '"Give it to Sarran instead."',
      hint: 'More thorough. Now the security service is investigating your own staff.',
      outcome: {
        text:
          'Doran\'s expression does not change. "Of course, {sir}." She has not called you that since the swearing-in.\n\nThe Sable Office is extremely thorough. Within a week four people in the building have stopped speaking freely in any room, including the ones who were not doing anything.',
        tone: 'mixed',
        effects: {
          stats: { security: +9, information: +6, power: +2 },
          hidden: { fear: +12, leak: +3 },
          regime: { repression: +11 },
          factions: { sable: { loyalty: +8, influence: +7 }, grey: { loyalty: -5, patience: -6 } },
          characters: { sarran: { loyalty: +7, influence: +6 }, doran: { loyalty: -9, trust: -8, plotting: +6 } },
          remember: [{ who: 'doran', text: 'She offered you her loyalty and you handed the job to the Sable Office.', weight: -3 }],
        },
      },
    },
    {
      id: 'drop',
      label: '"Leave it. I don\'t want a building full of frightened people."',
      hint: 'Decent. Also means you will not find out until it happens.',
      outcome: {
        text:
          'Doran nods slowly. "All right." She opens the door, then stops halfway out.\n\n"For what it\'s worth, that\'s the right answer, and it\'s going to cost you."\n\nShe is correct on both counts.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +3, security: -4, information: -3 },
          hidden: { fear: -8 },
          regime: { reform: +5 },
          factions: { grey: { loyalty: +6 }, sable: { patience: -3 } },
          characters: { doran: { loyalty: +8, trust: +9 } },
          remember: [{ who: 'doran', text: 'You refused to have your own building searched.', weight: 2 }],
          schedule: [{ inDays: 4, visible: false, label: 'The off-diary meetings continue', effects: { hidden: { coup: +5, scandal: +4 } } }],
        },
      },
    },
  ],
},

{
  id: 'adamek-card',
  title: 'He Writes the Number on a Card',
  category: 'opportunity',
  actor: 'adamek',
  faction: 'concord',
  stages: ['politics', 'government'],
  base: 6,
  minDay: 1,
  weight: (s) => 5 + (s.stats.treasury < 35 ? 8 : 0) + s.hidden.corruption * 0.15,
  body:
    'Adamek never says a number out loud. He writes it down and slides it across the desk.\n\nThe card says what Ilvet Instruments will put into the national infrastructure fund this quarter. It says $14 billion.\n\nOn the back, in the same handwriting, is the name of a ministry he would like a say in.',
  flavor: 'He has never held office. He has chosen four ministers.',
  options: [
    {
      id: 'take',
      label: 'Take the $14B. Give him the ministry.',
      hint: 'Gains $14.0B immediately. A private citizen now runs a department of your government.',
      outcome: {
        text:
          'The money clears in a day and a half, which no state process in this country has ever managed.\n\nThe appointment is announced as "a technical selection". That is true: the man is a technical expert. He has also been Adamek\'s technical expert for eleven years.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +14, economy: +3, legitimacy: -7, elite: +8 },
          hidden: { corruption: +18, fiscal: -8, leak: +6 },
          regime: { graft: +18, patronage: +12 },
          factions: { concord: { loyalty: +14, influence: +9 }, chorus: { loyalty: -8 }, grey: { loyalty: -7, patience: -6 } },
          characters: { adamek: { loyalty: +12, influence: +10 }, grebs: { loyalty: -6, trust: -5 } },
          scandal: { name: 'The Ilvet appointment', detail: 'A government department answering to a man who has never stood for election.', heat: 30 },
          schedule: [{ inDays: 7, visible: false, label: 'Adamek\'s ministry starts making decisions', effects: { hidden: { corruption: +8 }, stats: { economy: +2, legitimacy: -3 } } }],
        },
      },
    },
    {
      id: 'money-only',
      label: 'Take the money. Refuse the ministry.',
      hint: 'Gains $6.0B instead of $14.0B, and a man who now thinks you are unreliable.',
      outcome: {
        text:
          'Adamek takes the card back, writes a new number and slides it over. It is much smaller.\n\n"That one," he says pleasantly, "is the price of a donation. The other one was the price of a relationship."',
        tone: 'mixed',
        effects: {
          stats: { treasury: +6, legitimacy: -2, elite: +2 },
          hidden: { corruption: +6, fiscal: -3 },
          regime: { graft: +7 },
          factions: { concord: { loyalty: +3 }, grey: { loyalty: +2 } },
          characters: { adamek: { loyalty: -2, trust: -3 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Push the card back across the desk.',
      hint: 'Turns down $14.0B. He will remember the gesture exactly.',
      outcome: {
        text:
          'Adamek looks at the card lying between you, then picks it up and tears it once, neatly, before putting it in his pocket.\n\n"I have done this with nine heads of state," he says. "You are the third to do that."',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +8, elite: -6, treasury: -1 },
          hidden: { corruption: -8 },
          regime: { reform: +12 },
          factions: { concord: { loyalty: -9, patience: -8 }, chorus: { loyalty: +7 }, grey: { loyalty: +7 }, combine: { loyalty: +5 } },
          characters: { adamek: { loyalty: -8, plotting: +6 }, grebs: { loyalty: +7, trust: +6 }, vel: { trust: +5 } },
          remember: [{ who: 'adamek', text: 'You pushed the card back. He tore it up.', weight: -2 }],
          schedule: [{ inDays: 6, visible: false, label: 'The Concord reviews its arrangements', effects: { stats: { economy: -3 }, factions: { concord: { loyalty: -4 } } } }],
        },
      },
    },
  ],
},

{
  id: 'stairwell-question',
  title: 'Someone Finally Asked About the Stairwell',
  category: 'scandal',
  stages: ['afternoon', 'politics'],
  base: 5,
  minDay: 2,
  once: true,
  weight: (s) => 4 + s.hidden.scandal * 0.25 + s.hidden.leak * 0.2,
  body:
    'At the end of a routine press session, a young reporter from a paper nobody reads asks the question nobody has asked on the record.\n\n"Who was in the stairwell with Tomas Krast?"\n\nThe room goes quiet enough that you can hear the building.',
  flavor: 'The state autopsy says heart attack. Krast was fifty-one, with no history of heart problems.',
  options: [
    {
      id: 'honest',
      label: '"I don\'t know. I\'ve asked. I haven\'t been told."',
      hint: 'True, probably. It also announces that you do not control your own security service.',
      outcome: {
        text:
          'The clip runs everywhere. Half the country finds it disarmingly honest. The other half notices that the head of state has said on camera that there is something the security service will not tell him.\n\nSarran watches the clip twice.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +6, power: -5, support: +3 },
          hidden: { scandal: +8, fear: -4 },
          regime: { reform: +7 },
          factions: { chorus: { loyalty: +9 }, sable: { loyalty: -8, patience: -7 }, staff: { loyalty: -3 } },
          characters: { sarran: { loyalty: -7, trust: +5 }, vel: { trust: +7 } },
          news: ['"I HAVE ASKED. I HAVE NOT BEEN TOLD." — CHAIR ON KRAST DEATH'],
          schedule: [{ inDays: 5, visible: false, label: 'Somebody decides to tell the reporter instead', effects: { hidden: { leak: +12, scandal: +8 } } }],
        },
      },
    },
    {
      id: 'stonewall',
      label: '"The matter is closed. Next question."',
      hint: 'Gets you through the afternoon. Guarantees the question comes back bigger.',
      outcome: {
        text:
          'It works in the room for about eleven seconds.\n\n"The matter is closed" is on protest signs within a week. Somebody prints it on a t-shirt. The t-shirt outsells the official Krast memorial mug nine to one.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -7, support: -4, power: +2 },
          hidden: { scandal: +14, leak: +8, unrest: +5 },
          regime: { repression: +7 },
          factions: { chorus: { loyalty: -9 }, sable: { loyalty: +6 } },
          characters: { sarran: { loyalty: +5 }, vel: { loyalty: -5 } },
          scandal: { name: 'The stairwell', detail: 'Nobody has said who was in it. Everybody has noticed that nobody has said.', heat: 45 },
          news: ['"THE MATTER IS CLOSED" T-SHIRTS REPORTEDLY SELLING WELL'],
        },
      },
    },
    {
      id: 'blame',
      label: 'Name a culprit. Someone already in custody.',
      hint: 'Ends the question today. Creates a permanent lie that other things will be built on.',
      enabled: (s) => s.factions.sable.loyalty > 45,
      lockedText: 'The Sable Office would have to supply the name, and it is not minded to.',
      outcome: {
        text:
          'The Sable Office produces a name within the hour, along with a confession, a motive, and a photograph of a very tired-looking man.\n\nThe story dies today. It has not been proven false — only buried, and not deeply.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: -3, support: +4, power: +5, information: -6 },
          hidden: { scandal: -10, fear: +10, leak: +9 },
          regime: { repression: +14, personalism: +6 },
          factions: { sable: { loyalty: +9, influence: +6 }, chorus: { loyalty: -7 }, grey: { loyalty: -4 } },
          characters: { sarran: { loyalty: +8, influence: +7 }, grebs: { trust: -6 } },
          scandal: { name: 'The convenient confession', detail: 'A very tired man, a very fast confession, and an archive that keeps everything.', heat: 20 },
          flags: { stairwellLie: 1, liesTold: 1 },
          schedule: [{ inDays: 9, visible: false, label: 'Shallow ground', effects: { hidden: { scandal: +16, leak: +10 } } }],
        },
      },
    },
  ],
},

{
  id: 'brask-notebook',
  once: true,
  title: 'The Real Numbers',
  category: 'economy',
  actor: 'brask',
  stages: ['government', 'night'],
  base: 6,
  minDay: 1,
  weight: (s) => 5 + s.hidden.fiscal * 0.2,
  body:
    'Brask puts the green notebook on your desk and opens it. He has done this twice in nineteen years.\n\n"These are the real numbers. Not the folder ones. If you want, I will close it and we will use the folder, and I will never mention this meeting again." He does not look up. "I wanted you to know I was offering you both."',
  flavor: 'Presentable numbers in the folder. Real numbers in the notebook.',
  options: [
    {
      id: 'read-real',
      label: 'Read the real numbers.',
      hint: 'You govern with accurate information and considerably less sleep.',
      outcome: {
        text:
          'The gap is bigger than the folder says, and it has been since 2021. Three ministries have been quietly funding each other\'s deficits in a circle, and one of the transfers has no legal basis at all.\n\nBrask closes the notebook. "Right," he says. "Now we can actually do something."',
        tone: 'mixed',
        effects: {
          stats: { information: +14, treasury: -3, legitimacy: +2, economy: -2 },
          hidden: { fiscal: -8, corruption: -4 },
          regime: { technocracy: +12, reform: +6 },
          factions: { grey: { loyalty: +7 } },
          characters: { brask: { loyalty: +12, trust: +12 } },
          remember: [{ who: 'brask', text: 'You looked at the real numbers.', weight: 3 }],
          flags: { realNumbers: 1 },
          schedule: [{ inDays: 4, visible: true, label: 'The illegal transfer has to be dealt with', cardId: 'circular-transfer' }],
        },
      },
    },
    {
      id: 'folder',
      label: '"Use the folder."',
      hint: 'Simpler and survivable. The real numbers do not stop being real.',
      outcome: {
        text:
          'Brask closes the notebook with no expression at all and never mentions the meeting again. He is the most honest man in the building, so he genuinely never mentions it.\n\nThe folder numbers are lovely. Everyone finds them very reassuring.',
        tone: 'bad',
        effects: {
          stats: { information: -9, support: +2 },
          hidden: { fiscal: +9, corruption: +3 },
          regime: { graft: +5 },
          characters: { brask: { loyalty: -7, trust: -6 } },
          remember: [{ who: 'brask', text: 'He offered you the real numbers and you chose the folder.', weight: -3 }],
          schedule: [{ inDays: 6, visible: false, label: 'The folder numbers meet reality', effects: { stats: { treasury: -6, economy: -4 }, hidden: { fiscal: +8 } } }],
        },
      },
    },
  ],
},

{
  id: 'weather-honesty',
  once: true,
  title: 'Nine Days of Rain',
  category: 'decision',
  stages: ['night', 'development'],
  base: 4,
  minDay: 1,
  weight: (s) => 4 + (s.stats.legitimacy < 45 ? 5 : 0),
  body:
    'It has rained in the capital for nine days straight.\n\nA lot of Velmorrans believe the weather here reflects how honest the government is. The state weather service has formally asked for guidance on how to word its forecasts, which is a sentence that should not exist and is nevertheless on your desk.',
  flavor: 'Nine days of rain, and counting.',
  options: [
    {
      id: 'joke',
      label: 'Make a joke about it on the evening news.',
      hint: 'Free. Either charming, or the clip that follows you for a decade.',
      outcome: (_s, rng) => {
        const lands = rng.chance(0.6);
        return lands
          ? {
              text:
                '"I am told it has rained for nine days," you say, "and I am told this is my fault. I want to assure the country that I am working on it, and that if it stops on Thursday I intend to take full credit."\n\nIt stops on Thursday. The country is delighted and slightly unnerved.',
              tone: 'good',
              effects: {
                stats: { support: +7, legitimacy: +4 },
                hidden: { cult: +6, unrest: -4 },
                regime: { populism: +7, personalism: +5 },
                factions: { all: { loyalty: +1 }, chorus: { loyalty: +3 } },
                news: ['IT STOPPED ON THURSDAY'],
              },
            }
          : {
              text:
                'The joke lands in the studio and dies in the country. A run of editorials appears on the theme of a government that finds the weather funny, which sounds absurd until you remember what the weather means here.\n\nIt rains for four more days.',
              tone: 'bad',
              effects: {
                stats: { support: -4, legitimacy: -3 },
                hidden: { unrest: +3 },
                factions: { provinces: { loyalty: -3 }, chorus: { loyalty: -2 } },
              },
            };
      },
    },
    {
      id: 'solemn',
      label: 'Tell the broadcaster to stop mentioning the rain.',
      hint: 'Free and tidy. Also precisely the behaviour the superstition is about.',
      outcome: {
        text:
          'For four evenings the 7pm news reports on national weather in general and the capital not at all.\n\nBy the third evening it is the only thing anyone is talking about.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -6, support: -3, information: -6 },
          hidden: { unrest: +6, leak: +4, cult: +3 },
          regime: { repression: +9 },
          factions: { chorus: { loyalty: -7 }, sable: { loyalty: +3 } },
          news: ['STATE BROADCASTER DECLINES TO DISCUSS CAPITAL WEATHER'],
        },
      },
    },
    {
      id: 'drainage',
      label: 'Announce $2B of emergency drainage works.',
      hint: 'Cost: $2.0B. Solves a real problem and an imaginary one at the same time.',
      outcome: {
        text:
          'It is an absurd response to a weather superstition and a completely sensible response to nine days of standing water in the Ninth District.\n\nThe Ninth District floods every year and has been ignored since 1988. They are extremely moved. The civil service is quietly impressed that you found the one answer that works on both levels.',
        tone: 'good',
        effects: {
          stats: { treasury: -2, support: +6, legitimacy: +5, stability: +3 },
          hidden: { unrest: -5, cult: +3 },
          regime: { populism: +5, technocracy: +7 },
          factions: { grey: { loyalty: +6 }, combine: { loyalty: +4 }, chorus: { loyalty: +3 } },
          characters: { grebs: { loyalty: +5 }, brask: { loyalty: -2 } },
          project: {
            name: 'Ninth District drainage',
            days: 5,
            upkeep: 0.12,
            detail: 'Storm drains for the part of the capital that floods every single year.',
            legacy: 'finally drained the Ninth District, which had flooded every year since 1988',
            onComplete: { stats: { support: +4, stability: +3 }, hidden: { unrest: -5 }, news: ['NINTH DISTRICT DRY FOR FIRST TIME IN THIRTY-SEVEN YEARS'] },
          },
        },
      },
    },
  ],
},

/* ----------------------------------------------------- QUEUED FOLLOW-UPS */

{
  id: 'mil-budget-due',
  title: 'The Army Wants the Money You Promised',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  base: 0,
  weight: () => 0,
  body:
    'Varkov has brought her own notebook this time, open, to a page with a date on it in her handwriting.\n\n"You said next quarter, {sir}. It is next quarter."',
  flavor: 'She only writes down the things she intends to remember.',
  options: [
    {
      id: 'pay',
      label: 'Pay all $9 billion today.',
      hint: 'Cost: $9.0B. A promise kept to the army is worth more than the money.',
      outcome: {
        text:
          'She closes the notebook. "Thank you."\n\nWord goes round the officer corps within a day: this one keeps their word. In an organisation that has outlasted nine governments, that is an extremely valuable thing to have said about you.',
        tone: 'good',
        effects: {
          stats: { treasury: -9, military: +11, power: +5, legitimacy: +3 },
          hidden: { coup: -14, fiscal: +6 },
          regime: { militarism: +8 },
          factions: { staff: { loyalty: +13, patience: +12 } },
          characters: { varkov: { loyalty: +11, trust: +12 }, tern: { loyalty: +5 } },
          remember: [{ who: 'varkov', text: 'You kept the helicopter promise on the exact day.', weight: 3 }],
          commitments: [{ label: 'Helicopter programme', perDay: 0.35, days: 12 }],
          flags: { promisesKept: 1 },
        },
      },
    },
    {
      id: 'part',
      label: 'Pay a third. Show her the real treasury position.',
      hint: 'Cost: $3.0B. Honesty buys you something with Varkov specifically.',
      outcome: {
        text:
          'You show her the number. The actual one, not the folder one.\n\nVarkov reads it and for the first time in your acquaintance looks briefly like a person rather than an institution. "Very well." A pause. "Do not do that to me twice."',
        tone: 'mixed',
        effects: {
          stats: { treasury: -3, military: +2, legitimacy: +2 },
          hidden: { coup: +2, fiscal: +2 },
          factions: { staff: { loyalty: +1, patience: -6 } },
          characters: { varkov: { loyalty: +2, trust: +7 } },
          remember: [{ who: 'varkov', text: 'You showed her the real treasury number instead of paying.', weight: 1 }],
          schedule: [{ inDays: 6, visible: true, label: '"Do not do that to me twice"', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'renege',
      label: 'Go back on it. Circumstances have changed.',
      hint: 'Saves $9.0B. The army learns that your promises have conditions.',
      outcome: {
        text:
          'Varkov does not argue. She closes the notebook, stands, and says "Understood."\n\nThat night the Sable Office logs eleven calls between officers in three different commands, none of whom have any operational reason to be talking at that hour.',
        tone: 'bad',
        effects: {
          stats: { military: -14, power: -5, legitimacy: -5 },
          hidden: { coup: +22, fear: +4 },
          factions: { staff: { loyalty: -16, patience: -18 } },
          characters: { varkov: { loyalty: -14, trust: -16, plotting: +14 }, tern: { plotting: +9 } },
          remember: [{ who: 'varkov', text: 'You gave her a date and then took it back.', weight: -3 }],
          flags: { promisesBroken: 1 },
          schedule: [{ inDays: 3, visible: false, label: 'Eleven calls at an unusual hour', effects: { hidden: { coup: +8 } } }],
        },
      },
    },
  ],
},

{
  id: 'mil-budget-encore',
  title: 'The Army Wants More',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  base: 0,
  weight: () => 0,
  body:
    'Varkov puts a second sheet on the desk, face down, exactly like the first.\n\n"The helicopters fly. Thank you. The air defence radars are from 1989, and one of them has been quietly replaced with a civilian weather unit bought in Mavro."\n\nThe number is $7 billion.',
  flavor: 'The air defence radars are from 1989.',
  options: [
    {
      id: 'fund',
      label: 'Approve it. Again.',
      hint: 'Cost: $7.0B. The army becomes, gradually, the most powerful body in the country.',
      outcome: {
        text:
          'You sign. The army now has two consecutive years of real capital spending, the first since 1994, and a commander who has learned exactly how to ask.\n\nGrebs sends a note observing that defence is now 31% of discretionary spending. The note contains no opinion. Her notes never do.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -7, military: +9, security: +4, economy: -2 },
          hidden: { coup: -6, fiscal: +9 },
          regime: { militarism: +16 },
          factions: { staff: { loyalty: +9, power: +8, influence: +6 }, grey: { patience: -5 }, chorus: { loyalty: -4 } },
          characters: { varkov: { loyalty: +8, influence: +7 } },
          commitments: [{ label: 'Air defence programme', perDay: 0.3 }],
          schedule: [{ inDays: 6, visible: false, label: 'Defence spending becomes structural', effects: { hidden: { fiscal: +6 }, factions: { staff: { power: +5 } } } }],
        },
      },
    },
    {
      id: 'audit',
      label: 'Approve it, on condition of a civilian audit of procurement.',
      hint: 'Cost: $7.0B with strings. You are stepping on the army\'s stated red line.',
      outcome: {
        text:
          'Varkov goes very still. "An audit," she says. "Of the officer corps." She does not raise her voice.\n\nThe radars get funded. The audit is agreed. Neither of you mentions 1979.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -7, military: -4, legitimacy: +8, power: +5, information: +6 },
          hidden: { coup: +10, corruption: -9 },
          regime: { reform: +14, technocracy: +8 },
          factions: { staff: { loyalty: -10, patience: -12 }, grey: { loyalty: +8 }, chorus: { loyalty: +7 } },
          characters: { varkov: { loyalty: -9, trust: -6, plotting: +8 }, grebs: { loyalty: +7 } },
          remember: [{ who: 'varkov', text: 'You put civilian auditors inside the officer corps.', weight: -3 }],
        },
      },
    },
    {
      id: 'no',
      label: '"Not this quarter, General."',
      hint: 'Saves $7.0B. She funded a habit and you have just broken it.',
      outcome: {
        text:
          '"Not this quarter." She repeats it back in your exact tone.\n\nShe takes the sheet. She does not write the date down.',
        tone: 'mixed',
        effects: {
          stats: { military: -5, treasury: +1 },
          hidden: { coup: +7 },
          factions: { staff: { loyalty: -6, patience: -7 } },
          characters: { varkov: { loyalty: -5, plotting: +4 } },
        },
      },
    },
  ],
},

{
  id: 'strike-begins',
  title: 'The Strike Has Started',
  category: 'crisis',
  faction: 'combine',
  base: 0,
  weight: () => 0,
  body:
    'Gorsk stops at 6:00am. Mavro stops at 6:02, because the dockers wanted the miners to go first.\n\nNothing is moving: no lithium, no salt, no containers. The Concord estimates $1.4 billion a day in lost output. Hess is standing outside the union hall in the rain, saying nothing, being photographed.',
  flavor: 'The Concord estimates $1.4 billion a day in lost output.',
  options: [
    {
      id: 'concede',
      label: 'Concede the full claim, publicly.',
      hint: 'Cost: $8.0B plus an ongoing wage bill. Ends it in a day and sets the price of a strike.',
      outcome: {
        text:
          'The mines restart within nine hours, which nobody thought possible.\n\nHess is asked on camera whether this is a victory. He says, "It is a settlement." That is the most expensive sentence anyone will say this year, because every union in the country now knows what a settlement costs.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -8, stability: +11, economy: -2, power: -6, support: +4 },
          hidden: { unrest: -14, fiscal: +7 },
          regime: { populism: +9 },
          factions: { combine: { loyalty: +14, power: +8 }, concord: { loyalty: -8 }, staff: { loyalty: -3 } },
          characters: { hess: { loyalty: +10, influence: +8 }, adamek: { loyalty: -6 } },
          commitments: [{ label: 'Full wage settlement', perDay: 0.3 }],
          schedule: [{ inDays: 5, visible: true, label: 'Every other union now knows the price', cardId: 'wage-contagion' }],
        },
      },
    },
    {
      id: 'wait',
      label: 'Wait them out. Say nothing for a week.',
      hint: 'Costs $1.4B a day in lost output. Tests who blinks first.',
      outcome: (s, rng) => {
        const blink = rng.chance(0.42 + (50 - s.factions.combine.loyalty) / 220);
        return blink
          ? {
              text:
                'On day six the dockers go back, because dockers are paid per container and miners are paid per shift, and Hess has always known that was his weak point.\n\nGorsk holds two more days and folds. Hess does not comment. The unions have learned something about themselves, and so have you.',
              tone: 'mixed',
              effects: {
                stats: { economy: -7, treasury: -3, power: +8, stability: -3 },
                hidden: { unrest: +5 },
                regime: { repression: +6 },
                factions: { combine: { loyalty: -11, power: -9, patience: -10 }, concord: { loyalty: +7 } },
                characters: { hess: { loyalty: -9, influence: -7 }, adamek: { loyalty: +6 } },
                remember: [{ who: 'hess', text: 'You waited him out and the dockers broke first.', weight: -2 }],
              },
            }
          : {
              text:
                'They do not blink. On day seven the railway workers join in sympathy. On day eight the grain hauliers join for reasons nobody can adequately explain. By day nine the country is, functionally, stationary.\n\nThe currency moves. The banks call. Everybody calls.',
              tone: 'bad',
              effects: {
                stats: { economy: -13, treasury: -6, stability: -14, support: -7, power: -5 },
                hidden: { unrest: +20, fiscal: +8 },
                factions: { combine: { loyalty: -6, power: +10 }, concord: { loyalty: -9 }, chorus: { loyalty: -4 } },
                characters: { hess: { influence: +10 } },
                news: ['GENERAL STOPPAGE SPREADS; GRAIN HAULIERS JOIN FOR UNCLEAR REASONS'],
                schedule: [{ inDays: 2, visible: true, label: 'The country is stationary', cardId: 'alert-square' }],
              },
            };
      },
    },
    {
      id: 'soldiers',
      label: 'Send soldiers to reopen the mines.',
      hint: 'Free, and the unions\' stated red line. Also the army\'s least favourite order.',
      enabled: (s) => s.stats.military > 40,
      lockedText: 'The army would not carry out that order today.',
      outcome: {
        text:
          'Varkov asks for the order in writing.\n\nTwo companies reach the Gorsk perimeter and stop, because six thousand miners and their families are sitting on the road. Nobody fires. Nobody moves. It is photographed from a hillside and by morning the photograph is on every front page on the continent.',
        tone: 'bad',
        effects: {
          stats: { stability: -18, legitimacy: -16, support: -12, military: -9, power: -4 },
          hidden: { unrest: +28, coup: +12, foreign: +12 },
          regime: { repression: +20, militarism: +8 },
          factions: { combine: { loyalty: -25, patience: -25 }, chorus: { loyalty: -14 }, staff: { loyalty: -8, patience: -9 }, concord: { loyalty: +4 } },
          characters: { hess: { loyalty: -20, plotting: +10 }, varkov: { loyalty: -8, trust: -8 }, vel: { loyalty: -10 } },
          scandal: { name: 'The Gorsk road', detail: 'Two companies, six thousand families, and a photograph taken from a hillside.', heat: 65 },
          remember: [{ who: 'hess', text: 'You sent soldiers to Gorsk. His father was shot at. His children were on that road.', weight: -3 }],
          flags: { protestsCrushed: 1 },
          news: ['SOLDIERS AT GORSK — PHOTOGRAPH RUNS ON EVERY FRONT PAGE ON THE CONTINENT'],
          schedule: [{ inDays: 2, visible: true, label: 'The country reacts to the photograph', cardId: 'alert-square' }],
        },
      },
    },
  ],
},

{
  id: 'kordiva-cold',
  title: 'Four Mayors, One Message',
  category: 'crisis',
  faction: 'provinces',
  base: 0,
  weight: () => 0,
  body:
    'Four Kordiva mayors have given the same interview to four different outlets. In a region with one farm lobby that is not a coincidence, it is a memo.\n\nThe message: the Basin will "review its arrangements" with the capital. Around here, "arrangements" means tax revenue, and reviewing them means not sending it.',
  flavor: 'Four mayors, four interviews, one message.',
  options: [
    {
      id: 'summon',
      label: 'Summon Kostyn. Make her say it to your face.',
      hint: 'Free. Forces the issue. She is extremely good in rooms.',
      outcome: (s, rng) => {
        const win = rng.chance(0.4 + s.stats.power / 220);
        return win
          ? {
              text:
                '"They are mayors," she says. "They talk." You ask her to state, on the record, that the Basin will send its tax revenue.\n\nShe pauses, then says it, on the record.',
              tone: 'good',
              effects: {
                stats: { power: +7, stability: +4 },
                hidden: { separatism: -9 },
                factions: { provinces: { loyalty: +3, patience: +5 } },
                characters: { kostyn: { loyalty: -2, fear: +8 } },
              },
            }
          : {
              text:
                '"They are mayors," she says. "They talk." You ask her to state, on the record, that the Basin will send its tax revenue.\n\nShe smiles and says she would not want to "get ahead of the Basin council", and leaves a jar of honey on the desk. Numbered.',
              tone: 'bad',
              effects: {
                stats: { power: -6 },
                hidden: { separatism: +11 },
                factions: { provinces: { loyalty: -3, power: +6 } },
                characters: { kostyn: { influence: +9, plotting: +7 } },
                schedule: [{ inDays: 4, visible: false, label: 'The Basin council gets ahead of nothing', effects: { stats: { treasury: -4 }, hidden: { separatism: +6 } } }],
              },
            };
      },
    },
    {
      id: 'buy',
      label: 'Send $5B of regional development money to their districts.',
      hint: 'Cost: $5.0B. Works immediately. Teaches four mayors what an interview is worth.',
      outcome: {
        text:
          'The money arrives and so does the silence.\n\nWithin two weeks, eleven other mayors have discovered strong opinions about the capital that they would like to share with journalists.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -5, stability: +5 },
          hidden: { separatism: -6, corruption: +9, fiscal: +4 },
          regime: { patronage: +14 },
          factions: { provinces: { loyalty: +7 }, grey: { loyalty: -4 } },
          characters: { kostyn: { loyalty: +2 }, grebs: { trust: -4 } },
          schedule: [{ inDays: 6, visible: false, label: 'Eleven other mayors develop strong opinions', effects: { stats: { treasury: -4 }, hidden: { corruption: +6 } } }],
        },
      },
    },
    {
      id: 'ignore',
      label: 'Say nothing. Let it burn out.',
      hint: 'Free. Kordiva is patient and never forgets a silence.',
      outcome: {
        text:
          'It burns for eleven days and stops, which looks like a win.\n\nThe quarter\'s tax revenue arrives four per cent light, with a covering letter citing "collection difficulties". Nobody mentions the interviews again.',
        tone: 'bad',
        effects: {
          stats: { treasury: -4 },
          hidden: { separatism: +8 },
          factions: { provinces: { power: +5, patience: -6 } },
          characters: { kostyn: { influence: +5 } },
        },
      },
    },
  ],
},

{
  id: 'doran-collects',
  title: 'Doran Wants Paying',
  category: 'person',
  actor: 'doran',
  base: 0,
  weight: () => 0,
  body:
    'Doran closes the door and does not use your first name, which is new.\n\n"I got you the deputy chairmanship. I keep the diary, I keep this building running, and last week I did something for you I can\'t undo." She puts one sheet down. "Deputy Permanent Secretary. Grebs\'s second. I want it in writing before parliament sits."',
  flavor: 'She has been keeping score since before you had an office.',
  options: [
    {
      id: 'give',
      label: 'Give her the job.',
      hint: 'Free in money. Buys total loyalty from the person who knows the most about you.',
      outcome: {
        text:
          'She reads the appointment twice, folds it and puts it away, and for about two seconds she is thirty-one again and neither of you has a title.\n\n"Right," she says. "Now I actually owe you one."\n\nGrebs, told about her new deputy, says only: "Interesting."',
        tone: 'good',
        effects: {
          stats: { power: +4, legitimacy: -2 },
          hidden: { corruption: +5, fear: -3 },
          regime: { patronage: +11 },
          factions: { grey: { loyalty: +3, patience: -5 } },
          characters: { doran: { loyalty: +16, trust: +12, influence: +12 }, grebs: { loyalty: -5, trust: -3 } },
          remember: [{ who: 'doran', text: 'You paid what you owed, in writing, before she had to ask twice.', weight: 3 }],
          flags: { doranOwed: -1, doranDeputy: 1 },
        },
      },
    },
    {
      id: 'something-else',
      label: 'Offer her money instead. A lot of it.',
      hint: 'Cost: $4.0B. Cheaper in power terms. She did not ask for money.',
      outcome: {
        text:
          'She looks at the figure for a while.\n\n"You know what the difference is?" she says. "Money runs out. A job is somewhere to stand."\n\nShe takes the money. She will remember that you offered money when she asked for a job.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -4 },
          hidden: { corruption: +8 },
          regime: { graft: +9 },
          characters: { doran: { loyalty: +3, trust: -6, plotting: +7 } },
          remember: [{ who: 'doran', text: 'She asked for somewhere to stand and you offered her money.', weight: -2 }],
        },
      },
    },
    {
      id: 'refuse',
      label: '"No. And you know why."',
      hint: 'Free. Holds the line against handing out jobs. Doran keeps the diary.',
      outcome: {
        text:
          '"I do know why," she says. "That\'s the irritating part."\n\nShe opens the door and stops. "I\'ll keep the diary. I\'ll keep the building running. But I\'m going to stop telling you things I\'m not obliged to tell you, and you won\'t notice for about a month."',
        tone: 'bad',
        effects: {
          stats: { legitimacy: +5, information: -8, security: -4 },
          regime: { reform: +8 },
          factions: { grey: { loyalty: +4 } },
          characters: { doran: { loyalty: -12, trust: -9, plotting: +10 }, grebs: { loyalty: +5 } },
          remember: [{ who: 'doran', text: 'You refused her the job. She stopped volunteering things.', weight: -3 }],
          schedule: [{ inDays: 7, visible: false, label: 'The things Doran is not telling you', effects: { stats: { information: -5, security: -3 } } }],
        },
      },
    },
  ],
},

];

export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

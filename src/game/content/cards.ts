import type { CardDef } from '../types';
import { CHARACTER_MAP } from './country';

/**
 * Standard event cards.
 *
 * Authoring rules:
 *  - Every option must have a visible trade-off in `hint`. Never hide the
 *    obvious cost; hide only the second-order consequences.
 *  - At least one option per card should schedule something for a later day.
 *  - `weight` should react to game state so the deck feels like it is watching.
 */

export const CARDS: CardDef[] = [

/* ------------------------------------------------------------ GOVERNMENT */

{
  id: 'mil-budget',
  title: 'The Staff Would Like a Number',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  stages: ['government'],
  base: 10,
  minDay: 1,
  tags: ['military', 'budget'],
  weight: (s) => 10 + (55 - s.factions.staff.loyalty) * 0.3 + s.hidden.coup * 0.2,
  body:
    'Marshal Varkov puts a single sheet on your desk, face down, and does not touch it again.\n\n"The helicopter fleet is nineteen years old. Two of the nineteen fly. I am not asking you to like the number, First Citizen. I am asking you to say it out loud so that it exists."',
  flavor: 'She looks at her watch. She is not in a hurry. She is establishing that she could be.',
  options: [
    {
      id: 'fund',
      label: 'Fund it in full. Sign today.',
      hint: 'Costs ₩9bn now. The Staff remembers generosity — and learns it works.',
      outcome: {
        text:
          'Varkov reads the figure, folds the sheet into quarters, and puts it in her breast pocket. "Thank you." It is the warmest sentence she has said to a civilian in four years.\n\nBy evening, three officers who had been avoiding your calls have returned them.',
        tone: 'good',
        effects: {
          stats: { treasury: -9, military: +8, power: +3, economy: -1 },
          hidden: { coup: -8, fiscal: +6 },
          regime: { militarism: +12 },
          factions: { staff: { loyalty: +10, power: +4 }, grey: { patience: -4 }, combine: { loyalty: -3 } },
          characters: { varkov: { loyalty: +10, trust: +8 } },
          remember: [{ who: 'varkov', text: 'You funded the fleet without haggling.', weight: 2 }],
          news: ['GENERAL STAFF CONFIRMS "ROUTINE" FLEET MODERNISATION'],
          schedule: [
            { inDays: 4, visible: true, label: 'Fleet procurement first instalment falls due', effects: { stats: { treasury: -3 }, hidden: { fiscal: +4 } } },
            { inDays: 7, visible: false, label: 'The Staff finds another number', cardId: 'mil-budget-encore' },
          ],
        },
      },
    },
    {
      id: 'promise',
      label: 'Promise it for next quarter.',
      hint: 'Nothing today. A debt to the army with a date on it.',
      outcome: {
        text:
          '"Next quarter," she repeats, as though checking the translation. Then she nods, once, and writes it in her own notebook — which you note, because Varkov does not write down things she intends to forget.',
        tone: 'mixed',
        effects: {
          stats: { military: +4, power: +1 },
          hidden: { coup: -3, fiscal: +2 },
          regime: { militarism: +4 },
          factions: { staff: { loyalty: +5, patience: -6 } },
          characters: { varkov: { loyalty: +4, trust: -2 } },
          promise: { text: 'Fleet modernisation funds, promised to the General Staff', to: 'staff', inDays: 5 },
          schedule: [{ inDays: 5, visible: true, label: 'The General Staff expects its fleet money', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'half',
      label: 'Half of it. Framed as a first tranche.',
      hint: 'Costs ₩4bn. Satisfies nobody completely, which is often the job.',
      outcome: {
        text:
          'Varkov accepts the half without comment, which is worse than an argument. Two hours later Colonel Tern sends a handwritten note thanking you for your "decisive support of the services". The note is charming. It is also a record.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -4, military: +4 },
          hidden: { coup: -3, fiscal: +3 },
          regime: { militarism: +5 },
          factions: { staff: { loyalty: +4, patience: -3 } },
          characters: { varkov: { loyalty: +3 }, tern: { loyalty: +4, influence: +2 } },
          schedule: [{ inDays: 6, visible: false, label: 'The second tranche question', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. The fleet can wait.',
      hint: 'Saves the money. The army learns what your word is worth under pressure.',
      outcome: {
        text:
          'Varkov takes back the sheet, unread by you, and leaves at exactly the pace she arrived. At 21:40 the Sable Office logs a dinner in Gorsk attended by four officers who do not normally dine together.\n\nDirector Sarran notes this. She does not, yet, say anything about it.',
        tone: 'bad',
        effects: {
          stats: { military: -7, power: -2, treasury: +1 },
          hidden: { coup: +11, fear: +2 },
          factions: { staff: { loyalty: -9, patience: -10 }, grey: { loyalty: +2 } },
          characters: { varkov: { loyalty: -8, plotting: +6 }, tern: { plotting: +4 } },
          remember: [{ who: 'varkov', text: 'You refused the fleet, to her face, with no alternative.', weight: -2 }],
          schedule: [{ inDays: 3, visible: false, label: 'Officers who do not normally dine together', effects: { hidden: { coup: +5 } } }],
        },
      },
    },
  ],
},

{
  id: 'grain-subsidy',
  title: 'The Kordiva Number',
  category: 'policy',
  actor: 'kostyn',
  faction: 'provinces',
  stages: ['government', 'politics'],
  base: 9,
  weight: (s) => 9 + (50 - s.factions.provinces.loyalty) * 0.25 + s.hidden.separatism * 0.15,
  body:
    'Governor Kostyn arrives with a jar of honey, a smile, and a spreadsheet.\n\n"Fertiliser is up forty per cent. The subsidy is where Krast left it in 2019. I am not asking for a favour, First Citizen — I am telling you what the harvest looks like if nobody does anything, and then letting you decide whose harvest it is."',
  flavor: 'The jar is numbered. They are always numbered.',
  options: [
    {
      id: 'raise',
      label: 'Raise the subsidy. Announce it in Kordiva.',
      hint: 'Costs ₩7bn. Buys the countryside — and Kostyn gets the photograph.',
      outcome: {
        text:
          'You announce it from a platform in Kordiva with Kostyn three feet to your left, waving. The clip that runs on the Seven O\'Clock Word is framed so that she is in the centre.\n\nThe countryside is delighted. It is not entirely clear with whom.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -7, support: +7, stability: +4, economy: -1 },
          hidden: { fiscal: +7, separatism: -5 },
          regime: { populism: +8, patronage: +5 },
          factions: { provinces: { loyalty: +11 }, concord: { loyalty: -3 }, grey: { patience: -4 } },
          characters: { kostyn: { loyalty: +6, influence: +7 }, brask: { trust: -3 } },
          remember: [{ who: 'kostyn', text: 'You raised the subsidy and let her stand in the middle of the shot.', weight: 2 }],
          news: ['KORDIVA CHEERS SUBSIDY — GOVERNOR KOSTYN "DELIGHTED FOR THE REPUBLIC"'],
          schedule: [{ inDays: 6, visible: true, label: 'Subsidy bill hits the quarterly accounts', effects: { stats: { treasury: -3 }, hidden: { fiscal: +4 } } }],
        },
      },
    },
    {
      id: 'target',
      label: 'Raise it only for smallholders.',
      hint: 'Cheaper, fairer, and it cuts the grain lobby out. They will notice.',
      outcome: {
        text:
          'Brask nearly weeps with gratitude. The measure is efficient, defensible, and costs a third of the headline version.\n\nThe Kordiva Grain Association issues a statement welcoming "this first step". The phrase "first step" is doing a great deal of work.',
        tone: 'good',
        effects: {
          stats: { treasury: -3, support: +3, economy: +2, legitimacy: +2 },
          hidden: { fiscal: +2 },
          regime: { technocracy: +10, reform: +6 },
          factions: { provinces: { loyalty: +2, patience: -5 }, grey: { loyalty: +5 }, combine: { loyalty: +3 } },
          characters: { brask: { loyalty: +8, trust: +6 }, kostyn: { loyalty: -3 } },
          remember: [{ who: 'brask', text: 'You took the efficient option over the popular one.', weight: 2 }],
          schedule: [{ inDays: 5, visible: false, label: 'The grain lobby takes its second step', effects: { factions: { provinces: { patience: -8 } }, hidden: { separatism: +4 } } }],
        },
      },
    },
    {
      id: 'freeze',
      label: 'Freeze it. Blame the inherited deficit.',
      hint: 'Saves money. Kordiva has ended governments over less.',
      outcome: {
        text:
          '"The inherited deficit," Kostyn repeats. "Of course." She leaves the honey on the desk anyway — which, you realise later, means it is now a thing you accepted.\n\nBy the weekend, four Kordiva mayors have given interviews about "the capital\'s understanding of the countryside".',
        tone: 'bad',
        effects: {
          stats: { support: -5, stability: -4, treasury: +1 },
          hidden: { separatism: +9, unrest: +5 },
          regime: { technocracy: +4 },
          factions: { provinces: { loyalty: -10, patience: -12 }, concord: { loyalty: +3 } },
          characters: { kostyn: { loyalty: -7, plotting: +7 }, brask: { loyalty: +3 } },
          remember: [{ who: 'kostyn', text: 'You froze the subsidy and called her harvest an inherited deficit.', weight: -2 }],
          schedule: [{ inDays: 4, visible: false, label: 'Mayors give interviews', cardId: 'kordiva-cold' }],
        },
      },
    },
  ],
},

{
  id: 'ilvet-audit',
  title: 'Eleven Square Kilometres of Legal Fiction',
  category: 'economy',
  faction: 'concord',
  stages: ['government', 'development'],
  base: 7,
  minDay: 2,
  weight: (s) => 7 + s.hidden.corruption * 0.22 + (s.stats.treasury < 30 ? 6 : 0),
  body:
    'The Grey Floor has produced a memorandum. Ilyana Grebs delivers it personally, which means it matters.\n\n"The Ilvet Free Zone generated ₩61 billion in transactions last quarter and ₩0.4 billion in tax. That is not a loophole, First Citizen. A loophole is an accident. This is architecture."',
  flavor: 'Grebs keeps receipts. She has brought some.',
  options: [
    {
      id: 'audit',
      label: 'Order a full audit of the Zone.',
      hint: 'Enormous potential revenue. You will be declaring war on the Concord.',
      enabled: (s) => s.stats.power > 32,
      lockedText: 'You do not currently have the authority to make this stick.',
      outcome: (s, rng) => {
        const strong = s.stats.power > 55 && s.factions.grey.loyalty > 50;
        return strong
          ? {
              text:
                'The auditors go in on a Tuesday with the Grey Floor behind them and the Sable Office watching the doors. Three banks freeze voluntarily before anyone knocks.\n\nAdamek does not call. That is the part that should worry you.',
              tone: 'mixed',
              effects: {
                stats: { treasury: +11, legitimacy: +7, elite: -12, economy: -4 },
                hidden: { corruption: -16, scandal: +8, fiscal: -6 },
                regime: { reform: +16, technocracy: +9 },
                factions: { concord: { loyalty: -18, patience: -15 }, grey: { loyalty: +9 }, chorus: { loyalty: +10 }, combine: { loyalty: +6 } },
                characters: { adamek: { loyalty: -16, plotting: +14 }, grebs: { loyalty: +9, trust: +7 } },
                remember: [{ who: 'adamek', text: 'You sent auditors into Ilvet.', weight: -3 }],
                news: ['AUDITORS ENTER ILVET — VELK WOBBLES, THEN HOLDS'],
                schedule: [
                  { inDays: 3, visible: true, label: 'Ilvet capital flight assessment', effects: { stats: { economy: -3, treasury: +4 } } },
                  { inDays: 6, visible: false, label: 'The Concord responds', cardId: 'concord-response' },
                ],
              },
            }
          : {
              text:
                `The auditors go in and are met by a wall of counsel so expensive it has its own lobby furniture. Within ${rng.int(3) + 2} days the operation has produced four hundred pages, two resignations at the bottom, and a velk that has moved eight per cent in the wrong direction.\n\nYou have made the enemy without making the money.`,
              tone: 'bad',
              effects: {
                stats: { treasury: +2, economy: -7, elite: -11, power: -4, legitimacy: +3 },
                hidden: { corruption: -4, scandal: +10 },
                regime: { reform: +9 },
                factions: { concord: { loyalty: -15, patience: -12 }, chorus: { loyalty: +6 }, grey: { loyalty: +4 } },
                characters: { adamek: { loyalty: -14, plotting: +12 } },
                remember: [{ who: 'adamek', text: 'You sent auditors into Ilvet and they bounced.', weight: -2 }],
                schedule: [{ inDays: 5, visible: false, label: 'The Concord responds', cardId: 'concord-response' }],
              },
            };
      },
    },
    {
      id: 'levy',
      label: 'Skip the audit. Impose a flat transit levy.',
      hint: 'Money now, no investigation, no reform. The Concord can live with a toll.',
      outcome: {
        text:
          'Adamek takes the call himself. "A levy," he says, in the voice of a man being asked for a modest and sensible thing. "Yes. A levy is a cost. An audit is a question." He agrees the number in ninety seconds.\n\nYou have just been told, politely, exactly what he is afraid of.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +6, economy: -1, elite: -3 },
          hidden: { corruption: +5, fiscal: -4 },
          regime: { graft: +6, patronage: +5 },
          factions: { concord: { loyalty: -4 }, grey: { loyalty: -3 }, chorus: { loyalty: -4 } },
          characters: { adamek: { loyalty: +3, trust: +4 }, grebs: { loyalty: -5, trust: -4 } },
          remember: [{ who: 'grebs', text: 'You took the levy instead of the audit. She filed the memorandum anyway.', weight: -1 }],
          schedule: [{ inDays: 8, visible: false, label: 'The memorandum Grebs filed anyway', effects: { hidden: { leak: +9 } } }],
        },
      },
    },
    {
      id: 'shelve',
      label: 'Shelve it. Thank Grebs for her diligence.',
      hint: 'Costs nothing today. Grebs files everything.',
      outcome: {
        text:
          '"Of course, First Citizen." Grebs takes the memorandum back, squares the edges, and files it — in the room with the one key, alongside nine First Citizens\' worth of documents that were also, at the time, not convenient.',
        tone: 'neutral',
        effects: {
          hidden: { corruption: +6, leak: +5 },
          regime: { graft: +4 },
          factions: { concord: { loyalty: +4 }, grey: { patience: -6 } },
          characters: { grebs: { loyalty: -4, trust: -3 }, adamek: { loyalty: +5 } },
          remember: [{ who: 'grebs', text: 'She brought you Ilvet and you shelved it.', weight: -1 }],
        },
      },
    },
  ],
},

{
  id: 'payroll-crunch',
  title: 'The Twenty-Eighth',
  category: 'economy',
  actor: 'brask',
  faction: 'grey',
  stages: ['government'],
  base: 6,
  weight: (s) => (s.stats.treasury < 25 ? 30 : s.stats.treasury < 40 ? 12 : 2) + s.hidden.fiscal * 0.2,
  requires: (s) => s.stats.treasury < 45,
  body:
    'Brask has the green notebook out, which means these are the real numbers.\n\n"State payroll clears on the twenty-eighth. One in six working adults. At the current burn we are ₩11 billion short and I have run out of timing differences to call it."',
  flavor: 'He is not sweating. That is how you know he is not exaggerating.',
  options: [
    {
      id: 'borrow-concord',
      label: 'Borrow from the Concord at their rate.',
      hint: 'Payroll clears. You owe the money people, at a price they set.',
      outcome: {
        text:
          'Adamek writes the rate on a card and slides it across. It is not a good rate. It is not an insulting rate. It is precisely the rate of a man who knows exactly how short you are — which means somebody told him.\n\nBrask looks at the card and says nothing at all.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +12, elite: +3, economy: -1 },
          hidden: { fiscal: +12, corruption: +4, leak: +6 },
          regime: { patronage: +8 },
          factions: { concord: { loyalty: +8, influence: +5 } },
          characters: { adamek: { loyalty: +7, influence: +6 }, brask: { trust: -3 } },
          schedule: [
            { inDays: 5, visible: true, label: 'First Concord repayment', effects: { stats: { treasury: -5 } } },
            { inDays: 9, visible: false, label: 'Adamek calls in the favour', cardId: 'adamek-favour' },
          ],
        },
      },
    },
    {
      id: 'print',
      label: 'Have the Central Bank cover it.',
      hint: 'Payroll clears tonight. The velk finds out by Thursday.',
      outcome: {
        text:
          'The Central Bank is, technically, independent. It is also physically located inside the Finance Ministry, and the Governor takes the lift up when asked.\n\nPayroll clears. On Thursday the velk opens four per cent softer and three separate people who do not speak to each other call it "a technical adjustment".',
        tone: 'mixed',
        effects: {
          stats: { treasury: +13, economy: -6, support: +2 },
          hidden: { fiscal: +14 },
          regime: { populism: +6 },
          factions: { concord: { loyalty: -6 }, combine: { loyalty: +4 } },
          characters: { brask: { loyalty: -6, trust: -5 } },
          remember: [{ who: 'brask', text: 'You printed through payroll over his objection.', weight: -2 }],
          news: ['CENTRAL BANK DESCRIBES VELK MOVE AS "TECHNICAL"'],
          schedule: [{ inDays: 4, visible: false, label: 'The technical adjustment stops being technical', effects: { stats: { economy: -4 }, hidden: { unrest: +6 } } }],
        },
      },
    },
    {
      id: 'delay',
      label: 'Delay payroll by nine days. Explain it honestly.',
      hint: 'Saves the money and your credibility with Brask. Two million people notice.',
      outcome: {
        text:
          'You go on the Seven O\'Clock Word and say the word "shortfall" out loud, which no Velmorran government has done since 1994.\n\nThe Chorus is startled into something close to respect. The Combine of Labour is not startled at all. Hess simply notes the date, and says, on the record, "Nine days."',
        tone: 'mixed',
        effects: {
          stats: { treasury: +8, legitimacy: +6, support: -9, stability: -6 },
          hidden: { unrest: +11, fiscal: -4 },
          regime: { reform: +8, technocracy: +6 },
          factions: { combine: { loyalty: -9, patience: -14 }, chorus: { loyalty: +8 }, grey: { loyalty: +5 } },
          characters: { brask: { loyalty: +10, trust: +9 }, hess: { loyalty: -7 }, vel: { trust: +6 } },
          remember: [{ who: 'hess', text: 'You delayed payroll for nine days and told the truth about it.', weight: -1 }],
          schedule: [{ inDays: 9, visible: true, label: 'Payroll, nine days late, as promised', effects: { stats: { treasury: -9, legitimacy: +3 }, hidden: { unrest: -5 } } }],
        },
      },
    },
  ],
},

/* -------------------------------------------------------------- POLITICS */

{
  id: 'sarran-file',
  title: 'A File, Offered',
  category: 'intelligence',
  actor: 'sarran',
  faction: 'sable',
  stages: ['politics', 'afternoon'],
  base: 8,
  minDay: 2,
  weight: (s) => 8 + s.factions.sable.loyalty * 0.08 + s.hidden.fear * 0.1,
  body:
    'Director Sarran brings you two things, as she always does: one that is true and one that is useful.\n\nToday they are in the same folder. It concerns a serving member of your cabinet, it is eleven pages long, and she has not opened it in front of you.\n\n"You may have it, First Citizen. I would only observe that once you know a thing, everyone can see that you know it."',
  flavor: 'The Sable Office has the largest collection of other people\'s letters in the hemisphere.',
  options: [
    {
      id: 'read',
      label: 'Read it.',
      hint: 'You gain leverage over someone. Sarran gains leverage over you.',
      outcome: (s, rng) => {
        const pool = ['piek', 'doran', 'brask', 'tern', 'grebs'].filter((id) => s.characters[id]?.inPost);
        const target = rng.pick(pool.length ? pool : ['piek']);
        const names: Record<string, string> = {
          piek: 'Orlan Piek has been briefing the Aureth chargé d\'affaires over dinner for two years. He is not being paid. He is being complimented, which is cheaper.',
          doran: 'Yvet Doran holds a numbered account in the Ilvet Free Zone opened eleven days before you took office. The balance is not enormous. The timing is.',
          brask: 'Kel Brask has been quietly covering a ₩0.2bn shortfall in a rural hospital programme out of a contingency line he is not authorised to use. It is the least corrupt corruption you have ever read about.',
          tern: 'Colonel Tern has had four dinners in Gorsk this quarter with officers outside his chain of command. He wrote a charming note after each one.',
          grebs: 'Ilyana Grebs has, for nineteen years, kept copies. Of everything. Including, the file notes, things concerning the Sable Office itself.',
        };
        return {
          text: `You read it.\n\n${names[target]}\n\nSarran watches you finish, then takes the folder back. "It will be in the archive," she says, "under your name, as the officer who requested it."`,
          tone: 'mixed',
          effects: {
            stats: { information: +8, security: +4, power: +3 },
            hidden: { fear: +6, leak: +3 },
            regime: { repression: +7 },
            flags: { [`dirt:${target}`]: 1 },
            factions: { sable: { loyalty: +6, influence: +5 } },
            characters: { sarran: { loyalty: +5, influence: +6 }, [target]: { fear: +10, trust: -6 } },
            remember: [{ who: 'sarran', text: 'You took the file. She noted who asked.', weight: 1 }],
            schedule: [{ inDays: 5, visible: false, label: 'The subject of the file learns there is a file', effects: { hidden: { fear: +4 } } }],
          },
        };
      },
    },
    {
      id: 'refuse',
      label: 'Decline. Tell her to burn it.',
      hint: 'Clean hands. She will not burn it.',
      outcome: {
        text:
          '"Burn it," you say. Sarran inclines her head about four degrees. "As you wish, First Citizen."\n\nIt is not burned. You both know it is not burned. But you have established, in front of her, the kind of government you intend to run — and the Grey Floor hears about it by lunch, because Grebs hears about everything by lunch.',
        tone: 'good',
        effects: {
          stats: { legitimacy: +5, information: -3, power: -2 },
          hidden: { fear: -5 },
          regime: { reform: +8 },
          factions: { sable: { loyalty: -6, patience: -5 }, grey: { loyalty: +6 }, chorus: { loyalty: +4 } },
          characters: { sarran: { loyalty: -5, trust: +4 }, grebs: { loyalty: +6, trust: +5 } },
          remember: [{ who: 'sarran', text: 'You told her to burn a file. She now knows your limit.', weight: -1 }],
        },
      },
    },
    {
      id: 'ask-hers',
      label: '"Is there a file on me?"',
      hint: 'A real question. You may not enjoy how accurately she answers it.',
      outcome: (_s, rng) => {
        const bold = rng.chance(0.5);
        return bold
          ? {
              text:
                'Sarran does not blink. "There is a file on everyone, First Citizen. Yours is four pages. It was nineteen before you became First Citizen." She lets that sit. "Fifteen pages were transferred to the archive of your predecessor\'s death."\n\nShe leaves. You sit with that for some time.',
              tone: 'mixed',
              effects: {
                stats: { information: +6, legitimacy: -2 },
                hidden: { fear: +4, scandal: +7 },
                factions: { sable: { loyalty: +3, influence: +4 } },
                characters: { sarran: { trust: +8, influence: +5 } },
                flags: { knowsAboutStairwell: 1 },
                remember: [{ who: 'sarran', text: 'You asked her the direct question. She respected it.', weight: 2 }],
                schedule: [{ inDays: 6, visible: false, label: 'Fifteen pages, somewhere', cardId: 'stairwell-question' }],
              },
            }
          : {
              text:
                '"There is a file on everyone, First Citizen." She says it pleasantly, and changes the subject to shipping manifests, and you realise about ten minutes later that she never actually answered.',
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
  title: 'The Product',
  category: 'scandal',
  actor: 'loz',
  faction: 'concord',
  stages: ['politics', 'afternoon'],
  base: 8,
  weight: (s) => 8 + s.hidden.scandal * 0.2 + (s.stats.support < 45 ? 7 : 0),
  body:
    'Dmitar Loz takes the good chair without being offered it.\n\n"The Seven O\'Clock Word reaches sixty per cent of this country before dinner. I can give you eleven minutes a night for a month. Warm, not fawning — fawning doesn\'t sell." He spreads his hands. "It is a product, First Citizen. Products have prices."',
  flavor: 'He has said "the product" in front of the Convocation. Twice.',
  options: [
    {
      id: 'buy',
      label: 'Buy the eleven minutes.',
      hint: 'Costs ₩5bn. Support climbs. The news stops being news.',
      outcome: {
        text:
          'Within a week the Seven O\'Clock Word has discovered that you are calm in meetings, good with the elderly, and — in a segment nobody asked for — surprisingly knowledgeable about pigeons.\n\nSupport climbs four points. Somewhere in the Chorus, a twenty-six-year-old with a spreadsheet starts counting how many minutes you get versus everybody else.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -5, support: +8, legitimacy: -3, information: -5 },
          hidden: { cult: +12, leak: +5 },
          regime: { personalism: +11, graft: +5 },
          factions: { concord: { loyalty: +5 }, chorus: { loyalty: -9 } },
          characters: { loz: { loyalty: +9 }, vel: { loyalty: -6 } },
          news: ['SEVEN O\'CLOCK WORD LAUNCHES "THE FIRST CITIZEN AT WORK"'],
          schedule: [{ inDays: 7, visible: false, label: 'Somebody counts the minutes', cardId: 'minute-count' }],
        },
      },
    },
    {
      id: 'threaten',
      label: 'Remind him who licenses his transmitters.',
      hint: 'Free. Loz is not a man who forgets being leaned on.',
      enabled: (s) => s.stats.power > 40,
      lockedText: 'He would laugh. You are not currently in a position to be laughed at.',
      outcome: {
        text:
          'Loz\'s face does something complicated and then settles into a smile. "Of course, First Citizen. The product serves the nation."\n\nCoverage turns warm within forty-eight hours. It also turns slightly strange — a shade too glowing, in a way that anyone who has lived under three governments recognises immediately.',
        tone: 'mixed',
        effects: {
          stats: { support: +5, legitimacy: -5, power: +3, information: -7 },
          hidden: { cult: +9, leak: +10, scandal: +5 },
          regime: { repression: +11, personalism: +6 },
          factions: { concord: { loyalty: -5 }, chorus: { loyalty: -11 }, sable: { loyalty: +4 } },
          characters: { loz: { loyalty: -8, fear: +14, plotting: +8 } },
          remember: [{ who: 'loz', text: 'You threatened his transmitters.', weight: -2 }],
          schedule: [{ inDays: 6, visible: false, label: 'Loz finds another outlet for his opinions', effects: { hidden: { leak: +8, scandal: +6 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Decline. Let the coverage be whatever it is.',
      hint: 'Costs nothing. Buys nothing. Loz sells the eleven minutes to somebody else.',
      outcome: {
        text:
          'Loz shrugs with his whole upper body. "Then I shall sell them to someone who wants them."\n\nHe does. Two weeks of unusually flattering coverage of a certain popular provincial governor begins the following Monday, and everyone in the building pretends not to notice.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +3, information: +3 },
          regime: { reform: +4 },
          factions: { chorus: { loyalty: +4 }, provinces: { influence: +5 } },
          characters: { loz: { loyalty: -3 }, kostyn: { influence: +8 } },
          schedule: [{ inDays: 5, visible: false, label: 'Somebody else bought the eleven minutes', effects: { characters: { kostyn: { influence: +6 } }, hidden: { separatism: +3 } } }],
        },
      },
    },
  ],
},

{
  id: 'garrison-rotation',
  title: 'A Routine Rotation',
  category: 'security',
  actor: 'tern',
  faction: 'staff',
  stages: ['politics', 'government'],
  base: 6,
  minDay: 3,
  weight: (s) => 5 + s.hidden.coup * 0.35,
  body:
    'Colonel Tern requests the routine six-monthly rotation of the Capital Garrison: two battalions out to Gorsk, two fresh battalions in from the Kordiva depots.\n\nIt is genuinely routine. It has happened twenty-two times since 1994.\n\nIt is also the single most consequential piece of paperwork that crosses your desk this week, because the Capital Garrison is the only armed formation inside Sarnica.',
  flavor: 'Between two and five in the morning, Ravik Tern is the most important man in the Republic.',
  options: [
    {
      id: 'approve',
      label: 'Approve it as submitted.',
      hint: 'Normal. Correct. You will not know who is in those barracks.',
      outcome: {
        text:
          'You sign. Tern sends a handwritten note thanking you for your trust, which is charming, and is a record, and will be produced later by somebody, in some context, for some purpose.',
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
      label: 'Approve it — but have the Sable Office vet the incoming officers.',
      hint: 'You will know who is in the barracks. The army will know you checked.',
      outcome: {
        text:
          'Sarran\'s people go through the officer lists in a night. Two names are quietly moved. Nobody says why.\n\nVarkov does not raise it. Tern raises it, pleasantly, twice, and then stops raising it, which is the part you should remember.',
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
      label: 'Freeze the rotation. No movements this quarter.',
      hint: 'Nothing changes, which is the point. The Staff will ask why.',
      outcome: {
        text:
          'The order goes out and the garrison stays exactly as it is — which is to say, as Krast left it.\n\nVarkov asks you, directly, in a corridor, whether there is something she should know. It is the first time she has asked you a question she does not already have the answer to.',
        tone: 'mixed',
        effects: {
          stats: { power: +4, military: -5, security: +3 },
          hidden: { coup: -4, fear: +5 },
          regime: { repression: +6, personalism: +5 },
          factions: { staff: { loyalty: -7, patience: -8 } },
          characters: { tern: { loyalty: -4, fear: +7 }, varkov: { trust: -5, plotting: +3 } },
          schedule: [{ inDays: 6, visible: true, label: 'The frozen rotation cannot stay frozen forever', cardId: 'garrison-rotation' }],
        },
      },
    },
  ],
},

/* ----------------------------------------------------------- DEVELOPMENT */

{
  id: 'hadem-road',
  once: true,
  title: 'The Third Road',
  category: 'opportunity',
  faction: 'provinces',
  stages: ['development'],
  base: 7,
  weight: (s) => 6 + s.hidden.separatism * 0.3,
  body:
    'There are three roads into the Hadem Marches. Two are paved. The third has been "under consideration" since 1968 and is, in practice, a river with opinions.\n\nThe Marches councils have sent a delegation. They have sent one every four years for half a century. This is the first time a First Citizen has agreed to see them within a fortnight of taking office.',
  flavor: 'Everyone counts the roads. The army counts them differently than the councils do.',
  options: [
    {
      id: 'build',
      label: 'Build the road. Announce it to the delegation personally.',
      hint: 'Costs ₩8bn over several days. Binds the Marches in — and opens them up.',
      outcome: {
        text:
          'The delegation does not cheer. One of them — an elderly woman who has been on four of these delegations — simply says, "We will believe it when there is tarmac."\n\nThe General Staff files a note observing that a third road is a third road in both directions.',
        tone: 'good',
        effects: {
          stats: { treasury: -8, support: +4, stability: +5, legitimacy: +5 },
          hidden: { separatism: -14, fiscal: +5 },
          regime: { reform: +9, devolution: +8 },
          factions: { provinces: { loyalty: +9 }, staff: { loyalty: -3 }, combine: { loyalty: +4 } },
          characters: { kostyn: { loyalty: +4 }, varkov: { trust: -2 } },
          project: {
            name: 'The Third Hadem Road', days: 6,
            detail: 'Tarmac into the Marches. Binds the frontier to the Republic, and the Republic to the frontier.',
            legacy: 'built the third road into the Hadem Marches, fifty-seven years late',
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
      label: 'Send a garrison instead. Roads can wait; order cannot.',
      hint: 'Cheap and immediate. The Marches learn what they are to you.',
      outcome: {
        text:
          'Two companies go in on Thursday. The burned customs posts stop burning immediately.\n\nDrovnan radio, across the border, has a very good week. Folk music, then arson, then folk music.',
        tone: 'bad',
        effects: {
          stats: { treasury: -2, stability: +7, security: +5, legitimacy: -6, support: -3 },
          hidden: { separatism: +12, unrest: +5, foreign: +7 },
          regime: { repression: +12, militarism: +7 },
          factions: { staff: { loyalty: +6 }, provinces: { loyalty: -10, patience: -9 }, chorus: { loyalty: -7 } },
          characters: { varkov: { loyalty: +4 }, vel: { loyalty: -6 } },
          schedule: [{ inDays: 5, visible: false, label: 'The Marches respond to the garrison', effects: { hidden: { separatism: +7, unrest: +5 } } }],
        },
      },
    },
    {
      id: 'promise',
      label: 'Promise the road. Fund it "in the next cycle".',
      hint: 'Free today. The Marches have heard this exact sentence fourteen times.',
      outcome: {
        text:
          'The elderly woman on the delegation writes the date down in a small book. You get the strong impression the book has other dates in it.',
        tone: 'mixed',
        effects: {
          stats: { support: +2, legitimacy: -2 },
          hidden: { separatism: +3 },
          regime: { populism: +4 },
          factions: { provinces: { loyalty: +3, patience: -7 } },
          promise: { text: 'The third road into the Hadem Marches', to: 'provinces', inDays: 7 },
          schedule: [{ inDays: 7, visible: true, label: 'The Marches ask about the road', cardId: 'hadem-road-due' }],
        },
      },
    },
  ],
},

{
  id: 'saint-dovra',
  once: true,
  title: 'Saint Dovra\'s Day',
  category: 'decision',
  actor: 'vask',
  faction: 'provinces',
  stages: ['development', 'politics'],
  base: 6,
  minDay: 2,
  weight: (s) => 6 + (s.stats.support < 45 ? 6 : 0) + s.hidden.unrest * 0.1,
  body:
    'Archon Vask requests guidance on the parade.\n\nSaint Dovra\'s Day commemorates a flood that may not have happened. The parade certainly does — four hours, two hundred thousand people, and a tradition that the head of state walks the last kilometre on foot, in whatever weather the Republic has been given.\n\nIt has rained in Sarnica for nine consecutive days. Velmorrans consider the weather a referendum on the government\'s honesty.',
  flavor: 'Governments that cancel the parade do not last the year.',
  options: [
    {
      id: 'walk',
      label: 'Walk the last kilometre. In the rain.',
      hint: 'Costs nothing but dignity. Velmorrans remember who walked.',
      outcome: (s, rng) => {
        const great = rng.chance(0.55 + s.stats.support / 400);
        return great
          ? {
              text:
                'You walk it. It rains the entire way, horizontally, and by the four-hundred-metre mark you have stopped pretending to be dry, which is the moment the crowd decides it likes you.\n\nThe photograph — soaked, grinning, holding a small child\'s umbrella that is doing nothing at all — runs on every front page in the Republic. Loz runs it for free, which has never happened.',
              tone: 'good',
              effects: {
                stats: { support: +11, legitimacy: +7, stability: +4 },
                hidden: { cult: +8, unrest: -7 },
                regime: { populism: +11, personalism: +7 },
                factions: { all: { loyalty: +2 }, provinces: { loyalty: +5 }, chorus: { loyalty: +4 } },
                characters: { vask: { loyalty: +8, trust: +6 }, loz: { loyalty: +3 } },
                news: ['"THE ONE WHO WALKED" — SOAKED FIRST CITIZEN COMPLETES DOVRA KILOMETRE'],
                schedule: [{ inDays: 8, visible: false, label: 'The photograph acquires a life of its own', effects: { hidden: { cult: +6 }, stats: { support: +3 } } }],
              },
            }
          : {
              text:
                'You walk it. Eight hundred metres in, a gust takes the ceremonial sash into a drainage channel, and you spend a genuinely difficult forty seconds deciding whether to retrieve it.\n\nYou retrieve it. The clip is watched four million times. Opinion is divided on whether it was humble or humiliating, which in Velmorra means it was both.',
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
      hint: 'Dry, safe, and precisely the thing the country notices.',
      outcome: {
        text:
          'The motorcade covers the last kilometre in ninety seconds behind smoked glass.\n\nNobody boos. That would be vulgar. Instead, two hundred thousand Velmorrans stand in the rain and watch a car go past, and by Thursday the phrase "the one who took the car" exists, and by the following week it has stopped being a joke.',
        tone: 'bad',
        effects: {
          stats: { support: -8, legitimacy: -5, security: +2 },
          hidden: { unrest: +6, cult: -5 },
          regime: { repression: +4 },
          factions: { provinces: { loyalty: -6 }, chorus: { loyalty: -5 }, sable: { loyalty: +3 } },
          characters: { vask: { loyalty: -7 } },
          news: ['FIRST CITIZEN COMPLETES DOVRA KILOMETRE BY MOTORCADE'],
          schedule: [{ inDays: 6, visible: false, label: '"The one who took the car"', effects: { stats: { support: -3 }, hidden: { cult: -4 } } }],
        },
      },
    },
    {
      id: 'expand',
      label: 'Walk it — and have the state pay for the whole festival.',
      hint: 'Costs ₩4bn. A very good day. A very visible use of money you may not have.',
      outcome: {
        text:
          'Free rakiv in six regions, the parade extended to two days, and the Pigeon Federation given a ceremonial flypast that goes about as well as a ceremonial pigeon flypast can.\n\nThe country has a wonderful time. Brask watches the invoices come in with the expression of a man watching a building settle.',
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

/* ---------------------------------------------------------- FOREIGN/CRISIS */

{
  id: 'ostrene-lithium',
  title: 'A Five-Year Understanding',
  category: 'foreign',
  actor: 'piek',
  stages: ['government', 'afternoon'],
  base: 7,
  minDay: 2,
  weight: (s) => 7 + s.hidden.foreign * 0.15 + (s.stats.treasury < 35 ? 5 : 0),
  body:
    'The Ostrene Compact proposes a five-year price lock on Velmorran lithium carbonate. The rate is eleven per cent below the current market and sixteen per cent above what it will be if the market does what Brask thinks it will do.\n\nThe Ostrene ambassador does not request meetings. He announces them. He has announced this one for Thursday, and included the draft.',
  flavor: 'They buy forty-four per cent of your exports and they know it.',
  options: [
    {
      id: 'sign',
      label: 'Sign. Five years of certainty.',
      hint: 'Money now, predictably, forever. And a buyer who owns your only lever.',
      outcome: {
        text:
          'The signing is warm and takes eleven minutes. The ambassador calls Velmorra "a mature partner", which is the highest compliment the Compact has ever paid a country it can see from its own border.\n\nBrask files a one-page note recommending against. He files it after you sign, which is its own kind of loyalty.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +9, economy: +4, legitimacy: -3 },
          hidden: { foreign: -12, fiscal: -6 },
          regime: { technocracy: +4, isolation: +6 },
          factions: { concord: { loyalty: +6 }, combine: { loyalty: +3 }, chorus: { loyalty: -6 } },
          characters: { piek: { loyalty: +7, influence: +4 }, brask: { trust: -2 } },
          schedule: [{ inDays: 8, visible: false, label: 'The Compact finds a second thing it would like', cardId: 'ostrene-second' }],
        },
      },
    },
    {
      id: 'counter',
      label: 'Counter: three years, and they fund the Gorsk rail spur.',
      hint: 'A real negotiation. They may respect it. They may not be in the habit.',
      outcome: (s, rng) => {
        const win = rng.chance(0.35 + s.stats.power / 250 + CHARACTER_MAP.piek.competence / 600);
        return win
          ? {
              text:
                'They take it. The ambassador is visibly irritated for four seconds before the professional face returns, and four seconds is an enormous diplomatic victory for a country this size.\n\nGorsk gets its rail spur. Hess sends a one-line message: "Noted."',
              tone: 'good',
              effects: {
                stats: { treasury: +5, economy: +5, legitimacy: +6, power: +4 },
                hidden: { foreign: -5 },
                regime: { technocracy: +9, reform: +5 },
                factions: { combine: { loyalty: +8 }, concord: { loyalty: +4 }, chorus: { loyalty: +4 } },
                characters: { piek: { loyalty: +6, trust: +5 }, hess: { loyalty: +7 } },
                project: {
                  name: 'Gorsk Rail Spur', days: 7,
                  detail: 'Ostrene-funded. Moves lithium faster and gives the Combine something to lose.',
                  legacy: 'extracted a rail spur from the Ostrene Compact, which had not previously been done',
                  onComplete: { stats: { economy: +5, treasury: +3 }, factions: { combine: { loyalty: +5 } }, news: ['GORSK RAIL SPUR OPENS AHEAD OF SCHEDULE'] },
                },
                news: ['VELMORRA SECURES RAIL CONCESSION IN LITHIUM TALKS'],
              },
            }
          : {
              text:
                'They do not take it. The ambassador smiles, closes the folder, and mentions — apropos of nothing whatsoever — that gas contracts are also renewed annually.\n\nThe offer is withdrawn. The gas point is not withdrawn.',
              tone: 'bad',
              effects: {
                stats: { economy: -4, treasury: -1, legitimacy: +2 },
                hidden: { foreign: +14, fiscal: +5 },
                regime: { isolation: +5 },
                factions: { concord: { loyalty: -5 } },
                characters: { piek: { loyalty: -4, trust: -3 } },
                schedule: [{ inDays: 5, visible: true, label: 'Ostrene reviews the gas schedule', effects: { stats: { economy: -3, treasury: -2 }, hidden: { foreign: +6 } } }],
              },
            };
      },
    },
    {
      id: 'aureth',
      label: 'Stall — and quietly ask the Aureth Union what they would pay.',
      hint: 'Leverage, if it works. Ostrene finds out about these things.',
      outcome: {
        text:
          'Piek makes the approach at a dinner, in French, delightedly. The Aureth response is warm, vague, and contains the word "conditionality" three times.\n\nOn Friday the Ostrene ambassador mentions, in passing, that he hopes the dinner was enjoyable. He does not say which dinner.',
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
            { inDays: 6, visible: false, label: 'Ostrene registers displeasure', effects: { hidden: { foreign: +7 } } },
          ],
        },
      },
    },
  ],
},

{
  id: 'gorsk-strike-notice',
  title: 'Ten Days\' Notice',
  category: 'crisis',
  actor: 'hess',
  faction: 'combine',
  stages: ['politics', 'afternoon'],
  base: 7,
  weight: (s) => 6 + (55 - s.factions.combine.loyalty) * 0.3 + s.hidden.unrest * 0.2,
  body:
    'Bogdan Hess will not sit down. He says the chairs are a tactic.\n\n"Ten days\' notice. Gorsk shafts and the Mavro cranes, together. Not a protest, First Citizen — a stoppage. I am giving you the notice because the law requires it and because my father gave notice to your predecessor\'s predecessor and got shot at for his trouble. I would like this one to go differently."',
  flavor: 'He has never once had to make the phone call. That is the point of being able to.',
  options: [
    {
      id: 'meet-wages',
      label: 'Meet the wage claim.',
      hint: 'Costs ₩6bn. Ends it cleanly. Every other union is watching.',
      outcome: {
        text:
          'Hess shakes your hand, which he has not done before, and leaves without finishing his sentence about the chairs.\n\nWithin four days, the railway workers, the teachers, and — improbably but seriously — the Pigeon Federation\'s paid stewards have all opened "exploratory discussions".',
        tone: 'mixed',
        effects: {
          stats: { treasury: -6, stability: +9, support: +4, economy: -2 },
          hidden: { unrest: -12, fiscal: +6 },
          regime: { populism: +7 },
          factions: { combine: { loyalty: +13 }, concord: { loyalty: -7 }, grey: { patience: -4 } },
          characters: { hess: { loyalty: +11, trust: +8 }, adamek: { loyalty: -5 }, brask: { trust: -3 } },
          remember: [{ who: 'hess', text: 'You met the wage claim without a fight.', weight: 3 }],
          schedule: [{ inDays: 5, visible: true, label: 'Other unions open "exploratory discussions"', cardId: 'wage-contagion' }],
        },
      },
    },
    {
      id: 'negotiate',
      label: 'Offer half now, half tied to lithium revenue.',
      hint: 'Cheaper. Hess is not stupid, but he is tired of being right.',
      outcome: (s, rng) => {
        const accept = rng.chance(0.45 + s.characters.hess.trust / 250 + s.factions.combine.loyalty / 400);
        return accept
          ? {
              text:
                'Hess thinks about it for an uncomfortably long time — long enough that you hear the building\'s ventilation — and then says, "Half now. And you put the lithium clause in writing, in the Gazette, where I can point at it."\n\nYou do. It is the first written commitment a Velmorran government has made to the Combine since 1961.',
              tone: 'good',
              effects: {
                stats: { treasury: -3, stability: +7, legitimacy: +4 },
                hidden: { unrest: -9 },
                regime: { reform: +7, technocracy: +5 },
                factions: { combine: { loyalty: +8 }, concord: { loyalty: -3 } },
                characters: { hess: { loyalty: +8, trust: +9 } },
                promise: { text: 'Lithium-linked wage supplement for the Combine', to: 'combine', inDays: 8 },
                schedule: [{ inDays: 8, visible: true, label: 'The lithium clause comes due', cardId: 'lithium-clause-due' }],
              },
            }
          : {
              text:
                '"Half," says Hess. "And the other half depends on a price set in Ostrene." He puts on his coat. "I will take that to the shafts. I will not recommend it."\n\nThe notice stands. Eight days.',
              tone: 'bad',
              effects: {
                stats: { treasury: -3, stability: -4 },
                hidden: { unrest: +8 },
                factions: { combine: { loyalty: -5, patience: -8 } },
                characters: { hess: { loyalty: -3, trust: -2 } },
                schedule: [{ inDays: 4, visible: true, label: 'The stoppage begins in Gorsk and Mavro', cardId: 'strike-begins' }],
              },
            };
      },
    },
    {
      id: 'refuse',
      label: 'Refuse, and remind him that stoppages in strategic sectors are illegal.',
      hint: 'Costs nothing now. The Combine has never forgotten a law used against it.',
      outcome: {
        text:
          'Hess listens to the whole sentence without moving. Then: "My father was told that too."\n\nHe leaves. He does not slam the door — men like Hess never slam doors — and by evening the phrase "strategic sectors" is on a handmade placard in Gorsk, which is remarkably fast work for a mining town.',
        tone: 'bad',
        effects: {
          stats: { stability: -8, support: -5, power: +2 },
          hidden: { unrest: +14 },
          regime: { repression: +10 },
          factions: { combine: { loyalty: -14, patience: -16 }, concord: { loyalty: +6 }, chorus: { loyalty: -5 } },
          characters: { hess: { loyalty: -12, plotting: +6 }, adamek: { loyalty: +5 } },
          remember: [{ who: 'hess', text: 'You quoted the strategic-sectors law at him. His father was told that too.', weight: -3 }],
          schedule: [{ inDays: 3, visible: true, label: 'The stoppage begins in Gorsk and Mavro', cardId: 'strike-begins' }],
        },
      },
    },
  ],
},

{
  id: 'pigeon-schism',
  once: true,
  title: 'The Federation Schism',
  category: 'decision',
  stages: ['development', 'politics'],
  base: 5,
  minDay: 2,
  weight: () => 5,
  body:
    'The Velmorran Pigeon Federation has split.\n\nThe Northern Chapters hold that a bird released from a moving vehicle has not been released. The Coastal Chapters hold that this is "aristocratic nonsense from people with cars". Both have written to you. Both have four hundred thousand members between them. Both vote.\n\nThe Federation has more mobilising capacity than two of your political parties.',
  flavor: 'Do not laugh. Krast laughed, in 2014, and lost the Coast for six years.',
  options: [
    {
      id: 'north',
      label: 'Rule for the Northern Chapters.',
      hint: 'Kordiva and the uplands are delighted. The Coast is not.',
      outcome: {
        text:
          'The ruling is issued on official paper with the state seal, because anything less would be an insult, and everyone involved is entirely serious.\n\nKordiva is delighted. Mavro is incandescent. A dockworker is interviewed on the Seven O\'Clock Word describing the ruling as "the capital telling the sea how to fly".',
        tone: 'mixed',
        effects: {
          stats: { support: +2, stability: -2 },
          factions: { provinces: { loyalty: +6 }, combine: { loyalty: -4 } },
          characters: { kostyn: { loyalty: +4 }, hess: { loyalty: -3 } },
          news: ['STATE SEAL AFFIXED TO PIGEON RULING; MAVRO INCANDESCENT'],
        },
      },
    },
    {
      id: 'coast',
      label: 'Rule for the Coastal Chapters.',
      hint: 'The ports are delighted. The countryside adds it to the list.',
      outcome: {
        text:
          'Mavro celebrates. The Kordiva chapters announce they will "compete independently", which is a schism within a schism, and which the Grey Floor informs you may require primary legislation.',
        tone: 'mixed',
        effects: {
          stats: { support: +2, stability: -2 },
          factions: { combine: { loyalty: +5 }, provinces: { loyalty: -5 } },
          characters: { hess: { loyalty: +3 }, kostyn: { loyalty: -3 } },
          news: ['COASTAL RULING SPLITS FEDERATION FURTHER; LEGISLATION MAY BE REQUIRED'],
        },
      },
    },
    {
      id: 'unify',
      label: 'Refuse to rule. Convene a unity congress at state expense.',
      hint: 'Costs ₩1bn and some dignity. Might actually work.',
      outcome: (_s, rng) => {
        const ok = rng.chance(0.55);
        return ok
          ? {
              text:
                'Three days in a conference hall in Sarnica, enormous quantities of rakiv, and a compromise text on vehicle-release that nobody is happy with and everybody signs.\n\nYou are made Honorary Patron of the reunified Federation. It is, objectively, the silliest title you hold. It is also, as you will discover in about a fortnight, four hundred thousand people who take your calls.',
              tone: 'good',
              effects: {
                stats: { treasury: -1, support: +6, legitimacy: +4, stability: +3 },
                hidden: { cult: +4, unrest: -4 },
                regime: { populism: +6 },
                factions: { all: { loyalty: +2 }, provinces: { loyalty: +4 }, combine: { loyalty: +4 } },
                flags: { pigeonPatron: 1 },
                news: ['FEDERATION REUNIFIED; FIRST CITIZEN NAMED HONORARY PATRON'],
              },
            }
          : {
              text:
                'Three days in a conference hall, enormous quantities of rakiv, and a brawl on the second evening that is filmed from four angles.\n\nThe Federation is now in three pieces. You have paid for this.',
              tone: 'bad',
              effects: {
                stats: { treasury: -1, support: -4, legitimacy: -3 },
                factions: { provinces: { loyalty: -3 }, combine: { loyalty: -3 }, chorus: { loyalty: -2 } },
                news: ['UNITY CONGRESS ENDS IN BRAWL; FEDERATION NOW IN THREE PIECES'],
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
  minDay: 2,
  weight: (s) => 5 + (50 - s.stats.legitimacy) * 0.15 + s.hidden.unrest * 0.12,
  body:
    'Sanna Vel delivers the petition personally, on foot, with two hundred thousand people watching her walk to your gate on a live stream.\n\nForty thousand signatures. One demand: repeal Article 19, the clause that lets the Sable Office detain for ninety days without charge.\n\n"You did not write Article 19," she says. "That is precisely why you can repeal it."',
  flavor: 'She has no known price. This is either true or the most expensive secret in the Republic.',
  options: [
    {
      id: 'repeal',
      label: 'Repeal Article 19.',
      hint: 'A genuine reform. The Sable Office loses its favourite tool, and notices.',
      outcome: {
        text:
          'The repeal goes through the Convocation in a single afternoon, because the Convocation ratifies what it is given.\n\nSarran says nothing. She sends no note, raises no objection, files no memorandum — and three days later the Sable Office\'s daily intelligence summary arrives four pages shorter, with no explanation.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +12, support: +7, security: -9, information: -5 },
          hidden: { unrest: -8, fear: -9, leak: +4 },
          regime: { reform: +16 },
          factions: { chorus: { loyalty: +15 }, sable: { loyalty: -14, patience: -12 }, staff: { loyalty: -4 }, grey: { loyalty: +5 } },
          characters: { vel: { loyalty: +12, trust: +10 }, sarran: { loyalty: -12, plotting: +7 } },
          remember: [
            { who: 'vel', text: 'You repealed Article 19 when she asked.', weight: 3 },
            { who: 'sarran', text: 'You took Article 19 from her.', weight: -3 },
          ],
          news: ['ARTICLE 19 REPEALED — "THE FIRST HONEST THING IN A DECADE," SAYS VEL'],
          schedule: [{ inDays: 6, visible: false, label: 'The Sable Office adjusts to the new law', effects: { stats: { security: -3, information: -3 }, hidden: { leak: +5 } } }],
        },
      },
    },
    {
      id: 'review',
      label: 'Announce a review. Appoint Grebs to chair it.',
      hint: 'Buys months. Grebs will actually do the review, which may not be what you meant.',
      outcome: {
        text:
          'Vel looks at you for a long moment. "A review," she says, with no inflection at all, and the two hundred thousand people watching the stream hear exactly what she meant by it.\n\nGrebs accepts the chair. Grebs has never in nineteen years chaired a review that produced nothing.',
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
          'The petition is received, photographed, and filed. Vel does not complain. She simply reads the names out — all forty thousand, in shifts, on the stream, over nine days.\n\nBy day four it is the most-watched thing in the Republic.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -6, support: -4 },
          hidden: { unrest: +9, leak: +4 },
          regime: { repression: +5 },
          factions: { chorus: { loyalty: -11 }, sable: { loyalty: +5 } },
          characters: { vel: { loyalty: -8, influence: +9 }, sarran: { loyalty: +4 } },
          remember: [{ who: 'vel', text: 'You filed forty thousand signatures without reading one.', weight: -2 }],
          schedule: [{ inDays: 4, visible: false, label: 'She is still reading the names', effects: { stats: { support: -3, legitimacy: -3 }, hidden: { unrest: +6 } } }],
        },
      },
    },
    {
      id: 'arrest',
      label: 'Have the Sable Office detain her under Article 19.',
      hint: 'Ninety days without charge. Everything about this is irreversible.',
      enabled: (s) => s.stats.power > 45 && s.factions.sable.loyalty > 40,
      lockedText: 'The Office would not carry that order out for you today.',
      outcome: {
        text:
          'They take her at 04:40, on the stream, mid-sentence.\n\nThe Republic is very quiet for about eleven hours. Then Convocation Square starts filling, and the Sable Office reports that it is filling faster than it can count.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -18, support: -14, security: +5, power: +4, stability: -10 },
          hidden: { unrest: +26, fear: +16, leak: +8, scandal: +12 },
          regime: { repression: +22, personalism: +9 },
          factions: { chorus: { loyalty: -28, patience: -25 }, sable: { loyalty: +10 }, combine: { loyalty: -9 }, grey: { loyalty: -6 } },
          characters: { vel: { loyalty: -25, influence: +14 }, sarran: { loyalty: +9 }, doran: { fear: +8 } },
          scandal: { name: 'The 04:40 Detention', detail: 'The opposition leader taken live on air under a clause you had been asked to repeal.', heat: 55 },
          news: ['OPPOSITION LEADER DETAINED LIVE ON AIR'],
          schedule: [{ inDays: 2, visible: true, label: 'Convocation Square is filling', cardId: 'alert-square' }],
        },
      },
    },
  ],
},

{
  id: 'doran-warning',
  title: 'Yvet, With the Door Closed',
  category: 'person',
  actor: 'doran',
  stages: ['politics', 'night', 'afternoon'],
  base: 7,
  minDay: 2,
  weight: (s) => 6 + s.hidden.coup * 0.15 + s.hidden.scandal * 0.12,
  body:
    'Doran shuts the door and uses your first name, which is how you know it is serious.\n\n"Somebody in this building is taking meetings they are not putting in the diary. I know because I am the person who keeps the diary." She lets that sit. "I can find out who. It will cost you something, and I want to be honest with you about what."',
  flavor: 'She got you the Vice-Chairmanship nobody wanted. She is keeping score of exactly how much you owe her.',
  options: [
    {
      id: 'let-her',
      label: '"Find out. Whatever it costs."',
      hint: 'You will learn something real. Doran will own a little more of you.',
      outcome: (s, rng) => {
        const candidates = ['tern', 'piek', 'kostyn', 'adamek', 'loz'].filter((c) => s.characters[c]?.inPost);
        const who = rng.weighted(candidates, (c) => 1 + s.characters[c].plotting * 0.2) ?? 'tern';
        return {
          text:
            `Two days later she puts a single page on the desk. It is not a file — Doran does not do files — it is a list of times, rooms, and one name.\n\n${
              { tern: 'Colonel Tern. Four dinners, none in the diary, all in Gorsk.', piek: 'Orlan Piek. Three lunches at the Aureth residence, all "personal".', kostyn: 'Governor Kostyn. Two visits to Sarnica that never appeared on any schedule, both to the same address in Ilvet.', adamek: 'Rulf Adamek. Six meetings in this building. With people who are not you.', loz: 'Dmitar Loz. Editorial conferences that three cabinet members attended. Not as guests.' }[who]
            }\n\n"That's yours now," she says. "I'd like you to remember that I gave it to you."`,
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
      hint: 'More thorough. Now the Sable Office is investigating your own building.',
      outcome: {
        text:
          'Doran\'s face does not change, which from Doran is a slammed door.\n\n"Of course, First Citizen." She has not called you that since the swearing-in.\n\nThe Sable Office is extremely thorough. Within a week, four people in the building have stopped speaking freely in any room, including the ones who were not doing anything.',
        tone: 'mixed',
        effects: {
          stats: { security: +9, information: +6, power: +2 },
          hidden: { fear: +12, leak: +3 },
          regime: { repression: +11 },
          factions: { sable: { loyalty: +8, influence: +7 }, grey: { loyalty: -5, patience: -6 } },
          characters: { sarran: { loyalty: +7, influence: +6 }, doran: { loyalty: -9, trust: -8, plotting: +6 } },
          remember: [{ who: 'doran', text: 'She offered you her loyalty and you gave the job to the Sable Office.', weight: -3 }],
        },
      },
    },
    {
      id: 'drop',
      label: '"Leave it. I don\'t want a building full of frightened people."',
      hint: 'Decent. Also means you will not find out until it happens.',
      outcome: {
        text:
          'Doran nods slowly. "All right." She opens the door. Then, half out of it: "For what it\'s worth — that\'s the right answer, and it\'s going to cost you."\n\nShe is correct on both counts.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +3, security: -4, information: -3 },
          hidden: { fear: -8 },
          regime: { reform: +5 },
          factions: { grey: { loyalty: +6 }, sable: { patience: -3 } },
          characters: { doran: { loyalty: +8, trust: +9 } },
          remember: [{ who: 'doran', text: 'You refused to have the building searched.', weight: 2 }],
          schedule: [{ inDays: 4, visible: false, label: 'The undiarised meetings continue', effects: { hidden: { coup: +5, scandal: +4 } } }],
        },
      },
    },
  ],
},

{
  id: 'adamek-card',
  title: 'A Number, On a Card',
  category: 'opportunity',
  actor: 'adamek',
  faction: 'concord',
  stages: ['politics', 'government'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + (s.stats.treasury < 35 ? 8 : 0) + s.hidden.corruption * 0.15,
  body:
    'Adamek never says a number out loud. He writes it on a card and slides it across the desk.\n\nThe card says what Ilvet Instruments will contribute to the Republic\'s infrastructure fund this quarter. It is a genuinely enormous number.\n\nOn the back of the card, in the same hand, is the name of the ministry he would like a say in.',
  flavor: 'He has never held office. He has appointed four ministers.',
  options: [
    {
      id: 'take',
      label: 'Take the money. Give him the ministry.',
      hint: 'A very large sum, immediately. And a man who owns a ministry.',
      outcome: {
        text:
          'The money clears in a day and a half, which no state process in Velmorra has ever done.\n\nThe appointment is announced as "a technocratic selection". It is technically true: the man is a technocrat. He is also, for eleven years, Adamek\'s technocrat.',
        tone: 'mixed',
        effects: {
          stats: { treasury: +14, economy: +3, legitimacy: -7, elite: +8 },
          hidden: { corruption: +18, fiscal: -8, leak: +6 },
          regime: { graft: +18, patronage: +12 },
          factions: { concord: { loyalty: +14, influence: +9 }, chorus: { loyalty: -8 }, grey: { loyalty: -7, patience: -6 } },
          characters: { adamek: { loyalty: +12, influence: +10 }, grebs: { loyalty: -6, trust: -5 } },
          scandal: { name: 'The Ilvet Appointment', detail: 'A ministry that answers to a man who has never stood for anything.', heat: 30 },
          schedule: [{ inDays: 7, visible: false, label: 'Adamek\'s ministry begins ministering', effects: { hidden: { corruption: +8 }, stats: { economy: +2, legitimacy: -3 } } }],
        },
      },
    },
    {
      id: 'money-only',
      label: 'Take the money. Refuse the ministry.',
      hint: 'You get roughly half of it, and a man who now regards you as unreliable.',
      outcome: {
        text:
          'Adamek retrieves the card, writes a new number, and slides it back. It is a great deal smaller.\n\n"That one," he says pleasantly, "is the price of a contribution. The other one was the price of a relationship."',
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
      hint: 'Clean. Expensive. He will remember the gesture precisely.',
      outcome: {
        text:
          'Adamek looks at the card between you for a moment, then picks it up and tears it once, neatly, before putting it in his pocket.\n\n"I have done this with nine First Citizens," he says. "You are the third to do that." He does not say what happened to the other two.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +8, elite: -6, treasury: -1 },
          hidden: { corruption: -8 },
          regime: { reform: +12 },
          factions: { concord: { loyalty: -9, patience: -8 }, chorus: { loyalty: +7 }, grey: { loyalty: +7 }, combine: { loyalty: +5 } },
          characters: { adamek: { loyalty: -8, plotting: +6 }, grebs: { loyalty: +7, trust: +6 }, vel: { trust: +5 } },
          remember: [{ who: 'adamek', text: 'You pushed the card back. He tore it.', weight: -2 }],
          schedule: [{ inDays: 6, visible: false, label: 'The Concord reconsiders its arrangements', effects: { stats: { economy: -3 }, factions: { concord: { loyalty: -4 } } } }],
        },
      },
    },
  ],
},

{
  id: 'stairwell-question',
  title: 'The Stairwell',
  category: 'scandal',
  stages: ['afternoon', 'politics'],
  base: 5,
  minDay: 3,
  once: true,
  weight: (s) => 4 + s.hidden.scandal * 0.25 + s.hidden.leak * 0.2,
  body:
    'At the end of a routine press availability, a young reporter from a paper nobody reads asks the question nobody has asked on the record.\n\n"First Citizen — who was in the stairwell with Marshal Krast?"\n\nThe room goes so quiet you can hear the building.',
  flavor: 'Officially, a heart attack. Unofficially, a heart attack administered at close range.',
  options: [
    {
      id: 'honest',
      label: '"I don\'t know. I have asked. I have not been told."',
      hint: 'True, probably. It also announces that you are not in control of the Sable Office.',
      outcome: {
        text:
          'The clip runs everywhere. Half the Republic finds it disarmingly honest. The other half notices that the head of state has just said, on camera, that there is something the security services will not tell him.\n\nSarran watches it twice. You are told she watched it twice.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +6, power: -5, support: +3 },
          hidden: { scandal: +8, fear: -4 },
          regime: { reform: +7 },
          factions: { chorus: { loyalty: +9 }, sable: { loyalty: -8, patience: -7 }, staff: { loyalty: -3 } },
          characters: { sarran: { loyalty: -7, trust: +5 }, vel: { trust: +7 } },
          news: ['"I HAVE ASKED. I HAVE NOT BEEN TOLD." — FIRST CITIZEN ON KRAST'],
          schedule: [{ inDays: 5, visible: false, label: 'Someone decides to tell the reporter instead', effects: { hidden: { leak: +12, scandal: +8 } } }],
        },
      },
    },
    {
      id: 'stonewall',
      label: '"The matter is closed. Next question."',
      hint: 'Survives the afternoon. Guarantees the question comes back larger.',
      outcome: {
        text:
          'It works, in the room, for about eleven seconds.\n\nThe phrase "the matter is closed" is on placards within a week. Somebody prints it on a t-shirt. The t-shirt outsells the official commemorative Krast mug by a factor of nine.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -7, support: -4, power: +2 },
          hidden: { scandal: +14, leak: +8, unrest: +5 },
          regime: { repression: +7 },
          factions: { chorus: { loyalty: -9 }, sable: { loyalty: +6 } },
          characters: { sarran: { loyalty: +5 }, vel: { loyalty: -5 } },
          scandal: { name: 'The Stairwell', detail: 'Nobody has said who was in it. Everybody has noticed that nobody has said.', heat: 45 },
          news: ['"THE MATTER IS CLOSED" — T-SHIRTS REPORTEDLY SELLING WELL'],
        },
      },
    },
    {
      id: 'blame',
      label: 'Name a culprit. Someone conveniently already in custody.',
      hint: 'Ends the question today. Creates a permanent, load-bearing lie.',
      enabled: (s) => s.factions.sable.loyalty > 45,
      lockedText: 'The Sable Office would have to supply the name, and it is not currently minded to.',
      outcome: {
        text:
          'The Sable Office supplies a name within the hour, along with a confession, a motive, and a photograph of a man who looks very tired.\n\nThe story dies instantly. It has been buried in shallow ground, in a country with a very long memory and an extremely good archive.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: -3, support: +4, power: +5, information: -6 },
          hidden: { scandal: -10, fear: +10, leak: +9 },
          regime: { repression: +14, personalism: +6 },
          factions: { sable: { loyalty: +9, influence: +6 }, chorus: { loyalty: -7 }, grey: { loyalty: -4 } },
          characters: { sarran: { loyalty: +8, influence: +7 }, grebs: { trust: -6 } },
          scandal: { name: 'The Convenient Confession', detail: 'A very tired man, a very fast confession, and an archive that keeps everything.', heat: 20 },
          flags: { stairwellLie: 1 },
          schedule: [{ inDays: 9, visible: false, label: 'Shallow ground', effects: { hidden: { scandal: +16, leak: +10 } } }],
        },
      },
    },
  ],
},

{
  id: 'brask-notebook',
  once: true,
  title: 'The Green Notebook',
  category: 'economy',
  actor: 'brask',
  stages: ['government', 'night'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + s.hidden.fiscal * 0.2,
  body:
    'Brask puts the green notebook on the desk and opens it, which he has done twice in nineteen years.\n\n"These are the real numbers. Not the folder ones. If you want, I will close it again and we will use the folder, and I will never mention this meeting." He does not look up. "I would like you to know I am offering you both."',
  flavor: 'Presentable numbers in the folder. Real numbers in the notebook.',
  options: [
    {
      id: 'read-real',
      label: 'Read the real numbers.',
      hint: 'You will govern with accurate information and considerably less sleep.',
      outcome: {
        text:
          'The hole is larger than the folder says. It has been larger since 2021. Three separate ministries have been quietly funding each other\'s deficits in a circle, and one of the transfers has no legal basis whatsoever.\n\nBrask closes the notebook. "Right," he says. "Now we can actually do something."',
        tone: 'mixed',
        effects: {
          stats: { information: +14, treasury: -3, legitimacy: +2, economy: -2 },
          hidden: { fiscal: -8, corruption: -4 },
          regime: { technocracy: +12, reform: +6 },
          factions: { grey: { loyalty: +7 } },
          characters: { brask: { loyalty: +12, trust: +12 } },
          remember: [{ who: 'brask', text: 'You looked at the real numbers.', weight: 3 }],
          flags: { realNumbers: 1 },
          schedule: [{ inDays: 4, visible: true, label: 'The unfunded transfer has to be dealt with', cardId: 'circular-transfer' }],
        },
      },
    },
    {
      id: 'folder',
      label: '"Use the folder."',
      hint: 'Simpler. Survivable. The numbers do not stop being real.',
      outcome: {
        text:
          'Brask closes the notebook without any expression at all, and never mentions the meeting again — which, since he is the most honest man in the building, means he genuinely never mentions it.\n\nThe folder numbers are lovely. Everyone finds them very reassuring.',
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
  minDay: 2,
  weight: (s) => 4 + (s.stats.legitimacy < 45 ? 5 : 0),
  body:
    'It has now rained in Sarnica for nine consecutive days.\n\nVelmorrans believe the weather in the capital reflects the honesty of the government. Meteorologists have given up correcting this. The State Meteorological Service has requested guidance on its forecasting language, which is a sentence that should not be possible and is, nonetheless, on your desk.',
  flavor: 'Nobody in this country has ever been talked out of this belief. Nobody has ever tried twice.',
  options: [
    {
      id: 'joke',
      label: 'Make a joke about it on the evening broadcast.',
      hint: 'Free. Either charming or the clip that follows you for a decade.',
      outcome: (_s, rng) => {
        const lands = rng.chance(0.6);
        return lands
          ? {
              text:
                '"I am told it has rained for nine days," you say, "and I am told this is my fault. I would like to assure the Republic that I am working on it, and that if it stops on Thursday I intend to take full credit."\n\nIt stops on Thursday. The country is delighted and mildly unnerved.',
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
                'The joke lands in the studio and dies in the country. A run of editorials appears on the theme of "a government that finds the weather amusing", which sounds absurd until you remember what the weather means here.\n\nIt rains for four more days.',
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
      label: 'Instruct the broadcast to stop mentioning the rain.',
      hint: 'Tidy. Also the exact behaviour the superstition is about.',
      outcome: {
        text:
          'The Seven O\'Clock Word reports, for four consecutive evenings, on national weather in general and Sarnica not at all.\n\nBy the third evening this is the only thing anyone is talking about.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -6, support: -3, information: -6 },
          hidden: { unrest: +6, leak: +4, cult: +3 },
          regime: { repression: +9 },
          factions: { chorus: { loyalty: -7 }, sable: { loyalty: +3 } },
          news: ['STATE BROADCAST DECLINES TO DISCUSS CAPITAL WEATHER'],
        },
      },
    },
    {
      id: 'drainage',
      label: 'Announce ₩2bn of emergency drainage works for the capital.',
      hint: 'Costs money. Solves a real problem and an imaginary one simultaneously.',
      outcome: {
        text:
          'It is an absurd response to a meteorological superstition and a completely sensible response to nine days of standing water in the Ninth District.\n\nThe Ninth District, which floods every year and has been ignored since 1988, is extremely moved. The Grey Floor is quietly impressed that you found the one answer that works on both levels.',
        tone: 'good',
        effects: {
          stats: { treasury: -2, support: +6, legitimacy: +5, stability: +3 },
          hidden: { unrest: -5, cult: +3 },
          regime: { populism: +5, technocracy: +7 },
          factions: { grey: { loyalty: +6 }, combine: { loyalty: +4 }, chorus: { loyalty: +3 } },
          characters: { grebs: { loyalty: +5 }, brask: { loyalty: -2 } },
          project: {
            name: 'Ninth District Drainage', days: 5,
            detail: 'Emergency storm drainage for the part of Sarnica that floods every year.',
            legacy: 'finally drained the Ninth District, which had flooded annually since 1988',
            onComplete: { stats: { support: +4, stability: +3 }, hidden: { unrest: -5 }, news: ['NINTH DISTRICT DRY FOR FIRST TIME IN THIRTY-SEVEN YEARS'] },
          },
        },
      },
    },
  ],
},

/* -------------------------------------------------- FOLLOW-UP / QUEUED CARDS
 * These are never drawn randomly; they are queued by earlier decisions.
 * ------------------------------------------------------------------------ */

{
  id: 'mil-budget-due',
  title: 'The Quarter You Mentioned',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  base: 0,
  weight: () => 0,
  body:
    'Marshal Varkov has brought her own notebook this time, open, to a page with a date on it in her handwriting.\n\n"You said next quarter, First Citizen. It is next quarter."',
  flavor: 'She writes down only the things she intends to remember.',
  options: [
    {
      id: 'pay',
      label: 'Pay it. In full, today.',
      hint: 'Costs ₩9bn. A promise kept to the army is worth more than the money.',
      outcome: {
        text:
          'She closes the notebook. "Thank you, First Citizen." The second warmest sentence she has said to a civilian in four years.\n\nWord gets round the officer corps within a day: this one keeps their word. In an institution that has outlasted nine governments, that is an extraordinarily valuable rumour.',
        tone: 'good',
        effects: {
          stats: { treasury: -9, military: +11, power: +5, legitimacy: +3 },
          hidden: { coup: -14, fiscal: +6 },
          regime: { militarism: +8 },
          factions: { staff: { loyalty: +13, patience: +12 } },
          characters: { varkov: { loyalty: +11, trust: +12 }, tern: { loyalty: +5 } },
          remember: [{ who: 'varkov', text: 'You kept the fleet promise on the exact day.', weight: 3 }],
          flags: { promisesKept: 1 },
        },
      },
    },
    {
      id: 'part',
      label: 'Pay a third. Explain the treasury position honestly.',
      hint: 'Cheaper. Honesty buys you something with Varkov specifically.',
      outcome: {
        text:
          'You show her the number. Actually show her — the real one, not the folder one.\n\nVarkov reads it, and for the first time in your acquaintance she looks briefly like a person rather than an institution. "Very well." A pause. "Do not do that to me twice."',
        tone: 'mixed',
        effects: {
          stats: { treasury: -3, military: +2, legitimacy: +2 },
          hidden: { coup: +2, fiscal: +2 },
          factions: { staff: { loyalty: +1, patience: -6 } },
          characters: { varkov: { loyalty: +2, trust: +7 } },
          remember: [{ who: 'varkov', text: 'You showed her the real treasury number instead of paying.', weight: 1 }],
          schedule: [{ inDays: 6, visible: true, label: 'Do not do that to me twice', cardId: 'mil-budget-due' }],
        },
      },
    },
    {
      id: 'renege',
      label: 'Renege. The situation has changed.',
      hint: 'Saves ₩9bn. The army learns that your promises have conditions.',
      outcome: {
        text:
          'Varkov does not argue. She closes the notebook, stands, and says, "Understood."\n\nThat night, the Sable Office logs eleven separate calls between officers in three commands, none of whom have any operational reason to be talking to each other at that hour.',
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
  title: 'Another Single Sheet',
  category: 'decision',
  actor: 'varkov',
  faction: 'staff',
  base: 0,
  weight: () => 0,
  body:
    'Marshal Varkov puts a second sheet on the desk, face down, in exactly the manner of the first.\n\n"The fleet flies. Thank you. The air defence radars are from 1989 and one of them has been replaced, unofficially, with a civilian weather unit from Mavro."\n\nShe looks at her watch.',
  flavor: 'This is what funding something in full teaches an institution.',
  options: [
    {
      id: 'fund',
      label: 'Fund it. Again.',
      hint: 'Costs ₩7bn. The Staff becomes, gradually, the most powerful body in the Republic.',
      outcome: {
        text:
          'You sign. The Staff now has two consecutive years of real capital spending, the first since 1994, and a Chief who has learned exactly how to ask.\n\nGrebs sends a note observing that defence is now 31% of discretionary expenditure. The note contains no opinion. Grebs\'s notes never do.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -7, military: +9, security: +4, economy: -2 },
          hidden: { coup: -6, fiscal: +9 },
          regime: { militarism: +16 },
          factions: { staff: { loyalty: +9, power: +8, influence: +6 }, grey: { patience: -5 }, chorus: { loyalty: -4 } },
          characters: { varkov: { loyalty: +8, influence: +7 } },
          schedule: [{ inDays: 6, visible: false, label: 'Defence spending becomes structural', effects: { hidden: { fiscal: +6 }, factions: { staff: { power: +5 } } } }],
        },
      },
    },
    {
      id: 'audit',
      label: 'Fund it — on condition of a civilian audit of procurement.',
      hint: 'Money with strings. You are stepping on the Staff\'s red line.',
      outcome: {
        text:
          'Varkov goes very still. "An audit," she says. "Of the officer corps." She does not raise her voice; Varkov has never needed to.\n\nThe radars get funded. The audit is agreed. Neither of you mentions 1979, which is all either of you is thinking about.',
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
      label: '"Not this quarter, Marshal."',
      hint: 'Holds the line on spending. She funded a habit and you broke it.',
      outcome: {
        text:
          '"Not this quarter." She repeats it in the same tone you used, which is a very mild way of pointing out that you said something similar once before.\n\nShe takes the sheet. She does not write the date down. That is either progress or the opposite.',
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
  title: 'The Shafts Are Cold',
  category: 'crisis',
  faction: 'combine',
  base: 0,
  weight: () => 0,
  body:
    'Gorsk stops at 06:00. Mavro stops at 06:02, because the dockers wanted the miners to go first.\n\nNothing is moving: no lithium, no salt, no containers. The Concord estimates ₩1.4bn a day. Hess is standing outside the Gorsk union hall in the rain, saying nothing, being photographed.',
  flavor: 'He never had to make the phone call. He made the phone call.',
  options: [
    {
      id: 'concede',
      label: 'Concede the full claim. Publicly.',
      hint: 'Ends it in a day. Costs ₩8bn and establishes exactly what a stoppage achieves.',
      outcome: {
        text:
          'The shafts restart within nine hours, which nobody thought possible.\n\nHess is asked on camera whether this is a victory. He says, "It is a settlement," which is the single most expensive sentence anyone will say this year, because every union in the Republic now knows the price of a settlement.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -8, stability: +11, economy: -2, power: -6, support: +4 },
          hidden: { unrest: -14, fiscal: +7 },
          regime: { populism: +9 },
          factions: { combine: { loyalty: +14, power: +8 }, concord: { loyalty: -8 }, staff: { loyalty: -3 } },
          characters: { hess: { loyalty: +10, influence: +8 }, adamek: { loyalty: -6 } },
          schedule: [{ inDays: 5, visible: true, label: 'Every other union now knows the price', cardId: 'wage-contagion' }],
        },
      },
    },
    {
      id: 'wait',
      label: 'Wait them out. Say nothing for a week.',
      hint: 'Costs ₩1.4bn a day in output. Tests who blinks.',
      outcome: (s, rng) => {
        const blink = rng.chance(0.42 + (50 - s.factions.combine.loyalty) / 220);
        return blink
          ? {
              text:
                'On day six the Mavro dockers go back, because dockers are paid by the container and miners are paid by the shift, and Hess has always known this was his weak joint.\n\nGorsk holds for two more days and then folds. Hess does not comment. The Combine has learned something about itself, and so have you.',
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
                'They do not blink. On day seven the railway workers join "in sympathy", on day eight the Kordiva grain hauliers join for reasons nobody can adequately explain, and on day nine the country is, functionally, stationary.\n\nThe velk moves. The Concord calls. Everybody calls.',
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
      label: 'Send soldiers to reopen the shafts.',
      hint: 'The Combine\'s stated red line. Also the Staff\'s least favourite order.',
      enabled: (s) => s.stats.military > 40,
      lockedText: 'The General Staff would not carry that order out today.',
      outcome: {
        text:
          'Varkov takes the order in writing. She asks for it in writing. That should have told you something.\n\nTwo companies reach the Gorsk perimeter and stop, because six thousand miners and their families are sitting on the road. Nobody fires. Nobody moves. It is photographed from a hillside and the photograph is on every front page on the continent by morning.',
        tone: 'bad',
        effects: {
          stats: { stability: -18, legitimacy: -16, support: -12, military: -9, power: -4 },
          hidden: { unrest: +28, coup: +12, foreign: +12 },
          regime: { repression: +20, militarism: +8 },
          factions: { combine: { loyalty: -25, patience: -25 }, chorus: { loyalty: -14 }, staff: { loyalty: -8, patience: -9 }, concord: { loyalty: +4 } },
          characters: { hess: { loyalty: -20, plotting: +10 }, varkov: { loyalty: -8, trust: -8 }, vel: { loyalty: -10 } },
          scandal: { name: 'The Gorsk Road', detail: 'Two companies, six thousand families, and a photograph taken from a hillside.', heat: 65 },
          remember: [{ who: 'hess', text: 'You sent soldiers to Gorsk. His father was shot at. His children were on that road.', weight: -3 }],
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
    'Four Kordiva mayors have given the same interview to four different outlets, which in a region with one grain lobby is not a coincidence, it is a memorandum.\n\nThe message: the Basin will "review its arrangements" with the capital. In Velmorra, "arrangements" means tax receipts, and reviewing them means not forwarding them.',
  flavor: 'Kostyn has said nothing at all, which is the loudest thing in the file.',
  options: [
    {
      id: 'summon',
      label: 'Summon Kostyn. Make her say it to your face.',
      hint: 'Forces the issue. She is extremely good at rooms.',
      outcome: (s, rng) => {
        const win = rng.chance(0.4 + s.stats.power / 220);
        return win
          ? {
              text:
                '"They are mayors," she says. "They talk." You ask her to say, on the record, that the Basin will forward its receipts. She pauses for exactly as long as it takes to decide she is not ready yet — and then says it.\n\nShe will be ready eventually. But not today.',
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
                '"They are mayors," she says. "They talk." You ask her to say, on the record, that the Basin will forward its receipts.\n\nShe smiles, and says she would not want to "pre-empt the Basin council", and leaves a jar of honey on the desk. Numbered.',
              tone: 'bad',
              effects: {
                stats: { power: -6 },
                hidden: { separatism: +11 },
                factions: { provinces: { loyalty: -3, power: +6 } },
                characters: { kostyn: { influence: +9, plotting: +7 } },
                schedule: [{ inDays: 4, visible: false, label: 'The Basin council pre-empts nothing', effects: { stats: { treasury: -4 }, hidden: { separatism: +6 } } }],
              },
            };
      },
    },
    {
      id: 'buy',
      label: 'Send ₩5bn of "regional development" to the four mayors\' districts.',
      hint: 'Works immediately. Teaches four mayors what an interview is worth.',
      outcome: {
        text:
          'The money arrives, and so does the silence. Within a fortnight, eleven other mayors have discovered strong views about the capital which they would like to share with journalists.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -5, stability: +5 },
          hidden: { separatism: -6, corruption: +9, fiscal: +4 },
          regime: { patronage: +14 },
          factions: { provinces: { loyalty: +7 }, grey: { loyalty: -4 } },
          characters: { kostyn: { loyalty: +2 }, grebs: { trust: -4 } },
          schedule: [{ inDays: 6, visible: false, label: 'Eleven other mayors develop strong views', effects: { stats: { treasury: -4 }, hidden: { corruption: +6 } } }],
        },
      },
    },
    {
      id: 'ignore',
      label: 'Say nothing. Let it burn out.',
      hint: 'Costs nothing. Kordiva is extremely patient and never forgets a silence.',
      outcome: {
        text:
          'It burns for eleven days and then stops, which looks like victory.\n\nThe receipts for the quarter arrive four per cent light, with a covering letter citing "collection difficulties". Nobody mentions the interviews again. Nobody needs to.',
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
  title: 'What I\'m Owed',
  category: 'person',
  actor: 'doran',
  base: 0,
  weight: () => 0,
  body:
    'Doran closes the door and does not use your first name, which is new.\n\n"I got you the Vice-Chairmanship. I keep the diary, I keep the building running, and last week I did something for you that I can\'t un-do." She puts a single sheet down. "Deputy Chief of the Ministries. Grebs\'s deputy. I want it in writing before the Convocation sits."',
  flavor: 'She has been keeping score since before you had an office.',
  options: [
    {
      id: 'give',
      label: 'Give her the post.',
      hint: 'Buys total loyalty from the person who knows the most about you.',
      outcome: {
        text:
          'She reads the appointment twice and then folds it and puts it away, and for about two seconds she is thirty-one years old again and neither of you has a title.\n\n"Right," she says. "Now I actually owe you one."\n\nGrebs, informed of her new deputy, says only: "Interesting."',
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
      label: 'Offer money instead. A great deal of it.',
      hint: 'Cheaper in power terms. She did not ask for money.',
      outcome: {
        text:
          'She looks at the figure for a while.\n\n"You know what the difference is?" she says. "Money runs out. A post is a place to stand." She takes the money. She was always going to take the money. But something in the room has changed weight.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -4 },
          hidden: { corruption: +8 },
          regime: { graft: +9 },
          characters: { doran: { loyalty: +3, trust: -6, plotting: +7 } },
          remember: [{ who: 'doran', text: 'She asked for a place to stand and you offered her money.', weight: -2 }],
        },
      },
    },
    {
      id: 'refuse',
      label: '"No. And you know why."',
      hint: 'Holds the line against patronage. Doran keeps the diary.',
      outcome: {
        text:
          '"I do know why," she says. "That\'s the irritating part."\n\nShe opens the door, and stops. "I\'ll keep the diary. I\'ll keep the building running. But I\'m going to stop telling you things I\'m not obliged to tell you, and you won\'t notice for about a month."',
        tone: 'bad',
        effects: {
          stats: { legitimacy: +5, information: -8, security: -4 },
          regime: { reform: +8 },
          factions: { grey: { loyalty: +4 } },
          characters: { doran: { loyalty: -12, trust: -9, plotting: +10 }, grebs: { loyalty: +5 } },
          remember: [{ who: 'doran', text: 'You refused her the post. She stopped volunteering things.', weight: -3 }],
          schedule: [{ inDays: 7, visible: false, label: 'The things Doran is not telling you', effects: { stats: { information: -5, security: -3 } } }],
        },
      },
    },
  ],
},

];

export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

import type { AlertDef } from '../types';

/**
 * BREAKING ALERTS.
 *
 * Not random popups. Each declares the hidden pressure that `drives` it and a
 * `weight` that reads the live game state. An alert only fires because
 * something you did made it plausible.
 */
export const ALERTS: AlertDef[] = [

{
  id: 'alert-order-refused',
  title: 'AN ORDER HAS BEEN REFUSED',
  driver: 'coup',
  severity: 3,
  actor: 'tern',
  faction: 'staff',
  base: 0,
  minDay: 3,
  weight: (s) => Math.max(0, s.hidden.coup - 32) * 1.4 + Math.max(0, 45 - s.stats.military) * 0.5,
  body:
    '4:12am. Doran wakes you.\n\nA routine deployment order to the Third Battalion, signed by you six hours ago, has come back marked "REQUIRES CLARIFICATION FROM THE GENERAL STAFF".\n\nThere is no procedure for this. An order from the head of state does not require clarification. That is what the job is.\n\nColonel Tern is not answering his phone. General Varkov is.',
  flavor: 'It is 4:12am. The garrison is eleven minutes from this building.',
  options: [
    {
      id: 'call-varkov',
      label: 'Take Varkov\'s call. Ask her directly what is happening.',
      hint: 'The honest move. You find out whether she is the problem or the solution.',
      outcome: (s, rng) => {
        const loyal = s.characters.varkov.loyalty + s.factions.staff.loyalty / 2 - s.hidden.coup * 0.8;
        return loyal > 40 || rng.chance(0.25)
          ? {
              text:
                '"It is not a mutiny," she says, and you can hear that she is already dressed. "It is a message, and whoever sent it is going to regret choosing four in the morning to send it."\n\nThe order is carried out at 6am. Colonel Tern is reassigned to a training command by lunchtime. His handwritten thank-you note arrives three days later and is, for the first time, not charming.',
              tone: 'good',
              effects: {
                stats: { military: +5, power: +6, security: +4 },
                hidden: { coup: -22, fear: +7 },
                regime: { militarism: +5 },
                factions: { staff: { loyalty: +6 } },
                characters: { varkov: { loyalty: +9, trust: +8 }, tern: { loyalty: -12, plotting: -10, fear: +20 } },
                removeFromPost: [{ who: 'tern', reason: 'reassigned to a training command' }],
                flags: { ternReassigned: 1 },
                news: ['GARRISON COMMANDER REASSIGNED; MINISTRY CITES "ROUTINE ROTATION"'],
              },
            }
          : {
              text:
                '"It is not a mutiny," she says. There is a pause exactly long enough for you to notice that she is not alone in the room.\n\n"It is a request for clarification. I am sure you will want to provide it."\n\nThe order is not carried out. By morning two more have come back the same way.',
              tone: 'bad',
              effects: {
                stats: { military: -10, power: -14, security: -4, legitimacy: -6 },
                hidden: { coup: +16, fear: -6 },
                factions: { staff: { loyalty: -6, power: +9 } },
                characters: { varkov: { plotting: +14 }, tern: { plotting: +10 } },
                news: ['MINISTRY DECLINES TO COMMENT ON "ADMINISTRATIVE MATTER"'],
                schedule: [{ inDays: 2, visible: true, label: 'The army requests further clarification', cardId: 'alert-order-refused' }],
              },
            };
      },
    },
    {
      id: 'arrest-tern',
      label: 'Order the Sable Office to arrest Tern tonight.',
      hint: 'Decisive. If the Office moves faster than the garrison you win. If not, you have started it.',
      enabled: (s) => s.factions.sable.loyalty > 40,
      lockedText: 'The Sable Office would need to be considerably more yours than it is.',
      outcome: (s, rng) => {
        const win = rng.chance(0.3 + s.stats.security / 200 + s.factions.sable.loyalty / 300 - s.hidden.coup / 200);
        return win
          ? {
              text:
                'They take him at 5:05am in his own hallway, in a dressing gown, and it is over before the garrison duty officer has finished his tea.\n\nVarkov is informed at 7am. She listens to the whole account, says "Understood", and never mentions Ravik Tern again for the rest of your acquaintance.',
              tone: 'mixed',
              effects: {
                stats: { power: +9, security: +7, military: -7, legitimacy: -5 },
                hidden: { coup: -18, fear: +20 },
                regime: { repression: +16, personalism: +8 },
                factions: { sable: { loyalty: +10, influence: +8 }, staff: { loyalty: -9, patience: -8 } },
                characters: { tern: { loyalty: -30, plotting: -25, fear: +40 }, sarran: { loyalty: +8, influence: +8 }, varkov: { trust: -6, fear: +10 } },
                removeFromPost: [{ who: 'tern', reason: 'arrested at dawn' }],
                flags: { ternArrested: 1, peopleJailed: 1 },
                scandal: { name: 'The dressing-gown arrest', detail: 'The capital garrison commander taken from his hallway at dawn by men in plain clothes.', heat: 35 },
                news: ['GARRISON COMMANDER DETAINED; NO CHARGES ANNOUNCED'],
              },
            }
          : {
              text:
                'The Sable Office team arrives at 5:05am and finds the street already held by soldiers of the Capital Garrison, who are polite, apologetic and completely immovable.\n\nBy 6am the garrison has closed three bridges "for maintenance". Nobody has fired anything. Nobody needs to.',
              tone: 'bad',
              effects: {
                stats: { power: -18, military: -12, security: -8, legitimacy: -8, stability: -8 },
                hidden: { coup: +26, fear: -10 },
                factions: { staff: { loyalty: -10, power: +12 }, sable: { loyalty: -5, power: -6 } },
                characters: { tern: { plotting: +22, fear: -10 }, varkov: { plotting: +10 } },
                news: ['THREE CAPITAL BRIDGES CLOSED "FOR MAINTENANCE"'],
                schedule: [{ inDays: 1, visible: true, label: 'The bridges are still closed', cardId: 'alert-order-refused' }],
              },
            };
      },
    },
    {
      id: 'withdraw',
      label: 'Withdraw the order. Call it an administrative error.',
      hint: 'Nothing happens tonight. Everyone in the building learns what happens when you are pushed.',
      outcome: {
        text:
          'The order is withdrawn at 5:30am and reissued at 9am with an extra paragraph explaining its administrative basis. That is an apology, built into the text.\n\nNobody says anything. Everybody understands. By the end of the week two other ministries have started asking for clarification of things.',
        tone: 'bad',
        effects: {
          stats: { power: -12, military: -3, legitimacy: -6, security: -2 },
          hidden: { coup: +9, fear: -12 },
          factions: { staff: { loyalty: +3, power: +7 }, grey: { patience: -5 }, sable: { loyalty: -4 } },
          characters: { tern: { loyalty: +3, plotting: +8 }, varkov: { trust: -4 }, doran: { trust: -5 } },
          schedule: [{ inDays: 3, visible: false, label: 'Other ministries start asking for clarification', effects: { stats: { power: -5 }, hidden: { coup: +5 } } }],
        },
      },
    },
  ],
},

{
  id: 'alert-square',
  title: 'THE MAIN SQUARE IS FILLING',
  driver: 'unrest',
  severity: 3,
  faction: 'chorus',
  base: 0,
  weight: (s) => Math.max(0, s.hidden.unrest - 30) * 1.5 + Math.max(0, 40 - s.stats.stability) * 0.6,
  body:
    'It started at four with maybe two thousand people. The last Sable Office count was ninety minutes ago and said sixty thousand, and the Sable Office does not round down.\n\nThe square holds about a hundred and forty thousand. The side streets hold considerably more.\n\nThere is no organiser, no list of demands and no stage. Every Velmorran over forty knows what that means, because the last two times looked exactly like this.',
  flavor: 'Ninety minutes. That is how long it takes to fill the square.',
  options: [
    {
      id: 'go-out',
      label: 'Go out there. On foot. Without the cordon.',
      hint: 'Free and extremely dangerous. It will be the defining image of your government either way.',
      outcome: (s, rng) => {
        const p = 0.3 + s.stats.support / 220 + s.stats.legitimacy / 300 - s.hidden.unrest / 200;
        return rng.chance(p)
          ? {
              text:
                'You walk out of the gate with Doran three steps behind you saying your first name over and over in a tone she has never used before.\n\nThe front of the crowd does not know what to do. Neither do you. You get about forty metres before somebody shouts a question about payroll, and you answer it — badly, honestly, standing in the rain with sixty thousand people listening.\n\nIt is filmed from four hundred angles. It solves nothing. It changes everything.',
              tone: 'good',
              effects: {
                stats: { support: +14, legitimacy: +12, stability: +8, power: +5 },
                hidden: { unrest: -24, cult: +9 },
                regime: { populism: +14, personalism: +10 },
                factions: { chorus: { loyalty: +12 }, combine: { loyalty: +8 }, all: { loyalty: +2 }, sable: { loyalty: -5 } },
                characters: { doran: { loyalty: +6, fear: +12 }, vel: { trust: +8 }, sarran: { loyalty: -6 } },
                news: ['THE CHAIR WALKED INTO THE SQUARE'],
                schedule: [{ inDays: 5, visible: false, label: 'The square footage keeps circulating', effects: { stats: { support: +4 }, hidden: { cult: +5 } } }],
              },
            }
          : {
              text:
                'You get eleven metres past the gate before the front of the crowd surges — not at you particularly, crowds do not have intentions — and your protection detail takes you off your feet and back through the gate in about four seconds.\n\nThe footage is of a head of state being carried backwards through a gate. It runs for nine days.',
              tone: 'bad',
              effects: {
                stats: { support: -9, legitimacy: -8, power: -7, security: -4 },
                hidden: { unrest: +10, cult: -8 },
                factions: { chorus: { loyalty: -6 }, sable: { loyalty: +4 } },
                characters: { doran: { fear: +16 }, sarran: { loyalty: +4 } },
                news: ['CHAIR CARRIED BACK THROUGH GATE; SQUARE STILL FULL'],
                schedule: [{ inDays: 1, visible: true, label: 'The square is still full', cardId: 'alert-square' }],
              },
            };
      },
    },
    {
      id: 'concede',
      label: 'Announce an immediate concession on live television.',
      hint: 'Cost: $6.0B and some authority. Crowds go home when they win something.',
      outcome: {
        text:
          'You are on air within forty minutes, which is itself remarkable, and you give them one real thing — not a review, not a commitment, a thing that happens on Monday.\n\nThe square thins by midnight. It does not empty. But a square that thins is a square that has decided to give you one more go.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -6, support: +8, stability: +9, legitimacy: +3, power: -5 },
          hidden: { unrest: -18, fiscal: +5 },
          regime: { populism: +11 },
          factions: { chorus: { loyalty: +8 }, combine: { loyalty: +6 }, concord: { loyalty: -4 }, sable: { loyalty: -3 } },
          characters: { vel: { trust: +5 } },
          news: ['EMERGENCY BROADCAST: CONCESSION ANNOUNCED; SQUARE THINS BY MIDNIGHT'],
        },
      },
    },
    {
      id: 'clear',
      label: 'Clear the square. Sable Office, garrison in reserve.',
      hint: 'Free. It will be clear by morning. This country has a long memory for mornings like this.',
      enabled: (s) => s.factions.sable.loyalty > 35,
      lockedText: 'Neither the Office nor the garrison would carry out that order tonight.',
      outcome: (s, rng) => {
        const clean = rng.chance(0.45 + s.stats.security / 250 - s.hidden.unrest / 180);
        return clean
          ? {
              text:
                'They do it at 3am, from three sides, with water and without firearms, and it is over in ninety minutes.\n\nFour hundred arrests and no deaths. The Sable Office considers this an outstanding professional result. The rest of the country considers it a night in March that it will be referring to for the next thirty years.',
              tone: 'mixed',
              effects: {
                stats: { stability: +11, support: -13, legitimacy: -14, power: +7, security: +5 },
                hidden: { unrest: -16, fear: +18, scandal: +10 },
                regime: { repression: +22 },
                factions: { chorus: { loyalty: -20 }, sable: { loyalty: +9 }, combine: { loyalty: -10 }, staff: { loyalty: -3 } },
                characters: { sarran: { loyalty: +8, influence: +7 }, vel: { loyalty: -12 }, varkov: { trust: -4 } },
                flags: { protestsCrushed: 1, peopleJailed: 400 },
                scandal: { name: 'The night of the 3rd of March', detail: 'Four hundred arrests, no deaths, and a date people will be referring to for thirty years.', heat: 50 },
                news: ['SQUARE CLEARED BEFORE DAWN; FOUR HUNDRED ARRESTED'],
              },
            }
          : {
              text:
                'It does not go cleanly. Something happens on the north side that nobody will ever satisfactorily explain, and by 4am there are seventeen people in the Republican Hospital and one name that everybody knows by breakfast.\n\nThe square is cleared. The country is not.',
              tone: 'bad',
              effects: {
                stats: { stability: -6, support: -22, legitimacy: -24, power: +3, security: +2 },
                hidden: { unrest: +14, fear: +20, scandal: +30, coup: +8 },
                regime: { repression: +26 },
                factions: { chorus: { loyalty: -30, patience: -25 }, combine: { loyalty: -18 }, sable: { loyalty: +6 }, staff: { loyalty: -9 }, grey: { loyalty: -8 } },
                characters: { sarran: { loyalty: +5 }, vel: { loyalty: -15, influence: +12 }, varkov: { trust: -9, plotting: +8 }, grebs: { loyalty: -8 } },
                flags: { protestsCrushed: 1, peopleJailed: 600 },
                scandal: { name: 'The north side', detail: 'Seventeen people in hospital and one name everybody knew by breakfast.', heat: 80 },
                news: ['SEVENTEEN IN HOSPITAL AFTER SQUARE CLEARANCE', 'ONE NAME IS BEING REPEATED IN EVERY CITY IN THE COUNTRY'],
                schedule: [{ inDays: 3, visible: true, label: 'The name is still being repeated', effects: { hidden: { unrest: +16, scandal: +10 }, stats: { legitimacy: -6 } } }],
              },
            };
      },
    },
    {
      id: 'wait',
      label: 'Do nothing. Let the weather do the work.',
      hint: 'Free. Sometimes it works. It has been raining for nine days.',
      outcome: (s, rng) =>
        rng.chance(0.4 - s.hidden.unrest / 300)
          ? {
              text:
                'It rains harder at eleven. By two in the morning the square holds maybe nine thousand extremely committed people and a lot of standing water.\n\nBy dawn it is empty. Nothing has been resolved and nothing has been conceded. You got away with it, which in this job counts as a win.',
              tone: 'mixed',
              effects: {
                stats: { stability: +3, legitimacy: -4, power: +2 },
                hidden: { unrest: -6 },
                factions: { chorus: { loyalty: -4 } },
                news: ['SQUARE EMPTIES BY DAWN; RAIN CITED'],
              },
            }
          : {
              text:
                'It rains harder at eleven and nobody goes home, which is the thing about this country that outsiders never understand.\n\nBy morning there are tents. By afternoon there are tents with kitchens. By evening the Pigeon Federation has sent food, which sounds funny until you remember they have 400,000 members and have never taken a side before.',
              tone: 'bad',
              effects: {
                stats: { stability: -12, support: -7, legitimacy: -8, power: -6 },
                hidden: { unrest: +16 },
                factions: { chorus: { loyalty: -6, power: +8 }, combine: { loyalty: -4 }, provinces: { loyalty: -3 } },
                news: ['CAMPS IN THE MAIN SQUARE; PIGEON FEDERATION SENDS FOOD'],
                schedule: [{ inDays: 2, visible: true, label: 'The camps in the square', cardId: 'alert-square' }],
              },
            },
    },
  ],
},

{
  id: 'alert-velk',
  title: 'THE CURRENCY IS FALLING',
  driver: 'fiscal',
  severity: 3,
  actor: 'brask',
  base: 0,
  weight: (s) => Math.max(0, s.hidden.fiscal - 28) * 1.2 + Math.max(0, 38 - s.stats.economy) * 0.7,
  body:
    'The currency opened down four per cent, went down another six by eleven, and is currently not trading in any meaningful sense because nobody will quote a price.\n\nBrask is in your office without the notebook, which is worse than the notebook.\n\n"The peg is gone. It went at about half past ten. The only question left is whether we are the ones who announce it."',
  flavor: 'The peg has been indefensible for two years. Today is the day it found out.',
  options: [
    {
      id: 'float',
      label: 'Float the currency. Announce it yourself, today.',
      hint: 'Free, brutal and honest. The currency finds its level and so does your approval rating.',
      outcome: {
        text:
          'You say the word "float" on live television at 4pm. The currency loses nineteen per cent in forty minutes and then, remarkably, stops.\n\nImports are now catastrophic. Exports are suddenly excellent. Gorsk lithium is the cheapest in the region and the Concord, who were screaming at noon, are quietly buying by four.\n\nBrask says: "That was the correct decision and I would like it noted that it was also the brave one."',
        tone: 'mixed',
        effects: {
          stats: { economy: -9, treasury: -3, support: -12, legitimacy: +9, power: +4 },
          hidden: { fiscal: -22, unrest: +11 },
          regime: { technocracy: +14, reform: +9 },
          factions: { concord: { loyalty: +5 }, combine: { loyalty: -8 }, grey: { loyalty: +8 }, chorus: { loyalty: +6 } },
          characters: { brask: { loyalty: +14, trust: +13 }, adamek: { loyalty: +4 } },
          news: ['THE PEG IS GONE — CURRENCY FLOATS, LOSES NINETEEN PER CENT, STOPS'],
          schedule: [
            { inDays: 4, visible: true, label: 'Export earnings under the new rate', effects: { stats: { economy: +7, treasury: +5 } } },
            { inDays: 6, visible: true, label: 'Import prices reach the shops', effects: { stats: { support: -5 }, hidden: { unrest: +8 } } },
          ],
        },
      },
    },
    {
      id: 'defend',
      label: 'Defend the peg. Spend the reserves.',
      hint: 'Cost: $11.0B to buy time. It has worked before. Twice.',
      outcome: (s, rng) =>
        rng.chance(0.35 + s.stats.treasury / 300)
          ? {
              text:
                'The central bank spends $11 billion in six hours and the currency holds at minus three.\n\nIt is a genuine win, and it has bought you somewhere between four weeks and one bad Tuesday.',
              tone: 'mixed',
              effects: {
                stats: { treasury: -11, economy: +3, support: +4, legitimacy: +2 },
                hidden: { fiscal: +9 },
                factions: { concord: { loyalty: +6 }, combine: { loyalty: +4 } },
                characters: { brask: { trust: -3 } },
                news: ['PEG HOLDS; CENTRAL BANK SPENDS ELEVEN BILLION'],
                schedule: [{ inDays: 6, visible: true, label: 'Between four weeks and one bad Tuesday', cardId: 'alert-velk' }],
              },
            }
          : {
              text:
                'The central bank spends $11 billion in six hours and the currency goes anyway at 3:40pm, in the middle of a live broadcast in which the governor is explaining that it will not.\n\nYou have now had the devaluation and paid for the defence.',
              tone: 'bad',
              effects: {
                stats: { treasury: -11, economy: -14, support: -14, legitimacy: -11, elite: -8 },
                hidden: { fiscal: +14, unrest: +16 },
                factions: { concord: { loyalty: -9 }, combine: { loyalty: -7 }, grey: { loyalty: -5 } },
                characters: { brask: { loyalty: -5, trust: -6 } },
                news: ['PEG BREAKS ON AIR DURING GOVERNOR\'S REASSURANCE'],
              },
            },
    },
    {
      id: 'controls',
      label: 'Impose capital controls. Close the Free Zone transfers tonight.',
      hint: 'Stops the bleeding instantly and gains $7.0B. Declares war on every bank at once.',
      outcome: {
        text:
          'The transfers close at 6pm. $40 billion that was leaving stops leaving, which is the point. $40 billion that intended to arrive next quarter changes its mind, which is also the point and nobody mentions it.\n\nAdamek calls once. You do not take it. That will be discussed later, at length, in rooms you are not in.',
        tone: 'mixed',
        effects: {
          stats: { economy: -7, treasury: +7, power: +6, elite: -14, legitimacy: -4 },
          hidden: { fiscal: -10, corruption: -8, foreign: +11 },
          regime: { repression: +12, isolation: +14 },
          factions: { concord: { loyalty: -20, patience: -18 }, combine: { loyalty: +7 }, grey: { loyalty: +4 } },
          characters: { adamek: { loyalty: -18, plotting: +14 }, brask: { loyalty: +5 } },
          news: ['CAPITAL CONTROLS IMPOSED; FREE ZONE TRANSFERS CLOSED AT SIX'],
          schedule: [{ inDays: 5, visible: true, label: 'The Concord meet about the transfers', cardId: 'concord-response' }],
        },
      },
    },
  ],
},

{
  id: 'alert-leak',
  title: 'A REPORTER HAS THE DOCUMENTS',
  driver: 'leak',
  severity: 2,
  base: 0,
  minDay: 3,
  weight: (s) => Math.max(0, s.hidden.leak - 25) * 1.3 + s.hidden.scandal * 0.4 + Math.max(0, 40 - s.stats.information) * 0.3,
  body:
    'A reporter has 900 pages. Not a summary — actual pages, photographed, with the ministry stamp in the corner of every one.\n\nThey have sent four of them over for comment, which is a courtesy and also a countdown. Publication is in eleven hours.\n\nNobody knows who gave it to them. Grebs has a theory. Grebs always has a theory.',
  flavor: 'Nine hundred pages. Somebody carried those out of the building.',
  options: [
    {
      id: 'get-ahead',
      label: 'Publish all of it yourself, first, with a statement.',
      hint: 'Free. Takes the sting out and the story with it. You cannot un-publish 900 pages.',
      outcome: {
        text:
          'The ministry puts all 900 pages on the government website at 9pm with a two-paragraph statement that says, in effect: here it is, some of it is embarrassing, read it.\n\nThe reporter\'s exclusive evaporates. So does the mystery. Two officials resign over something on page 411 that nobody would have found for a fortnight otherwise.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +9, information: +6, support: -5, power: -3 },
          hidden: { leak: -20, scandal: -12 },
          regime: { reform: +12 },
          factions: { chorus: { loyalty: +10 }, grey: { loyalty: -6, patience: -5 }, sable: { loyalty: -5 } },
          characters: { grebs: { trust: +5 }, vel: { trust: +7 } },
          flags: { ministersLost: 2 },
          news: ['GOVERNMENT PUBLISHES ITS OWN LEAK; TWO RESIGN OVER PAGE 411'],
        },
      },
    },
    {
      id: 'injunct',
      label: 'Get an injunction. Stop publication tonight.',
      hint: 'Free. Works for about a day and a half. Guarantees the story becomes about the injunction.',
      outcome: {
        text:
          'The injunction is granted at 11pm by a judge who looks extremely unhappy about it.\n\nThe documents are published at 11:20pm from a server outside the country, and the story is now: a government that tried to injunct 900 pages of its own paperwork. Which is a much better story.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -13, support: -6, information: -4, power: +2 },
          hidden: { leak: +9, scandal: +16 },
          regime: { repression: +14 },
          factions: { chorus: { loyalty: -13 }, sable: { loyalty: +5 }, grey: { loyalty: -4 } },
          characters: { vel: { influence: +9 }, loz: { loyalty: -3 } },
          scandal: { name: 'The injunction', detail: 'A government that tried to injunct 900 pages of its own paperwork.', heat: 45 },
          news: ['INJUNCTION GRANTED AT ELEVEN; DOCUMENTS PUBLISHED AT TWENTY PAST'],
        },
      },
    },
    {
      id: 'find-source',
      label: 'Find the source. Sable Office, tonight, whatever it takes.',
      hint: 'Free. Does not stop publication. Stops the next one, and teaches the building a lesson.',
      outcome: (s, rng) =>
        rng.chance(0.55 + s.stats.security / 250)
          ? {
              text:
                'They find her in four hours: a records clerk on the third floor, nineteen years of service, who did it because of something that happened in 2019 and who does not appear to have been paid anything at all.\n\nThe documents publish anyway. But the building now knows the Office can find someone in four hours, and that is worth more than the documents were.',
              tone: 'mixed',
              effects: {
                stats: { security: +9, legitimacy: -7, support: -4, information: +3 },
                hidden: { leak: -18, fear: +18, scandal: +8 },
                regime: { repression: +16 },
                factions: { sable: { loyalty: +9 }, grey: { loyalty: -9, patience: -8 }, chorus: { loyalty: -8 } },
                characters: { sarran: { loyalty: +8, influence: +7 }, grebs: { loyalty: -7, fear: +9 } },
                flags: { peopleJailed: 1 },
                news: ['RECORDS CLERK ARRESTED; DOCUMENTS PUBLISH ANYWAY'],
              },
            }
          : {
              text:
                'They do not find her. They interview sixty people in one night, in the building, at their desks, with the lights on.\n\nThe documents publish. The civil service, which has worked in that building through nine governments, spends the following week saying nothing to anyone about anything.',
              tone: 'bad',
              effects: {
                stats: { security: +2, legitimacy: -9, information: -8 },
                hidden: { fear: +16, leak: +7, scandal: +10 },
                factions: { grey: { loyalty: -14, patience: -12 }, sable: { loyalty: +3 }, chorus: { loyalty: -7 } },
                characters: { grebs: { loyalty: -11, trust: -9 }, doran: { fear: +9 } },
                schedule: [{ inDays: 4, visible: false, label: 'The ministries have stopped volunteering things', effects: { stats: { information: -6, power: -4 } } }],
              },
            },
    },
  ],
},

{
  id: 'alert-ultimatum',
  title: 'THE OSTRENE AMBASSADOR IS IN THE BUILDING',
  driver: 'foreign',
  severity: 2,
  actor: 'piek',
  base: 0,
  minDay: 3,
  weight: (s) => Math.max(0, s.hidden.foreign - 26) * 1.3 + s.hidden.separatism * 0.2,
  body:
    'The Ostrene ambassador has arrived without an appointment, which he has never done, and is sitting outside declining coffee, which he has also never done.\n\nPiek is panicking quietly in a corner like a man who suspects this is somehow his fault, and is correct.\n\nThe ambassador has one sheet of paper and forty minutes in his diary.',
  flavor: 'They buy 44% of your exports. They have never had to say so out loud.',
  options: [
    {
      id: 'accept',
      label: 'Read the sheet. Agree to it.',
      hint: 'Gains $3.0B. Whatever is on it is cheaper than the alternative. Today.',
      outcome: {
        text:
          'It is three demands, none individually intolerable: a customs exemption, a seat on a regulatory board, and the quiet closure of a Hadeni-language cultural centre that Ostrene find "provocative".\n\nYou agree to all three in twenty minutes. The ambassador is warm for the rest of the meeting. Piek recovers so fast it is almost impressive.',
        tone: 'mixed',
        effects: {
          stats: { economy: +5, treasury: +3, legitimacy: -9, power: -6 },
          hidden: { foreign: -18, separatism: +12 },
          regime: { isolation: +11 },
          factions: { concord: { loyalty: +5 }, chorus: { loyalty: -9 }, provinces: { loyalty: -7 }, staff: { loyalty: -5 } },
          characters: { piek: { loyalty: +4 }, varkov: { trust: -5 } },
          news: ['HADENI CULTURAL CENTRE CLOSES; MINISTRY CITES "BUILDING ISSUES"'],
          schedule: [{ inDays: 6, visible: false, label: 'The border region hears about the cultural centre', effects: { hidden: { separatism: +10, unrest: +5 } } }],
        },
      },
    },
    {
      id: 'refuse',
      label: 'Read it. Refuse it. To his face.',
      hint: 'Free. Costs you the relationship and possibly the gas. Buys something money cannot.',
      outcome: {
        text:
          'You read all three, put the sheet down, and say no to each of them in order, by number.\n\nThe ambassador is silent for four full seconds. Then he thanks you for your time, takes the sheet back, and leaves without the coffee he did not accept.\n\nBy evening the story is everywhere — not from you — and by morning you are, briefly, the most popular head of state since 1961.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +14, support: +13, economy: -8, treasury: -3, military: +5 },
          hidden: { foreign: +22, separatism: -8, unrest: -6 },
          regime: { populism: +9, isolation: +7 },
          factions: { chorus: { loyalty: +10 }, staff: { loyalty: +9 }, provinces: { loyalty: +7 }, concord: { loyalty: -9 } },
          characters: { varkov: { loyalty: +8, trust: +7 }, piek: { fear: +11 }, adamek: { loyalty: -6 } },
          news: ['"NO. NO. AND NO." — THE FOUR SECONDS OF SILENCE'],
          schedule: [{ inDays: 4, visible: true, label: 'Ostrene review their lithium purchases', effects: { stats: { economy: -5, treasury: -4 }, hidden: { fiscal: +7, foreign: +5 } } }],
        },
      },
    },
    {
      id: 'stall',
      label: 'Take the sheet. Promise an answer in a week.',
      hint: 'Free. Buys a week. He did not come here for a week.',
      outcome: {
        text:
          '"A week," he repeats, and writes it in his own diary in front of you, which you recognise as a technique because Varkov does the same thing.\n\nOn the fourth day, Drovnan border units run an unannounced exercise eleven kilometres from the Hadem region. Nobody connects the two events publicly. Everybody connects them.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: +2, security: -3 },
          hidden: { foreign: +8, separatism: +7 },
          factions: { staff: { patience: -5 } },
          characters: { piek: { trust: -3 } },
          schedule: [
            { inDays: 4, visible: true, label: 'The week the ambassador wrote down', cardId: 'alert-ultimatum' },
            { inDays: 2, visible: false, label: 'Drovnan border exercise', effects: { hidden: { separatism: +6 }, stats: { stability: -4 } } },
          ],
        },
      },
    },
  ],
},

{
  id: 'alert-minister-gone',
  once: true,
  title: 'A MINISTER IS MISSING',
  driver: 'fear',
  severity: 2,
  base: 0,
  minDay: 4,
  weight: (s) => Math.max(0, s.hidden.fear - 30) * 1.1 + s.hidden.scandal * 0.3,
  body:
    'Orlan Piek did not arrive at the ministry this morning. His car is at his house. His protection detail was stood down last night on his own written instruction, which they have produced, and which is in his handwriting.\n\nHis passport is not in the drawer his housekeeper says he keeps it in.\n\nThe Sable Office has not offered an opinion. Director Sarran is waiting outside to be asked.',
  flavor: 'Eleven identical navy suits. Ten of them are still in the wardrobe.',
  options: [
    {
      id: 'ask-sarran',
      label: 'Ask Sarran what she knows.',
      hint: 'Free. She will tell you something true. It may not be everything.',
      outcome: (s, rng) =>
        rng.chance(0.5 + s.characters.sarran.loyalty / 200)
          ? {
              text:
                '"He is in Aureth," she says. "He landed at six. He has been talking to their people for two years and last week he started asking about the Krast file, at which point he became frightened of the wrong thing and ran."\n\nA pause. "He took documents. Not many. Enough."',
              tone: 'mixed',
              effects: {
                stats: { information: +9, legitimacy: -6, security: +3 },
                hidden: { leak: +14, scandal: +11, foreign: +7 },
                factions: { sable: { loyalty: +6 }, grey: { patience: -4 } },
                characters: { sarran: { loyalty: +6, trust: +8 }, piek: { loyalty: -40 } },
                removeFromPost: [{ who: 'piek', reason: 'defected to the Aureth Union', exiled: true }],
                flags: { piekDefected: 1 },
                news: ['FOREIGN MINISTER "ON PERSONAL LEAVE", SAYS MINISTRY'],
                schedule: [{ inDays: 4, visible: true, label: 'Piek\'s documents surface abroad', effects: { hidden: { leak: +12, scandal: +10 }, stats: { legitimacy: -6 } } }],
              },
            }
          : {
              text:
                '"I am looking into it, {sir}." She says it in a tone that closes the subject, and as she leaves you realise she arrived already knowing, and has decided that today is not the day you find out.',
              tone: 'bad',
              effects: {
                stats: { information: -6, power: -5 },
                hidden: { fear: +8, leak: +8 },
                factions: { sable: { influence: +6 } },
                characters: { sarran: { influence: +7, trust: -6 } },
                removeFromPost: [{ who: 'piek', reason: 'whereabouts unknown', exiled: true }],
                schedule: [{ inDays: 3, visible: true, label: 'Wherever Piek went, he has arrived', cardId: 'alert-minister-gone' }],
              },
            },
    },
    {
      id: 'announce',
      label: 'Get ahead of it. Announce that he has resigned.',
      hint: 'Free. Controls the story for about a day. He is somewhere, and he has a phone.',
      outcome: {
        text:
          'The resignation is announced at noon: warm, gracious, citing health.\n\nAt six he gives an interview from a hotel in Aureth in which he looks extremely healthy and uses the phrase "I was afraid" four times.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -11, support: -6, information: -4 },
          hidden: { scandal: +16, leak: +12, fear: +6 },
          factions: { chorus: { loyalty: -7 }, grey: { loyalty: -5 } },
          characters: { piek: { loyalty: -35 } },
          removeFromPost: [{ who: 'piek', reason: 'resigned, allegedly for health reasons', exiled: true }],
          flags: { liesTold: 1 },
          scandal: { name: 'The health resignation', detail: 'A foreign minister who resigned for health reasons and then appeared on television looking extremely well.', heat: 45 },
          news: ['PIEK RESIGNS CITING HEALTH', '"I WAS AFRAID" — PIEK, FROM A HOTEL ABROAD'],
        },
      },
    },
    {
      id: 'quiet',
      label: 'Say nothing. Have the Office bring him back.',
      hint: 'Free. If it works, nothing happened. If it does not, everything happened.',
      enabled: (s) => s.factions.sable.loyalty > 45,
      lockedText: 'The Office would decline that instruction, politely, in writing.',
      outcome: (s, rng) =>
        rng.chance(0.35 + s.stats.security / 250)
          ? {
              text:
                'He is back in the capital within thirty hours and at his desk by Thursday: thinner, in one of the ten remaining suits, saying nothing about any of it.\n\nNobody outside eleven people ever learns this happened. Those eleven people now know exactly what the Office can do, and all of them are in your cabinet.',
              tone: 'mixed',
              effects: {
                stats: { power: +7, security: +6, information: +4, legitimacy: -3 },
                hidden: { fear: +22, leak: -8 },
                regime: { repression: +18, personalism: +7 },
                factions: { sable: { loyalty: +9, influence: +8 }, grey: { loyalty: -6 } },
                characters: { sarran: { loyalty: +8, influence: +9 }, piek: { loyalty: -10, fear: +45, trust: -20 }, doran: { fear: +14 }, brask: { fear: +10 } },
                news: ['FOREIGN MINISTER RETURNS FROM "BRIEF PERSONAL LEAVE"'],
              },
            }
          : {
              text:
                'The Office tries. Aureth, who have been waiting for exactly this for eleven years, intercept the attempt and lodge a formal protest with photographs.\n\nPiek is granted protection within a day and becomes, overnight, the most interviewed Velmorran alive.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -18, support: -8, power: -7, security: -5 },
                hidden: { foreign: +20, scandal: +24, leak: +16 },
                regime: { repression: +12 },
                factions: { chorus: { loyalty: -12 }, sable: { loyalty: -4 }, grey: { loyalty: -8 } },
                characters: { piek: { loyalty: -45 }, sarran: { trust: -5 } },
                removeFromPost: [{ who: 'piek', reason: 'granted foreign protection', exiled: true }],
                scandal: { name: 'The Aureth protest', detail: 'An attempted abduction, photographed, formally protested, and now the most covered story on the continent.', heat: 70 },
                news: ['AURETH PROTEST "ATTEMPTED ABDUCTION" WITH PHOTOGRAPHS'],
              },
            },
    },
  ],
},

{
  id: 'alert-assassination',
  title: 'THE OFFICE HAS FOUND A PLOT',
  driver: 'coup',
  severity: 3,
  actor: 'sarran',
  base: 0,
  minDay: 5,
  weight: (s) => Math.max(0, s.hidden.coup - 40) * 0.9 + Math.max(0, s.hidden.fear - 45) * 0.5,
  body:
    'Sarran comes at eleven at night, which she has never done.\n\n"There is a plan. It is not a rumour and it is not bar talk. It involves the route between the residence and the ministries, it involves at least two people with access to your schedule, and it is for some time in the next fortnight."\n\nShe puts down one sheet. "Four names. Three of them are certainly involved. One of them is on the list because I want to see what you do."',
  flavor: 'One true thing and one useful thing. Tonight they are in the same envelope.',
  options: [
    {
      id: 'all-four',
      label: 'Arrest all four tonight.',
      hint: 'Free. Certain of the plot. Certain of arresting an innocent person.',
      outcome: {
        text:
          'All four are taken before dawn. Three of them were involved.\n\nThe fourth is a scheduling clerk with two children who has never done anything at all, and whose arrest is the thing the civil service will talk about quietly for the rest of your government.\n\nThe route is changed. The plot is over. Sarran never mentions the fourth name again, which is its own kind of comment.',
        tone: 'mixed',
        effects: {
          stats: { security: +12, power: +8, legitimacy: -9, information: +5 },
          hidden: { coup: -26, fear: +26, scandal: +9 },
          regime: { repression: +22, personalism: +9 },
          factions: { sable: { loyalty: +10, influence: +9 }, grey: { loyalty: -12, patience: -10 }, chorus: { loyalty: -8 }, staff: { loyalty: -5 } },
          characters: { sarran: { loyalty: +8, influence: +9 }, grebs: { loyalty: -9, fear: +12 }, doran: { fear: +12 } },
          flags: { peopleJailed: 4 },
          scandal: { name: 'The fourth name', detail: 'A scheduling clerk with two children, arrested at dawn alongside three people who were actually plotting.', heat: 40 },
        },
      },
    },
    {
      id: 'three',
      label: 'Arrest three. Leave the fourth.',
      hint: 'Free. You are guessing which name she added. You are probably right.',
      outcome: (s, rng) =>
        rng.chance(0.6 + s.stats.information / 300)
          ? {
              text:
                'You name the three. Sarran\'s expression does not change, which from Sarran is applause.\n\nThey are taken at four. The plot dies with them. The scheduling clerk goes to work on Monday and never learns her name was on a piece of paper in your hand.',
              tone: 'good',
              effects: {
                stats: { security: +11, power: +6, information: +8, legitimacy: +2 },
                hidden: { coup: -24, fear: +14 },
                regime: { repression: +12 },
                factions: { sable: { loyalty: +9 }, grey: { loyalty: +3 } },
                characters: { sarran: { loyalty: +9, trust: +10 } },
                flags: { peopleJailed: 3 },
                remember: [{ who: 'sarran', text: 'You picked the right three off her list.', weight: 3 }],
              },
            }
          : {
              text:
                'You name three. One of them is the clerk.\n\nThe two you did take were involved. The one you missed was the one with access to your schedule, and he is out of the country within nine hours — which, Sarran observes with no emphasis at all, means he was warned.',
              tone: 'bad',
              effects: {
                stats: { security: +3, power: -4, legitimacy: -5 },
                hidden: { coup: +9, fear: +12, leak: +6 },
                factions: { sable: { loyalty: +3 }, grey: { loyalty: -6 } },
                characters: { sarran: { trust: -4 } },
                flags: { peopleJailed: 3 },
                schedule: [{ inDays: 5, visible: true, label: 'The one who was warned', effects: { hidden: { coup: +10 } } }],
              },
            },
    },
    {
      id: 'route',
      label: 'Arrest nobody. Change the route and watch them.',
      hint: 'Free. Nobody innocent is taken. The plot is still out there and now it knows to be careful.',
      outcome: {
        text:
          '"Watch them," you say. Sarran considers this and says: "That is the harder option and I want you to know that I know it."\n\nThe route changes. Two of the three go quiet immediately, which means somebody in the Office talks. The third does not go quiet, and over the following week the Office learns a great deal from him.',
        tone: 'mixed',
        effects: {
          stats: { security: +7, information: +12, legitimacy: +6, power: -2 },
          hidden: { coup: -9, fear: +4, leak: +5 },
          regime: { technocracy: +8 },
          factions: { sable: { loyalty: +5 }, grey: { loyalty: +7 }, chorus: { loyalty: +3 } },
          characters: { sarran: { loyalty: +6, trust: +9 }, grebs: { loyalty: +6 } },
          remember: [{ who: 'sarran', text: 'You chose surveillance over arrests when you had four names.', weight: 2 }],
          schedule: [
            { inDays: 4, visible: true, label: 'What the Office learned from the third man', effects: { stats: { information: +6, security: +5 }, hidden: { coup: -10 } } },
            { inDays: 3, visible: false, label: 'Somebody in the Office talks', effects: { hidden: { leak: +7 } } },
          ],
        },
      },
    },
  ],
},

{
  id: 'alert-gorsk-accident',
  once: true,
  title: 'ROOF COLLAPSE AT THE NUMBER FOUR SHAFT',
  driver: 'unrest',
  severity: 2,
  faction: 'combine',
  base: 0,
  minDay: 3,
  weight: (s) => 6 + Math.max(0, 45 - s.stats.economy) * 0.3 + Math.max(0, 50 - s.factions.combine.loyalty) * 0.2,
  body:
    'A roof collapse at the Number Four shaft in Gorsk at 5:40am. Nineteen men underground. Eleven are out. Eight are not.\n\nThe shaft was flagged in a 2022 inspection report that recommended closing it. The report was not acted on. Somebody will find that report by about Thursday.\n\nHess is already on a train.',
  flavor: 'Eight men. Everything else today is a footnote to that.',
  options: [
    {
      id: 'go',
      label: 'Go to Gorsk now. Be there when they come up.',
      hint: 'Cancels everything else today. It is also, obviously, the right thing to do.',
      outcome: (_s, rng) => {
        const saved = rng.int(6) + 2;
        return {
          text: `You are at the pithead by two in the afternoon, in the rain, standing with families who do not want to talk to you and do not ask you to leave.\n\n${saved} of the eight come up alive at 11:10pm. You are there. Hess is there. Neither of you says anything to the other, and a photograph of the two of you not saying anything runs everywhere.\n\nThe 2022 report surfaces on Thursday, as it was always going to. But it surfaces about a man who went to the pithead.`,
          tone: 'mixed',
          effects: {
            stats: { support: +10, legitimacy: +9, stability: +2, economy: -3 },
            hidden: { unrest: -10, scandal: +6, cult: +5 },
            regime: { populism: +8 },
            factions: { combine: { loyalty: +12 }, provinces: { loyalty: +5 }, chorus: { loyalty: +6 }, concord: { loyalty: -3 } },
            characters: { hess: { loyalty: +11, trust: +9 } },
            news: [`${saved} OF EIGHT BROUGHT UP ALIVE AT GORSK`],
            schedule: [{ inDays: 3, visible: true, label: 'The 2022 inspection report surfaces', cardId: 'gorsk-report' }],
          },
        };
      },
    },
    {
      id: 'statement',
      label: 'Issue a statement. Send the minister. Stay in the capital.',
      hint: 'Correct on paper. In this country, who goes to the pithead is the whole story.',
      outcome: {
        text:
          'The statement is dignified and out within the hour, which is fast.\n\nHess is at the pithead by four. The 7pm news leads with Hess at the pithead. There is no footage of you anywhere in the bulletin, because there was nothing to film.',
        tone: 'bad',
        effects: {
          stats: { support: -9, legitimacy: -6 },
          hidden: { unrest: +11, scandal: +5 },
          factions: { combine: { loyalty: -11, patience: -9 }, provinces: { loyalty: -4 } },
          characters: { hess: { loyalty: -8, influence: +9 } },
          news: ['HESS AT THE PITHEAD'],
          schedule: [{ inDays: 3, visible: true, label: 'The 2022 inspection report surfaces', cardId: 'gorsk-report' }],
        },
      },
    },
    {
      id: 'pre-empt',
      label: 'Go, and publish the 2022 report yourself before anyone finds it.',
      hint: 'Free. Takes the blame in advance, for a report your government did not write.',
      outcome: {
        text:
          'You are at the pithead at two and the 2022 inspection report is on the government website at four, with a line saying it was not acted on and that this was a failure of the state.\n\nNobody in living memory has done this. The press does not know what to do with it. Hess, asked for comment at the pithead, says: "He published the report." That is the entire quote. It runs for a week.',
        tone: 'good',
        effects: {
          stats: { support: +12, legitimacy: +15, information: +7, economy: -3 },
          hidden: { unrest: -14, scandal: -8, corruption: -6 },
          regime: { reform: +15, populism: +6 },
          factions: { combine: { loyalty: +15 }, chorus: { loyalty: +12 }, grey: { loyalty: +6 }, concord: { loyalty: -5 } },
          characters: { hess: { loyalty: +13, trust: +12 }, vel: { trust: +9 }, grebs: { loyalty: +7 } },
          news: ['"HE PUBLISHED THE REPORT"'],
          schedule: [{ inDays: 4, visible: true, label: 'Every other unacted inspection report in the country', effects: { stats: { treasury: -4, legitimacy: +4 }, hidden: { corruption: -6 } } }],
        },
      },
    },
  ],
},

{
  id: 'alert-kostyn-speech',
  once: true,
  title: 'THE GOVERNOR HAS MADE A SPEECH',
  driver: 'separatism',
  severity: 2,
  actor: 'kostyn',
  faction: 'provinces',
  base: 0,
  minDay: 4,
  weight: (s) => Math.max(0, s.hidden.separatism - 28) * 1.2 + s.characters.kostyn.plotting * 0.35,
  body:
    'Governor Kostyn addressed the Kordiva Basin Council. It was not on any national schedule. Two regional stations carried it live and everybody else picked it up within the hour.\n\nShe did not attack you. She said, warmly, that "this country is at its best when the capital remembers it is one city out of six", and then listed — from memory, no notes — every road, hospital and school Kordiva has built without help.\n\nThe speech was nineteen minutes. She was applauded for four of them.',
  flavor: 'Four hundred kilometres of road. She never lets anyone forget it.',
  options: [
    {
      id: 'embrace',
      label: 'Praise the speech publicly. Put her on the Council of the Republic.',
      hint: 'Free. Brings her inside. Inside is where successors are made.',
      outcome: {
        text:
          'You call the speech "the best defence of this country anyone has given all year" and appoint her to the Council, and everybody understands that you have just made her the second most important person in Velmorra because you could not make her the least.\n\nShe is gracious. She sends honey. Numbered.',
        tone: 'mixed',
        effects: {
          stats: { stability: +7, support: +5, legitimacy: +5, power: -6 },
          hidden: { separatism: -16 },
          regime: { devolution: +12 },
          factions: { provinces: { loyalty: +13, patience: +10 }, grey: { loyalty: -3 } },
          characters: { kostyn: { loyalty: +9, influence: +14, plotting: -8 } },
          news: ['KOSTYN JOINS COUNCIL OF THE REPUBLIC'],
          schedule: [{ inDays: 7, visible: false, label: 'The second most important person in the country', effects: { characters: { kostyn: { influence: +8 } }, hidden: { separatism: +4 } } }],
        },
      },
    },
    {
      id: 'undercut',
      label: 'Fund four Kordiva projects directly, bypassing her office.',
      hint: 'Cost: $5.0B. Buys the mayors out from under her. She will know exactly what you did.',
      outcome: {
        text:
          'Four mayors receive money direct from the capital with no provincial middleman, which has not happened since 1979 and which every one of them accepts within a day.\n\nKostyn says nothing publicly. She sends no honey at all this time, which Doran — who notices these things — describes as "the loudest thing that has happened all week".',
        tone: 'mixed',
        effects: {
          stats: { treasury: -5, power: +7, support: +3 },
          hidden: { separatism: -8, corruption: +7 },
          regime: { patronage: +13 },
          factions: { provinces: { loyalty: -4, power: -7 } },
          characters: { kostyn: { loyalty: -9, influence: -6, plotting: +10 } },
          remember: [{ who: 'kostyn', text: 'You paid her mayors directly and cut her out.', weight: -3 }],
          schedule: [{ inDays: 6, visible: false, label: 'Kostyn sends no honey', effects: { characters: { kostyn: { plotting: +8 } }, hidden: { separatism: +6 } } }],
        },
      },
    },
    {
      id: 'ignore',
      label: 'Say nothing. It was a speech about roads.',
      hint: 'Free. Speeches about roads are how these things start.',
      outcome: {
        text:
          'Nothing happens for eleven days.\n\nOn the twelfth, the Kordiva Basin Council votes to set up a "regional development secretariat" with its own budget. That is a provincial government under a different name, and it passes unanimously.',
        tone: 'bad',
        effects: {
          stats: { power: -6, treasury: -2 },
          hidden: { separatism: +14 },
          regime: { devolution: +9 },
          factions: { provinces: { power: +11, influence: +6 } },
          characters: { kostyn: { influence: +11, plotting: +6 } },
          news: ['KORDIVA SETS UP "REGIONAL DEVELOPMENT SECRETARIAT"'],
        },
      },
    },
  ],
},

];

export const ALERT_MAP: Record<string, AlertDef> = Object.fromEntries(ALERTS.map((a) => [a.id, a]));

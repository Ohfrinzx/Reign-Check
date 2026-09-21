import type { CardDef } from '../types';

/**
 * Third tranche of standard cards. Same authoring rules as cards.ts —
 * written as part of building the run deck (§4.4, docs/DESIGN_V2.md),
 * whose own content quota folds this content-volume top-up in: roughly ~20
 * more standard cards so an 18-day run (down from 30 with the act
 * restructure, but still real content-volume known limitation #1) has
 * enough in the pool to draw from, including several the run deck's new
 * "add"/"remove" shop items target directly (see content/shop.ts).
 */
export const CARDS3: CardDef[] = [

{
  id: 'salt-communion-blessing',
  title: 'Vask Wants to Bless the Government',
  category: 'decision',
  actor: 'vask',
  faction: 'provinces',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 1,
  weight: (s) => 5 + (55 - s.factions.provinces.loyalty) * 0.1,
  body:
    'Vask wants to hold a public blessing for your government at the Salt Communion\'s main shrine, broadcast live.\n\n"I would want to reflect on it first," he says, which everyone in the room understands is how he says he will do it if you ask nicely.',
  flavor: 'A blessing costs nothing and means whatever both sides need it to mean.',
  options: [
    {
      id: 'ask',
      label: 'Ask him to do it.',
      hint: 'Free. The provinces read this as an endorsement. The capital reads it as medieval.',
      outcome: {
        text: 'He blesses you from the steps of the shrine in language vague enough to survive any government. Six mayors attend. Sarnica finds the whole thing faintly embarrassing.',
        tone: 'good',
        effects: {
          stats: { legitimacy: 3, support: 2 },
          factions: { provinces: { loyalty: 9 }, chorus: { loyalty: -3 } },
          characters: { vask: { loyalty: 6, trust: 4 } },
        },
      },
    },
    {
      id: 'decline',
      label: 'Decline. This is a secular government.',
      hint: 'Free. Vask is not offended. The provinces notice all the same.',
      outcome: {
        text: 'He says he understands completely, which is not the same as agreeing. The shrine holds the ceremony without you, and everyone in the Basin notices who was not there.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: 1 },
          factions: { provinces: { loyalty: -5 }, chorus: { loyalty: 2 } },
          characters: { vask: { trust: -3 } },
        },
      },
    },
    {
      id: 'private',
      label: 'Ask for a private blessing instead. No cameras.',
      hint: 'Free. You get the comfort without the theatre. Vask notices the difference.',
      outcome: {
        text: 'He obliges, alone, in a side chapel, and says one true thing about the job before you leave that you did not ask for and cannot unhear.',
        tone: 'neutral',
        effects: {
          stats: { legitimacy: 1, stability: 1 },
          factions: { provinces: { loyalty: 3 } },
          characters: { vask: { trust: 6 } },
          remember: [{ who: 'vask', text: 'Asked for something honest instead of something televised.', weight: 2 }],
        },
      },
    },
  ],
},

{
  id: 'port-crane-deal',
  title: 'Adamek Wants the Cranes',
  category: 'opportunity',
  actor: 'adamek',
  faction: 'concord',
  stages: ['government', 'politics'],
  base: 7,
  minDay: 1,
  weight: (s) => 6 + (s.hidden.fiscal - 30) * 0.08,
  body:
    'Ilvet Instruments wants a twenty-year lease on the Mavro container cranes, at a price that clears this year\'s budget gap in one signature.\n\n"Twenty years is a long time," Adamek says, and writes a number on a card. He does not say the rest of the sentence, which is that twenty years is also longer than your government is likely to last.',
  flavor: 'The cranes move 40% of everything the country trades.',
  options: [
    {
      id: 'sign',
      label: 'Sign it. The treasury needs this today.',
      hint: 'Gains $9.0B. The port belongs to Adamek for a generation.',
      outcome: {
        text: 'The money clears within the hour. Somewhere in the finance ministry, Brask writes the figure down and does not smile.',
        tone: 'mixed',
        effects: {
          stats: { treasury: 9, power: -3, legitimacy: -3 },
          hidden: { corruption: 10 },
          regime: { graft: 12, patronage: 6 },
          factions: { concord: { loyalty: 12, influence: 8 }, combine: { loyalty: -6 } },
          characters: { adamek: { loyalty: 9, influence: 7 }, brask: { trust: -3 } },
        },
      },
    },
    {
      id: 'shorter',
      label: 'Counter: five years, smaller payment, real review clause.',
      hint: 'Gains $3.0B. Less money now, and the port stays yours in five years.',
      outcome: {
        text: 'He takes it, mildly disappointed, which from Adamek counts as a compliment. Brask, for once, looks relieved.',
        tone: 'good',
        effects: {
          stats: { treasury: 3, legitimacy: 2 },
          hidden: { corruption: 3 },
          factions: { concord: { loyalty: 4 }, grey: { loyalty: 4 } },
          characters: { adamek: { loyalty: 2 }, brask: { trust: 4 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. The cranes are not for sale.',
      hint: 'Free. Adamek is patient. The budget gap is not.',
      outcome: {
        text: '"Understood," he says, folding the card away without ceremony. The gap in the budget does not fill itself while you wait for a better offer.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: 3, treasury: -2 },
          hidden: { fiscal: 3 },
          factions: { concord: { loyalty: -5, patience: -4 }, combine: { loyalty: 5 } },
          characters: { adamek: { trust: -4 } },
        },
      },
    },
  ],
},

{
  id: 'pigeon-federation-request',
  title: 'The Pigeon Federation Wants a Holiday',
  category: 'decision',
  faction: 'chorus',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 2,
  weight: () => 6,
  body:
    'Four hundred thousand members, and their letter is entirely serious: a national holiday for the long-distance race final, "in recognition of Velmorra\'s oldest continuous sporting tradition."\n\nDoran is trying not to laugh. Doran is also pointing out that four hundred thousand members is more people than either opposition party can turn out on a good day.',
  flavor: 'The Federation can put more people on the street than the opposition can.',
  options: [
    {
      id: 'grant',
      label: 'Grant the holiday. Half a day, generous timing.',
      hint: 'Costs $0.4B in lost output. Cheap, popular, and faintly ridiculous.',
      outcome: {
        text: 'The announcement leads the evening news, mostly as a human-interest piece, which is the safest kind of story you will get all month.',
        tone: 'good',
        effects: {
          stats: { treasury: -0.4, support: 4 },
          hidden: { unrest: -1.5 },
          factions: { chorus: { loyalty: 3 } },
        },
      },
    },
    {
      id: 'sponsor',
      label: 'No holiday, but sponsor the race itself.',
      hint: 'Costs $0.6B. Smaller gesture, no lost workday, still noticed.',
      outcome: {
        text: 'The Federation is satisfied enough. The banner over the finish line says your government\'s name in letters bigger than the winning pigeon\'s ring number.',
        tone: 'good',
        effects: {
          stats: { treasury: -0.6, support: 2, legitimacy: 1 },
          factions: { chorus: { loyalty: 2 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. There are real problems on this desk.',
      hint: 'Free. Correct, and nobody will thank you for being correct.',
      outcome: {
        text: 'The letter is filed. The Federation is not angry, exactly, but four hundred thousand people now have one small reason to remember you said no.',
        tone: 'neutral',
        effects: {
          hidden: { unrest: 1 },
          factions: { chorus: { loyalty: -2 } },
        },
      },
    },
  ],
},

{
  id: 'university-grant',
  title: 'The University Has Numbers You Would Rather It Didn\'t',
  category: 'scandal',
  faction: 'chorus',
  stages: ['politics', 'development'],
  base: 7,
  minDay: 2,
  weight: (s) => 6 + (50 - s.stats.information) * 0.1,
  body:
    'A Sarnica University economics department has finished a study on who actually benefits from the Ilvet Free Zone\'s tax exemptions. The answer is: not many people, and not the ones the exemptions were sold to parliament as helping.\n\nIt is not published yet. The department chair, an old acquaintance of Brask\'s, is offering you first sight of it — for a price, or a favour, or nothing at all, depending on how the conversation goes.',
  flavor: 'The university has brought down two governments so far.',
  options: [
    {
      id: 'fund',
      label: 'Fund the department generously. No conditions stated.',
      hint: 'Costs $2.5B. Everyone understands what is not being said.',
      outcome: {
        text: 'The grant is announced as basic research funding. The study is quietly delayed "for peer review" that never quite finishes.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -2.5, legitimacy: -2 },
          hidden: { corruption: 6, scandal: 4 },
          factions: { chorus: { loyalty: -3 } },
        },
      },
    },
    {
      id: 'letpublish',
      label: 'Let it publish. Get ahead of it in the briefing.',
      hint: 'Free. It costs you a bad week and buys you a government that does not fear its own universities.',
      outcome: {
        text: 'The study runs on the front page. You have already said, on record, that the Free Zone needs reform. It reads less like a scandal and more like a government that already knew.',
        tone: 'good',
        effects: {
          stats: { legitimacy: 5, information: 3 },
          hidden: { scandal: -3 },
          factions: { chorus: { loyalty: 6 }, concord: { loyalty: -6 } },
        },
      },
    },
    {
      id: 'ignore',
      label: 'Do nothing. Let it land where it lands.',
      hint: 'Free. Cheapest option. Also the least controlled.',
      outcome: {
        text: 'It publishes without warning, on a slow news day, which means it gets more attention than it would have otherwise.',
        tone: 'bad',
        effects: {
          hidden: { scandal: 8, leak: 3 },
          factions: { chorus: { loyalty: 2 }, concord: { loyalty: -3 } },
        },
      },
    },
  ],
},

{
  id: 'drovna-radio-jamming',
  title: 'Sarran Wants to Jam Drovna\'s Radio Station',
  category: 'foreign',
  actor: 'sarran',
  faction: 'sable',
  stages: ['government', 'afternoon'],
  base: 6,
  minDay: 2,
  weight: (s) => 5 + s.hidden.separatism * 0.09,
  body:
    'The Drovnan station broadcasting into the Hadem hills is half folk music and half encouragement to burn things, Sarran says, and the Sable Office has the equipment to make it noise for eleven hours a day.\n\n"It is not subtle," she admits. "Subtle has not worked."',
  flavor: 'Half folk music, half encouragement to burn things.',
  options: [
    {
      id: 'jam',
      label: 'Authorise it.',
      hint: 'Free. The signal goes quiet. So does the pretence that this is not a small, ongoing war.',
      outcome: {
        text: 'The station goes to static most evenings. Drovna\'s foreign ministry issues a formal protest that changes nothing, on either side.',
        tone: 'mixed',
        effects: {
          stats: { security: 4 },
          hidden: { separatism: -6, foreign: 5 },
          factions: { sable: { loyalty: 6 }, provinces: { loyalty: -2 } },
          characters: { sarran: { loyalty: 5, trust: 3 } },
        },
      },
    },
    {
      id: 'counter-station',
      label: 'Fund a Hadeni-language station of your own instead.',
      hint: 'Costs $2.0B. Slower, and it does not require admitting you are jamming a neighbour.',
      outcome: {
        text: 'It takes months to build an audience. It also means the Hadem hills hear, for the first time, a government voice in their own language.',
        tone: 'good',
        effects: {
          stats: { treasury: -2 },
          hidden: { separatism: -4 },
          factions: { provinces: { loyalty: 7 }, chorus: { loyalty: 2 } },
          characters: { sarran: { trust: -2 } },
        },
      },
    },
    {
      id: 'ignore',
      label: 'Leave it. It has been broadcasting for years.',
      hint: 'Free. Doing nothing is also a choice, and Sarran will remember whose it was.',
      outcome: {
        text: 'The station keeps broadcasting. So does the argument for why someone should finally do something about it.',
        tone: 'bad',
        effects: {
          hidden: { separatism: 3 },
          characters: { sarran: { trust: -3 } },
        },
      },
    },
  ],
},

{
  id: 'gorsk-safety-inspection',
  title: 'A Mine Inspector Wants to Talk to You Directly',
  category: 'crisis',
  actor: 'hess',
  faction: 'combine',
  stages: ['government', 'politics'],
  base: 7,
  minDay: 2,
  weight: (s) => 6 + Math.max(0, 45 - s.factions.combine.loyalty) * 0.1,
  body:
    'The state inspector for the Gorsk lithium shafts has found a support-beam failure rate that should have closed two mines a year ago. He was told, twice, not to file the report.\n\nHess is not smiling. "You can fix this quietly," he says, "or you can fix it after it kills someone and everyone finds out you knew."',
  flavor: 'The miners are organised and they are patient. This would end that.',
  options: [
    {
      id: 'close',
      label: 'Close the two worst shafts and fund the repairs.',
      hint: 'Costs $4.0B. Expensive, and it is the only option nobody has to lie about later.',
      outcome: {
        text: 'Production drops for six weeks. Nobody dies. Hess tells the story at every union hall in Gorsk for the rest of the year.',
        tone: 'good',
        effects: {
          stats: { treasury: -4, economy: -3, legitimacy: 4 },
          factions: { combine: { loyalty: 14 } },
          characters: { hess: { loyalty: 10, trust: 8 } },
        },
      },
    },
    {
      id: 'quiet-fix',
      label: 'Fund repairs quietly. Keep the report unfiled.',
      hint: 'Costs $2.0B. Cheaper, and it depends on nothing going wrong before it is finished.',
      outcome: {
        text: 'The beams get replaced without a headline. It works, this time, and everyone involved knows exactly how close "this time" was.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -2 },
          hidden: { corruption: 4, scandal: 3 },
          factions: { combine: { loyalty: 4 } },
          characters: { hess: { trust: 2 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'The budget cannot take this right now. Delay it.',
      hint: 'Free today. Whatever happens in Gorsk is on this decision, not the inspector\'s.',
      outcome: {
        text: 'The report stays in a drawer. The shafts stay open. Hess writes down the date, which is not a good sign.',
        tone: 'bad',
        effects: {
          hidden: { unrest: 5, scandal: 2 },
          factions: { combine: { loyalty: -12, patience: -10 } },
          characters: { hess: { loyalty: -10, trust: -8 } },
          schedule: [{ inDays: 5, visible: true, label: 'A support beam fails in Gorsk', effects: { hidden: { unrest: 10, scandal: 12 }, stats: { legitimacy: -6 } } }],
        },
      },
    },
  ],
},

{
  id: 'central-bank-pressure',
  title: 'Brask Wants the Rate Cut. The Governor Does Not.',
  category: 'economy',
  actor: 'brask',
  faction: 'grey',
  stages: ['government'],
  base: 6,
  minDay: 3,
  weight: (s) => 5 + Math.max(0, 40 - s.stats.economy) * 0.1,
  body:
    '"The Central Bank is independent in law," Brask says, "and located inside my ministry in practice. The governor is refusing to cut rates before the growth numbers improve. I can lean on her, or I can let her be right."',
  flavor: 'Independent in law, located inside the Finance Ministry in practice.',
  options: [
    {
      id: 'lean',
      label: 'Lean on her. Cut the rate this quarter.',
      hint: 'Free today. Growth gets a push. Everyone who lends you money notices the bank answers to you.',
      outcome: {
        text: 'The rate drops. The economy ticks up within the month. The Aureth Union\'s next call opens with a question about central bank independence that Piek has no good answer to.',
        tone: 'mixed',
        effects: {
          stats: { economy: 5, treasury: -1 },
          hidden: { foreign: 4, fiscal: 2 },
          regime: { technocracy: -6, personalism: 6 },
          characters: { brask: { loyalty: 3 } },
        },
      },
    },
    {
      id: 'leave',
      label: 'Leave her alone. Let the bank do its job.',
      hint: 'Free. Slower growth, and a currency nobody has reason to doubt.',
      outcome: {
        text: 'She holds the rate. Growth stays flat for another quarter. Every lender you talk to mentions, unprompted, how much they like a government that does not touch its own bank.',
        tone: 'good',
        effects: {
          stats: { legitimacy: 3 },
          hidden: { foreign: -3 },
          regime: { technocracy: 8 },
          characters: { brask: { trust: 3 } },
        },
      },
    },
  ],
},

{
  id: 'customs-bribery-video',
  title: 'A Video From the Mavro Customs Shed',
  category: 'scandal',
  faction: 'grey',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 3,
  weight: (s) => 5 + s.hidden.corruption * 0.08,
  body:
    'Nine minutes of a customs officer counting cash into a shipping manifest, filmed on someone\'s phone through a warehouse window. It has already been shared four thousand times.\n\nNobody senior is in it. That will not stop people asking how far up the practice goes.',
  flavor: 'Corrupt in ways that have been studied academically.',
  options: [
    {
      id: 'investigate',
      label: 'Order a real investigation, publicly.',
      hint: 'Free. Slower, and it is the only version of this where you come out ahead.',
      outcome: {
        text: 'Three officers are suspended within the week. The Aureth Union\'s next report notes, almost warmly, "visible institutional response."',
        tone: 'good',
        effects: {
          stats: { legitimacy: 4, information: 2 },
          hidden: { corruption: -6, scandal: -4 },
          factions: { grey: { loyalty: 3 }, chorus: { loyalty: 3 } },
        },
      },
    },
    {
      id: 'quiet',
      label: 'Handle it quietly. Reassign, don\'t publicise.',
      hint: 'Free. Cheaper on the surface. The video is still out there.',
      outcome: {
        text: 'The officer is moved to a desk job in another province. The video keeps circulating, now with a caption asking why nothing happened.',
        tone: 'bad',
        effects: {
          hidden: { scandal: 6, corruption: 2 },
          factions: { chorus: { loyalty: -4 } },
        },
      },
    },
    {
      id: 'dismiss',
      label: 'Dismiss it as one bad apple, nothing more.',
      hint: 'Free. Cheapest, and everyone in that warehouse knows it isn\'t true.',
      outcome: {
        text: 'The line plays badly. Two more videos surface within the fortnight, from two other warehouses.',
        tone: 'bad',
        effects: {
          hidden: { scandal: 10, corruption: 4 },
          stats: { legitimacy: -3 },
          factions: { chorus: { loyalty: -6 }, grey: { loyalty: -2 } },
        },
      },
    },
  ],
},

{
  id: 'kostyn-road-inspection',
  title: 'Kostyn Wants You to Walk the New Road',
  category: 'person',
  actor: 'kostyn',
  faction: 'provinces',
  stages: ['politics', 'development'],
  base: 6,
  minDay: 3,
  weight: (s) => 5 + (60 - s.characters.kostyn.loyalty) * 0.08,
  body:
    'She wants you to walk the last two kilometres of the new Kordiva road on foot, cameras following, and give a short speech at the end she has already drafted for you.\n\n"It is a good road," she says, handing you a jar of honey. The jars are numbered. She knows who kept theirs.',
  flavor: 'Extremely warm to you in public, which should worry you more than it does.',
  options: [
    {
      id: 'walk',
      label: 'Walk it. Give her speech, mostly unchanged.',
      hint: 'Free. The Basin gets its photo-op. Kostyn gets the credit she is owed.',
      outcome: {
        text: 'The footage is genuinely good. It is also, unmistakably, Kostyn\'s road, Kostyn\'s crowd, and Kostyn\'s afternoon.',
        tone: 'good',
        effects: {
          stats: { support: 3 },
          factions: { provinces: { loyalty: 10 } },
          characters: { kostyn: { loyalty: 8, influence: 3 } },
        },
      },
    },
    {
      id: 'walk-own-speech',
      label: 'Walk it, but give your own speech instead.',
      hint: 'Free. Smaller gesture to her, bigger one to yourself.',
      outcome: {
        text: 'She listens to every word of your version with a smile that does not reach the rest of her face. The footage plays fine. The relationship costs a little.',
        tone: 'mixed',
        effects: {
          stats: { support: 2, legitimacy: 1 },
          factions: { provinces: { loyalty: 4 } },
          characters: { kostyn: { loyalty: -2, trust: -3 } },
        },
      },
    },
    {
      id: 'decline',
      label: 'Send a minister instead. You have a full desk.',
      hint: 'Free. True, and it reads as exactly what it is.',
      outcome: {
        text: 'The minister does fine. Kostyn notices who did not come, and says so, warmly, to three different journalists.',
        tone: 'bad',
        effects: {
          factions: { provinces: { loyalty: -6, patience: -4 } },
          characters: { kostyn: { loyalty: -5 } },
        },
      },
    },
  ],
},

{
  id: 'aureth-defence-audit',
  title: 'Aureth Wants the Defence Budget Opened',
  category: 'foreign',
  actor: 'piek',
  faction: 'staff',
  stages: ['government', 'afternoon'],
  base: 6,
  minDay: 4,
  weight: (s) => 5 + Math.max(0, s.hidden.fiscal - 30) * 0.08,
  body:
    'The next tranche of Aureth financing comes with a new condition: an independent audit of defence spending, line by line, published.\n\nPiek delivered the letter with the particular stillness he uses when he already knows you will not like the answer he recommends.',
  flavor: 'A good rate, provided you agree to an audited defence budget.',
  options: [
    {
      id: 'accept',
      label: 'Accept the audit.',
      hint: 'Free. The loan clears. The General Staff will not forget who let strangers count their money.',
      outcome: {
        text: 'The audit finds what everyone suspected and nobody could prove. The loan clears on schedule. Varkov\'s office stops returning Piek\'s calls for a month.',
        tone: 'mixed',
        effects: {
          stats: { treasury: 6, legitimacy: 3 },
          hidden: { foreign: -5, corruption: -4 },
          factions: { staff: { loyalty: -10, patience: -8 } },
          characters: { piek: { trust: -3 } },
        },
      },
    },
    {
      id: 'partial',
      label: 'Offer a partial audit. Everything but procurement.',
      hint: 'Free. A compromise nobody is fully happy with, which usually means it is the right one.',
      outcome: {
        text: 'Aureth accepts it, unenthusiastically. The Staff accepts it, unenthusiastically. The loan clears at a slightly worse rate.',
        tone: 'neutral',
        effects: {
          stats: { treasury: 3 },
          hidden: { foreign: -1 },
          factions: { staff: { loyalty: -3 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. The army\'s books are not for sale.',
      hint: 'Free. The Staff is grateful. The loan is not coming.',
      outcome: {
        text: 'Piek relays the refusal without editorial comment, which is its own kind of comment. Aureth\'s tranche is quietly withdrawn from the table.',
        tone: 'mixed',
        effects: {
          hidden: { fiscal: 4 },
          factions: { staff: { loyalty: 8 } },
          characters: { piek: { trust: -2 } },
        },
      },
    },
  ],
},

{
  id: 'vel-debate-challenge',
  title: 'Vel Challenges You to a Live Debate',
  category: 'person',
  actor: 'vel',
  faction: 'chorus',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 4,
  weight: (s) => 5 + (60 - s.stats.legitimacy) * 0.08,
  body:
    'She live-streams her walk to work. Two hundred thousand people watch. Now she wants ninety minutes of live television, unscripted, no questions submitted in advance.\n\n"You can say no," Doran tells you. "It will just be the story instead of the debate."',
  flavor: 'The only politician in the country with no known price.',
  options: [
    {
      id: 'accept',
      label: 'Accept. Ninety minutes, no notes.',
      hint: 'Free. Real risk, real reward, and it is entirely your performance.',
      outcome: (s, rng) => {
        const good = s.stats.legitimacy + s.stats.information / 2 - 60 + rng.range(-15, 15);
        return good > 0
          ? {
              text: 'It goes better than expected. You answer the question she actually asks, twice, and the clip of that outlasts everything else from the night.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 6, support: 4, information: 3 },
                factions: { chorus: { loyalty: 6 } },
                characters: { vel: { trust: 4 } },
              },
            }
          : {
              text: 'She is better at this than you are, and everyone watching can tell. The clip that outlasts the night is not the one you wanted.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -6, support: -3 },
                factions: { chorus: { loyalty: 2 } },
                characters: { vel: { influence: 5 } },
              },
            };
      },
    },
    {
      id: 'counter',
      label: 'Counter-offer: a written exchange instead.',
      hint: 'Free. Lower risk, and it reads as exactly the caution it is.',
      outcome: {
        text: 'She accepts, publishes her half within the hour, and quotes yours back to you more precisely than you\'d have liked.',
        tone: 'neutral',
        effects: {
          stats: { information: 2 },
          factions: { chorus: { loyalty: 1 } },
          characters: { vel: { trust: 2 } },
        },
      },
    },
    {
      id: 'decline',
      label: 'Decline outright.',
      hint: 'Free. Doran was right about what happens next.',
      outcome: {
        text: 'The debate never happens. The story about you declining it runs for three days, which is longer than the debate would have.',
        tone: 'bad',
        effects: {
          stats: { legitimacy: -4 },
          factions: { chorus: { loyalty: -5 } },
          characters: { vel: { influence: 4 } },
        },
      },
    },
  ],
},

{
  id: 'sereth-stadium-offer',
  title: 'Sereth Wants the National Stadium',
  category: 'opportunity',
  faction: 'concord',
  stages: ['government', 'politics'],
  base: 6,
  minDay: 4,
  weight: () => 6,
  body:
    'A Sereth holding company will buy, rebuild and rename the national stadium for $7 billion. No conditions are stated. No questions are answered about where the money actually comes from.\n\n"The money arrives fast," Piek notes. "What they want in return arrives later."',
  flavor: 'Buys ports, stadiums and football clubs. Asks no questions and answers none.',
  options: [
    {
      id: 'sell',
      label: 'Sell it. The stadium has needed rebuilding for a decade.',
      hint: 'Gains $7.0B. The national team gets a new home. So does someone else\'s money.',
      outcome: {
        text: 'The deal closes fast, the way Sereth money always does. Construction starts within the month. Nobody asks the second question.',
        tone: 'mixed',
        effects: {
          stats: { treasury: 7, support: 3 },
          hidden: { corruption: 6, leak: 3 },
          factions: { concord: { loyalty: 5 } },
        },
      },
    },
    {
      id: 'conditions',
      label: 'Accept, but demand full ownership disclosure first.',
      hint: 'Gains $4.0B. Less money, and you actually know whose it is.',
      outcome: {
        text: 'Sereth accepts, at a discount, which tells you the disclosure was worth avoiding. The stadium still gets rebuilt.',
        tone: 'good',
        effects: {
          stats: { treasury: 4, support: 2, legitimacy: 2 },
          hidden: { corruption: 1 },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. No-questions-asked money is a question.',
      hint: 'Free. The stadium stays as it is.',
      outcome: {
        text: 'Sereth\'s people leave without a word of complaint, which is somehow the most unsettling part of the whole meeting.',
        tone: 'neutral',
        effects: {
          stats: { legitimacy: 2 },
        },
      },
    },
  ],
},

{
  id: 'garrison-anniversary',
  title: 'The Army Wants an Anniversary Parade',
  category: 'security',
  actor: 'tern',
  faction: 'staff',
  stages: ['politics', 'government'],
  base: 6,
  minDay: 4,
  weight: (s) => 5 + s.stats.military * 0.03,
  body:
    'Forty-seven years since the General Staff "stepped in to protect the reform" in 1979. Tern wants a full parade through the capital: tanks on the boulevard, the works.\n\nHe sends the request with a handwritten note, as he always does. This one is also a record of exactly how much he wants a yes.',
  flavor: 'Has been the final word on who governs since 1979.',
  options: [
    {
      id: 'full',
      label: 'Approve the full parade.',
      hint: 'Costs $1.5B. The army gets its day. The capital gets tanks on the boulevard.',
      outcome: {
        text: 'The parade is enormous and, for one afternoon, the country looks entirely unified. The footage plays well abroad and badly with anyone who remembers what 1979 actually was.',
        tone: 'mixed',
        effects: {
          stats: { treasury: -1.5, power: 4 },
          hidden: { fear: 4 },
          regime: { militarism: 12 },
          factions: { staff: { loyalty: 10 }, chorus: { loyalty: -5 } },
          characters: { tern: { loyalty: 8 } },
        },
      },
    },
    {
      id: 'scaled',
      label: 'A smaller ceremony. No tanks in the capital.',
      hint: 'Costs $0.4B. The army gets acknowledged, not indulged.',
      outcome: {
        text: 'It is respectful and forgettable, which for an anniversary of a coup is probably the correct register.',
        tone: 'neutral',
        effects: {
          stats: { treasury: -0.4 },
          factions: { staff: { loyalty: 3 } },
          characters: { tern: { loyalty: 1 } },
        },
      },
    },
    {
      id: 'skip',
      label: 'Skip it entirely this year.',
      hint: 'Free. Correct, and Tern will make sure the General Staff knows it was your call.',
      outcome: {
        text: 'The anniversary passes with a one-line statement from the ministry. Tern\'s next note is shorter than usual, and considerably less friendly.',
        tone: 'bad',
        effects: {
          factions: { staff: { loyalty: -8, patience: -6 } },
          characters: { tern: { loyalty: -6, plotting: 4 } },
        },
      },
    },
  ],
},

{
  id: 'doran-schedule-fight',
  title: 'Doran Wants Someone Cut Out of Your Calendar',
  category: 'person',
  actor: 'doran',
  stages: ['government', 'politics'],
  base: 6,
  minDay: 3,
  weight: (s) => 5 + Math.max(0, 60 - s.characters.doran.loyalty) * 0.08,
  body:
    '"I keep a running total of what you owe me," she says, not for the first time, "and right now what I want is for Piek to stop getting fifteen unscheduled minutes with you every week."\n\nShe is not wrong that it is unscheduled. She is not saying, out loud, that she thinks he is using it to leak.',
  flavor: 'Runs your diary, your building, and your problems.',
  options: [
    {
      id: 'cut',
      label: 'Cut the access. Doran manages the diary from now on.',
      hint: 'Free. She gets what she asked for. Piek notices immediately.',
      outcome: {
        text: 'Doran\'s grip on the building tightens by exactly one door. Piek is polite about it in a way that means he is furious.',
        tone: 'mixed',
        effects: {
          characters: { doran: { loyalty: 8, influence: 5 }, piek: { loyalty: -6, trust: -4 } },
          hidden: { leak: -3 },
        },
      },
    },
    {
      id: 'ask',
      label: 'Ask Piek directly what the meetings are about.',
      hint: 'Free. The honest move, and it puts both of them on notice.',
      outcome: {
        text: 'He gives you an answer that is technically true and tells you nothing. Doran watches the whole exchange and files it away.',
        tone: 'neutral',
        effects: {
          characters: { piek: { trust: -2 }, doran: { trust: 2 } },
          hidden: { leak: -1 },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Leave it as it is. Piek keeps his access.',
      hint: 'Free. Doran does not forget being told no.',
      outcome: {
        text: '"Understood," Doran says, in the tone that means it very much is not.',
        tone: 'bad',
        effects: {
          characters: { doran: { loyalty: -6, trust: -4 } },
        },
      },
    },
  ],
},

{
  id: 'ilvet-casino-license',
  title: 'A Casino License for the Free Zone',
  category: 'economy',
  actor: 'adamek',
  faction: 'concord',
  stages: ['government', 'development'],
  base: 6,
  minDay: 5,
  weight: (s) => 5 + Math.max(0, s.stats.treasury) * 0 + s.hidden.fiscal * 0.06,
  body:
    'Ilvet Instruments wants the Free Zone\'s first casino license. Adamek says it will draw the kind of tourist spending the port fees never touch. Grebs says it will draw the kind of scrutiny the Free Zone has spent thirty years avoiding.\n\nThey are both right.',
  flavor: 'Eleven square kilometres of banks, shell companies and casinos.',
  options: [
    {
      id: 'grant',
      label: 'Grant the license.',
      hint: 'Gains $5.0B. The Free Zone gets louder, and so does everyone watching it.',
      outcome: {
        text: 'The license is announced with the kind of fanfare Adamek is good at generating. The Aureth Union\'s next communiqué uses the word "opacity" twice.',
        tone: 'mixed',
        effects: {
          stats: { treasury: 5, economy: 3 },
          hidden: { corruption: 8, foreign: 4 },
          factions: { concord: { loyalty: 8 }, grey: { loyalty: -4 } },
          characters: { adamek: { loyalty: 6 }, grebs: { trust: -4 } },
        },
      },
    },
    {
      id: 'conditions',
      label: 'Grant it, with real ownership disclosure attached.',
      hint: 'Gains $2.5B. Less money, and Grebs signs off on it too.',
      outcome: {
        text: 'Adamek accepts, unhappily, and the license goes through with his name actually on the paperwork for once.',
        tone: 'good',
        effects: {
          stats: { treasury: 2.5 },
          hidden: { corruption: 1 },
          factions: { grey: { loyalty: 5 } },
          characters: { grebs: { trust: 5 }, adamek: { loyalty: -2 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. The Zone does not need another way to hide money.',
      hint: 'Free. Grebs is pleased. Adamek is not.',
      outcome: {
        text: 'The application is declined, formally, and Grebs personally files the paperwork so it cannot quietly reappear later.',
        tone: 'good',
        effects: {
          stats: { legitimacy: 2 },
          factions: { grey: { loyalty: 6 }, concord: { loyalty: -6 } },
          characters: { adamek: { loyalty: -5 } },
        },
      },
    },
  ],
},

{
  id: 'dovra-day-weather',
  title: 'Dovra Day, and the Weather Is Bad',
  category: 'decision',
  once: true,
  stages: ['afternoon'],
  base: 6,
  minDay: 5,
  weight: () => 6,
  body:
    'By tradition the head of state walks the last kilometre of the Dovra Day parade on foot, in whatever weather there is. Today there is a genuinely unpleasant amount of rain, and the widespread belief that the weather reflects how honest the government is has not gotten any less widespread since the 1980s.',
  flavor: 'Meteorologists gave up arguing about this belief in the 1980s.',
  options: [
    {
      id: 'walk',
      label: 'Walk it anyway.',
      hint: 'Free. You get soaked. The photograph is worth more than the dry version would have been.',
      outcome: {
        text: 'You walk the whole kilometre in the rain, and by evening the photograph is everywhere, captioned with exactly the sentiment you were hoping for.',
        tone: 'good',
        effects: {
          stats: { support: 5, legitimacy: 2 },
          hidden: { unrest: -2 },
        },
      },
    },
    {
      id: 'car',
      label: 'Take the car for this one stretch.',
      hint: 'Free. Dry, sensible, and exactly what the superstition says a dishonest government would do.',
      outcome: {
        text: 'Nobody says anything to your face. The jokes start by the time you are back at the residence.',
        tone: 'bad',
        effects: {
          stats: { support: -3 },
          hidden: { unrest: 1 },
        },
      },
    },
  ],
},

{
  id: 'brask-emergency-loan',
  title: 'Aureth Offers an Emergency Facility',
  category: 'economy',
  actor: 'brask',
  faction: 'grey',
  stages: ['government'],
  base: 6,
  minDay: 6,
  weight: (s) => 5 + Math.max(0, 25 - s.stats.treasury) * 0.2,
  body:
    'Brask lays the offer on the desk without editorial comment, which for Brask is itself a comment: $10 billion, available within the week, at a rate that only makes sense if you are already in real trouble.\n\n"We are not, yet," he says. "This is the offer for governments that are about to be."',
  flavor: 'Available within the week, at a rate that tells you what they think of you.',
  options: [
    {
      id: 'take',
      label: 'Take it. Better safe than short.',
      hint: 'Gains $10.0B. It also runs up a debt commitment you will feel every day from now on.',
      outcome: {
        text: 'The money lands. So does the daily bill for servicing it, which Brask has already added to the budget line before you finish reading the terms.',
        tone: 'mixed',
        effects: {
          stats: { treasury: 10 },
          hidden: { foreign: 3, fiscal: 2 },
          commitments: [{ id: 'cmt-aureth-emergency', label: 'Aureth emergency facility', perDay: 0.5 }],
          characters: { brask: { trust: 3 } },
        },
      },
    },
    {
      id: 'decline',
      label: 'Decline. The rate is an insult and you both know it.',
      hint: 'Free. Brask agrees with you, quietly, and files the offer away for later.',
      outcome: {
        text: '"Good," Brask says, which is as close to praise as he gets. The offer stays on file in case the answer changes.',
        tone: 'good',
        effects: {
          stats: { legitimacy: 1 },
          characters: { brask: { trust: 5 } },
        },
      },
    },
  ],
},

{
  id: 'chorus-street-mural',
  title: 'A Mural Appeared Overnight',
  category: 'scandal',
  faction: 'chorus',
  stages: ['politics', 'afternoon'],
  base: 6,
  minDay: 4,
  weight: (s) => 5 + s.hidden.unrest * 0.08,
  body:
    'Three storeys, on the side of a building two blocks from your office, finished before dawn: your face, unmistakable, above a caption too clever to be accidental. It is already the most photographed thing in the capital.',
  flavor: 'Sarnica brings down governments before it starts anything else.',
  options: [
    {
      id: 'remove',
      label: 'Have it painted over immediately.',
      hint: 'Costs $0.3B. It comes down by evening. The photographs of it do not.',
      outcome: {
        text: 'The wall is white again by dusk, and every photo of the removal crew is now also a photo of a government painting over a joke.',
        tone: 'bad',
        effects: {
          stats: { treasury: -0.3, legitimacy: -2 },
          hidden: { unrest: 2 },
          factions: { chorus: { loyalty: -3 } },
        },
      },
    },
    {
      id: 'ignore',
      label: 'Leave it. Say nothing.',
      hint: 'Free. It stops being news roughly as fast as anything does.',
      outcome: {
        text: 'It fades from the feeds within the week, replaced by whatever is next. The wall stays as it is.',
        tone: 'neutral',
        effects: {
          hidden: { unrest: -1 },
        },
      },
    },
    {
      id: 'joke',
      label: 'Make a joke about it in the briefing.',
      hint: 'Free. Risky. If it lands, it lands well.',
      outcome: (s, rng) =>
        rng.chance(0.55 + (s.stats.information - 50) * 0.004)
          ? {
              text: 'It lands. The clip of you laughing about your own mural outperforms the mural.',
              tone: 'good',
              effects: {
                stats: { support: 4, legitimacy: 2 },
                factions: { chorus: { loyalty: 4 } },
              },
            }
          : {
              text: 'It does not land. "Out of touch" is the phrase Channel Seven settles on by the evening broadcast.',
              tone: 'bad',
              effects: {
                stats: { support: -3 },
                factions: { chorus: { loyalty: -2 } },
              },
            },
    },
  ],
},

{
  id: 'grebs-retirement-list',
  title: 'Grebs Wants to Retire the Old Guard',
  category: 'decision',
  actor: 'grebs',
  faction: 'grey',
  stages: ['government'],
  base: 6,
  minDay: 5,
  weight: (s) => 5 + Math.max(0, s.hidden.corruption - 30) * 0.06,
  body:
    'A list of eleven senior officials, all appointed under the old government, all past retirement age, all still in post because nobody ever made them leave. "The ministries will run better without them," Grebs says. "They will also be considerably more yours."',
  flavor: 'Signs nothing she has not read.',
  options: [
    {
      id: 'retire',
      label: 'Retire all eleven.',
      hint: 'Free. The ministries move faster. Eleven networks of old loyalty go with them.',
      outcome: {
        text: 'The retirements go through in a single week. The civil service gets noticeably faster within a month, and noticeably more yours within a year.',
        tone: 'good',
        effects: {
          stats: { power: 4, information: 3 },
          hidden: { corruption: -6 },
          regime: { technocracy: 10, personalism: 4 },
          factions: { grey: { loyalty: 6, influence: 3 } },
          characters: { grebs: { loyalty: 9, trust: 6 } },
        },
      },
    },
    {
      id: 'half',
      label: 'Retire five. Keep the competent ones regardless of age.',
      hint: 'Free. A smaller, more defensible version of the same move.',
      outcome: {
        text: 'Grebs approves of the distinction, and says so, which she almost never does about anything.',
        tone: 'good',
        effects: {
          stats: { power: 2 },
          hidden: { corruption: -2 },
          factions: { grey: { loyalty: 3 } },
          characters: { grebs: { trust: 4 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Leave them in post. Stability has a value too.',
      hint: 'Free. Grebs disagrees, but signs nothing that says so.',
      outcome: {
        text: 'Nothing changes in the ministries this month, which is exactly the outcome eleven senior officials were hoping for.',
        tone: 'neutral',
        effects: {
          hidden: { corruption: 2 },
          characters: { grebs: { trust: -2 } },
        },
      },
    },
  ],
},

{
  id: 'hadem-language-law',
  title: 'Recognise Hadeni as an Official Language',
  category: 'policy',
  faction: 'provinces',
  stages: ['government', 'politics'],
  base: 6,
  minDay: 5,
  weight: (s) => 5 + s.hidden.separatism * 0.09,
  body:
    'A one-line law: Hadeni becomes an official language in the six border districts, on signage, in schools, in court. Promised by every government since 1897, delivered by none.\n\nDrovna\'s radio station will call it a trick either way. The question is only whether the Hadem hills believe them.',
  flavor: 'Promised by every government since 1897 and given by none.',
  options: [
    {
      id: 'pass',
      label: 'Pass the law.',
      hint: 'Costs $1.0B in translation and signage. The oldest promise in the country, actually kept.',
      outcome: {
        text: 'The law passes in a single session. In the Hadem hills, for once, a government promise arrives on the day it was made.',
        tone: 'good',
        effects: {
          stats: { treasury: -1, legitimacy: 4 },
          hidden: { separatism: -10, foreign: -2 },
          factions: { provinces: { loyalty: 12 } },
        },
      },
    },
    {
      id: 'delay',
      label: 'Announce it, but delay implementation a year.',
      hint: 'Free now. Cheaper today, and the hills have heard this exact promise before.',
      outcome: {
        text: 'The announcement gets a real response. The delay gets a quieter, more knowing one — this is not the first government to announce it.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: 1 },
          hidden: { separatism: -3 },
          factions: { provinces: { loyalty: 3, patience: -4 } },
        },
      },
    },
    {
      id: 'refuse',
      label: 'Refuse. It will look like a concession to Drovna.',
      hint: 'Free. It also looks, to the Hadem hills, exactly like every government before this one.',
      outcome: {
        text: 'The law is shelved. Drovna\'s radio station has one more true thing to say about you than it did yesterday.',
        tone: 'bad',
        effects: {
          hidden: { separatism: 6 },
          factions: { provinces: { loyalty: -6 } },
        },
      },
    },
  ],
},

];

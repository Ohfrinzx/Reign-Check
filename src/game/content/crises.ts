import type { CardDef, HiddenKey } from '../types';

/**
 * PHASE 3 STEP 3 — CRISIS CHAINS (content only; the rules that start and
 * advance a chain live in src/game/crises.ts).
 *
 * A crisis chain is a situation that plays out over about a week, in three
 * stages: it starts, it spreads, it comes to a head. Each stage is a card
 * queued into the day. Stages 2 and 3 each have two versions:
 *   - `calm`: you have handled it reasonably so far (score ≥ 0)
 *   - `hot`:  it has got worse (score < 0)
 *
 * How it goes is plain content: options add to `flags['crisis:<id>']` (+1
 * handled well, −1 made worse). An option can also end the chain early by
 * setting `flags['crisisEnd:<id>']`. Adding a chain needs no engine change.
 *
 * `pressure` and `startAt`: the chain can start once that hidden pressure
 * reaches `startAt` (measured so each chain turns up for the play styles
 * that feed it; coup pressure almost never rises, so there is no coup chain
 * until the balance pass looks at that).
 *
 * The `crisis-chain` tag switches CardView to its own "situation room"
 * layout (owner request: different card types should look different).
 */
export interface CrisisDef {
  id: string;
  name: string;
  /** one plain line for the front page while the chain is running */
  summary: string;
  pressure: HiddenKey;
  startAt: number;
  stage1: CardDef;
  stage2: { calm: CardDef; hot: CardDef };
  stage3: { calm: CardDef; hot: CardDef };
}

export const STAGE_NAMES = ['It starts', 'It spreads', 'It comes to a head'];

const never = () => 0;
const tags = (chain: string, stage: number) => ['crisis-chain', `chain:${chain}`, `stage:${stage}`];

export const CRISES: CrisisDef[] = [
  /* ================================================== THE BREAD RIOTS */
  {
    id: 'bread',
    name: 'The Bread Riots',
    summary: 'Bread prices are up and the queues are getting angry.',
    pressure: 'unrest',
    startAt: 45,
    stage1: {
      id: 'crisis-bread-1',
      title: 'Queues at the Bakeries',
      category: 'crisis',
      faction: 'chorus',
      tags: tags('bread', 1),
      base: 0,
      weight: never,
      once: true,
      body:
        'The price of flour rose 30% this month. Bread followed. This morning there were queues outside every bakery in Sarnica, and one bakery in the Ninth District had its window broken.\n\nNobody was hurt. Everybody noticed.',
      options: [
        {
          id: 'subsidise',
          label: 'Subsidise flour until the price comes down.',
          hint: 'Cost: $2.0B. The queues shrink fast. The treasury notices.',
          outcome: {
            text: 'The subsidy is announced at noon. By evening the bakeries have lowered their prices and the queues are shorter. The finance ministry sends you a very long memo.',
            tone: 'good',
            effects: {
              stats: { treasury: -2, support: 2 },
              hidden: { unrest: -5, fiscal: 3 },
              flags: { 'crisis:bread': 1 },
            },
          },
        },
        {
          id: 'police',
          label: 'Put police outside the bakeries.',
          hint: 'Free. The windows are safe. The queues now have police in them.',
          outcome: {
            text: 'Two officers stand outside every bakery. The windows survive. People queue for bread next to armed men, and they talk about it.',
            tone: 'mixed',
            effects: {
              stats: { security: 2, support: -2 },
              hidden: { unrest: 2, fear: 3 },
              flags: { 'crisis:bread': -1 },
            },
          },
        },
        {
          id: 'wait',
          label: 'Say the price rise is temporary.',
          hint: 'Free. It might be true. People will judge it by next week\'s bread.',
          outcome: {
            text: 'The statement is reasonable and nobody believes it. The queues are the same length the next morning.',
            tone: 'bad',
            effects: {
              hidden: { unrest: 4 },
              flags: { 'crisis:bread': -1 },
            },
          },
        },
      ],
    },
    stage2: {
      calm: {
        id: 'crisis-bread-2-calm',
        title: 'The Queues Are Shorter. The Anger Is Not.',
        category: 'crisis',
        actor: 'vel',
        faction: 'chorus',
        tags: tags('bread', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Bread is cheaper again, but people have not forgotten the week it wasn\'t. Sanna Vel has called a march on Saturday "for fair prices, for good".\n\nThe organisers say it will be peaceful. They say it in the tone of people who cannot promise that.',
        options: [
          {
            id: 'meet',
            label: 'Meet the organisers before Saturday.',
            hint: 'Free. It might take the heat out of the march. Vel gets a photo with you.',
            outcome: {
              text: 'The meeting runs two hours. You agree to a price review. The march goes ahead as a walk with banners and ends by six.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 2 },
                hidden: { unrest: -5 },
                characters: { vel: { influence: 4 } },
                flags: { 'crisis:bread': 1 },
              },
            },
          },
          {
            id: 'allow',
            label: 'Let the march happen. Say nothing.',
            hint: 'Free. It is legal. It will be big.',
            outcome: {
              text: 'Thirty thousand people walk past parliament. Nothing is broken. Vel speaks for twenty minutes, and she mentions you eleven times.',
              tone: 'mixed',
              effects: {
                stats: { support: -2 },
                hidden: { unrest: 1 },
              },
            },
          },
          {
            id: 'ban',
            label: 'Ban the march on public-order grounds.',
            hint: 'Free. There is no march. There is a crowd instead.',
            outcome: {
              text: 'The ban is announced. On Saturday, eight thousand people turn up anyway, without a route or stewards. It ends with tear gas.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -3 },
                hidden: { unrest: 5, fear: 3 },
                regime: { repression: 2 },
                flags: { 'crisis:bread': -2 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-bread-2-hot',
        title: 'A Bakery Burned in the Ninth District',
        category: 'crisis',
        faction: 'chorus',
        tags: tags('bread', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Last night a crowd broke into a flour depot in the Ninth District and set the bakery next door on fire. Nobody died. Two police officers are in hospital.\n\nThe riot spread to four streets before it burned out. Tonight it could be forty.',
        options: [
          {
            id: 'ration',
            label: 'Hand out free bread from army stores.',
            hint: 'Cost: $1.5B. Hungry people stop being angry people, for a while.',
            outcome: {
              text: 'Army trucks hand out bread in six districts. The soldiers are cheered, which Varkov notices. The streets are quiet that night.',
              tone: 'good',
              effects: {
                stats: { treasury: -1.5, support: 2 },
                hidden: { unrest: -6 },
                factions: { staff: { loyalty: 2 } },
                flags: { 'crisis:bread': 2 },
              },
            },
          },
          {
            id: 'curfew',
            label: 'Impose a curfew on the Ninth District.',
            hint: 'Free. The streets empty. The anger goes indoors.',
            outcome: {
              text: 'The curfew holds. The district is silent after eight. People talk behind closed doors, and what they say is not good for you.',
              tone: 'mixed',
              effects: {
                stats: { stability: 2, legitimacy: -3 },
                hidden: { unrest: -2, fear: 4 },
                regime: { repression: 2 },
              },
            },
          },
          {
            id: 'arrests',
            label: 'Arrest everyone on the depot footage.',
            hint: 'Free. It looks firm. The families of the arrested live in the same streets.',
            outcome: {
              text: 'Sixty-one people are arrested by morning. Forty of them are under twenty-five. Their mothers are outside the police station by nine.',
              tone: 'bad',
              effects: {
                stats: { security: 2, support: -3 },
                hidden: { unrest: 4, fear: 4 },
                flags: { 'crisis:bread': -1, peopleJailed: 61 },
              },
            },
          },
        ],
      },
    },
    stage3: {
      calm: {
        id: 'crisis-bread-3-calm',
        title: 'Fixing the Price of Bread for Good',
        category: 'crisis',
        faction: 'chorus',
        tags: tags('bread', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'The streets are calm. The price review is on your desk. It offers three ways to make sure this never happens again, and all three cost something.\n\nThis is the last decision on bread. Whatever you choose, the country will judge the whole week by it.',
        options: [
          {
            id: 'cap',
            label: 'Cap the price of bread by law.',
            hint: 'Cost: $0.3B a day for 6 days. Popular and permanent. Bakers and flour mills hate it.',
            outcome: {
              text: 'The price cap passes. Bread will cost the same next year as it does today. The mills complain loudly and keep milling. The bread riots are over.',
              tone: 'good',
              effects: {
                stats: { support: 4 },
                commitments: [{ label: 'Bread price cap', perDay: 0.3, days: 6 }],
                hidden: { unrest: -6 },
                factions: { chorus: { loyalty: 5 }, concord: { loyalty: -3 } },
                regime: { populism: 2 },
              },
            },
          },
          {
            id: 'reserve',
            label: 'Build a national flour reserve.',
            hint: 'Cost: $2.5B. Slower and less popular. It works next time too.',
            outcome: {
              text: 'Silos go up outside three cities. It is not exciting and nobody thanks you. The next time flour prices rise, the reserve will be there. The bread riots are over.',
              tone: 'good',
              effects: {
                stats: { treasury: -2.5, stability: 3 },
                hidden: { unrest: -4 },
                regime: { technocracy: 2 },
              },
            },
          },
          {
            id: 'market',
            label: 'Let the market settle it.',
            hint: 'Free. Prices will come down eventually. People will remember that you did nothing.',
            outcome: {
              text: 'Prices drift down over the next month. The crisis fades without an ending, which is how people will remember it.',
              tone: 'mixed',
              effects: {
                stats: { support: -2 },
                hidden: { unrest: 2 },
                factions: { concord: { loyalty: 3 } },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-bread-3-hot',
        title: 'The Square Is Full',
        category: 'crisis',
        actor: 'vel',
        faction: 'chorus',
        tags: tags('bread', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'Fifty thousand people are in Republic Square. It started with bread. It is not about bread any more. The signs say your name.\n\nSanna Vel is on the steps with a megaphone. The Sable Office says it can clear the square in two hours. The army has not said anything at all.',
        options: [
          {
            id: 'talk',
            label: 'Go out and speak to the square.',
            hint: 'Free. Very brave. It could end the crisis, or end you.',
            outcome: {
              text: 'You walk out alone. The crowd boos for three minutes, then listens for twenty. You promise a bread price cap and early elections to the city council. By midnight the square is half empty. The bread riots are over.',
              tone: 'good',
              effects: {
                stats: { support: 5, legitimacy: 4 },
                hidden: { unrest: -10 },
                commitments: [{ label: 'Bread price cap', perDay: 0.3, days: 6 }],
                regime: { populism: 3 },
              },
            },
          },
          {
            id: 'concede',
            label: 'Give Vel what she asks for: a price cap and a public inquiry.',
            hint: 'Cost: $0.3B a day for 6 days. The square goes home. Vel is now the most powerful person in it.',
            outcome: {
              text: 'Vel announces the deal from the steps. The crowd cheers her, not you. The square is empty by dawn. The bread riots are over, and everyone knows who ended them.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: -2 },
                hidden: { unrest: -8 },
                commitments: [{ label: 'Bread price cap', perDay: 0.3, days: 6 }],
                characters: { vel: { influence: 12 } },
                factions: { chorus: { loyalty: 4 } },
              },
            },
          },
          {
            id: 'clear',
            label: 'Order the Sable Office to clear the square.',
            hint: 'Free. It will work tonight. It will be on every screen in the world by morning.',
            outcome: {
              text: 'The square is clear by two in the morning. Nobody will say how many were hurt. The pictures are everywhere by breakfast. The riots stop. Something else starts.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -8, support: -6, security: 3 },
                hidden: { unrest: -4, fear: 10, foreign: 8 },
                factions: { chorus: { loyalty: -12 } },
                regime: { repression: 4 },
                flags: { protestsCrushed: 1 },
              },
            },
          },
        ],
      },
    },
  },

  /* ============================================= THE FREE ZONE LEDGER */
  {
    id: 'ledger',
    name: 'The Free Zone Ledger',
    summary: 'A ledger of bribes paid in the Ilvet Free Zone is in circulation.',
    pressure: 'corruption',
    startAt: 45,
    stage1: {
      id: 'crisis-ledger-1',
      title: 'A Ledger of Bribes Has Surfaced',
      category: 'scandal',
      actor: 'brask',
      faction: 'concord',
      tags: tags('ledger', 1),
      base: 0,
      weight: never,
      once: true,
      body:
        'Brask brings you a photocopy. It is two pages from a handwritten ledger kept by a Free Zone lawyer: dates, amounts, and initials. Some of the initials belong to your ministers.\n\nNobody knows how many pages there are. Brask thinks at least forty.',
      options: [
        {
          id: 'investigate',
          label: 'Order Brask to investigate quietly.',
          hint: 'Free. You find out what is in it before anyone else does. Or you try to.',
          outcome: {
            text: 'Brask starts pulling bank records. He is thorough, slow, and very unhappy about what he is finding.',
            tone: 'good',
            effects: {
              stats: { information: 3 },
              characters: { brask: { trust: 4 } },
              flags: { 'crisis:ledger': 1 },
            },
          },
        },
        {
          id: 'buy',
          label: 'Find the lawyer and buy the rest of the ledger.',
          hint: 'Cost: $1.5B. You get the pages. The lawyer learns what they are worth.',
          outcome: {
            text: 'Doran arranges it. The lawyer sells you thirty-eight pages. You are fairly sure there were forty.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -1.5 },
              hidden: { corruption: 3, scandal: -3 },
              regime: { graft: 2 },
            },
          },
        },
        {
          id: 'deny',
          label: 'Call it a forgery.',
          hint: 'Free. It buys a day. It is not a forgery.',
          outcome: {
            text: 'Your spokesman calls it "a crude forgery". Two newspapers ask him which parts. He does not know.',
            tone: 'bad',
            effects: {
              stats: { legitimacy: -2 },
              hidden: { scandal: 4 },
              flags: { 'crisis:ledger': -1, liesTold: 1 },
            },
          },
        },
      ],
    },
    stage2: {
      calm: {
        id: 'crisis-ledger-2-calm',
        title: 'Brask Found Three of Your Ministers',
        category: 'scandal',
        actor: 'brask',
        faction: 'concord',
        tags: tags('ledger', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Brask has matched the initials. Three ministers took money from Free Zone companies in the last two years: Transport, Energy and Health. The amounts add up to $60 million.\n\nThe press does not have this yet. It will.',
        options: [
          {
            id: 'sack',
            label: 'Sack all three before the press finds out.',
            hint: 'Free. You look decisive. Three ministries lose their ministers in one week.',
            outcome: {
              text: 'Three resignations "for family reasons" land on the same afternoon. The press works out why within a day. You come out of it looking like the one who cleaned house.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 4, power: -2 },
                hidden: { corruption: -6 },
                flags: { 'crisis:ledger': 1, ministersLost: 3 },
              },
            },
          },
          {
            id: 'quiet',
            label: 'Make them pay the money back, quietly.',
            hint: 'The treasury gains $0.1B. They keep their jobs and owe you everything.',
            outcome: {
              text: 'Three ministers repay $60 million between them, in cash, in one week. They are now very loyal and very frightened.',
              tone: 'mixed',
              effects: {
                stats: { treasury: 0.1, power: 2 },
                hidden: { corruption: 2, fear: 3 },
                regime: { patronage: 2 },
              },
            },
          },
          {
            id: 'publish',
            label: 'Publish Brask\'s findings yourself.',
            hint: 'Free. Radical honesty. Everyone else in the ledger now wants you gone.',
            outcome: {
              text: 'The report goes online at nine. By ten, every Free Zone firm has called a lawyer. The public loves it. The people who fund politics do not.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 6, elite: -6 },
                hidden: { corruption: -8 },
                factions: { concord: { loyalty: -8 } },
                regime: { reform: 3 },
                flags: { 'crisis:ledger': 1 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-ledger-2-hot',
        title: 'The Ledger Is on the Front Page',
        category: 'scandal',
        actor: 'loz',
        faction: 'concord',
        tags: tags('ledger', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Channel Seven had the ledger before you did. Tonight\'s 7pm news showed four pages on screen, with the initials circled in red. One of the circles is around a set of initials very close to your own.\n\nThey are not yours. Nobody watching knows that.',
        options: [
          {
            id: 'records',
            label: 'Publish your own bank records.',
            hint: 'Free. Proves you are clean. Invites everyone to ask about your ministers instead.',
            outcome: {
              text: 'Your records go online. They are boring, which is exactly the point. The questions move to your ministers, which is where they belong.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 3 },
                hidden: { scandal: -4 },
                flags: { 'crisis:ledger': 2 },
              },
            },
          },
          {
            id: 'loz',
            label: 'Call Loz and ask what it would take to drop the story.',
            hint: 'Cost: $2.0B. The story fades. Loz now has something on you.',
            outcome: {
              text: 'The next night the ledger is item seven, after the weather. Loz\'s channel gets a very large advertising contract.',
              tone: 'mixed',
              effects: {
                stats: { treasury: -2 },
                hidden: { scandal: -3, corruption: 4 },
                characters: { loz: { influence: 6 } },
                regime: { graft: 2 },
              },
            },
          },
          {
            id: 'sue',
            label: 'Sue Channel Seven for defamation.',
            hint: 'Free. Takes months. The story stays in the news the whole time.',
            outcome: {
              text: 'The lawsuit is front-page news for three days, which is three more days of the ledger on the front page.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -3 },
                hidden: { scandal: 5 },
                flags: { 'crisis:ledger': -1 },
              },
            },
          },
        ],
      },
    },
    stage3: {
      calm: {
        id: 'crisis-ledger-3-calm',
        title: 'Closing the Free Zone Loophole',
        category: 'policy',
        faction: 'concord',
        tags: tags('ledger', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'The ledger worked because Free Zone companies do not have to say who owns them. Brask has drafted a law that would make them. Adamek has asked for a meeting about it, which means he has read it.\n\nThis decides how the ledger affair ends.',
        options: [
          {
            id: 'pass',
            label: 'Pass the law as written.',
            hint: 'Free. Real reform. The Free Zone loses a lot of its customers overnight.',
            outcome: {
              text: 'The law passes. Eleven companies leave the Free Zone within a month. The ones that stay are, for the first time, known. The ledger affair is over.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 5, economy: -3 },
                hidden: { corruption: -10 },
                factions: { concord: { loyalty: -6 } },
                characters: { adamek: { loyalty: -6 } },
                regime: { reform: 3 },
              },
            },
          },
          {
            id: 'soft',
            label: 'Pass a softer version Adamek can live with.',
            hint: 'Free. Some reform. Adamek is grateful. The loophole gets smaller, not closed.',
            outcome: {
              text: 'The law passes with an exemption for "strategic investors". Adamek is a strategic investor. The ledger affair is over, mostly.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 2 },
                hidden: { corruption: -3 },
                characters: { adamek: { loyalty: 5 } },
              },
            },
          },
          {
            id: 'shelve',
            label: 'Shelve the law. The ministers are gone. That is enough.',
            hint: 'Free. Business is relieved. The next ledger is already being written.',
            outcome: {
              text: 'The draft goes into a drawer. The Free Zone has a good month. Somewhere, a lawyer opens a new notebook.',
              tone: 'mixed',
              effects: {
                hidden: { corruption: 3 },
                factions: { concord: { loyalty: 4 } },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-ledger-3-hot',
        title: 'Parliament Wants the Whole Ledger',
        category: 'scandal',
        faction: 'concord',
        tags: tags('ledger', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'Parliament has voted, 214 to 180, to demand the complete ledger — every page — by Friday. That has not happened since 1961.\n\nYou know what is in the pages. So do the people named in them, and several of them sit in parliament.',
        options: [
          {
            id: 'hand',
            label: 'Hand over every page.',
            hint: 'Free. The truth comes out, all of it. Some of it will hurt you.',
            outcome: {
              text: 'Parliament reads all forty pages in public over two days. Eleven politicians resign, four of them yours. You survive it, looking honest and weaker. The ledger affair is over.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 5, power: -5 },
                hidden: { corruption: -8, scandal: -4 },
                flags: { ministersLost: 4 },
                regime: { reform: 2 },
              },
            },
          },
          {
            id: 'edit',
            label: 'Hand over the pages with your people removed.',
            hint: 'Free. Your ministers are safe. If anyone finds the missing pages, you are not.',
            outcome: {
              text: 'Parliament gets thirty-one pages. Everyone in the building can count. The affair ends, officially. Unofficially, somebody is looking for page thirty-two.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -3 },
                hidden: { scandal: 8, leak: 5 },
                flags: { liesTold: 1 },
              },
            },
          },
          {
            id: 'refuse',
            label: 'Refuse. Invoke national security.',
            hint: 'Free. Legal, just about. It tells the country exactly what it suspected.',
            outcome: {
              text: 'You classify the ledger. Parliament cannot overrule you, and says so for four hours on live television. The ledger affair ends. Your reputation does not recover from it quickly.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -7, power: 3 },
                hidden: { scandal: 5, fear: 3 },
                regime: { repression: 2 },
              },
            },
          },
        ],
      },
    },
  },

  /* ============================================ THE KORDIVA REFERENDUM */
  {
    id: 'referendum',
    name: 'The Kordiva Referendum',
    summary: 'The Kordiva Basin is talking about a vote on running its own affairs.',
    pressure: 'separatism',
    startAt: 45,
    stage1: {
      id: 'crisis-referendum-1',
      title: 'Kordiva Wants a Vote on Autonomy',
      category: 'crisis',
      actor: 'kostyn',
      faction: 'provinces',
      tags: tags('referendum', 1),
      base: 0,
      weight: never,
      once: true,
      body:
        'The Kordiva Basin Council has voted to hold a referendum on "greater autonomy" in six weeks. It would let the Basin keep its own taxes and run its own police.\n\nGovernor Kostyn says it is "a conversation, not a divorce". She has printed the ballot papers already.',
      options: [
        {
          id: 'talks',
          label: 'Offer talks on more powers for all the regions.',
          hint: 'Free. It takes the Basin\'s idea and makes it everyone\'s. Kostyn loses her headline.',
          outcome: {
            text: 'You announce a national review of regional powers. Kostyn welcomes it through her teeth. The referendum is still scheduled, but it looks less urgent.',
            tone: 'good',
            effects: {
              stats: { legitimacy: 2 },
              hidden: { separatism: -4 },
              regime: { devolution: 2 },
              flags: { 'crisis:referendum': 1 },
            },
          },
        },
        {
          id: 'illegal',
          label: 'Declare the referendum illegal.',
          hint: 'Free. It is illegal. Declaring it makes it much more popular.',
          outcome: {
            text: 'The Supreme Court agrees with you in an afternoon. Kordiva\'s support for the referendum rises twelve points overnight.',
            tone: 'bad',
            effects: {
              stats: { power: 2 },
              hidden: { separatism: 5 },
              factions: { provinces: { loyalty: -5 } },
              flags: { 'crisis:referendum': -1 },
            },
          },
        },
        {
          id: 'money',
          label: 'Send the Basin a new development fund.',
          hint: 'Cost: $2.5B. Hard to vote to leave people who just sent you money.',
          outcome: {
            text: 'The fund is announced in Kordiva itself, with a big cheque and a small speech. The Basin takes the money. The referendum stays on the calendar.',
            tone: 'mixed',
            effects: {
              stats: { treasury: -2.5 },
              hidden: { separatism: -3 },
              factions: { provinces: { loyalty: 5 } },
            },
          },
        },
      ],
    },
    stage2: {
      calm: {
        id: 'crisis-referendum-2-calm',
        title: 'Kostyn Offers a Compromise',
        category: 'crisis',
        actor: 'kostyn',
        faction: 'provinces',
        tags: tags('referendum', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Kostyn wants to make a deal. She will postpone the referendum for a year if the Basin can keep 10% of its taxes and appoint its own police chief.\n\n"Half a divorce," says Doran. "Separate bedrooms."',
        options: [
          {
            id: 'accept',
            label: 'Accept her deal.',
            hint: 'Cost: $0.3B a day for 6 days in lost taxes. The referendum is off. Other regions will ask for the same.',
            outcome: {
              text: 'The deal is signed in Kordiva. The referendum is postponed. By the end of the week two other governors have asked for "the Kordiva arrangement".',
              tone: 'mixed',
              effects: {
                commitments: [{ label: 'Kordiva keeps 10% of its taxes', perDay: 0.3, days: 6 }],
                hidden: { separatism: -6 },
                factions: { provinces: { loyalty: 6 } },
                regime: { devolution: 3 },
                flags: { 'crisis:referendum': 1, 'crisisEnd:referendum': 1 },
              },
            },
          },
          {
            id: 'counter',
            label: 'Offer the police chief, but not the taxes.',
            hint: 'Free. Half of what she wants. She may take it, or go ahead with the vote.',
            outcome: {
              text: 'Kostyn takes a day to think, then says she will "consult the Basin". That means the vote is still on, but she wants it to go your way.',
              tone: 'mixed',
              effects: {
                hidden: { separatism: -2 },
                characters: { kostyn: { trust: 3 } },
              },
            },
          },
          {
            id: 'refuse',
            label: 'Refuse. The country is not negotiable.',
            hint: 'Free. Strong words. Kostyn goes back to Kordiva and prints more ballots.',
            outcome: {
              text: 'Kostyn thanks you for your clarity and leaves. The referendum campaign starts the next morning, with your quote on the posters.',
              tone: 'bad',
              effects: {
                hidden: { separatism: 5 },
                characters: { kostyn: { loyalty: -6 } },
                flags: { 'crisis:referendum': -1 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-referendum-2-hot',
        title: 'The Basin Police Took Down the National Flag',
        category: 'crisis',
        actor: 'kostyn',
        faction: 'provinces',
        tags: tags('referendum', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'This morning the Kordiva regional police took the national flag down from their headquarters and put up the Basin\'s own. A crowd of two thousand cheered.\n\nKostyn says she did not order it. She also has not ordered it put back.',
        options: [
          {
            id: 'call',
            label: 'Call Kostyn and ask her to put it back, personally.',
            hint: 'Free. Gives her a way out. She may not want one.',
            outcome: {
              text: 'Kostyn listens, then says "of course". The national flag goes back up that afternoon, next to the Basin\'s. Both of you can call that a win.',
              tone: 'good',
              effects: {
                hidden: { separatism: -3 },
                characters: { kostyn: { trust: 4 } },
                flags: { 'crisis:referendum': 2 },
              },
            },
          },
          {
            id: 'troops',
            label: 'Send national police to raise the flag again.',
            hint: 'Free. The flag goes back up. The pictures go around the world.',
            outcome: {
              text: 'National police raise the flag at noon, with riot shields. The crowd is ten thousand by evening. The Basin\'s paper runs the photo with no headline at all.',
              tone: 'bad',
              effects: {
                stats: { power: 2 },
                hidden: { separatism: 6, unrest: 4 },
                factions: { provinces: { loyalty: -8 } },
                regime: { repression: 2 },
                flags: { 'crisis:referendum': -1 },
              },
            },
          },
          {
            id: 'ignore',
            label: 'Ignore it. It is a flag.',
            hint: 'Free. You avoid a fight. Other buildings in the Basin copy it.',
            outcome: {
              text: 'By the weekend, fourteen town halls in the Basin fly only the Basin flag. Nobody takes them down.',
              tone: 'bad',
              effects: {
                hidden: { separatism: 5 },
                flags: { 'crisis:referendum': -1 },
              },
            },
          },
        ],
      },
    },
    stage3: {
      calm: {
        id: 'crisis-referendum-3-calm',
        title: 'The Referendum Is Tomorrow',
        category: 'crisis',
        actor: 'kostyn',
        faction: 'provinces',
        tags: tags('referendum', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'The vote is tomorrow. Polls say 46% for autonomy, 44% against, and a lot of people who have not decided. The campaign has been calm, mostly thanks to how the last two weeks went.\n\nThis is your last chance to shape the result.',
        options: [
          {
            id: 'visit',
            label: 'Go to Kordiva and campaign in person.',
            hint: 'Free. You could swing the undecided. If you lose anyway, you lose in person.',
            outcome: {
              text: 'You spend a day in the Basin shaking hands at markets. The next day, autonomy loses 48% to 52%. Kostyn concedes gracefully. The referendum crisis is over.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 4 },
                hidden: { separatism: -10 },
                factions: { provinces: { loyalty: 4 } },
              },
            },
          },
          {
            id: 'promise',
            label: 'Promise more powers if they vote no.',
            hint: 'Free today. The vote goes your way. The powers will be expected.',
            outcome: {
              text: 'The promise tips it. Autonomy loses 45% to 55%. The Basin will expect every word of that promise to come true. The referendum crisis is over.',
              tone: 'mixed',
              effects: {
                hidden: { separatism: -6 },
                promise: { text: 'Give the regions more powers', to: 'provinces', inDays: 6 },
                regime: { devolution: 2 },
              },
            },
          },
          {
            id: 'stay-out',
            label: 'Stay out of it. Let the Basin decide.',
            hint: 'Free. Respectful. You may not like the answer.',
            outcome: {
              text: 'Autonomy wins, 51% to 49%. The vote has no legal force, but the Basin now has a mandate and will use it. The referendum crisis is over. The Basin question is not.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 2 },
                hidden: { separatism: 6 },
                factions: { provinces: { loyalty: 3 } },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-referendum-3-hot',
        title: 'Kordiva Says It Will Vote Anyway',
        category: 'crisis',
        actor: 'kostyn',
        faction: 'provinces',
        tags: tags('referendum', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'The referendum is tomorrow, legal or not. Polling stations are open in 300 villages. The Basin police are guarding them. Polls say 61% for autonomy.\n\nWhatever you do tonight decides whether the Basin is still yours next week.',
        options: [
          {
            id: 'deal',
            label: 'Offer Kostyn the tax deal if she calls off the vote tonight.',
            hint: 'Cost: $0.4B a day for 6 days in lost taxes. The vote is off. The Basin keeps more of its money.',
            outcome: {
              text: 'Kostyn calls it off at eleven at night, on live radio, and calls it "a victory for the Basin". It is. The referendum crisis is over.',
              tone: 'mixed',
              effects: {
                commitments: [{ label: 'Kordiva keeps part of its taxes', perDay: 0.4, days: 6 }],
                hidden: { separatism: -6 },
                characters: { kostyn: { influence: 8 } },
                regime: { devolution: 3 },
              },
            },
          },
          {
            id: 'close',
            label: 'Send national police to close the polling stations.',
            hint: 'Free. There will be no vote. There will be pictures of police at ballot boxes.',
            outcome: {
              text: 'Police close 280 of the 300 stations. The other twenty vote. The pictures of police carrying ballot boxes are shown everywhere. The referendum crisis is over. The Basin will never forget it.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -8, power: 3 },
                hidden: { separatism: 10, unrest: 5, foreign: 5 },
                factions: { provinces: { loyalty: -12 } },
                regime: { repression: 3 },
              },
            },
          },
          {
            id: 'let',
            label: 'Let it happen. Say the result means nothing.',
            hint: 'Free. No violence. The Basin votes to go, and nothing stops it believing it.',
            outcome: {
              text: 'Autonomy wins with 64%. You say the result has no legal force. The Basin says it does. The referendum crisis is over. What comes after it is not.',
              tone: 'bad',
              effects: {
                hidden: { separatism: 12 },
                stats: { legitimacy: -2 },
              },
            },
          },
        ],
      },
    },
  },

  /* ============================================ THE OSTRENE GAS CUTOFF */
  {
    id: 'gas',
    name: 'The Ostrene Gas Cutoff',
    summary: 'Ostrene has cut the gas supply "for maintenance".',
    pressure: 'foreign',
    startAt: 45,
    stage1: {
      id: 'crisis-gas-1',
      title: 'Ostrene Cut the Gas by 40%',
      category: 'foreign',
      actor: 'piek',
      tags: tags('gas', 1),
      base: 0,
      weight: never,
      once: true,
      body:
        'At six this morning Ostrene cut gas deliveries to Velmorra by 40%, "for pipeline maintenance". Nobody believes in the maintenance. The weather service says the cold arrives in five days.\n\nPiek says the Ostrene ambassador is "unavailable". He has never been unavailable before.',
      options: [
        {
          id: 'ask',
          label: 'Ask Ostrene what they want.',
          hint: 'Free. Direct. They will tell you, and you will not like it.',
          outcome: {
            text: 'The ambassador becomes available within the hour. Ostrene wants the lithium contract renegotiated in its favour. At least now you know.',
            tone: 'mixed',
            effects: {
              stats: { information: 3 },
              flags: { 'crisis:gas': 1 },
            },
          },
        },
        {
          id: 'buy',
          label: 'Buy gas from Sereth at a higher price.',
          hint: 'Cost: $3.0B. The heating stays on. Ostrene sees you have options.',
          outcome: {
            text: 'Sereth sells, at a price that makes Brask sit down. The tankers start arriving in three days. Ostrene is surprised you moved so fast.',
            tone: 'good',
            effects: {
              stats: { treasury: -3 },
              hidden: { foreign: -3 },
              flags: { 'crisis:gas': 1 },
            },
          },
        },
        {
          id: 'protest',
          label: 'Protest in public. Call it blackmail.',
          hint: 'Free. Popular at home. Ostrene does not like being called names.',
          outcome: {
            text: 'Your speech is popular in Velmorra and read carefully in Ostrene. The next morning, the cut goes from 40% to 55%.',
            tone: 'bad',
            effects: {
              stats: { support: 2 },
              hidden: { foreign: 5 },
              flags: { 'crisis:gas': -1 },
            },
          },
        },
      ],
    },
    stage2: {
      calm: {
        id: 'crisis-gas-2-calm',
        title: 'Ostrene Names Its Price',
        category: 'foreign',
        actor: 'piek',
        tags: tags('gas', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Ostrene\'s offer arrives: full gas deliveries again, in exchange for lithium at 15% below market price for three years.\n\nBrask says it would cost the country about $1 billion a year. Piek says it would make Ostrene very happy. Both are right.',
        options: [
          {
            id: 'accept',
            label: 'Accept the lithium discount.',
            hint: 'Cost: $0.4B a day for 6 days. The gas comes back. Ostrene learns that this works.',
            outcome: {
              text: 'The deal is signed in a hotel in Sereth. The gas pressure rises that evening. Ostrene\'s ambassador is available again, at all hours.',
              tone: 'mixed',
              effects: {
                commitments: [{ label: 'Cheap lithium for Ostrene', perDay: 0.4, days: 6 }],
                hidden: { foreign: -8 },
                flags: { 'crisis:gas': 1, 'crisisEnd:gas': 1 },
              },
            },
          },
          {
            id: 'haggle',
            label: 'Counter at 5% below market, for one year.',
            hint: 'Free. They might take it. They might wait for the cold to do their negotiating.',
            outcome: {
              text: 'Ostrene says it will "consider the proposal". Meanwhile the cut stays at 40% and the forecast gets colder.',
              tone: 'mixed',
              effects: {
                hidden: { foreign: 2 },
              },
            },
          },
          {
            id: 'aureth',
            label: 'Ask the Aureth Union to lean on Ostrene.',
            hint: 'Free. The lenders have influence. They will want something back later.',
            outcome: {
              text: 'The Aureth Union makes two phone calls. Ostrene restores 20% of the supply "as maintenance progresses". The Union sends you a letter reminding you of its help.',
              tone: 'good',
              effects: {
                hidden: { foreign: -4, fiscal: 2 },
                flags: { 'crisis:gas': 1 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-gas-2-hot',
        title: 'The Cold Arrived and the Gas Did Not',
        category: 'crisis',
        tags: tags('gas', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'It is minus eight in Sarnica. Schools have closed to save heating. Two hospitals are running on backup generators. Ostrene has cut the gas to 55%.\n\nPeople are burning furniture in the Ninth District. The Ostrene embassy has put extra guards on its gates.',
        options: [
          {
            id: 'ration',
            label: 'Ration gas: homes and hospitals first, factories last.',
            hint: 'Free. People stay warm. The factories stop, and so do their wages.',
            outcome: {
              text: 'The factories go cold. The homes stay warm. The economy takes a hard week, but nobody freezes.',
              tone: 'mixed',
              effects: {
                stats: { economy: -5, support: 2 },
                hidden: { unrest: -2 },
                flags: { 'crisis:gas': 1 },
              },
            },
          },
          {
            id: 'emergency',
            label: 'Buy emergency gas from Sereth at any price.',
            hint: 'Cost: $4.5B. It works. It is the most expensive gas in Velmorran history.',
            outcome: {
              text: 'Sereth sells at triple the usual price. The hospitals come off generators within a day. Brask stops speaking to you for a while.',
              tone: 'mixed',
              effects: {
                stats: { treasury: -4.5 },
                hidden: { unrest: -3, fiscal: 4 },
                flags: { 'crisis:gas': 1 },
              },
            },
          },
          {
            id: 'expel',
            label: 'Expel the Ostrene ambassador.',
            hint: 'Free. Very popular for one day. It does not make the gas come back.',
            outcome: {
              text: 'The ambassador leaves with a smile. The next morning Ostrene cuts the gas to 70%, "for further maintenance".',
              tone: 'bad',
              effects: {
                stats: { support: 3 },
                hidden: { foreign: 10, unrest: 3 },
                flags: { 'crisis:gas': -2 },
              },
            },
          },
        ],
      },
    },
    stage3: {
      calm: {
        id: 'crisis-gas-3-calm',
        title: 'Never Again: The Pipeline Question',
        category: 'foreign',
        tags: tags('gas', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'The gas is back. The cold has passed. The ministers who panicked last week want to make sure Ostrene can never do this again.\n\nThere are two ways: a new pipeline from Sereth, or bigger storage tanks at home. Or you can decide it will not happen again, which is cheaper.',
        options: [
          {
            id: 'pipeline',
            label: 'Build a pipeline from Sereth.',
            hint: 'Cost: $0.5B a day for 6 days. Ostrene loses its hold on you. Ostrene will not forgive it.',
            outcome: {
              text: 'Work starts at the border. Ostrene calls it "an unfriendly act". Sereth calls it a good investment. The gas crisis is over.',
              tone: 'good',
              effects: {
                commitments: [{ label: 'The Sereth pipeline', perDay: 0.5, days: 6 }],
                hidden: { foreign: 4 },
                stats: { stability: 3 },
                regime: { isolation: 1 },
              },
            },
          },
          {
            id: 'storage',
            label: 'Build three months of gas storage.',
            hint: 'Cost: $2.0B. Next time you can wait them out. Nobody else is offended.',
            outcome: {
              text: 'The tanks go up over the summer. Next winter, Ostrene will know you can wait. The gas crisis is over.',
              tone: 'good',
              effects: {
                stats: { treasury: -2, stability: 2 },
                hidden: { foreign: -2 },
                regime: { technocracy: 1 },
              },
            },
          },
          {
            id: 'nothing',
            label: 'Do nothing. Relations are good again.',
            hint: 'Free. Ostrene is friendly now. It was friendly last month too.',
            outcome: {
              text: 'Relations with Ostrene return to normal, which is how they were before the cutoff. The gas crisis is over, until the next one.',
              tone: 'neutral',
              effects: {
                hidden: { foreign: -2 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-gas-3-hot',
        title: 'Ostrene Wants a Seat at Your Table',
        category: 'foreign',
        tags: tags('gas', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'Ostrene has a new offer, delivered by a junior official. Full gas again, if an Ostrene "adviser" sits in on your cabinet meetings for a year.\n\nThe cold is back next week. The treasury cannot buy Sereth gas at these prices for much longer.',
        options: [
          {
            id: 'accept',
            label: 'Accept the adviser.',
            hint: 'Free. The gas comes back. A foreign government hears every cabinet meeting.',
            outcome: {
              text: 'The adviser is polite, takes a lot of notes, and never speaks. The gas comes back that night. The gas crisis is over. Ostrene now knows everything you plan.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -6, information: -4 },
                hidden: { foreign: -10, leak: 8 },
                regime: { isolation: -2 },
              },
            },
          },
          {
            id: 'aureth',
            label: 'Take an emergency loan from the Aureth Union to keep buying Sereth gas.',
            hint: 'The treasury gains $5.0B. Repayments cost $0.7B a day for 8 days. You stay independent, and in debt.',
            outcome: {
              text: 'The loan arrives with conditions attached, as Aureth loans do. The heating stays on. Ostrene gives up and restores the gas a week later. The gas crisis is over.',
              tone: 'mixed',
              effects: {
                stats: { treasury: 5 },
                commitments: [{ label: 'Aureth emergency gas loan', perDay: 0.7, days: 8 }],
                hidden: { fiscal: 6, foreign: -4 },
              },
            },
          },
          {
            id: 'refuse',
            label: 'Refuse, and tell the country to wrap up warm.',
            hint: 'Free. Proud and cold. Some people will not forgive the cold.',
            outcome: {
              text: 'The country gets through two freezing weeks. Your approval goes up, then down, then settles. Ostrene restores the gas without comment. The gas crisis is over.',
              tone: 'mixed',
              effects: {
                stats: { support: -3, economy: -4, legitimacy: 3 },
                hidden: { unrest: 4 },
                regime: { isolation: 2 },
              },
            },
          },
        ],
      },
    },
  },

  /* ============================================== THE STAIRWELL TAPES */
  {
    id: 'tapes',
    name: 'The Stairwell Tapes',
    summary: 'A journalist says she has a recording from the night in the stairwell.',
    pressure: 'scandal',
    startAt: 50,
    stage1: {
      id: 'crisis-tapes-1',
      title: 'A Journalist Says She Has a Recording',
      category: 'scandal',
      actor: 'sarran',
      tags: tags('tapes', 1),
      base: 0,
      weight: never,
      once: true,
      body:
        'A freelance journalist named Irina Holl has told three editors she has an audio recording from the night in the stairwell — the night you came to power. None of them has heard it yet.\n\nSarran says the recording may exist. She does not say whether she knows what is on it.',
      options: [
        {
          id: 'meet',
          label: 'Ask Holl to meet you. Off the record.',
          hint: 'Free. You find out what she has. She finds out that you care.',
          outcome: {
            text: 'Holl meets Doran in a café. She plays eleven seconds of the tape. It is real, and it is not good, but it is not everything.',
            tone: 'mixed',
            effects: {
              stats: { information: 3 },
              flags: { 'crisis:tapes': 1 },
            },
          },
        },
        {
          id: 'sarran',
          label: 'Ask Sarran to find the tape first.',
          hint: 'Free. She will find it. Then she will have it.',
          outcome: {
            text: 'Sarran finds a copy within two days. She tells you it is "manageable". She does not give you the copy.',
            tone: 'mixed',
            effects: {
              hidden: { scandal: -3 },
              characters: { sarran: { influence: 6 } },
              flags: { 'crisis:tapes': 1 },
            },
          },
        },
        {
          id: 'threaten',
          label: 'Have lawyers warn the editors off.',
          hint: 'Free. It slows them down. Journalists love being told not to publish something.',
          outcome: {
            text: 'The letters go out. Two editors frame theirs. Holl gets three new offers for the story.',
            tone: 'bad',
            effects: {
              hidden: { scandal: 5 },
              flags: { 'crisis:tapes': -1 },
            },
          },
        },
      ],
    },
    stage2: {
      calm: {
        id: 'crisis-tapes-2-calm',
        title: 'Holl Wants to Hear Your Side',
        category: 'scandal',
        tags: tags('tapes', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Irina Holl is going to publish in three days. She has offered you an interview first, so the story can include your side of that night.\n\nThe tape has your voice on it, for four seconds. What you say now decides what people hear in those four seconds.',
        options: [
          {
            id: 'interview',
            label: 'Give the interview. Tell the truth about that night.',
            hint: 'Free. Risky. The truth is complicated, and people may accept it.',
            outcome: {
              text: 'You talk for two hours. The story runs with the tape and your answers side by side. It is uncomfortable reading, and it is fair.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 3 },
                hidden: { scandal: -4 },
                regime: { reform: 1 },
                flags: { 'crisis:tapes': 1 },
              },
            },
          },
          {
            id: 'statement',
            label: 'Send a written statement instead.',
            hint: 'Free. Safe and dull. The tape will do the talking.',
            outcome: {
              text: 'Your statement appears in the last paragraph. Most readers never reach it.',
              tone: 'mixed',
              effects: {
                hidden: { scandal: 1 },
              },
            },
          },
          {
            id: 'buy',
            label: 'Offer to buy the tape.',
            hint: 'Cost: $1.0B. She might sell. If she refuses, that becomes the story.',
            outcome: {
              text: 'Holl refuses, records the offer, and adds it to the story. The headline is now about the offer, not the stairwell.',
              tone: 'bad',
              effects: {
                hidden: { scandal: 6 },
                flags: { 'crisis:tapes': -2 },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-tapes-2-hot',
        title: 'Eleven Seconds on Every Screen',
        category: 'scandal',
        actor: 'loz',
        tags: tags('tapes', 2),
        base: 0,
        weight: never,
        once: true,
        body:
          'Eleven seconds of the stairwell tape were on every channel last night except Channel Seven, which is waiting to see what you do. Your voice is on it, saying "not yet". Nobody knows what you meant.\n\nThe full tape is forty minutes long. Holl has it.',
        options: [
          {
            id: 'explain',
            label: 'Go on television and explain "not yet".',
            hint: 'Free. If they believe you, it ends here. If not, it gets worse.',
            outcome: {
              text: 'You explain it on the 7pm news. Most people believe you, or want to. The story cools. Holl says she will publish the rest anyway.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 2 },
                hidden: { scandal: -3 },
                flags: { 'crisis:tapes': 2 },
              },
            },
          },
          {
            id: 'loz',
            label: 'Pay Loz to run a story saying the tape is edited.',
            hint: 'Cost: $1.5B. Sixty per cent of the country hears your version. Holl has the original.',
            outcome: {
              text: 'Channel Seven runs "The Doctored Tape" at 7pm. Half the country believes it. Holl releases the raw file the next morning to prove it is not edited.',
              tone: 'bad',
              effects: {
                stats: { treasury: -1.5 },
                hidden: { scandal: 4, cult: 3 },
                flags: { liesTold: 1 },
              },
            },
          },
          {
            id: 'arrest',
            label: 'Have Holl detained for "handling stolen state recordings".',
            hint: 'Free. Holl is silenced. Every journalist in the world now wants the tape.',
            outcome: {
              text: 'Holl is detained at her flat. By noon her tape is on six foreign websites. By evening it is in eleven languages.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -6 },
                hidden: { scandal: 8, foreign: 6, fear: 4 },
                regime: { repression: 3 },
                flags: { 'crisis:tapes': -2, peopleJailed: 1 },
              },
            },
          },
        ],
      },
    },
    stage3: {
      calm: {
        id: 'crisis-tapes-3-calm',
        title: 'The Story Ran. Now What?',
        category: 'scandal',
        tags: tags('tapes', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'Holl\'s story is out. It is long, careful and mostly fair. The country has read it. Vel has asked parliament for an inquiry into that night.\n\nThis is how the tapes affair ends.',
        options: [
          {
            id: 'inquiry',
            label: 'Agree to an independent inquiry.',
            hint: 'Free. It could clear you completely. It could also find something.',
            outcome: {
              text: 'The inquiry is set up with a retired judge in charge. It will take a year. The story leaves the front pages the same day. The tapes affair is over, for now.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 5 },
                hidden: { scandal: -8 },
                regime: { reform: 2 },
              },
            },
          },
          {
            id: 'move-on',
            label: 'Say you have answered every question, and move on.',
            hint: 'Free. It might work. Vel will keep asking.',
            outcome: {
              text: 'You refuse to discuss it further. The story fades slowly, and Vel mentions it in every speech for a month. The tapes affair is over.',
              tone: 'mixed',
              effects: {
                hidden: { scandal: -3 },
                characters: { vel: { influence: 4 } },
              },
            },
          },
          {
            id: 'award',
            label: 'Give Holl a press freedom award.',
            hint: 'Free. Bold. It turns your accuser into proof that you are not afraid.',
            outcome: {
              text: 'Holl accepts the award and thanks you by name, with some visible confusion. The tapes affair is over, and it ended with a photo of you shaking her hand.',
              tone: 'good',
              effects: {
                stats: { legitimacy: 4, support: 2 },
                hidden: { scandal: -6 },
                factions: { chorus: { loyalty: 4 }, sable: { loyalty: -3 } },
              },
            },
          },
        ],
      },
      hot: {
        id: 'crisis-tapes-3-hot',
        title: 'The Full Tape Is Out',
        category: 'scandal',
        tags: tags('tapes', 3),
        base: 0,
        weight: never,
        once: true,
        body:
          'All forty minutes of the stairwell tape are online. They show what happened that night better than anyone had described it, and worse. Parliament has scheduled a debate on your "fitness for office".\n\nThis is how the tapes affair ends.',
        options: [
          {
            id: 'apologise',
            label: 'Apologise in parliament, in person.',
            hint: 'Free. Humbling. It is the only thing that has worked for anyone in this situation.',
            outcome: {
              text: 'You speak for nine minutes without notes. The chamber is silent. The motion on your fitness for office is withdrawn. The tapes affair is over.',
              tone: 'mixed',
              effects: {
                stats: { legitimacy: 3, power: -3 },
                hidden: { scandal: -8 },
              },
            },
          },
          {
            id: 'fight',
            label: 'Fight the motion. Call the tape an attack on the state.',
            hint: 'Free. You may win the vote. You will lose the argument.',
            outcome: {
              text: 'The motion fails by nine votes. You win, and the country watched you win that way. The tapes affair is over. The damage is not.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -6, power: 2 },
                hidden: { scandal: 3, fear: 4 },
                regime: { personalism: 2 },
              },
            },
          },
          {
            id: 'scapegoat',
            label: 'Blame the people who were with you that night.',
            hint: 'Free. It may work. They know everything else that happened that night.',
            outcome: {
              text: 'Two officials from that night resign "to take responsibility". Neither of them goes quietly. The tapes affair ends, and two new enemies begin.',
              tone: 'bad',
              effects: {
                stats: { legitimacy: -2 },
                hidden: { scandal: -4, leak: 8 },
                characters: { sarran: { loyalty: -6 }, doran: { loyalty: -6 } },
              },
            },
          },
        ],
      },
    },
  },
];

export const CRISIS_MAP: Record<string, CrisisDef> = Object.fromEntries(CRISES.map((c) => [c.id, c]));

/** Every stage card, for engine.ts's registries. */
export const CRISIS_CARDS: CardDef[] = CRISES.flatMap((c) => [
  c.stage1, c.stage2.calm, c.stage2.hot, c.stage3.calm, c.stage3.hot,
]);

/** Which chain and stage a card belongs to, from its tags. */
export function crisisOfCard(card: CardDef): { chain: CrisisDef; stage: number } | undefined {
  const chain = card.tags?.find((t) => t.startsWith('chain:'))?.slice(6);
  const stage = Number(card.tags?.find((t) => t.startsWith('stage:'))?.slice(6));
  const def = chain ? CRISIS_MAP[chain] : undefined;
  return def && stage ? { chain: def, stage } : undefined;
}

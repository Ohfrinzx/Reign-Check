import type { FactionDef, CharacterDef, FactionId } from '../types';

/* ================================================================ VELMORRA
 * Everything here is invented. No real country, party or person is intended.
 * ========================================================================= */

export const COUNTRY = {
  name: 'The Republic of Velmorra',
  shortName: 'Velmorra',
  demonym: 'Velmorran',
  capital: 'Sarnica',
  currency: 'dollar',
  currencySymbol: '$',
  population: '31.4 million',
  office: 'Executive Chair',
  officeShort: 'Chair',
  predecessor: 'Tomas Krast',

  /** The two-minute version, for the opening screen. */
  pitch: [
    'Velmorra is a mid-sized country with lithium mines, salt flats, a big container port, and an offshore banking zone that everyone pretends not to understand.',
    'It has been run by one man for nineteen years. Nine days ago he died in a stairwell. The official cause was a heart attack. The unofficial cause was also a heart attack, delivered at close range, and the security service has not said who was with him.',
    'You were Deputy Chair of the Council. It was a job nobody wanted and nobody watched, which is exactly why you still have a pulse and a security detail.',
    'You are now Executive Chair. Nobody in the building thinks you will last a month. Two of them have already written the statement.',
  ],

  history: [
    'Velmorra got rich on salt, then on lithium, then on other people\'s money. Each time, the same dozen families ended up owning most of it.',
    'Independence in 1897 was negotiated over dinner rather than won in a war. Velmorrans have never quite forgiven themselves for this and compensate with extremely loud politics.',
    'The 1961 republic promised land reform and free schools. It delivered the schools. In 1979 the army stepped in "to protect the reform" and has been protecting it ever since.',
    'Tomas Krast took over in 2006. He made himself necessary by making everyone else replaceable. That worked for nineteen years and then it stopped working.',
  ],

  regions: [
    { name: 'Sarnica (capital)', tag: 'urban',
      blurb: 'Nine million people, every ministry, and a university that has brought down two governments. Protests start here or they do not start.' },
    { name: 'The Kordiva Basin', tag: 'rural',
      blurb: 'Farmland. Grain and sunflower oil. Feeds the country, resents the country, and votes as one solid block. Governor Kostyn runs it.' },
    { name: 'Mavro and the coast', tag: 'port',
      blurb: 'The container port and the salt flats. Also the customs service, which is corrupt in ways that have been studied academically.' },
    { name: 'The Gorsk highlands', tag: 'mining',
      blurb: 'Lithium and rock salt. Company towns that have been striking on and off since 1934. The miners are organised and they are patient.' },
    { name: 'The Ilvet Free Zone', tag: 'finance',
      blurb: 'Eleven square kilometres of banks, shell companies and casinos. Technically Velmorran. Pays almost no tax. Generates enormous amounts of money for people who are not you.' },
    { name: 'The Hadem border region', tag: 'frontier',
      blurb: 'Uplands on the Drovnan border. Hadeni-speaking. Promised self-government by every government since 1897 and given it by none. Two paved roads in.' },
  ],

  economy: {
    strengths: [
      'Lithium and salt: 44% of exports, sold almost entirely to one buyer',
      'Port fees: Mavro is the cheap route into three landlocked countries',
      'Grain, sunflower oil and a national liqueur that nobody abroad will drink',
      'The Ilvet Free Zone, which moves fortunes and pays nothing',
    ],
    weaknesses: [
      'One buyer for the lithium. They know it and they price accordingly',
      'A currency pegged at a rate the central bank can no longer defend',
      'One in six working adults is on the state payroll, and all of them vote',
      'Gas is imported at market price. A cold winter is a budget crisis',
      'Farm subsidies no government has survived cutting',
    ],
  },

  foreign: [
    { id: 'ostrene', name: 'Ostrene', relation: 'patron',
      blurb: 'The big neighbour to the north. Buys your lithium, sells you gas, and treats Velmorran independence as a polite fiction. Their ambassador does not ask for meetings, he schedules them.' },
    { id: 'aureth', name: 'The Aureth Union', relation: 'creditor',
      blurb: 'The wealthy bloc to the west. Will lend you almost anything at a good rate, provided you agree to an independent judiciary, open company records and audited defence spending.' },
    { id: 'sereth', name: 'Sereth', relation: 'investor',
      blurb: 'Buys ports, stadiums and football clubs. Asks no questions and answers none. The money arrives fast. What they want in return arrives later.' },
    { id: 'drovna', name: 'Drovna', relation: 'rival',
      blurb: 'Small, hostile, and sitting right on the Hadem border. Runs a Hadeni-language radio station that is half folk music and half encouragement to burn things.' },
  ],

  culture: [
    'The national sport is long-distance pigeon racing. The Pigeon Federation has 400,000 members and can get more people into the street than either opposition party.',
    'The 7pm news on Channel Seven is watched by about 60% of adults. What it says on Tuesday is what the country believes by Thursday.',
    'Dovra Day is a national holiday with a four-hour parade. By tradition the head of state walks the last kilometre on foot, in whatever weather there is.',
    'There is a widespread belief that the weather in the capital reflects how honest the government is. Meteorologists gave up arguing about this in the 1980s.',
    'Nobody signs an official document on the 13th. They date it the 12th instead. Everyone knows. Nobody minds.',
  ],

  institutions: [
    'The Council of the Republic — advisory on paper. It has removed two heads of state.',
    'The Grand Convocation — the legislature. Meets four times a year and approves what it is handed. It votes on confirming you in 30 days.',
    'The Sable Office — internal security and intelligence. Keeps files on everybody, including you.',
    'The General Staff — the army. Has been the final word on who governs since 1979.',
    'The Central Bank — independent in law, located inside the Finance Ministry in practice.',
  ],
} as const;

/* =============================================================== FACTIONS */

export const FACTIONS: Record<FactionId, FactionDef> = {
  staff: {
    id: 'staff',
    name: 'The General Staff',
    short: 'Army',
    icon: '★',
    blurb: 'The armed forces and their commanders. They decide, in the end, whether an order is an order.',
    motivation: 'They do not want to run the country. Running it is exhausting and you get blamed. They want funding, they want to be left alone, and they never want to be ordered to fire on a crowd.',
    redLine: 'Do not let civilians investigate the officer corps.',
    boon: 'Can shut down a crisis in an afternoon.',
    threat: 'Can remove you in a morning.',
    relations: { sable: -1, concord: 1, combine: -1, grey: 0, provinces: 1, chorus: -2 },
  },
  sable: {
    id: 'sable',
    name: 'The Sable Office',
    short: 'Security',
    icon: '◈',
    blurb: 'Internal security and intelligence. Wears no uniform and attends every meeting.',
    motivation: 'They need to be necessary. Their budget and their legal immunity both depend on there being threats. If threats run short, they are confident they can find more.',
    redLine: 'Do not let the army take over internal security.',
    boon: 'Knows what people will do before they do it.',
    threat: 'Also knows what you did.',
    relations: { staff: -1, concord: 0, combine: -2, grey: 1, provinces: -1, chorus: -3 },
  },
  concord: {
    id: 'concord',
    name: 'The Concord',
    short: 'Business',
    icon: '◆',
    blurb: 'The banks, the shipping firms and the Ilvet money. About eleven people own most of it.',
    motivation: 'They do not care who governs. They care about the exchange rate, the customs schedule and whether their contracts survive the next government. They will fund anyone who guarantees the contracts.',
    redLine: 'Do not nationalise anything. Do not audit Ilvet.',
    boon: 'Can refinance the government over a weekend.',
    threat: 'Can move the currency 12% before lunch.',
    relations: { staff: 1, sable: 0, combine: -3, grey: -1, provinces: 0, chorus: 0 },
  },
  combine: {
    id: 'combine',
    name: 'The Combine of Labour',
    short: 'Unions',
    icon: '⚒',
    blurb: 'The Gorsk miners, the Mavro dockers, the railways, and 1.9 million public employees.',
    motivation: 'They believe the 1961 republic was promised to them and then quietly taken back. They want wages. What they actually want is to be treated as founders instead of as a problem.',
    redLine: 'Never send soldiers to break a strike.',
    boon: 'Can put 400,000 people in the street for you.',
    threat: 'Can put 400,000 people in the street against you.',
    relations: { staff: -1, sable: -2, concord: -3, grey: 0, provinces: 1, chorus: 2 },
  },
  grey: {
    id: 'grey',
    name: 'The Civil Service',
    short: 'Ministries',
    icon: '▤',
    blurb: 'Forty thousand permanent officials across nine ministries. They were here before you and they expect to be here after.',
    motivation: 'They want things done by the rulebook. Not because they are honest — they are not especially honest — but because the rulebook is the only thing that has ever protected an official from the next boss.',
    redLine: 'Do not sign things behind their backs. They always find out.',
    boon: 'Can make a policy actually happen.',
    threat: 'Can make a policy simply never arrive.',
    relations: { staff: 0, sable: 1, concord: -1, combine: 0, provinces: -1, chorus: 1 },
  },
  provinces: {
    id: 'provinces',
    name: 'The Provincial Bloc',
    short: 'Provinces',
    icon: '⬢',
    blurb: 'Six governors, the farm lobby, the Hadem councils, and a countryside still waiting for a road it was promised in 1968.',
    motivation: 'They want money sent to them and they want the capital to stop explaining things to them. Governor Kostyn wants considerably more than that, but she has not said so out loud yet.',
    redLine: 'Do not cut farm subsidies. Do not put a capital appointee in a provincial job.',
    boon: 'Delivers the countryside, quietly and completely.',
    threat: 'Can simply stop sending the tax revenue.',
    relations: { staff: 1, sable: -1, concord: 0, combine: 1, grey: -1, chorus: -1 },
  },
  chorus: {
    id: 'chorus',
    name: 'The Public',
    short: 'Public',
    icon: '◎',
    blurb: 'The press, the universities, city professionals, the opposition party, and whatever is trending this week.',
    motivation: 'They want to be listened to, and failing that, to be proved right. They are not organised. That makes them easy to ignore for a long time and then impossible to ignore at all.',
    redLine: 'Do not arrest a journalist by name.',
    boon: 'Makes your government look legitimate to foreign lenders.',
    threat: 'Can fill the main square in ninety minutes.',
    relations: { staff: -2, sable: -3, concord: 0, combine: 2, grey: 1, provinces: -1 },
  },
};

export const FACTION_ORDER: FactionId[] = ['staff', 'sable', 'concord', 'combine', 'grey', 'provinces', 'chorus'];

/* ============================================================= CHARACTERS */

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'varkov', name: 'Dessa Varkov', title: 'Chief of the General Staff',
    faction: 'staff', portrait: '★', accent: '#c8a45c',
    why: 'Runs the army. If she decides you should go, you go.',
    blurb: 'Forty-one years in uniform, three of them in a Drovnan prison she will not discuss. Very good at her job and fully aware that she is more popular than you are.',
    quirk: 'Checks her watch at the end of every meeting. Nobody has seen her hurry.',
    ambition: 62, competence: 88, venality: 20, candour: 70,
  },
  {
    id: 'sarran', name: 'Anneth Sarran', title: 'Director of the Sable Office',
    faction: 'sable', portrait: '◈', accent: '#7f8fa6',
    why: 'Runs intelligence and internal security. Knows what happened in the stairwell.',
    blurb: 'Has never been photographed smiling or surprised. Brings you one true thing and one useful thing per meeting. They are rarely the same thing.',
    quirk: 'Answers the question you should have asked instead of the one you did.',
    ambition: 55, competence: 92, venality: 30, candour: 28,
  },
  {
    id: 'brask', name: 'Kel Brask', title: 'Finance Minister',
    faction: 'grey', portrait: '$', accent: '#5fa8a0',
    why: 'The only person who has read the whole budget. Tells you the truth about money.',
    blurb: 'Bad at politics, excellent with numbers, and physically incapable of lying without sweating. Everyone finds him exhausting and nobody can replace him.',
    quirk: 'Keeps the real figures in a green notebook and the presentable ones in a folder.',
    ambition: 25, competence: 90, venality: 12, candour: 88,
  },
  {
    id: 'doran', name: 'Yvet Doran', title: 'Chief of Staff',
    faction: 'grey', portrait: '✦', accent: '#b58ec9',
    why: 'Your fixer. Got you this job. Keeps a running total of what you owe her.',
    blurb: 'Runs your diary, your building and your problems. Loyal so far. Very clear-eyed about the fact that loyalty is a transaction.',
    quirk: 'Uses your first name when the room is empty and your title when it is not. Notice which one she picks.',
    ambition: 58, competence: 82, venality: 45, candour: 65,
  },
  {
    id: 'piek', name: 'Orlan Piek', title: 'Foreign Minister',
    faction: 'grey', portrait: '❖', accent: '#c97f7f',
    why: 'Handles foreign governments. Leaks to the Aureth embassy because they flatter him.',
    blurb: 'Superb at dinners and handshakes. Not superb at anything else. Nobody has ever caught him taking money, which is not the same as nobody having tried to give him any.',
    quirk: 'Owns eleven identical navy suits and describes this as discipline.',
    ambition: 48, competence: 55, venality: 62, candour: 40,
  },
  {
    id: 'kostyn', name: 'Mira Kostyn', title: 'Governor of the Kordiva Basin',
    faction: 'provinces', portrait: '⬢', accent: '#a3b86c',
    why: 'Controls the farm belt. Wins her region with 78%. Wants your job.',
    blurb: 'Built four hundred kilometres of road and makes sure nobody forgets it. Extremely warm to you in public, which should worry you more than it does.',
    quirk: 'Gives everyone a jar of honey. The jars are numbered. She knows who kept theirs.',
    ambition: 84, competence: 78, venality: 35, candour: 55,
  },
  {
    id: 'adamek', name: 'Rulf Adamek', title: 'Chairman, Ilvet Instruments',
    faction: 'concord', portrait: '◆', accent: '#d4a017',
    why: 'The richest man in the country. Owns the port cranes, a bank and a football club.',
    blurb: 'Has never held office and has chosen four ministers. Buys people the way other men buy lunch, and with about as much emotion.',
    quirk: 'Never says a number out loud. Writes it down and slides it across the table.',
    ambition: 70, competence: 80, venality: 95, candour: 35,
  },
  {
    id: 'vel', name: 'Sanna Vel', title: 'Leader of the Opposition',
    faction: 'chorus', portrait: '◎', accent: '#6fa8dc',
    why: 'The only politician in the country with no known price. Wants your job, legally.',
    blurb: 'Thirty-four, a constitutional lawyer, and very hard to catch out on detail. Live-streams her walk to work. Two hundred thousand people watch a woman walk to work.',
    quirk: 'Answers questions completely, which in Velmorran politics reads as an attack.',
    ambition: 75, competence: 74, venality: 6, candour: 90,
  },
  {
    id: 'loz', name: 'Dmitar Loz', title: 'Owner, Channel Seven',
    faction: 'concord', portrait: '▣', accent: '#c98a5e',
    why: 'Owns the 7pm news and three newspapers. Decides what 60% of the country sees.',
    blurb: 'Sells coverage the way a butcher sells cuts: by weight, with a smile, and nothing is wasted. Has called the news "the product" in front of parliament. Twice.',
    quirk: 'Takes the best chair in your office without being offered it.',
    ambition: 60, competence: 72, venality: 88, candour: 30,
  },
  {
    id: 'hess', name: 'Bogdan Hess', title: 'Head of the Combine of Labour',
    faction: 'combine', portrait: '⚒', accent: '#d97757',
    why: 'Runs the unions. One phone call from him stops the mines and the port.',
    blurb: 'Twenty-two years underground, eighteen running the union. Speaks slowly and means all of it. Has never actually had to make the phone call, which is the point of being able to.',
    quirk: 'Will not sit down in your office. Says the chairs are a tactic.',
    ambition: 40, competence: 76, venality: 15, candour: 85,
  },
  {
    id: 'grebs', name: 'Ilyana Grebs', title: 'Permanent Secretary to the Ministries',
    faction: 'grey', portrait: '▤', accent: '#9aa0a6',
    why: 'Runs the civil service. Her signature moves things your signature cannot.',
    blurb: 'Has served nine heads of state and outlasted eight. Signs nothing she has not read. Keeps copies of everything in a room she has the only key to.',
    quirk: 'Never gives an opinion in writing. Gives them freely in person, once.',
    ambition: 45, competence: 94, venality: 25, candour: 60,
  },
  {
    id: 'tern', name: 'Ravik Tern', title: 'Commander, Capital Garrison',
    faction: 'staff', portrait: '⬗', accent: '#8f9779',
    why: 'Commands the only armed force inside the capital. Mathematically, the most dangerous person you know.',
    blurb: 'Charming, well-liked and extremely good at being liked. Between 2am and 5am he is the most important man in Velmorra and everyone in the building knows it.',
    quirk: 'Sends a handwritten note after every meeting. People find this delightful. It is also a record.',
    ambition: 68, competence: 70, venality: 50, candour: 45,
  },
  {
    id: 'vask', name: 'Petru Vask', title: 'Head of the Salt Communion',
    faction: 'provinces', portrait: '⛨', accent: '#bfa98a',
    why: 'Leads the old church. Owns land in four regions and moral authority in all six.',
    blurb: 'Does not want power. Wants to be consulted, which in this country amounts to the same thing. Blesses your decisions in language vague enough that both sides quote him.',
    quirk: 'Never says no. Says "I would want to reflect on that", which means no.',
    ambition: 30, competence: 65, venality: 22, candour: 58,
  },
];

export const CHARACTER_MAP: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function charName(id: string): string {
  return CHARACTER_MAP[id]?.name ?? id;
}

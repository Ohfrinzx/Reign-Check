import type { FactionDef, CharacterDef, FactionId } from '../types';

/* ================================================================ VELMORRA
 * A salt republic on a bad-tempered sea. Everything here is invented.
 * ========================================================================= */

export const COUNTRY = {
  name: 'The Republic of Velmorra',
  shortName: 'Velmorra',
  demonym: 'Velmorran',
  capital: 'Sarnica',
  currency: 'velk',
  currencySymbol: '₩',
  population: '31.4 million',
  founded: 'Independence declared 1897; Republic re-founded 1961; constitution suspended 1979, 1994, and "temporarily" since 2011.',
  motto: 'SALT, PATIENCE, AND THE SEA',
  office: 'First Citizen of the Republic',
  predecessor: 'Marshal Tovin Krast',
  predecessorFate:
    'Died in office after nineteen years. Officially of a heart attack. Unofficially of a heart attack administered at close range, in a stairwell, by persons the Sable Office has declined to identify.',

  history: [
    'Velmorra was a salt colony before it was a country. For three centuries the Hallowed Pans of Mavro supplied half the preserved fish in the northern sea, and the families who owned the pans became the families who owned everything else.',
    'The 1897 Independence was less a revolution than a negotiated handover conducted largely over dinner. Velmorrans have never entirely forgiven themselves for this, and compensate with a national politics of extraordinary theatrical intensity.',
    'The 1961 Republic promised land reform, universal schooling, and an end to the pan families. It delivered schooling. In 1979 the General Staff intervened "to protect the reform", and has been protecting it ever since.',
    'Marshal Krast took power in 2006 and made himself indispensable by making everyone else replaceable. He died last Tuesday. You were his Vice-Chairman of the Council, which nobody thought was an important job, including you.',
  ],

  regions: [
    {
      name: 'Sarnica Capital District',
      blurb:
        'Nine million people, four ministries per square kilometre, and a university that has overthrown two governments and nearly a third. The weather here is considered a referendum on the government\'s honesty.',
      tag: 'urban',
    },
    {
      name: 'The Kordiva Basin',
      blurb:
        'Grain, sunflower, and grievance. Feeds the country, resents the country, votes as one enormous suspicious bloc. Governor Kostyn\'s fortress.',
      tag: 'rural',
    },
    {
      name: 'Mavro and the Tannery Coast',
      blurb:
        'Ports, salt pans, container cranes, and a customs service so creatively corrupt that economists study it. Whoever controls Mavro controls what the Republic is allowed to know about its own trade figures.',
      tag: 'port',
    },
    {
      name: 'The Gorsk Uplands',
      blurb:
        'Lithium, rock salt, and company towns that have been on strike, on and off, since 1934. The miners have their own anthem. It is longer than the national one and considerably better.',
      tag: 'mining',
    },
    {
      name: 'The Ilvet Free Zone',
      blurb:
        'Eleven square kilometres of legal fiction. Banking, re-export, gambling, and a skyline financed by money that has never once explained itself. Technically Velmorran. Practically its own weather system.',
      tag: 'finance',
    },
    {
      name: 'The Hadem Marches',
      blurb:
        'Border uplands, Hadeni-speaking, historically promised autonomy by every government since 1897 and granted it by none. Three roads in. Everyone counts them.',
      tag: 'frontier',
    },
  ],

  economy: {
    strengths: [
      'Rock salt and lithium carbonate — 44% of exports, mostly to one buyer',
      'Transit fees: the Mavro corridor is the cheap way into three landlocked markets',
      'Sunflower oil, preserved fish, and the national bitter liqueur (rakiv), which is beloved domestically and unsellable abroad',
      'The Ilvet Free Zone, which generates enormous revenue and almost no tax',
    ],
    weaknesses: [
      'One buyer for the lithium: the Ostrene Compact, which knows it',
      'The velk is pegged at a rate the central bank can no longer honestly defend',
      'A state payroll covering roughly one in six working adults, all of whom vote',
      'Energy imported at spot price; a cold winter is a fiscal event',
      'Grain subsidies that no government has survived cutting',
    ],
  },

  foreign: [
    {
      id: 'ostrene',
      name: 'The Ostrene Compact',
      relation: 'patron',
      blurb:
        'The large northern neighbour. Buys your lithium, sells you gas, and regards Velmorran sovereignty as a charming local custom. Their ambassador does not request meetings; he announces them.',
    },
    {
      id: 'aureth',
      name: 'The Aureth Union',
      relation: 'creditor',
      blurb:
        'The western bloc. Will lend you anything you like at excellent rates in exchange for judicial independence, which they describe as "technical assistance" and you describe as "a coup with paperwork".',
    },
    {
      id: 'sereth',
      name: 'The Sereth Emirates',
      relation: 'investor',
      blurb:
        'Buys ports, football clubs, and cabinet ministers. Asks no questions and answers none. Their money arrives on a Thursday and their expectations arrive quietly, later.',
    },
    {
      id: 'drovna',
      name: 'The Drovnan Directorate',
      relation: 'rival',
      blurb:
        'Small, hostile, and next to the Hadem Marches. Broadcasts Hadeni-language radio that is 60% folk music and 40% arson.',
    },
  ],

  culture: [
    'The national sport is competitive long-distance pigeon racing. The Velmorran Pigeon Federation has 400,000 members, an unresolved schism, and more mobilising capacity than two of your political parties.',
    'Rakiv is a bitter salt liqueur drunk at funerals, weddings, and negotiations. Refusing a glass is a statement. Accepting three is a concession.',
    'The Seven O\'Clock Word is the evening broadcast. Roughly 60% of the country still watches it. What it says on a Tuesday is what the country believes by Thursday.',
    'Saint Dovra\'s Day commemorates a flood that may not have happened, with a parade that certainly does. Governments that cancel it do not last the year.',
    'Velmorrans believe the weather in Sarnica reflects the honesty of the government. Meteorologists have given up correcting this.',
    'No official document is signed on the thirteenth. The ministries simply date it the twelfth. Everyone knows. Nobody minds.',
  ],

  institutions: [
    'The Council of the Republic — advisory, in theory; it has removed two First Citizens',
    'The Grand Convocation — a legislature that meets four times a year and ratifies what it is given',
    'The Sable Office — internal security, archives, and the largest collection of other people\'s letters in the hemisphere',
    'The General Staff — the army, and the arbiter of last resort since 1979',
    'The Central Bank of Velmorra — nominally independent, physically located inside the Finance Ministry',
    'The Salt Communion — the old church of the pans; owns land, schools, and the moral high ground',
  ],
} as const;

/* =============================================================== FACTIONS */

export const FACTIONS: Record<FactionId, FactionDef> = {
  staff: {
    id: 'staff',
    name: 'The General Staff',
    short: 'Staff',
    icon: '★',
    blurb:
      'The armed forces and their command. Guardians of the 1979 settlement, owners of the best hospitals in the country, and the people who ultimately decide whether an order is an order.',
    motivation:
      'The Staff does not want to govern. Governing is exhausting and someone always blames you. It wants budget, autonomy, and the certainty that it will never be asked to fire on a crowd.',
    redLine: 'Never let a civilian institution investigate the officer corps.',
    boon: 'Can end a crisis in an afternoon.',
    threat: 'Can end you in a morning.',
    relations: { sable: -1, concord: 1, combine: -1, grey: 0, provinces: 1, chorus: -2 },
  },
  sable: {
    id: 'sable',
    name: 'The Sable Office',
    short: 'Sable',
    icon: '◈',
    blurb:
      'Internal security, counter-intelligence, and the national archive of everybody\'s worst evening. Wears no uniform. Attends every meeting.',
    motivation:
      'The Office wants to be necessary. Its budget, its immunity, and its Director\'s continued liberty all depend on there being threats. If there are not enough threats, the Office is confident it can find some.',
    redLine: 'Never let the army run its own internal security.',
    boon: 'Knows what everyone is going to do before they do it.',
    threat: 'Also knows what you did.',
    relations: { staff: -1, concord: 0, combine: -2, grey: 1, provinces: -1, chorus: -3 },
  },
  concord: {
    id: 'concord',
    name: 'The Concord',
    short: 'Concord',
    icon: '◆',
    blurb:
      'The banks, the pan families, the Ilvet money, and the eleven people who between them own the ports, the cranes, the cement, and the football. Meets for lunch. Decides things over dessert.',
    motivation:
      'The Concord does not care who governs. It cares about the exchange rate, the customs schedule, and whether its contracts survive the next government. It will fund whoever guarantees the third thing.',
    redLine: 'Never nationalise. Never audit Ilvet.',
    boon: 'Can refinance the Republic over a weekend.',
    threat: 'Can move the velk twelve per cent before lunch.',
    relations: { staff: 1, sable: 0, combine: -3, grey: -1, provinces: 0, chorus: 0 },
  },
  combine: {
    id: 'combine',
    name: 'The Combine of Labour',
    short: 'Combine',
    icon: '⚒',
    blurb:
      'The miners of Gorsk, the dockers of Mavro, the railway workers, and 1.9 million state employees. Slow to anger. Catastrophic once angry.',
    motivation:
      'The Combine remembers 1961 and believes the Republic was promised to it and then quietly taken back. It wants wages, but what it actually wants is to be treated as a founder rather than a problem.',
    redLine: 'Never break a strike with soldiers.',
    boon: 'Can put four hundred thousand bodies in the street for you.',
    threat: 'Can put four hundred thousand bodies in the street against you.',
    relations: { staff: -1, sable: -2, concord: -3, grey: 0, provinces: 1, chorus: 2 },
  },
  grey: {
    id: 'grey',
    name: 'The Grey Floor',
    short: 'Grey Floor',
    icon: '▤',
    blurb:
      'The permanent civil service. Nine ministries, forty thousand officials, and an institutional memory that outlasts every government it has ever served. Named for the third floor of the Ministries Building, where nothing is decided and everything is arranged.',
    motivation:
      'The Grey Floor wants procedure. Not because it is honest — it is not especially honest — but because procedure is the only thing that has ever protected an official from the next First Citizen.',
    redLine: 'Never bypass the Floor to sign something. They will find out. They always find out.',
    boon: 'Can make a policy actually happen.',
    threat: 'Can make a policy simply never arrive.',
    relations: { staff: 0, sable: 1, concord: -1, combine: 0, provinces: -1, chorus: 1 },
  },
  provinces: {
    id: 'provinces',
    name: 'The Provincial Bloc',
    short: 'Provinces',
    icon: '⬢',
    blurb:
      'Six governors, the Kordiva grain lobby, the Hadem councils, and a countryside that has been waiting for a road since 1968. Loosely allied, permanently aggrieved, electorally decisive.',
    motivation:
      'The Bloc wants transfers, and it wants the capital to stop explaining things to it. Kostyn wants rather more than that, but she has not said so out loud yet.',
    redLine: 'Never cut the grain subsidy. Never appoint a Sarnica man to a provincial post.',
    boon: 'Delivers the countryside, quietly and completely.',
    threat: 'Can simply stop forwarding the tax receipts.',
    relations: { staff: 1, sable: -1, concord: 0, combine: 1, grey: -1, chorus: -1 },
  },
  chorus: {
    id: 'chorus',
    name: 'The Chorus',
    short: 'Chorus',
    icon: '◎',
    blurb:
      'The press, the universities, the urban professions, the Open Table party, and whatever is currently happening on Velmorran social media. Has no power and an enormous amount of influence, which is worse.',
    motivation:
      'The Chorus wants to be listened to, and failing that, to be proved right. It is not a coherent bloc; it is a weather system. It can be ignored for a long time and then cannot be ignored at all.',
    redLine: 'Never jail a journalist by name. Vanishing one is, oddly, survivable. Charging one is not.',
    boon: 'Can make your government look legitimate to the Aureth Union.',
    threat: 'Can fill Convocation Square in ninety minutes.',
    relations: { staff: -2, sable: -3, concord: 0, combine: 2, grey: 1, provinces: -1 },
  },
};

export const FACTION_ORDER: FactionId[] = ['staff', 'sable', 'concord', 'combine', 'grey', 'provinces', 'chorus'];

/* ============================================================= CHARACTERS */

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'varkov',
    name: 'Marshal Dessa Varkov',
    title: 'Chief of the General Staff',
    faction: 'staff',
    portrait: '★',
    accent: '#c8a45c',
    blurb:
      'Forty-one years in uniform, three of them in a Drovnan prison she does not discuss. Competent, patient, and entirely aware that she is more popular than you.',
    quirk: 'Ends every meeting by looking at her watch. Nobody has ever seen her hurry.',
    ambition: 62,
    competence: 88,
    venality: 20,
    candour: 70,
  },
  {
    id: 'sarran',
    name: 'Director Anneth Sarran',
    title: 'Director of the Sable Office',
    faction: 'sable',
    portrait: '◈',
    accent: '#7f8fa6',
    blurb:
      'Has never been photographed smiling and has never been photographed surprised. Knows what Krast did in the stairwell. Has not said.',
    quirk: 'Brings you one piece of true information and one piece of useful information per meeting. They are rarely the same piece.',
    ambition: 55,
    competence: 92,
    venality: 30,
    candour: 28,
  },
  {
    id: 'brask',
    name: 'Kel Brask',
    title: 'Minister of Finance',
    faction: 'grey',
    portrait: '₩',
    accent: '#5fa8a0',
    blurb:
      'The only person in the building who has read the whole budget. Sweats when he lies, which is why he mostly does not. Everyone finds him exhausting and nobody can replace him.',
    quirk: 'Carries the real numbers in a green notebook and the presentable numbers in a folder.',
    ambition: 25,
    competence: 90,
    venality: 12,
    candour: 88,
  },
  {
    id: 'doran',
    name: 'Yvet Doran',
    title: 'Chief of Staff',
    faction: 'grey',
    portrait: '✦',
    accent: '#b58ec9',
    blurb:
      'Your fixer. Got you the Vice-Chairmanship nobody wanted, which turned out to be the job that mattered. Cynical, funny, and keeping score of exactly how much you owe her.',
    quirk: 'Calls you by your first name when the room is empty and "First Citizen" when it is not. Watch which one she uses.',
    ambition: 58,
    competence: 82,
    venality: 45,
    candour: 65,
  },
  {
    id: 'piek',
    name: 'Orlan Piek',
    title: 'Minister of Foreign Affairs',
    faction: 'grey',
    portrait: '❖',
    accent: '#c97f7f',
    blurb:
      'Superb at summits, dinners, and being photographed shaking hands. Leaks to the Aureth chargé d\'affaires because they compliment his French and he is only human.',
    quirk: 'Owns eleven identical navy suits and refers to this as "discipline".',
    ambition: 48,
    competence: 55,
    venality: 62,
    candour: 40,
  },
  {
    id: 'kostyn',
    name: 'Governor Mira Kostyn',
    title: 'Governor of the Kordiva Basin',
    faction: 'provinces',
    portrait: '⬢',
    accent: '#a3b86c',
    blurb:
      'Rebuilt four hundred kilometres of road and never lets anyone forget it. Wins Kordiva with 78%. Is very warm to you in public, which should worry you.',
    quirk: 'Gives everyone a jar of Kordiva honey. The jars are numbered. She knows who kept theirs.',
    ambition: 84,
    competence: 78,
    venality: 35,
    candour: 55,
  },
  {
    id: 'adamek',
    name: 'Rulf Adamek',
    title: 'Chairman, Ilvet Instruments',
    faction: 'concord',
    portrait: '◆',
    accent: '#d4a017',
    blurb:
      'Owns the cranes, the cement, the bank, and Mavro Dockers FC. Has never held office and has appointed four ministers. Buys people the way other men buy lunch.',
    quirk: 'Never says a number out loud. Writes it on a card and slides it across.',
    ambition: 70,
    competence: 80,
    venality: 95,
    candour: 35,
  },
  {
    id: 'vel',
    name: 'Sanna Vel',
    title: 'Leader of the Open Table',
    faction: 'chorus',
    portrait: '◎',
    accent: '#6fa8dc',
    blurb:
      'Thirty-four, a constitutional lawyer, and the only politician in Velmorra with no known price. This is either true or the most expensive secret in the country.',
    quirk: 'Live-streams her walk to work. Two hundred thousand people watch a woman walk to work.',
    ambition: 75,
    competence: 74,
    venality: 6,
    candour: 90,
  },
  {
    id: 'loz',
    name: 'Dmitar Loz',
    title: 'Proprietor, Channel Seven',
    faction: 'concord',
    portrait: '▣',
    accent: '#c98a5e',
    blurb:
      'Owns the Seven O\'Clock Word, three newspapers, and the only printing press in Gorsk. Sells coverage the way a butcher sells cuts: by weight, with a smile, and nothing goes to waste.',
    quirk: 'Refers to the news as "the product". Has done this in front of the Convocation.',
    ambition: 60,
    competence: 72,
    venality: 88,
    candour: 30,
  },
  {
    id: 'hess',
    name: 'Bogdan Hess',
    title: 'Chairman of the Combine of Labour',
    faction: 'combine',
    portrait: '⚒',
    accent: '#d97757',
    blurb:
      'Twenty-two years underground in Gorsk, eighteen at the head of the union. Speaks slowly, means all of it, and can shut the ports with one phone call he has never yet had to make.',
    quirk: 'Will not sit down in your office. Says the chairs are a tactic.',
    ambition: 40,
    competence: 76,
    venality: 15,
    candour: 85,
  },
  {
    id: 'grebs',
    name: 'Ilyana Grebs',
    title: 'Permanent Deputy of the Ministries',
    faction: 'grey',
    portrait: '▤',
    accent: '#9aa0a6',
    blurb:
      'Has served nine First Citizens, outlasted all but one, and signs nothing she has not read. The Grey Floor\'s actual power. Her signature is worth more than three cabinet votes.',
    quirk: 'Keeps receipts. Literal ones. Filed by year, in a room she has the only key to.',
    ambition: 45,
    competence: 94,
    venality: 25,
    candour: 60,
  },
  {
    id: 'tern',
    name: 'Colonel Ravik Tern',
    title: 'Commandant of the Capital Garrison',
    faction: 'staff',
    portrait: '⬗',
    accent: '#8f9779',
    blurb:
      'Commands the only armed formation inside Sarnica. Charming, well-liked, and mathematically the single most important person in the Republic between the hours of two and five in the morning.',
    quirk: 'Sends a handwritten note after every meeting. Everyone finds this delightful. It is also a record.',
    ambition: 68,
    competence: 70,
    venality: 50,
    candour: 45,
  },
  {
    id: 'vask',
    name: 'Archon Petru Vask',
    title: 'Archon of the Salt Communion',
    faction: 'provinces',
    portrait: '⛨',
    accent: '#bfa98a',
    blurb:
      'Head of the old church of the pans. Owns land in four regions and moral authority in all six. Does not want power. Wants to be consulted, which in Velmorra is the same thing.',
    quirk: 'Blesses each of your decisions in terms so ambiguous that both sides quote him.',
    ambition: 30,
    competence: 65,
    venality: 22,
    candour: 58,
  },
];

export const CHARACTER_MAP: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function charName(id: string): string {
  return CHARACTER_MAP[id]?.name ?? id;
}

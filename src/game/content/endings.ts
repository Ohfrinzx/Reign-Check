import type { ConfidenceVoteResult, GameState, EndingDef, EndingResult, FactionId, VoteBloc } from '../types';
import { REGIME_KEYS } from '../types';
import { money } from '../stats';
import { FACTIONS, FACTION_ORDER } from './country';
import { DISPLAY_FACTIONS, HOSTILE_BELOW, computeResources } from '../display';
import { isActEndDay } from '../state';

/**
 * Confidence vote (balance slice B). The Grand Convocation votes in blocs,
 * one per visible faction. Each bloc's deputies follow that faction's mood
 * (60%) and how the government looks overall — Grip and Legitimacy (40%).
 * A faction that has turned hostile (the bottom mood on its bar) votes
 * against you as one. An empty treasury costs votes in every bloc. The bar
 * rises each act: a simple majority first, three-fifths at the end.
 *
 * Deterministic — no dice. Everything that goes in is on screen: the faction
 * bars, Grip, Legitimacy and Money.
 */
export const VOTE_SEATS: { faction: FactionId; seats: number }[] = [
  { faction: 'staff', seats: 15 },
  { faction: 'sable', seats: 10 },
  { faction: 'concord', seats: 20 },
  { faction: 'combine', seats: 25 },
  { faction: 'chorus', seats: 30 },
];
export const TOTAL_SEATS = VOTE_SEATS.reduce((a, b) => a + b.seats, 0);
/** votes needed at the end of act 1, 2, 3 */
export const VOTES_NEEDED = [45, 58, 68];

export function computeConfidenceVote(s: GameState): ConfidenceVoteResult {
  const resources = computeResources(s);
  const grip = resources.find((r) => r.key === 'grip')?.value ?? 0;
  const legitimacy = resources.find((r) => r.key === 'legitimacy')?.value ?? 0;
  const standing = (grip + legitimacy) / 2;
  const debt = s.stats.treasury < 0 ? Math.min(25, 8 + Math.abs(s.stats.treasury) * 0.5) : 0;

  const blocs: VoteBloc[] = VOTE_SEATS.map(({ faction, seats }) => {
    const loyalty = s.factions[faction].loyalty;
    if (loyalty < HOSTILE_BELOW) return { faction, seats, votesFor: 0, why: 'hostile: all voted against' };
    const lean = 0.6 * loyalty + 0.4 * standing - debt;
    const share = Math.max(0, Math.min(1, (lean - 30) / 40));
    const votesFor = Math.round(seats * share);
    const why = share >= 0.85 ? 'backed you' : share >= 0.5 ? 'mostly backed you' : share > 0.15 ? 'mostly voted against' : 'voted against you';
    return { faction, seats, votesFor, why };
  });
  const score = blocs.reduce((a, b) => a + b.votesFor, 0);
  const threshold = VOTES_NEEDED[Math.min(VOTES_NEEDED.length, Math.max(1, s.act)) - 1];
  return {
    act: s.act,
    day: s.day,
    grip,
    legitimacy,
    blocs,
    debtCost: debt > 0,
    score,
    threshold,
    margin: score - threshold,
    passed: score >= threshold,
  };
}

const ACT_NAMES = ['first', 'second', 'third'];

/**
 * Failure states are never a dice roll. Each one is the terminus of a pressure
 * the player has been able to see the symptoms of for days.
 */
export const ENDINGS: EndingDef[] = [
  {
    id: 'coup',
    title: 'THE ARMY MOVED AT FOUR IN THE MORNING',
    kind: 'coup',
    priority: 100,
    check: (s) => s.hidden.coup >= 84 || (s.stats.military <= 10 && s.hidden.coup > 52),
    epitaph: (s) =>
      `They came at four in the morning, which is when these things happen, and it took eleven minutes, because nobody in the building had been given a reason to make it take longer.\n\nThe army's statement mentioned "a period of instability" and promised elections. Nobody who has lived here since 1979 believes the second half of that sentence, and nobody argues with the first.\n\nYou were in charge for ${s.day} days.`,
  },
  {
    id: 'revolution',
    title: 'THE SQUARE DID NOT GO HOME',
    kind: 'revolt',
    priority: 95,
    check: (s) => s.hidden.unrest >= 92 || (s.stats.stability <= 6 && s.stats.support < 20),
    epitaph: (s) =>
      `It filled on a Tuesday and it did not empty on Wednesday. By Friday there were kitchens. By the second week there were committees, and a country with committees in its main square has already made up its mind.\n\nThe Sable Office recommended clearing it. The army declined to provide the soldiers. That was the whole thing, really: two institutions disagreeing in a corridor, ${s.day} days into your government.`,
  },
  {
    id: 'elite',
    title: 'A DECISION TAKEN OVER LUNCH',
    kind: 'elite',
    priority: 90,
    check: (s) => s.stats.elite <= 6 && s.stats.power < 35,
    epitaph: (s) =>
      `Nobody arrested you. Nobody besieged anything. Eleven people had lunch in the Free Zone, and by the end of the week the Council of the Republic had rediscovered a procedure nobody had used since 1961, and by the end of the month you had a pension and a house on the coast.\n\nBy local standards it is an extremely civilised ending. It took ${s.day} days.`,
  },
  {
    id: 'collapse',
    title: 'THE STATE MISSED PAYROLL',
    kind: 'collapse',
    priority: 85,
    check: (s) => s.stats.treasury <= -38 || (s.stats.economy <= 6 && s.stats.treasury < 5),
    epitaph: (s) =>
      `One in six working adults is paid by the state. On the 28th, the state did not pay them.\n\nThere was no coup and no revolution. There was a fortnight in which nothing worked, followed by a four-hour parliamentary session, at the end of which somebody else had your office and your problems.\n\n${s.day} days, and ${money(s.stats.treasury)} in the account.`,
  },
  {
    id: 'fracture',
    title: 'THE PROVINCES STOPPED SENDING THE MONEY',
    kind: 'fracture',
    priority: 80,
    check: (s) => s.hidden.separatism >= 90,
    epitaph: (s) =>
      `There was never a declaration. It was a regional development secretariat, then a regional tax office, then a regional police liaison, and then one morning the Kordiva Basin simply did not send the quarter's tax revenue and nobody in the capital could think of a single thing to do about it.\n\nThe map looks the same. The country does not. ${s.day} days.`,
  },
  {
    id: 'foreign',
    title: 'OSTRENE RAN OUT OF PATIENCE',
    kind: 'foreign',
    priority: 78,
    check: (s) => s.hidden.foreign >= 92,
    epitaph: (s) =>
      `Ostrene did not invade. Ostrene has never needed to invade.\n\nThey stopped buying lithium on the Monday, repriced gas on the Tuesday, and on the Thursday their ambassador scheduled a meeting with four of your ministers that you were not invited to. By the following week there was a new government. It was entirely constitutional and every signature on it was Velmorran.\n\n${s.day} days.`,
  },
  {
    id: 'scandal',
    title: 'THE ARCHIVE OPENED',
    kind: 'elite',
    priority: 75,
    check: (s) =>
      s.hidden.scandal >= 94 &&
      s.stats.legitimacy < 18 &&
      s.scandals.some((x) => !x.buried && x.heat > 45),
    epitaph: (s) =>
      `It was not one thing. It was eleven things, published over nine days, by four outlets that do not normally agree about anything.\n\nParliament approves what it is handed and has done since 1961. It was handed a removal motion, and for the first time in sixty-four years it did something other than approve: it amended it, to make it harsher, and then approved that.\n\n${s.day} days.`,
  },
  {
    id: 'hollow',
    title: 'THE ORDERS STOPPED ARRIVING',
    kind: 'elite',
    priority: 70,
    check: (s) => s.stats.power <= 5,
    epitaph: (s) =>
      `There was no single moment. Orders went out and came back marked for clarification. Meetings happened at times you were not told about. The civil service, which has outlasted nine governments, started routing around you the way water routes around a rock.\n\nYou held the office for ${s.day} days. You were in charge for rather fewer.`,
  },
  {
    id: 'noConfidence',
    title: 'PARLIAMENT WITHDREW ITS CONFIDENCE',
    kind: 'noConfidence',
    priority: 65,
    check: (s) => isActEndDay(s) && !computeConfidenceVote(s).passed,
    epitaph: (s) =>
      `Every act ends with the vote parliament always holds, and this time the numbers were not there.\n\nNobody staged anything. Nobody needed to. Enough of the chamber decided you had stopped being worth the trouble and voted accordingly, in an afternoon, with no drama at all.\n\nYou did not survive the ${ACT_NAMES[s.act - 1] ?? 'latest'} confidence vote, on day ${s.day}.`,
  },
];

/**
 * Endings reached only when a faction's ultimatum runs out and its move
 * against you succeeds (demands.ts → FACTION_MOVES in content/demands.ts).
 * They have no `check`, so checkEndings() never picks them on its own.
 * The Army, Elites and Street moves reuse 'coup', 'elite' and 'revolution'
 * from the list above; these two cover Security and Workers.
 */
export const DEMAND_ENDINGS: EndingDef[] = [
  {
    id: 'sable-removal',
    title: 'THE SABLE OFFICE OPENED YOUR FILE',
    kind: 'elite',
    priority: 0,
    epitaph: (s) =>
      `There was no tank and no crowd. There was a folder, delivered to four ministers at the same time, and a phone call to the army asking it to stay in its barracks. It did.\n\nBy the evening the Council of the Republic had accepted your resignation. You had not written one. Somebody at the Sable Office had, and it was very well drafted.\n\n${s.day} days.`,
  },
  {
    id: 'general-strike',
    title: 'THE COUNTRY STOPPED WORKING',
    kind: 'collapse',
    priority: 0,
    epitaph: (s) =>
      `Hess called a general strike on a Monday. By Wednesday the trains, the mines, the ports and the power stations had stopped. By Friday the Council of the Republic had found someone the unions would talk to, and it was not you.\n\n${s.day} days.`,
  },
];

const SURVIVAL: EndingDef = {
  id: 'survival',
  title: 'PARLIAMENT CONFIRMED YOU',
  kind: 'survival',
  priority: 1,
  epitaph: (s) =>
    `You reached the confirmation vote still holding the job, which — given how you got it, and at four in the morning — is more than anybody in that building expected.\n\nThe clerk's final count confirmed you. Several people who voted for you have since privately told several other people that they were surprised to be doing so.\n\n${s.day} days, and the country is still, recognisably, a country.`,
};

export function checkEndings(
  s: GameState,
  forceEnd = false,
  includeConfidenceVote = true,
): EndingResult | undefined {
  const candidates = ENDINGS
    .filter((e) => includeConfidenceVote || e.id !== 'noConfidence')
    .filter((e) => e.check?.(s))
    .sort((a, b) => b.priority - a.priority);
  const chosen = candidates[0] ?? (forceEnd ? SURVIVAL : undefined);
  if (!chosen) return undefined;
  return endingResult(chosen, s);
}

/** Materialise the already-decided vote failure without running the check a
 *  second time. The reveal consumes its frozen snapshot, not live UI state. */
export function confidenceVoteFailure(s: GameState): EndingResult {
  const chosen = ENDINGS.find((e) => e.id === 'noConfidence');
  if (!chosen) throw new Error('noConfidence ending is not registered');
  return endingResult(chosen, s);
}

/** Fire a specific ending by id — used when a faction's move against you
 *  succeeds (demands.ts). Looks in ENDINGS and DEMAND_ENDINGS. */
export function forcedEnding(s: GameState, id: string): EndingResult | undefined {
  const chosen = [...ENDINGS, ...DEMAND_ENDINGS].find((e) => e.id === id);
  return chosen ? endingResult(chosen, s) : undefined;
}

function endingResult(chosen: EndingDef, s: GameState): EndingResult {
  return {
    id: chosen.id,
    title: chosen.title,
    kind: chosen.kind,
    epitaph: chosen.epitaph(s),
    day: s.day,
    regimeLabel: regimeLabel(s),
    verdict: verdict(s),
  };
}

/** The regime is never chosen. It is named afterwards, from what you actually did. */
export function regimeLabel(s: GameState): string {
  const sorted = [...REGIME_KEYS].sort((a, b) => s.regime[b] - s.regime[a]);
  const [first, second] = sorted;
  const top = s.regime[first];
  if (top < 12) return 'A Caretaker Government';

  const NAMES: Record<string, string> = {
    repression: 'a Security State',
    populism: 'a Populist Government',
    graft: 'a Patronage Machine',
    militarism: 'a Government of the General Staff',
    technocracy: 'a Technocracy',
    reform: 'a Reforming Government',
    patronage: 'a Network of Favours',
    personalism: 'a Personal Regime',
    devolution: 'a Decentralised Republic',
    isolation: 'a Closed Republic',
  };
  const MODIFIER: Record<string, string> = {
    repression: 'watchful',
    populism: 'loud',
    graft: 'expensive',
    militarism: 'uniformed',
    technocracy: 'careful',
    reform: 'earnest',
    patronage: 'well-connected',
    personalism: 'personal',
    devolution: 'loosely-held',
    isolation: 'inward-looking',
  };
  const noun = (NAMES[first] ?? 'a Government').replace(/^an? /, '');
  // The modifier goes after the article: "An Earnest Security State", never
  // "Earnest a Security State" (owner playtest, balance slice B).
  const mod = s.regime[second] > top * 0.55 ? MODIFIER[second] : '';
  const title = (w: string) => w.replace(/(^|-)(\w)/g, (_m, sep: string, c: string) => sep + c.toUpperCase());
  const words = mod ? `${title(mod)} ${noun}` : noun;
  return `${/^[AEIOU]/i.test(words) ? 'An' : 'A'} ${words}`;
}

function verdict(s: GameState): string {
  const bits: string[] = [];

  bits.push(`survived ${s.day} day${s.day === 1 ? '' : 's'}`);
  bits.push(`took ${s.stat.decisions} decisions`);
  if (s.stat.alertsSurvived > 0) bits.push(`got through ${s.stat.alertsSurvived} emergenc${s.stat.alertsSurvived === 1 ? 'y' : 'ies'}`);

  if (s.stat.projectsBuilt.length) bits.push(s.stat.projectsBuilt.slice(0, 2).join(' and '));

  if (s.stat.promisesKept > 0 && s.stat.promisesKept >= s.stat.promisesBroken)
    bits.push(`kept ${s.stat.promisesKept} promise${s.stat.promisesKept === 1 ? '' : 's'}, which in this Republic is a record of sorts`);
  else if (s.stat.promisesBroken > 0)
    bits.push(`broke ${s.stat.promisesBroken} promise${s.stat.promisesBroken === 1 ? '' : 's'}`);

  if (s.stats.treasury < 0) bits.push(`left the account ${money(s.stats.treasury)} short`);
  else if (s.stats.treasury < 8) bits.push('emptied the treasury');
  else if (s.stats.treasury > 70) bits.push('left the treasury fuller than you found it');

  if (s.stat.peopleJailed > 100) bits.push(`detained ${s.stat.peopleJailed} people in a single night`);
  else if (s.stat.peopleJailed > 0) bits.push(`detained ${s.stat.peopleJailed}`);
  if (s.stat.protestsCrushed > 0) bits.push('cleared the Square at least once');
  if (s.stat.ministersLost > 1) bits.push(`lost ${s.stat.ministersLost} ministers`);

  if (s.hidden.cult > 55) bits.push('became, briefly, quite hard to avoid on television');
  if (s.hidden.corruption > 62) bits.push('ran a state that was, by the end, substantially for sale');
  if (s.stats.support > 70) bits.push('left office more popular than you arrived, which nobody predicted');
  else if (s.stats.support < 18) bits.push('was, at the end, disliked with real energy');
  if (s.stats.information < 22) bits.push('governed the last stretch on information that was not true');

  // faction colour
  const loved = FACTION_ORDER.filter((f) => s.factions[f].loyalty > 74);
  const hated = FACTION_ORDER.filter((f) => s.factions[f].loyalty < 16);
  // Use the same short labels the rest of the UI shows (Army, Security, Elites,
  // Workers, Street), not the internal faction record names, so the epitaph
  // never names a group the player has not seen called that anywhere else.
  const fname = (id: (typeof FACTION_ORDER)[number]) =>
    DISPLAY_FACTIONS.find((d) => d.id === id)?.label ?? FACTIONS[id].name.replace(/^The /, 'the ');
  if (loved.length) bits.push(`was genuinely popular with the ${fname(loved[0])}`);
  if (hated.length) bits.push(`was loathed by the ${fname(hated[0])}`);

  if (s.flags.pigeonPatron) bits.push('left you Honorary Patron of the reunified Pigeon Federation');
  else if (s.flags.pigeonFriend) bits.push('is still spoken of warmly in pigeon-racing circles');

  const head = bits.slice(0, -1).join(', ');
  const tail = bits[bits.length - 1];
  return `Your government ${bits.length > 1 ? `${head}, and ${tail}.` : `${tail}.`}`;
}

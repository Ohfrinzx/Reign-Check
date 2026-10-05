import type { GameState } from '../types';
import { makeRng } from '../rng';
import { hasMark, becauseText } from '../consequences';

/**
 * THE 7PM BULLETIN — the daily media mini-game's rules. No React, no DOM
 * (ground rule 11). The UI runs the clock and sends one decision per story.
 *
 * Channel Seven's 7pm news reaches six adults in ten. Tonight's rundown is
 * built from YOUR run: the scandals you are carrying, what you decided in
 * the last two days, and the pressures the front page has been warning
 * about. Each story is on screen for a few seconds. You SPIKE it (pull it
 * from the bulletin) or RUN it. A story you do not touch in time airs.
 *
 *   - A mistake is a damaging story that airs, or a good one you spiked.
 *   - You only have so many spikes: Dmitar Loz, who owns the channel, will
 *     only pull so much. Paying him for coverage earlier buys one more;
 *     threatening his licence costs one.
 *   - You win with at most MISTAKES_ALLOWED mistakes.
 *
 * Same seed and same state → the same rundown, so a reload replays it.
 */

export const MISTAKES_ALLOWED = 2;

export interface Story {
  id: string;
  headline: string;
  /** one short line under the headline; sometimes it is what gives it away */
  dek: string;
  /** true when it would hurt you if it aired */
  bad: boolean;
}

export interface BulletinSetup {
  stories: Story[];
  spikes: number;
  /** seconds each story stays on the desk (the UI may slow this for Reduce Motion) */
  seconds: number;
  /** why Loz is giving you more or fewer spikes, in plain words */
  spikeNote?: string;
}

export type BulletinCall = 'spike' | 'run' | null;

export interface BulletinResult {
  won: boolean;
  mistakes: number;
  badAired: number;
  goodSpiked: number;
  correct: number;
  /** 0..100, for the result text */
  score: number;
}

/* ------------------------------------------------------------ the stories */

/** Fillers: always available, so every night has a full rundown. */
const BAD_FILLER: Omit<Story, 'id'>[] = [
  { headline: 'Who pays for the Chair\'s new car?', dek: 'An armoured limousine, $2 million, ordered the day you took office.', bad: true },
  { headline: 'Clerks paid late again', dek: 'The Grey Floor says the money is "in transit". It has been for nine days.', bad: true },
  { headline: 'Hospital in Mavro runs out of insulin', dek: 'Staff say the order was signed. Nobody can find who signed it.', bad: true },
  { headline: 'Minister\'s son wins port contract', dek: 'The tender was open for four hours, on a Sunday.', bad: true },
  { headline: 'Gas price up for the third week', dek: 'Ostrene raised it again. Families in Sarnica are heating one room.', bad: true },
  { headline: 'Interview: "I voted for change"', dek: 'A pensioner in Kordiva explains, at length, what she got instead.', bad: true },
  { headline: 'Palace staff party filmed', dek: 'Someone brought a camera. Someone else brought the national liqueur.', bad: true },
  { headline: 'A quiet word from Ostrene', dek: 'Their ambassador says your government "lacks a firm hand". On air.', bad: true },
];

const GOOD_FILLER: Omit<Story, 'id'>[] = [
  { headline: 'Kordiva harvest best in ten years', dek: 'Grain stores are full. Bread prices should fall by spring.', bad: false },
  { headline: 'Mavro port traffic up 6%', dek: 'Three landlocked neighbours are shipping through Velmorra again.', bad: false },
  { headline: 'Pigeon Federation sets a record', dek: '400 birds home from Ostrene in one day. The Chair sent a telegram.', bad: false },
  { headline: 'New school opens in the Gorsk highlands', dek: 'The first in the valley since 1961. The miners built the roof.', bad: false },
  { headline: 'Dovra Day route announced', dek: 'The Chair will walk the last kilometre, as tradition demands.', bad: false },
  { headline: 'Lithium price holds steady', dek: 'The buyer tried to cut it. This time it did not work.', bad: false },
  { headline: 'Sarnica trams back on time', dek: 'For the first time since March. Commuters are suspicious.', bad: false },
  { headline: 'Velmorra beat Drovna 2–0', dek: 'The national team won away. The Chair watched the whole match.', bad: false },
];

/** Stories that look one way from the headline and the other from the line under it. */
const TWISTS: Omit<Story, 'id'>[] = [
  { headline: 'Minister speaks to the press', dek: '…about the $40 million missing from the customs account.', bad: true },
  { headline: 'Record crowds in Sarnica', dek: '…outside the bread depot, where the shelves are empty.', bad: true },
  { headline: 'Army announces new exercises', dek: '…in the capital, at night, without telling the Palace.', bad: true },
  { headline: 'Strike at the Gorsk mines', dek: '…called off after a deal. The miners are back underground.', bad: false },
  { headline: 'Opposition leader on the attack', dek: '…against Drovna\'s radio station, siding with the government.', bad: false },
  { headline: 'Audit of the Free Zone', dek: '…finds the books in order, to everyone\'s surprise.', bad: false },
];

/** What the front page has been warning about, as tonight's news. */
const PRESSURE_STORIES: { key: keyof GameState['hidden']; at: number; story: Omit<Story, 'id'> }[] = [
  { key: 'unrest', at: 45, story: { headline: 'Bread queues on the east side', dek: 'Some formed at four in the morning. Police watched from across the road.', bad: true } },
  { key: 'coup', at: 45, story: { headline: 'Officers seen at late meetings', dek: 'Three commands, one restaurant, no explanation.', bad: true } },
  { key: 'fiscal', at: 45, story: { headline: 'Can the state pay on the 28th?', dek: 'The Finance Ministry would not say yes. It would not say no.', bad: true } },
  { key: 'leak', at: 45, story: { headline: 'Leaked memo goes round the ministries', dek: 'It is about you. It is not kind.', bad: true } },
  { key: 'separatism', at: 45, story: { headline: 'Hadem radio calls for a strike', dek: 'Drovna\'s station is telling the border towns to stay home.', bad: true } },
  { key: 'foreign', at: 45, story: { headline: 'Aureth delays its loan talks', dek: '"Concerns about governance," says their envoy.', bad: true } },
];

function shorten(text: string, max = 80): string {
  const first = text.split('\n')[0].replace(/\s+/g, ' ').trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** Number of stories by act: the rundown gets longer as the run goes on. */
export function rundownLength(act: number): number {
  return act <= 1 ? 8 : act === 2 ? 9 : 10;
}

/** Tonight's rundown, built from this run. Pure: same state + seed → same rundown. */
export function bulletinSetup(s: GameState, seed: number): BulletinSetup {
  const rng = makeRng(seed);
  const n = rundownLength(s.act);
  const bad: Omit<Story, 'id'>[] = [];
  const good: Omit<Story, 'id'>[] = [];

  // 1. Your scandals lead the news.
  for (const sc of [...s.scandals].sort((a, b) => b.heat - a.heat).slice(0, 2)) {
    bad.push({ headline: `New questions: ${sc.name}`, dek: shorten(sc.detail), bad: true });
  }
  // 2. What you decided in the last two days.
  const recent = s.log.filter((l) => l.day >= s.day - 1 && l.kind === 'decision');
  for (const l of rng.shuffle([...recent]).slice(0, 3)) {
    if (l.tone === 'bad') bad.push({ headline: `Anger over "${l.title}"`, dek: 'Callers have been ringing the studio all afternoon.', bad: true });
    else if (l.tone === 'good') good.push({ headline: `Praise for "${l.title}"`, dek: 'Even the opposition paper called it sensible.', bad: false });
  }
  // 3. Projects you finished are good news.
  for (const p of s.stat.projectsBuilt.slice(-1)) {
    good.push({ headline: `Opened: ${p}`, dek: 'Built on time, which nobody in Velmorra can remember happening before.', bad: false });
  }
  // 4. The pressures the front page has been warning about.
  for (const p of PRESSURE_STORIES) if (s.hidden[p.key] >= p.at) bad.push(p.story);

  // Fill to the night's length: about half the rundown is damaging, with a
  // twist or two that you have to read the second line of to judge.
  const wantBad = Math.ceil(n / 2);
  const twists = rng.shuffle([...TWISTS]).slice(0, s.act >= 2 ? 2 : 1);
  const pickedBad = rng.shuffle(bad).slice(0, wantBad - twists.filter((t) => t.bad).length);
  const fillBad = rng.shuffle([...BAD_FILLER]);
  while (pickedBad.length + twists.filter((t) => t.bad).length < wantBad && fillBad.length) pickedBad.push(fillBad.pop()!);
  const wantGood = n - pickedBad.length - twists.length;
  const pickedGood = rng.shuffle(good).slice(0, wantGood);
  const fillGood = rng.shuffle([...GOOD_FILLER]);
  while (pickedGood.length < wantGood && fillGood.length) pickedGood.push(fillGood.pop()!);

  const all = rng.shuffle([...pickedBad, ...pickedGood, ...twists]).slice(0, n);
  // Never open on a twist: the first story teaches the rules.
  const firstPlain = all.findIndex((x) => !TWISTS.includes(x));
  if (firstPlain > 0) [all[0], all[firstPlain]] = [all[firstPlain], all[0]];
  const stories = all.map((x, i) => ({ ...x, id: `st${i + 1}` }));

  const badCount = stories.filter((x) => x.bad).length;
  let spikes = badCount;
  let spikeNote: string | undefined;
  if (hasMark(s, 'bought-news')) { spikes += 1; spikeNote = `Loz will pull one extra story. ${becauseText(s, 'bought-news')}.`; }
  else if (hasMark(s, 'threatened-loz')) { spikes -= 1; spikeNote = `Loz will pull one story fewer. ${becauseText(s, 'threatened-loz')}.`; }

  return { stories, spikes, seconds: s.act <= 1 ? 7 : s.act === 2 ? 6.5 : 6, ...(spikeNote ? { spikeNote } : {}) };
}

/** Judge a finished bulletin. `calls[i]` is the call on story i (null = it aired). */
export function scoreBulletin(setup: BulletinSetup, calls: BulletinCall[]): BulletinResult {
  let badAired = 0, goodSpiked = 0, correct = 0;
  setup.stories.forEach((st, i) => {
    const spiked = calls[i] === 'spike';
    if (st.bad && !spiked) badAired += 1;
    else if (!st.bad && spiked) goodSpiked += 1;
    else correct += 1;
  });
  const mistakes = badAired + goodSpiked;
  return {
    won: mistakes <= MISTAKES_ALLOWED,
    mistakes, badAired, goodSpiked, correct,
    score: Math.round((correct / Math.max(1, setup.stories.length)) * 100),
  };
}

/** How many spikes are left after these calls. */
export function spikesLeft(setup: BulletinSetup, calls: BulletinCall[]): number {
  return setup.spikes - calls.filter((c) => c === 'spike').length;
}

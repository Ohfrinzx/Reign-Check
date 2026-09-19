import type { GameState, FactionId, HiddenKey } from './types';
import { FACTIONS, FACTION_ORDER, CHARACTER_MAP } from './content/country';
import { STAGE_META, lookupCard, alertPressure } from './engine';
import { band } from './stats';

export interface BriefingItem {
  kind: 'issue' | 'warning' | 'opportunity' | 'demand' | 'pending' | 'hint';
  text: string;
  source?: string;
  severity?: 1 | 2 | 3;
}

export interface Briefing {
  day: number;
  dateLine: string;
  weather: string;
  agenda: { label: string; time: string; blurb: string }[];
  items: BriefingItem[];
  threatLevel: 'quiet' | 'watchful' | 'tense' | 'critical';
  threatNote: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Velmorra's own calendar, because a fictional country deserves one. */
export function dateLine(day: number): string {
  const d = 3 + day;
  const monthIndex = Math.floor((d - 1) / 30) % 12;
  const dayOfMonth = ((d - 1) % 30) + 1;
  return `${MONTHS[monthIndex]} ${dayOfMonth}`;
}

const WEATHER = [
  'Rain in the capital. Ninth day running. People have opinions about this.',
  'Rain in the capital. It is being discussed on television.',
  'Cloudy, no rain. The press office is treating this as a win.',
  'Clear over the capital. Nobody trusts it.',
  'Rain in the farm belt, clear on the coast, which is the wrong way round.',
  'Fog at Mavro. Two ships waiting to dock.',
  'Cold snap in Gorsk. Gas demand up nine per cent.',
  'Heavy rain. The Ninth District is flooded again.',
];

/** Warning signs, in the player's language. Never raw numbers. */
const WARNINGS: { key: HiddenKey; at: number; sev: 1 | 2 | 3; text: string; source: string }[] = [
  { key: 'coup', at: 30, sev: 1, source: 'Security', text: 'Officers from three different commands have been meeting socially. Probably nothing.' },
  { key: 'coup', at: 52, sev: 2, source: 'Security', text: 'Officers from three commands are meeting outside their chain of command. It is no longer probably nothing.' },
  { key: 'coup', at: 72, sev: 3, source: 'Security', text: 'A decision has been taken somewhere in the officer corps. We do not yet know what it was.' },
  { key: 'unrest', at: 32, sev: 1, source: 'Interior', text: 'Three unauthorised gatherings this week. All small. All in the same four streets.' },
  { key: 'unrest', at: 55, sev: 2, source: 'Interior', text: 'The main square has been filling in the evenings with no organiser. This is how it always starts.' },
  { key: 'unrest', at: 75, sev: 3, source: 'Interior', text: 'The capital is one incident away from a crowd nobody can count.' },
  { key: 'scandal', at: 35, sev: 1, source: 'Press office', text: 'Two outlets are working on the same story. They are not the two that usually work together.' },
  { key: 'scandal', at: 58, sev: 2, source: 'Press office', text: 'The story has a name now, and people use the name without explaining it, which means everybody knows it.' },
  { key: 'scandal', at: 78, sev: 3, source: 'Press office', text: 'There is enough material in circulation to bring down a government, and it is no longer clear who is holding it.' },
  { key: 'leak', at: 38, sev: 1, source: 'Ministries', text: 'Documents are leaving the building. Not many. The wrong ones.' },
  { key: 'leak', at: 62, sev: 2, source: 'Ministries', text: 'Internal paperwork is being quoted word for word by people who should not have it.' },
  { key: 'fiscal', at: 38, sev: 1, source: 'Finance', text: 'Brask has asked for eleven minutes. He never asks for eleven minutes about good news.' },
  { key: 'fiscal', at: 60, sev: 2, source: 'Finance', text: 'The currency peg is being described internally as "under review", which is the word used just before "gone".' },
  { key: 'fiscal', at: 80, sev: 3, source: 'Finance', text: 'Payroll on the 28th is not currently funded.' },
  { key: 'foreign', at: 35, sev: 1, source: 'Foreign ministry', text: 'The Ostrene ambassador has asked for nothing this week, which he has never done.' },
  { key: 'foreign', at: 62, sev: 2, source: 'Foreign ministry', text: 'Ostrene officials are talking to your ministers directly, not through the ministry.' },
  { key: 'separatism', at: 35, sev: 1, source: 'Interior', text: 'The Kordiva Basin Council has put items on its own agenda that are legally the capital\'s business.' },
  { key: 'separatism', at: 62, sev: 2, source: 'Interior', text: 'Two provinces are late sending tax revenue. Both cite "collection difficulties". Neither has collection difficulties.' },
  { key: 'corruption', at: 48, sev: 1, source: 'Ministries', text: 'Free Zone transfers are unusually busy for a quarter with nothing scheduled.' },
  { key: 'fear', at: 55, sev: 2, source: 'Chief of staff', text: 'People have stopped disagreeing with you in meetings. Doran raises this as a problem, not a compliment.' },
  { key: 'cult', at: 55, sev: 1, source: 'Press office', text: 'Coverage of you has become uniformly positive, which is now itself the story in three outlets.' },
];

export function buildBriefing(s: GameState): Briefing {
  const items: BriefingItem[] = [];

  /* --- live issues the player already knows about */
  for (const sc of s.scandals) {
    if (sc.heat < 10) continue;
    items.push({
      kind: 'issue',
      source: 'Press Office',
      text: `${sc.name}: ${sc.detail}`,
      severity: sc.heat > 55 ? 3 : sc.heat > 30 ? 2 : 1,
    });
  }
  for (const p of s.projects) {
    items.push({
      kind: 'pending',
      source: 'National Development',
      text: `${p.name} — ${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} remaining. ${p.detail}`,
    });
  }
  for (const d of s.scheduled.filter((x) => x.visible).slice(0, 4)) {
    items.push({
      kind: 'pending',
      source: 'Diary',
      text: `Day ${d.day}: ${d.label}`,
    });
  }
  for (const pr of s.promises.filter((p) => !p.kept && !p.broken)) {
    const who = FACTIONS[pr.to as FactionId]?.name ?? CHARACTER_MAP[pr.to]?.name ?? pr.to;
    items.push({
      kind: 'demand',
      source: who,
      text: `Promised: ${pr.text}. Expected by day ${pr.dueDay}.`,
      severity: s.day >= pr.dueDay ? 3 : s.day >= pr.dueDay - 2 ? 2 : 1,
    });
  }

  /* --- factions with something to say */
  for (const id of FACTION_ORDER) {
    const f = s.factions[id];
    const def = FACTIONS[id];
    if (f.patience < 30) {
      items.push({
        kind: 'demand', source: def.name, severity: f.patience < 16 ? 3 : 2,
        text: `${def.name} ${f.patience < 16 ? 'has run out of patience' : 'is losing patience'}. ${def.redLine}`,
      });
    } else if (f.loyalty < 30) {
      items.push({
        kind: 'warning', source: def.name, severity: 2,
        text: `${def.name}: support is ${band(f.loyalty)}. ${def.threat}`,
      });
    }
  }

  /* --- intelligence warnings derived from hidden state */
  const byKey = new Map<HiddenKey, BriefingItem>();
  for (const w of WARNINGS) {
    if (s.hidden[w.key] < w.at) continue;
    // information quality degrades what you are told
    if (s.stats.information < 35 && w.sev < 3) continue;
    byKey.set(w.key, { kind: 'warning', text: w.text, source: w.source, severity: w.sev });
  }
  items.push(...byKey.values());

  /* --- opportunities */
  if (s.stats.treasury > 60) items.push({ kind: 'opportunity', source: 'Finance', text: 'The treasury can take on a large commitment right now without a fight.' });
  if (s.stats.support > 68) items.push({ kind: 'opportunity', source: 'Press office', text: 'You are popular enough this week to survive doing something unpopular.' });
  if (s.factions.staff.loyalty > 72) items.push({ kind: 'opportunity', source: 'Army', text: 'The army would currently carry out an order it did not like.' });
  if (s.stats.information > 72) items.push({ kind: 'opportunity', source: 'Security', text: 'Your information is unusually good right now. Use it before it goes stale.' });
  if (s.factions.chorus.loyalty > 62) items.push({ kind: 'opportunity', source: 'Press office', text: 'The press is briefly on your side. That is a window, not a situation.' });

  /* --- one or two hints about what today may become */
  const hints = buildHints(s);
  items.push(...hints);

  const pressure = alertPressure(s);
  const threatLevel: Briefing['threatLevel'] =
    pressure > 160 ? 'critical' : pressure > 90 ? 'tense' : pressure > 35 ? 'watchful' : 'quiet';

  return {
    day: s.day,
    dateLine: dateLine(s.day),
    weather: WEATHER[(s.day * 7 + s.seed) % WEATHER.length],
    agenda: s.agenda.map((k) => STAGE_META[k]),
    items,
    threatLevel,
    threatNote: THREAT_NOTE[threatLevel],
  };
}

const THREAT_NOTE: Record<Briefing['threatLevel'], string> = {
  quiet: 'Nothing urgent on the board. Historically, this is when things happen.',
  watchful: 'A few situations are warming up. Security expects a normal day.',
  tense: 'More than one situation could interrupt today without warning.',
  critical: 'Security advises that today will probably not follow the schedule.',
};

/** Hints are honest but non-specific: they tell the player where to look. */
function buildHints(s: GameState): BriefingItem[] {
  const out: BriefingItem[] = [];
  const deck = s.todayDeck.map((id) => lookupCard(id)).filter(Boolean);

  const actors = new Set<string>();
  for (const c of deck) if (c?.actor) actors.add(c.actor);
  const names = [...actors].map((a) => CHARACTER_MAP[a]?.name).filter(Boolean);
  if (names.length) {
    out.push({
      kind: 'hint', source: 'Diary',
      text: `On the schedule today: ${names.slice(0, 3).join(', ')}.`,
    });
  }

  const cats = new Set(deck.map((c) => c?.category));
  if (cats.has('crisis')) out.push({ kind: 'hint', source: 'Chief of staff', text: 'Doran has cleared an hour this afternoon "in case". She does not do that for nothing.' });
  if (cats.has('foreign')) out.push({ kind: 'hint', source: 'Foreign ministry', text: 'There is something foreign on today\'s schedule that the ministry has not fully briefed you on.' });
  if (cats.has('scandal')) out.push({ kind: 'hint', source: 'Press office', text: 'The press office wants to know whether you would rather take questions today or not.' });

  return out;
}

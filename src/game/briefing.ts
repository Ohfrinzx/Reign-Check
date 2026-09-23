import type { GameState, FactionId, HiddenKey } from './types';
import { FACTIONS, FACTION_ORDER, CHARACTER_MAP } from './content/country';
import { DISPLAY_FACTIONS } from './display';
import { STAGE_META, lookupCard, alertPressure } from './engine';
import { band } from './stats';
import { DEMAND_MAP } from './content/demands';
import { STAGE_LABEL, hostileActionToday } from './demands';
import { characterWarnings } from './characterEvents';
import { crisisBriefing } from './crises';

export interface BriefingItem {
  kind: 'issue' | 'warning' | 'opportunity' | 'demand' | 'pending' | 'hint';
  /** short, active-voice header for threat-card display, e.g. "THE UNIONS ARE COUNTING" */
  headline: string;
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
const WARNINGS: { key: HiddenKey; at: number; sev: 1 | 2 | 3; head: string; text: string; source: string }[] = [
  { key: 'coup', at: 30, sev: 1, source: 'Security', head: 'Officers are meeting', text: 'Officers from three different commands have been meeting socially. Probably nothing.' },
  { key: 'coup', at: 52, sev: 2, source: 'Security', head: 'The army is talking', text: 'Officers from three commands are meeting outside their chain of command. It is no longer probably nothing.' },
  { key: 'coup', at: 72, sev: 3, source: 'Security', head: 'A decision has been made', text: 'A decision has been taken somewhere in the officer corps. We do not yet know what it was.' },
  { key: 'unrest', at: 32, sev: 1, source: 'Interior', head: 'Small crowds are forming', text: 'Three unauthorised gatherings this week. All small. All in the same four streets.' },
  { key: 'unrest', at: 55, sev: 2, source: 'Interior', head: 'The square is filling', text: 'The main square has been filling in the evenings with no organiser. This is how it always starts.' },
  { key: 'unrest', at: 75, sev: 3, source: 'Interior', head: 'The capital could erupt', text: 'The capital is one incident away from a crowd nobody can count.' },
  { key: 'scandal', at: 35, sev: 1, source: 'Press office', head: 'Reporters are digging', text: 'Two outlets are working on the same story. They are not the two that usually work together.' },
  { key: 'scandal', at: 58, sev: 2, source: 'Press office', head: 'The story has a name', text: 'The story has a name now, and people use the name without explaining it, which means everybody knows it.' },
  { key: 'scandal', at: 78, sev: 3, source: 'Press office', head: 'The scandal is out of control', text: 'There is enough material in circulation to bring down a government, and it is no longer clear who is holding it.' },
  { key: 'leak', at: 38, sev: 1, source: 'Ministries', head: 'Papers are leaving the building', text: 'Documents are leaving the building. Not many. The wrong ones.' },
  { key: 'leak', at: 62, sev: 2, source: 'Ministries', head: 'Your paperwork is public', text: 'Internal paperwork is being quoted word for word by people who should not have it.' },
  { key: 'fiscal', at: 38, sev: 1, source: 'Finance', head: 'Brask wants eleven minutes', text: 'Brask has asked for eleven minutes. He never asks for eleven minutes about good news.' },
  { key: 'fiscal', at: 60, sev: 2, source: 'Finance', head: 'The currency is at risk', text: 'The currency peg — the fixed exchange rate the government has been defending — is being described internally as "under review", which is the word used just before "gone".' },
  { key: 'fiscal', at: 80, sev: 3, source: 'Finance', head: 'Payroll is not funded', text: 'Payroll on the 28th — the day the government pays every state worker — is not currently funded.' },
  { key: 'foreign', at: 35, sev: 1, source: 'Foreign ministry', head: 'Ostrene has gone quiet', text: 'The Ostrene ambassador has asked for nothing this week, which he has never done.' },
  { key: 'foreign', at: 62, sev: 2, source: 'Foreign ministry', head: 'Ostrene is going around you', text: 'Ostrene officials are talking to your ministers directly, not through the ministry.' },
  { key: 'separatism', at: 35, sev: 1, source: 'Interior', head: 'Kordiva is overstepping', text: 'The Kordiva Basin Council has put items on its own agenda that are legally the capital\'s business.' },
  { key: 'separatism', at: 62, sev: 2, source: 'Interior', head: 'Provinces are withholding money', text: 'Two provinces are late sending tax revenue. Both cite "collection difficulties". Neither has collection difficulties.' },
  { key: 'corruption', at: 48, sev: 1, source: 'Ministries', head: 'Money is moving oddly', text: 'Free Zone transfers are unusually busy for a quarter with nothing scheduled.' },
  { key: 'fear', at: 55, sev: 2, source: 'Chief of staff', head: 'Nobody argues with you anymore', text: 'People have stopped disagreeing with you in meetings. Doran raises this as a problem, not a compliment.' },
  { key: 'cult', at: 55, sev: 1, source: 'Press office', head: 'Coverage is suspiciously kind', text: 'Coverage of you has become uniformly positive, which is now itself the story in three outlets.' },
];

export function buildBriefing(s: GameState): Briefing {
  const items: BriefingItem[] = [];

  /* --- live issues the player already knows about */
  for (const sc of s.scandals) {
    if (sc.heat < 10) continue;
    items.push({
      kind: 'issue',
      source: 'Press Office',
      headline: sc.name,
      text: sc.detail,
      severity: sc.heat > 55 ? 3 : sc.heat > 30 ? 2 : 1,
    });
  }
  for (const p of s.projects) {
    items.push({
      kind: 'pending',
      source: 'National Development',
      headline: p.name,
      text: `${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} left. ${p.detail}`,
    });
  }
  for (const d of s.scheduled.filter((x) => x.visible).slice(0, 4)) {
    items.push({
      kind: 'pending',
      source: 'Diary',
      headline: `Day ${d.day}`,
      text: d.label,
    });
  }
  for (const pr of s.promises.filter((p) => !p.kept && !p.broken)) {
    const who = DISPLAY_FACTIONS.find((d) => d.id === pr.to)?.label ?? FACTIONS[pr.to as FactionId]?.name ?? CHARACTER_MAP[pr.to]?.name ?? pr.to;
    items.push({
      kind: 'demand',
      source: who,
      headline: `A promise is due`,
      text: `You promised: ${pr.text}. Expected by day ${pr.dueDay}.`,
      severity: s.day >= pr.dueDay ? 3 : s.day >= pr.dueDay - 2 ? 2 : 1,
    });
  }

  /* --- factions with something to say */
  for (const id of FACTION_ORDER) {
    const f = s.factions[id];
    const def = FACTIONS[id];
    // Colon form deliberately, not "X is/are out of patience": the short
    // display labels mix singular (Army, Security) and plural/collective (Elites,
    // (Workers, Street) nouns, so a fixed verb reads wrong for half of them.
    const shortName = DISPLAY_FACTIONS.find((d) => d.id === id)?.label ?? def.name;
    // A live demand replaces the vague "patience" line with the real ask.
    // Kind 'issue' (front page only) rather than 'demand', so it does not
    // repeat in the rail's threat cards — the Demands panel already has it.
    const live = f.demand && DEMAND_MAP[f.demand.id];
    // Balance slice B: a hostile faction did something to you this morning.
    const act = hostileActionToday(s, id);
    if (act) {
      items.push({
        kind: 'warning', source: shortName, severity: 3,
        headline: `${shortName}: working against you — ${act.title}`,
        text: `${act.text} This happens every morning while the ${shortName} are hostile. Win them back to stop it: meet their demand, or side with them.`,
      });
    }
    if (f.demand && live) {
      items.push({
        kind: 'issue', source: shortName,
        severity: f.demand.severity === 'ultimatum' ? 3 : f.demand.severity === 'formal' ? 2 : 1,
        headline: `${STAGE_LABEL[f.demand.severity]}: ${live.title}`,
        text: `${live.ask} Due by day ${f.demand.dueDay}. Open it from the Demands panel.`,
      });
    } else if (f.patience < 30) {
      items.push({
        kind: 'demand', source: shortName, severity: f.patience < 16 ? 3 : 2,
        headline: f.patience < 16 ? `${shortName}: out of patience` : `${shortName}: patience running out`,
        text: def.redLine,
      });
    } else if (f.loyalty < 30 && !act) {
      items.push({
        kind: 'warning', source: shortName, severity: 2,
        headline: `${shortName}: turning against you`,
        text: `Support is ${band(f.loyalty)}. ${def.threat}`,
      });
    }
  }

  /* --- the crisis chain running now (Phase 3 step 3) */
  const cb = crisisBriefing(s);
  if (cb) items.push({ kind: 'warning', source: 'Crisis', severity: cb.severity, headline: cb.headline, text: cb.text });

  /* --- characters losing faith in you (Phase 3 step 2). Plain words only;
   * a character's betrayal can never arrive the same morning this first shows. */
  for (const w of characterWarnings(s)) {
    const name = CHARACTER_MAP[w.character]?.name ?? w.character;
    items.push({
      kind: 'warning', source: name, severity: w.turning ? 2 : 1,
      headline: w.turning ? `${name} may act on their own` : `${name} is losing faith in you`,
      text: w.text,
    });
  }

  /* --- intelligence warnings derived from hidden state */
  const byKey = new Map<HiddenKey, BriefingItem>();
  for (const w of WARNINGS) {
    if (s.hidden[w.key] < w.at) continue;
    // information quality degrades what you are told
    if (s.stats.information < 35 && w.sev < 3) continue;
    byKey.set(w.key, { kind: 'warning', headline: w.head, text: w.text, source: w.source, severity: w.sev });
  }
  items.push(...byKey.values());

  /* --- opportunities */
  if (s.stats.treasury > 60) items.push({ kind: 'opportunity', source: 'Finance', headline: 'Money to spend', text: 'The treasury can take on a large commitment right now without a fight.' });
  if (s.stats.support > 68) items.push({ kind: 'opportunity', source: 'Press office', headline: 'The public is with you', text: 'You are popular enough this week to survive doing something unpopular.' });
  if (s.factions.staff.loyalty > 72) items.push({ kind: 'opportunity', source: 'Army', headline: 'The army trusts you', text: 'The army would currently carry out an order it did not like.' });
  if (s.stats.information > 72) items.push({ kind: 'opportunity', source: 'Security', headline: 'You know what is happening', text: 'Your information is unusually good right now. Use it before it goes stale.' });
  if (s.factions.chorus.loyalty > 62) items.push({ kind: 'opportunity', source: 'Press office', headline: 'The press is on side', text: 'The press is briefly on your side. That is a window, not a situation.' });

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

/* --------------------------------------------------------- threat cards */

export interface ThreatCard {
  headline: string;
  body: string;
  source?: string;
  severity: 1 | 2 | 3;
}

/**
 * The handful of items shown "on the desk" as physical threat cards, in the
 * Poster UI. Reuses buildBriefing's own severity-ranked warnings/demands so
 * there is exactly one source of truth for what counts as a live threat.
 */
export function buildThreats(s: GameState, max = 3): ThreatCard[] {
  const items = buildBriefing(s).items.filter(
    (i): i is BriefingItem & { severity: 1 | 2 | 3 } =>
      (i.kind === 'warning' || i.kind === 'demand') && i.severity !== undefined,
  );
  items.sort((a, b) => b.severity - a.severity);
  return items.slice(0, max).map((i) => ({
    headline: i.headline, body: i.text, source: i.source, severity: i.severity,
  }));
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
      kind: 'hint', source: 'Diary', headline: 'On today\'s schedule',
      text: names.slice(0, 3).join(', '),
    });
  }

  const cats = new Set(deck.map((c) => c?.category));
  if (cats.has('crisis')) out.push({ kind: 'hint', source: 'Chief of staff', headline: 'Doran has cleared an hour', text: 'She has kept the afternoon free "in case". She does not do that for nothing.' });
  if (cats.has('foreign')) out.push({ kind: 'hint', source: 'Foreign ministry', headline: 'A foreign matter today', text: 'Something foreign is on today\'s schedule that the ministry has not fully briefed you on.' });
  if (cats.has('scandal')) out.push({ kind: 'hint', source: 'Press office', headline: 'The press office is asking', text: 'They want to know whether you would rather take questions today or not.' });

  return out;
}

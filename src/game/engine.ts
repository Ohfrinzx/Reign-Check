import type {
  GameState, CardDef, AlertDef, StageKind, Rng, CardOutcome, Stats, DaySummary, FactionId,
} from './types';
import { STAT_KEYS } from './types';
import { makeRng } from './rng';
import { applyEffects } from './effects';
import { CARDS, CARD_MAP } from './content/cards';
import { CARDS2 } from './content/cards2';
import { FOLLOWUPS } from './content/followups';
import { ALERTS, ALERT_MAP } from './content/alerts';
import { FACTION_ORDER, FACTIONS, CHARACTER_MAP } from './content/country';
import { clampStat } from './stats';
import { checkEndings } from './content/endings';
import { computeBudget } from './economy';
import { NUM_ACTS, isActEndDay } from './state';

/* ------------------------------------------------------------- registries */

const ALL_CARDS: CardDef[] = [...CARDS, ...CARDS2, ...FOLLOWUPS];
export const ALL_CARD_MAP: Record<string, CardDef> = {
  ...CARD_MAP,
  ...Object.fromEntries(CARDS2.map((c) => [c.id, c])),
  ...Object.fromEntries(FOLLOWUPS.map((c) => [c.id, c])),
};

/** Alerts are cards too, as far as the UI is concerned. */
export function lookupCard(id: string): CardDef | undefined {
  return ALL_CARD_MAP[id] ?? (ALERT_MAP[id] as CardDef | undefined);
}

/* ----------------------------------------------------------------- utils */

function clone<T>(v: T): T {
  return structuredClone(v);
}

function withRng<T>(s: GameState, fn: (rng: Rng) => T): T {
  const rng = makeRng(s.rngState);
  const out = fn(rng);
  s.rngState = rng.state();
  return out;
}

/* --------------------------------------------------------- day scheduling */

const STAGE_POOL: StageKind[] = ['government', 'politics', 'development', 'afternoon'];

export const STAGE_META: Record<StageKind, { label: string; time: string; blurb: string }> = {
  briefing:    { label: 'Morning Briefing',    time: '07:00', blurb: 'The dossier, the numbers, and whatever the night produced.' },
  government:  { label: 'Government Business', time: '09:30', blurb: 'Ministries, money, and things that must be signed.' },
  politics:    { label: 'Political Business',  time: '12:00', blurb: 'People who want something, and will not say what.' },
  development: { label: 'National Development',time: '14:30', blurb: 'The country itself: roads, shafts, ports, weather.' },
  afternoon:   { label: 'Afternoon Session',   time: '16:45', blurb: 'Whatever the day has decided to become.' },
  night:       { label: 'Nightly Review',      time: '22:30', blurb: 'What today cost, and what it set in motion.' },
};

/** Days vary in shape: some are short and calm, some are long and awful. */
function buildAgenda(s: GameState, rng: Rng): StageKind[] {
  const pressure =
    (s.hidden.unrest + s.hidden.coup + s.hidden.scandal + s.hidden.fiscal) / 4;
  const min = pressure > 45 ? 4 : 3;
  const extra = rng.chance(0.45 + pressure / 220) ? 1 : 0;
  const count = Math.min(5, min + extra);

  const pool = rng.shuffle([...STAGE_POOL]);
  const agenda: StageKind[] = [];
  for (let i = 0; i < count; i++) agenda.push(pool[i % pool.length]);
  // Government business is always first when it appears; it is the boring, load-bearing part.
  agenda.sort((a, b) => STAGE_POOL.indexOf(a) - STAGE_POOL.indexOf(b));
  return agenda;
}

function cardWeight(s: GameState, c: CardDef): number {
  let w = c.weight ? c.weight(s) : (c.base ?? 5);
  if (w <= 0) return 0;
  if (c.minDay && s.day < c.minDay) return 0;
  if (c.once && s.seenOnce.includes(c.id)) return 0;
  if (c.requires && !c.requires(s)) return 0;
  // recency: a card seen recently is unlikely to come straight back
  const last = s.flags[`lastSeen:${c.id}`];
  if (last !== undefined) {
    const gap = s.day - last;
    if (gap <= 3) return 0;
    if (gap <= 6) w *= 0.18;
    else if (gap <= 10) w *= 0.55;
  }
  return Math.max(0, w);
}

function drawDeck(s: GameState, rng: Rng): string[] {
  const deck: string[] = [];

  // 1. cards explicitly queued for today by earlier decisions
  const due = s.queued.filter((q) => q.day <= s.day);
  s.queued = s.queued.filter((q) => q.day > s.day);
  for (const q of due) {
    if (lookupCard(q.cardId) && !deck.includes(q.cardId)) deck.push(q.cardId);
  }

  // 2. fill the rest by weighted draw
  const slots = s.agenda.length;
  const used = new Set(deck);
  let guard = 0;
  while (deck.length < slots && guard++ < 60) {
    const stage = s.agenda[deck.length];
    const pool = ALL_CARDS.filter(
      (c) => !used.has(c.id) && (!c.stages || c.stages.includes(stage)) && cardWeight(s, c) > 0,
    );
    const pick = rng.weighted(pool, (c) => cardWeight(s, c));
    if (!pick) break;
    deck.push(pick.id);
    used.add(pick.id);
  }

  // 3. if the world is so quiet nothing qualifies, shorten the day
  if (deck.length < s.agenda.length) s.agenda = s.agenda.slice(0, Math.max(1, deck.length));
  return deck;
}

/* -------------------------------------------------- start-of-day upkeep */

function dayUpkeep(s: GameState, rng: Rng) {
  const notes: string[] = [];

  // --- scheduled consequences land first. This is the engine's whole point.
  const firing = s.scheduled.filter((d) => d.day <= s.day);
  s.scheduled = s.scheduled.filter((d) => d.day > s.day);
  for (const d of firing) {
    if (d.requiresFlag && !s.flags[d.requiresFlag]) continue;
    if (d.cardId && lookupCard(d.cardId)) {
      s.queued.push({ cardId: d.cardId, day: s.day });
    }
    if (d.effects) {
      const delta = applyEffects(s, d.effects, rng, 'scheduled');
      s.log.push({
        day: s.day, kind: 'consequence', title: 'Consequence',
        text: d.label, tone: toneFromDelta(delta),
      });
      notes.push(d.label);
    } else if (d.cardId) {
      notes.push(d.label);
    }
  }

  // --- projects tick
  for (const p of [...s.projects]) {
    p.daysLeft -= 1;
    if (p.upkeep) s.stats.treasury = clampStat('treasury', s.stats.treasury - p.upkeep);
    if (p.daysLeft <= 0) {
      applyEffects(s, p.onComplete, rng, 'project');
      s.stat.projectsBuilt.push(p.legacy ?? p.name);
      s.log.push({ day: s.day, kind: 'event', title: `Completed: ${p.name}`, text: p.detail, tone: 'good' });
      notes.push(`${p.name} completed.`);
      s.projects = s.projects.filter((x) => x.id !== p.id);
    }
  }

  // --- promises that lapsed
  for (const pr of s.promises) {
    if (pr.kept || pr.broken) continue;
    if (s.day > pr.dueDay + 1) {
      pr.broken = true;
      s.stat.promisesBroken += 1;
      const f = s.factions[pr.to as FactionId];
      if (f) { f.loyalty = clamp(f.loyalty - 8); f.patience = clamp(f.patience - 10); }
      const c = s.characters[pr.to];
      if (c) { c.loyalty = clamp(c.loyalty - 8); c.plotting = clamp(c.plotting + 8); }
      s.log.push({
        day: s.day, kind: 'consequence', title: 'A promise lapsed',
        text: `${pr.text} — not delivered.`, tone: 'bad',
      });
      notes.push(`A promise lapsed: ${pr.text}`);
    }
  }

  // --- recurring commitments expire on their own schedule
  for (const c of [...s.commitments]) {
    if (c.daysLeft === undefined) continue;
    c.daysLeft -= 1;
    if (c.daysLeft <= 0) {
      s.commitments = s.commitments.filter((x) => x.id !== c.id);
      notes.push(`Commitment ended: ${c.label}.`);
    }
  }

  // --- the national accounts run whether you attend to them or not
  const budget = computeBudget(s);
  s.stats.treasury = clampStat('treasury', s.stats.treasury + budget.net);

  // An empty account is not an abstraction here: one in six adults is on the payroll.
  if (s.stats.treasury < 0) {
    const bite = Math.min(3, 1 + Math.abs(s.stats.treasury) / 30);
    s.stats.support = clampStat('support', s.stats.support - bite * 1.1);
    s.stats.stability = clampStat('stability', s.stats.stability - bite);
    s.stats.power = clampStat('power', s.stats.power - bite * 0.5);
    drift(s, 'unrest', bite * 1.8);
    drift(s, 'fiscal', bite);
    s.log.push({
      day: s.day, kind: 'consequence', title: 'The account is empty',
      text: 'Ministries are paying late. The Grey Floor is prioritising, which means choosing who does not get paid.',
      tone: 'bad',
    });
  }

  // economy drifts toward a level set by stability, corruption and strain
  const target = 50 + (s.stats.stability - 50) * 0.25 - s.hidden.corruption * 0.18 - s.hidden.fiscal * 0.12;
  s.stats.economy = clampStat('economy', s.stats.economy + (target - s.stats.economy) * 0.12);

  // --- the longer you govern, the more the Republic expects. Late days are not
  // like early days, whatever your stats say.
  const era = s.day / Math.max(10, s.maxDays);
  drift(s, 'fiscal', era * 1.3);
  drift(s, 'coup', era * 0.45 + Math.max(0, s.factions.staff.power - 80) * 0.08);
  drift(s, 'unrest', era * 0.6);
  drift(s, 'separatism', era * 0.35);

  // --- hidden pressures breathe
  drift(s, 'unrest', -1.9 + (55 - s.stats.support) * 0.05 + (50 - s.stats.stability) * 0.055);
  drift(s, 'coup', -0.8 + (52 - s.stats.military) * 0.075 + s.hidden.fear * 0.014 + plotPressure(s, ['varkov', 'tern']) * 0.05);
  drift(s, 'scandal', -2.9 + sumScandalHeat(s) * 0.02 + Math.max(0, 40 - s.stats.legitimacy) * 0.02);
  drift(s, 'leak', -1.0 + (55 - s.stats.information) * 0.035);
  drift(s, 'foreign', -0.9);
  drift(s, 'fiscal', s.stats.treasury < 15 ? +2.2 : -0.6);
  drift(s, 'corruption', -0.4);
  drift(s, 'cult', -0.7);
  drift(s, 'fear', -0.9);
  drift(s, 'separatism', -0.5 + (50 - s.stats.power) * 0.02);

  // --- scandals cool, slowly, unless fed
  for (const sc of s.scandals) sc.heat = Math.max(0, sc.heat - (sc.buried ? 6 : 2.5));
  s.scandals = s.scandals.filter((sc) => sc.heat > 4);

  // --- factions lose patience when they are unhappy and unattended
  for (const id of FACTION_ORDER) {
    const f = s.factions[id];
    if (f.loyalty < 40) f.patience = clamp(f.patience - 1.6);
    else if (f.loyalty > 65) f.patience = clamp(f.patience + 0.5);
    // Generosity resets the baseline: what was a gift last week is an expectation now.
    if (f.loyalty > 72) f.patience = clamp(f.patience - era * 1.4);
    // power follows loyalty and the general drift of the state
    if (id === 'staff' && s.hidden.coup > 50) f.power = clamp(f.power + 0.6);
    if (id === 'chorus' && s.hidden.unrest > 50) f.influence = clamp(f.influence + 0.8);
  }

  // --- characters who are ignored and ambitious start doing things
  for (const c of Object.values(s.characters)) {
    if (!c.inPost || !c.alive) continue;
    const def = CHARACTER_MAP[c.id];
    if (!def) continue;
    const grievance = c.memory.filter((m) => m.weight < 0).length;
    const drive = (def.ambition / 100) * (1 - c.loyalty / 120) * (1 + grievance * 0.15);
    c.plotting = clamp(c.plotting + drive * 1.5 - (c.loyalty > 70 ? 1.2 : 0) - c.fear * 0.01);
    if (c.plotting > 60 && c.id === 'varkov') s.hidden.coup = clamp(s.hidden.coup + 1.2);
    if (c.plotting > 60 && c.id === 'tern') s.hidden.coup = clamp(s.hidden.coup + 1.4);
    if (c.plotting > 60 && c.id === 'kostyn') s.hidden.separatism = clamp(s.hidden.separatism + 1.2);
    if (c.plotting > 60 && c.id === 'sarran') s.hidden.leak = clamp(s.hidden.leak + 1.0);
  }

  return notes;
}

function plotPressure(s: GameState, ids: string[]): number {
  return ids.reduce((a, id) => a + Math.max(0, (s.characters[id]?.plotting ?? 0) - 35), 0);
}

function sumScandalHeat(s: GameState) {
  return s.scandals.reduce((a, b) => a + (b.buried ? b.heat * 0.3 : b.heat), 0) / Math.max(1, s.scandals.length);
}

function drift(s: GameState, k: keyof GameState['hidden'], d: number) {
  s.hidden[k] = clamp(s.hidden[k] + d);
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

function toneFromDelta(d: Partial<Stats>): 'good' | 'bad' | 'mixed' | 'neutral' {
  let pos = 0, neg = 0;
  for (const k of STAT_KEYS) {
    const v = d[k];
    if (v === undefined) continue;
    if (v > 0) pos += v; else neg -= v;
  }
  if (pos === 0 && neg === 0) return 'neutral';
  if (pos > neg * 1.6) return 'good';
  if (neg > pos * 1.6) return 'bad';
  return 'mixed';
}

/* ------------------------------------------------------------ public API */

/** Prepare day N: upkeep, agenda, deck. Leaves the state in the briefing phase. */
export function prepareDay(prev: GameState): GameState {
  const s = clone(prev);
  s.statsAtDayStart = { ...s.stats };
  s.alertsToday = 0;
  s.stageIndex = 0;
  s.current = undefined;
  s.lastOutcome = undefined;
  s.newsQueue = [];

  withRng(s, (rng) => {
    const notes = dayUpkeep(s, rng);
    s.agenda = buildAgenda(s, rng);
    s.todayDeck = drawDeck(s, rng);
    s.flags.__upkeepNotes = notes.length;
  });

  s.trend = diffStats(s.statsAtDayStart, s.stats);
  s.phase = 'briefing';
  return s;
}

function diffStats(a: Stats, b: Stats): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const d = Math.round((b[k] - a[k]) * 10) / 10;
    if (Math.abs(d) >= 0.05) out[k] = d;
  }
  return out;
}

/** Briefing → first card of the day. */
export function beginStages(prev: GameState): GameState {
  const s = clone(prev);
  s.stageIndex = 0;
  openCurrent(s);
  return s;
}

function openCurrent(s: GameState) {
  const id = s.todayDeck[s.stageIndex];
  if (!id) { s.current = undefined; s.phase = 'night'; return; }
  // A card that an earlier decision queued may itself be an alert; it should
  // still arrive as a BREAKING ALERT rather than as a calm item on the agenda.
  const queuedAlert = !!ALERT_MAP[id];
  s.current = { cardId: id, isAlert: queuedAlert };
  s.phase = queuedAlert ? 'alert' : 'stage';
  if (queuedAlert) { s.alertsToday += 1; s.lastAlertDay = s.day; s.flags.__alertSeen = 1; }
  s.flags[`lastSeen:${id}`] = s.day;
  const def = lookupCard(id);
  if (def?.once && !s.seenOnce.includes(id)) s.seenOnce.push(id);
}

/** Resolve a decision on the active card (normal or alert). */
export function chooseOption(prev: GameState, optionId: string): GameState {
  const s = clone(prev);
  if (!s.current) return s;
  const def = lookupCard(s.current.cardId);
  if (!def) return s;
  const opt = def.options.find((o) => o.id === optionId);
  if (!opt) return s;
  if (opt.enabled && !opt.enabled(s)) return s;

  const outcome: CardOutcome = withRng(s, (rng) =>
    typeof opt.outcome === 'function' ? opt.outcome(s, rng) : opt.outcome,
  );

  const deltas = withRng(s, (rng) => applyEffects(s, outcome.effects, rng, def.id));

  s.stat.decisions += 1;
  if (s.current.isAlert) s.stat.alertsSurvived += 1;

  // flags that map onto run statistics
  syncRunStats(s);

  s.log.push({
    day: s.day,
    kind: s.current.isAlert ? 'alert' : 'decision',
    title: def.title,
    text: `${opt.label} — ${outcome.text.split('\n')[0]}`,
    tone: outcome.tone ?? toneFromDelta(deltas),
  });

  s.lastOutcome = { ...outcome, cardTitle: def.title, optionLabel: opt.label, deltas };
  s.phase = s.current.isAlert ? 'alertResolve' : 'resolve';
  return s;
}

function syncRunStats(s: GameState) {
  const take = (k: string) => {
    const v = s.flags[k] ?? 0;
    if (v) s.flags[k] = 0;
    return v;
  };
  s.stat.promisesKept += take('promisesKept');
  s.stat.promisesBroken += take('promisesBroken');
  s.stat.peopleJailed += take('peopleJailed');
  s.stat.protestsCrushed += take('protestsCrushed');
  s.stat.liesTold += take('liesTold');
  s.stat.ministersLost += take('ministersLost');
}

/* -------------------------------------------------------- breaking alerts */

function alertWeight(s: GameState, a: AlertDef): number {
  if (a.minDay && s.day < a.minDay) return 0;
  if (a.once && s.seenOnce.includes(a.id)) return 0;
  if (a.requires && !a.requires(s)) return 0;
  const last = s.flags[`lastSeen:${a.id}`];
  if (last !== undefined && s.day - last <= 4) return 0;
  return Math.max(0, a.weight ? a.weight(s) : 0);
}

/** Total pressure in the system, 0..1-ish. Drives how often the day is interrupted. */
export function alertPressure(s: GameState): number {
  const pool = ALERTS.reduce((acc, a) => acc + alertWeight(s, a), 0);
  return pool;
}

function rollAlert(s: GameState, rng: Rng): AlertDef | undefined {
  if (s.day < 2) return undefined;
  if (s.alertsToday >= 2) return undefined;

  const pool = ALERTS.filter((a) => alertWeight(s, a) > 0);
  if (!pool.length) return undefined;

  const total = pool.reduce((acc, a) => acc + alertWeight(s, a), 0);
  // chance scales with accumulated pressure but is never certain and never zero
  let p = Math.min(0.62, 0.07 + total / 225);
  if (s.alertsToday >= 1) p *= 0.35;

  // The game teaches its own defining mechanic: if the player has reached day 3
  // without ever seeing an alert, the world obliges.
  const neverSeen = !s.flags.__alertSeen;
  if (neverSeen && s.day >= 3) p = Math.max(p, 0.85);

  if (!rng.chance(p)) return undefined;
  return rng.weighted(pool, (a) => alertWeight(s, a));
}

/** Continue after a normal decision: maybe an interruption, otherwise the next stage. */
export function continueAfterResolve(prev: GameState): GameState {
  const s = clone(prev);
  s.lastOutcome = undefined;

  const alert = withRng(s, (rng) => rollAlert(s, rng));
  if (alert) {
    s.alertsToday += 1;
    s.lastAlertDay = s.day;
    s.flags.__alertSeen = 1;
    s.flags[`lastSeen:${alert.id}`] = s.day;
    if (alert.once && !s.seenOnce.includes(alert.id)) s.seenOnce.push(alert.id);
    s.current = { cardId: alert.id, isAlert: true };
    s.phase = 'alert';
    return s;
  }

  return nextStage(s);
}

/** Continue after an alert: resume the interrupted agenda. */
export function continueAfterAlert(prev: GameState): GameState {
  const s = clone(prev);
  s.lastOutcome = undefined;
  return nextStage(s);
}

function nextStage(s: GameState): GameState {
  s.stageIndex += 1;
  if (s.stageIndex >= s.todayDeck.length) {
    return finishDay(s);
  }
  openCurrent(s);
  return s;
}

/* ------------------------------------------------------------ end of day */

function finishDay(s: GameState): GameState {
  s.current = undefined;
  s.phase = 'night';

  const summary: DaySummary = {
    day: s.day,
    headlines: [...s.newsQueue],
    statsBefore: { ...s.statsAtDayStart },
    statsAfter: { ...s.stats },
    notable: s.log.filter((l) => l.day === s.day && (l.kind === 'decision' || l.kind === 'alert')).map((l) => l.title),
    mood: moodLine(s),
  };
  s.history.push(summary);

  const ending = checkEndings(s);
  if (ending) {
    s.ending = ending;
    s.phase = 'ended';
    s.log.push({ day: s.day, kind: 'system', title: ending.title, text: ending.epitaph, tone: 'bad' });
  } else if (isActEndDay(s)) {
    if (s.act < NUM_ACTS) {
      s.act += 1;
      s.log.push({
        day: s.day, kind: 'consequence', title: 'Confidence vote',
        text: `Parliament held its confidence vote and let you keep the job. Act ${s.act} begins tomorrow.`,
        tone: 'good',
      });
    } else {
      // Final act's vote passed and nothing else forced an ending today — the run is won.
      const survival = checkEndings(s, true);
      if (survival) {
        s.ending = survival;
        s.phase = 'ended';
        s.log.push({ day: s.day, kind: 'system', title: survival.title, text: survival.epitaph, tone: 'bad' });
      }
    }
  }
  return s;
}

function moodLine(s: GameState): string {
  const d = diffStats(s.statsAtDayStart, s.stats);
  const net = STAT_KEYS.reduce((a, k) => a + (k === 'treasury' ? 0 : (d[k] ?? 0)), 0);
  if (net > 14) return 'A good day, which in this building means nothing has caught fire yet.';
  if (net > 4) return 'A day that went broadly your way.';
  if (net > -4) return 'A day that moved sideways, expensively.';
  if (net > -14) return 'A bad day. The kind that is only obvious in retrospect.';
  return 'A genuinely terrible day. Somebody in this building is writing it down.';
}

/** Night → next day. */
export function advanceToNextDay(prev: GameState): GameState {
  let s = clone(prev);
  if (s.phase === 'ended') return s;
  s.day += 1;
  if (s.day > s.maxDays) {
    const ending = checkEndings(s, true);
    s.ending = ending ?? undefined;
    s.phase = 'ended';
    return s;
  }
  s = prepareDay(s);
  return s;
}

/* --------------------------------------------------------------- queries */

export function activeCard(s: GameState): CardDef | AlertDef | undefined {
  return s.current ? lookupCard(s.current.cardId) : undefined;
}

export function isAlert(s: GameState): boolean {
  return !!s.current?.isAlert;
}

export function factionDef(id: FactionId) {
  return FACTIONS[id];
}

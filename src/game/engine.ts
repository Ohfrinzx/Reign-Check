import type {
  GameState, CardDef, AlertDef, StageKind, Rng, CardOutcome, Stats, DaySummary, FactionId,
} from './types';
import { STAT_KEYS } from './types';
import { makeRng } from './rng';
import { applyEffects, mergeDeltas } from './effects';
import { CARDS, CARD_MAP } from './content/cards';
import { CARDS2 } from './content/cards2';
import { CARDS3 } from './content/cards3';
import { FOLLOWUPS } from './content/followups';
import { ALERTS, ALERT_MAP } from './content/alerts';
import { FACTION_ORDER, FACTIONS, CHARACTER_MAP } from './content/country';
import { clampStat } from './stats';
import { checkEndings, computeConfidenceVote, confidenceVoteFailure } from './content/endings';
import { computeBudget } from './economy';
import { NUM_ACTS, isActEndDay } from './state';
import { SHOP_MAP } from './content/shop';
import { currentMandate, MANDATE_CARDS } from './content/mandates';
import type { ShopItemDef } from './content/shop';
import {
  buyLimit, canCutNow, canFireNow, capBlockReason, cutCostOf, dailyFromOwned, fireCostOf,
  isActRoom, rememberOffers, rollStock, roomIsClosed, shopOpensTonight, shopPrice,
  startHeldDeal, tickHeldDeals,
} from './shop';

/* ------------------------------------------------------------- registries */

const ALL_CARDS: CardDef[] = [...CARDS, ...CARDS2, ...CARDS3, ...FOLLOWUPS, ...MANDATE_CARDS];
export const ALL_CARD_MAP: Record<string, CardDef> = {
  ...CARD_MAP,
  ...Object.fromEntries(MANDATE_CARDS.map((c) => [c.id, c])),
  ...Object.fromEntries(CARDS2.map((c) => [c.id, c])),
  ...Object.fromEntries(CARDS3.map((c) => [c.id, c])),
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
  const count = Math.min(5, min + extra) + (currentMandate(s).extraCards ?? 0);

  const pool = rng.shuffle([...STAGE_POOL]);
  const agenda: StageKind[] = [];
  for (let i = 0; i < count; i++) agenda.push(pool[i % pool.length]);
  // Government business is always first when it appears; it is the boring, load-bearing part.
  agenda.sort((a, b) => STAGE_POOL.indexOf(a) - STAGE_POOL.indexOf(b));
  return agenda;
}

/** §4.4: each copy of a card id in the run deck adds this much weight. */
const RUN_DECK_WEIGHT_BONUS = 6;

function cardWeight(s: GameState, c: CardDef): number {
  if (s.bannedCards.includes(c.id)) return 0;
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
  // the run deck: a card the player bought copies of is a growing share of
  // what they see, on top of whatever the recency throttle already did
  const copies = s.runDeck.length ? s.runDeck.filter((id) => id === c.id).length : 0;
  if (copies) w += copies * RUN_DECK_WEIGHT_BONUS;
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

  // --- projects tick. Active upkeep is already in computeBudget; only a
  // project completing now needs its final charge carried into that budget.
  let completedProjectUpkeep = 0;
  for (const p of [...s.projects]) {
    p.daysLeft -= 1;
    if (p.daysLeft <= 0) {
      completedProjectUpkeep += p.upkeep ?? 0;
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

  // --- timed Back Room deals run out on their own schedule too. Most held
  // deals are permanent and never leave this way; this only fires for the
  // few with a durationDays clock. (Frees a deal slot either way.)
  for (const def of tickHeldDeals(s)) {
    if (def.expireEffects) {
      const delta = applyEffects(s, def.expireEffects, rng, `shop:expire:${def.id}`);
      s.log.push({
        day: s.day, kind: 'consequence', title: `${def.name}: the arrangement is over`,
        text: def.downside ?? 'It has run its course.', tone: toneFromDelta(delta),
      });
    }
    s.endedDeals.push({ itemId: def.id, reason: 'expired' });
    notes.push(`${def.name} ran out.`);
  }

  // --- advisors and policies you bought in the Back Room do their work.
  // This is data, not code: each owned item's `daily` block is merged in
  // shop.ts and pushed through applyEffects() like anything else.
  const owned = dailyFromOwned(s);
  if (owned) applyEffects(s, owned, rng, 'shop:daily');

  // --- the national accounts run whether you attend to them or not
  const budget = computeBudget(s);
  applyEffects(s, { stats: { treasury: budget.net - completedProjectUpkeep } }, rng, 'budget');

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
    if (f.loyalty < 40) applyEffects(s, { factions: { [id]: { patience: -1.6 } } }, rng, 'patience');
    else if (f.loyalty > 65) f.patience = clamp(f.patience + 0.5);
    // Generosity resets the baseline: what was a gift last week is an expectation now.
    if (f.loyalty > 72) applyEffects(s, { factions: { [id]: { patience: -era * 1.4 } } }, rng, 'patience');
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

  // Origin rules begin on the second morning, after the first day in office.
  if (s.day > 1) applyEffects(s, currentMandate(s).daily, rng, 'mandate:daily');

  return notes;
}

function plotPressure(s: GameState, ids: string[]): number {
  return ids.reduce((a, id) => a + Math.max(0, (s.characters[id]?.plotting ?? 0) - 35), 0);
}

function sumScandalHeat(s: GameState) {
  return s.scandals.reduce((a, b) => a + (b.buried ? b.heat * 0.3 : b.heat), 0) / Math.max(1, s.scandals.length);
}

function drift(s: GameState, k: keyof GameState['hidden'], d: number) {
  const mult = d > 0 ? currentMandate(s).pressureGainMult?.[k] ?? 1 : 1;
  s.hidden[k] = clamp(s.hidden[k] + d * mult);
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
  if (s.phase !== 'briefing') return s;
  s.stageIndex = 0;
  openCurrent(s);
  return s;
}

function openCurrent(s: GameState) {
  const id = s.todayDeck[s.stageIndex];
  if (!id) { finishDay(s); return; }
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
  if (!['stage', 'alert'].includes(s.phase) || !s.current) return s;
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
  if (s.bannedCards.includes(a.id)) return 0;
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
  if (s.phase !== 'resolve') return s;
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
  if (s.phase !== 'alertResolve') return s;
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

  const summary: DaySummary = {
    day: s.day,
    headlines: [...s.newsQueue],
    statsBefore: { ...s.statsAtDayStart },
    statsAfter: { ...s.stats },
    notable: s.log.filter((l) => l.day === s.day && (l.kind === 'decision' || l.kind === 'alert')).map((l) => l.title),
    mood: moodLine(s),
  };
  s.history.push(summary);

  // At an act boundary, higher-priority endings still resolve immediately.
  // Parliament's own result is frozen separately so the UI can reveal it
  // without recalculating or consuming gameplay RNG.
  const voteDay = isActEndDay(s);
  const ending = checkEndings(s, false, !voteDay);
  if (ending) {
    s.ending = ending;
    s.phase = 'ended';
    s.log.push({ day: s.day, kind: 'system', title: ending.title, text: ending.epitaph, tone: 'bad' });
  } else if (voteDay) {
    s.confidenceVote = computeConfidenceVote(s);
    s.phase = 'vote';
  } else {
    s.phase = 'night';
  }
  return s;
}

/** Apply the already-frozen confidence result exactly once after its reveal. */
export function completeConfidenceVote(prev: GameState): GameState {
  const s = clone(prev);
  if (s.phase !== 'vote' || !s.confidenceVote) return s;

  if (!s.confidenceVote.passed) {
    const ending = confidenceVoteFailure(s);
    s.ending = ending;
    s.phase = 'ended';
    s.log.push({ day: s.day, kind: 'system', title: ending.title, text: ending.epitaph, tone: 'bad' });
    return s;
  }

  if (s.act < NUM_ACTS) {
    s.act += 1;
    s.phase = 'night';
    s.log.push({
      day: s.day, kind: 'consequence', title: 'Confidence vote',
      text: `Parliament held its confidence vote and let you keep the job. Act ${s.act} begins tomorrow.`,
      tone: 'good',
    });
    return s;
  }

  // Final act's vote passed and nothing else forced an ending today — the run is won.
  const survival = checkEndings(s, true);
  if (survival) {
    s.ending = survival;
    s.phase = 'ended';
    s.log.push({ day: s.day, kind: 'system', title: survival.title, text: survival.epitaph, tone: 'good' });
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

/* ----------------------------------------------------------- the Back Room
 *
 * The whole shop needs exactly ONE engine hook: resolve a purchase through
 * applyEffects(), the same single mutation entry point a card option uses
 * (ground rule 2, and docs/DESIGN_V2.md §4's architecture principle).
 * Everything else — what is for sale, what it costs, what it does — is data
 * in content/shop.ts, so adding items needs no change in this file.
 */

/** Night → the Back Room, or straight to tomorrow on the run's last night. */
export function openShop(prev: GameState): GameState {
  const s = clone(prev);
  if (s.phase !== 'night') return s;
  if (!shopOpensTonight(s)) return advanceToNextDay(s);

  s.shopBuysTonight = 0;
  withRng(s, (rng) => {
    s.shopStock = rollStock(s, rng);
  });
  if (!s.shopStock.length) return advanceToNextDay(s);

  s.shopRecent = rememberOffers(s, s.shopStock);
  s.phase = 'shop';
  return s;
}

/**
 * Buy one item from tonight's stock. In the nightly room that closes the room;
 * in an act room the rest of the stock stays on offer (see buyLimit()).
 */
export function buyShopItem(prev: GameState, itemId: string): GameState {
  const s = clone(prev);
  if (s.phase !== 'shop') return s;
  if (!s.shopStock.includes(itemId)) return s;
  if (roomIsClosed(s)) return s;

  const def: ShopItemDef | undefined = SHOP_MAP[itemId];
  if (!def) return s;
  // §4.5 step 2: a locked item should never be in shopStock to begin with
  // (rollStock()/eligibleStock() already filter on unlockedShopItemIds) —
  // this is the same kind of safety net capBlockReason() is below, not the
  // primary gate.
  if (!s.unlockedShopItemIds.includes(def.id)) return s;

  const price = shopPrice(s, def);
  if (price > 0 && price > s.stats.treasury) return s;
  // Advisors and deals are capped (ADVISOR_CAP/DEAL_CAP) — past the cap, the
  // offer is shown but not buyable until a slot is freed. The UI disables the
  // button for the same reason; this is the safety net.
  if (capBlockReason(s, def)) return s;

  // The price, then what you bought — both through applyEffects, so the money
  // lands in RunStats and any owned modifier applies to both.
  const paid = withRng(s, (rng) => applyEffects(s, { stats: { treasury: -price } }, rng, `shop:${def.id}`));
  const got = withRng(s, (rng) => applyEffects(s, def.effects, rng, `shop:${def.id}`));

  if (def.kind === 'advisor' || def.kind === 'policy') s.owned.push(def.id);
  if (def.kind === 'favour') s.heldFavours.push(def.id);
  startHeldDeal(s, def);

  s.shopBought.push(def.id);
  s.shopBuysTonight += 1;
  s.shopStock = s.shopBuysTonight >= buyLimit(s)
    ? []
    : s.shopStock.filter((id) => id !== def.id);
  s.stat.dealsStruck += 1;
  s.stat.bigMoments.push({ day: s.day, text: `Back Room: ${def.name}.` });

  s.log.push({
    day: s.day,
    kind: 'purchase',
    title: def.name,
    text: price < 0
      ? `Taken in the Back Room. They paid $${Math.abs(price).toFixed(1)}B.`
      : `Bought in the Back Room for $${price.toFixed(1)}B.`,
    tone: def.downside ? 'mixed' : 'good',
  });

  s.lastOutcome = {
    text: def.downside ? `${def.upside} ${def.downside}` : def.upside,
    tone: def.downside ? 'mixed' : 'good',
    cardTitle: def.name,
    optionLabel: priceLabel(price),
    deltas: mergeDeltas(paid, got),
  };
  return s;
}

/** Spend a favour you are holding. Available on any day, not only in the shop. */
export function useFavour(prev: GameState, itemId: string): GameState {
  const s = clone(prev);
  if (s.phase === 'ended' || s.phase === 'title') return s;
  const idx = s.heldFavours.indexOf(itemId);
  if (idx < 0) return s;

  const def = SHOP_MAP[itemId];
  if (!def?.use) return s;

  s.heldFavours.splice(idx, 1);
  const deltas = withRng(s, (rng) => applyEffects(s, def.use!.effects, rng, `favour:${def.id}`));

  s.log.push({
    day: s.day,
    kind: 'purchase',
    title: def.name,
    text: def.use.text,
    tone: 'good',
  });
  if (s.phase !== 'resolve' && s.phase !== 'alertResolve') s.lastOutcome = {
    text: def.use.text,
    tone: 'good',
    cardTitle: def.name,
    optionLabel: def.use.label,
    deltas,
  };
  return s;
}

/**
 * Let an advisor go. Available on any day, not only inside the Back Room —
 * see the "Advisors & Deals" screen App.tsx opens from the masthead. Costs
 * whatever `fireCost` says (a literal bribe, sometimes zero) plus
 * `fireEffects` (the figurative cost), and cancels the commitment their
 * hiring created, if any. Policies and favours are not fireable — only
 * advisors, per the design.
 */
export function fireAdvisor(prev: GameState, itemId: string): GameState {
  const s = clone(prev);
  if (s.phase === 'ended' || s.phase === 'title') return s;
  if (!s.owned.includes(itemId)) return s;
  const def = SHOP_MAP[itemId];
  if (!def || def.kind !== 'advisor') return s;
  if (!canFireNow(s, def)) return s;

  const cost = fireCostOf(def);
  if (cost > 0) {
    withRng(s, (rng) => applyEffects(s, { stats: { treasury: -cost } }, rng, `fire:${def.id}`));
  }
  if (def.fireEffects) {
    withRng(s, (rng) => applyEffects(s, def.fireEffects, rng, `fire:${def.id}`));
  }

  s.owned = s.owned.filter((id) => id !== itemId);
  if (def.endsCommitment) {
    s.commitments = s.commitments.filter((c) => c.id !== def.endsCommitment);
  }

  s.log.push({
    day: s.day,
    kind: 'purchase',
    title: `Let go: ${def.name}`,
    text: cost > 0
      ? `Paid $${cost.toFixed(1)}B to see them out quietly.`
      : 'They left without being paid to go.',
    tone: 'mixed',
  });
  return s;
}

/**
 * End a held deal early, on purpose — the deal equivalent of fireAdvisor().
 * Frees a deal slot immediately, whether the deal was permanent or still
 * counting down; a timed deal cut early never fires its `expireEffects`
 * (that only fires when the clock runs out on its own — see tickHeldDeals()
 * in dayUpkeep()). Costs whatever `cutCost`/`cutEffects` that deal's entry
 * in content/shop.ts gives it, and cancels the commitment it created, if any.
 */
export function cutDeal(prev: GameState, itemId: string): GameState {
  const s = clone(prev);
  if (s.phase === 'ended' || s.phase === 'title') return s;
  const idx = s.heldDeals.findIndex((d) => d.itemId === itemId);
  if (idx < 0) return s;
  const def = SHOP_MAP[itemId];
  if (!def || def.kind !== 'deal') return s;
  if (!canCutNow(s, def)) return s;

  const cost = cutCostOf(def);
  if (cost > 0) {
    withRng(s, (rng) => applyEffects(s, { stats: { treasury: -cost } }, rng, `cut:${def.id}`));
  }
  if (def.cutEffects) {
    withRng(s, (rng) => applyEffects(s, def.cutEffects, rng, `cut:${def.id}`));
  }

  s.heldDeals = s.heldDeals.filter((d) => d.itemId !== itemId);
  if (def.endsCommitment) {
    s.commitments = s.commitments.filter((c) => c.id !== def.endsCommitment);
  }
  s.endedDeals.push({ itemId: def.id, reason: 'cut' });

  s.log.push({
    day: s.day,
    kind: 'purchase',
    title: `Cut short: ${def.name}`,
    text: cost > 0
      ? `Paid $${cost.toFixed(1)}B to end it early.`
      : 'Ended, no charge.',
    tone: 'mixed',
  });
  return s;
}

/** Leave the Back Room without buying anything else. */
export function leaveShop(prev: GameState): GameState {
  const s = clone(prev);
  if (s.phase !== 'shop') return s;
  s.shopStock = [];
  s.lastOutcome = undefined;
  return advanceToNextDay(s);
}

function priceLabel(price: number): string {
  return price < 0 ? `Took $${Math.abs(price).toFixed(1)}B` : `Paid $${price.toFixed(1)}B`;
}

/** Re-exported so the UI never has to reach into shop.ts and content/shop.ts both. */
export { isActRoom };

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

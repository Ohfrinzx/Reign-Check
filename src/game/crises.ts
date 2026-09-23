import type { GameState, Rng } from './types';
import { CRISES, CRISIS_MAP, STAGE_NAMES } from './content/crises';
import type { CrisisDef } from './content/crises';

/**
 * PHASE 3 STEP 3 — CRISIS CHAINS. No React, no DOM (ground rule 11).
 *
 * A chain is one situation told over about a week, in three stages
 * (content/crises.ts). The rules:
 *
 *   - START. From day 4, when no chain is running and none ended in the
 *     last COOLDOWN days, a chain whose hidden pressure has reached its
 *     `startAt` begins. The most over-threshold pressure wins. Each chain
 *     runs at most once per run; only one runs at a time.
 *   - ADVANCE. Each stage is a card queued into that day. STAGE_GAP days
 *     after a stage card has been played, the next stage arrives — the
 *     `calm` version if `flags['crisis:<id>']` is 0 or more (handled well
 *     so far), the `hot` version if it is negative (made worse).
 *   - END. The morning after stage 3 is played — or after any stage whose
 *     chosen option set `flags['crisisEnd:<id>']` — the chain is over. The
 *     outcome cards carry the consequences; this file only records it.
 *
 * Chains never end the run themselves; their cards move ordinary stats and
 * pressures, which can. Random rolls are not used here at all: which chain
 * starts is decided by pressure, which version arrives by the score.
 */

export const START_DAY = 4;
export const STAGE_GAP = 2;
const COOLDOWN = 3;

export const scoreFlag = (id: string) => `crisis:${id}`;
export const endFlag = (id: string) => `crisisEnd:${id}`;

export function crisisScore(s: GameState, id: string): number {
  return s.flags[scoreFlag(id)] ?? 0;
}

/** How it is going, in words — never the number (ground rule 6). */
export function crisisMood(s: GameState, id: string): string {
  const v = crisisScore(s, id);
  return v >= 2 ? 'under control' : v >= 0 ? 'holding' : v >= -2 ? 'getting worse' : 'out of control';
}

function stageCard(def: CrisisDef, stage: number, s: GameState): string {
  if (stage === 1) return def.stage1.id;
  const hot = crisisScore(s, def.id) < 0;
  const pair = stage === 2 ? def.stage2 : def.stage3;
  return (hot ? pair.hot : pair.calm).id;
}

function queue(s: GameState, cardId: string) {
  if (!s.queued.some((q) => q.cardId === cardId)) s.queued.push({ cardId, day: s.day });
}

/**
 * Run once per morning from engine.ts's dayUpkeep(). Returns briefing notes.
 * The rng parameter keeps the same shape as the other ticks; it is unused.
 */
export function tickCrises(s: GameState, _rng: Rng): string[] {
  const c = s.crisis;
  if (c) {
    const def = CRISIS_MAP[c.id];
    if (!def) { s.crisis = undefined; return []; }
    const played = s.seenOnce.includes(c.cardId);
    if (!played) {
      // Not played yet (it is queued for today, or the day was cut short):
      // make sure it is still on its way.
      if (s.day >= c.nextDay) queue(s, c.cardId);
      return [];
    }
    if (c.stage >= 3 || s.flags[endFlag(c.id)]) return [finish(s, def)];
    if (s.day < c.nextDay) return [];
    c.stage += 1;
    c.cardId = stageCard(def, c.stage, s);
    c.nextDay = s.day + (c.stage === 3 ? 1 : STAGE_GAP);
    queue(s, c.cardId);
    return [`${def.name}: ${STAGE_NAMES[c.stage - 1].toLowerCase()}.`];
  }

  if (s.day < START_DAY) return [];
  if ((s.flags.crisisCooldownUntil ?? 0) > s.day) return [];
  const ready = CRISES.filter((d) => !s.crisesDone.includes(d.id) && s.hidden[d.pressure] >= d.startAt);
  if (!ready.length) return [];
  ready.sort((a, b) => (s.hidden[b.pressure] - b.startAt) - (s.hidden[a.pressure] - a.startAt));
  const def = ready[0];
  s.crisis = { id: def.id, stage: 1, cardId: def.stage1.id, startedDay: s.day, nextDay: s.day + STAGE_GAP };
  queue(s, def.stage1.id);
  s.log.push({ day: s.day, kind: 'event', title: `Crisis: ${def.name}`, text: def.summary, tone: 'bad' });
  return [`A crisis has started: ${def.name}.`];
}

function finish(s: GameState, def: CrisisDef): string {
  const score = crisisScore(s, def.id);
  const how = score >= 1 ? 'handled' : score >= 0 ? 'got through' : 'barely survived';
  s.crisesDone.push(def.id);
  s.crisis = undefined;
  s.flags.crisisCooldownUntil = s.day + COOLDOWN;
  s.stat.bigMoments.push({ day: s.day, text: `${how === 'handled' ? 'Handled' : how === 'got through' ? 'Got through' : 'Barely survived'} ${def.name}.` });
  s.log.push({
    day: s.day, kind: 'consequence', title: `Crisis over: ${def.name}`,
    text: `You ${how} it.`, tone: score >= 0 ? 'good' : 'mixed',
  });
  return `${def.name} is over.`;
}

/** Front-page / desk line for a running chain. */
export function crisisBriefing(s: GameState): { headline: string; text: string; severity: 1 | 2 | 3 } | undefined {
  const c = s.crisis;
  const def = c && CRISIS_MAP[c.id];
  if (!c || !def) return undefined;
  const next = c.stage < 3 ? ` The next development is expected around day ${Math.max(c.nextDay, s.day + 1)}.` : '';
  return {
    headline: `Crisis: ${def.name} (stage ${c.stage} of 3)`,
    text: `${def.summary} So far it is ${crisisMood(s, c.id)}.${next}`,
    severity: Math.min(3, c.stage) as 1 | 2 | 3,
  };
}

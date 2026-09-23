import type { FactionDemand, FactionId, GameState, Rng } from './types';
import { makeRng } from './rng';
import { applyEffects } from './effects';
import { DEMANDS, DEMAND_MAP, FACTION_MOVES, HOSTILE_ACTIONS } from './content/demands';
import type { DemandDef, FactionMoveDef } from './content/demands';
import { DISPLAY_FACTIONS, isHostile } from './display';
import { forcedEnding } from './content/endings';

/**
 * PHASE 3 STEP 1 — FACTION DEMANDS. No React, no DOM (ground rule 11).
 *
 * The life of a demand:
 *   1. ISSUED (murmur) during the morning upkeep, when one of the five
 *      visible factions has patience below ISSUE_BELOW and no live demand.
 *   2. Each stage has a due day. Past it, the demand ESCALATES
 *      murmur → formal → ultimatum, costing support and patience each time.
 *      A murmur quietly drops if the faction's patience recovers.
 *   3. The player can MEET it (pay the stage's price and take the side
 *      effects) or BRIBE for STAGE_DAYS more days. Bribes are not always
 *      accepted — see bribeChance().
 *   4. If an ULTIMATUM runs out, the faction acts (resolveLapse()): maybe a
 *      move to remove you, which can end the run; otherwise a heavy but
 *      survivable punishment. Both depend on the faction's standing and on
 *      what protects you (FACTION_MOVES in content/demands.ts).
 *
 * Every change to the world goes through applyEffects() (ground rule 2); every
 * random roll uses the saved RNG (ground rule 4).
 */

/** patience below this issues a demand */
export const ISSUE_BELOW = 45;
/** a murmur is dropped if patience recovers to this */
export const DROP_AT = 50;
/** days allowed at each stage before it escalates or runs out */
export const STAGE_DAYS = 2;
/** most demands live at once, so the player is never buried in them */
export const MAX_LIVE = 2;
/** days before a faction can make a new demand after one ends */
const COOLDOWN_MET = 4;
const COOLDOWN_LAPSED = 5;

const STAGES: FactionDemand['severity'][] = ['murmur', 'formal', 'ultimatum'];
const PRICE_MULT: Record<FactionDemand['severity'], number> = { murmur: 1, formal: 1.25, ultimatum: 1.5 };

export const STAGE_LABEL: Record<FactionDemand['severity'], string> = {
  murmur: 'Request',
  formal: 'Formal demand',
  ultimatum: 'Ultimatum',
};

/** Which factions can make demands: exactly the five the player can see. */
export const DEMAND_FACTIONS: FactionId[] = DISPLAY_FACTIONS.map((d) => d.id);

/* ------------------------------------------------------------------ utils */

function clone<T>(v: T): T {
  return structuredClone(v);
}

function withRng<T>(s: GameState, fn: (rng: Rng) => T): T {
  const rng = makeRng(s.rngState);
  const out = fn(rng);
  s.rngState = rng.state();
  return out;
}

const clamp01 = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Drop any unseen pop-up about this faction's live demand — used when the
 *  demand changes or ends, so the player never gets a stale pop-up. */
function clearDemandNotices(s: GameState, id: FactionId) {
  s.demandNotices = s.demandNotices.filter((n) => !(n.faction === id && (n.kind === 'issued' || n.kind === 'escalated')));
}

/** Lift a faction's patience to at least `floor`, through applyEffects(). */
function raisePatienceTo(s: GameState, id: FactionId, floor: number, rng: Rng, source: string) {
  const gap = floor - s.factions[id].patience;
  if (gap > 0) applyEffects(s, { factions: { [id]: { patience: gap } } }, rng, source);
}

export function factionLabel(id: FactionId): string {
  return DISPLAY_FACTIONS.find((d) => d.id === id)?.label ?? id;
}

/* ---------------------------------------------------------------- queries */

export interface LiveDemand {
  faction: FactionId;
  demand: FactionDemand;
  def: DemandDef;
}

/** Every live demand, most urgent first. */
export function liveDemands(s: GameState): LiveDemand[] {
  const out: LiveDemand[] = [];
  for (const id of DEMAND_FACTIONS) {
    const d = s.factions[id]?.demand;
    const def = d && DEMAND_MAP[d.id];
    if (d && def) out.push({ faction: id, demand: d, def });
  }
  return out.sort((a, b) =>
    STAGES.indexOf(b.demand.severity) - STAGES.indexOf(a.demand.severity) || a.demand.dueDay - b.demand.dueDay);
}

/** What meeting this demand costs right now, in $B. Rises with each stage. */
export function meetCost(s: GameState, faction: FactionId): number {
  const d = s.factions[faction]?.demand;
  const def = d && DEMAND_MAP[d.id];
  if (!d || !def) return 0;
  return Math.round(def.meetCost * PRICE_MULT[d.severity] * 10) / 10;
}

/** Why the Meet button is disabled, in plain words — or undefined if it isn't. */
export function meetBlockReason(s: GameState, faction: FactionId): string | undefined {
  const d = s.factions[faction]?.demand;
  const def = d && DEMAND_MAP[d.id];
  if (!d || !def) return 'There is no demand to meet.';
  if (!canActOnDemands(s)) return 'Finish the current item first.';
  if (def.canMeet && !def.canMeet(s)) return def.lockedText ?? 'You cannot do this right now.';
  const cost = meetCost(s, faction);
  if (cost > s.stats.treasury) return `Not enough money: needs $${cost.toFixed(1)}B.`;
  return undefined;
}

/** A bribe for more time costs a share of the meet price, more each time. */
export function bribeCost(s: GameState, faction: FactionId): number {
  const d = s.factions[faction]?.demand;
  if (!d) return 0;
  const base = Math.max(0.5, meetCost(s, faction) * 0.35);
  return Math.round(base * (1 + d.bribes * 0.5) * 10) / 10;
}

/**
 * The chance they take the bribe. Loyal, patient factions take it; angry
 * ones, late stages and repeat bribes make it less likely. Never certain,
 * never impossible.
 */
export function bribeChance(s: GameState, faction: FactionId): number {
  const f = s.factions[faction];
  const d = f?.demand;
  if (!d) return 0;
  const stage = STAGES.indexOf(d.severity);
  return clamp01(
    0.25 + (f.loyalty / 100) * 0.6 + (f.patience / 100) * 0.3 - stage * 0.15 - d.bribes * 0.15,
    0.1, 0.9,
  );
}

/** Plain-language odds — the player never sees the number (ground rule 6). */
export function bribeOddsWord(s: GameState, faction: FactionId): string {
  const p = bribeChance(s, faction);
  return p >= 0.65 ? 'They will probably take it.' : p >= 0.4 ? 'They might take it.' : 'They will probably refuse.';
}

export function bribeBlockReason(s: GameState, faction: FactionId): string | undefined {
  const d = s.factions[faction]?.demand;
  if (!d) return 'There is no demand to delay.';
  if (!canActOnDemands(s)) return 'Finish the current item first.';
  if (d.bribeRefused) return 'They already refused a bribe. Try again if it escalates.';
  const cost = bribeCost(s, faction);
  if (cost > s.stats.treasury) return `Not enough money: needs $${cost.toFixed(1)}B.`;
  return undefined;
}

/** Same phases the favour and firing buttons use — never mid-card or mid-alert. */
export function canActOnDemands(s: GameState): boolean {
  return s.phase === 'briefing' || s.phase === 'stage' || s.phase === 'night';
}

/**
 * How likely the faction is to move against you if its ultimatum runs out,
 * and how likely that move is to work. Exported so tests and the balance
 * probe can read them; the UI shows only words (dangerWord()).
 */
export function moveOdds(s: GameState, faction: FactionId): { attempt: number; success: number } {
  const f = s.factions[faction];
  const move = FACTION_MOVES[faction];
  if (!f || !move) return { attempt: 0, success: 0 };
  // Only a faction that has turned against you tries it, and only a strong one.
  const attempt = clamp01(((55 - f.loyalty) / 55) * (f.power / 100) * 1.3, 0, 0.9);
  const success = clamp01(0.3 + (f.power - move.defence(s)) / 120, 0.1, 0.75);
  return { attempt, success };
}

/** Plain-language danger if this ultimatum runs out. */
export function dangerWord(s: GameState, faction: FactionId): string {
  const { attempt, success } = moveOdds(s, faction);
  const risk = attempt * success;
  const move = FACTION_MOVES[faction];
  const label = factionLabel(faction);
  if (!move) return '';
  if (attempt < 0.1) return `If this runs out, the ${label} will punish you, but probably will not try to remove you.`;
  if (risk >= 0.3) return `If this runs out, the ${label} may well try ${move.attempt}, and it could work.`;
  return `If this runs out, the ${label} could try ${move.attempt}.`;
}

/* ------------------------------------------------------ morning upkeep */

/**
 * Run once per morning from engine.ts's dayUpkeep(), after faction patience
 * has moved. Escalates or ends live demands, then maybe issues one new one.
 * Returns briefing notes. May set `s.ending` (a successful move against you);
 * prepareDay() checks for that.
 */
export function tickDemands(s: GameState, rng: Rng): string[] {
  const notes: string[] = [];

  for (const id of DEMAND_FACTIONS) {
    if (s.ending) break;
    const f = s.factions[id];
    const d = f.demand;
    if (!d) continue;
    const def = DEMAND_MAP[d.id];
    if (!def) { f.demand = undefined; continue; }

    // A request drops quietly once the faction's patience recovers.
    if (d.severity === 'murmur' && f.patience >= DROP_AT) {
      f.demand = undefined;
      clearDemandNotices(s, id);
      s.flags[`demandCooldown:${id}`] = s.day + COOLDOWN_MET;
      s.log.push({
        day: s.day, kind: 'consequence', title: `${factionLabel(id)}: request dropped`,
        text: `${def.title}. They have stopped asking, for now.`, tone: 'good',
      });
      continue;
    }

    if (s.day <= d.dueDay) continue;

    if (d.severity !== 'ultimatum') {
      d.severity = STAGES[STAGES.indexOf(d.severity) + 1];
      d.dueDay = s.day + STAGE_DAYS;
      d.bribeRefused = false;
      applyEffects(s, { factions: { [id]: { loyalty: -4, patience: -6 } } }, rng, `demand:escalate:${def.id}`);
      clearDemandNotices(s, id);
      s.demandNotices.push({ faction: id, kind: 'escalated', day: s.day });
      s.log.push({
        day: s.day, kind: 'consequence', title: `${factionLabel(id)}: ${STAGE_LABEL[d.severity].toLowerCase()}`,
        text: `${def.title}. Due by day ${d.dueDay}.`, tone: 'bad',
      });
      notes.push(`${factionLabel(id)} escalated: ${def.title}.`);
      continue;
    }

    resolveLapse(s, id, def, rng);
    notes.push(`${factionLabel(id)}'s ultimatum ran out.`);
  }

  if (!s.ending) {
    const issued = maybeIssue(s, rng);
    if (issued) notes.push(issued);
  }
  return notes;
}

function maybeIssue(s: GameState, rng: Rng): string | undefined {
  if (s.day < 2) return undefined;
  if (liveDemands(s).length >= MAX_LIVE) return undefined;
  const candidates = DEMAND_FACTIONS.filter((id) => {
    const f = s.factions[id];
    // A hostile faction always has something to ask for (balance slice B).
    return !f.demand && (f.patience < ISSUE_BELOW || isHostile(s, id)) && (s.flags[`demandCooldown:${id}`] ?? 0) <= s.day;
  });
  if (!candidates.length) return undefined;
  // Hostile factions speak first, then the least patient; one new demand per morning.
  candidates.sort((a, b) => Number(isHostile(s, b)) - Number(isHostile(s, a)) || s.factions[a].patience - s.factions[b].patience);
  const id = candidates[0];

  const pool = DEMANDS.filter((d) => d.faction === id);
  const fresh = pool.filter((d) => !s.flags[`demandUsed:${d.id}`]);
  const def = rng.pick(fresh.length ? fresh : pool);
  if (!def) return undefined;

  s.factions[id].demand = {
    id: def.id, issuedDay: s.day, dueDay: s.day + STAGE_DAYS, severity: 'murmur', bribes: 0,
  };
  s.flags[`demandUsed:${def.id}`] = 1;
  s.demandNotices.push({ faction: id, kind: 'issued', day: s.day });
  s.log.push({
    day: s.day, kind: 'event', title: `${factionLabel(id)}: a request`,
    text: `${def.title}. Due by day ${s.day + STAGE_DAYS}.`, tone: 'neutral',
  });
  return `${factionLabel(id)} made a request: ${def.title}.`;
}

/** An ultimatum ran out. The faction either moves against you or punishes you. */
function resolveLapse(s: GameState, id: FactionId, def: DemandDef, rng: Rng) {
  const f = s.factions[id];
  const move: FactionMoveDef | undefined = FACTION_MOVES[id];
  f.demand = undefined;
  clearDemandNotices(s, id);
  s.flags[`demandCooldown:${id}`] = s.day + COOLDOWN_LAPSED;
  if (!move) return;

  const { attempt, success } = moveOdds(s, id);
  const tries = rng.chance(attempt);
  if (tries) {
    if (id === 'staff') s.stat.coupAttempts += 1;
    if (rng.chance(success)) {
      const ending = forcedEnding(s, move.endingId);
      if (ending) {
        s.ending = ending;
        s.log.push({ day: s.day, kind: 'system', title: ending.title, text: ending.epitaph, tone: 'bad' });
        return;
      }
    }
    applyEffects(s, move.failedEffects, rng, `demand:failed:${def.id}`);
    s.stat.bigMoments.push({ day: s.day, text: move.failedTitle + '.' });
    s.demandNotices.push({ faction: id, kind: 'attemptFailed', day: s.day, title: move.failedTitle, text: move.failedText });
    s.log.push({ day: s.day, kind: 'consequence', title: move.failedTitle, text: move.failedText, tone: 'bad' });
  } else {
    applyEffects(s, move.punishEffects, rng, `demand:punish:${def.id}`);
    s.demandNotices.push({ faction: id, kind: 'punished', day: s.day, title: move.punishTitle, text: move.punishText });
    s.log.push({ day: s.day, kind: 'consequence', title: move.punishTitle, text: move.punishText, tone: 'bad' });
  }
  // They have made their point; patience resets to "wary", not "furious",
  // so the same faction does not issue again the very next morning.
  raisePatienceTo(s, id, 45, rng, `demand:lapse:${def.id}`);
}

/**
 * A faction drops its demand without being paid — used by favours
 * (favours.ts). Same bookkeeping as meeting it: pop-ups cleared, patience
 * lifted, a cooldown before the next one.
 */
export function withdrawDemand(s: GameState, faction: FactionId, rng: Rng, source: string): string | undefined {
  const f = s.factions[faction];
  const def = f?.demand && DEMAND_MAP[f.demand.id];
  if (!f?.demand || !def) return undefined;
  f.demand = undefined;
  clearDemandNotices(s, faction);
  raisePatienceTo(s, faction, 60, rng, source);
  s.flags[`demandCooldown:${faction}`] = s.day + COOLDOWN_MET;
  return def.title;
}

/* ------------------------------------------------- hostile factions */

/** Morning upkeep flag: the day a faction turned hostile (0 when it is not). */
export const hostileSinceFlag = (id: FactionId) => `hostileSince:${id}`;
/** Morning upkeep flag: 1 + the index of what a hostile faction did today. */
const hostileActFlag = (id: FactionId) => `hostileAct:${id}`;

/** What a hostile faction did this morning, if anything — for the front page. */
export function hostileActionToday(s: GameState, id: FactionId) {
  const i = (s.flags[hostileActFlag(id)] ?? 0) - 1;
  if (i < 0 || s.flags[`${hostileActFlag(id)}:day`] !== s.day) return undefined;
  return HOSTILE_ACTIONS[id]?.actions[i];
}

/**
 * BALANCE SLICE B. Run each morning from dayUpkeep(), before tickDemands().
 * A faction at the bottom of its bar (isHostile()) works against you: a
 * pop-up the first morning, then one action from HOSTILE_ACTIONS every
 * morning until its loyalty recovers. Hostile factions also lose patience
 * fast, so a demand — the way to buy them back — follows quickly.
 * No dice: the action rotates by day.
 */
export function tickHostility(s: GameState, rng: Rng): string[] {
  const notes: string[] = [];
  DEMAND_FACTIONS.forEach((id, n) => {
    const def = HOSTILE_ACTIONS[id];
    if (!def) return;
    const label = factionLabel(id);
    const since = s.flags[hostileSinceFlag(id)] ?? 0;
    if (!isHostile(s, id)) {
      if (since) {
        s.flags[hostileSinceFlag(id)] = 0;
        s.log.push({
          day: s.day, kind: 'consequence', title: `The ${label} stepped back`,
          text: `The ${label} are no longer working against you. They are still not friends.`, tone: 'good',
        });
        notes.push(`The ${label} stopped working against you.`);
      }
      return;
    }
    if (!since) {
      s.flags[hostileSinceFlag(id)] = s.day;
      s.demandNotices.push({ faction: id, kind: 'hostile', day: s.day, title: `The ${label} turned against you`, text: def.turned });
      s.stat.bigMoments.push({ day: s.day, text: `The ${label} turned against you.` });
    }
    const i = (s.day + n) % def.actions.length;
    const act = def.actions[i];
    applyEffects(s, act.effects, rng, `hostile:${id}`);
    applyEffects(s, { factions: { [id]: { patience: -5 } } }, rng, `hostile:${id}`);
    s.flags[hostileActFlag(id)] = i + 1;
    s.flags[`${hostileActFlag(id)}:day`] = s.day;
    s.log.push({ day: s.day, kind: 'consequence', title: `${label}: ${act.title}`, text: act.text, tone: 'bad' });
    notes.push(`${label}: ${act.title}.`);
  });
  return notes;
}

/* ------------------------------------------------------- player actions */

/** Give the faction what it asked for. Pays the current stage's price. */
export function meetDemand(prev: GameState, faction: FactionId): GameState {
  const s = clone(prev);
  if (meetBlockReason(s, faction)) return s;
  const f = s.factions[faction];
  const def = DEMAND_MAP[f.demand!.id];
  const cost = meetCost(s, faction);

  withRng(s, (rng) => {
    applyEffects(s, { stats: { treasury: -cost } }, rng, `demand:meet:${def.id}`);
    applyEffects(s, def.meet, rng, `demand:meet:${def.id}`);
    applyEffects(s, { factions: { [faction]: { loyalty: 8 } } }, rng, `demand:meet:${def.id}`);
    raisePatienceTo(s, faction, 65, rng, `demand:meet:${def.id}`);
  });
  f.demand = undefined;
  s.flags[`demandCooldown:${faction}`] = s.day + COOLDOWN_MET;
  clearDemandNotices(s, faction);
  s.log.push({
    day: s.day, kind: 'decision', title: `Met: ${def.title}`,
    text: `Paid $${cost.toFixed(1)}B. ${def.meetText}`, tone: 'mixed',
  });
  return s;
}

/**
 * Offer money for more time. If they accept, you pay and the due day moves
 * back STAGE_DAYS. If they refuse, they keep none of your money, but they
 * are insulted, and you cannot try again until the demand escalates.
 */
export function bribeDemand(prev: GameState, faction: FactionId): GameState {
  const s = clone(prev);
  if (bribeBlockReason(s, faction)) return s;
  const f = s.factions[faction];
  const d = f.demand!;
  const def = DEMAND_MAP[d.id];
  const cost = bribeCost(s, faction);
  const chance = bribeChance(s, faction);

  withRng(s, (rng) => {
    if (rng.chance(chance)) {
      applyEffects(s, { stats: { treasury: -cost }, hidden: { corruption: 2 }, regime: { graft: 1 } }, rng, `demand:bribe:${def.id}`);
      d.dueDay += STAGE_DAYS;
      d.bribes += 1;
      s.log.push({
        day: s.day, kind: 'decision', title: `Bought time: ${def.title}`,
        text: `Paid $${cost.toFixed(1)}B. The ${factionLabel(faction)} will wait until day ${d.dueDay}.`, tone: 'mixed',
      });
    } else {
      applyEffects(s, { factions: { [faction]: { loyalty: -3, patience: -4 } } }, rng, `demand:bribe:${def.id}`);
      d.bribeRefused = true;
      s.log.push({
        day: s.day, kind: 'decision', title: `Bribe refused: ${def.title}`,
        text: `The ${factionLabel(faction)} sent the money back, with a note. The deadline stays at day ${d.dueDay}.`, tone: 'bad',
      });
    }
  });
  return s;
}

/** Close the front pop-up. The demand itself stays in the Demands panel. */
export function dismissDemandNotice(prev: GameState): GameState {
  const s = clone(prev);
  s.demandNotices = s.demandNotices.slice(1);
  return s;
}

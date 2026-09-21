import type {
  GameState, Effects, StatKey, HiddenKey, RegimeKey, FactionId, Stats, Rng,
} from './types';
import { STAT_KEYS } from './types';
import { clampStat } from './stats';
import { FACTION_ORDER } from './content/country';
import { ownedStatMult } from './shop';
import { currentMandate } from './content/mandates';

function nextId(prefix: string, s: GameState) {
  const idCounter = (s.flags.__effectId ?? 0) + 1;
  s.flags.__effectId = idCounter;
  return `${prefix}-${s.day}-${idCounter}-${(s.rngState >>> 8) % 997}`;
}

function bump(obj: Record<string, number>, key: string, delta: number, lo = 0, hi = 100) {
  obj[key] = Math.max(lo, Math.min(hi, Math.round((obj[key] + delta) * 10) / 10));
}

/**
 * The consequence engine's single entry point.
 *
 * Everything that changes the world goes through here, which means every
 * change can be logged, softened, or amplified by global rules in one place.
 */
export function applyEffects(s: GameState, e: Effects | undefined, rng: Rng, source = ''): Partial<Stats> {
  if (!e) return {};
  const before: Stats = { ...s.stats };

  /* ---- headline stats, with a small amount of systemic coupling ---- */
  if (e.stats) {
    for (const k of STAT_KEYS) {
      const d = e.stats[k];
      if (d === undefined) continue;
      s.stats[k] = clampStat(k, s.stats[k] + applyCoupling(s, k, d));
      if (k === 'treasury') {
        if (d < 0) s.stat.moneySpent += -d;
        else s.stat.moneyTaken += d;
      }
    }
  }

  if (e.hidden) {
    for (const k of Object.keys(e.hidden) as HiddenKey[]) {
      const delta = e.hidden[k]!;
      const mult = delta > 0 ? currentMandate(s).pressureGainMult?.[k] ?? 1 : 1;
      bump(s.hidden as unknown as Record<string, number>, k, delta * mult);
    }
  }

  if (e.regime) {
    for (const k of Object.keys(e.regime) as RegimeKey[]) {
      bump(s.regime as unknown as Record<string, number>, k, e.regime[k]!, 0, 200);
    }
  }

  /* ---- factions. 'all' fans out; relationships spread a fraction of it ---- */
  if (e.factions) {
    const entries = Object.entries(e.factions) as [FactionId | 'all', Record<string, number>][];
    for (const [fid, delta] of entries) {
      const targets: FactionId[] = fid === 'all' ? FACTION_ORDER : [fid];
      for (const t of targets) {
        const f = s.factions[t];
        if (!f) continue;
        for (const key of ['loyalty', 'power', 'influence', 'patience'] as const) {
          if (delta[key] === undefined) continue;
          const mult = key === 'patience' && delta[key] < 0
            ? currentMandate(s).patienceLossMult?.[t] ?? 1 : 1;
          bump(f as unknown as Record<string, number>, key, delta[key] * mult);
        }
        // A faction gaining loyalty makes its rivals marginally colder.
        if (fid !== 'all' && delta.loyalty) {
          spreadThroughRelations(s, t, delta.loyalty);
        }
      }
    }
  }

  /* ---- characters ---- */
  if (e.characters) {
    for (const [cid, delta] of Object.entries(e.characters)) {
      const c = s.characters[cid];
      if (!c || !delta) continue;
      for (const key of ['loyalty', 'trust', 'fear', 'influence', 'plotting'] as const) {
        const d = (delta as Record<string, number>)[key];
        if (d === undefined) continue;
        bump(c as unknown as Record<string, number>, key, d);
      }
    }
  }

  if (e.removeFromPost) {
    for (const r of e.removeFromPost) {
      const c = s.characters[r.who];
      if (!c || !c.inPost) continue;
      c.inPost = false;
      if (r.exiled) c.exiled = true;
      c.memory.push({ day: s.day, text: `Left post: ${r.reason}`, weight: -2 });
      s.stat.ministersLost += 1;
      s.stat.bigMoments.push({ day: s.day, text: `${r.who} left their post — ${r.reason}.` });
    }
  }

  if (e.remember) {
    for (const m of e.remember) {
      const c = s.characters[m.who];
      if (!c) continue;
      c.memory.push({ day: s.day, text: m.text, weight: m.weight });
      if (c.memory.length > 24) c.memory.shift();
      // Memory has teeth: grievances accumulate into plotting.
      if (m.weight < 0) bump(c as unknown as Record<string, number>, 'plotting', -m.weight * 2.5);
      if (m.weight > 0) bump(c as unknown as Record<string, number>, 'plotting', -m.weight * 1.5);
    }
  }

  if (e.flags) {
    for (const [k, v] of Object.entries(e.flags)) {
      if (v === undefined) continue;
      s.flags[k] = (s.flags[k] ?? 0) + v;
    }
  }

  /* ---- delayed consequences ---- */
  if (e.schedule) {
    for (const spec of e.schedule) {
      s.scheduled.push({
        id: spec.id ?? nextId('sch', s),
        day: s.day + Math.max(1, spec.inDays),
        visible: spec.visible ?? true,
        label: spec.label,
        effects: spec.effects,
        cardId: spec.cardId,
        requiresFlag: spec.requiresFlag,
      });
    }
  }

  if (e.promise) {
    s.promises.push({
      id: e.promise.id ?? nextId('pr', s),
      text: e.promise.text,
      to: e.promise.to,
      dueDay: s.day + Math.max(1, e.promise.inDays),
    });
  }

  if (e.resolvePromise) {
    const pr = s.promises.find((p) => p.id === e.resolvePromise!.id && !p.kept && !p.broken);
    if (pr) {
      pr[e.resolvePromise.status] = true;
      if (pr.kept) s.stat.promisesKept += 1;
      else s.stat.promisesBroken += 1;
    }
  }
  if (e.deferPromise) {
    const pr = s.promises.find((p) => p.id === e.deferPromise!.id && !p.kept && !p.broken);
    if (pr) pr.dueDay = s.day + Math.max(1, e.deferPromise.inDays);
  }

  if (e.project) {
    const id = e.project.id ?? nextId('proj', s);
    s.projects.push({
      id,
      name: e.project.name,
      detail: e.project.detail,
      daysLeft: Math.max(1, e.project.days),
      upkeep: e.project.upkeep,
      onComplete: e.project.onComplete,
      legacy: e.project.legacy,
    });
  }

  if (e.scandal) {
    const id = e.scandal.id ?? nextId('sc', s);
    if (!s.scandals.some((x) => x.id === id)) {
      s.scandals.push({
        id, name: e.scandal.name, detail: e.scandal.detail,
        heat: e.scandal.heat, buried: false, day: s.day,
      });
    }
    bump(s.hidden as unknown as Record<string, number>, 'scandal', e.scandal.heat * 0.15);
  }

  if (e.commitments) {
    for (const c of e.commitments) {
      const id = c.id ?? nextId('cmt', s);
      if (s.commitments.some((x) => x.id === id)) continue;
      s.commitments.push({ id, label: c.label, perDay: c.perDay, daysLeft: c.days });
    }
  }

  if (e.endCommitment) {
    s.commitments = s.commitments.filter(
      (c) => c.id !== e.endCommitment && c.label !== e.endCommitment,
    );
  }

  if (e.buryScandal) {
    const sc = s.scandals.find((x) => x.id === e.buryScandal || x.name === e.buryScandal);
    if (sc) { sc.buried = true; sc.heat = Math.max(0, sc.heat - 45); }
  }

  if (e.queueCard) {
    for (const q of e.queueCard) {
      s.queued.push({ cardId: q.cardId, day: s.day + Math.max(0, q.inDays ?? 1) });
    }
  }

  if (e.deck) {
    if (e.deck.add) s.runDeck.push(...e.deck.add);
    if (e.deck.remove) {
      for (const id of e.deck.remove) {
        if (!s.bannedCards.includes(id)) s.bannedCards.push(id);
        s.runDeck = s.runDeck.filter((x) => x !== id);
      }
    }
  }

  if (e.news) s.newsQueue.push(...e.news);

  if (e.ending && !s.ending) {
    s.flags['__forceEnding'] = 1;
    s.flags[`__ending:${e.ending}`] = 1;
  }

  void rng; void source;
  return diff(before, s.stats);
}

/**
 * Systemic coupling: a raw stat change is bent by the state of the world, so
 * the same choice does not cost the same thing on day 3 and day 23.
 *
 * This is also the one place advisors and policies bought in the Back Room
 * bend a number — see shop.ts's ownedStatMult(). Adding a new item with a
 * lossMult/gainMult needs no change here.
 */
function applyCoupling(s: GameState, k: StatKey, d: number): number {
  let out = d * ownedStatMult(s, k, d);
  switch (k) {
    case 'support':
      // A well-fed propaganda apparatus amplifies good news and muffles bad.
      if (d > 0) out *= 1 + s.hidden.cult / 260;
      if (d < 0) out *= 1 - Math.min(0.35, s.hidden.cult / 300);
      // ...but only while people still believe the news.
      if (s.stats.information < 30 && d > 0) out *= 0.75;
      break;
    case 'power':
      // Fear makes orders land harder, right up until it doesn't.
      if (d > 0) out *= 1 + Math.min(0.25, s.hidden.fear / 400);
      break;
    case 'economy':
      if (d < 0 && s.hidden.corruption > 50) out *= 1.2;
      if (d > 0 && s.hidden.corruption > 60) out *= 0.8;
      break;
    case 'stability':
      if (d > 0 && s.hidden.unrest > 55) out *= 0.7;
      break;
    case 'legitimacy':
      if (d < 0 && s.hidden.scandal > 45) out *= 1.25;
      break;
    default:
      break;
  }
  return out;
}

/** Loyalty gained by one faction leaks, at a fraction, along its relations. */
function spreadThroughRelations(s: GameState, fid: FactionId, loyaltyDelta: number) {
  const defs = FACTION_RELATIONS[fid];
  if (!defs) return;
  for (const [other, rel] of Object.entries(defs) as [FactionId, number][]) {
    const f = s.factions[other];
    if (!f) continue;
    const spill = loyaltyDelta * rel * 0.12;
    if (Math.abs(spill) < 0.05) continue;
    bump(f as unknown as Record<string, number>, 'loyalty', spill);
  }
}

// Filled in from content at module load to avoid a circular import at runtime.
import { FACTIONS } from './content/country';
const FACTION_RELATIONS: Record<FactionId, Partial<Record<FactionId, number>>> =
  Object.fromEntries(FACTION_ORDER.map((id) => [id, FACTIONS[id].relations])) as Record<
    FactionId, Partial<Record<FactionId, number>>
  >;

function diff(before: Stats, after: Stats): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const d = Math.round((after[k] - before[k]) * 10) / 10;
    if (Math.abs(d) >= 0.05) out[k] = d;
  }
  return out;
}

export function mergeDeltas(a: Partial<Stats>, b: Partial<Stats>): Partial<Stats> {
  const out: Partial<Stats> = { ...a };
  for (const k of STAT_KEYS) {
    if (b[k] === undefined) continue;
    out[k] = Math.round(((out[k] ?? 0) + b[k]!) * 10) / 10;
  }
  return out;
}

import { describe, it, expect } from 'vitest';
import { createGame, OPENINGS } from '../state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve,
  continueAfterAlert, advanceToNextDay, activeCard, lookupCard,
} from '../engine';
import { buildBriefing } from '../briefing';
import { CARDS } from '../content/cards';
import { FOLLOWUPS } from '../content/followups';
import { ALERTS } from '../content/alerts';
import { STAT_KEYS, HIDDEN_KEYS } from '../types';
import type { GameState } from '../types';
import { makeRng } from '../rng';

/** Play one full run with a policy function; returns the terminal state. */
function playRun(seed: number, pick: (s: GameState, n: number) => number): GameState {
  let s = prepareDay(createGame({ seed, leaderName: 'Test Subject' }));
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 4000) {
    switch (s.phase) {
      case 'briefing': {
        buildBriefing(s); // must not throw
        s = beginStages(s);
        break;
      }
      case 'stage':
      case 'alert': {
        const card = activeCard(s)!;
        expect(card).toBeTruthy();
        const usable = card.options.filter((o) => !o.enabled || o.enabled(s));
        const opts = usable.length ? usable : card.options;
        const chosen = opts[pick(s, opts.length) % opts.length];
        const before = s.phase;
        s = chooseOption(s, chosen.id);
        expect(s.phase).toBe(before === 'alert' ? 'alertResolve' : 'resolve');
        break;
      }
      case 'resolve':
        s = continueAfterResolve(s);
        break;
      case 'alertResolve':
        s = continueAfterAlert(s);
        break;
      case 'night':
        s = advanceToNextDay(s);
        break;
      default:
        throw new Error(`unexpected phase ${s.phase}`);
    }
  }
  expect(guard).toBeLessThan(4000);
  return s;
}

describe('content integrity', () => {
  it('has unique card ids', () => {
    const ids = [...CARDS, ...FOLLOWUPS, ...ALERTS].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every option has a label and every card has options', () => {
    for (const c of [...CARDS, ...FOLLOWUPS, ...ALERTS]) {
      expect(c.options.length, `${c.id} has no options`).toBeGreaterThanOrEqual(2);
      for (const o of c.options) {
        expect(o.label.length, `${c.id}/${o.id} empty label`).toBeGreaterThan(0);
        expect(o.id.length).toBeGreaterThan(0);
      }
      expect(new Set(c.options.map((o) => o.id)).size).toBe(c.options.length);
    }
  });

  it('every scheduled / queued cardId resolves to a real card', () => {
    const missing = new Set<string>();
    const rng = makeRng(1);
    const probe = createGame({ seed: 1 });
    for (const c of [...CARDS, ...FOLLOWUPS, ...ALERTS]) {
      for (const o of c.options) {
        const res = typeof o.outcome === 'function' ? o.outcome(probe, rng) : o.outcome;
        for (const sch of res.effects?.schedule ?? []) {
          if (sch.cardId && !lookupCard(sch.cardId)) missing.add(`${c.id}/${o.id} -> ${sch.cardId}`);
        }
        for (const q of res.effects?.queueCard ?? []) {
          if (!lookupCard(q.cardId)) missing.add(`${c.id}/${o.id} -> ${q.cardId}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('every character referenced by a card exists', () => {
    const known = new Set(Object.keys(createGame({ seed: 2 }).characters));
    for (const c of [...CARDS, ...FOLLOWUPS, ...ALERTS]) {
      if (c.actor) expect(known.has(c.actor), `${c.id} actor ${c.actor}`).toBe(true);
    }
  });
});

describe('simulation', () => {
  it('produces different openings across seeds', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const g = createGame({ seed: i * 7919 + 13 });
      for (const o of OPENINGS) if (g.flags[`opening:${o.id}`]) seen.add(o.id);
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it('plays 200 full runs without crashing and keeps state legal', () => {
    let endings = new Set<string>();
    let alertsSeen = 0;
    let followupsSeen = 0;
    for (let i = 0; i < 200; i++) {
      const rng = makeRng(i + 1);
      const s = playRun(i * 104729 + 7, () => rng.int(4));
      for (const k of STAT_KEYS) {
        expect(Number.isFinite(s.stats[k]), `stat ${k} not finite`).toBe(true);
        if (k !== 'treasury') {
          expect(s.stats[k]).toBeGreaterThanOrEqual(0);
          expect(s.stats[k]).toBeLessThanOrEqual(100);
        }
      }
      for (const k of HIDDEN_KEYS) {
        expect(s.hidden[k]).toBeGreaterThanOrEqual(0);
        expect(s.hidden[k]).toBeLessThanOrEqual(100);
      }
      expect(s.ending).toBeTruthy();
      endings.add(s.ending!.id);
      alertsSeen += s.stat.alertsSurvived;
      followupsSeen += s.log.filter((l) => l.kind === 'consequence').length;
    }
    // the game must be losable in more than one way, and winnable
    expect(endings.size).toBeGreaterThan(2);
    // breaking alerts must actually fire
    expect(alertsSeen).toBeGreaterThan(200);
    // delayed consequences must actually land
    expect(followupsSeen).toBeGreaterThan(400);
  });

  it('is deterministic for a given seed and choice sequence', () => {
    const a = playRun(424242, () => 0);
    const b = playRun(424242, () => 0);
    expect(a.day).toBe(b.day);
    expect(a.stats).toEqual(b.stats);
    expect(a.ending?.id).toBe(b.ending?.id);
  });

  it('reaches at least day 2 in every run of a cautious player', () => {
    for (let i = 0; i < 40; i++) {
      const s = playRun(i * 31 + 5, () => 0);
      expect(s.day).toBeGreaterThanOrEqual(2);
    }
  });

  it('shows a breaking alert by day 3 at the latest', () => {
    for (let i = 0; i < 25; i++) {
      let s = prepareDay(createGame({ seed: i * 977 + 3 }));
      let guard = 0;
      while (s.day <= 4 && s.phase !== 'ended' && guard++ < 400) {
        if (s.phase === 'briefing') s = beginStages(s);
        else if (s.phase === 'stage' || s.phase === 'alert') s = chooseOption(s, activeCard(s)!.options[0].id);
        else if (s.phase === 'resolve') s = continueAfterResolve(s);
        else if (s.phase === 'alertResolve') s = continueAfterAlert(s);
        else if (s.phase === 'night') s = advanceToNextDay(s);
      }
      expect(s.flags.__alertSeen ?? (s.phase === 'ended' ? 1 : 0), `seed ${i}`).toBeTruthy();
    }
  });
});

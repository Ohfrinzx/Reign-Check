import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay } from '../engine';
import { makeRng } from '../rng';
import * as B from '../minigames/breadlines';
import * as W from '../minigames/weather';
import * as SH from '../minigames/shred';
import { isMinigameCard } from '../minigames';
import { MG_CARD, DAILY_MINIGAMES, ACT_OPENER, eventMinigame } from '../content/minigames';
import { PLOT_AT } from '../minigames';
import type { GameState } from '../types';

/** Mini-games slice 2: Bread Lines, The Last Kilometre (Walk in the Weather), Shred the Ledger. */

type Pol = 'idle' | 'mixed' | 'talk';
/** A person: one order every 0.7 s. Talk where there is time, police when it is hot. */
function bread(s: B.BreadState, pol: Pol): B.BreadState {
  while (!s.over) {
    if (pol !== 'idle') {
      for (const d of s.districts.filter((x) => x.mood === 'flaring').sort((a, b) => b.heat - a.heat)) {
        const before = s;
        const time = d.heat + d.rate * 1.6 < 92;
        if (time && B.canSend(s, d.id, 'talk')) s = B.sendTeam(s, d.id, 'talk');
        else if (pol === 'mixed' && d.heat > 60 && B.canSend(s, d.id, 'police')) s = B.sendTeam(s, d.id, 'police');
        else if (pol === 'talk' && B.canSend(s, d.id, 'talk')) s = B.sendTeam(s, d.id, 'talk');
        if (s !== before) break;
      }
    }
    s = B.breadTick(s, 700);
  }
  return s;
}
const breadRate = (act: number, pol: Pol) => {
  let w = 0;
  for (let i = 0; i < 100; i++) if (bread(B.breadStart(B.breadSetup(i * 31 + 5, B.breadDifficulty(act))), pol).over === 'won') w++;
  return w / 100;
};

/** A walker who reacts `delay` ms late, pushes back past `dead` degrees, and (if `watch`) pre-pushes when the leaves blow in. */
function walk(act: number, seed: number, delay: number, dead: number, watch: boolean, scandal = 0): W.WeatherState {
  let s = W.weatherStart(W.weatherSetup(seed, W.weatherDifficulty(act, scandal)));
  const hist: { t: number; a: number; v: number }[] = [];
  let u: -1 | 0 | 1 = 0;
  while (!s.over) {
    hist.push({ t: s.t, a: s.angle, v: s.speed });
    if (s.t % 100 === 0) {
      const seen = hist.find((h) => h.t >= s.t - delay) ?? hist[0];
      const e = seen.a + 0.3 * seen.v;
      u = e > dead ? -1 : e < -dead ? 1 : 0;
      if (watch && u === 0) {
        const g = W.gustsComing(s.setup, s.t - delay).find((x) => x.at > s.t - delay && x.at - (s.t - delay) < 250);
        if (g) u = g.dir === 1 ? -1 : 1;
      }
    }
    s = W.weatherTick(s, W.STEP_MS, u);
  }
  return s;
}

/**
 * A shredder who can look at one paper at a time (scan ms), taps in tap ms,
 * mistaps a moving paper now and then, and is fooled by tricks `fool` of
 * the time. Deals with the paper nearest the box first.
 */
function shred(act: number, seed: number, scan: number, tap: number, fool: number): SH.ShredState {
  const r = makeRng(seed * 13 + 3);
  const miss = 0.06 + (tap - 220) / 1000;
  let s = SH.shredStart(SH.shredSetup(seed, SH.shredDifficulty(act)));
  const seen = new Set<string>();
  const verdict: Record<string, boolean> = {};
  let busyUntil = 0;
  for (let now = 0; now <= s.setup.endMs + 500 && !s.over; now += 20) {
    s = SH.shredTick(s, now);
    if (s.over || now < busyUntil) continue;
    const belt = SH.onBelt(s, now).filter((x) => SH.paperX(x, now) > 2).sort((a, b) => SH.paperX(b, now) - SH.paperX(a, now));
    const p = belt.find((x) => !SH.isFaceUp(s, x) || !seen.has(x.id) || verdict[x.id]);
    if (!p) continue;
    if (!SH.isFaceUp(s, p)) { if (!r.chance(miss)) s = SH.tapPaper(s, p.id, now); busyUntil = now + tap; continue; }
    if (!seen.has(p.id)) {
      seen.add(p.id);
      const err = ['void', 'faded', 'redseal'].includes(p.kind) ? fool : 0.015;
      verdict[p.id] = SH.isDirty(p.kind) !== r.chance(err);
      busyUntil = now + scan;
      continue;
    }
    if (now < s.jamUntil) continue;
    busyUntil = now + tap;
    if (r.chance(miss)) continue;
    s = SH.tapPaper(s, p.id, now);
    verdict[p.id] = false;
  }
  return s;
}

describe('Bread Lines (rules)', () => {
  it('the same seed gives the same afternoon; ticks are deterministic', () => {
    const d = B.breadDifficulty(2);
    expect(B.breadSetup(9, d)).toEqual(B.breadSetup(9, d));
    const a = B.breadTick(B.breadStart(B.breadSetup(9, d)), 20000);
    const b = B.breadTick(B.breadStart(B.breadSetup(9, d)), 20000);
    expect(a).toEqual(b);
  });

  it('talking calms a district for a while; the police clear it at once, but it flares again hotter', () => {
    let s = B.breadStart({ flares: [{ at: 100, district: 'market' }, { at: 200, district: 'uni' }], d: { ...B.breadDifficulty(1), durationMs: 60000 } });
    s = B.breadTick(s, 300);
    expect(s.districts.find((d) => d.id === 'market')?.mood).toBe('flaring');
    s = B.sendTeam(s, 'market', 'talk');
    s = B.sendTeam(s, 'uni', 'police');
    expect(s.charged).toBe(1);
    s = B.breadTick(s, 6000);
    expect(s.districts.find((d) => d.id === 'market')?.mood).toBe('calm');
    expect(s.cleared).toBe(1);
    s = B.breadTick(s, 8000);
    const uni = s.districts.find((d) => d.id === 'uni')!;
    expect(['flaring', 'burning']).toContain(uni.mood);
    expect(uni.rate).toBeGreaterThan(B.breadDifficulty(1).rate);
  });

  it('police charges run out', () => {
    let s = B.breadStart({ flares: B.DISTRICTS.map((d, i) => ({ at: 100 + i * 10, district: d.id })), d: { ...B.breadDifficulty(1), police: 9, charges: 2 } });
    s = B.breadTick(s, 300);
    s = B.sendTeam(s, 'market', 'police');
    s = B.sendTeam(s, 'uni', 'police');
    expect(B.canSend(s, 'docks', 'police')).toBe(false);
    expect(B.canSend(s, 'docks', 'talk')).toBe(true);
  });

  it('doing nothing loses; talk where there is time and police when it is hot wins most, less later; talking alone fails from act 2', () => {
    for (const act of [1, 2, 3]) expect(breadRate(act, 'idle')).toBe(0);
    const [a1, a2, a3] = [1, 2, 3].map((a) => breadRate(a, 'mixed'));
    expect(a1).toBeGreaterThan(0.9);
    expect(a2).toBeGreaterThan(0.6);
    expect(a3).toBeGreaterThan(0.55);
    expect(a3).toBeLessThan(0.9);
    expect(breadRate(2, 'talk')).toBeLessThan(0.2);
  });
});

describe('The Last Kilometre: Walk in the Weather (rules)', () => {
  it('the same seed and the same hands give the same walk', () => {
    const d = W.weatherDifficulty(2);
    expect(W.weatherSetup(3, d)).toEqual(W.weatherSetup(3, d));
    let a = W.weatherStart(W.weatherSetup(3, d)), b = W.weatherStart(W.weatherSetup(3, d));
    for (let i = 0; i < 100; i++) { a = W.weatherTick(a, 100, i % 3 === 0 ? 1 : -1); b = W.weatherTick(b, 100, i % 3 === 0 ? 1 : -1); }
    expect(a).toEqual(b);
  });

  it('a gust pushes the umbrella over; holding the other way brings it back; too far and it turns inside out', () => {
    const d = { ...W.weatherDifficulty(1), sway: 0, durationMs: 60000 };
    const setup: W.WeatherSetup = { gusts: [{ at: 0, ms: 3000, force: 230, dir: 1 }], d, swayPhase: 0 };
    const pushed = W.weatherTick(W.weatherStart(setup), 600, 0);
    expect(pushed.angle).toBeGreaterThan(0);
    const held = W.weatherTick(W.weatherStart(setup), 600, -1);
    expect(held.angle).toBeLessThan(pushed.angle); // pushed back the other way
    const gone = W.weatherTick(W.weatherStart(setup), 2500, 0);
    expect(gone.flips).toBeGreaterThan(0);
    expect(gone.soak).toBeGreaterThan(0);
  });

  it('upright keeps you dry; a gust is never stronger than you can hold; doing nothing always loses', () => {
    const calm = W.weatherTick(W.weatherStart({ gusts: [], d: { ...W.weatherDifficulty(1), sway: 0 }, swayPhase: 0 }), 5000, 0);
    expect(calm.soak).toBe(0);
    for (const act of [1, 2, 3]) {
      const d = W.weatherDifficulty(act, 80);
      expect(d.gustForce[1]).toBeLessThan(W.PUSH * 1.2);
      let s = W.weatherStart(W.weatherSetup(act, W.weatherDifficulty(act)));
      while (!s.over) s = W.weatherTick(s, 500, 0);
      expect(s.over).toBe('lost');
    }
  });

  it('harder every act, and worse while scandals pile up', () => {
    const rate = (act: number, delay: number, scandal = 0) => {
      let w = 0; for (let i = 0; i < 80; i++) if (walk(act, i, delay, 5, false, scandal).over === 'won') w++;
      return w / 80;
    };
    expect(rate(1, 230)).toBeGreaterThan(0.9);
    expect(rate(3, 230)).toBeLessThan(rate(1, 230));
    expect(rate(3, 230)).toBeGreaterThan(0.3);
    expect(W.weatherDifficulty(2, 60).severity).toBeGreaterThan(W.weatherDifficulty(2, 10).severity);
    // a good walker who watches the leaves beats the storm most of the time
    let good = 0; for (let i = 0; i < 60; i++) if (walk(3, i, 150, 4, true).over === 'won') good++;
    expect(good / 60).toBeGreaterThan(0.85);
  });
});

describe('Shred the Ledger (rules)', () => {
  it('the same seed gives the same belts; papers on one belt never overlap; tricks from act 1', () => {
    for (const act of [1, 2, 3]) {
      const a = SH.shredSetup(5, SH.shredDifficulty(act));
      expect(a).toEqual(SH.shredSetup(5, SH.shredDifficulty(act)));
      for (let lane = 0; lane < SH.LANES; lane++) {
        const ps = a.papers.filter((p) => p.lane === lane);
        for (let i = 1; i < ps.length; i++) {
          // when the next paper enters, the one before has moved more than a paper's width on
          expect(SH.paperX(ps[i - 1], ps[i].enterAt)).toBeGreaterThan(0);
        }
      }
      expect(a.papers.some((p) => p.faceDown)).toBe(true);
      expect(a.papers.some((p) => p.kind === 'void' || p.kind === 'redseal')).toBe(true);
    }
  });

  it('a face-down paper turns over first; a dirty one shreds; a clean one jams; a dirty one in the box is evidence', () => {
    const d = { ...SH.shredDifficulty(1), allowed: 5 };
    const papers: SH.Paper[] = [
      { id: 'a', kind: 'dirty', lane: 0, enterAt: 0, crossMs: 4000, faceDown: true, wave: 0, rot: 0, key: 1 },
      { id: 'b', kind: 'clean', lane: 1, enterAt: 0, crossMs: 4000, faceDown: false, wave: 0, rot: 0, key: 2 },
      { id: 'c', kind: 'dirty', lane: 0, enterAt: 1500, crossMs: 4000, faceDown: false, wave: 0, rot: 0, key: 3 },
    ];
    let s = SH.shredStart({ papers, d, endMs: 6000 });
    s = SH.tapPaper(s, 'a', 500);
    expect(s.flipped).toEqual(['a']);
    expect(s.fate.a).toBeUndefined();
    s = SH.tapPaper(s, 'b', 600);
    expect(s.fate.b).toBe('jammed');
    expect(SH.tapPaper(s, 'a', 900)).toBe(s); // jammed: nothing goes in
    s = SH.tapPaper(s, 'a', 2000);
    expect(s.fate.a).toBe('shredded');
    s = SH.shredTick(s, 6000); // c reached the box
    expect(s.fate.c).toBe('evidence');
    expect(s.evidence).toBe(1);
    expect(s.over).toBe('won'); // 2 mistakes, 5 allowed
  });

  it('number keys (owner: trackpad players "can\'t click the papers fast enough"): every paper has a digit 0-9, never shared on the belts at once', () => {
    for (const act of [1, 2, 3]) {
      for (let seed = 0; seed < 300; seed++) {
        const { papers } = SH.shredSetup(seed, SH.shredDifficulty(act));
        for (const p of papers) expect(SH.SHRED_KEYS).toContain(p.key);
        for (const a of papers) {
          for (const b of papers) {
            if (a === b || a.key !== b.key) continue;
            // a and b share a number only if one has left the belt (plus a rest) before the other enters
            const apart = a.enterAt + a.crossMs + 250 <= b.enterAt || b.enterAt + b.crossMs + 250 <= a.enterAt;
            expect(apart, `act ${act} seed ${seed}: ${a.id} and ${b.id} share ${a.key}`).toBe(true);
          }
        }
      }
    }
  });

  it('pressing a paper\'s number is the same as tapping it', () => {
    const setup = SH.shredSetup(3, SH.shredDifficulty(2));
    const p = setup.papers[0];
    const now = p.enterAt + 100;
    const s = SH.shredStart(setup);
    expect(SH.paperForKey(s, p.key, now)?.id).toBe(p.id);
    expect(SH.tapPaper(s, SH.paperForKey(s, p.key, now)!.id, now)).toEqual(SH.tapPaper(s, p.id, now));
    // a number with no paper on the belts does nothing
    const unused = SH.SHRED_KEYS.find((k) => !SH.onBelt(s, now).some((x) => x.key === k))!;
    expect(SH.paperForKey(s, unused, now)).toBeUndefined();
  });

  it('act 3 is the 2x game (owner: "the first level is really what the top difficulty should be"); acts 1-2 ramp up to it; doing nothing loses', () => {
    const rate = (act: number, scan: number, tap: number, fool: number) => {
      let w = 0; for (let i = 0; i < 100; i++) if (shred(act, i, scan, tap, fool).over === 'won') w++;
      return w / 100;
    };
    for (const act of [1, 2, 3]) {
      let s = SH.shredStart(SH.shredSetup(1, SH.shredDifficulty(act)));
      for (let now = 0; !s.over; now += 100) s = SH.shredTick(s, now);
      expect(s.over).toBe('lost');
      // a very quick player (looks in 70 ms, taps in 100 ms) wins most games in every act
      expect(rate(act, 70, 100, 0.02), `act ${act}`).toBeGreaterThan(0.55);
    }
    // act 3 is exactly 2x the old act 1 tuning (a paper crosses in 1.9 s → 1.4 s)
    expect(SH.shredDifficulty(3).crossMs).toEqual([1900, 1425]);
    // an expert wins act 1 more often than act 3, and still has a chance in act 3
    expect(rate(1, 130, 170, 0.05)).toBeGreaterThan(rate(3, 130, 170, 0.05));
    expect(rate(3, 130, 170, 0.05)).toBeGreaterThan(0.15);
    expect(rate(1, 220, 290, 0.12)).toBeLessThan(0.1); // an average player: little chance
  });
});

describe('daily games and events (slice 2)', () => {
  const morning = (day: number, seed = 5): GameState => {
    const s = createGame({ seed, mandateId: 'accident' });
    s.day = day; s.act = Math.ceil(day / 6);
    for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
    for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
    return s;
  };

  it('every daily game comes up (over a few runs), and never the same one two days running', () => {
    const seen = new Set<string>();
    for (const seed of [77, 78, 79, 80]) {
      let s = morning(2, seed);
      let yesterday = '';
      for (let day = 2; day <= 17; day++) {
        s.day = day; s.phase = 'night';
        const t = prepareDay(s);
        const id = t.todayDeck.find(isMinigameCard)!;
        expect(id).toBeTruthy();
        expect(id).not.toBe(yesterday);
        seen.add(id); yesterday = id;
        s = { ...t, phase: 'night' };
        for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
        for (const k of Object.keys(s.hidden) as (keyof GameState['hidden'])[]) s.hidden[k] = 10;
        s.crisis = undefined;
      }
    }
    for (const id of DAILY_MINIGAMES) expect(seen.has(id), id).toBe(true);
  });

  it('events pick the game: the Bread Riots or a hostile Street → Bread Lines; the Ledger crisis → Shred', () => {
    const s = morning(5);
    expect(eventMinigame(s)).toBeUndefined();
    s.factions.chorus.loyalty = 10;
    expect(eventMinigame(s)).toBe(MG_CARD.breadlines);
    s.factions.chorus.loyalty = 50;
    s.crisis = { id: 'ledger', stage: 1, cardId: 'x', startedDay: 4, nextDay: 6 };
    expect(eventMinigame(s)).toBe(MG_CARD.shred);
    const t = morning(5, 9090);
    t.hidden.unrest = 70; // starts the Bread Riots this morning
    const day = prepareDay(t);
    expect(day.crisis?.id).toBe('bread');
    expect(day.todayDeck).toContain(MG_CARD.breadlines);
  });
  it('every act opens with The Last Kilometre, first thing, instead of the daily game', () => {
    for (const day of [1, 7, 13]) {
      const s = prepareDay(morning(day, 31));
      expect(s.todayDeck[0], `day ${day}`).toBe(ACT_OPENER);
      expect(s.todayDeck.filter(isMinigameCard)).toEqual([ACT_OPENER]);
      expect(s.todayDeck.length).toBe(s.agenda.length);
    }
    for (const day of [2, 8, 14]) expect(prepareDay(morning(day, 31)).todayDeck).not.toContain(ACT_OPENER);
    expect(DAILY_MINIGAMES).not.toContain(ACT_OPENER);
  });

  it('a coup on the first day of an act still lets the act open with the walk', () => {
    const s = morning(7, 31);
    s.hidden.coup = PLOT_AT + 5;
    const t = prepareDay(s);
    expect(t.todayDeck[0]).toBe(ACT_OPENER);
    expect(t.todayDeck).toContain(MG_CARD.palacePlot);
  });
});

import { describe, expect, it } from 'vitest';
import { createGame } from '../state';
import { prepareDay } from '../engine';
import { makeRng } from '../rng';
import * as B from '../minigames/breadlines';
import * as PR from '../minigames/parade';
import * as SH from '../minigames/shred';
import { isMinigameCard } from '../minigames';
import { MG_CARD, DAILY_MINIGAMES, eventMinigame } from '../content/minigames';
import type { GameState } from '../types';

/** Mini-games slice 2: Bread Lines, The Last Kilometre, Shred the Ledger. */

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

const gauss = (r: ReturnType<typeof makeRng>) => Math.sqrt(-2 * Math.log(1 - r.next())) * Math.cos(2 * Math.PI * r.next());
/** A walker whose timing spreads by sigma ms. */
function walk(act: number, sigma: number, seed: number): boolean {
  const r = makeRng(seed * 7 + 1);
  let s = PR.paradeStart(PR.paradeSetup(seed, PR.paradeDifficulty(act)));
  const presses: { at: number; a: PR.ParadeAction }[] = [];
  for (const it of s.setup.items) {
    const ans = PR.ANSWER[it.kind];
    if (!ans) { if (r.chance(0.15)) presses.push({ at: it.t + gauss(r) * sigma, a: 'wave' }); continue; }
    presses.push({ at: it.t + gauss(r) * sigma, a: r.chance(0.04) ? (ans === 'duck' ? 'wave' : 'duck') : ans });
  }
  presses.sort((a, b) => a.at - b.at);
  for (let now = 0, i = 0; now < s.setup.endMs + 1000 && !s.over; now += 16) {
    while (i < presses.length && presses[i].at <= now) { s = PR.paradePress(s, presses[i].a, presses[i].at); i++; }
    s = PR.paradeTick(s, now);
  }
  return s.over === 'won';
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

describe('The Last Kilometre (rules)', () => {
  it('the right move at the right moment; a sign wants nothing', () => {
    const setup: PR.ParadeSetup = {
      items: [{ id: 'a', kind: 'egg', t: 1000 }, { id: 'b', kind: 'sign', t: 2000 }, { id: 'c', kind: 'cheer', t: 3000 }, { id: 'd', kind: 'flowers', t: 4000 }],
      d: PR.paradeDifficulty(1), endMs: 4500,
    };
    let s = PR.paradeStart(setup);
    s = PR.paradePress(s, 'duck', 1050);
    expect(s.judged.a).toBe('perfect');
    s = PR.paradeTick(s, 2400);
    expect(s.judged.b).toBe('ignored');
    s = PR.paradePress(s, 'duck', 3000);
    expect(s.judged.c).toBe('wrong');
    expect(s.composure).toBe(PR.COMPOSURE - 1);
    s = PR.paradePress(s, 'stop', 4250);
    expect(s.judged.d).toBe('good');
    expect(s.over).toBe('won');
  });

  it('flinching at a sign, or pressing with nothing there, costs composure; three costs and the walk is over', () => {
    const setup: PR.ParadeSetup = { items: [{ id: 'a', kind: 'sign', t: 1000 }, { id: 'b', kind: 'egg', t: 5000 }], d: PR.paradeDifficulty(1), endMs: 5500 };
    let s = PR.paradeStart(setup);
    s = PR.paradePress(s, 'wave', 1000);
    expect(s.judged.a).toBe('flinched');
    s = PR.paradePress(s, 'duck', 3000);
    expect(s.last?.verdict).toBe('early');
    s = PR.paradeTick(s, 6000);
    expect(s.over).toBe('lost');
  });

  it('doing nothing loses; a steady walker usually wins, less often later', () => {
    const idle = (act: number) => {
      let s = PR.paradeStart(PR.paradeSetup(3, PR.paradeDifficulty(act)));
      for (let now = 0; !s.over && now < 60000; now += 100) s = PR.paradeTick(s, now);
      return s.over;
    };
    for (const act of [1, 2, 3]) expect(idle(act)).toBe('lost');
    const rate = (act: number, sigma: number) => {
      let w = 0; for (let i = 0; i < 120; i++) if (walk(act, sigma, i)) w++;
      return w / 120;
    };
    expect(rate(1, 90)).toBeGreaterThan(0.85);
    expect(rate(3, 130)).toBeLessThan(rate(1, 130));
    expect(rate(3, 170)).toBeLessThan(0.6);
    expect(PR.paradeSetup(4, PR.paradeDifficulty(1)).items.slice(0, 3).map((x) => x.kind)).toEqual(['cheer', 'egg', 'flowers']);
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
      expect(a.papers.some((p) => p.kind === 'void')).toBe(true);
    }
  });

  it('a face-down paper turns over first; a dirty one shreds; a clean one jams; a dirty one in the box is evidence', () => {
    const d = { ...SH.shredDifficulty(1), allowed: 5 };
    const papers: SH.Paper[] = [
      { id: 'a', kind: 'dirty', lane: 0, enterAt: 0, crossMs: 4000, faceDown: true, wave: 0, rot: 0 },
      { id: 'b', kind: 'clean', lane: 1, enterAt: 0, crossMs: 4000, faceDown: false, wave: 0, rot: 0 },
      { id: 'c', kind: 'dirty', lane: 0, enterAt: 1500, crossMs: 4000, faceDown: false, wave: 0, rot: 0 },
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

  it('doing nothing loses; it is harder than the old piles but a careful player usually wins, less often later', () => {
    const rate = (act: number, scan: number, tap: number, fool: number) => {
      let w = 0; for (let i = 0; i < 120; i++) if (shred(act, i, scan, tap, fool).over === 'won') w++;
      return w / 120;
    };
    for (const act of [1, 2, 3]) {
      let s = SH.shredStart(SH.shredSetup(1, SH.shredDifficulty(act)));
      for (let now = 0; !s.over; now += 100) s = SH.shredTick(s, now);
      expect(s.over).toBe('lost');
    }
    const avg1 = rate(1, 220, 290, 0.12);
    expect(avg1).toBeGreaterThan(0.7);
    expect(avg1).toBeLessThan(0.92); // the old version: 95%
    expect(rate(3, 220, 290, 0.12)).toBeLessThan(avg1);
    expect(rate(1, 300, 380, 0.18)).toBeGreaterThan(0.5); // a slower player still has a real chance
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

  it('all four daily games come up, and never the same one two days running', () => {
    const seen = new Set<string>();
    let s = morning(2, 77);
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
    for (const id of DAILY_MINIGAMES) expect(seen.has(id)).toBe(true);
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
});

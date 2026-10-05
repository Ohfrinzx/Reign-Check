import { it, expect } from 'vitest';
import { STAT_KEYS } from '../types';
import { createGame } from '../state';
import { computeResources, GRIP_PARTS, LEGITIMACY_PARTS, STAT_GUIDE, statGuide } from '../display';

// Owner: "No where is it explained in my game what information means or what
// it effects." Every number a result pill can show must be explained, and the
// explanation must say what the maths actually does.

it('explains every engine stat exactly once', () => {
  expect(STAT_GUIDE.map((g) => g.key).sort()).toEqual([...STAT_KEYS].sort());
  for (const g of STAT_GUIDE) {
    expect(g.does.length).toBeGreaterThan(40);
    expect(g.feedsText.length).toBeGreaterThan(0);
  }
});

it('names the share each stat has in Grip and Legitimacy, from the same weights the ledger uses', () => {
  expect(statGuide('information').feeds).toBe('grip');
  expect(statGuide('information').feedsText).toBe('15% of Grip');
  expect(statGuide('support').feedsText).toBe('35% of Legitimacy');
  expect(statGuide('economy').feeds).toBe('money');
  expect(statGuide('elite').feeds).toBeNull();
  for (const parts of [GRIP_PARTS, LEGITIMACY_PARTS]) {
    expect(parts.reduce((a, [, w]) => a + w, 0)).toBeCloseTo(1);
  }
});

it('Grip really moves with Information as the guide says', () => {
  const s = createGame({ seed: 7 });
  const grip = () => computeResources(s).find((r) => r.key === 'grip')!.value;
  const before = grip();
  s.stats.information += 20;
  expect(grip() - before).toBeCloseTo(20 * 0.15);
  expect(computeResources(s).find((r) => r.key === 'grip')!.tip).toContain('Information 15%');
});

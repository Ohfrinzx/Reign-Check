import type { CardDef, CardOutcome, Effects, GameState, Rng } from '../types';
import type { MarkDef, DemandReactionDef } from './consequences';
import type { DemandDef } from './demands';
import type { MinigameIntro } from './minigames';

/**
 * BUDGET NIGHT — the card and its story (mini-games slice 3, part A).
 * Rules: src/game/minigames/budget.ts. Screen: src/ui/minigames/BudgetGame.tsx.
 * Owner's choices (2026-10-06): against the clock, 90 seconds — "plenty of
 * time but still can't just sit there"; a bright Finance Ministry desk; in
 * the daily rotation; debt or a Workers/Elites demand brings it.
 */

export const BUDGET_CARD_ID = 'mg-budget';

const score = (s: GameState) => s.flags.mgScore;

/* ------------------------------------------------- the jars at eight o'clock
 * Owner (2026-10-06): a faction that ends above its line should warm to you
 * and remember it; one short at eight cools a little; one that WALKS OUT
 * loses loyalty, remembers it, and uses the budget against you — sometimes
 * a demand, sometimes repayment in small daily amounts, sometimes the full
 * sum later, both with interest. BudgetGame.tsx passes how each jar ended
 * as flags (budget.ts budgetFlags()): `bnDiff:<faction>`, `bnOut:<faction>`.
 */

export const BUDGET_FACTION_IDS = ['staff', 'sable', 'concord', 'combine', 'chorus'] as const;
export type BudgetFaction = (typeof BUDGET_FACTION_IDS)[number];

/** How each faction is named in a sentence, who speaks for it, and what it lost. */
export const BUDGET_WHO: Record<BudgetFaction, { the: string; from: string; what: string }> = {
  staff: { the: 'the Army', from: 'varkov', what: 'spare parts and fuel' },
  sable: { the: 'the Sable Office', from: 'sarran', what: 'its night shifts' },
  concord: { the: 'the Elites', from: 'adamek', what: 'the business rebate' },
  combine: { the: 'the unions', from: 'hess', what: 'the pension top-up' },
  chorus: { the: 'the Street', from: 'vel', what: 'the bread and tram subsidy' },
};
export const budgetMark = (kind: 'generous' | 'walkout' | 'claim', f: BudgetFaction) => `budget-${kind}-${f}`;
const Cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Over the line: +1 loyalty per $1B, up to this. */
export const OVER_MAX = 4;
/** Short at eight (still there): −1 per $1B, down to this. */
export const SHORT_MAX = 3;
/** A walk-out costs this much loyalty, on top of the game's result. */
export const WALKOUT_LOYALTY = -5;
/** $3B+ over the line: the faction remembers you were generous. */
export const GENEROUS_AT = 3;
/** Interest on paying a walked-out faction back: daily (over 5 days), or all at once 4 days later. */
export const DAILY_INTEREST = 1.25;
export const LUMP_INTEREST = 1.4;

const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * What the jars at eight o'clock add to the result: per-faction loyalty,
 * marks (on the record), a repayment, and a short line for each faction
 * that it touched. A walked-out faction's revenge is picked by the run's
 * RNG: a demand (its triggered demand, via a mark), daily repayment (a
 * standing cost), or the full sum later (a scheduled cost).
 */
export function budgetAftermath(s: GameState, rng: Rng): { effects: Effects; marks: string[]; lines: string[] } {
  const loyalty: Partial<Record<BudgetFaction, number>> = {};
  const marks: string[] = [];
  const lines: string[] = [];
  const effects: Effects = { commitments: [], schedule: [] };
  for (const f of BUDGET_FACTION_IDS) {
    const diff = s.flags[`bnDiff:${f}`];
    if (diff === undefined) continue; // a simulation: no jars were played
    const who = BUDGET_WHO[f];
    if (s.flags[`bnOut:${f}`]) {
      const short = Math.max(1, -diff);
      loyalty[f] = WALKOUT_LOYALTY;
      marks.push(budgetMark('walkout', f));
      const pick = rng.int(3);
      if (pick === 0) {
        marks.push(budgetMark('claim', f));
        lines.push(`${Cap(who.the)} walked out, and will be on your desk tomorrow wanting its budget back.`);
      } else if (pick === 1) {
        const total = round1(short * DAILY_INTEREST);
        const perDay = Math.round((total / 5) * 100) / 100;
        effects.commitments!.push({ id: `budget-repay-${f}`, label: `Paying ${who.the} back (with interest)`, perDay, days: 5 });
        lines.push(`${Cap(who.the)} walked out. You will pay it back $${perDay.toFixed(2)}B a day for 5 days, interest included.`);
      } else {
        const total = round1(short * LUMP_INTEREST);
        effects.schedule!.push({
          inDays: 4, visible: true,
          label: `${Cap(who.the)} wants its $${total.toFixed(1)}B back, with interest`,
          effects: { stats: { treasury: -total } },
        });
        lines.push(`${Cap(who.the)} walked out. In four days it wants $${total.toFixed(1)}B back, interest included.`);
      }
    } else if (diff > 0) {
      loyalty[f] = Math.min(OVER_MAX, diff);
      if (diff >= GENEROUS_AT) marks.push(budgetMark('generous', f));
      lines.push(`${Cap(who.the)} got $${diff}B more than it asked for, and noticed.`);
    } else if (diff < 0) {
      loyalty[f] = -Math.min(SHORT_MAX, -diff);
      lines.push(`${Cap(who.the)} ended $${-diff}B short, and noticed that too.`);
    }
  }
  effects.factions = Object.fromEntries(Object.entries(loyalty).map(([f, v]) => [f, { loyalty: v }]));
  return { effects, marks, lines };
}

/** The game's own result plus the jars at eight: loyalty adds up per faction. */
function withAftermath(base: Effects, after: Effects): Effects {
  const factions: Record<string, { loyalty?: number }> = {};
  for (const src of [base.factions ?? {}, after.factions ?? {}]) {
    for (const [f, v] of Object.entries(src)) {
      factions[f] = { ...(factions[f] ?? {}), loyalty: (factions[f]?.loyalty ?? 0) + ((v as { loyalty?: number })?.loyalty ?? 0) };
    }
  }
  return {
    ...base,
    factions: factions as Effects['factions'],
    ...(after.commitments?.length ? { commitments: after.commitments } : {}),
    ...(after.schedule?.length ? { schedule: after.schedule } : {}),
  };
}

function result(s: GameState, rng: Rng, text: string, tone: CardOutcome['tone'], base: Effects): CardOutcome {
  const a = budgetAftermath(s, rng);
  return {
    text: a.lines.length ? `${text}\n\nThe jars at eight: ${a.lines.join(' ')}` : text,
    tone,
    effects: withAftermath(base, a.effects),
    ...(a.marks.length ? { marks: a.marks } : {}),
  };
}

const BUDGET_WON: Effects = {
  stats: { legitimacy: 5, stability: 3 },
  hidden: { fiscal: -8 },
  factions: { all: { loyalty: 0.5 }, combine: { loyalty: 2 } },
};
const BUDGET_LOST: Effects = {
  stats: { legitimacy: -4, stability: -3 },
  hidden: { fiscal: 5 },
  factions: { combine: { loyalty: -4 } },
};

export const BUDGET_CARD: CardDef = {
  id: BUDGET_CARD_ID,
  title: 'Budget Night',
  category: 'minigame',
  tags: ['minigame'],
  actor: 'brask',
  faction: 'combine',
  minigame: 'budget',
  base: 0,
  body: 'The budget goes to parliament at eight. Every faction has a number it will not go below.',
  options: [
    {
      id: 'won',
      label: 'The budget passed.',
      hint: 'Legitimacy and stability go up, every faction warms a little, the Workers most; the budget strain eases. Each faction also reacts to its own jar.',
      outcome: (s, rng): CardOutcome => result(s, rng,
        (score(s) ?? 0) >= 85
          ? 'Brask read it out at eight o\'clock and nobody walked out. The unions called it "a budget". From the unions, that is praise.\n\nThe chamber went home early, which in Velmorra is the highest compliment.'
          : 'It was close, and somebody will grumble in the morning. But the numbers added up, and the budget passed.',
        'good', BUDGET_WON),
    },
    {
      id: 'lost',
      label: 'The budget fell apart.',
      hint: 'Legitimacy, stability and the Workers go down; the budget strain grows. Each faction also reacts to its own jar.',
      outcome: (s, rng): CardOutcome => result(s, rng,
        'By eight o\'clock two factions had walked out and the numbers did not add up. Brask read out what was left to an empty chamber.\n\nThe unions say the government cannot count. Tonight they have a point.',
        'bad', BUDGET_LOST),
    },
  ],
};

/** On the record (content/consequences.ts MARKS): set by the result, not by an option. */
export const BUDGET_MARKS: MarkDef[] = BUDGET_FACTION_IDS.flatMap((f) => [
  { id: budgetMark('generous', f), because: `gave ${BUDGET_WHO[f].the} more than it asked for on Budget Night`, setBy: [], factions: { [f]: 2 } },
  { id: budgetMark('walkout', f), because: `let ${BUDGET_WHO[f].the} walk out of the budget`, setBy: [], factions: { [f]: -2 } },
  { id: budgetMark('claim', f), because: `left ${BUDGET_WHO[f].the} short on Budget Night`, setBy: [], factions: { [f]: -1 } },
]);

/** How those marks change the faction's demands (content/consequences.ts DEMAND_REACTIONS). */
export const BUDGET_DEMAND_REACTIONS: DemandReactionDef[] = BUDGET_FACTION_IDS.flatMap((f) => [
  { mark: budgetMark('generous', f), faction: f, kind: 'cheaper' as const, text: `${BUDGET_WHO[f].the} still remembers the extra money on Budget Night.` },
  { mark: budgetMark('walkout', f), faction: f, kind: 'dearer' as const, text: `${BUDGET_WHO[f].the} walked out of your budget and has not forgotten.` },
]);

/** A walked-out faction sometimes comes for its money (content/demands.ts TRIGGERED_DEMANDS). */
export const BUDGET_CLAIMS: DemandDef[] = BUDGET_FACTION_IDS.map((f) => ({
  id: `budget-claim-${f}`,
  faction: f,
  from: BUDGET_WHO[f].from,
  title: `${Cap(BUDGET_WHO[f].the)} wants its budget back`,
  ask: `${Cap(BUDGET_WHO[f].the)} walked out of Budget Night without ${BUDGET_WHO[f].what}. It wants the money paid back, with interest, before it votes for anything else.`,
  meetLabel: 'Pay it back, with interest.',
  meetHint: 'Settles it. The money comes out of this year\'s reserves, and the other factions notice who got paid.',
  meetCost: 3,
  meet: { factions: { [f]: { loyalty: 4 } }, hidden: { fiscal: 2 } },
  meetText: `${Cap(BUDGET_WHO[f].the)} has its money back. It does not say thank you.`,
  triggeredBy: budgetMark('claim', f),
}));

export function budgetIntro(s: GameState): MinigameIntro {
  const debt = s.stats.treasury < 0;
  const demand = s.factions.combine.demand ? 'Workers' : s.factions.concord.demand ? 'Elites' : null;
  return {
    kicker: `Finance Ministry · Day ${s.day} · 18:30`,
    title: 'Budget Night',
    teaser: 'Parliament votes on the budget at eight. Make the numbers add up.',
    story: [
      'Kel Brask brings the budget to your desk at half past six. There is $30 billion to split, and it goes to parliament at eight.',
      'Every faction has a number it will not go below. Brask\'s first draft already gets one of them wrong.',
      'And the numbers will not sit still. The phones keep ringing, and every call changes something.',
    ],
    howTo: [
      'Five jars, one per faction. The dashed line on each jar is the least that faction will accept. It turns red when the jar is below it.',
      'Tap + on a jar to put in $1B of the unspent money. Tap − to take $1B back out.',
      'A jar below its line loses patience (the bar above it). At its line or above, patience slowly comes back. Empty bar: that faction walks out, and its jar is sealed.',
      'The jar in most danger flashes red, with a red ! on it. Look there first.',
      'Brask\'s slips warn you a few seconds ahead: a line goes up or down, or the whole budget shrinks or grows. A cut comes out of the unspent money first, then out of a jar.',
      'Sometimes the lines add up to more than you have. Choose who waits, and swap before anyone runs out. Money above a line stops nobody walking out.',
      'Reach eight o\'clock (90 seconds) with no more than one walk-out. On a laptop: keys 1–5 pick a jar, ↑ and ↓ move $1B.',
      'At eight, each faction judges its own jar. Money over its line wins it over. Short, it cools. Walked out, it remembers, and it will want its money back, with interest.',
    ],
    stakes: {
      win: 'Win: Legitimacy and stability go up, every faction warms a little (the Workers most), and the budget strain eases.',
      lose: 'Lose: Legitimacy, stability and the Workers\' loyalty drop, and the budget strain grows.',
    },
    ...(debt
      ? { because: 'Today\'s game comes from the debt: the treasury is below zero, so every number is a fight.' }
      : demand ? { because: `Today's game comes from the ${demand}' demand on your desk.` } : {}),
  };
}

import type { GameState } from './types';

/**
 * The national accounts.
 *
 * Every figure the player sees is in billions of dollars. The treasury stat
 * IS the money — there is no separate personal fortune, because there is no
 * meaningful distinction between the Chair's money and the state's money.
 * That is the whole point of the job.
 */

export interface BudgetLine {
  label: string;
  amount: number;          // $bn/day, always positive; `kind` gives direction
  kind: 'revenue' | 'spending';
  note?: string;
}

export interface Budget {
  revenue: number;
  spending: number;
  net: number;
  lines: BudgetLine[];
  /** days until the treasury is empty at the current rate, or null if solvent */
  runwayDays: number | null;
}

export function computeBudget(s: GameState): Budget {
  const eco = s.stats.economy / 50;           // 1.0 at a middling economy
  const lines: BudgetLine[] = [];

  /* ------------------------------------------------------------ revenue */
  lines.push({ kind: 'revenue', label: 'Lithium & salt exports', amount: 1.7 * eco, note: '44% of exports. One serious buyer.' });
  lines.push({ kind: 'revenue', label: 'Port & transit fees', amount: 0.8 * eco, note: 'Mavro corridor tolls.' });
  lines.push({ kind: 'revenue', label: 'Taxes', amount: 1.2 * eco, note: 'Income, sales, corporate.' });
  lines.push({
    kind: 'revenue',
    label: 'Ilvet Free Zone',
    amount: 0.35 + (s.flags.ilvetLevy ? 0.3 : 0),
    note: s.flags.ilvetLevy ? 'Including the transit levy you imposed.' : 'Enormous turnover. Almost no tax.',
  });

  const leakage = s.hidden.corruption / 50;
  if (leakage > 0.05) {
    lines.push({ kind: 'spending', label: 'Diverted / unaccounted', amount: leakage, note: 'Money that leaves before it arrives.' });
  }

  /* ----------------------------------------------------------- spending */
  lines.push({ kind: 'spending', label: 'State payroll', amount: 2.05, note: 'One in six working adults.' });
  lines.push({ kind: 'spending', label: 'Energy imports', amount: 0.5, note: 'Gas, bought at whatever the price is.' });
  lines.push({ kind: 'spending', label: 'Police & armed forces', amount: 0.6 });

  // Balance slice B: the longer you govern, the more the state is expected to
  // pay for — pensions, subsidies, raises promised by nobody in particular.
  const expectations = 0.06 * Math.max(0, s.day - 1);
  if (expectations > 0.05) lines.push({ kind: 'spending', label: 'Pensions & subsidies', amount: expectations, note: 'Rises every day you stay in office.' });

  const debt = s.hidden.fiscal / 42;
  if (debt > 0.05) lines.push({ kind: 'spending', label: 'Debt service', amount: debt, note: 'What previous borrowing costs you now.' });

  for (const c of s.commitments) {
    lines.push({
      kind: c.perDay >= 0 ? 'spending' : 'revenue',
      label: c.label,
      amount: Math.abs(c.perDay),
      note: c.daysLeft !== undefined ? `${c.daysLeft} day${c.daysLeft === 1 ? '' : 's'} left` : 'Ongoing',
    });
  }

  for (const p of s.projects) {
    if (!p.upkeep) continue;
    lines.push({ kind: 'spending', label: `${p.name} (construction)`, amount: p.upkeep, note: `${p.daysLeft} days to completion` });
  }

  const revenue = lines.filter((l) => l.kind === 'revenue').reduce((a, b) => a + b.amount, 0);
  const spending = lines.filter((l) => l.kind === 'spending').reduce((a, b) => a + b.amount, 0);
  const net = revenue - spending;

  const runwayDays = net >= 0 ? null : Math.max(0, Math.floor(s.stats.treasury / -net));

  return {
    revenue: round(revenue),
    spending: round(spending),
    net: round(net),
    lines: lines.map((l) => ({ ...l, amount: round(l.amount) })),
    runwayDays,
  };
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

/** $42.0B / -$3.4B */
export function usd(v: number, decimals = 1): string {
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toFixed(decimals)}B`;
}

/** +$0.42B/day, with an explicit sign. */
export function usdFlow(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}B/day`;
}

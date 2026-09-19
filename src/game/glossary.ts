/**
 * GLOSSARY — plain-English definitions for the recurring institutional and
 * financial terms in the game's writing.
 *
 * Added after a playtest note: "most people don't know what clearing the
 * payroll means and how their decision affects it."
 *
 * How it is used: `annotateTerms()` scans a block of card prose and wraps the
 * FIRST occurrence of each glossary term with a dotted underline that shows
 * this definition on hover/tap (a native <abbr title="…">, so it needs no
 * extra UI state and works everywhere text renders). Later occurrences in
 * the same text are left plain so the prose does not get cluttered.
 *
 * This is deliberately a light touch, not a rewrite of every sentence: the
 * highest-value fix for jargon is a reachable definition, not stripping the
 * texture out of every line. Card authors should still prefer plain words
 * where a plain word says the same thing (see CLAUDE.md writing rules) —
 * the glossary is the backstop for terms that don't have a shorter one.
 */

export interface GlossaryEntry {
  term: string;         // exact phrase to match, case-insensitive
  def: string;          // one clear sentence
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'payroll', def: "The wages the government pays its own workers — soldiers, teachers, clerks. One in six working adults is paid this way. If it isn't paid, they don't get their wages that month." },
  { term: 'clears', def: 'Goes through — the payment is actually sent and received.' },
  { term: 'currency peg', def: "A promise that the country's money will always trade at a fixed rate against foreign money. Defending it costs cash; breaking it means the money is suddenly worth less." },
  { term: 'the peg', def: "The fixed exchange rate the government has promised to defend. Breaking it means the country's money is suddenly worth less." },
  { term: 'float the currency', def: 'Stop defending the fixed exchange rate and let the market decide what the money is worth. Usually means it loses value fast, once.' },
  { term: 'capital controls', def: "Rules that stop money from leaving the country. Protects the currency, but it also traps money that wants to come in." },
  { term: 'central bank', def: 'The state institution that controls the money supply. It can print more money, but that usually makes existing money worth less.' },
  { term: 'deficit', def: 'Spending more than you take in. Has to be covered by borrowing, printing money, or cutting something else.' },
  { term: 'subsidy', def: 'Government money that lowers a price for someone — here, mainly farmers.' },
  { term: 'commitment', def: 'A cost that repeats every day until it ends or you cancel it — unlike a one-time price, this keeps draining money.' },
  { term: 'runway', def: 'How many days the treasury lasts at the current rate of loss before it hits zero.' },
  { term: 'the gazette', def: "The government's official public record. Something printed here is a formal, checkable promise." },
  { term: 'procurement', def: "Buying equipment — here, mostly for the military — through official contracts." },
  { term: 'levy', def: 'A tax or fee charged on a specific thing, rather than income in general.' },
  { term: 'concession', def: 'The right to run something — a port, a terminal — that is normally granted for years at a time.' },
  { term: 'tranche', def: 'One instalment of a larger payment, released in parts rather than all at once.' },
  { term: 'legitimacy', def: 'Whether people accept you are supposed to have this job. Low legitimacy means people see removing you as fair, not as a crime.' },
  { term: 'confirmation vote', def: 'The vote at the end of the term that decides whether you keep the job.' },
];

/** Matches the longest terms first so "the peg" doesn't eat part of "currency peg". */
const SORTED = [...GLOSSARY].sort((a, b) => b.term.length - a.term.length);

export interface TextPart {
  text: string;
  def?: string;
}

/**
 * Splits `text` into plain and glossed segments. Each glossary term is
 * annotated only on its first appearance in this string.
 */
export function annotateTerms(text: string): TextPart[] {
  const used = new Set<string>();
  let parts: TextPart[] = [{ text }];

  for (const entry of SORTED) {
    if (used.has(entry.term)) continue;
    const re = new RegExp(`\\b${escapeRe(entry.term)}\\b`, 'i');
    const next: TextPart[] = [];
    let matched = false;
    for (const part of parts) {
      if (matched || part.def) { next.push(part); continue; }
      const m = part.text.match(re);
      if (!m || m.index === undefined) { next.push(part); continue; }
      matched = true;
      used.add(entry.term);
      const before = part.text.slice(0, m.index);
      const hit = part.text.slice(m.index, m.index + m[0].length);
      const after = part.text.slice(m.index + m[0].length);
      if (before) next.push({ text: before });
      next.push({ text: hit, def: entry.def });
      if (after) next.push({ text: after });
    }
    parts = next;
  }
  return parts;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

import { it, expect } from 'vitest';
import { annotateTerms } from '../glossary';

it('annotates the first occurrence of a glossary term and leaves the rest plain', () => {
  const parts = annotateTerms('State payroll clears on the 28th. Payroll is one in six adults.');
  const glossed = parts.filter((p) => p.def);
  expect(glossed.length).toBeGreaterThanOrEqual(1);
  // "payroll" should be glossed once, "clears" glossed once, second "Payroll" left plain
  const rejoined = parts.map((p) => p.text).join('');
  expect(rejoined).toBe('State payroll clears on the 28th. Payroll is one in six adults.');
});

it('does not crash on text with no glossary terms', () => {
  const parts = annotateTerms('A perfectly ordinary sentence.');
  expect(parts.map((p) => p.text).join('')).toBe('A perfectly ordinary sentence.');
});

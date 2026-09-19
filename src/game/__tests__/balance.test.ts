import { it } from 'vitest';
import { probe } from './balance.probe';
it('balance probe', () => {
  for (const p of ['random', 'first', 'last'] as const) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(probe(120, p)));
  }
}, 120000);

import { useState } from 'react';
import type { GameState } from '../../game/types';
import { computeResources } from '../../game/display';

/**
 * The masthead's resource ledger: MONEY / GRIP / LEGITIMACY.
 *
 * This is the entire "stat bar" now. It reads the full 10-stat simulation
 * underneath (see src/game/display.ts) but shows exactly three numbers, so
 * the player never has to reconcile a stat bar against a faction panel —
 * see docs/DESIGN_V2.md for why that mattered.
 */
export function Ledger({ s }: { s: GameState }) {
  const resources = computeResources(s);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="res">
      {resources.map((r) => (
        <div
          className="r"
          key={r.key}
          onMouseEnter={() => setOpen(r.key)}
          onMouseLeave={() => setOpen(null)}
          onClick={() => setOpen(open === r.key ? null : r.key)}
        >
          <div className="l">{r.label}</div>
          <div className={`v tone-${r.tone}`}>{r.display}</div>
          {r.key === 'money' ? (
            <div className={`s ${r.sub && r.sub.startsWith('-') ? 'tone-bad' : ''}`}>{r.sub}</div>
          ) : (
            <div className="bar"><div className={`bg-${r.tone}`} style={{ width: `${Math.max(2, r.value)}%`, height: '100%' }} /></div>
          )}
          {open === r.key && <div className="tip">{r.tip}</div>}
        </div>
      ))}
    </div>
  );
}

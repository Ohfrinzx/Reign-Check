import { useState } from 'react';
import type { StatKey, Stats } from '../../game/types';
import { statGuide } from '../../game/display';

/**
 * The "INFORMATION +15.0 → GRIP" pills under a result, and a tap-to-open
 * list of what each of those numbers does.
 *
 * The pills show the engine's raw stats, but the masthead only shows Money,
 * Grip and Legitimacy, so each pill names the top number it moves (none for
 * Legitimacy and Money themselves, or for Elite, which feeds none of them).
 * The words come from display.ts STAT_GUIDE. A button, not hover, so it works
 * the same on a phone (ground rule 11).
 */
export function DeltaPills({ deltas, className = '', animate = false }: {
  deltas: Partial<Stats>;
  className?: string;
  animate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(deltas) as StatKey[];
  if (keys.length === 0) return null;
  return (
    <div className={`deltas ${className}`}>
      {keys.map((k, i) => {
        const v = deltas[k] as number;
        const g = statGuide(k);
        // Legitimacy and Money ARE top numbers; no arrow to themselves.
        const into = k === 'legitimacy' || k === 'treasury' ? null : g.feeds;
        return (
          <span
            key={k}
            className={`delta-pill ${v > 0 ? 'pos' : 'neg'}`}
            style={animate ? { animationDelay: `${i * 40}ms` } : undefined}
          >
            {g.label.toUpperCase()} {v > 0 ? '+' : '−'}{Math.abs(v).toFixed(1)}
            {into && <span className="into"> → {into.toUpperCase()}</span>}
          </span>
        );
      })}
      <button
        type="button"
        className="deltas-why"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide' : 'What do these mean?'}
      </button>
      {open && (
        <div className="deltas-guide">
          {keys.map((k) => {
            const g = statGuide(k);
            return (
              <p key={k}>
                <b>{g.label}</b> <span className="feeds">({g.feedsText})</span> — {g.does}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

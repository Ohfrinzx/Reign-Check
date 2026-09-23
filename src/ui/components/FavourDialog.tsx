import { useState } from 'react';
import type { GameState, StatKey } from '../../game/types';
import { SHOP_MAP } from '../../game/content/shop';
import { favourBlockReason, favourTargets } from '../../game/favours';
import type { FavourResult } from '../../game/favours';
import { STAT_META } from '../../game/stats';
import { fill } from '../../game/text';

/**
 * BALANCE SLICE A — spending a favour, as a small dialog with two steps:
 *   1. choose what to use it on (the scandals, demands or crises it can
 *      actually reach right now — favours.ts favourTargets()), then
 *   2. a receipt: what went away, by name, and what changed.
 * Owner: favours felt like "a very empty button". This is the fix — the
 * player always sees what the favour touched.
 */
export function FavourDialog({
  s, itemId, receipt, onSpend, onClose,
}: {
  s: GameState;
  itemId: string;
  receipt: FavourResult | null;
  onSpend: (itemId: string, targetKey?: string) => void;
  onClose: () => void;
}) {
  const def = SHOP_MAP[itemId];
  const targets = favourTargets(s, def);
  const [pick, setPick] = useState<string | undefined>(targets[0]?.key);
  const block = receipt ? undefined : favourBlockReason(s, itemId);
  if (!def?.use) return null;

  return (
    <div className="demand-scrim" role="dialog" aria-modal="true" aria-label={def.name}>
      <div className="demand-pop fav-pop">
        <div className="dm-banner">{receipt ? 'Favour used' : 'Use a favour'}</div>
        <div className="dm-body">
          <h2 className="dm-h">{def.name}</h2>
          {receipt ? (
            <>
              <p className="dm-ask">{fill(receipt.text, s)}</p>
              {receipt.lines.map((l) => <div className="fav-line" key={l}>✓ {l}</div>)}
              {Object.keys(receipt.deltas).length > 0 && (
                <div className="deltas fav-deltas">
                  {Object.entries(receipt.deltas).map(([k, v]) => (
                    <span key={k} className={`delta-pill ${(v as number) > 0 ? 'pos' : 'neg'}`}>
                      {(k === 'treasury' ? 'MONEY' : STAT_META[k as StatKey]?.label.toUpperCase() ?? k.toUpperCase())}{' '}
                      {(v as number) > 0 ? '+' : '−'}{Math.abs(v as number).toFixed(1)}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="dm-ask">{def.upside}</p>
              {targets.length > 0 ? (
                <fieldset className="fav-targets">
                  <legend>Use it on</legend>
                  {targets.map((t) => (
                    <label key={t.key} className={pick === t.key ? 'on' : ''}>
                      <input type="radio" name="fav-target" checked={pick === t.key} onChange={() => setPick(t.key)} />
                      <span><b>{t.label}</b><small>{t.detail}</small></span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div className="fav-when">
                  {def.use.targets?.length
                    ? `Nothing specific to aim it at right now, so it will only have its general effect. ${def.use.whenUseful ?? ''}`
                    : def.use.whenUseful}
                </div>
              )}
              {block && <div className="dm-block">{block}</div>}
            </>
          )}
        </div>
        <div className="dm-foot">
          {receipt ? (
            <button className="btn btn-primary" onClick={onClose} autoFocus>Done</button>
          ) : (
            <>
              <button className="btn btn-primary" disabled={!!block} onClick={() => onSpend(itemId, pick)} autoFocus>
                {def.use.label}{targets.length ? ` — ${targets.find((t) => t.key === pick)?.label ?? ''}` : ''}
              </button>
              <button className="btn" onClick={onClose}>Keep it for later</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import type { GameState } from '../../game/types';
import type { ShopItemDef } from '../../game/content/shop';
import {
  ADVISOR_CAP, DEAL_CAP, boughtDealDefs, canCutNow, canFireNow, cutCostOf, fireCostOf,
  ownedAdvisorDefs,
} from '../../game/shop';
import { usd } from '../../game/economy';
import { fill } from '../../game/text';

/**
 * ADVISORS & DEALS — a dedicated screen for what the Back Room has already
 * sold you, opened from the masthead at any point during the main game (not
 * just glimpsed in the rail's compact "Back Room" panel, which stays as a
 * quick-glance summary). Both advisors and deals are capped
 * (ADVISOR_CAP/DEAL_CAP in shop.ts) — this screen shows how many of each
 * slot you're using, and lets you free one early:
 *
 *   - Advisors: fired for whatever `fireCost`/`fireEffects` that advisor's
 *     entry in content/shop.ts gives it.
 *   - Deals: cut short for whatever `cutCost`/`cutEffects` gives it — every
 *     deal occupies a slot from the moment it's bought, permanent or timed,
 *     until it's cut or (for a timed one) runs out on its own.
 *
 * `ManageRow`, `FireControl` and `CutControl` are exported so the Back
 * Room's own held-panel (Shop.tsx) can reuse the same rows and buttons —
 * one visual language for "what you're holding" everywhere it appears.
 *
 * Same overlay pattern as Intro.tsx's "Brief me" screen: a full scrim over
 * the whole game, closable without touching game state, reusable from any
 * non-shop phase.
 */
export function ManageScreen({
  s, onClose, onFire, onCut,
}: {
  s: GameState;
  onClose: () => void;
  onFire: (itemId: string) => void;
  onCut: (itemId: string) => void;
}) {
  const advisors = ownedAdvisorDefs(s);
  const deals = boughtDealDefs(s);
  // Firing/cutting changes state through applyEffects, same as buying —
  // restrict it to the same phases Pocket already restricts favour-spending
  // to, so it never fires mid-card or mid-alert.
  const canAct = s.phase === 'briefing' || s.phase === 'stage' || s.phase === 'night';

  return (
    <div className="intro-scrim">
      <div className="intro-scroll">
        <div className="intro">
          <div className="intro-head">
            <div className="kicker">The Back Room's ledger</div>
            <h1>Advisors &amp; Deals</h1>
            <p className="intro-lead">
              Everyone on retainer, and everything arranged this run, in one place.
            </p>
          </div>

          <div className="intro-section">
            <h2>Advisors ({advisors.length}/{ADVISOR_CAP})</h2>
            {advisors.length === 0 && (
              <p className="intro-note">Nobody on retainer yet. The Back Room sells these too.</p>
            )}
            {advisors.map((def) => (
              <ManageRow key={def.id} def={def} s={s}>
                <FireControl def={def} s={s} canAct={canAct} onFire={onFire} />
              </ManageRow>
            ))}
          </div>

          <div className="intro-section">
            <h2>Deals ({deals.filter((d) => d.status === 'ongoing' || d.status === 'active').length}/{DEAL_CAP})</h2>
            {deals.length === 0 && (
              <p className="intro-note">No arrangements made yet.</p>
            )}
            {deals.map(({ def, status, daysLeft }) => (
              <ManageRow key={def.id} def={def} s={s}>
                <span className={`manage-timer ${status}`}>
                  {status === 'ongoing' && 'Ongoing'}
                  {status === 'active' && `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                  {status === 'expired' && 'Ran its course'}
                  {status === 'cut' && 'Cut short'}
                </span>
                {(status === 'ongoing' || status === 'active') && (
                  <CutControl def={def} s={s} canAct={canAct} onCut={onCut} />
                )}
              </ManageRow>
            ))}
          </div>

          <div className="intro-foot">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
            <span className="note">Nothing here needs deciding today.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ManageRow({
  def, s, compact, children,
}: {
  def: ShopItemDef;
  s: GameState;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`manage-row ${compact ? 'compact' : ''}`}>
      <div className="manage-body">
        <div className="manage-name">{def.name}</div>
        {!compact && <div className="manage-line up">{fill(def.upside, s)}</div>}
        {!compact && def.downside && <div className="manage-line down">{fill(def.downside, s)}</div>}
      </div>
      <div className="manage-right">{children}</div>
    </div>
  );
}

export function FireControl({
  def, s, canAct, onFire,
}: {
  def: ShopItemDef;
  s: GameState;
  canAct: boolean;
  onFire: (id: string) => void;
}) {
  const cost = fireCostOf(def);
  const affordable = canFireNow(s, def);
  const disabled = !canAct || !affordable;
  return (
    <div className="manage-fire">
      <button
        className="btn btn-danger"
        disabled={disabled}
        onClick={() => onFire(def.id)}
        title={
          !canAct ? 'Finish the current item first'
            : !affordable ? 'You cannot afford to let them go quietly'
              : 'Let this advisor go'
        }
      >
        Fire
      </button>
      <span className="manage-fire-cost">
        {cost > 0 ? `Costs ${usd(cost)} to go quietly` : 'No bribe needed'}
      </span>
    </div>
  );
}

export function CutControl({
  def, s, canAct, onCut,
}: {
  def: ShopItemDef;
  s: GameState;
  canAct: boolean;
  onCut: (id: string) => void;
}) {
  const cost = cutCostOf(def);
  const affordable = canCutNow(s, def);
  const disabled = !canAct || !affordable;
  return (
    <div className="manage-fire">
      <button
        className="btn btn-danger"
        disabled={disabled}
        onClick={() => onCut(def.id)}
        title={
          !canAct ? 'Finish the current item first'
            : !affordable ? 'You cannot afford to end this early'
              : 'End this deal now'
        }
      >
        Cut
      </button>
      <span className="manage-fire-cost">
        {cost > 0 ? `Costs ${usd(cost)} to end early` : 'No cost to end it'}
      </span>
    </div>
  );
}

import type { GameState } from '../../game/types';
import type { ShopItemDef } from '../../game/content/shop';
import { boughtDealDefs, canFireNow, fireCostOf, ownedAdvisorDefs } from '../../game/shop';
import { usd } from '../../game/economy';
import { fill } from '../../game/text';

/**
 * ADVISORS & DEALS — a dedicated screen for what the Back Room has already
 * sold you, opened from the masthead at any point during the main game (not
 * just glimpsed in the rail's compact "Back Room" panel, which stays as a
 * quick-glance summary). Advisors can be let go here, for whatever
 * `fireCost`/`fireEffects` content/shop.ts gives that advisor; deals just
 * report themselves — most are permanent ("Ongoing"), the few with a
 * `durationDays` clock show their own days left, same plain-text convention
 * as the rail's Standing Costs panel (ground rule 6: this is an overt
 * mechanic, not a hidden variable).
 *
 * Same overlay pattern as Intro.tsx's "Brief me" screen: a full scrim over
 * the whole game, closable without touching game state, reusable from any
 * non-shop phase.
 */
export function ManageScreen({
  s, onClose, onFire,
}: {
  s: GameState;
  onClose: () => void;
  onFire: (itemId: string) => void;
}) {
  const advisors = ownedAdvisorDefs(s);
  const deals = boughtDealDefs(s);
  // Firing changes state through applyEffects, same as buying — restrict it
  // to the same phases Pocket already restricts favour-spending to, so it
  // never fires mid-card or mid-alert.
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
            <h2>Advisors {advisors.length > 0 && `(${advisors.length})`}</h2>
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
            <h2>Deals {deals.length > 0 && `(${deals.length})`}</h2>
            {deals.length === 0 && (
              <p className="intro-note">No arrangements made yet.</p>
            )}
            {deals.map(({ def, status, daysLeft }) => (
              <ManageRow key={def.id} def={def} s={s}>
                <span className={`manage-timer ${status}`}>
                  {status === 'ongoing' && 'Ongoing'}
                  {status === 'active' && `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                  {status === 'expired' && 'Arrangement ended'}
                </span>
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

function ManageRow({ def, s, children }: { def: ShopItemDef; s: GameState; children: React.ReactNode }) {
  return (
    <div className="manage-row">
      <div className="manage-body">
        <div className="manage-name">{def.name}</div>
        <div className="manage-line up">{fill(def.upside, s)}</div>
        {def.downside && <div className="manage-line down">{fill(def.downside, s)}</div>}
      </div>
      <div className="manage-right">{children}</div>
    </div>
  );
}

function FireControl({
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

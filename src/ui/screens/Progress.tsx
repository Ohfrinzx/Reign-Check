import { MANDATES } from '../../game/content/mandates';
import { SHOP_MAP } from '../../game/content/shop';
import { computeUnlockStats, MANDATE_UNLOCKS, SHOP_UNLOCKS, type MetaProgress } from '../../game/meta';

/**
 * §4.5 step 2 — what's locked, what's unlocked, and the plain-language
 * condition for anything still locked. Pure display: reads `MetaProgress`,
 * changes nothing. Reused in two places, both listed on their own screens:
 * the "Advisors & Deals" screen's Unlocks tab (mid-run, see Manage.tsx) and
 * a standalone overlay opened from the title screen's own "Unlocks" button
 * (pre-run — the more natural moment to decide what to aim for next).
 */
export function ProgressPanel({ legacy }: { legacy: MetaProgress }) {
  const stats = computeUnlockStats(legacy);
  return (
    <>
      <div className="intro-section">
        <h2>Your record</h2>
        <p className="intro-note">
          {stats.runsCompleted === 0
            ? 'No runs finished yet. Everything below unlocks by playing, not by spending.'
            : `${stats.runsCompleted} run${stats.runsCompleted === 1 ? '' : 's'} finished — `
              + `${stats.survived} survived, furthest reached Act ${stats.bestAct}.`}
        </p>
      </div>

      <div className="intro-section">
        <h2>Mandates</h2>
        {MANDATES.map((m) => {
          const rule = MANDATE_UNLOCKS.find((r) => r.id === m.id);
          const unlocked = !rule || rule.condition(stats);
          return <UnlockRow key={m.id} name={m.name} unlocked={unlocked} hint={rule?.hint} />;
        })}
      </div>

      <div className="intro-section">
        <h2>Rare offers</h2>
        <p className="intro-note">The Back Room's two `rarity: rare` items — no downside stated, and priced for it.</p>
        {SHOP_UNLOCKS.map((rule) => {
          const def = SHOP_MAP[rule.id];
          if (!def) return null;
          return <UnlockRow key={rule.id} name={def.name} unlocked={rule.condition(stats)} hint={rule.hint} />;
        })}
      </div>
    </>
  );
}

function UnlockRow({ name, unlocked, hint }: { name: string; unlocked: boolean; hint?: string }) {
  return (
    <div className="manage-row">
      <div className="manage-body">
        <div className="manage-name">{name}</div>
        {!unlocked && hint && <div className="manage-line down">{hint}</div>}
      </div>
      <div className="manage-right">
        <span className={`manage-timer ${unlocked ? 'active' : ''}`}>{unlocked ? 'Unlocked' : 'Locked'}</span>
      </div>
    </div>
  );
}

/** Standalone overlay, same visual language as ManageScreen/IntroScreen —
 *  opened from the title screen, so it needs no live GameState, only
 *  cross-run MetaProgress. */
export function ProgressScreen({ legacy, onClose }: { legacy: MetaProgress; onClose: () => void }) {
  return (
    <div className="intro-scrim">
      <div className="intro-scroll">
        <div className="intro">
          <div className="intro-head">
            <div className="kicker">What playing unlocks</div>
            <h1>Unlocks</h1>
            <p className="intro-lead">Every mandate and rare offer, and what it takes to see it.</p>
          </div>
          <ProgressPanel legacy={legacy} />
          <div className="intro-foot">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

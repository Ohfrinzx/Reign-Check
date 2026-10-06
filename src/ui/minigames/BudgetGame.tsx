import type { BudgetSetup } from '../../game/minigames/budget';
import type { MinigameEnd } from './MinigameScreen';

/** PLACEHOLDER written by the slice 3 scaffold; replaced by the real game. */
export function BudgetGame({ setup, onEnd }: {
  setup: BudgetSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  return (
    <div className="budget-placeholder" data-seed={setup.seed}>
      <button className="btn" onClick={() => onEnd({ won: true, score: 100, headline: 'Placeholder', detail: '' })}>Win</button>
    </div>
  );
}

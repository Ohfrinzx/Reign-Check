import type { StairwellSetup } from '../../game/minigames/stairwell';
import type { MinigameEnd } from './MinigameScreen';

/** PLACEHOLDER written by the slice 3b scaffold; replaced by the real game. */
export function StairwellGame({ setup, onEnd }: {
  setup: StairwellSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  return (
    <div className="stairwell-placeholder" data-seed={setup.seed}>
      <button className="btn" onClick={() => onEnd({ won: true, score: 100, headline: 'Placeholder', detail: '' })}>Win</button>
    </div>
  );
}

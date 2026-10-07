import type { AmbassadorSetup } from '../../game/minigames/ambassador';
import type { MinigameEnd } from './MinigameScreen';

/** PLACEHOLDER written by the slice 3b scaffold; replaced by the real game. */
export function AmbassadorGame({ setup, onEnd }: {
  setup: AmbassadorSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  return (
    <div className="ambassador-placeholder" data-seed={setup.seed}>
      <button className="btn" onClick={() => onEnd({ won: true, score: 100, headline: 'Placeholder', detail: '' })}>Win</button>
    </div>
  );
}

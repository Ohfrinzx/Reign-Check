import type { PigeonSetup } from '../../game/minigames/pigeon';
import type { MinigameEnd } from './MinigameScreen';

/** PLACEHOLDER written by the slice 3 scaffold; replaced by the real game. */
export function PigeonGame({ setup, onEnd }: {
  setup: PigeonSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  return (
    <div className="pigeon-placeholder" data-seed={setup.seed}>
      <button className="btn" onClick={() => onEnd({ won: true, score: 100, headline: 'Placeholder', detail: '' })}>Win</button>
    </div>
  );
}

import type { MoleSetup } from '../../game/minigames/mole';
import type { MinigameEnd } from './MinigameScreen';

/** PLACEHOLDER written by the slice 3 scaffold; replaced by the real game. */
export function MoleGame({ setup, onEnd }: {
  setup: MoleSetup; reduced: boolean; paused: boolean; onEnd: (e: MinigameEnd) => void;
}) {
  return (
    <div className="mole-placeholder" data-seed={setup.seed}>
      <button className="btn" onClick={() => onEnd({ won: true, score: 100, headline: 'Placeholder', detail: '' })}>Win</button>
    </div>
  );
}

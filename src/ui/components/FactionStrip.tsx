import type { GameState } from '../../game/types';
import { DISPLAY_FACTIONS, factionMood, isHostile } from '../../game/display';

/**
 * PHONE / TABLET ONLY (hidden above 1080px by CSS). The five factions as a
 * slim always-visible strip under the strap, because on a narrow screen the
 * rail is folded into a drawer — and the factions decide the confidence vote
 * and hostility, so they can't be out of sight. The whole strip is the button
 * that opens that drawer ("Files"), and it counts live demands, which on a
 * phone would otherwise only be visible as pop-ups.
 *
 * Shows exactly what the rail shows (the same bar length, colour and mood
 * word), never anything more — see display.ts (ground rules 6 and 8).
 */
export function FactionStrip({ s, open, onOpen }: { s: GameState; open: boolean; onOpen: () => void }) {
  const demands = DISPLAY_FACTIONS.filter((d) => s.factions[d.id].demand).length;
  const summary = DISPLAY_FACTIONS
    .map((d) => `${d.label}: ${isHostile(s, d.id) ? 'hostile' : factionMood(d, s.factions[d.id].loyalty).word}`)
    .join(', ');
  return (
    <button
      type="button"
      className="m-files-btn"
      onClick={onOpen}
      aria-expanded={open}
      aria-label={`Open your files. ${summary}.${demands ? ` ${demands} live demand${demands === 1 ? '' : 's'}.` : ''}`}
    >
      {DISPLAY_FACTIONS.map((d) => {
        const f = s.factions[d.id];
        const mood = factionMood(d, f.loyalty);
        return (
          <span className={`mf-fac${isHostile(s, d.id) ? ' hostile' : ''}`} key={d.id}>
            <span className="nm"><i aria-hidden="true">{d.icon}</i>{d.label}</span>
            <span className="bar"><i className={`bg-${mood.tone}`} style={{ width: `${Math.max(3, f.loyalty)}%` }} /></span>
            <span className={`md tone-${mood.tone}`}>{mood.word}</span>
          </span>
        );
      })}
      <span className="mf-more">
        {demands > 0 && <b>{demands}</b>}
        Files ›
      </span>
    </button>
  );
}

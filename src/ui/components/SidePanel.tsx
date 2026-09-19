import { useState } from 'react';
import type { GameState, FactionId } from '../../game/types';
import { FACTIONS, FACTION_ORDER, CHARACTERS, CHARACTER_MAP } from '../../game/content/country';
import { band } from '../../game/stats';
import { buildBriefing } from '../../game/briefing';

const tone = (v: number) =>
  v >= 65 ? 'var(--good)' : v >= 45 ? 'var(--ok)' : v >= 25 ? 'var(--warn)' : 'var(--bad)';

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="minibar">
      <span className="lbl">{label}</span>
      <span className="track"><span className="fill" style={{ width: `${v}%`, background: tone(v) }} /></span>
    </div>
  );
}

function factionNote(s: GameState, id: FactionId): string {
  const f = s.factions[id];
  const def = FACTIONS[id];
  if (f.patience < 16) return `Patience exhausted. ${def.redLine}`;
  if (f.loyalty < 25) return def.threat;
  if (f.loyalty > 72) return def.boon;
  if (f.patience < 32) return 'Growing impatient with being managed rather than answered.';
  const first = def.blurb.split(/\.\s/)[0];
  return first.endsWith('.') ? first : `${first}.`;
}

function mood(s: GameState, id: string): string {
  const c = s.characters[id];
  const def = CHARACTER_MAP[id];
  if (!c.alive) return 'Deceased.';
  if (c.exiled) return 'Outside the Republic, and talking.';
  if (!c.inPost) return 'Out of post. Still has a telephone.';

  // What they remember outranks what they feel: memory is the whole point.
  const recent = c.memory[c.memory.length - 1];
  if (recent && s.day - recent.day <= 4) {
    return `${recent.weight < 0 ? 'Has not forgotten' : 'Remembers'}: ${recent.text}`;
  }

  if (c.plotting > 68) return 'Taking meetings that are not in the diary.';
  if (c.plotting > 48 && def && def.ambition > 60) return 'Has begun using the word "we" to mean something other than your government.';
  if (c.loyalty > 82) return 'Would take an order you could not justify in writing.';
  if (c.loyalty > 70) return 'Reliable. Would argue with you in private and back you in public.';
  if (c.fear > 66) return 'Agrees with everything you say, which is not the same as loyalty.';
  if (c.loyalty < 18) return 'Has stopped pretending.';
  if (c.loyalty < 30) return 'Attends. Contributes nothing that was not asked for.';
  if (c.trust > 74) return 'Tells you things before you ask.';
  if (c.trust < 24) return 'Answers the question you asked, and nothing more.';
  if (c.influence > 72) return 'Increasingly the person other people call first.';
  if (c.loyalty > 58) return 'Broadly with you, for now, on the current terms.';
  if (def && def.venality > 75) return 'Available. The price has simply not been discussed yet.';
  if (def && def.candour > 75) return 'Will tell you the truth whether or not you want it today.';
  return 'Undecided, and entirely comfortable being so.';
}

export function SidePanel({ s }: { s: GameState }) {
  const [tab, setTab] = useState<'factions' | 'people' | 'dossier'>('factions');
  const brief = buildBriefing(s);
  const inPlay = CHARACTERS.filter((c) => s.characters[c.id]);

  return (
    <aside className="side-col">
      <div className="side-tabs">
        {(['factions', 'people', 'dossier'] as const).map((t) => (
          <button key={t} className={`side-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="side-body">
        {tab === 'factions' && FACTION_ORDER.map((id) => {
          const f = s.factions[id];
          const def = FACTIONS[id];
          return (
            <div className="frow" key={id}>
              <div className="frow-top">
                <span className="frow-icon">{def.icon}</span>
                <span className="frow-name">{def.short}</span>
                <span className="frow-val" style={{ color: tone(f.loyalty) }}>{band(f.loyalty)}</span>
              </div>
              <div className="frow-bars">
                <Bar label="LOYAL" v={f.loyalty} />
                <Bar label="POWER" v={f.power} />
                <Bar label="PATIEN" v={f.patience} />
              </div>
              <div className="frow-note">{factionNote(s, id)}</div>
            </div>
          );
        })}

        {tab === 'people' && inPlay.map((def) => {
          const c = s.characters[def.id];
          return (
            <div className={`prow ${c.inPost && c.alive ? '' : 'gone'}`} key={def.id}>
              <div className="portrait" style={{ color: def.accent }}>{def.portrait}</div>
              <div className="pmain">
                <div className="pname">{def.name}</div>
                <div className="ptitle">{def.title}</div>
                <div className="pmood">{mood(s, def.id)}</div>
              </div>
            </div>
          );
        })}

        {tab === 'dossier' && (
          <>
            {brief.items.length === 0 && <div className="empty">Nothing on the board. Enjoy it.</div>}
            {brief.items.map((it, i) => (
              <div key={i} className={`dossier-item ${it.kind === 'opportunity' ? 'op' : it.kind === 'pending' ? 'pending' : `s${it.severity ?? 1}`}`}>
                {it.source && <span className="src">{it.source}</span>}
                {it.text}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

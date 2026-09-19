import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, StatKey } from './game/types';
import { createGame } from './game/state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert,
  advanceToNextDay, activeCard, STAGE_META,
} from './game/engine';
import { buildBriefing } from './game/briefing';
import { COUNTRY } from './game/content/country';
import { saveGame, loadGame, loadMeta, deleteSave } from './game/save';
import { StatBar } from './ui/components/StatBar';
import { SidePanel } from './ui/components/SidePanel';
import { CardView, OutcomeView } from './ui/components/CardView';
import { TitleScreen, BriefingScreen, NightScreen, EndingScreen } from './ui/screens/Screens';

type Screen = 'title' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [savedDay, setSavedDay] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<Partial<Record<StatKey, number>>>({});
  const toastTimer = useRef<number | undefined>(undefined);

  /* ---- detect an existing save on mount */
  useEffect(() => {
    const meta = loadMeta();
    if (meta && !meta.ended) {
      setSavedDay(meta.day);
      setName(meta.leaderName);
    }
  }, []);

  /* ---- autosave whenever the game state settles */
  useEffect(() => {
    if (!game) return;
    saveGame(game);
  }, [game]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* ---- lifecycle */
  const newGame = useCallback(() => {
    const g = prepareDay(createGame({ leaderName: name }));
    setGame(g);
    setScreen('game');
    setFlash({});
  }, [name]);

  const continueGame = useCallback(() => {
    const g = loadGame();
    if (!g) { say('No readable save found.'); return; }
    setGame(g);
    setScreen('game');
  }, [say]);

  const backToTitle = useCallback(() => {
    setScreen('title');
    const meta = loadMeta();
    setSavedDay(meta && !meta.ended ? meta.day : undefined);
  }, []);

  const restart = useCallback(() => {
    deleteSave();
    setSavedDay(undefined);
    newGame();
  }, [newGame]);

  /* ---- actions */
  const doChoose = useCallback((optionId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = chooseOption(g, optionId);
      setFlash(next.lastOutcome?.deltas ?? {});
      return next;
    });
  }, []);

  const doContinue = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      setFlash({});
      if (g.phase === 'resolve') return continueAfterResolve(g);
      if (g.phase === 'alertResolve') return continueAfterAlert(g);
      if (g.phase === 'briefing') return beginStages(g);
      if (g.phase === 'night') return advanceToNextDay(g);
      return g;
    });
  }, []);

  /* ---- keyboard: 1-4 to choose, Enter/Space to continue */
  useEffect(() => {
    if (screen !== 'game' || !game) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((game.phase === 'stage' || game.phase === 'alert') && /^[1-9]$/.test(e.key)) {
        const card = activeCard(game);
        const opt = card?.options[Number(e.key) - 1];
        if (opt && (!opt.enabled || opt.enabled(game))) {
          e.preventDefault();
          doChoose(opt.id);
        }
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') &&
          ['resolve', 'alertResolve', 'briefing', 'night'].includes(game.phase)) {
        e.preventDefault();
        doContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, game, doChoose, doContinue]);

  /* ---------------------------------------------------------------- render */

  if (screen === 'title' || !game) {
    return (
      <>
        <TitleScreen
          name={name}
          setName={setName}
          onNew={newGame}
          onContinue={savedDay ? continueGame : undefined}
          savedDay={savedDay}
          onDelete={savedDay ? () => { deleteSave(); setSavedDay(undefined); } : undefined}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  const brief = buildBriefing(game);
  const card = activeCard(game);
  const inAlert = game.phase === 'alert' || game.phase === 'alertResolve';
  const stage = game.agenda[game.stageIndex];

  return (
    <div className="app">
      {/* ------------------------------------------------------------ top */}
      <header className="topbar">
        <div className="seal">⬢</div>
        <div>
          <div className="country">{COUNTRY.name}</div>
          <div className="leader">{game.leaderTitle} {game.leaderName} · {COUNTRY.capital}</div>
        </div>
        <div className="spacer" />
        <div className={`threat threat-${brief.threatLevel}`} title={brief.threatNote}>
          <span className="threat-dot" /> {brief.threatLevel}
        </div>
        <div className="daychip">DAY {game.day} / {game.maxDays}</div>
        <button className="btn btn-ghost" onClick={backToTitle} title="Your run is saved automatically">
          Menu
        </button>
      </header>

      <StatBar s={game} flash={flash} />

      {/* ----------------------------------------------------------- main */}
      <div className="main">
        <div className="stage-col">
          {game.phase === 'briefing' && <BriefingScreen s={game} onBegin={doContinue} />}

          {(game.phase === 'stage' || game.phase === 'resolve') && (
            <div className="card-wrap">
              <DayTrack s={game} />
              {stage && (
                <div className="stage-head">
                  <span className="time">{STAGE_META[stage].time}</span>
                  <h2>{STAGE_META[stage].label}</h2>
                  <span className="blurb">{STAGE_META[stage].blurb}</span>
                </div>
              )}
              {game.phase === 'stage' && card && (
                <CardView s={game} card={card} onChoose={doChoose} />
              )}
              {game.phase === 'resolve' && <OutcomeView s={game} onContinue={doContinue} />}
            </div>
          )}

          {game.phase === 'night' && <NightScreen s={game} onNext={doContinue} />}
          {game.phase === 'ended' && (
            <EndingScreen s={game} onRestart={restart} onTitle={backToTitle} />
          )}
        </div>

        <SidePanel s={game} />
      </div>

      {/* --------------------------------------------------- breaking alert */}
      {inAlert && (
        <div className="alert-scrim">
          <div style={{ width: '100%', maxWidth: 820 }}>
            <div className="alert-banner">
              <span className="blip" />
              BREAKING ALERT
              <span className="sev">
                {card && 'severity' in card ? `SEVERITY ${(card as { severity: number }).severity}` : ''}
              </span>
            </div>
            {game.phase === 'alert' && card && (
              <CardView s={game} card={card} onChoose={doChoose} alert />
            )}
            {game.phase === 'alertResolve' && (
              <div style={{ marginTop: 14 }}>
                <OutcomeView s={game} onContinue={doContinue} alert />
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function DayTrack({ s }: { s: GameState }) {
  return (
    <div className="daytrack">
      {s.todayDeck.map((_, i) => (
        <span
          key={i}
          className={`seg ${i < s.stageIndex ? 'done' : i === s.stageIndex ? 'active' : ''}`}
        >
          <span className="node" />
        </span>
      ))}
      <span className="stamp cap">
        {Math.min(s.stageIndex + 1, s.todayDeck.length)} / {s.todayDeck.length}
      </span>
    </div>
  );
}

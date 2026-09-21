import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, StatKey } from './game/types';
import { ACT_LENGTH, createGame, dayInAct, NUM_ACTS } from './game/state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert,
  activeCard, STAGE_META, openShop, buyShopItem, useFavour, leaveShop, fireAdvisor, cutDeal,
} from './game/engine';
import { buildBriefing } from './game/briefing';
import { COUNTRY } from './game/content/country';
import { saveGame, loadGame, loadMeta, deleteSave } from './game/save';
import { Ledger } from './ui/components/Ledger';
import { Rail } from './ui/components/Rail';
import { CardView, OutcomeView } from './ui/components/CardView';
import { TitleScreen, BriefingScreen, NightScreen, EndingScreen } from './ui/screens/Screens';
import { ShopScreen } from './ui/screens/Shop';
import { IntroScreen } from './ui/screens/Intro';
import { ManageScreen } from './ui/screens/Manage';

type Screen = 'title' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [honorific, setHonorific] = useState('sir');
  const [showIntro, setShowIntro] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [savedDay, setSavedDay] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [, setFlash] = useState<Partial<Record<StatKey, number>>>({});
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
    const g = prepareDay(createGame({ leaderName: name, honorific }));
    setGame(g);
    setScreen('game');
    setShowIntro(true);
    setShowManage(false);
    setFlash({});
  }, [name, honorific]);

  const continueGame = useCallback(() => {
    const g = loadGame();
    if (!g) { say('No readable save found.'); return; }
    setGame(g);
    setScreen('game');
    setShowIntro(false);
    setShowManage(false);
  }, [say]);

  const backToTitle = useCallback(() => {
    setScreen('title');
    setShowManage(false);
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
      // The Back Room sits between the nightly review and tomorrow morning.
      if (g.phase === 'night') return openShop(g);
      if (g.phase === 'shop') return leaveShop(g);
      return g;
    });
  }, []);

  const doBuy = useCallback((itemId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = buyShopItem(g, itemId);
      setFlash(next.lastOutcome?.deltas ?? {});
      return next;
    });
  }, []);

  const doUseFavour = useCallback((itemId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = useFavour(g, itemId);
      setFlash(next.lastOutcome?.deltas ?? {});
      say('Favour spent.');
      return next;
    });
  }, [say]);

  const doFireAdvisor = useCallback((itemId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = fireAdvisor(g, itemId);
      // fireAdvisor no-ops (returns the id still in `owned`) when the money
      // or phase gate fails — the button is disabled in those cases too, so
      // this is a safety net, not the primary check.
      if (!next.owned.includes(itemId)) say('Let them go.');
      return next;
    });
  }, [say]);

  const doCutDeal = useCallback((itemId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = cutDeal(g, itemId);
      if (!next.heldDeals.some((d) => d.itemId === itemId)) say('Cut short.');
      return next;
    });
  }, [say]);

  /* ---- keyboard: 1-4 to choose, Enter/Space to continue */
  useEffect(() => {
    if (screen !== 'game' || !game || showIntro || showManage) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (game.phase === 'shop' && /^[1-9]$/.test(e.key)) {
        const id = game.shopStock[Number(e.key) - 1];
        if (id) { e.preventDefault(); doBuy(id); }
        return;
      }
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
          ['resolve', 'alertResolve', 'briefing', 'night', 'shop'].includes(game.phase)) {
        e.preventDefault();
        doContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, game, doChoose, doContinue, doBuy, showIntro, showManage]);

  /* ---------------------------------------------------------------- render */

  if (screen === 'title' || !game) {
    return (
      <>
        <TitleScreen
          name={name}
          setName={setName}
          honorific={honorific}
          setHonorific={setHonorific}
          onNew={newGame}
          onContinue={savedDay ? continueGame : undefined}
          savedDay={savedDay}
          onDelete={savedDay ? () => { deleteSave(); setSavedDay(undefined); } : undefined}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  // The Back Room takes over the whole screen — no masthead, no strap, no
  // rail. Owner request: leaving the building's public rooms should look
  // like leaving them, not like a panel opening on top of them. The shop's
  // own "Leave" button (in ShopScreen) is the only way out; see
  // ground rule 9 — it needs no scrolling to reach, same as .strap-action
  // elsewhere, it just lives inside the shop card instead of a strap here.
  if (game.phase === 'shop') {
    return (
      <div className="app dark shop-full">
        <ShopScreen s={game} onBuy={doBuy} onLeave={doContinue} onFire={doFireAdvisor} onCut={doCutDeal} />
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  const brief = buildBriefing(game);
  const card = activeCard(game);
  const inAlert = game.phase === 'alert' || game.phase === 'alertResolve';
  const stage = game.agenda[game.stageIndex];
  const remaining = Math.max(0, game.todayDeck.length - game.stageIndex);

  return (
    <div className="app">
      {/* --------------------------------------------------------- masthead */}
      <header className="masthead">
        <div className="id">
          <div className="mark">★</div>
          <div>
            <div className="n">{game.leaderName.toUpperCase()}</div>
            <div className="r">{game.leaderTitle} &middot; {COUNTRY.shortName}</div>
          </div>
        </div>
        <div className="mid">
          <span className="lbl"><span>Act {game.act} of {NUM_ACTS} &middot; Day {dayInAct(game)} / {ACT_LENGTH}</span></span>
        </div>
        <div className="masthead-right">
          <button className="btn btn-ghost" onClick={() => setShowIntro(true)} title="Who you are, how this works, how you lose">
            Brief me
          </button>
          <button className="btn btn-ghost" onClick={() => setShowManage(true)} title="Everyone you've hired, everything you've arranged">
            Advisors &amp; Deals
          </button>
          <button className="btn btn-ghost" onClick={backToTitle} title="Your run is saved automatically">
            Menu
          </button>
          <Ledger s={game} />
        </div>
      </header>

      {/* ------------------------------------------------------------ strap */}
      <div className="strap">
        <span className={`threat ${brief.threatLevel}`} title={brief.threatNote}>
          <span className="threat-dot" /> {brief.threatLevel.toUpperCase()}
        </span>
        {stage && <span>{STAGE_META[stage].label}</span>}
        {(game.phase === 'stage' || game.phase === 'resolve') && (
          <span><b>{remaining}</b> item{remaining === 1 ? '' : 's'} left today</span>
        )}
        <span className="sp">{brief.threatNote}</span>
        {/* The primary "next" action lives here too, so it never requires
            scrolling to reach — see .action-bar's note in index.css. */}
        {game.phase === 'briefing' && (
          <button className="strap-action" onClick={doContinue}>Begin the day →</button>
        )}
        {(game.phase === 'resolve' || game.phase === 'alertResolve') && (
          <button className="strap-action" onClick={doContinue}>Continue →</button>
        )}
        {game.phase === 'night' && (
          <button className="strap-action" onClick={doContinue}>To the Back Room →</button>
        )}
      </div>

      {/* ----------------------------------------------------------- main */}
      <div className="main">
        <div className="stage-col">
          {game.phase === 'briefing' && <BriefingScreen s={game} />}

          {(game.phase === 'stage' || game.phase === 'resolve') && (
            <>
              <DayTrack s={game} />
              {game.phase === 'stage' && card && (
                <CardView s={game} card={card} onChoose={doChoose} />
              )}
              {game.phase === 'resolve' && <OutcomeView s={game} onContinue={doContinue} />}
            </>
          )}

          {game.phase === 'night' && <NightScreen s={game} />}
          {game.phase === 'ended' && (
            <EndingScreen s={game} onRestart={restart} onTitle={backToTitle} />
          )}
        </div>

        <Rail s={game} onUseFavour={doUseFavour} />
      </div>

      {/* --------------------------------------------------- breaking alert */}
      {inAlert && (
        <div className="alert-scrim">
          <div className="alert-card">
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

      {showIntro && (
        <div className="intro-scrim">
          <div className="intro-scroll">
            <IntroScreen s={game} onBegin={() => setShowIntro(false)} returning={game.day > 1 || game.phase !== 'briefing'} />
          </div>
        </div>
      )}

      {showManage && (
        <ManageScreen s={game} onClose={() => setShowManage(false)} onFire={doFireAdvisor} onCut={doCutDeal} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function DayTrack({ s }: { s: GameState }) {
  return (
    <div className="day-track doc-wrap">
      {s.todayDeck.map((_, i) => (
        <span
          key={i}
          className={`seg ${i < s.stageIndex ? 'done' : i === s.stageIndex ? 'active' : ''}`}
        >
          <span className="node" />
        </span>
      ))}
      <span className="cap">
        {Math.min(s.stageIndex + 1, s.todayDeck.length)} / {s.todayDeck.length}
      </span>
    </div>
  );
}

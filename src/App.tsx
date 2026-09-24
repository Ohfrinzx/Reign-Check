import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, StatKey } from './game/types';
import { ACT_LENGTH, createGame, dayInAct, NUM_ACTS } from './game/state';
import {
  prepareDay, beginStages, chooseOption, continueAfterResolve, continueAfterAlert,
  activeCard, orderedOptions, STAGE_META, openShop, buyShopItem, leaveShop, fireAdvisor, cutDeal,
  completeConfidenceVote,
} from './game/engine';
import { buildBriefing } from './game/briefing';
import { COUNTRY } from './game/content/country';
import { saveGame, loadGame, deleteSave } from './game/save';
import {
  isMandateUnlocked, isShopItemUnlocked, loadMetaProgress, recordRun, saveMetaProgress,
  type MetaProgress,
} from './game/meta';
import { MANDATES } from './game/content/mandates';
import { SHOP_ITEMS } from './game/content/shop';
import { Ledger } from './ui/components/Ledger';
import { Rail } from './ui/components/Rail';
import { FactionStrip } from './ui/components/FactionStrip';
import { StrapNote } from './ui/components/StrapNote';
import { CardView, OutcomeView } from './ui/components/CardView';
import { TitleScreen, BriefingScreen, NightScreen, EndingScreen } from './ui/screens/Screens';
import { ShopScreen } from './ui/screens/Shop';
import { IntroScreen } from './ui/screens/Intro';
import { ManageScreen } from './ui/screens/Manage';
import { ProgressScreen } from './ui/screens/Progress';
import { ConfidenceVoteScreen } from './ui/screens/Vote';
import { DemandPopup } from './ui/components/Demands';
import { FavourDialog } from './ui/components/FavourDialog';
import { spendFavour } from './game/favours';
import type { FavourResult } from './game/favours';
import type { DemandActions } from './ui/components/Demands';
import {
  bribeDemand, canActOnDemands, dismissDemandNotice, factionLabel, meetDemand,
} from './game/demands';
import type { FactionId } from './game/types';

type Screen = 'title' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [honorific, setHonorific] = useState('sir');
  const [mandateId, setMandateId] = useState('random');
  const [showIntro, setShowIntro] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  // Phone/tablet layout only (1080px and narrower): the ☰ menu that holds the
  // masthead buttons, and the rail shown as a drawer. See PHONE LAYOUT in
  // index.css; neither can open on a wider screen.
  const [menuOpen, setMenuOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  // Balance slice A: the favour being used (dialog open) and its receipt.
  const [favourOpen, setFavourOpen] = useState<string | null>(null);
  const [favourReceipt, setFavourReceipt] = useState<FavourResult | null>(null);
  const [savedDay, setSavedDay] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [, setFlash] = useState<Partial<Record<StatKey, number>>>({});
  const toastTimer = useRef<number | undefined>(undefined);
  const [legacy, setLegacy] = useState<MetaProgress>(() => ({ version: 1, runs: [] }));
  const recordedEndingRef = useRef<GameState['ending'] | undefined>(undefined);

  /* ---- detect an existing save on mount */
  useEffect(() => {
    const meta = loadGame();
    if (meta && meta.phase !== 'ended') {
      setSavedDay(meta.day);
      setName(meta.leaderName);
    }
  }, []);

  /* ---- phone menu and drawer: close on Escape, and if the window grows
   *  past the phone/tablet breakpoint (they have no desktop form). */
  useEffect(() => {
    if (!menuOpen && !filesOpen) return;
    const wide = window.matchMedia('(min-width: 1081px)');
    const close = () => { setMenuOpen(false); setFilesOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onWide = () => { if (wide.matches) close(); };
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => { window.removeEventListener('keydown', onKey); wide.removeEventListener('change', onWide); };
  }, [menuOpen, filesOpen]);

  // ...and whenever the day moves to another phase, so neither reappears by
  // surprise after the Back Room, a vote or the situation room.
  const phase = game?.phase;
  useEffect(() => { setMenuOpen(false); setFilesOpen(false); }, [phase]);

  /* ---- load the cross-run record on mount (§4.5, separate from any save) */
  useEffect(() => {
    setLegacy(loadMetaProgress());
  }, []);

  /* ---- autosave whenever the game state settles */
  useEffect(() => {
    if (!game) return;
    saveGame(game);
  }, [game]);

  /* ---- record a finished run into the cross-run legacy, exactly once per
   *  ending. The ref guard stops a duplicate append if this effect re-runs
   *  (React StrictMode, or any re-render while `game` stays the same ended
   *  object) — comparing by reference is enough since a new ending is
   *  always a new object. */
  useEffect(() => {
    if (!game?.ending || recordedEndingRef.current === game.ending) return;
    recordedEndingRef.current = game.ending;
    setLegacy((prev) => {
      const next = recordRun(prev, game);
      saveMetaProgress(next);
      return next;
    });
  }, [game]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* ---- lifecycle */
  const newGame = useCallback(() => {
    // §4.5 step 2: a snapshot of what's currently unlocked, taken once here —
    // see GameState.unlockedShopItemIds (types.ts) and meta.ts's header for
    // why this never changes mid-run.
    const unlockedMandateIds = MANDATES.filter((m) => isMandateUnlocked(m.id, legacy)).map((m) => m.id);
    const unlockedShopItemIds = SHOP_ITEMS.filter((d) => isShopItemUnlocked(d.id, legacy)).map((d) => d.id);
    const g = prepareDay(createGame({
      leaderName: name, honorific, mandateId, unlockedMandateIds, unlockedShopItemIds,
    }));
    setGame(g);
    setScreen('game');
    setShowIntro(true);
    setShowManage(false);
    setFlash({});
  }, [name, honorific, mandateId, legacy]);

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
    setMenuOpen(false);
    setFilesOpen(false);
    const meta = loadGame();
    setSavedDay(meta && meta.phase !== 'ended' ? meta.day : undefined);
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

  const doCompleteVote = useCallback(() => {
    setGame((g) => g ? completeConfidenceVote(g) : g);
  }, []);

  const doBuy = useCallback((itemId: string) => {
    setGame((g) => {
      if (!g) return g;
      const next = buyShopItem(g, itemId);
      setFlash(next.lastOutcome?.deltas ?? {});
      return next;
    });
  }, []);

  // The rail's "Use it…" opens the favour dialog; the dialog spends it.
  const doUseFavour = useCallback((itemId: string) => {
    setFavourReceipt(null);
    setFavourOpen(itemId);
  }, []);

  const doSpendFavour = useCallback((itemId: string, targetKey?: string) => {
    setGame((g) => {
      if (!g) return g;
      const { state, result } = spendFavour(g, itemId, targetKey);
      if (result) { setFavourReceipt(result); setFlash(result.deltas); }
      return state;
    });
  }, []);

  const closeFavour = useCallback(() => {
    setFavourOpen(null);
    setFavourReceipt(null);
  }, []);

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

  /* ---- faction demands (Phase 3 step 1). Results are read back from the
   *  new state, since a bribe can be refused. */
  const doMeetDemand = useCallback((f: FactionId) => {
    setGame((g) => {
      if (!g) return g;
      const next = meetDemand(g, f);
      if (!next.factions[f].demand && g.factions[f].demand) say(`Demand met. The ${factionLabel(f)} will back off, for now.`);
      return next;
    });
  }, [say]);

  const doBribeDemand = useCallback((f: FactionId) => {
    setGame((g) => {
      if (!g) return g;
      const before = g.factions[f].demand;
      const next = bribeDemand(g, f);
      const after = next.factions[f].demand;
      if (before && after && after.dueDay > before.dueDay) say(`They took it. The ${factionLabel(f)} will wait until day ${after.dueDay}.`);
      else if (after?.bribeRefused && !before?.bribeRefused) say(`The ${factionLabel(f)} refused the money. The deadline stands.`);
      return next;
    });
  }, [say]);

  const doDismissNotice = useCallback(() => {
    setGame((g) => g ? dismissDemandNotice(g) : g);
  }, []);

  const demandActions: DemandActions = { onMeet: doMeetDemand, onBribe: doBribeDemand };

  // The oldest unseen demand notice pops up whenever demands can be acted on
  // and nothing else is covering the screen.
  const notice = game?.demandNotices[0];
  const popupOpen = !!(game && notice && screen === 'game' && canActOnDemands(game) &&
    !showIntro && !showManage && !favourOpen);

  /* ---- keyboard: 1-4 to choose, Enter/Space to continue */
  useEffect(() => {
    if (screen !== 'game' || !game || showIntro || showManage || popupOpen || favourOpen || menuOpen || filesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Let native focused controls own Enter/Space; otherwise a Fire/Buy/Menu
      // button can accidentally advance the day instead of activating.
      if ((e.key === 'Enter' || e.key === ' ') &&
          (e.target as HTMLElement)?.closest('button, a, [role=\"button\"]')) return;

      if (game.phase === 'shop' && /^[1-9]$/.test(e.key)) {
        const id = game.shopStock[Number(e.key) - 1];
        if (id) { e.preventDefault(); doBuy(id); }
        return;
      }
      if ((game.phase === 'stage' || game.phase === 'alert') && /^[1-9]$/.test(e.key)) {
        const card = activeCard(game);
        const opt = card ? orderedOptions(game, card)[Number(e.key) - 1] : undefined;
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
  }, [screen, game, doChoose, doContinue, doBuy, showIntro, showManage, popupOpen, favourOpen, menuOpen, filesOpen]);

  /* ---------------------------------------------------------------- render */

  if (screen === 'title' || !game) {
    return (
      <>
        <TitleScreen
          name={name}
          setName={setName}
          honorific={honorific}
          setHonorific={setHonorific}
          mandateId={mandateId}
          setMandateId={setMandateId}
          onNew={newGame}
          onContinue={savedDay ? continueGame : undefined}
          savedDay={savedDay}
          onDelete={savedDay ? () => { deleteSave(); setSavedDay(undefined); } : undefined}
          legacy={legacy}
          onProgress={() => setShowProgress(true)}
        />
        {showProgress && <ProgressScreen legacy={legacy} onClose={() => setShowProgress(false)} />}
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

  // The act-boundary result is a full-screen public proceeding. Its engine
  // result was frozen before this render; the UI only controls the reveal.
  if (game.phase === 'vote') {
    return (
      <div className="app vote-full">
        <ConfidenceVoteScreen s={game} onContinue={doCompleteVote} />
      </div>
    );
  }

  // Balance slice A (owner request): a crisis stage is its own scene — a
  // full-screen, dark "underground situation room" with red accents, like
  // the Back Room is its own scene. No masthead strap, no rail; only the
  // three resources stay visible. The card and its outcome both play here,
  // then "Leave the situation room" returns to the ordinary day.
  const current = game.current ? activeCard(game) : undefined;
  if (current?.tags?.includes('crisis-chain') && (game.phase === 'stage' || game.phase === 'resolve')) {
    return (
      <div className="app situation-room">
        <header className="sr-top">
          <div className="sr-title">
            <span className="sr-dot" aria-hidden="true" />
            <span className="sr-name">Situation room</span>
            <span className="sr-sub">Level B2 &middot; Day {game.day} &middot; {game.leaderName}</span>
          </div>
          <Ledger s={game} />
        </header>
        <main className="sr-stage">
          {game.phase === 'stage' && <CardView s={game} card={current} onChoose={doChoose} />}
          {game.phase === 'resolve' && (
            <OutcomeView s={game} onContinue={doContinue} continueLabel="Leave the situation room →" />
          )}
        </main>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  const brief = buildBriefing(game);
  const card = activeCard(game);
  const inAlert = game.phase === 'alert' || game.phase === 'alertResolve';
  const stage = game.agenda[game.stageIndex];
  const remaining = Math.max(0, game.todayDeck.length - game.stageIndex);

  // Phone/tablet: the strap's primary action is a bar fixed to the bottom of
  // the screen; scroll areas only reserve room for it while it is showing.
  const hasBar = ['briefing', 'resolve', 'alertResolve', 'night'].includes(game.phase);

  return (
    <div className={hasBar ? 'app has-bar' : 'app'}>
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
        {/* phone/tablet only: the three buttons above, folded into one */}
        <button
          type="button"
          className="m-menu-btn"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>
      {menuOpen && (
        <>
          <div className="m-menu-scrim" onClick={() => setMenuOpen(false)} />
          <nav className="m-menu" aria-label="Menu">
            <button className="btn" onClick={() => { setMenuOpen(false); setShowIntro(true); }}>Brief me</button>
            <button className="btn" onClick={() => { setMenuOpen(false); setShowManage(true); }}>Advisors &amp; Deals</button>
            <button className="btn" onClick={backToTitle}>Main menu</button>
            <span className="m-menu-note">Your run is saved automatically.</span>
          </nav>
        </>
      )}

      {/* ------------------------------------------------------------ strap */}
      <div className="strap">
        <span className={`threat ${brief.threatLevel}`} title={brief.threatNote}>
          <span className="threat-dot" /> {brief.threatLevel.toUpperCase()}
        </span>
        {stage && <span>{STAGE_META[stage].label}</span>}
        {(game.phase === 'stage' || game.phase === 'resolve') && (
          <span><b>{remaining}</b> item{remaining === 1 ? '' : 's'} left today</span>
        )}
        <StrapNote text={brief.threatNote} />
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

      {/* phone/tablet only: the factions at a glance; tap for the drawer */}
      <FactionStrip s={game} open={filesOpen} onOpen={() => setFilesOpen(true)} />

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

        <Rail s={game} onUseFavour={doUseFavour} demandActions={demandActions}
          open={filesOpen} onClose={() => setFilesOpen(false)} />
      </div>
      {filesOpen && <div className="rail-scrim" onClick={() => setFilesOpen(false)} />}

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

      {favourOpen && (
        <FavourDialog s={game} itemId={favourOpen} receipt={favourReceipt} onSpend={doSpendFavour} onClose={closeFavour} />
      )}

      {popupOpen && notice && (
        <DemandPopup s={game} notice={notice} actions={demandActions} onDismiss={doDismissNotice} />
      )}

      {showManage && (
        <ManageScreen s={game} legacy={legacy} onClose={() => setShowManage(false)} onFire={doFireAdvisor} onCut={doCutDeal} />
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

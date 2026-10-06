import { useEffect, useMemo, useState } from 'react';
import type { AlertDef, CardDef, GameState } from '../../game/types';
import { minigameIntro, MG_CARD } from '../../game/content/minigames';
import { minigameSeed, STRIKE_ODDS_FLAG } from '../../game/minigames';
import { bulletinSetup } from '../../game/minigames/bulletin';
import { palaceDifficulty, palaceSetup, GATES } from '../../game/minigames/palace';
import { breadDifficulty, breadSetup } from '../../game/minigames/breadlines';
import { weatherDifficulty, weatherSetup } from '../../game/minigames/weather';
import { shredDifficulty, shredSetup } from '../../game/minigames/shred';
import { moleDifficulty, moleSetup } from '../../game/minigames/mole';
import { budgetDifficulty, budgetSetup } from '../../game/minigames/budget';
import { pigeonDifficulty, pigeonSetup } from '../../game/minigames/pigeon';
import { pigeonChampion } from '../../game/content/mgPigeon';
import { hasMark } from '../../game/consequences';
import { Ledger } from '../components/Ledger';
import { OutcomeView } from '../components/CardView';
import { useMedia } from '../useMedia';
import { PalaceGame } from './PalaceGame';
import { BulletinGame } from './BulletinGame';
import { BreadLinesGame } from './BreadLinesGame';
import { WeatherGame } from './WeatherGame';
import { ShredGame } from './ShredGame';
import { MoleGame } from './MoleGame';
import { BudgetGame } from './BudgetGame';
import { PigeonGame } from './PigeonGame';

/** Per game: the start button, what giving up says, and the result stamps. */
const WORDS: Record<string, { go: string; quit: string; won: string; lost: string }> = {
  palace: { go: 'Take command →', quit: 'You left the command room', won: 'Palace held', lost: 'The Palace fell' },
  bulletin: { go: 'Go live →', quit: 'You walked out of the studio', won: 'Clean bulletin', lost: 'It aired' },
  breadlines: { go: 'Send the teams →', quit: 'You left the city to it', won: 'The city held', lost: 'Sarnica burns' },
  weather: { go: 'Start walking →', quit: 'You got back in the car', won: 'Dry at the steps', lost: 'Soaked through' },
  shred: { go: 'Start shredding →', quit: 'You opened the door', won: 'Nothing found', lost: 'Caught' },
  mole: { go: 'Watch the cameras →', quit: 'You switched off the cameras', won: 'Mole found', lost: 'Wrong desk' },
  budget: { go: 'Open the budget →', quit: 'You left Brask to it', won: 'Budget passed', lost: 'Walk-out' },
  pigeon: { go: 'Release the pigeon →', quit: 'You called the bird back', won: 'Message delivered', lost: 'Brought down' },
};

/**
 * PHASE 5 — the full-screen frame every mini-game plays in (App.tsx early
 * return, like the situation room). Four steps, owner's brief:
 *   story → how to play → the game → the result (then the engine's outcome).
 * It opens with a short title card (the "veil"), so a player who did not
 * expect a mini-game sees what is happening: each game has its own hand-off
 * (owner: the old hard cut was "really abrupt"). Tap or Enter skips it.
 * The game's layout comes from minigameSeed(), so a reload restarts the SAME
 * game; there is no skip, and "Give up" counts as a loss (owner's choice).
 * Each game has its own look: `.mg-<key>` on the frame.
 */

type Step = 'story' | 'howto' | 'play' | 'done';

export interface MinigameEnd {
  won: boolean; score: number; headline: string; detail: string;
  /** the card option the player chose at the end (Find the Mole), if any */
  choice?: string;
  /** facts for the result text (engine.ts finishMinigame()) */
  flags?: Record<string, number>;
}

export const REDUCED = '(prefers-reduced-motion: reduce)';

export function MinigameScreen({
  s, card, onFinish, onContinue, continueLabel = 'Back to the day →', practice,
}: {
  s: GameState;
  card: CardDef | AlertDef;
  onFinish: (won: boolean, score: number, choice?: string, flags?: Record<string, number>) => void;
  onContinue: () => void;
  continueLabel?: string;
  practice?: boolean;
}) {
  const key = card.minigame!;
  const reduced = useMedia(REDUCED);
  const [step, setStep] = useState<Step>(s.phase === 'resolve' ? 'done' : 'story');
  const [end, setEnd] = useState<MinigameEnd | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  // The opening title card: 'in' while it plays, 'out' while it fades away
  // over the story, then gone. Not shown when returning to a result.
  const [veil, setVeil] = useState<'in' | 'out' | null>(s.phase === 'resolve' ? null : 'in');
  const liftVeil = () => setVeil((v) => (v === 'in' ? 'out' : v));
  useEffect(() => {
    if (veil === 'in') {
      // long enough to read: the Bulletin's TV has to switch on first
      const t = window.setTimeout(liftVeil, reduced ? 1400 : key === 'bulletin' ? 2400 : 2100);
      return () => window.clearTimeout(t);
    }
    if (veil === 'out') {
      const t = window.setTimeout(() => setVeil(null), reduced ? 250 : 550);
      return () => window.clearTimeout(t);
    }
  }, [veil, reduced, key]);

  const seed = minigameSeed(s, card.id);
  const bulletin = useMemo(() => (key === 'bulletin' ? bulletinSetup(s, seed) : null), [key, s, seed]);
  const palace = useMemo(() => {
    if (key !== 'palace') return null;
    const strike = card.id === MG_CARD.palaceStrike;
    const odds = (s.flags[STRIKE_ODDS_FLAG] ?? 40) / 100;
    return {
      setup: palaceSetup(seed, palaceDifficulty(strike ? 'strike' : 'plot', s.act, odds)),
      gates: GATES + (hasMark(s, 'vetted-garrison') ? 1 : 0),
    };
  }, [key, card.id, s, seed]);

  const bread = useMemo(() => (key === 'breadlines' ? breadSetup(seed, breadDifficulty(s.act)) : null), [key, s.act, seed]);
  const weather = useMemo(() => (key === 'weather'
    // worse weather while scandals pile up; the crowd forgives a Chair who walked Dovra Day in the rain
    ? { setup: weatherSetup(seed, weatherDifficulty(s.act, s.hidden.scandal)), dryBonus: hasMark(s, 'walked-dovra') ? 4 : 0 }
    : null), [key, s, seed]);
  const shred = useMemo(() => (key === 'shred' ? shredSetup(seed, shredDifficulty(s.act)) : null), [key, s.act, seed]);
  const mole = useMemo(() => (key === 'mole' ? moleSetup(seed, moleDifficulty(s.act)) : null), [key, s.act, seed]);
  const budget = useMemo(() => (key === 'budget' ? budgetSetup(seed, budgetDifficulty(s.act)) : null), [key, s.act, seed]);
  // the Pigeon Federation lends its champion to a Chair who helped it
  const champion = pigeonChampion(s);
  const pigeon = useMemo(() => (key === 'pigeon' ? pigeonSetup(seed, pigeonDifficulty(s.act, champion)) : null), [key, s.act, seed, champion]);
  const words = WORDS[key];

  const intro = minigameIntro(s, card.id, bulletin
    ? { spikes: bulletin.spikes, spikeNote: bulletin.spikeNote, stories: bulletin.stories.length }
    : undefined);

  // Enter moves the story and the instructions on (the game has its own keys).
  useEffect(() => {
    if (step !== 'story' && step !== 'howto' && step !== 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if ((e.target as HTMLElement)?.closest('button')) return;
      if (s.phase === 'resolve') return; // App's own Enter handler continues the day
      e.preventDefault();
      if (veil === 'in') { liftVeil(); return; } // skip the title card
      if (step === 'story') setStep('howto');
      else if (step === 'howto') setStep('play');
      else if (step === 'done' && end) onFinish(end.won, end.score, end.choice, end.flags);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, end, onFinish, s.phase, veil]);

  const finish = (e: MinigameEnd) => { setEnd(e); setStep('done'); setConfirmQuit(false); };
  const giveUp = () => finish({
    won: false, score: 0,
    headline: words.quit,
    detail: 'Giving up counts as a loss.',
  });

  return (
    <div className={`app mg-full mg-${key}${reduced ? ' mg-calm' : ''}`}>
      <header className="mg-top">
        <div className="mg-title">
          <span className="mg-light" aria-hidden="true" />
          <span className="mg-name">{intro.title}</span>
          <span className="mg-sub">{practice ? 'Practice · nothing is saved' : intro.kicker}</span>
        </div>
        {step === 'play' && !confirmQuit && (
          <button className="btn mg-quit" onClick={() => setConfirmQuit(true)}>Give up</button>
        )}
        {!practice && <Ledger s={s} />}
      </header>

      {confirmQuit && (
        <div className="mg-confirm" role="alertdialog" aria-label="Give up?">
          <span>Give up? It counts as a loss.</span>
          <button className="btn btn-danger" onClick={giveUp}>Yes, give up</button>
          <button className="btn" onClick={() => setConfirmQuit(false)}>Keep playing</button>
        </div>
      )}

      {veil && (
        <div
          className={`mg-veil mg-veil-${key} ${veil}`}
          onClick={liftVeil}
          role="presentation"
        >
          <div className="mg-veil-fx" aria-hidden="true" />
          <div className="mg-veil-card">
            <div className="mg-veil-kicker">{practice ? 'Practice · mini-game' : 'Mini-game'}</div>
            <div className="mg-veil-title">{intro.title}</div>
            <div className="mg-veil-teaser">{intro.teaser}</div>
          </div>
        </div>
      )}

      {s.phase === 'resolve' ? (
        <main className="mg-body mg-result-body">
          <OutcomeView s={s} onContinue={onContinue} continueLabel={continueLabel} />
        </main>
      ) : veil === 'in' ? (
        <main className="mg-body" />
      ) : step === 'story' ? (
        <>
          <main className="mg-body">
            <section className="mg-sheet mg-story" key="story">
              <div className="mg-kicker">{intro.kicker}</div>
              <h1>{intro.title}</h1>
              {intro.story.map((p, i) => (
                <p key={i} style={{ animationDelay: `${180 + i * 260}ms` }}>{p}</p>
              ))}
            </section>
          </main>
          <footer className="mg-foot">
            <button className="btn btn-primary" onClick={() => setStep('howto')}>How it works →</button>
          </footer>
        </>
      ) : step === 'howto' ? (
        <>
          <main className="mg-body">
            <section className="mg-sheet mg-howto" key="howto">
              <div className="mg-kicker">How to play</div>
              <ol>
                {intro.howTo.map((h, i) => <li key={i} style={{ animationDelay: `${i * 90}ms` }}>{h}</li>)}
              </ol>
              <div className="mg-stakes">
                <div className="win">{intro.stakes.win}</div>
                <div className="lose">{intro.stakes.lose}</div>
              </div>
              {intro.because && <div className="mg-because">{intro.because}</div>}
            </section>
          </main>
          <footer className="mg-foot">
            <button className="btn" onClick={() => setStep('story')}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep('play')}>
              {words.go}
            </button>
          </footer>
        </>
      ) : step === 'play' ? (
        <main className="mg-body mg-play">
          {palace && <PalaceGame setup={palace.setup} gates={palace.gates} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {bulletin && <BulletinGame setup={bulletin} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {bread && <BreadLinesGame setup={bread} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {weather && <WeatherGame setup={weather.setup} dryBonus={weather.dryBonus} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {shred && <ShredGame setup={shred} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {mole && <MoleGame setup={mole} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {budget && <BudgetGame setup={budget} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
          {pigeon && <PigeonGame setup={pigeon} reduced={reduced} paused={confirmQuit} onEnd={finish} />}
        </main>
      ) : (
        <>
          <main className="mg-body">
            <section className={`mg-sheet mg-end ${end?.won ? 'won' : 'lost'}`}>
              <div className="mg-stamp">{end?.won ? words.won : words.lost}</div>
              <h2>{end?.headline}</h2>
              <p>{end?.detail}</p>
            </section>
          </main>
          <footer className="mg-foot">
            <button className="btn btn-primary" onClick={() => end && onFinish(end.won, end.score, end.choice, end.flags)}>
              See what it cost →
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

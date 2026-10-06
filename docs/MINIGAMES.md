# Mini-games — brief for the next agent

**Written 2026-10-01; slice 1 built the same day.** Phase 5. Read this after `AGENTS.md`,
`PROJECT_STATUS.md` and `docs/SYSTEMS.md`.

## 1. Where it stands

**Slice 1 approved (2026-10-01):** the mini-game system, **Hold the
Palace** (coups), **The 7pm Bulletin** and the opening title card.
**Slice 2 built, waiting for the owner's playtest:** **Bread Lines**,
**The Last Kilometre**, **Shred the Ledger**. How it works, with the
numbers: `docs/SYSTEMS.md` §12.

**Before the next slice:** ask the owner which games come next (the list
in §3), build them as a slice, stop for a playtest. Don't build several
slices at once. Don't fill gaps in the owner's description with your own
design. Ask.

## 2. What the owner has decided

From their request (2026-10-01): mini-games are **a core feature**; **a new
one appears daily**, woven into the cards (you get a card or a mini-game);
each is **unique and tied into the story**; it is **basically full screen**,
opening with **story context, then instructions**; **failing hurts your
reputation**; **events trigger specific games** (a coup or a faction trying
to take over); **"all games should have smooth and unique animations"**.

Their answers to the design questions:

| Question | Owner's choice |
|---|---|
| What a loss hurts | **Legitimacy + the faction the game is about** (shown in the result; the factions remember it) |
| How the daily game fits | **Replaces one card** a day (from day 2), at a random point |
| Winning | **A small reward**; a coup game won also ends the threat |
| First slice | **The system + Hold the Palace (coup) + one daily game** |
| Daily game | **#2 The 7pm Bulletin** |
| Look | **Each its own, some dark** (Palace dark, Bulletin a bright studio) |
| Timers | **A mix**: some timed, some calm puzzles; Reduce Motion slows timers |
| Cheating | **Reload = the same game, no skip; Give up = a loss** |
| Coup stakes | **Both, by severity**: an officers' plot (pressure) = a heavy hit; the Army's real strike (ultimatum ran out) = the run ends if lost |
| Coup trigger | **High pressure, once per act** (plus the Army's ultimatum) |

After slice 1 (2026-10-01):
- **The transition:** the hard cut was *"really abrupt"*. Chosen: a
  title card before each game, own style per game (no extra warning card).
- **Direction for new games:** *"I want careful play to be rewarding. Yes,
  they should have some strategy to them and skill it shouldn't be 100%
  pass every time either. … the goal of the mini games is to add more
  content into the game and make it not feel as if the users are just
  reading and clicking buttons."* 2–3 games built on reading are fine (the
  Bulletin is one); the rest should be skill/action with pictures. The
  story and how-to screens keep their text.
- **Balance target:** careful play about 60% (reached: 59%).
- **Slice 2 games chosen:** Bread Lines, The Last Kilometre, Shred the
  Ledger.
- **After the slice 2 playtest (2026-10-02):** the Kilometre's look was
  redone as a polished first-person street (owner's pick over a
  side-scroller or top-down view); Shred got conveyor belts and face-down
  papers (owner's picks; not chosen: changing rules per pile, tighter
  limits alone). Rule for difficulty: never a game you lose while doing
  everything right.
- **2026-10-03:** the Kilometre is replaced by a new game for the same
  activity, **Walk in the Weather**, played at the start of every act and
  harder each act, with stakes that set the tone for the act (owner's
  picks over a lane runner and a pigeon game). Shred was "still way too
  easy": tuned for a quick player, then made *"2-3 times as fast"*
  (owner, 2026-10-03; the alternative they named was a fundamentally
  harder game from scratch). 2026-10-04: act 1's 2× game became the top
  difficulty (act 3); acts 1–2 ramp up to it.

- **2026-10-06:** trackpad players couldn't click Shred's papers fast
  enough. Owner chose number keys on the papers (*"do numbers instead.
  single digits"*) over one key per belt, a slower laptop speed, or a
  redesign. Any new real-time tap game should get a keyboard way too.

Earlier notes still stand: variety (each game its own look, distinct from
the three card layouts) and mobile-first (the owner plays on an iPhone).

## 3. The idea list (proposed to the owner; not yet chosen)

Built: **#1 Hold the Palace**, **#2 The 7pm Bulletin**, **#3 Shred the
Ledger**, **#8 Bread Lines**, **#10 The Last Kilometre**. Still open (the
reading-heavy ones — #4, #5, #7, #11 — only if the owner wants another
reading game):

| # | Name | What you do | Hook / trigger |
|---|---|---|---|
| 4 | Count the Votes | Phone ministers before a Council vote; read each one's tell | before a confidence vote; the Elites turning |
| 5 | Who Was in the Stairwell? | Logic puzzle: four suspects, Sable files, one liar | the Stairwell Tapes |
| 6 | Budget Night | Split a fixed budget; each faction has a minimum | debt; Workers/Elites demands |
| 7 | The Ambassador's Table | Haggle with Ostrene's ambassador; know when to stop | the Ostrene gas cutoff |
| 9 | Find the Mole | Watch who meets whom, name the leaker | Security turning hostile; a betrayal warning |
| 11 | Balcony Speech | Build a speech line by line as the crowd reacts | a Street or Workers demand |
| 12 | The Pigeon Run | Steer a racing pigeon with a secret message past Drovnan hawks | Drovna, the Hadem border |

Adding a game: rules in `src/game/minigames/<game>.ts` (pure), a card with
`won`/`lost` and its intro in `content/minigames.ts`, a `MinigameKey`, a
screen in `src/ui/minigames/`, its look in the MINI-GAMES block of
`index.css`, a practice name in `practice.ts`, tests, and scenes. A daily
game also goes in `DAILY_MINIGAMES` (then days stop repeating yesterday's).

## 4. Rules a mini-game must follow

These come from `AGENTS.md` §4. They are the ones a mini-game is most likely
to break:

- **Game logic in `src/game/`, no React or DOM there** (ground rule 11).
  The UI only shows the state and sends the player's input.
- **Every change to the world goes through `applyEffects()`** (rule 2).
- **No `Math.random()`.** Use the saved RNG (`withRng`), so runs replay
  the same way (rule 4).
- **`GameState` stays plain JSON** (rule 1). If a mini-game keeps state
  between taps and should survive a reload, it goes in `GameState`:
  **bump `SAVE_VERSION`** and tell the owner it resets their run (rule 10).
- **Hidden values are never shown as numbers** (rule 6).
- **Options are read through `orderedOptions()`** (rule 12). The tests,
  the balance probe and the browser tools drive the game through card
  options. If a mini-game card has no normal options, the simulated runs in
  `sim.test.ts` / `balance.probe.ts` will need another way to get past it.
  Decide that up front.
- **Writing rules** (`AGENTS.md` §5): short sentences, plain words, real
  numbers, prices in the hint.

## 5. Phone and desktop rules

- **Touch first.** Every action works with a tap. Nothing needed to play
  may depend on hover (rule 11). If you use dragging, also give a tap way
  to do the same thing.
- **Keyboard on desktop** where it makes sense (the game already has number
  keys and Enter; see `App.tsx`).
- **The main action is always on screen without scrolling** (rule 9). On a
  phone, keep it clear of the bottom safe area. iPhone Safari's floating
  toolbar counts as that area. Never pad a fixed element down into it
  (`docs/MOBILE_AND_HOSTING.md` §0 explains the bug this caused).
- **Reduce motion:** animations and timers need a calm fallback.
- **Don't change existing desktop screens.** Take before/after pictures
  with `tools/desktop-snap.mjs` (see §6). Mini-game screens are new, so
  they are added to the checks rather than compared.
- Only two screens are dark (the Back Room and the situation room), both at
  the owner's request. Ask before making a mini-game dark.

## 6. Testing (all of it, before every merge)

- `npm test` (unit tests): add tests for the mini-game's rules. That means
  the same input always gives the same result, every effect goes through
  `applyEffects()`, and nothing breaks the simulated runs.
- `npm run build`.
- `PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:browser`
  in a cloud session. Add a browser check (`tools/<name>.mjs`, registered in
  `tools/run-browser.mjs`) that plays the mini-game at 1366×700 **and** at
  phone size.
- Add the mini-game's screen to `tools/scenes.mjs`, so `tools/phone.mjs`
  checks it at all five sizes. One of them is an iPhone with Safari's
  toolbar.
- `tools/desktop-snap.mjs`: run `SNAP_MODE=save node tools/run-browser.mjs
  desktop-snap` **before** your changes (the pictures live in the temp
  folder, so a new session has none until you do), and `node
  tools/run-browser.mjs desktop-snap` after. The 40 existing desktop
  pictures must not change. A screen you add to `scenes.mjs` has no
  "before" picture, so the comparison reports it missing. Compare before
  adding it, or check that only the new screen is reported, then save again.
- `npm run build && node tools/pages-preview.mjs`: the game still works
  from the `/Reign-Check/` folder GitHub Pages uses.

## 7. Shipping

**Every merge into `claude/confident-meitner-lc0bgc` publishes the live
site** (`https://ohfrinzx.github.io/Reign-Check/`), which the owner and
their family play on their phones. Merge only after everything in §6
passes. Announce the merge before and after (`AGENTS.md` §10). End with the
hand-off report (`AGENTS.md` §3a), including where to find the mini-game in
play and how to reach it quickly if it is rare.

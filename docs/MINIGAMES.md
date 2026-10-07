# Mini-games — the owner's decisions, the record, and how to add one

**Phase 5, 2026-10-01 → 2026-10-07.** Eleven mini-game cards (ten games)
are built. This file holds the owner's decisions about mini-games, the
idea list, and the rules for adding or changing one. How each game works
now, with its numbers, is in `docs/SYSTEMS.md` §12. Read this after
`AGENTS.md`, `PROJECT_STATUS.md` and `docs/SYSTEMS.md`.

**Balancing note:** every mini-game result changes the core numbers
(Legitimacy, faction loyalty, hidden pressures). Those result sizes are
balance knobs; they are listed in `docs/BALANCE.md`. Change a game's
*rules* here and in its own file; change a result's *size* through the
balance process (`docs/BALANCE.md` §5).

## 1. Where it stands

**Slice 1 approved (2026-10-01):** the mini-game system, **Hold the
Palace** (coups), **The 7pm Bulletin** and the opening title card.
**Slice 2 approved (2026-10-06):** **Bread Lines**, **The Last Kilometre**
(Walk in the Weather), **Shred the Ledger** (with number keys on laptops).
**Slice 3 part A approved (2026-10-07)** (*"Confirmed all standing play
tests. Move to part B"*): Find the Mole (with the choice of what happens
to the mole), Budget Night (retuned; each jar judged at eight), The Pigeon
Run. **Part B built, waiting for the owner's playtest (2026-10-07):** Who Was
in the Stairwell?, The Ambassador's Table (both daily, picked by the
Stairwell Tapes / Ostrene gas crises). That completes the idea list's
chosen games (all of §3 except #4 Count the Votes and #11 Balcony Speech).
How each works, with the numbers: `docs/SYSTEMS.md` §12.

**Next (owner, 2026-10-07):** a balancing pass on the core systems before
anything else — `docs/BALANCE.md`. No new mini-games until the owner asks.

**Before any new mini-game:** ask the owner (the list in §3 has the two
unbuilt ideas), build it as a slice, stop for a playtest. Don't build
several slices at once. Don't fill gaps in the owner's description with
your own design. Ask.

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

- **2026-10-06 — slice 2 and Shred's number keys approved** (*"good go
  onto the next slice"*). **Slice 3 chosen:** five games, all in the daily
  rotation and picked by their events, delivered in **two merges**:
  - **Part A:** **#9 Find the Mole** (live watching: people walk a
    ministry floor plan in real time, watch who meets the journalist's
    contact, then name the mole; **dark**, a night security camera),
    **#6 Budget Night** (**against the clock, 90 seconds**: *"plenty of
    time but still can't just sit there"*; bright Finance Ministry desk),
    **#12 The Pigeon Run** (**hold to climb**, let go to glide, past border
    hawks; daylight sky).
  - **Part B** (after the part A playtest): **#5 Who Was in the
    Stairwell?** (calm logic puzzle; **dark**, a Sable Office archive) and
    **#7 The Ambassador's Table** (5 rounds, an offer and a line each; his
    face, glass and notes are the tells; calm, no timer).

Earlier notes still stand: variety (each game its own look, distinct from
the three card layouts) and mobile-first (the owner plays on an iPhone).

## 3. The idea list

Built: **#1 Hold the Palace**, **#2 The 7pm Bulletin**, **#3 Shred the
Ledger**, **#5 Who Was in the Stairwell?**, **#6 Budget Night**, **#7 The
Ambassador's Table**, **#8 Bread Lines**, **#9 Find the Mole**, **#10 The
Last Kilometre** (now Walk in the Weather), **#12 The Pigeon Run**.
**Not built:** #4 Count the Votes and #11 Balcony Speech (both
reading-heavy; only if the owner asks). The table keeps the original
pitches of the later games for reference:

| # | Name | What you do | Hook / trigger |
|---|---|---|---|
| 4 | Count the Votes | Phone ministers before a Council vote; read each one's tell | before a confidence vote; the Elites turning |
| 5 | Who Was in the Stairwell? | Logic puzzle: four suspects, Sable files, one liar | the Stairwell Tapes |
| 6 | Budget Night | Split a fixed budget; each faction has a minimum | debt; Workers/Elites demands |
| 7 | The Ambassador's Table | Haggle with Ostrene's ambassador; know when to stop | the Ostrene gas cutoff |
| 9 | Find the Mole | Watch who meets whom, name the leaker | Security turning hostile; a betrayal warning |
| 11 | Balcony Speech | Build a speech line by line as the crowd reacts | a Street or Workers demand |
| 12 | The Pigeon Run | Steer a racing pigeon with a secret message past Drovnan hawks | Drovna, the Hadem border |

Adding a game (the pattern slice 3 used):
- rules in `src/game/minigames/<game>.ts` (pure; `xDifficulty(act)` and
  `xSetup(seed, d)`), its card (`won` / `lost`, plus any extra choices —
  see Find the Mole) and its intro (`story`, `howTo`, `stakes`) in its own
  `content/mg<Game>.ts`, registered in `content/minigames.ts` (`MG_CARD`,
  `MINIGAME_CARDS`, `minigameIntro`), a `MinigameKey` in `types.ts`;
- the screen in `src/ui/minigames/<Game>Game.tsx`, wired in
  `MinigameScreen.tsx` (`WORDS`, setup, render); its look in its own
  marked block at the end of `index.css`;
- a practice name in `practice.ts`, a scene in `tools/scenes.mjs`, a
  browser check `tools/<game>.mjs` registered in `tools/run-browser.mjs`,
  and unit tests `src/game/__tests__/<game>.test.ts` with simulated
  players by skill;
- a daily game also goes in `DAILY_MINIGAMES`; an event trigger goes in
  `eventMinigames()` (most urgent first; an event never brings
  yesterday's game).
- The frame supports, without engine changes: a chosen option at the end
  (`MinigameEnd.choice`, e.g. the mole's fate), facts for the result text
  (`MinigameEnd.flags`, e.g. Budget Night's jars), and a custom result
  stamp (`MinigameEnd.stamp`). A result can carry its own marks
  (`CardOutcome.marks`).

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
- **Keyboard on desktop for everything** (owner, 2026-10-06: trackpad
  players can't click fast-moving things): number keys or arrows + Enter,
  with the key hints shown only when a mouse or trackpad is attached
  (`(any-pointer: fine)`), never on phones.
- **The main action is always on screen without scrolling** (rule 9). On a
  phone, keep it clear of the bottom safe area. iPhone Safari's floating
  toolbar counts as that area. Never pad a fixed element down into it
  (`docs/MOBILE_AND_HOSTING.md` §0 explains the bug this caused).
- **Reduce motion:** animations and timers need a calm fallback.
- **Don't change existing desktop screens.** Take before/after pictures
  with `tools/desktop-snap.mjs` (see §6). Mini-game screens are new, so
  they are added to the checks rather than compared.
- Dark looks are the owner's call. Dark now: the Back Room, the situation
  room, and the mini-games Hold the Palace, Shred the Ledger (walnut desk),
  Find the Mole and Who Was in the Stairwell?. Ask before making anything
  else dark.

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
  tools/run-browser.mjs desktop-snap` after. The existing desktop pictures
  (33 screens × 2 widths) must not change, except the `ending` screen,
  whose scripted run changes whenever the daily games or results change.
  A screen you add to `scenes.mjs` has no "before" picture; the
  comparison lists it as new instead of failing.
- `npm run build && node tools/pages-preview.mjs`: the game still works
  from the `/Reign-Check/` folder GitHub Pages uses.

## 7. Shipping

**Every merge into `claude/confident-meitner-lc0bgc` publishes the live
site** (`https://ohfrinzx.github.io/Reign-Check/`), which the owner and
their family play on their phones. Merge only after everything in §6
passes. Announce the merge before and after (`AGENTS.md` §10). End with the
hand-off report (`AGENTS.md` §3a), including where to find the mini-game in
play and how to reach it quickly if it is rare.

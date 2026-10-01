# Mini-games — brief for the next agent

**Written 2026-10-01.** Phase 5 starts here. Read this after `AGENTS.md`,
`PROJECT_STATUS.md` and `docs/SYSTEMS.md`.

## 1. Start by talking to the owner

**The owner has their own ideas for the mini-games and will talk them
through with you.** This file does not design any mini-game, on purpose.
Before writing code:

1. Ask the owner what they have in mind: which mini-game first, what the
   player does, what it affects, how often it appears.
2. Write back a short plan in plain words: what the player sees, what they
   do, what changes in the game. Ask about anything unclear.
3. Build one mini-game as a slice, then stop for the owner's playtest
   (`AGENTS.md` §3). Don't build several at once.

Don't fill gaps in the owner's description with your own design. Ask.

## 2. What the owner has already said

- **Variety:** *"I want there to be some variety between the cards and
  mini-games when we add them to reduce visual and gameplay redundancy."*
  Each mini-game gets **its own look**, distinct from the three card
  layouts that exist (the lead story, the private file, the situation
  room).
- **Mobile-first:** mini-games were deliberately left until after the phone
  layout, so each is designed once for both a phone and a desktop. The owner
  plays on an iPhone (Safari and the Home Screen app).
- **Earlier notes** (from Milestone 1, not confirmed by the owner since):
  "start with Budget Allocation and Cabinet Negotiation". Treat that as a
  suggestion to raise, not a decision.

## 3. What already exists in the code

Nothing is built yet, but a few hooks were reserved in Milestone 1. Use them
or replace them, whatever fits the owner's design:

- `types.ts`: `CardDef.minigame?: MinigameKey`, with nine placeholder keys
  (`budget`, `cabinet`, `intel`, `diplomacy`, `media`, `crisis`, `address`,
  `bargain`, `loyalty`). Nothing reads them yet.
- `types.ts`: a `'minigame'` value in `Phase` and in `CardCategory`
  (`CardView.tsx` labels that category "Special"). The engine never enters
  that phase today.
- How a card reaches the player: `engine.ts` `drawDeck()` (weighted draw
  plus `s.queued`), `openCurrent()`, `chooseOption()`. Special card types
  are picked out by **tag** in `CardView.tsx` (`character-event`,
  `crisis-chain`). The situation room is a fullscreen early return in
  `App.tsx` (look at it if a mini-game needs its own scene).

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

# PROJECT STATUS — Reign Check

**Kept short on purpose.** "Now" is the current state; the log below it is
one line per step. Full old handovers are in
`docs/archive/PROJECT_STATUS_HISTORY.md`, and old per-slice notes in
`docs/archive/SLICE_NOTES.md`. How the systems work today is in
`docs/SYSTEMS.md`; the rules and workflow are in `AGENTS.md`.

## Now (2026-10-06)

**SHRED THE LEDGER NUMBER KEYS — BUILT, WAITING FOR THE OWNER'S
PLAYTEST.** Owner: *"laptop users on trackpad can't seem to click the
papers fast enough"*. Chosen: a number on each paper (owner: *"do numbers
instead. single digits"*).
- On a laptop (mouse or trackpad), every paper shows a digit 0–9 in its
  corner. Press it instead of clicking: once to turn a face-down paper
  over, again to shred. Clicking still works. No two papers on screen
  share a number. Phones show no numbers and play as before.
- The how-to screen says so. Same speeds, same papers; no save reset.

**Approved 2026-10-06** (*"both have been playtested and approved"*): the
ten numbers explained in the game (result pills "→ GRIP", "What do these
mean?", Brief me, night summary, Grip/Legitimacy parts) and the slower
7pm Bulletin (7 / 6.5 / 6 s per story, clock after the slide-in).

**Mini-games slice 2** (below) is still waiting for the owner's playtest.

## Mini-games slice 2 (2026-10-01)

**MINI-GAMES SLICE 2 — BUILT, WAITING FOR THE OWNER'S PLAYTEST.** Slice 1
approved: *"besides that all works and we can move onto the next"*. Owner,
for slice 2: careful play should be rewarding (about 60%), games need
strategy and skill but not a 100% pass, and *"the goal of the mini games is
to add more content into the game and make it not feel as if the users are
just reading and clicking buttons"* (2–3 reading games are fine; the
story and how-to screens keep their text).
- **Three new daily games, little reading:** **Bread Lines** (real-time
  city map: talk or police each flare-up), **The Last Kilometre** (rhythm:
  duck / wave / stop as things come out of the crowd), **Shred the Ledger**
  (shred the red-stamped papers on the belts before they reach the
  auditors' box). Each has its own look,
  title card and animations.
- **Daily games now rotate** (never the same two days running), and
  **events pick the game**: the Bread Riots or a hostile Street → Bread
  Lines; the Free Zone Ledger → Shred.
- **Bigger win rewards:** careful play survives 59% (was 46% after slice 1).
- **After the owner's playtests (2026-10-02/03):** The Last Kilometre is
  now **Walk in the Weather**, the act opener (first thing on days 1, 7 and
  13, harder each act, bigger stakes); Shred the Ledger runs on conveyor
  belts with face-down papers, much faster, and harder each act (act 3 is
  the 2× game the owner played in act 1).
- **Bug found and fixed while testing:** on a phone, the tap that finished
  a pile of papers also landed as a click on the next pile's paper.
- No save reset (`SAVE_VERSION` 14). Tests 195.
- Practice links: `…/Reign-Check/?practice=bread`, `kilometre`, `shred`.

**Mini-games slice 1 (approved 2026-10-01):** the system (a daily game
from day 2; coups trigger Hold the Palace), The 7pm Bulletin, and the
opening title card.

**Balance slice D (factions remember your decisions) is approved:**
*"Slice D Approved."*

**PLAYTESTED ON THE OWNER'S PHONE AND APPROVED: the mobile web version,
hosted free on GitHub Pages.** Owner, verbatim: *"Playtested on my phone, everything works now"*
(after three fixes from their first phone playtest: an accepted bribe now
closes the demand pop-up; the bottom button is a compact floating one; one
Continue on phones — see the log). Owner's
choices: build it all, then one merge; Home Screen polish; factions as a
strip + Files drawer; tablets get the phone layout; tests before every
deploy.
- **Live link:** https://ohfrinzx.github.io/Reign-Check/ — every merge
  into the default branch now runs the tests, builds and publishes
  (`.github/workflows/deploy.yml`).
- **Phone layout** (1080px and narrower): ☰ menu, the three resources
  always visible, a faction strip that opens the Files drawer (everything
  from the desktop rail, faction memories included), a compact red action
  button floating at the bottom, one-column front page, stacked Back Room, touch-sized
  buttons, no keyboard hints on touch screens, a tighter landscape mode.
- **Home Screen:** icon, name, full-screen launch (`manifest.webmanifest`).
- **Found and fixed:** the fonts would all have failed on GitHub Pages
  (they pointed at the site root); tapping Money/Grip/Legitimacy on a phone
  opened and closed its explanation at once.
- **Desktop is pixel-identical** to before (40 screenshots compared). No
  game logic changed; no save reset (`SAVE_VERSION` stays 14).
**Later, each needing the owner's go-ahead:** sound, a coup crisis chain,
the remaining ending types.

**Balance slice D — factions remember your decisions (approved
2026-10-01).** The owner asked for it, verbatim: *"I
do want to update the consequences so factions react to my decisions as
well. That's a key part of gameplay I would say. add a few more blocked
options I don't believe I have even seen one during testing."* They chose
all four options offered: faction demands, changed demand options, factions
remember, and faction reactions on cards.
- **Factions remember:** each faction's row in Files shows what it
  remembers ("▼ Remembers: you sent soldiers to the Gorsk mines (day 5)"),
  and its mood keeps drifting that way for 4 mornings.
- **Decisions trigger demands:** 8 demands a faction makes because of what
  you did (e.g. "The Street wants Sanna Vel released"), shown with
  "Because you …".
- **Demands handled differently:** 14 memories make a faction's demand
  cheaper or dearer, or make it refuse bribes, with the reason shown.
- **More blocked options:** 10 more locks on common cards, several
  credited to a faction ("— the army remembers"). Locks now appear in
  about 76% of runs (about 20% before).
- No save reset: `SAVE_VERSION` stays 14. Balance: careful play survives
  59% (was 67%), random 3%.

**Later, each needing the owner's go-ahead:** mini-games (build them
mobile-first, each with its own look), sound, a coup crisis chain, the
remaining ending types.

## Log (newest first)

- **2026-10-06** — Owner approved the number explanations and the slower
  Bulletin. Then: trackpad players can't click Shred's papers fast enough;
  chose number keys on the papers (single digits). Built: 0–9 on each
  paper on laptops, never two alike on screen.

- **2026-10-05** — Owner: the Bulletin's stories go by too fast to read.
  Owner chose 7 / 6.5 / 6 s by act (was 5 / 4.5 / 4) and a clock that
  starts after the slide-in.

- **2026-10-05** — Owner: Information (and the other numbers on result
  pills) is never explained in the game. Built: pills say what they feed,
  a "What do these mean?" list, a Brief me section, matching names on the
  night summary, Grip/Legitimacy parts in the top bar. No rules changed.

- **2026-10-04** — Owner, after playing the 2× Shred: *"The first level
  is really what the top difficulty should be"*. Act 3 is now that game;
  acts 1 and 2 ramp up to it (1.4× / 1.7×). Simulated expert 61 / 50 /
  30% by act; a very quick player 82 / 76 / 68%.

- **2026-10-03** — Owner: Shred *"2-3 times as fast … That or we need a
  fundamentally harder game. Like from scratch"*. Built the speed-up:
  belts and papers 2× / 2.5× / 3× as fast in acts 1 / 2 / 3, twice the
  waves. Simulated expert 79% → 38% (act 1), 0% in acts 2–3; a very quick
  player 69 / 56 / 52%. If this is still wrong, the next step is a new
  game from scratch.

- **2026-10-03** — Owner: still did not like the Kilometre (*"drop the 3d
  version"*): *"Build a different game completely to replace this
  activity … something that gets increasingly harder and is played at the
  very start of every act like its a new year"*; chose **Walk in the
  Weather** (umbrella against gusts; drizzle → wind → storm) with stakes
  that set the tone for the act. Also *"The shred game is still way to
  easy"*: belts faster, more face-down papers, all tricks from act 1, one
  mistake allowed (average player 82% → 40% in act 1). Careful play 63%.

- **2026-10-02** — Owner playtest of slice 2: The Last Kilometre's idea is
  fine but *"the overall look and design sucks"*; Shred the Ledger is *"to
  easy"* — make it tougher, but *"not in the way that even if you do
  everything right you automatically lose"*. Chosen and built: a polished
  first-person street for the Kilometre (illustrated avenue, animated
  crowd, items thrown from the crowd, a closing timing ring, the Chair's
  hands); conveyor belts and face-down papers for Shred (average player
  95% → 82% in act 1, a slower careful player still wins most).

- **2026-10-01** — Mini-games slice 1 approved (*"all works and we can
  move onto the next"*). Slice 2 built: Bread Lines, The Last Kilometre,
  Shred the Ledger; event-picked daily games; win rewards raised (careful
  59%). Owner's direction: low-reading, skill-based games.

- **2026-10-01** — Owner: the cut into a mini-game was *"really abrupt"*.
  Chose a transition only (no warning card), own style per game: each game
  now opens with a title card (Palace: lights go down + siren pulse;
  Bulletin: a TV switching on), then cross-fades into the story.

- **2026-10-01** — Mini-games slice 1 built: the mini-game system, Hold
  the Palace (coups), The 7pm Bulletin (daily). Owner chose: Legitimacy +
  faction on a loss, replaces one card a day, small win reward, system +
  coup + one daily game first, own look per game (some dark), timers in
  some games, no skip, coup loss ends the run only for the Army's real
  strike, plot once per act at high pressure.

- **2026-10-01** — Slice D approved: *"Slice D Approved."* Mini-games
  green-lit; brief written (`docs/MINIGAMES.md`), design left to the owner.
- **2026-09-28** — The blinking "live" status dot is on desktop too (owner
  request). Desktop pictures compared first: only the 7×7px dot changed.
- **2026-09-24** — Owner request: on a phone the strap's cut-off note now
  scrolls like a news ticker, and the status dot blinks like a "live"
  light (both off with reduce motion; desktop unchanged).
- **2026-09-24** — Mobile web version approved on the owner's phone:
  *"Playtested on my phone, everything works now"*
- **2026-09-24** — Owner playtest of the phone version: *"everything seems
  to work well for the mobile layout at least through the browser."* Bug
  fixed: an accepted bribe from the demand pop-up left the pop-up open
  (only Meet cleared it). The pop-up's footnote now says "in your Files" on
  a phone. Unit + browser tests added for both.
- **2026-09-24** — Owner screenshot from an iPhone: the red bottom bar was
  far too big (~126px, Safari's toolbar turned red). Cause: it padded
  itself by the "safe area", which on iPhone Safari is the floating
  toolbar; a shrunken desktop browser reports 0, so no test saw it. Now a
  compact floating button (48px, max 460px wide) above the safe area;
  `phone.mjs` gained an emulated iPhone-Safari size that fails the old bar.
- **2026-09-24** — Owner: no need for two Continue buttons on a phone.
  Result cards now hide their own Continue while the floating button shows
  (desktop keeps both, unchanged); `phone.mjs` checks for one.
- **2026-09-23** — Mobile web version + GitHub Pages deploy built,
  verified and merged (see "Now"; `docs/MOBILE_AND_HOSTING.md` §0). New
  checks: `tools/phone.mjs` (default suite), `tools/desktop-snap.mjs`,
  `tools/pages-preview.mjs`.
- **2026-09-23** — Balance slice D (factions remember) built and merged.
  The docs were reorganised: `AGENTS.md` is the single guide, `CLAUDE.md`
  only points to it, `docs/SYSTEMS.md` is new, and the history moved to
  `docs/archive/`. Six old branches are fully merged and can be deleted
  (the cloud session is not allowed to delete branches, so the owner does
  it on GitHub): `claude/reign-check-naming-iie3u7`,
  `codex/confidence-vote-planning`, `codex/confidence-vote-reveal`,
  `codex/document-vote-playtest-approval`, `codex/mandates-and-review`,
  `codex/run-deck-review`.
- **2026-09-23** — The owner chose a free mobile web version on GitHub
  Pages. The repo was made public and Pages switched on. Brief written
  (`docs/MOBILE_AND_HOSTING.md`), plus `tools/phone-audit.mjs`.
- **2026-09-23** — Balance slice C (consequences: 18 marks, 36 reactions,
  "Because you…") approved: *"Those playtests check out."* Phase 3
  complete.
- **2026-09-23** — Balance slice B (option shuffle, hostile factions,
  bloc-counted vote, Hard tuning) approved: *"Current playtesting checks
  out, move onto Part C."*
- **2026-09-23** — Balance slice A (daily private files, dark situation
  room, aimed favours) approved.
- **2026-09-22** — Phase 3 steps 1–3 (faction demands, character events,
  crisis chains) built and approved; the confidence-vote reveal approved.
- **2026-09-21** — Phase 2 (acts and vote, Back Room shop, mandates, run
  deck, meta-progression) complete and approved.
- **Earlier** — Phase 1: the playable core, then the Poster/Broadsheet
  rebuild, approved: *"So I believe Phase one playtests are complete."*

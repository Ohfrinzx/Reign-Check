# PROJECT STATUS — Reign Check

**Kept short on purpose.** "Now" is the current state; the log below it is
one line per step. Full old handovers are in
`docs/archive/PROJECT_STATUS_HISTORY.md`, and old per-slice notes in
`docs/archive/SLICE_NOTES.md`. How the systems work today is in
`docs/SYSTEMS.md`; the rules and workflow are in `AGENTS.md`.

## Now (2026-10-01)

**MINI-GAMES SLICE 1 — BUILT, WAITING FOR THE OWNER'S PLAYTEST.** Owner,
verbatim: *"we are ready to begin the mini game implementation. This should
be one of the core features of the game and a new mini game should appear
daily. … If the user fails the mini game it should hurt their reputation.
Certain events should also trigger specific mini games such as a coup …"*
and *"all games should have smooth and unique animations"*. Their answers
to the design questions are in `docs/MINIGAMES.md` §2.
- **Daily:** from day 2, one of the day's cards is a mini-game (for now
  always **The 7pm Bulletin**: spike the damaging stories before Channel
  Seven goes live; the stories come from your own run).
- **Coups:** **Hold the Palace**, a turn-based night map. An officers' plot
  (high coup pressure, at most once per act) is a heavy hit if lost; the
  Army's real strike (its ultimatum ran out) ends the run if lost.
- Full screen: story → how to play → game → result. No skip; Give up = a
  loss; a reload restarts the same game. Loss: Legitimacy + that faction.
- No save reset (`SAVE_VERSION` stays 14). Balance: careful play survives
  46% (was 59%). Tests 183.
- Playtest link for the coup: `…/Reign-Check/?practice=palace` (or
  `strike`, `bulletin`) — practice, nothing saved.

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

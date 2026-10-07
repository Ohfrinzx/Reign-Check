# PROJECT STATUS — Reign Check

**Kept short on purpose.** "Now" is the current state; the log below it is
one line per step. Full old handovers are in
`docs/archive/PROJECT_STATUS_HISTORY.md`, and old per-slice notes in
`docs/archive/SLICE_NOTES.md`. How the systems work today is in
`docs/SYSTEMS.md`; the rules and workflow are in `AGENTS.md`.

## Now (2026-10-07)

**NEXT JOB: A BALANCING PASS ON THE CORE GAMEPLAY SYSTEMS.** Owner: *"A
new agent will be making same big changes to core gameplay systems for
proper balancing before I move forward with anything else."* Read
**`docs/BALANCE.md`** first: the brief, every tuning number and where it
lives, how to measure, the known problems, and the **balance change log**
that every balance change must add a row to. No new mini-games, features
or content until the owner says so.

**Waiting for the owner's playtest: mini-games slice 3 part B** (built
2026-10-07, merged, live). Owner: *"Confirmed all standing play tests.
Move to part B."*
- **Who Was in the Stairwell?** (dark Sable Office archive; the Street):
  files on the night Krast died; exactly one person lies; stamp the liar
  and who was in the stairwell, then close the case. No clock. Every
  puzzle has exactly one answer.
- **The Ambassador's Table** (candlelit dinner; the Elites): five courses;
  each round a gas price and a line; his face, glass and notebook show
  how close he is to walking out. Kel Brask's limit: a deal over it loses.
  The better the price, the bigger the gain.
- Both are daily games (eight now) and picked by events (Stairwell Tapes;
  Ostrene gas cutoff or foreign pressure 60+).
- Practice: https://ohfrinzx.github.io/Reign-Check/?practice=stairwell and
  https://ohfrinzx.github.io/Reign-Check/?practice=ambassador (add
  `&act=3` for the hardest).

**Everything else is approved:** Phases 1–3; balance slices A–D; the
mobile web version and GitHub Pages; mini-games slices 1, 2 and 3 part A
(Find the Mole with the mole's fate, Budget Night retuned, its jars after
eight, The Pigeon Run); the number explanations; the slower Bulletin;
Shred's number keys.

**Numbers today:** `SAVE_VERSION` 14; 299 unit tests; careful play
survives 68% (balance probe, 400 runs, ±3), random 5%.

**Later, each needing the owner's go-ahead:** sound, a coup crisis chain,
the remaining ending types, mini-game ideas #4 and #11
(`docs/MINIGAMES.md`).

## Log (newest first)

- **2026-10-07** — Owner: update all documentation for a balancing pass
  by a new agent. Chose a balance brief and a balance change log: new
  `docs/BALANCE.md`; every doc checked against the code. Part B stays
  waiting for its playtest. The old "Now" blocks moved to
  `docs/archive/PROJECT_STATUS_HISTORY.md`.

- **2026-10-07** — Owner confirmed all standing playtests (slice 3 part A
  approved) and asked for part B, delegating to cheaper models. Built by
  two Sonnet agents: Who Was in the Stairwell? (logic puzzle) and The
  Ambassador's Table (five courses, tells). Lead's fixes: Brask's limit so
  caving loses; rewards scale with the price; "four files" wording.

- **2026-10-06** — Owner: Budget Night's jars should matter after eight.
  Chose: over the line → loyalty up (and remembered from $3B); short → a
  small drop; walk-out → loyalty −5, remembered, and the faction comes for
  its money — a demand, or repayment daily or later in full, with
  interest. Built.

- **2026-10-06** — Owner playtest of slice 3 part A: wants to choose what
  happens to the mole (chose all four: arrest, turn, fire quietly,
  expose; on the record) — built. Budget Night: *"I have yet to even make
  it to the vote"* — retuned "slower and clearer" (about half the drain,
  longer warnings, one squeeze in act 1, the jar in danger flashes).
  "Clerk always the mole": checked — the mole is random (12 fresh loads,
  8 different moles); a reload in a real run replays the same game.

- **2026-10-06** — Slice 2 and Shred's keys approved. Owner chose slice
  3: Find the Mole (live watching, dark), Budget Night (90 s, "can't just
  sit there"), The Pigeon Run (hold to climb), then Stairwell (dark) and
  the Ambassador's Table (rounds + tells) in a second merge. Part A built
  (three agents in parallel), verified and merged.

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

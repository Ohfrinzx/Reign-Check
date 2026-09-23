# PROJECT STATUS — Reign Check

**Kept short on purpose.** "Now" is the current state; the log below it is
one line per step. Full old handovers are in
`docs/archive/PROJECT_STATUS_HISTORY.md`, and old per-slice notes in
`docs/archive/SLICE_NOTES.md`. How the systems work today is in
`docs/SYSTEMS.md`; the rules and workflow are in `AGENTS.md`.

## Now (2026-09-23)

**Built and merged, awaiting the owner's playtest: balance slice D —
factions remember your decisions.** The owner asked for it, verbatim: *"I
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

**Next job, handed to a new agent session: a mobile web version hosted
free on GitHub Pages.** The repo is public and Pages is on (source: GitHub
Actions). The deploy workflow and the phone layout are not built. Brief:
`docs/MOBILE_AND_HOSTING.md`. An open question for the owner: publish
first, or the phone layout first.

**Later, each needing the owner's go-ahead:** mini-games (build them
mobile-first, each with its own look), sound, a coup crisis chain, the
remaining ending types.

## Log (newest first)

- **2026-09-23** — Balance slice D (factions remember) built and merged.
  The docs were reorganised: `AGENTS.md` is the single guide, `CLAUDE.md`
  only points to it, `docs/SYSTEMS.md` is new, and the history moved to
  `docs/archive/`. Stale branches deleted.
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

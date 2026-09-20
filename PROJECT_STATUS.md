# PROJECT STATUS — Dictator Sandbox

> Read `CLAUDE.md` first, then this file, then `docs/DESIGN_V2.md`.
> Last updated: Phase 1 declared complete by the owner. Phase 2 (roguelike
> layer) is greenlit and has not been started yet — that is the next task.

> ## ▶ WHERE WE STOPPED — READ THIS FIRST
>
> **Phase 1 is done and owner-approved. Phase 2 is greenlit and unstarted.
> If you are a new agent picking this up cold, this is everything you need
> to know before writing code:**
>
> The owner played the real Poster/Broadsheet build (3 resources, 5
> factions, the jargon glossary) and said, verbatim: *"Ok everything seems
> to run and look good. So I believe Phase one playtests are complete."*
> They then said: *"begin phase [t]wo of building... I will be starting a
> new [chat] to begin Phase 2 so the agent needs to be able to easily
> understand EXACTLY where to continue from and what to do."* This file, plus
> `CLAUDE.md` and `docs/DESIGN_V2.md`, is that handover — written for exactly
> this moment.
>
> **Timeline that got here:** V1 shipped → playtest 1 (context/scrolling/
> wording/economy) fixed in full → playtest 2 passed functionally but
> flagged the design direction ("too many things to keep track of") → three
> rounds of mockup review (dark desk rejected; owner picked the **Poster**
> skin, then the **Broadsheet** layout) → built, plus a glossary system for
> jargon → owner playtested the real build and passed it, twice (once after
> the initial build, again after the jargon-coverage follow-up) → **Phase 1
> closed.**
>
> **Both formerly-open questions are now resolved, not just Phase-1-complete
> in general:**
> 1. ~~Was the display-layer cut (3 resources/5 factions over the unchanged
>    engine) enough, or does it need the deeper data-model rewrite?~~ →
>    **Enough.** The owner played it and raised no density/tracking
>    complaint. Do not start the deeper rewrite in `docs/DESIGN_V2.md` §3
>    speculatively.
> 2. ~~Roguelike layer next, or more polish first?~~ → **Roguelike layer
>    next.** This is now the only outstanding work.
>
> **What to do next:** Start `docs/DESIGN_V2.md` §4 (the roguelike layer —
> acts, the Back Room shop, mandates, a run deck, meta-progression), in the
> staged order §6 gives, beginning with §4.1 (run structure: 3 acts of ~6
> days ending in a confidence vote) as its own shippable, playtestable slice.
> **Build that first slice, then STOP and report back for playtest before
> touching the shop/mandates/deck** — the same build → report → playtest →
> iterate loop that got Phase 1 right three times running. See `CLAUDE.md`'s
> "PHASE 2 IS GREENLIT" section for the concrete first steps (which files,
> which fields, the `SAVE_VERSION` bump this will need).
>
> Read `docs/DESIGN_V2.md` in full before touching the UI, the display
> layer, or starting Phase 2 — it records what was proposed vs. what
> actually shipped for Phase 1, and has the complete Phase 2 spec.
>
> **Since then, the owner asked for the full plan beyond Phase 2 too** —
> "finish and polish this game out with the proper architecture to continue
> adding and building," plus keeping future iOS/mobile support in mind
> without doing that work now. That plan now exists: `docs/DESIGN_V2.md` §4
> was expanded with a content quota folded into each Phase 2 sub-step (so
> "add more content" happens as part of building the systems, not as a
> separate pass), §9 lays out Phases 3–5 (content/systems depth → mobile/iOS
> → remaining nice-to-haves), and §10 gives the mobile guardrails to follow
> while building Phase 2 (mainly: keep new engine logic in `src/game/` with
> zero React/DOM, ground rule 11). None of this changes what to build right
> now — it's still §4.1 first, per above — it just means the next several
> check-ins after that already have a planned runway instead of stopping at
> "what next?"

---

## 1. Project overview

**Dictator Sandbox** is a browser-based, card-driven political leadership
simulation. The player is the **Executive Chair** of the fictional **Republic of
Velmorra** and must stay in power for 30 days while managing seven factions,
thirteen recurring characters, a real budget, and a schedule that is regularly
interrupted by **Breaking Alerts**.

Design pillars, in priority order:

1. **Interesting choices** — every option has a visible trade-off in its hint.
2. **Meaningful consequences** — every major decision schedules something later.
3. **Replayability** — five opening scenarios, seeded RNG, state-reactive deck.
4. **Surprise** — alerts interrupt mid-day, weighted by hidden pressures.
5. **Emergent identity** — the regime is *named at the end*, never selected.

The core rule the engine enforces: **every major decision changes the future
state of the game**, not just the current numbers.

**Stack:** React 18 + TypeScript + Vite. No backend. Hand-written CSS design
system (no Tailwind). `localStorage` save. Vitest for simulation tests,
Playwright scripts for real-browser playthroughs.

---

## 2. Current milestone

**MILESTONE 1 — PLAYABLE CORE: ✅ COMPLETE.**
**PLAYTEST ROUND 1 FIXES: ✅ COMPLETE.**
**PLAYTEST ROUND 2: ✅ PASSED functionally. Design direction question raised.**
**POSTER/BROADSHEET REBUILD + WORDING WIDENING: ✅ COMPLETE.**
**PLAYTEST ROUND 3 (the actual Poster/Broadsheet build): ✅ PASSED.** *"Ok
everything seems to run and look good."* **PHASE 1: ✅ DECLARED COMPLETE BY
THE OWNER.**
**PHASE 2 — THE ROGUELIKE LAYER: 🟢 GREENLIT. NOT STARTED. This is the
current task — see the "WHERE WE STOPPED" block above and `CLAUDE.md`.**

### Playtest round 2 — what was reported, and what was done

> "Second play test checks out. I am not sure I love the design direction
> though. There seems to be too many things to be keeping track of. I want it
> to be a bit more simplistic with a more creative and fitting design. I want
> to eventually evolve this with rogue like elements like unique runs, shops,
> etc."

Measured cause, not a matter of taste: **five of the ten headline stats are
near-duplicates of a faction bar** (ELITE/Business and SECURITY/Security move
together 100% of the time; MILITARY/Army 96%; STABILITY/Unions 89%;
PUBLIC/Public 76%). **55 trackable numbers** can be on screen at once. Full
analysis and proposal in `docs/DESIGN_V2.md`.

Resolved through a design-exploration exchange (mockups reviewed, direction
picked each round), then built:

| What | Outcome |
|---|---|
| Visual direction | Dark desk mockup rejected ("way too similar to the last"). Three light skins mocked up; owner picked **Poster** (cream newsprint, condensed black type, one red). |
| Layout | Four Poster-skinned layouts mocked up; owner picked **Broadsheet** ("Go with 1") — masthead, front-page briefing, card-as-lead-story, right rail. |
| Information density | Implemented as a **display layer** (`src/game/display.ts`) over the unchanged engine: 3 resources (Money/Grip/Legitimacy) instead of 10 stats, 5 factions with one mood each instead of 7×3 bars, threat cards instead of a prose warning list. ~55 trackables → ~9–12. This was an engineering judgment on HOW to cut, not something the owner explicitly chose between (vs. a full data-model rewrite) — see `docs/DESIGN_V2.md` §3. |
| Roguelike elements | **Not built at the time of this table.** Proposed in `docs/DESIGN_V2.md` §4. Since greenlit by the owner — see the "WHERE WE STOPPED" block at the top of this file, this is now current work. |

### Playtest round 3 — what was reported, and what was done

> "Go with 1. Again though the text needs to be more clear for users who may
> not understand this sort of political language. Example being most people
> don't know what clearing the payroll means and how what their decision will
> effect. Everything else so far is perfect. Go ahead and build in this
> design and layout, fix wording some more, than check back with me."

("Round 3" here refers to the design-direction check-in above, not a full
gameplay playtest — the owner has not yet played the Poster/Broadsheet build.)

| Reported | Status | What changed |
|---|---|---|
| Build the chosen design (Poster skin + Broadsheet layout) into the real app | Done | Full UI rebuild: `src/styles/index.css` replaced with the Poster design system; `Ledger.tsx` (was `StatBar.tsx`), `Rail.tsx` (was the tabbed `SidePanel.tsx`), `CardView.tsx`, and all of `Screens.tsx`/`Intro.tsx` rebuilt. Fonts self-hosted (`public/fonts/`) since Google Fonts is blocked in this environment — every earlier screenshot in this project's history was rendered in fallback fonts, not the real design. |
| Text too dense with political/financial jargon for a general reader; example given: "clearing the payroll" | Done | New glossary system (`src/game/glossary.ts`): 18 recurring terms get a one-sentence plain definition, auto-applied as a hover/tap `<abbr>` on first occurrence in any rendered card text. The specific payroll card was also rewritten directly (not just glossed) to state what payroll is and what each option means in plain consequences. Scope was bounded to the reported failure mode (jargon with no accessible meaning), not a full rewrite of all card prose — see `docs/DESIGN_V2.md` §8 for what did and didn't ship. |

Two real bugs were found and fixed during this build, both the same class of
issue as the original V1 scroll bug — worth reading if you touch layout:
1. **Double scroll container.** `.screen` had its own `overflow-y:auto` while
   its parent `.stage-col` also scrolled. Same root cause as the V1 bug, in a
   new place. Fixed by making `.screen` a plain block (`min-height:100%`,
   no overflow) when nested in `.stage-col`, with a separate `.title-screen`
   rule for the one place `.screen` is used standalone.
2. **Sticky action bar overlapping tail content.** A `position:sticky;
   bottom:0` bar could sit on top of the last bit of scrollable content
   before the user had scrolled. Fixed by moving the primary action into the
   always-visible top strap (`.strap-action`) and dropping `position:sticky`
   from the bottom bar — it's now a plain convenience duplicate, not sticky,
   not load-bearing for reachability.

Both were caught by testing at 1366×700 specifically — keep testing there.

### Playtest round 3b — jargon-clarity follow-up

After the round 3 report above, the owner replied: *"If adding more text
and context into the cards is the best fix then go with that as long as
it's designed accordingly and seamlessly."* — read as: prefer inline
explanation over relying on the hover tooltip, where inline is the better
fix, per the writing rules' own stated preference.

| Reported | Status | What changed |
|---|---|---|
| Glossary coverage was incomplete | Done | The hover-tooltip system only covered card body and outcome text. Extended it to option hints, flavor/pull-quote text, and the right-rail threat cards (`Glossed` exported from `Prose.tsx`, wired into `CardView.tsx` and `Rail.tsx`). |
| The other genuinely dense economics moment besides payroll | Done | The currency-peg Breaking Alert (`alert-velk` in `alerts.ts`) was rewritten to explain the peg, floating the currency, and capital controls inline in the body/hints, not just via the glossary backstop. |
| Audit for mismatched tooltips | Done, found one | An outcome line used "commitment" in its ordinary English sense; the glossary would have shown the unrelated recurring-cost game-mechanic definition on hover. Reworded to "promise" to remove the false match. Full audit of all 18 glossary terms across every content file confirmed no other mismatches. |

13/13 tests still pass; verified live via Playwright that glossed terms
render correctly across a real playthrough.

### Playtest round 4 — the real thing, and Phase 1 closes

The owner then actually played the Poster/Broadsheet build (not just the
mockups) and said, verbatim: *"Ok everything seems to run and look good. So
I believe Phase one playtests are complete."* No specific bug or complaint
was raised — this is an unconditional pass. They then asked to prepare the
repo for Phase 2 with a fresh chat in mind: *"the agent needs to be able to
easily understand EXACTLY where to continue from and what to do."* This
document, `CLAUDE.md`, and `docs/DESIGN_V2.md` were rewritten (again) to
make that handover explicit — see the "WHERE WE STOPPED" block at the top
of this file.

### Playtest round 1 — what was reported and what was done

| Reported | Status | What changed |
|---|---|---|
| "First Citizen" was never explained; no context on who anyone is or why they matter | Fixed | New full-screen **opening brief** before Day 1 (`src/ui/screens/Intro.tsx`), reopenable any time via **Brief me** in the top bar. Covers who you are, how you got the job, the goal, the money, the six ways to lose, all seven factions and the six people you deal with most. Every card that features a person now carries a one-line "who is this and why do they matter" under the title, from the new `CharacterDef.why` field. |
| The daily briefing screen did not scroll — most of it was unreachable | Fixed | Real layout bug. `.screen` was a fixed-height column flex container, so its children shrank instead of overflowing, and `.dossier`'s `overflow:hidden` then clipped the rest — `scrollHeight === clientHeight` even with 4,900px of content. `.stage-col` is now the single scroll container and `.screen` is a plain block with `min-height:100%`. Also: briefing sections are capped at 4 items with a "+N more" pointer, and the primary action moved into a **pinned bar** that is always on screen. Verified in a real browser at 1366×700 and 1280×640. |
| Writing was "word salad", too archaic for a modern setting — "The Product" named as an example | Fixed | **Every line of prose in the game was rewritten** in plain modern English: short sentences, concrete nouns, humour from the situation rather than the phrasing. That is all 42 cards, 9 alerts, 9 endings, all faction and character text, the country description, all briefing warnings and every stat tooltip. "The Product" is now **"Buying the Evening News"** and states the offer and the price in the first three lines. |
| Money should be dollars, with a real economic system and visible prices | Fixed | Currency is now **$ (billions)**. New `src/game/economy.ts` computes a daily budget from live game state: itemised income (lithium/salt, port fees, taxes, Free Zone) and spending (payroll, energy, security, debt service, corruption leakage, plus every commitment you have made). New **Treasury tab** in the side panel shows all of it, the net per day, and a runway countdown when you are in deficit. Decisions can now create **recurring budget lines** (`Effects.commitments`) — a pay rise costs money every day, not once. Every option that costs money states the amount in its hint. |
| The player should be addressed as "sir" or similar | Fixed | The office is now **Executive Chair**. A picker on the title screen chooses **Sir / Ma'am / Chair**, and card text uses a `{sir}` token resolved at render (`src/game/text.ts`), so authored lines work for any choice. |

---

## 3. Completed features

### Simulation
- [x] Seeded, serialisable RNG (`mulberry32`) — whole runs are replayable and
      the RNG state lives inside the save file.
- [x] `GameState` is pure JSON. All behaviour lives in content modules keyed by
      string id, so saving is `JSON.stringify` and content is additive.
- [x] 10 visible stats with systemic coupling (a propaganda apparatus amplifies
      good news; corruption makes economic damage worse; scandal makes
      legitimacy losses bite harder; fear makes orders land harder).
- [x] 10 hidden pressure variables (`coup`, `unrest`, `scandal`, `leak`,
      `foreign`, `fiscal`, `corruption`, `cult`, `fear`, `separatism`). Never
      shown as numbers — only as symptoms in the briefing.
- [x] 10 regime-character axes that name the regime in the ending.
- [x] **Consequence engine** (`effects.ts`): one entry point for every change
      to the world — stats, hidden pressures, factions (with relationship
      spill-over), characters, memory, flags, delayed effects, promises,
      projects, scandals, queued cards, headlines.
- [x] **Delayed consequences**: choices schedule effects or whole cards for
      future days. Visible ones appear in the briefing Diary and the nightly
      "Still Coming" tray.
- [x] Promises with due dates that lapse and cost you if ignored.
- [x] Multi-day projects with completion payoffs and legacy lines.
- [x] Scandals with heat that decays and can be buried.
- [x] 7 factions with loyalty / power / influence / patience, inter-faction
      relationship spill-over, red lines and escalating impatience.
- [x] 13 characters with loyalty / trust / fear / influence / plotting, a
      **memory list** that drives future behaviour, and authored personality
      (ambition / competence / venality / candour) that barely moves.
- [x] Characters can be removed from post (`removeFromPost`) — resigned,
      arrested, reassigned, defected.
- [x] Ignored + ambitious characters accumulate `plotting`, which feeds the
      hidden coup/separatism/leak pressures.
- [x] Escalating late-game pressure: the longer you govern, the more the
      Republic expects. Generosity resets the baseline (patience decays faster
      for factions you have spoiled).
- [x] Negative treasury is modelled as missed payroll, with daily bite.

### Day / stage system
- [x] Days have **3–5 stages**, shape varies with total pressure.
- [x] Stage kinds: Government Business, Political Business, National
      Development, Afternoon Session (+ Briefing and Nightly Review).
- [x] Deck is drawn per day: queued cards first, then a **state-reactive
      weighted draw** with a recency window so cards do not repeat.
- [x] Start-of-day upkeep: scheduled consequences fire, projects tick, promises
      lapse, revenue accrues, pressures drift, factions lose patience.

### Daily Briefing
- [x] Full confidential-dossier screen: day number, Velmorran calendar date,
      capital, leader, weather (which Velmorrans treat as a referendum on
      government honesty), today's schedule with times.
- [x] Position ledger with overnight deltas.
- [x] Known Issues, Intelligence warnings, Diary (pending consequences),
      Opportunities, and one or two Notes hinting at what today may become.
- [x] Warnings are **derived from hidden state and written in the player's
      language** — never numbers. Warning text escalates in three severities.
- [x] **Information quality gates the briefing**: below 35 Information, the
      milder warnings stop reaching you.
- [x] Threat level indicator driven by live alert pressure.

### Cards & decisions
- [x] Data-driven card system: new cards need no engine changes.
- [x] **42 cards / 155 authored options**: 25 standard cards drawn from the
      weighted deck + 17 follow-up cards that are never drawn randomly — they
      exist only because an earlier decision scheduled them.
- [x] All card prose written in plain modern English, with every money cost
      stated explicitly in the option hint.
- [x] Cards featuring a person show a one-line explanation of who they are.
- [x] 2–4 options per card, each with a hint that telegraphs the obvious
      trade-off (hidden second-order effects stay hidden).
- [x] Options can be locked behind state (`enabled` + `lockedText`) — e.g. you
      cannot order the Sable Office to detain the opposition leader unless it
      is sufficiently yours.
- [x] Outcomes can be static or functions of `(state, rng)` for weighted,
      surprising results.
- [x] Keyboard: `1`–`4` to choose, `Enter`/`Space` to continue.

### Breaking Alerts
- [x] **9 Breaking Alerts**, each declaring the hidden pressure that drives it.
- [x] Event weighting: alert probability and selection are both computed from
      live game state. Cutting military spending really does make military
      incidents likelier; censorship really does make leak events likelier.
- [x] Full-screen red takeover presentation with banner animation and severity.
- [x] Alerts interrupt mid-day, max 2 per day, with a 4-day per-alert recency
      window and narratively-singular alerts marked once-per-run.
- [x] **Onboarding guarantee**: if the player reaches day 3 without seeing an
      alert, the world obliges.
- [x] Alerts scheduled by an earlier decision still arrive *as* Breaking Alerts,
      not as calm items on the agenda.

### End of day / endings
- [x] Nightly Review: day mood line, full 10-stat ledger with deltas, the Seven
      O'Clock Word headlines, what you decided, what came due, what is still
      coming.
- [x] **8 failure endings + 1 survival ending**, each the terminus of a pressure
      the player could see symptoms of for days: coup, revolution, elite ouster,
      economic collapse, provincial fracture, foreign takeover, archive/scandal
      removal, hollowing-out.
- [x] Legacy report: emergent **regime label** derived from the regime axes, a
      historical-style epitaph, a humorous multi-clause verdict, and a run
      statistics grid.

### UI / UX — Poster / Broadsheet (current, replaces the earlier dark theme)
- [x] **Poster design system** (`src/styles/index.css`): cream newsprint,
      condensed black display type (`Anton`/`Archivo Black`), one red accent,
      flat shapes, no dark surfaces anywhere. Self-hosted fonts
      (`public/fonts/`) — `Anton`, `Archivo Black`, `Libre Franklin`, `Lora`,
      `Courier Prime`, latin subset only, ~400KB.
- [x] **Broadsheet layout**: persistent masthead (name/honorific + the 3-
      resource ledger) and strap (day/act/threat + the primary "next" action,
      always reachable without scrolling — see the two scroll bugs fixed
      during this build, noted above); the daily briefing is a newspaper
      front page; each card renders as a "lead story" document with a boxed,
      numbered decision list; a right rail (not tabbed) shows Files
      (factions), On Your Desk (threat cards), Diary, and Standing Costs.
- [x] **Display layer** (`src/game/display.ts`): the masthead shows exactly
      **Money / Grip / Legitimacy** (aggregated live from the full 10 stats)
      and the rail shows exactly **5 factions** (Army/Security/Money/Workers/
      Street) each as one mood word + one bar, instead of the old 10-stat bar
      and 7×3-bar faction panel. The underlying engine and every card effect
      are completely unchanged — see `docs/DESIGN_V2.md` §3.
- [x] **Threat cards** (`buildThreats()` in `briefing.ts`, rendered by
      `Rail.tsx`): the hidden-pressure warning system now also surfaces as up
      to 3 physical-looking cards with a headline, body, and "stage N of 3"
      pips, reusing the same underlying data as the full prose briefing.
- [x] **Glossary system** (`src/game/glossary.ts` + `Prose.tsx`): 18
      recurring institutional/financial terms get a plain-language
      hover/tap definition on first occurrence in any card text.
- [x] Animations: card rise-in, alert banner wipe, scrim fade, delta pills.
- [x] Nothing is behind a tab in the right rail — the whole point of the
      desk-derived layout is that everything has one fixed, visible place.

### Economy
- [x] All money in **dollars, billions**. `usd()` / `usdFlow()` in `economy.ts`
      are the only formatters.
- [x] `computeBudget(state)` derives an itemised daily budget from live state —
      four income lines and up to a dozen spending lines, including every
      commitment the player has made.
- [x] **Commitments**: decisions can create recurring budget lines, permanent or
      time-limited (`Effects.commitments`, `Effects.endCommitment`). This is how
      a pay settlement or a loan keeps costing you.
- [x] Treasury side tab: balance, net per day, income and spending broken down
      line by line with explanatory notes, and a runway warning in deficit.
- [x] Going below zero is modelled as missed payroll with a daily penalty that
      scales with how far under you are.

### Save / load
- [x] `localStorage` autosave after every state change.
- [x] New Game / Continue / Restart / Delete save.
- [x] Refreshing the browser does not destroy the run. Verified in a real
      browser.
- [x] Version-guarded and defensive: unreadable or stale saves are ignored
      rather than crashing.

### Procedural variation
- [x] **5 opening scenarios** (The Stairwell Succession, The Inherited Hole, The
      Marches Are Awake, A Long Cold Quarter, The Reformer's Window) with
      distinct starting stats, pressures and faction tweaks.
- [x] Per-run jitter on every stat, faction value and character disposition.
- [x] Day length, deck contents, alert timing and many outcomes are all
      state-reactive rather than fixed.

---

## 4. What is NOT built yet

**The roguelike layer — acts, the Back Room shop, mandates, a run deck,
meta-progression (`docs/DESIGN_V2.md` §4) — is GREENLIT and is the current
task.** It is listed here only as "not yet built", not as deferred; see the
"WHERE WE STOPPED" block at the top of this file and `CLAUDE.md` for how to
start it.

Everything else below is Phase 3, 4, or 5 per `docs/DESIGN_V2.md` §9 — all
genuinely deferred until Phase 2 ships and is playtested, and all still need
to be asked about before starting:

**Phase 3 — content & systems depth (after Phase 2):**
- **Faction demands as a live mechanic.** `FactionState.demand` and the
  `FactionDemand` type exist and the briefing renders impatience, but nothing
  issues formal, dated faction demands yet (Milestone 2).
- **Character-initiated events** — deals, betrayals, defections driven by a
  character's own plotting score. `plotting` is tracked and feeds hidden
  pressures, but no card is yet spawned *by* a character crossing a threshold
  (Milestone 3).
- **Crisis chains** — multi-card escalating sequences (Milestone 4), worth
  building against the Phase 2 act structure rather than the old flat 30
  days.
- **A balance pass** on the difficulty asymmetry and coup-ending rarity
  below (limitations #2, #3) — deliberately held until Phase 2's shop
  economy and 18-day acts change the difficulty curve anyway.

**Phase 4 — mobile/iOS (not scheduled):**
- See `docs/DESIGN_V2.md` §10. Nothing to build now; §10 lists what to
  preserve (`src/game/` stays zero-React/DOM, including everything Phase 2
  adds) and what to avoid introducing (a second hover-only mechanism for
  anything gameplay-critical) so this stays possible later without a
  rewrite.

**Phase 5 — remaining nice-to-haves:**
- **Mini-games** (Milestone 5). `MinigameKey` and `CardDef.minigame` exist in
  the type system as the hook; no minigame components are implemented.
- **Assassination, election-defeat and constitutional-removal endings.**
- **Run history / legacy across runs** (Milestone 7) — note this overlaps
  with Phase 2's meta-progression (§4.5); worth building together rather than
  twice.
- **Sound.**

---

## 5. Known bugs and limitations

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | **Content volume.** 25 draftable standard cards for a 30-day run at 3–5 cards/day means a long run will exhaust fresh material and start reusing cards once the recency window passes. | Medium | The recency window and once-per-run flags keep repeats ≥4 days apart, and the engine shortens the day rather than repeating, but a 30-day run still feels thinner after ~day 18. **Slated to be fixed as part of Phase 2 §4.4** (run deck), which calls for ~20 more standard cards + ~6 alerts; the shorter 18-day act structure also independently reduces exposure to this gap. |
| 2 | **Difficulty is asymmetric.** A player who consistently takes the accommodating/generous option survives to day 30 in ~98% of simulated runs; random play dies around day 13; consistently aggressive play dies around day 6. | Medium | Arguably correct (cooperation works, it is just expensive), but the generous path needs a sharper late-game cost. Deliberately left for a Phase 3 balance pass (`docs/DESIGN_V2.md` §9) rather than tuned now, since Phase 2's shop economy will change the curve anyway. |
| 3 | The `coup` ending is reachable but rare (~1–5% of random runs) relative to revolution/fracture/scandal. | Low | Needs more military-pressure cards to feed it — part of the same Phase 3 balance pass. |
| 4 | ~~Google Fonts loaded from CDN~~ | Fixed | Fonts are now self-hosted (`public/fonts/`), no runtime network dependency. |
| 4b | Save format changed (`SAVE_VERSION` 1 → 2) for the honorific and commitments fields. Old saves are ignored rather than migrated. | Low | Correct behaviour for a pre-release game; the loader is version-guarded and fails safe. Did NOT bump again for the Poster rebuild — no `GameState` shape changed, only the display layer. **Will very likely need to bump again for Phase 2** (ground rule 10). |
| 5 | Right rail is hidden below 1080px width. The game is desktop-first, as specified. | Low | No tablet/mobile layout yet — this is the real remaining gap for a future Phase 4 (mobile/iOS, `docs/DESIGN_V2.md` §10), not scheduled. |
| 6 | `FactionState.demand`, `CharacterMemory` weights and `RunStats.moneyTaken` are tracked but not yet surfaced anywhere in the UI. | Low | Wiring, not rework. |
| 7 | No undo. Decisions are final by design. | By design | |
| 8 | The 2 provinces/civil-service factions (`grey`, `provinces`) have no display bar — by design (see `docs/DESIGN_V2.md` §3.2) — but a player who never happens to draw Grebs's or Kostyn's cards has no way to check their standing at all. | Low | They still fully drive effects underneath; this is a pure visibility gap, not a simulation gap. |
| 9 | ~~The display-layer cut has not been owner-playtested~~ | Resolved | The owner played it and said "everything seems to run and look good," raising no density/tracking complaint. Treat the cut as sufficient; do not start the deeper data-model rewrite speculatively. If it resurfaces during Phase 2 playtesting, treat that as new information. |

---

## 6. Recommended next task

**This is no longer conditional — the owner has answered the question this
section used to branch on. Do this, in order:**

1. **Start `docs/DESIGN_V2.md` §4 — the roguelike layer.** Begin with §4.1,
   the run structure: 3 acts of ~6 days each, ending in a confidence vote,
   replacing the current flat 30-day run. Build this as its own shippable,
   playtestable slice — do not also build the shop (§4.2), mandates (§4.3),
   or run deck (§4.4) in the same pass.
2. **Then STOP and report back for playtest**, the same way Milestone 1 and
   the Poster/Broadsheet rebuild were reported: what was built, how to test
   it, any known bugs/limitations, then wait. Do not chain straight into
   §4.2 without a check-in — that pattern is what got Phase 1 right three
   times in a row.
3. **After that slice is approved, continue in order**: §4.2 (the Back Room
   shop) → §4.3 (mandates) → §4.4 (run deck) → §4.5 (meta-progression), each
   its own shippable slice per `docs/DESIGN_V2.md` §6's checklist. **Author
   content as part of each slice, not separately** — §4.2 carries its own
   shop-item quota (~8 advisors/8 policies/8 favours), §4.3 carries a
   mandate quota (2–4 more beyond the 4 already specified), and §4.4 is
   where the long-standing "~20 more standard cards + ~6 alerts" content gap
   (limitation #1) gets closed, not a separate pass — see `docs/DESIGN_V2.md`
   §4 for the exact quotas and §4.6 for suggested data shapes.
4. **Do not start the deeper data-model rewrite** (`docs/DESIGN_V2.md` §3's
   original proposal, migrating from 10 stats/7 factions to a native 3/5
   model) — this was implicitly resolved by the same playtest approval and
   is not needed unless a future note specifically asks for it again.
5. **Once Phase 2 (§4.1–§4.5) ships and is playtested, move to Phase 3**
   (`docs/DESIGN_V2.md` §9): faction demands as a live mechanic (Milestone
   2), character-driven events (Milestone 3), crisis chains (Milestone 4),
   then a balance pass on the difficulty asymmetry and coup-ending rarity
   (limitations #2/#3) now that the shop economy and 18-day acts have
   changed the curve. Do not start Phase 3 before Phase 2 is done — building
   these against the old flat-day model would be work that has to be redone
   against the act structure.

**Backlog — Phase 4/5 items, not scheduled, see `docs/DESIGN_V2.md` §9–10
for the full reasoning:**

- **Mobile/iOS (Phase 4).** Not scheduled. Keep `src/game/` free of React/
  DOM dependency as Phase 2 is built (ground rule 11) so this stays possible
  later without a rewrite.
- **Mini-games (Phase 5, Milestone 5).** Start with Budget Allocation and
  Cabinet Negotiation; the `minigame` hook already exists on `CardDef`.
- **Sound, remaining ending types, run history/legacy (Phase 5).**

---

## 7. Architecture — important decisions

**Read this before changing anything.**

```
src/
  game/                     ← no React, no DOM, fully testable
    types.ts                ← the whole vocabulary. Start here.
    rng.ts                  ← seeded RNG; its state lives in the save
    stats.ts                ← stat metadata, bands, formatting (full 10 stats)
    state.ts                ← createGame(), opening scenarios
    effects.ts              ← THE CONSEQUENCE ENGINE — single entry point
    engine.ts               ← day loop, deck draw, alert weighting, endings
    briefing.ts             ← hidden state → plain-language warnings + threat cards
    display.ts              ← engine state → what the player sees (3 resources,
                               5 factions). READ THIS before touching UI stats.
    glossary.ts              ← jargon term → plain definition, auto-applied to prose
    economy.ts               ← the national accounts: budget lines, $ formatting
    text.ts                  ← {sir}/{leader} token replacement for card prose
    save.ts                  ← localStorage, defensive
    content/
      country.ts            ← Velmorra, 7 factions, 13 characters (unchanged
                               by the display cut — still the full model)
      cards.ts              ← standard cards + follow-ups (tranche 1)
      cards2.ts             ← standard cards (tranche 2)
      followups.ts          ← cards only reachable via scheduling
      alerts.ts             ← Breaking Alerts, each with a `driver`
      endings.ts            ← endings, regime labelling, legacy verdict
    __tests__/              ← vitest simulation + content-integrity tests
  ui/
    components/
      Ledger.tsx             ← the masthead's 3-resource ledger (was StatBar.tsx)
      Rail.tsx                ← Files/Threats/Diary/Standing costs, not tabbed
                                (was the tabbed SidePanel.tsx)
      CardView.tsx            ← the doc: card-as-lead-story + decision box
      Prose.tsx               ← renders card text, applies the glossary
    screens/Screens.tsx      ← Title, Briefing (front page), Night, Ending
    screens/Intro.tsx        ← the opening brief / "Brief me" overlay
  styles/index.css           ← the Poster design system (cream/red/black,
                               condensed display type, self-hosted fonts)
public/fonts/                ← self-hosted latin-subset fonts, ~400KB
docs/
  DESIGN_V2.md                ← the design decisions, measured evidence, and
                               what's still open — read before UI work
  mockups/                    ← design exploration that led here (reference;
                               poster.css there mirrors the app's real tokens)
tools/                        ← Playwright scripts for real-browser testing
```

### Non-negotiable rules

1. **`GameState` is pure serialisable data.** No functions, no class
   instances, no `Map`/`Set`. A save file is `JSON.stringify(state)`. Content is
   code keyed by string id and is *never* stored in the state.
2. **All world mutation goes through `applyEffects()`.** That is why global
   rules (stat coupling, faction relationship spill-over, memory→plotting) can
   live in one place. Do not mutate `state.stats` directly from a card.
3. **Engine functions take a state and return a new one** (`structuredClone`
   at the top). React sets the returned object. Never mutate the state React
   is holding.
4. **RNG state is threaded through the save.** Always use `withRng(s, fn)` in
   the engine so `s.rngState` advances. Never call `Math.random()` in game
   logic — it would break determinism and save/load.
5. **Adding content must never require engine changes.** A new card is an
   object in an array. A new alert is an object with a `driver` and a `weight`.
6. **Hidden variables are never shown as numbers.** They surface only as
   briefing warnings, alert likelihood, and endings. This is the core of the
   "don't make it a spreadsheet simulator" requirement.
7. **The regime is named, not chosen.** `regimeLabel()` reads the regime axes
   at the end. There are no government classes anywhere.
8. **The display layer shows a subset; it must never silently diverge from
   the engine.** `display.ts` decides what the player sees (3 resources, 5
   factions). If you add/change a stat or faction in the engine, decide
   deliberately whether `display.ts` should reflect it.
9. **The primary action on a screen must be reachable without scrolling.**
   Learned twice: the V1 scroll bug, then a sticky-bar overlap in the Poster
   rebuild. The fix both times: put the critical action somewhere always
   visible (now: the top strap's `.strap-action`), not only at the bottom of
   scrollable content.
10. **Bump `SAVE_VERSION` (`src/game/state.ts`, currently `2`) whenever
    `GameState`'s shape changes.** Has not needed to happen since the
    honorific/commitments fields were added. Phase 2 (acts, mandates, the
    run deck, meta-progression) will very likely be the next time it does —
    `save.ts` discards mismatched-version saves rather than crashing, so
    this is safe as long as the bump actually happens.
11. **Keep all game logic, including everything Phase 2 adds, in
    `src/game/` with zero React or DOM dependency.** This is what keeps a
    future mobile/iOS port (`docs/DESIGN_V2.md` §10, not scheduled)
    possible without a rewrite. Also: don't add a second hover-only
    mechanism for anything gameplay-critical (a price, a trade-off, a
    required condition) — the glossary's hover tooltip can stay as-is, but
    nothing new should depend on hover alone for required information.

### Writing rules (added after playtest rounds 1 and 3)

The original draft was rewritten because it read as ornate and hard to parse.
A later pass added a glossary system because the remaining plain-English
prose still used institutional/financial terms a general reader wouldn't
know. Keep to these:

1. **Short sentences.** If a sentence needs a second read, rewrite it.
2. **Plain modern words.** No "which is to say", no inverted clauses, no
   stacked subordinate clauses. This is a contemporary setting.
3. **Concrete nouns and real numbers.** "The army wants $9 billion for
   helicopters", not "the Staff would like a number".
4. **Humour comes from the situation**, never from vocabulary.
5. **State the price in the hint**, money first: `'Cost: $9.0B. ...'`.
6. **Titles say what the card is about.** "Buying the Evening News", not
   "The Product".
7. Use `{sir}` when a character addresses the player directly.
8. **If a sentence needs a jargon term** (payroll, a currency peg, capital
   controls, a deficit, a subsidy, a commitment, runway, the gazette,
   procurement, a levy, a concession, a tranche...), either explain it in the
   same sentence (preferred) or make sure it's in `GLOSSARY` in
   `src/game/glossary.ts` — the first occurrence in any card gets an
   automatic hover/tap definition. Check the list before assuming a term is
   covered; it is a backstop, not a substitute for plain writing.

### Content authoring notes

- Every option needs a `hint` stating the **obvious** trade-off. Hide only
  second-order effects.
- At least one option per card should `schedule` something.
- `weight: (s) => number` should read game state so the deck feels like it is
  watching the player.
- Mark genuinely singular events (an annual festival, a one-time appointment)
  `once: true`.
- Follow-up cards use `base: 0, weight: () => 0` so they are never drawn at
  random.
- **Author options with one property per line and explicit closers on their
  own lines.** The compact single-line style caused repeated brace-balance
  errors during the first draft. Use:

  ```ts
  {
    id: 'fund',
    label: '…',
    hint: 'Cost: $9.0B. …',
    outcome: {
      text: '…',
      tone: 'good',
      effects: { … },
    },
  },
  ```

  Verify with `npx esbuild src/game/content/<file>.ts --outfile=/dev/null`
  (fast, precise parse errors) then `npx tsc --noEmit`.

---

## 8. How to run, build and test

The repository ships a `.devcontainer/` config, so **Code → Codespaces** on
GitHub gives a working environment with dependencies already installed. The
dev server binds `host: true` so it is reachable through container port
forwarding.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm test           # vitest: content integrity, 200 full simulated runs,
                   # determinism, variety, glossary, and a balance probe
```

Real-browser verification (requires `npm run dev` running):

```bash
node tools/verify.mjs        # full pass: intro, scrolling, prices, ending, save
node tools/playthrough.mjs   # plays ~9 days, checks save/reload, screenshots
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/alert-shot.mjs    # captures a Breaking Alert
```

`tools/verify.mjs` runs at 1366×700 specifically because **both** real layout
bugs found so far (the V1 scroll bug, and the Poster-rebuild sticky-bar
overlap) only appeared on short viewports. Keep testing there. When taking
screenshots to eyeball a fix, wait for CSS animations to finish first
(`.doc`'s rise, `.alert-scrim`'s fade-in, `.delta-pill`'s fade) — several
apparent rendering bugs during this build turned out to just be screenshots
taken mid-animation, not real issues.

### Test coverage today

- Content integrity: unique ids, every card has ≥2 options with unique ids,
  every scheduled/queued `cardId` resolves, every referenced character exists.
- 200 full runs to an ending with random play — no crashes, all stats and
  hidden variables stay in legal range, >2 distinct endings, alerts fire,
  delayed consequences land.
- Determinism: same seed + same choices ⇒ identical terminal state.
- Variety: cards do not repeat within the recency window; <30% of days are
  short.
- Glossary: first occurrence of a term gets annotated, later ones don't; text
  with no glossary terms round-trips unchanged.
- Balance probe (prints, does not gate): average run length and ending
  distribution across three play policies.
- **Not covered by automated tests, verified manually instead:** the actual
  Poster/Broadsheet rendering, since these are CSS/layout concerns vitest
  can't see. That's what `tools/verify.mjs` + manual screenshot review is for
  — re-run it after any layout change, at 1366×700.

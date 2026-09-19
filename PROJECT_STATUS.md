# PROJECT STATUS — Dictator Sandbox

> Read `CLAUDE.md` first, then this file, then `docs/DESIGN_V2.md`.
> Last updated: after playtest round 2.

> ## ⏸ WHERE WE STOPPED
>
> **V1 is complete, playable and tested. The owner has playtested twice.**
> Round 1 feedback was fixed in full (see table below). Round 2 passed
> functionally, but the owner raised a **design direction** concern:
> too many things to track, wants a simpler and more visually distinctive
> game, and wants to evolve toward roguelike runs, shops and unlocks.
>
> **The project is paused on that decision.** The diagnosis (with measured
> evidence), the proposed V2 target and the execution order are in
> **`docs/DESIGN_V2.md`**. That document is marked PROPOSED and is not
> approved. **Do not start the V2 refactor until the owner has chosen a
> direction and it has been recorded at the top of that file.**
>
> If you are a new session and the owner has already answered: update
> `docs/DESIGN_V2.md` with the decision, then follow its section 6
> execution order. Otherwise, ask.

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

Development is **paused on a design decision**, not on a bug. See
`docs/DESIGN_V2.md`.

### Playtest round 2 — what was reported

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

### UI / UX
- [x] Dark intelligence-dossier aesthetic; editorial serif for prose, mono for
      instrument labels, sans for structure.
- [x] Top bar (country / leader / threat / day), 10-stat bar with hover
      tooltips explaining what each stat means *and what happens at zero*,
      main card area, three-tab side panel, day-progress track.
- [x] Animations: card deal-in, staggered option entry, floating stat deltas,
      delta pills, alert banner wipe, scrim fade.
- [x] Side panel tabs: **Factions** (loyalty/power/patience bars + a live note
      that reflects their actual state), **People** (disposition lines that
      surface what a character *remembers* about you), **Dossier** (the full
      briefing, always reachable).
- [x] Progressive disclosure: nothing forces the player to read the side panel.

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

These are deliberately deferred, not forgotten.

- **Mini-games** (Milestone 5). `MinigameKey` and `CardDef.minigame` exist in
  the type system as the hook; no minigame components are implemented.
- **Faction demands as a live mechanic.** `FactionState.demand` and the
  `FactionDemand` type exist and the briefing renders impatience, but nothing
  issues formal, dated faction demands yet (Milestone 2).
- **Character-initiated events** — deals, betrayals, defections driven by a
  character's own plotting score. `plotting` is tracked and feeds hidden
  pressures, but no card is yet spawned *by* a character crossing a threshold
  (Milestone 3).
- **Crisis chains** — multi-card escalating sequences (Milestone 4).
- **Assassination, election-defeat and constitutional-removal endings.**
- **Run history / legacy across runs** (Milestone 7).
- **Sound.**

---

## 5. Known bugs and limitations

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | **Content volume.** 25 draftable standard cards for a 30-day run at 3–5 cards/day means a long run will exhaust fresh material and start reusing cards once the recency window passes. | Medium | The recency window and once-per-run flags keep repeats ≥4 days apart, and the engine shortens the day rather than repeating, but a 30-day run still feels thinner after ~day 18. **This is the single biggest quality gap.** |
| 2 | **Difficulty is asymmetric.** A player who consistently takes the accommodating/generous option survives to day 30 in ~98% of simulated runs; random play dies around day 13; consistently aggressive play dies around day 6. | Medium | Arguably correct (cooperation works, it is just expensive), but the generous path needs a sharper late-game cost. Deliberately left for human playtest rather than over-tuned blind. |
| 3 | The `coup` ending is reachable but rare (~1–5% of random runs) relative to revolution/fracture/scandal. | Low | Needs more military-pressure cards to feed it (Milestone 4/6). |
| 4 | Google Fonts are loaded from CDN. With no network the game falls back to system fonts — it still looks fine, but not as intended. | Low | Acceptable; could be self-hosted later. |
| 4b | Save format changed (`SAVE_VERSION` 1 → 2) for the honorific and commitments fields. Old saves are ignored rather than migrated. | Low | Correct behaviour for a pre-release game; the loader is version-guarded and fails safe. |
| 5 | Side panel is hidden below 1080px width. The game is desktop-first, as specified. | Low | Stat bar reflows to 5 columns; no tablet/mobile layout yet. |
| 6 | `FactionState.demand`, `CharacterMemory` weights and `RunStats.moneyTaken` are tracked but not yet surfaced anywhere in the UI. | Low | Wiring, not rework. |
| 7 | No undo. Decisions are final by design. | By design | |

---

## 6. Recommended next task

**In priority order, once playtest round 2 feedback has been received:**

1. **Act on playtest feedback first.** Do not start new systems before this.
2. **Milestone 6 (content) partially, ahead of schedule** — the honest answer to
   limitation #1 is more cards. Target ~20 more standard cards and ~6 more
   alerts. This is pure content work in `src/game/content/cards2.ts` (or a new
   `cards3.ts`), requires zero engine changes, and would do more for the
   experience than any new system.
3. **Milestone 2 — faction demands as a live mechanic.** Issue dated, formal
   demands when patience drops, escalating murmur → formal → ultimatum, and
   spawn a card when one expires.
4. **Milestone 3 — character-driven events.** Spawn cards when a character's
   `plotting` crosses a threshold. The data is already tracked.
5. **Milestone 5 — mini-games.** Start with Budget Allocation and Cabinet
   Negotiation; the `minigame` hook already exists on `CardDef`.

---

## 7. Architecture — important decisions

**Read this before changing anything.**

```
src/
  game/                     ← no React, no DOM, fully testable
    types.ts                ← the whole vocabulary. Start here.
    rng.ts                  ← seeded RNG; its state lives in the save
    stats.ts                ← stat metadata, bands, formatting
    state.ts                ← createGame(), opening scenarios
    effects.ts              ← THE CONSEQUENCE ENGINE — single entry point
    engine.ts               ← day loop, deck draw, alert weighting, endings
    briefing.ts             ← turns hidden state into player-language warnings
    economy.ts              ← the national accounts: budget lines, $ formatting
    text.ts                 ← {sir}/{leader} token replacement for card prose
    save.ts                 ← localStorage, defensive
    content/
      country.ts            ← Velmorra, 7 factions, 13 characters
      cards.ts              ← standard cards + follow-ups (tranche 1)
      cards2.ts             ← standard cards (tranche 2)
      followups.ts          ← cards only reachable via scheduling
      alerts.ts             ← Breaking Alerts, each with a `driver`
      endings.ts            ← endings, regime labelling, legacy verdict
    __tests__/              ← vitest simulation + content-integrity tests
  ui/
    components/             ← StatBar, SidePanel, CardView, OutcomeView
    screens/Screens.tsx     ← Title, Briefing, Night, Ending
    screens/Intro.tsx       ← the opening brief / "Brief me" overlay
  styles/index.css          ← the whole design system
  App.tsx                   ← screen routing + keyboard + autosave
tools/                      ← Playwright scripts for real-browser testing
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

### Writing rules (added after playtest round 1)

The original draft was rewritten because it read as ornate and hard to parse.
Keep to these:

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
                   # determinism, variety, and a balance probe
```

Real-browser verification (requires `npm run dev` running):

```bash
node tools/verify.mjs        # full pass: intro, scrolling, prices, ending, save
node tools/playthrough.mjs   # plays ~9 days, checks save/reload, screenshots
node tools/to-ending.mjs     # drives to an ending, verifies restart
node tools/alert-shot.mjs    # captures a Breaking Alert
```

`tools/verify.mjs` runs at 1366×700 specifically because the scroll bug only
appeared on short viewports. Keep testing there.

### Test coverage today

- Content integrity: unique ids, every card has ≥2 options with unique ids,
  every scheduled/queued `cardId` resolves, every referenced character exists.
- 200 full runs to an ending with random play — no crashes, all stats and
  hidden variables stay in legal range, >2 distinct endings, alerts fire,
  delayed consequences land.
- Determinism: same seed + same choices ⇒ identical terminal state.
- Variety: cards do not repeat within the recency window; <30% of days are
  short.
- Balance probe (prints, does not gate): average run length and ending
  distribution across three play policies.

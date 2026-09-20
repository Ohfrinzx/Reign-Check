# Design V2 — simplification and the roguelike turn

**Status: PHASE 1 (layout, simplification, wording) IMPLEMENTED AND
OWNER-APPROVED.** The owner played the real Poster/Broadsheet build and
said: *"Ok everything seems to run and look good. So I believe Phase one
playtests are complete."* **PHASE 2 — the roguelike layer (acts, shop,
mandates, run deck, meta-progression) in section 4 — is GREENLIT and is the
current task.** Nothing has been built for it yet; see `CLAUDE.md`'s "PHASE
2 IS GREENLIT" section for the recommended entry point.

Decisions made by the owner, in order:
1. Visual direction: the flat top-down **desk**, then **Poster** skin
   (section 5), then the **Broadsheet** layout (section 5b) — "Go with 1."
2. Mechanical scope: implemented as a **presentation-layer aggregation**
   (section 2b) rather than a deep engine rewrite. This was an engineering
   call made without an explicit owner sign-off on that specific tradeoff at
   the time — **since resolved**: the owner played the shipped build and
   raised no density/tracking complaint, so treat the display-layer cut as
   sufficient unless a future playtest says otherwise. See section 7.
3. Wording: card prose needed to be more accessible to players without
   political/financial literacy — addressed with a glossary system plus a
   rewrite of the specific example given (section 8), then widened to cover
   option hints/flavor/threat cards and one more dense card (the currency
   peg alert) after a follow-up owner note to prefer inline text over
   relying on the hover tooltip where inline is the better fix.
4. **Phase 1 declared complete; proceed to Phase 2.** *"So I believe Phase
   one playtests are complete... begin phase two of building."* No further
   Phase 1 polish is being requested — do not reopen it speculatively.
5. **The owner asked for a full plan to "finish and polish" the game with
   architecture that supports continued building, and asked that future
   iOS/mobile support be kept in mind without doing that work now.** That
   plan is section 9 (Phases 2 through 5, in order, with content quotas
   folded into Phase 2's sub-steps) and section 10 (the mobile guardrails —
   what to preserve and what to avoid, no mobile work scheduled).

**What is NOT built yet**: the roguelike layer in section 4 (acts, the Back
Room shop, mandates, a run deck, meta-progression). It is greenlit — start
with §4.1 (run structure) as its own shippable slice; see `CLAUDE.md`. Read
section 9 for what comes after Phase 2, and section 10 before writing any
UI code, so mobile stays an open door rather than an afterthought.

---

## 1. The problem, measured

After playtest 2 the owner said: *"There seems to be too many things to be
keeping track of. I want it to be a bit more simplistic with a more creative
and fitting design."*

That is correct, and the cause is structural rather than cosmetic. Five of the
ten headline stats are near-perfect restatements of a faction bar. Measured
across every authored option in the game (`military` vs `staff.loyalty` etc.,
counting how often both appear in the same effect and move the same way):

| Stat | Faction | Appear together | Same direction |
|---|---|---|---|
| ELITE | Business | 13× | **100%** |
| SECURITY | Security | 23× | **100%** |
| MILITARY | Army | 24× | **96%** |
| STABILITY | Unions | 28× | **89%** |
| PUBLIC | Public | 49× | **76%** |

The player is reading the same underlying fact twice, in two different visual
languages, in two different places on screen.

Trackable numbers visible at once today:

| Surface | Count |
|---|---|
| Stat bar | 10 |
| Faction bars (7 × loyalty/power/patience) | 21 |
| Character moods | 13 |
| Budget lines | 11 |
| **Total** | **55** |

For comparison, the roguelikes this wants to sit beside run on far less.
*Slay the Spire*: HP, gold, energy, block. *Balatro*: chips, mult, hands,
discards, money. Their depth is in **cards and combinations**, not in the
dashboard. Depth should come from what the cards do to each other, not from
how many meters are on screen.

## 2. Design principle for V2

> **Few legible resources. Deep combinatorial content.**

Every number on screen must be something the player makes a decision about.
If a number is only ever an echo of another number, it is not a resource, it
is noise — delete it or derive it.

## 3. Proposed target — and how it was actually built

**Engineering decision, made without an explicit owner sign-off on this
specific point:** this was implemented as a **presentation layer**
(`src/game/display.ts`), not a rewrite of `GameState`. The engine underneath
still tracks the full 10 stats and 7 factions, with every existing card
effect, every test, and the balance probe completely unchanged — verified by
running the full suite before and after with identical results. Only what
the player is SHOWN changed.

Why: a real data-model cut (new `StatKey`/`FactionId` unions, migrating all
42 cards' `effects` objects, re-balancing, a save-version bump with no
migration path) is a much bigger, much riskier change than the "too much to
track" complaint actually required. The complaint was about what's on
screen. A display-layer cut gets the full cognitive-load win (55 → ~10
trackables, see 3.5) at a fraction of the risk, and is fully reversible if a
deeper cut is wanted later — nothing here forecloses that.

**If this turns out not to be enough** (the underlying depth "leaks" back
into the player's decisions in a way that still feels like too much), the
next step is the real data-model cut this section originally proposed. That
is a substantially larger job: touching `types.ts`, `effects.ts`, every
card's `effects` block, `endings.ts`'s check functions, and re-running the
balance probe from scratch.

### 3.1 Resources: 10 → 3 (+1 derived) — IMPLEMENTED as a display aggregate

Built in `src/game/display.ts::computeResources()`. Not a straight 1:1 of the
original proposal — `military` and `elite` needed a home too:

| Resource | What it means | Absorbs |
|---|---|---|
| **MONEY** | What you spend. Also the shop currency. | treasury |
| **GRIP** | Can you make the state actually obey you? | power, security, information |
| **LEGITIMACY** | Do people accept that you should be there? | legitimacy, support |
| *Income* (derived, shown beside MONEY as `+$3/day`) | The economy as a rate, not a meter | economy |

Lose conditions become legible: **GRIP 0** = you are a figurehead and get
replaced. **LEGITIMACY 0** = the street removes you. **MONEY deeply negative**
= the state stops functioning.

### 3.2 Factions: 7 → 5, one number each — IMPLEMENTED

Built in `src/game/display.ts::DISPLAY_FACTIONS` + `factionMood()`. **Army ·
Security · Money · Workers · Street.** One faction record (`staff`, `sable`,
`concord`, `combine`, `chorus`) each. Shown as the existing 0–100 `loyalty`
value mapped to a five-tier mood word per faction (e.g. Army: devoted /
backing you / uneasy / hostile / ready to move) — not a new −100..+100 scale;
that would have required touching `effects.ts`. `power`, `influence` and
`patience` are still tracked per faction but not displayed — they remain
readable in code and drive behaviour, they are just not on screen.

The **Civil Service** (`grey`) and the **Provinces** (`provinces`) are not in
`DISPLAY_FACTIONS` and get no bar. They are fully live underneath — Grebs and
Kostyn's cards still move their faction's loyalty/patience exactly as before
— they surface to the player only through those two characters and through
their own threat-card headlines (which fall back to the faction's full name
since there is no short label to match against, e.g. "The Provincial Bloc:
out of patience").

### 3.3 Hidden pressure → visible threat cards — IMPLEMENTED

Built as `buildThreats()` in `src/game/briefing.ts`, rendered by the "On your
desk" panel in `Rail.tsx`. Reuses `buildBriefing()`'s own severity-ranked
warnings and demands — one source of truth, not a parallel system — so a
warning that appears in the (still-present) Dossier-style briefing front page
is the same object that becomes a threat card. Shown as headline + body +
"STAGE N OF 3" with filled pips + source, capped at 3 live at once.

Every `WARNINGS` entry in `briefing.ts` gained a short `head` field for this
(e.g. `head: 'The army is talking'` for the coup-pressure entry at threshold
52) — that was a real content pass, not just plumbing: 21 warning entries and
every inline demand/opportunity push needed an active-voice headline written
for it.

### 3.4 Economy: ledger → one line — PARTIALLY IMPLEMENTED

The masthead ledger shows exactly `$42.0B` and `+$0.34B/day` for MONEY — the
full itemised budget breakdown from `economy.ts` (`computeBudget()`) is no
longer shown by default anywhere. What *did* ship, matching the "keep a short
list of commitments" half of the proposal: the Rail's **Standing costs**
panel appears only when `s.commitments.length > 0` and lists just the active
recurring costs, nothing else. The 11-line itemised view (revenue/spending
broken out by source) still exists in `economy.ts` and is computed for the
ledger's rate, but has no UI surface right now — if a "show me everything"
detail view is wanted later, the data is already there.

### 3.5 Net effect — measured as built

| Surface | Before | After |
|---|---|---|
| Resources (masthead) | 10 | 3 |
| Faction numbers | 21 (7 × 3 bars) | 5 (1 each) |
| Characters (as standing numbers) | 13 | 0 — appear on cards via the existing "who is this" line instead |
| Budget lines (default view) | 11 | 1, +1 line per active commitment |
| Threats/warnings | unlimited prose list | ≤3 threat cards |
| **Typical total on screen** | **~55** | **~9–12** |

## 4. The roguelike layer

The owner wants unique runs, shops and meta-progression, **and** more
content — these are not competing asks. Each sub-section below is scoped as
its own shippable slice (per §6) with a concrete content quota folded in, so
"add more content" happens as part of building the systems that give new
content somewhere to live, rather than as a separate, disconnected content
sprint. The simplification in sections 1–3 is the precondition: shops and
relics are unreadable on top of 55 numbers.

**Architecture principle for all of 4.1–4.5, carried over from the existing
discipline that has made 42 cards/9 alerts/9 endings need zero engine
changes to add (ground rule 5):** each sub-system needs exactly one engine
hook, built once, then everything else is data. Acts need one hook (the
confidence-vote check). The shop needs one hook (resolve a purchase through
`applyEffects()`, same as a card option). Mandates need one hook (apply a
start-of-run effect + register a run-long rule). Once each hook exists,
individual mandates/advisors/policies/favours are just objects in an array,
exactly like cards are today — see §4.6 for suggested shapes.

### 4.1 Run structure

A run becomes **3 acts of ~6 days** (18 days) instead of 30 flat days. Each
act ends with a **confidence vote** — a real check against your current state
rather than an arbitrary day counter. *Content: none required — this is the
one purely mechanical slice.* Suggested approach: reuse the existing ending-
check pattern in `engine.ts`/`endings.ts` for the vote's pass/fail logic
rather than inventing a parallel system.

### 4.2 Between acts: The Back Room

A shop screen. Spend MONEY on:

- **Advisors** — permanent passives. *"Grebs: you see one extra option on any
  ministry card."*
- **Policies** — permanent rule changes. *"Emergency Powers: Grip losses
  halved; Legitimacy decays 1 per day."*
- **Favours** — one-shot cards playable at any time. *"A Quiet Word: cancel one
  threat card."*
- **Burn a file** — remove a card permanently from your run's deck.

*Content target: ~8 advisors, ~8 policies, ~8 favours (24 items) to launch
with — enough that the shop feels different each visit without being a huge
authoring lift before the slice can ship. Expand the pool after playtesting,
the same way standard cards have grown across `cards.ts`/`cards2.ts`.* This
is real new game content, and the natural home for most of "I want to add
more content."

### 4.3 Mandate — how you took power

Chosen or rolled at the start of each run. Sets starting factions and adds one
unique rule for the whole run.

| Mandate | Start | Rule |
|---|---|---|
| **The Stairwell** | Army +20, Legitimacy −20 | The Security faction knows something. It will use it once. |
| **The Landslide** | Street +30, Money −20 | Legitimacy decays every day. You have to keep feeding it. |
| **The Handover** | Money +30, Street −20 | Every shop is 25% cheaper. Every Street threat escalates faster. |
| **The Accident** | everything neutral | You draw one extra card per day. |

This is where "unique runs" actually comes from — not from procedural noise,
but from a rule that changes how the whole run plays. *Content target: the 4
above plus 2–4 more for variety (6–8 total) before calling this slice done.*

### 4.4 Deck

Today, events are drawn from a global weighted pool. In V2 the player has a
**run deck** that shops add to and remove from. Situation cards still get
injected by the world, but a growing share of what you see is what you built.
That is the difference between "random things happen to me" and "I built this
run". *Content target: this is where the long-standing content-volume gap
(known limitation #1 — a 30-day run thins out after ~day 18) should actually
get fixed: roughly ~20 more standard cards and ~6 more alerts, authored as
part of this slice rather than deferred, since a run deck with too few cards
to add/burn meaningfully defeats the point of this feature. Pure content
work in `cards2.ts` or a new `cards3.ts`, zero engine changes (ground rule 5)
— note the act structure also independently helps here, since a run is now
18 days instead of 30.*

### 4.5 Meta-progression

Completed runs unlock mandates, advisors and cards for future runs. Small,
persistent, stored in `localStorage` next to the save (a separate key —
this is cross-run data, not part of any one run's save, and must not be
wiped by "delete save"/"restart run").

**Suggested simplification, to de-risk this slice the same way the
display-layer cut de-risked Phase 1's simplification:** ship 4.1–4.4 with
*everything* unlocked by default first — every mandate and shop item
available from run one. Layer in actual locked-by-default content and real
unlock conditions as a follow-up once the base loop (acts → shop → mandate →
deck) is built and playtested, rather than gating content behind a
progression system on the first pass. This keeps the biggest, riskiest slice
of Phase 2 (4.1–4.4) from also having to get a meta-progression system right
on the first attempt. *Content: whatever of §4.3/§4.2's pool ends up
held back for unlocks — no new authoring beyond what 4.2/4.3 already
produced.*

### 4.6 Suggested data shapes (a starting sketch, not gospel)

These are suggestions for whoever builds each slice to adapt, in the same
spirit as the rest of this document — not a locked spec. Follow the existing
`CardDef`/`Effects` patterns in `types.ts`/`effects.ts` rather than inventing
a parallel shape where an existing one already fits:

```ts
interface MandateDef {
  id: string;
  name: string;
  flavor: string;
  startEffects: Effects;   // reuse the existing Effects type — same shape a card outcome uses
  ruleText: string;        // plain-English description shown to the player
  // The rule itself: some mandates (Stairwell, Accident) are one-shot or
  // additive and may fit inside startEffects/a flag effects.ts already
  // checks. Others (Landslide's daily decay, Handover's shop discount) need
  // effects.ts or the shop/day-upkeep logic to check a flag on the state —
  // follow the existing pattern for regime axes / hidden pressures rather
  // than adding a special case per mandate.
}

interface ShopItemDef {
  id: string;
  kind: 'advisor' | 'policy' | 'favour';
  name: string;
  cost: number;             // in MONEY, same unit as everywhere else
  description: string;      // plain language, same writing rules as cards
  oneShot?: boolean;        // favours are consumed on use; advisors/policies are not
  effects?: Effects;        // policies/advisors: a permanent modifier, same shape as a card outcome's effects where possible
  apply?: (s: GameState) => GameState; // for anything effects.ts's existing shape can't express
}
```

A policy or advisor's "permanent" effect likely needs a small persistent
list on `GameState` (e.g. `s.activePolicies: string[]`) that `effects.ts`'s
coupling logic and `engine.ts`'s upkeep both check — the same shape as how
`regime` axes already influence behaviour persistently, not a new parallel
mechanism.

## 5. Visual direction — the desk (superseded by 5a/5b below)

**This section is the FIRST visual direction pass and is now superseded.**
The desk concept (everything has a permanent home, no tabs) survived; the
specific dark rendering of it did not — the owner rejected it as "way too
similar to the last" (i.e. still read as the same dark dashboard look). Kept
here for the reasoning, which is still why the layout is shaped this way.

**Direction: a flat, top-down desk layout. Mockup: `docs/mockups/desk.html`.**

Not skeuomorphic. No wood texture, no lamp, no perspective, no illustrated
objects. A dark surface divided into zones, where **every piece of information
has one permanent physical home** and nothing is behind a tab.

```
┌──────────────────────────────────────────────────────────────┐
│ NAMEPLATE        DAY · ACT · STAGE            MONEY GRIP LEGIT│
├────────────┬───────────────────────────────┬─────────────────┤
│ IN TRAY    │                               │ FILES           │
│ (stack of  │        THE DOCUMENT           │ (5 factions,    │
│  papers)   │        (current card)         │  one bar each)  │
├────────────┤                               ├─────────────────┤
│ TODAY      │        [ option 1 ]           │ ON YOUR DESK    │
│ (running   │        [ option 2 ]           │ (threat cards)  │
│  order)    │        [ option 3 ]           │                 │
├────────────┤                               │                 │
│ DIARY      │                               │                 │
│ (delayed   │                               │                 │
│  effects)  │                               │                 │
└────────────┴───────────────────────────────┴─────────────────┘
```

### Why this direction

- **It solves the tracking problem differently and better than hiding things.**
  Tabs were the old answer: fewer things on screen, but the player has to
  remember where everything lives and go looking. On the desk everything is
  always in the same place and always visible — which only becomes possible
  once the model is collapsed to ~9 trackables.
- **Consequences become spatial.** You stamp the paper, it slides off, and the
  Army folder jolts and its bar moves. Cause and effect are something you
  watch happen rather than a row of +/- pills.
- **It needs no illustration.** Flat shapes, type, and CSS. No art assets, so
  no risk of half-finished skeuomorphism.
- **It fits the roguelike layer.** The shop is a drawer that opens over the
  desk. The run deck is a card box. Advisors are business cards under the
  blotter. These are all desk objects, so the metaphor survives contact with
  systems UI instead of being a skin on one screen.

### Measured: it fits

The mockup was rendered at **1366×700** — the viewport where the V1 scroll bug
appeared — with a real card at full length (132 words including options). The
whole game fits with room to spare and **no scrolling anywhere**. That was the
main risk and it is resolved.

### Risks that remain

1. **Fixed viewport is a hard constraint.** Everything visible at once means
   everything must fit at ~1280×640. This caps card length (~150 words total),
   the faction count (5), and how many threat cards can be live (2–3). These
   are healthy limits but they are real and content must respect them.
2. **Below ~1100px wide the three columns cannot hold.** Needs a stacked
   fallback, or accept desktop-only, which the original spec already does.
3. **Execution risk, not concept risk:** a flat desk can read as "a dashboard
   with different labels" unless the physical cues are committed to — paper
   stock colour, real drop shadows, slight rotation, tactile motion, stamps.
   Half-committing is the failure mode.

### Rejected: full skeuomorphic desk

An illustrated 3D-ish desk was considered and rejected. Our cards average 132
words, which is 4–8× a *Reigns* card, so a readable "sheet of paper" has to be
roughly 700×500px — it *is* the screen, and the desk would only survive as a
picture frame around it. It would also need illustration assets that cannot be
produced to a good standard here, and it fights the shop and deck screens.

## 5a. Visual skin — Poster (CHOSEN)

Three light-mode skins were mocked up (`docs/mockups/skin-{poster,manila,
bureau}.html`, all sharing the desk layout above): **Poster** (cream
newsprint, huge condensed black headlines, one red, flat blocks — a state
printing-office look), **Manila** (buff paperwork, folders, typewriter
labels, rubber stamps), and **Bureau** (warm off-white, soft-shadow cards,
1960s institutional-report look).

**The owner chose Poster.** Palette and type extracted into
`docs/mockups/poster.css` for the mockups, and into `src/styles/index.css`
for the real app — see the header comment there for the full token list
(`--paper`, `--ink`, `--red`, `--teal`, `--mustard`; `Anton` for the huge
headline, `Archivo Black` for kickers/labels, `Libre Franklin` for UI chrome,
`Lora` for card prose, `Courier Prime` for numbers/monospace). Fonts are
self-hosted under `public/fonts/` (Google Fonts is blocked in the sandbox
this was built in — every earlier screenshot before this was taken in
fallback system fonts, not the intended type; self-hosting also removes a
runtime network dependency the game had no real need for).

## 5b. Layout — Broadsheet (CHOSEN)

Four Poster-skinned layout variants were mocked up
(`docs/mockups/layout-{1-broadsheet,2-focus,3-bands,4-table}.html`):
**Broadsheet** (the interface as a newspaper front page — masthead, lead
story in two columns, decision boxed at the foot, standings in a right
rail), **Focus** (one card, everything else collapsed to a bottom strip),
**Bands** (a flat horizontal stack), and **The Table** (three situations
face-up, time for two — a genuine mechanic, not just an arrangement, flagged
at the time as the most roguelike-compatible option).

**The owner chose Broadsheet ("Go with 1").** The Table's triage mechanic
was NOT adopted — it remains a good candidate for the Act structure in
section 4 (a natural home for "pick which situation gets your attention"),
but was not part of what got built here.

### As built

`App.tsx` + `src/ui/screens/Screens.tsx`'s `BriefingScreen` implement a
simplified single-column-vs-rail version of the broadsheet mockup (the
mockup's masthead-with-skew-red-band became the app's persistent
`.masthead`; the mockup's own day/act strap became the app's persistent
`.strap`, which ALSO carries the primary "next" action button — see the
callout below). The card-as-lead-story treatment (kicker, byline, headline,
prose, boxed decision list) is `CardView.tsx`'s `.doc`.

**One layout change made during implementation, not in either mockup:** the
mockups' "Begin the day" button lived in a bottom action bar. Built with
`position:sticky`, that bar visibly overlapped tail content before the
first scroll — the same class of bug as the V1 scroll issue, caught in
testing at 1366×700 and documented in the `.action-bar` CSS comment. Fixed
by *also* putting the primary action in the `.strap` at the top of the
page (`.strap-action` in `App.tsx`), which needs no scrolling to reach at
all, and dropping `position:sticky` from the bottom bar entirely — it is
now a plain, non-sticky convenience duplicate at the natural end of the
content. Any future layout work should keep this: **the primary action for
a screen must be reachable without scrolling**, full stop, not just "reachable
after a fix to how sticky behaves".

## 6. How to execute it

**Refactor, do not rewrite.** The engine is the good part and is content- and
presentation-agnostic: `effects.ts`, the scheduler, the weighted draw, the
alert weighting and the save system all survive unchanged. What changes is the
*shape of the state* and the *UI on top of it*.

Suggested order, each step shippable and playtestable on its own:

1. ✅ **DONE, as a display-layer cut, not a data-model migration** (see the
   "how it was actually built" note under section 3). 10 stats → 3 shown,
   7 factions → 5 shown, one bar each. All 42 cards' `effects` are completely
   untouched — nothing was remapped because nothing needed to be.
   `SAVE_VERSION` did NOT bump for this (no state shape changed). If a deeper
   cut is ever wanted, `SAVE_VERSION` bumps then, not before.
2. ✅ **DONE.** Threat cards (`buildThreats()` + the Rail's "On your desk"
   panel) replaced the prose-only warning list as the default view. The full
   prose briefing (now styled as the front page) still exists and still
   shows the same warnings in more depth — it was not deleted, just no
   longer the ONLY place they show up.
3. ✅ **DONE, as Poster + Broadsheet, not the original dark desk mockup.**
   See 5a/5b. The morning briefing is now the front-page treatment described
   there; it was not merged into a single persistent "desk" screen the way
   the original desk.html mockup showed (cards still get their own doc view
   once the day starts, per Broadsheet).
4. ⬜ **NOT STARTED. GREENLIT — start here.** Acts and the confidence vote
   (§4.1) first, as its own shippable slice; the Back Room shop (§4.2) is a
   separate later slice once acts are playtested.
5. ⬜ **NOT STARTED. GREENLIT**, after step 4. Mandates (§4.3).
6. ⬜ **NOT STARTED. GREENLIT**, after step 5. Run deck (§4.4) +
   meta-progression (§4.5).

Steps 1–3 (done) answer "too much to track" and "more creative and fitting"
— the owner has now played that build and confirmed it. Steps 4–6 are the
roguelike turn: the owner has greenlit the whole layer, but each step should
still ship and get played on its own before the next one starts, the same
pattern that got steps 1–3 right. See `CLAUDE.md`'s "PHASE 2" section.

## 7. Open questions — updated

Resolved by the owner during this pass:
- ~~Visual direction~~ → Poster skin, Broadsheet layout (5a/5b).
- ~~Wording accessibility~~ → glossary system + targeted rewrites (section 8
  below), then widened once more to hints/flavor/threat cards. The owner has
  now playtested this build and confirmed it: *"everything seems to run and
  look good."* Treat wording as sufficient unless a specific future note
  says otherwise — this is no longer an open question, but if a *specific*
  new term or line comes up in Phase 2 playtesting, fix it the same way
  (inline explanation preferred, `GLOSSARY` as backstop).
- ~~Was the display-layer cut enough?~~ → Yes, per the same playtest note
  above — no density/tracking complaint was raised. Do not start the deeper
  data-model rewrite section 3 originally proposed unless a future playtest
  specifically asks for it again.
- ~~Roguelike layer next, or another polish/playtest round first?~~ →
  Roguelike layer next. *"So I believe Phase one playtests are complete...
  begin phase two of building."*

Still genuinely open, for whoever picks this up next:
1. **Nothing Phase-1-shaped remains open.** The two questions this section
   used to carry (display-layer sufficiency, wording sufficiency) are both
   resolved above by the same playtest note. If either resurfaces during
   Phase 2 playtesting, treat it as new information, not a reopened old
   question — the display layer and glossary system are both easy to extend
   without redesigning them (see `CLAUDE.md` ground rule 8 and the writing
   rules).
2. **Within Phase 2, section 4 leaves a few implementation choices
   unspecified** — these are for whoever builds each slice to decide, not
   blockers to ask the owner about first:
   - Exact confidence-vote check (§4.1): what state it reads and the pass/
     fail threshold. Suggest reusing the existing ending-check pattern in
     `engine.ts`/`endings.ts` rather than inventing a parallel system.
   - Whether "The Table" layout's triage mechanic (rejected as the base
     layout in 5b, but flagged there as "a good candidate for the Act
     structure") gets folded into how a day/act presents multiple live
     situations. Worth a look when building §4.1, not required.
   - Exact shop pricing and advisor/policy/favour balance (§4.2) — needs
     playtesting once it exists, not a design decision up front.


## 8. Wording — making the language accessible

**Owner's exact note:** *"the text needs to be more clear for users who may
not understand this sort of political language. Example being most people
don't know what clearing the payroll means and how their decision will
affect it."*

### What shipped

1. **A glossary system**, `src/game/glossary.ts` + `Prose.tsx`. 18 recurring
   institutional/financial terms (payroll, the currency peg, capital
   controls, deficit, subsidy, a commitment, runway, the gazette,
   procurement, a levy, a concession, a tranche, legitimacy, the confirmation
   vote, and a few more) each get a one-sentence plain definition. The FIRST
   occurrence of a term in any block of rendered prose is wrapped in a native
   `<abbr title="…">` — a dotted underline, hover or tap for the definition,
   no extra UI state needed, works everywhere card text renders (card body,
   outcome text, threat cards, diary). Later occurrences in the same text are
   left plain so prose does not get visually noisy.
2. **The specific example rewritten directly**, not just glossed: the
   `payroll-crunch` card (`src/game/content/cards.ts`) now spells out what
   payroll IS in the body text itself ("the wages the government owes every
   soldier, teacher, and clerk on its books"), and every option's hint states
   the plain consequence rather than the institutional mechanism — "Everyone
   gets paid on time. In return you owe the banks $12.0B..." instead of
   "Payroll clears. You now owe the banks money, at a price they set."
3. **Faction-naming consistency.** While doing this pass, found and fixed a
   real inconsistency: the ending verdict and some threat headlines were
   using factions' full internal names (`"The Sable Office"`, `"The Public"`)
   while the always-visible Files panel calls the same factions by their
   short display labels (`"Security"`, `"Street"`). Fixed to read from
   `DISPLAY_FACTIONS` consistently — see `endings.ts`'s `verdict()` and
   `briefing.ts`'s faction-demand pushes.

### What did NOT ship — scope this was deliberately bounded to

This was **not** a line-by-line rewrite of all ~4,000 lines of card prose.
The option hints were already largely plain (that was most of the round-1
fix); this pass targeted the specific failure mode the owner named — jargon
with no accessible definition — rather than re-litigating every sentence.
If further playtesting turns up more terms that need glossing, add them to
`GLOSSARY` in `glossary.ts`; that is the intended extension point and needs
no new UI work.

## 9. The road beyond Phase 2 — Phases 3–5

Written after the owner asked for a plan covering "finishing and polishing
this game out with the proper architecture to continue adding and building."
This is that plan. Phase 2 (section 4) is the current task; the phases below
are sequenced after it, not concurrent with it — finish and playtest Phase 2
in full (§4.1 through §4.5) before starting Phase 3, same discipline as
every phase so far.

### Phase 3 — Content & systems depth

Everything here is genuinely deferred (needs an explicit go-ahead per
`CLAUDE.md`), listed in the order it makes most sense to build:

1. **Faction demands as a live mechanic** (Milestone 2 in `PROJECT_STATUS.md`
   §4). Issue dated, formal demands when patience drops, escalating murmur →
   formal → ultimatum, spawn a card when one expires. `FactionState.demand`
   and the `FactionDemand` type already exist as the hook.
2. **Character-driven events** (Milestone 3). Spawn a card when a
   character's `plotting` crosses a threshold. The data is already tracked;
   this is new spawn logic plus new cards.
3. **Crisis chains** (Milestone 4). Multi-card escalating sequences — this
   pairs naturally with the act structure from §4.1 (a chain could span an
   act) and is worth revisiting with that structure in hand rather than
   against the old flat 30-day timeline.
4. **A balance pass.** Difficulty asymmetry (known limitation #2) and the
   rare coup ending (#3) are real, but deliberately not tuned yet —
   rebalancing now would be wasted work, since the shop economy and 18-day
   acts from Phase 2 will change the difficulty curve regardless. Re-run the
   existing balance probe (`npm test` → `balance.test.ts`) once Phase 2 is
   playable and tune against that, not against the pre-roguelike numbers.

Why this order and not sooner: all three systems (demands, character events,
crisis chains) are additive content/logic that layers on top of whatever
run structure exists. Building them against the old flat-day model and then
having to reconcile them with acts would be double work.

### Phase 4 — Mobile / iOS readiness (deferred — see section 10)

Not started, not scheduled. See section 10 below for what "keep it in mind"
concretely means for Phase 2/3 work, and what Phase 4 itself would involve
when it's actually picked up.

### Phase 5 — Remaining nice-to-haves

Lowest priority, no dependencies forcing an order: mini-games (Milestone 5 —
`MinigameKey`/`CardDef.minigame` already exist as the hook; start with
Budget Allocation and Cabinet Negotiation), sound, assassination/election-
defeat/constitutional-removal endings, run history/legacy across runs (note
this likely folds into Phase 2's meta-progression, §4.5, rather than being
built twice).

### What "finished and polished" means for this project

Feature-complete for a 1.0 is Phases 2–3 done and balanced: the roguelike
layer playable end to end with enough content that a run deck feels
different each time, plus the systems-depth items above. Phases 4–5 are
platform expansion and extra polish respectively, not required to call the
game done — they're listed so the next several sessions of work have a
clear runway instead of stopping at "what next?" after Phase 2.

## 10. Mobile / iOS — deferred, but keep the door open

The owner wants this eventually but explicitly does not want it slowing
Phase 2 down: *"that may be pushed back to a different time for now as I
iron this out before further complication, but keep that consideration in
mind while building and coding this moving forward."* Concretely, that
means one thing to preserve and a short list of things to avoid — nothing
to build now.

**The one thing to preserve — this is already done, don't undo it:**
`src/game/` has zero React or DOM dependency (ground rule 1's discipline).
This is what actually keeps iOS open, more than any specific UI choice.
Whichever way a native port eventually happens — a **Capacitor**-wrapped
build of this same web app (the lower-effort path: the existing React/CSS
UI runs in a native WebView largely as-is, no rewrite), or a heavier native
rewrite — the entire simulation (`effects.ts`, `engine.ts`, the content
files, and whatever Phase 2 adds: the shop, mandates, run deck, meta-
progression) ports untouched either way, because it was never coupled to a
browser. **When building Phase 2's engine hooks (§4's "architecture
principle"), keep them in `src/game/` with zero UI dependency, same as
every existing system.** That is the single highest-leverage thing "keeping
iOS in mind" means in practice.

**Things to avoid introducing, without doing any mobile work now:**
1. **Don't make anything gameplay-critical hover-only.** The glossary's
   `<abbr title="…">` tooltip (`Prose.tsx`/`glossary.ts`) already is — it
   works fine with a mouse and degrades acceptably on touch (most mobile
   browsers show the title on long-press), so it does not need fixing now,
   but don't add a *second* hover-only mechanism for anything that conveys
   required information (a price, a trade-off, a required condition). If it
   matters to the decision, it should be visible without hovering, the same
   spirit as ground rule 9 (reachable without scrolling) — reachable
   without a mouse is the same idea for a later touch target.
2. **Don't deepen the desktop-only-viewport assumption beyond where it
   already sits.** The right rail is already hidden below 1080px width
   (known limitation #5) and that is fine to leave as-is — just don't add
   new UI that assumes a mouse-hover state or a fixed pixel width with no
   fallback path at all if it can reasonably use a relative unit or an
   existing CSS variable instead.
3. **Don't add a hard dependency on a desktop-only browser API.** Nothing
   currently does this (keyboard shortcuts are a convenience layered on top
   of click, per `App.tsx`'s keydown handler) — keep it that way.

**What Phase 4 itself would actually involve, when it's picked up:** most
likely Capacitor wrapping the existing build, plus the one real gap this
list doesn't paper over — a responsive/touch layout tier for the Broadsheet
UI (the right rail and multi-column layout need a real stacked/mobile
treatment, not just "shrink it"). That is genuine design and layout work,
comparable in size to the Poster/Broadsheet rebuild itself, and should be
scoped and mocked up the same way that was — not squeezed in as an
afterthought once Phase 2/3 are done.
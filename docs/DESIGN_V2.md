# Design V2 — simplification and the roguelike turn

**Current update (2026-09-22): The confidence-vote reveal (§4.1a) is built,
playtested, and owner-approved.** The owner reported: *"Play tested and
working."* This approval covers the reveal slice. Phase 3 has not begun;
its balance pass and other systems still require a separate go-ahead.
The Phase 2 account below records its earlier completion.

**Current status (2026-09-21, later session): Phase 1 and ALL of Phase 2
(§4.1–§4.5, every step) are OWNER-APPROVED. Owner, verbatim: "Playtest
good, ready for next slice. Won't be doing it now. Just update the
current documentation for the next agent. Nothing more." §4.5
(meta-progression) — both the cross-run record and real unlock conditions
with their own UI — is now played and approved alongside everything
else. This confirms Phase 2 is done; it is NOT a go-ahead to start Phase
3 — that needs its own explicit instruction.** Each slice still required
its own feedback before the next started while building — approval of
step 1 was not itself the go-ahead for step 2; the owner gave that
go-ahead explicitly, in the same session, after asking what
meta-progression would be and specifying where its UI should live. See
`PROJECT_STATUS.md`'s current handoff and `docs/REVIEW_2026_09_21.md`.
Historical implementation notes below describe earlier checkpoints.

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

**What is NOT built yet:** nothing in Phase 2. Read section 9 for later
phases and section 10 for the mobile architecture guardrails.

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
Security · Money · Workers · Street.** *(2026-09-22: "Money" was renamed
"Elites" at the owner's request — see Phase 3 step 1.)* One faction record (`staff`, `sable`,
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

### 4.1 Run structure — BUILT AND OWNER-APPROVED

A run becomes **3 acts of ~6 days** (18 days) instead of 30 flat days. Each
act ends with a **confidence vote** — a real check against your current state
rather than an arbitrary day counter. *Content: none required — this is the
one purely mechanical slice.* Suggested approach: reuse the existing ending-
check pattern in `engine.ts`/`endings.ts` for the vote's pass/fail logic
rather than inventing a parallel system.

**As built:** `GameState.act` (1..3), `ACT_LENGTH=6`/`NUM_ACTS=3` in
`state.ts`. The vote uses the `noConfidence` entry in `ENDINGS` and the pure
`computeConfidenceVote()` helper in `content/endings.ts`. It checks the
Grip/Legitimacy composite already shown on the masthead against a threshold
that rises per act (40/47/54), tuned against simulated play to bite reckless/
mediocre runs without touching careful play (docs/known limitation #2, the
difficulty asymmetry, is unchanged by design — a real balance pass is still
Phase 3). Since §4.1a, act-boundary days defer only `noConfidence`, freeze
the helper's result in the `vote` phase, then apply that stored outcome when
the player continues. Other endings retain their priority. Passing act 3's
vote with nothing else having ended the run resolves to the existing
`survival` ending. The original act field bumped `SAVE_VERSION` 2→3; the
saved reveal/result later bumped it 9→10.

**Display follow-up:** the masthead and front-page briefing originally showed
`Day X / 18` — progress through the whole run. Owner: *"Instead of having it
display <day>/18 change it to 6. I would rather track how many days are left
in the act."* `dayInAct()` (`state.ts`) derives the day within the current
act (1..`ACT_LENGTH`) from `GameState.day`, a pure read with no new field, so
no `SAVE_VERSION` bump was needed. Both display sites (`App.tsx`'s masthead
strap, `Screens.tsx`'s edition line) now read `Day X / 6`, resetting to 1 at
each act boundary; `GameState.day` itself, and everything else that reads it
(the vote check above, saves, `dateLine()`), is untouched.


### 4.1a Confidence-vote reveal — BUILT AND OWNER-APPROVED (2026-09-22)

**Status and authorization:** After first authorizing documentation only,
the owner explicitly said to begin implementation and allowed the recommended
direction. The selected treatment is the division-board + clerk's-tally
hybrid, placed before buying. The feature passed automated verification and
the owner confirmed after playtesting that it is working. No content or
balance values changed, and this did not start Phase 3.

#### Current mechanic to preserve as the baseline

Reviewed on default at commit `9ef29a8`; re-check live code before building:

- `state.ts`: three six-day acts; `isActEndDay()` checks
  `day === act * ACT_LENGTH`, giving vote days 6, 12, and 18.
- `display.ts::computeResources()`: Grip = 0.45 power + 0.25 security +
  0.15 military + 0.15 information. Displayed Legitimacy = 0.50 underlying
  legitimacy + 0.35 support + 0.15 stability.
- `content/endings.ts::computeConfidenceVote()`: score = (Grip +
  Legitimacy) / 2; threshold = 33 + act * 7 (40/47/54); equality passes.
  There is no vote RNG or simulation of individual MPs, seats, or blocs.
- `engine.ts::finishDay()` checks the final state after the day's cards and
  alerts. Failure ends the run; passing acts 1/2 advances the act; passing
  act 3 yields survival. Other qualifying loss endings have higher priority.
- The current vote happens **before** Night Review / Back Room purchases.
  Only surviving intermediate acts reach the expanded act room; final
  survival and losses go to the ending screen.
- Resource values are unrounded for the vote but rounded in the masthead.
  Near a boundary, whole numbers can appear sufficient while the real
  average fails. Future result copy must explain a tiny margin honestly;
  never display "+0.0" beside a failure or silently change the comparison
  to match rounded presentation.

#### Presentation decision and alternatives considered

1. **Division board:** a parliamentary tally board fills with indicators;
   the count develops progressively and a visible line shows the requirement.
2. **Chamber seats:** a stylized chamber reveals members' positions one at a
   time. More cinematic, but risks suggesting actual parliamentary blocs
   and member loyalties that the game does not currently model.
3. **Clerk's tally:** typed marks on an official sheet culminate in a
   "Confidence retained" or "Confidence withdrawn" stamp. Closest to the
   existing newsprint and government-paperwork theme.

The implemented choice is the **Division board + Clerk's tally hybrid**.
It runs for roughly five seconds: a short opening beat, brisk early clerk
returns, slower final returns, then the verdict and exact margin. The 24
indicators are explicitly returns, not ballots, MPs, seats, or blocs. The
screen shows Grip, Legitimacy, recorded confidence, required score, and the
distance above/below the line. Sound remains deferred with Phase 5 audio;
the sequence works silently.

**The earlier conversation mockups were conceptual, not production assets
or a mathematically valid ballot model.** In particular, the 24-indicator
board's counts were not mapped to its 47-point requirement. Do not copy that
mismatch. A confidence score is not an MP count. Prefer a clearly labeled
score/threshold reveal until an explicit, documented conversion to seats
has been agreed. Any such conversion must preserve pass/fail and margin
meaning, including threshold equality and near-boundary values. A genuine
parliament/seat/defection system is a separate gameplay proposal, not implied
by this animation request.

Retain the light Poster/Broadsheet skin and existing typography by default.
The dark chamber concept is exploratory only: AGENTS.md §9 reserves the
dark screen for the Back Room unless the owner approves another exception.

#### Timing decision

The owner authorized either recommended design direction. The implementation
uses **before buying**, preserving the original mechanics and avoiding any
suggestion that a purchase changed the result.

Recommended flow, preserving today's mechanics:
end-of-day state → check other endings → freeze vote result → reveal →
failure ending, intermediate pass Night Review / expanded Back Room, or
final pass survival ending.

Why before buying was recommended: the present engine has already ended a
failed run before shopping. A delayed reveal could let players spend on an
already-lost run and imply their new purchases influenced the result.
It could also leak the verdict through the expanded room or act label.
If the owner chooses after buying, explicitly decide whether purchases
affect the vote. Recalculating after purchases is a gameplay/balance change;
freezing the earlier result requires honest cutoff messaging and a defined
flow for failures and the final act. Do not silently move that cutoff.

#### Relationship to Phase 3

Keep the existing demands → character events → crisis chains order in §9.
The reusable result/margin and reveal are now built without changing the
mathematics. When the Phase 3 balance pass is separately authorized, record
margins by act and play policy alongside losses from other endings; do not
treat reaching day 18 as equivalent to winning. Because the UI reads the
shared helper's frozen result, later approved threshold/formula tuning does
not require a second presentation formula. Include the reveal in the final
Phase 3 playtest as feedback for close and comfortable outcomes.

#### Implemented architecture and acceptance record

`ConfidenceVoteResult` stores act, day, Grip, Legitimacy, score, threshold,
margin, and passed. The calculation lives in `src/game/content/endings.ts`,
free of React/DOM. `finishDay()` first checks every higher-priority ending,
then freezes the vote and enters `phase: 'vote'`. `Vote.tsx` animates only
that snapshot. `completeConfidenceVote()` consumes the stored result exactly
once; animation timers never decide gameplay and reveal ordering consumes no
gameplay RNG. `SAVE_VERSION` bumped 9→10.

Integration points are `types.ts`, `state.ts`, `content/endings.ts`,
`engine.ts::finishDay()`/`completeConfidenceVote()`, `App.tsx`, new
`ui/screens/Vote.tsx`, styles, all phase-driving tests, and browser tools.
Cross-run meta history remains intact.

Verification covers:
- Below/equal/above each threshold, full decimal precision, and honest
  near-zero margin formatting; no independent formula in the UI.
- Each act boundary, empty agendas, higher-priority losses, intermediate
  pass/fail, final survival, and the approved shopping cutoff.
- Save/reload during the reveal without recalculation, duplicate act
  advancement, duplicate run records, or prematurely disclosed results.
- No gameplay RNG changes from animation, skipping, replay, or reload.
- A reachable "Reveal now" action; keyboard and touch support; reduced
  motion shows the final result immediately; a separate continuation action.
  Screen readers announce the final result, not every animated indicator.
- Clear labels in addition to color; no numeric hidden-pressure disclosure.
  Inspect at 1366×700 and narrow layouts, keeping the action reachable.
- Update simulation/browser phase drivers when a vote phase is introduced,
  then run the repo's existing full verification gates.

All 113 Vitest tests pass. The production build passes with only the existing
bundle-size advisory. The full browser suite passes at 1366×700 with zero
page errors; `tools/vote.mjs` verifies a partial timed reveal, exact frozen
save/reload result, completed tally and factors, viewport fit, and Act 2
continuation. The general phase-driving browser tools also traverse any vote
they encounter without stalling. The owner then playtested and approved the
result: *"Play tested and working."*

### 4.2 The Back Room — BOTH CHUNKS BUILT AND OWNER-APPROVED

**Owner amendment to this section, made when the slice was greenlit:** the
shop opens at the **end of every day**, not only between acts. The spec below
was written for a between-acts shop; what shipped is a two-size room:

- **the nightly room** — 3 offers from the cheap-to-mid `small` pool, and it
  sells you **exactly one thing**. Taking something closes the room.
- **the act room** — on the night an act's confidence vote is passed, 5 offers
  from the whole pool, guaranteed to include at least one expensive `big`
  item, and it sells you as much as you can pay for.

Every item states its price AND its catch in plain language before you buy.
`rarity: 'rare'` is the only kind allowed to have no catch, and rare items are
priced for it. The four downside mechanisms are the ones the engine already
had — an immediate cost in another resource, a recurring `commitments` line, a
`schedule`/`queueCard` consequence that arrives later, and raised `hidden`
pressure that surfaces as a threat card.

**As built (chunk 1):** `content/shop.ts` (17 items, all data),
`shop.ts` (logic, no React), one engine hook — `buyShopItem()` resolves a
purchase through `applyEffects()` exactly like a card option — plus one
ongoing hook in `effects.ts`'s `applyCoupling()` for owned advisors'/policies'
`lossMult`, and one in `dayUpkeep()` for their `daily` rules. `Phase` gained
`'shop'`; `GameState` gained `shopStock`/`owned`/`heldFavours`/`shopBought`/
`shopRecent`/`shopBuysTonight`; `SAVE_VERSION` bumped 3→4.

**Three pricing/variety decisions were measured, not guessed** — see
`src/game/__tests__/shop.probe.ts`, which exists so the next session can
re-measure instead of guessing:

| Problem the probe found | Fix |
|---|---|
| An unrestricted buyer bought **all 17 items in one 18-day run** (~1.00 purchases/item/run) — the opposite of "runs feel different" | The nightly room sells one thing; nothing is offered twice in a run |
| Prices were too low against the measured treasury curve (median ~$35–40B, ~±$1B/day); a $2B favour was bought 2.7× a run | Repriced: small $3–9B, big $14–22B |
| `foreign`-collapse endings spiked 14→43 per 120 runs — two items shoved the same hidden pressure | The Ilvet levy's catch moved onto the Concord, where it belongs |

After the fixes, realistic (random-play) purchase frequency is **0.24–0.84 per
item per run**, and a buy-everything player collapses in 57/120 runs while a
careful one still survives — the catches bite exactly as intended.

**The Back Room is dark, and it is the only dark screen in the game.** Owner
request, after the first build: *"I really want it to feel as if you are some
place else."* The working day stays light Poster stock; entering the shop
swaps the whole viewport — page, strap, rail and card — to a dark version of
the *same* system (same condensed headlines, same one red, same flat shapes).

**This is not the dark desk skin that was rejected in §5.** That was a
different visual language with different type, proposed as the default for
the whole game, and the owner rejected it as "way too dark". Dark here is a
special occasion used for contrast, which is why it works: it is the
exception that makes the rest of the game read as daylight. **Do not take
this as licence to darken anything else.**

As built: `.app.dark` in `index.css` swaps the surface tokens and nothing
else has to know. Getting there required tokenising the hardcoded
`rgba(22,19,15,…)` hairlines, shadows and newsprint texture into
`--hair`/`--hair-soft`/`--shadow`/`--dot`, and giving the masthead its own
`--bar`/`--bar-text` so the player's nameplate and ledger stay dark in *both*
themes — the one fixed point on screen. Three depths keep it from reading as
one flat slab: the room (deepest), the surfaces standing in it, and the
masthead bar (deeper still, for a clean top edge). The act room's header
becomes a deep red slab rather than inverting to a cream one.

**One non-obvious trap, recorded so it is not re-learned:** `color:var(--ink)`
originally lived only on `body`, which resolves the token in the *light*
scope; children then inherit that resolved value, so every piece of inherited
text stayed dark-on-dark. `.app` now re-declares `color:var(--ink)` inside
the themed scope. A browser contrast probe caught this — the screenshots
alone would have shown "missing" headlines without saying why.

**Follow-up owner request, same session: the Back Room is also fullscreen.**
"So literally the only thing on the screen is the shop" — masthead, strap and
rail were only *dark* before this; now they do not render at all while
`game.phase === 'shop'`. `App.tsx` has a second early return (after the title
screen's) that renders a bare `<div className="app dark shop-full">` holding
nothing but `<ShopScreen>`. This **supersedes** the masthead-tokens note just
above for the shop specifically — there is no masthead on screen during the
shop to keep dark or light, the whole question is moot there. The shop's own
"Leave" button (`.shop-foot .btn-primary`) is now the *only* way out; there is
no `.strap-action` while `phase === 'shop'`. All three Playwright tools broke
on exactly this the first time this round ran them (they fell through to a
`.strap-action` click that no longer existed) and needed the same one-line
fix — check `.shop-foot .btn-primary` first in any future tooling that walks
the shop.

**Also added: "Advisors & Deals", a screen opened from the masthead during
the main game** (not the shop) — owner request, so bought advisors and deals
are reachable without reopening the shop, and so advisors can be let go
mid-run. `src/ui/screens/Manage.tsx`. Two small additions to the data model,
both following the "one hook, then it's data" principle from this section's
opening:

- **Firing an advisor** (`fireAdvisor()` in `engine.ts`) costs whatever
  `ShopItemDef.fireCost` (money) and applies `fireEffects` (the non-monetary
  consequence) that advisor's entry in `content/shop.ts` gives it, and cancels
  the commitment `endsCommitment` names, if any. Every advisor must have a
  real fire cost or consequence — the same everything-has-a-downside rule
  that governs buying one in the first place — enforced by a test, not just a
  convention. Policies and favours are not fireable; the owner asked for
  "deals and advisors" specifically.
- **Timed deals**: most deals are permanent, but a `durationDays` on a deal
  starts a countdown, ticked in `dayUpkeep()` right next to how commitments
  and projects already tick. When it reaches zero, the deal's `expireEffects`
  fire once through `applyEffects()` and it is removed. Only `three-judges`
  uses this so far (5 days, then a scandal bump as the arrangement becomes
  public) — enough to prove the mechanism, not a claim that more of the pool
  should be timed; that is content work, same as chunk 2 below.

**Second follow-up owner request, same session: advisors and deals are
capped, and the shop shows your slots live.** "This is to incentivize the
player to choose wisely or even fire/cut deals in order to buy a new one."
`ADVISOR_CAP`/`DEAL_CAP` in `shop.ts`, both `3`, tracked separately — filling
up on one never blocks the other. Past the cap, the offer stays visible
(same as being unable to afford it) but is disabled with a plain-text reason.

This turned "timed deals" into something broader: **every deal, permanent or
timed, now occupies a slot** (`GameState.heldDeals`, replacing the earlier
`activeDeals` — `daysLeft: undefined` for a permanent one, so it never ticks
but still counts against the cap) from the moment it's bought until it ends.
A timed deal still ends on its own via `expireEffects`; ANY deal — permanent
or timed, whether its clock has run out or not — can also be **cut short on
purpose**, at a cost: `cutDeal()` in `engine.ts`, the deal equivalent of
`fireAdvisor()`, paying `ShopItemDef.cutCost`/applying `cutEffects` and
cancelling the commitment `endsCommitment` names. Cutting a timed deal early
skips `expireEffects` entirely — that only fires when the clock runs out on
its own, never as a side effect of cutting. Every deal now has a real cost
or consequence to being cut short, the same rule enforced for firing an
advisor, checked by a test. `GameState.endedDeals` records whether a deal
that left `heldDeals` ran its course or was cut, so the "Advisors & Deals"
screen never shows a finished deal as "Ongoing".

**The Back Room got a second, matching UI piece for this**: a held-panel
sidebar inside the shop screen itself (`.held-panel` in `Shop.tsx`) showing
your advisor and deal slots live, with Fire/Cut buttons right there — the
owner's explicit ask, so freeing a slot to buy something new never means
leaving the shop to do it. It reuses `Manage.tsx`'s `ManageRow`/
`FireControl`/new `CutControl` components (now exported) in a `compact`
mode, so the two "what you're holding" surfaces (the shop's sidebar and the
main game's "Advisors & Deals" screen) share one visual language rather than
duplicating it. `SAVE_VERSION` bumped 5→6.

**Measured, not assumed: the caps barely restrict a simulated buyer yet**
(`shop.probe.ts`) — with only 5 advisors and 4 deals in the pool, hitting
`ADVISOR_CAP`/`DEAL_CAP` (3 each) rarely happens in an 18-day run regardless
of buying style. That is expected, not a tuning failure: the caps are sized
for the bigger pool chunk 2 is about to add, not the current one. Re-run the
probe after chunk 2's content lands to see whether the caps actually bite as
intended once there is real choice to give up.

**Chunk 2 — BUILT: 17 → 47 items.** Owner: *"aim for 30 more."* 9 new
advisors, 8 new policies, 8 new favours, 5 new deals, all in
`content/shop.ts`, grounded in the existing cast and world
(`content/country.ts`) rather than inventing new characters or institutions:
Varkov's adjutant, a clerk in the Grand Convocation, a friend at the Central
Bank, the Salt Communion, Sarran's overnight logs, Mavro customs, the Pigeon
Federation, Piek's deputy, a Gorsk engineer; currency controls, the Hadem
development fund, peg defense, land reform (finally keeping the 1961
promise), the Dovra Day broadcast, central bank capture, the Convocation
rubber-stamp, cosmetic press freedom; favours from Vel, Adamek, Loz, Hess,
Grebs, Vask, the Ostrene ambassador, an Ilvet ledger page; deals leasing the
salt flats to Sereth, a loan from Aureth (with conditions, unlike Ostrene's),
selling a Council seat to Adamek, a Pigeon Federation endorsement, and an
understanding with Drovna. The last two are **timed** — 4 and 6 days — so
3 of the 9 deals now run on a day-to-day clock (`three-judges` plus these
two), matching the owner's "a few, not all."

No engine changes were needed to add any of this — every item uses a
mechanism chunk 1 already built (`fireCost`/`cutCost`, `durationDays`,
`commitments`, the `daily`/`lossMult` hooks), which is exactly the "one hook,
then it's data" principle this section opened with, holding up under real
content volume.

**Two real bugs, caught by the process, not before it shipped:**
- `regime.cult` isn't a real key — "cult" is a `hidden` pressure, not a
  regime axis. `tsc --noEmit` caught it immediately in `dovra-broadcast`'s
  effects; fixed by moving it to `hidden.cult`.
- The existing test `'never offers the same item twice in a run'` assumed
  every affordable purchase attempt succeeds. The new deal cap correctly
  refused `pigeon-endorsement` at 3/3 held deals, but the test still counted
  the attempt as a purchase, then flagged a false "bought twice" when it was
  legitimately re-offered and refused again. Not a game bug — a test that
  hadn't been updated for a purchase that can now legitimately no-op. Fixed
  to check `shopBought` actually grew, the same check `shop.probe.ts` already
  used correctly.

**Measured again after the content landed** (`shop.probe.ts`, 150 runs × 4
buying styles): purchase frequency spread 0.01–0.9 across all 47 items, no
item dominating, and `avgDays`/`reachedDay18`/ending distributions all
in line with the pre-chunk-2 baseline. The advisor/deal caps aren't
meaningfully stress-tested by the probe's simple buyers (cheapest/greedy/
random by price, not "all advisors") — that measures general economy
health, which is what this pass needed to check; the caps themselves were
already verified directly (engine tests + real-browser interaction) when
they were built, earlier in this section.

**Known and deliberate, still true at 47 items:** a maximally efficient
buyer still won't see the whole pool in one 18-day run — that is the
point, not a gap. "Burn a file" from the original spec below shipped as
part of §4.4 (the run deck, below): 4 of that slice's 8 new policies use
`effects.deck.remove` to permanently ban a specific recurring card.

**The original spec, for reference:**

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

### 4.3 Mandate — BUILT AND OWNER-APPROVED

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

**As built, 2026-09-21:** all six are unlocked now. The original four plus
**The Clean Hands Promise** (higher starting Legitimacy, colder Security;
daily audits reduce corruption but uncover scandal material) and **The Pay
Deal** (Workers +20, treasury −$10B; permanent $0.60B/day wage agreement,
Workers gain support/patience daily). The owner explicitly confirmed that
**Money in the table means treasury**, not business-faction loyalty.

The selector replaces the old randomized origin scenarios, rather than
stacking two conflicting origin stories. Baseline conditions retain seeded
jitter; faction loyalty starts near 50 before mandate effects and existing
faction-relationship spillover. The Accident has no starting modifiers.
Legitimacy changes apply to all three components of the displayed aggregate;
existing systemic coupling means the text deliberately says “about”.

Definitions and the one queued Stairwell card live in `content/mandates.ts`.
`GameState.mandateId` holds only an ID. Generic rule hooks cover start effects,
daily effects, extra decisions, price multipliers, pressure growth and
patience losses. All new world effects use `applyEffects()`. Adding another
mandate using those hooks is content work. `SAVE_VERSION` is 7 (old runs reset).

Daily mandate effects begin on day 2; the wage commitment is charged from day
1. The Landslide loses roughly 2 displayed Legitimacy per morning; existing
advisor protections can soften that. Handover increases positive Street
pressure and negative Street patience changes by 50%, without amplifying
relief; positive shop prices are multiplied by 0.75 and rounded to the
existing $0.1B precision. Cash-paying deals retain their full payout.
Stairwell queues its recording confrontation once on day 4, with a paid
option and two no-cash alternatives. Accident adds one daily decision slot
through the existing weighted draw, retaining eligibility and recency rules.
The existing content-pool ceiling still applies; §4.4 expands that pool.

The title screen keeps its primary action above the mandate choices. The
selected rule is visible in the morning briefing and Brief me; the ending
names the origin. No new hidden numbers are displayed. See the review report
for regression fixes and measured changes; balance still needs playtesting.

### 4.4 Deck — BUILT AND OWNER-APPROVED

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

**As built, 2026-09-21 (later session):** `GameState.runDeck: string[]` and
`GameState.bannedCards: string[]`, plus a new `Effects.deck?: { add?:
string[]; remove?: string[] }` handled in `effects.ts`. `add` pushes a card
id into `runDeck`; `engine.ts`'s `cardWeight()` gives each copy held there a
flat weight bonus (`RUN_DECK_WEIGHT_BONUS`) on top of whatever the card's
own weight function already returns — "a growing share of what you see is
what you built," per the paragraph above. `remove` bans a card id into
`bannedCards`, checked first by both `cardWeight()` and the alert
equivalent, `alertWeight()`, and always returning 0 for a banned id —
banning wins even over held copies of the same id, and there is no
"un-ban." Both mechanisms only affect the ordinary weighted draw: a card
reached by `schedule`/`queueCard` from another card's own outcome still
arrives regardless, same as before this slice.

The existing 3-day recency gate in `cardWeight()` (no repeat within 3 days)
is NOT bypassed by the weight bonus — it still caps how often any card,
boosted or not, can appear (roughly once per 4 days, ~5 times in an 18-day
run). Measured in `deck.test.ts`: holding 3 copies of a card produces a
real, non-trivial lift in how often it is drawn across a run, not an
unlimited one — that ceiling is the intended shape, matching this project's
existing "no card repeats within 4 days" rule (`variety.test.ts`), not a
bug to relax later.

Shipped content: **8 new Back Room policies** in `content/shop.ts` using
`effects.deck` — 4 "add" (`sarran-standing-order`, `loz-standing-slot`,
`piek-standing-invite`, `adamek-open-line`) and 4 "remove"
(`automate-payroll`, `settle-with-gorsk`, `quiet-word-doran`,
`close-free-zone-file`), each targeting a real, already-repeatable card
from the existing pool (never a `base: 0, weight: () => 0` followup-only
card, which would silently do nothing). Plus the content quota above: **20
new standard cards** in a new file, `content/cards3.ts`, and **6 new
alerts** appended to `content/alerts.ts`, filling in three drivers that had
no alert at all before this slice — `scandal`, `corruption`, and `cult`.

Owner-played and bug-checked by a ChatGPT-based agent; approved. 93 tests
pass (up from 85), production build clean, all four Playwright tools green
at 1366×700 with zero page errors. `SAVE_VERSION` bumped 7→8 for
`runDeck`/`bannedCards`; prior in-progress runs reset. One balance signal
worth watching in further play: the 5 new alerts measurably raised alert
frequency in the balance probe (`avgAlerts` 8.5→10.9, `reachedMax`
40%→52% under the random policy) — flagged, not tuned blind, same as
mandates' balance was left for playtesting rather than guessed at.

### 4.5 Meta-progression — BOTH STEPS PLAYTESTED AND OWNER-APPROVED (last piece of Phase 2 — Phase 2 now complete)

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

**As built, step 1, 2026-09-21 (later session):** the owner asked what this
slice would be, then said to go ahead with the suggestion above. New file
`src/game/meta.ts`: `MetaProgress { version; runs: RunRecord[] }`, its own
localStorage key (`dictator-sandbox:legacy:v1`) and its own version
constant (`META_VERSION`) — deliberately separate from `GameState`/
`SAVE_VERSION`, exactly as this section specified. `recordRun(meta, s)` is
a pure function appending a `RunRecord` (day, act, mandate id, ending id/
kind/title, regime label, leader name, timestamp), capped at the last 50
runs; it does not persist itself, so the caller decides when to
(`App.tsx`, in a `useEffect` watching `game.ending`, guarded against
double-recording by comparing the ending object by reference — safe
because states clone rather than mutate, ground rule 3). The title screen
renders a one-line summary once at least one run exists (`TitleRecord` in
`Screens.tsx`).

**Nothing is gated — literally the suggestion above, taken as-is rather
than as a target to build past on the first attempt.**
`isMandateUnlocked()`/`isShopItemUnlocked()` exist in `meta.ts` as the hook
a step-2 slice will use, but both unconditionally `return true`; nothing
calls them from the mandate picker or the shop's stock roll yet. No new
content was needed (ground rule 5 holds) — the record only reads
`GameState`, it doesn't change what `content/mandates.ts`/`content/shop.ts`
offer. 7 new tests, 100 total; a new browser check, `tools/legacy.mjs`; all
green at 1366×700 with zero page errors.

**As built, step 2, same session — the owner's go-ahead:** the owner asked
what meta-progression would be (answered as above), then asked whether
minigames would fix a separately-flagged balance concern (no — that's
Phase 3's balance pass), then specified exactly where the unlock view
should live: *"Add it to a separate sub-menu within the advisors/deals tab
along with a button on the menu screen. That way users are able to see
their progress and can aim for specific goals to unlock certain cards."*
That's the explicit go-ahead this section's own "step 1 vs step 2" split
was waiting for.

`meta.ts` gains `computeUnlockStats(meta)` (runsCompleted/survived/
bestAct, pure, derived from `MetaProgress.runs`) and two plain-data rule
tables — the actual "locked-by-default content and real unlock
conditions" this section originally called for:

- `MANDATE_UNLOCKS`: `clean-hands` (finish 2 runs, any ending), `pay-deal`
  (reach Act 2 in any run) — the two mandates added after the original
  four (§4.3's "As built" note). The four base mandates are never gated.
- `SHOP_UNLOCKS`: `one-good-story` (survive one full run), `archivist`
  (finish 3 runs, any ending) — the Back Room's only two `rarity: 'rare'`
  items (content/shop.ts), already special by the writing rules' own
  "no downside" carve-out for that rarity.

`isMandateUnlocked()`/`isShopItemUnlocked()` now evaluate these for real.
`meta.ts` still imports nothing from `content/` — it stays a generic small
rules engine keyed by plain string ids; callers (`App.tsx`, `Screens.tsx`,
the new `Progress.tsx`) cross-reference those ids against
`content/mandates.ts`/`content/shop.ts` themselves.

**`GameState.unlockedShopItemIds: string[]`** (new field, `types.ts`) is a
**snapshot**, computed once in `state.ts`'s `createGame()` and never
re-evaluated mid-run: unlocking something by reaching Act 2 in the run
you're currently playing applies to your NEXT run's shop, not
retroactively to this one. `shop.ts`'s `eligible()` checks it when rolling
stock; `engine.ts`'s `buyShopItem()` ALSO independently checks it before
completing a purchase — the same "safety net, not the primary gate"
pattern `capBlockReason()` already established for the advisor/deal caps.
`state.ts`'s mandate roll and any explicit `mandateId` pick both respect a
new `NewGameOptions.unlockedMandateIds`, with a fallback to the full pool
if a filter would otherwise lock out every mandate (can't happen with
today's two-rule table, but the guard exists so a future rule can't brick
new-game creation). `SAVE_VERSION` bumped 8→9.

**New `src/ui/screens/Progress.tsx`** — `ProgressPanel` (the shared list:
"Your record", then Mandates, then Rare offers, each row showing Unlocked
or Locked plus the plain-language condition when locked) and
`ProgressScreen` (a standalone overlay, same visual language as
`ManageScreen`/`IntroScreen`, needing only `MetaProgress` — no live
`GameState` — so it works from the title screen before a run exists).
Reused in exactly the two places the owner's quote above specifies: a
"Roster"/"Unlocks" tab pair inside `Manage.tsx`'s "Advisors & Deals"
screen (reusing the `.seg`/`.seg-btn` segmented control already used for
the honorific picker), and a new "Unlocks" button on the title screen's
toolbar. The title screen's own mandate picker now filters `MANDATES` to
`isMandateUnlocked()` — a locked mandate isn't shown greyed-out, it simply
isn't in the list; the Progress screen is the one place "what's locked and
why" lives, matching the owner's explicit placement rather than
duplicating that information in the picker too.

**Verification:** 7 more new tests (107 total, up from 100) — real
unlock-condition coverage in `meta.test.ts`, the mandate-roll/pick gating
and its never-lock-out-everything fallback in `mandates.test.ts`, and the
shop's default-unlocked snapshot plus a locked item's absence from
`eligibleStock`/`rollStock` plus `buyShopItem()`'s independent refusal in
`shop.test.ts`. `tools/mandates.mjs` extended significantly: confirms only
5 mandate options (4 unlocked + "let fate decide") on a cleared-storage
fresh run with `clean-hands`/`pay-deal` entirely absent, seeds a 3-run
history satisfying every rule in both tables at once, reloads and confirms
all 7 options appear, actually selects and starts the previously-locked
`clean-hands` mandate (not just that its radio renders), and checks both
Unlocks access points — the title button and the in-game tab — agree
nothing is locked. Production build clean; all five Playwright tools green
at 1366×700 with zero page errors.

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
4. ✅ **DONE, OWNER-APPROVED.** Acts/confidence votes (§4.1) and both
   Back Room chunks (§4.2), including management, caps and day-in-act display.
5. ✅ **DONE, OWNER-APPROVED.** Mandates (§4.3), six origins.
6. ✅ **DONE, OWNER-APPROVED.** Run deck (§4.4) — `runDeck`/`bannedCards`,
   8 deck-affecting shop policies, 20 new standard cards, 5 new alerts.
7. ✅ **DONE, OWNER-APPROVED.** Meta-progression (§4.5) — step 1 is the
   cross-run record (`meta.ts`, `TitleRecord`); step 2 is real unlock
   conditions (`MANDATE_UNLOCKS`/`SHOP_UNLOCKS`) plus the Unlocks screen
   (`Progress.tsx`). This was the last piece of Phase 2 — it is now played
   and approved, so §4.1–§4.5 are entirely done. Phase 3 still needs its
   own explicit go-ahead before starting.

Steps 1–3 (done) answer "too much to track" and "more creative and fitting"
— the owner has now played that build and confirmed it. Steps 4–7 are the
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
   - Confidence-vote check (§4.1): **resolved in the shipped implementation**
     (Grip/Legitimacy average, 40/47/54 thresholds). Future presentation
     questions and Phase 3 sequencing are documented in §4.1a.
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
   **BUILT AND OWNER-APPROVED 2026-09-22 — see "Phase 3 step 1, as built"
   below.** Owner noted demands feel relatively rare; measured at ~1.4–2.1
   per run (first around day 6–9) and parked for the balance pass. The owner changed the presentation from "spawn a card" to
   pop-ups plus an expandable side panel, with Meet and a not-always-
   accepted bribe, and asked that an unmet ultimatum can end in a coup or
   another removal attempt, depending on standing and conditions.
2. **Character-driven events** (Milestone 3). Spawn a card when a
   character's `plotting` crosses a threshold. The data is already tracked;
   this is new spawn logic plus new cards.
   **BUILT AND OWNER-APPROVED 2026-09-22 — see "Phase 3 step 2, as built"
   below.** Triggered mainly by loyalty, not plotting alone (measured:
   plotting barely moves for most characters).
3. **Crisis chains** (Milestone 4). Multi-card escalating sequences — this
   pairs naturally with the act structure from §4.1 (a chain could span an
   act) and is worth revisiting with that structure in hand rather than
   against the old flat 30-day timeline.
   **BUILT 2026-09-22, AWAITING PLAYTEST — see "Phase 3 step 3, as built"
   below.**
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

**Vote reveal is built independently of Phase 3:** see §4.1a. The reusable
result/margin and presentation now exist, but no balance value was changed.
Use the exact recorded margins during Phase 3's later balance pass; if that
pass changes the formula or thresholds, the reveal will display the shared
calculation automatically. This does not start or reorder Phase 3 steps 1–3.

### Phase 3 step 1, as built — faction demands (2026-09-22)

**Owner spec:** demands are pop-ups, stored in a menu or on the side where
the player can expand them to see the faction, the details, an option to
meet the demand (if applicable), or a bribe for an extension that is not
always accepted; unmet demands can lead to a coup or other removal
attempts, depending on standing with the faction and other conditions.

**Rules** (`src/game/demands.ts`; words in `content/demands.ts`):

| Step | Rule |
|---|---|
| Issue | A visible faction with patience < 35, no live demand, off cooldown, from day 2. Least patient first; one per morning; at most 2 live. |
| Stages | Request → formal demand → ultimatum, 2 days each. Each escalation: that faction −4 support, −6 patience. A request drops if patience reaches 50. |
| Meet | Price × 1 / 1.25 / 1.5 by stage, plus the demand's side effects; +8 support, patience reset to at least 65; 4-day cooldown. |
| Bribe | ≈35% of the meet price, +50% per earlier bribe. Chance 10–90% from support, patience, stage and earlier bribes, shown only in words. Taken: pay, +2 days. Refused: free, −3 support, no retry until it escalates. |
| Ultimatum runs out | Attempt chance = ((55 − support)/55) × power × 1.3 (max 90%; zero when support ≥ 55). Success chance = 0.3 + (power − defence)/120 (10–75%). Success → that faction's ending. Failure → heavy hits, the faction loses 15 power. No attempt → a heavy but survivable punishment. 5-day cooldown. |

**Defence per faction** (what the pop-up lists as "What protects you"):
Army — Security's support, the security services, legitimacy. Security —
the Army's support, power, information. Elites — the elite, the economy,
legitimacy. Workers — public support, stability, the Street's support.
Street — the security services, Security's support, public support.

**Endings:** Army → `coup`, Elites → `elite`, Street → `revolution` (all
existing); Security → `sable-removal` and Workers → `general-strike` (new,
never picked by `checkEndings()` on their own).

**Presentation:** a light pop-up (not the dark Back Room look) for each new
demand, escalation, or lapse; a "Demands" rail panel with rows that expand
in place; a "Demands" masthead button opening the same list, because the
rail is hidden below 1080px. Nothing depends on hover.

**Measured balance (not tuned):** always-first-option play 100% → 90%
survival; random and always-last barely moved. Tuning belongs to step 4.

**Owner changes after approval (2026-09-22):** the masthead "Demands"
button was removed (pop-up + rail panel only), and the `concord` faction's
display label changed from "Money" to **"Elites"** — "Money demands" read
wrongly; "Money" now only ever means the treasury.

### Phase 3 step 2, as built — character-driven events (2026-09-22)

**Owner decisions:** events arrive as cards in the day, but with **their
own design and layout** (the owner wants variety between ordinary cards,
these, and future mini-games); both **betrayals and offers**; betrayals
**never end the run directly**.

**Why loyalty instead of plotting:** over 120 simulated runs per play
style, `plotting` rose past 40 for only Adamek and Kostyn; every
character's loyalty swung widely (e.g. Piek below 30 in ~60% of random
runs; Hess above 72 in every always-first run). So the trigger is mostly
loyalty, with plotting and grievances as extra routes in:

| State | Rule | Effect |
|---|---|---|
| Wavering | loyalty < 40, or plotting ≥ 40, or 2+ grievances and loyalty < 55 | Front-page warning in plain words; day recorded |
| Turning | loyalty < 30, or plotting ≥ 55, or 2+ grievances and loyalty < 45 | Betrayal card queued — only on a morning after the first warning |
| Devoted | loyalty ≥ 72 and plotting < 30 | Offer card queued |

One event per day at most, never two days running, none before day 3,
each card once per run, only for characters in post. Betrayals first
(least loyal first), otherwise one devoted character's offer (saved RNG).

**Content:** 13 characters × (warning + betrayal + offer) = 26 cards in
`content/characterEvents.ts`. Betrayal replies: confront, buy back,
remove/arrest/sack, or let it go (which raises that character's pressure:
coup for Varkov/Tern, leaks/scandal for Sarran/Doran/Loz, separatism for
Kostyn/Vask, unrest for Vel/Hess, foreign/fiscal for Brask/Piek, power for
Grebs, unrest for Adamek). Offers always carry a catch.

**Presentation:** `CharacterCardView` — a light "private file": manila tab
with a rotated stamp, portrait column in the character's accent colour
with where they stand in words, a typewriter memo body, and reply slips
in a two-column grid. Same `.doc`/`h1`/`.opt` hooks as ordinary cards.

**Measured (not tuned):** ~4 events per run (random), ~5 (always-first,
mostly offers), ~2 (always-last, mostly betrayals); first around day 4–5.

### Phase 3 step 3, as built — crisis chains (2026-09-22)

**Five chains**, each tied to a hidden pressure measured to actually climb
in real play (120 simulated runs per play style): The Bread Riots
(unrest), The Free Zone Ledger (corruption), The Kordiva Referendum
(separatism), The Ostrene Gas Cutoff (foreign), The Stairwell Tapes
(scandal). No coup chain yet: coup pressure reaches 40 in only 3–15% of
runs — a balance-pass item.

| Rule | Value |
|---|---|
| Start | day ≥ 4, no chain running, 3-day cooldown over, pressure ≥ `startAt` (45; tapes 50); most over-threshold wins |
| Stages | 3 — it starts / it spreads / it comes to a head; 2 days apart; each only after the previous card was played |
| Branching | stages 2 and 3 have `calm` and `hot` versions; `hot` if `flags['crisis:<id>']` < 0 |
| Early end | an option sets `flags['crisisEnd:<id>']` |
| Limits | one at a time; each once per run; no direct endings; no random rolls |
| Record | `crisesDone`, a log line, and a `bigMoments` line for the end-of-run summary |

**Presentation:** `CrisisCardView`, the "situation room" — the third
distinct card design after the lead story and the character "private
file": red crisis band with a three-step tracker, the stage story beside a
situation log (earlier stages and what you ordered), "so far: holding /
getting worse" in words, and the options as numbered orders side by side.
The front page and desk show the running crisis and when the next stage is
due.

**Measured (not tuned):** ~1 chain per run, in 78–95% of runs, first
around day 7–12; play style decides which chains you meet.

### Phase 3 step 4 — the balance phase (in progress, 2026-09-23)

The owner started it with five points and one goal (verbatim in
`PROJECT_STATUS.md`). Split into three slices, each playtested:

**Slice A — feel and clarity (playtested and approved).**
- A private file every day from day 2: 13 new "request" cards (one per
  character) join betrayals and offers; priority betrayal → offer →
  request. Measured: 96–100% of days.
- Crisis stages open in their own full-screen dark "situation room" scene
  (owner: "an underground hidden situation room"), always first in the day.
  The second dark screen after the Back Room, both owner-requested.
- Favours are aimed at a named scandal, a demand or a running crisis
  (`use.targets`), say when they are useful, are disabled with a reason
  when there is nothing to aim at, and end with a receipt naming what went
  away.

**Slice B — difficulty (playtested and approved).** Triggered by the
slice A playtest: factions near zero did nothing, and the owner passed the
final vote at "100%" with the Elites hostile, the Street furious and the
treasury at -$20.3B.
- Option order shuffled per run (`orderedOptions()`, seeded by run + card,
  nothing stored). Always-first: 91% → 1% survival.
- Hostile factions (loyalty < 20, the bottom mood) act every morning —
  one pop-up, then a rotating action from `HOSTILE_ACTIONS` (money out,
  leaks, strikes, protests, coup plotting), on the front page and desk —
  and demand at once.
- The confidence vote counts five faction blocs (100 seats); each follows
  its faction's mood (60%) plus Grip and Legitimacy (40%); hostile blocs
  vote against as one; debt costs votes everywhere; 45 / 58 / 68 needed.
  The reveal counts bloc by bloc. **This replaces the old "average of Grip
  and Legitimacy vs 40/47/54" rule.**
- Rebalance in upkeep only: relation spill 0.12 → 0.25, fading goodwill
  above loyalty 60, support drifts toward Street/Workers, "Pensions &
  subsidies" +$0.06B/day per day in office, taxes 1.6 → 1.2 × economy,
  army loyalty < 45 feeds coup pressure, demands from patience < 45.
- Measured (120 runs): careful 62%, random 4%, first/last 1%. Demands ~2.5
  per full run. Not done: a coup crisis chain; no card edits.

**Slice C — consequences (playtested and approved; Phase 3 complete).** 18 marks left by
existing decisions (flags `mark:<id>` = the day) and 36 reactions on later
cards (`content/consequences.ts`): unlock a new option, lock one with a
reason, or change one's outcome. Every reaction is shown as "Because you …
(day N)" on the option and in the result; a decision that makes a mark says
"On the record", and the rail lists them. No card file edited: reactions
are keyed by card and option id. About 5.7 reacting cards per run; careful
survival 62% → 67%. `SAVE_VERSION` 13→14.

The original step-4 list (items 1–4 addressed by slice B; 5 unchanged):

The last piece of Phase 3. Everything above was measured, not tuned:
1. "One option every time wins": always-first play survives ~90–92%.
2. Demands feel rare (owner): ~1.5–2 per run, first around day 6–9.
3. Coup pressure barely rises, so the coup ending is rare and there is no
   coup chain; feed it, then add a coup chain as content.
4. Confidence-vote thresholds (40/47/54) against the new pressure —
   random-play survival fell ~51% → ~42% over Phase 3.
5. Pacing of crises (~1/run) and character events (~4/run).

### Phase 4 — Mobile / iOS readiness (NEXT, as a mobile WEB version — see `docs/MOBILE_AND_HOSTING.md`)

**2026-09-23 update:** the owner wants to play on their phone and share with
family for free, so Phase 4 is next, but as a responsive **web** layout
hosted on GitHub Pages, not Capacitor/native. The brief, status and scope
are in `docs/MOBILE_AND_HOSTING.md`. The original note below is kept for
history:

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

**2026-09-23: no longer deferred.** It is next, as a mobile web version on
free GitHub Pages hosting; see `docs/MOBILE_AND_HOSTING.md`. The guidance
below still applies. In particular, the engine separation it asked to
preserve is intact, which is why this is layout work only.

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

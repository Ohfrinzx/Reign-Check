# REIGN CHECK

*(development codename: Dictator Sandbox)*

A card-driven political leadership simulation set in the fictional **Republic
of Velmorra** — lithium mines, a container port, an offshore banking zone,
seven factions that all want something, and a national pigeon federation that
can get more people into the street than either opposition party.

Krast is dead. You are the new **Executive Chair**. Choose one of six
mandates — how you took power — or let fate decide. Each changes your
starting position and gives you a rule for the whole run.

Survive **three acts of six days**, each ending in a confidence vote.

## Play

**Strategy-balance playtest:** changes on `codex/strategy-balance` are not on
GitHub Pages yet. See [the strategy guide](docs/STRATEGIES.md) for local
playtest commands, routes and evidence. The owner approves before merging.

### On your phone or computer — just open the link

**https://ohfrinzx.github.io/Reign-Check/** (the capital letters in
`Reign-Check` matter). It is published automatically from the default
branch. On a phone, use the browser's **Add to Home Screen** (Safari: Share
→ Add to Home Screen; Chrome: ⋮ → Add to Home screen) to get an icon that
opens it like an app. Saves stay in that browser on that device.

On a phone: the ☰ button holds Brief me, Advisors & Deals and the main
menu; the strip of five faction bars opens your **Files** (factions,
demands, what's on your desk, favours, diary); the red bar at the bottom
is always the way on.

### In the browser, no install (GitHub Codespaces)

On the repository page: **Code → Codespaces → Create codespace on
claude/confident-meitner-lc0bgc**. Dependencies install automatically. When the
terminal is ready, run:

```bash
npm run dev
```

A pop-up offers to open the forwarded port — click **Open in Browser**.

### Locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

- The number keys choose the option with that number (the order changes every run), `Enter` / `Space` continues. Mini-games say their own keys on their how-to screen.
- Your run autosaves to browser storage. Refreshing will not destroy it.

## What it is

Each **day** has three to five stages (one more with The Accident). Each stage deals you a **card**: a
minister with a request, a crisis, an offer, a number written on a card and
slid across the desk. You pick an option. It changes your Money, Grip, Legitimacy and faction standing —
and schedules something for a later day that you will have forgotten about by
the time it arrives.

The treasury is in dollars and it is also, in practice, your money. Options
that cost money say so. Some decisions create a permanent budget line: a pay
rise does not happen once, it happens every day. The morning briefing’s **budget** shows
exactly where the money goes and how long you have before the account is empty.

At unpredictable moments a **BREAKING ALERT** takes over the screen. Alerts are
not random: each one is driven by a hidden pressure your own decisions have
been building. Underfund the army often enough and an order will come back
marked *requires clarification from the General Staff*.

There are no government types to choose. The kind of government you ran is
**named at the end**, from what you actually did.

Most days, one stage is a **mini-game** instead of a card: read the 7pm
Bulletin, calm Bread Lines, shred the ledger, catch the mole, split the
budget, fly a pigeon, solve the Stairwell files, haggle with the
ambassador. Each act opens with Walk in the Weather, and a coup attempt is
played out as Hold the Palace. Win or lose, the result moves your numbers
like any decision. Each one has a practice link:
`https://ohfrinzx.github.io/Reign-Check/?practice=<name>` (bulletin,
bread, kilometre, shred, palace, mole, budget, pigeon, stairwell,
ambassador; add `&act=3` for the hardest).

A **Brief me** button in the top bar explains who you are, who everyone else
is, and how you can lose, at any point.

The **Back Room** opens each night: buy advisors, policies, favours and
deals. Ordinary nights allow one purchase; after a confidence vote you can
buy more. Every offer states its price and catch.

Every run you finish is kept: the title screen shows how many
administrations you've run and how they ended. Two mandates and two rare
Back Room offers unlock by playing — finish enough runs, or reach far
enough into one, and they join the pool for good. An **Unlocks** screen
(from the title screen, or a tab inside Advisors & Deals) shows exactly
what's still locked and what it takes.

## Verification

```bash
npm test
npm run build
npx playwright install chromium   # once, if you have no Chromium
npm run test:browser
```

The browser suite starts Vite and tests at 1366×700, plus the phone layout
at phone, tablet and landscape sizes (`tools/phone.mjs`). For a custom Chromium
binary, set `PLAYWRIGHT_EXECUTABLE_PATH`. Screenshots go to the OS temporary
directory under `reign-check-shots`; set `REIGN_SHOTS` to override it.
Save version 14 replaces earlier in-progress runs (the cross-run record is kept).

## Notes

Velmorra, its factions, its ministers, its neighbours and its pigeons are
entirely fictional. Any resemblance to a real republic is a coincidence the
Sable Office would like to discuss with you.

**For developers and agents:** start with **[AGENTS.md](AGENTS.md)** (rules,
workflow, code map), then **[PROJECT_STATUS.md](PROJECT_STATUS.md)** (where
things stand) and **[docs/SYSTEMS.md](docs/SYSTEMS.md)** (how each system
works). **The strategy-balance branch is awaiting playtest. Its routes and evidence are in [docs/STRATEGIES.md](docs/STRATEGIES.md); tuning numbers and the change log are in [docs/BALANCE.md](docs/BALANCE.md).**
The phone layout and GitHub Pages hosting are in
**[docs/MOBILE_AND_HOSTING.md](docs/MOBILE_AND_HOSTING.md)**; the
mini-games record is **[docs/MINIGAMES.md](docs/MINIGAMES.md)**.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm test` | Unit and simulation tests (200 full runs, content integrity, determinism, mini-game rules) plus the balance probe (prints survival rates; asserts nothing) |
| `npm run test:browser` | Real-browser checks of every screen at 1366×700, and the phone layout |

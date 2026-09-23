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

- `1`–`4` choose the option with that number (the order changes every run), `Enter` / `Space` continues.
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
npx playwright install chromium
npm run test:browser
```

The browser suite starts Vite and tests at 1366×700. For a custom Chromium
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
works). A mobile web version on GitHub Pages is the next job — see
**[docs/MOBILE_AND_HOSTING.md](docs/MOBILE_AND_HOSTING.md)**.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm test` | Simulation tests: 200 full runs, content integrity, determinism |
| `npm run test:browser` | Real-browser checks of every screen at 1366×700 |

# REIGN CHECK

*(development codename: Dictator Sandbox)*

A card-driven political leadership simulation set in the fictional **Republic
of Velmorra** — lithium mines, a container port, an offshore banking zone,
seven factions that all want something, and a national pigeon federation that
can get more people into the street than either opposition party.

The man who ran the country for nineteen years died in a stairwell nine days
ago. You were his deputy. It was a job nobody wanted and nobody watched, which
is exactly why you are still alive and now in charge.

You are the **Executive Chair**. Parliament votes on confirming you in thirty
days. Nobody thinks you will get there.

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

- `1`–`4` choose an option, `Enter` / `Space` continues.
- Your run autosaves to browser storage. Refreshing will not destroy it.

## What it is

Each **day** has three to five stages. Each stage deals you a **card**: a
minister with a request, a crisis, an offer, a number written on a card and
slid across the desk. You pick an option. It changes your ten visible stats —
and schedules something for a later day that you will have forgotten about by
the time it arrives.

The treasury is in dollars and it is also, in practice, your money. Options
that cost money say so. Some decisions create a permanent budget line: a pay
rise does not happen once, it happens every day. The **Treasury** panel shows
exactly where the money goes and how long you have before the account is empty.

At unpredictable moments a **BREAKING ALERT** takes over the screen. Alerts are
not random: each one is driven by a hidden pressure your own decisions have
been building. Underfund the army often enough and an order will come back
marked *requires clarification from the General Staff*.

There are no government types to choose. The kind of government you ran is
**named at the end**, from what you actually did.

A **Brief me** button in the top bar explains who you are, who everyone else
is, and all six ways to lose, at any point.

## Notes

Velmorra, its factions, its ministers, its neighbours and its pigeons are
entirely fictional. Any resemblance to a real republic is a coincidence the
Sable Office would like to discuss with you.

See **[PROJECT_STATUS.md](PROJECT_STATUS.md)** for architecture, current
milestone, known limitations and the development handover.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm test` | Simulation tests: 200 full runs, content integrity, determinism |

# DICTATOR SANDBOX

A card-driven political leadership simulation set in the **Republic of
Velmorra** — a fictional salt republic on a bad-tempered sea, with seven
factions, thirteen ministers, a currency held together by optimism, and a
national pigeon federation with more mobilising capacity than two of its
political parties.

Marshal Krast is nine days dead. You were his Vice-Chairman of the Council,
which nobody thought was an important job, including you.

## Play

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

- `1`–`4` choose an option, `Enter` / `Space` continues.
- Your run autosaves to browser storage. Refreshing will not destroy it.

## What it is

Each **day** has three to five stages. Each stage deals you a **card**: a
minister with a request, a crisis, an opportunity, a number written on a piece
of paper and slid across a desk. You choose. The choice changes your ten
visible statistics — and schedules something for a later day that you will have
forgotten about by the time it arrives.

At unpredictable moments a **BREAKING ALERT** interrupts the day. Alerts are
not random: each one is driven by a hidden pressure that your own decisions
have been feeding. Cut military spending often enough and an order will come
back marked *requires clarification from the General Staff*.

There are no government types to choose. The regime you end up running is
**named at the end**, from what you actually did.

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

# Mobile and hosting — handover for the next agent

> **2026-09-24: PLAYTESTED ON THE OWNER'S PHONE AND APPROVED** — *"Playtested on my phone, everything works now"*
> (after three fixes from the first phone playtest, in §0).
>
> **2026-09-23 (later): BUILT.** The deploy workflow, the Home Screen
> polish and the phone layout are built and verified; see **§0 As built**
> right below. The rest of this file is the original brief, kept because
> §2 (how the owner runs it) and the troubleshooting notes still apply.
> Where the brief's draft and §0 disagree, §0 is what shipped.

**Written 2026-09-23, at the end of Phase 3; checked again after balance
slice D.** Read this after `AGENTS.md`, `PROJECT_STATUS.md` and
`docs/SYSTEMS.md`. It is the brief for the next piece of work. The owner
is starting a new agent session for it. Slice D (factions remember) added
memory lines under each faction on the Files rail, which the phone layout
must show too.

## 0. As built (2026-09-23)

Owner decisions, answering the brief's open questions: **build everything,
then one merge** (so the first public version already works on phones);
**add Home Screen polish**; **factions as an always-visible strip plus a
Files drawer**; **tablets get the phone layout**; **CI runs the unit tests
before every deploy**.

**Hosting**
- `.github/workflows/deploy.yml`: every push to
  `claude/confident-meitner-lc0bgc` runs `npm ci`, `npm test`, `npm run
  build`, then publishes `dist/`. A failing test stops the deploy. Newer
  action versions than the draft in §4 (checked against each action's git
  tags and release notes): checkout@v7, setup-node@v7 (Node 22),
  configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5, plus
  `actions: read` (deploy-pages v4+ release notes ask for it).
- **Bug fixed that the brief missed:** `public/fonts/fonts.css` loaded the
  fonts from `/fonts/…` (the site root). Under `/Reign-Check/` every font
  would have 404'd. The URLs are now relative.
- **Home Screen:** `public/manifest.webmanifest` (standalone, cream
  background, near-black theme), icons in `public/icons/` (192, 512 also
  used as "maskable", 180 apple-touch-icon) drawn by
  `tools/make-icons.mjs`, and the iPhone/Android meta tags in `index.html`
  (`viewport-fit=cover`, so the bottom bar can pad for the home indicator).
- `tools/pages-preview.mjs` serves the build from `/Reign-Check/` and checks
  no request fails, all five fonts load, the manifest and icons are served,
  and a game starts. It fails with the old font paths (tested).

**Phone layout** (everything at 1080px and narrower; tablets included)
- **Masthead:** name + act/day chip + a ☰ button on one row; Brief me,
  Advisors & Deals and Main menu live in the ☰ menu. Money / Grip /
  Legitimacy sit on their own full-width row, always visible; tapping one
  explains it (`Ledger.tsx` now opens on hover for a mouse only, since a
  tap fired hover-then-click and closed it at once).
- **Faction strip** (`FactionStrip.tsx`) under the strap: five mini bars
  (same length/colour as the rail), hostile factions in red, a red count
  of live demands, and "Files ›". Tapping it opens the **rail as a
  drawer** (`Rail.tsx` `open`): factions with their memories, Demands (meet
  / bribe work in it), On your desk, Back Room favours, Diary, On the
  record, Standing costs. Close ✕, a tap outside, or Escape closes it.
- **Bottom button:** the strap's primary action ("Begin the day →",
  "Continue →", "To the Back Room →") is a compact red button (48px tall,
  at most 460px wide, centred) floating just above the bottom of the
  screen. **It sits ABOVE the bottom safe area, never padded into it:**
  iPhone Safari's floating toolbar counts as the safe area, and the first
  version (a full-width bar padded by `env(safe-area-inset-bottom)`) grew
  to ~126px on the owner's iPhone and turned Safari's toolbar red. A
  desktop browser shrunk to phone size reports a safe area of 0, so only
  a real iPhone showed it; `tools/phone.mjs` now emulates it (CDP
  `Emulation.setSafeAreaInsetsOverride`, 80px) as the `iphone-safari` size.
  While it shows, result cards (ordinary and breaking-alert) hide their own
  Continue, so there is one way on (owner request); `phone.mjs` fails any
  screen with two visible Continue buttons.
  Scroll areas reserve room for it only while it shows (`.app.has-bar`).
  Screens without it keep their way on in reach: the ending's buttons,
  the vote's button, the situation room's "Leave…", and the Close of Brief
  me / Advisors & Deals / Unlocks stick to the bottom.
- Front page one column; Back Room held slots stack under the offers;
  Advisors & Deals rows stack; cards, results and dialogs full width with
  slimmer margins; touch targets ≥ 44px; "or press Enter" hidden on touch
  screens; Brief me says "in your Files" instead of "on the right".
- **Strap news ticker + live dot** (owner request, 2026-09-24): when the
  strap's note ("Nothing urgent on the board…") is cut off on a phone, it
  scrolls right-to-left like a news ticker (`StrapNote.tsx`: two copies,
  seamless loop at ~45px/s, 1.5s pause first, faded edges); if it fits it
  stays still. The status dot on the QUIET/WATCHFUL chip blinks slowly
  (cream when quiet); TENSE/CRITICAL keep their faster pulse. With "reduce
  motion" on, neither animates and the note wraps to two lines. Desktop
  keeps the plain line.
- **Landscape phones** (short screens) get a one-row masthead with the
  ledger inline, no strap note or mood words, and a slimmer bar.
- **No game logic changed** (`src/game/` untouched), **no `SAVE_VERSION`
  bump**. Both dark screens keep their look.

**Proof desktop did not change:** `tools/desktop-snap.mjs` screenshots 20
screens (title, front page, card, result, private file, alert, night, both
Back Rooms, vote, situation room, demand pop-up, Brief me, Advisors &
Deals, Files, favour dialog, ending…) at 1366×700 and 1100×700 and compares
them pixel by pixel with pictures taken before any change: all 40
identical. (It caught one thing: wrapping existing text in a span shifts
glyphs by a sub-pixel, so wording that differs on a phone is built as one
plain string — see `src/ui/useMedia.ts`.)

**Phone check:** `tools/phone.mjs` (in the default browser suite) runs the
same 20 screens at 390×844, 360×800, 768×1024, 844×390 and 390×844 with
an iPhone-Safari-sized bottom safe area, with touch (the primary action
must also clear the safe area, and the bottom button stay ≤ 56px):
nothing sticks out sideways, the primary action is on screen, not covered
and ≥ 40px tall; then the menu, ledger, strip, drawer and touch hints; then
two days played by tapping only.

**Still only the owner can check:** the live site on a real phone (the
sandbox cannot open `*.github.io`), "Add to Home Screen" on iPhone and
Android, and how iPhone treats saves for a Home Screen app (see §2.6).

## 1. What the owner wants, in their words

> "I am wanting to play this on my phone and maybe share with family. I
> don't want to pay to host or publish obviously as this is just a small
> side project for fun."

> "I really don't care if it's switched to a public repo as I am never
> going to share or promote it."

So the goal is **a free, link-based web version that works on a phone**. It
is not a native app and not an App Store release. Family members open a
link. Nobody pays for anything.

## 2. How the owner will run it on a phone (the plan)

1. **Hosting: GitHub Pages**, GitHub's free static-site hosting. The game is
   a static site: `npm run build` produces `dist/`, which is plain
   HTML/JS/CSS/fonts. There is no server and no database.
2. **Address:** `https://ohfrinzx.github.io/Reign-Check/`. The path is
   case-sensitive. Pages lowercases the owner in the host name. Confirm
   the exact URL in Settings → Pages once the first deploy has run.
3. **Publishing is automatic.** A GitHub Actions workflow (not written yet —
   see §4) builds and deploys on every push to the default branch,
   `claude/confident-meitner-lc0bgc`. That is the branch every agent
   already merges into after verification (`AGENTS.md` §10), so **every
   approved merge goes live on its own**.
4. **On the phone:** open the link in Safari (iPhone) or Chrome (Android).
   Use **"Add to Home Screen"** so it gets an icon and opens like an app.
5. **Saves are per device and per browser** (`localStorage`: the run save
   in `save.ts`, and the cross-run record in `meta.ts`). There are no
   accounts and no sync. Each family member has their own games.
6. **Things that will surprise a family member (tell the owner if asked):**
   - A `SAVE_VERSION` bump (`state.ts`) resets any in-progress run on every
     device the next time it loads. The cross-run record and unlocks
     survive, because they use their own key and version (`meta.ts`).
     Agents already report bumps; the owner may want to warn family.
   - Clearing the browser's site data deletes the saves.
   - iPhone Safari may delete a website's stored data if the site isn't
     opened for about a week. A Home-Screen web app is treated
     differently. This is from memory, not verified this session. The
     WebKit write-up is here:
     https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
   - After an update, a phone may briefly show the old version. Closing and
     reopening the tab, or pulling to refresh, fixes it.

## 3. Setup status: what is done and what is not

| Step | Status | How it was checked |
|---|---|---|
| Repo made **public** (owner, Settings → General → Change visibility) | **Done** | GitHub API reports `"visibility": "public"`, `"private": false` |
| **Pages** turned on with **Source: GitHub Actions** (owner, Settings → Pages) | **Done per the owner.** `has_pages: true` confirmed | The API reports `"has_pages": true`. The Pages settings endpoint is blocked from the cloud sandbox, so "Source: GitHub Actions" is the owner's word |
| Workflow file `.github/workflows/deploy.yml` | **Built** (§0) | `npm ci` + `npm test` + build run locally; `tools/pages-preview.mjs` serves the build from `/Reign-Check/` |
| First deploy / live site | **Runs on the first merge into the default branch** | The owner checks the Actions tab and the live link — the sandbox cannot |
| Phone layout | **Built** (§0) | `tools/phone.mjs` (4 sizes × 20 screens + tap-through); desktop unchanged per `tools/desktop-snap.mjs` |

**Decided by the owner (2026-09-23): phone layout first, one merge** (§0). The options were:
- **Publish now:** the link works on a PC today, and phones work once the
  layout slice lands. Updates go live on each merge anyway.
- **Phone layout first:** the first version anyone sees works on both.
  This was the previous agent's recommendation, because family will open
  it on phones.

(Kept for history.)

**Cloud-sandbox limits the next agent will hit:**
- The egress proxy blocks `*.github.io`, `docs.github.com` and
  `developers.cloudflare.com`, and the GitHub API's `/pages` path is blocked
  too. `https://api.github.com/repos/Ohfrinzx/Reign-Check` works, and shows
  `visibility`, `has_pages` and `default_branch`. The Claude Code Remote
  `list_repos` tool shows visibility as well.
- So **the agent cannot open the live site itself. The owner must check
  it**, on a phone and on a PC. Say so plainly rather than claiming it
  works.
- Workflow run status may be readable through the GitHub MCP tools
  (`mcp__github__actions_list` / `actions_get` / `get_job_logs`). If not,
  ask the owner to open the repo's **Actions** tab.

## 4. The deploy workflow (original draft — superseded by §0)

A draft, from memory, not verified this session. Check the action
versions against GitHub's docs (links below) before relying on it:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [claude/confident-meitner-lc0bgc]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Notes:
- **`vite.config.ts` already has `base: './'`** (relative asset paths), so
  the build works under `/Reign-Check/` with no change. Fonts are in
  `public/fonts/` and are copied into `dist/` as-is.
- `npm test` in CI stops a broken build from going live. The balance probe
  test takes about a minute, which is fine. The Playwright browser checks
  are **not** in CI. They stay part of each agent's local verification.
- `npm ci` needs `package-lock.json` committed. Check it is there.
- There is no client-side router (one page, state-driven), so the SPA
  404-fallback trick is not needed.
- Sources to check: GitHub Pages overview and plans
  https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages ·
  custom workflows
  https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages ·
  Vite static deploy guide https://vite.dev/guide/static-deploy

**If the live site misbehaves:**
- **404:** the workflow has not run or failed (Actions tab), or Pages
  source is not "GitHub Actions".
- **Blank page:** open the browser console. It is usually an asset path;
  confirm `base: './'` is still set.
- **Old version showing:** caching. Refresh or reopen.
- **"My game reset":** a `SAVE_VERSION` bump, by design.

## 5. The phone layout — measured starting point

Measured 2026-09-23 with `tools/phone-audit.mjs` at 390×844 (iPhone size,
touch, 2×). Screenshots go to `<OS temp>/reign-check-shots/ph-*.png`.

**Works already:**
- The title screen.
- The confidence-vote screen (checked at 390px by `tools/vote.mjs`).
- The demand pop-up (checked below 1080px by `tools/demands.mjs`).
- The card text and option buttons read well at phone width.

**Broken:**
1. **The masthead overflows and is clipped.** The name block wraps into
   four lines. "Brief me", "Advisors & Deals" and "Menu" are cut off the
   right edge, and **the Money / Grip / Legitimacy ledger is not visible
   at all**. There is no way to reach the menu on a phone.
2. **The front page's columns overlap.** The schedule, the mandate box
   and the budget draw on top of each other and are unreadable.
3. **The result screen is 82px wider than the phone.** Its Continue button
   is off-screen (the audit shows `overflowX: 82`, `onScreen: false`).
   "or press Enter" is shown on a touch device.
4. **The whole right rail is hidden below 1080px** (`.rail{display:none}`
   in `src/styles/index.css`). On a phone the player cannot see the
   **faction bars and what each faction remembers**, Demands panel, On your desk, the Back Room favours
   panel, the Diary, or On the record. The factions decide the confidence
   vote and hostility since balance slice B, so **this is the most
   important gap**, not a cosmetic one.
5. The strap under the masthead wraps badly (status, stage and item
   count, a long italic line, and the primary button squeezed into ~390px).
6. The Back Room hides its held-slots panel below 1080px
   (`.held-panel{display:none}`). Firing or cutting to free a slot is then
   impossible inside the shop.

Not yet looked at on a phone (check them):
- the situation room (`.app.situation-room`);
- the Back Room;
- Advisors & Deals (`Manage.tsx`), Unlocks (`Progress.tsx`) and Brief me
  (`Intro.tsx`);
- the favour dialog;
- the ending screen;
- the character "private file" and crisis card layouts, whose side-by-side
  reply slips and orders will need to stack.

**Existing breakpoints in `index.css`:** 1180px (masthead tightening),
1080px (rail and held-panel hidden, main goes one column), 800px, 760px,
620px. The viewport meta tag is already correct (`index.html`).

## 6. Suggested scope for the mobile slice

This is `docs/DESIGN_V2.md` Phase 4, but as a **mobile web** layout, not
Capacitor or native. §10 there already predicted it: "the right rail and
multi-column layout need a real stacked/mobile treatment, not just shrink
it."

Build it the project's usual way: one vertical slice, the smallest
testable piece, then stop for the owner's playtest. Suggested pieces:

1. **Masthead → compact phone bar:** the leader's name on one line, the
   act/day chip, and the three resources as a compact ledger that is
   always visible. Brief me / Advisors & Deals / Menu go behind one menu
   button.
2. **Rail → a "Files" drawer or bottom sheet** reachable from a
   fixed button, with the faction bars at least summarised on the main
   screen (e.g. a slim five-dot strip), because they drive the vote.
3. **Front page → single column.**
4. **Cards, results, dialogs → full width.** The character reply slips
   and crisis orders stack vertically. Hide "or press Enter" and other
   keyboard hints on touch (`@media (hover: none)`).
5. **Primary action always reachable (ground rule 9):** on a phone, a
   sticky bottom action bar is the natural home for "Begin the day" /
   "Continue".
6. **Touch targets at least ~44px.**
7. **The Back Room held panel** stacks below the offers instead of
   disappearing.
8. **Both dark screens** (the Back Room and the situation room) keep
   their look. Do not darken anything else (owner rule).

**Guardrails:**
- Desktop at **1366×700 must not change**. The whole existing browser
  suite runs at that size and must stay green.
- Phone rules go inside `@media` blocks.
- No game logic changes: everything in `src/game/` stays untouched (ground
  rule 11). This is CSS plus small component changes in `src/ui/` and
  `App.tsx`.
- No new hover-only information (ground rule 11 / DESIGN_V2 §10).
- Options still go through `orderedOptions()` (ground rule 12).
- No `SAVE_VERSION` bump should be needed. Layout is not `GameState`.

**Verification to add:**
- Turn `tools/phone-audit.mjs` into a real check: assert no horizontal
  overflow against `screen.width` and the primary action on screen, for
  every main screen. Add it to `run-browser.mjs`'s default list.
- Also check 360×800 (small Android) and 768×1024 (tablet).
- Use `screen.width`, not `innerWidth`: with mobile emulation the layout
  viewport silently widens to fit too-wide content, which hides overflow.
  This caught the first version of the audit.
- Keep measuring layout only after the ~0.42s card rise-in animation
  (`waitForTimeout(500)`).

## 7. After the mobile slice

- **Mini-games** (Phase 5, needs the owner's go-ahead). Build them
  mobile-first once the layout exists, and give each its own look (the
  owner wants visual variety between card types).
- **Small follow-ups the owner may ask for:** a coup crisis chain;
  consequences (balance slice C) reacting to demands and Back Room items;
  more "locked" reactions.
- **A native app or App Store listing is out of scope.** The owner does not
  want to pay, and Apple charges a yearly developer fee. That is from
  memory — see https://developer.apple.com/programs/

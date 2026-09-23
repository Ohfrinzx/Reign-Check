/**
 * SCENES — reach every main screen of the game from a fixed seed, so the
 * same picture comes out every time. Shared by:
 *   - tools/desktop-snap.mjs (desktop before/after pixel comparison), and
 *   - tools/phone.mjs (phone/tablet layout checks).
 *
 * Each scene builds a GameState in the page through the real engine (never
 * by poking the DOM), saves it, reloads and presses "Continue", then opens
 * whatever overlay the scene is about. The helpers `openMenuItem` and
 * `openFiles` work on both layouts: on desktop the masthead buttons and the
 * rail are already on screen; on a phone they sit behind the ☰ menu and the
 * Files drawer.
 */
export const BASE = 'http://127.0.0.1:5173/';

/** Build a state in the page (by recipe name), save it and resume it. */
async function seed(page, recipe) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async (recipe) => {
    localStorage.clear();
    const st = await import('/src/game/state.ts');
    const en = await import('/src/game/engine.ts');
    const { saveGame } = await import('/src/game/save.ts');
    const { computeConfidenceVote } = await import('/src/game/content/endings.ts');

    // One step of "always pick the first usable shown option" play.
    const step = (s) => {
      switch (s.phase) {
        case 'briefing': return en.beginStages(s);
        case 'stage':
        case 'alert': {
          const card = en.activeCard(s);
          const opt = en.orderedOptions(s, card)
            .find((o) => o.because?.kind !== 'lock' && (!o.enabled || o.enabled(s)));
          return en.chooseOption(s, opt.id);
        }
        case 'resolve': return en.continueAfterResolve(s);
        case 'alertResolve': return en.continueAfterAlert(s);
        case 'night': return en.openShop(s);
        case 'shop': return en.leaveShop(s);
        case 'vote': return en.completeConfidenceVote(s);
        default: return s;
      }
    };
    const playUntil = (s, pred) => {
      for (let i = 0; i < 3000 && !pred(s) && s.phase !== 'ended'; i++) s = step(s);
      if (!pred(s)) throw new Error(`scene ${recipe}: condition never reached`);
      return s;
    };
    const fresh = (seedNo = 4) =>
      en.prepareDay(st.createGame({ seed: seedNo, leaderName: 'Adrin Vo', mandateId: 'accident' }));
    const calm = (s) => {
      for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
      for (const f of Object.values(s.factions)) { f.patience = 80; f.loyalty = 50; }
      for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
      return s;
    };
    const tagged = (s, tag) => en.activeCard(s)?.tags?.includes(tag);
    const votingState = () => {
      const s = st.createGame({ seed: 20260922, leaderName: 'Adrin Vo' });
      s.day = 6; s.act = 1; s.phase = 'vote';
      Object.assign(s.stats, { power: 62, security: 58, military: 54, information: 66, legitimacy: 61, support: 57, stability: 59 });
      for (const f of Object.values(s.factions)) f.loyalty = 60;
      s.factions.concord.loyalty = 12; // one hostile bloc, so the board shows both kinds of seat
      s.confidenceVote = computeConfidenceVote(s);
      return s;
    };

    const recipes = {
      briefing: () => fresh(),
      privateFile: () => playUntil(fresh(), (s) => s.phase === 'stage' && tagged(s, 'character-event')),
      alert: () => playUntil(fresh(), (s) => s.phase === 'alert'),
      night: () => playUntil(fresh(), (s) => s.phase === 'night'),
      shop: () => playUntil(fresh(), (s) => s.phase === 'shop'),
      shopBig: () => {
        const s = votingState();
        s.factions.concord.loyalty = 60;
        s.confidenceVote = computeConfidenceVote(s);
        return en.openShop(en.completeConfidenceVote(s));
      },
      vote: () => votingState(),
      crisis: () => {
        const s = calm(st.createGame({ seed: 9090, leaderName: 'Adrin Vo', mandateId: 'accident' }));
        s.day = 5; s.hidden.unrest = 70;
        return en.beginStages(en.prepareDay(s));
      },
      demand: () => {
        let s = calm(st.createGame({ seed: 4242, leaderName: 'Adrin Vo', mandateId: 'accident' }));
        s.day = 5; s.factions.concord.loyalty = 8; // the Elites turn hostile
        return en.prepareDay(s);
      },
      favour: () => {
        let s = st.createGame({ seed: 555, leaderName: 'Adrin Vo', mandateId: 'accident' });
        s.day = 5;
        for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
        for (const f of Object.values(s.factions)) f.patience = 70;
        s = en.prepareDay(s);
        s.demandNotices = [];
        s.scandals = [{ id: 'sc-1', name: 'The stairwell', detail: 'Nobody has said who was in it.', heat: 45, buried: false, day: 3 }];
        s.heldFavours = ['quiet-word', 'adamek-card', 'ilvet-ledger'];
        return s;
      },
      // The step before the run ends (a finished run cannot be resumed).
      preEnding: () => {
        let s = fresh(7);
        for (let i = 0; i < 3000; i++) {
          const next = step(s);
          if (next.phase === 'ended') return s;
          s = next;
        }
        throw new Error('scene preEnding: the run never ended');
      },
    };
    saveGame(recipes[recipe]());
  }, recipe);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Continue — Day/ }).click();
}

export async function closeDemandPops(page) {
  for (let i = 0; i < 6 && await page.locator('.demand-pop').count(); i++) {
    await page.locator('.demand-pop .dm-foot .btn').first().click();
  }
}

/** Click a masthead button by name, via the phone menu when it is folded away. */
export async function openMenuItem(page, name) {
  const direct = page.locator('.masthead-right').getByRole('button', { name, exact: true });
  if (await direct.count() && await direct.isVisible()) return direct.click();
  await page.locator('.m-menu-btn').click();
  await page.locator('.m-menu').getByRole('button', { name, exact: true }).click();
}

/** Make the rail (Files, Demands, desk, favours…) visible on any layout. */
export async function openFiles(page) {
  if (await page.locator('.rail').isVisible()) return;
  await page.locator('.m-files-btn').click();
  await page.locator('.rail.open').waitFor();
}

/** Press the screen's "go on" control, whichever one it has. */
async function advance(page) {
  const vote = page.locator('.vote-screen');
  if (await vote.count()) {
    const reveal = page.getByRole('button', { name: 'Reveal now', exact: true });
    if (await reveal.count()) await reveal.click();
    return page.locator('.vote-actions .btn-primary').click();
  }
  for (const sel of ['.shop-foot .btn-primary', '.strap-action:visible', '.outcome-foot .btn-primary']) {
    const b = page.locator(sel).first();
    if (await b.count() && await b.isVisible()) return b.click();
  }
  return page.locator(':is(.stage-col, .sr-stage, .alert-card) .opt:not([disabled])').first().click();
}

/**
 * The scenes. `go(page)` leaves the page showing that screen; `primary` is
 * the selector of the screen's main "go on" control (null when the screen
 * has none of its own, e.g. a card where you must pick an option).
 */
export const SCENES = [
  { name: 'title', primary: '.title-actions .btn-primary', go: async (p) => {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'networkidle' });
  } },
  { name: 'title-unlocks', primary: null, go: async (p) => {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Unlocks', exact: true }).click();
  } },
  { name: 'briefing', primary: '.strap-action', go: async (p) => { await seed(p, 'briefing'); await closeDemandPops(p); } },
  { name: 'card', primary: null, go: async (p) => {
    await seed(p, 'briefing'); await closeDemandPops(p);
    await p.locator('.strap-action').click();
  } },
  { name: 'outcome', primary: '.strap-action', go: async (p) => {
    await seed(p, 'briefing'); await closeDemandPops(p);
    await p.locator('.strap-action').click();
    await p.locator('.stage-col .opt:not([disabled])').first().click();
  } },
  { name: 'private-file', primary: null, go: async (p) => { await seed(p, 'privateFile'); await closeDemandPops(p); } },
  { name: 'alert', primary: null, go: async (p) => { await seed(p, 'alert'); await closeDemandPops(p); } },
  { name: 'alert-outcome', primary: '.alert-card .outcome-foot .btn-primary', go: async (p) => {
    await seed(p, 'alert'); await closeDemandPops(p);
    await p.locator('.alert-card .opt:not([disabled])').first().click();
  } },
  { name: 'night', primary: '.strap-action', go: async (p) => { await seed(p, 'night'); await closeDemandPops(p); } },
  { name: 'shop', primary: '.shop-foot .btn-primary', go: async (p) => { await seed(p, 'shop'); } },
  { name: 'shop-big', primary: '.shop-foot .btn-primary', go: async (p) => { await seed(p, 'shopBig'); } },
  { name: 'vote', primary: '.vote-actions .btn-primary', go: async (p) => {
    await seed(p, 'vote');
    await p.getByRole('button', { name: 'Reveal now', exact: true }).click();
  } },
  { name: 'situation-room', primary: null, go: async (p) => { await seed(p, 'crisis'); await closeDemandPops(p); } },
  { name: 'situation-outcome', primary: '.sr-stage .outcome-foot .btn-primary', go: async (p) => {
    await seed(p, 'crisis'); await closeDemandPops(p);
    await p.locator('.sr-stage .opt:not([disabled])').first().click();
  } },
  { name: 'demand-pop', primary: '.demand-pop .dm-foot .btn', go: async (p) => { await seed(p, 'demand'); await p.locator('.demand-pop').waitFor(); } },
  { name: 'brief-me', primary: '.intro-foot .btn-primary', go: async (p) => {
    await seed(p, 'briefing'); await closeDemandPops(p);
    await openMenuItem(p, 'Brief me');
  } },
  { name: 'manage', primary: null, go: async (p) => {
    await seed(p, 'briefing'); await closeDemandPops(p);
    await openMenuItem(p, 'Advisors & Deals');
  } },
  { name: 'files', primary: null, go: async (p) => {
    await seed(p, 'demand'); await closeDemandPops(p);
    await openFiles(p);
  } },
  { name: 'favour-dialog', primary: null, go: async (p) => {
    await seed(p, 'favour');
    await openFiles(p);
    await p.locator('.rail .kept.fav', { hasText: 'A Quiet Word' }).locator('.btn').click();
    await p.locator('.fav-pop').waitFor();
  } },
  { name: 'ending', primary: '.ending-sheet .btn-primary', go: async (p) => {
    await seed(p, 'preEnding'); await closeDemandPops(p);
    for (let i = 0; i < 4 && !(await p.locator('.ending-sheet').count()); i++) {
      await advance(p);
      await closeDemandPops(p);
    }
    await p.locator('.ending-sheet').waitFor();
  } },
];

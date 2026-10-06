import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE } from './scenes.mjs';

/**
 * THE PIGEON RUN — played for real in a browser (practice mode).
 *
 *   1. Desktop 1366×700, keyboard: a pilot in the page reads the flight
 *      from the stage's data attributes (time, height, climb, the hawks'
 *      lines) and holds or lets go of Space like a player would, all the
 *      way to the garrison: a WIN. The result names the flight; practice
 *      saves nothing.
 *   2. Desktop: doing nothing loses (the pigeon glides into the hills).
 *   3. ↑ and W hold too; letting go sinks.
 *   4. Phone 390×844 (touch): a real finger held on the stage climbs, and
 *      lifting it glides down; a finger held on the pad below climbs too,
 *      and keeps climbing when it slides off (pointer capture).
 *   5. Reduce Motion: the calm look, and the flight runs at 2/3 speed.
 * No page errors anywhere.
 */

const errors = [];
const browser = await launchBrowser();

async function openPractice(page, seed, act = 1) {
  await page.goto(`${BASE}?practice=pigeon&seed=${seed}&act=${act}`, { waitUntil: 'networkidle' });
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.pg-stage').waitFor();
}

const stage = (page) => page.evaluate(() => {
  const d = document.querySelector('.pg-stage')?.dataset ?? {};
  return { t: Number(d.t), y: Number(d.y), vy: Number(d.vy), held: d.held === '1', hits: Number(d.hits), over: d.over };
});

/** In the page: the practice flight's own setup, and the seed whose pilot flight is cleanest. */
async function easySeed(page) {
  return page.evaluate(async () => {
    const P = await import('/src/game/minigames/pigeon.ts');
    const { practiceGame } = await import('/src/ui/minigames/practice.ts');
    const { minigameSeed } = await import('/src/game/minigames/index.ts');
    for (let seed = 1; seed < 40; seed++) {
      const s = practiceGame(`?practice=pigeon&seed=${seed}&act=1`);
      const setup = P.pigeonSetup(minigameSeed(s, s.current.cardId), P.pigeonDifficulty(1));
      // the pilot, seeing everything 60 ms late (the page's pilot reads the screen)
      let st = P.pigeonStart(setup);
      const hist = [];
      while (!st.over) {
        hist.push(st);
        const seen = hist[Math.max(0, hist.length - 3)];
        st = P.pigeonTick(st, P.STEP_MS, P.pilotHold(seen, P.pilotTarget(setup, seen, 7)));
      }
      if (st.over === 'won' && st.hits === 0) return seed;
    }
    return null;
  });
}

/** In the page: fly by holding Space, reading the stage like a player reads the screen. */
async function startPilot(page) {
  await page.evaluate(async () => {
    const P = await import('/src/game/minigames/pigeon.ts');
    const { practiceGame } = await import('/src/ui/minigames/practice.ts');
    const { minigameSeed } = await import('/src/game/minigames/index.ts');
    const s = practiceGame(location.search);
    const setup = P.pigeonSetup(minigameSeed(s, s.current.cardId), P.pigeonDifficulty(s.act));
    let held = false;
    const press = (h) => {
      if (h === held) return;
      window.dispatchEvent(new KeyboardEvent(h ? 'keydown' : 'keyup', { key: ' ', code: 'Space', bubbles: true }));
      held = h;
    };
    const timer = setInterval(() => {
      const el = document.querySelector('.pg-stage');
      if (!el || el.dataset.over) { press(false); clearInterval(timer); return; }
      const lines = new Map([...document.querySelectorAll('.pg-hawk[data-lock]')]
        .filter((g) => g.dataset.lock !== '').map((g) => [Number(g.dataset.strike), Number(g.dataset.lock)]));
      const view = {
        t: Number(el.dataset.t), y: Number(el.dataset.y), vy: Number(el.dataset.vy),
        locks: setup.hawks.map((h) => lines.get(h.at) ?? null),
      };
      press(P.pilotHold(view, P.pilotTarget(setup, view, 7)));
    }, 30);
  });
}

try {
  /* ------------------------------- 1. desktop: flown to the garrison by Space */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const seed = await easySeed(page);
    assert.ok(seed, 'No easy act 1 practice flight found for the pilot');
    await openPractice(page, seed, 1);
    assert.match(await page.locator('.pg-pad').innerText(), /Space/i, 'A laptop is told about the keys');
    assert.ok(await page.locator('.pg-hint').count(), 'The start hint shows until the first hold');
    await startPilot(page);
    await page.waitForTimeout(1500);
    assert.equal(await page.locator('.pg-hint').count(), 0, 'The hint goes once the player holds');
    // pictures along the way: a hawk's line, a storm cloud
    let shotHawk = false;
    for (let i = 0; i < 90 && !(await page.locator('.mg-end').count()); i++) {
      if (!shotHawk && await page.locator('.pg-hawk.warn').count()) {
        await page.screenshot({ path: shotPath('PG-hawk-1366.png') });
        shotHawk = true;
      }
      if (i === 20) await page.screenshot({ path: shotPath('PG-flight-1366.png') });
      await page.waitForTimeout(500);
    }
    await page.locator('.mg-end').waitFor({ timeout: 20000 });
    assert.ok(shotHawk, 'A hawk should show its line during the flight');
    const end = await page.locator('.mg-end').innerText();
    assert.ok(await page.locator('.mg-end.won').count(), `The pilot should reach the garrison: ${end}`);
    assert.match(end, /Message delivered/i);
    await page.screenshot({ path: shotPath('PG-won-1366.png') });
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome').waitFor();
    assert.match(await page.locator('.mg-result-body .outcome').innerText(), /garrison|order/i);
    assert.equal(await page.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1')), null, 'Practice must not save a run');
    await page.close();
  }

  /* ------------------------------------ 2. desktop: doing nothing loses */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await openPractice(page, 3, 1);
    await page.locator('.mg-end').waitFor({ timeout: 25000 });
    assert.ok(await page.locator('.mg-end.lost').count(), 'Doing nothing should bring the pigeon down');
    assert.match(await page.locator('.mg-end').innerText(), /Brought down/i);
    assert.match(await page.locator('.mg-end p').innerText(), /hill/i, 'An idle pigeon is brought down by the hills');
    await page.screenshot({ path: shotPath('PG-lost-1366.png') });
    await page.close();
  }

  /* ------------------------------------------ 3. ↑ and W hold, too */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await openPractice(page, 5, 1);
    for (const key of ['ArrowUp', 'w']) {
      await page.keyboard.down(key);
      await page.waitForTimeout(350);
      const a = await stage(page);
      assert.ok(a.held && a.vy < 0, `Holding ${key} climbs (held ${a.held}, vy ${a.vy})`);
      await page.keyboard.up(key);
      await page.waitForTimeout(750); // from a full climb a glide takes ~0.45 s to start sinking
      const b = await stage(page);
      assert.ok(!b.held && b.vy > 0, `Letting go of ${key} glides down (vy ${b.vy})`);
    }
    await page.close();
  }

  /* ------------------------------- 4. phone: a real finger held and lifted */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => errors.push(e.message));
    await openPractice(page, 5, 1);
    assert.doesNotMatch(await page.locator('.pg-pad').innerText(), /Space/i, 'A phone is not told about keys');
    const cdp = await page.context().newCDPSession(page);
    const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    const box = await page.locator('.pg-stage').boundingBox();
    const sx = box.x + box.width * 0.6;
    const sy = box.y + box.height * 0.5;
    const before = await stage(page);
    await touch('touchStart', sx, sy);
    await page.waitForTimeout(500);
    const up = await stage(page);
    assert.ok(up.held, 'A finger on the stage holds');
    assert.ok(up.vy < 0 && up.y < before.y + 2, `Holding climbs (y ${before.y} → ${up.y}, vy ${up.vy})`);
    await page.screenshot({ path: shotPath('PG-hold-390.png') });
    await touch('touchEnd');
    await page.waitForTimeout(750);
    const down = await stage(page);
    assert.ok(!down.held && down.vy > 0, `Lifting the finger glides down (vy ${down.vy})`);
    // the pad below the sky: hold, slide off it, still holding
    const pad = await page.locator('.pg-pad').boundingBox();
    await touch('touchStart', pad.x + pad.width / 2, pad.y + pad.height / 2);
    await page.waitForTimeout(200);
    await touch('touchMove', pad.x + pad.width / 2, pad.y - 120);
    await page.waitForTimeout(250);
    const slid = await stage(page);
    assert.ok(slid.held && slid.vy < 0, 'A held finger that slides off the pad still climbs');
    await touch('touchEnd');
    await page.waitForTimeout(150);
    assert.equal((await stage(page)).held, false, 'Lifting it lets go');
    await page.screenshot({ path: shotPath('PG-390.png') });
    await page.close();
  }

  /* ----------------------------------------------- 5. Reduce Motion */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPractice(page, 5, 1);
    assert.ok(await page.locator('.app.mg-calm').count(), 'Reduce Motion gives the calm look');
    const t0 = Date.now();
    const a = await stage(page);
    await page.waitForTimeout(1500);
    const b = await stage(page);
    const ratio = (b.t - a.t) / (Date.now() - t0);
    assert.ok(ratio > 0.5 && ratio < 0.8, `With Reduce Motion the flight runs at about 2/3 speed (${ratio.toFixed(2)})`);
    assert.equal(await page.locator('.pg-bolt').first().evaluate((e) => getComputedStyle(e).animationName), 'none', 'No lightning flicker');
    await page.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log('PIGEON: flown to the garrison by holding Space (a pilot reading the screen), lost by doing nothing, ↑ and W hold, a real finger on a phone climbs and lifting it glides (pad + slide-off), Reduce Motion calm at 2/3 speed — all OK');

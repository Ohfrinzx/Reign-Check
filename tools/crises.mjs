import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Phase 3 step 3 — crisis chains, in a real browser at 1366×700: when a
 * pressure boils over, stage 1 arrives as the day's first card in its own
 * "situation room" layout (band, three-stage tracker, situation log,
 * orders side by side); the front page and desk show the running crisis;
 * the keyboard still picks orders; and after a bad first choice, stage 2
 * arrives in its worse ("hot") version with the earlier order in the log.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });

  /** Build a state in the page, save it, and resume it. `setup` gets (s, prepareDay). */
  async function seed(setup) {
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(async (setupSrc) => {
      localStorage.clear();
      const { createGame } = await import('/src/game/state.ts');
      const { prepareDay } = await import('/src/game/engine.ts');
      const { saveGame } = await import('/src/game/save.ts');
      const s = createGame({ seed: 9090, leaderName: 'Adrin Vo', mandateId: 'accident' });
      s.day = 5;
      for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
      for (const f of Object.values(s.factions)) f.patience = 70;
      for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
      // eslint-disable-next-line no-new-func
      saveGame(new Function('s', 'prepareDay', setupSrc)(s, prepareDay));
    }, setup);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
  }
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));

  /* ---- 1. unrest boils over: stage 1 of the Bread Riots */
  await seed(`s.hidden.unrest = 70; return prepareDay(s);`);
  await page.locator('.frontpage').waitFor();
  assert.match(await page.locator('.frontpage').innerText(), /Crisis: The Bread Riots \(stage 1 of 3\)/i);
  await page.locator('.strap-action').click();
  const card = page.locator('.stage-col .doc.crisis-card');
  await card.waitFor();
  assert.match(await card.locator('.cr-name').innerText(), /BREAD RIOTS/i);
  assert.equal(await card.locator('.cr-track li.now').count(), 1);
  assert.match(await card.locator('.cr-track li.now').innerText(), /It starts/i);
  assert.match(await card.locator('.cr-log').innerText(), /This is where it starts/i);
  assert.equal(await page.locator('.stage-col .doc .dh').count(), 0, 'Crisis card should not use the lead-story header');
  await page.waitForTimeout(500); // let the card's rise-in animation finish before measuring
  const orders = card.locator('.cr-order-row .opt');
  assert.equal(await orders.count(), 3);
  const [a, b] = [await orders.nth(0).boundingBox(), await orders.nth(1).boundingBox()];
  assert.ok(a && b && Math.abs(a.y - b.y) < 2 && b.x > a.x, 'Orders should sit side by side');
  await page.screenshot({ path: shotPath('X-crisis-stage1.png') });

  // keyboard: "3" = say the rise is temporary (makes it worse)
  await page.keyboard.press('3');
  await page.locator('.stage-col .outcome').waitFor();
  const after = await saved();
  assert.equal(after.flags['crisis:bread'], -1, 'Order 3 did not make the crisis worse');

  /* ---- 2. two days later: stage 2 arrives in its worse version, with the log */
  await seed(`
    let t = prepareDay({ ...s, hidden: { ...s.hidden, unrest: 70 } });
    t.seenOnce.push('crisis-bread-1');
    t.flags['crisis:bread'] = -1;
    t.log.push({ day: t.day, kind: 'decision', title: 'Queues at the Bakeries', text: 'Say the price rise is temporary. — The statement is reasonable.', tone: 'bad' });
    t = prepareDay({ ...t, day: t.day + 2, phase: 'night' });
    return t;
  `);
  await page.locator('.strap-action').click();
  const hot = page.locator('.stage-col .doc.crisis-card.stage-2');
  await hot.waitFor();
  assert.match(await hot.locator('h1').innerText(), /BAKERY BURNED/i);
  assert.match(await hot.locator('.cr-track li.now').innerText(), /It spreads/i);
  assert.equal(await hot.locator('.cr-track li.done').count(), 1);
  assert.match(await hot.locator('.cr-log').innerText(), /Queues at the Bakeries[\s\S]*You: Say the price rise is temporary/i);
  assert.match(await hot.locator('.cr-mood').innerText(), /getting worse/i);
  await page.waitForTimeout(500);
  await page.screenshot({ path: shotPath('X-crisis-stage2-hot.png') });

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('CRISES: front page, situation-room card, tracker, log, orders, keyboard, hot stage 2 all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

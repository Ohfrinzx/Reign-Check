import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Balance slice B — a faction at the bottom of its bar works against you, in
 * a real browser at 1366×700: the first morning a pop-up says so, the front
 * page names what they did, the rail's desk card shows it at top danger, and
 * the day's primary action is still reachable once the pop-up is closed.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.clear();
    const { createGame } = await import('/src/game/state.ts');
    const { prepareDay } = await import('/src/game/engine.ts');
    const { saveGame } = await import('/src/game/save.ts');
    let s = createGame({ seed: 4242, leaderName: 'Adrin Vo', mandateId: 'accident' });
    s.day = 5;
    for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
    for (const f of Object.values(s.factions)) { f.patience = 80; f.loyalty = 50; }
    for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
    s.factions.concord.loyalty = 8; // the Elites: hostile
    s = prepareDay(s);
    saveGame(s);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Continue — Day/ }).click();

  const pop = page.locator('.demand-pop.bad', { hasText: 'turned against you' });
  await pop.waitFor();
  assert.match(await pop.locator('.dm-banner').innerText(), /ELITES · HOSTILE/i);
  assert.match(await pop.innerText(), /The Elites turned against you/i);
  assert.match(await pop.innerText(), /every morning/i);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath('H-hostile-popup.png') });
  await pop.locator('.dm-foot .btn').click();
  // the hostile faction also made a demand — close that pop-up too
  while (await page.locator('.demand-pop').count()) await page.locator('.demand-pop .dm-foot .btn').first().click();

  const front = page.locator('.frontpage');
  assert.match(await front.innerText(), /Elites: working against you/i);
  const desk = page.locator('.rail .threat', { hasText: 'working against you' });
  assert.match(await desk.innerText(), /DANGER 3 OF 3/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.ok(saved.factions.concord.demand, 'A hostile faction should make a demand');
  const action = await page.locator('.strap-action').boundingBox();
  assert.ok(action && action.y >= 0 && action.y + action.height <= 700, 'Primary action needs scrolling');
  await page.screenshot({ path: shotPath('H-hostile-frontpage.png') });

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('HOSTILE: pop-up, front-page action, desk danger 3 of 3, demand issued, primary action reachable all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

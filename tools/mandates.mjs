import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const url = 'http://127.0.0.1:5173/';
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const start = page.getByRole('button', { name: 'Take the job', exact: true });
  const box = await start.boundingBox();
  assert.ok(box && box.y >= 0 && box.y + box.height <= 700, 'Start requires scrolling');
  // §4.5 step 2: with no run history, clean-hands/pay-deal are locked — only
  // the four base mandates plus "let fate decide" are offered.
  assert.equal(await page.locator('input[name="mandate"]').count(), 5);
  assert.equal(await page.locator('input[value="clean-hands"]').count(), 0);
  assert.equal(await page.locator('input[value="pay-deal"]').count(), 0);
  for (const id of ['stairwell', 'landslide', 'handover', 'accident']) {
    await page.locator(`input[value="${id}"]`).check();
    assert.ok((await page.locator('.mandate-rule').innerText()).length > 30);
    if (id === 'handover') await page.screenshot({ path: shotPath('M-mandate-selection.png') });
    await page.getByRole('button', { name: "Ma'am", exact: true }).click();
    await start.click();
    assert.ok((await page.locator('.intro-lead').first().innerText()).includes("ma'am"));
    await page.locator('.intro-foot .btn-primary').click();
    await page.waitForSelector('.frontpage');
    assert.equal((await saved()).mandateId, id);
    assert.ok((await page.locator('.mandate-summary').innerText()).length > 30);
    const before = await saved();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Continue — Day/ }).click();
    assert.deepEqual(await saved(), before, `${id}: reload changed run state`);
    // A focused menu button must handle Enter itself, without starting the day.
    await page.getByRole('button', { name: 'Menu', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.title-screen');
    assert.deepEqual(await saved(), before, 'Menu keypress advanced the day');
  }

  // §4.5 step 2: seed enough cross-run history to unlock clean-hands
  // (2+ finished runs), pay-deal (reached Act 2), one-good-story (a
  // survival) and archivist (3+ finished runs) all at once, then confirm
  // the title picker actually offers the two previously-locked mandates —
  // not just that they're rendered, but that selecting and starting one
  // of them really works — and that the Unlocks screen agrees nothing is
  // locked anymore.
  await page.evaluate(() => {
    const runs = [
      { day: 6, act: 1, mandateId: 'stairwell', endingId: 'x1', endingKind: 'coup', endingTitle: 'Fell', regimeLabel: 'A Security State', leaderName: 'Test', at: Date.now() },
      { day: 12, act: 2, mandateId: 'landslide', endingId: 'x2', endingKind: 'survival', endingTitle: 'Held', regimeLabel: 'A Reforming Government', leaderName: 'Test', at: Date.now() },
      { day: 18, act: 3, mandateId: 'handover', endingId: 'x3', endingKind: 'survival', endingTitle: 'Held Again', regimeLabel: 'A Reforming Government', leaderName: 'Test', at: Date.now() },
    ];
    localStorage.setItem('dictator-sandbox:legacy:v1', JSON.stringify({ version: 1, runs }));
  });
  await page.evaluate(() => localStorage.removeItem('dictator-sandbox:save:v1'));
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('input[name="mandate"]').count(), 7, 'clean-hands/pay-deal did not unlock');
  assert.equal(await page.locator('input[value="clean-hands"]').count(), 1);
  assert.equal(await page.locator('input[value="pay-deal"]').count(), 1);

  await page.getByRole('button', { name: 'Unlocks', exact: true }).click();
  await page.waitForSelector('.intro-scrim');
  await page.waitForTimeout(300); // let the .2s scrimIn fade finish before screenshotting
  assert.equal(await page.locator('.manage-timer:not(.active)').count(), 0, 'expected everything unlocked after this history');
  await page.screenshot({ path: shotPath('M-unlocks-open.png') });
  await page.locator('.intro-foot .btn-primary').click();

  await page.locator('input[value="clean-hands"]').check();
  await start.click();
  await page.locator('.intro-foot .btn-primary').click();
  await page.waitForSelector('.frontpage');
  assert.equal((await saved()).mandateId, 'clean-hands', 'previously-locked mandate did not actually start');

  // The same Unlocks view lives as a second access point: a tab inside the
  // in-game "Advisors & Deals" screen, reachable mid-run — not just the
  // title screen's own button.
  await page.click('button:has-text("Advisors & Deals")');
  await page.waitForSelector('.intro-scrim');
  assert.equal(await page.locator('.seg-btn').count(), 2, 'expected Roster/Unlocks tabs');
  await page.click('.seg-btn:has-text("Unlocks")');
  await page.waitForTimeout(150);
  assert.ok(await page.locator('.manage-row').count() > 0, 'no unlock rows in the Advisors & Deals tab');
  assert.equal(await page.locator('.manage-timer:not(.active)').count(), 0, 'tab disagrees with the title screen about what is unlocked');
  await page.screenshot({ path: shotPath('M-manage-unlocks-tab.png') });
  await page.locator('.intro-foot .btn-primary').click();

  await page.getByRole('button', { name: 'Menu', exact: true }).click();

  // The version bump must not offer a Continue button for an incompatible save.
  await page.evaluate(() => {
    const key = 'dictator-sandbox:save:v1';
    const s = JSON.parse(localStorage.getItem(key)); s.version = 6;
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: /Continue — Day/ }).count(), 0);

  // Fixture a full act shop to check displayed discounts and a reachable exit.
  const expected = await page.evaluate(async () => {
    const { createGame } = await import('/src/game/state.ts');
    const { saveGame } = await import('/src/game/save.ts');
    const { shopPrice } = await import('/src/game/shop.ts');
    const { SHOP_MAP } = await import('/src/game/content/shop.ts');
    const s = createGame({ seed: 12, mandateId: 'handover' });
    s.day = 6; s.act = 2; s.phase = 'shop'; s.stats.treasury = 100;
    s.shopStock = ['fixer', 'archivist', 'emergency-powers', 'three-judges', 'quiet-word'];
    saveGame(s);
    return shopPrice(s, SHOP_MAP.fixer);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Continue — Day/ }).click();
  const leave = await page.locator('.shop-foot .btn-primary').boundingBox();
  assert.ok(leave && leave.y >= 0 && leave.y + leave.height <= 700, 'Shop exit requires scrolling');
  assert.equal(await page.locator('.masthead').count(), 0);
  assert.ok((await page.locator('.offer').first().innerText()).includes(`$${expected.toFixed(1)}B`));
  await page.waitForTimeout(600);
  await page.screenshot({ path: shotPath('M-handover-shop.png') });
  const before = await saved();
  await page.locator('.offer').first().getByRole('button', { name: 'Buy', exact: true }).focus();
  await page.keyboard.press('Enter');
  const bought = await saved();
  assert.equal(bought.day, 6, 'Focused Buy advanced the day');
  assert.ok(bought.owned.includes('fixer'));
  assert.equal(bought.stats.treasury, before.stats.treasury - expected);
  await page.locator('.shop-foot .btn-primary').click();
  assert.equal((await saved()).day, 7);
  assert.ok((await page.locator('.masthead .mid').innerText()).includes('DAY 1 / 6'));
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('MANDATES: four base selections, unlock gating + the Unlocks screen, rules, save/reload, old-save rejection, keyboard controls, shop discount and act transition passed at 1366×700.');
} finally {
  await browser.close();
}

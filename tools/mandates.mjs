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
  const start = page.getByRole('button', { name: 'Take the job', exact: true });
  const box = await start.boundingBox();
  assert.ok(box && box.y >= 0 && box.y + box.height <= 700, 'Start requires scrolling');
  assert.equal(await page.locator('input[name="mandate"]').count(), 7);
  for (const id of ['stairwell', 'landslide', 'handover', 'accident', 'clean-hands', 'pay-deal']) {
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
  console.log('MANDATES: six selections, rules, save/reload, old-save rejection, keyboard controls, shop discount and act transition passed at 1366×700.');
} finally {
  await browser.close();
}

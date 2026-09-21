import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

const errors = [];
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: shotPath('01-title.png') });

// name + take office
await page.fill('.name-field input', 'Adrin Vo');
await page.click('button:has-text("Take the job")');
await page.waitForTimeout(400);
const introBtn0 = page.locator('.intro-foot .btn-primary');
if (await introBtn0.count()) { await introBtn0.click(); await page.waitForTimeout(300); }
await page.waitForSelector('.frontpage', { timeout: 5000 });
await page.screenshot({ path: shotPath('02-briefing-day1.png'), fullPage: true });

const log = [];
let shots = 2;
for (let step = 0; step < 90; step++) {
  // ending?
  if (await page.locator('.ending-title').count()) {
    log.push('ENDED: ' + await page.locator('.ending-title').innerText());
    await page.screenshot({ path: shotPath('99-ending.png'), fullPage: true });
    break;
  }
  // breaking alert
  if (await page.locator('.alert-scrim .alert-card .opt').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-ALERT.png`), fullPage: true }); }
    log.push('ALERT: ' + (await page.locator('.alert-card .doc h1').innerText()));
    const opts = page.locator('.alert-scrim .alert-card .opt:not([disabled])');
    await opts.nth(0).click();
    await page.waitForTimeout(160);
    continue;
  }
  if (await page.locator('.alert-scrim .outcome').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-alert-outcome.png`), fullPage: true }); }
    await page.locator('.alert-scrim .outcome .btn-primary').click();
    await page.waitForTimeout(160);
    continue;
  }
  // the Back Room
  if (await page.locator('.shop').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-shop.png`), fullPage: true }); }
    const names = await page.locator('.shop .offer h2').allInnerTexts();
    log.push('SHOP: ' + (names.join(' | ') || 'room closed'));
    const buy = page.locator('.shop .offer .btn-primary:not([disabled])');
    if (await buy.count()) { await buy.first().click(); await page.waitForTimeout(200); continue; }
    // Fullscreen shop has no strap — its own "Leave" button is the only way out.
    await page.locator('.shop-foot .btn-primary').click();
    await page.waitForTimeout(200);
    continue;
  }
  // night review
  if (await page.locator('.night-sheet').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-night.png`), fullPage: true }); }
    log.push('NIGHT: ' + (await page.locator('.night-head h2').innerText()));
    await page.locator('.strap-action').click();
    await page.waitForTimeout(220);
    continue;
  }
  // briefing (and anything else the top strap drives)
  if (await page.locator('.strap-action').count()) {
    await page.locator('.strap-action').click();
    await page.waitForTimeout(200);
    continue;
  }
  // outcome
  if (await page.locator('.stage-col .outcome').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-outcome.png`), fullPage: true }); }
    await page.locator('.stage-col .outcome .btn-primary').click();
    await page.waitForTimeout(160);
    continue;
  }
  // card
  const cardOpts = page.locator('.stage-col .doc .opt:not([disabled])');
  if (await cardOpts.count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: shotPath(`${String(shots).padStart(2,'0')}-card.png`), fullPage: true }); }
    log.push('CARD: ' + (await page.locator('.stage-col .doc h1').innerText()));
    await cardOpts.nth(0).click();
    await page.waitForTimeout(160);
    continue;
  }
  log.push('STUCK at step ' + step + ' html-ish: ' + (await page.locator('.stage-col').innerText()).slice(0, 200));
  break;
}

// save/load check
const saveRaw = await page.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1'));
log.push('SAVE PRESENT: ' + (saveRaw ? saveRaw.length + ' bytes' : 'NO'));
await page.reload({ waitUntil: 'networkidle' });
const hasContinue = await page.locator('button:has-text("Continue — Day")').count();
log.push('CONTINUE BUTTON AFTER RELOAD: ' + hasContinue);
if (hasContinue) {
  await page.click('button:has-text("Continue — Day")');
  await page.waitForTimeout(500);
  log.push('RESUMED OK: ' + (await page.locator('.masthead .mid .lbl').count() ? 'yes' : 'no'));
  await page.screenshot({ path: shotPath('98-resumed.png'), fullPage: true });
}

console.log(log.join('\n'));
console.log('\n--- ERRORS (' + errors.length + ') ---');
console.log(errors.slice(0, 20).join('\n'));
await browser.close();
assert.equal(errors.length, 0, errors.join('\n'));
assert.ok(saveRaw, 'No autosave');
assert.ok(!log.some((l) => l.startsWith('STUCK')), 'Playthrough got stuck');
if (JSON.parse(saveRaw).phase !== 'ended') assert.ok(hasContinue, 'Save could not resume');

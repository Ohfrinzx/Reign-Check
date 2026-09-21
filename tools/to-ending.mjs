// Drives the game to an ending by always taking the most aggressive option,
// then screenshots the legacy report. Requires `npm run dev` on :5173.
import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.fill('.name-field input', 'Adrin Vo');
await page.click('button:has-text("Take the job")');
await page.waitForTimeout(400);
const introBtn = page.locator('.intro-foot .btn-primary');
if (await introBtn.count()) { await introBtn.click(); await page.waitForTimeout(300); }
for (let i = 0; i < 400; i++) {
  if (await page.locator('.ending-title').count()) break;
  const alertOpts = page.locator('.alert-scrim .alert-card .opt:not([disabled])');
  if (await alertOpts.count()) { await alertOpts.last().click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.alert-scrim .outcome').count()) { await page.locator('.alert-scrim .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.stage-col .outcome').count()) { await page.locator('.stage-col .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  // the Back Room: take the most aggressive thing on offer, then leave
  const buy = page.locator('.shop .offer .btn-primary:not([disabled])');
  if (await buy.count()) { await buy.last().click(); await page.waitForTimeout(110); continue; }
  // Fullscreen shop has no strap — its own "Leave" button is the only way out.
  const shopLeave = page.locator('.shop-foot .btn-primary');
  if (await shopLeave.count()) { await shopLeave.click(); await page.waitForTimeout(110); continue; }
  const opts = page.locator('.stage-col .doc .opt:not([disabled])');
  if (await opts.count()) { await opts.last().click(); await page.waitForTimeout(90); continue; }
  // briefing / night all drive from the always-visible top strap
  if (await page.locator('.strap-action').count()) { await page.locator('.strap-action').click(); await page.waitForTimeout(110); continue; }
  break;
}
if (await page.locator('.ending-title').count()) {
  console.log('ENDING:', await page.locator('.ending-title').innerText());
  console.log('REGIME:', await page.locator('.ending-regime').innerText());
  console.log('VERDICT:', await page.locator('.ending-verdict').innerText());
  await page.screenshot({ path: shotPath('E-ending.png'), fullPage: true });
  // restart works?
  await page.click('button:has-text("Try again")');
  await page.waitForTimeout(500);
  assert.ok(await page.locator('.frontpage').count(), 'Restart failed');
  console.log('RESTART OK: true');
} else {
  await browser.close();
  assert.equal(errs.length, 0, errs.join('\n'));
  throw new Error('No ending reached');
}
console.log('PAGE ERRORS:', errs.length, errs.slice(0,3).join(' | '));
await browser.close();
assert.equal(errs.length, 0, errs.join('\n'));

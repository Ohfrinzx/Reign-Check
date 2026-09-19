// Drives the game to an ending by always taking the most aggressive option,
// then screenshots the legacy report. Requires `npm run dev` on :5173.
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('button:has-text("Take Office")');
for (let i = 0; i < 400; i++) {
  if (await page.locator('.ending-title').count()) break;
  const alertOpts = page.locator('.alert-scrim .alert-card .opt:not([disabled])');
  if (await alertOpts.count()) { await alertOpts.last().click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.alert-scrim .outcome').count()) { await page.locator('.alert-scrim .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('button:has-text("Begin the day")').count()) { await page.click('button:has-text("Begin the day")'); await page.waitForTimeout(90); continue; }
  if (await page.locator('.night-sheet .btn-primary').count()) { await page.locator('.night-sheet .btn-primary').click(); await page.waitForTimeout(110); continue; }
  if (await page.locator('.stage-col .outcome').count()) { await page.locator('.stage-col .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  const opts = page.locator('.stage-col .card .opt:not([disabled])');
  if (await opts.count()) { await opts.last().click(); await page.waitForTimeout(90); continue; }
  break;
}
if (await page.locator('.ending-title').count()) {
  console.log('ENDING:', await page.locator('.ending-title').innerText());
  console.log('REGIME:', await page.locator('.ending-regime').innerText());
  console.log('VERDICT:', await page.locator('.ending-verdict').innerText());
  await page.screenshot({ path: '/tmp/claude-0/shots/E-ending.png', fullPage: true });
  // restart works?
  await page.click('button:has-text("Another Republic")');
  await page.waitForTimeout(500);
  console.log('RESTART OK:', await page.locator('.dossier').count() > 0);
} else {
  console.log('NO ENDING REACHED');
}
console.log('PAGE ERRORS:', errs.length, errs.slice(0,3).join(' | '));
await browser.close();

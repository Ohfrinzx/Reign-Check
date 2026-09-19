import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.click('button:has-text("Take Office")');
await page.waitForSelector('.dossier');
for (let i = 0; i < 120; i++) {
  if (await page.locator('.alert-scrim .alert-card .opt').count()) {
    await page.waitForTimeout(700);
    await page.screenshot({ path: '/tmp/claude-0/shots/A-alert.png' });
    await page.locator('.alert-scrim .alert-card .opt:not([disabled])').nth(0).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/claude-0/shots/B-alert-outcome.png' });
    break;
  }
  if (await page.locator('button:has-text("Begin the day")').count()) { await page.click('button:has-text("Begin the day")'); }
  else if (await page.locator('.night-sheet .btn-primary').count()) { await page.locator('.night-sheet .btn-primary').click(); }
  else if (await page.locator('.stage-col .outcome').count()) { await page.locator('.stage-col .outcome .btn-primary').click(); }
  else if (await page.locator('.stage-col .card .opt:not([disabled])').count()) { await page.locator('.stage-col .card .opt:not([disabled])').nth(1).click(); }
  await page.waitForTimeout(140);
}
// people tab + dossier tab
await page.locator('.alert-scrim').count() && await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.click('.side-tab:has-text("people")'); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/claude-0/shots/C-people.png' });
await page.click('.side-tab:has-text("dossier")'); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/claude-0/shots/D-dossier.png' });
await browser.close();
console.log('done');

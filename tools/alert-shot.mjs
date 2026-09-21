// Capture the current alert UI; run with node tools/run-browser.mjs alert-shot.
import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Take the job' }).click();
  await page.locator('.intro-foot .btn-primary').click();
  let captured = false;
  for (let i = 0; i < 150; i++) {
    const alert = page.locator('.alert-scrim .opt:not([disabled])');
    if (await alert.count()) {
      await page.waitForTimeout(600);
      await page.screenshot({ path: shotPath('A-alert.png') });
      await alert.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: shotPath('B-alert-outcome.png') });
      captured = true;
      break;
    }
    const exit = page.locator('.shop-foot .btn-primary');
    const next = page.locator('.strap-action');
    const options = page.locator('.stage-col .doc .opt:not([disabled])');
    if (await exit.count()) await exit.click();
    else if (await next.count()) await next.click();
    else if (await options.count()) await options.first().click();
    else break;
  }
  assert.ok(captured, 'No alert reached');
  console.log('Alert and outcome screenshots captured.');
} finally {
  await browser.close();
}

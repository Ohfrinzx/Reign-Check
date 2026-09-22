// §4.5 step 1: drives one run to an ending, returns to the title screen via
// "Back to title", and checks the cross-run record line appears there and
// survives a full page reload (it lives in its own localStorage key,
// separate from save.ts's). Requires `npm run dev` on :5173.
import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// No history yet: the record line must not render at all.
assert.equal(await page.locator('.title-record').count(), 0, 'record line shown with no runs yet');

await page.fill('.name-field input', 'Adrin Vo');
await page.click('button:has-text("Take the job")');
await page.waitForTimeout(400);
const introBtn = page.locator('.intro-foot .btn-primary');
if (await introBtn.count()) { await introBtn.click(); await page.waitForTimeout(300); }

for (let i = 0; i < 400; i++) {
  if (await page.locator('.ending-title').count()) break;
  if (await page.locator('.vote-screen').count()) {
    const reveal = page.getByRole('button', { name: 'Reveal now', exact: true });
    if (await reveal.count()) await reveal.click();
    await page.locator('.vote-clerk.revealed').waitFor();
    await page.locator('.vote-actions .btn-primary').click();
    await page.waitForTimeout(110);
    continue;
  }
  // Phase 3 faction demands: a pop-up covers the day until it is closed.
  if (await page.locator('.demand-pop').count()) {
    await page.locator('.demand-pop .dm-foot .btn').first().click();
    await page.waitForTimeout(90);
    continue;
  }
  const alertOpts = page.locator('.alert-scrim .alert-card .opt:not([disabled])');
  if (await alertOpts.count()) { await alertOpts.last().click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.alert-scrim .outcome').count()) { await page.locator('.alert-scrim .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.stage-col .outcome').count()) { await page.locator('.stage-col .outcome .btn-primary').click(); await page.waitForTimeout(90); continue; }
  const buy = page.locator('.shop .offer .btn-primary:not([disabled])');
  if (await buy.count()) { await buy.last().click(); await page.waitForTimeout(110); continue; }
  const shopLeave = page.locator('.shop-foot .btn-primary');
  if (await shopLeave.count()) { await shopLeave.click(); await page.waitForTimeout(110); continue; }
  const opts = page.locator('.stage-col .doc .opt:not([disabled])');
  if (await opts.count()) { await opts.last().click(); await page.waitForTimeout(90); continue; }
  if (await page.locator('.strap-action').count()) { await page.locator('.strap-action').click(); await page.waitForTimeout(110); continue; }
  break;
}
assert.ok(await page.locator('.ending-title').count(), 'no ending reached');
const endingTitle = await page.locator('.ending-title').innerText();
console.log('ENDING:', endingTitle);

await page.click('button:has-text("Back to title")');
await page.waitForTimeout(300);
assert.ok(await page.locator('.title-screen').count(), 'did not return to title');

const record = page.locator('.title-record');
assert.equal(await record.count(), 1, 'record line missing after one completed run');
const recordText = await record.innerText();
console.log('RECORD:', recordText);
assert.match(recordText, /1 administration/);

// title screen must still fit at 1366x700 with the new line — no scroll regression
const overflow = await page.evaluate(() => {
  const el = document.querySelector('.title-screen');
  return el ? el.scrollHeight - el.clientHeight : 0;
});
console.log('TITLE OVERFLOW:', overflow);
await page.screenshot({ path: shotPath('F-legacy-title.png'), fullPage: true });

// the record must survive a real reload — it is read from its own
// localStorage key on mount, independent of save.ts's save slot.
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('.title-record').count(), 1, 'record line lost after reload');
const afterReload = await page.locator('.title-record').innerText();
assert.equal(afterReload, recordText, 'record text changed across reload');
console.log('SURVIVES RELOAD: true');

console.log('PAGE ERRORS:', errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
assert.equal(errs.length, 0, errs.join('\n'));

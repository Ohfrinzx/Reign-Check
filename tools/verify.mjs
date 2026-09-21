import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
const browser = await launchBrowser();
const errs = [];
const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type()==='error' && !/favicon/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

const notes = [];
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: shotPath('P-title.png') });

await page.fill('.name-field input', 'Adrin Vo');
await page.click('.seg-btn:has-text("Sir")');
await page.click('button:has-text("Take the job")');
await page.waitForSelector('.intro');
await page.waitForTimeout(500);
await page.screenshot({ path: shotPath('P-intro.png') });
notes.push('intro shown on new game: yes');

// scroll check on intro at short viewport
const introScroll = await page.evaluate(() => {
  const el = document.querySelector('.intro-scroll');
  const before = el.scrollTop; el.scrollTop = 99999; const after = el.scrollTop;
  return { canScroll: after - before, sh: el.scrollHeight, ch: el.clientHeight };
});
notes.push('intro scroll: ' + JSON.stringify(introScroll));

await page.click('.intro-foot .btn-primary');
await page.waitForSelector('.frontpage');
await page.waitForTimeout(400);
await page.screenshot({ path: shotPath('P-briefing.png'), fullPage: false });

let cards = 0, alerts = 0, days = 0, priced = 0, shops = 0, shopBuys = 0;
for (let i = 0; i < 600; i++) {
  if (await page.locator('.ending-title').count()) break;
  if (await page.locator('.alert-scrim .alert-card .opt:not([disabled])').count()) {
    alerts++;
    if (alerts === 1) { await page.waitForTimeout(600); await page.screenshot({ path: shotPath('P-alert.png') }); }
    const aCount = await page.locator('.alert-scrim .alert-card .opt:not([disabled])').count();
    await page.locator('.alert-scrim .alert-card .opt:not([disabled])').nth(i % Math.max(1, aCount)).click();
  } else if (await page.locator('.alert-scrim .outcome').count()) {
    await page.locator('.alert-scrim .outcome .btn-primary').click();
  } else if (await page.locator('.shop .offer .btn-primary:not([disabled])').count()) {
    // The Back Room: buy the first thing we can afford, then move on.
    shopBuys++;
    if (shopBuys === 1) await page.screenshot({ path: shotPath('P-shop.png') });
    await page.locator('.shop .offer .btn-primary:not([disabled])').first().click();
  } else if (await page.locator('.shop-foot .btn-primary').count()) {
    // The shop is fullscreen and has no strap — its own "Leave" button is
    // the only way out, same button the masthead/strap used to duplicate.
    await page.locator('.shop-foot .btn-primary').click();
  } else if (await page.locator('.strap-action').count()) {
    const t = await page.locator('.strap-action').innerText();
    if (/begin the day/i.test(t)) days++;
    if (/back room/i.test(t)) shops++;
    await page.locator('.strap-action').click();
  } else if (await page.locator('.stage-col .outcome').count()) {
    if (cards === 1) await page.screenshot({ path: shotPath('P-outcome.png') });
    await page.locator('.stage-col .outcome .btn-primary').click();
  } else if (await page.locator('.stage-col .doc .opt:not([disabled])').count()) {
    cards++;
    if (cards === 2) await page.screenshot({ path: shotPath('P-card.png') });
    const hints = await page.locator('.stage-col .doc .opt .hint').allInnerTexts();
    if (hints.some(h => /\$\d/.test(h))) priced++;
    // the glossary is a plain-text footnote now, not a hover (see Prose.tsx)
    if (cards === 3) {
      const foot = page.locator('.stage-col .card-glossary span').first();
      if (await foot.count()) notes.push('glossary footnote on card 3: ' + (await foot.innerText()).slice(0, 70));
    }
    const optCount = await page.locator('.stage-col .doc .opt:not([disabled])').count();
    await page.locator('.stage-col .doc .opt:not([disabled])').nth(i % Math.max(1, optCount)).click();
  } else break;
  await page.waitForTimeout(45);
}
notes.push(`days=${days} cards=${cards} alerts=${alerts} priced=${priced} shopsVisited=${shops} shopPurchases=${shopBuys}`);

if (await page.locator('.ending-title').count()) {
  notes.push('ENDING: ' + await page.locator('.ending-title').innerText());
  await page.screenshot({ path: shotPath('P-ending.png'), fullPage: true });
} else {
  await page.screenshot({ path: shotPath('P-night.png') });
}

// scroll test on a busy stage-col
const scroll = await page.evaluate(() => {
  const col = document.querySelector('.stage-col');
  if (!col) return null;
  const before = col.scrollTop; col.scrollTop = 99999; const after = col.scrollTop; col.scrollTop = before;
  return { canScroll: after - before, sh: col.scrollHeight, ch: col.clientHeight };
});
notes.push('stage-col scroll: ' + JSON.stringify(scroll));

const save = await page.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1'));
notes.push('save bytes: ' + (save ? save.length : 'NONE'));

console.log(notes.join('\n'));
console.log('ERRORS:', errs.length, errs.slice(0,6).join(' | '));
await browser.close();
assert.equal(errs.length, 0, errs.join('\n'));
assert.ok(notes.some((n) => n.startsWith('ENDING:')), 'Full run did not reach an ending');
assert.ok(save, 'Autosave missing');

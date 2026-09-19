import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type()==='error' && !/CERT_AUTHORITY|favicon/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

const notes = [];
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// honorific picker
await page.fill('.name-field input', 'Adrin Vo');
await page.click('.seg-btn:has-text("Sir")');
await page.click('button:has-text("Take the job")');
await page.waitForSelector('.intro');
notes.push('intro shown on new game: yes');
await page.click('.intro-foot .btn-primary');
await page.waitForSelector('.dossier');

let cards = 0, alerts = 0, days = 0, minMoneyMentions = 0;
for (let i = 0; i < 260; i++) {
  if (await page.locator('.ending-title').count()) break;
  if (await page.locator('.alert-scrim .alert-card .opt:not([disabled])').count()) {
    alerts++; await page.locator('.alert-scrim .alert-card .opt:not([disabled])').nth(i % 2).click();
  } else if (await page.locator('.alert-scrim .outcome').count()) {
    await page.locator('.alert-scrim .outcome .btn-primary').click();
  } else if (await page.locator('.action-bar .btn-primary').count()) {
    const t = await page.locator('.action-bar .btn-primary').innerText();
    if (/Begin the day/.test(t)) days++;
    await page.locator('.action-bar .btn-primary').click();
  } else if (await page.locator('.stage-col .outcome').count()) {
    await page.locator('.stage-col .outcome .btn-primary').click();
  } else if (await page.locator('.stage-col .card .opt:not([disabled])').count()) {
    cards++;
    const hints = await page.locator('.stage-col .card .opt-hint').allInnerTexts();
    if (hints.some(h => /\$\d/.test(h))) minMoneyMentions++;
    await page.locator('.stage-col .card .opt:not([disabled])').nth(i % 3).click();
  } else break;
  await page.waitForTimeout(55);
}
notes.push(`days=${days} cards=${cards} alerts=${alerts} cards-with-price-hints=${minMoneyMentions}`);

if (await page.locator('.ending-title').count()) {
  notes.push('ENDING: ' + await page.locator('.ending-title').innerText());
  notes.push('VERDICT: ' + await page.locator('.ending-verdict').innerText());
  await page.screenshot({ path: '/tmp/claude-0/shots/V-ending.png', fullPage: true });
}

// no archaic leftovers anywhere on screen
const body = await page.evaluate(() => document.body.innerText);
const banned = ['First Citizen', 'velk', '₩', 'Convocation Square', 'Sable Office’s'];
notes.push('banned terms present: ' + banned.filter(b => body.includes(b)).join(', ') || 'banned terms present: none');

// save/reload
const save = await page.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1'));
notes.push('save bytes: ' + (save ? save.length : 'NONE'));

console.log(notes.join('\n'));
console.log('ERRORS:', errs.length, errs.slice(0,5).join(' | '));
await browser.close();

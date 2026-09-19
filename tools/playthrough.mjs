import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/claude-0/shots/01-title.png' });

// name + take office
await page.fill('.name-field input', 'Adrin Vo');
await page.click('button:has-text("Take Office")');
await page.waitForSelector('.dossier', { timeout: 5000 });
await page.screenshot({ path: '/tmp/claude-0/shots/02-briefing-day1.png', fullPage: true });

const log = [];
let shots = 2;
for (let step = 0; step < 90; step++) {
  // ending?
  if (await page.locator('.ending-title').count()) {
    log.push('ENDED: ' + await page.locator('.ending-title').innerText());
    await page.screenshot({ path: '/tmp/claude-0/shots/99-ending.png', fullPage: true });
    break;
  }
  // breaking alert
  if (await page.locator('.alert-scrim .alert-card .opt').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: `/tmp/claude-0/shots/${String(shots).padStart(2,'0')}-ALERT.png`, fullPage: true }); }
    log.push('ALERT: ' + (await page.locator('.alert-card .card-title').innerText()));
    const opts = page.locator('.alert-scrim .alert-card .opt:not([disabled])');
    await opts.nth(0).click();
    await page.waitForTimeout(160);
    continue;
  }
  if (await page.locator('.alert-scrim .outcome').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: `/tmp/claude-0/shots/${String(shots).padStart(2,'0')}-alert-outcome.png`, fullPage: true }); }
    await page.locator('.alert-scrim .outcome .btn-primary').click();
    await page.waitForTimeout(160);
    continue;
  }
  // briefing
  if (await page.locator('button:has-text("Begin the day")').count()) {
    await page.click('button:has-text("Begin the day")');
    await page.waitForTimeout(200);
    continue;
  }
  // night
  const nightBtn = page.locator('.night-sheet .btn-primary');
  if (await nightBtn.count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: `/tmp/claude-0/shots/${String(shots).padStart(2,'0')}-night.png`, fullPage: true }); }
    log.push('NIGHT: ' + (await page.locator('.night-head h2').innerText()));
    await nightBtn.click();
    await page.waitForTimeout(220);
    continue;
  }
  // outcome
  if (await page.locator('.stage-col .outcome').count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: `/tmp/claude-0/shots/${String(shots).padStart(2,'0')}-outcome.png`, fullPage: true }); }
    await page.locator('.stage-col .outcome .btn-primary').click();
    await page.waitForTimeout(160);
    continue;
  }
  // card
  const cardOpts = page.locator('.stage-col .card .opt:not([disabled])');
  if (await cardOpts.count()) {
    if (shots < 12) { shots++; await page.screenshot({ path: `/tmp/claude-0/shots/${String(shots).padStart(2,'0')}-card.png`, fullPage: true }); }
    log.push('CARD: ' + (await page.locator('.stage-col .card-title').innerText()));
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
  log.push('RESUMED OK: ' + (await page.locator('.daychip').count() ? 'yes' : 'no'));
  await page.screenshot({ path: '/tmp/claude-0/shots/98-resumed.png', fullPage: true });
}

console.log(log.join('\n'));
console.log('\n--- ERRORS (' + errors.length + ') ---');
console.log(errors.slice(0, 20).join('\n'));
await browser.close();

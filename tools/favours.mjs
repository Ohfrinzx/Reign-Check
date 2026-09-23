import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Balance slice A — favours, in a real browser at 1366×700: the rail says
 * what a favour is useful for right now (or when to keep it for), a favour
 * with nothing to aim at is disabled with a reason, the dialog lets you pick
 * the target, and the receipt names what went away — which really is gone.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.clear();
    const { createGame } = await import('/src/game/state.ts');
    const { prepareDay } = await import('/src/game/engine.ts');
    const { saveGame } = await import('/src/game/save.ts');
    let s = createGame({ seed: 555, leaderName: 'Adrin Vo', mandateId: 'accident' });
    s.day = 5;
    for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
    for (const f of Object.values(s.factions)) f.patience = 70;
    s = prepareDay(s);
    s.demandNotices = [];
    s.scandals = [{ id: 'sc-1', name: 'The stairwell', detail: 'Nobody has said who was in it.', heat: 45, buried: false, day: 3 }];
    s.heldFavours = ['quiet-word', 'adamek-card', 'ilvet-ledger'];
    saveGame(s);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Continue — Day/ }).click();
  await page.locator('.frontpage').waitFor();

  const rail = page.locator('.rail');
  const quiet = rail.locator('.kept.fav', { hasText: 'A Quiet Word' });
  assert.match(await quiet.innerText(), /Useful now: The stairwell/i);
  const card = rail.locator('.kept.fav', { hasText: "Adamek's Card" });
  assert.match(await card.innerText(), /Keep it for: When money is running short/i);
  const ledger = rail.locator('.kept.fav', { hasText: 'The Ilvet Ledger' });
  assert.ok(await ledger.locator('.btn').isDisabled(), 'A favour with nothing to aim at should be disabled');
  assert.match(await ledger.innerText(), /Nothing to use it on yet/i);
  await rail.locator('.panel', { hasText: 'Back Room' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: shotPath('F-rail.png') });

  await quiet.locator('.btn').click();
  const dlg = page.locator('.fav-pop');
  await dlg.waitFor();
  assert.match(await dlg.locator('.fav-targets').innerText(), /The stairwell/);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath('F-dialog.png') });
  await dlg.locator('.dm-foot .btn-primary').click();
  await dlg.locator('.fav-line').waitFor();
  assert.match(await dlg.innerText(), /"The stairwell" is gone/);
  await page.waitForTimeout(300);
  await page.screenshot({ path: shotPath('F-receipt.png') });
  await dlg.locator('.dm-foot .btn-primary', { hasText: 'Done' }).click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.deepEqual(saved.scandals, [], 'The scandal should really be gone');
  assert.ok(!saved.heldFavours.includes('quiet-word'));
  assert.equal(await rail.locator('.kept.fav', { hasText: 'A Quiet Word' }).count(), 0);
  assert.doesNotMatch(await page.locator('.frontpage').innerText(), /The stairwell/i);

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('FAVOURS: useful-now, keep-for, disabled-with-reason, target dialog, named receipt, really gone all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

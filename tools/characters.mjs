import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Phase 3 step 2 — character-driven events, in a real browser at 1366×700:
 * the front page warns about a wavering character, the next morning their
 * betrayal arrives as a card in the day drawn in its own "private file"
 * layout (not the lead-story layout), the reply slips sit side by side, the
 * keyboard still picks options, and an offer card uses the offer styling.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });

  /** Build a state in the page, run the morning upkeep(s), save it, resume it. */
  async function seed(setup, mornings = 1) {
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(async ({ setupSrc, mornings }) => {
      localStorage.clear();
      const { createGame } = await import('/src/game/state.ts');
      const { prepareDay } = await import('/src/game/engine.ts');
      const { saveGame } = await import('/src/game/save.ts');
      let s = createGame({ seed: 777, leaderName: 'Adrin Vo', mandateId: 'accident' });
      s.day = 3;
      for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
      for (const f of Object.values(s.factions)) f.patience = 70;
      // eslint-disable-next-line no-new-func
      new Function('s', setupSrc)(s);
      s = prepareDay(s);
      for (let i = 1; i < mornings; i++) s = prepareDay({ ...s, day: s.day + 1, phase: 'night' });
      saveGame(s);
    }, { setupSrc: setup, mornings });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
  }

  /* ---- 1. the warning comes first, on the front page */
  await seed(`s.characters.piek.loyalty = 20;`);
  await page.locator('.frontpage').waitFor();
  assert.match(await page.locator('.frontpage').innerText(), /embassy dinners/i, 'No front-page warning about Piek');
  assert.match(await page.locator('.rail').innerText(), /PIEK/i, 'Warning not on the desk');
  const warnedSave = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.ok(!warnedSave.todayDeck.includes('char-betray-piek'), 'Betrayal arrived on the same morning as the warning');

  /* ---- 2. next morning, the betrayal arrives as a private-file card */
  await seed(`s.characters.piek.loyalty = 20;`, 2);
  await page.locator('.strap-action').click();
  const card = page.locator('.stage-col .doc.char-card.betrayal');
  await card.waitFor();
  assert.match(await card.locator('.cc-stamp').innerText(), /ACTED ALONE/i);
  assert.match(await card.innerText(), /Where they stand/i);
  assert.match(await card.locator('h1').innerText(), /Piek Leaked/i);
  assert.equal(await page.locator('.stage-col .doc .dh').count(), 0, 'Character card should not use the lead-story header');
  const slips = card.locator('.cc-slips .opt');
  assert.ok(await slips.count() >= 3);
  const [a, b] = [await slips.nth(0).boundingBox(), await slips.nth(1).boundingBox()];
  assert.ok(a && b && Math.abs(a.y - b.y) < 2 && b.x > a.x, 'Reply slips should sit side by side');
  await page.waitForTimeout(500);
  await page.screenshot({ path: shotPath('C-betrayal.png') });
  await page.screenshot({ path: shotPath('C-betrayal-full.png'), fullPage: true });

  // the keyboard still chooses: "3" = sack him
  await page.keyboard.press('3');
  await page.locator('.stage-col .outcome').waitFor();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.equal(after.characters.piek.inPost, false, 'Option 3 did not remove Piek');

  /* ---- 3. an offer uses the offer styling */
  await seed(`s.characters.hess.loyalty = 90;`);
  await page.locator('.strap-action').click();
  const offer = page.locator('.stage-col .doc.char-card.offer');
  await offer.waitFor();
  assert.match(await offer.locator('.cc-stamp').innerText(), /AN OFFER/i);
  assert.match(await offer.innerText(), /devoted to you/i);
  await page.waitForTimeout(500);
  await page.screenshot({ path: shotPath('C-offer.png') });

  /* ---- 4. the owner's rename: the Money faction now reads Elites */
  assert.match(await page.locator('.rail .fac').nth(2).innerText(), /ELITES/i);

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('CHARACTERS: warning first, private-file betrayal, side-by-side replies, keyboard, offer, Elites label all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

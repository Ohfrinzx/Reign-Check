import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Balance slice C — consequences, in a real browser at 1366×700: a decision
 * that leaves a mark says so in its result ("On the record") and in the
 * rail; a later card then shows a new option marked "New option · Because
 * you …", which can be chosen and whose result repeats the reason; and a
 * locked option is shown disabled with the reason.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));

  /** Seed a calm morning whose first card is `first` (then `then`), with `marks` already made. */
  async function seed(first, then, marks = {}) {
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(async ({ first, then, marks }) => {
      localStorage.clear();
      const { createGame } = await import('/src/game/state.ts');
      const { prepareDay } = await import('/src/game/engine.ts');
      const { saveGame } = await import('/src/game/save.ts');
      let s = createGame({ seed: 8181, leaderName: 'Adrin Vo', mandateId: 'accident' });
      s.day = 7;
      for (const k of Object.keys(s.hidden)) s.hidden[k] = 10;
      for (const f of Object.values(s.factions)) { f.patience = 80; f.loyalty = 55; }
      for (const c of Object.values(s.characters)) { c.loyalty = 50; c.plotting = 0; c.memory = []; }
      Object.assign(s.flags, marks);
      s = prepareDay(s);
      s.demandNotices = [];
      s.todayDeck = [first, then, ...s.todayDeck.filter((id) => id !== first && id !== then)].slice(0, s.agenda.length);
      saveGame(s);
    }, { first, then, marks });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
    await page.locator('.strap-action').click();
  }
  const opts = page.locator(':is(.stage-col, .sr-stage) .doc .opt');

  /* ---- 1. a decision leaves a mark: "On the record" in the result and the rail */
  await seed('channel-seven', 'stairwell-question');
  await page.locator('.stage-col .doc h1', { hasText: /Evening News/i }).waitFor();
  await opts.filter({ hasText: 'Pay the $5 billion' }).click();
  const outcome = page.locator('.stage-col .outcome');
  await outcome.waitFor();
  assert.match(await outcome.locator('.outcome-marked').innerText(), /On the record:? You paid Loz \$5 billion.*day 7.*This will come up again/is);
  assert.match(await page.locator('.rail .record-panel').innerText(), /DAY 7[\s\S]*You paid Loz \$5 billion/i);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath('K-marked.png') });

  /* ---- 2. a later card: a new option, because of it */
  await outcome.locator('.btn-primary').click();
  while (await page.locator('.alert-scrim .opt:not([disabled])').count()) {
    await page.locator('.alert-scrim .opt:not([disabled])').first().click();
    await page.locator('.alert-scrim .btn-primary').click();
  }
  await page.locator('.stage-col .doc h1', { hasText: /Stairwell/i }).waitFor();
  await page.waitForTimeout(500);
  const unlocked = opts.filter({ hasText: 'Have Channel Seven run your version first' });
  assert.equal(await unlocked.count(), 1, 'The unlocked option is missing');
  assert.match(await unlocked.locator('.because').innerText(), /NEW OPTION · Because you paid Loz \$5 billion.*\(day 7\)/i);
  await page.screenshot({ path: shotPath('K-unlocked.png') });
  // it is reachable by its shown number too
  const at = (await opts.allInnerTexts()).findIndex((x) => /Have Channel Seven run your version/.test(x));
  await page.keyboard.press(String(at + 1));
  await outcome.waitFor();
  assert.match(await outcome.locator('.outcome-because').innerText(), /Because you paid Loz/);

  /* ---- 3. a locked option: shown, disabled, with the reason */
  await seed('port-crane-deal', 'hadem-census', { 'mark:sold-port': 4, 'mark:built-road': 3 });
  await page.locator('.stage-col .doc h1', { hasText: /Cranes/i }).waitFor();
  const sign = opts.filter({ hasText: 'Sign it' });
  assert.ok(await sign.isDisabled(), 'The locked option should be disabled');
  assert.match(await sign.locator('.locked').innerText(), /Because you sold forty per cent of the Mavro port to Sereth \(day 4\): their two-page contract/);
  await page.waitForTimeout(500);
  await page.screenshot({ path: shotPath('K-locked.png') });

  /* ---- 4. a changed option: the note is on it */
  await opts.filter({ hasText: 'Refuse' }).click();
  await outcome.locator('.btn-primary').click();
  while (await page.locator('.alert-scrim .opt:not([disabled])').count()) {
    await page.locator('.alert-scrim .opt:not([disabled])').first().click();
    await page.locator('.alert-scrim .btn-primary').click();
  }
  await page.locator('.stage-col .doc h1', { hasText: /Question 9/i }).waitFor();
  const ask = opts.filter({ hasText: 'Ask the question. Publish' });
  assert.match(await ask.locator('.because').innerText(), /CHANGED · Because you built the third Hadem road \(day 3\)/i);

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('CONSEQUENCES: on-the-record result + rail, unlocked option (click + key), locked with reason, changed note all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

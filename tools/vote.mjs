import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

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
    const { computeConfidenceVote } = await import('/src/game/content/endings.ts');
    const { saveGame } = await import('/src/game/save.ts');
    const state = createGame({ seed: 20260922, leaderName: 'Adrin Vo' });
    state.day = 6;
    state.act = 1;
    state.phase = 'vote';
    state.stats.power = 62;
    state.stats.security = 58;
    state.stats.military = 54;
    state.stats.information = 66;
    state.stats.legitimacy = 61;
    state.stats.support = 57;
    state.stats.stability = 59;
    state.confidenceVote = computeConfidenceVote(state);
    saveGame(state);
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Continue — Day 6', exact: true }).click();
  await page.locator('.vote-screen').waitFor();
  assert.match(await page.locator('.vote-heading').innerText(), /government needs 40/i);
  assert.equal(await page.locator('.vote-clerk.revealed').count(), 0, 'Result visible before count completed');

  await page.waitForTimeout(950);
  const counted = await page.locator('.vote-lamps .counted').count();
  assert.ok(counted > 0 && counted < 24, `Expected a partial count, saw ${counted}`);
  const frozen = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.equal(frozen.phase, 'vote');
  assert.equal(frozen.confidenceVote.threshold, 40);

  // A mid-count reload must reproduce the frozen result rather than reroll it.
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Continue — Day 6', exact: true }).click();
  assert.ok(await page.locator('.vote-screen').count(), 'Vote did not resume from autosave');
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')).confidenceVote);
  assert.deepEqual(resumed, frozen.confidenceVote, 'Reload changed the frozen vote result');

  await page.getByRole('button', { name: 'Reveal now', exact: true }).click();
  await page.locator('.vote-clerk.revealed').waitFor();
  assert.match(await page.locator('.vote-stamp').innerText(), /CONFIDENCE RETAINED/);
  assert.match(await page.locator('.vote-factors').innerText(), /Grip[\s\S]*Legitimacy[\s\S]*Required/i);
  assert.match(await page.locator('.vote-margin').innerText(), /above the required line/);
  const action = await page.locator('.vote-actions .btn-primary').boundingBox();
  assert.ok(action && action.y >= 0 && action.y + action.height <= 700, 'Vote continuation requires scrolling');
  await page.screenshot({ path: shotPath('V-confidence-result.png') });

  await page.locator('.vote-actions .btn-primary').click();
  await page.locator('.night-sheet').waitFor();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
  assert.equal(after.act, 2);
  assert.equal(after.phase, 'night');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(`VOTE: partial reveal, exact frozen reload, final factors, fit, and Act ${after.act} continuation passed at 1366×700.`);
} finally {
  await browser.close();
}

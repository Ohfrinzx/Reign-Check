import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';

/**
 * Phase 3 step 1 — faction demands, in a real browser at 1366×700:
 * the pop-up appears on the morning a demand is issued, "Deal with it
 * later" keeps it in the rail's Demands panel, rows expand, Meet pays and
 * clears it, a bribe is either taken or refused (never both), a lapsed
 * ultimatum shows its outcome pop-up, there is no masthead Demands button
 * (owner request), and below 1080px (no rail) a new demand still pops up.
 */
const SAVE = 'dictator-sandbox:save:v1';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/.test(message.text())) errors.push(message.text());
  });

  /** Build a state in the page, run the morning upkeep, save it, and resume it. */
  async function seed(setup) {
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(async (setupSrc) => {
      localStorage.clear();
      const { createGame } = await import('/src/game/state.ts');
      const { prepareDay } = await import('/src/game/engine.ts');
      const { saveGame } = await import('/src/game/save.ts');
      const s = createGame({ seed: 4242, leaderName: 'Adrin Vo', mandateId: 'accident' });
      s.day = 3;
      for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
      s.stats.treasury = 40;
      // eslint-disable-next-line no-new-func
      new Function('s', setupSrc)(s);
      saveGame(prepareDay(s));
    }, setup);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
    const intro = page.locator('.intro-scrim');
    if (await intro.count()) await page.keyboard.press('Escape');
  }
  const saved = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE);

  /* ---- 1. a new request pops up */
  await seed(`s.factions.staff.patience = 12;`);
  const pop = page.locator('.demand-pop');
  await pop.waitFor();
  assert.match(await pop.locator('.dm-banner').innerText(), /A REQUEST FROM THE ARMY/i);
  assert.match(await pop.innerText(), /Cost: \$\d/);
  assert.match(await pop.innerText(), /Bribe for 2 more days/i);
  assert.match(await pop.innerText(), /They (will probably|might) /i);
  for (const sel of ['.dm-act .btn-primary', '.dm-foot .btn']) {
    const box = await pop.locator(sel).first().boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= 700, `${sel} needs scrolling in the pop-up`);
  }
  // number keys must not choose a card option underneath an open pop-up
  await page.keyboard.press('1');
  assert.equal((await saved()).phase, 'briefing', 'A key press leaked through the pop-up');
  await page.waitForTimeout(400); // let the .2s/.3s fade-in finish before the shot
  await page.screenshot({ path: shotPath('D-demand-popup.png') });

  /* ---- 2. deal with it later → it lives in the rail and expands in place */
  await pop.locator('.dm-foot .btn').click();
  assert.equal(await page.locator('.demand-pop').count(), 0, 'Pop-up did not close');
  const row = page.locator('.demands-panel .dm-row');
  assert.equal(await row.count(), 1);
  assert.equal(await row.locator('.dm-detail').count(), 0, 'Row should start collapsed');
  await row.locator('.dm-head').click();
  await row.locator('.dm-detail').waitFor();
  assert.match(await row.innerText(), /From .*(Varkov|Tern)/i);
  await page.screenshot({ path: shotPath('D-demand-rail-open.png') });
  assert.equal((await saved()).demandNotices.length, 0, 'Dismissal was not saved');

  /* ---- 3. meet it: pays, clears, and says so */
  const before = await saved();
  await row.locator('.dm-act .btn-primary').click();
  await page.locator('.toast', { hasText: 'Demand met' }).waitFor();
  const after = await saved();
  assert.equal(after.factions.staff.demand, undefined);
  assert.ok(after.stats.treasury < before.stats.treasury, 'Meeting the demand did not cost money');
  assert.match(await page.locator('.demands-panel').innerText(), /No faction is making demands/);

  /* ---- 4. a bribe is taken or refused — never both, never neither */
  await seed(`s.factions.concord.demand = { id: 'money-tax-holiday', issuedDay: 3, dueDay: 4, severity: 'formal', bribes: 0 };`);
  assert.equal(await page.locator('.demand-pop').count(), 0, 'An already-seen demand should not pop up');
  assert.equal(await page.locator('.masthead-right .btn', { hasText: 'Demands' }).count(), 0, 'Masthead Demands button should be gone');
  await page.locator('.demands-panel .dm-head').click();
  const b0 = await saved();
  await page.locator('.demands-panel .dm-act .btn', { hasText: 'Bribe' }).click();
  await page.locator('.toast').waitFor();
  const toast = await page.locator('.toast').innerText();
  const b1 = await saved();
  if (/took it/i.test(toast)) {
    assert.equal(b1.factions.concord.demand.dueDay, 6);
    assert.ok(b1.stats.treasury < b0.stats.treasury);
  } else {
    assert.match(toast, /refused/i);
    assert.equal(b1.factions.concord.demand.bribeRefused, true);
    assert.equal(b1.stats.treasury, b0.stats.treasury);
    assert.ok(await page.locator('.demands-panel .dm-act .btn', { hasText: 'Bribe' }).isDisabled());
  }

  /* ---- 4b. a bribe from the POP-UP: taken closes the pop-up (owner bug
   *  report — it used to stay open until Meet or "Deal with it later");
   *  refused keeps it open, Bribe disabled, so Meet is still one tap away.
   *  The saved RNG decides; try RNG states until both outcomes are seen. */
  const seenPop = { took: false, refused: false };
  for (let rs = 1; rs <= 20 && !(seenPop.took && seenPop.refused); rs++) {
    await seed(`s.rngState = ${rs * 7919};
      s.factions.concord.demand = { id: 'money-tax-holiday', issuedDay: 3, dueDay: 4, severity: 'formal', bribes: 0 };
      s.demandNotices = [{ faction: 'concord', kind: 'issued', day: 3 }];`);
    const popB = page.locator('.demand-pop');
    await popB.waitFor();
    await popB.locator('.dm-act .btn', { hasText: 'Bribe' }).click();
    await page.locator('.toast').waitFor();
    const said = await page.locator('.toast').innerText();
    if (/took it/i.test(said)) {
      seenPop.took = true;
      assert.equal(await page.locator('.demand-pop').count(), 0, 'Accepted bribe should close the demand pop-up');
      assert.equal((await saved()).demandNotices.length, 0);
    } else {
      seenPop.refused = true;
      assert.match(said, /refused/i);
      assert.equal(await page.locator('.demand-pop').count(), 1, 'Refused bribe keeps the pop-up so Meet stays available');
      assert.ok(await page.locator('.demand-pop .dm-act .btn', { hasText: 'Bribe' }).isDisabled());
    }
  }
  assert.ok(seenPop.took, 'Never saw a bribe accepted from the pop-up');
  assert.ok(seenPop.refused, 'Never saw a bribe refused from the pop-up');

  /* ---- 5. an ultimatum that runs out shows what the faction did */
  await seed(`s.factions.chorus.loyalty = 60; s.factions.chorus.demand = { id: 'street-bread-price', issuedDay: 1, dueDay: 2, severity: 'ultimatum', bribes: 0 };`);
  await page.locator('.demand-pop.bad').waitFor();
  assert.match(await page.locator('.demand-pop.bad .dm-banner').innerText(), /ULTIMATUM RAN OUT/i);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath('D-demand-lapsed.png') });
  await page.getByRole('button', { name: 'Understood', exact: true }).click();
  assert.equal(await page.locator('.demand-pop').count(), 0);

  /* ---- 6. below 1080px the rail is hidden; a new demand still pops up, fully usable */
  await page.setViewportSize({ width: 1000, height: 700 });
  await seed(`s.factions.concord.patience = 12;`);
  assert.equal(await page.locator('.rail').isVisible(), false);
  await page.locator('.demand-pop').waitFor();
  assert.match(await page.locator('.demand-pop .dm-banner').innerText(), /A REQUEST FROM THE ELITES/i);
  assert.match(await page.locator('.demand-pop .dm-foot-note').innerText(), /in your Files/, 'Narrow pop-up should point to the Files drawer');
  const meetBox = await page.locator('.demand-pop .dm-act .btn-primary').boundingBox();
  assert.ok(meetBox && meetBox.y + meetBox.height <= 700, 'Meet needs scrolling at 1000px');
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath('D-demand-narrow.png') });
  await page.locator('.demand-pop .dm-foot .btn').click();
  assert.equal(await page.locator('.demand-scrim').count(), 0);

  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log('DEMANDS: pop-up, rail, meet, bribe (panel + pop-up: taken closes it, refused keeps it), lapse, no masthead button, narrow pop-up all OK');
  console.log('--- ERRORS (0) ---');
} finally {
  await browser.close();
}

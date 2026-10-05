import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { SCENES } from './scenes.mjs';

/**
 * The numbers under Money / Grip / Legitimacy are explained in the game
 * (owner: "No where is it explained in my game what information means or
 * what it effects"). On desktop (1366×700) and a phone (390×844, touch):
 *   - each result pill names the top number it feeds ("→ GRIP");
 *   - "What do these mean?" opens one plain line per pill, and closes again;
 *   - Brief me lists all ten numbers under "The numbers under the three";
 *   - the night summary uses the same names and says what Grip is made of;
 *   - the Grip explanation in the top bar lists its parts.
 */
const scene = (name) => SCENES.find((x) => x.name === name);
const browser = await launchBrowser();
try {
  for (const size of [
    { tag: 'desktop', viewport: { width: 1366, height: 700 } },
    { tag: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  ]) {
    const page = await browser.newPage(size);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const press = (loc) => (size.hasTouch ? loc.tap() : loc.click());

    // a result screen
    await scene('outcome').go(page);
    const deltas = page.locator('.stage-col .outcome .deltas');
    await deltas.waitFor();
    const pills = deltas.locator('.delta-pill');
    const n = await pills.count();
    assert.ok(n > 0, 'the result should show stat pills');
    for (let i = 0; i < n; i++) {
      const text = (await pills.nth(i).innerText()).trim();
      const label = text.split(/\s+[+−]/)[0];
      // only Legitimacy and Money (they ARE top numbers) and Elite (feeds none) go without an arrow
      if (!/^(LEGITIMACY|MONEY|ELITE)$/.test(label)) assert.match(text, /→ (GRIP|LEGITIMACY|MONEY)$/, `pill "${text}" should say what it feeds`);
    }
    const why = deltas.getByRole('button', { name: 'What do these mean?' });
    await press(why);
    const guide = deltas.locator('.deltas-guide');
    await guide.waitFor();
    assert.equal(await guide.locator('p').count(), n, 'one explanation per pill');
    assert.match(await guide.innerText(), /\((\d+% of (Grip|Legitimacy)|Money itself|your daily income \(Money\)|none of the three)\)/);
    await page.screenshot({ path: shotPath(`SG-${size.tag}-outcome.png`), fullPage: true });
    await press(deltas.getByRole('button', { name: 'Hide' }));
    assert.equal(await guide.count(), 0, 'Hide closes the list');

    // Brief me
    await scene('brief-me').go(page);
    const sec = page.locator('.intro-section', { hasText: 'The numbers under the three' });
    await sec.waitFor();
    assert.equal(await sec.locator('.intro-card').count(), 10, 'all ten numbers are explained');
    const info = sec.locator('.intro-card', { hasText: 'Information' });
    assert.match(await info.innerText(), /Feeds: 15% of Grip/);
    assert.match(await info.innerText(), /leaked papers/);
    await page.waitForTimeout(800); // the overlay's fade-in
    await sec.scrollIntoViewIfNeeded();
    await page.screenshot({ path: shotPath(`SG-${size.tag}-brief-me.png`) });

    // night summary
    await scene('night').go(page);
    const grid = page.locator('.ledger-grid');
    await grid.waitFor();
    assert.match(await grid.innerText(), /INFORMATION/);
    assert.match(await page.locator('.ledger-note').innerText(), /Grip is made of Power, Security, Military, Information/);

    // the Grip explanation in the top bar
    await press(page.locator('.res .r', { hasText: 'Grip' }));
    assert.match(await page.locator('.res .tip').innerText(), /Made of: Power 45%, Security 25%, Military 15%, Information 15%/);

    assert.deepEqual(errors, [], `page errors (${size.tag})`);
    await page.close();
  }
  console.log('STAT GUIDE: pills say what they feed, the list opens and closes, Brief me, night summary and Grip tip explain all ten numbers (desktop + phone)');
} finally {
  await browser.close();
}

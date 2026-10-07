import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE } from './scenes.mjs';

/**
 * FIND THE MOLE — played for real in a browser (practice mode), following
 * what is on the screen: the envelope (.mo-cue.envelope, data-from = who
 * hands it over) shows who the mole is.
 *
 * The watch lasts about 45 s, so the page runs on Playwright's clock
 * (page.clock), which moves the game's own clock (requestAnimationFrame,
 * performance.now, timers) forward in 100 ms steps without waiting for it.
 *
 *   1. Laptop (1366×700): every person shows a number; pressing it marks
 *      them (and again unmarks); the mole is marked when the envelope
 *      changes hands; the line-up opens when the contact leaves; a number
 *      picks, Enter names: WON.
 *   2. Laptop: a wrong name (arrows + Enter) loses, and the line-up shows who
 *      the mole was. Doing nothing loses too.
 *   3. Phone (390×844, touch): no numbers; real taps mark a person on the
 *      floor and in the staff list; the line-up by taps: WON.
 *   4. Reduce Motion: the calm version (no scanline flicker, no sway).
 *   No page errors anywhere.
 */

const errors = [];
const browser = await launchBrowser();

async function open(page, seed, act) {
  await page.clock.install();
  await page.goto(`${BASE}?practice=mole&seed=${seed}&act=${act}`, { waitUntil: 'networkidle' });
  await page.clock.runFor(3000); // the title card
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  assert.match(await page.locator('.mg-howto').innerText(), /white envelope/, 'The how-to says what to look for');
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mo-floor').waitFor();
}

/** Let the game run for `ms`, in 100 ms steps, calling `each` after every step. */
async function run(page, ms, each) {
  for (let t = 0; t < ms; t += 100) {
    await page.clock.runFor(100);
    await page.waitForTimeout(4); // let React draw
    if (each && (await each())) return true;
  }
  return false;
}

/** Watch the floor until the contact leaves; returns who handed over the envelope. */
async function watch(page, onEnvelope) {
  let mole = null;
  await run(page, 70000, async () => {
    if (!mole) {
      const cue = page.locator('.mo-cue.envelope');
      if (await cue.count()) {
        mole = await cue.first().getAttribute('data-from');
        await onEnvelope?.(mole);
      }
    }
    return page.locator('.mo-lineup').count();
  });
  await page.locator('.mo-lineup').waitFor();
  return mole;
}

try {
  /* ------------------------------------------- 1. laptop: won by keys */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 7, 1);
    await run(page, 1000);
    const n = await page.locator('.mo-chip').count();
    assert.equal(n, 5, 'Act 1 has five staff');
    const keys = await page.locator('.mo-p .mo-key').allInnerTexts();
    assert.equal(keys.length, n, 'Every person on the floor shows a number on a laptop');
    assert.deepEqual([...keys].sort(), ['1', '2', '3', '4', '5'], `Numbers 1-5: ${keys}`);
    // a number marks, the same number unmarks
    await page.keyboard.press('2');
    await run(page, 100);
    assert.equal(await page.locator('.mo-chip.marked').count(), 1, 'Key 2 marks a suspect');
    assert.equal(await page.locator('.mo-p.marked').count(), 1, '...on the floor too');
    await page.keyboard.press('2');
    await run(page, 100);
    assert.equal(await page.locator('.mo-chip.marked').count(), 0, 'Key 2 again unmarks');
    await page.screenshot({ path: shotPath('MO-1366-watch.png') });

    let shot = false;
    const mole = await watch(page, async (id) => {
      const key = await page.locator(`.mo-p[data-id="${id}"] .mo-key`).innerText();
      await page.keyboard.press(key);
      await run(page, 100);
      assert.ok(await page.locator(`.mo-p.marked[data-id="${id}"]`).count(), 'Its number marks the person handing over the envelope');
      if (!shot) { shot = true; await page.screenshot({ path: shotPath('MO-1366-envelope.png') }); }
    });
    assert.ok(mole, 'The envelope was on screen');
    assert.equal(await page.locator('.mo-sus').count(), n, 'Everyone is in the line-up');
    assert.ok(await page.locator(`.mo-sus.marked[data-id="${mole}"] .mo-tag`).count(), 'The marked suspect carries a tag in the line-up');
    const key = await page.locator(`.mo-sus[data-id="${mole}"] .mo-key`).innerText();
    await page.keyboard.press(key);
    await run(page, 100);
    assert.ok(await page.locator(`.mo-sus.picked[data-id="${mole}"]`).count(), 'A number picks in the line-up');
    const job = (await page.locator(`.mo-sus[data-id="${mole}"] .mo-plate`).innerText()).replace(/^\d+\s*/, '').trim();
    assert.match(await page.locator('.mo-name').innerText(), new RegExp(job, 'i'), 'The button names the picked person');
    await page.screenshot({ path: shotPath('MO-1366-lineup.png') });
    await page.keyboard.press('Enter');
    await run(page, 300);
    assert.ok(await page.locator('.mo-lineup.done.won').count(), 'Enter names them: the right one wins');
    // owner: choose what happens to the mole — four choices, keys 1–4 on a laptop
    await page.locator('.mo-fate').waitFor();
    assert.match(await page.locator('.mo-fate-q').innerText(), new RegExp(job, 'i'), 'The question names the mole');
    assert.equal(await page.locator('.mo-fate-btn').count(), 4, 'Four choices');
    assert.equal(await page.locator('.mo-fate-btn .mo-key').count(), 4, 'Keys 1–4 shown on a laptop');
    await run(page, 3000);
    assert.equal(await page.locator('.mg-end').count(), 0, 'The game waits for the choice');
    await page.screenshot({ path: shotPath('MO-1366-fate.png') });
    await page.keyboard.press('2'); // turn them
    await run(page, 600);
    await page.locator('.mg-end').waitFor();
    assert.ok(await page.locator('.mg-end.won').count(), 'The result: won');
    assert.match(await page.locator('.mg-end h2').innerText(), new RegExp(job, 'i'));
    assert.match(await page.locator('.mg-end h2').innerText(), /Turn them/);
    await page.locator('.mg-foot .btn-primary').click();
    const outcome = page.locator('.mg-result-body .outcome');
    await outcome.waitFor();
    assert.match(await outcome.innerText(), new RegExp(`${job}[\\s\\S]*keep meeting the Courier`, 'i'), 'The result names the mole and the choice');
    assert.match(await outcome.locator('.outcome-marked').innerText(), /turned the ministry mole/, 'The choice goes on the record');
    await page.close();
  }

  /* --------------------------- 2. laptop: a wrong name, and no name, lose */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 12, 2);
    const mole = await watch(page);
    assert.ok(mole, 'The envelope was on screen');
    // arrows move the pick; stop on someone who is not the mole
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowRight');
      await run(page, 100);
      if ((await page.locator('.mo-sus.picked').getAttribute('data-id')) !== mole) break;
    }
    const wrong = await page.locator('.mo-sus.picked').getAttribute('data-id');
    assert.notEqual(wrong, mole);
    await page.keyboard.press('Enter');
    await run(page, 300);
    assert.ok(await page.locator('.mo-lineup.done.lost').count(), 'A wrong name loses');
    assert.ok(await page.locator(`.mo-sus.mole[data-id="${mole}"] .mo-verdict`).count(), 'The line-up shows who the mole was');
    assert.ok(await page.locator(`.mo-sus.wrong[data-id="${wrong}"]`).count(), '...and marks the wrong name');
    await page.screenshot({ path: shotPath('MO-1366-wrong.png') });
    await run(page, 2500);
    await page.locator('.mg-end').waitFor();
    assert.ok(await page.locator('.mg-end.lost').count(), 'The result: lost');
    assert.match(await page.locator('.mg-end h2').innerText(), /Wrong desk/);

    await page.close();
  }
  {
    // doing nothing: the line-up clock runs out
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 12, 2);
    await watch(page);
    await run(page, 32000, async () => page.locator('.mo-lineup.done').count());
    assert.ok(await page.locator('.mo-lineup.done.lost').count(), 'No name in time loses');
    await run(page, 2500);
    await page.locator('.mg-end.lost').waitFor();
    assert.match(await page.locator('.mg-end h2').innerText(), /No name/);
    await page.close();
  }

  /* ------------------------------------------- 3. phone: won by taps */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => errors.push(e.message));
    const tap = async (loc) => {
      const b = await loc.boundingBox();
      assert.ok(b, 'Something to tap');
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await run(page, 100);
    };
    await open(page, 7, 1);
    await run(page, 1500);
    assert.equal(await page.locator('.mo-key').count(), 0, 'A phone shows no numbers');
    assert.ok(await page.locator('.mo.tall').count(), 'An upright phone turns the floor plan on its side');
    // a real tap on a person on the floor marks them; again unmarks
    const id = await page.evaluate(() => [...document.querySelectorAll('.mo-p')].find((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.mo-p') === el;
    })?.dataset.id);
    assert.ok(id, 'Someone on the floor can be tapped');
    const someone = page.locator(`.mo-p[data-id="${id}"]`);
    await tap(someone);
    assert.ok(await page.locator(`.mo-p.marked[data-id="${id}"]`).count(), 'A tap on a person marks them');
    assert.ok(await page.locator('.mo-chip.marked').count(), '...and their name in the list');
    await tap(page.locator(`.mo-p[data-id="${id}"]`));
    assert.equal(await page.locator('.mo-p.marked').count(), 0, 'A second tap unmarks');
    // the list works too
    await tap(page.locator('.mo-chip').nth(1));
    assert.equal(await page.locator('.mo-chip.marked').count(), 1, 'A tap on a name in the list marks them');
    await tap(page.locator('.mo-chip').nth(1));
    await page.screenshot({ path: shotPath('MO-390-watch.png') });

    const mole = await watch(page, async (who) => {
      await tap(page.locator(`.mo-chip[data-id="${who}"]`));
      assert.ok(await page.locator(`.mo-p.marked[data-id="${who}"]`).count(), 'The mole is marked from the list');
      await page.screenshot({ path: shotPath('MO-390-envelope.png') });
    });
    await tap(page.locator(`.mo-sus[data-id="${mole}"]`));
    assert.ok(await page.locator(`.mo-sus.picked[data-id="${mole}"]`).count(), 'A tap picks in the line-up');
    await page.screenshot({ path: shotPath('MO-390-lineup.png') });
    const name = page.locator('.mo-name');
    const nb = await name.boundingBox();
    assert.ok(nb.y + nb.height <= 844, 'The Name button is on screen');
    await tap(name);
    await run(page, 300);
    assert.ok(await page.locator('.mo-lineup.done.won').count(), 'Named by taps: won');
    await page.locator('.mo-fate').waitFor();
    assert.equal(await page.locator('.mo-fate .mo-key').count(), 0, 'No key hints on a phone');
    const expose = page.locator('.mo-fate-btn[data-choice="expose"]');
    const eb = await expose.boundingBox();
    assert.ok(eb.y + eb.height <= 844, 'The choices are on screen');
    await page.screenshot({ path: shotPath('MO-390-fate.png') });
    await tap(expose);
    await run(page, 600);
    await page.locator('.mg-end.won').waitFor();
    assert.match(await page.locator('.mg-end h2').innerText(), /Expose them/);
    await page.close();
  }

  /* ------------------------------------------- 4. reduce motion */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 7, 3);
    await run(page, 3200);
    assert.ok(await page.locator('.app.mg-calm').count(), 'Reduce Motion: the calm version');
    assert.equal(await page.locator('.mo-floor').evaluate((e) => getComputedStyle(e, '::after').animationName), 'none', 'No scanline flicker');
    assert.equal(await page.locator('.mo-floor').evaluate((e) => getComputedStyle(e, '::before').display), 'none', 'No rolling band');
    // two-thirds speed: 3.2 s of play shows the camera clock at 2 s
    assert.equal(await page.locator('.mo-time').innerText(), '23:40:02', 'Everything moves at two-thirds speed');
    await page.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log('MOLE: laptop numbers on every person, a number marks and unmarks, the mole marked when the envelope changes hands, line-up by number + Enter: won, then what happens to the mole (keys 1–4; turned → the result and the record say so); arrows + Enter on a wrong name: lost (mole revealed); no name: lost; phone: no numbers, floor turned upright, real taps mark on the floor and in the list, line-up by taps: won, exposed by a tap; Reduce Motion calm and slower — all OK');

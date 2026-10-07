import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE } from './scenes.mjs';

/**
 * WHO WAS IN THE STAIRWELL? — played for real in a browser (practice mode).
 *
 * The page runs the game's own rules module (Vite serves it) with the seed
 * and act the screen carries in data-seed / data-act, so the check knows the
 * answer without a spoiler sitting in the page, and compares every typed
 * line on the desk with what the rules wrote.
 *
 *   1. Laptop (1366×700), act 1: every file shows its number key; a number
 *      opens a file and lights its first line on the plan; ↑ ↓ move between
 *      lines, X strikes one out, ← → move between files; L and S stamp (and
 *      lift) the stamps; one stamp, or one mistap, cannot close the case;
 *      Enter closes it only with both stamps down; the right answer by keys
 *      alone: WON, the stairs file wears the true stamp, the result stamp.
 *   2. Laptop, act 2: a wrong name for the stairwell (stamps moved first, a
 *      mistap does nothing) closes the case: LOST, the slips say who it was.
 *   3. Laptop, act 3 (five files): everything fits 1366×700 without
 *      scrolling, the right answer by mouse: WON.
 *   4. Phone (390×844, touch), act 3: no key hints, one open file behind
 *      tabs, real taps on lines (the plan lights up), a strike, the stamps
 *      and Close the case, all on screen: WON. Then a phone loses by taps.
 *   5. Reduce Motion: the calm version (no sliding, no thumping).
 *   No page errors anywhere.
 */

const errors = [];
const browser = await launchBrowser();

async function open(page, seed, act) {
  await page.goto(`${BASE}?practice=stairwell&seed=${seed}&act=${act}`, { waitUntil: 'networkidle' });
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-veil').waitFor({ state: 'detached' });
  assert.match(await page.locator('.mg-story').innerText(), /21:40/, 'The story names the minute');
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  const how = await page.locator('.mg-howto').innerText();
  assert.match(how, /Exactly one person is lying/, 'The how-to states the rule');
  assert.match(how, /every statement they make is false/, 'The how-to says what a liar does');
  assert.match(how, /Exactly one person was in the stairwell/, 'The how-to says one person was in the stairwell');
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.sw').waitFor();
  await page.waitForTimeout(1700); // the files slide out
}

/** The answer, from the game's own rules (same seed and act as the page). */
async function answer(page) {
  return page.evaluate(async () => {
    const m = await import('/src/game/minigames/stairwell.ts');
    const root = document.querySelector('.sw');
    const setup = m.stairwellSetup(Number(root.dataset.seed), m.stairwellDifficulty(Number(root.dataset.act)));
    const files = [...document.querySelectorAll('.sw-file')].map((f) => ({
      id: f.dataset.id,
      lines: [...f.querySelectorAll('.sw-txt')].map((t) => t.textContent),
    }));
    return {
      liar: setup.liar, stairs: setup.stairs, n: setup.files.length,
      calls: setup.files.map((f) => f.call), names: setup.files.map((f) => f.name),
      ids: setup.files.map((f) => f.id), lines: setup.files.map((f) => f.lines.map((l) => l.text)),
      dom: files,
    };
  });
}

const sel = (page) => page.locator('.sw-file.sel').getAttribute('data-file');

try {
  /* ----------------------------- 1. laptop, act 1: the right answer by keys */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 7, 1);
    const a = await answer(page);
    assert.equal(a.n, 4, 'Act 1 has four files');
    assert.deepEqual(a.dom.map((f) => f.id), a.ids, 'The files on the desk are the files the rules made');
    assert.deepEqual(a.dom.map((f) => f.lines), a.lines, 'Every typed line is what the rules wrote');
    assert.ok(a.lines.every((l) => l.length >= 2 && l.length <= 3), 'Two or three short lines per file');
    assert.equal(await page.locator('.sw.tabbed').count(), 0, 'A laptop shows every file at once');
    assert.equal(await page.locator('.sw-file').count(), 4);
    assert.equal(await page.locator('.sw-label .sw-key').count(), 4, 'Every file shows its number on a laptop');
    assert.deepEqual(await page.locator('.sw-label .sw-key').allInnerTexts(), ['1', '2', '3', '4']);
    await page.screenshot({ path: shotPath('SW-1366-act1.png') });

    // a number opens a file; its first line lights up on the plan
    await page.keyboard.press('2');
    assert.equal(await sel(page), '1', 'Key 2 opens file 2');
    assert.ok(await page.locator('.sw-file[data-file="1"] .sw-row.look').count(), 'Its first line is the one being looked at');
    assert.equal(await page.locator('.sw-file[data-file="1"] .sw-row').nth(0).getAttribute('class').then((c) => c.includes('look')), true);
    await page.keyboard.press('ArrowDown');
    assert.ok((await page.locator('.sw-file[data-file="1"] .sw-row').nth(1).getAttribute('class')).includes('look'), 'Down moves to the next line');
    await page.keyboard.press('ArrowUp');
    assert.ok((await page.locator('.sw-file[data-file="1"] .sw-row').nth(0).getAttribute('class')).includes('look'), 'Up moves back');
    assert.ok(await page.locator('.sw-caption').innerText(), 'The plan says what it is showing');
    // strike a line out with X: a note, nothing else changes
    await page.keyboard.press('x');
    assert.equal(await page.locator('.sw-row.struck').count(), 1, 'X strikes the line out');
    await page.waitForTimeout(600); // the pen stroke
    assert.equal(await page.locator('.sw-row.struck .sw-txt').evaluate((e) => getComputedStyle(e).backgroundSize.startsWith('100%')), true, 'The strike-through is drawn');
    await page.keyboard.press('x');
    assert.equal(await page.locator('.sw-row.struck').count(), 0, 'X again brings it back');
    await page.keyboard.press('ArrowRight');
    assert.equal(await sel(page), '2', 'Right moves to the next file');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await sel(page), '0', 'Left moves back');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await sel(page), '3', 'and wraps round');
    // the stamp buttons show their keys on the open file only
    assert.deepEqual(await page.locator('.sw-sbtn .sw-key').allInnerTexts(), ['L', 'S'], 'Only the open file shows L and S');

    // stamps: put down, lift, one is not enough, Enter does nothing yet
    await page.keyboard.press('3');
    await page.keyboard.press('l');
    assert.equal(await page.locator('.sw-ink.liar').count(), 1, 'L stamps the liar');
    assert.equal(await page.locator('.sw-file[data-file="2"] .sw-ink.liar').count(), 1);
    assert.equal(await page.locator('[data-slip="liar"]').innerText(), a.calls[2], 'The slip names who was stamped');
    await page.keyboard.press('l');
    assert.equal(await page.locator('.sw-ink.liar').count(), 0, 'L again lifts it');
    await page.keyboard.press('l');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.sw.over').count(), 0, 'One stamp cannot close the case');
    assert.ok(await page.locator('.sw-close').isDisabled(), 'Close the case waits for both stamps');
    // a mistap on the buttons is only moved, never a loss
    await page.locator('.sw-file[data-file="0"] .sw-sbtn.stairs').click();
    await page.locator('.sw-file[data-file="1"] .sw-sbtn.stairs').click();
    assert.equal(await page.locator('.sw-ink.stairs').count(), 1, 'The stairwell stamp moves, there is only one');
    assert.equal(await page.locator('.sw.over').count(), 0);

    // now the right answer, by keys alone
    await page.keyboard.press(String(a.stairs + 1));
    await page.keyboard.press('s');
    if ((await page.locator(`.sw-file[data-file="${a.stairs}"] .sw-ink.stairs`).count()) === 0) await page.keyboard.press('s'); // it was already there: lifted
    await page.keyboard.press(String(a.liar + 1));
    if ((await page.locator(`.sw-file[data-file="${a.liar}"] .sw-ink.liar`).count()) === 0) await page.keyboard.press('l');
    assert.ok(await page.locator(`.sw-file[data-file="${a.stairs}"] .sw-ink.stairs`).count(), 'The stairwell stamp is on the right file');
    assert.ok(await page.locator(`.sw-file[data-file="${a.liar}"] .sw-ink.liar`).count(), 'The liar stamp is on the right file');
    assert.equal(await page.locator('[data-slip="stairs"]').innerText(), a.calls[a.stairs]);
    assert.equal(await page.locator('[data-slip="liar"]').innerText(), a.calls[a.liar]);
    assert.match(await page.locator('.sw-close .sw-key').innerText(), /Enter/, 'Enter is shown on the button once both stamps are down');
    await page.screenshot({ path: shotPath('SW-1366-stamped.png') });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    assert.ok(await page.locator('.sw.over.won').count(), 'Enter closes the case: the right name wins');
    assert.ok(await page.locator(`.sw-file.truth-stairs[data-file="${a.stairs}"]`).count(), 'The stairwell file is marked');
    assert.ok(await page.locator(`.sw-file.truth-liar[data-file="${a.liar}"]`).count(), 'The liar file is marked');
    assert.equal(await page.locator('.sw-slips em.ok').count(), 2, 'Both slips say Right');
    await page.screenshot({ path: shotPath('SW-1366-won.png') });
    await page.locator('.mg-end').waitFor({ timeout: 6000 });
    assert.ok(await page.locator('.mg-end.won').count(), 'The result: won');
    assert.ok((await page.locator('.mg-end h2').innerText()).includes(a.names[a.stairs]), 'The result names who was in the stairwell');
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome').waitFor();
    await page.close();
  }

  /* --------------------------- 2. laptop, act 2: a wrong name loses */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 12, 2);
    const a = await answer(page);
    assert.equal(a.n, 4, 'Act 2 has four files');
    assert.deepEqual(a.dom.map((f) => f.lines), a.lines, 'Every typed line is what the rules wrote');
    await page.screenshot({ path: shotPath('SW-1366-act2.png') });
    // tap a line with the mouse: the plan lights up
    const first = page.locator('.sw-file[data-file="0"] .sw-line').first();
    await first.click();
    assert.ok(await page.locator('.sw-row.look').count(), 'A clicked line is the one being looked at');
    assert.equal(await sel(page), '0');
    // a mouse click gives the focus back, so Enter closes the case afterwards
    const wrong = (a.stairs + 1) % a.n;
    await page.locator(`.sw-file[data-file="${wrong}"] .sw-sbtn.stairs`).click();
    await page.locator(`.sw-file[data-file="${a.liar}"] .sw-sbtn.liar`).click();
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'BODY', 'A mouse click does not leave the focus on the button');
    await page.screenshot({ path: shotPath('SW-1366-wrong-stamped.png') });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    assert.ok(await page.locator('.sw.over.lost').count(), 'A wrong name for the stairwell loses');
    assert.ok(await page.locator(`.sw-file.truth-stairs[data-file="${a.stairs}"] .sw-ink.stairs.truth`).count(), 'The true stairwell stamp lands on the right file');
    assert.ok(await page.locator(`.sw-file[data-file="${wrong}"] .sw-ink.stairs.wrong`).count(), 'The wrong stamp is shown crossed out');
    assert.match(await page.locator('.sw-slips li.stairs em').innerText(), new RegExp(`It was ${a.calls[a.stairs]}`), 'The slip says who it was');
    await page.screenshot({ path: shotPath('SW-1366-lost.png') });
    await page.locator('.mg-end').waitFor({ timeout: 6000 });
    assert.ok(await page.locator('.mg-end.lost').count(), 'The result: lost');
    assert.ok((await page.locator('.mg-end h2').innerText()).includes(a.calls[a.stairs]), 'The result says who it was');
    await page.close();
  }

  /* ------------------ 3. laptop, act 3: five files fit the screen; by mouse */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 11, 3);
    const a = await answer(page);
    assert.equal(a.n, 5, 'Act 3 has five files');
    assert.deepEqual(a.dom.map((f) => f.lines), a.lines);
    assert.ok(a.lines.some((ls) => ls.some((l) => /lying|telling the truth/.test(l))), 'Act 3 has someone accusing or vouching for someone');
    assert.ok(a.lines.some((ls) => ls[0] === 'I was on the 3rd-floor landing.'), 'Act 3 has the red herring on the landing');
    const bottoms = await page.locator('.sw-file .sw-sbtn').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().bottom)));
    assert.ok(Math.max(...bottoms) <= 700, `Every stamp button is on screen at 1366×700 (lowest ends at ${Math.max(...bottoms)})`);
    const close = await page.locator('.sw-close').boundingBox();
    assert.ok(close.y + close.height <= 700, 'Close the case is on screen');
    await page.screenshot({ path: shotPath('SW-1366-act3.png') });
    await page.locator(`.sw-file[data-file="${a.stairs}"] .sw-sbtn.stairs`).click();
    await page.locator(`.sw-file[data-file="${a.liar}"] .sw-sbtn.liar`).click();
    await page.locator('.sw-close').click();
    await page.waitForTimeout(900);
    assert.ok(await page.locator('.sw.over.won').count(), 'Act 3 solved by mouse: won');
    await page.screenshot({ path: shotPath('SW-1366-act3-won.png') });
    await page.close();
  }

  /* --------------------------------- 4. phone: tabs, real taps, no keys */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => errors.push(e.message));
    const tap = async (loc) => {
      const b = await loc.boundingBox();
      assert.ok(b, 'Something to tap');
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(120);
    };
    await open(page, 11, 3);
    const a = await answer(page);
    assert.equal(a.n, 5);
    assert.ok(await page.locator('.sw.tabbed').count(), 'A phone puts the files behind tabs');
    assert.equal(await page.locator('.sw-key').count(), 0, 'A phone shows no key hints');
    assert.equal(await page.locator('.sw-tab').count(), 5, 'Five tabs');
    let visible = 0;
    for (const f of await page.locator('.sw-file').all()) if (await f.isVisible()) visible++;
    assert.equal(visible, 1, 'One file is open at a time');
    await page.screenshot({ path: shotPath('SW-390-act3.png') });
    // a tap on a line lights the plan, a tap on the strike button crosses it out
    await tap(page.locator('.sw-file.sel .sw-line').nth(1));
    assert.ok(await page.locator('.sw-row.look').count(), 'A tap on a line is the one being looked at');
    assert.ok(await page.locator('.sw-caption').innerText(), 'The plan names what it points at');
    await tap(page.locator('.sw-file.sel .sw-strike').nth(1));
    assert.equal(await page.locator('.sw-row.struck').count(), 1, 'A tap on the strike button crosses the line out');
    await tap(page.locator('.sw-file.sel .sw-strike').nth(1));
    assert.equal(await page.locator('.sw-row.struck').count(), 0, 'and brings it back');
    // another tab: the page turns, that file is the open one
    await tap(page.locator('.sw-tab[data-file="3"]'));
    assert.equal(await sel(page), '3', 'A tab opens that file');
    assert.ok(await page.locator('.sw-file[data-file="3"]').isVisible());
    await page.waitForTimeout(600);
    await page.screenshot({ path: shotPath('SW-390-tab4.png') });

    // stamp the right files with taps; Close the case is on screen
    await tap(page.locator(`.sw-tab[data-file="${a.stairs}"]`));
    await tap(page.locator(`.sw-file[data-file="${a.stairs}"] .sw-sbtn.stairs`));
    await tap(page.locator(`.sw-tab[data-file="${a.liar}"]`));
    await tap(page.locator(`.sw-file[data-file="${a.liar}"] .sw-sbtn.liar`));
    assert.ok(await page.locator(`.sw-file[data-file="${a.liar}"] .sw-ink.liar`).count(), 'A tap stamps');
    assert.ok((await page.locator('.sw-tab .sw-pip').count()) >= 2, 'The tabs show where the stamps are');
    const close = page.locator('.sw-close');
    const cb = await close.boundingBox();
    assert.ok(cb.y + cb.height <= 844, 'Close the case is on screen');
    assert.ok(cb.height >= 40, 'and big enough to tap');
    const sb = await page.locator('.sw-file.sel .sw-sbtn').first().boundingBox();
    assert.ok(sb.height >= 40, 'The stamp buttons are big enough to tap');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotPath('SW-390-stamped.png') });
    await tap(close);
    await page.waitForTimeout(900);
    assert.ok(await page.locator('.sw.over.won').count(), 'Solved by taps: won');
    await page.screenshot({ path: shotPath('SW-390-won.png') });
    await page.close();
  }
  {
    // a phone loses by taps too (a wrong name), and a mistap on a stamp is only moved
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => errors.push(e.message));
    const tap = async (loc) => {
      const b = await loc.boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(120);
    };
    await open(page, 7, 1);
    const a = await answer(page);
    const wrong = (a.stairs + 1) % a.n;
    await tap(page.locator(`.sw-tab[data-file="${a.stairs}"]`));
    await tap(page.locator(`.sw-file[data-file="${a.stairs}"] .sw-sbtn.stairs`)); // a mistap...
    await tap(page.locator(`.sw-tab[data-file="${wrong}"]`));
    await tap(page.locator(`.sw-file[data-file="${wrong}"] .sw-sbtn.stairs`)); // ...moved
    await tap(page.locator(`.sw-file[data-file="${wrong}"] .sw-sbtn.liar`));
    assert.equal(await page.locator('.sw.over').count(), 0, 'Moving a stamp never ends the game');
    await tap(page.locator('.sw-close'));
    await page.waitForTimeout(900);
    assert.ok(await page.locator('.sw.over.lost').count(), 'A wrong name loses on a phone too');
    await page.close();
  }

  /* ------------------------------------------------- 5. reduce motion */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 7, 2);
    assert.ok(await page.locator('.app.mg-calm').count(), 'Reduce Motion: the calm version');
    const name = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).animationName);
    assert.equal(await name('.sw-file'), 'fadeIn', 'The files fade in, they do not slide');
    assert.equal(await name('.sw-plan'), 'fadeIn');
    assert.equal(await page.locator('.sw').evaluate((e) => getComputedStyle(e, '::before').animationName), 'none', 'The lamp does not breathe');
    const a = await answer(page);
    await page.locator(`.sw-file[data-file="${a.stairs}"] .sw-sbtn.stairs`).click();
    assert.equal(await name('.sw-ink'), 'fadeIn', 'A stamp fades in, it does not thump');
    await page.locator(`.sw-file[data-file="${a.liar}"] .sw-sbtn.liar`).click();
    await page.locator('.sw-close').click();
    await page.waitForTimeout(500);
    assert.ok(await page.locator('.sw.over.won').count(), 'Won with Reduce Motion on');
    await page.locator('.mg-end').waitFor({ timeout: 6000 });
    await page.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log('STAIRWELL: files and lines match the rules; laptop: numbers on every file, a number opens a file and lights its line on the plan, ↑ ↓ ← → move, X strikes, L / S stamp and lift, one stamp or a mistap never ends the game, Enter closes only with both stamps: won by keys; a wrong name: lost (true stamps shown); five files fit 1366×700, won by mouse; phone: no key hints, one file behind tabs, real taps on lines, strikes, stamps, Close the case on screen: won, and lost by a wrong name; Reduce Motion calm — all OK');

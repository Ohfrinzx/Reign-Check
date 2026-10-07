import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE, closeDemandPops } from './scenes.mjs';

/**
 * THE AMBASSADOR'S TABLE — played for real in a browser
 * (`node tools/run-browser.mjs ambassador`).
 *
 *   1. Laptop (1366×700): a careful player WINS using the keyboard only
 *      (1–5 pick the price, 6–9 the line, Enter says it). It reads his three
 *      tells from the page (data-level on .am-tell, the course, his price, how
 *      each line landed), never the rules' hidden numbers, and plays the way
 *      the rules' careful player does. The key badges show on a laptop.
 *   Brask's limit (the Finance Minister's note, "Brask's limit $X" above the
 *   prices): his opening price is over it, prices over it are marked, and a
 *   deal over it is lost ("Brask would not sign").
 *   2. A greedy player (always the lowest price, always "Stand firm")
 *      pushes him out: the napkin drops, he leaves, the stamp says so.
 *   3. Phone (390×844, touch): a dinner played with real taps ends in a
 *      result; no key badges or key hint on a phone; the price chips, the
 *      lines and "Make the offer" are all on screen without scrolling.
 *   4. The result goes on to the card's outcome; practice saves nothing. In a
 *      real run (the ledger shows too), everything to play is on screen at
 *      1366×700 and at 390×844.
 *   5. Reduce Motion: the calm version (shorter pauses, nothing loops).
 *   6. The three tells are consistent: each has the same three states in the
 *      same order, and a tell drawn on the page matches its words.
 * AMBASSADOR_SHOTS=1 only takes the pictures (for looking at the design).
 */

const errors = [];
const browser = await launchBrowser();
const SHOTS_ONLY = !!process.env.AMBASSADOR_SHOTS;

async function openPractice(page, { seed = 7, act = 1 } = {}) {
  await page.goto(`${BASE}?practice=ambassador&seed=${seed}&act=${act}`, { waitUntil: 'networkidle' });
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.am').waitFor();
}

/** The dinner, as the page shows it. */
const read = (page) => page.evaluate(() => {
  const root = document.querySelector('.am');
  if (!root) return { gone: true, over: !!document.querySelector('.mg-end') };
  const tells = {};
  for (const el of document.querySelectorAll('.am-tell')) tells[el.dataset.tell] = Number(el.dataset.level);
  const lines = {};
  for (const el of document.querySelectorAll('.am-line')) if (el.dataset.seen) lines[el.dataset.line] = el.dataset.seen;
  return {
    phase: root.dataset.phase, round: Number(root.dataset.round), price: Number(root.dataset.price), over: root.dataset.over,
    limit: Number((document.querySelector('.am-board-limit b')?.textContent ?? '').replace('$', '')),
    tells, lines,
    offers: [...document.querySelectorAll('.am-offer')].map((e) => Number(e.dataset.price)),
  };
});

/**
 * The careful player's choice, made inside the page with the rules' own
 * careful player (it only gets what is on screen: his price, the three
 * tells, and how each line landed so far).
 */
const choose = (page, act) => page.evaluate(async (a) => {
  const A = await import('/src/game/minigames/ambassador.ts');
  const root = document.querySelector('.am');
  const tells = {};
  for (const el of document.querySelectorAll('.am-tell')) tells[el.dataset.tell] = { level: Number(el.dataset.level) };
  const history = [];
  for (const el of document.querySelectorAll('.am-line')) if (el.dataset.seen) history.push({ line: el.dataset.line, reaction: el.dataset.seen });
  const view = {
    round: Number(root.dataset.round), price: Number(root.dataset.price),
    limit: Number((document.querySelector('.am-board-limit b')?.textContent ?? '').replace('$', '')),
    offers: [...document.querySelectorAll('.am-offer')].map((e) => Number(e.dataset.price)), tells, history,
  };
  return A.EXPERT(view, A.ambassadorDifficulty(a));
}, act);

const LINE_KEY = { flatter: '6', history: '7', firm: '8', threaten: '9' };

/** Wait until it is his turn to listen again (or the dinner is over). */
async function settled(page) {
  await page.waitForFunction(() => document.querySelector('.mg-end') || document.querySelector('.am')?.dataset.phase === 'choose', null, { timeout: 15000 });
}

/** A whole dinner by keyboard. `pickMove(d)` returns {offer, line}. Returns the rounds played. */
async function playKeys(page, pickMove) {
  let rounds = 0;
  for (let i = 0; i < 8; i++) {
    await settled(page);
    const d = await read(page);
    if (d.gone) break;
    const m = await pickMove(d);
    await page.keyboard.press(String(m.offer + 1));
    await page.keyboard.press(LINE_KEY[m.line]);
    assert.equal(await page.locator('.am-offer.on').count(), 1, 'One price is chosen');
    assert.equal(await page.locator('.am-line.on').count(), 1, 'One line is chosen');
    await page.keyboard.press('Enter');
    rounds++;
    await page.waitForFunction(() => document.querySelector('.am')?.dataset.phase !== 'choose' || document.querySelector('.mg-end'), null, { timeout: 5000 }).catch(() => {});
  }
  return rounds;
}

/** Tap a chip with a real touch at its centre. */
async function tapAt(page, loc) {
  const b = await loc.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
}

try {
  if (SHOTS_ONLY) {
    for (const vp of [
      { tag: '1366', width: 1366, height: 700 },
      { tag: '390', width: 390, height: 844, touch: true },
      { tag: '360', width: 360, height: 800, touch: true },
      { tag: '844', width: 844, height: 390, touch: true },
      { tag: '768', width: 768, height: 1024, touch: true },
    ]) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, ...(vp.touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
      page.on('pageerror', (e) => errors.push(e.message));
      for (const act of [1, 3]) {
        await openPractice(page, { act, seed: 11 });
        await page.waitForTimeout(1900);
        await page.screenshot({ path: shotPath(`AM-start-a${act}-${vp.tag}.png`) });
        // push him: the lowest price, "Stand firm", twice, so the tells move
        let n = 0;
        for (let i = 0; i < 3; i++) {
          await settled(page);
          const d = await read(page);
          if (d.gone) break;
          await page.keyboard.press('1');
          await page.keyboard.press(i === 0 ? '6' : '8');
          if (i === 0) await page.waitForTimeout(500);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(i === 0 ? 1500 : 2300);
          await page.screenshot({ path: shotPath(`AM-r${++n}-a${act}-${vp.tag}.png`) });
          await page.waitForTimeout(1900);
        }
        await page.screenshot({ path: shotPath(`AM-late-a${act}-${vp.tag}.png`) });
      }
      await page.goto(`${BASE}?practice=ambassador&seed=7`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1300);
      await page.screenshot({ path: shotPath(`AM-veil-${vp.tag}.png`) });
      await page.locator('.mg-story').waitFor();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: shotPath(`AM-story-${vp.tag}.png`) });
      await page.locator('.mg-foot .btn-primary').click();
      await page.locator('.mg-howto li').last().waitFor();
      await page.waitForTimeout(800);
      await page.screenshot({ path: shotPath(`AM-howto-${vp.tag}.png`) });
      await page.close();
    }
  } else {
    /* ----------------------------- 1-2. laptop: a careful dinner, a greedy one */
    const careful = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    const greedy = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    for (const p of [careful, greedy]) p.on('pageerror', (e) => errors.push(e.message));

    await openPractice(careful, { seed: 7, act: 1 });
    // the keys show on a laptop once they are used; a fresh page shows the hint
    assert.equal(await careful.locator('.am-keys').count(), 1, 'A laptop shows the key hint');
    assert.equal(await careful.locator('.am-offer').count(), 5, 'Five prices');
    assert.equal(await careful.locator('.am-line').count(), 4, 'Four lines');
    assert.equal(await careful.locator('.am-tell').count(), 3, 'Three tells');
    assert.equal(await careful.locator('.am-courses li').count(), 5, 'Five courses');
    const d0 = await read(careful);
    assert.equal(d0.round, 1, 'It opens with the first course');
    assert.equal(d0.offers.length, 5);
    for (let i = 1; i < 5; i++) assert.equal(d0.offers[i] - d0.offers[i - 1], 20, 'The prices are $20 apart');
    assert.equal(d0.offers[4], d0.price, 'The top price is his price');
    assert.deepEqual(d0.tells, { face: 2, glass: 2, notes: 2 }, 'At the start he is relaxed: every tell shows it');
    // Brask's limit is on screen from the start (the board and his note), under his opening price
    assert.ok(d0.limit >= 400 && d0.limit < d0.price, `Brask's limit is shown and under his opening price (${d0.limit} < ${d0.price})`);
    assert.match(await careful.locator('.am-svg .am-note').textContent(), new RegExp(`Do not sign above\\$${d0.limit}`), "Brask's note by the plate says the limit");
    assert.equal(await careful.locator('.am-offer[data-idx="4"]').getAttribute('data-over'), '1', 'His own price is over the limit and is marked');
    assert.match(await careful.locator('.am-offer[data-idx="4"] em').innerText(), /over limit/);
    assert.ok((await careful.locator('.am-offer[data-over="0"]').count()) >= 1, 'Some prices are under the limit');
    assert.ok(await careful.locator('.am-go[disabled]').count(), 'Nothing is said until a price and a line are picked');
    // keys 1–5 pick the price, 6–9 the line (and a pick shows its badge)
    await careful.keyboard.press('3');
    assert.equal(await careful.locator('.am-offer.on').getAttribute('data-idx'), '2', 'Key 3 picks the third price');
    await careful.keyboard.press('9');
    assert.equal(await careful.locator('.am-line.on').getAttribute('data-line'), 'threaten', 'Key 9 picks the fourth line');
    assert.deepEqual(await careful.locator('.am-offer kbd').allInnerTexts(), ['1', '2', '3', '4', '5'], 'A laptop shows keys 1–5 on the prices');
    assert.deepEqual(await careful.locator('.am-line kbd').allInnerTexts(), ['6', '7', '8', '9'], 'A laptop shows keys 6–9 on the lines');
    await careful.screenshot({ path: shotPath('AM-picked-1366.png') });

    let dealShot = false;
    const rounds = await playKeys(careful, async (d) => {
      assert.ok(Object.values(d.tells).every((v) => v >= 0 && v <= 2), 'Every tell is one of three states');
      const m = await choose(careful, 1);
      if (!dealShot && d.round >= 2) { dealShot = true; await careful.screenshot({ path: shotPath('AM-round2-1366.png') }); }
      return m;
    });
    await careful.locator('.mg-end').waitFor({ timeout: 8000 });
    assert.ok(await careful.locator('.mg-end.won').count(), `A careful keyboard player closes the deal: ${await careful.locator('.mg-end').innerText()}`);
    assert.match(await careful.locator('.mg-end h2').innerText(), /\$\d{3}/, 'The result names the price');
    assert.match(await careful.locator('.mg-end p').innerText(), /He would have gone as low as \$\d{3}/);
    const signed = Number((await careful.locator('.mg-end h2').innerText()).match(/\$(\d{3})/)[1]);
    assert.ok(signed <= d0.limit, `The deal ($${signed}) is at or under Brask's limit ($${d0.limit})`);
    assert.ok(rounds >= 2, `The dinner took more than one round (${rounds})`);
    await careful.screenshot({ path: shotPath('AM-won-1366.png') });
    await careful.locator('.mg-foot .btn-primary').click();
    await careful.locator('.mg-result-body .outcome').waitFor();
    assert.match(await careful.locator('.mg-result-body .outcome').innerText(), /gas|price|pipes|Ostrene/i);
    await careful.locator('.mg-result-body .outcome-foot .btn-primary').click();
    await careful.locator('.title-screen').waitFor();
    assert.equal(await careful.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1')), null, 'Practice must not save a run');

    // greedy: always the lowest price, always "Stand firm" — he walks out
    await openPractice(greedy, { seed: 7, act: 2 });
    let sawDrop = false;
    await playKeys(greedy, async (d) => {
      if (d.tells.face < 2 || d.tells.glass < 2 || d.tells.notes < 2) sawDrop = true;
      return { offer: 0, line: 'firm' };
    });
    await greedy.locator('.mg-end').waitFor({ timeout: 8000 });
    assert.ok(await greedy.locator('.mg-end.lost').count(), 'A greedy player loses');
    assert.match(await greedy.locator('.mg-stamp').innerText(), /walked/i, 'The stamp says he walked out');
    assert.match(await greedy.locator('.mg-end h2').innerText(), /walked out/i);
    assert.ok(sawDrop, 'His tells showed it before he left');
    await greedy.screenshot({ path: shotPath('AM-lost-1366.png') });
    await greedy.locator('.mg-foot .btn-primary').click();
    await greedy.locator('.mg-result-body .outcome').waitFor();
    assert.match(await greedy.locator('.mg-result-body .outcome').innerText(), /napkin|walked|left/i);
    await greedy.close();
    await careful.close();

    // caving: his own price is over Brask's limit, so signing it loses
    const cave = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    cave.on('pageerror', (e) => errors.push(e.message));
    await openPractice(cave, { seed: 7, act: 1 });
    await cave.keyboard.press('5');
    await cave.keyboard.press('6');
    await cave.keyboard.press('Enter');
    await cave.locator('.mg-end').waitFor({ timeout: 10000 });
    assert.ok(await cave.locator('.mg-end.lost').count(), 'Caving to his price loses');
    assert.match(await cave.locator('.mg-end h2').innerText(), /Brask would not sign \$\d{3}/, 'The headline says Brask would not sign');
    assert.match(await cave.locator('.mg-end p').innerText(), /Brask's limit was \$\d{3}/, 'The detail says the limit');
    await cave.screenshot({ path: shotPath('AM-caved-1366.png') });
    await cave.locator('.mg-foot .btn-primary').click();
    await cave.locator('.mg-result-body .outcome').waitFor();
    assert.match(await cave.locator('.mg-result-body .outcome').innerText(), /napkin|walked|left|valve/i, 'A lost dinner gets the lost outcome');
    await cave.close();

    /* --------------------------------- 3. phone: a dinner played by real taps */
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    phone.on('pageerror', (e) => errors.push(e.message));
    await openPractice(phone, { seed: 11, act: 1 });
    assert.equal(await phone.locator('.am-keys').count(), 0, 'A phone shows no key hint');
    assert.equal(await phone.locator('.am-offer kbd, .am-line kbd').count(), 0, 'A phone shows no key badges');
    const onScreen = async () => phone.evaluate(() => {
      const H = window.innerHeight;
      return [...document.querySelectorAll('.am-offer, .am-line, .am-go')].every((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= H; });
    });
    assert.ok(await onScreen(), 'Every price, line and the button are on screen without scrolling (390×844)');
    let tapped = 0;
    for (let i = 0; i < 8; i++) {
      await settled(phone);
      const d = await read(phone);
      if (d.gone) break;
      const m = await choose(phone, 1);
      await tapAt(phone, phone.locator(`.am-offer[data-idx="${m.offer}"]`));
      assert.equal(await phone.locator('.am-offer.on').getAttribute('data-idx'), String(m.offer), 'One tap picks one price');
      await tapAt(phone, phone.locator(`.am-line[data-line="${m.line}"]`));
      assert.equal(await phone.locator('.am-line.on').getAttribute('data-line'), m.line, 'One tap picks one line');
      if (i === 0) await phone.screenshot({ path: shotPath('AM-tap-390.png') });
      await tapAt(phone, phone.locator('.am-go'));
      tapped++;
      await phone.waitForFunction(() => document.querySelector('.am')?.dataset.phase !== 'choose' || document.querySelector('.mg-end'), null, { timeout: 5000 }).catch(() => {});
      if (i === 0) { await phone.waitForTimeout(1900); await phone.screenshot({ path: shotPath('AM-answer-390.png') }); }
    }
    await phone.locator('.mg-end').waitFor({ timeout: 8000 });
    assert.ok(await phone.locator('.mg-end.won').count(), `A careful player closes the deal by tapping: ${await phone.locator('.mg-end').innerText()}`);
    assert.ok(tapped >= 1);
    await phone.screenshot({ path: shotPath('AM-won-390.png') });
    await phone.close();

    /* ---- 4. in a real run (the ledger shows too): everything on screen */
    for (const vp of [{ width: 1366, height: 700 }, { width: 390, height: 844, touch: true }, { width: 360, height: 640, touch: true }]) {
      const run = await browser.newPage({ viewport: vp, ...(vp.touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
      run.on('pageerror', (e) => errors.push(e.message));
      await run.goto(BASE, { waitUntil: 'networkidle' });
      await run.evaluate(async () => {
        localStorage.clear();
        const st = await import('/src/game/state.ts');
        const en = await import('/src/game/engine.ts');
        const { saveGame } = await import('/src/game/save.ts');
        let s = st.createGame({ seed: 4, leaderName: 'Adrin Vo', mandateId: 'accident' });
        s.day = 3;
        s = en.prepareDay(s);
        s.todayDeck = ['mg-ambassador'];
        s.agenda = ['government'];
        saveGame(en.beginStages(s));
      });
      await run.reload({ waitUntil: 'networkidle' });
      await run.getByRole('button', { name: /^Continue — Day/ }).click();
      await closeDemandPops(run);
      await run.locator('.app.mg-ambassador .mg-story').waitFor();
      await run.locator('.mg-foot .btn-primary').click();
      await run.locator('.mg-foot .btn-primary').click();
      await run.locator('.am').waitFor();
      await run.waitForTimeout(1200);
      assert.ok(await run.locator('.mg-top .res').count(), 'The three resources stay visible');
      const boxes = await run.locator('.am-offer, .am-line, .am-go').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      assert.equal(boxes.length, 10);
      if (vp.height >= 700) assert.ok(boxes.every((b) => b <= vp.height), `Every price, line and the button are on screen without scrolling at ${vp.width}×${vp.height}: ${Math.max(...boxes)}`);
      await run.screenshot({ path: shotPath(`AM-run-${vp.width}.png`) });
      await run.close();
    }

    /* ------------------------------------------------- 5. reduce motion */
    const calm = await browser.newPage({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce' });
    calm.on('pageerror', (e) => errors.push(e.message));
    await openPractice(calm, { seed: 7, act: 1 });
    assert.ok(await calm.locator('.app.mg-calm').count(), 'Reduce Motion: the calm version');
    assert.equal(await calm.locator('.am.calm').count(), 1);
    assert.equal(await calm.locator('.am-bottle').count(), 0);
    await calm.waitForTimeout(1200);
    const loops = await calm.evaluate(() => [...document.querySelectorAll('.am-flame, .am-glow, .am-breathe, .am-glassmove')].filter((e) => {
      const cs = getComputedStyle(e);
      return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite';
    }).length);
    assert.equal(loops, 0, 'Reduce Motion: nothing loops');
    // the same dinner plays; a calm round is shorter than the full one
    const t0 = Date.now();
    await calm.keyboard.press('1');
    await calm.keyboard.press('8');
    await calm.keyboard.press('Enter');
    await settled(calm);
    const took = Date.now() - t0;
    assert.ok(took < 2600, `Reduce Motion: a round takes less time (${took} ms)`);
    await calm.screenshot({ path: shotPath('AM-calm-1366.png') });
    await calm.close();

    /* --------------------------- 6. the tells are consistent, in a later act */
    const act3 = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    act3.on('pageerror', (e) => errors.push(e.message));
    await openPractice(act3, { seed: 23, act: 3 });
    const seen = new Set();
    await playKeys(act3, async (d) => {
      const names = await act3.locator('.am-tell-v').allInnerTexts();
      names.forEach((t, i) => seen.add(`${['face', 'glass', 'notes'][i]}:${d.tells[['face', 'glass', 'notes'][i]]}:${t.trim()}`));
      return choose(act3, 3);
    });
    await act3.locator('.mg-end').waitFor({ timeout: 8000 });
    const words = { face: ['About to stand', 'Irritated', 'Relaxed'], glass: ['Pushed away', 'Untouched', 'Sipping'], notes: ['Closed', 'Crossing out', 'Writing numbers'] };
    for (const entry of seen) {
      const [tell, level, text] = entry.split(':');
      assert.equal(text, words[tell][Number(level)], `A ${tell} at level ${level} is always called "${words[tell][Number(level)]}"`);
    }
    assert.ok(await act3.locator('.mg-end.won').count(), 'The careful player also closes act 3');
    await act3.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log(SHOTS_ONLY
  ? 'AMBASSADOR: pictures taken'
  : 'AMBASSADOR: a careful dinner won by keyboard at 1366×700 (1–5 price, 6–9 line, Enter; he is relaxed at the start, the tells are read from the page), a greedy one lost (he walked out, the napkin drops, the stamp says so), a dinner won by real taps at 390×844 (no key badges, everything on screen), result → outcome, nothing saved; in a real run everything is on screen; Reduce Motion calm and shorter, nothing loops; the three tells keep their words in act 3 — all OK');

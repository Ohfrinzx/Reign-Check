import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE, closeDemandPops } from './scenes.mjs';

/**
 * MINI-GAMES (Phase 5) — both games played for real in a browser, at the
 * desktop test size (1366×700) and on a phone (390×844, touch).
 *
 *   1. Hold the Palace (practice mode, fixed seed): the same night is
 *      simulated in the page with the game's own rules and a greedy player;
 *      its orders are given by tapping the board (and by keyboard), and the
 *      screen must end the way the simulation did. Then a loss by holding.
 *   2. The 7pm Bulletin: a perfect bulletin by keyboard (won), a careless one
 *      (lost), a story left alone airs when its clock runs out, and a swipe
 *      left spikes on a phone.
 *   3. In a real run: the daily game replaces a card, reload restarts the
 *      SAME game at its story, number keys do nothing, Give up asks first and
 *      counts as a loss, the result costs Legitimacy, and the day goes on.
 *   4. The Army's strike: losing it ends the run (the result shows first).
 *   5. Reduce Motion: the calm look, and the searchlight is off.
 *   6. The opening title card: the game's name and a line of what is going
 *      on, gone by itself in about 2-3 s; a tap skips it.
 */

const errors = [];
const browser = await launchBrowser();

async function openPractice(page, game, seed = 7, act = 1) {
  await page.goto(`${BASE}?practice=${game}&seed=${seed}&act=${act}`, { waitUntil: 'networkidle' });
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-play').waitFor();
}

/** The practice night, re-created in the page, played by a greedy commander. */
async function greedyOrders(page) {
  return page.evaluate(async () => {
    const P = await import('/src/game/minigames/palace.ts');
    const { practiceGame } = await import('/src/ui/minigames/practice.ts');
    const { minigameSeed } = await import('/src/game/minigames/index.ts');
    const s = practiceGame(location.search);
    const card = s.current.cardId;
    const setup = P.palaceSetup(minigameSeed(s, card), P.palaceDifficulty(card === 'mg-palace-strike' ? 'strike' : 'plot', s.act, 0.5));
    let st = P.palaceStart(setup);
    const orders = [];
    for (let g = 0; g < 200 && !st.over; g++) {
      let best = null;
      for (const gu of st.guards) for (const t of P.guardTargets(st, gu.id)) if (t.attack) {
        const r = st.rebels.find((x) => x.col === t.col && x.row === t.row);
        const v = r.row * 10 + (r.armour === 1 ? 5 : 0);
        if (!best || v > best.v) best = { v, g: gu.id, t };
      }
      if (!best && st.rebels.length) {
        const threat = [...st.rebels].sort((a, b) => b.row - a.row)[0];
        const goal = { col: threat.col, row: Math.min(P.ROWS - 1, threat.row + 1) };
        for (const gu of st.guards) for (const t of P.guardTargets(st, gu.id)) {
          const v = -Math.max(Math.abs(t.col - goal.col), Math.abs(t.row - goal.row)) * 10 + t.row;
          if (!best || v > best.v) best = { v, g: gu.id, t };
        }
      }
      if (!best) { orders.push({ hold: true }); st = P.endTurn(st); continue; }
      const gu = st.guards.find((x) => x.id === best.g);
      orders.push({ from: [gu.col, gu.row], to: [best.t.col, best.t.row] });
      st = P.playOrder(st, best.g, best.t.col, best.t.row);
    }
    return { orders, over: st.over, captured: st.captured };
  });
}

const cell = (page, col, row) => page.locator('.pz-cell').nth(row * 5 + col);

try {
  /* ------------------------------------------------- 1. Hold the Palace */
  for (const vp of [{ width: 1366, height: 700, touch: false }, { width: 390, height: 844, touch: true }]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      ...(vp.touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    });
    page.on('pageerror', (e) => errors.push(e.message));
    // find a night the greedy commander wins, so the win path is exercised
    let plan = null, seed = 7;
    for (; seed < 30; seed++) {
      await page.goto(`${BASE}?practice=palace&seed=${seed}`, { waitUntil: 'networkidle' });
      plan = await greedyOrders(page);
      if (plan.over === 'won') break;
    }
    assert.equal(plan.over, 'won', 'No winnable practice night found for the greedy player');
    await openPractice(page, 'palace', seed);
    assert.ok(await page.locator('.pz-tok.guard').count() === 3, 'Three Guard units on the board');
    const press = (loc) => (vp.touch ? loc.tap() : loc.click());
    let n = 0;
    for (const o of plan.orders) {
      if (o.hold) await press(page.locator('.pz-hold'));
      else {
        await press(cell(page, o.from[0], o.from[1]));
        assert.ok(await page.locator('.pz-cell.tgt').count() > 0, 'Selecting a unit lights the blocks it can reach');
        await press(cell(page, o.to[0], o.to[1]));
      }
      n++;
      if (n === 3) await page.screenshot({ path: shotPath(`MG-palace-${vp.width}.png`) });
      await page.waitForTimeout(470);
    }
    await page.locator('.mg-end').waitFor();
    assert.ok(await page.locator('.mg-end.won').count(), 'The board should end the way the rules did (won)');
    assert.match(await page.locator('.mg-end p').innerText(), new RegExp(`stopped ${plan.captured} of`));
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome').waitFor();
    assert.match(await page.locator('.mg-result-body .outcome').innerText(), /held the Palace/i);
    await page.screenshot({ path: shotPath(`MG-palace-result-${vp.width}.png`) });
    await page.locator('.mg-result-body .outcome-foot .btn-primary').click();
    await page.locator('.title-screen').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1')), null, 'Practice must not save a run');

    // holding every turn loses the Palace; keyboard on desktop
    await openPractice(page, 'palace', seed);
    if (!vp.touch) {
      await page.keyboard.press('2');
      assert.ok(await page.locator('.pz-tok.guard.sel').count(), 'Key 2 selects Guard unit 2');
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(470);
      assert.ok(await page.locator('.pz-tok.guard.sel').count() === 0, 'An order clears the selection');
    }
    for (let i = 0; i < 40 && !(await page.locator('.mg-end').count()); i++) {
      if (await page.locator('.pz-hold:not([disabled])').count()) await press(page.locator('.pz-hold'));
      await page.waitForTimeout(450);
    }
    assert.ok(await page.locator('.mg-end.lost').count(), 'Holding every turn should lose the Palace');
    await page.close();
  }

  /* ---------------------------------------------- 2. The 7pm Bulletin */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    const answers = async () => page.evaluate(async () => {
      const { practiceGame } = await import('/src/ui/minigames/practice.ts');
      const { minigameSeed } = await import('/src/game/minigames/index.ts');
      const { bulletinSetup } = await import('/src/game/minigames/bulletin.ts');
      const s = practiceGame(location.search);
      return bulletinSetup(s, minigameSeed(s, s.current.cardId)).stories.map((x) => ({ h: x.headline, bad: x.bad }));
    });
    await openPractice(page, 'bulletin', 3);
    const key = await answers();
    for (let i = 0; i < key.length; i++) {
      assert.equal(await page.locator('.bt-story h2').innerText(), key[i].h, `Story ${i + 1} should be the rundown's`);
      await page.keyboard.press(key[i].bad ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(420);
      if (i === 1) await page.screenshot({ path: shotPath('MG-bulletin-1366.png') });
    }
    await page.locator('.mg-end').waitFor();
    assert.ok(await page.locator('.mg-end.won').count(), 'A perfect bulletin is a win');
    assert.equal(await page.locator('.bt-rundown li.ok').count(), 0, 'The game screen is gone after the end');
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome.good').waitFor();

    // careless: run everything → the damaging stories air → lost
    await openPractice(page, 'bulletin', 3);
    for (let i = 0; i < key.length; i++) { await page.locator('.bt-run').click(); await page.waitForTimeout(420); }
    await page.locator('.mg-end.lost').waitFor();

    // a story left alone airs when its clock runs out (5 s in act 1)
    await openPractice(page, 'bulletin', 3);
    const first = await page.locator('.bt-story h2').innerText();
    await page.waitForTimeout(5600);
    assert.notEqual(await page.locator('.bt-story h2').innerText(), first, 'An untouched story should air and the next one come up');
    assert.equal(await page.locator('.bt-rundown li.ok, .bt-rundown li.miss').count(), 1, 'The aired story is judged');
    await page.close();

    // phone: swipe left spikes; buttons by tap
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    phone.on('pageerror', (e) => errors.push(e.message));
    await openPractice(phone, 'bulletin', 3);
    const spikesBefore = await phone.locator('.bt-count b').first().innerText();
    await phone.waitForTimeout(500); // the story's slide-in
    const box = await phone.locator('.bt-story').boundingBox();
    // a real touch swipe (CDP), the way a finger does it
    const cdp = await phone.context().newCDPSession(phone);
    const x0 = box.x + box.width / 2, y0 = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let dx = 20; dx <= 160; dx += 20) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - dx, y: y0 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await phone.waitForTimeout(450);
    assert.equal(Number(await phone.locator('.bt-count b').first().innerText()), Number(spikesBefore) - 1, 'A swipe left should spike the story');
    await phone.locator('.bt-run').tap();
    await phone.waitForTimeout(420);
    assert.equal(await phone.locator('.bt-rundown li.ok, .bt-rundown li.miss').count(), 2, 'Two stories called by swipe and tap');
    await phone.screenshot({ path: shotPath('MG-bulletin-390.png') });
    await phone.close();
  }

  /* --------------------------------------------------- 3. in a real run */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const before = await page.evaluate(async () => {
      localStorage.clear();
      const st = await import('/src/game/state.ts');
      const en = await import('/src/game/engine.ts');
      const { saveGame } = await import('/src/game/save.ts');
      let s = en.prepareDay(st.createGame({ seed: 4, leaderName: 'Adrin Vo', mandateId: 'accident' }));
      // day 1 has no daily game; play to day 2's mini-game
      for (let i = 0; i < 400 && !(s.phase === 'stage' && en.activeCard(s)?.minigame); i++) {
        if (s.phase === 'briefing') s = en.beginStages(s);
        else if (s.phase === 'stage' || s.phase === 'alert') {
          const o = en.orderedOptions(s, en.activeCard(s)).find((x) => x.because?.kind !== 'lock' && (!x.enabled || x.enabled(s)));
          s = en.chooseOption(s, o.id);
        } else if (s.phase === 'resolve') s = en.continueAfterResolve(s);
        else if (s.phase === 'alertResolve') s = en.continueAfterAlert(s);
        else if (s.phase === 'night') s = en.openShop(s);
        else if (s.phase === 'shop') s = en.leaveShop(s);
      }
      saveGame(s);
      return { day: s.day, card: s.current.cardId, stage: s.stageIndex, deck: s.todayDeck.length, legit: s.stats.legitimacy };
    });
    assert.equal(before.day, 2, 'The first daily mini-game comes on day 2');
    assert.equal(before.card, 'mg-bulletin');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
    await closeDemandPops(page);
    // a title card says what is happening before the game's story
    await page.locator('.mg-veil.in .mg-veil-title').waitFor();
    assert.match(await page.locator('.mg-veil-title').innerText(), /^the 7pm bulletin$/i);
    assert.match(await page.locator('.mg-veil-kicker').innerText(), /mini-game/i);
    assert.ok((await page.locator('.mg-veil-teaser').innerText()).length > 10, 'The title card says what is going on');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotPath('MG-veil-bulletin.png') });
    const t0 = Date.now();
    await page.locator('.app.mg-full.mg-bulletin .mg-story').waitFor();
    await page.locator('.mg-veil').waitFor({ state: 'detached' });
    assert.ok(Date.now() - t0 < 3200, 'The title card leaves by itself');
    assert.ok(await page.locator('.mg-top .res').count(), 'The three resources stay visible in a mini-game');
    await page.screenshot({ path: shotPath('MG-run-story.png') });
    await page.keyboard.press('1'); // number keys choose options on cards, never here
    await page.waitForTimeout(150);
    assert.ok(await page.locator('.mg-story').count(), 'A number key must not resolve a mini-game');
    await page.keyboard.press('Enter');
    await page.locator('.mg-howto').waitFor();
    await page.keyboard.press('Enter');
    await page.locator('.mg-play').waitFor();
    const headline = await page.locator('.bt-story h2').innerText();

    // reload mid-game: back to the story, and the same game
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
    await closeDemandPops(page);
    await page.locator('.mg-story').waitFor();
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-foot .btn-primary').click();
    assert.equal(await page.locator('.bt-story h2').innerText(), headline, 'A reload restarts the SAME game');

    // Give up asks first, then counts as a loss
    await page.locator('.mg-quit').click();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    assert.ok(await page.locator('.mg-play').count(), '"Keep playing" goes back to the game');
    await page.locator('.mg-quit').click();
    await page.getByRole('button', { name: 'Yes, give up' }).click();
    await page.locator('.mg-end.lost').waitFor();
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome.bad').waitFor();
    assert.match(await page.locator('.mg-result-body .deltas').innerText(), /LEGITIMACY −/);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
    assert.ok(after.stats.legitimacy < before.legit, 'Losing costs Legitimacy');
    assert.ok(after.flags['mark:bulletin-aired'], 'The loss is on the record');
    await page.locator('.mg-result-body .outcome-foot .btn-primary').click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.mg-full').count(), 0, 'Back to the ordinary day');
    const next = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')));
    assert.ok(next.stageIndex > before.stage || next.phase !== 'stage', 'The day moved on');
    await page.close();
  }

  /* -------------------------------------------- 4. the Army's strike */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      localStorage.clear();
      const st = await import('/src/game/state.ts');
      const en = await import('/src/game/engine.ts');
      const { DEMANDS } = await import('/src/game/content/demands.ts');
      const { saveGame } = await import('/src/game/save.ts');
      const s = st.createGame({ seed: 3, leaderName: 'Adrin Vo', mandateId: 'accident' });
      s.day = 3;
      for (const f of Object.values(s.factions)) { f.patience = 70; f.loyalty = 50; }
      Object.assign(s.factions.staff, { loyalty: 5, power: 100, patience: 5 });
      const def = DEMANDS.find((d) => d.faction === 'staff');
      s.factions.staff.demand = { id: def.id, issuedDay: 1, dueDay: 2, severity: 'ultimatum', bribes: 0 };
      saveGame(en.beginStages(en.prepareDay(s)));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Continue — Day/ }).click();
    await closeDemandPops(page);
    await page.locator('.mg-palace .mg-story').waitFor();
    assert.match(await page.locator('.mg-story').innerText(), /ultimatum ran out/i);
    await page.locator('.mg-foot .btn-primary').click();
    assert.match(await page.locator('.mg-stakes .lose').innerText(), /run ends/i, 'The stakes say a loss ends the run');
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-quit').click();
    await page.getByRole('button', { name: 'Yes, give up' }).click();
    await page.locator('.mg-foot .btn-primary').click();
    await page.locator('.mg-result-body .outcome').waitFor();
    await page.locator('.mg-result-body .outcome-foot .btn-primary').click();
    await page.locator('.ending-sheet').waitFor();
    assert.match(await page.locator('.ending-title').innerText(), /.+/);
    await page.close();
  }

  /* ------------------------------------------ 6. the title card skips */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}?practice=palace&seed=7`, { waitUntil: 'networkidle' });
    await page.locator('.mg-veil.in').waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: shotPath('MG-veil-palace-390.png') });
    const t0 = Date.now();
    await page.locator('.mg-veil').tap();
    await page.locator('.mg-story').waitFor();
    assert.ok(Date.now() - t0 < 900, 'A tap skips the title card');
    await page.locator('.mg-veil').waitFor({ state: 'detached' });
    await page.close();
  }

  /* ---------------------------------------------- 5. reduce motion */
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(e.message));
    await openPractice(page, 'palace', 7);
    assert.ok(await page.locator('.app.mg-calm').count(), 'Reduce Motion: the calm version');
    assert.equal(await page.locator('.pz-sweep').evaluate((e) => getComputedStyle(e).display), 'none', 'Reduce Motion: no searchlight');
    await page.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log('MINIGAMES: Hold the Palace won by tapping (desktop + phone) and lost by holding, keyboard orders; Bulletin won by keys, lost by carelessness, clock airs an untouched story, swipe spikes on a phone; daily game on day 2 of a real run, same game after reload, number keys ignored, Give up confirms and costs Legitimacy, day continues; the Army strike lost ends the run; Reduce Motion calm — all OK');

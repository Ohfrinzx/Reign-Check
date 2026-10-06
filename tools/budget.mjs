import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE, closeDemandPops } from './scenes.mjs';

/**
 * BUDGET NIGHT — played for real in a browser (`node tools/run-browser.mjs budget`).
 *
 *   1. Laptop (1366×700): a careful player WINS using the keyboard only
 *      (1–5 pick a jar, ↑/↓ move $1B), reading the desk from the DOM (the
 *      jars, the cash box and Brask's slips carry data- attributes). The key
 *      badges show; a digit selects a jar; one ↑ moves exactly $1B.
 *   2. Doing nothing LOSES (two walk-outs, the stamp says so), at the same time.
 *   3. Phone (390×844, touch): a careful player wins with real taps on + and −;
 *      one tap = one $1B; no key badges or key hints on a phone.
 *   4. The result goes on to the card's outcome; practice saves nothing. In
 *      a real run (the ledger shows too), every + and − is on screen
 *      without scrolling, on a laptop and on a phone.
 *   5. Reduce Motion: the calm version, a slower clock (×1.5), no flying notes.
 * BUDGET_SHOTS=1 only takes the pictures (for looking at the design).
 */

const errors = [];
const browser = await launchBrowser();
const SHOTS_ONLY = !!process.env.BUDGET_SHOTS;

async function openPractice(page, { seed = 7, act = 1, extra = '' } = {}) {
  await page.goto(`${BASE}?practice=budget&seed=${seed}&act=${act}${extra}`, { waitUntil: 'networkidle' });
  await page.locator('.mg-story').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.mg-howto').waitFor();
  await page.locator('.mg-foot .btn-primary').click();
  await page.locator('.bn').waitFor();
}

/** The desk, as the page shows it. */
const read = (page) => page.evaluate(() => {
  const jars = [...document.querySelectorAll('.bn-jar')].map((e) => ({
    money: +e.dataset.money, line: +e.dataset.line, patience: +e.dataset.patience, out: e.dataset.out === '1',
  }));
  const tray = document.querySelector('.bn-tray');
  const slips = [...document.querySelectorAll('.bn-slip[data-kind]')]
    .map((e) => ({ kind: e.dataset.kind, jar: +e.dataset.jar, amount: +e.dataset.amount, in: +e.dataset.in }))
    .sort((a, b) => a.in - b.in);
  return {
    jars, slips, unspent: tray ? +tray.dataset.unspent : 0,
    t: +(document.querySelector('.bn')?.dataset.t ?? 0), over: !!document.querySelector('.mg-end'),
  };
});

/**
 * A careful player's plan from what is on the desk: every line met; a rise
 * on a slip paid in advance if there is money; in a squeeze, the most
 * patient faction waits (swapped when it runs much lower than another).
 */
function plan(d, memo) {
  const T = d.jars.map((j) => (j.out ? j.money : j.line));
  const active = d.jars.map((_, i) => i).filter((i) => !d.jars[i].out);
  const pot = d.unspent + d.jars.reduce((a, j) => a + j.money, 0);
  const avail = pot - d.jars.filter((j) => j.out).reduce((a, j) => a + j.money, 0);
  const need = active.reduce((a, i) => a + d.jars[i].line, 0);
  if (need <= avail) {
    memo.victim = undefined;
    let spare = avail - need;
    for (const s of d.slips) {
      if (s.kind === 'cut') spare -= s.amount;
      if (spare <= 0) break;
      if (s.kind === 'up') { const add = Math.min(s.amount, spare, 14 - T[s.jar]); T[s.jar] += add; spare -= add; }
    }
    return T;
  }
  let deficit = need - avail;
  const byPatience = [...active].sort((a, b) => d.jars[b].patience - d.jars[a].patience || a - b);
  let v = memo.victim;
  if (v === undefined || d.jars[v].out || d.jars[byPatience[0]].patience - d.jars[v].patience > 30) v = byPatience[0];
  memo.victim = v;
  for (const i of [v, ...byPatience.filter((x) => x !== v)]) {
    const cut = Math.min(deficit, T[i]); T[i] -= cut; deficit -= cut;
    if (deficit <= 0) break;
  }
  return T;
}

/** The next $1B to move: fill the most urgent short jar, else take back a surplus. */
function nextMove(d, T) {
  const short = d.jars.map((_, i) => i).filter((i) => !d.jars[i].out && d.jars[i].money < T[i])
    .sort((a, b) => Number(d.jars[a].money >= d.jars[a].line) - Number(d.jars[b].money >= d.jars[b].line) || d.jars[a].patience - d.jars[b].patience);
  if (short.length && d.unspent > 0) return { jar: short[0], dir: 1 };
  const over = d.jars.map((_, i) => i).filter((i) => !d.jars[i].out && d.jars[i].money > T[i])
    .sort((a, b) => (d.jars[b].money - T[b]) - (d.jars[a].money - T[a]));
  return over.length ? { jar: over[0], dir: -1 } : null;
}

/** Play the evening by plan; `press(jar, dir)` makes one move. Returns the moves made. */
async function playByPlan(page, press) {
  const memo = {};
  let moves = 0;
  for (let i = 0; i < 6000; i++) {
    const d = await read(page);
    if (d.over || !d.jars.length) break;
    const mv = nextMove(d, plan(d, memo));
    if (mv) { await press(mv.jar, mv.dir); moves++; } else await page.waitForTimeout(80);
  }
  return moves;
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
      for (const [name, extra, act] of [['6s', '&freeze=6000', 1], ['12s', '&freeze=12000', 1], ['a3', '&freeze=36000', 3]]) {
        await openPractice(page, { extra, act });
        await page.waitForTimeout(900);
        await page.screenshot({ path: shotPath(`BN-${name}-${vp.tag}.png`) });
      }
      await page.goto(`${BASE}?practice=budget&seed=7`, { waitUntil: 'networkidle' });
      await page.locator('.mg-story').waitFor();
      await page.locator('.mg-foot .btn-primary').click();
      await page.locator('.mg-howto li').last().waitFor();
      await page.waitForTimeout(800);
      await page.screenshot({ path: shotPath(`BN-howto-${vp.tag}.png`) });
      if (vp.tag === '1366') {
        await page.goto(`${BASE}?practice=budget&seed=7`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1300);
        await page.screenshot({ path: shotPath('BN-veil-1366.png') });
      }
      await page.close();
    }
  } else {
    /* ---------------------------------- 1-2. laptop: keys win, idle loses */
    const desk = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    const idle = await browser.newPage({ viewport: { width: 1366, height: 700 } });
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    for (const p of [desk, idle, phone]) p.on('pageerror', (e) => errors.push(e.message));

    const laptop = (async () => {
      await openPractice(desk, { seed: 7, act: 1 });
      assert.equal(await desk.locator('.bn-jar').count(), 5, 'Five jars');
      assert.deepEqual(await desk.locator('.bn-key').allInnerTexts(), ['1', '2', '3', '4', '5'], 'A laptop shows keys 1–5 on the jars');
      assert.equal(await desk.locator('.bn-keys').count(), 1, 'A laptop shows the key hint');
      // a digit picks a jar; ↑ puts in exactly $1B, ↓ takes it back
      const d0 = await read(desk);
      const j = d0.jars.findIndex((x) => !x.out && x.money < 14);
      await desk.keyboard.press(String(j + 1));
      assert.ok(await desk.locator(`.bn-jar[data-jar="${j}"].sel`).count(), 'The digit selects that jar');
      if (d0.unspent > 0) {
        await desk.keyboard.press('ArrowUp');
        const d1 = await read(desk);
        assert.equal(d1.jars[j].money, d0.jars[j].money + 1, 'One ↑ puts in $1B');
        assert.equal(d1.unspent, d0.unspent - 1, 'The money comes out of the unspent money');
        await desk.keyboard.press('ArrowDown');
        assert.equal((await read(desk)).jars[j].money, d0.jars[j].money, 'One ↓ takes $1B back');
      }
      let sel = j;
      const moves = await playByPlan(desk, async (jar, dir) => {
        if (jar !== sel) { await desk.keyboard.press(String(jar + 1)); sel = jar; }
        await desk.keyboard.press(dir === 1 ? 'ArrowUp' : 'ArrowDown');
      });
      await desk.screenshot({ path: shotPath('BN-end-1366.png') });
      await desk.locator('.mg-end').waitFor();
      assert.ok(await desk.locator('.mg-end.won').count(), `A careful keyboard player wins: ${await desk.locator('.mg-end').innerText()}`);
      assert.match(await desk.locator('.mg-end p').innerText(), /You moved \$\d+B/);
      assert.ok(moves >= 10, `The evening needs action (${moves} moves)`);
      await desk.locator('.mg-foot .btn-primary').click();
      await desk.locator('.mg-result-body .outcome').waitFor();
      assert.match(await desk.locator('.mg-result-body .outcome').innerText(), /budget|eight/i);
      await desk.locator('.mg-result-body .outcome-foot .btn-primary').click();
      await desk.locator('.title-screen').waitFor();
      assert.equal(await desk.evaluate(() => localStorage.getItem('dictator-sandbox:save:v1')), null, 'Practice must not save a run');
    })();

    const doNothing = (async () => {
      await openPractice(idle, { seed: 7, act: 1 });
      await idle.locator('.bn-jar.out').first().waitFor({ timeout: 40000 });
      await idle.screenshot({ path: shotPath('BN-walkout-1366.png') });
      assert.ok(await idle.locator('.bn-jar.out .bn-stamp').count(), 'A faction that walks out gets the stamp');
      assert.ok(await idle.locator('.bn-jar.out .bn-btn:not([disabled])').count() === 0, 'A sealed jar takes no money');
      await idle.locator('.mg-end').waitFor({ timeout: 60000 });
      assert.ok(await idle.locator('.mg-end.lost').count(), 'Doing nothing loses');
      assert.match(await idle.locator('.mg-stamp').innerText(), /walk-out/i);
      assert.match(await idle.locator('.mg-end h2').innerText(), /Two walk-outs/);
    })();

    /* ---------------------------------------------- 3. phone: real taps */
    const tapping = (async () => {
      await openPractice(phone, { seed: 11, act: 1 });
      assert.equal(await phone.locator('.bn-key').count(), 0, 'A phone shows no key badges');
      assert.equal(await phone.locator('.bn-keys').count(), 0, 'A phone shows no key hint');
      const btn = (jar, dir) => phone.locator(`.bn-jar[data-jar="${jar}"] .bn-btn.${dir === 1 ? 'plus' : 'minus'}`);
      const tapAt = async (loc) => { const b = await loc.boundingBox(); await phone.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
      // one tap = one $1B
      const d0 = await read(phone);
      const j = d0.jars.findIndex((x) => x.money > 0);
      await tapAt(btn(j, -1));
      const d1 = await read(phone);
      assert.equal(d1.jars[j].money, d0.jars[j].money - 1, 'One tap on − takes out exactly $1B');
      assert.equal(d1.unspent, d0.unspent + 1, 'It goes back to the unspent money');
      await tapAt(btn(j, 1));
      assert.equal((await read(phone)).jars[j].money, d0.jars[j].money, 'One tap on + puts exactly $1B back');
      let shot = false;
      await playByPlan(phone, async (jar, dir) => {
        await tapAt(btn(jar, dir));
        if (!shot && (await read(phone)).t > 20000) { shot = true; await phone.screenshot({ path: shotPath('BN-play-390.png') }); }
      });
      await phone.locator('.mg-end').waitFor();
      assert.ok(await phone.locator('.mg-end.won').count(), `A careful player wins by tapping: ${await phone.locator('.mg-end').innerText()}`);
    })();

    await Promise.all([laptop, doNothing, tapping]);
    for (const p of [desk, idle, phone]) await p.close();

    /* ---- 4b. in a real run (the ledger shows too): every + and − on screen */
    for (const vp of [{ width: 1366, height: 700 }, { width: 390, height: 844, touch: true }]) {
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
        s.todayDeck = ['mg-budget'];
        s.agenda = ['government'];
        saveGame(en.beginStages(s));
      });
      await run.reload({ waitUntil: 'networkidle' });
      await run.getByRole('button', { name: /^Continue — Day/ }).click();
      await closeDemandPops(run);
      await run.locator('.app.mg-budget .mg-story').waitFor();
      await run.locator('.mg-foot .btn-primary').click();
      await run.locator('.mg-foot .btn-primary').click();
      await run.locator('.bn').waitFor();
      await run.waitForTimeout(400);
      assert.ok(await run.locator('.mg-top .res').count(), 'The three resources stay visible');
      const boxes = await run.locator('.bn-btn').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      assert.equal(boxes.length, 10);
      assert.ok(boxes.every((b) => b <= vp.height), `Every + and − is on screen without scrolling at ${vp.width}×${vp.height}: ${Math.max(...boxes)}`);
      await run.screenshot({ path: shotPath(`BN-run-${vp.width}.png`) });
      await run.close();
    }

    /* ------------------------------------------------- 5. reduce motion */
    const calm = await browser.newPage({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce' });
    calm.on('pageerror', (e) => errors.push(e.message));
    await openPractice(calm, { seed: 7, act: 2 });
    assert.ok(await calm.locator('.app.mg-calm').count(), 'Reduce Motion: the calm version');
    const t0 = Date.now();
    await calm.waitForTimeout(3000);
    const d = await read(calm);
    const real = Date.now() - t0;
    assert.ok(d.t < real * 0.8 && d.t > real * 0.45, `Reduce Motion: the clock runs 1.5× slower (${d.t} ms of play in ${real} ms)`);
    const k = d.jars.findIndex((x) => x.money > 0 && !x.out);
    await calm.keyboard.press(String(k + 1));
    await calm.keyboard.press('ArrowDown');
    assert.equal(await calm.locator('.bn-flyer').count(), 0, 'Reduce Motion: no flying notes');
    await calm.screenshot({ path: shotPath('BN-calm-1366.png') });
    await calm.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
console.log(SHOTS_ONLY
  ? 'BUDGET: pictures taken'
  : 'BUDGET: won by keyboard at 1366×700 (keys 1–5 shown, a digit selects, ↑/↓ = $1B), lost by doing nothing (walk-out stamp, sealed jar), won by real taps at 390×844 (one tap = $1B, no key badges), result → outcome, nothing saved; Reduce Motion calm, 1.5× slower clock, no flying notes — all OK');

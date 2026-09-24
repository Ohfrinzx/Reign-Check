import assert from 'node:assert/strict';
import { launchBrowser, shotPath } from './browser.mjs';
import { BASE, SCENES, closeDemandPops } from './scenes.mjs';

/**
 * PHONE — the mobile-web layout (docs/MOBILE_AND_HOSTING.md), checked in a
 * real browser with touch emulation at iPhone (390×844), small Android
 * (360×800), tablet (768×1024) and landscape phone (844×390) sizes.
 *
 * Part 1, every screen in tools/scenes.mjs at every size:
 *   - nothing sticks out sideways: the page is no wider than the DEVICE
 *     (screen.width — with mobile emulation innerWidth silently widens to
 *     fit too-wide content), and no visible element reaches past either
 *     edge (inner scroll areas clip overflow, so the page width alone
 *     would miss a clipped card);
 *   - the screen's primary control is on screen without scrolling, is the
 *     thing actually under a tap at its centre (not covered), and is at
 *     least 40px tall (ground rule 9, touch targets);
 *   - no page errors.
 * Part 2, phone-only parts: ☰ menu holds Brief me / Advisors & Deals /
 *   Main menu, the resource ledger is fully visible, the faction strip opens
 *   the Files drawer with all five factions, keyboard hints are hidden.
 * Part 3, two days played by tapping only (bottom bar, options, Back Room).
 *
 * Screenshots: <shots>/ph-<size>-<scene>.png. Run via
 * `node tools/run-browser.mjs phone` (starts Vite) or directly with a dev
 * server running.
 */
const SIZES = [
  { tag: 'iphone', width: 390, height: 844 },
  { tag: 'android', width: 360, height: 800 },
  { tag: 'tablet', width: 768, height: 1024 },
  { tag: 'landscape', width: 844, height: 390 },
  // iPhone Safari: its toolbar floats over the bottom of the page and is
  // reported as the bottom safe area (roughly 80px here). A desktop browser
  // shrunk to phone size reports 0, which is how an oversized bottom bar
  // reached the owner's phone unnoticed (2026-09-24). Emulated through CDP.
  { tag: 'iphone-safari', width: 390, height: 844, safeBottom: 80 },
];

async function measure(page, primarySel, safeBottom = 0) {
  return page.evaluate(([sel, safeB]) => {
    const W = screen.width;
    const H = window.innerHeight - safeB; // nothing usable under a floating toolbar
    const bar = document.querySelector('.strap-action');
    const out = {
      overflowX: document.documentElement.scrollWidth - W, offenders: [], primary: null,
      barHeight: bar && getComputedStyle(bar).position === 'fixed' ? Math.round(bar.getBoundingClientRect().height) : 0,
      continues: [...document.querySelectorAll('button')]
        .filter((b) => /^Continue/.test(b.textContent.trim()) && b.getBoundingClientRect().height > 0).length,
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || el.closest('.sr-only')) continue;
      if (r.right > W + 1 || r.left < -1) {
        out.offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}→${Math.round(r.right)}]`);
      }
    }
    out.offenders = out.offenders.slice(0, 6);
    if (sel) {
      const el = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().height > 0);
      if (el) {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        out.primary = {
          text: el.textContent.trim().slice(0, 40),
          onScreen: r.top >= 0 && r.bottom <= H + 0.5 && r.left >= 0 && r.right <= W + 0.5,
          notCovered: !!hit && (hit === el || el.contains(hit)),
          height: Math.round(r.height),
        };
      }
    }
    return out;
  }, [primarySel, safeBottom]);
}

const browser = await launchBrowser();
const problems = [];
try {
  /* ---------------------------------------------------- 1. every screen */
  for (const size of SIZES) {
    const page = await browser.newPage({
      viewport: { width: size.width, height: size.height }, screen: { width: size.width, height: size.height },
      isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    if (size.safeBottom) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { bottom: size.safeBottom, bottomMax: size.safeBottom } });
    }
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    // PHONE_SCENES=a,b limits part 1 to those scenes (quicker while iterating)
    const only = process.env.PHONE_SCENES?.split(',');
    for (const scene of SCENES.filter((sc) => !only || only.includes(sc.name))) {
      await scene.go(page);
      await page.waitForTimeout(700); // rise-in / drawer animations
      const m = await measure(page, scene.primary, size.safeBottom ?? 0);
      await page.screenshot({ path: shotPath(`ph-${size.tag}-${scene.name}.png`) });
      const where = `${size.tag} ${size.width}×${size.height} / ${scene.name}`;
      if (m.continues > 1) problems.push(`${where}: ${m.continues} Continue buttons on screen (one is enough)`);
      if (m.barHeight > 56) problems.push(`${where}: the bottom action bar is ${m.barHeight}px tall (keep it compact)`);
      if (m.overflowX > 0) problems.push(`${where}: page ${m.overflowX}px wider than the screen`);
      if (m.offenders.length) problems.push(`${where}: sticks out: ${m.offenders.join(', ')}`);
      if (scene.primary) {
        if (!m.primary) problems.push(`${where}: primary ${scene.primary} not found`);
        else {
          if (!m.primary.onScreen) problems.push(`${where}: "${m.primary.text}" needs scrolling to reach`);
          if (!m.primary.notCovered) problems.push(`${where}: "${m.primary.text}" is covered by something`);
          if (m.primary.height < 40) problems.push(`${where}: "${m.primary.text}" is only ${m.primary.height}px tall`);
        }
      }
    }
    if (errors.length) problems.push(`${size.tag}: page errors: ${errors.join(' | ')}`);
    await page.close();
  }

  if (problems.length) console.log(`Layout problems so far:\n${problems.join('\n')}`);

  /* ------------------------------------------------ 2. phone-only parts */
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const briefing = SCENES.find((s) => s.name === 'briefing');
  await briefing.go(page);

  // masthead: desktop buttons folded away, ☰ visible, ledger fully on screen
  for (const name of ['Brief me', 'Advisors & Deals', 'Menu']) {
    assert.equal(await page.locator('.masthead-right').getByRole('button', { name, exact: true }).isVisible(), false,
      `"${name}" should be folded into the ☰ menu on a phone`);
  }
  assert.ok(await page.locator('.m-menu-btn').isVisible(), '☰ menu button missing');
  const ledger = await page.locator('.masthead .res .r').evaluateAll((els) =>
    els.map((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= screen.width && r.height > 0; }));
  assert.deepEqual(ledger, [true, true, true], 'Money / Grip / Legitimacy should all be fully visible');
  // tapping a resource explains it, inside the screen
  await page.locator('.masthead .res .r').first().tap();
  const tip = await page.locator('.masthead .res .tip').boundingBox();
  assert.ok(tip && tip.x >= 0 && tip.x + tip.width <= 390, 'Resource explanation should fit on screen');
  await page.locator('.masthead .res .r').first().tap();

  // ☰ menu: the three buttons, and each works
  await page.locator('.m-menu-btn').tap();
  const items = await page.locator('.m-menu .btn').allInnerTexts();
  assert.deepEqual(items.map((t) => t.toLowerCase()), ['brief me', 'advisors & deals', 'main menu']);
  await page.locator('.m-menu').getByRole('button', { name: 'Brief me' }).tap();
  await page.locator('.intro').waitFor();
  const intro = await page.locator('.intro').innerText();
  assert.match(intro, /in your Files \(tap the faction strip\)/, 'Brief me should use phone wording');
  assert.doesNotMatch(intro, /on the right/, 'Brief me should not point "on the right" on a phone');
  await page.locator('.intro-foot .btn-primary').tap();
  await page.locator('.m-menu-btn').tap();
  await page.locator('.m-menu').getByRole('button', { name: 'Advisors & Deals' }).tap();
  await page.locator('.intro-foot .btn-primary').tap();
  // a tap outside closes the menu
  await page.locator('.m-menu-btn').tap();
  await page.mouse.click(40, 600);
  assert.equal(await page.locator('.m-menu').count(), 0, 'Tapping outside should close the menu');

  // faction strip → Files drawer with all five factions; close brings the day back
  const strip = page.locator('.m-files-btn');
  assert.ok(await strip.isVisible(), 'Faction strip missing');
  assert.equal(await strip.locator('.mf-fac').count(), 5);
  await strip.tap();
  await page.locator('.rail.open').waitFor();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.rail.open .fac').count(), 5, 'Drawer should show all five factions');
  for (const panel of ['Files', 'Demands', 'On your desk', 'Diary', 'On the record']) {
    assert.ok(await page.locator('.rail.open .panel h3', { hasText: panel }).count(), `Drawer is missing "${panel}"`);
  }
  assert.equal(await page.keyboard.press('Escape').then(() => page.locator('.rail.open').count()), 0, 'Escape should close the drawer');
  await strip.tap();
  await page.locator('.rail-top .btn').tap();
  assert.equal(await page.locator('.rail.open').count(), 0, 'Close should close the drawer');

  // keyboard hints are hidden on a touch screen
  await page.locator('.strap-action').tap();
  await page.locator('.stage-col .opt:not([disabled])').first().tap();
  await page.locator('.outcome').waitFor();
  assert.equal(await page.locator('.outcome .kbd-hint').isVisible(), false, '"or press Enter" should be hidden on touch');
  // one Continue on screen, not the floating button plus the card's own
  const continues = await page.getByRole('button', { name: /^Continue/ }).evaluateAll((els) =>
    els.filter((e) => e.getBoundingClientRect().height > 0).length);
  assert.equal(continues, 1, `Expected one visible Continue button on a phone, saw ${continues}`);
  assert.equal(await page.evaluate(() => matchMedia('(hover: none)').matches), true, 'Touch emulation should report no hover');

  /* ------------------------------------------- 3. two days, taps only */
  let days = 0;
  let shopSeen = false;
  const startDay = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')).day);
  for (let i = 0; i < 80 && days < 2; i++) {
    await closeDemandPops(page);
    const leave = page.locator('.shop-foot .btn-primary');
    const bar = page.locator('.strap-action');
    const vote = page.locator('.vote-screen');
    const srLeave = page.locator('.sr-stage .outcome-foot .btn-primary');
    const opt = page.locator(':is(.stage-col, .sr-stage, .alert-card) .opt:not([disabled])');
    if (await vote.count()) {
      const reveal = page.getByRole('button', { name: 'Reveal now', exact: true });
      if (await reveal.count()) await reveal.tap();
      await page.locator('.vote-actions .btn-primary').tap();
    } else if (await leave.count()) {
      shopSeen = true;
      assert.doesNotMatch(await page.locator('.shop-foot .note').innerText(), /Enter/, 'Back Room should not mention Enter on touch');
      await leave.tap();
      days++;
    } else if (await page.locator('.ending-sheet').count()) break;
    else if (await srLeave.count()) await srLeave.tap();
    else if (await bar.count() && await bar.isVisible()) await bar.tap();
    else if (await opt.count()) await opt.first().tap();
    else throw new Error('Stuck: nothing to tap');
    await page.waitForTimeout(120);
  }
  const endDay = await page.evaluate(() => JSON.parse(localStorage.getItem('dictator-sandbox:save:v1')).day);
  assert.ok(shopSeen, 'Never reached the Back Room by tapping');
  assert.ok(endDay >= startDay + 2 || await page.locator('.ending-sheet').count(), `Only got from day ${startDay} to ${endDay}`);
  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  await page.goto(BASE); // leave a clean tab
} finally {
  await browser.close();
}
assert.deepEqual(problems, [], `Phone layout problems:\n${problems.join('\n')}`);
console.log(`PHONE: ${SCENES.length} screens × ${SIZES.length} sizes fit with the primary action on screen; menu, ledger, faction strip, Files drawer, touch hints and a two-day tap-through all OK`);

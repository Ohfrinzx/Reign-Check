import { launchBrowser, shotPath } from './browser.mjs';

/**
 * PHONE AUDIT — not a pass/fail check yet. Takes screenshots of the main
 * screens at iPhone size (390×844, touch, 2× pixels) and prints, for each:
 * horizontal overflow (should be 0), page height, and where the primary
 * button sits. Written 2026-09-23 to measure the phone layout before the
 * mobile-web slice (docs/MOBILE_AND_HOSTING.md). Needs `npm run dev`
 * running. Screenshots: <OS temp>/reign-check-shots/ph-*.png.
 *
 * When the mobile slice is built, turn the printed numbers into assertions
 * (no overflow, primary action inside the viewport) and add it to
 * run-browser.mjs's default list.
 */
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const report = async (name) => {
    await page.waitForTimeout(600); // let rise-in animations finish
    // Compare against the DEVICE width (screen.width), not innerWidth: with
    // mobile emulation the layout viewport silently widens to fit content
    // that is too wide, which makes innerWidth-based checks read 0 overflow.
    const m = await page.evaluate(() => {
      const W = screen.width;
      const b = document.querySelector('.strap-action, .btn-primary');
      const r = b?.getBoundingClientRect();
      return {
        deviceWidth: W,
        layoutWidth: innerWidth,
        overflowX: document.documentElement.scrollWidth - W,
        pageHeight: document.documentElement.scrollHeight,
        primary: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), onScreen: r.right <= W && r.bottom <= screen.height } : null,
      };
    });
    console.log(name.padEnd(9), JSON.stringify(m));
    await page.screenshot({ path: shotPath(`ph-${name}.png`) });
  };

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await report('title');

  await page.evaluate(async () => {
    const { createGame } = await import('/src/game/state.ts');
    const { prepareDay } = await import('/src/game/engine.ts');
    const { saveGame } = await import('/src/game/save.ts');
    saveGame(prepareDay(createGame({ seed: 4, leaderName: 'Adrin Vo', mandateId: 'accident' })));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Continue — Day/ }).click();
  while (await page.locator('.demand-pop').count()) await page.locator('.demand-pop .dm-foot .btn').first().click();
  await report('briefing');
  await page.locator('.strap-action').click().catch(() => {});
  await report('card');
  await page.locator('.opt:not([disabled])').first().click().catch(() => {});
  await report('outcome');

  console.log('page errors:', errors.length ? errors : 'none');
} finally {
  await browser.close();
}

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { launchBrowser, shotDir } from './browser.mjs';
import { SCENES } from './scenes.mjs';

/**
 * DESKTOP SNAPSHOT — proves a layout change did not move a single desktop
 * pixel. Written for the mobile-web slice (docs/MOBILE_AND_HOSTING.md): the
 * phone layout must leave desktop exactly as it was.
 *
 *   SNAP_MODE=save node tools/run-browser.mjs desktop-snap   # before: store pictures
 *   node tools/run-browser.mjs desktop-snap                  # after: compare, pixel by pixel
 *
 * Every scene in tools/scenes.mjs is captured at 1366×700 (the project's
 * test size) and 1100×700 (just above the 1080px phone/tablet breakpoint),
 * with animations finished. (Run directly with `node tools/desktop-snap.mjs
 * [save]` when `npm run dev` is already running.) Baselines live in
 * <shots>/desktop-baseline (REIGN_SHOTS moves <shots>).
 */
const mode = process.argv.includes('save') || process.env.SNAP_MODE === 'save' ? 'save' : 'compare';
const baseDir = join(shotDir, 'desktop-baseline');
mkdirSync(baseDir, { recursive: true });
const SIZES = [{ width: 1366, height: 700 }, { width: 1100, height: 700 }];

const browser = await launchBrowser();
try {
  const failures = [];
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: size });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const scene of SCENES) {
      await scene.go(page);
      await page.waitForTimeout(700); // rise-in and fade-in animations
      const png = await page.screenshot({ animations: 'disabled', caret: 'hide' });
      const file = join(baseDir, `${size.width}-${scene.name}.png`);
      if (mode === 'save') { writeFileSync(file, png); continue; }
      assert.ok(existsSync(file), `No baseline for ${scene.name} at ${size.width}px — run with "save" first`);
      const before = readFileSync(file);
      if (before.equals(png)) continue;
      // Bytes differ: count the pixels that actually changed.
      const diff = await page.evaluate(async ([a, b]) => {
        const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
        const [ia, ib] = await Promise.all([load(a), load(b)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { size: true, pixels: -1 };
        const px = (img) => {
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
          const x = c.getContext('2d'); x.drawImage(img, 0, 0);
          return x.getImageData(0, 0, img.width, img.height).data;
        };
        const da = px(ia), db = px(ib);
        let n = 0;
        for (let i = 0; i < da.length; i += 4) {
          if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) n++;
        }
        return { size: false, pixels: n };
      }, [`data:image/png;base64,${before.toString('base64')}`, `data:image/png;base64,${png.toString('base64')}`]);
      if (diff.pixels !== 0) {
        writeFileSync(join(shotDir, `desktop-now-${size.width}-${scene.name}.png`), png);
        failures.push(`${size.width}px ${scene.name}: ${diff.size ? 'size changed' : `${diff.pixels} pixels differ`}`);
      }
    }
    assert.deepEqual(errors, [], `Page errors at ${size.width}px: ${errors.join('\n')}`);
    await page.close();
  }
  if (mode === 'save') {
    console.log(`DESKTOP SNAP: saved ${SCENES.length * SIZES.length} baselines to ${baseDir}`);
  } else {
    assert.deepEqual(failures, [], `Desktop changed:\n${failures.join('\n')}`);
    console.log(`DESKTOP SNAP: all ${SCENES.length * SIZES.length} screens identical to the baseline, pixel for pixel`);
  }
} finally {
  await browser.close();
}

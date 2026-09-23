import { mkdirSync } from 'node:fs';
import { launchBrowser } from './browser.mjs';

/**
 * Draws the Home Screen icons into public/icons/ (mobile-web slice, see
 * docs/MOBILE_AND_HOSTING.md). The same mark as the masthead: a red block
 * with a cream star, on the masthead's near-black. Drawn as SVG and
 * screenshotted, so no image tool is needed. Run once after changing the
 * design: `node tools/make-icons.mjs` (no dev server needed).
 *
 * The mark sits inside the middle 60%, so icon-512.png also works as the
 * manifest's "maskable" icon (Android crops it to a circle or squircle).
 */
const OUT = 'public/icons';
mkdirSync(OUT, { recursive: true });

function star(cx, cy, R) {
  const r = R * 0.382;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="#16130f"/>
  <rect x="22" y="22" width="56" height="56" fill="#cc2b1d"/>
  <polygon points="${star(50, 52, 21)}" fill="#f2e9d5"/>
</svg>`;

const browser = await launchBrowser();
try {
  for (const [file, size] of [
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: `${OUT}/${file}`, omitBackground: false });
    await page.close();
  }
  console.log(`Icons written to ${OUT}/`);
} finally {
  await browser.close();
}

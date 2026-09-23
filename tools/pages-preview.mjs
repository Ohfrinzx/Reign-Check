import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { launchBrowser } from './browser.mjs';

/**
 * PAGES PREVIEW — serves the production build (dist/) from a /Reign-Check/
 * sub-folder, the way GitHub Pages will (https://ohfrinzx.github.io/Reign-Check/),
 * and checks in a real browser that nothing breaks because of the folder:
 * every request succeeds (no 404s — this is what caught the fonts pointing at
 * the site root), all five font families load, the Home Screen manifest and
 * icons are served and valid, and a game can be started.
 *
 * Run after a build: `npm run build && node tools/pages-preview.mjs`.
 * No dev server needed. Written for the mobile-web slice
 * (docs/MOBILE_AND_HOSTING.md).
 */
const PREFIX = '/Reign-Check/';
const PORT = 5190;
assert.ok(existsSync('dist/index.html'), 'No dist/ — run `npm run build` first');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(PREFIX)) { res.writeHead(404).end('outside the sub-folder'); return; }
  let rel = url.pathname.slice(PREFIX.length) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join('dist', rel));
  if (!file.startsWith('dist')) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const failed = [];
  const errors = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`));
  page.on('pageerror', (e) => errors.push(e.message));

  const root = `http://127.0.0.1:${PORT}${PREFIX}`;
  await page.goto(root, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Take the job' }).waitFor();

  // Fonts: every family the design uses must actually load (not fall back).
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const fams = ['Anton', 'Archivo Black', 'Libre Franklin', 'Lora', 'Courier Prime'];
    const out = {};
    for (const f of fams) {
      try { out[f] = (await document.fonts.load(`16px "${f}"`)).length > 0 && document.fonts.check(`16px "${f}"`); }
      catch { out[f] = false; } // a font file that 404s rejects with a network error
    }
    return out;
  });
  for (const [f, ok] of Object.entries(fonts)) assert.ok(ok, `Font did not load under ${PREFIX}: ${f}`);

  // Home Screen manifest: linked, served, parseable, icons reachable.
  const href = await page.evaluate(() => document.querySelector('link[rel=manifest]')?.href);
  assert.ok(href?.startsWith(root), `Manifest link should stay inside ${PREFIX}, got ${href}`);
  const manifest = await (await page.request.get(href)).json();
  assert.equal(manifest.display, 'standalone');
  assert.equal(new URL(manifest.start_url, href).href, root, 'start_url should open the game folder');
  for (const icon of manifest.icons) {
    const r = await page.request.get(new URL(icon.src, href).href);
    assert.equal(r.status(), 200, `Icon missing: ${icon.src}`);
  }
  const touch = await page.evaluate(() => document.querySelector('link[rel=apple-touch-icon]')?.href);
  assert.equal((await page.request.get(touch)).status(), 200, 'apple-touch-icon missing');

  // The game itself runs from the sub-folder.
  await page.getByRole('button', { name: 'Take the job' }).click();
  await page.locator('.intro').waitFor();

  assert.deepEqual(failed, [], `Requests failed under ${PREFIX}:\n${failed.join('\n')}`);
  assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  console.log(`PAGES PREVIEW: served from ${PREFIX}, no failed requests, all 5 fonts loaded, manifest + ${manifest.icons.length} icons + apple-touch-icon OK, game starts`);
} finally {
  await browser.close();
  server.close();
}

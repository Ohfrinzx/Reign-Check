import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const shotDir = process.env.REIGN_SHOTS ?? join(tmpdir(), 'reign-check-shots');
mkdirSync(shotDir, { recursive: true });
export const shotPath = (name) => join(shotDir, name);
export const launchBrowser = () => chromium.launch({
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
});

/**
 * Phase 5: if a mini-game screen is showing, play past it — story, how to
 * play, then "Give up" (a loss), the result, and back to the day. Returns
 * true when it did something, so a driving loop can `continue`. `tap` uses
 * touch taps (phone checks). tools/minigames.mjs plays the games properly.
 */
export async function passMinigame(page, { tap = false } = {}) {
  if (!(await page.locator('.mg-full').count())) return false;
  const press = (loc) => (tap ? loc.tap() : loc.click());
  const back = page.locator('.mg-result-body .outcome-foot .btn-primary');
  for (let i = 0; i < 8; i++) {
    if (await back.count()) { await press(back); await page.waitForTimeout(150); return true; }
    if (await page.locator('.mg-confirm').count()) {
      await press(page.getByRole('button', { name: 'Yes, give up' }));
    } else if (await page.locator('.mg-play').count()) {
      await press(page.locator('.mg-quit'));
    } else {
      await press(page.locator('.mg-foot .btn-primary'));
    }
    await page.waitForTimeout(150);
  }
  return true;
}

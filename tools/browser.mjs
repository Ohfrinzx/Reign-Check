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

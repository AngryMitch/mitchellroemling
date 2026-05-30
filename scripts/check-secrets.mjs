/**
 * Friendly, non-blocking guard: warns if you've edited the plaintext family
 * content more recently than you last ran `npm run encrypt`, so a forgotten
 * re-encrypt is obvious. Runs before `npm run dev`. Always exits 0, so it never
 * blocks anything (and stays silent when there's no .family/ folder, e.g. on a
 * fresh clone or on Cloudflare).
 */
import { stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = resolve(root, '.family');
const OUT_FILE = resolve(root, 'src/generated/family.enc.json');

const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

try {
  if (existsSync(SRC_DIR) && existsSync(OUT_FILE)) {
    const encMtime = (await stat(OUT_FILE)).mtimeMs;
    const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.md'));
    let newest = 0;
    for (const f of files) {
      newest = Math.max(newest, (await stat(resolve(SRC_DIR, f))).mtimeMs);
    }
    if (newest > encMtime) {
      console.warn(
        `${YELLOW}⚠ Family content changed since the last encrypt.\n` +
          `  Run "npm run encrypt" before committing so the site is up to date.${RESET}`,
      );
    }
  }
} catch {
  /* never block on the guard */
}

process.exit(0);

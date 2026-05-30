/**
 * Encrypts the plaintext "family corner" content into a single ciphertext blob.
 *
 *   npm run encrypt
 *
 * Reads every `.family/*.md` (plaintext, git-ignored), renders it to HTML, and
 * AES-GCM encrypts the lot with a key derived from your passcode via PBKDF2.
 * Writes `src/generated/family.enc.json` — the ONLY artefact that gets committed
 * or deployed. The passcode and plaintext never leave your machine.
 *
 * Passcode is read from (in order): --passcode=… arg, FAMILY_PASSCODE env
 * (a local .env works), otherwise you're prompted.
 *
 * Edit flow:  edit .family/*.md  →  npm run encrypt  →  commit  →  push.
 */
import { webcrypto as crypto } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { marked } from 'marked';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = resolve(root, '.family');
const OUT_FILE = resolve(root, 'src/generated/family.enc.json');
const ITERATIONS = 210_000;

const toB64 = (bytes) => Buffer.from(bytes).toString('base64');

async function getPasscode() {
  const fromArg = process.argv
    .find((a) => a.startsWith('--passcode='))
    ?.slice('--passcode='.length);
  if (fromArg) return fromArg;

  if (existsSync(resolve(root, '.env'))) {
    try {
      process.loadEnvFile(resolve(root, '.env'));
    } catch {
      /* older Node without loadEnvFile — ignore */
    }
  }
  if (process.env.FAMILY_PASSCODE) return process.env.FAMILY_PASSCODE;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Family passcode: ');
  rl.close();
  return answer.trim();
}

/** Pull the first `# Heading` out as the title; render the rest as HTML. */
function renderPage(slug, raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let title = slug;
  const headingIdx = lines.findIndex((l) => /^#\s+/.test(l));
  if (headingIdx !== -1) {
    title = lines[headingIdx].replace(/^#\s+/, '').trim();
    lines.splice(headingIdx, 1);
  }
  const html = marked.parse(lines.join('\n').trim(), { async: false });
  return { slug, title, html };
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`✖ No .family/ folder found at ${SRC_DIR}.`);
    console.error('  Create .family/*.md files first (they stay git-ignored).');
    process.exit(1);
  }

  const files = (await readdir(SRC_DIR))
    .filter((f) => f.endsWith('.md'))
    // Pin "welcome" first; everything else alphabetical.
    .sort((a, b) =>
      a.startsWith('welcome') ? -1 : b.startsWith('welcome') ? 1 : a.localeCompare(b),
    );

  if (files.length === 0) {
    console.error('✖ No .family/*.md files to encrypt.');
    process.exit(1);
  }

  const pages = [];
  for (const file of files) {
    const raw = await readFile(resolve(SRC_DIR, file), 'utf8');
    pages.push(renderPage(basename(file, '.md'), raw));
  }

  const passcode = await getPasscode();
  if (!passcode) {
    console.error('✖ No passcode provided.');
    process.exit(1);
  }

  const payload = JSON.stringify({ generatedAt: new Date().toISOString(), pages });

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const cipherBytes = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(payload),
    ),
  );

  const out = {
    v: 1,
    note: 'Encrypted family-corner content. Decrypt requires the passcode.',
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: toB64(salt) },
    cipher: { name: 'AES-GCM', iv: toB64(iv) },
    data: toB64(cipherBytes),
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');

  console.log(`✓ Encrypted ${pages.length} page(s) → src/generated/family.enc.json`);
  console.log(`  Pages: ${pages.map((p) => p.slug).join(', ')}`);
  console.log('  Commit that file; the plaintext in .family/ stays local.');
}

main().catch((err) => {
  console.error('✖ Encryption failed:', err);
  process.exit(1);
});

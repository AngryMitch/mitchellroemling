/**
 * My deploy script.
 *
 *   npm run deploy          build, hash, and ship with wrangler
 *   npm run deploy -- --dry build + hash only, skip the upload
 *
 * What I do here:
 *   1. Build the static site into dist/ (npm run build).
 *   2. Hash every file in dist/ into one SHA-256 build hash and drop a
 *      dist/version.json so I always know exactly what's live.
 *   3. Ship dist/ with `npx wrangler` using my wrangler.jsonc.
 *
 * Anything after `--` that isn't `--dry` gets passed straight through to
 * wrangler, e.g. `npm run deploy -- --env staging`.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(root, 'dist');

// I deploy to Cloudflare Pages, so I point wrangler at my built dist/ folder.
// Each piece is its own array item (a single 'pages deploy' string would be
// passed as one argument and confuse wrangler).
// If I add `pages_build_output_dir: "dist"` to wrangler.jsonc, I can drop the
// trailing 'dist' here. For Workers static assets instead, use ['deploy'].
const WRANGLER_ARGS = ['pages', 'deploy', 'dist'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const passthrough = args.filter((a) => a !== '--dry');

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true, cwd: root });
  if (result.status !== 0) {
    console.error(`\n✖ "${cmd} ${cmdArgs.join(' ')}" failed.`);
    process.exit(result.status ?? 1);
  }
}

/** Every file under dist/, as paths relative to dist/, sorted for stability. */
function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function gitShortHash() {
  const res = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  return res.status === 0 ? res.stdout.trim() : null;
}

// 0. Warn me if I edited the .family content but forgot to re-encrypt.
run('node', ['scripts/check-secrets.mjs']);

// 1. Build.
console.log('▶ Building…');
run('npm', ['run', 'build']);

// 2. Hash the output.
console.log('▶ Hashing dist/…');
const files = listFiles(DIST).sort();
const manifest = createHash('sha256');
for (const file of files) {
  const rel = relative(DIST, file).split(sep).join('/');
  const fileHash = createHash('sha256').update(readFileSync(file)).digest('hex');
  manifest.update(`${rel}:${fileHash}\n`);
}
const fullHash = manifest.digest('hex');

const version = {
  version: fullHash.slice(0, 12),
  fullHash,
  commit: gitShortHash(),
  builtAt: new Date().toISOString(),
  files: files.length,
};
writeFileSync(join(DIST, 'version.json'), JSON.stringify(version, null, 2) + '\n');

console.log(`  version ${version.version} · ${version.files} files` +
  (version.commit ? ` · commit ${version.commit}` : ''));
console.log('  wrote dist/version.json');

// 3. Deploy (unless it's a dry run).
if (dryRun) {
  console.log('\n✓ Dry run, skipping the wrangler upload.');
  process.exit(0);
}

console.log('▶ Deploying with wrangler…');
run('npx', ['wrangler', ...WRANGLER_ARGS, ...passthrough]);
console.log(`\n✓ Deployed version ${version.version}.`);

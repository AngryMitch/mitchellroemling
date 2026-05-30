/**
 * Generates placeholder raster images (PNG) for local development so the
 * content collections + <Image> pipeline have something real to optimise.
 *
 *   npm run generate:placeholders
 *
 * Replace any of these files with your real artwork/screenshots/photos —
 * keep the same path + filename and everything just works. See PLACEHOLDERS.md.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** A simple retro "broken image / placeholder" tile as SVG → PNG. */
function tile({ w, h, label, sub, from, to, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none"
          stroke="${accent}" stroke-width="3" stroke-dasharray="10 8"/>
    <circle cx="${w / 2}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.13}" fill="${accent}" opacity="0.85"/>
    <text x="50%" y="${h * 0.66}" text-anchor="middle"
          font-family="Georgia, serif" font-size="${Math.round(Math.min(w, h) * 0.11)}"
          font-weight="bold" fill="#ffffff">${label}</text>
    <text x="50%" y="${h * 0.78}" text-anchor="middle"
          font-family="monospace" font-size="${Math.round(Math.min(w, h) * 0.055)}"
          fill="#ffffff" opacity="0.8">${sub}</text>
  </svg>`;
}

const palettes = [
  { from: '#1f6fbf', to: '#06122e', accent: '#3cc8b4' },
  { from: '#7a3aa0', to: '#241038', accent: '#ffb347' },
  { from: '#3a6e3a', to: '#0f2a12', accent: '#cfe96b' },
  { from: '#b03a4a', to: '#2a0c12', accent: '#ffd166' },
  { from: '#c47a1e', to: '#3a2206', accent: '#ffe08a' },
  { from: '#2a6f8e', to: '#08222c', accent: '#9be7ff' },
];

const jobs = [
  { out: 'src/assets/profile.png', w: 400, h: 400, label: 'Your Photo', sub: 'profile.png', p: 5 },

  { out: 'src/assets/artwork/images/aurora-study.png', w: 1000, h: 1000, label: 'Aurora Study', sub: 'digital', p: 0 },
  { out: 'src/assets/artwork/images/still-life-pears.png', w: 1000, h: 1200, label: 'Still Life', sub: 'traditional', p: 2 },
  { out: 'src/assets/artwork/images/harbour-lights.png', w: 1400, h: 1000, label: 'Harbour Lights', sub: 'photography', p: 1 },
  { out: 'src/assets/artwork/images/neon-alley.png', w: 1000, h: 1400, label: 'Neon Alley', sub: 'photography', p: 5 },

  { out: 'src/assets/projects/images/this-website.png', w: 1200, h: 750, label: 'this-website', sub: 'screenshot', p: 0 },
  { out: 'src/assets/projects/images/pixel-weather.png', w: 1200, h: 750, label: 'Pixel Weather', sub: 'screenshot', p: 3 },
  { out: 'src/assets/projects/images/retro-terminal.png', w: 1200, h: 750, label: 'Retro Terminal', sub: 'screenshot', p: 4 },

  { out: 'src/assets/blog/images/building-this-site.png', w: 1200, h: 800, label: 'Building This Site', sub: 'blog cover', p: 1 },
];

let made = 0;
for (const job of jobs) {
  const outPath = resolve(root, job.out);
  await mkdir(dirname(outPath), { recursive: true });
  const pal = palettes[job.p % palettes.length];
  const svg = tile({ w: job.w, h: job.h, label: job.label, sub: job.sub, ...pal });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  made++;
  console.log(`  ✓ ${job.out}`);
}
console.log(`\nGenerated ${made} placeholder image(s).`);

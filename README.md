# mitchellroemling.com

My personal portfolio: a retro **Windows 95/XP** desktop where I show off my
**artwork**, my **coding projects**, and a **blog** (posts can pull in artwork
photos). I built it with **Astro 6** and **TypeScript**, I keep all the content
as **Markdown in Git**, and I ship it to **Cloudflare**.

## Quick start

Needs **Node 22+** (but I use pnpm [**AND YOU SHOULD TO**]).

```bash
npm install                    # install dependencies
npm run generate:placeholders  # (re)create placeholder images, optional
npm run dev                    # start the dev server → http://localhost:4321
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts my local dev server with hot reload |
| `npm run build` | Type-checks (`astro check`) and builds to `dist/` |
| `npm run build:fast` | Builds without the type-check step |
| `npm run preview` | Serves the production build locally |
| `npm run check` | Type-checks only |
| `npm run encrypt` | Re-encrypts my `.family` content (see below) |
| `npm run deploy` | Builds, stamps a version hash, and ships it with wrangler |
| `npm run generate:placeholders` | Regenerates placeholder images into `src/assets/` |

---

## Project structure

```
website/
├─ public/                  # static assets I serve as-is
│  ├─ icons/                # desktop / start-menu pixel icons (SVG)
│  ├─ favicon.svg
│  └─ og-default.svg        # social share card
├─ scripts/
│  ├─ generate-placeholders.mjs
│  ├─ encrypt-secrets.mjs   # encrypts the .family corner
│  └─ deploy.mjs            # hash + wrangler deploy
├─ src/
│  ├─ assets/               # images I optimise at build time (<Image>)
│  │  ├─ artwork/images/
│  │  ├─ projects/images/
│  │  ├─ blog/images/
│  │  └─ profile.png
│  ├─ components/           # my Win95/XP UI kit (Window, Taskbar, StartMenu, …)
│  ├─ content/              # ← my content lives here (Markdown)
│  │  ├─ artwork/
│  │  ├─ projects/
│  │  └─ blog/
│  ├─ generated/           # family.enc.json (committed ciphertext)
│  ├─ layouts/             # BaseLayout (desktop shell) + WindowLayout
│  ├─ pages/               # routes
│  ├─ styles/global.css    # my design system: tokens, bevels, typography
│  ├─ consts.ts            # site name, social links, nav  ← I edit this
│  └─ content.config.ts    # content collection schemas
├─ astro.config.mjs
└─ tsconfig.json
```

### Routes

| Path | Page |
|---|---|
| `/` | Desktop / home (icons + taskbar) |
| `/about` | My "Notepad" about window with bio, skills, links |
| `/gallery` | Artwork gallery (Explorer grid + type filters) |
| `/gallery/[slug]` | A single artwork |
| `/projects` | Projects (Explorer list, sortable columns) |
| `/projects/[slug]` | A single project |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post (renders any referenced artwork) |
| `/family` | My passcode-locked corner for friends and family |
| `/recycle-bin` | Easter-egg page |
| `/404` | BSOD "fatal exception" page |
| `/rss.xml` | Blog RSS feed |
| `/sitemap-index.xml` | Auto-generated sitemap |

---

## Adding content

It's all Markdown + Git. No CMS (excl. KeyStatic I guess), no database.

1. **Artwork:** I add an image to `src/assets/artwork/images/` and a `.md` file to `src/content/artwork/`.
2. **Project:** I add a `.md` file to `src/content/projects/` (image optional).
3. **Blog post:** I add a `.md` file to `src/content/blog/`. To feature gallery
   pieces, I list their slugs under `relatedArtwork`.
4. `git commit && git push`, then I deploy (see below).

I keep full frontmatter examples in **[PLACEHOLDERS.md](PLACEHOLDERS.md)**, and
the exact schemas (and allowed values) live in
[`src/content.config.ts`](src/content.config.ts). The build fails loudly if a
frontmatter field is missing or mistyped.

### Or I edit visually with Keystatic (local editor)

When I'd rather click than hand-write frontmatter, I have a local editor built in:

```bash
npm run dev                       # then open:
#   http://localhost:4321/keystatic
```

It's a form-based editor for **blog**, **artwork**, and **projects** that writes
real `.md` files into `src/content/` and images into `src/assets/…/images/`.
Then I commit and push exactly like I would by hand.

**Notes:**
- **Local-only by design.** The editor (and the React renderer it needs) only turns on for `astro dev`. See the dev gate in [`astro.config.mjs`](astro.config.mjs). My production `astro build` stays a pure static export, so the Cloudflare deploy doesn't change.
- The schema lives in [`keystatic.config.ts`](keystatic.config.ts) and mirrors `src/content.config.ts`, so I keep the two in sync.
- The "Related artwork" picker on a blog post drives the same `relatedArtwork` feature below.

---

## How "blogs that pull artwork photos" works

A blog post's frontmatter can include:

```yaml
relatedArtwork:
  - aurora-study      # = src/content/artwork/aurora-study.md
  - harbour-lights
```

Astro resolves each slug to the real artwork entry through a typed `reference()`,
so the post renders those pieces' optimised images, titles, and gallery links in
a "Featured artwork" strip, and they stay in sync with the gallery automatically.

---

## My hidden `.family` corner

A passcode-locked, **encrypted** corner for friends and family (right now it's a
gift list). The `.family` 🔒 folder sits on my desktop, and double-clicking it
asks for a passcode that decrypts the content in the browser. I encrypt the gift
list with AES-GCM **at build time**, so only the ciphertext ever gets committed
or deployed. It stays private even though the repo is public and the site is
fully static.

```bash
# 1. I edit the plaintext (git-ignored)
#    .family/gifts.md   (the first "# Heading" becomes the document title)
# 2. I set my passcode once: copy .env.example → .env, edit FAMILY_PASSCODE
npm run encrypt        # → rewrites src/generated/family.enc.json (I commit THIS)
# 3. git commit && git push
```

The plaintext (`.family/`) and my passcode never leave my machine. Full details
and Phase 3 ideas are in **[docs/family-corner-plan.md](docs/family-corner-plan.md)**.

> ⚠️ The committed ciphertext still uses the placeholder passcode **`changeme`**,
> so I need to set my own (`.env` → `FAMILY_PASSCODE`) and re-run `npm run encrypt`
> before I share the site.

I can also mark any **artwork / project / blog** entry `hidden: true` (a checkbox
in Keystatic) to drop it from its listing, the sitemap, and RSS.

---

## Deploying

I build to **static HTML** (`output: 'static'`), so there's no adapter and
nothing server-side. Cloudflare serves the `dist/` folder from its edge.

### My deploy script

```bash
npm run deploy            # build → version hash → wrangler
npm run deploy -- --dry   # build + hash, skip the upload (a dry run)
```

[`scripts/deploy.mjs`](scripts/deploy.mjs) does three things:

1. Runs `npm run build` (type-check + static build into `dist/`).
2. Hashes every file in `dist/` into one SHA-256 build hash and writes
   `dist/version.json` (`{ version, commit, builtAt, files }`) so I can tell
   exactly what's live.
3. Ships it with `npx wrangler` using my [`wrangler.jsonc`](wrangler.jsonc).

If I ever change the production domain, I update `site` in
[`astro.config.mjs`](astro.config.mjs) and `SITE.url` in
[`src/consts.ts`](src/consts.ts) (they feed canonical URLs, the sitemap, and RSS).

### Git-connected deploys (optional)

If I'd rather not run the script, I can connect the GitHub repo in the Cloudflare
dashboard (Workers & Pages → Create → Connect to Git) with build command
`npm run build` and output directory `dist`, and every push to `main` deploys.

---

## Design system

- **Colours / bevels / fonts:** I keep them as CSS custom properties in [`src/styles/global.css`](src/styles/global.css) (`--win-grey`, `--win-navy`, `.bevel-raised`, `.bevel-sunken`, …).
- **Fonts:** "Press Start 2P" for the UI chrome (labels only), Georgia for readable body text, Courier New for code.
- **Accessibility:** semantic HTML, keyboard navigation, `prefers-reduced-motion` respected, a skip link, and a high-contrast palette.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 6 (static output) |
| Language | TypeScript (strict) |
| Content | Astro Content Collections (Markdown + Content Layer API) |
| Images | `astro:assets` `<Image>` → WebP, responsive, lazy |
| Feeds/SEO | `@astrojs/rss`, `@astrojs/sitemap` |
| Hosting | Cloudflare |

---

Made with 🪟 and a healthy dose of nostalgia.

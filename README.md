# mitchellroemling.com

My personal portfolio, a retro **Windows 95/XP** desktop for
showcasing **artwork**, **coding projects**, and a **blog** (where posts can pull in artwork photos). Built with **Astro 6** + **TypeScript**, content managed as **Markdown in Git**, deployed to **Cloudflare Pages**.

## Quick start

Requires **Node 22+** (but I use pnpm [**AND YOU SHOULD TO**])

```bash
npm install                    # install dependencies
npm run generate:placeholders  # (re)create placeholder images are optional
npm run dev                    # start the dev server → http://localhost:4321
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Type-check (`astro check`) **and** build to `dist/` |
| `npm run build:fast` | Build without the type-check step |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check only |
| `npm run generate:placeholders` | Regenerate placeholder images into `src/assets/` |

---

## Project structure

```
website/
├─ public/                  # static assets served as-is
│  ├─ icons/                # desktop / start-menu pixel icons (SVG)
│  ├─ favicon.svg
│  └─ og-default.svg        # social share card
├─ scripts/
│  └─ generate-placeholders.mjs
├─ src/
│  ├─ assets/               # images optimised at build time (<Image>)
│  │  ├─ artwork/images/
│  │  ├─ projects/images/
│  │  ├─ blog/images/
│  │  └─ profile.png
│  ├─ components/           # Win95/XP UI kit (Window, Taskbar, StartMenu, …)
│  ├─ content/              # ← YOUR CONTENT lives here (Markdown)
│  │  ├─ artwork/
│  │  ├─ projects/
│  │  └─ blog/
│  ├─ layouts/             # BaseLayout (desktop shell) + WindowLayout
│  ├─ pages/               # routes
│  ├─ styles/global.css    # design system: tokens, bevels, typography
│  ├─ consts.ts            # site name, social links, nav  ← EDIT THIS
│  └─ content.config.ts    # content collection schemas
├─ astro.config.mjs
└─ tsconfig.json
```

### Routes

| Path | Page |
|---|---|
| `/` | Desktop / home (icons + taskbar) |
| `/about` | About "Notepad" window with bio, skills, links |
| `/gallery` | Artwork gallery (Explorer grid + type filters) |
| `/gallery/[slug]` | Individual artwork |
| `/projects` | Projects (Explorer list, sortable columns) |
| `/projects/[slug]` | Individual project |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post (renders referenced artwork) |
| `/recycle-bin` | Easter-egg page |
| `/404` | BSOD "fatal exception" page |
| `/rss.xml` | Blog RSS feed |
| `/sitemap-index.xml` | Auto-generated sitemap |

---

## Adding content

It's all Markdown + Git. No CMS (excl. KeyStatic I guess), no database.

1. **Artwork:** add an image to `src/assets/artwork/images/` and a `.md` file to `src/content/artwork/`.
2. **Project:** add a `.md` file to `src/content/projects/` (image optional).
3. **Blog post:** add a `.md` file to `src/content/blog/`. To feature gallery
   pieces, list their slugs under `relatedArtwork`.
4. `git commit && git push` → Cloudflare Pages auto-deploys.

Full frontmatter examples are in **[PLACEHOLDERS.md](PLACEHOLDERS.md)**. The exact schemas (and allowed values) live in
[`src/content.config.ts`](src/content.config.ts). The build fails loudly if a frontmatter field is missing or mistyped.

### Or edit visually with Keystatic (local editor)

Prefer a UI to writing frontmatter by hand? A local content editor is built in:

```bash
npm run dev                       # then open:
#   http://localhost:4321/keystatic
```

It's a form-based editor for **blog**, **artwork**, and **projects** that writes
real `.md` files into `src/content/` and images into `src/assets/…/images/`. Then you commit and push exactly as you would by hand.

**Notes:**
- **Local-only by design.** The editor (and the React renderer it needs) is enabled for `astro dev` only. See the dev gate in   [`astro.config.mjs`](astro.config.mjs). The production `astro build` stays a pure static export, so the Cloudflare deploy is unchanged.
- Schema lives in [`keystatic.config.ts`](keystatic.config.ts) and mirrors `src/content.config.ts`. Keep the two in sync.
- The "Related artwork" picker on a blog post drives the same `relatedArtwork` feature described below.

---

## How "blogs that pull artwork photos" works

A blog post's frontmatter can include:

```yaml
relatedArtwork:
  - aurora-study      # = src/content/artwork/aurora-study.md
  - harbour-lights
```

Astro resolves each slug to the real artwork entry via a typed `reference()`, so the post renders those pieces' optimised images, titles, and gallery links in a "Featured artwork" strip and they stay in sync with the gallery automatically.

---

## The hidden `.family` corner

A passcode-locked, **encrypted** corner for friends & family (currently a gift
list). The `.family` 🔒 folder sits on the desktop; double-clicking it asks for a
passcode, which decrypts the content in the browser. The gift list is AES-GCM
encrypted **at build time** — only ciphertext is ever committed or deployed, so
it stays private even though the repo is public and the site is static.

```bash
# 1. edit the plaintext (git-ignored)
#    .family/gifts.md   (first "# Heading" = the document title)
# 2. set your passcode once: copy .env.example → .env, edit FAMILY_PASSCODE
npm run encrypt        # → rewrites src/generated/family.enc.json (commit THIS)
# 3. git commit && git push
```

The plaintext (`.family/`) and the passcode never leave your machine. Full
details + Phase 3 ideas: **[docs/family-corner-plan.md](docs/family-corner-plan.md)**.

> ⚠️ The committed ciphertext ships with the placeholder passcode **`changeme`** —
> set your own (`.env` → `FAMILY_PASSCODE`) and re-run `npm run encrypt` before
> sharing the site.

Any **artwork / project / blog** entry can also be marked `hidden: true` (a
checkbox in Keystatic) to drop it from its listing, the sitemap, and RSS.

---

## Deployment to Cloudflare Pages

The site builds to **static HTML** (`output: 'static'`), so **no adapter is needed**. Cloudflare Pages serves the `dist/` folder over its global CDN.

### One-time setup

1. **Push this repo to GitHub** (e.g. `mitchellroemling.com`).
2. In the **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to
   Git**, authorise GitHub and pick the repo.
3. **Build settings:**
   - Framework preset: **Astro**
   - Build command: **`npm run build`**
   - Build output directory: **`dist`**
4. **Save and Deploy.** You get a `*.pages.dev` URL.


After that, every push to `main` triggers a production deploy; pull requests get preview deploys automatically.

> If you change the production domain, update `site` in
> [`astro.config.mjs`](astro.config.mjs) and `SITE.url` in
> [`src/consts.ts`](src/consts.ts) (used for canonical URLs, sitemap, and RSS).

---

## Design system

- **Colours / bevels / fonts:** CSS custom properties in [`src/styles/global.css`](src/styles/global.css) (`--win-grey`, `--win-navy`, `.bevel-raised`, `.bevel-sunken`, …).
- **Fonts:** "Press Start 2P" for UI chrome (labels only); Georgia for readable
  body text; Courier New for code.
- **Accessibility:** semantic HTML, keyboard-navigable, `prefers-reduced-motion`
  respected, skip link, high-contrast palette.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 6 (static output) |
| Language | TypeScript (strict) |
| Content | Astro Content Collections (Markdown + Content Layer API) |
| Images | `astro:assets` `<Image>` → WebP, responsive, lazy |
| Feeds/SEO | `@astrojs/rss`, `@astrojs/sitemap` |
| Hosting | Cloudflare Pages |

---

Made with 🪟 and a healthy dose of nostalgia.
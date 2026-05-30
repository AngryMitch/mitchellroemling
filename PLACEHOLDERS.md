# PLACEHOLDERS, what to replace

Everything in this site currently ships with **placeholder content** so it
builds and looks complete out of the box. This file is your checklist for
swapping in the real thing. Nothing here requires touching the component code, it's all content, config, and images.

When you're done, search the repo for the word `PLACEHOLDER` to catch anything
left behind:

```bash
# from the project root
grep -ri "placeholder" src
```

---

## 1. Your details & social links, `src/consts.ts`

This single file drives your name, tagline, and every social link on the site.

| Field | Current value | Action |
|---|---|---|
| `SITE.name` | `Mitchell Roemling` | ✅ correct, change if needed |
| `SITE.tagline` | `Artist & Developer` | Edit to taste |
| `SITE.description` | generic blurb | Write a real one-line SEO description |
| `SITE.email` | `mitch@mitchellroemling.com` | ✅ correct |
| GitHub link | `https://github.com/mitchellroemling` | ⚠️ **verify your real username** |
| LinkedIn link | `https://www.linkedin.com/in/mitchellroemling` | ⚠️ **verify your real profile slug** |

> The GitHub and LinkedIn URLs are best-guesses based on your name. Open
> `src/consts.ts` → `SOCIAL_LINKS` and confirm/replace the `href` values.

---

## 2. About page, `src/pages/about.astro`

- **Bio paragraphs:** the middle paragraph is marked `[PLACEHOLDER bio …]`.
  Replace all three with real text.
- **Skills table** (`const skills`): edit names + proficiency levels.
- **"Properties" easter-egg stats** (`const funStats`): years coding, coffees
  consumed, etc., make them yours (or keep them silly).

## 3. Profile photo, `src/assets/profile.png`

Replace this placeholder with a real square photo (≈400×400 or larger). Keep the
**same filename** and it wires up automatically.

---

## 4. Artwork, `src/content/artwork/` + `src/assets/artwork/images/`

Four placeholder pieces exist. For each, replace the image and edit the
frontmatter/body:

| Markdown file | Image to replace |
|---|---|
| `aurora-study.md` (digital) | `src/assets/artwork/images/aurora-study.png` |
| `still-life-pears.md` (traditional) | `src/assets/artwork/images/still-life-pears.png` |
| `harbour-lights.md` (photography) | `src/assets/artwork/images/harbour-lights.png` |
| `neon-alley.md` (photography) | `src/assets/artwork/images/neon-alley.png` |

**To add a new piece:** drop a `.png`/`.jpg` in `src/assets/artwork/images/` and
create a `.md` file in `src/content/artwork/`:

```yaml
---
title: "My New Piece"
date: 2026-05-30
type: digital            # digital | traditional | photography
medium: "Procreate"       # optional
image: ../../assets/artwork/images/my-new-piece.png
description: "One-line description for the gallery + meta tags."
tags: [tag1, tag2]
featured: false           # optional, highlight on the desktop later
draft: false              # set true to hide while you work
---

Optional longer notes shown on the artwork's own page.
```

## 5. Projects, `src/content/projects/` + `src/assets/projects/images/`

Three placeholder projects exist (`this-website.md`, `pixel-weather.md`,
`retro-terminal.md`). Edit them or add your own:

```yaml
---
title: "Project Name"
date: 2026-05-30
status: active            # active | shipped | paused | archived
description: "One-line summary."
tech: [Astro, TypeScript]
github: https://github.com/you/repo   # optional
live: https://example.com             # optional
thumbnail: ../../assets/projects/images/screenshot.png   # optional
featured: true            # optional
draft: false
---

Full project write-up in Markdown.
```

> ⚠️ `this-website.md` references `https://github.com/mitchellroemling/...`, > update that to your actual repo URL.

## 6. Blog, `src/content/blog/` + `src/assets/blog/images/`

Two placeholder posts exist. One of them (`sketchbook-tour.md`) demonstrates
**pulling artwork photos into a post** via `relatedArtwork`:

```yaml
---
title: "Post title"
date: 2026-05-30
description: "Shown in the list + meta tags."
tags: [art, code]
cover: ../../assets/blog/images/cover.png   # optional standalone cover
relatedArtwork:                              # optional, pulls gallery images
  - aurora-study
  - harbour-lights
draft: false
---

Markdown body. Referenced artwork renders as a "Featured artwork" strip
at the bottom automatically.
```

`relatedArtwork` entries are artwork **filenames without `.md`** (their slug).

---

## 7. Easter eggs & flavour text (optional)

- **Recycle Bin**, `src/pages/recycle-bin.astro` (`const trash`): the fake
  deleted files. Swap for your own jokes.
- **Desktop welcome note**, `src/pages/index.astro` (the `Welcome.txt` window).
- **BSOD 404**, `src/pages/404.astro`: the error text, if you want a different gag.

## 8. Wallpaper (optional)

The desktop background is a **pure-CSS aurora gradient** (no copyrighted asset,
nothing to download) defined in `src/layouts/BaseLayout.astro` under `.app`.
To use a real image instead, drop one in `public/` and set
`background-image: url('/your-wallpaper.jpg')` on `.app`.

## 9. Favicon & OG image (optional)

- `public/favicon.svg`, a simple "MR" window icon. Replace with your own.
- `public/og-default.svg`, the social-share preview card. Replace if desired.
- `public/icons/*.svg`, the desktop / start-menu pixel icons. Replace any of
  these with custom 32×32 pixel art (keep the same filenames).

---

### After replacing content

```bash
npm run build      # type-checks + builds; fails loudly if a path is wrong
```

Then commit and push, Cloudflare Pages redeploys automatically. See
[`README.md`](README.md) for the full deployment guide.

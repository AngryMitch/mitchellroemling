# Plan: a local content editor

> **Status: implemented through Phase 2.** Keystatic (local mode) is wired up for
> all three collections, blog, artwork, projects. Run `npm run dev` and open
> [http://localhost:4321/keystatic](http://localhost:4321/keystatic). Config lives
> in [`keystatic.config.ts`](../keystatic.config.ts); it's dev-gated in
> [`astro.config.mjs`](../astro.config.mjs) so production stays pure-static.
> Phase 3 (polish) is left open for review, see the bottom of this doc.

**Goal:** a UI you run **locally** (`npm run dev`) to create and manage the
project's Markdown + images, blog posts, artwork, and projects, writing real
files into `src/content/` and `src/assets/` so the normal `git push → Cloudflare`
flow is unchanged. No external CMS service, no database, no deployed admin.

---

## TL;DR recommendation

Use **[Keystatic](https://keystatic.com)** in **local mode**. It's built by
Thinkmill specifically for this: a Git/file-based editor with first-class Astro
support, a typed schema that mirrors our existing content collections, and an
admin UI at `/keystatic` that reads and writes the actual files in the repo —
Markdown frontmatter **and** images into `src/assets/`. It runs only in dev, so
there's nothing to secure in production.

Estimated effort: **~1–2 hours** to wire up all three collections.

---

## Options considered

| Option | UI quality | Writes to our files | Type-safe schema | Extra deps | Image handling | Verdict |
|---|---|---|---|---|---|---|
| **Keystatic** (local mode) | Excellent | ✅ direct to repo | ✅ TS config | `@keystatic/*` + `@astrojs/react` | configurable into `src/assets` | **Recommended** |
| **Sveltia CMS** | Very good | ✅ (local backend or File System Access) | ❌ YAML config | none (loaded via CDN) | `media_folder`/`public_folder` | Good lightweight alt |
| **Decap CMS** (ex-Netlify) | OK / dated | ✅ via `decap-server` | ❌ YAML config | `decap-server` (dev only) | `media_folder`/`public_folder` | Works, clunkier UI |
| **Custom editor** | Whatever we build | ✅ exact control | ✅ | small (an endpoint + form) | exactly our convention | Most control, most effort |

Why not the others as the default:
- **Sveltia/Decap** use YAML config we'd hand-keep in sync with `content.config.ts`,
  and their image config maps most naturally to `public/` (URL paths), which
  sidesteps our optimised `image()` pipeline. Fine, but a downgrade.
- **Custom** is the most work to build and maintain; only worth it if Keystatic's
  conventions ever fight ours.

---

## How Keystatic fits this project

### A. Dependencies

```bash
npm i @keystatic/core @keystatic/astro
npx astro add react        # Keystatic's admin UI is React
```

### B. `astro.config.mjs`

```js
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  // output stays 'static' for the public site; Keystatic adds its own
  // dev-only routes. (Keystatic's admin needs a server context, so we run it
  // purely in `npm run dev`, it is not part of the production build.)
  integrations: [sitemap(), react(), keystatic()],
});
```

### C. `keystatic.config.ts` (mirrors `src/content.config.ts`)

```ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'local' }, // edits the local filesystem; dev-only

  collections: {
    blog: collection({
      label: 'Blog',
      path: 'src/content/blog/*',           // one .md per entry
      slugField: 'title',
      format: { contentField: 'body' },      // body → Markdown after frontmatter
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date' }),
        description: fields.text({ label: 'Description', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        cover: fields.image({
          label: 'Cover',
          directory: 'src/assets/blog/images',
          // publicPath must match what image() expects: a path relative to the
          // markdown file (blog files are flat → '../../assets/blog/images/').
          publicPath: '../../assets/blog/images/',
        }),
        relatedArtwork: fields.array(
          fields.relationship({ label: 'Artwork', collection: 'artwork' }),
          { label: 'Related artwork' },
        ),
        featured: fields.checkbox({ label: 'Featured' }),
        draft: fields.checkbox({ label: 'Draft' }),
        body: fields.markdoc({ label: 'Body' }),
      },
    }),

    artwork: collection({
      label: 'Artwork',
      path: 'src/content/artwork/*',
      slugField: 'title',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date' }),
        type: fields.select({
          label: 'Type',
          options: [
            { label: 'Digital', value: 'digital' },
            { label: 'Traditional', value: 'traditional' },
            { label: 'Photography', value: 'photography' },
          ],
          defaultValue: 'digital',
        }),
        medium: fields.text({ label: 'Medium' }),
        image: fields.image({
          label: 'Image',
          directory: 'src/assets/artwork/images',
          publicPath: '../../assets/artwork/images/',
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        featured: fields.checkbox({ label: 'Featured' }),
        draft: fields.checkbox({ label: 'Draft' }),
        body: fields.markdoc({ label: 'Notes' }),
      },
    }),

    // projects: same shape as artwork/blog, status select, tech array,
    // github/live url fields, thumbnail image, body.
  },
});
```

### D. Run it

```bash
npm run dev        # then open http://localhost:4321/keystatic
```

Create/edit posts in the browser, drop in images → Keystatic writes the `.md`
into `src/content/...` and the image into `src/assets/.../images/`. Then commit
and push as usual; Cloudflare rebuilds the public site.

---

## Key integration points to get right

1. **Image paths must match `image()`.** Our schema uses `image()` with paths
   **relative to the markdown file**. Keystatic's `directory` (where the file is
   saved) + `publicPath` (the string written into frontmatter) must combine to
   exactly `../../assets/<collection>/images/<file>`. Since all content files are
   flat (one level deep), a fixed `publicPath` works. ✅ Verify the first image
   round-trips and `npm run build` optimises it.

2. **Body format = Markdown.** Set `format: { contentField: 'body' }` so the body
   is written after the YAML frontmatter as standard Markdown that our `glob`
   loader already reads. (`fields.markdoc` gives a rich editor but serialises to
   Markdown/Markdoc, confirm our renderer is happy; switch to `fields.mdx` or a
   plain `fields.text` multiline if we want zero ambiguity.)

3. **`relatedArtwork` relationship.** `fields.relationship({ collection: 'artwork' })`
   stores the artwork **slug**, which is exactly what our `reference('artwork')`
   schema expects. ✅ The "blog pulls artwork" feature keeps working.

4. **Frontmatter field names must equal the Zod schema** in `content.config.ts`
   (title, date, description, tags, cover, relatedArtwork, featured, draft).
   Keep the two files in sync; a mismatch fails `astro check`.

5. **Dev-only, nothing to secure.** `storage: { kind: 'local' }` only works
   against the local filesystem, so the editor simply doesn't function in the
   deployed build. (If you ever want to edit from anywhere, Keystatic also offers
   a GitHub storage mode that opens PRs, out of scope for "local only".)

---

## Rollout

- **Phase 1, Blog only.** ✅ Done. Deps + Keystatic config, blog collection,
  create/edit verified, image dir wired, `npm run build` green.
- **Phase 2, Artwork + Projects.** ✅ Done. All three collections, with the
  `type`/`status` selects and the `relationship` field. Verified: editor reads
  all existing entries (2 blog / 4 artwork / 3 projects), a new entry created
  through the UI writes a valid `.md` (optional empty fields are omitted, not
  `null`), and that file builds + renders. Production build stays pure-static.
- **Phase 3, Polish.** ⏳ Open for your review. Candidate items to pick from:
  - **`npm run cms` script alias** + a one-line "open /keystatic" reminder.
  - **Field descriptions / help text** on each field, and tighter validation
    (e.g. require a thumbnail/screenshot, max tag counts, slug rules).
  - **A `singleton`** to edit site settings (name, tagline, social links) that
    today live in `src/consts.ts`, instead of editing code.
  - **Image guidance**: enforce aspect ratios / dimensions, or auto-fill `alt`.
  - **Reorderable galleries** via an explicit `order` field, or a featured flag
    surfaced as a column in the Keystatic list view.
  - **Custom Markdoc components** (callouts, image galleries), would add the
    `@astrojs/markdoc` integration so richer bodies render on the site.
  - **Draft workflow**: a Keystatic list filter / column for `draft`.

---

## Fallback: minimal custom editor

If Keystatic's conventions ever clash with ours, a ~150-line alternative:

- A dev-only Astro **API route** (`src/pages/api/save-post.ts`, guarded by
  `import.meta.env.DEV`) that accepts `{ frontmatter, body, image }`, writes the
  `.md` to `src/content/blog/`, and saves the upload to `src/assets/blog/images/`
  using our exact relative-path convention.
- A simple form page (`/editor`, also `DEV`-gated) listing existing posts and
  providing title/date/tags/body inputs + a file picker.

This guarantees the written paths match `image()` precisely, at the cost of
building and maintaining the UI ourselves.

---

**Next step:** review the editor at `/keystatic` (run `npm run dev`) and tell me
which **Phase 3** polish items you'd like, I'll fold them in.

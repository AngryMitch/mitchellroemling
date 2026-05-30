import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { ARTWORK_TYPES, PROJECT_STATUSES } from './consts';

/**
 * ARTWORK — mixed-media gallery pieces.
 * Drop a `.md` file in src/content/artwork/ and an image in
 * src/assets/artwork/images/. Reference the image with a path relative
 * to the markdown file, e.g. `../../assets/artwork/images/my-piece.png`.
 */
const artwork = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artwork' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      type: z.enum(ARTWORK_TYPES),
      /** Optional medium description, e.g. "Oil on canvas, 24x36". */
      medium: z.string().optional(),
      /** Full-resolution image (optimised at build time). */
      image: image(),
      /** Optional separate thumbnail; falls back to `image` if omitted. */
      thumbnail: image().optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** Hidden = unlisted: dropped from the gallery, sitemap, RSS, and nav. */
      hidden: z.boolean().default(false),
    }),
});

/**
 * PROJECTS — coding work shown in the file-explorer list view.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      status: z.enum(PROJECT_STATUSES),
      description: z.string(),
      tech: z.array(z.string()).default([]),
      github: z.url().optional(),
      live: z.url().optional(),
      thumbnail: image().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** Hidden = unlisted: dropped from the projects list, sitemap, and nav. */
      hidden: z.boolean().default(false),
    }),
});

/**
 * BLOG — written posts. A post can pull in artwork photos by referencing
 * artwork entries via `relatedArtwork` (an array of artwork ids/slugs).
 * Those images are then rendered inline on the post page.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      /** Optional standalone cover image for the post. */
      cover: image().optional(),
      /**
       * Artwork pieces to feature in this post. References by filename slug,
       * e.g. relatedArtwork: ["aurora-study", "harbour-lights"].
       * Their images + metadata are pulled from the artwork collection.
       */
      relatedArtwork: z.array(reference('artwork')).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** Hidden = unlisted: dropped from the blog index, sitemap, and RSS. */
      hidden: z.boolean().default(false),
    }),
});

export const collections = { artwork, projects, blog };

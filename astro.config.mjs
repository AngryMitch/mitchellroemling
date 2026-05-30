// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// Production site URL used for sitemap, RSS, and canonical links.
const SITE = 'https://mitchellroemling.com';

// The Keystatic content editor is local-only: enable it (and the React renderer
// it needs) for `astro dev` only. This keeps the production `astro build` a pure
// static export, no server adapter, no change to the Cloudflare Pages deploy.
const isDev = process.argv.includes('dev');
const editorIntegrations = isDev ? [react(), keystatic()] : [];

// https://astro.build/config
export default defineConfig({
  site: SITE,

  // Pure static output. Cloudflare Pages serves the contents of `dist/`
  // directly over its global CDN, no server adapter required.
  output: 'static',

  // No trailing slashes on routes (per PRD §5).
  trailingSlash: 'never',

  build: {
    // Emit /about.html instead of /about/index.html so URLs stay clean
    // and match `trailingSlash: 'never'`.
    format: 'file',
  },

  image: {
    // Use the built-in sharp service for WebP conversion + responsive sizing.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },

  integrations: [
    // Keep the private .family corner out of the public sitemap.
    sitemap({ filter: (page) => !page.includes('/family') }),
    ...editorIntegrations,
  ],

  // Be explicit about Markdown rendering so code blocks get a retro theme.
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});

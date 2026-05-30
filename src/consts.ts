/**
 * Site-wide constants and configuration.
 * Edit these values to update branding, navigation, and social links
 * across the whole site in one place.
 */

export const SITE = {
  /** Owner / brand name shown in title bars and the start menu. */
  name: 'Mitchell Roemling',
  /** Short tagline used in meta descriptions and the desktop. */
  tagline: 'Artist & Developer',
  /** Default meta description for SEO. */
  description:
    'The personal portfolio of Mitchell Roemling — mixed-media artwork, coding projects, and writing, served up in a cosy retro Windows desktop.',
  /** Canonical production URL (keep in sync with astro.config.mjs `site`). */
  url: 'https://mitchellroemling.com',
  /** Author email — also used as the primary contact. */
  email: 'mitch@mitchellroemling.com',
  /** Locale for <html lang> and Open Graph. */
  locale: 'en',
} as const;

/**
 * Social / contact links rendered in the About page, taskbar, and footers.
 * `icon` maps to an SVG glyph id in <SocialLinks />.
 */
export const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/AngryMitch',
    handle: '@mitchellroemling',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mitchell-roemling-175365288/',
    handle: 'in/mitchellroemling',
    icon: 'linkedin',
  },
  {
    label: 'Email',
    href: `mailto:${SITE.email}`,
    handle: SITE.email,
    icon: 'email',
  },
] as const;

/**
 * Primary navigation — drives the Start Menu and desktop icons.
 * `icon` maps to an SVG file in /public/icons/.
 */
export const NAV_ITEMS = [
  { label: 'My Artwork', href: '/gallery', icon: 'artwork', match: '/gallery' },
  { label: 'My Projects', href: '/projects', icon: 'projects', match: '/projects' },
  { label: 'Blog', href: '/blog', icon: 'blog', match: '/blog' },
  { label: 'About Me', href: '/about', icon: 'about', match: '/about' },
] as const;

/** Artwork type filter options used by the gallery toolbar + schema. */
export const ARTWORK_TYPES = ['digital', 'traditional', 'photography'] as const;
export type ArtworkType = (typeof ARTWORK_TYPES)[number];

/** Project lifecycle states used by the projects list + schema. */
export const PROJECT_STATUSES = ['active', 'shipped', 'paused', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

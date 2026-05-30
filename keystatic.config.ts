import { config, fields, collection } from '@keystatic/core';

/**
 * Keystatic, local content editor.
 *
 * Runs only in `npm run dev` (the integration is dev-gated in astro.config.mjs)
 * and writes real files into src/content/ and src/assets/. Open the editor at:
 *
 *   http://localhost:4321/keystatic
 *
 * The schemas below mirror src/content.config.ts, keep the two in sync.
 * Images are written into src/assets/<collection>/images and referenced with a
 * path relative to the Markdown file, matching Astro's image() helper.
 * Bodies are written as standard Markdown (.md) via `extension: 'md'`.
 */
export default config({
  storage: { kind: 'local' },

  ui: {
    brand: { name: 'Mitchell Roemling' },
    navigation: {
      Content: ['blog', 'artwork', 'projects'],
    },
  },

  collections: {
    blog: collection({
      label: 'Blog',
      path: 'src/content/blog/*',
      slugField: 'title',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        updated: fields.date({ label: 'Updated (optional)' }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { length: { min: 1 } },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        cover: fields.image({
          label: 'Cover image (optional)',
          directory: 'src/assets/blog/images',
          publicPath: '../../assets/blog/images/',
        }),
        relatedArtwork: fields.array(
          fields.relationship({ label: 'Artwork', collection: 'artwork' }),
          {
            label: 'Related artwork',
            description: 'Pieces from the gallery to feature in this post.',
            itemLabel: (props) => props.value ?? 'Select artwork',
          },
        ),
        featured: fields.checkbox({ label: 'Featured' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        hidden: fields.checkbox({
          label: 'Hidden (unlisted, family corner only)',
          defaultValue: false,
        }),
        body: fields.markdoc({ label: 'Body', extension: 'md' }),
      },
    }),

    artwork: collection({
      label: 'Artwork',
      path: 'src/content/artwork/*',
      slugField: 'title',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        type: fields.select({
          label: 'Type',
          options: [
            { label: 'Digital', value: 'digital' },
            { label: 'Traditional', value: 'traditional' },
            { label: 'Photography', value: 'photography' },
          ],
          defaultValue: 'digital',
        }),
        medium: fields.text({ label: 'Medium (optional)' }),
        image: fields.image({
          label: 'Image',
          directory: 'src/assets/artwork/images',
          publicPath: '../../assets/artwork/images/',
          validation: { isRequired: true },
        }),
        thumbnail: fields.image({
          label: 'Thumbnail (optional)',
          directory: 'src/assets/artwork/images',
          publicPath: '../../assets/artwork/images/',
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { length: { min: 1 } },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        featured: fields.checkbox({ label: 'Featured' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        hidden: fields.checkbox({
          label: 'Hidden (unlisted, family corner only)',
          defaultValue: false,
        }),
        body: fields.markdoc({ label: 'Notes (optional)', extension: 'md' }),
      },
    }),

    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Paused', value: 'paused' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'active',
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { length: { min: 1 } },
        }),
        tech: fields.array(fields.text({ label: 'Tech' }), {
          label: 'Tech stack',
          itemLabel: (props) => props.value,
        }),
        github: fields.url({ label: 'GitHub URL (optional)' }),
        live: fields.url({ label: 'Live URL (optional)' }),
        thumbnail: fields.image({
          label: 'Screenshot (optional)',
          directory: 'src/assets/projects/images',
          publicPath: '../../assets/projects/images/',
        }),
        featured: fields.checkbox({ label: 'Featured' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        hidden: fields.checkbox({
          label: 'Hidden (unlisted, family corner only)',
          defaultValue: false,
        }),
        body: fields.markdoc({ label: 'Write-up', extension: 'md' }),
      },
    }),
  },
});

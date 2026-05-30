import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = (
    await getCollection('blog', ({ data }) => !data.draft && !data.hidden)
  ).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: `${SITE.name} — Blog`,
    description: 'Writing about art, code, and the spaces in between.',
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}

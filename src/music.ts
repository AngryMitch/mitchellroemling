/**
 * My website playlist. I add or remove songs by editing this list, the first
 * one loads by default. Each `id` is a YouTube video id: the bit after
 * `watch?v=` (or after `youtu.be/`) in a video's URL.
 */
export interface Track {
  /** YouTube video id, e.g. the zjGCjHYNsmQ in youtube.com/watch?v=zjGCjHYNsmQ */
  id: string;
  /** What I show in the player's track menu. */
  label: string;
}

export const PLAYLIST: Track[] = [
  { id: 'zjGCjHYNsmQ', label: 'My current pick' },
  // I add more like this:
  // { id: 'anotherVideoId', label: 'Song name' },
];

/**
 * Builds a privacy-friendly (no-cookie) YouTube embed URL. The track loops and
 * I trim YouTube's extra chrome. Sound still needs a click to start (browsers
 * block autoplay with audio), so I leave the controls on so visitors can play it.
 */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    controls: '1',
    rel: '0',
    modestbranding: '1',
    loop: '1',
    playlist: id, // loop needs playlist set to the same id for a single video
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

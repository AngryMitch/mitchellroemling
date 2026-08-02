/**
 * My website playlist. I add or remove songs by editing this list. Each `id`
 * is a YouTube video id: the bit after `watch?v=` (or after `youtu.be/`) in a
 * video's URL.
 *
 * The player shuffles one of these in on each fresh visit (the first entry is
 * only what gets server-rendered before the shuffle runs), so ordering here is
 * just for my own reading. See MusicPlayer.astro.
 */
export interface Track {
  /** YouTube video id, e.g. the zjGCjHYNsmQ in youtube.com/watch?v=zjGCjHYNsmQ */
  id: string;
  /** What I show in the player's track menu. */
  label: string;
}

export const PLAYLIST: Track[] = [
  { id: 'zjGCjHYNsmQ', label: 'toe — サニーボーイ・ラプソディ' },
  { id: 'ZcS6ix-cIYQ', label: 'toe — LONELINESS WILL SHINE' },
  { id: 'g3Z9emnvcXM', label: 'カネヨリマサル — 今日の歌' },
  { id: '03uDc9m4NcQ', label: 'Sunset Rollercoaster — Let There Be Light Again' },
  { id: '7VYqcCLIx0s', label: '銀杏BOYZ — 少年少女' },
  { id: 'XOKQluw_YLU', label: '乃紫 (noa) — メガネを外して' },
  { id: 'y3ClpvabLd0', label: 'Small Leaks Sink Ships — Psychotic Opera' },
  { id: '-9UhZuM-ADk', label: 'Thesaurus Rex — Buy Your Time' },
  { id: '0d0FQm5Cx50', label: 'Hotel Mira — Speaking Off the Record' },
  { id: 'LLOqy8IdLck', label: 'Hotel Mira — Jungle' },
  // I add more like this:
  // { id: 'anotherVideoId', label: 'Artist — Song name' },
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

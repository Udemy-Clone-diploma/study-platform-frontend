/** Convert a YouTube watch/share URL into its embeddable player URL, or null if `url` isn't YouTube.
 *  Native `<video>` can't decode a YouTube page (no seek bar, no playback) — this must render in an `<iframe>` instead. */
export function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

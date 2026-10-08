import {JellyfinApi, JItem, JMediaSource} from './jellyfin';

export const ticksToSeconds = (ticks?: number) => (ticks ? ticks / 10000000 : 0);
export const secondsToTicks = (seconds: number) => Math.max(0, Math.floor(seconds * 10000000));

export function chooseSource(sources: JMediaSource[] = []) {
  return sources.find(source => source.SupportsDirectPlay)
    || sources.find(source => source.SupportsDirectStream)
    || sources.find(source => source.SupportsTranscoding)
    || sources[0]
    || null;
}

export function playbackUrl(api: JellyfinApi, item: JItem, source?: JMediaSource) {
  const selected = source || chooseSource(item.MediaSources);
  if (!selected) return null;

  if (selected.DirectStreamUrl) {
    return api['auth'] ? selected.DirectStreamUrl : null;
  }

  return {
    url: `${(api as any).auth.server.replace(/\\/$/, '')}/Videos/${encodeURIComponent(item.Id)}/stream?Static=true&MediaSourceId=${encodeURIComponent(selected.Id)}&api_key=${encodeURIComponent((api as any).auth.token)}`,
    source: selected,
  };
}

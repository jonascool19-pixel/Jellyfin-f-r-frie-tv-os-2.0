import {JellyfinApi,JItem} from './jellyfin';
export function playbackUrl(api:JellyfinApi,item:JItem){const source=item.MediaSources?.find((s:any)=>s.SupportsDirectPlay)||item.MediaSources?.[0];return source?{url:api.stream(item.Id,source),source}:null;}
export function ticksToSeconds(ticks?:number){return ticks?Math.floor(ticks/10000000):0;}

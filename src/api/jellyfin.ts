export type JellyfinAuth = {
  server: string;
  token: string;
  user: { Id: string; Name?: string };
  deviceId: string;
};

export type JMediaStream = {
  Index: number;
  Type: 'Video' | 'Audio' | 'Subtitle' | string;
  Codec?: string;
  Language?: string;
  DisplayTitle?: string;
  IsDefault?: boolean;
  IsForced?: boolean;
  IsExternal?: boolean;
  DeliveryMethod?: string;
};

export type JMediaSource = {
  Id: string;
  Name?: string;
  Container?: string;
  Size?: number;
  Bitrate?: number;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  DirectStreamUrl?: string;
  Path?: string;
  MediaStreams?: JMediaStream[];
};

export type JUserData = {
  Played?: boolean;
  PlayCount?: number;
  PlaybackPositionTicks?: number;
  IsFavorite?: boolean;
  LastPlayedDate?: string;
};

export type JItem = {
  Id: string;
  Name: string;
  Type: string;
  CollectionType?: string;
  SeriesId?: string;
  SeriesName?: string;
  SeasonId?: string;
  ParentId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  ImageTags?: { Primary?: string; Backdrop?: string; Thumb?: string };
  BackdropImageTags?: string[];
  Overview?: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  PremiereDate?: string;
  CommunityRating?: number;
  OfficialRating?: string;
  Genres?: string[];
  People?: Array<{ Name: string; Type?: string; Role?: string }>;
  MediaSources?: JMediaSource[];
  MediaStreams?: JMediaStream[];
  UserData?: JUserData;
};

export type ItemsResponse = { Items: JItem[]; TotalRecordCount?: number };

const cleanServer = (value: string) => value.trim().replace(/\\/+$/, '');

export class JellyfinApi {
  constructor(private auth: JellyfinAuth) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(cleanServer(this.auth.server) + path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Emby-Token': this.auth.token,
        ...(init.headers || {}),
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(body || `Jellyfin ${response.status} ${response.statusText}`);
    }
    return response.status === 204 ? (null as T) : response.json();
  }

  private userPath(path: string) {
    return `/Users/${encodeURIComponent(this.auth.user.Id)}${path}`;
  }

  views() {
    return this.request<ItemsResponse>(this.userPath('/Views?IncludeHidden=false'));
  }

  items(params: Record<string, string | number | boolean> | string = {}) {
    const query = typeof params === 'string'
      ? params
      : Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
    return this.request<ItemsResponse>(this.userPath('/Items' + (query ? '?' + query : '')));
  }

  item(id: string) {
    return this.request<JItem>(
      this.userPath(`/Items/${encodeURIComponent(id)}?Fields=Overview,Genres,People,MediaSources,MediaStreams,Chapters,RunTimeTicks,ProductionYear,UserData,Path,DateCreated`)
    );
  }

  resume(limit = 20) {
    return this.items({
      SortBy: 'DatePlayed',
      SortOrder: 'Descending',
      IncludeItemTypes: 'Movie,Episode,Video',
      Recursive: true,
      Fields: 'Overview,ProductionYear,RunTimeTicks,UserData',
      Filters: 'IsResumable',
      Limit: limit,
    });
  }

  nextUp(limit = 20) {
    return this.request<ItemsResponse>(
      `/Shows/NextUp?UserId=${encodeURIComponent(this.auth.user.Id)}&Limit=${limit}&Fields=Overview,ProductionYear,RunTimeTicks,UserData,SeriesId,SeriesName,ParentIndexNumber,IndexNumber`
    );
  }

  latest(limit = 20) {
    return this.items({
      SortBy: 'DateCreated',
      SortOrder: 'Descending',
      IncludeItemTypes: 'Movie,Series,Episode,Video',
      Recursive: true,
      Fields: 'Overview,ProductionYear,RunTimeTicks,UserData',
      Limit: limit,
    });
  }

  libraryItems(parentId: string, limit = 100) {
    return this.items({
      ParentId: parentId,
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Recursive: false,
      Fields: 'Overview,ProductionYear,RunTimeTicks,UserData,SeriesId,SeriesName,ParentIndexNumber,IndexNumber',
      Limit: limit,
    });
  }

  search(term: string, limit = 50) {
    return this.items({
      SearchTerm: term,
      Recursive: true,
      IncludeItemTypes: 'Movie,Series,Episode,Season,Audio,Video',
      Fields: 'Overview,ProductionYear,RunTimeTicks,UserData,SeriesId,SeriesName,ParentIndexNumber,IndexNumber',
      Limit: limit,
    });
  }

  authenticate(server: string, username: string, password: string) {
    const deviceId = `jellyfin-vega-${Math.random().toString(36).slice(2)}`;
    return fetch(cleanServer(server) + '/Users/AuthenticateByName', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Vega TV", Device="Fire TV Vega", DeviceId="${deviceId}", Version="0.2.0"`,
      },
      body: JSON.stringify({ Username: username, Pw: password }),
    }).then(async response => {
      if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(message || 'Anmeldung bei Jellyfin fehlgeschlagen.');
      }
      const data = await response.json();
      return { ...data, deviceId };
    });
  }

  getServer() { return cleanServer(this.auth.server); }
  getToken() { return this.auth.token; }

  image(id: string, type: 'Primary' | 'Backdrop' | 'Thumb' = 'Primary', width = 480) {
    return `${cleanServer(this.auth.server)}/Items/${encodeURIComponent(id)}/Images/${type}?fillWidth=${width}&quality=90&api_key=${encodeURIComponent(this.auth.token)}`;
  }

  playbackInfo(id: string) {
    return this.request<{ MediaSources: JMediaSource[] }>(
      `/Items/${encodeURIComponent(id)}/PlaybackInfo?UserId=${encodeURIComponent(this.auth.user.Id)}&DeviceId=${encodeURIComponent(this.auth.deviceId)}&MaxStreamingBitrate=120000000`
    );
  }

  reportStart(itemId: string, sourceId?: string, positionTicks = 0) {
    return this.request<void>('/Sessions/Playing', {
      method: 'POST',
      body: JSON.stringify({
        ItemId: itemId,
        MediaSourceId: sourceId,
        PlayMethod: 'DirectPlay',
        PositionTicks: positionTicks,
        CanSeek: true,
        IsPaused: false,
      }),
    });
  }

  reportProgress(itemId: string, sourceId: string | undefined, positionTicks: number, isPaused: boolean) {
    return this.request<void>('/Sessions/Playing/Progress', {
      method: 'POST',
      body: JSON.stringify({
        ItemId: itemId,
        MediaSourceId: sourceId,
        PositionTicks: positionTicks,
        IsPaused: isPaused,
        CanSeek: true,
      }),
    });
  }

  reportStop(itemId: string, sourceId: string | undefined, positionTicks: number) {
    return this.request<void>('/Sessions/Playing/Stopped', {
      method: 'POST',
      body: JSON.stringify({
        ItemId: itemId,
        MediaSourceId: sourceId,
        PositionTicks: positionTicks,
      }),
    });
  }

  logout() {
    return this.request<void>('/Sessions/Logout', { method: 'POST' });
  }
}

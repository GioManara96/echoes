export type Artist = {
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: {
    url: string;
  }[];
  name: string;
  popularity: number;
  uri: string;
};

export type TimeRange = "short_term" | "medium_term" | "long_term";

type NowPlayingIdle = {
  status: "idle";
  lastPlayed?: LastPlayedSummary;
  message: string;
};

export type LastPlayedSummary = {
  track: TrackSummary;
  played_at: string;
};

type NowPlayingError = {
  status: "error";
  message: string;
};

type NowPlayingActive = {
  status: "active";
  is_playing: boolean;
  progress_ms: number;
  item: PlayingItem;
};

export type TrackSummary = {
  id: string;
  kind: "track";
  images: {
    url: string;
  }[];
  artists: {
    url: string;
    id: string;
    name: string;
  }[];
  name: string;
  duration_ms: number;
};

export type EpisodeSummary = {
  id: string;
  kind: "episode";
  images: {
    url: string;
  }[];
  show: {
    name: string;
    publisher?: string;
    url?: string;
  };
  name: string;
  duration_ms: number;
};

export type PlayingItem = TrackSummary | EpisodeSummary;

export type NowPlayingPayload = NowPlayingIdle | NowPlayingActive | NowPlayingError;

export const RECENTLY_PLAYED_LIMITS = ["10", "20", "50"] as const;
export type RecentlyPlayedLimit = (typeof RECENTLY_PLAYED_LIMITS)[number];

export const TOP_ARTISTS_LIMITS = ["5", "10", "20"] as const;
export type TopArtistsLimit = (typeof TOP_ARTISTS_LIMITS)[number];

export type TopTrack = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  artists: {
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }[];
  album: {
    images: {
      url: string;
    }[];
  };
};

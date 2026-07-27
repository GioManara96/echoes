export type Artist = {
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  genres: string[];
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
  message: string;
};

type NowPlayingError = {
  status: "error";
  message: string;
};

type NowPlayingActive = {
  status: "active";
  is_playing: boolean;
  progress_ms: number;
  item: {
    album: {
      images: {
        url: string;
      }[];
    };
    artists: {
      url: string;
      id: string;
      name: string;
    }[];
    name: string;
    duration_ms: number;
  };
};

export type NowPlayingPayload = NowPlayingIdle | NowPlayingActive | NowPlayingError;

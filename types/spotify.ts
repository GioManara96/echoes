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

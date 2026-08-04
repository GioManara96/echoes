import "server-only";
import type {
  Artist,
  TimeRange,
  RecentlyPlayedLimit,
  TopArtistsLimit,
  TrackSummary,
  EpisodeSummary,
  PlayingItem,
  NowPlayingPayload,
  TopTrack,
} from "@/types/spotify";

// Module-private types: shape of Spotify's responses, only the fields we actually use
type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

type TopArtistsResponse = {
  items: Artist[];
};

type TopTracksResponse = {
  items: TopTrack[];
};

// Spotify raw shapes for currently-playing — NOT our TrackSummary/EpisodeSummary.
// Those are built later in the route mapper (kind, flat images, show.url, …).
type SpotifyNowPlayingTrack = {
  id: string;
  name: string;
  duration_ms: number;
  album: { images: { url: string }[] };
  artists: { external_urls: { spotify: string }; id: string; name: string }[];
};

type SpotifyNowPlayingEpisode = {
  id: string;
  name: string;
  duration_ms: number;
  images: { url: string }[];
  show: {
    name: string;
    publisher?: string;
    external_urls?: { spotify: string };
  };
};

type NowPlayingResponse = {
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
  is_playing: boolean;
  progress_ms: number;
  item?: SpotifyNowPlayingTrack | SpotifyNowPlayingEpisode | null;
};

type RecentlyPlayedResponse = {
  items: {
    track: {
      id: string;
      album: {
        images: {
          url: string;
        }[];
        external_urls: {
          spotify: string;
        };
        name: string;
      };
      artists: {
        external_urls: {
          spotify: string;
        };
        id: string;
        name: string;
      }[];
      name: string;
      duration_ms: number;
    };
    played_at: string;
  }[];
};

type RawTrack = {
  id: string;
  album: { images: { url: string }[] };
  artists: { external_urls: { spotify: string }; id: string; name: string }[];
  name: string;
  duration_ms: number;
};

type RawEpisode = {
  id: string;
  images: { url: string }[];
  show: {
    name: string;
    publisher?: string;
    external_urls?: { spotify: string };
  };
  name: string;
  duration_ms: number;
};

const clientId = requestEnv("SPOTIFY_CLIENT_ID");
const clientSecret = requestEnv("SPOTIFY_CLIENT_SECRET");
const refreshToken = requestEnv("SPOTIFY_REFRESH_TOKEN");
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

const TOP_TRACKS_TTL = 60 * 60_000;
const TOP_TRACKS_LIMIT = 5;
const TOP_TRACKS_TIME_RANGE: TimeRange = "medium_term";
let cachedTopTracks: { value: TopTrack[]; fetchedAt: number } | null = null;

// Returns a valid access token, transparently refreshing it when missing or stale.
// The cache lives in module scope, so it is shared across all requests of the same server process.
export async function getAccessToken(): Promise<string> {
  // 60s safety margin: better an early refresh than a token dying mid-request
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60_000 > Date.now()) {
    return cachedAccessToken.value;
  }

  // Cache miss or stale: exchange the long-lived refresh token for a fresh access token (1h lifetime)
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${await response.text()}`);
  }

  const tokenResponse: AccessTokenResponse = await response.json();
  cachedAccessToken = { value: tokenResponse.access_token, expiresAt: Date.now() + tokenResponse.expires_in * 1000 };
  return tokenResponse.access_token;
}

const TOP_ARTISTS_TTL = 60 * 60_000;
const cachedTopArtists = new Map<string, { value: Artist[]; fetchedAt: number }>();

// Success-only cache like getLastPlayed, but keyed by (timeRange, limit) since each combination
// is a different Spotify response. Errors are never stored, so they can't be replayed.
export async function getTopArtists(
  timeRange: TimeRange = "medium_term",
  limit: TopArtistsLimit = "5",
): Promise<Artist[]> {
  const cacheKey = `${timeRange}:${limit}`;
  const cached = cachedTopArtists.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < TOP_ARTISTS_TTL) {
    return cached.value;
  }

  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get top artists: ${response.status} ${await response.text()}`);
    }

    const artistsResponse: TopArtistsResponse = await response.json();
    cachedTopArtists.set(cacheKey, { value: artistsResponse.items, fetchedAt: Date.now() });
    return artistsResponse.items;
  } catch (error) {
    // Stale-if-error: yesterday's top artists beat an error page. Only rethrow with nothing cached.
    if (cached) {
      return cached.value;
    }
    throw error;
  }
}

export async function getTopTracks(): Promise<TopTrack[]> {
  const cached = cachedTopTracks;
  if (cached && Date.now() - cached.fetchedAt < TOP_TRACKS_TTL) {
    return cached.value;
  }

  try {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${TOP_TRACKS_TIME_RANGE}&limit=${TOP_TRACKS_LIMIT}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get top tracks: ${response.status} ${await response.text()}`);
    }

    const tracksResponse: TopTracksResponse = await response.json();
    cachedTopTracks = { value: tracksResponse.items, fetchedAt: Date.now() };
    return tracksResponse.items;
  } catch (error) {
    if (cached) {
      return cached.value;
    }
    throw error;
  }
}

// Reads a required env var, failing fast with a clear message if missing
function requestEnv(env: string): string {
  const value = process.env[env];
  if (!value) {
    throw new Error(`${env} is not set`);
  }
  return value;
}

export function toTimeRange(value: string | string[] | undefined): TimeRange {
  if (value === "short_term" || value === "medium_term" || value === "long_term") {
    return value;
  }
  return "medium_term";
}

async function fetchCurrentlyPlaying(): Promise<NowPlayingResponse | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode", {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get now playing: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function getNowPlayingPayload(): Promise<NowPlayingPayload> {
  const nowPlayingResponse = await fetchCurrentlyPlaying();
  if (!nowPlayingResponse || !nowPlayingResponse.item) {
    try {
      const lastPlayed = await getLastPlayed();
      const idle: NowPlayingPayload = {
        status: "idle",
        message: "Silence for now...",
        lastPlayed: lastPlayed
          ? { track: toTrackSummary(lastPlayed.track), played_at: lastPlayed.played_at }
          : undefined,
      };
      return idle;
    } catch {
      const idle: NowPlayingPayload = {
        status: "idle",
        message: "Silence for now...",
      };
      return idle;
    }
  }

  const active: NowPlayingPayload = {
    status: "active",
    is_playing: nowPlayingResponse.is_playing,
    progress_ms: nowPlayingResponse.progress_ms,
    item: toPlayingItem(nowPlayingResponse.item),
  };
  return active;
}

export async function getRecentlyPlayed(limit: RecentlyPlayedLimit = "10"): Promise<RecentlyPlayedResponse> {
  const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to get recently played: ${response.status} ${await response.text()}`);
  }

  const recentlyPlayedResponse: RecentlyPlayedResponse = await response.json();
  return recentlyPlayedResponse;
}

type RecentlyPlayedItem = RecentlyPlayedResponse["items"][number];

const LAST_PLAYED_TTL = 5 * 60_000;
let cachedLastPlayed: { value: RecentlyPlayedItem | null; fetchedAt: number } | null = null;

// Most recent listen, with a module-scope cache so idle polling doesn't hit Spotify on every request.
// Same success-only principle as cachedAccessToken: errors are never stored, so they can't be replayed.
export async function getLastPlayed(): Promise<RecentlyPlayedItem | null> {
  if (cachedLastPlayed && Date.now() - cachedLastPlayed.fetchedAt < LAST_PLAYED_TTL) {
    return cachedLastPlayed.value;
  }

  try {
    const recentlyPlayed = await getRecentlyPlayed("10");
    cachedLastPlayed = { value: recentlyPlayed.items[0] ?? null, fetchedAt: Date.now() };
    return cachedLastPlayed.value;
  } catch (error) {
    // Stale-if-error: an old echo beats no echo. Only rethrow when we have nothing at all.
    if (cachedLastPlayed) {
      return cachedLastPlayed.value;
    }
    throw error;
  }
}

export function toRecentlyPlayedLimit(value: string | string[] | undefined): RecentlyPlayedLimit {
  if (value === "10" || value === "20" || value === "50") {
    return value;
  }
  return "10";
}

export function toTopArtistsLimit(value: string | string[] | undefined): TopArtistsLimit {
  if (value === "5" || value === "10" || value === "20") {
    return value;
  }
  return "5";
}

function toTrackSummary(track: RawTrack): TrackSummary {
  return {
    id: track.id,
    kind: "track",
    images: track.album.images,
    artists: track.artists.map((artist) => {
      return {
        url: artist.external_urls.spotify,
        id: artist.id,
        name: artist.name,
      };
    }),
    name: track.name,
    duration_ms: track.duration_ms,
  };
}

function toEpisodeSummary(episode: RawEpisode): EpisodeSummary {
  return {
    id: episode.id,
    kind: "episode",
    images: episode.images,
    show: {
      name: episode.show.name,
      publisher: episode.show.publisher,
      url: episode.show.external_urls?.spotify,
    },
    name: episode.name,
    duration_ms: episode.duration_ms,
  };
}

function toPlayingItem(item: RawTrack | RawEpisode): PlayingItem {
  // Raw discriminant: episodes have `show`, tracks have `album` + `artists`
  if ("show" in item) {
    return toEpisodeSummary(item);
  }
  return toTrackSummary(item);
}

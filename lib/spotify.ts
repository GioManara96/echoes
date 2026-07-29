import "server-only";
import type { Artist, TimeRange, RecentlyPlayedLimit, TopArtistsLimit } from "@/types/spotify";

// Module-private types: shape of Spotify's responses, only the fields we actually use
type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

type TopArtistsResponse = {
  items: Artist[];
};

type NowPlayingResponse = {
  is_playing: boolean;
  progress_ms: number;
  item: {
    id: string;
    album: {
      images: {
        url: string;
      }[];
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

const clientId = requestEnv("SPOTIFY_CLIENT_ID");
const clientSecret = requestEnv("SPOTIFY_CLIENT_SECRET");
const refreshToken = requestEnv("SPOTIFY_REFRESH_TOKEN");
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

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

export async function getNowPlaying(): Promise<NowPlayingResponse | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
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

  const nowPlayingResponse: NowPlayingResponse = await response.json();
  return nowPlayingResponse;
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

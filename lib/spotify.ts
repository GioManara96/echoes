import "server-only";
import type { Artist, TimeRange } from "@/types/spotify";

// Module-private types: shape of Spotify's responses, only the fields we actually use
type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

type TopArtistsResponse = {
  items: Artist[];
};

export type NowPlayingResponse = {
  is_playing: boolean;
  progress_ms: number;
  item: {
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

export async function getTopArtists(timeRange: TimeRange = "medium_term"): Promise<Artist[]> {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get top artists: ${response.status} ${await response.text()}`);
  }

  const artistsResponse: TopArtistsResponse = await response.json();
  return artistsResponse.items;
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
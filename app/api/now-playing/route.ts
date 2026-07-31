import { getNowPlaying, getLastPlayed } from "@/lib/spotify";
import type { NowPlayingPayload, TrackSummary, EpisodeSummary, PlayingItem } from "@/types/spotify";

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

export async function GET() {
  try {
    const nowPlaying = await getNowPlaying();
    if (!nowPlaying || !nowPlaying.item) {
      try {
        const lastPlayed = await getLastPlayed();
        const idle: NowPlayingPayload = {
          status: "idle",
          message: "Silence for now...",
          lastPlayed: lastPlayed
            ? { track: toTrackSummary(lastPlayed.track), played_at: lastPlayed.played_at }
            : undefined,
        };
        return Response.json(idle);
      } catch {
        const idle: NowPlayingPayload = {
          status: "idle",
          message: "Silence for now...",
        };
        return Response.json(idle);
      }
    }

    const active: NowPlayingPayload = {
      status: "active",
      is_playing: nowPlaying.is_playing,
      progress_ms: nowPlaying.progress_ms,
      item: toPlayingItem(nowPlaying.item),
    };
    return Response.json(active);
  } catch (error) {
    console.error(error);
    const errorPayload: NowPlayingPayload = {
      status: "error",
      message: "spotify_unavailable",
    };
    return Response.json(errorPayload, { status: 502 });
  }
}

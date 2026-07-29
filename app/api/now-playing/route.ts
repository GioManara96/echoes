import { getNowPlaying, getLastPlayed } from "@/lib/spotify";
import type { NowPlayingPayload, TrackSummary } from "@/types/spotify";

type RawTrack = {
  id: string;
  album: { images: { url: string }[] };
  artists: { external_urls: { spotify: string }; id: string; name: string }[];
  name: string;
  duration_ms: number;
};

function toTrackSummary(track: RawTrack): TrackSummary {
  return {
    id: track.id,
    album: { images: track.album.images },
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

export async function GET() {
  try {
    const nowPlaying = await getNowPlaying();
    if (!nowPlaying) {
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

    const track: NowPlayingPayload = {
      status: "active",
      is_playing: nowPlaying.is_playing,
      progress_ms: nowPlaying.progress_ms,
      item: toTrackSummary(nowPlaying.item),
    };
    return Response.json(track);
  } catch (error) {
    console.error(error);
    const errorPayload: NowPlayingPayload = {
      status: "error",
      message: "spotify_unavailable",
    };
    return Response.json(errorPayload, { status: 502 });
  }
}

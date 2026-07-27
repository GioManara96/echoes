import { getNowPlaying } from "@/lib/spotify";
import type { NowPlayingPayload } from "@/types/spotify";

export async function GET() {
  try {
    const nowPlaying = await getNowPlaying();
    if (!nowPlaying) {
      const idle: NowPlayingPayload = {
        status: "idle",
        message: "Silence for now...",
      };
      return Response.json(idle);
    }

    const track: NowPlayingPayload = {
      status: "active",
      is_playing: nowPlaying.is_playing,
      progress_ms: nowPlaying.progress_ms,
      item: {
        album: { images: nowPlaying.item.album.images },
        artists: nowPlaying.item.artists.map((artist) => {
          return {
            url: artist.external_urls.spotify,
            id: artist.id,
            name: artist.name,
          };
        }),
        name: nowPlaying.item.name,
        duration_ms: nowPlaying.item.duration_ms,
      },
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

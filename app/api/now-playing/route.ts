import { getNowPlayingPayload } from "@/lib/spotify";
import type { NowPlayingPayload } from "@/types/spotify";

export async function GET() {
  try {
    const nowPlaying = await getNowPlayingPayload();

    return Response.json(nowPlaying);
  } catch (error) {
    console.error(error);
    const errorPayload: NowPlayingPayload = {
      status: "error",
      message: "spotify_unavailable",
    };
    return Response.json(errorPayload, { status: 502 });
  }
}

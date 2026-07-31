import { getNowPlayingPayload } from "@/lib/spotify";
import NowPlaying from "./NowPlaying";

export default async function NowPlayingSection() {
  const data = await getNowPlayingPayload();
  return <NowPlaying initialData={data} />;
}

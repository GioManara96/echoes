import TopArtists from "@/components/TopArtists";
import TimeRangeTabs from "@/components/TimeRangeTabs";
import NowPlaying from "@/components/NowPlaying";
import RecentlyPlayed from "@/components/RecentlyPlayed";
import { toTimeRange, toRecentlyPlayedLimit } from "@/lib/spotify";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const range = toTimeRange((await searchParams).range);
  const limit = toRecentlyPlayedLimit((await searchParams).limit);
  return (
    <main>
      <h1>Welcome to Echoes</h1>
      <TimeRangeTabs timeRange={range} limit={limit} />
      <TopArtists timeRange={range} />
      <RecentlyPlayed limit={limit} timeRange={range} />
      <NowPlaying />
    </main>
  );
}

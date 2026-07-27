import TopArtists from "@/components/TopArtists";
import TimeRangeTabs from "@/components/TimeRangeTabs";
import NowPlaying from "@/components/NowPlaying";
import { toTimeRange } from "@/lib/spotify";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const range = toTimeRange((await searchParams).range);
  return (
    <main>
      <h1>Welcome to Echoes</h1>
      <TimeRangeTabs timeRange={range} />
      <TopArtists timeRange={range} />
      <NowPlaying />
    </main>
  );
}

import TopArtists from "@/components/TopArtists";
import TimeRangeTabs from "@/components/TimeRangeTabs";
import NowPlaying from "@/components/NowPlaying";
import RecentlyPlayed from "@/components/RecentlyPlayed";
import { toTimeRange, toRecentlyPlayedLimit, toTopArtistsLimit } from "@/lib/spotify";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const range = toTimeRange((await searchParams).range);
  const limit = toRecentlyPlayedLimit((await searchParams).limit);
  const top = toTopArtistsLimit((await searchParams).top);
  return (
    <main className="page">
      <header className="brand">
        <h1 className="brand__title">Echoes</h1>
        <p className="brand__tagline">Every listen leaves an echo.</p>
      </header>
      <NowPlaying />
      <TimeRangeTabs timeRange={range} limit={limit} top={top} />
      <TopArtists range={range} top={top} />
      <RecentlyPlayed limit={limit} />
    </main>
  );
}

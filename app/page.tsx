import TopArtists from "@/components/TopArtists";
import TimeRangeTabs from "@/components/TimeRangeTabs";
import RecentlyPlayed from "@/components/RecentlyPlayed";
import { toTimeRange, toRecentlyPlayedLimit, toTopArtistsLimit } from "@/lib/spotify";
import Brand from "@/components/Brand";
import NowPlayingSection from "@/components/NowPlayingSection";
import NowPlayingSkeleton from "@/components/NowPlayingSkeleton";
import { Suspense } from "react";
import TopTracks from "@/components/TopTracks";

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
      <Brand />
      <Suspense fallback={<NowPlayingSkeleton />}>
        <NowPlayingSection />
      </Suspense>
      <TimeRangeTabs timeRange={range} limit={limit} top={top} />
      <TopArtists range={range} top={top} />
      <TopTracks />
      <RecentlyPlayed limit={limit} />
    </main>
  );
}

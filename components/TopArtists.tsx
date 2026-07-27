import { getTopArtists } from "@/lib/spotify";
import type { TimeRange } from "@/types/spotify";
type Props = {
  timeRange: TimeRange;
};

export default async function TopArtists({ timeRange }: Props) {
  const topArtists = await getTopArtists(timeRange);
  return (
    <div>
      <h2>Your Top Artists</h2>
      <ul>
        {topArtists.map((artist) => <li key={artist.id}>{artist.name}</li>)}
      </ul>
    </div>
  );
}

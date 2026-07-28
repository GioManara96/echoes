import { getTopArtists } from "@/lib/spotify";
import type { TimeRange } from "@/types/spotify";

type Props = {
  range: TimeRange;
};

export default async function TopArtists({ range }: Props) {
  const topArtists = await getTopArtists(range);
  return (
    <section>
      <h2 className="section__title">Top artists</h2>
      <ol className="artist-list">
        {topArtists.map((artist, index) => (
          <li key={artist.id} className="artist-list__item">
            <span className="artist-list__rank">{String(index + 1).padStart(2, "0")}</span>
            <span className="artist-list__name">{artist.name}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

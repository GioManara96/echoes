import { getTopArtists } from "@/lib/spotify";
import { TOP_ARTISTS_LIMITS, type TimeRange, type TopArtistsLimit } from "@/types/spotify";
import LimitSelect from "./LimitSelect";
import Image from "next/image";

type Props = {
  range: TimeRange;
  top: TopArtistsLimit;
};

export default async function TopArtists({ range, top }: Props) {
  const topArtists = await getTopArtists(range, top);
  return (
    <section>
      <div className="flex justify-between items-center">
        <h2 className="section__title">Top artists</h2>
        <LimitSelect paramName="top" options={TOP_ARTISTS_LIMITS} value={top} />
      </div>
      <ol className="artist-list">
        {topArtists.map((artist, index) => (
          <li key={artist.id} className="artist-list__item">
            <a
              className="artist-list__link"
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
            >
              {artist.images.length > 0 && (
                <Image
                  src={artist.images[0].url}
                  alt=""
                  fill
                  sizes={index === 0 ? "(max-width: 768px) 100vw, 600px" : "(max-width: 768px) 50vw, 300px"}
                  className="artist-list__photo"
                />
              )}
              <span className="artist-list__scrim" aria-hidden="true"></span>
              <span className="artist-list__rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="artist-list__name">{artist.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

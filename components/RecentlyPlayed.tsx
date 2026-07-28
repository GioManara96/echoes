import { formatPlayedAt } from "@/utils/format-played-at";
import { getRecentlyPlayed } from "@/lib/spotify";
import type { RecentlyPlayedLimit, TimeRange } from "@/types/spotify";
import LimitSelect from "@/components/LimitSelect";
import NextImage from "next/image";

type Props = {
  limit: RecentlyPlayedLimit;
  timeRange: TimeRange;
};

export default async function RecentlyPlayed({ limit, timeRange }: Props) {
  const recentlyPlayed = await getRecentlyPlayed(limit);

  return (
    <section className="my-16">
      <div className="flex justify-between items-center">
        <h2 className="section__title">Recently played</h2>
        <LimitSelect limit={limit} timeRange={timeRange} />
      </div>

      <ul className="recent-list">
        {recentlyPlayed.items.map((item) => (
          <li key={`${item.track.id}-${item.played_at}`} className="recent-list__item">
            <div className="recent-list__image">
              {item.track.album.images.length > 0 && (
                <NextImage
                  src={item.track.album.images[0].url}
                  alt={item.track.name}
                  width={64}
                  height={64}
                  className="h-full"
                />
              )}
            </div>
            <div className="recent-list__content">
              <div className="recent-list__infos">
                <p className="recent-list__name">{item.track.name}</p>
                <p className="recent-list__album">
                  <a href={item.track.album.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                    {item.track.album.name}
                  </a>
                </p>
                <p className="recent-list__artists">
                  {item.track.artists.map((artist, index) => (
                    <span key={artist.id}>
                      {index > 0 && ", "}
                      <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                        {artist.name}
                      </a>
                    </span>
                  ))}
                </p>
              </div>
              <div className="recent-list__when">
                <p>{formatPlayedAt(item.played_at)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

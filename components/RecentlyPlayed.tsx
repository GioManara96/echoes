import { formatPlayedAt } from "@/utils/format-played-at";
import { getRecentlyPlayed } from "@/lib/spotify";
import { RECENTLY_PLAYED_LIMITS, type RecentlyPlayedLimit, type TimeRange } from "@/types/spotify";
import Link from "next/link";
import NextImage from "next/image";

type Props = {
  limit: RecentlyPlayedLimit;
  timeRange: TimeRange;
};

export default async function RecentlyPlayed({ limit, timeRange }: Props) {
  const recentlyPlayed = await getRecentlyPlayed(limit);

  return (
    <section>
      <h2>Recently played</h2>

      <nav>
        {RECENTLY_PLAYED_LIMITS.map((value) => (
          <Link
            key={value}
            href={`?range=${timeRange}&limit=${value}`}
            aria-current={limit === value ? "page" : undefined}
          >
            {value} &nbsp;|&nbsp;
          </Link>
        ))}
      </nav>

      <ul>
        {recentlyPlayed.items.map((item) => (
          <li key={`${item.track.id}-${item.played_at}`}>
            {item.track.album.images.length > 0 && (
              <NextImage src={item.track.album.images[0].url} alt={item.track.name} width={64} height={64} />
            )}
            <p>{item.track.name}</p>
            <p>
              <a href={item.track.album.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                {item.track.album.name}
              </a>
            </p>
            <p>
              {item.track.artists.map((artist, index) => (
                <span key={artist.id}>
                  {index > 0 && ", "}
                  <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                    {artist.name}
                  </a>
                </span>
              ))}
            </p>
            <p>{formatPlayedAt(item.played_at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

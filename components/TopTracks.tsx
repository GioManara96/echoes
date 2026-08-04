import { getTopTracks } from "@/lib/spotify";
import type { TopTrack } from "@/types/spotify";
import PodiumReveal from "@/components/PodiumReveal";
import RevealOnScroll from "@/components/RevealOnScroll";
import NextImage from "next/image";

function TrackArtists({ artists }: { artists: TopTrack["artists"] }) {
  return (
    <>
      {artists.map((artist, artistIndex) => (
        <span key={artist.id}>
          {artistIndex > 0 && ", "}
          <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
            {artist.name}
          </a>
        </span>
      ))}
    </>
  );
}

function PodiumSlot({ track, rank }: { track: TopTrack; rank: number }) {
  const rankLabel = String(rank).padStart(2, "0");
  const sizes = rank === 1 ? "180px" : "140px";

  return (
    <li className={`track-podium__slot track-podium__slot--${rank}`} value={rank}>
      <div className="track-podium__art">
        {track.album.images.length > 0 && (
          <NextImage src={track.album.images[0].url} alt="" fill sizes={sizes} className="track-podium__photo" />
        )}
      </div>
      <div className="track-podium__riser" aria-hidden="true" />
      <span className="track-podium__rank">{rankLabel}</span>
      <a className="track-podium__name" href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
        {track.name}
      </a>
      <p className="track-podium__artists">
        <TrackArtists artists={track.artists} />
      </p>
    </li>
  );
}

export default async function TopTracks() {
  const tracks = await getTopTracks();
  const [first, second, third, ...rest] = tracks;

  return (
    <section className="my-16">
      <div className="track-podium-header">
        <h2 className="section__title">Top tracks</h2>
        <p className="track-podium-header__period">Last 6 months</p>
      </div>

      {first && (
        <PodiumReveal>
          <ol className="track-podium">
            {second && <PodiumSlot track={second} rank={2} />}
            <PodiumSlot track={first} rank={1} />
            {third && <PodiumSlot track={third} rank={3} />}
          </ol>
        </PodiumReveal>
      )}

      {rest.length > 0 && (
        <RevealOnScroll itemSelector=".track-podium-rest__item" revealKey="top-tracks-rest">
          <ol className="track-podium-rest" start={4}>
            {rest.map((track, index) => (
              <li key={track.id} className="track-podium-rest__item" value={index + 4}>
                <span className="track-podium-rest__rank">{String(index + 4).padStart(2, "0")}</span>
                <div className="track-podium-rest__art">
                  {track.album.images.length > 0 && (
                    <NextImage src={track.album.images[0].url} alt="" width={40} height={40} />
                  )}
                </div>
                <div>
                  <a className="track-podium-rest__name" href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                    {track.name}
                  </a>
                  <p className="track-podium-rest__artists">
                    <TrackArtists artists={track.artists} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </RevealOnScroll>
      )}
    </section>
  );
}

import { useState } from "react";
import NextImage from "next/image";
import type { LastPlayedSummary } from "@/types/spotify";
import { formatPlayedAt } from "@/utils/format-played-at";

const IDLE_PHRASES = [
  "Silence for now — here's the last echo:",
  "The booth is dark, but the tape remembers:",
  "Nothing on air. Last echo before the quiet:",
  "The needle is resting. Last spin:",
];

type Props = {
  lastPlayed: LastPlayedSummary;
};

export default function LastPlayed({ lastPlayed }: Props) {
  // Lazy initializer: picked once on mount, so polling re-renders don't reroll the phrase
  const [phrase] = useState(() => IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]);

  return (
    <section className="now-playing">
      <div className="now-playing__image">
        {lastPlayed.track.images.length > 0 && (
          <NextImage
            src={lastPlayed.track.images[0].url}
            alt=""
            width={300}
            height={300}
            priority
            className="w-full h-auto object-cover"
          />
        )}
      </div>
      <div className="now-playing__content">
        <div className="now-playing__status">
          <span>Off air · last played {formatPlayedAt(lastPlayed.played_at)}</span>
        </div>
        <p className="now-playing__phrase">{phrase}</p>
        <h2 className="sr-only">Last played</h2>
        <h3 className="now-playing__track">{lastPlayed.track.name}</h3>
        <p className="now-playing__artists">
          {lastPlayed.track.artists.map((artist, index) => (
            <a key={artist.id} href={artist.url} target="_blank" rel="noopener noreferrer">
              {artist.name}
              {index < lastPlayed.track.artists.length - 1 && ", "}
            </a>
          ))}
        </p>
        <div className="now-playing__progress-bar" />
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { NowPlayingPayload } from "@/types/spotify";
import NextImage from "next/image";

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingPayload | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing");
        const data: NowPlayingPayload = await response.json();
        setNowPlaying(data);
      } catch (error) {
        console.error(error);
        setNowPlaying({ status: "error", message: "We can't reach the server right now. Try again later." });
      }
    };
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!nowPlaying) return <p>Loading…</p>;
  if (nowPlaying.status === "idle") return <p>{nowPlaying.message}</p>;
  if (nowPlaying.status === "error") return <p>{nowPlaying.message}</p>;

  return (
    <div>
      <h2>
        Now Playing | <span>{nowPlaying.is_playing ? "on air" : "paused"}</span>
      </h2>

      <p>{nowPlaying.item.name}</p>
      <p>
        Artists:
        {nowPlaying.item.artists.map((artist) => (
          <a key={artist.id} href={artist.url} target="_blank" rel="noopener noreferrer">
            {artist.name}
          </a>
        ))}
      </p>
      {nowPlaying.item.album.images.length > 0 && (
        <NextImage src={nowPlaying.item.album.images[0].url} alt={nowPlaying.item.name} width={300} height={300} />
      )}
      <p>{nowPlaying.item.duration_ms}</p>
      <p>{nowPlaying.progress_ms}</p>
    </div>
  );
}

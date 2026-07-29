"use client";

import { useEffect, useRef, useState } from "react";
import type { NowPlayingPayload } from "@/types/spotify";
import NextImage from "next/image";
import LastPlayed from "./LastPlayed";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingPayload | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (!heroRef.current?.querySelector(".now-playing__image")) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .from(".now-playing__image", {
            xPercent: -100,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
          })
          .from(
            ".now-playing__progress-bar",
            {
              width: 0,
              duration: 0.7,
              ease: "power2.out",
            },
            "-=0.4",
          );
      });
    },
    { scope: heroRef, dependencies: [nowPlaying?.status] },
  );

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

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setIsDocked(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [nowPlaying?.status]);

  if (!nowPlaying) {
    return (
      <section className="now-playing">
        <p className="now-playing__message">Loading…</p>
      </section>
    );
  }

  if (nowPlaying.status === "error") {
    return (
      <section className="now-playing">
        <p className="now-playing__message">{nowPlaying.message}</p>
      </section>
    );
  }

  if (nowPlaying.status === "idle") {
    if (nowPlaying.lastPlayed) {
      return <LastPlayed lastPlayed={nowPlaying.lastPlayed} />;
    }
    return (
      <section className="now-playing">
        <p className="now-playing__message">{nowPlaying.message}</p>
      </section>
    );
  }

  const progressPercent =
    nowPlaying.item.duration_ms > 0 ? Math.min(100, (nowPlaying.progress_ms / nowPlaying.item.duration_ms) * 100) : 0;

  return (
    <section ref={heroRef} className="now-playing">
      <div className="now-playing__image">
        {nowPlaying.item.album.images.length > 0 && (
          <NextImage
            src={nowPlaying.item.album.images[0].url}
            alt={nowPlaying.item.name}
            width={300}
            height={300}
            priority
            className="w-full h-auto object-cover"
          />
        )}
      </div>
      <div className="now-playing__content">
        <div className="now-playing__status">
          {nowPlaying.is_playing ? <span className="now-playing__status--live">On air</span> : <span>Paused</span>}
        </div>
        <h3 className="now-playing__track">{nowPlaying.item.name}</h3>
        <p className="now-playing__artists">
          {nowPlaying.item.artists.map((artist, index) => (
            <a key={artist.id} href={artist.url} target="_blank" rel="noopener noreferrer">
              {artist.name}
              {index < nowPlaying.item.artists.length - 1 && ", "}
            </a>
          ))}
        </p>
        <div className="now-playing__progress-bar">
          <div
            className={`now-playing__progress-fill${nowPlaying.is_playing ? "" : " now-playing__progress-fill--paused"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Compact copy of the hero: hidden from assistive tech, so no links or headings inside */}
      <div className={`now-playing-dock${isDocked ? " is-visible" : ""}`} aria-hidden="true">
        <div className="now-playing-dock__image">
          {nowPlaying.item.album.images.length > 0 && (
            <NextImage
              src={nowPlaying.item.album.images[0].url}
              alt=""
              width={64}
              height={64}
              className="w-full h-auto object-cover"
            />
          )}
        </div>
        <div className="now-playing-dock__content">
          <div className="now-playing-dock__infos">
            <p className="now-playing-dock__track">{nowPlaying.item.name}</p>
            <p className="now-playing-dock__artists">
              {nowPlaying.item.artists.map((artist) => artist.name).join(", ")}
            </p>
          </div>
          <div className="now-playing-dock__status">
            {nowPlaying.is_playing ? (
              <span className="now-playing-dock__status--live">On air</span>
            ) : (
              <span>Paused</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { NowPlayingPayload } from "@/types/spotify";
import NextImage from "next/image";
import LastPlayed from "./LastPlayed";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Props = {
  initialData: NowPlayingPayload;
};

gsap.registerPlugin(useGSAP);
const EQUALIZER_BARS = 5;

export default function NowPlaying({ initialData }: Props) {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingPayload>(initialData);
  const [isDocked, setIsDocked] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const prevTrackIdRef = useRef<string | null>(null);

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
              scaleX: 0,
              transformOrigin: "left center",
              duration: 0.7,
              ease: "power2.out",
            },
            "-=0.4",
          );
      });
    },
    { scope: heroRef, dependencies: [nowPlaying?.status] },
  );

  const isLive = nowPlaying?.status === "active" && nowPlaying.is_playing;
  const trackId = nowPlaying?.status === "active" ? nowPlaying.item.id : null;

  useGSAP(
    () => {
      const bars = heroRef.current?.querySelectorAll(".now-playing__eq-bar");
      if (!bars?.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(bars, { transformOrigin: "bottom center", scaleY: 0.3 });
        bars.forEach((bar) => {
          // String-based random + repeatRefresh: a new target height on every cycle, so the eq never loops
          gsap.to(bar, {
            scaleY: "random(0.35, 1)",
            duration: gsap.utils.random(0.35, 0.7),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
          });
        });
      });
    },
    { scope: heroRef, dependencies: [isLive] },
  );

  useGSAP(
    () => {
      if (!trackId) {
        prevTrackIdRef.current = null;
        return;
      }
      if (!heroRef.current?.querySelector(".now-playing__image")) return;

      const prevTrackId = prevTrackIdRef.current;
      prevTrackIdRef.current = trackId;

      // First active paint is owned by the entrance timeline
      if (prevTrackId === null || prevTrackId === trackId) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .from(".now-playing__image", {
            opacity: 0,
            scale: 0.96,
            duration: 0.45,
            ease: "power2.out",
          })
          .from(
            ".now-playing__track",
            {
              opacity: 0,
              y: 10,
              duration: 0.35,
              ease: "power2.out",
            },
            "-=0.25",
          )
          .from(
            ".now-playing__artists",
            {
              opacity: 0,
              y: 8,
              duration: 0.3,
              ease: "power2.out",
            },
            "-=0.2",
          )
          .from(
            ".now-playing-dock__image",
            {
              opacity: 0,
              duration: 0.35,
              ease: "power2.out",
            },
            0,
          )
          .from(
            [".now-playing-dock__track", ".now-playing-dock__artists"],
            {
              opacity: 0,
              y: 6,
              duration: 0.3,
              ease: "power2.out",
              stagger: 0.05,
            },
            "-=0.25",
          );
      });
    },
    { scope: heroRef, dependencies: [trackId] },
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

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (intervalId !== undefined) return;
      intervalId = setInterval(fetchNowPlaying, 8000);
    };

    const stop = () => {
      if (intervalId === undefined) return;
      clearInterval(intervalId);
      intervalId = undefined;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchNowPlaying();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setIsDocked(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [nowPlaying?.status]);

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
        {nowPlaying.item.images.length > 0 && (
          <NextImage
            src={nowPlaying.item.images[0].url}
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
          {nowPlaying.is_playing ? (
            <span className="now-playing__status--live">
              <span className="now-playing__eq" aria-hidden="true">
                {Array.from({ length: EQUALIZER_BARS }).map((_, index) => (
                  <span key={index} className="now-playing__eq-bar" />
                ))}
              </span>
              On air
            </span>
          ) : (
            <span>Paused</span>
          )}
          {nowPlaying.item.kind === "episode" && <span className="now-playing__type">Podcast</span>}
        </div>
        <h2 className="sr-only">Now playing</h2>
        <h3 className="now-playing__track">{nowPlaying.item.name}</h3>
        <div className="now-playing__credits">
          {nowPlaying.item.kind === "track" && (
            <p className="now-playing__artists">
              {nowPlaying.item.artists.map((artist, index, artists) => (
                <a key={artist.id} href={artist.url} target="_blank" rel="noopener noreferrer">
                  {artist.name}
                  {index < artists.length - 1 && ", "}
                </a>
              ))}
            </p>
          )}
          {nowPlaying.item.kind === "episode" && (
            <>
              <p className="now-playing__artists">
                {nowPlaying.item.show.url ? (
                  <a href={nowPlaying.item.show.url} target="_blank" rel="noopener noreferrer">
                    {nowPlaying.item.show.name}
                  </a>
                ) : (
                  <span>{nowPlaying.item.show.name}</span>
                )}
              </p>
              {nowPlaying.item.show.publisher && (
                <p className="now-playing__show-publisher">{nowPlaying.item.show.publisher}</p>
              )}
            </>
          )}
        </div>
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
          {nowPlaying.item.images.length > 0 && (
            <NextImage
              src={nowPlaying.item.images[0].url}
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
              {nowPlaying.item.kind === "track" && nowPlaying.item.artists.map((artist) => artist.name).join(", ")}
              {nowPlaying.item.kind === "episode" && nowPlaying.item.show.name}
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

"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  children: ReactNode;
};

export default function PodiumReveal({ children }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = container.current;
      if (!root) return;

      const risers = root.querySelectorAll(".track-podium__riser");
      const slots = root.querySelectorAll(".track-podium__slot");
      if (!risers.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(risers, { transformOrigin: "bottom center", scaleY: 0 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: root,
              start: "top 80%",
              once: true,
            },
          })
          .to(risers, {
            scaleY: 1,
            duration: 0.7,
            ease: "power2.out",
            stagger: { each: 0.12, from: "center" },
          })
          .from(
            slots,
            {
              opacity: 0,
              y: 20,
              duration: 0.5,
              ease: "power2.out",
              stagger: { each: 0.1, from: "center" },
            },
            0,
          );
      });
    },
    { scope: container },
  );

  return <div ref={container}>{children}</div>;
}

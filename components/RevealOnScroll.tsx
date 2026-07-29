"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  children: ReactNode;
  itemSelector: string;
  // Changes when the server-rendered children change (e.g. filter params), so the reveal re-runs on the new items
  revealKey?: string;
};

export default function RevealOnScroll({ children, itemSelector, revealKey }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = container.current?.querySelectorAll(itemSelector);
      if (!items?.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(items, {
          opacity: 0,
          y: 28,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: container, dependencies: [revealKey], revertOnUpdate: true },
  );

  return <div ref={container}>{children}</div>;
}

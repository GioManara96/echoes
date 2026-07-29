"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, SplitText);

export default function Brand() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create(".brand__title", {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit(self) {
            return gsap
              .timeline()
              .from(self.chars, { yPercent: 120, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.02 })
              .from(".brand__tagline", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.25");
          },
        });
      });
    },
    { scope: container },
  );

  return (
    <header ref={container} className="brand">
      <h1 className="brand__title">Echoes</h1>
      <p className="brand__tagline">A public self-portrait in music</p>
    </header>
  );
}

"use client";

import { useEffect } from "react";

export default function KineticField() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let kinetic = 0;
    let raf = 0;

    const pointer = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${(event.clientX / Math.max(window.innerWidth, 1)) * 100}%`);
      root.style.setProperty("--pointer-y", `${(event.clientY / Math.max(window.innerHeight, 1)) * 100}%`);
    };

    const scroll = () => {
      const now = performance.now();
      const dt = Math.max(now - lastTime, 16);
      const velocity = Math.abs(window.scrollY - lastScroll) / dt;
      kinetic = reduced ? 0 : Math.min(1, velocity / 2.2);
      lastScroll = window.scrollY;
      lastTime = now;
    };

    const tick = () => {
      kinetic *= 0.91;
      if (kinetic < 0.002) kinetic = 0;
      root.style.setProperty("--kinetic", kinetic.toFixed(3));
      window.dispatchEvent(new CustomEvent("aura:kinetic", { detail: kinetic }));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

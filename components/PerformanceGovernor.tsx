"use client";

import { useEffect } from "react";

export type AuraQuality = "high" | "balanced" | "low";

export default function PerformanceGovernor() {
  useEffect(() => {
    let frame = 0;
    let start = performance.now();
    let raf = 0;
    let settled = false;

    const decide = () => {
      if (settled) return;
      settled = true;
      const elapsed = performance.now() - start;
      const fps = elapsed > 0 ? (frame / elapsed) * 1000 : 60;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let quality: AuraQuality = "high";
      if (reduced || fps < 42 || cores <= 2 || memory <= 2) quality = "low";
      else if (fps < 55 || cores <= 4 || memory <= 4) quality = "balanced";

      document.documentElement.dataset.quality = quality;
      document.documentElement.style.setProperty("--runtime-fps", String(Math.round(fps)));
      window.dispatchEvent(new CustomEvent<AuraQuality>("aura:quality", { detail: quality }));
      window.dispatchEvent(new CustomEvent("aura:runtime", {
        detail: { quality, fps: Math.round(fps), cores, memory },
      }));
    };

    const sample = () => {
      frame += 1;
      const elapsed = performance.now() - start;
      if (frame >= 120 || elapsed >= 2400) {
        decide();
        return;
      }
      raf = requestAnimationFrame(sample);
    };

    raf = requestAnimationFrame(sample);
    const fallback = window.setTimeout(decide, 2700);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}

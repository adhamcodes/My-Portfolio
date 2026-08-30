"use client";

import { useEffect } from "react";

export type AuraQuality = "high" | "balanced" | "low";

type NavigatorExtended = Navigator & { deviceMemory?: number };

function median(values: number[]) {
  if (!values.length) return 60;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export default function PerformanceGovernor() {
  useEffect(() => {
    let raf = 0;
    let warmupTimer = 0;
    let fallbackTimer = 0;
    let running = false;
    const deltas: number[] = [];

    const publish = (quality: AuraQuality, fps: number) => {
      const nav = navigator as NavigatorExtended;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = nav.deviceMemory;
      document.documentElement.dataset.quality = quality;
      document.documentElement.style.setProperty("--runtime-fps", String(Math.round(fps)));
      window.dispatchEvent(new CustomEvent<AuraQuality>("aura:quality", { detail: quality }));
      window.dispatchEvent(new CustomEvent("aura:runtime", {
        detail: { quality, fps: Math.round(fps), cores, memory: memory ?? 0 },
      }));
    };

    const choose = (fps: number) => {
      const nav = navigator as NavigatorExtended;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = nav.deviceMemory;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || fps < 41 || cores <= 2 || (memory !== undefined && memory <= 2)) return "low" as const;
      if (fps < 54 || cores <= 4 || (memory !== undefined && memory <= 4)) return "balanced" as const;
      return "high" as const;
    };

    const finish = () => {
      if (!deltas.length) {
        publish("balanced", 60);
        return;
      }
      const clean = deltas.filter((delta) => delta > 4 && delta < 80);
      const frameMs = median(clean.length ? clean : deltas);
      const fps = Math.min(120, Math.max(1, 1000 / frameMs));
      publish(choose(fps), fps);
    };

    const sample = () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      deltas.length = 0;
      let previous = performance.now();
      let frames = 0;
      const tick = (now: number) => {
        const delta = now - previous;
        previous = now;
        if (frames > 8) deltas.push(delta);
        frames += 1;
        if (frames >= 110) {
          running = false;
          finish();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    document.documentElement.dataset.quality = "balanced";
    window.dispatchEvent(new CustomEvent<AuraQuality>("aura:quality", { detail: "balanced" }));

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !running) sample();
    };

    warmupTimer = window.setTimeout(sample, 1550);
    fallbackTimer = window.setTimeout(() => {
      if (!running && !deltas.length) publish("balanced", 60);
    }, 4200);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(warmupTimer);
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}

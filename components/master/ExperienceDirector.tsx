"use client";

import { useEffect } from "react";
import type { ChapterId } from "@/core/contracts";
import { isChapterId, normalizeScrollVelocity } from "@/core/experience";

export default function ExperienceDirector() {
  useEffect(() => {
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    let currentChapter: ChapterId = "origin";
    let scrollRaf = 0;
    let settleTimer = 0;
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let smoothedVelocity = 0;

    const publishChapter = (chapter: ChapterId) => {
      if (chapter === currentChapter && root.dataset.chapter === chapter) return;
      currentChapter = chapter;
      root.dataset.chapter = chapter;
      window.dispatchEvent(new CustomEvent<ChapterId>("adham:chapter", { detail: chapter }));
    };

    const resolveChapter = () => {
      const center = window.innerHeight * 0.5;
      let best: { chapter: ChapterId; distance: number } | null = null;

      for (const section of sections) {
        const chapter = section.dataset.chapter;
        if (!isChapterId(chapter)) continue;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < -window.innerHeight * 0.35 || rect.top > window.innerHeight * 1.35) continue;
        const distance = Math.abs(rect.top + rect.height * 0.5 - center);
        if (!best || distance < best.distance) best = { chapter, distance };
      }

      if (best) publishChapter(best.chapter);
    };

    const publishVelocity = (value: number) => {
      const bounded = Math.abs(value) < 0.001 ? 0 : value;
      root.style.setProperty("--adham-scroll-velocity", bounded.toFixed(4));
      window.dispatchEvent(new CustomEvent("adham:motion", {
        detail: { scrollVelocity: bounded },
      }));
    };

    const settleVelocity = () => {
      smoothedVelocity *= 0.5;
      if (Math.abs(smoothedVelocity) < 0.015) {
        smoothedVelocity = 0;
        publishVelocity(0);
        return;
      }
      publishVelocity(smoothedVelocity);
      scrollRaf = requestAnimationFrame(settleVelocity);
    };

    const onScroll = () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const now = performance.now();
        const y = window.scrollY;
        const elapsed = Math.max(8, now - lastTime);
        const instant = normalizeScrollVelocity((y - lastY) / elapsed);
        smoothedVelocity = smoothedVelocity * 0.68 + instant * 0.32;
        lastY = y;
        lastTime = now;
        publishVelocity(smoothedVelocity);
        resolveChapter();
      });

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(settleVelocity);
      }, 90);
    };

    const onResize = () => {
      resolveChapter();
    };

    root.dataset.chapter = currentChapter;
    root.style.setProperty("--adham-scroll-velocity", "0");
    resolveChapter();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      delete root.dataset.chapter;
      root.style.removeProperty("--adham-scroll-velocity");
    };
  }, []);

  return null;
}

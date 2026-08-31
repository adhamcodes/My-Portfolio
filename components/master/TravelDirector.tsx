"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type TravelDetail = {
  phase: "depart" | "arrive";
  world?: string;
};

export default function TravelDirector() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const clear = () => {
      delete root.dataset.worldTravel;
      delete root.dataset.worldTarget;
      if (clearTimer.current) {
        window.clearTimeout(clearTimer.current);
        clearTimer.current = null;
      }
    };

    const onTravel = (event: Event) => {
      const detail = (event as CustomEvent<TravelDetail>).detail;
      if (!detail || detail.phase !== "depart") return;

      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      root.dataset.worldTravel = "depart";
      if (detail.world) root.dataset.worldTarget = detail.world;
    };

    window.addEventListener("adham:travel", onTravel);
    return () => {
      window.removeEventListener("adham:travel", onTravel);
      clear();
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const root = document.documentElement;
    root.dataset.worldTravel = "arrive";
    window.dispatchEvent(new CustomEvent<TravelDetail>("adham:travel", {
      detail: { phase: "arrive", world: root.dataset.worldTarget },
    }));

    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    const reduced = root.dataset.motionMode === "reduced";
    clearTimer.current = window.setTimeout(() => {
      delete root.dataset.worldTravel;
      delete root.dataset.worldTarget;
      clearTimer.current = null;
    }, reduced ? 40 : 620);

    return () => {
      if (clearTimer.current) {
        window.clearTimeout(clearTimer.current);
        clearTimer.current = null;
      }
    };
  }, [pathname]);

  return null;
}

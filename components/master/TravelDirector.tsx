"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type TravelDetail = {
  phase: "depart" | "arrive";
  world?: string;
  href?: string;
};

function focusDestination(href?: string) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    let target: HTMLElement | null = null;

    if (href) {
      try {
        const destination = new URL(href, window.location.origin);
        const hash = destination.hash.slice(1);
        if (hash) {
          const anchor = document.getElementById(hash);
          target = anchor?.querySelector<HTMLElement>("h1, h2, h3") ?? anchor;
        }
      } catch {
        // Fall through to the route heading.
      }
    }

    target ??= document.querySelector<HTMLElement>("main h1");
    if (!target) return;

    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });

    if (!hadTabIndex) {
      target.addEventListener("blur", () => target?.removeAttribute("tabindex"), { once: true });
    }
  }));
}

export default function TravelDirector() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const clearTimer = useRef<number | null>(null);
  const pendingHref = useRef<string | undefined>(undefined);

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
      pendingHref.current = detail.href;
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
    const href = pendingHref.current;
    pendingHref.current = undefined;
    root.dataset.worldTravel = "arrive";
    window.dispatchEvent(new CustomEvent<TravelDetail>("adham:travel", {
      detail: { phase: "arrive", world: root.dataset.worldTarget, href },
    }));
    focusDestination(href);

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

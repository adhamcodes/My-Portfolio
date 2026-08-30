"use client";

import { useEffect } from "react";

export type CoreScene = "origin" | "state" | "work" | "foundry" | "trajectory" | "transmissions" | "machine" | "contact";

const sceneMap: Array<{ selector: string; scene: CoreScene }> = [
  { selector: "#origin", scene: "origin" },
  { selector: "#state", scene: "state" },
  { selector: "#work", scene: "work" },
  { selector: ".current", scene: "foundry" },
  { selector: "#trajectory", scene: "trajectory" },
  { selector: ".transmissions", scene: "transmissions" },
  { selector: "#machine", scene: "machine" },
  { selector: "#contact", scene: "contact" },
];

export default function CoreDirector() {
  useEffect(() => {
    let raf = 0;
    let current: CoreScene = "origin";
    let hudTimer = 0;

    const resolveScene = () => {
      raf = 0;
      const center = window.innerHeight * 0.5;
      let bestScene: CoreScene = current;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const item of sceneMap) {
        const element = document.querySelector<HTMLElement>(item.selector);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -window.innerHeight * 0.25 || rect.top > window.innerHeight * 1.25) continue;
        const distance = Math.abs(rect.top + rect.height * 0.5 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestScene = item.scene;
        }
      }

      if (bestScene !== current) {
        current = bestScene;
        document.documentElement.dataset.coreScene = current;
        window.dispatchEvent(new CustomEvent<CoreScene>("aura:scene", { detail: current }));
        window.dispatchEvent(new CustomEvent("aura:signal", { detail: `SCENE / ${current.toUpperCase()} / LOCKED` }));
      }
    };

    const requestResolve = () => {
      if (!raf) raf = requestAnimationFrame(resolveScene);
    };

    const quietHud = () => {
      document.documentElement.dataset.hud = "quiet";
      window.clearTimeout(hudTimer);
      hudTimer = window.setTimeout(() => {
        document.documentElement.dataset.hud = "active";
      }, 620);
      requestResolve();
    };

    const wakeHud = (event: PointerEvent) => {
      const edge = event.clientY < 130 || event.clientX < 180 || event.clientX > window.innerWidth - 180;
      if (edge || document.documentElement.dataset.hud === "quiet") {
        document.documentElement.dataset.hud = "active";
      }
    };

    document.documentElement.dataset.coreScene = current;
    document.documentElement.dataset.hud = "active";
    resolveScene();
    window.addEventListener("scroll", quietHud, { passive: true });
    window.addEventListener("resize", requestResolve, { passive: true });
    window.addEventListener("pointermove", wakeHud, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hudTimer);
      window.removeEventListener("scroll", quietHud);
      window.removeEventListener("resize", requestResolve);
      window.removeEventListener("pointermove", wakeHud);
      delete document.documentElement.dataset.coreScene;
      delete document.documentElement.dataset.hud;
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

export type CoreScene = "origin" | "state" | "work" | "foundry" | "trajectory" | "transmissions" | "machine" | "contact";

const sceneMap: Array<{ selector: string; scene: CoreScene; label: string }> = [
  { selector: "#origin", scene: "origin", label: "INTRO" },
  { selector: "#state", scene: "state", label: "RIGHT NOW" },
  { selector: "#work", scene: "work", label: "SELECTED WORK" },
  { selector: ".current", scene: "foundry", label: "FOUNDRY180" },
  { selector: "#trajectory", scene: "trajectory", label: "DIRECTION" },
  { selector: ".transmissions", scene: "transmissions", label: "NOTES" },
  { selector: "#machine", scene: "machine", label: "UNDER THE HOOD" },
  { selector: "#contact", scene: "contact", label: "CONTACT" },
];

export default function CoreDirector() {
  useEffect(() => {
    let raf = 0;
    let current: CoreScene = "origin";
    let candidate: CoreScene = current;
    let candidateSince = performance.now();
    let hudTimer = 0;

    const commitScene = (scene: CoreScene) => {
      current = scene;
      const meta = sceneMap.find((item) => item.scene === scene);
      document.documentElement.dataset.coreScene = scene;
      window.dispatchEvent(new CustomEvent<CoreScene>("aura:scene", { detail: scene }));
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: `NOW VIEWING · ${meta?.label || scene.toUpperCase()}` }));
    };

    const resolveScene = () => {
      raf = 0;
      const center = window.innerHeight * .5;
      let bestScene = current;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const item of sceneMap) {
        const element = document.querySelector<HTMLElement>(item.selector);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -window.innerHeight * .3 || rect.top > window.innerHeight * 1.3) continue;
        const distance = Math.abs(rect.top + rect.height * .5 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestScene = item.scene;
        }
      }

      if (bestScene === current) {
        candidate = current;
        candidateSince = performance.now();
        return;
      }

      const now = performance.now();
      if (candidate !== bestScene) {
        candidate = bestScene;
        candidateSince = now;
        return;
      }
      if (now - candidateSince >= 72) commitScene(bestScene);
    };

    const requestResolve = () => {
      if (!raf) raf = requestAnimationFrame(resolveScene);
    };

    const quietHud = () => {
      document.documentElement.dataset.hud = "quiet";
      window.clearTimeout(hudTimer);
      hudTimer = window.setTimeout(() => {
        document.documentElement.dataset.hud = "active";
      }, 760);
      requestResolve();
    };

    const wakeHud = (event: PointerEvent) => {
      const edge = event.clientY < 120 || event.clientX < 150 || event.clientX > window.innerWidth - 150;
      if (edge) document.documentElement.dataset.hud = "active";
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

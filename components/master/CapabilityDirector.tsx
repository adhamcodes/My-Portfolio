"use client";

import { useEffect } from "react";
import type { CapabilityDecision, CapabilityInput } from "@/core/capability";
import { lowerRenderTier, resolveCapability } from "@/core/capability";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function median(values: number[]) {
  if (!values.length) return 60;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

export default function CapabilityDirector() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = navigator as NavigatorWithMemory;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");

    let raf = 0;
    let sampleTimer = 0;
    let current: CapabilityDecision | null = null;
    let baseInput: CapabilityInput = {
      webgl: supportsWebGL(),
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: nav.deviceMemory,
      saveData: Boolean(nav.connection?.saveData),
      reducedMotion: reducedQuery.matches,
      coarsePointer: coarseQuery.matches,
    };

    const publish = (decision: CapabilityDecision) => {
      current = decision;
      root.dataset.renderTier = decision.renderTier;
      root.dataset.motionMode = decision.motionMode;
      root.dataset.inputMode = decision.inputMode;
      window.dispatchEvent(new CustomEvent<CapabilityDecision>("adham:capability", { detail: decision }));
    };

    const publishVisibility = () => {
      const visible = document.visibilityState === "visible";
      root.dataset.visibility = visible ? "visible" : "hidden";
      window.dispatchEvent(new CustomEvent("adham:visibility", { detail: { visible } }));
    };

    const resolveAndPublish = (input: CapabilityInput, neverUpgrade = false) => {
      const next = resolveCapability(input);
      if (neverUpgrade && current) {
        next.renderTier = lowerRenderTier(current.renderTier, next.renderTier);
      }
      publish(next);
    };

    resolveAndPublish(baseInput);
    publishVisibility();

    const handleMotionPreference = () => {
      baseInput = { ...baseInput, reducedMotion: reducedQuery.matches };
      resolveAndPublish(baseInput, true);
    };

    const handlePointerPreference = () => {
      baseInput = { ...baseInput, coarsePointer: coarseQuery.matches };
      resolveAndPublish(baseInput, true);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!current) return;
      const inputMode = event.pointerType === "touch" ? "touch" : "pointer";
      if (current.inputMode !== inputMode) publish({ ...current, inputMode });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!current || event.metaKey || event.ctrlKey || event.altKey) return;
      if (current.inputMode !== "keyboard") publish({ ...current, inputMode: "keyboard" });
    };

    const scheduleFrameSample = (delay: number) => {
      window.clearTimeout(sampleTimer);
      sampleTimer = window.setTimeout(sampleFramePacing, delay);
    };

    const sampleFramePacing = () => {
      if (document.visibilityState !== "visible" || !baseInput.webgl || current?.renderTier === "static-low") {
        if (current?.renderTier !== "static-low") scheduleFrameSample(5000);
        return;
      }

      const deltas: number[] = [];
      let previous = performance.now();
      let frames = 0;

      const tick = (now: number) => {
        const delta = now - previous;
        previous = now;
        if (frames > 8 && delta > 4 && delta < 100) deltas.push(delta);
        frames += 1;

        if (frames < 72) {
          raf = requestAnimationFrame(tick);
          return;
        }

        const frameMs = median(deltas);
        const measuredFps = Math.max(1, Math.min(120, 1000 / frameMs));
        resolveAndPublish({ ...baseInput, measuredFps }, true);
        if (current?.renderTier !== "static-low") scheduleFrameSample(18000);
      };

      raf = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      publishVisibility();
      if (document.visibilityState === "visible" && current?.renderTier !== "static-low") {
        scheduleFrameSample(1200);
      } else {
        cancelAnimationFrame(raf);
        window.clearTimeout(sampleTimer);
      }
    };

    scheduleFrameSample(900);
    reducedQuery.addEventListener("change", handleMotionPreference);
    coarseQuery.addEventListener("change", handlePointerPreference);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(sampleTimer);
      reducedQuery.removeEventListener("change", handleMotionPreference);
      coarseQuery.removeEventListener("change", handlePointerPreference);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      delete root.dataset.renderTier;
      delete root.dataset.motionMode;
      delete root.dataset.inputMode;
      delete root.dataset.visibility;
    };
  }, []);

  return null;
}

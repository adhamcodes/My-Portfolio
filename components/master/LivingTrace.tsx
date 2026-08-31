"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MotionMode, RenderTier } from "@/core/contracts";
import type { CapabilityDecision } from "@/core/capability";

const LivingTraceCanvas = dynamic(() => import("./LivingTraceCanvas"), { ssr: false });

type CapabilityView = {
  renderTier: RenderTier;
  motionMode: MotionMode;
};

function StaticTrace() {
  return (
    <svg className="living-trace-static" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path className="trace-static-main" d="M-70 555 C120 515 168 312 330 347 C493 383 502 210 690 286 C854 352 925 215 1270 304" />
      <path className="trace-static-work" d="M546 296 C682 343 742 470 1030 536" />
      <path className="trace-static-growth" d="M293 351 C316 239 396 145 520 90" />
      <path className="trace-static-growth" d="M403 327 C470 409 500 527 626 641" />
      <path className="trace-static-growth" d="M703 290 C815 238 879 125 1010 70" />
    </svg>
  );
}

export default function LivingTrace() {
  const [capability, setCapability] = useState<CapabilityView | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const read = (): CapabilityView => ({
      renderTier: (root.dataset.renderTier as RenderTier | undefined) ?? "reduced",
      motionMode: (root.dataset.motionMode as MotionMode | undefined) ?? "full",
    });

    setCapability(read());

    const onCapability = (event: Event) => {
      const detail = (event as CustomEvent<CapabilityDecision>).detail;
      setCapability({ renderTier: detail.renderTier, motionMode: detail.motionMode });
    };

    window.addEventListener("adham:capability", onCapability);
    return () => window.removeEventListener("adham:capability", onCapability);
  }, []);

  return (
    <div className="living-trace" data-ready={ready ? "true" : "false"} aria-hidden="true">
      <StaticTrace />
      {capability && capability.renderTier !== "static-low" && (
        <LivingTraceCanvas
          renderTier={capability.renderTier}
          motionMode={capability.motionMode}
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}

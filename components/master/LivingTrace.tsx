"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { MotionMode, PublicLivingState, RenderTier } from "@/core/contracts";
import type { CapabilityDecision } from "@/core/capability";
import { createCurrentLivingState } from "@/content/living-state";

const LivingTraceCanvas = dynamic(() => import("./LivingTraceCanvas"), { ssr: false });

type CapabilityView = {
  renderTier: RenderTier;
  motionMode: MotionMode;
};

type TraceBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

class TraceBoundary extends Component<TraceBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function StaticTrace() {
  return (
    <svg className="living-trace-static" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="trace-static-knot">
        <path d="M650 470 C560 410 568 298 665 264 C765 229 860 302 829 390 C800 474 683 486 632 414 C591 356 630 288 712 296 C800 305 836 394 785 457 C748 503 688 497 650 470" />
        <path d="M615 432 C555 355 608 246 706 248 C808 251 859 346 813 428 C768 506 657 500 610 420 C574 357 613 298 687 286 C770 273 830 339 815 409" />
        <path d="M626 451 C584 376 624 292 710 276 C792 261 857 333 838 411 C819 489 714 515 649 455 C597 408 603 332 661 300" />
      </g>
      <path className="trace-static-tail" d="M815 409 C930 426 1025 402 1260 350" />
    </svg>
  );
}

function activityEnergy(state: PublicLivingState) {
  const times = state.events
    .filter((event) => event.domain === "code")
    .map((event) => new Date(event.occurredAt).getTime())
    .filter(Number.isFinite);

  if (times.length === 0) return null;
  const newest = Math.max(...times);
  const ageHours = Math.max(0, (Date.now() - newest) / 3_600_000);
  if (ageHours <= 36) return "energized";
  if (ageHours <= 24 * 7) return "active";
  return "quiet";
}

function isLivingState(value: unknown): value is PublicLivingState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicLivingState>;
  return Array.isArray(candidate.focus)
    && Array.isArray(candidate.growth)
    && Array.isArray(candidate.work)
    && Array.isArray(candidate.events);
}

export default function LivingTrace() {
  const [capability, setCapability] = useState<CapabilityView | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [livingState, setLivingState] = useState<PublicLivingState>(() => createCurrentLivingState(new Date().toISOString()));

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

  useEffect(() => {
    const root = document.documentElement;
    const controller = new AbortController();

    const sync = async () => {
      try {
        const response = await fetch("/api/living-state", { signal: controller.signal });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (!isLivingState(payload)) return;

        setLivingState(payload);
        const energy = activityEnergy(payload);
        if (energy) root.dataset.activityEnergy = energy;
        else delete root.dataset.activityEnergy;
        window.dispatchEvent(new CustomEvent("adham:living-state", { detail: payload }));
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          delete root.dataset.activityEnergy;
        }
      }
    };

    void sync();
    return () => {
      controller.abort();
      delete root.dataset.activityEnergy;
    };
  }, []);

  return (
    <div
      className="living-trace"
      data-ready={ready ? "true" : "false"}
      data-failed={failed ? "true" : "false"}
      aria-hidden="true"
    >
      <StaticTrace />
      {capability && capability.renderTier !== "static-low" && !failed && (
        <TraceBoundary
          onFailure={() => {
            setFailed(true);
            setReady(false);
          }}
        >
          <LivingTraceCanvas
            renderTier={capability.renderTier}
            motionMode={capability.motionMode}
            livingState={livingState}
            onReady={() => setReady(true)}
          />
        </TraceBoundary>
      )}
    </div>
  );
}

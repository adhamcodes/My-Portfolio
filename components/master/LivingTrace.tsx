"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { MotionMode, PublicLivingState, RenderTier } from "@/core/contracts";
import type { CapabilityDecision } from "@/core/capability";
import { createCurrentLivingState } from "@/content/living-state";

const LivingWorldCanvas = dynamic(() => import("./LivingWorldCanvasV4"), { ssr: false });

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
    <svg className="living-trace-static living-monument-static" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="monument-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262329" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="monument-seam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8cbd8" stopOpacity="0" />
          <stop offset=".42" stopColor="#e8cbd8" stopOpacity=".72" />
          <stop offset="1" stopColor="#91bbc2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="monument-static-mass monument-static-left">
        <path d="M596 84 L448 106 L404 180 L468 228 L388 290 L455 354 L382 430 L458 486 L420 578 L585 610 L617 526 L572 458 L622 378 L575 304 L624 234 Z" />
        <path d="M457 122 L345 166 L390 229 L310 292 L392 345 L318 433 L424 478 L381 552 L498 582" />
      </g>
      <g className="monument-static-mass monument-static-right">
        <path d="M638 72 L789 104 L846 174 L790 238 L872 286 L812 358 L886 428 L810 486 L852 566 L681 616 L649 530 L695 452 L646 384 L702 303 L651 226 Z" />
        <path d="M783 116 L904 164 L858 226 L940 291 L860 350 L930 424 L820 480 L866 548 L744 590" />
      </g>
      <path className="monument-static-seam" d="M624 72 L610 166 L632 230 L616 304 L638 382 L620 456 L650 532 L634 626" />
      <g className="monument-static-veil">
        <rect x="740" y="148" width="122" height="68" rx="3" />
        <rect x="866" y="256" width="96" height="54" rx="3" />
        <rect x="720" y="488" width="142" height="74" rx="3" />
      </g>
      <g className="monument-static-map">
        <path d="M520 178 H1015" />
        <path d="M520 266 H1015" />
        <path d="M520 354 H1015" />
        <path d="M520 442 H1015" />
        <path d="M520 530 H1015" />
        <circle cx="520" cy="178" r="5" />
        <circle cx="520" cy="266" r="5" />
        <circle cx="520" cy="354" r="5" />
        <circle cx="520" cy="442" r="5" />
        <circle cx="520" cy="530" r="5" />
      </g>
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
          <LivingWorldCanvas
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

import type { InputMode, MotionMode, RenderTier } from "./contracts";

export type CapabilityInput = {
  webgl: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
  measuredFps?: number;
  saveData: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
};

export type CapabilityDecision = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  inputMode: InputMode;
};

function renderRank(tier: RenderTier) {
  if (tier === "full") return 2;
  if (tier === "reduced") return 1;
  return 0;
}

export function lowerRenderTier(a: RenderTier, b: RenderTier): RenderTier {
  return renderRank(a) <= renderRank(b) ? a : b;
}

export function chooseRenderTier(input: CapabilityInput): RenderTier {
  if (!input.webgl) return "static-low";

  const cores = input.hardwareConcurrency || 4;
  const memory = input.deviceMemory;
  const fps = input.measuredFps;

  if (
    cores <= 2 ||
    (memory !== undefined && memory <= 2) ||
    (fps !== undefined && fps < 42)
  ) {
    return "static-low";
  }

  if (
    input.saveData ||
    cores <= 4 ||
    (memory !== undefined && memory <= 4) ||
    (fps !== undefined && fps < 55)
  ) {
    return "reduced";
  }

  return "full";
}

export function resolveCapability(input: CapabilityInput): CapabilityDecision {
  return {
    renderTier: chooseRenderTier(input),
    motionMode: input.reducedMotion ? "reduced" : "full",
    inputMode: input.coarsePointer ? "touch" : "pointer",
  };
}

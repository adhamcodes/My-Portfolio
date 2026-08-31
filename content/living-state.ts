import type { GrowthTrack, PublicLivingState } from "@/core/contracts";
import { allPublicWork, growthTracks } from "./master";

const growth: GrowthTrack[] = growthTracks.map((track) => ({
  id: track.id,
  journeyId:
    track.id === "foundry180"
      ? "software-engineering"
      : track.id === "ai-ml"
        ? "ai-ml-engineering"
        : "automation-engineering",
  label: track.label,
  status: track.status,
  ...(track.id === "foundry180" ? { completedUnits: 0, totalUnits: 180 } : {}),
}));

/**
 * Current public truth used by Master 2.0 before external event sources are connected.
 * Nothing here implies learning progress that has not actually happened.
 * Undated archive material lives in work state; dated events remain empty until verified.
 */
export function createCurrentLivingState(now: string): PublicLivingState {
  return {
    schemaVersion: 2,
    generatedAt: now,
    focus: [
      {
        id: "software-engineering-foundations",
        label: "Software engineering foundations",
        weight: "primary",
      },
    ],
    growth,
    work: allPublicWork,
    events: [],
  };
}

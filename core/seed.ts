import type { ExperienceState, PublicLivingState } from "./contracts";

/**
 * Safe zero-state constructors for Master 2.0.
 *
 * They intentionally contain no invented progress. Real public state will be
 * projected from verified sources or explicit human input later in Foundation/Growth work.
 */
export function createEmptyLivingState(now: string): PublicLivingState {
  return {
    schemaVersion: 1,
    generatedAt: now,
    focus: [],
    growth: [],
    work: [],
    history: [],
  };
}

export const DEFAULT_EXPERIENCE_STATE: ExperienceState = {
  chapter: "origin",
  indexOpen: false,
  activeWorld: null,
  inputMode: "pointer",
  renderTier: "reduced",
  motionMode: "full",
  soundMode: "off",
  scrollVelocity: 0,
};

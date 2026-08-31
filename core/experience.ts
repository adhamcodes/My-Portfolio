import type { ChapterId } from "./contracts";

export const CHAPTER_IDS: readonly ChapterId[] = [
  "origin",
  "human",
  "work",
  "growth",
  "history",
  "understanding",
  "present",
] as const;

export function isChapterId(value: string | undefined): value is ChapterId {
  return Boolean(value && CHAPTER_IDS.includes(value as ChapterId));
}

/**
 * Converts raw scroll speed into a bounded directional signal for rendering.
 * Controls remain native and immediate; only the world receives inertia later.
 */
export function normalizeScrollVelocity(pixelsPerMillisecond: number) {
  const normalized = pixelsPerMillisecond / 2;
  return Math.max(-1, Math.min(1, normalized));
}

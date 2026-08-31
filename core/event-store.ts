import type {
  GrowthTrack,
  LivingEvent,
  PublicLivingState,
  WorkEntry,
} from "./contracts";

/**
 * Event IDs are idempotency keys. Duplicate rows from retries/imports collapse here
 * before they can affect any public projection.
 */
export function normalizeLivingEvents(events: LivingEvent[]): LivingEvent[] {
  const byId = new Map<string, LivingEvent>();
  for (const event of events) byId.set(event.id, event);
  return [...byId.values()].sort((a, b) => {
    const time = a.occurredAt.localeCompare(b.occurredAt);
    return time === 0 ? a.id.localeCompare(b.id) : time;
  });
}

function applyGrowthEvent(track: GrowthTrack, event: Extract<LivingEvent, { domain: "growth" }>): GrowthTrack {
  if (track.id !== event.trackId) return track;

  switch (event.type) {
    case "track_started":
      return {
        ...track,
        status: track.status === "completed" ? "completed" : "active",
        startedAt: track.startedAt ?? event.occurredAt,
      };
    case "unit_completed":
      return {
        ...track,
        ...(event.progress
          ? {
              completedUnits: Math.max(0, event.progress.completedUnits),
              ...(event.progress.totalUnits !== undefined ? { totalUnits: event.progress.totalUnits } : {}),
              ...(event.progress.currentUnit !== undefined ? { currentUnit: event.progress.currentUnit } : {}),
            }
          : {}),
      };
    case "track_paused":
      return track.status === "completed" ? track : { ...track, status: "paused" };
    case "track_resumed":
      return track.status === "completed" ? track : { ...track, status: "active" };
    case "track_completed":
      return {
        ...track,
        status: "completed",
        completedAt: track.completedAt ?? event.occurredAt,
        ...(event.progress
          ? {
              completedUnits: Math.max(0, event.progress.completedUnits),
              ...(event.progress.totalUnits !== undefined ? { totalUnits: event.progress.totalUnits } : {}),
            }
          : {}),
      };
    default:
      return track;
  }
}

function applyWorkEvent(work: WorkEntry, event: Extract<LivingEvent, { domain: "work" }>): WorkEntry {
  if (work.id !== event.workId) return work;

  switch (event.type) {
    case "project_started":
      return { ...work, maturity: work.maturity === "archived" ? "archived" : "active" };
    case "project_resumed":
      return { ...work, maturity: work.maturity === "archived" ? "archived" : "active" };
    case "release_shipped":
      return { ...work, maturity: work.maturity === "archived" ? "archived" : "maintained" };
    case "project_completed":
      return { ...work, maturity: "completed" };
    case "project_archived":
      return { ...work, maturity: "archived", featured: false };
    default:
      return work;
  }
}

/**
 * Projects factual events onto a clean public seed state.
 *
 * The seed should represent curated baseline truth before event-derived lifecycle
 * changes. Subjective focus is deliberately not inferred from career events here.
 */
export function projectLivingEvents(
  seed: PublicLivingState,
  events: LivingEvent[],
  generatedAt: string,
): PublicLivingState {
  const normalized = normalizeLivingEvents(events);
  let growth = seed.growth.map((track) => ({ ...track }));
  let work = seed.work.map((entry) => ({ ...entry }));

  for (const event of normalized) {
    if (event.domain === "growth") {
      growth = growth.map((track) => applyGrowthEvent(track, event));
    } else if (event.domain === "work") {
      work = work.map((entry) => applyWorkEvent(entry, event));
    }
  }

  return {
    ...seed,
    generatedAt,
    growth,
    work,
    events: normalized,
  };
}

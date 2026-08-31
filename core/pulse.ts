import type {
  LivingEvent,
  PublicLivingState,
  PulseDomain,
  PulseSignal,
  PulseSnapshot,
} from "./contracts";

function intensity(event: LivingEvent) {
  if (event.domain === "code") {
    switch (event.type) {
      case "commit_recorded": return 0.16;
      case "pull_request_opened": return 0.24;
      case "pull_request_merged": return 0.36;
      case "tag_published": return 0.48;
    }
  }

  if (event.domain === "growth") {
    switch (event.type) {
      case "session_recorded": return 0.2;
      case "unit_completed": return 0.38;
      case "assessment_attempted": return 0.28;
      case "assessment_passed": return 0.5;
      case "milestone_reached": return 0.72;
      case "track_started": return 0.76;
      case "track_paused": return 0.32;
      case "track_resumed": return 0.44;
      case "track_completed": return 0.9;
    }
  }

  if (event.domain === "work") {
    switch (event.type) {
      case "project_started": return 0.62;
      case "milestone_reached": return 0.72;
      case "release_shipped": return 0.84;
      case "project_paused": return 0.3;
      case "project_resumed": return 0.42;
      case "project_completed": return 0.88;
      case "project_archived": return 0.5;
    }
  }

  switch (event.type) {
    case "direction_changed": return 0.78;
    case "focus_changed": return 0.66;
    case "chapter_started": return 0.72;
    case "chapter_completed": return 0.84;
    case "milestone": return 0.9;
  }
}

function pulseDomain(event: LivingEvent): PulseDomain {
  if (event.domain === "growth") return "learning";
  return event.domain;
}

function sourceId(event: LivingEvent) {
  if (event.domain === "growth") return event.trackId;
  if (event.domain === "work") return event.workId;
  if (event.domain === "code") return event.repositoryId;
  return undefined;
}

function toSignal(event: LivingEvent): PulseSignal {
  return {
    id: event.id,
    domain: pulseDomain(event),
    occurredAt: event.occurredAt,
    intensity: intensity(event),
    ...(event.label ? { label: event.label } : {}),
    ...(sourceId(event) ? { sourceId: sourceId(event) } : {}),
  };
}

type PulseWindow = {
  from?: string;
  to?: string;
};

/**
 * Pulse is an artistic time projection of typed events. `intensity` only controls
 * visual emphasis inside the Pulse; it must never be rendered as skill, mastery,
 * productivity, or a comparable score.
 */
export function buildPulseSnapshot(state: PublicLivingState, window: PulseWindow = {}): PulseSnapshot {
  const signals = state.events
    .filter((event) => !window.from || event.occurredAt >= window.from)
    .filter((event) => !window.to || event.occurredAt <= window.to)
    .map(toSignal)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const counts: Record<PulseDomain, number> = {
    learning: 0,
    code: 0,
    work: 0,
    career: 0,
  };

  for (const signal of signals) counts[signal.domain] += 1;

  return {
    generatedAt: state.generatedAt,
    signals,
    counts,
  };
}

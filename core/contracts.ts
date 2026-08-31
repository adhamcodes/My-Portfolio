/**
 * ADHAM — Master 2.0 core contracts.
 *
 * This module is intentionally framework-agnostic. It defines the language shared
 * by content, long-lived state, runtime experience, and rendering without importing
 * React, browser APIs, CSS, or rendering libraries.
 *
 * Architecture law:
 * CONTENT / EVENTS -> STATE -> EXPERIENCE -> WORLD
 */

export type EntityId = string;
export type IsoDateTime = string;
export type IsoDate = string;

// -----------------------------------------------------------------------------
// CONTENT
// -----------------------------------------------------------------------------

export type PublicContact = {
  label: string;
  href: string;
  kind: "email" | "github" | "external";
};

export type EditorialNote = {
  id: EntityId;
  title?: string;
  body: string;
  writtenAt?: IsoDate;
};

export type WorkMaturity = "forming" | "active" | "maintained" | "completed" | "archived";

export type WorkEntry = {
  id: EntityId;
  name: string;
  summary: string;
  centralIdea: string;
  maturity: WorkMaturity;
  liveUrl?: string;
  sourceUrl?: string;
  featured: boolean;
};

// -----------------------------------------------------------------------------
// STATE — long-lived truth, independent of presentation
// -----------------------------------------------------------------------------

export type FocusWeight = "primary" | "secondary";

export type FocusState = {
  id: EntityId;
  label: string;
  weight: FocusWeight;
  since?: IsoDateTime;
};

export type GrowthStatus = "not_started" | "active" | "paused" | "completed" | "archived";

export type GrowthTrack = {
  id: EntityId;
  journeyId: EntityId;
  label: string;
  status: GrowthStatus;
  currentUnit?: string;
  completedUnits?: number;
  totalUnits?: number;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
};

export type GrowthEventType =
  | "track_started"
  | "unit_completed"
  | "assessment_attempted"
  | "assessment_passed"
  | "session_recorded"
  | "milestone_reached"
  | "track_paused"
  | "track_resumed"
  | "track_completed";

export type GrowthEvent = {
  id: EntityId;
  trackId: EntityId;
  type: GrowthEventType;
  occurredAt: IsoDateTime;
  /** Human-meaningful public label. Never generated from vanity telemetry. */
  label?: string;
  /** Optional numeric value with explicit semantics, e.g. duration minutes. */
  value?: number;
  unit?: string;
  source: "foundry" | "academy" | "manual" | "import";
};

export type WorkEventType =
  | "project_started"
  | "milestone_reached"
  | "release_shipped"
  | "project_paused"
  | "project_resumed"
  | "project_completed"
  | "project_archived";

export type WorkEvent = {
  id: EntityId;
  workId: EntityId;
  type: WorkEventType;
  occurredAt: IsoDateTime;
  label?: string;
  source: "repository" | "deployment" | "manual" | "import";
};

export type CareerEventType =
  | "direction_changed"
  | "focus_changed"
  | "chapter_started"
  | "chapter_completed"
  | "milestone";

export type CareerEvent = {
  id: EntityId;
  type: CareerEventType;
  occurredAt: IsoDateTime;
  label: string;
  source: "manual" | "import";
};

export type LivingEvent =
  | ({ domain: "growth" } & GrowthEvent)
  | ({ domain: "work" } & WorkEvent)
  | ({ domain: "career" } & CareerEvent);

export type PublicLivingState = {
  schemaVersion: number;
  generatedAt: IsoDateTime;
  focus: FocusState[];
  growth: GrowthTrack[];
  work: WorkEntry[];
  history: LivingEvent[];
};

// -----------------------------------------------------------------------------
// EXPERIENCE — ephemeral runtime state, never confused with life history
// -----------------------------------------------------------------------------

export type ChapterId =
  | "origin"
  | "human"
  | "work"
  | "growth"
  | "history"
  | "understanding"
  | "present";

export type InputMode = "pointer" | "touch" | "keyboard";
export type RenderTier = "full" | "reduced" | "static-low";
export type MotionMode = "full" | "reduced";
export type SoundMode = "off" | "on";

export type ExperienceState = {
  chapter: ChapterId;
  indexOpen: boolean;
  activeWorld: EntityId | null;
  inputMode: InputMode;
  renderTier: RenderTier;
  motionMode: MotionMode;
  soundMode: SoundMode;
  /** Normalized instantaneous input signal. Never persisted as identity history. */
  scrollVelocity: number;
};

// -----------------------------------------------------------------------------
// RENDERING — a projection contract, not a source of truth
// -----------------------------------------------------------------------------

export type TraceEnergy = "dormant" | "quiet" | "active" | "energized";
export type TraceMaturity = "forming" | "stable" | "historical";

export type TraceRegion = {
  id: EntityId;
  domain: "self" | "work" | "growth" | "history";
  sourceId: EntityId;
  energy: TraceEnergy;
  maturity: TraceMaturity;
  emphasis: number;
};

export type WorldProjection = {
  generatedAt: IsoDateTime;
  chapter: ChapterId;
  regions: TraceRegion[];
};

// -----------------------------------------------------------------------------
// NON-NEGOTIABLE BOUNDARIES
// -----------------------------------------------------------------------------

/**
 * 1. Rendering never writes progress or career truth.
 * 2. Experience state is disposable and must not masquerade as identity history.
 * 3. Objective integrations may create factual events; subjective meaning remains human-controlled.
 * 4. Public state is a curated projection. Private learning detail does not leak by default.
 * 5. Curriculum-unit progress and calendar time are separate concepts.
 * 6. Completion changes state; it never deletes the historical record.
 */

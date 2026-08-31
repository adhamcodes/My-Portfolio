import type {
  ChapterId,
  GrowthTrack,
  PublicLivingState,
  TraceEnergy,
  TraceMaturity,
  TraceRegion,
  WorkEntry,
  WorldProjection,
} from "./contracts";

function projectWork(work: WorkEntry): Pick<TraceRegion, "energy" | "maturity" | "emphasis"> {
  switch (work.maturity) {
    case "active":
      return { energy: "active", maturity: "forming", emphasis: work.featured ? 0.9 : 0.58 };
    case "maintained":
      return { energy: "quiet", maturity: "stable", emphasis: work.featured ? 0.78 : 0.5 };
    case "completed":
      return { energy: "quiet", maturity: "historical", emphasis: work.featured ? 0.65 : 0.42 };
    case "archived":
      return { energy: "dormant", maturity: "historical", emphasis: 0.28 };
    default:
      return { energy: "quiet", maturity: "forming", emphasis: work.featured ? 0.66 : 0.4 };
  }
}

function projectGrowth(track: GrowthTrack): Pick<TraceRegion, "energy" | "maturity" | "emphasis"> {
  switch (track.status) {
    case "active":
      return { energy: "active", maturity: "forming", emphasis: 0.78 };
    case "paused":
      return { energy: "quiet", maturity: "forming", emphasis: 0.46 };
    case "completed":
      return { energy: "quiet", maturity: "historical", emphasis: 0.62 };
    case "archived":
      return { energy: "dormant", maturity: "historical", emphasis: 0.3 };
    default:
      return { energy: "dormant", maturity: "forming", emphasis: 0.2 };
  }
}

export function createWorldProjection(state: PublicLivingState, chapter: ChapterId): WorldProjection {
  const regions: TraceRegion[] = [];

  for (const focus of state.focus) {
    regions.push({
      id: `self:${focus.id}`,
      domain: "self",
      sourceId: focus.id,
      energy: focus.weight === "primary" ? "active" : "quiet",
      maturity: "forming",
      emphasis: focus.weight === "primary" ? 1 : 0.68,
    });
  }

  for (const work of state.work) {
    const visual = projectWork(work);
    regions.push({
      id: `work:${work.id}`,
      domain: "work",
      sourceId: work.id,
      ...visual,
    });
  }

  for (const track of state.growth) {
    const visual = projectGrowth(track);
    regions.push({
      id: `growth:${track.id}`,
      domain: "growth",
      sourceId: track.id,
      ...visual,
    });
  }

  for (const event of state.history) {
    regions.push({
      id: `history:${event.domain}:${event.id}`,
      domain: "history",
      sourceId: event.id,
      energy: "quiet" as TraceEnergy,
      maturity: "historical" as TraceMaturity,
      emphasis: 0.42,
    });
  }

  return {
    generatedAt: state.generatedAt,
    chapter,
    regions,
  };
}

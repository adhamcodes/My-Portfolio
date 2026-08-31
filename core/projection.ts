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
    case "active": return { energy: "active", maturity: "forming", emphasis: work.featured ? 0.9 : 0.58 };
    case "maintained": return { energy: "quiet", maturity: "stable", emphasis: work.featured ? 0.78 : 0.5 };
    case "completed": return { energy: "quiet", maturity: "historical", emphasis: work.featured ? 0.65 : 0.42 };
    case "archived": return { energy: "dormant", maturity: "historical", emphasis: 0.34 };
    default: return { energy: "quiet", maturity: "forming", emphasis: work.featured ? 0.66 : 0.4 };
  }
}

function projectGrowth(track: GrowthTrack): Pick<TraceRegion, "energy" | "maturity" | "emphasis"> {
  switch (track.status) {
    case "active": return { energy: "active", maturity: "forming", emphasis: 0.78 };
    case "paused": return { energy: "quiet", maturity: "forming", emphasis: 0.46 };
    case "completed": return { energy: "quiet", maturity: "historical", emphasis: 0.62 };
    case "archived": return { energy: "dormant", maturity: "historical", emphasis: 0.3 };
    default: return { energy: "dormant", maturity: "forming", emphasis: 0.2 };
  }
}

function chapterWeight(chapter: ChapterId, domain: TraceRegion["domain"]) {
  if (chapter === "work") return domain === "work" ? 1.7 : domain === "self" ? 0.48 : 0.48;
  if (chapter === "growth") return domain === "growth" ? 3.1 : domain === "self" ? 0.44 : 0.44;
  if (chapter === "history") return domain === "history" ? 2.8 : domain === "self" ? 0.36 : 0.42;
  if (chapter === "human") return domain === "self" ? 1.25 : 0.62;
  if (chapter === "present") return domain === "self" ? 0.92 : 0.76;
  return domain === "self" ? 1.12 : 0.7;
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
      id: `${work.maturity === "archived" ? "history" : "work"}:${work.id}`,
      domain: work.maturity === "archived" ? "history" : "work",
      sourceId: work.id,
      ...visual,
    });
  }

  for (const track of state.growth) {
    regions.push({ id: `growth:${track.id}`, domain: "growth", sourceId: track.id, ...projectGrowth(track) });
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
    regions: regions.map((region) => ({
      ...region,
      emphasis: Math.min(1.35, Math.max(0.08, region.emphasis * chapterWeight(chapter, region.domain))),
    })),
  };
}

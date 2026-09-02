import type {
  ActivityVeilDay,
  ActivityVeilLandmark,
  ActivityVeilSnapshot,
  LivingEvent,
  PublicLivingState,
} from "./contracts";

const PUBLIC_GITHUB_DISCLOSURE = "Recent public GitHub events only. Private work and activity outside the provider window are not represented.";

function dateKey(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : value.slice(0, 10);
}

function commitCount(event: Extract<LivingEvent, { domain: "code" }>) {
  if (event.type !== "commit_recorded") return 0;
  const count = event.facts?.commitCount;
  if (count === undefined || !Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
}

/**
 * Maps factual activity into restrained atmospheric energy. The logarithmic curve
 * deliberately prevents high commit volume from dominating the world.
 */
function atmosphere(day: Omit<ActivityVeilDay, "atmosphere">) {
  const routine = Math.log2(1 + day.commitCount) * 0.12;
  const breadth = Math.log2(1 + day.repositories.length) * 0.08;
  const review = day.pullRequestsOpened * 0.04 + day.pullRequestsMerged * 0.09;
  const publication = day.tagsPublished * 0.12;
  return Math.min(0.72, Math.max(0.08, 0.08 + routine + breadth + review + publication));
}

function landmark(event: Extract<LivingEvent, { domain: "code" }>): ActivityVeilLandmark | null {
  if (event.type !== "pull_request_merged" && event.type !== "tag_published") return null;
  return {
    id: event.id,
    occurredAt: event.occurredAt,
    kind: event.type,
    ...(event.repositoryId ? { repositoryId: event.repositoryId } : {}),
    ...(event.label ? { label: event.label } : {}),
  };
}

/**
 * Builds the factual substrate for V4's transparent Activity Veil. This projection
 * describes temporal code rhythm; it does not infer effort, hours, mastery, quality,
 * learning progress, or career progress.
 */
export function buildActivityVeilSnapshot(state: PublicLivingState): ActivityVeilSnapshot {
  const codeEvents = state.events
    .filter((event): event is Extract<LivingEvent, { domain: "code" }> => event.domain === "code")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const grouped = new Map<string, Extract<LivingEvent, { domain: "code" }>[] >();
  for (const event of codeEvents) {
    const key = dateKey(event.occurredAt);
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  const days = Array.from(grouped.entries()).map(([date, events]) => {
    const repositories = Array.from(new Set(events.flatMap((event) => event.repositoryId ? [event.repositoryId] : []))).sort();
    const base: Omit<ActivityVeilDay, "atmosphere"> = {
      date,
      latestAt: events[events.length - 1]?.occurredAt ?? `${date}T00:00:00.000Z`,
      commitCount: events.reduce((sum, event) => sum + commitCount(event), 0),
      pushCount: events.filter((event) => event.type === "commit_recorded").length,
      pullRequestsOpened: events.filter((event) => event.type === "pull_request_opened").length,
      pullRequestsMerged: events.filter((event) => event.type === "pull_request_merged").length,
      tagsPublished: events.filter((event) => event.type === "tag_published").length,
      repositories,
    };
    return { ...base, atmosphere: atmosphere(base) };
  });

  const landmarks = codeEvents.flatMap((event) => {
    const projected = landmark(event);
    return projected ? [projected] : [];
  });

  return {
    generatedAt: state.generatedAt,
    coverage: {
      source: "github-public-events",
      disclosure: PUBLIC_GITHUB_DISCLOSURE,
      complete: false,
    },
    days,
    landmarks,
  };
}

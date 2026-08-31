import type { LivingEvent } from "@/core/contracts";

type GitHubPublicEvent = {
  id?: string;
  type?: string;
  created_at?: string;
  repo?: { name?: string };
  payload?: {
    action?: string;
    ref_type?: string;
    ref?: string | null;
    commits?: Array<{ sha?: string }>;
    pull_request?: { merged?: boolean };
  };
};

const PUBLIC_EVENTS_URL = "https://api.github.com/users/adhamcodes/events/public?per_page=30";

function repositoryLabel(name?: string) {
  if (!name) return undefined;
  const repo = name.split("/").pop();
  return repo ? `Code activity · ${repo}` : undefined;
}

function pushEvents(event: GitHubPublicEvent): LivingEvent[] {
  if (!event.id || !event.created_at) return [];
  const repositoryId = event.repo?.name;
  const commits = event.payload?.commits?.filter((commit) => commit.sha) ?? [];

  if (commits.length === 0) {
    return [{
      domain: "code",
      id: `github:push:${event.id}`,
      type: "commit_recorded",
      occurredAt: event.created_at,
      ...(repositoryId ? { repositoryId } : {}),
      ...(repositoryLabel(repositoryId) ? { label: repositoryLabel(repositoryId) } : {}),
      source: "github",
    }];
  }

  return commits.map((commit, index) => ({
    domain: "code" as const,
    id: `github:commit:${commit.sha ?? `${event.id}:${index}`}`,
    type: "commit_recorded" as const,
    occurredAt: event.created_at as string,
    ...(repositoryId ? { repositoryId } : {}),
    ...(repositoryLabel(repositoryId) ? { label: repositoryLabel(repositoryId) } : {}),
    source: "github" as const,
  }));
}

function pullRequestEvents(event: GitHubPublicEvent): LivingEvent[] {
  if (!event.id || !event.created_at) return [];
  const repositoryId = event.repo?.name;
  const action = event.payload?.action;
  const merged = Boolean(event.payload?.pull_request?.merged);

  if (action !== "opened" && !(action === "closed" && merged)) return [];

  return [{
    domain: "code",
    id: `github:pr:${event.id}`,
    type: action === "opened" ? "pull_request_opened" : "pull_request_merged",
    occurredAt: event.created_at,
    ...(repositoryId ? { repositoryId } : {}),
    ...(repositoryLabel(repositoryId) ? { label: repositoryLabel(repositoryId) } : {}),
    source: "github",
  }];
}

function tagEvents(event: GitHubPublicEvent): LivingEvent[] {
  if (!event.id || !event.created_at || event.payload?.ref_type !== "tag") return [];
  const repositoryId = event.repo?.name;
  return [{
    domain: "code",
    id: `github:tag:${event.id}`,
    type: "tag_published",
    occurredAt: event.created_at,
    ...(repositoryId ? { repositoryId } : {}),
    ...(repositoryLabel(repositoryId) ? { label: repositoryLabel(repositoryId) } : {}),
    source: "github",
  }];
}

function normalize(event: GitHubPublicEvent): LivingEvent[] {
  if (event.type === "PushEvent") return pushEvents(event);
  if (event.type === "PullRequestEvent") return pullRequestEvents(event);
  if (event.type === "CreateEvent") return tagEvents(event);
  return [];
}

/**
 * Public GitHub is enrichment, never canonical identity storage. Failure here must
 * leave the portfolio truthful and usable rather than inventing or retaining stale facts.
 */
export async function getPublicGitHubCodeEvents(): Promise<LivingEvent[]> {
  try {
    const response = await fetch(PUBLIC_EVENTS_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "adham-portfolio-living-state",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) return [];
    const payload = await response.json();
    if (!Array.isArray(payload)) return [];

    const events = (payload as GitHubPublicEvent[])
      .flatMap(normalize)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const seen = new Set<string>();
    return events.filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  } catch {
    return [];
  }
}

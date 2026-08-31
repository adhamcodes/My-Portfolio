import type { LivingEvent, PublicLivingState } from "@/core/contracts";
import { createCurrentLivingState } from "@/content/living-state";
import { getPublicGitHubCodeEvents } from "./github-public";

function dedupe(events: LivingEvent[]) {
  const byId = new Map<string, LivingEvent>();
  for (const event of events) byId.set(event.id, event);
  return Array.from(byId.values()).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

/**
 * Server-side public projection. Canonical authored state remains local and explicit;
 * objective public sources may enrich it with typed events without changing learning truth.
 */
export async function getCurrentPublicLivingState(): Promise<PublicLivingState> {
  const generatedAt = new Date().toISOString();
  const base = createCurrentLivingState(generatedAt);
  const codeEvents = await getPublicGitHubCodeEvents();

  return {
    ...base,
    generatedAt,
    events: dedupe([...base.events, ...codeEvents]),
  };
}

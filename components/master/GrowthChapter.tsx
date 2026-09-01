import ActivityVeil from "@/components/master/ActivityVeil";
import { buildActivityVeilSnapshot } from "@/core/activity-veil";
import type { GrowthTrack } from "@/core/contracts";
import { getCurrentPublicLivingState } from "@/server/living-state";

function trackCopy(id: string) {
  if (id === "foundry180") {
    return {
      eyebrow: "PRIMARY PATH",
      direction: "Software engineering",
      detail: "Foundry is the structured path through software foundations and engineering. Its public record starts with the first verified completed unit—not with a calendar date.",
      horizon: "180 curriculum units",
    };
  }
  if (id === "ai-ml") {
    return {
      eyebrow: "LONG-TERM DIRECTION",
      direction: "AI / ML engineering",
      detail: "A specialization to earn through fundamentals, experiments, and systems that actually exist. Until then it remains a direction, not a claimed identity.",
      horizon: "Evidence will decide its shape",
    };
  }
  return {
    eyebrow: "SUPPORTING CAPABILITY",
    direction: "AI automation",
    detail: "Automation supports the main engineering path. It gains public weight only when real work gives it something worth preserving.",
    horizon: "Secondary by design",
  };
}

function trackState(track: GrowthTrack) {
  if (track.status === "active") return "IN MOTION";
  if (track.status === "paused") return "PAUSED / PRESERVED";
  if (track.status === "completed") return "COMPLETED / HISTORICAL";
  if (track.status === "archived") return "ARCHIVED";
  return "OPEN DIRECTION";
}

export default async function GrowthChapter() {
  const state = await getCurrentPublicLivingState();
  const activity = buildActivityVeilSnapshot(state);

  return (
    <section
      id="growth"
      data-chapter="growth"
      className="master-scene growth-chapter growth-chapter-v3"
      aria-labelledby="growth-title"
    >
      <p className="master-number">03 / GROWTH</p>

      <div className="growth-heading">
        <h2 id="growth-title">
          <span>BECOMING</span>
          <span>HAS DIRECTIONS.</span>
        </h2>
        <p>Learning can begin, pause, resume, finish, and become history. The world changes when evidence exists; emptiness is allowed to stay empty.</p>
      </div>

      <div className="growth-orbit" aria-label="Current learning directions">
        <span className="growth-origin" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        {state.growth.map((track, index) => {
          const copy = trackCopy(track.id);
          const completed = track.completedUnits ?? 0;
          return (
            <article key={track.id} className="growth-direction" data-track={track.id} data-state={track.status}>
              <div className="growth-direction-line" aria-hidden="true">
                <span />
              </div>
              <div className="growth-direction-meta">
                <span>{String(index + 1).padStart(2, "0")} / {copy.eyebrow}</span>
                <strong>{trackState(track)}</strong>
              </div>
              <h3>{copy.direction}</h3>
              <p>{copy.detail}</p>
              <div className="growth-direction-horizon">
                <span>{copy.horizon}</span>
                {completed > 0 && track.totalUnits && (
                  <strong>{completed} / {track.totalUnits} verified units</strong>
                )}
                {track.currentUnit && <strong>Current: {track.currentUnit}</strong>}
              </div>
            </article>
          );
        })}
      </div>

      <ActivityVeil snapshot={activity} />
    </section>
  );
}

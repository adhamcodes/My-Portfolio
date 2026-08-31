import type { CSSProperties } from "react";
import PulseField from "@/components/master/PulseField";
import { buildPulseSnapshot } from "@/core/pulse";
import { getCurrentPublicLivingState } from "@/server/living-state";

function trackCopy(id: string) {
  if (id === "foundry180") {
    return {
      eyebrow: "PRIMARY PATH",
      direction: "Software engineering",
      detail: "Foundry180 is prepared. Personal progress remains at zero until the learning journey actually begins.",
    };
  }
  if (id === "ai-ml") {
    return {
      eyebrow: "DIRECTION",
      direction: "AI / ML engineering",
      detail: "A future specialization to earn through mathematics, models, systems, and shipped work—not a present expertise claim.",
    };
  }
  return {
    eyebrow: "SUPPORTING CAPABILITY",
    direction: "AI automation",
    detail: "Automation, agents, and tooling develop beside stronger software foundations rather than becoming a separate headline identity.",
  };
}

export default async function GrowthChapter() {
  const state = await getCurrentPublicLivingState();
  const pulse = buildPulseSnapshot(state);

  return (
    <section
      id="growth"
      data-chapter="growth"
      className="master-scene growth-chapter"
      aria-labelledby="growth-title"
    >
      <p className="master-number">03 / GROWTH</p>

      <div className="growth-heading">
        <h2 id="growth-title">BECOMING LEAVES A RECORD.</h2>
        <p>Learning is allowed to start at zero, pause, resume, finish, and become history without pretending calendar time equals progress.</p>
      </div>

      <div className="growth-topology" aria-label="Current learning directions">
        <span className="growth-root" aria-hidden="true" />
        {state.growth.map((track, index) => {
          const copy = trackCopy(track.id);
          return (
            <article
              key={track.id}
              className="growth-path"
              data-state={track.status}
              style={{ "--growth-index": index } as CSSProperties}
            >
              <span className="growth-node" aria-hidden="true" />
              <div className="growth-path-meta">
                <span>{copy.eyebrow}</span>
                <strong>{track.status === "not_started" ? "NOT STARTED" : track.status.replace("_", " ").toUpperCase()}</strong>
              </div>
              <h3>{copy.direction}</h3>
              <p>{copy.detail}</p>
              {track.id === "foundry180" && (
                <p className="growth-truth">
                  <span>{track.completedUnits ?? 0}</span>
                  <span>of {track.totalUnits ?? 180} curriculum units completed</span>
                </p>
              )}
            </article>
          );
        })}
      </div>

      <PulseField pulse={pulse} />
    </section>
  );
}

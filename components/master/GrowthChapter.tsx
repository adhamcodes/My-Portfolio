import type { CSSProperties } from "react";
import { buildPulseSnapshot } from "@/core/pulse";
import { createCurrentLivingState } from "@/content/living-state";

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

export default function GrowthChapter() {
  const state = createCurrentLivingState(new Date().toISOString());
  const pulse = buildPulseSnapshot(state);
  const hasPulse = pulse.signals.length > 0;

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

      <div className="pulse-zero" data-has-signals={hasPulse ? "true" : "false"}>
        <div className="pulse-zero-line" aria-hidden="true" />
        <div>
          <p>PULSE</p>
          {hasPulse ? (
            <span>Real learning, code, work, and career events appear here as separate signals over time.</span>
          ) : (
            <span>No public activity events are being projected yet. The field begins when real events exist.</span>
          )}
        </div>
      </div>
    </section>
  );
}

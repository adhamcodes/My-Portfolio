import ActivityVeil from "@/components/master/ActivityVeil";
import { buildActivityVeilSnapshot } from "@/core/activity-veil";
import type { GrowthTrack } from "@/core/contracts";
import { getCurrentPublicLivingState } from "@/server/living-state";

function trackCopy(id: string) {
  if (id === "foundry180") {
    return {
      number: "01",
      role: "THE BEGINNING",
      direction: "Foundry180",
      thesis: "Software engineering foundation",
      detail: "The learning system exists. The personal record does not move until the first unit is actually completed.",
      horizon: "180 curriculum units prepared",
    };
  }
  if (id === "ai-ml") {
    return {
      number: "02",
      role: "THE HORIZON",
      direction: "AI / ML engineering",
      thesis: "Destination, not decoration",
      detail: "A specialization to earn through foundations, experiments, and systems that become real—not a title claimed in advance.",
      horizon: "Its shape will be decided by evidence",
    };
  }
  return {
    number: "03",
    role: "THE LEVERAGE",
    direction: "AI automation",
    thesis: "Capability in support of the path",
    detail: "Automation strengthens the main engineering direction. It gains weight here only when shipped work makes that weight true.",
    horizon: "Supporting by design",
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
      className="master-scene growth-chapter growth-chapter-v4"
      aria-labelledby="growth-title"
    >
      <p className="master-number">03 / GROWTH</p>

      <header className="growth-heading">
        <h2 id="growth-title">
          <span>THE FUTURE</span>
          <span>HAS STRUCTURE.</span>
        </h2>
        <p>Foundry is the beginning. AI / ML is the horizon. Automation is leverage along the way. None of them advances here until the work becomes true.</p>
      </header>

      <div className="growth-construction" aria-label="Current learning directions and verified state">
        <div className="growth-zero-site">
          <p>FOUNDRY180 / PERSONAL RECORD</p>
          <strong aria-hidden="true">0</strong>
          <div>
            <b>0 / 180 verified units</b>
            <span>The structure is ready. The record begins with the first completed unit.</span>
          </div>
        </div>

        <span className="growth-scaffold" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        <ol className="growth-vectors">
          {state.growth.map((track) => {
            const copy = trackCopy(track.id);
            const completed = track.completedUnits ?? 0;
            return (
              <li key={track.id} className="growth-vector" data-track={track.id} data-state={track.status}>
                <article>
                  <header>
                    <span>{copy.number} / {copy.role}</span>
                    <strong>{trackState(track)}</strong>
                  </header>
                  <p className="growth-vector-thesis">{copy.thesis}</p>
                  <h3>{copy.direction}</h3>
                  <p className="growth-vector-detail">{copy.detail}</p>
                  <footer>
                    <span>{copy.horizon}</span>
                    {completed > 0 && track.totalUnits && (
                      <strong>{completed} / {track.totalUnits} verified units</strong>
                    )}
                    {track.currentUnit && <strong>Current: {track.currentUnit}</strong>}
                  </footer>
                </article>
              </li>
            );
          })}
        </ol>
      </div>

      <ActivityVeil snapshot={activity} />
    </section>
  );
}

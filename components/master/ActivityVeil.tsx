import type { CSSProperties } from "react";
import type { ActivityVeilDay, ActivityVeilSnapshot } from "@/core/contracts";

type VeilStyle = CSSProperties & {
  "--veil-x": string;
  "--veil-y": string;
  "--veil-z": string;
  "--veil-tilt": string;
  "--veil-energy": number;
};

const Y_PATTERN = [-7, 8, -13, 3, 12, -4, 7, -10, 1, 14, -5, 6];
const TILT_PATTERN = [-12, 8, -5, 13, -8, 5, -14, 9, -4, 11, -7, 6];

function dayLabel(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function observedSummary(day: ActivityVeilDay) {
  const pieces = [
    `${day.commitCount} public commit${day.commitCount === 1 ? "" : "s"}`,
    `${day.pushCount} push${day.pushCount === 1 ? "" : "es"}`,
    `${day.repositories.length} repositor${day.repositories.length === 1 ? "y" : "ies"}`,
  ];
  if (day.pullRequestsMerged > 0) pieces.push(`${day.pullRequestsMerged} merged pull request${day.pullRequestsMerged === 1 ? "" : "s"}`);
  if (day.tagsPublished > 0) pieces.push(`${day.tagsPublished} published tag${day.tagsPublished === 1 ? "" : "s"}`);
  return pieces.join(", ");
}

function styleFor(day: ActivityVeilDay, index: number, count: number): VeilStyle {
  const sparsePositions: Record<number, number[]> = {
    1: [50],
    2: [34, 66],
    3: [24, 50, 76],
  };
  const denominator = Math.max(1, count - 1);
  const x = sparsePositions[count]?.[index] ?? 7 + (index / denominator) * 86;
  return {
    "--veil-x": `${x.toFixed(2)}%`,
    "--veil-y": `${Y_PATTERN[index % Y_PATTERN.length]}%`,
    "--veil-z": `${Math.round(day.atmosphere * 150 - 48)}px`,
    "--veil-tilt": `${TILT_PATTERN[index % TILT_PATTERN.length]}deg`,
    "--veil-energy": Number(day.atmosphere.toFixed(3)),
  };
}

export default function ActivityVeil({ snapshot }: { snapshot: ActivityVeilSnapshot }) {
  const days = snapshot.days.slice(-14);
  const latest = days[days.length - 1];

  return (
    <section className="activity-veil" aria-labelledby="activity-veil-title">
      <header className="activity-veil-heading">
        <div>
          <p>PUBLIC ACTIVITY / BOUNDED WINDOW</p>
          <h3 id="activity-veil-title">Code leaves atmosphere, not a score.</h3>
        </div>
        <p>
          Each sheet is a day with observed public GitHub activity. Its presence responds to factual commits,
          pushes, and repository breadth through a capped curve. Select one to read the source facts.
        </p>
      </header>

      <div
        className="activity-veil-stage"
        data-has-days={days.length > 0 ? "true" : "false"}
        data-density={days.length > 0 && days.length <= 3 ? "sparse" : "field"}
      >
        <span className="activity-veil-depth" aria-hidden="true" />
        {days.length > 0 ? (
          <ol className="activity-veil-days">
            {days.map((day, index) => {
              const landmark = day.pullRequestsMerged > 0 || day.tagsPublished > 0;
              const align = index < 3 ? "start" : index > days.length - 4 ? "end" : "center";
              return (
                <li key={day.date}>
                  <details
                    className="activity-veil-day"
                    data-landmark={landmark ? "true" : "false"}
                    data-align={align}
                    style={styleFor(day, index, days.length)}
                  >
                    <summary>
                      <span className="activity-veil-sheet" aria-hidden="true"><i /><i /><i /></span>
                      <span className="activity-veil-sr">{dayLabel(day.date)}: {observedSummary(day)}</span>
                    </summary>
                    <div className="activity-veil-facts">
                      <time dateTime={day.date}>{dayLabel(day.date)}</time>
                      <dl>
                        <div><dt>PUBLIC COMMITS</dt><dd>{day.commitCount}</dd></div>
                        <div><dt>PUSHES</dt><dd>{day.pushCount}</dd></div>
                        <div><dt>PUBLIC REPOSITORIES</dt><dd>{day.repositories.length}</dd></div>
                        {day.pullRequestsMerged > 0 && <div><dt>MERGED PULL REQUESTS</dt><dd>{day.pullRequestsMerged}</dd></div>}
                        {day.tagsPublished > 0 && <div><dt>PUBLISHED TAGS</dt><dd>{day.tagsPublished}</dd></div>}
                      </dl>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="activity-veil-quiet">No recent public GitHub events were available. The world stays quiet instead of inventing activity.</p>
        )}
        <div className="activity-veil-time" aria-hidden="true">
          <span>{days[0] ? dayLabel(days[0].date) : "NO OBSERVED EVENT"}</span>
          <i />
          <span>{latest ? "LATEST OBSERVED" : "PRESENT"}</span>
        </div>
      </div>

      <footer className="activity-veil-coverage">
        <span>{days.length} observed public activity day{days.length === 1 ? "" : "s"}</span>
        <p>{snapshot.coverage.disclosure}</p>
      </footer>
    </section>
  );
}

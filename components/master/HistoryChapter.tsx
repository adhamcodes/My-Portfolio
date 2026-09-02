import { historicalWork } from "@/content/master";

export default function HistoryChapter() {
  return (
    <section
      id="history"
      data-chapter="history"
      className="master-scene history-chapter history-chapter-v4"
      aria-labelledby="history-title"
    >
      <p className="master-number">04 / HISTORY</p>

      <div className="history-heading">
        <h2 id="history-title">
          <span>NOTHING MEANINGFUL</span>
          <span>GETS ERASED.</span>
        </h2>
        <p>Earlier work can leave the present without being rewritten as failure—or promoted into something it was not.</p>
      </div>

      <div className="history-strata" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <i>PAST</i>
        <b>PRESENT</b>
      </div>

      <div className="history-archive" aria-label="Preserved earlier work">
        <div className="history-axis" aria-hidden="true">
          <span>DEEPER</span>
          <i />
          <strong>CURRENT SURFACE</strong>
        </div>

        {historicalWork.map((work, index) => (
          <article key={work.id} className="history-fossil history-fossil-v4">
            <div className="history-fossil-mark" aria-hidden="true">
              <strong>{work.name}</strong>
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="history-fossil-identity">
              <p>STRATUM {String(index + 1).padStart(2, "0")} / PREVIOUS FRAME</p>
              <h3>{work.name}</h3>
              <span>Withdrawn from the present. Preserved in the identity.</span>
            </div>
            <p>{work.summary}</p>
          </article>
        ))}
      </div>

      <p className="history-note">What leaves the present settles here.</p>
    </section>
  );
}

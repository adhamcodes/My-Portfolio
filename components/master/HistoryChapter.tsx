import { historicalWork } from "@/content/master";

export default function HistoryChapter() {
  return (
    <section
      id="history"
      data-chapter="history"
      className="master-scene history-chapter history-chapter-v3"
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

      <div className="history-archive">
        <div className="history-axis" aria-hidden="true">
          <span>EARLIER</span>
          <i />
          <strong>NOW</strong>
        </div>

        {historicalWork.map((work) => (
          <article key={work.id} className="history-fossil history-fossil-v3">
            <div className="history-fossil-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="history-fossil-identity">
              <p>ARCHIVED WORK / PRESERVED</p>
              <h3>{work.name}</h3>
              <span>Not current evidence. Still part of the record.</span>
            </div>
            <p>{work.summary}</p>
          </article>
        ))}
      </div>

      <p className="history-note">Dates and milestones enter this field only when verified. Missing chronology stays missing instead of being invented for symmetry.</p>
    </section>
  );
}

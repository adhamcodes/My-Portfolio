import { historicalWork } from "@/content/master";

export default function HistoryChapter() {
  return (
    <section
      id="history"
      data-chapter="history"
      className="master-scene history-chapter"
      aria-labelledby="history-title"
    >
      <p className="master-number">04 / HISTORY</p>

      <div className="history-heading">
        <h2 id="history-title">NOTHING MEANINGFUL GETS ERASED.</h2>
        <p>Earlier work can move out of the present without being rewritten as failure—or promoted into something it was not.</p>
      </div>

      <div className="history-field">
        <div className="history-time" aria-hidden="true">
          <span>EARLIER</span>
          <i />
          <span>NOW</span>
        </div>

        {historicalWork.map((work) => (
          <article key={work.id} className="history-fossil">
            <div className="history-fossil-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <p>ARCHIVED WORK</p>
              <h3>{work.name}</h3>
            </div>
            <p>{work.summary}</p>
          </article>
        ))}
      </div>

      <p className="history-note">Dates and milestones enter this field only when they are verified. The archive does not invent chronology to look complete.</p>
    </section>
  );
}

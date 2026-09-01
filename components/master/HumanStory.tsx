const beats = [
  {
    index: "01",
    label: "RESET",
    title: "Start where the truth is.",
    copy: "I left university before finishing my degree. What comes next is deliberate: rebuild from software foundations and let the work carry the proof.",
  },
  {
    index: "02",
    label: "WORK",
    title: "Make knowledge physical.",
    copy: "Projects are where theory stops being abstract. What ships becomes evidence; what fails becomes information for the next attempt.",
  },
  {
    index: "03",
    label: "DIRECTION",
    title: "Earn the next identity.",
    copy: "Software engineering is the primary path. AI/ML is the long-term direction to earn through study, experiments, and real systems—not a title to claim early.",
  },
] as const;

export default function HumanStory() {
  return (
    <section
      id="now"
      data-chapter="human"
      className="master-scene human-story human-story-v3"
      aria-labelledby="human-title"
    >
      <p className="master-number">01 / NOW</p>

      <div className="human-story-opening">
        <h2 id="human-title" className="human-story-monument">
          <span>NOT A STATIC</span>
          <span>PERSON.</span>
        </h2>
        <p className="human-story-thesis">
          The portfolio changes for the same reason the person does: new work, new understanding, new evidence.
        </p>
      </div>

      <div className="human-story-rupture" aria-hidden="true">
        <span className="human-story-rupture-before">BEFORE</span>
        <span className="human-story-rupture-seam" />
        <span className="human-story-rupture-after">AFTER IS BUILT</span>
      </div>

      <ol className="human-story-sequence">
        {beats.map((beat) => (
          <li key={beat.label} className="human-story-beat">
            <div className="human-story-beat-index" aria-hidden="true">{beat.index}</div>
            <div className="human-story-beat-heading">
              <p>{beat.label}</p>
              <h3>{beat.title}</h3>
            </div>
            <p className="human-story-beat-copy">{beat.copy}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HumanStory() {
  return (
    <section
      id="now"
      data-chapter="human"
      className="master-scene human-story"
      aria-labelledby="human-title"
    >
      <p className="master-number">01 / NOW</p>

      <div className="human-story-title">
        <h2 id="human-title">
          <span>NOT A</span>
          <span>STATIC</span>
          <span>PERSON.</span>
        </h2>
        <p className="human-story-thesis">
          The portfolio should change for the same reason the person does: new work, new understanding, new evidence.
        </p>
      </div>

      <div className="human-story-beats">
        <article>
          <p>RESET</p>
          <h3>Start where the truth is.</h3>
          <p>I left university before finishing my degree. The reset is deliberate: rebuild from software foundations and let the work carry the proof.</p>
        </article>
        <article>
          <p>WORK</p>
          <h3>Build to make knowledge concrete.</h3>
          <p>Projects are where theory stops being abstract. What ships becomes evidence; what fails becomes information for the next attempt.</p>
        </article>
        <article>
          <p>DIRECTION</p>
          <h3>Earn the next identity.</h3>
          <p>Software engineering is the primary path. AI/ML is the long-term direction to earn through study, experiments, and real systems—not a title to claim early.</p>
        </article>
      </div>
    </section>
  );
}

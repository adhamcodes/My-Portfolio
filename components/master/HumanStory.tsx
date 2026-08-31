export default function HumanStory() {
  return (
    <section
      id="now"
      data-chapter="human"
      className="master-scene human-story"
      aria-labelledby="now-title"
    >
      <p className="master-number">01 / NOW</p>

      <div className="human-story-monument">
        <h2 id="now-title">
          <span>NOT A</span>
          <span>STATIC</span>
          <span>PERSON.</span>
        </h2>
      </div>

      <div className="human-story-beats">
        <article>
          <span>RESET</span>
          <p>I left university without finishing the degree. It belongs in the chronology, not in the headline.</p>
        </article>
        <article>
          <span>WORK</span>
          <p>I learn by building and shipping. The projects are evidence of change, not decoration around a claim.</p>
        </article>
        <article>
          <span>DIRECTION</span>
          <p>Software engineering is the primary path. AI/ML is a direction I intend to earn through deeper work over time.</p>
        </article>
      </div>
    </section>
  );
}

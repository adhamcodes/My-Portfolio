const beats = [
  {
    index: "01",
    label: "RESET",
    title: "The degree ended. The direction did not.",
    copy: "I left university before completing it. That fact belongs here without mythology. The response is practical: return to fundamentals and rebuild deliberately.",
  },
  {
    index: "02",
    label: "BEGINNING",
    title: "Foundry starts at zero.",
    copy: "The 180-unit system exists. My personal record begins only when the learning does. Until verified work enters it, zero is not failure—it is the honest starting state.",
  },
  {
    index: "03",
    label: "PRACTICE",
    title: "Build because building is the point.",
    copy: "Small tools, experiments, strange ideas, useful systems—making projects across subjects is not a side brand. It is how I stay curious and turn understanding into something real.",
  },
  {
    index: "04",
    label: "DIRECTION",
    title: "Software first. Intelligence earned.",
    copy: "Software engineering is the foundation. AI/ML is the destination; automation is leverage along the way. The identity changes only when the evidence does.",
  },
] as const;

export default function HumanStory() {
  return (
    <section
      id="now"
      data-chapter="human"
      className="master-scene human-story human-story-v4"
      aria-labelledby="human-title"
    >
      <p className="master-number">01 / NOW</p>

      <div className="human-story-opening">
        <h2 id="human-title" className="human-story-monument">
          <span>NOT A STATIC</span>
          <span>PERSON.</span>
        </h2>
        <div className="human-story-thesis">
          <p>Right now, I am rebuilding from the foundations.</p>
          <p>
            Foundry is the beginning. Software engineering is the foundation. AI/ML is where the path is going.
            Automation creates leverage—and I keep making things because I genuinely love the act of building.
          </p>
        </div>
      </div>

      <ol className="human-story-sequence" aria-label="Current path">
        {beats.map((beat, order) => (
          <li key={beat.label} className="human-story-beat" data-order={order + 1}>
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

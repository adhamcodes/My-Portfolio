import WorldLink from "@/components/master/WorldLink";
import { featuredWork } from "@/content/master";

export default function WorkEncounter() {
  const project = featuredWork.find((entry) => entry.id === "zeroupload");
  if (!project) return null;

  return (
    <section
      id="work"
      data-chapter="work"
      data-world="zeroupload"
      className="master-scene work-encounter work-encounter-v3"
      aria-labelledby="work-title"
    >
      <p className="master-number">02 / WORK</p>

      <div className="work-boundary" aria-hidden="true">
        <span className="work-boundary-plane" />
        <span className="work-boundary-packet">
          <i />
          <i />
          <i />
        </span>
        <span className="work-boundary-label work-boundary-local">YOUR DEVICE</span>
        <span className="work-boundary-label work-boundary-remote">NOT REQUIRED</span>
      </div>

      <div className="work-encounter-copy">
        <span className="work-encounter-idea">{project.centralIdea}</span>
        <h2 id="work-title">{project.name}</h2>
        <p>{project.summary}</p>
        <WorldLink className="work-enter" href="/work/zeroupload" world="zeroupload">
          Cross into the project <span aria-hidden="true">→</span>
        </WorldLink>
      </div>

      <p className="work-law" aria-hidden="true">
        <span>FILE</span>
        <strong>STAYS HERE</strong>
      </p>
    </section>
  );
}

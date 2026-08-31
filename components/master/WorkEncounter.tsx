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
      className="master-scene work-encounter"
      aria-labelledby="work-title"
    >
      <p className="master-number">02 / WORK</p>

      <div className="work-boundary" aria-hidden="true">
        <span className="work-boundary-line" />
        <span className="work-boundary-object" />
      </div>

      <div className="work-encounter-copy">
        <span className="work-encounter-idea">{project.centralIdea}</span>
        <h2 id="work-title">{project.name}</h2>
        <p>{project.summary}</p>
        <WorldLink className="work-enter" href="/work/zeroupload" world="zeroupload">
          Enter the boundary <span aria-hidden="true">↗</span>
        </WorldLink>
      </div>

      <p className="work-outside" aria-hidden="true">OUTSIDE</p>
    </section>
  );
}

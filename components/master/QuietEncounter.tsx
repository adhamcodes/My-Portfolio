import WorldLink from "@/components/master/WorldLink";
import { featuredWork } from "@/content/master";

export default function QuietEncounter() {
  const project = featuredWork.find((entry) => entry.id === "quiet");
  if (!project) return null;

  return (
    <section
      data-chapter="work"
      data-world="quiet"
      className="master-scene quiet-encounter"
      aria-labelledby="quiet-title"
    >
      <p className="quiet-encounter-index">02B / WORK</p>

      <div className="quiet-encounter-space" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="quiet-encounter-copy">
        <span className="quiet-encounter-idea">{project.centralIdea}</span>
        <h2 id="quiet-title">QUIET</h2>
        <p>{project.summary}</p>
        <WorldLink className="quiet-enter" href="/work/quiet" world="quiet">
          Enter the silence <span aria-hidden="true">→</span>
        </WorldLink>
      </div>

      <p className="quiet-encounter-note">The spectacle here is what disappears.</p>
    </section>
  );
}

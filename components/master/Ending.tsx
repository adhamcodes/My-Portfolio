import { masterIdentity } from "@/content/master";

export default function Ending() {
  return (
    <section
      id="present"
      data-chapter="present"
      className="master-scene ending"
      aria-labelledby="present-title"
    >
      <p className="master-number">05 / PRESENT</p>

      <div className="ending-copy">
        <p className="ending-human">I&apos;m still building.</p>
        <h2 id="present-title">THIS IS THE CURRENT FRAME.</h2>
        <p className="ending-thought">The record stops here only because the future has not happened yet.</p>
      </div>

      <div className="ending-unresolved" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>

      <div className="ending-contact">
        <div>
          <p>ADHAM MAHMOOD</p>
          <span>Software engineering → AI/ML engineering</span>
        </div>
        <nav aria-label="Contact and source">
          <a href={`mailto:${masterIdentity.workEmail}`}>Email</a>
          <a href={masterIdentity.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </div>
    </section>
  );
}

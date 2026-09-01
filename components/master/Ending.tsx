import { masterIdentity } from "@/content/master";

export default function Ending() {
  return (
    <section
      id="present"
      data-chapter="present"
      className="master-scene ending ending-v3"
      aria-labelledby="present-title"
    >
      <p className="master-number">05 / PRESENT</p>

      <div className="ending-convergence" aria-hidden="true">
        <span className="ending-convergence-history" />
        <span className="ending-convergence-work" />
        <span className="ending-convergence-growth" />
        <i className="ending-convergence-now" />
        <b className="ending-convergence-future" />
      </div>

      <div className="ending-copy">
        <p className="ending-human">I&apos;m still building.</p>
        <h2 id="present-title">
          <span>THIS IS THE</span>
          <span>CURRENT FRAME.</span>
        </h2>
        <p className="ending-thought">Everything behind this point can become evidence or history. Everything beyond it is deliberately unresolved.</p>
      </div>

      <div className="ending-horizon" aria-hidden="true">
        <span>KNOWN</span>
        <i />
        <strong>NOT YET WRITTEN</strong>
      </div>

      <div id="contact" className="ending-contact">
        <div className="ending-signature">
          <p>Adham Mahmood</p>
          <span>Software engineering → AI/ML engineering</span>
        </div>
        <nav aria-label="Contact and source">
          <a href={`mailto:${masterIdentity.workEmail}`}>{masterIdentity.workEmail}</a>
          <a href={masterIdentity.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </div>
    </section>
  );
}

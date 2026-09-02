import { masterIdentity } from "@/content/master";

export default function Ending() {
  return (
    <section
      id="present"
      data-chapter="present"
      className="master-scene ending ending-v4"
      aria-labelledby="present-title"
    >
      <p className="master-number">05 / PRESENT</p>

      <div className="ending-stage">
        <div className="ending-copy">
          <p className="ending-human">I&apos;m still building.</p>
          <h2 id="present-title">
            <span>THE CURRENT</span>
            <span>FRAME.</span>
          </h2>
          <p className="ending-thought">This is where the work, the learning, and I stand today.</p>
        </div>

        <div className="ending-horizon" aria-hidden="true">
          <span>KNOWN</span>
          <i />
          <strong>OPEN</strong>
        </div>
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

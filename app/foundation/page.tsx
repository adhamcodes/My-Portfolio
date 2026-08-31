import { featuredWork, growthTracks, historyEntries, masterIdentity } from "@/content/master";

const navItems = [
  ["Now", "#now"],
  ["Work", "#work"],
  ["Growth", "#growth"],
  ["History", "#history"],
  ["Present", "#present"],
] as const;

export default function FoundationPage() {
  return (
    <main className="master-shell">
      <a className="master-skip" href="#main-story">Skip to story</a>

      <header className="master-header" aria-label="Foundation preview navigation">
        <a className="master-wordmark" href="#origin" aria-label="Adham Mahmood, back to beginning">
          <strong>ADHAM</strong><span>MAHMOOD</span>
        </a>
        <nav aria-label="Primary">
          {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <span className="master-preview-tag">FOUNDATION / 00B</span>
      </header>

      <section id="origin" className="master-scene master-origin" aria-labelledby="origin-title">
        <div className="master-kicker">CURRENT FRAME</div>
        <h1 id="origin-title"><span>ADHAM</span><span>MAHMOOD</span></h1>
        <p className="master-thesis">{masterIdentity.thesis}</p>
        <p className="master-note">This route is the semantic skeleton for Master 2.0. The final Living Trace, motion, Index and project worlds are intentionally absent here.</p>
      </section>

      <div id="main-story">
        <section id="now" className="master-scene master-human" aria-labelledby="now-title">
          <p className="master-number">01 / NOW</p>
          <h2 id="now-title">NOT A STATIC PERSON.</h2>
          <div className="master-reading">
            <p>I am rebuilding deliberately: software foundations first, then deeper systems work, with AI/ML as the long-term engineering direction.</p>
            <p>{masterIdentity.currentFrame}</p>
          </div>
        </section>

        <section id="work" className="master-scene" aria-labelledby="work-title">
          <p className="master-number">02 / WORK</p>
          <div className="master-section-head">
            <h2 id="work-title">Evidence, not inventory.</h2>
            <p>The portfolio does not need a full project grid. Work enters this space only when it earns the attention.</p>
          </div>
          <div className="master-work-list">
            {featuredWork.map((project) => (
              <article key={project.id} className="master-work" aria-labelledby={`${project.id}-title`}>
                <div>
                  <span className="master-idea">{project.centralIdea}</span>
                  <h3 id={`${project.id}-title`}>{project.name}</h3>
                </div>
                <p>{project.summary}</p>
                <div className="master-links">
                  {project.liveUrl && <a href={project.liveUrl}>Live product <span aria-hidden="true">↗</span></a>}
                  {project.sourceUrl && <a href={project.sourceUrl}>Source <span aria-hidden="true">↗</span></a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="growth" className="master-scene" aria-labelledby="growth-title">
          <p className="master-number">03 / GROWTH</p>
          <div className="master-section-head">
            <h2 id="growth-title">The becoming is part of the record.</h2>
            <p>These tracks begin at zero. The interface must remain complete even before the first real event exists.</p>
          </div>
          <div className="master-growth-list">
            {growthTracks.map((track) => (
              <article key={track.id} className="master-growth-item">
                <div>
                  <span className="master-status">{track.status.replace("_", " ")}</span>
                  <h3>{track.label}</h3>
                </div>
                <p>{track.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="history" className="master-scene master-history" aria-labelledby="history-title">
          <p className="master-number">04 / HISTORY</p>
          <div className="master-section-head">
            <h2 id="history-title">Nothing meaningful gets erased.</h2>
            <p>Earlier work can become history without pretending it represents the present.</p>
          </div>
          {historyEntries.map((entry) => (
            <article key={entry.id} className="master-history-entry">
              <h3>{entry.label}</h3>
              <p>{entry.note}</p>
            </article>
          ))}
        </section>

        <section id="present" className="master-scene master-present" aria-labelledby="present-title">
          <p className="master-number">05 / PRESENT</p>
          <h2 id="present-title">THIS IS THE CURRENT FRAME.</h2>
          <p>The structure continues beyond what exists today. Future work and growth should enter because reality changed, not because the layout needs filling.</p>
          <div className="master-contact">
            <a href={masterIdentity.github}>GitHub <span aria-hidden="true">↗</span></a>
            <span>Work email connects at the final contact pass.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

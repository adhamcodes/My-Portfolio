"use client";

import { useEffect, useMemo, useState } from "react";
import { identity, journey, projects, type Project } from "../data/identity";

function statusLabel(status: string) {
  return status.replace("building", "BUILDING").replace("active", "ACTIVE").replace("next", "NEXT").replace("planned", "PLANNED").replace("target", "TARGET").replace("shipped", "SHIPPED");
}

function ProjectInspect({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <div className="inspect-overlay" role="dialog" aria-modal="true" aria-label={`${project.name} system inspection`}>
      <button className="inspect-backdrop" onClick={onClose} aria-label="Close project inspection" />
      <article className={`inspect-panel accent-${project.accent}`}>
        <div className="inspect-head">
          <div>
            <span className="micro">SYSTEM / {project.category.toUpperCase()}</span>
            <h2>{project.name}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <p className="inspect-statement">{project.statement}</p>

        <div className="decision-grid">
          <div><span>PROBLEM</span><p>{project.problem}</p></div>
          <div><span>CONSTRAINT</span><p>{project.constraint}</p></div>
          <div><span>DECISION</span><p>{project.decision}</p></div>
        </div>

        <div className="system-flow">
          {project.system.map((step, index) => (
            <div className="flow-step" key={step}>
              <span className="flow-index">0{index + 1}</span>
              <strong>{step}</strong>
              {index < project.system.length - 1 && <span className="flow-line" />}
            </div>
          ))}
        </div>

        <div className="evidence-block">
          <span className="micro">EVIDENCE</span>
          <div className="evidence-list">
            {project.evidence.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>

        <div className="inspect-actions">
          {project.live && <a href={project.live} target="_blank" rel="noreferrer">Open live ↗</a>}
          {project.repo && <a href={project.repo} target="_blank" rel="noreferrer">Source ↗</a>}
        </div>
      </article>
    </div>
  );
}

function BuildGraph({ inspect }: { inspect: boolean }) {
  return (
    <div className={`build-graph ${inspect ? "inspect-on" : ""}`}>
      <div className="graph-axis" />
      {journey.map((stage, index) => {
        const topProject = projects.find((p) =>
          (stage.id === "software" && p.id === "zeroupload") ||
          (stage.id === "systems" && p.id === "foundry180")
        );
        return (
          <div className={`stage stage-${stage.status}`} style={{ "--i": index } as React.CSSProperties} key={stage.id}>
            <div className="stage-node"><span /></div>
            <div className="stage-copy">
              <small>0{index + 1}</small>
              <strong>{stage.label}</strong>
              <em>{statusLabel(stage.status)}</em>
            </div>
            {topProject && (
              <div className={`branch branch-${topProject.accent}`}>
                <span className="branch-line" />
                <span className="branch-dot" />
                <div>
                  <small>{topProject.status.toUpperCase()}</small>
                  <strong>{topProject.name}</strong>
                </div>
              </div>
            )}
            {inspect && <span className="inspect-tag">journey.{stage.id}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [inspectMode, setInspectMode] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "i" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setInspectMode((v) => !v);
      }
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = useMemo(() => projects.find((p) => p.status === "building") ?? projects[0], []);

  return (
    <main className={inspectMode ? "inspect-mode" : ""}>
      <div className="scroll-signal" style={{ transform: `scaleX(${scroll})` }} />
      <div className="ambient-grid" />
      <div className="grain" />

      <nav className="nav-shell">
        <a className="wordmark" href="#top">ADHAM<span>/</span>BUILD.STATE</a>
        <div className="nav-links">
          <a href="#evidence">Evidence</a>
          <a href="#current">Now</a>
          <a href="#trajectory">Trajectory</a>
        </div>
        <button className={inspectMode ? "inspect-toggle active" : "inspect-toggle"} onClick={() => setInspectMode(!inspectMode)}>
          <span className="inspect-led" /> INSPECT <kbd>I</kbd>
        </button>
      </nav>

      <section id="top" className="hero-shell">
        <div className="hero-kicker">
          <span className="signal-dot" />
          <span>IDENTITY / LIVE BUILD</span>
        </div>
        <h1>{identity.name}</h1>
        <p className="signal-line">{identity.signal}</p>
        <p className="hero-thesis">{identity.thesis}</p>

        <div className="hero-state">
          <div><span>MODE</span><strong>BUILD IN PUBLIC</strong></div>
          <div><span>CURRENT</span><strong>{current.name.toUpperCase()}</strong></div>
          <div><span>DIRECTION</span><strong>AI / ML SYSTEMS</strong></div>
        </div>

        <BuildGraph inspect={inspectMode} />

        <div className="scroll-hint"><span /> follow the build state</div>
        {inspectMode && <span className="inspect-tag hero-tag">component.hero / state.live</span>}
      </section>

      <section id="evidence" className="section-shell evidence-section">
        <div className="section-head">
          <div>
            <span className="micro">EVIDENCE / SELECTED SYSTEMS</span>
            <h2>Things that survived contact with reality.</h2>
          </div>
          <p>Not a skill wall. Not a logo collection. Work with constraints, decisions, and evidence.</p>
        </div>

        <div className="project-stack">
          {projects.map((project, index) => (
            <button className={`project-row accent-${project.accent}`} onClick={() => setSelected(project)} key={project.id}>
              <span className="project-index">0{index + 1}</span>
              <div className="project-main">
                <div className="project-meta"><span>{project.category}</span><i>● {project.status.toUpperCase()}</i></div>
                <h3>{project.name}</h3>
                <p>{project.statement}</p>
              </div>
              <div className="project-system">
                {project.system.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              </div>
              <span className="inspect-cta">INSPECT SYSTEM ↗</span>
              {inspectMode && <span className="inspect-tag">data.projects[{index}]</span>}
            </button>
          ))}
        </div>
      </section>

      <section id="current" className="section-shell current-section">
        <div className="current-grid">
          <div className="current-copy">
            <span className="micro">CURRENT EXPERIMENT / ACTIVE</span>
            <h2>{current.name}</h2>
            <p>{current.statement}</p>
            <button onClick={() => setSelected(current)}>Inspect current build ↗</button>
          </div>
          <div className="current-machine">
            <div className="machine-head"><span>FOUNDRY180 / BUILD PIPELINE</span><b>LIVE</b></div>
            <div className="machine-flow">
              {current.system.map((item, index) => (
                <div key={item} className={index <= 2 ? "machine-node on" : "machine-node"}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
            <div className="machine-signal"><span /></div>
            {inspectMode && <span className="inspect-tag">component.currentBuild / status.building</span>}
          </div>
        </div>
      </section>

      <section id="trajectory" className="section-shell trajectory-section">
        <div className="section-head">
          <div><span className="micro">TRAJECTORY / DEPTH BEFORE HEIGHT</span><h2>The destination is not the title.</h2></div>
          <p>The site moves when the work moves. Future states are deliberately visible without pretending they are already earned.</p>
        </div>

        <div className="trajectory-line">
          {journey.map((stage, index) => (
            <div className={`trajectory-stop stop-${stage.status}`} key={stage.id}>
              <span className="trajectory-index">0{index + 1}</span>
              <div className="trajectory-dot" />
              <strong>{stage.label}</strong>
              <em>{statusLabel(stage.status)}</em>
              <p>{stage.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell transmission-section">
        <div className="transmission-copy">
          <span className="micro">TRANSMISSION / OPEN CHANNEL</span>
          <h2>If the work is interesting,<br />the channel is open.</h2>
        </div>
        <div className="transmission-links">
          <a href={`mailto:${identity.email}`}>Email <span>↗</span></a>
          <a href={identity.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a>
        </div>
      </section>

      <footer>
        <span>ADHAM / BUILD.STATE</span>
        <span>{new Date().getFullYear()} · SYSTEM EVOLVES WITH THE WORK</span>
      </footer>

      {selected && <ProjectInspect project={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

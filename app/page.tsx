"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import CursorSystem from "@/components/CursorSystem";
import InitializationSequence from "@/components/InitializationSequence";
import PerformanceGovernor from "@/components/PerformanceGovernor";
import ProjectPortal from "@/components/ProjectPortal";
import SignalTicker from "@/components/SignalTicker";
import Soundscape from "@/components/Soundscape";
import SystemLab from "@/components/SystemLab";
import XRay from "@/components/XRay";
import { auraModes, identity, projects, stages, transmissions, type AuraMode, type Project } from "@/data/site";

const AuraCanvas = dynamic(() => import("@/components/AuraCanvas"), { ssr: false });

export default function Home() {
  const [portal, setPortal] = useState<Project | null>(null);
  const [xray, setXray] = useState(false);
  const [aura, setAura] = useState<AuraMode>("pulse");
  const [auraReady, setAuraReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const current = useMemo(() => projects.find((project) => project.state === "building") ?? projects[0], []);

  const openProject = useCallback((project: Project) => {
    const run = () => setPortal(project);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(run);
    else run();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("adham:aura");
      if (saved && auraModes.some((mode) => mode.id === saved)) setAura(saved as AuraMode);
    } catch {}
    setAuraReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.aura = aura;
    if (!auraReady) return;
    try { localStorage.setItem("adham:aura", aura); } catch {}
  }, [aura, auraReady]);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "x") setXray((value) => !value);
      if (event.key.toLowerCase() === "a") {
        setAura((currentMode) => {
          const index = auraModes.findIndex((mode) => mode.id === currentMode);
          return auraModes[(index + 1) % auraModes.length].id;
        });
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((element) => {
          gsap.fromTo(element, { y: 80, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 1.05,
            ease: "power4.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((element, index) => {
          gsap.to(element, {
            yPercent: index % 2 ? -10 : 12,
            ease: "none",
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1.4 },
          });
        });
      });
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <main>
      <InitializationSequence />
      <PerformanceGovernor />
      <AuraCanvas aura={aura} />
      <CursorSystem />
      <XRay on={xray} />
      <div className="noise-layer" />
      <div className="vignette" />
      <div className="progress-rail"><span style={{ transform: `scaleY(${progress})` }} /></div>

      <header className="chrome">
        <a className="brand" href="#origin" data-cursor="signal">
          <b>ADHAM</b><span>MAHMOOD</span>
        </a>
        <nav>
          <a href="#work">WORK</a>
          <a href="#state">STATE</a>
          <a href="#trajectory">PATH</a>
          <a href="#machine">SYSTEM</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="chrome-tools">
          <button onClick={() => setXray((value) => !value)} className={xray ? "xray-toggle on" : "xray-toggle"} data-cursor="signal">
            XRAY <kbd>X</kbd>
          </button>
          <Soundscape aura={aura} />
        </div>
      </header>

      <aside className="aura-switcher" aria-label="Aura mode">
        <span>STATE / AURA</span>
        {auraModes.map((mode) => (
          <button key={mode.id} className={aura === mode.id ? "active" : ""} onClick={() => setAura(mode.id)} data-cursor="signal">
            <i /> <b>{mode.label}</b><small>{mode.note}</small>
          </button>
        ))}
        <em>press A to cycle</em>
      </aside>

      <section id="origin" className="hero scene">
        <div className="hero-copy">
          <div className="eyebrow"><span /> LIVE IDENTITY / VERSION {identity.version}</div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}>
            <span>ADHAM</span>
            <span>MAHMOOD</span>
          </motion.h1>
          <motion.div className="hero-subline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.9 }}>
            <strong>{identity.short}</strong>
            <p>This is not a finished title. It is a live build.</p>
          </motion.div>
          <motion.p className="hero-thesis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9 }}>
            {identity.thesis}
          </motion.p>
          <div className="hero-actions">
            <a href="#work" className="primary-action" data-cursor="enter"><span>ENTER THE BUILD</span><i>↘</i></a>
            <button onClick={() => openProject(current)} className="ghost-action" data-cursor="open">CURRENT SYSTEM / {current.name.toUpperCase()} ↗</button>
          </div>
        </div>

        <div className="hero-instrument" data-drift>
          <div className="instrument-ring ring-one" />
          <div className="instrument-ring ring-two" />
          <div className="instrument-copy top"><span>CORE</span><b>UNSTABLE / EVOLVING</b></div>
          <div className="instrument-copy bottom"><span>VECTOR</span><b>INTELLIGENT SYSTEMS</b></div>
          <div className="coordinate c1">+23.8103</div>
          <div className="coordinate c2">90.4125</div>
        </div>

        <SignalTicker />
        <div className="hero-scroll"><span>SCROLL TO ADVANCE STATE</span><i /></div>
      </section>

      <section className="manifest scene" id="state">
        <div className="section-number">01 / BUILD STATE</div>
        <div className="manifest-grid">
          <div className="manifest-word" data-rise>
            <span>NOT</span>
            <span>A</span>
            <span>STATIC</span>
            <span>PERSON.</span>
          </div>
          <div className="manifest-copy" data-rise>
            <p>The portfolio is supposed to age with me. When the work changes, the system changes. Projects move. Signals change. The current obsession takes over the interface.</p>
            <div className="state-readout">
              <div><span>NOW</span><strong>SOFTWARE FOUNDATIONS</strong></div>
              <div><span>BUILDING</span><strong>{current.name.toUpperCase()}</strong></div>
              <div><span>NEXT PRESSURE</span><strong>SYSTEMS / BACKEND</strong></div>
              <div><span>LONG VECTOR</span><strong>AI / ML SYSTEMS</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="work scene">
        <div className="section-number">02 / PROJECT WORLDS</div>
        <div className="work-intro">
          <h2 data-rise>Projects are not cards.<br /><span>They are places to enter.</span></h2>
          <p data-rise>Each system gets its own visual field, problem, constraint, architecture and proof. The UI changes when you cross into it.</p>
        </div>

        <div className="project-orbits">
          {projects.map((project, index) => (
            <button
              key={project.id}
              className={`project-world world-${project.accent}`}
              onClick={() => openProject(project)}
              data-cursor="enter"
              data-rise
            >
              <div className="world-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="world-glow" />
              <div className="world-lines"><i /><i /><i /></div>
              <div className="world-meta"><span>{project.chapter}</span><em>{project.state.toUpperCase()}</em></div>
              <h3>{project.name}</h3>
              <p>{project.oneLine}</p>
              <div className="world-architecture">
                {project.architecture.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="world-enter">ENTER SYSTEM <b>↗</b></div>
            </button>
          ))}
        </div>
      </section>

      <section className="current scene">
        <div className="section-number">03 / ACTIVE OBSESSION</div>
        <div className="current-shell">
          <div className="current-title" data-rise>
            <span>CURRENT BUILD</span>
            <h2>{current.name}</h2>
            <p>{current.oneLine}</p>
            <button onClick={() => openProject(current)} data-cursor="enter">OPEN THE FORGE ↗</button>
          </div>
          <div className="forge-machine" data-drift>
            <div className="forge-header"><span>FOUNDRY180 / SYSTEM MAP</span><b>BUILDING</b></div>
            <div className="forge-core"><span>180</span><small>DAYS</small></div>
            <svg viewBox="0 0 600 420" aria-hidden="true">
              <path d="M300 210 C240 160 170 155 98 104" />
              <path d="M300 210 C370 150 438 146 505 87" />
              <path d="M300 210 C230 270 160 278 95 325" />
              <path d="M300 210 C370 265 445 270 520 334" />
            </svg>
            {current.architecture.slice(0, 4).map((item, index) => <div key={item} className={`forge-node fn-${index + 1}`}><span>0{index + 1}</span>{item}</div>)}
            <div className="forge-pulse" />
          </div>
        </div>
      </section>

      <section id="trajectory" className="trajectory scene">
        <div className="section-number">04 / TRAJECTORY</div>
        <div className="trajectory-head">
          <h2 data-rise>THE MAP IS<br /><span>NOT THE TERRITORY.</span></h2>
          <p data-rise>Future stages stay visible, but visually unresolved. The portfolio refuses to pretend I have already arrived.</p>
        </div>
        <div className="trajectory-system">
          <div className="trajectory-axis" />
          {stages.map((stage, index) => (
            <div className={`stage stop-${stage.state}`} key={stage.id} data-rise>
              <div className="stage-dot"><i /></div>
              <span>0{index + 1}</span>
              <h3>{stage.label}</h3>
              <em>{stage.state.toUpperCase()}</em>
              <p>{stage.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="transmissions scene">
        <div className="section-number">05 / INTERNAL TRANSMISSIONS</div>
        <div className="transmission-stack">
          {transmissions.map((line, index) => (
            <div key={line} className="transmission" data-rise>
              <span>0{index + 1}</span><p>{line}</p>
            </div>
          ))}
        </div>
      </section>

      <SystemLab aura={aura} xray={xray} />

      <section id="contact" className="contact scene">
        <div className="contact-orbit" data-drift />
        <div className="contact-copy" data-rise>
          <span className="section-number">07 / OPEN CHANNEL</span>
          <h2>IF THE SIGNAL<br />MATCHES,<br /><em>TRANSMIT.</em></h2>
          <p>Interesting software, engineering conversations, collaboration, or just a genuinely good idea.</p>
          <div className="contact-links">
            <a href={`mailto:${identity.email}`} data-cursor="enter">EMAIL <span>↗</span></a>
            <a href={identity.github} target="_blank" rel="noreferrer" data-cursor="enter">GITHUB <span>↗</span></a>
          </div>
        </div>
      </section>

      <footer>
        <div><b>{identity.mark}</b><span>THE SYSTEM CHANGES WHEN THE WORK CHANGES.</span></div>
        <div><span>AURA / {aura.toUpperCase()}</span><span>XRAY / {xray ? "ON" : "OFF"}</span><span>VERSION / {identity.version}</span><span>© 2026</span></div>
      </footer>

      <ProjectPortal project={portal} onClose={() => setPortal(null)} />
    </main>
  );
}

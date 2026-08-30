"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import CoreDirector from "@/components/CoreDirector";
import CursorSystem from "@/components/CursorSystem";
import FoundryEngine from "@/components/FoundryEngine";
import IdentityGlyph from "@/components/IdentityGlyph";
import InitializationSequence from "@/components/InitializationSequence";
import KineticField from "@/components/KineticField";
import OperatorDeck from "@/components/OperatorDeck";
import PerformanceGovernor from "@/components/PerformanceGovernor";
import ProjectPortal from "@/components/ProjectPortal";
import SecretProtocol from "@/components/SecretProtocol";
import SignalTicker from "@/components/SignalTicker";
import Soundscape from "@/components/Soundscape";
import SystemLab from "@/components/SystemLab";
import VisualErrorBoundary from "@/components/VisualErrorBoundary";
import XRay from "@/components/XRay";
import { auraModes, identity, projects, stages, transmissions, type AuraMode, type Project, type StageState } from "@/data/site";

const AuraCanvas = dynamic(() => import("@/components/AuraCanvas"), { ssr: false });

function statusLabel(state: StageState) {
  if (state === "verified") return "LIVE";
  if (state === "active") return "IN PROGRESS";
  if (state === "building") return "BUILDING";
  if (state === "next") return "NEXT";
  return "FUTURE";
}

export default function Home() {
  const [portal, setPortal] = useState<Project | null>(null);
  const [xray, setXray] = useState(false);
  const [aura, setAura] = useState<AuraMode>("pulse");
  const [auraReady, setAuraReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const current = useMemo(() => projects.find((project) => project.state === "building") ?? projects[0], []);
  const familiarity = Math.round((visited.length / Math.max(projects.length, 1)) * 100);

  const markVisited = useCallback((id: string) => {
    setVisited((existing) => {
      if (existing.includes(id)) return existing;
      const next = [...existing, id];
      try { localStorage.setItem("adham:visited-worlds", JSON.stringify(next)); } catch {}
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: `PROJECTS EXPLORED · ${next.length}/${projects.length}` }));
      return next;
    });
  }, []);

  const openProject = useCallback((project: Project, updateHistory = true) => {
    markVisited(project.id);
    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("system", project.id);
      window.history.pushState({ auraSystem: project.id }, "", url);
    }
    const run = () => setPortal(project);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(run);
    else run();
  }, [markVisited]);

  const closeProject = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("system")) {
      url.searchParams.delete("system");
      window.history.replaceState({}, "", url);
    }
    const run = () => setPortal(null);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(run);
    else run();
  }, []);

  const toggleXray = useCallback(() => setXray((value) => !value), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("adham:aura");
      if (saved && auraModes.some((mode) => mode.id === saved)) setAura(saved as AuraMode);
      const seen = JSON.parse(localStorage.getItem("adham:visited-worlds") || "[]") as unknown;
      if (Array.isArray(seen)) setVisited(seen.filter((item): item is string => typeof item === "string"));
    } catch {}
    setAuraReady(true);
    const systemId = new URL(window.location.href).searchParams.get("system");
    const linked = projects.find((project) => project.id === systemId);
    if (linked) openProject(linked, false);
  }, [openProject]);

  useEffect(() => {
    const pop = () => {
      const systemId = new URL(window.location.href).searchParams.get("system");
      const linked = projects.find((project) => project.id === systemId) || null;
      setPortal(linked);
      if (linked) markVisited(linked.id);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [markVisited]);

  useEffect(() => {
    document.documentElement.dataset.aura = aura;
    if (!auraReady) return;
    try { localStorage.setItem("adham:aura", aura); } catch {}
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `VISUAL MODE · ${aura.toUpperCase()}` }));
  }, [aura, auraReady]);

  useEffect(() => {
    document.documentElement.dataset.xray = xray ? "on" : "off";
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `XRAY · ${xray ? "ON" : "OFF"}` }));
  }, [xray]);

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
      if (event.key.toLowerCase() === "x") toggleXray();
      if (event.key.toLowerCase() === "a") {
        setAura((currentMode) => {
          const index = auraModes.findIndex((mode) => mode.id === currentMode);
          return auraModes[(index + 1) % auraModes.length].id;
        });
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [toggleXray]);

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
          gsap.fromTo(element, { y: 64, opacity: 0 }, { y: 0, opacity: 1, duration: 1.08, ease: "power4.out", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
        });
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((element, index) => {
          gsap.to(element, { yPercent: index % 2 ? -7 : 8, ease: "none", scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1.8 } });
        });
      });
    });
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <main>
      <InitializationSequence />
      <PerformanceGovernor />
      <KineticField />
      <CoreDirector />
      <SecretProtocol />
      <VisualErrorBoundary><AuraCanvas aura={aura} /></VisualErrorBoundary>
      <CursorSystem />
      <XRay on={xray} />
      <OperatorDeck aura={aura} xray={xray} visited={visited} onAura={setAura} onXray={toggleXray} onProject={(project) => openProject(project)} />
      <div className="environment-field" aria-hidden="true"><i /><i /><i /></div>
      <div className="noise-layer" />
      <div className="vignette" />
      <div className="kinetic-glow" aria-hidden="true" />
      <div className="progress-rail"><span style={{ transform: `scaleY(${progress})` }} /></div>

      <header className="chrome">
        <a className="brand" href="#origin" data-cursor="signal"><b>ADHAM</b><span>MAHMOOD</span></a>
        <nav><a href="#work">WORK</a><a href="#state">NOW</a><a href="#trajectory">PATH</a><a href="#machine">UNDER THE HOOD</a><a href="#contact">CONTACT</a></nav>
        <div className="chrome-tools">
          <button onClick={toggleXray} className={xray ? "xray-toggle on" : "xray-toggle"} data-cursor="signal">XRAY <kbd>X</kbd></button>
          <Soundscape aura={aura} />
        </div>
      </header>

      <aside className="aura-switcher" aria-label="Visual mode">
        <span>VISUAL MODE</span>
        {auraModes.map((mode) => <button key={mode.id} className={aura === mode.id ? "active" : ""} onClick={() => setAura(mode.id)} data-cursor="signal"><i /> <b>{mode.label}</b><small>{mode.note}</small></button>)}
        <em>A to cycle</em>
      </aside>

      <section id="origin" className="hero scene">
        <div className="hero-copy">
          <div className="eyebrow"><span /> INTERACTIVE PORTFOLIO / {identity.version}</div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}><span>ADHAM</span><span>MAHMOOD</span></motion.h1>
          <motion.div className="hero-subline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5, duration: .9 }}><strong>{identity.short}</strong><p>A portfolio that changes as the work changes.</p></motion.div>
          <motion.p className="hero-thesis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7, duration: .9 }}>{identity.thesis}</motion.p>
          <div className="hero-actions"><a href="#work" className="primary-action" data-cursor="enter"><span>EXPLORE THE WORK</span><i>↘</i></a><button onClick={() => openProject(current)} className="ghost-action" data-cursor="open">CURRENT BUILD / {current.name.toUpperCase()} ↗</button></div>
        </div>
        <div className="hero-instrument" data-drift>
          <div className="instrument-ring ring-one" /><div className="instrument-ring ring-two" /><IdentityGlyph aura={aura} />
          <div className="instrument-copy top"><span>VISUAL FIELD</span><b>REACTIVE / WEBGL</b></div>
          <div className="instrument-copy bottom"><span>DIRECTION</span><b>SOFTWARE → SYSTEMS → INTELLIGENCE</b></div>
          <div className="coordinate c1">3D / LIVE</div><div className="coordinate c2">MODE / {aura.toUpperCase()}</div>
        </div>
        <SignalTicker />
        <div className="hero-scroll"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="manifest scene" id="state">
        <div className="section-number">01 / RIGHT NOW</div>
        <div className="manifest-grid">
          <div className="manifest-word" data-rise><span>NOT</span><span>A</span><span>STATIC</span><span>PERSON.</span></div>
          <div className="manifest-copy" data-rise>
            <p>I want the portfolio to move with the work instead of freezing me at one version of myself. What I am learning, building, and aiming at stays visible here.</p>
            <div className="state-readout"><div><span>FOCUS</span><strong>SOFTWARE FOUNDATIONS</strong></div><div><span>BUILDING</span><strong>{current.name.toUpperCase()}</strong></div><div><span>NEXT</span><strong>SYSTEMS / BACKEND</strong></div><div><span>DIRECTION</span><strong>INTELLIGENT SOFTWARE</strong></div></div>
          </div>
        </div>
      </section>

      <section id="work" className="work scene">
        <div className="section-number">02 / SELECTED WORK</div>
        <div className="work-intro"><h2 data-rise>Different problems.<br /><span>Different shapes.</span></h2><p data-rise>Each project opens into its own interactive model instead of another identical case-study page.</p></div>
        <div className="project-orbits">
          {projects.map((project, index) => (
            <button key={project.id} className={`project-world world-${project.accent}${visited.includes(project.id) ? " world-seen" : ""}`} onClick={() => openProject(project)} data-cursor="enter" data-rise>
              <div className="world-index">{String(index + 1).padStart(2, "0")}</div><div className="world-glow" /><div className="world-lines"><i /><i /><i /></div>
              <div className="world-meta"><span>{project.chapter}</span><em>{visited.includes(project.id) ? "SEEN · " : ""}{statusLabel(project.state)}</em></div>
              <h3>{project.name}</h3><p>{project.oneLine}</p><div className="world-architecture">{project.architecture.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div><div className="world-enter">OPEN PROJECT <b>↗</b></div>
            </button>
          ))}
        </div>
        <div className={`memory-strip${familiarity === 100 ? " complete" : ""}`} data-rise><span>PROJECTS EXPLORED</span><b>{visited.length} OF {projects.length}</b><i style={{ transform: `scaleX(${familiarity / 100})` }} /></div>
      </section>

      <section className="current scene">
        <div className="section-number">03 / WHAT I&apos;M BUILDING NOW</div>
        <div className="current-title current-title-upgraded" data-rise><span>CURRENT BUILD</span><h2>{current.name}</h2><p>{current.oneLine}</p><button onClick={() => openProject(current)} data-cursor="enter">OPEN FOUNDRY180 ↗</button></div>
        <FoundryEngine />
      </section>

      <section id="trajectory" className="trajectory scene">
        <div className="section-number">04 / WHERE THIS GOES</div>
        <div className="trajectory-head"><h2 data-rise>DEPTH,<br /><span>THEN INTELLIGENCE.</span></h2><p data-rise>I am deliberately building the software base first. The later stages stay visible, but they only become claims when the work earns them.</p></div>
        <div className="trajectory-system"><div className="trajectory-axis" />{stages.map((stage, index) => <div className={`stage stop-${stage.state}`} key={stage.id} data-rise><div className="stage-dot"><i /></div><span>0{index + 1}</span><h3>{stage.label}</h3><em>{statusLabel(stage.state)}</em><p>{stage.note}</p></div>)}</div>
      </section>

      <section className="transmissions scene">
        <div className="section-number">05 / NOTES I KEEP COMING BACK TO</div>
        <div className="transmission-stack">{transmissions.map((line, index) => <div key={line} className="transmission" data-rise><span>0{index + 1}</span><p>{line}</p></div>)}</div>
      </section>

      <SystemLab aura={aura} xray={xray} />

      <section id="contact" className="contact scene">
        <div className="contact-orbit" data-drift />
        <div className="contact-copy" data-rise><span className="section-number">07 / SAY HELLO</span><h2>IF SOMETHING<br />HERE CLICKS,<br /><em>SAY HELLO.</em></h2><p>Interesting software, engineering conversations, collaboration, or a genuinely good idea.</p><div className="contact-links"><a href={`mailto:${identity.email}`} data-cursor="enter">EMAIL ME <span>↗</span></a><a href={identity.github} target="_blank" rel="noreferrer" data-cursor="enter">GITHUB <span>↗</span></a></div></div>
      </section>

      <footer><div><b>{identity.mark}</b><span>BUILT TO CHANGE WITH THE WORK.</span></div><div><span>EXPLORED / {visited.length}:{projects.length}</span><span>MODE / {aura.toUpperCase()}</span><span>XRAY / {xray ? "ON" : "OFF"}</span><span>BUILD / {identity.version}</span><span>© 2026</span></div></footer>
      <ProjectPortal project={portal} onClose={closeProject} />
    </main>
  );
}

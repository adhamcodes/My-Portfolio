"use client";

import { motion } from "motion/react";
import { useMemo, useState, type CSSProperties } from "react";
import FoundryEngine from "@/components/FoundryEngine";
import { portfolioSystem, type Project } from "@/data/site";

function PortfolioWorld() {
  const [layer, setLayer] = useState(0);
  const selected = portfolioSystem.layers[layer];
  return (
    <div className="world-engine world-engine-aura world-engine-portfolio">
      <div className="engine-head"><span>HOW THIS SITE IS PUT TOGETHER</span><b>{portfolioSystem.version}</b></div>
      <div className="aura-architecture-stage">
        <div className="aura-mini-core" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="aura-layer-orbit">
          {portfolioSystem.layers.map((item, index) => (
            <button key={item.id} className={layer === index ? "active" : ""} onClick={() => setLayer(index)} data-cursor="signal" style={{ "--i": index, "--n": portfolioSystem.layers.length } as CSSProperties}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item.role}</b>
            </button>
          ))}
        </div>
      </div>
      <motion.div className="aura-layer-readout" key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span>{selected.role}</span><h3>{selected.tech}</h3><p>{selected.job}</p><code>{selected.path}</code>
      </motion.div>
    </div>
  );
}

const zeroSteps = [
  { label: "YOUR DEVICE", note: "selected locally" },
  { label: "THE BROWSER", note: "browser takes over" },
  { label: "PROCESS LOCALLY", note: "useful work stays here" },
  { label: "SHARE WHEN NEEDED", note: "network only by choice" },
];

function ZeroUploadWorld() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const moveTo = (index: number) => {
    setStep(index);
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `ZEROUPLOAD · ${zeroSteps[index].label}` }));
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    for (let index = 0; index < zeroSteps.length; index += 1) {
      moveTo(index);
      await new Promise((resolve) => setTimeout(resolve, 520));
    }
    window.dispatchEvent(new CustomEvent("aura:burst"));
    setRunning(false);
  };

  return (
    <div className={`world-engine world-engine-zero zero-state-${step}`}>
      <div className="engine-head"><span>LOCAL-FIRST, MADE VISIBLE</span><b>CLICK A STAGE OR PLAY THE FLOW</b></div>
      <div className="zero-stage">
        <div className="zero-file" aria-hidden="true"><span>LOCAL FILE</span><b>demo.asset</b><i /></div>
        <div className="zero-route">
          {zeroSteps.map((item, index) => (
            <button key={item.label} className={step === index ? "active" : step > index ? "passed" : ""} onClick={() => moveTo(index)} data-cursor="signal">
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item.label}</b><em>{item.note}</em>
            </button>
          ))}
        </div>
        <motion.div className="zero-capsule" animate={{ left: `${6 + step * 30.5}%`, rotate: step === 2 ? -5 : step === 3 ? 7 : 0, scale: step === 2 ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 105, damping: 17 }}>
          <i /><i /><span>{step < 3 ? "LOCAL" : "SHARE"}</span>
        </motion.div>
        <div className="zero-network"><span>NETWORK</span><b>{step < 3 ? "NOT USED" : "ONLY WHEN CHOSEN"}</b><i /></div>
      </div>
      <motion.div className="zero-readout" key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <span>NOW</span><b>{zeroSteps[step].label}</b><em>{zeroSteps[step].note}.</em>
      </motion.div>
      <button className="engine-action" onClick={run} disabled={running} data-cursor="signal">{running ? "PLAYING…" : "PLAY THE LOCAL FLOW"} ↗</button>
    </div>
  );
}

function WindowBiomeWorld() {
  const windows = useMemo(() => [
    { id: "code", label: "CODE", x: 5, y: 10, w: 50, h: 54 },
    { id: "browser", label: "BROWSER", x: 42, y: 23, w: 52, h: 59 },
    { id: "terminal", label: "TERMINAL", x: 14, y: 63, w: 47, h: 28 },
  ], []);
  const [active, setActive] = useState("browser");
  return (
    <div className={`world-engine world-engine-biome biome-focus-${active}`}>
      <div className="engine-head"><span>THE DESKTOP BECOMES THE ENVIRONMENT</span><b>CLICK A WINDOW</b></div>
      <div className="biome-desktop">
        <div className="biome-wallpaper" />
        <div className="biome-ambient" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        {windows.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)} className={`biome-window${active === item.id ? " active" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }}>
            <span><i />{item.label}<em>{active === item.id ? "ACTIVE" : "BACKGROUND"}</em></span>
            <div>{item.id === "code" ? "01  const environment = activeWindow;" : item.id === "browser" ? "reactive desktop / live context" : "> overlay --click-through --watch-focus"}</div>
          </button>
        ))}
        <motion.div className="biome-organism" animate={{ x: active === "code" ? -118 : active === "terminal" ? -32 : 118, y: active === "terminal" ? 82 : active === "code" ? -22 : 8, rotate: active === "code" ? -30 : active === "terminal" ? 25 : 8 }} transition={{ type: "spring", stiffness: 72, damping: 13 }}>
          <div className="biome-core"><i /><i /><i /></div>
          <div className="biome-tail" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <b>REACTING TO / {active.toUpperCase()}</b>
        </motion.div>
      </div>
      <div className="biome-contract"><span>THE RULE</span><b>BE PRESENT WITHOUT STEALING THE DESKTOP.</b><em>Transparent overlay + focus awareness + click-through interaction.</em></div>
    </div>
  );
}

const novaModes = ["motion", "depth", "hierarchy"] as const;
type NovaMode = (typeof novaModes)[number];

function NovaWorld() {
  const [energy, setEnergy] = useState(68);
  const [mode, setMode] = useState<NovaMode>("motion");
  const nextMode = () => setMode((current) => novaModes[(novaModes.indexOf(current) + 1) % novaModes.length]);
  return (
    <div className="world-engine world-engine-nova" style={{ "--nova-energy": energy / 100 } as CSSProperties}>
      <div className="engine-head"><span>AN INTERACTIVE MOTION STUDY</span><b>THE COMPOSITION CHANGES, NOT JUST THE GLOW</b></div>
      <button className={`nova-stage nova-${mode}`} onClick={nextMode} data-cursor="signal" aria-label="Cycle Nova composition mode">
        <div className="nova-grid" aria-hidden="true" />
        <div className="nova-index"><span>STUDY / 01</span><b>{mode.toUpperCase()}</b></div>
        <div className="nova-wordmark"><span>VISUAL</span><strong>NOVA</strong><em>STUDY</em></div>
        <div className="nova-planes" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => <motion.i key={index} animate={{ x: mode === "motion" ? (index - 2.5) * energy * .13 : mode === "depth" ? (index % 2 ? 24 : -24) : 0, y: mode === "hierarchy" ? index * 7 - 18 : index % 2 ? 9 : -9, rotate: mode === "motion" ? (index - 2) * 3 : mode === "depth" ? index * 2.2 : 0, scaleX: .75 + energy / 180 }} transition={{ type: "spring", stiffness: 90, damping: 15 }} />)}
        </div>
        <motion.div className="nova-core" animate={{ scale: .72 + energy / 190, rotate: mode === "motion" ? energy * .12 : mode === "depth" ? -18 : 0, x: mode === "hierarchy" ? 78 : mode === "depth" ? -52 : 0 }} transition={{ type: "spring", stiffness: 86, damping: 15 }}><i /><i /><i /></motion.div>
        <div className="nova-caption"><span>CLICK THE STAGE</span><b>{energy}% INTENSITY</b></div>
      </button>
      <div className="nova-controls">
        <div>{novaModes.map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item.toUpperCase()}</button>)}</div>
        <label><span>INTENSITY</span><input type="range" min="20" max="100" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></label>
      </div>
      <p className="nova-note">Nova is intentionally visual-first. It stays here as evidence of the period where I was learning motion, hierarchy, and presentation before pushing deeper into systems.</p>
    </div>
  );
}

export default function WorldEngine({ project }: { project: Project }) {
  if (project.id === "foundry180") return <FoundryEngine compact />;
  if (project.id === "aura-system") return <PortfolioWorld />;
  if (project.id === "zeroupload") return <ZeroUploadWorld />;
  if (project.id === "windowbiome") return <WindowBiomeWorld />;
  return <NovaWorld />;
}

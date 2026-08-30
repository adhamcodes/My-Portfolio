"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import FoundryEngine from "@/components/FoundryEngine";
import { portfolioSystem, type Project } from "@/data/site";

function AuraWorld() {
  const [layer, setLayer] = useState(0);
  const selected = portfolioSystem.layers[layer];
  return (
    <div className="world-engine world-engine-aura">
      <div className="engine-head"><span>LIVE ARCHITECTURE / PEEL THE SYSTEM</span><b>{portfolioSystem.version}</b></div>
      <div className="aura-architecture-stage">
        <div className="aura-mini-core" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="aura-layer-orbit">
          {portfolioSystem.layers.map((item, index) => (
            <button key={item.id} className={layer === index ? "active" : ""} onClick={() => setLayer(index)} data-cursor="signal" style={{ "--i": index, "--n": portfolioSystem.layers.length } as React.CSSProperties}>
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

function ZeroUploadWorld() {
  const steps = ["DEVICE", "BROWSER", "LOCAL PROCESS", "SHARE FLOW"];
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (running) return;
    setRunning(true);
    for (let index = 0; index < steps.length; index += 1) {
      setStep(index);
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: `ZEROUPLOAD / ${steps[index]} / ACTIVE` }));
      await new Promise((resolve) => setTimeout(resolve, 430));
    }
    setRunning(false);
  };

  return (
    <div className="world-engine world-engine-zero">
      <div className="engine-head"><span>LOCAL-FIRST FLOW / SIMULATION</span><b>SERVER BY DEFAULT / NO</b></div>
      <div className="zero-pipeline">
        {steps.map((item, index) => (
          <div key={item} className={step === index ? "active" : step > index ? "passed" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b><i>{index < steps.length - 1 ? "→" : "✓"}</i>
          </div>
        ))}
        <motion.div className="zero-packet" animate={{ left: `${8 + step * 29}%` }} transition={{ type: "spring", stiffness: 130, damping: 18 }}><span>FILE</span></motion.div>
      </div>
      <div className="zero-readout"><span>DEFAULT ASSUMPTION</span><b>KEEP USEFUL WORK IN THE BROWSER</b><em>UPLOAD ONLY WHEN THE PRODUCT ACTUALLY NEEDS IT.</em></div>
      <button className="engine-action" onClick={run} disabled={running} data-cursor="signal">{running ? "RUNNING LOCAL FLOW…" : "RUN LOCAL FLOW"} ↗</button>
    </div>
  );
}

function WindowBiomeWorld() {
  const windows = useMemo(() => [
    { id: "code", label: "CODE", x: 6, y: 11, w: 48, h: 52 },
    { id: "browser", label: "BROWSER", x: 43, y: 24, w: 50, h: 58 },
    { id: "terminal", label: "TERMINAL", x: 15, y: 62, w: 45, h: 29 },
  ], []);
  const [active, setActive] = useState("browser");
  return (
    <div className="world-engine world-engine-biome">
      <div className="engine-head"><span>DESKTOP REACTION MODEL</span><b>CLICK A WINDOW / CHANGE FOCUS</b></div>
      <div className="biome-desktop">
        <div className="biome-wallpaper" />
        {windows.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)} className={`biome-window${active === item.id ? " active" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }}>
            <span><i />{item.label}<em>{active === item.id ? "ACTIVE" : "BACKGROUND"}</em></span>
            <div>{item.id === "code" ? "01  const environment = activeWindow;" : item.id === "browser" ? "reactive desktop / live context" : "> overlay --click-through --watch-focus"}</div>
          </button>
        ))}
        <motion.div className="biome-organism" animate={{ x: active === "code" ? -110 : active === "terminal" ? -30 : 110, y: active === "terminal" ? 80 : active === "code" ? -20 : 10, rotate: active === "code" ? -28 : active === "terminal" ? 24 : 9 }} transition={{ type: "spring", stiffness: 75, damping: 14 }}>
          <i /><i /><i /><b>BIOME / {active.toUpperCase()}</b>
        </motion.div>
      </div>
      <div className="biome-contract"><span>CONTRACT</span><b>BE PRESENT WITHOUT STEALING THE DESKTOP.</b><em>Transparent overlay + focus awareness + click-through interaction.</em></div>
    </div>
  );
}

function NovaWorld() {
  const [energy, setEnergy] = useState(68);
  const [mode, setMode] = useState<"motion" | "depth" | "hierarchy">("motion");
  return (
    <div className="world-engine world-engine-nova" style={{ "--nova-energy": energy / 100 } as React.CSSProperties}>
      <div className="engine-head"><span>CINEMATIC WEB STUDY</span><b>VISUAL ERA / PRESERVED</b></div>
      <div className={`nova-stage nova-${mode}`}>
        <div className="nova-starfield" /><div className="nova-orb"><i /><i /><i /></div>
        <div className="nova-title"><span>VISUAL SYSTEM</span><b>NOVA</b><em>{mode.toUpperCase()} / {energy}%</em></div>
      </div>
      <div className="nova-controls">
        <div>{(["motion", "depth", "hierarchy"] as const).map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item.toUpperCase()}</button>)}</div>
        <label><span>INTENSITY</span><input type="range" min="20" max="100" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></label>
      </div>
      <p className="nova-note">This project stays visually loud on purpose: evidence of the phase where motion and presentation were the primary experiment—not a claim that it was a deeper system than it was.</p>
    </div>
  );
}

export default function WorldEngine({ project }: { project: Project }) {
  if (project.id === "foundry180") return <FoundryEngine compact />;
  if (project.id === "aura-system") return <AuraWorld />;
  if (project.id === "zeroupload") return <ZeroUploadWorld />;
  if (project.id === "windowbiome") return <WindowBiomeWorld />;
  return <NovaWorld />;
}

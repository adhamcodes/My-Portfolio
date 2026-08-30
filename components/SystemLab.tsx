"use client";

import { useEffect, useMemo, useState } from "react";
import { portfolioSystem, type AuraMode } from "@/data/site";

type Capability = {
  id: string;
  label: string;
  detail: string;
  available: boolean;
  optional?: boolean;
};

type NavigatorExtended = Navigator & {
  gpu?: unknown;
  deviceMemory?: number;
};

function getCapabilities(): Capability[] {
  if (typeof window === "undefined") return [];

  const canvas = document.createElement("canvas");
  let webgl2 = false;
  try {
    webgl2 = Boolean(canvas.getContext("webgl2"));
  } catch {
    webgl2 = false;
  }

  let storage = false;
  try {
    const key = "__aura_self_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    storage = true;
  } catch {
    storage = false;
  }

  const nav = navigator as NavigatorExtended;
  const doc = document as Document & { startViewTransition?: unknown };

  return [
    { id: "webgl2", label: "GPU RENDER", detail: "WebGL 2 / Three.js", available: webgl2 },
    { id: "view-transition", label: "PORTALS", detail: "View Transition API", available: Boolean(doc.startViewTransition), optional: true },
    { id: "audio", label: "AUDIO", detail: "Web Audio API", available: "AudioContext" in window || "webkitAudioContext" in window },
    { id: "storage", label: "MEMORY", detail: "Local state storage", available: storage },
    { id: "offscreen", label: "CANVAS", detail: "OffscreenCanvas", available: "OffscreenCanvas" in window, optional: true },
    { id: "webgpu", label: "NEXT RENDER", detail: "WebGPU capability", available: Boolean(nav.gpu), optional: true },
  ];
}

export default function SystemLab({ aura, xray }: { aura: AuraMode; xray: boolean }) {
  const [fps, setFps] = useState(0);
  const [viewport, setViewport] = useState("—");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [testing, setTesting] = useState(false);
  const [energy, setEnergy] = useState(1);
  const [lastAction, setLastAction] = useState("SYSTEM IDLE / WAITING FOR INPUT");

  const online = useMemo(() => capabilities.filter((item) => item.available).length, [capabilities]);

  useEffect(() => {
    setCapabilities(getCapabilities());
    const updateViewport = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`);
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - last;
      if (elapsed >= 700) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--aura-energy", String(energy));
    window.dispatchEvent(new CustomEvent("aura:energy", { detail: energy }));
  }, [energy]);

  const runSelfTest = async () => {
    if (testing) return;
    const snapshot = getCapabilities();
    setCapabilities(snapshot);
    setTesting(true);
    setRevealed(0);
    setLastAction("SELF TEST / PROBING BROWSER CAPABILITIES");
    for (let index = 0; index < snapshot.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      setRevealed(index + 1);
    }
    setTesting(false);
    setLastAction(`SELF TEST COMPLETE / ${snapshot.filter((item) => item.available).length} SYSTEMS ONLINE`);
  };

  const burstCore = () => {
    window.dispatchEvent(new CustomEvent("aura:burst"));
    setLastAction("CORE BURST / SIGNAL INJECTED INTO WEBGL FIELD");
  };

  return (
    <section id="machine" className={xray ? "system-lab scene lab-xray" : "system-lab scene"}>
      <div className="section-number">06 / THE MACHINE</div>

      <div className="lab-intro" data-rise>
        <div>
          <span className="lab-kicker">PORTFOLIO / FLAGSHIP SYSTEM</span>
          <h2>DON&apos;T JUST<br />LOOK AT IT.<br /><em>PROBE IT.</em></h2>
        </div>
        <p>
          This page is one of the projects. The visual layer, motion, audio, browser capabilities and identity state are wired into a live system instead of being a static theme wrapped around project cards.
        </p>
      </div>

      <div className="lab-shell" data-rise>
        <div className="lab-telemetry">
          <div className="lab-panel-head">
            <span>LIVE / RUNTIME TELEMETRY</span>
            <b><i /> ONLINE</b>
          </div>
          <div className="telemetry-grid">
            <div><span>FRAME RATE</span><strong>{fps || "—"}<small> FPS</small></strong></div>
            <div><span>VIEWPORT</span><strong>{viewport}</strong></div>
            <div><span>AURA STATE</span><strong>{aura.toUpperCase()}</strong></div>
            <div><span>XRAY</span><strong>{xray ? "EXPOSED" : "SEALED"}</strong></div>
            <div><span>INPUT</span><strong>{typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 ? "TOUCH + POINTER" : "POINTER"}</strong></div>
            <div><span>CAPABILITIES</span><strong>{online}/{capabilities.length || 6}</strong></div>
          </div>

          <div className="lab-scope" aria-hidden="true">
            {Array.from({ length: 22 }).map((_, index) => <i key={index} style={{ "--bar": `${26 + ((index * 37) % 68)}%` } as React.CSSProperties} />)}
            <span className="scope-scan" />
          </div>
          <div className="lab-log"><span>LAST EVENT</span><code>{lastAction}</code></div>
        </div>

        <div className="lab-controls">
          <div className="lab-panel-head"><span>CORE / CALIBRATION</span><b>INTERACTIVE</b></div>
          <label className="energy-control">
            <span><b>FIELD ENERGY</b><em>{energy.toFixed(2)}×</em></span>
            <input
              type="range"
              min="0.55"
              max="1.55"
              step="0.05"
              value={energy}
              onChange={(event) => {
                const value = Number(event.target.value);
                setEnergy(value);
                setLastAction(`FIELD ENERGY / ${value.toFixed(2)}×`);
              }}
            />
          </label>
          <button className="burst-button" onClick={burstCore} data-cursor="signal">
            <span>INJECT SIGNAL</span><b>BURST CORE ↗</b>
          </button>
          <div className="lab-shortcuts">
            <span><kbd>A</kbd> cycle aura</span>
            <span><kbd>X</kbd> xray system</span>
            <span><kbd>ESC</kbd> close portal</span>
          </div>
        </div>
      </div>

      <div className="lab-layers" data-rise>
        <div className="lab-panel-head"><span>SYSTEM / LAYERS</span><b>{portfolioSystem.version}</b></div>
        <div className="layer-grid">
          {portfolioSystem.layers.map((layer, index) => (
            <article key={layer.id}>
              <span>0{index + 1}</span>
              <small>{layer.role}</small>
              <h3>{layer.tech}</h3>
              <p>{layer.job}</p>
              <code>{layer.path}</code>
            </article>
          ))}
        </div>
      </div>

      <div className="lab-self-test" data-rise>
        <div className="self-test-copy">
          <span className="lab-kicker">REAL BROWSER CHECK / NOT DECORATION</span>
          <h3>RUN THE MACHINE<br />AGAINST YOUR DEVICE.</h3>
          <p>Every result below is detected in this browser at runtime. Optional APIs degrade instead of breaking the experience.</p>
          <button onClick={runSelfTest} disabled={testing} data-cursor="signal">
            {testing ? "TESTING SYSTEMS…" : "RUN SELF TEST"} <span>↗</span>
          </button>
        </div>
        <div className="capability-stack">
          {capabilities.map((item, index) => {
            const visible = !testing || index < revealed;
            return (
              <div className={visible ? "capability-row visible" : "capability-row"} key={item.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                <b className={item.available ? "cap-online" : item.optional ? "cap-fallback" : "cap-offline"}>
                  {item.available ? "ONLINE" : item.optional ? "FALLBACK" : "UNAVAILABLE"}
                </b>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

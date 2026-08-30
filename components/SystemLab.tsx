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

type RuntimeSignal = { quality: string; fps: number; cores: number; memory: number };

function getCapabilities(): Capability[] {
  if (typeof window === "undefined") return [];

  const canvas = document.createElement("canvas");
  let webgl2 = false;
  try { webgl2 = Boolean(canvas.getContext("webgl2")); } catch { webgl2 = false; }

  let storage = false;
  try {
    const key = "__portfolio_self_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    storage = true;
  } catch { storage = false; }

  const nav = navigator as NavigatorExtended;
  const doc = document as Document & { startViewTransition?: unknown };

  return [
    { id: "webgl2", label: "3D RENDERING", detail: "WebGL 2 / Three.js", available: webgl2 },
    { id: "view-transition", label: "PAGE TRANSITIONS", detail: "View Transition API", available: Boolean(doc.startViewTransition), optional: true },
    { id: "audio", label: "GENERATIVE SOUND", detail: "Web Audio API", available: "AudioContext" in window || "webkitAudioContext" in window },
    { id: "storage", label: "LOCAL MEMORY", detail: "Local Storage", available: storage },
    { id: "offscreen", label: "OFFSCREEN CANVAS", detail: "OffscreenCanvas", available: "OffscreenCanvas" in window, optional: true },
    { id: "webgpu", label: "WEBGPU", detail: "Next-generation GPU API", available: Boolean(nav.gpu), optional: true },
  ];
}

export default function SystemLab({ aura, xray }: { aura: AuraMode; xray: boolean }) {
  const [fps, setFps] = useState(0);
  const [viewport, setViewport] = useState("—");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [testing, setTesting] = useState(false);
  const [energy, setEnergy] = useState(1);
  const [lastAction, setLastAction] = useState("Waiting for input.");
  const [quality, setQuality] = useState("CALIBRATING");
  const [lcp, setLcp] = useState<number | null>(null);
  const [cls, setCls] = useState(0);
  const [longTasks, setLongTasks] = useState(0);

  const online = useMemo(() => capabilities.filter((item) => item.available).length, [capabilities]);

  useEffect(() => {
    setCapabilities(getCapabilities());
    const updateViewport = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`);
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const onRuntime = (event: Event) => {
      const signal = (event as CustomEvent<RuntimeSignal>).detail;
      if (!signal) return;
      setQuality(signal.quality.toUpperCase());
      setLastAction(`Render quality set to ${signal.quality.toUpperCase()} from a ${signal.fps} FPS sample.`);
    };
    window.addEventListener("aura:runtime", onRuntime as EventListener);
    const currentQuality = document.documentElement.dataset.quality;
    if (currentQuality) setQuality(currentQuality.toUpperCase());
    return () => window.removeEventListener("aura:runtime", onRuntime as EventListener);
  }, []);

  useEffect(() => {
    const observers: PerformanceObserver[] = [];
    if (!("PerformanceObserver" in window)) {
      setLcp(-1);
      return;
    }

    try {
      const largest = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) setLcp(Math.round(last.startTime));
      });
      largest.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(largest);
    } catch { setLcp(-1); }

    try {
      let total = 0;
      const layout = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!shift.hadRecentInput) total += shift.value || 0;
        }
        setCls(total);
      });
      layout.observe({ type: "layout-shift", buffered: true });
      observers.push(layout);
    } catch {}

    try {
      const tasks = new PerformanceObserver((list) => setLongTasks((value) => value + list.getEntries().length));
      tasks.observe({ type: "longtask", buffered: true });
      observers.push(tasks);
    } catch {}

    const lcpFallback = window.setTimeout(() => setLcp((value) => value === null ? -1 : value), 3500);
    return () => {
      window.clearTimeout(lcpFallback);
      observers.forEach((observer) => observer.disconnect());
    };
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
    setLastAction("Checking this browser's optional capabilities…");
    for (let index = 0; index < snapshot.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setRevealed(index + 1);
    }
    setTesting(false);
    setLastAction(`Browser check complete. ${snapshot.filter((item) => item.available).length} of ${snapshot.length} capabilities are available here.`);
  };

  const burstCore = () => {
    window.dispatchEvent(new CustomEvent("aura:burst"));
    setLastAction("Visual field pulse triggered.");
  };

  const lcpText = lcp === null ? "MEASURING" : lcp < 0 ? "N/A" : String(lcp);
  const lcpUnit = lcp !== null && lcp >= 0 ? " MS" : "";

  return (
    <section id="machine" className={xray ? "system-lab scene lab-xray" : "system-lab scene"}>
      <div className="section-number">06 / UNDER THE HOOD</div>

      <div className="lab-intro" data-rise>
        <div>
          <span className="lab-kicker">THIS PORTFOLIO IS ALSO A PROJECT</span>
          <h2>DON&apos;T JUST<br />LOOK AT IT.<br /><em>PROBE IT.</em></h2>
        </div>
        <p>The visuals are only the surface. This section exposes the real browser checks, performance data, rendering choices, and interaction layers running underneath the page.</p>
      </div>

      <div className="lab-shell" data-rise>
        <div className="lab-telemetry">
          <div className="lab-panel-head"><span>LIVE PERFORMANCE</span><b><i /> RUNNING</b></div>
          <div className="telemetry-grid telemetry-expanded">
            <div><span>FRAME RATE</span><strong>{fps || "—"}<small> FPS</small></strong></div>
            <div><span>RENDER QUALITY</span><strong>{quality}</strong></div>
            <div><span>VIEWPORT</span><strong>{viewport}</strong></div>
            <div><span>VISUAL MODE</span><strong>{aura.toUpperCase()}</strong></div>
            <div><span>LCP</span><strong>{lcpText}<small>{lcpUnit}</small></strong></div>
            <div><span>CLS</span><strong>{cls.toFixed(3)}</strong></div>
            <div><span>LONG TASKS</span><strong>{longTasks}</strong></div>
            <div><span>XRAY</span><strong>{xray ? "ON" : "OFF"}</strong></div>
            <div><span>INPUT</span><strong>{typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 ? "TOUCH + POINTER" : "POINTER"}</strong></div>
            <div><span>BROWSER FEATURES</span><strong>{online}/{capabilities.length || 6}</strong></div>
          </div>

          <div className="lab-scope" aria-hidden="true">
            {Array.from({ length: 22 }).map((_, index) => <i key={index} style={{ "--bar": `${26 + ((index * 37) % 68)}%` } as React.CSSProperties} />)}
            <span className="scope-scan" />
          </div>
          <div className="lab-log"><span>LAST ACTION</span><code>{lastAction}</code></div>
        </div>

        <div className="lab-controls">
          <div className="lab-panel-head"><span>VISUAL FIELD</span><b>INTERACTIVE</b></div>
          <label className="energy-control">
            <span><b>INTENSITY</b><em>{energy.toFixed(2)}×</em></span>
            <input type="range" min="0.55" max="1.55" step="0.05" value={energy} onChange={(event) => { const value = Number(event.target.value); setEnergy(value); setLastAction(`Visual intensity changed to ${value.toFixed(2)}×.`); }} />
          </label>
          <button className="burst-button" onClick={burstCore} data-cursor="signal"><span>TRIGGER</span><b>PULSE THE FIELD ↗</b></button>
          <div className="lab-shortcuts">
            <span><kbd>/</kbd> open quick navigation</span>
            <span><kbd>A</kbd> change visual mode</span>
            <span><kbd>X</kbd> inspect the interface</span>
            <span><kbd>ESC</kbd> close an open project</span>
          </div>
        </div>
      </div>

      <div className="lab-layers" data-rise>
        <div className="lab-panel-head"><span>HOW IT&apos;S BUILT</span><b>{portfolioSystem.version}</b></div>
        <div className="layer-grid">
          {portfolioSystem.layers.map((layer, index) => (
            <article key={layer.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
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
          <span className="lab-kicker">REAL BROWSER CHECK</span>
          <h3>WHAT CAN THIS<br />BROWSER ACTUALLY DO?</h3>
          <p>The results come from this browser at runtime. Optional APIs fall back cleanly instead of becoming requirements.</p>
          <button onClick={runSelfTest} disabled={testing} data-cursor="signal">{testing ? "CHECKING…" : "RUN BROWSER CHECK"} <span>↗</span></button>
        </div>
        <div className="capability-stack">
          {capabilities.map((item, index) => {
            const visible = !testing || index < revealed;
            return (
              <div className={visible ? "capability-row visible" : "capability-row"} key={item.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                <b className={item.available ? "cap-online" : item.optional ? "cap-fallback" : "cap-offline"}>{item.available ? "AVAILABLE" : item.optional ? "FALLBACK" : "UNAVAILABLE"}</b>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

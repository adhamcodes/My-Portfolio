"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type Probe = { label: string; value: string; ok: boolean };
type MemoryState = { returning: boolean; visits: number; worlds: number; aura: string; protocol: boolean };

function probeSystem(): Probe[] {
  let webgl2 = false;
  try { const canvas = document.createElement("canvas"); webgl2 = Boolean(canvas.getContext("webgl2")); } catch {}
  let storage = false;
  try { const key = "adham:init-probe"; localStorage.setItem(key, "1"); localStorage.removeItem(key); storage = true; } catch {}
  const viewTransitions = "startViewTransition" in document;
  const audio = "AudioContext" in window || "webkitAudioContext" in window;
  const gpu = "gpu" in navigator;
  const cores = navigator.hardwareConcurrency || 0;
  return [
    { label: "3D", value: webgl2 ? "WEBGL 2 READY" : "STATIC FALLBACK", ok: true },
    { label: "TRANSITIONS", value: viewTransitions ? "NATIVE API" : "MOTION FALLBACK", ok: true },
    { label: "SOUND", value: audio ? "WEB AUDIO AVAILABLE" : "SILENT MODE", ok: true },
    { label: "MEMORY", value: storage ? "LOCAL STORAGE READY" : "SESSION ONLY", ok: true },
    { label: "DEVICE", value: `${cores || "?"} THREADS · ${gpu ? "WEBGPU DETECTED" : "WEBGL PATH"}`, ok: true },
  ];
}

export default function InitializationSequence() {
  const [visible, setVisible] = useState(false);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [complete, setComplete] = useState(false);
  const [memory, setMemory] = useState<MemoryState>({ returning: false, visits: 1, worlds: 0, aura: "PULSE", protocol: false });
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("adham:init-seen") === "1") return;
      const previousVisits = Number.parseInt(localStorage.getItem("adham:visit-count") || "0", 10) || 0;
      const seen = JSON.parse(localStorage.getItem("adham:visited-worlds") || "[]") as unknown;
      const worlds = Array.isArray(seen) ? seen.length : 0;
      const aura = (localStorage.getItem("adham:aura") || "pulse").toUpperCase();
      const protocol = localStorage.getItem("adham:protocol-aura") === "unlocked";
      const visits = previousVisits + 1;
      localStorage.setItem("adham:visit-count", String(visits));
      localStorage.setItem("adham:last-seen", new Date().toISOString());
      setMemory({ returning: previousVisits > 0, visits, worlds, aura, protocol });
    } catch {}

    setVisible(true);
    setProbes(probeSystem());
    const done = window.setTimeout(() => setComplete(true), reduced ? 0 : 280);
    const close = window.setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem("adham:init-seen", "1"); } catch {}
    }, reduced ? 120 : 1380);
    return () => { window.clearTimeout(done); window.clearTimeout(close); };
  }, [reduced]);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem("adham:init-seen", "1"); } catch {}
  };

  useEffect(() => {
    if (!visible) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === "Escape" || event.key === " ") dismiss(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="initialization" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: reduced ? .01 : .28 }} role="status" aria-live="polite" onClick={dismiss}>
          <div className="init-grid" aria-hidden="true" />
          <div className="init-core" aria-hidden="true"><i /><i /><i /></div>
          <div className="init-shell">
            <div className="init-head"><span>ADHAM MAHMOOD / INTERACTIVE PORTFOLIO</span><b>{complete ? memory.returning ? "WELCOME BACK" : "READY" : "CHECKING YOUR BROWSER"}</b></div>
            <div className="init-title">{memory.returning ? <>WELCOME<br /><em>BACK.</em></> : <>SETTING<br /><em>THE STAGE.</em></>}</div>
            {memory.returning && (
              <div className="init-memory">
                <div><span>VISIT</span><b>{String(memory.visits).padStart(2, "0")}</b></div>
                <div><span>PROJECTS SEEN</span><b>{memory.worlds}</b></div>
                <div><span>VISUAL MODE</span><b>{memory.aura}</b></div>
                <div><span>HIDDEN LAYER</span><b>{memory.protocol ? "FOUND" : "NOT YET"}</b></div>
              </div>
            )}
            <div className="init-probes">
              {probes.map((probe, index) => (
                <motion.div key={probe.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : index * .05, duration: .22 }}>
                  <span>{probe.label}</span><strong>{probe.value}</strong><i className={probe.ok ? "ok" : ""} />
                </motion.div>
              ))}
            </div>
            <div className="init-foot"><span>{memory.returning ? "LOCAL MEMORY RESTORED ON THIS BROWSER" : "REAL CAPABILITY CHECKS · NO FAKE LOADER"}</span><em>CLICK / ENTER TO SKIP</em></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

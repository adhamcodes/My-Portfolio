"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type Probe = { label: string; value: string; ok: boolean };

function probeSystem(): Probe[] {
  let webgl2 = false;
  try {
    const canvas = document.createElement("canvas");
    webgl2 = Boolean(canvas.getContext("webgl2"));
  } catch {}

  let storage = false;
  try {
    const key = "adham:init-probe";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    storage = true;
  } catch {}

  const viewTransitions = "startViewTransition" in document;
  const audio = "AudioContext" in window || "webkitAudioContext" in window;
  const gpu = "gpu" in navigator;
  const cores = navigator.hardwareConcurrency || 0;

  return [
    { label: "RENDERER", value: webgl2 ? "WEBGL2 / ONLINE" : "FALLBACK / READY", ok: true },
    { label: "TRANSITIONS", value: viewTransitions ? "NATIVE / READY" : "MOTION / FALLBACK", ok: true },
    { label: "AUDIO", value: audio ? "SYNTH / AVAILABLE" : "SILENT MODE", ok: true },
    { label: "STATE", value: storage ? "LOCAL / PERSISTENT" : "SESSION / EPHEMERAL", ok: true },
    { label: "COMPUTE", value: `${cores || "?"} THREADS / ${gpu ? "WEBGPU SIGNAL" : "WEBGL PATH"}`, ok: true },
  ];
}

export default function InitializationSequence() {
  const [visible, setVisible] = useState(false);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [complete, setComplete] = useState(false);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("adham:init-seen") === "1") return;
    } catch {}

    setVisible(true);
    const result = probeSystem();
    setProbes(result);

    const done = window.setTimeout(() => setComplete(true), reduced ? 0 : 260);
    const close = window.setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem("adham:init-seen", "1"); } catch {}
    }, reduced ? 120 : 1180);

    return () => {
      window.clearTimeout(done);
      window.clearTimeout(close);
    };
  }, [reduced]);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem("adham:init-seen", "1"); } catch {}
  };

  useEffect(() => {
    if (!visible) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape" || event.key === " ") dismiss();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="initialization"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: reduced ? 0.01 : 0.28 }}
          role="status"
          aria-live="polite"
          onClick={dismiss}
        >
          <div className="init-grid" aria-hidden="true" />
          <div className="init-core" aria-hidden="true"><i /><i /><i /></div>
          <div className="init-shell">
            <div className="init-head">
              <span>ADHAM / AURA SYSTEM</span>
              <b>{complete ? "SYSTEM COHERENT" : "NEGOTIATING CAPABILITIES"}</b>
            </div>
            <div className="init-title">LIVE IDENTITY<br /><em>BOOT VECTOR</em></div>
            <div className="init-probes">
              {probes.map((probe, index) => (
                <motion.div
                  key={probe.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduced ? 0 : index * 0.055, duration: 0.24 }}
                >
                  <span>{probe.label}</span><strong>{probe.value}</strong><i className={probe.ok ? "ok" : ""} />
                </motion.div>
              ))}
            </div>
            <div className="init-foot"><span>{complete ? "ENTERING BUILD STATE" : "REAL RUNTIME PROBES / NO FAKE LOADER"}</span><em>CLICK / ENTER TO SKIP</em></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

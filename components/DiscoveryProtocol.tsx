"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/site";

export default function DiscoveryProtocol() {
  const [active, setActive] = useState(false);
  const unlocked = useRef(false);
  const dismissTimer = useRef<number | null>(null);
  const probeTimer = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => {
      if (unlocked.current) return;
      try {
        if (localStorage.getItem("adham:familiarity-complete") === "1") {
          unlocked.current = true;
          return;
        }
        const seen = JSON.parse(localStorage.getItem("adham:visited-worlds") || "[]") as unknown;
        if (!Array.isArray(seen) || seen.length < projects.length) return;
        localStorage.setItem("adham:familiarity-complete", "1");
      } catch { return; }

      unlocked.current = true;
      setActive(true);
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: `YOU FOUND ALL ${projects.length} PROJECTS` }));
      window.dispatchEvent(new CustomEvent("aura:burst"));
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
      dismissTimer.current = window.setTimeout(() => setActive(false), 4200);
    };

    unlock();
    const onSignal = () => {
      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current);
      probeTimer.current = window.setTimeout(unlock, 0);
    };
    window.addEventListener("aura:signal", onSignal);
    return () => {
      window.removeEventListener("aura:signal", onSignal);
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div className="familiarity-unlock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
          <motion.div initial={{ scale: .95, y: 12 }} animate={{ scale: 1, y: 0 }}>
            <span>5 / 5 PROJECTS EXPLORED</span>
            <strong>YOU FOUND<br />EVERYTHING.</strong>
            <b>100%</b>
            <em>This browser will remember where you have been.</em>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

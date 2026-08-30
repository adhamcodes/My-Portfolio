"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/site";

export default function DiscoveryProtocol() {
  const [active, setActive] = useState(false);
  const unlocked = useRef(false);

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
      } catch {
        return;
      }
      unlocked.current = true;
      setActive(true);
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: "SYSTEM FAMILIARITY / 100% / ALL WORLDS MAPPED" }));
      window.dispatchEvent(new CustomEvent("aura:burst"));
      window.setTimeout(() => setActive(false), 4200);
    };

    unlock();
    const onSignal = (event: Event) => {
      const value = (event as CustomEvent<string>).detail || "";
      if (value.startsWith("MEMORY /")) window.setTimeout(unlock, 0);
    };
    window.addEventListener("aura:signal", onSignal as EventListener);
    return () => window.removeEventListener("aura:signal", onSignal as EventListener);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div className="familiarity-unlock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
          <motion.div initial={{ scale: .94, y: 12 }} animate={{ scale: 1, y: 0 }}>
            <span>MEMORY PROTOCOL / COMPLETE</span>
            <strong>SYSTEM<br />FAMILIARITY</strong>
            <b>100%</b>
            <em>ALL PROJECT WORLDS MAPPED / RETURN STATE UPGRADED</em>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

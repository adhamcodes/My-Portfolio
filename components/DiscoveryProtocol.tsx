"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function DiscoveryProtocol({ mapped, total }: { mapped: number; total: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!total || mapped < total) return;
    try {
      if (localStorage.getItem("adham:familiarity-complete") === "1") return;
      localStorage.setItem("adham:familiarity-complete", "1");
    } catch {}
    setActive(true);
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: "SYSTEM FAMILIARITY / 100% / ALL WORLDS MAPPED" }));
    window.dispatchEvent(new CustomEvent("aura:burst"));
    const timer = window.setTimeout(() => setActive(false), 4200);
    return () => window.clearTimeout(timer);
  }, [mapped, total]);

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

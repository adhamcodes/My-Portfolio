"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export default function CursorSystem() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.45 });
  const sy = useSpring(y, { stiffness: 420, damping: 34, mass: 0.45 });
  const [mode, setMode] = useState("idle");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    setEnabled(fine);
    if (!fine) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      setMode(target?.dataset.cursor || "idle");
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div className={`cursor-dot cursor-${mode}`} style={{ x, y }} />
      <motion.div className={`cursor-orbit cursor-${mode}`} style={{ x: sx, y: sy }}>
        <span>{mode === "enter" ? "ENTER" : mode === "open" ? "OPEN" : mode === "signal" ? "SIGNAL" : ""}</span>
      </motion.div>
    </>
  );
}

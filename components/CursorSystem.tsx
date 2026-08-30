"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export default function CursorSystem() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 390, damping: 32, mass: .42 });
  const sy = useSpring(y, { stiffness: 390, damping: 32, mass: .42 });
  const [mode, setMode] = useState("idle");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    setEnabled(fine);
    if (!fine) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = (event.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      setMode(target?.dataset.cursor || "idle");
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;
  const label = mode === "enter" ? "OPEN" : mode === "open" ? "BACK" : "";

  return (
    <>
      <motion.div className={`cursor-dot cursor-${mode}`} style={{ x, y }} />
      <motion.div className={`cursor-orbit cursor-${mode}`} style={{ x: sx, y: sy }}><span>{label}</span></motion.div>
    </>
  );
}

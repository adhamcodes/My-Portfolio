"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import DiscoveryProtocol from "@/components/DiscoveryProtocol";

const code = "aura";

export default function SecretProtocol() {
  const buffer = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;
      buffer.current = `${buffer.current}${key}`.slice(-code.length);
      if (buffer.current !== code) return;

      setActive(true);
      document.documentElement.dataset.protocol = "overdrive";
      window.dispatchEvent(new CustomEvent("aura:burst"));
      window.dispatchEvent(new CustomEvent("aura:protocol", { detail: "overdrive" }));
      window.dispatchEvent(new CustomEvent("aura:signal", { detail: "HIDDEN PROTOCOL / FIELD OVERDRIVE" }));
      try { localStorage.setItem("adham:protocol-aura", "unlocked"); } catch {}
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setActive(false);
        delete document.documentElement.dataset.protocol;
      }, 5200);
      buffer.current = "";
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
      delete document.documentElement.dataset.protocol;
    };
  }, []);

  return (
    <>
      <DiscoveryProtocol />
      <AnimatePresence>
        {active && (
          <motion.div className="protocol-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
            <div className="protocol-cross p1" /><div className="protocol-cross p2" /><div className="protocol-cross p3" /><div className="protocol-cross p4" />
            <motion.div className="protocol-message" initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <span>HIDDEN PROTOCOL / 04</span>
              <strong>AURA<br />OVERRIDE</strong>
              <em>SIGNAL ACCEPTED / FIELD OVERDRIVE</em>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

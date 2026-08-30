"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { auraModes, projects, type AuraMode, type Project } from "@/data/site";

type Props = {
  aura: AuraMode;
  xray: boolean;
  visited: string[];
  onAura: (mode: AuraMode) => void;
  onXray: () => void;
  onProject: (project: Project) => void;
};

export default function OperatorDeck({ aura, xray, visited, onAura, onXray, onProject }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const quality = typeof document !== "undefined" ? document.documentElement.dataset.quality || "CALIBRATING" : "CALIBRATING";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (!typing && event.key === "/") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add("deck-open");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", trap);
      document.body.classList.remove("deck-open");
      if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
      else triggerRef.current?.focus();
    };
  }, [open]);

  const navigation = [
    ["INTRO", "#origin"],
    ["RIGHT NOW", "#state"],
    ["SELECTED WORK", "#work"],
    ["WHERE THIS GOES", "#trajectory"],
    ["UNDER THE HOOD", "#machine"],
    ["CONTACT", "#contact"],
  ] as const;

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) => `${project.name} ${project.kind} ${project.chapter}`.toLowerCase().includes(normalized));
  }, [query]);

  const go = (selector: string) => {
    setOpen(false);
    window.setTimeout(() => document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <>
      <button ref={triggerRef} className="deck-trigger" onClick={() => setOpen(true)} data-cursor="signal" aria-label="Open quick navigation">
        <span>DECK</span><kbd>⌘K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="operator-deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="deck-backdrop" onClick={() => setOpen(false)} aria-label="Close quick navigation" />
            <motion.div
              ref={panelRef}
              className="deck-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Quick navigation"
              initial={{ opacity: 0, scale: .97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .985, y: 8 }}
              transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="deck-head">
                <div><span>ADHAM MAHMOOD</span><b>QUICK NAVIGATION</b></div>
                <div className="deck-status"><i /><span>{quality.toUpperCase()} RENDER</span><span>{visited.length}/{projects.length} PROJECTS SEEN</span></div>
              </header>
              <label className="deck-search">
                <span>⌕</span>
                <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects or sections…" />
                <kbd>ESC</kbd>
              </label>

              <div className="deck-grid">
                <section>
                  <div className="deck-label">GO TO</div>
                  {navigation.map(([label, selector], index) => (
                    <button key={selector} onClick={() => go(selector)}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b><em>↘</em></button>
                  ))}
                </section>
                <section>
                  <div className="deck-label">VISUAL MODE</div>
                  {auraModes.map((mode) => (
                    <button key={mode.id} className={aura === mode.id ? "active" : ""} onClick={() => onAura(mode.id)}><span>●</span><b>{mode.label}</b><em>{mode.note}</em></button>
                  ))}
                  <button className={xray ? "active" : ""} onClick={onXray}><span>⌁</span><b>XRAY</b><em>{xray ? "ON" : "OFF"}</em></button>
                </section>
              </div>

              <section className="deck-projects">
                <div className="deck-label">PROJECTS</div>
                <div>
                  {filteredProjects.map((project) => (
                    <button key={project.id} onClick={() => { setOpen(false); onProject(project); }}>
                      <span className={`deck-orb orb-${project.accent}`} />
                      <b>{project.name}</b>
                      <small>{project.kind}</small>
                      <em>{visited.includes(project.id) ? "SEEN" : project.state === "verified" ? "LIVE" : project.state.toUpperCase()}</em>
                    </button>
                  ))}
                  {filteredProjects.length === 0 && <p className="deck-empty">Nothing matched.</p>}
                </div>
              </section>

              <footer className="deck-foot"><span>/ opens this</span><span>A changes visual mode</span><span>X toggles XRAY</span><span>Everything here is keyboard reachable.</span></footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

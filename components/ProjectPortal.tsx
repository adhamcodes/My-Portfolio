"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/site";

export default function ProjectPortal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add("portal-open");
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !stageRef.current) return;
      const focusable = Array.from(
        stageRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
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

    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove("portal-open");
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className={`project-portal portal-${project.accent} portal-${project.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} case study`}
        >
          <motion.div
            ref={stageRef}
            className="portal-stage"
            initial={{ clipPath: "inset(48% 48% 48% 48% round 40px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
            exit={{ clipPath: "inset(48% 48% 48% 48% round 40px)" }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="portal-grid" />
            <div className="portal-orbit orbit-a" />
            <div className="portal-orbit orbit-b" />
            <div className="portal-signature" aria-hidden="true"><span>{project.chapter}</span><i /></div>

            <header className="portal-nav">
              <span>{project.chapter}</span>
              <button ref={closeRef} onClick={onClose} data-cursor="open">CLOSE <b>×</b></button>
            </header>

            <div className="portal-scroll">
              <section className="portal-hero">
                <span className="portal-kicker">{project.kind} / {project.state.toUpperCase()}</span>
                <h2>{project.name}</h2>
                <p>{project.oneLine}</p>
                <div className="portal-actions">
                  {project.live && <a href={project.live} target="_blank" rel="noreferrer">LIVE SYSTEM ↗</a>}
                  {project.repo && <a href={project.repo} target="_blank" rel="noreferrer">SOURCE ↗</a>}
                </div>
              </section>

              <section className="portal-dossier">
                <div><span>01 / PROBLEM</span><p>{project.problem}</p></div>
                <div><span>02 / CONSTRAINT</span><p>{project.constraint}</p></div>
                <div><span>03 / DECISION</span><p>{project.decision}</p></div>
              </section>

              <section className="portal-architecture">
                <div className="portal-section-label">SYSTEM / ARCHITECTURE</div>
                <div className="architecture-chain">
                  {project.architecture.map((item, index) => (
                    <div className="architecture-node" key={item}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item}</strong>
                      {index < project.architecture.length - 1 && <i />}
                    </div>
                  ))}
                </div>
              </section>

              <section className="portal-proof">
                <div className="portal-section-label">PROOF / WHAT EXISTS</div>
                <div className="proof-cloud">
                  {project.proof.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <span>0{index + 1}</span>{item}
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

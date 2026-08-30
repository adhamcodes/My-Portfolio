"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import type { Project } from "@/data/site";

export default function ProjectPortal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.classList.add("portal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("portal-open");
      window.removeEventListener("keydown", onKey);
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
              <button onClick={onClose} data-cursor="open">CLOSE <b>×</b></button>
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

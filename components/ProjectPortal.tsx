"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import WorldEngine from "@/components/WorldEngine";
import type { Project, StageState } from "@/data/site";

const entryMasks: Record<string, string> = {
  foundry180: "inset(47% 6% 47% 6% round 26px)",
  "aura-system": "circle(4% at 50% 50%)",
  zeroupload: "inset(0% 49% 0% 49% round 32px)",
  windowbiome: "inset(16% 28% 16% 28% round 18px)",
  nova: "circle(3% at 72% 42%)",
};

function statusLabel(state: StageState) {
  if (state === "verified") return "LIVE";
  if (state === "active") return "IN PROGRESS";
  if (state === "building") return "BUILDING";
  if (state === "next") return "NEXT";
  return "FUTURE";
}

export default function ProjectPortal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [shareState, setShareState] = useState("SHARE");

  useEffect(() => {
    setShareState("SHARE");
    if (!project) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add("portal-open");
    document.documentElement.dataset.portal = project.id;
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `OPENED · ${project.name.toUpperCase()}` }));
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !stageRef.current) return;
      const focusable = Array.from(
        stageRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'),
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
      delete document.documentElement.dataset.portal;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
    };
  }, [project, onClose]);

  const share = async () => {
    if (!project) return;
    const url = new URL(window.location.href);
    url.searchParams.set("system", project.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${project.name} — Adham Mahmood`, text: project.oneLine, url: url.toString() });
        setShareState("SHARED");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setShareState("LINK COPIED");
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url.toString());
          setShareState("LINK COPIED");
        } catch {
          setShareState("COPY FAILED");
        }
      }
    }
    window.setTimeout(() => setShareState("SHARE"), 1700);
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className={`project-portal portal-${project.accent} portal-${project.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .24 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} project`}
        >
          <motion.div
            ref={stageRef}
            className="portal-stage"
            initial={{ clipPath: entryMasks[project.id] || "inset(48% 48% 48% 48% round 40px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
            exit={{ clipPath: entryMasks[project.id] || "inset(48% 48% 48% 48% round 40px)" }}
            transition={{ duration: project.id === "nova" ? .92 : .68, ease: project.id === "foundry180" ? [0.16, 1, 0.3, 1] : [0.22, 1, 0.36, 1] }}
          >
            <div className="portal-grid" />
            <div className="portal-orbit orbit-a" />
            <div className="portal-orbit orbit-b" />
            <div className="portal-signature" aria-hidden="true"><span>{project.chapter}</span><i /></div>

            <header className="portal-nav">
              <span>{project.chapter}</span>
              <div className="portal-nav-actions">
                <button onClick={share} data-cursor="signal">{shareState}</button>
                <button ref={closeRef} onClick={onClose} data-cursor="open">CLOSE <b>×</b></button>
              </div>
            </header>

            <div className="portal-scroll">
              <section className="portal-hero">
                <span className="portal-kicker">{project.kind} · {statusLabel(project.state)}</span>
                <h2>{project.name}</h2>
                <p>{project.oneLine}</p>
                <div className="portal-actions">
                  {project.live && <a href={project.live} target="_blank" rel="noreferrer">OPEN LIVE ↗</a>}
                  {project.repo && <a href={project.repo} target="_blank" rel="noreferrer">VIEW SOURCE ↗</a>}
                </div>
              </section>

              <section className="portal-world-lab">
                <div className="portal-section-label">INTERACTIVE MODEL</div>
                <WorldEngine project={project} />
              </section>

              <section className="portal-dossier">
                <div><span>THE PROBLEM</span><p>{project.problem}</p></div>
                <div><span>THE CONSTRAINT</span><p>{project.constraint}</p></div>
                <div><span>THE DECISION</span><p>{project.decision}</p></div>
              </section>

              <section className="portal-architecture">
                <div className="portal-section-label">HOW IT&apos;S BUILT</div>
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

              <section className="portal-field-notes">
                <article>
                  <span>WHAT I LEARNED</span>
                  <p>{project.principle}</p>
                </article>
                <article>
                  <span>WHAT&apos;S NEXT</span>
                  <p>{project.next}</p>
                </article>
              </section>

              <section className="portal-proof">
                <div className="portal-section-label">WHAT EXISTS</div>
                <div className="proof-cloud">
                  {project.proof.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ delay: index * .05 }}
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

"use client";

import { useEffect, useRef, useState } from "react";

const destinations = [
  { id: "now", label: "NOW", detail: "Current frame" },
  { id: "work", label: "WORK", detail: "ZeroUpload · Quiet later, when cleared" },
  { id: "growth", label: "GROWTH", detail: "Software engineering · AI/ML · Automation" },
  { id: "history", label: "HISTORY", detail: "Earlier work and preserved change" },
  { id: "present", label: "CONTACT", detail: "The present frame" },
] as const;

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export default function Index() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("now");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const onChapter = (event: Event) => {
      const chapter = (event as CustomEvent<string>).detail;
      const mapped = chapter === "human" ? "now" : chapter === "present" ? "present" : chapter;
      if (destinations.some((item) => item.id === mapped)) setCurrent(mapped);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (!open && event.key.toLowerCase() === "i" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("keydown", onKeyDown);
    root.dataset.indexOpen = open ? "true" : "false";
    window.dispatchEvent(new CustomEvent("adham:index", { detail: { open } }));

    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus());
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("adham:chapter", onChapter);
        window.removeEventListener("keydown", onKeyDown);
      };
    }

    triggerRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const travel = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="index-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="world-index"
        onClick={() => setOpen(true)}
      >
        INDEX <span aria-hidden="true">I</span>
      </button>

      {open && (
        <div className="index-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div
            ref={dialogRef}
            id="world-index"
            className="index-world"
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio index"
          >
            <div className="index-heading">
              <p>THE WORLD / CURRENT STRUCTURE</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close index">CLOSE <span aria-hidden="true">ESC</span></button>
            </div>

            <nav className="index-map" aria-label="Portfolio destinations">
              <span className="index-axis" aria-hidden="true" />
              {destinations.map((item, index) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="index-destination"
                  data-current={current === item.id ? "true" : "false"}
                  style={{ "--index-order": index } as React.CSSProperties}
                  onClick={(event) => {
                    event.preventDefault();
                    travel(item.id);
                  }}
                >
                  <span className="index-node" aria-hidden="true" />
                  <span className="index-label">{item.label}</span>
                  <span className="index-detail">{item.detail}</span>
                </a>
              ))}
            </nav>

            <p className="index-footnote">The map stays simple. The world around it can be strange.</p>
          </div>
        </div>
      )}
    </>
  );
}

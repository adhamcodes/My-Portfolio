"use client";

import { useEffect, useRef, useState } from "react";
import { masterIdentity } from "@/content/master";

const destinations = [
  { id: "now", label: "NOW", detail: "Current frame" },
  { id: "work", label: "WORK", detail: "Featured work" },
  { id: "growth", label: "GROWTH", detail: "Learning and direction" },
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

function focusableWithin(node: HTMLElement | null) {
  if (!node) return [] as HTMLElement[];
  return Array.from(node.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
}

function mapChapter(chapter: string | undefined): string {
  if (chapter === "human") return "now";
  if (chapter === "present") return "present";
  if (chapter && destinations.some((item) => item.id === chapter)) return chapter;
  return "now";
}

export default function Index() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("now");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasOpened = useRef(false);

  useEffect(() => {
    setCurrent(mapChapter(document.documentElement.dataset.chapter));

    const onChapter = (event: Event) => {
      const chapter = (event as CustomEvent<string>).detail;
      setCurrent(mapChapter(chapter));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!open && event.key.toLowerCase() === "i" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.indexOpen = open ? "true" : "false";
    window.dispatchEvent(new CustomEvent("adham:index", { detail: { open } }));

    if (!open) {
      document.body.style.removeProperty("overflow");
      if (hasOpened.current) triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    hasOpened.current = true;
    const previousOverflow = document.body.style.overflow;
    const background = [
      document.querySelector<HTMLElement>(".hero-v2"),
      document.getElementById("main-story"),
    ].filter((node): node is HTMLElement => Boolean(node));

    document.body.style.overflow = "hidden";
    for (const node of background) node.setAttribute("inert", "");
    requestAnimationFrame(() => focusableWithin(dialogRef.current)[0]?.focus());

    const onDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableWithin(dialogRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const node of background) node.removeAttribute("inert");
      window.removeEventListener("keydown", onDialogKey);
    };
  }, [open]);

  const travel = (id: string) => {
    const reduced = document.documentElement.dataset.motionMode === "reduced";
    setOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }));
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
        <div
          className="index-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            id="world-index"
            className="index-world"
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio index"
          >
            <div className="index-heading">
              <p>INDEX</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close index">
                CLOSE <span aria-hidden="true">ESC</span>
              </button>
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

            <a
              className="index-external"
              href={masterIdentity.github}
              target="_blank"
              rel="noreferrer"
            >
              <span>GITHUB ↗</span>
              <small>Workshop / archive</small>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

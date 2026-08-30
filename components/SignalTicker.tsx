"use client";

import { useEffect, useRef, useState } from "react";

const messages = [
  "WORKING SYSTEMS > CLAIMS",
  "CURRENT SIGNAL / FOUNDRY180",
  "CORE DIRECTOR / SCENE AWARE",
  "AURA / PERSONALITY NOT PALETTE",
  "RUNTIME QUALITY / DEVICE NEGOTIATED",
  "PROJECT WORLDS / MEMORY ENABLED",
  "THE SYSTEM CHANGES WITH THE WORK",
  "SOME PROTOCOLS REMAIN SEALED",
];

export default function SignalTicker() {
  const [message, setMessage] = useState(messages[0]);
  const index = useRef(0);
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rotate = window.setInterval(() => {
      index.current = (index.current + 1) % messages.length;
      setMessage(messages[index.current]);
    }, 3600);
    const onSignal = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (!value) return;
      setMessage(value);
      if (liveTimer.current) window.clearTimeout(liveTimer.current);
      liveTimer.current = window.setTimeout(() => {
        index.current = (index.current + 1) % messages.length;
        setMessage(messages[index.current]);
      }, 2600);
    };
    window.addEventListener("aura:signal", onSignal as EventListener);
    return () => {
      window.clearInterval(rotate);
      if (liveTimer.current) window.clearTimeout(liveTimer.current);
      window.removeEventListener("aura:signal", onSignal as EventListener);
    };
  }, []);

  return (
    <div className="signal-ticker" aria-live="off">
      <span className="ticker-led" />
      <span key={message} className="ticker-message">{message}</span>
    </div>
  );
}

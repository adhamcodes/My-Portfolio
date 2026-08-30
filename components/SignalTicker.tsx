"use client";

import { useEffect, useRef, useState } from "react";

const messages = [
  "BUILDING FOUNDRY180",
  "THIS SITE ADAPTS TO YOUR DEVICE",
  "PROJECTS REMEMBER WHAT YOU OPEN",
  "PRESS X TO SEE THE WIRES",
  "THE VISUAL FIELD CHANGES WITH THE PAGE",
  "SOUND IS PROCEDURAL, NOT A LOOPED TRACK",
  "THIS PORTFOLIO CHANGES WITH THE WORK",
  "SOME DETAILS ARE STILL HIDING",
];

export default function SignalTicker() {
  const [message, setMessage] = useState(messages[0]);
  const index = useRef(0);
  const liveTimer = useRef<number | null>(null);

  useEffect(() => {
    const rotate = window.setInterval(() => {
      index.current = (index.current + 1) % messages.length;
      setMessage(messages[index.current]);
    }, 4100);
    const onSignal = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (!value) return;
      setMessage(value);
      if (liveTimer.current !== null) window.clearTimeout(liveTimer.current);
      liveTimer.current = window.setTimeout(() => {
        index.current = (index.current + 1) % messages.length;
        setMessage(messages[index.current]);
      }, 2800);
    };
    window.addEventListener("aura:signal", onSignal as EventListener);
    return () => {
      window.clearInterval(rotate);
      if (liveTimer.current !== null) window.clearTimeout(liveTimer.current);
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

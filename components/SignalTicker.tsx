"use client";

import { useEffect, useState } from "react";

const messages = [
  "BUILDING THE ENGINEER BEFORE THE TITLE",
  "CURRENT SIGNAL: FOUNDRY180",
  "SYSTEMS > BADGES",
  "AURA IS A FEATURE",
  "THE SITE MUTATES WITH THE WORK",
];

export default function SignalTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % messages.length), 3400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="signal-ticker">
      <span className="ticker-led" />
      <span key={index} className="ticker-message">{messages[index]}</span>
    </div>
  );
}

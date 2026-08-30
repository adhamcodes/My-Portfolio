"use client";

import { useEffect } from "react";

export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Aura System boundary:", error);
  }, [error]);

  return (
    <main className="system-error">
      <div className="system-error-shell">
        <span>FAULT / APPLICATION BOUNDARY</span>
        <h1>SIGNAL<br />INTERRUPTED.</h1>
        <p>The presentation layer hit an unexpected state. The recovery control below reinitializes this route without pretending nothing happened.</p>
        <button onClick={reset}>REINITIALIZE SYSTEM ↗</button>
        {error.digest && <code>TRACE / {error.digest}</code>}
      </div>
    </main>
  );
}

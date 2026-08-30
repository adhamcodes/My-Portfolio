"use client";

import { useEffect } from "react";

export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Portfolio application boundary:", error);
  }, [error]);

  return (
    <main className="system-error">
      <div className="system-error-shell">
        <span>APPLICATION ERROR</span>
        <h1>SOMETHING<br />BROKE.</h1>
        <p>The page hit an unexpected state. Try the recovery control below without losing the rest of the experience.</p>
        <button onClick={reset}>TRY AGAIN ↗</button>
        {error.digest && <code>ERROR ID / {error.digest}</code>}
      </div>
    </main>
  );
}

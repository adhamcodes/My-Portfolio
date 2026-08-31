"use client";

import { useEffect } from "react";

export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Portfolio error boundary:", error);
  }, [error]);

  return (
    <main className="master-system-state">
      <div className="master-system-inner">
        <p className="master-system-label">Something went wrong</p>
        <h1>The page hit an unexpected state.</h1>
        <p>Try again. If the problem persists, the rest of the portfolio should still remain reachable from a fresh load.</p>
        <button type="button" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}

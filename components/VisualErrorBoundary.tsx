"use client";

import React from "react";

type State = { failed: boolean };

export default class VisualErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Aura visual layer entered fallback mode:", error.message);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="aura-fallback aura-fallback-error" aria-hidden="true">
          <div className="fallback-core" />
        </div>
      );
    }
    return this.props.children;
  }
}

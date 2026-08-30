import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, background: "#05070b", color: "#f2eee4" }}>
      <div style={{ width: "min(900px, 100%)", borderTop: "1px solid rgba(255,255,255,.12)", borderBottom: "1px solid rgba(255,255,255,.12)", padding: "70px 0" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".18em", color: "#ff4d7e" }}>ERROR / LOST SIGNAL / 404</span>
        <h1 style={{ fontSize: "clamp(64px, 13vw, 170px)", lineHeight: .76, letterSpacing: "-.08em", margin: "30px 0" }}>NOT IN<br />THE SYSTEM.</h1>
        <p style={{ maxWidth: 520, lineHeight: 1.7, color: "#8e96a6" }}>This coordinate does not exist in the current build state. The system may have moved while you were looking at it.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 28, border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "12px 18px", fontFamily: "monospace", fontSize: 10, letterSpacing: ".08em" }}>RETURN TO CORE ↗</Link>
      </div>
    </main>
  );
}

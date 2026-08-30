import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, background: "#05070b", color: "#f2eee4" }}>
      <div style={{ width: "min(900px, 100%)", borderTop: "1px solid rgba(255,255,255,.12)", borderBottom: "1px solid rgba(255,255,255,.12)", padding: "70px 0" }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: ".12em", color: "#ff5f88", fontWeight: 600 }}>404 / PAGE NOT FOUND</span>
        <h1 style={{ fontSize: "clamp(64px, 13vw, 170px)", lineHeight: .76, letterSpacing: "-.08em", margin: "30px 0" }}>NOT HERE.<br />KEEP MOVING.</h1>
        <p style={{ maxWidth: 520, lineHeight: 1.7, color: "#9ca3ae", fontSize: 16 }}>That page does not exist, or it moved while the portfolio changed.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 28, border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "12px 18px", fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: ".07em", fontWeight: 600 }}>BACK TO THE PORTFOLIO ↗</Link>
      </div>
    </main>
  );
}

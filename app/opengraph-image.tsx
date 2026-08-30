import { ImageResponse } from "next/og";
import { identity } from "@/data/site";

export const alt = "Adham Mahmood — Aura System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#05070b",
          color: "#f2eee4",
          padding: "58px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 999, right: -80, top: -90, background: "radial-gradient(circle, rgba(255,77,126,.38), rgba(85,216,255,.12) 38%, transparent 70%)" }} />
        <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 999, right: 80, top: 115, border: "1px solid rgba(255,255,255,.16)" }} />
        <div style={{ position: "absolute", width: 250, height: 250, borderRadius: 999, right: 135, top: 170, border: "1px dashed rgba(168,135,255,.35)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "linear-gradient(90deg,#ff4d7e,#55d8ff,#ffb95a,#a887ff)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, letterSpacing: 3, color: "#87909f" }}>
            <span>ADHAM / AURA SYSTEM</span>
            <span>LIVE IDENTITY / {identity.version}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 104, lineHeight: .82, letterSpacing: -8, fontWeight: 700 }}>ADHAM</div>
            <div style={{ fontSize: 104, lineHeight: .82, letterSpacing: -8, fontWeight: 700, color: "#ff4d7e" }}>MAHMOOD</div>
            <div style={{ marginTop: 34, display: "flex", gap: 16, alignItems: "center", fontSize: 24, color: "#a8afba" }}>
              <span style={{ color: "#55d8ff" }}>software</span><span>→</span><span>systems</span><span>→</span><span style={{ color: "#a887ff" }}>intelligence</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, color: "#6f7785" }}>
            <span>PORTFOLIO / FLAGSHIP BROWSER EXPERIMENT</span>
            <span>THE SYSTEM CHANGES WHEN THE WORK CHANGES.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { identity } from "@/data/site";

export const alt = "Adham Mahmood — Interactive Portfolio";
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
        <div style={{ position: "absolute", width: 560, height: 560, borderRadius: 999, right: -120, top: -120, background: "radial-gradient(circle, rgba(255,95,136,.28), rgba(103,220,255,.09) 38%, transparent 70%)" }} />
        <div style={{ position: "absolute", width: 340, height: 340, borderRadius: 999, right: 70, top: 125, border: "1px solid rgba(255,255,255,.12)" }} />
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: 999, right: 130, top: 185, border: "1px dashed rgba(180,154,255,.24)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: "linear-gradient(90deg,#ff5f88,#67dcff,#ffc26b,#b49aff)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 2.3, color: "#8c939d" }}>
            <span>ADHAM MAHMOOD</span>
            <span>INTERACTIVE PORTFOLIO / {identity.version}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 106, lineHeight: .82, letterSpacing: -8, fontWeight: 700 }}>ADHAM</div>
            <div style={{ fontSize: 106, lineHeight: .82, letterSpacing: -8, fontWeight: 700, color: "#ff5f88" }}>MAHMOOD</div>
            <div style={{ marginTop: 34, display: "flex", gap: 16, alignItems: "center", fontSize: 23, color: "#adb2b9" }}>
              <span style={{ color: "#67dcff" }}>software</span><span>→</span><span>systems</span><span>→</span><span style={{ color: "#b49aff" }}>intelligence</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, color: "#747c87" }}>
            <span>SOFTWARE · EXPERIMENTS · INTERACTIVE SYSTEMS</span>
            <span>BUILT TO CHANGE WITH THE WORK.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

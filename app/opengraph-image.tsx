import { ImageResponse } from "next/og";

export const alt = "Adham Mahmood — Evolving Portfolio";
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
          background: "#050506",
          color: "#f2efe9",
          padding: "58px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 28%, rgba(210,79,130,.13), transparent 31%), radial-gradient(circle at 68% 76%, rgba(242,239,233,.05), transparent 28%)" }} />
        <div style={{ position: "absolute", width: 520, height: 1, right: -30, top: 190, background: "rgba(242,239,233,.18)", transform: "rotate(-17deg)" }} />
        <div style={{ position: "absolute", width: 430, height: 1, right: 18, top: 258, background: "rgba(210,79,130,.28)", transform: "rotate(10deg)" }} />
        <div style={{ position: "absolute", width: 350, height: 1, right: 80, top: 338, background: "rgba(242,239,233,.1)", transform: "rotate(-7deg)" }} />
        <div style={{ position: "absolute", width: 8, height: 8, borderRadius: 999, right: 216, top: 304, background: "#d24f82", boxShadow: "0 0 32px rgba(210,79,130,.5)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, letterSpacing: 2.1, color: "#7c7975" }}>
            <span>CURRENT FRAME</span>
            <span>ADHAM MAHMOOD</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 118, lineHeight: .78, letterSpacing: -9, fontWeight: 800 }}>ADHAM</div>
            <div style={{ fontSize: 118, lineHeight: .78, letterSpacing: -9, fontWeight: 800, color: "#b7b3ad" }}>MAHMOOD</div>
            <div style={{ marginTop: 34, maxWidth: 720, fontSize: 24, lineHeight: 1.35, color: "#b7b3ad" }}>
              An evolving record of software work, learning, and history.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#7c7975", letterSpacing: 1.2 }}>
            <span>WORK · GROWTH · HISTORY</span>
            <span>THIS IS THE CURRENT FRAME.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

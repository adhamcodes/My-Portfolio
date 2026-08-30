"use client";

export default function XRay({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="xray-layer" aria-hidden="true">
      <div className="xray-label xray-hero">HERO / IDENTITY</div>
      <div className="xray-label xray-world">WEBGL / VISUAL FIELD + GLSL</div>
      <div className="xray-label xray-projects">PROJECTS / INTERACTIVE MODELS</div>
      <div className="xray-label" style={{ left: "7vw", top: "72vh" }}>INPUT / SPRING CURSOR</div>
      <div className="xray-label" style={{ right: "7vw", bottom: "9vh" }}>RUNTIME / BROWSER LAB</div>
      <div className="xray-crosshair xray-a" />
      <div className="xray-crosshair xray-b" />
    </div>
  );
}

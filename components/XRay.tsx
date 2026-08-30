"use client";

export default function XRay({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="xray-layer" aria-hidden="true">
      <div className="xray-label xray-hero">SCENE.00 / IDENTITY</div>
      <div className="xray-label xray-world">GPU / AURA.CORE + GLSL</div>
      <div className="xray-label xray-projects">SCENE.02 / PROJECT.PORTALS</div>
      <div className="xray-label xray-state">DATA / CURRENT.STATE</div>
      <div className="xray-label" style={{ left: "7vw", top: "72vh" }}>INPUT / CURSOR.SPRING</div>
      <div className="xray-label" style={{ right: "5vw", top: "62vh" }}>AUDIO / WEB.AUDIO</div>
      <div className="xray-label" style={{ right: "7vw", bottom: "9vh" }}>RUNTIME / SYSTEM.LAB</div>
      <div className="xray-crosshair xray-a" />
      <div className="xray-crosshair xray-b" />
    </div>
  );
}

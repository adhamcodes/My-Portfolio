"use client";

export default function XRay({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="xray-layer" aria-hidden="true">
      <div className="xray-label xray-hero">SCENE.00 / IDENTITY</div>
      <div className="xray-label xray-world">WEBGL / AURA.CORE</div>
      <div className="xray-label xray-projects">SCENE.02 / PROJECT.PORTALS</div>
      <div className="xray-label xray-state">DATA / CURRENT.STATE</div>
      <div className="xray-crosshair xray-a" />
      <div className="xray-crosshair xray-b" />
    </div>
  );
}

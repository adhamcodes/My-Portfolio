"use client";

import { useMemo } from "react";
import { identity, projects, stages, type AuraMode } from "@/data/site";

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function unit(seed: number, index: number) {
  let value = (seed + index * 0x9e3779b9) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967295;
}

export default function IdentityGlyph({ aura }: { aura: AuraMode }) {
  const geometry = useMemo(() => {
    const signature = [
      identity.name,
      identity.version,
      ...stages.map((stage) => `${stage.id}:${stage.state}`),
      ...projects.map((project) => `${project.id}:${project.state}`),
    ].join("|");
    const seed = hash(signature);
    const center = 100;
    const points = Array.from({ length: 14 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 14 - Math.PI / 2;
      const radius = 42 + unit(seed, index) * 37;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        radius: 1.4 + unit(seed, index + 40) * 2.5,
      };
    });
    return { seed: seed.toString(16).toUpperCase().padStart(8, "0"), points };
  }, []);

  const path = `${geometry.points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")} ${geometry.points[0].x.toFixed(2)},${geometry.points[0].y.toFixed(2)}`;

  return (
    <div className={`identity-glyph glyph-${aura}`} aria-label={`Living identity signature ${geometry.seed}`}>
      <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
        <circle className="glyph-ring outer" cx="100" cy="100" r="89" />
        <circle className="glyph-ring inner" cx="100" cy="100" r="31" />
        <polyline className="glyph-shape" points={path} />
        {geometry.points.map((point, index) => (
          <g key={index}>
            <line className="glyph-spoke" x1="100" y1="100" x2={point.x} y2={point.y} />
            <circle className="glyph-node" cx={point.x} cy={point.y} r={point.radius} />
          </g>
        ))}
        <circle className="glyph-core" cx="100" cy="100" r="6" />
      </svg>
      <div className="glyph-meta">
        <span>IDENTITY HASH</span>
        <b>{geometry.seed}</b>
        <em>MUTATES WITH BUILD STATE</em>
      </div>
    </div>
  );
}

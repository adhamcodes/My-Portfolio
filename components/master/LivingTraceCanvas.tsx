"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type {
  ChapterId,
  MotionMode,
  RenderTier,
  TraceRegion,
  WorldProjection,
} from "@/core/contracts";
import { createWorldProjection } from "@/core/projection";
import { createCurrentLivingState } from "@/content/living-state";

 type InteractionState = {
  pointerX: number;
  pointerY: number;
  scrollVelocity: number;
};

type StrandSpec = {
  id: string;
  points: THREE.Vector3[];
  ghostPoints: THREE.Vector3[];
  color: string;
  opacity: number;
  lineWidth: number;
  depth: number;
  phase: number;
};

type LivingTraceCanvasProps = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  onReady: () => void;
};

function hash01(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function regionColor(region: TraceRegion) {
  if (region.domain === "self") return "#e6e0d8";
  if (region.domain === "work") return "#b9aca2";
  if (region.domain === "growth") return "#9a8064";
  return "#85878d";
}

function regionOpacity(region: TraceRegion) {
  const energy =
    region.energy === "energized" ? 0.72 :
      region.energy === "active" ? 0.58 :
        region.energy === "quiet" ? 0.36 : 0.16;
  return Math.min(0.76, Math.max(0.1, energy * (0.6 + region.emphasis * 0.55)));
}

function createSpine(segmentCount: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.8, -1.55, -0.55),
    new THREE.Vector3(-3.35, -0.22, 0.25),
    new THREE.Vector3(-1.72, 0.34, -0.08),
    new THREE.Vector3(-0.15, -0.12, 0.34),
    new THREE.Vector3(1.68, 0.72, -0.22),
    new THREE.Vector3(3.18, 0.08, 0.32),
    new THREE.Vector3(4.75, 0.62, -0.18),
  ], false, "catmullrom", 0.48);

  return { curve, points: curve.getPoints(segmentCount) };
}

function createBranch(
  spine: THREE.CatmullRomCurve3,
  region: TraceRegion,
  index: number,
  segmentCount: number,
) {
  const h1 = hash01(`${region.id}:a`);
  const h2 = hash01(`${region.id}:b`);
  const h3 = hash01(`${region.id}:c`);

  const growthOffset = region.domain === "growth" ? index * 0.13 : 0;
  const anchorT = Math.min(0.82, region.domain === "work" ? 0.53 : region.domain === "history" ? 0.72 : 0.25 + growthOffset);
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();
  const sign = h1 > 0.5 ? 1 : -1;
  const dormant = region.energy === "dormant";
  const length = dormant ? 1.8 + h2 * 0.55 : 2.8 + h2 * 1.1;
  const lift = sign * (0.72 + h3 * 1.55);
  const depth = (h2 - 0.5) * 1.55;

  const controls = [
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.62)),
    anchor.clone().add(new THREE.Vector3(length * 0.42, lift * 0.38, depth * 0.35)),
    anchor.clone().add(new THREE.Vector3(length * 0.76, lift * 0.72, depth * 0.72)),
    anchor.clone().add(new THREE.Vector3(length, lift, depth)),
  ];

  const curve = new THREE.CatmullRomCurve3(controls, false, "catmullrom", 0.5);
  return curve.getPoints(dormant ? Math.max(28, Math.floor(segmentCount * 0.58)) : Math.max(40, Math.floor(segmentCount * 0.72)));
}

function buildStrands(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const segmentCount = renderTier === "full" ? 92 : 66;
  const { curve: spine, points: spinePoints } = createSpine(segmentCount);
  const strands: StrandSpec[] = [];
  const selfRegion = projection.regions.find((region) => region.domain === "self");

  if (selfRegion) {
    strands.push({
      id: selfRegion.id,
      points: spinePoints,
      ghostPoints: spinePoints.map((point, index) => point.clone().add(new THREE.Vector3(0, Math.sin(index * 0.21) * 0.025, 0.045))),
      color: regionColor(selfRegion),
      opacity: regionOpacity(selfRegion),
      lineWidth: 1.35,
      depth: 1,
      phase: hash01(selfRegion.id) * Math.PI * 2,
    });
  }

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branchIndex = region.domain === "growth" ? growthIndex++ : 0;
    const points = createBranch(spine, region, branchIndex, segmentCount);
    const ghostOffset = 0.018 + hash01(`${region.id}:ghost`) * 0.026;
    strands.push({
      id: region.id,
      points,
      ghostPoints: points.map((point, index) => point.clone().add(new THREE.Vector3(0, Math.sin(index * 0.27) * ghostOffset, ghostOffset))),
      color: regionColor(region),
      opacity: regionOpacity(region),
      lineWidth: region.domain === "work" ? 1.05 : region.domain === "growth" ? 0.78 : 0.7,
      depth: 0.45 + hash01(`${region.id}:depth`) * 0.75,
      phase: hash01(region.id) * Math.PI * 2,
    });
  }

  return strands;
}

function TraceStrand({ spec, interaction, motionMode }: {
  spec: StrandSpec;
  interaction: React.MutableRefObject<InteractionState>;
  motionMode: MotionMode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const target = group.current;
    if (!target) return;

    if (motionMode === "reduced") {
      target.position.set(0, 0, 0);
      return;
    }

    const idle = Math.sin(state.clock.elapsedTime * 0.34 + spec.phase) * 0.018 * spec.depth;
    const targetX = interaction.current.pointerX * 0.12 * spec.depth;
    const targetY = interaction.current.pointerY * 0.085 * spec.depth + interaction.current.scrollVelocity * 0.2 * spec.depth + idle;
    const targetZ = interaction.current.scrollVelocity * 0.1 * spec.depth;

    target.position.x = THREE.MathUtils.damp(target.position.x, targetX, 4.2, delta);
    target.position.y = THREE.MathUtils.damp(target.position.y, targetY, 4.2, delta);
    target.position.z = THREE.MathUtils.damp(target.position.z, targetZ, 4.2, delta);
  });

  return (
    <group ref={group}>
      <Line
        points={spec.ghostPoints}
        color={spec.color}
        lineWidth={spec.lineWidth * 4.2}
        transparent
        opacity={spec.opacity * 0.07}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.lineWidth}
        transparent
        opacity={spec.opacity}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </group>
  );
}

function chapterTarget(chapter: ChapterId, mobile: boolean) {
  const desktop: Record<ChapterId, { x: number; y: number; z: number; scale: number }> = {
    origin: { x: 0.62, y: 0.05, z: -0.1, scale: 1 },
    human: { x: 1.05, y: -0.08, z: -0.38, scale: 0.9 },
    work: { x: -0.72, y: 0.18, z: 0.12, scale: 1.08 },
    growth: { x: 0.18, y: 0.24, z: -0.08, scale: 1.02 },
    history: { x: 0.82, y: -0.16, z: -0.52, scale: 0.84 },
    understanding: { x: 0, y: 0, z: -0.22, scale: 0.92 },
    present: { x: 0.05, y: -0.02, z: -0.42, scale: 0.82 },
  };

  const value = desktop[chapter];
  if (!mobile) return value;
  return {
    x: value.x * 0.34,
    y: value.y + 0.18,
    z: value.z - 0.35,
    scale: value.scale * 0.76,
  };
}

function TraceWorld({
  projection,
  interaction,
  renderTier,
  motionMode,
}: {
  projection: WorldProjection;
  interaction: React.MutableRefObject<InteractionState>;
  renderTier: RenderTier;
  motionMode: MotionMode;
}) {
  const root = useRef<THREE.Group>(null);
  const initialized = useRef(false);
  const mobile = useThree((state) => state.size.width < 760);
  const strands = useMemo(() => buildStrands(projection, renderTier), [projection, renderTier]);
  const target = chapterTarget(projection.chapter, mobile);

  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;

    if (!initialized.current || motionMode === "reduced") {
      group.position.set(target.x, target.y, target.z);
      group.scale.setScalar(target.scale);
      initialized.current = true;
      return;
    }

    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, 2.8, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, target.y, 2.8, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.z, 2.8, delta);
    const nextScale = THREE.MathUtils.damp(group.scale.x, target.scale, 2.8, delta);
    group.scale.setScalar(nextScale);
  });

  return (
    <group ref={root}>
      {strands.map((spec) => (
        <TraceStrand key={spec.id} spec={spec} interaction={interaction} motionMode={motionMode} />
      ))}
    </group>
  );
}

export default function LivingTraceCanvas({ renderTier, motionMode, onReady }: LivingTraceCanvasProps) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const interaction = useRef<InteractionState>({ pointerX: 0, pointerY: 0, scrollVelocity: 0 });
  const livingState = useMemo(() => createCurrentLivingState(new Date().toISOString()), []);
  const projection = useMemo(() => createWorldProjection(livingState, chapter), [livingState, chapter]);

  useEffect(() => {
    const storedChapter = document.documentElement.dataset.chapter as ChapterId | undefined;
    if (storedChapter) setChapter(storedChapter);

    const onPointerMove = (event: PointerEvent) => {
      if (motionMode === "reduced") return;
      interaction.current.pointerX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      interaction.current.pointerY = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };

    const onMotion = (event: Event) => {
      const detail = (event as CustomEvent<{ scrollVelocity?: number }>).detail;
      interaction.current.scrollVelocity = detail?.scrollVelocity ?? 0;
    };

    const onChapter = (event: Event) => {
      const next = (event as CustomEvent<ChapterId>).detail;
      if (next) setChapter(next);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("adham:motion", onMotion);
    window.addEventListener("adham:chapter", onChapter);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("adham:motion", onMotion);
      window.removeEventListener("adham:chapter", onChapter);
    };
  }, [motionMode]);

  return (
    <Canvas
      className="living-trace-canvas"
      dpr={renderTier === "full" ? [1, 1.6] : [1, 1.25]}
      camera={{ position: [0, 0, 8.2], fov: 48, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
    >
      <fog attach="fog" args={["#050506", 8, 16]} />
      <TraceWorld
        projection={projection}
        interaction={interaction}
        renderTier={renderTier}
        motionMode={motionMode}
      />
    </Canvas>
  );
}

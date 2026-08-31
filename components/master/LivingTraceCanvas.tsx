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
  domain: TraceRegion["domain"];
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  color: string;
  opacity: number;
  radius: number;
  depth: number;
  phase: number;
  dormant: boolean;
  emphasis: number;
  decorative?: boolean;
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
  if (region.domain === "self") return "#e4c9d4";
  if (region.domain === "work") return "#98b8bf";
  if (region.domain === "growth") return "#c09157";
  return "#8d9098";
}

function regionOpacity(region: TraceRegion) {
  const energy =
    region.energy === "energized" ? 0.95 :
      region.energy === "active" ? 0.82 :
        region.energy === "quiet" ? 0.48 : 0.18;
  return Math.min(0.96, Math.max(0.08, energy * (0.58 + region.emphasis * 0.62)));
}

function makeCurve(points: THREE.Vector3[]) {
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.46);
}

function createSpine() {
  return makeCurve([
    new THREE.Vector3(-5.15, -1.55, -0.45),
    new THREE.Vector3(-4.15, -0.7, 0.35),
    new THREE.Vector3(-3.05, 0.35, -0.18),
    new THREE.Vector3(-1.75, 0.72, 0.32),
    new THREE.Vector3(-0.55, 0.12, -0.12),
    new THREE.Vector3(0.75, -0.34, 0.42),
    new THREE.Vector3(2.0, 0.42, -0.35),
    new THREE.Vector3(3.2, 0.95, 0.22),
    new THREE.Vector3(4.45, 0.2, -0.12),
    new THREE.Vector3(5.25, 0.62, 0.24),
  ]);
}

function createBraid(spine: THREE.CatmullRomCurve3, offset: number, phase: number) {
  const samples = 42;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const point = spine.getPoint(t);
    const tangent = spine.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const wave = Math.sin(t * Math.PI * 5.5 + phase);
    const depth = Math.cos(t * Math.PI * 4.5 + phase);
    return point.clone()
      .add(normal.multiplyScalar(wave * offset))
      .add(binormal.multiplyScalar(depth * offset * 0.72));
  });
  return makeCurve(points);
}

function createBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const h1 = hash01(`${region.id}:a`);
  const h2 = hash01(`${region.id}:b`);
  const h3 = hash01(`${region.id}:c`);
  const dormant = region.energy === "dormant";

  const growthAnchor = [0.24, 0.42, 0.68, 0.79][index % 4];
  const anchorT = region.domain === "work" ? 0.56 : region.domain === "history" ? 0.76 : growthAnchor;
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();
  const sign = h1 > 0.5 ? 1 : -1;
  const length = dormant ? 1.7 + h2 * 0.75 : 2.55 + h2 * 1.25;
  const lift = sign * (0.9 + h3 * 1.75);
  const depth = (h2 - 0.5) * 2.1;

  return makeCurve([
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.42)),
    anchor.clone().add(new THREE.Vector3(length * 0.3, lift * 0.18, depth * 0.22)),
    anchor.clone().add(new THREE.Vector3(length * 0.6, lift * 0.58, depth * 0.62)),
    anchor.clone().add(new THREE.Vector3(length, lift, depth)),
  ]);
}

function buildStrands(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const segments = renderTier === "full" ? 110 : 78;
  const spine = createSpine();
  const selfRegion = projection.regions.find((region) => region.domain === "self");
  const strands: StrandSpec[] = [];

  if (selfRegion) {
    strands.push({
      id: selfRegion.id,
      domain: "self",
      curve: spine,
      points: spine.getPoints(segments),
      color: regionColor(selfRegion),
      opacity: regionOpacity(selfRegion),
      radius: 0.075 * (0.82 + selfRegion.emphasis * 0.28),
      depth: 1,
      phase: hash01(selfRegion.id) * Math.PI * 2,
      dormant: false,
      emphasis: selfRegion.emphasis,
    });

    const braidCount = renderTier === "full" ? 3 : 2;
    for (let index = 0; index < braidCount; index += 1) {
      const curve = createBraid(spine, 0.09 + index * 0.025, index * 2.1 + 0.6);
      strands.push({
        id: `${selfRegion.id}:braid:${index}`,
        domain: "self",
        curve,
        points: curve.getPoints(segments),
        color: index === 0 ? "#f0dde5" : "#b9899f",
        opacity: 0.24 + selfRegion.emphasis * 0.12,
        radius: 0.012 + index * 0.002,
        depth: 0.82 + index * 0.08,
        phase: index * 1.8,
        dormant: false,
        emphasis: selfRegion.emphasis,
        decorative: true,
      });
    }
  }

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branchIndex = region.domain === "growth" ? growthIndex++ : 0;
    const curve = createBranch(spine, region, branchIndex);
    const dormant = region.energy === "dormant";
    strands.push({
      id: region.id,
      domain: region.domain,
      curve,
      points: curve.getPoints(dormant ? Math.max(34, Math.floor(segments * 0.62)) : Math.max(48, Math.floor(segments * 0.78))),
      color: regionColor(region),
      opacity: regionOpacity(region),
      radius: dormant ? 0.012 + region.emphasis * 0.012 : 0.025 + region.emphasis * 0.024,
      depth: 0.52 + hash01(`${region.id}:depth`) * 0.75,
      phase: hash01(region.id) * Math.PI * 2,
      dormant,
      emphasis: region.emphasis,
    });
  }

  return strands;
}

function SignalPulse({ spec, motionMode }: { spec: StrandSpec; motionMode: MotionMode }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const target = mesh.current;
    if (!target || motionMode === "reduced") return;
    const speed = spec.domain === "self" ? 0.035 : 0.018 + spec.emphasis * 0.014;
    const t = (state.clock.elapsedTime * speed + spec.phase / (Math.PI * 2)) % 1;
    target.position.copy(spec.curve.getPoint(t));
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 2.2 + spec.phase) * 0.18;
    target.scale.setScalar(pulse);
  });

  if (spec.dormant || spec.decorative) return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.035 + spec.emphasis * 0.016, 12, 12]} />
      <meshBasicMaterial
        color={spec.color}
        transparent
        opacity={0.6 + spec.emphasis * 0.18}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Terminal({ spec }: { spec: StrandSpec }) {
  if (spec.decorative || spec.domain === "self") return null;
  const end = spec.curve.getPoint(1);
  const size = spec.dormant ? 0.026 : 0.045 + spec.emphasis * 0.018;

  return (
    <group position={end}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.dormant ? 0.22 : 0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {!spec.dormant && (
        <mesh scale={2.4}>
          <sphereGeometry args={[size, 10, 10]} />
          <meshBasicMaterial
            color={spec.color}
            transparent
            opacity={0.055}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

function TraceStrand({ spec, interaction, motionMode, renderTier }: {
  spec: StrandSpec;
  interaction: React.MutableRefObject<InteractionState>;
  motionMode: MotionMode;
  renderTier: RenderTier;
}) {
  const group = useRef<THREE.Group>(null);
  const tubularSegments = renderTier === "full" ? 120 : 84;
  const radialSegments = renderTier === "full" ? 7 : 5;

  const coreGeometry = useMemo(
    () => new THREE.TubeGeometry(spec.curve, tubularSegments, spec.radius, radialSegments, false),
    [radialSegments, spec.curve, spec.radius, tubularSegments],
  );
  const haloGeometry = useMemo(
    () => new THREE.TubeGeometry(spec.curve, Math.floor(tubularSegments * 0.74), spec.radius * 3.4, 5, false),
    [spec.curve, spec.radius, tubularSegments],
  );

  useEffect(() => () => {
    coreGeometry.dispose();
    haloGeometry.dispose();
  }, [coreGeometry, haloGeometry]);

  useFrame((state, delta) => {
    const target = group.current;
    if (!target) return;

    if (motionMode === "reduced") {
      target.position.set(0, 0, 0);
      return;
    }

    const idle = Math.sin(state.clock.elapsedTime * 0.28 + spec.phase) * 0.024 * spec.depth;
    const targetX = interaction.current.pointerX * 0.16 * spec.depth;
    const targetY = interaction.current.pointerY * 0.12 * spec.depth + interaction.current.scrollVelocity * 0.24 * spec.depth + idle;
    const targetZ = interaction.current.scrollVelocity * 0.15 * spec.depth;

    target.position.x = THREE.MathUtils.damp(target.position.x, targetX, 3.6, delta);
    target.position.y = THREE.MathUtils.damp(target.position.y, targetY, 3.6, delta);
    target.position.z = THREE.MathUtils.damp(target.position.z, targetZ, 3.6, delta);
  });

  return (
    <group ref={group}>
      <mesh geometry={haloGeometry}>
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.opacity * (spec.dormant ? 0.025 : 0.07)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={coreGeometry}>
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.opacity * (spec.decorative ? 0.55 : 0.82)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.domain === "self" && !spec.decorative ? 1.25 : 0.7}
        transparent
        opacity={Math.min(0.92, spec.opacity * (spec.dormant ? 0.5 : 0.88))}
        depthWrite={false}
        toneMapped={false}
      />
      <SignalPulse spec={spec} motionMode={motionMode} />
      <Terminal spec={spec} />
    </group>
  );
}

function FieldMatter({ renderTier, motionMode }: { renderTier: RenderTier; motionMode: MotionMode }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 120 : 64;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const seed = hash01(`matter:${index}`);
      const seed2 = hash01(`matter:${index}:y`);
      const seed3 = hash01(`matter:${index}:z`);
      positions[index * 3] = (seed - 0.5) * 12;
      positions[index * 3 + 1] = (seed2 - 0.5) * 7;
      positions[index * 3 + 2] = -1.6 + seed3 * 3.2;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * 0.0025;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.05;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#cbbac1"
        size={renderTier === "full" ? 0.018 : 0.015}
        transparent
        opacity={0.18}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function chapterTarget(chapter: ChapterId, mobile: boolean) {
  const desktop: Record<ChapterId, { x: number; y: number; z: number; scale: number; rz: number }> = {
    origin: { x: 0.78, y: 0.04, z: 0.1, scale: 1.18, rz: -0.03 },
    human: { x: 1.08, y: -0.12, z: -0.18, scale: 1.04, rz: 0.025 },
    work: { x: -0.58, y: 0.14, z: 0.2, scale: 1.16, rz: -0.055 },
    growth: { x: 0.16, y: 0.24, z: 0.1, scale: 1.13, rz: 0.06 },
    history: { x: 0.9, y: -0.1, z: -0.4, scale: 0.94, rz: -0.04 },
    understanding: { x: 0, y: 0, z: -0.16, scale: 1, rz: 0 },
    present: { x: 0.12, y: 0, z: -0.25, scale: 0.9, rz: 0.018 },
  };
  const value = desktop[chapter];
  if (!mobile) return value;
  return {
    x: value.x * 0.32,
    y: value.y + 0.12,
    z: value.z - 0.28,
    scale: value.scale * 0.72,
    rz: value.rz * 0.5,
  };
}

function TraceWorld({ projection, interaction, renderTier, motionMode }: {
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
      group.rotation.z = target.rz;
      initialized.current = true;
      return;
    }

    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, 2.6, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, target.y, 2.6, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.z, 2.6, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rz, 2.2, delta);
    const nextScale = THREE.MathUtils.damp(group.scale.x, target.scale, 2.5, delta);
    group.scale.setScalar(nextScale);
  });

  return (
    <group ref={root}>
      {strands.map((spec) => (
        <TraceStrand
          key={spec.id}
          spec={spec}
          interaction={interaction}
          motionMode={motionMode}
          renderTier={renderTier}
        />
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
      dpr={renderTier === "full" ? [1, 1.55] : [1, 1.2]}
      camera={{ position: [0, 0, 8.3], fov: 46, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
    >
      <FieldMatter renderTier={renderTier} motionMode={motionMode} />
      <TraceWorld
        projection={projection}
        interaction={interaction}
        renderTier={renderTier}
        motionMode={motionMode}
      />
    </Canvas>
  );
}

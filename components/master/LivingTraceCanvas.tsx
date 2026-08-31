"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import type {
  ChapterId,
  MotionMode,
  PublicLivingState,
  RenderTier,
  TraceRegion,
  WorldProjection,
} from "@/core/contracts";
import { createWorldProjection } from "@/core/projection";

type InteractionState = {
  pointerX: number;
  pointerY: number;
  scrollVelocity: number;
};

type TraceSpec = {
  id: string;
  domain: TraceRegion["domain"];
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  color: string;
  opacity: number;
  width: number;
  phase: number;
  depth: number;
  emphasis: number;
  dormant: boolean;
  role: "spine" | "filament" | "branch";
  responseX: number;
  responseY: number;
};

type TraceTransform = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rz: number;
};

type LivingTraceCanvasProps = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  livingState: PublicLivingState;
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

function makeCurve(points: THREE.Vector3[]) {
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.42);
}

function colorFor(region: TraceRegion) {
  if (region.domain === "self") return "#eadde2";
  if (region.domain === "work") return "#9ab8bf";
  if (region.domain === "growth") return "#c59a63";
  return "#8c9099";
}

function opacityFor(region: TraceRegion) {
  const energy =
    region.energy === "energized" ? 1 :
      region.energy === "active" ? 0.84 :
        region.energy === "quiet" ? 0.54 : 0.24;
  return Math.min(1, Math.max(0.08, energy * (0.48 + region.emphasis * 0.48)));
}

function createSpine() {
  return makeCurve([
    new THREE.Vector3(-5.3, -1.35, -0.3),
    new THREE.Vector3(-4.25, -0.7, 0.22),
    new THREE.Vector3(-3.15, 0.18, -0.12),
    new THREE.Vector3(-1.95, 0.72, 0.18),
    new THREE.Vector3(-0.72, 0.28, -0.06),
    new THREE.Vector3(0.55, -0.28, 0.2),
    new THREE.Vector3(1.85, 0.2, -0.2),
    new THREE.Vector3(3.05, 0.82, 0.14),
    new THREE.Vector3(4.2, 0.34, -0.08),
    new THREE.Vector3(5.3, 0.72, 0.12),
  ]);
}

function createFilament(spine: THREE.CatmullRomCurve3, offset: number, phase: number) {
  const samples = 62;
  return makeCurve(Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const point = spine.getPoint(t);
    const tangent = spine.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const envelope = 0.24 + Math.sin(t * Math.PI) * 0.76;
    const lateral = Math.sin(t * Math.PI * 7.2 + phase) * offset * envelope;
    const depth = Math.cos(t * Math.PI * 5.1 + phase * 0.8) * offset * 0.8 * envelope;
    return point.clone()
      .add(normal.multiplyScalar(lateral))
      .add(binormal.multiplyScalar(depth));
  }));
}

function createBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const h1 = hash01(`${region.id}:side`);
  const h2 = hash01(`${region.id}:reach`);
  const h3 = hash01(`${region.id}:depth`);
  const anchors = [0.18, 0.34, 0.58, 0.77, 0.88];
  const anchorT = region.domain === "work" ? 0.55 : region.domain === "history" ? 0.78 : anchors[index % anchors.length];
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();
  const sign = h1 > 0.5 ? 1 : -1;
  const dormant = region.energy === "dormant";
  const reach = (dormant ? 1.8 : 2.6) + h2 * (dormant ? 0.7 : 1.25);
  const lift = sign * ((dormant ? 0.7 : 1.05) + h3 * 1.65);
  const depth = (h2 - 0.5) * 1.7;

  return makeCurve([
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.28)),
    anchor.clone().add(new THREE.Vector3(reach * 0.3, lift * 0.18, depth * 0.18)),
    anchor.clone().add(new THREE.Vector3(reach * 0.58, lift * 0.5, depth * 0.55)),
    anchor.clone().add(new THREE.Vector3(reach * 0.82, lift * 0.82, depth * 0.82)),
    anchor.clone().add(new THREE.Vector3(reach, lift, depth)),
  ]);
}

function buildTrace(projection: WorldProjection, renderTier: RenderTier): TraceSpec[] {
  const samples = renderTier === "full" ? 132 : 92;
  const spine = createSpine();
  const self = projection.regions.find((region) => region.domain === "self");
  const specs: TraceSpec[] = [];

  if (self) {
    specs.push({
      id: self.id,
      domain: "self",
      curve: spine,
      points: spine.getPoints(samples),
      color: colorFor(self),
      opacity: opacityFor(self),
      width: 1.65,
      phase: hash01(self.id) * Math.PI * 2,
      depth: 1,
      emphasis: self.emphasis,
      dormant: false,
      role: "spine",
      responseX: -0.12,
      responseY: 0.06,
    });

    const count = renderTier === "full" ? 7 : 5;
    for (let index = 0; index < count; index += 1) {
      const offset = 0.075 + index * 0.025;
      const curve = createFilament(spine, offset, 0.7 + index * 1.19);
      specs.push({
        id: `${self.id}:filament:${index}`,
        domain: "self",
        curve,
        points: curve.getPoints(samples),
        color: index % 3 === 0 ? "#f0e3e8" : index % 3 === 1 ? "#c39aac" : "#9db5bb",
        opacity: 0.22 + self.emphasis * 0.08,
        width: 0.62 + (index % 3) * 0.18,
        phase: index * 1.33,
        depth: 0.62 + index * 0.06,
        emphasis: self.emphasis,
        dormant: false,
        role: "filament",
        responseX: -0.55 + index * 0.17,
        responseY: 0.28 - index * 0.1,
      });
    }
  }

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branchIndex = region.domain === "growth" ? growthIndex++ : 0;
    const curve = createBranch(spine, region, branchIndex);
    const dormant = region.energy === "dormant";
    specs.push({
      id: region.id,
      domain: region.domain,
      curve,
      points: curve.getPoints(dormant ? Math.floor(samples * 0.6) : Math.floor(samples * 0.78)),
      color: colorFor(region),
      opacity: opacityFor(region),
      width: dormant ? 0.65 + region.emphasis * 0.35 : 1.05 + region.emphasis * 0.65,
      phase: hash01(region.id) * Math.PI * 2,
      depth: 0.6 + hash01(`${region.id}:depth`) * 0.7,
      emphasis: region.emphasis,
      dormant,
      role: "branch",
      responseX: hash01(`${region.id}:response-x`) * 1.8 - 0.9,
      responseY: hash01(`${region.id}:response-y`) * 1.4 - 0.7,
    });
  }

  return specs;
}

function transformFor(spec: TraceSpec, chapter: ChapterId, indexOpen: boolean, mobile: boolean): TraceTransform {
  if (indexOpen) {
    const lane: Record<TraceRegion["domain"], number> = { self: 1.55, work: 0.55, growth: -0.42, history: -1.45 };
    const scatter = spec.domain === "growth" ? (hash01(`${spec.id}:index-y`) - 0.5) * 0.54 : 0;
    return {
      x: mobile ? -0.08 : -1.15 + (hash01(`${spec.id}:index-x`) - 0.5) * 0.62,
      y: (lane[spec.domain] + scatter) * (mobile ? 0.7 : 1),
      z: spec.role === "filament" ? -0.38 : -0.12,
      scale: mobile ? 0.72 : spec.domain === "self" ? 0.72 : 0.8,
      rz: spec.domain === "self" ? -0.02 : (hash01(`${spec.id}:index-r`) - 0.5) * 0.13,
    };
  }

  const neutral: TraceTransform = { x: 0, y: 0, z: 0, scale: 1, rz: 0 };
  if (chapter === "origin") {
    if (spec.domain === "self") return neutral;
    return { x: 0.12, y: 0, z: -0.2, scale: 0.86, rz: 0 };
  }
  if (chapter === "human") {
    if (spec.domain === "self") return { x: 0.08, y: 0.03, z: 0.08, scale: 1.06, rz: 0.012 };
    return { x: 0.16, y: -0.02, z: -0.3, scale: 0.74, rz: 0 };
  }
  if (chapter === "work") {
    if (spec.domain === "work") return { x: -0.82, y: 0.14, z: 0.3, scale: 1.48, rz: -0.07 };
    if (spec.domain === "self") return { x: 0.4, y: 0, z: -0.4, scale: 0.68, rz: 0.02 };
    return { x: 0.3, y: 0, z: -0.56, scale: 0.58, rz: 0.02 };
  }
  if (chapter === "growth") {
    if (spec.domain === "growth") {
      const splay = (hash01(`${spec.id}:growth`) - 0.5) * 1.18;
      return { x: -0.18 + splay * 0.3, y: splay, z: 0.28, scale: 1.46, rz: splay * 0.075 };
    }
    if (spec.domain === "self") return { x: 0.38, y: 0, z: -0.48, scale: 0.62, rz: -0.01 };
    return { x: 0.2, y: -0.04, z: -0.64, scale: 0.52, rz: 0 };
  }
  if (chapter === "history") {
    if (spec.domain === "history") return { x: -0.46, y: -0.08, z: 0.34, scale: 1.42, rz: 0.06 };
    if (spec.domain === "self") return { x: 0.48, y: 0.04, z: -0.62, scale: 0.55, rz: -0.02 };
    return { x: 0.28, y: 0, z: -0.7, scale: 0.48, rz: 0 };
  }
  if (chapter === "present") return { x: 0, y: 0, z: -0.18, scale: spec.domain === "self" ? 0.82 : 0.72, rz: 0 };
  return neutral;
}

function Signal({ spec, motionMode, indexOpen }: { spec: TraceSpec; motionMode: MotionMode; indexOpen: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || motionMode === "reduced") return;
    const speed = (spec.domain === "self" ? 0.026 : 0.013 + spec.emphasis * 0.011) * (indexOpen ? 0.45 : 1);
    const t = (state.clock.elapsedTime * speed + spec.phase / (Math.PI * 2)) % 1;
    mesh.current.position.copy(spec.curve.getPoint(t));
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 1.6 + spec.phase) * 0.14;
    mesh.current.scale.setScalar(pulse);
  });

  if (spec.dormant || spec.role === "filament") return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[spec.role === "spine" ? 0.023 : 0.028 + spec.emphasis * 0.01, 8, 8]} />
      <meshBasicMaterial
        color={spec.color}
        transparent
        opacity={indexOpen ? 0.38 : 0.58}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Terminal({ spec, indexOpen }: { spec: TraceSpec; indexOpen: boolean }) {
  if (spec.role !== "branch") return null;
  const end = spec.curve.getPoint(1);
  const size = spec.dormant ? 0.018 : 0.028 + spec.emphasis * 0.012;
  return (
    <group position={end}>
      <mesh>
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.dormant ? 0.22 : indexOpen ? 0.72 : 0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {!spec.dormant && (
        <mesh scale={indexOpen ? 3 : 2.2}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function TraceLine({
  spec,
  interaction,
  motionMode,
  chapter,
  indexOpen,
  mobile,
}: {
  spec: TraceSpec;
  interaction: MutableRefObject<InteractionState>;
  motionMode: MotionMode;
  chapter: ChapterId;
  indexOpen: boolean;
  mobile: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const target = transformFor(spec, chapter, indexOpen, mobile);

  useFrame((state, delta) => {
    if (!group.current) return;
    const node = group.current;
    if (motionMode === "reduced") {
      node.position.set(target.x, target.y, target.z);
      node.scale.setScalar(target.scale);
      node.rotation.z = target.rz;
      return;
    }

    const pointer = interaction.current;
    const distance = Math.hypot(pointer.pointerX - spec.responseX, pointer.pointerY - spec.responseY);
    const proximity = indexOpen ? 0 : Math.max(0, 1 - distance / 1.18);
    const influence = proximity * proximity;
    const direction = Math.sin(spec.phase) >= 0 ? 1 : -1;
    const idle = Math.sin(state.clock.elapsedTime * (spec.role === "filament" ? 0.34 : 0.2) + spec.phase) * 0.018 * spec.depth;
    const px = pointer.pointerX * influence * 0.23 * spec.depth;
    const py = pointer.pointerY * influence * 0.19 * spec.depth;
    const shear = pointer.scrollVelocity * 0.16 * spec.depth * direction;
    const damping = 2.8 + spec.depth;

    node.position.x = THREE.MathUtils.damp(node.position.x, target.x + px, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y + py + shear + idle, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z + shear * 0.32, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz + influence * 0.012 * direction, 2.5, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, target.scale * (1 + influence * 0.015), 2.8, delta);
    node.scale.setScalar(scale);
  });

  const widthBoost = mobile ? 1.16 : 1;
  const chapterFactor = chapter === "origin" && spec.role === "spine" ? 0.72 : 1;
  const opacity = spec.opacity * chapterFactor * (indexOpen ? 0.82 : 1);

  return (
    <group ref={group}>
      {spec.role !== "filament" && !spec.dormant && (
        <Line
          points={spec.points}
          color={spec.color}
          lineWidth={spec.width * 4.2 * widthBoost}
          transparent
          opacity={Math.min(0.075, opacity * 0.075)}
          depthWrite={false}
          toneMapped={false}
        />
      )}
      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.width * widthBoost}
        transparent
        opacity={spec.role === "filament" ? opacity * 0.78 : Math.min(0.88, opacity * 0.86)}
        depthWrite={false}
        toneMapped={false}
      />
      <Signal spec={spec} motionMode={motionMode} indexOpen={indexOpen} />
      <Terminal spec={spec} indexOpen={indexOpen} />
    </group>
  );
}

function FieldMatter({ renderTier, motionMode, indexOpen }: { renderTier: RenderTier; motionMode: MotionMode; indexOpen: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 150 : 82;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`matter:${index}`) - 0.5) * 12;
      positions[index * 3 + 1] = (hash01(`matter:${index}:y`) - 0.5) * 7;
      positions[index * 3 + 2] = -1.7 + hash01(`matter:${index}:z`) * 3.2;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * (indexOpen ? 0.0007 : 0.0018);
    points.current.position.y = THREE.MathUtils.damp(points.current.position.y, indexOpen ? 0 : Math.sin(state.clock.elapsedTime * 0.1) * 0.04, 2.3, delta);
    const scale = THREE.MathUtils.damp(points.current.scale.x, indexOpen ? 1.2 : 1, 2.2, delta);
    points.current.scale.setScalar(scale);
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#c7b7bd"
        size={renderTier === "full" ? 0.017 : 0.014}
        transparent
        opacity={indexOpen ? 0.08 : 0.14}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function worldTarget(chapter: ChapterId, mobile: boolean, indexOpen: boolean): TraceTransform {
  if (indexOpen) return mobile
    ? { x: 0.02, y: 0, z: -0.4, scale: 0.42, rz: 0 }
    : { x: 0.72, y: 0, z: -0.42, scale: 0.86, rz: 0 };

  const desktop: Record<ChapterId, TraceTransform> = {
    origin: { x: 1.05, y: -0.02, z: -0.08, scale: 0.9, rz: -0.02 },
    human: { x: 1.05, y: -0.12, z: -0.18, scale: 0.98, rz: 0.018 },
    work: { x: -0.15, y: 0.1, z: 0.08, scale: 1.04, rz: -0.03 },
    growth: { x: 0.08, y: 0.16, z: 0.02, scale: 1.04, rz: 0.032 },
    history: { x: 0.52, y: -0.06, z: -0.3, scale: 0.92, rz: -0.024 },
    understanding: { x: 0, y: 0, z: -0.16, scale: 0.96, rz: 0 },
    present: { x: 0.12, y: 0, z: -0.22, scale: 0.88, rz: 0.01 },
  };
  if (!mobile) return desktop[chapter];

  const mobileTargets: Record<ChapterId, TraceTransform> = {
    origin: { x: 0.18, y: -0.22, z: -0.02, scale: 0.41, rz: -0.035 },
    human: { x: 0.08, y: -0.1, z: -0.08, scale: 0.43, rz: 0.015 },
    work: { x: -0.05, y: 0.05, z: 0, scale: 0.43, rz: -0.03 },
    growth: { x: 0, y: 0.08, z: 0, scale: 0.44, rz: 0.025 },
    history: { x: 0.06, y: -0.04, z: -0.1, scale: 0.42, rz: -0.02 },
    understanding: { x: 0, y: 0, z: -0.12, scale: 0.42, rz: 0 },
    present: { x: 0.02, y: 0, z: -0.08, scale: 0.4, rz: 0 },
  };
  return mobileTargets[chapter];
}

function TraceWorld({ projection, interaction, renderTier, motionMode, indexOpen }: {
  projection: WorldProjection;
  interaction: MutableRefObject<InteractionState>;
  renderTier: RenderTier;
  motionMode: MotionMode;
  indexOpen: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const initialized = useRef(false);
  const mobile = useThree((state) => state.size.width < 760);
  const specs = useMemo(() => buildTrace(projection, renderTier), [projection, renderTier]);
  const target = worldTarget(projection.chapter, mobile, indexOpen);

  useFrame((_, delta) => {
    if (!root.current) return;
    const node = root.current;
    if (!initialized.current || motionMode === "reduced") {
      node.position.set(target.x, target.y, target.z);
      node.scale.setScalar(target.scale);
      node.rotation.z = target.rz;
      initialized.current = true;
      return;
    }
    const damping = indexOpen ? 3.2 : 2.45;
    node.position.x = THREE.MathUtils.damp(node.position.x, target.x, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz, 2.4, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, target.scale, damping, delta);
    node.scale.setScalar(scale);
  });

  return (
    <group ref={root}>
      {specs.map((spec) => (
        <TraceLine
          key={spec.id}
          spec={spec}
          interaction={interaction}
          motionMode={motionMode}
          chapter={projection.chapter}
          indexOpen={indexOpen}
          mobile={mobile}
        />
      ))}
    </group>
  );
}

export default function LivingTraceCanvas({ renderTier, motionMode, livingState, onReady }: LivingTraceCanvasProps) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const [indexOpen, setIndexOpen] = useState(false);
  const interaction = useRef<InteractionState>({ pointerX: 0, pointerY: 0, scrollVelocity: 0 });
  const projection = useMemo(() => createWorldProjection(livingState, chapter), [livingState, chapter]);

  useEffect(() => {
    const root = document.documentElement;
    const storedChapter = root.dataset.chapter as ChapterId | undefined;
    if (storedChapter) setChapter(storedChapter);
    setIndexOpen(root.dataset.indexOpen === "true");

    const onPointerMove = (event: PointerEvent) => {
      if (motionMode === "reduced") return;
      interaction.current.pointerX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      interaction.current.pointerY = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };
    const onMotion = (event: Event) => {
      interaction.current.scrollVelocity = (event as CustomEvent<{ scrollVelocity?: number }>).detail?.scrollVelocity ?? 0;
    };
    const onChapter = (event: Event) => {
      const next = (event as CustomEvent<ChapterId>).detail;
      if (next) setChapter(next);
    };
    const onIndex = (event: Event) => {
      const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      setIndexOpen(open);
      if (open) interaction.current.scrollVelocity = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("adham:motion", onMotion);
    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("adham:index", onIndex);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("adham:motion", onMotion);
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("adham:index", onIndex);
    };
  }, [motionMode]);

  return (
    <Canvas
      className="living-trace-canvas"
      dpr={renderTier === "full" ? [1, 1.4] : [1, 1.12]}
      camera={{ position: [0, 0, 8.3], fov: 46, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
    >
      <FieldMatter renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} />
      <TraceWorld projection={projection} interaction={interaction} renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} />
    </Canvas>
  );
}

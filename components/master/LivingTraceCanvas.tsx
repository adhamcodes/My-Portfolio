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

/**
 * The permanent identity path is deliberately asymmetric. It is a trajectory,
 * not an oscilloscope: one fold, one recovery, and enough depth for the
 * subsidiary strands to read as a material rather than duplicated waves.
 */
function createSpine() {
  return makeCurve([
    new THREE.Vector3(-4.95, -1.62, -0.42),
    new THREE.Vector3(-3.95, -1.04, 0.08),
    new THREE.Vector3(-2.92, -0.14, 0.4),
    new THREE.Vector3(-1.78, 0.54, 0.08),
    new THREE.Vector3(-0.62, 0.5, -0.34),
    new THREE.Vector3(0.54, -0.08, -0.06),
    new THREE.Vector3(1.56, -0.34, 0.44),
    new THREE.Vector3(2.52, 0.12, 0.62),
    new THREE.Vector3(3.42, 0.88, 0.18),
    new THREE.Vector3(4.56, 1.35, -0.24),
  ]);
}

function createFilament(path: THREE.CatmullRomCurve3, offset: number, phase: number, turns = 3.65) {
  const samples = 58;
  return makeCurve(Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const point = path.getPoint(t);
    const tangent = path.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const envelope = 0.16 + Math.sin(t * Math.PI) * 0.84;
    const lateral = Math.sin(t * Math.PI * turns + phase) * offset * envelope;
    const depth = Math.cos(t * Math.PI * (turns * 0.72) + phase * 0.78) * offset * 0.92 * envelope;
    return point.clone()
      .add(normal.multiplyScalar(lateral))
      .add(binormal.multiplyScalar(depth));
  }));
}

function createBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const h1 = hash01(`${region.id}:side`);
  const h2 = hash01(`${region.id}:reach`);
  const h3 = hash01(`${region.id}:depth`);
  const anchors = [0.2, 0.36, 0.6, 0.76, 0.87];
  const anchorT = region.domain === "work" ? 0.56 : region.domain === "history" ? 0.78 : anchors[index % anchors.length];
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();
  const sign = h1 > 0.5 ? 1 : -1;
  const dormant = region.energy === "dormant";
  const reach = (dormant ? 1.55 : 2.35) + h2 * (dormant ? 0.65 : 1.1);
  const lift = sign * ((dormant ? 0.66 : 0.96) + h3 * 1.5);
  const depth = (h2 - 0.5) * 1.72;

  return makeCurve([
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.26)),
    anchor.clone().add(new THREE.Vector3(reach * 0.3, lift * 0.17, depth * 0.16)),
    anchor.clone().add(new THREE.Vector3(reach * 0.58, lift * 0.48, depth * 0.52)),
    anchor.clone().add(new THREE.Vector3(reach * 0.82, lift * 0.8, depth * 0.82)),
    anchor.clone().add(new THREE.Vector3(reach, lift, depth)),
  ]);
}

function buildTrace(projection: WorldProjection, renderTier: RenderTier): TraceSpec[] {
  const samples = renderTier === "full" ? 126 : 88;
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
      width: 1.18,
      phase: hash01(self.id) * Math.PI * 2,
      depth: 1,
      emphasis: self.emphasis,
      dormant: false,
      role: "spine",
      responseX: -0.12,
      responseY: 0.06,
    });

    const count = renderTier === "full" ? 4 : 3;
    for (let index = 0; index < count; index += 1) {
      const offset = 0.105 + index * 0.038;
      const curve = createFilament(spine, offset, 0.75 + index * 1.47, 3.25 + index * 0.26);
      specs.push({
        id: `${self.id}:filament:${index}`,
        domain: "self",
        curve,
        points: curve.getPoints(samples),
        color: index % 3 === 0 ? "#f0e3e8" : index % 3 === 1 ? "#ba8da1" : "#9db5bb",
        opacity: 0.2 + self.emphasis * 0.075,
        width: 0.58 + (index % 2) * 0.14,
        phase: index * 1.61,
        depth: 0.66 + index * 0.09,
        emphasis: self.emphasis,
        dormant: false,
        role: "filament",
        responseX: -0.48 + index * 0.29,
        responseY: 0.24 - index * 0.15,
      });
    }
  }

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branchIndex = region.domain === "growth" ? growthIndex++ : 0;
    const curve = createBranch(spine, region, branchIndex);
    const dormant = region.energy === "dormant";
    const branchOpacity = opacityFor(region);

    specs.push({
      id: region.id,
      domain: region.domain,
      curve,
      points: curve.getPoints(dormant ? Math.floor(samples * 0.58) : Math.floor(samples * 0.76)),
      color: colorFor(region),
      opacity: branchOpacity,
      width: dormant ? 0.58 + region.emphasis * 0.28 : 1.08 + region.emphasis * 0.52,
      phase: hash01(region.id) * Math.PI * 2,
      depth: 0.62 + hash01(`${region.id}:depth`) * 0.68,
      emphasis: region.emphasis,
      dormant,
      role: "branch",
      responseX: hash01(`${region.id}:response-x`) * 1.7 - 0.85,
      responseY: hash01(`${region.id}:response-y`) * 1.3 - 0.65,
    });

    // Mature/current domains acquire material depth. Dormant growth remains a
    // single unresolved direction until real activity gives it more structure.
    if (!dormant && renderTier === "full") {
      const companion = createFilament(curve, 0.052, hash01(`${region.id}:companion`) * Math.PI * 2, 2.6);
      specs.push({
        id: `${region.id}:companion`,
        domain: region.domain,
        curve: companion,
        points: companion.getPoints(Math.floor(samples * 0.72)),
        color: colorFor(region),
        opacity: branchOpacity * 0.34,
        width: 0.46,
        phase: hash01(`${region.id}:companion-phase`) * Math.PI * 2,
        depth: 0.7,
        emphasis: region.emphasis,
        dormant: false,
        role: "filament",
        responseX: hash01(`${region.id}:companion-x`) * 1.4 - 0.7,
        responseY: hash01(`${region.id}:companion-y`) * 1.2 - 0.6,
      });
    }
  }

  return specs;
}

function transformFor(spec: TraceSpec, chapter: ChapterId, indexOpen: boolean, mobile: boolean): TraceTransform {
  if (indexOpen) {
    const lane: Record<TraceRegion["domain"], number> = { self: 1.52, work: 0.5, growth: -0.48, history: -1.47 };
    const scatter = spec.domain === "growth" ? (hash01(`${spec.id}:index-y`) - 0.5) * 0.62 : 0;
    return {
      x: mobile ? -0.04 : -0.92 + (hash01(`${spec.id}:index-x`) - 0.5) * 0.44,
      y: (lane[spec.domain] + scatter) * (mobile ? 0.7 : 1),
      z: spec.role === "filament" ? -0.34 : -0.08,
      scale: mobile ? 0.7 : spec.domain === "self" ? 0.66 : 0.84,
      rz: spec.domain === "self" ? -0.04 : (hash01(`${spec.id}:index-r`) - 0.5) * 0.11,
    };
  }

  const neutral: TraceTransform = { x: 0, y: 0, z: 0, scale: 1, rz: 0 };
  if (chapter === "origin") {
    if (spec.domain === "self") return neutral;
    return { x: 0.1, y: 0, z: -0.2, scale: 0.82, rz: 0 };
  }
  if (chapter === "human") {
    if (spec.domain === "self") return { x: 0.04, y: 0.04, z: 0.08, scale: 1.02, rz: 0.018 };
    return { x: 0.16, y: -0.02, z: -0.32, scale: 0.7, rz: 0 };
  }
  if (chapter === "work") {
    if (spec.domain === "work") return { x: -0.84, y: 0.14, z: 0.32, scale: 1.52, rz: -0.075 };
    if (spec.domain === "self") return { x: 0.42, y: -0.02, z: -0.46, scale: 0.62, rz: 0.025 };
    return { x: 0.3, y: 0, z: -0.62, scale: 0.52, rz: 0.02 };
  }
  if (chapter === "growth") {
    if (spec.domain === "growth") {
      const splay = (hash01(`${spec.id}:growth`) - 0.5) * 1.28;
      return { x: -0.2 + splay * 0.3, y: splay, z: 0.3, scale: 1.52, rz: splay * 0.078 };
    }
    if (spec.domain === "self") return { x: 0.4, y: 0, z: -0.52, scale: 0.56, rz: -0.012 };
    return { x: 0.2, y: -0.04, z: -0.68, scale: 0.48, rz: 0 };
  }
  if (chapter === "history") {
    if (spec.domain === "history") return { x: -0.48, y: -0.08, z: 0.36, scale: 1.46, rz: 0.065 };
    if (spec.domain === "self") return { x: 0.5, y: 0.04, z: -0.66, scale: 0.5, rz: -0.022 };
    return { x: 0.3, y: 0, z: -0.72, scale: 0.44, rz: 0 };
  }
  if (chapter === "present") return { x: 0, y: 0, z: -0.2, scale: spec.domain === "self" ? 0.78 : 0.68, rz: 0 };
  return neutral;
}

function presenceFor(spec: TraceSpec, chapter: ChapterId, indexOpen: boolean) {
  if (indexOpen) {
    if (spec.role === "filament") return spec.domain === "self" ? 0.14 : 0.3;
    if (spec.role === "spine") return 0.38;
    return 1.08;
  }

  if (chapter === "origin") {
    if (spec.domain !== "self") return 0.34;
    return spec.role === "spine" ? 0.62 : 0.52;
  }
  if (chapter === "human") return spec.domain === "self" ? 0.92 : 0.26;
  if (chapter === "work") return spec.domain === "work" ? 1.14 : spec.domain === "self" ? 0.24 : 0.15;
  if (chapter === "growth") return spec.domain === "growth" ? 1.18 : spec.domain === "self" ? 0.2 : 0.13;
  if (chapter === "history") return spec.domain === "history" ? 1.12 : spec.domain === "self" ? 0.18 : 0.12;
  if (chapter === "present") return spec.domain === "self" ? 0.66 : 0.4;
  return 0.7;
}

function Signal({ spec, motionMode, indexOpen }: { spec: TraceSpec; motionMode: MotionMode; indexOpen: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || motionMode === "reduced") return;
    const speed = (spec.domain === "self" ? 0.022 : 0.012 + spec.emphasis * 0.01) * (indexOpen ? 0.38 : 1);
    const t = (state.clock.elapsedTime * speed + spec.phase / (Math.PI * 2)) % 1;
    mesh.current.position.copy(spec.curve.getPoint(t));
    const pulse = 0.74 + Math.sin(state.clock.elapsedTime * 1.45 + spec.phase) * 0.12;
    mesh.current.scale.setScalar(pulse);
  });

  if (spec.dormant || spec.role === "filament") return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[spec.role === "spine" ? 0.02 : 0.026 + spec.emphasis * 0.009, 8, 8]} />
      <meshBasicMaterial
        color={spec.color}
        transparent
        opacity={indexOpen ? 0.48 : 0.56}
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
  const size = spec.dormant ? 0.017 : 0.026 + spec.emphasis * 0.011;
  return (
    <group position={end}>
      <mesh>
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.dormant ? 0.2 : indexOpen ? 0.8 : 0.56}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {!spec.dormant && (
        <mesh scale={indexOpen ? 3.2 : 2.15}>
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
    const proximity = indexOpen ? 0 : Math.max(0, 1 - distance / 1.12);
    const influence = proximity * proximity;
    const direction = Math.sin(spec.phase) >= 0 ? 1 : -1;
    const idle = Math.sin(state.clock.elapsedTime * (spec.role === "filament" ? 0.27 : 0.17) + spec.phase) * 0.014 * spec.depth;
    const px = pointer.pointerX * influence * 0.18 * spec.depth;
    const py = pointer.pointerY * influence * 0.15 * spec.depth;
    const shear = pointer.scrollVelocity * 0.135 * spec.depth * direction;
    const damping = 3 + spec.depth;

    node.position.x = THREE.MathUtils.damp(node.position.x, target.x + px, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y + py + shear + idle, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z + shear * 0.28, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz + influence * 0.009 * direction, 2.7, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, target.scale * (1 + influence * 0.012), 3, delta);
    node.scale.setScalar(scale);
  });

  const widthBoost = mobile ? 1.1 : 1;
  const presence = presenceFor(spec, chapter, indexOpen);
  const opacity = spec.opacity * presence;

  return (
    <group ref={group}>
      {spec.role !== "filament" && !spec.dormant && (
        <Line
          points={spec.points}
          color={spec.color}
          lineWidth={spec.width * 3.2 * widthBoost}
          transparent
          opacity={Math.min(0.045, opacity * 0.052)}
          depthWrite={false}
          toneMapped={false}
        />
      )}
      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.width * widthBoost}
        transparent
        opacity={spec.role === "filament" ? Math.min(0.34, opacity * 0.72) : Math.min(0.86, opacity * 0.84)}
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
    const count = renderTier === "full" ? 104 : 58;
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
    points.current.rotation.z += delta * (indexOpen ? 0.00055 : 0.00135);
    points.current.position.y = THREE.MathUtils.damp(points.current.position.y, indexOpen ? 0 : Math.sin(state.clock.elapsedTime * 0.09) * 0.035, 2.3, delta);
    const scale = THREE.MathUtils.damp(points.current.scale.x, indexOpen ? 1.16 : 1, 2.2, delta);
    points.current.scale.setScalar(scale);
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#c7b7bd"
        size={renderTier === "full" ? 0.015 : 0.013}
        transparent
        opacity={indexOpen ? 0.065 : 0.095}
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
    ? { x: 0.04, y: 0.02, z: -0.4, scale: 0.4, rz: 0 }
    : { x: 1.08, y: 0, z: -0.4, scale: 0.82, rz: 0 };

  const desktop: Record<ChapterId, TraceTransform> = {
    origin: { x: 2.05, y: 0.24, z: -0.08, scale: 0.78, rz: 0.035 },
    human: { x: 1.7, y: 0.02, z: -0.16, scale: 0.9, rz: 0.028 },
    work: { x: -0.1, y: 0.08, z: 0.08, scale: 1.04, rz: -0.03 },
    growth: { x: 0.1, y: 0.14, z: 0.02, scale: 1.02, rz: 0.03 },
    history: { x: 0.54, y: -0.04, z: -0.3, scale: 0.9, rz: -0.022 },
    understanding: { x: 0, y: 0, z: -0.16, scale: 0.94, rz: 0 },
    present: { x: 0.12, y: 0, z: -0.22, scale: 0.84, rz: 0.01 },
  };
  if (!mobile) return desktop[chapter];

  const mobileTargets: Record<ChapterId, TraceTransform> = {
    origin: { x: 0.52, y: -0.08, z: -0.02, scale: 0.34, rz: 0.02 },
    human: { x: 0.16, y: -0.05, z: -0.08, scale: 0.4, rz: 0.015 },
    work: { x: -0.04, y: 0.04, z: 0, scale: 0.42, rz: -0.028 },
    growth: { x: 0, y: 0.07, z: 0, scale: 0.43, rz: 0.024 },
    history: { x: 0.06, y: -0.04, z: -0.1, scale: 0.4, rz: -0.018 },
    understanding: { x: 0, y: 0, z: -0.12, scale: 0.4, rz: 0 },
    present: { x: 0.02, y: 0, z: -0.08, scale: 0.38, rz: 0 },
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
    const damping = indexOpen ? 3.4 : 2.6;
    node.position.x = THREE.MathUtils.damp(node.position.x, target.x, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz, 2.6, delta);
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
  const [visible, setVisible] = useState(true);
  const interaction = useRef<InteractionState>({ pointerX: 0, pointerY: 0, scrollVelocity: 0 });
  const projection = useMemo(() => createWorldProjection(livingState, chapter), [livingState, chapter]);

  useEffect(() => {
    const root = document.documentElement;
    const storedChapter = root.dataset.chapter as ChapterId | undefined;
    if (storedChapter) setChapter(storedChapter);
    setIndexOpen(root.dataset.indexOpen === "true");
    setVisible(document.visibilityState === "visible");

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
    const onVisibility = (event: Event) => {
      setVisible(Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible));
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("adham:motion", onMotion);
    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("adham:index", onIndex);
    window.addEventListener("adham:visibility", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("adham:motion", onMotion);
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("adham:index", onIndex);
      window.removeEventListener("adham:visibility", onVisibility);
    };
  }, [motionMode]);

  return (
    <Canvas
      className="living-trace-canvas"
      dpr={renderTier === "full" ? [1, 1.4] : [1, 1.12]}
      camera={{ position: [0, 0, 8.3], fov: 46, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" || !visible ? "demand" : "always"}
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

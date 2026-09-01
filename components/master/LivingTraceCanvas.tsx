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

type TraceRole = "spine" | "filament" | "branch";

type TraceSpec = {
  id: string;
  domain: TraceRegion["domain"];
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  color: string;
  opacity: number;
  radius: number;
  lineWidth: number;
  phase: number;
  depth: number;
  emphasis: number;
  dormant: boolean;
  role: TraceRole;
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
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.36);
}

function colorFor(region: TraceRegion) {
  if (region.domain === "self") return "#eadce2";
  if (region.domain === "work") return "#9abac2";
  if (region.domain === "growth") return "#c79b5e";
  return "#8f9299";
}

function opacityFor(region: TraceRegion) {
  const energy =
    region.energy === "energized" ? 1 :
      region.energy === "active" ? 0.82 :
        region.energy === "quiet" ? 0.5 : 0.2;
  return Math.min(1, Math.max(0.08, energy * (0.46 + region.emphasis * 0.52)));
}

function createSpine() {
  return makeCurve([
    new THREE.Vector3(-5.2, -1.58, -0.7),
    new THREE.Vector3(-4.25, -1.2, -0.16),
    new THREE.Vector3(-3.42, -0.46, 0.48),
    new THREE.Vector3(-2.55, 0.58, 0.86),
    new THREE.Vector3(-1.48, 0.96, 0.18),
    new THREE.Vector3(-0.34, 0.42, -0.64),
    new THREE.Vector3(0.68, -0.42, -0.12),
    new THREE.Vector3(1.72, -0.66, 0.72),
    new THREE.Vector3(2.68, -0.02, 1.04),
    new THREE.Vector3(3.5, 0.92, 0.38),
    new THREE.Vector3(4.74, 1.46, -0.34),
  ]);
}

function createFilament(path: THREE.CatmullRomCurve3, offset: number, phase: number, turns: number) {
  const samples = 72;
  return makeCurve(Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const point = path.getPoint(t);
    const tangent = path.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const envelope = 0.1 + Math.sin(t * Math.PI) * 0.9;
    const lateral = Math.sin(t * Math.PI * turns + phase) * offset * envelope;
    const depth = Math.cos(t * Math.PI * (turns * 0.76) + phase * 0.7) * offset * 1.18 * envelope;
    return point.clone().add(normal.multiplyScalar(lateral)).add(binormal.multiplyScalar(depth));
  }));
}

function createBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const h1 = hash01(`${region.id}:side`);
  const h2 = hash01(`${region.id}:reach`);
  const h3 = hash01(`${region.id}:depth`);
  const dormant = region.energy === "dormant";

  const growthAnchors = [0.2, 0.37, 0.62, 0.8, 0.9];
  const anchorT = region.domain === "work" ? 0.57 : region.domain === "history" ? 0.79 : growthAnchors[index % growthAnchors.length];
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();

  if (region.domain === "work") {
    const reach = 3.0 + h2 * 0.8;
    return makeCurve([
      anchor.clone(),
      anchor.clone().add(tangent.clone().multiplyScalar(0.28)),
      anchor.clone().add(new THREE.Vector3(reach * 0.25, -0.18, 0.18)),
      anchor.clone().add(new THREE.Vector3(reach * 0.52, -0.62, 0.5)),
      anchor.clone().add(new THREE.Vector3(reach * 0.78, -0.45, 0.9)),
      anchor.clone().add(new THREE.Vector3(reach, -0.08, 0.64)),
    ]);
  }

  if (region.domain === "history") {
    const reach = 2.3 + h2 * 0.7;
    return makeCurve([
      anchor.clone(),
      anchor.clone().add(new THREE.Vector3(-0.16, 0.12, -0.12)),
      anchor.clone().add(new THREE.Vector3(-reach * 0.3, 0.28, -0.38)),
      anchor.clone().add(new THREE.Vector3(-reach * 0.58, 0.1, -0.7)),
      anchor.clone().add(new THREE.Vector3(-reach * 0.82, -0.28, -0.92)),
      anchor.clone().add(new THREE.Vector3(-reach, -0.58, -1.12)),
    ]);
  }

  const sign = h1 > 0.5 ? 1 : -1;
  const reach = (dormant ? 1.6 : 2.45) + h2 * (dormant ? 0.5 : 0.9);
  const lift = sign * ((dormant ? 0.8 : 1.25) + h3 * 1.7);
  const depth = (h2 - 0.5) * 2.3;

  return makeCurve([
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.2)),
    anchor.clone().add(new THREE.Vector3(reach * 0.2, lift * 0.18, depth * 0.08)),
    anchor.clone().add(new THREE.Vector3(reach * 0.48, lift * 0.52, depth * 0.42)),
    anchor.clone().add(new THREE.Vector3(reach * 0.74, lift * 0.84, depth * 0.8)),
    anchor.clone().add(new THREE.Vector3(reach, lift, depth)),
  ]);
}

function buildTrace(projection: WorldProjection, renderTier: RenderTier): TraceSpec[] {
  const samples = renderTier === "full" ? 148 : 96;
  const spine = createSpine();
  const specs: TraceSpec[] = [];
  const self = projection.regions.find((region) => region.domain === "self");

  if (self) {
    specs.push({
      id: self.id,
      domain: "self",
      curve: spine,
      points: spine.getPoints(samples),
      color: colorFor(self),
      opacity: opacityFor(self),
      radius: renderTier === "full" ? 0.047 : 0.035,
      lineWidth: 0.9,
      phase: hash01(self.id) * Math.PI * 2,
      depth: 1,
      emphasis: self.emphasis,
      dormant: false,
      role: "spine",
      responseX: 0.06,
      responseY: 0.02,
    });

    const count = renderTier === "full" ? 5 : 3;
    for (let index = 0; index < count; index += 1) {
      const curve = createFilament(spine, 0.13 + index * 0.045, 0.8 + index * 1.34, 3.2 + index * 0.3);
      specs.push({
        id: `${self.id}:filament:${index}`,
        domain: "self",
        curve,
        points: curve.getPoints(samples),
        color: index % 3 === 0 ? "#f0e5e9" : index % 3 === 1 ? "#bd91a5" : "#9db8be",
        opacity: 0.22 + self.emphasis * 0.09,
        radius: 0.01,
        lineWidth: 0.54 + (index % 2) * 0.12,
        phase: index * 1.47,
        depth: 0.58 + index * 0.11,
        emphasis: self.emphasis,
        dormant: false,
        role: "filament",
        responseX: -0.62 + index * 0.32,
        responseY: 0.42 - index * 0.18,
      });
    }
  }

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branchIndex = region.domain === "growth" ? growthIndex++ : 0;
    const curve = createBranch(spine, region, branchIndex);
    const dormant = region.energy === "dormant";
    const opacity = opacityFor(region);

    specs.push({
      id: region.id,
      domain: region.domain,
      curve,
      points: curve.getPoints(dormant ? Math.floor(samples * 0.58) : Math.floor(samples * 0.82)),
      color: colorFor(region),
      opacity,
      radius: dormant ? 0.014 : 0.026 + region.emphasis * 0.018,
      lineWidth: dormant ? 0.48 : 0.76 + region.emphasis * 0.4,
      phase: hash01(region.id) * Math.PI * 2,
      depth: 0.62 + hash01(`${region.id}:depth`) * 0.9,
      emphasis: region.emphasis,
      dormant,
      role: "branch",
      responseX: hash01(`${region.id}:response-x`) * 1.6 - 0.8,
      responseY: hash01(`${region.id}:response-y`) * 1.3 - 0.65,
    });

    if (!dormant && renderTier === "full") {
      const companion = createFilament(curve, 0.07, hash01(`${region.id}:companion`) * Math.PI * 2, 2.5);
      specs.push({
        id: `${region.id}:companion`,
        domain: region.domain,
        curve: companion,
        points: companion.getPoints(Math.floor(samples * 0.76)),
        color: colorFor(region),
        opacity: opacity * 0.32,
        radius: 0.008,
        lineWidth: 0.42,
        phase: hash01(`${region.id}:companion-phase`) * Math.PI * 2,
        depth: 0.72,
        emphasis: region.emphasis,
        dormant: false,
        role: "filament",
        responseX: hash01(`${region.id}:companion-x`) * 1.5 - 0.75,
        responseY: hash01(`${region.id}:companion-y`) * 1.2 - 0.6,
      });
    }
  }

  return specs;
}

function transformFor(spec: TraceSpec, chapter: ChapterId, indexOpen: boolean, mobile: boolean): TraceTransform {
  if (indexOpen) {
    const lane: Record<TraceRegion["domain"], number> = { self: 1.62, work: 0.52, growth: -0.52, history: -1.58 };
    const growthScatter = spec.domain === "growth" ? (hash01(`${spec.id}:index-y`) - 0.5) * 0.72 : 0;
    return {
      x: mobile ? 0 : -0.7 + (hash01(`${spec.id}:index-x`) - 0.5) * 0.5,
      y: (lane[spec.domain] + growthScatter) * (mobile ? 0.66 : 1),
      z: spec.role === "filament" ? -0.5 : 0.08,
      scale: mobile ? 0.68 : spec.domain === "self" ? 0.58 : 0.9,
      rz: spec.domain === "self" ? -0.05 : (hash01(`${spec.id}:index-r`) - 0.5) * 0.14,
    };
  }

  if (chapter === "origin") {
    if (spec.domain === "self") return { x: 0, y: 0, z: 0.2, scale: 1.05, rz: 0.02 };
    return { x: 0.42, y: 0, z: -0.7, scale: 0.45, rz: 0 };
  }

  if (chapter === "human") {
    if (spec.domain === "self") return { x: -0.06, y: 0.06, z: 0.12, scale: 1.08, rz: 0.025 };
    return { x: 0.35, y: -0.04, z: -0.72, scale: 0.38, rz: 0 };
  }

  if (chapter === "work") {
    if (spec.domain === "work") return { x: -1.18, y: 0.02, z: 0.52, scale: 1.78, rz: -0.1 };
    if (spec.domain === "self") return { x: 0.62, y: 0.08, z: -0.7, scale: 0.48, rz: 0.045 };
    return { x: 0.42, y: 0, z: -0.92, scale: 0.32, rz: 0.02 };
  }

  if (chapter === "growth") {
    if (spec.domain === "growth") {
      const splay = (hash01(`${spec.id}:growth`) - 0.5) * 1.7;
      return { x: -0.38 + splay * 0.28, y: splay, z: 0.5, scale: 1.72, rz: splay * 0.09 };
    }
    if (spec.domain === "self") return { x: 0.72, y: -0.02, z: -0.78, scale: 0.42, rz: -0.02 };
    return { x: 0.44, y: -0.06, z: -0.94, scale: 0.3, rz: 0 };
  }

  if (chapter === "history") {
    if (spec.domain === "history") return { x: -0.72, y: -0.08, z: 0.5, scale: 1.68, rz: 0.08 };
    if (spec.domain === "self") return { x: 0.72, y: 0.12, z: -0.92, scale: 0.36, rz: -0.035 };
    return { x: 0.46, y: 0, z: -1.02, scale: 0.26, rz: 0 };
  }

  if (chapter === "present") {
    if (spec.domain === "self") return { x: 0, y: 0, z: 0.02, scale: 0.82, rz: 0 };
    return { x: -0.05, y: 0, z: -0.18, scale: 0.74, rz: 0 };
  }

  return { x: 0, y: 0, z: 0, scale: 1, rz: 0 };
}

function presenceFor(spec: TraceSpec, chapter: ChapterId, indexOpen: boolean) {
  if (indexOpen) {
    if (spec.role === "filament") return spec.domain === "self" ? 0.18 : 0.34;
    if (spec.role === "spine") return 0.42;
    return 1.1;
  }
  if (chapter === "origin") return spec.domain === "self" ? (spec.role === "spine" ? 1.02 : 0.78) : 0.12;
  if (chapter === "human") return spec.domain === "self" ? 0.96 : 0.12;
  if (chapter === "work") return spec.domain === "work" ? 1.2 : spec.domain === "self" ? 0.18 : 0.08;
  if (chapter === "growth") return spec.domain === "growth" ? 1.22 : spec.domain === "self" ? 0.16 : 0.08;
  if (chapter === "history") return spec.domain === "history" ? 1.18 : spec.domain === "self" ? 0.12 : 0.07;
  if (chapter === "present") return spec.domain === "self" ? 0.7 : 0.48;
  return 0.6;
}

function Signal({ spec, motionMode, indexOpen }: { spec: TraceSpec; motionMode: MotionMode; indexOpen: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || motionMode === "reduced") return;
    const speed = (spec.domain === "self" ? 0.018 : 0.01 + spec.emphasis * 0.008) * (indexOpen ? 0.32 : 1);
    const t = (state.clock.elapsedTime * speed + spec.phase / (Math.PI * 2)) % 1;
    mesh.current.position.copy(spec.curve.getPoint(t));
    const pulse = 0.76 + Math.sin(state.clock.elapsedTime * 1.24 + spec.phase) * 0.1;
    mesh.current.scale.setScalar(pulse);
  });

  if (spec.dormant || spec.role === "filament") return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[spec.role === "spine" ? 0.028 : 0.032 + spec.emphasis * 0.012, 12, 12]} />
      <meshBasicMaterial color={spec.color} transparent opacity={indexOpen ? 0.5 : 0.62} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Terminal({ spec, indexOpen }: { spec: TraceSpec; indexOpen: boolean }) {
  if (spec.role !== "branch") return null;
  const end = spec.curve.getPoint(1);
  const size = spec.dormant ? 0.024 : 0.038 + spec.emphasis * 0.015;
  return (
    <group position={end}>
      <mesh>
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial color={spec.color} emissive={spec.color} emissiveIntensity={0.7} roughness={0.35} metalness={0.08} transparent opacity={spec.dormant ? 0.22 : indexOpen ? 0.9 : 0.68} depthWrite={false} />
      </mesh>
      {!spec.dormant && (
        <mesh scale={indexOpen ? 3.4 : 2.3}>
          <sphereGeometry args={[size, 12, 12]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function TraceStrand({
  spec,
  interaction,
  motionMode,
  chapter,
  indexOpen,
  mobile,
  renderTier,
}: {
  spec: TraceSpec;
  interaction: MutableRefObject<InteractionState>;
  motionMode: MotionMode;
  chapter: ChapterId;
  indexOpen: boolean;
  mobile: boolean;
  renderTier: RenderTier;
}) {
  const group = useRef<THREE.Group>(null);
  const impulse = useRef(0);
  const impulseVelocity = useRef(0);
  const target = transformFor(spec, chapter, indexOpen, mobile);
  const presence = presenceFor(spec, chapter, indexOpen);
  const opacity = spec.opacity * presence;

  const tubeGeometry = useMemo(() => {
    if (spec.role === "filament" || renderTier !== "full") return null;
    const segments = spec.role === "spine" ? 132 : 86;
    const radial = spec.role === "spine" ? 7 : 6;
    return new THREE.TubeGeometry(spec.curve, segments, spec.radius, radial, false);
  }, [renderTier, spec.curve, spec.radius, spec.role]);

  const shellGeometry = useMemo(() => {
    if (spec.role !== "spine" || renderTier !== "full") return null;
    return new THREE.TubeGeometry(spec.curve, 112, spec.radius * 2.5, 7, false);
  }, [renderTier, spec.curve, spec.radius, spec.role]);

  useEffect(() => () => {
    tubeGeometry?.dispose();
    shellGeometry?.dispose();
  }, [tubeGeometry, shellGeometry]);

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
    const proximity = indexOpen ? 0 : Math.max(0, 1 - distance / 0.96);
    const desiredImpulse = proximity * proximity;

    impulseVelocity.current += (desiredImpulse - impulse.current) * 18 * delta;
    impulseVelocity.current *= Math.exp(-6.4 * delta);
    impulse.current += impulseVelocity.current * delta;

    const direction = Math.sin(spec.phase) >= 0 ? 1 : -1;
    const idle = Math.sin(state.clock.elapsedTime * (spec.role === "filament" ? 0.22 : 0.13) + spec.phase) * 0.018 * spec.depth;
    const kick = impulse.current;
    const px = pointer.pointerX * kick * 0.24 * spec.depth;
    const py = pointer.pointerY * kick * 0.2 * spec.depth;
    const shear = pointer.scrollVelocity * 0.11 * spec.depth * direction;
    const damping = 3.2 + spec.depth;

    node.position.x = THREE.MathUtils.damp(node.position.x, target.x + px, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y + py + shear + idle, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z + kick * 0.16 * direction + shear * 0.32, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz + kick * 0.026 * direction, 3, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, target.scale * (1 + kick * 0.026), 3.2, delta);
    node.scale.setScalar(scale);
  });

  const widthBoost = mobile ? 1.08 : 1;

  return (
    <group ref={group}>
      {shellGeometry && (
        <mesh geometry={shellGeometry}>
          <meshBasicMaterial color={spec.color} transparent opacity={Math.min(0.05, opacity * 0.04)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}

      {tubeGeometry && !spec.dormant && (
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color={spec.color}
            emissive={spec.color}
            emissiveIntensity={spec.role === "spine" ? 0.24 : 0.18}
            roughness={spec.role === "spine" ? 0.28 : 0.42}
            metalness={0.08}
            transparent
            opacity={Math.min(0.62, opacity * (spec.role === "spine" ? 0.56 : 0.64))}
            depthWrite={false}
          />
        </mesh>
      )}

      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.lineWidth * widthBoost}
        transparent
        opacity={spec.role === "filament" ? Math.min(0.38, opacity * 0.78) : Math.min(0.9, opacity * 0.76)}
        depthWrite={false}
        toneMapped={false}
      />

      {spec.role !== "filament" && !spec.dormant && (
        <Line
          points={spec.points}
          color={spec.color}
          lineWidth={spec.lineWidth * 4.4 * widthBoost}
          transparent
          opacity={Math.min(0.05, opacity * 0.05)}
          depthWrite={false}
          toneMapped={false}
        />
      )}

      <Signal spec={spec} motionMode={motionMode} indexOpen={indexOpen} />
      <Terminal spec={spec} indexOpen={indexOpen} />
    </group>
  );
}

function FieldMatter({ renderTier, motionMode, indexOpen, chapter }: { renderTier: RenderTier; motionMode: MotionMode; indexOpen: boolean; chapter: ChapterId }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 138 : 62;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`matter:${index}`) - 0.5) * 12.5;
      positions[index * 3 + 1] = (hash01(`matter:${index}:y`) - 0.5) * 7.4;
      positions[index * 3 + 2] = -1.8 + hash01(`matter:${index}:z`) * 3.8;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * (indexOpen ? 0.00045 : 0.0011);
    points.current.position.y = THREE.MathUtils.damp(points.current.position.y, indexOpen ? 0 : Math.sin(state.clock.elapsedTime * 0.08) * 0.04, 2.2, delta);
    const scale = THREE.MathUtils.damp(points.current.scale.x, indexOpen ? 1.14 : 1, 2.2, delta);
    points.current.scale.setScalar(scale);
  });

  const color = chapter === "growth" ? "#c79b5e" : chapter === "work" ? "#9abac2" : chapter === "history" ? "#8f9299" : "#c8b8be";

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color={color} size={renderTier === "full" ? 0.017 : 0.013} transparent opacity={indexOpen ? 0.07 : 0.095} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function worldTarget(chapter: ChapterId, mobile: boolean, indexOpen: boolean): TraceTransform {
  if (indexOpen) return mobile
    ? { x: 0.02, y: 0, z: -0.55, scale: 0.38, rz: 0 }
    : { x: 1.65, y: 0, z: -0.42, scale: 0.86, rz: 0 };

  const desktop: Record<ChapterId, TraceTransform> = {
    origin: { x: 1.72, y: 0.16, z: 0.1, scale: 0.88, rz: 0.025 },
    human: { x: 1.5, y: 0.02, z: -0.04, scale: 0.92, rz: 0.022 },
    work: { x: 0.02, y: 0.08, z: 0.1, scale: 1.02, rz: -0.028 },
    growth: { x: 0.02, y: 0.08, z: 0.04, scale: 1.02, rz: 0.025 },
    history: { x: 0.34, y: -0.02, z: -0.18, scale: 0.94, rz: -0.02 },
    understanding: { x: 0, y: 0, z: -0.12, scale: 0.94, rz: 0 },
    present: { x: 0.04, y: 0, z: -0.1, scale: 0.9, rz: 0 },
  };

  if (!mobile) return desktop[chapter];

  const mobileTargets: Record<ChapterId, TraceTransform> = {
    origin: { x: 0.48, y: -0.04, z: 0, scale: 0.34, rz: 0.02 },
    human: { x: 0.16, y: -0.04, z: -0.06, scale: 0.4, rz: 0.014 },
    work: { x: -0.02, y: 0.03, z: 0, scale: 0.42, rz: -0.025 },
    growth: { x: 0, y: 0.05, z: 0, scale: 0.43, rz: 0.022 },
    history: { x: 0.04, y: -0.02, z: -0.08, scale: 0.4, rz: -0.016 },
    understanding: { x: 0, y: 0, z: -0.1, scale: 0.4, rz: 0 },
    present: { x: 0.01, y: 0, z: -0.06, scale: 0.39, rz: 0 },
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
    const damping = indexOpen ? 3.6 : 2.8;
    node.position.x = THREE.MathUtils.damp(node.position.x, target.x, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, target.y, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, target.z, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rz, 2.8, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, target.scale, damping, delta);
    node.scale.setScalar(scale);
  });

  return (
    <group ref={root}>
      {specs.map((spec) => (
        <TraceStrand
          key={spec.id}
          spec={spec}
          interaction={interaction}
          motionMode={motionMode}
          chapter={projection.chapter}
          indexOpen={indexOpen}
          mobile={mobile}
          renderTier={renderTier}
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
      dpr={renderTier === "full" ? [1, 1.42] : [1, 1.12]}
      camera={{ position: [0, 0, 8.5], fov: 45, near: 0.1, far: 32 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" || !visible ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady();
      }}
    >
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 5, 6]} intensity={1.1} color="#fff4f7" />
      <pointLight position={[-3, -1, 4]} intensity={4.2} distance={11} decay={2} color="#d24f82" />
      <pointLight position={[4, 2, 3]} intensity={2.4} distance={10} decay={2} color="#8fb5be" />
      <FieldMatter renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} chapter={chapter} />
      <TraceWorld projection={projection} interaction={interaction} renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} />
    </Canvas>
  );
}

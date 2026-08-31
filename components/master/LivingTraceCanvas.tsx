"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
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
  responseX: number;
  responseY: number;
  decorative?: boolean;
};

type LivingTraceCanvasProps = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  onReady: () => void;
};

type StrandTransform = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rz: number;
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
  if (region.domain === "self") return "#e7d8df";
  if (region.domain === "work") return "#9ab8bf";
  if (region.domain === "growth") return "#c39762";
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
  const samples = 48;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const point = spine.getPoint(t);
    const tangent = spine.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const envelope = 0.42 + Math.sin(t * Math.PI) * 0.58;
    const wave = Math.sin(t * Math.PI * 6.2 + phase);
    const depth = Math.cos(t * Math.PI * 4.8 + phase);
    return point.clone()
      .add(normal.multiplyScalar(wave * offset * envelope))
      .add(binormal.multiplyScalar(depth * offset * 0.72 * envelope));
  });
  return makeCurve(points);
}

function createBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const h1 = hash01(`${region.id}:a`);
  const h2 = hash01(`${region.id}:b`);
  const h3 = hash01(`${region.id}:c`);
  const dormant = region.energy === "dormant";

  const growthAnchor = [0.22, 0.39, 0.64, 0.8][index % 4];
  const anchorT = region.domain === "work" ? 0.54 : region.domain === "history" ? 0.76 : growthAnchor;
  const anchor = spine.getPoint(anchorT);
  const tangent = spine.getTangent(anchorT).normalize();
  const sign = h1 > 0.5 ? 1 : -1;
  const length = dormant ? 1.85 + h2 * 0.8 : 2.6 + h2 * 1.28;
  const lift = sign * (0.94 + h3 * 1.84);
  const depth = (h2 - 0.5) * 2.2;

  return makeCurve([
    anchor.clone(),
    anchor.clone().add(tangent.clone().multiplyScalar(0.36)),
    anchor.clone().add(new THREE.Vector3(length * 0.26, lift * 0.14, depth * 0.18)),
    anchor.clone().add(new THREE.Vector3(length * 0.54, lift * 0.5, depth * 0.56)),
    anchor.clone().add(new THREE.Vector3(length * 0.78, lift * 0.82, depth * 0.82)),
    anchor.clone().add(new THREE.Vector3(length, lift, depth)),
  ]);
}

function buildStrands(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const segments = renderTier === "full" ? 112 : 78;
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
      radius: 0.047 * (0.84 + selfRegion.emphasis * 0.2),
      depth: 1,
      phase: hash01(selfRegion.id) * Math.PI * 2,
      dormant: false,
      emphasis: selfRegion.emphasis,
      responseX: -0.16,
      responseY: 0.08,
    });

    const braidCount = renderTier === "full" ? 4 : 3;
    for (let index = 0; index < braidCount; index += 1) {
      const curve = createBraid(spine, 0.085 + index * 0.022, index * 1.72 + 0.55);
      strands.push({
        id: `${selfRegion.id}:braid:${index}`,
        domain: "self",
        curve,
        points: curve.getPoints(segments),
        color: index % 2 === 0 ? "#f1e5ea" : "#b98c9f",
        opacity: 0.2 + selfRegion.emphasis * 0.1,
        radius: 0.0085 + index * 0.0015,
        depth: 0.72 + index * 0.08,
        phase: index * 1.55,
        dormant: false,
        emphasis: selfRegion.emphasis,
        responseX: -0.36 + index * 0.22,
        responseY: 0.14 - index * 0.1,
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
      points: curve.getPoints(dormant ? Math.max(36, Math.floor(segments * 0.64)) : Math.max(50, Math.floor(segments * 0.8))),
      color: regionColor(region),
      opacity: regionOpacity(region),
      radius: dormant ? 0.009 + region.emphasis * 0.008 : 0.02 + region.emphasis * 0.016,
      depth: 0.48 + hash01(`${region.id}:depth`) * 0.82,
      phase: hash01(region.id) * Math.PI * 2,
      dormant,
      emphasis: region.emphasis,
      responseX: hash01(`${region.id}:response-x`) * 1.8 - 0.9,
      responseY: hash01(`${region.id}:response-y`) * 1.4 - 0.7,
    });
  }

  return strands;
}

function SignalPulse({ spec, motionMode, indexOpen }: {
  spec: StrandSpec;
  motionMode: MotionMode;
  indexOpen: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const target = mesh.current;
    if (!target || motionMode === "reduced") return;
    const speedBase = spec.domain === "self" ? 0.03 : 0.015 + spec.emphasis * 0.012;
    const speed = indexOpen ? speedBase * 0.45 : speedBase;
    const t = (state.clock.elapsedTime * speed + spec.phase / (Math.PI * 2)) % 1;
    target.position.copy(spec.curve.getPoint(t));
    const pulse = 0.68 + Math.sin(state.clock.elapsedTime * 1.8 + spec.phase) * 0.16;
    target.scale.setScalar(pulse);
  });

  if (spec.dormant || spec.decorative) return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.028 + spec.emphasis * 0.012, 10, 10]} />
      <meshBasicMaterial
        color={spec.color}
        transparent
        opacity={indexOpen ? 0.42 : 0.62 + spec.emphasis * 0.14}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Terminal({ spec, indexOpen }: { spec: StrandSpec; indexOpen: boolean }) {
  if (spec.decorative || spec.domain === "self") return null;
  const end = spec.curve.getPoint(1);
  const size = spec.dormant ? 0.022 : 0.038 + spec.emphasis * 0.014;

  return (
    <group position={end}>
      <mesh>
        <sphereGeometry args={[size, 10, 10]} />
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.dormant ? 0.2 : indexOpen ? 0.74 : 0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {!spec.dormant && (
        <mesh scale={indexOpen ? 3.2 : 2.35}>
          <sphereGeometry args={[size, 10, 10]} />
          <meshBasicMaterial
            color={spec.color}
            transparent
            opacity={indexOpen ? 0.075 : 0.045}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

function chapterTransform(spec: StrandSpec, chapter: ChapterId, indexOpen: boolean, mobile: boolean): StrandTransform {
  if (indexOpen) {
    const domainY: Record<TraceRegion["domain"], number> = {
      self: 1.9,
      work: 0.82,
      growth: -0.28,
      history: -1.62,
    };
    const spread = spec.domain === "growth" ? (hash01(`${spec.id}:index`) - 0.5) * 0.58 : 0;
    const x = -1.25 + (hash01(`${spec.id}:index-x`) - 0.5) * 0.75;
    const base = {
      x: mobile ? x * 0.32 : x,
      y: mobile ? domainY[spec.domain] * 0.72 + spread : domainY[spec.domain] + spread,
      z: spec.decorative ? -0.55 : -0.18,
      scale: mobile ? 0.62 : spec.domain === "self" ? 0.7 : 0.78,
      rz: spec.domain === "self" ? -0.02 : (hash01(`${spec.id}:index-r`) - 0.5) * 0.16,
    };
    return base;
  }

  const neutral: StrandTransform = { x: 0, y: 0, z: 0, scale: 1, rz: 0 };
  if (chapter === "origin") return spec.domain === "self" ? neutral : { x: 0.08, y: 0, z: -0.16, scale: 0.88, rz: 0 };
  if (chapter === "human") return spec.domain === "self" ? { x: 0.08, y: 0.02, z: 0.12, scale: 1.08, rz: 0.015 } : { x: 0.12, y: -0.04, z: -0.26, scale: 0.76, rz: 0 };
  if (chapter === "work") {
    if (spec.domain === "work") return { x: -0.72, y: 0.16, z: 0.32, scale: 1.46, rz: -0.08 };
    if (spec.domain === "self") return { x: 0.36, y: -0.04, z: -0.42, scale: 0.72, rz: 0.025 };
    return { x: 0.28, y: 0, z: -0.52, scale: 0.62, rz: 0.02 };
  }
  if (chapter === "growth") {
    if (spec.domain === "growth") {
      const splay = (hash01(`${spec.id}:growth-splay`) - 0.5) * 1.12;
      return { x: -0.2 + splay * 0.34, y: splay, z: 0.3, scale: 1.42, rz: splay * 0.08 };
    }
    if (spec.domain === "self") return { x: 0.32, y: 0, z: -0.46, scale: 0.68, rz: -0.015 };
    return { x: 0.18, y: -0.06, z: -0.6, scale: 0.56, rz: 0 };
  }
  if (chapter === "history") {
    if (spec.domain === "history") return { x: -0.44, y: -0.12, z: 0.4, scale: 1.38, rz: 0.07 };
    if (spec.domain === "self") return { x: 0.5, y: 0.02, z: -0.62, scale: 0.58, rz: -0.025 };
    return { x: 0.3, y: 0.02, z: -0.7, scale: 0.52, rz: 0 };
  }
  if (chapter === "present") return { x: 0, y: 0, z: -0.18, scale: spec.domain === "self" ? 0.86 : 0.76, rz: 0 };
  return neutral;
}

function TraceStrand({
  spec,
  interaction,
  motionMode,
  renderTier,
  chapter,
  indexOpen,
  mobile,
}: {
  spec: StrandSpec;
  interaction: MutableRefObject<InteractionState>;
  motionMode: MotionMode;
  renderTier: RenderTier;
  chapter: ChapterId;
  indexOpen: boolean;
  mobile: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const tubularSegments = renderTier === "full" ? 108 : 72;
  const radialSegments = renderTier === "full" ? 6 : 4;
  const transform = chapterTransform(spec, chapter, indexOpen, mobile);

  const coreGeometry = useMemo(
    () => new THREE.TubeGeometry(spec.curve, tubularSegments, spec.radius, radialSegments, false),
    [radialSegments, spec.curve, spec.radius, tubularSegments],
  );
  const haloGeometry = useMemo(
    () => new THREE.TubeGeometry(spec.curve, Math.floor(tubularSegments * 0.68), spec.radius * 3.8, 4, false),
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
      target.position.set(transform.x, transform.y, transform.z);
      target.scale.setScalar(transform.scale);
      target.rotation.z = transform.rz;
      return;
    }

    const pointer = interaction.current;
    const distance = Math.hypot(pointer.pointerX - spec.responseX, pointer.pointerY - spec.responseY);
    const proximity = Math.max(0, 1 - distance / 1.15);
    const influence = proximity * proximity;
    const phaseDirection = Math.sin(spec.phase) >= 0 ? 1 : -1;
    const idle = Math.sin(state.clock.elapsedTime * 0.22 + spec.phase) * 0.018 * spec.depth;
    const disturbanceX = indexOpen ? 0 : pointer.pointerX * influence * 0.3 * spec.depth;
    const disturbanceY = indexOpen ? 0 : pointer.pointerY * influence * 0.24 * spec.depth;
    const velocityShear = indexOpen ? 0 : pointer.scrollVelocity * 0.2 * spec.depth * phaseDirection;
    const damping = 2.7 + spec.depth * 1.35;

    target.position.x = THREE.MathUtils.damp(target.position.x, transform.x + disturbanceX, damping, delta);
    target.position.y = THREE.MathUtils.damp(target.position.y, transform.y + disturbanceY + velocityShear + idle, damping, delta);
    target.position.z = THREE.MathUtils.damp(target.position.z, transform.z + velocityShear * 0.46, damping, delta);
    target.rotation.z = THREE.MathUtils.damp(target.rotation.z, transform.rz + influence * 0.018 * phaseDirection, 2.6, delta);
    const nextScale = THREE.MathUtils.damp(target.scale.x, transform.scale * (1 + influence * 0.025), 2.8, delta);
    target.scale.setScalar(nextScale);
  });

  const indexFactor = indexOpen ? 0.82 : 1;

  return (
    <group ref={group}>
      <mesh geometry={haloGeometry}>
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={spec.opacity * (spec.dormant ? 0.018 : 0.052) * indexFactor}
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
          opacity={spec.opacity * (spec.decorative ? 0.42 : 0.72) * indexFactor}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <Line
        points={spec.points}
        color={spec.color}
        lineWidth={spec.domain === "self" && !spec.decorative ? 1.05 : 0.72}
        transparent
        opacity={Math.min(0.9, spec.opacity * (spec.dormant ? 0.56 : 0.92) * indexFactor)}
        depthWrite={false}
        toneMapped={false}
      />
      <SignalPulse spec={spec} motionMode={motionMode} indexOpen={indexOpen} />
      <Terminal spec={spec} indexOpen={indexOpen} />
    </group>
  );
}

function FieldMatter({ renderTier, motionMode, indexOpen }: {
  renderTier: RenderTier;
  motionMode: MotionMode;
  indexOpen: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 128 : 68;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`matter:${index}`) - 0.5) * 12;
      positions[index * 3 + 1] = (hash01(`matter:${index}:y`) - 0.5) * 7;
      positions[index * 3 + 2] = -1.7 + hash01(`matter:${index}:z`) * 3.4;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * (indexOpen ? 0.0008 : 0.0022);
    points.current.position.y = THREE.MathUtils.damp(
      points.current.position.y,
      (indexOpen ? 0 : Math.sin(state.clock.elapsedTime * 0.11) * 0.045),
      2.4,
      delta,
    );
    const scale = THREE.MathUtils.damp(points.current.scale.x, indexOpen ? 1.28 : 1, 2.2, delta);
    points.current.scale.setScalar(scale);
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#cbbac1"
        size={renderTier === "full" ? 0.018 : 0.014}
        transparent
        opacity={indexOpen ? 0.09 : 0.16}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function chapterTarget(chapter: ChapterId, mobile: boolean, indexOpen: boolean) {
  if (indexOpen) {
    return mobile
      ? { x: 0.16, y: 0.02, z: -0.58, scale: 0.8, rz: 0 }
      : { x: 0.72, y: 0, z: -0.52, scale: 0.88, rz: 0 };
  }

  const desktop: Record<ChapterId, { x: number; y: number; z: number; scale: number; rz: number }> = {
    origin: { x: 0.72, y: 0.04, z: 0.08, scale: 1.14, rz: -0.025 },
    human: { x: 1.02, y: -0.12, z: -0.16, scale: 1.02, rz: 0.02 },
    work: { x: -0.18, y: 0.1, z: 0.12, scale: 1.08, rz: -0.035 },
    growth: { x: 0.08, y: 0.18, z: 0.06, scale: 1.06, rz: 0.035 },
    history: { x: 0.54, y: -0.08, z: -0.34, scale: 0.94, rz: -0.028 },
    understanding: { x: 0, y: 0, z: -0.16, scale: 1, rz: 0 },
    present: { x: 0.08, y: 0, z: -0.24, scale: 0.9, rz: 0.012 },
  };
  const value = desktop[chapter];
  if (!mobile) return value;
  return {
    x: value.x * 0.3,
    y: value.y + 0.1,
    z: value.z - 0.28,
    scale: value.scale * 0.72,
    rz: value.rz * 0.5,
  };
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
  const strands = useMemo(() => buildStrands(projection, renderTier), [projection, renderTier]);
  const target = chapterTarget(projection.chapter, mobile, indexOpen);

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

    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, indexOpen ? 3.2 : 2.45, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, target.y, indexOpen ? 3.2 : 2.45, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.z, indexOpen ? 3.2 : 2.45, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rz, 2.4, delta);
    const nextScale = THREE.MathUtils.damp(group.scale.x, target.scale, indexOpen ? 3.1 : 2.35, delta);
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
          chapter={projection.chapter}
          indexOpen={indexOpen}
          mobile={mobile}
        />
      ))}
    </group>
  );
}

export default function LivingTraceCanvas({ renderTier, motionMode, onReady }: LivingTraceCanvasProps) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const [indexOpen, setIndexOpen] = useState(false);
  const interaction = useRef<InteractionState>({ pointerX: 0, pointerY: 0, scrollVelocity: 0 });
  const livingState = useMemo(() => createCurrentLivingState(new Date().toISOString()), []);
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
      const detail = (event as CustomEvent<{ scrollVelocity?: number }>).detail;
      interaction.current.scrollVelocity = detail?.scrollVelocity ?? 0;
    };

    const onChapter = (event: Event) => {
      const next = (event as CustomEvent<ChapterId>).detail;
      if (next) setChapter(next);
    };

    const onIndex = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setIndexOpen(Boolean(detail?.open));
      if (detail?.open) interaction.current.scrollVelocity = 0;
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
      dpr={renderTier === "full" ? [1, 1.5] : [1, 1.18]}
      camera={{ position: [0, 0, 8.3], fov: 46, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
    >
      <FieldMatter renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} />
      <TraceWorld
        projection={projection}
        interaction={interaction}
        renderTier={renderTier}
        motionMode={motionMode}
        indexOpen={indexOpen}
      />
    </Canvas>
  );
}

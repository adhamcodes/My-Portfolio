"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ChapterId, MotionMode, PublicLivingState, RenderTier, TraceRegion, WorldProjection } from "@/core/contracts";
import { createWorldProjection } from "@/core/projection";

type LivingTraceCanvasProps = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  livingState: PublicLivingState;
  onReady: () => void;
};

type InteractionState = {
  x: number;
  y: number;
  velocity: number;
};

type StrandSpec = {
  id: string;
  curve: THREE.CatmullRomCurve3;
  color: string;
  radius: number;
  opacity: number;
  phase: number;
  domain: TraceRegion["domain"];
};

function hash01(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function makeCurve(points: THREE.Vector3[], closed = false) {
  return new THREE.CatmullRomCurve3(points, closed, "catmullrom", 0.38);
}

function domainColor(domain: TraceRegion["domain"]) {
  if (domain === "work") return "#88b7c1";
  if (domain === "growth") return "#d1a05e";
  if (domain === "history") return "#8d919b";
  return "#e7cdd8";
}

function createOriginCurve(index: number) {
  const phase = index * 0.83;
  const lateral = (index - 2.5) * 0.045;
  const depth = (index % 2 === 0 ? 1 : -1) * (0.16 + index * 0.025);
  const points = [
    new THREE.Vector3(-1.95, -0.4 + lateral, -0.16 + depth * 0.2),
    new THREE.Vector3(-1.32, 0.12 + Math.sin(phase) * 0.16, 0.14 + depth),
    new THREE.Vector3(-0.72, 0.86 + Math.cos(phase) * 0.13, -0.28 - depth * 0.4),
    new THREE.Vector3(0.05, 1.08 + lateral * 2.1, 0.34 + depth * 0.5),
    new THREE.Vector3(0.82, 0.58 + Math.sin(phase + 1) * 0.2, 0.48 - depth),
    new THREE.Vector3(1.06, -0.16 + lateral, -0.06 + depth * 0.65),
    new THREE.Vector3(0.52, -0.92 + Math.cos(phase + 2) * 0.14, -0.48 - depth * 0.5),
    new THREE.Vector3(-0.34, -1.02 - lateral, 0.18 + depth),
    new THREE.Vector3(-1.0, -0.5 + Math.sin(phase + 3) * 0.15, 0.5 - depth * 0.3),
    new THREE.Vector3(-0.7, 0.16 + lateral, -0.58 + depth * 0.2),
    new THREE.Vector3(0.05, 0.38 + Math.cos(phase + 4) * 0.16, -0.2 - depth),
    new THREE.Vector3(0.9, 0.12 + lateral, 0.2 + depth * 0.35),
    new THREE.Vector3(1.72, -0.18 + Math.sin(phase + 5) * 0.12, -0.12 - depth * 0.25),
    new THREE.Vector3(2.7, -0.04 + lateral * 1.5, -0.3 + depth * 0.15),
  ];
  return makeCurve(points);
}

function createJourneySpine() {
  return makeCurve([
    new THREE.Vector3(-5.4, -1.45, -0.28),
    new THREE.Vector3(-4.25, -1.0, 0.16),
    new THREE.Vector3(-3.2, -0.18, 0.34),
    new THREE.Vector3(-2.1, 0.42, -0.04),
    new THREE.Vector3(-0.95, 0.58, -0.34),
    new THREE.Vector3(0.18, 0.1, 0.06),
    new THREE.Vector3(1.3, -0.24, 0.42),
    new THREE.Vector3(2.42, 0.18, 0.54),
    new THREE.Vector3(3.48, 0.82, 0.08),
    new THREE.Vector3(4.72, 1.24, -0.3),
    new THREE.Vector3(5.55, 1.12, -0.12),
  ]);
}

function createJourneyBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const anchorByDomain: Record<TraceRegion["domain"], number> = {
    self: 0.34,
    work: 0.57,
    growth: 0.29 + (index % 3) * 0.17,
    history: 0.78,
  };
  const t = anchorByDomain[region.domain];
  const anchor = spine.getPoint(t);
  const tangent = spine.getTangent(t).normalize();
  const h = hash01(region.id);
  const sign = h > 0.5 ? 1 : -1;
  const reach = region.domain === "growth" ? 2.05 + h * 1.2 : region.domain === "work" ? 2.8 : 2.2;
  const lift = region.domain === "history" ? -1.1 : sign * (0.95 + hash01(`${region.id}:lift`) * 1.15);
  const z = (hash01(`${region.id}:z`) - 0.5) * 1.4;
  return makeCurve([
    anchor,
    anchor.clone().add(tangent.clone().multiplyScalar(.3)),
    anchor.clone().add(new THREE.Vector3(reach * .28, lift * .16, z * .18)),
    anchor.clone().add(new THREE.Vector3(reach * .56, lift * .48, z * .55)),
    anchor.clone().add(new THREE.Vector3(reach * .82, lift * .78, z * .82)),
    anchor.clone().add(new THREE.Vector3(reach, lift, z)),
  ]);
}

function originSpecs(renderTier: RenderTier): StrandSpec[] {
  const count = renderTier === "full" ? 7 : 5;
  return Array.from({ length: count }, (_, index) => ({
    id: `origin:${index}`,
    curve: createOriginCurve(index),
    color: index === 0 ? "#f0dbe4" : index % 3 === 1 ? "#b97f99" : index % 3 === 2 ? "#8dafb7" : "#d7b3c2",
    radius: renderTier === "full" ? 0.026 + (index % 3) * .005 : 0.025 + (index % 2) * .004,
    opacity: index === 0 ? .86 : .5 - index * .025,
    phase: index * 1.13,
    domain: "self" as const,
  }));
}

function journeySpecs(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const spine = createJourneySpine();
  const result: StrandSpec[] = [{
    id: "journey:self",
    curve: spine,
    color: "#e3cbd6",
    radius: renderTier === "full" ? .031 : .027,
    opacity: .68,
    phase: .4,
    domain: "self",
  }];

  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const branch = createJourneyBranch(spine, region, region.domain === "growth" ? growthIndex++ : 0);
    result.push({
      id: region.id,
      curve: branch,
      color: domainColor(region.domain),
      radius: region.energy === "dormant" ? .012 : .018 + region.emphasis * .005,
      opacity: region.energy === "dormant" ? .2 : .38 + region.emphasis * .14,
      phase: hash01(region.id) * Math.PI * 2,
      domain: region.domain,
    });
  }
  return result;
}

function TubeStrand({ spec, active, motionMode, renderTier, glow = true }: {
  spec: StrandSpec;
  active: boolean;
  motionMode: MotionMode;
  renderTier: RenderTier;
  glow?: boolean;
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const segments = renderTier === "full" ? 148 : 96;
  const radial = renderTier === "full" ? 9 : 7;

  useFrame((state, delta) => {
    const target = active ? spec.opacity : 0.025;
    if (material.current) {
      material.current.opacity = THREE.MathUtils.damp(material.current.opacity, target, 4.2, delta);
      material.current.emissiveIntensity = THREE.MathUtils.damp(
        material.current.emissiveIntensity,
        active ? .52 + Math.sin(state.clock.elapsedTime * .34 + spec.phase) * .08 : .08,
        2.8,
        delta,
      );
    }
    if (glowMaterial.current) {
      glowMaterial.current.opacity = THREE.MathUtils.damp(glowMaterial.current.opacity, active ? spec.opacity * .055 : .004, 3.8, delta);
    }
    if (mesh.current && motionMode !== "reduced") {
      mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * .12 + spec.phase) * .0025;
    }
  });

  return (
    <group>
      {glow && (
        <mesh>
          <tubeGeometry args={[spec.curve, segments, spec.radius * 2.85, radial, false]} />
          <meshBasicMaterial
            ref={glowMaterial}
            color={spec.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh ref={mesh}>
        <tubeGeometry args={[spec.curve, segments, spec.radius, radial, false]} />
        <meshStandardMaterial
          ref={material}
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={.2}
          roughness={.34}
          metalness={.06}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function OriginKnot({ interaction, renderTier, motionMode, active }: {
  interaction: React.MutableRefObject<InteractionState>;
  renderTier: RenderTier;
  motionMode: MotionMode;
  active: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mobile = useThree((state) => state.size.width < 760);
  const specs = useMemo(() => originSpecs(renderTier), [renderTier]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const node = group.current;
    const pointer = interaction.current;
    const scaleTarget = active ? (mobile ? .78 : 1.22) : (mobile ? .42 : .58);
    const xTarget = mobile ? .82 : 2.28;
    const yTarget = mobile ? .43 : .1;
    const zTarget = active ? .2 : -.72;
    const mass = active ? 2.7 : 3.5;

    node.position.x = THREE.MathUtils.damp(node.position.x, xTarget + pointer.x * (active ? .055 : .018), mass, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, yTarget + pointer.y * (active ? .04 : .012) + pointer.velocity * .025, mass, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, zTarget, mass, delta);
    const scale = THREE.MathUtils.damp(node.scale.x, scaleTarget, mass, delta);
    node.scale.setScalar(scale);

    if (motionMode !== "reduced") {
      const rx = active ? pointer.y * .055 : 0;
      const ry = active ? pointer.x * .08 : 0;
      node.rotation.x = THREE.MathUtils.damp(node.rotation.x, rx + Math.sin(state.clock.elapsedTime * .18) * .012, 2.4, delta);
      node.rotation.y = THREE.MathUtils.damp(node.rotation.y, ry + Math.cos(state.clock.elapsedTime * .16) * .018, 2.4, delta);
      node.rotation.z = THREE.MathUtils.damp(node.rotation.z, active ? -.085 : -.02, 2.4, delta);
    }
  });

  return (
    <group ref={group}>
      {specs.map((spec) => <TubeStrand key={spec.id} spec={spec} active={active} motionMode={motionMode} renderTier={renderTier} />)}
      {[.18, .48, .76].map((t, index) => {
        const point = specs[0].curve.getPoint(t);
        return (
          <group key={t} position={point}>
            <mesh>
              <sphereGeometry args={[.046 + index * .008, 14, 14]} />
              <meshStandardMaterial color="#f3dce6" emissive="#d77d9e" emissiveIntensity={.85} roughness={.22} transparent opacity={active ? .72 : .12} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh scale={3.4}>
              <sphereGeometry args={[.046 + index * .008, 10, 10]} />
              <meshBasicMaterial color="#d77d9e" transparent opacity={active ? .025 : .004} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function JourneyArchitecture({ projection, renderTier, motionMode, indexOpen, active }: {
  projection: WorldProjection;
  renderTier: RenderTier;
  motionMode: MotionMode;
  indexOpen: boolean;
  active: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mobile = useThree((state) => state.size.width < 760);
  const specs = useMemo(() => journeySpecs(projection, renderTier), [projection, renderTier]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const node = group.current;
    const chapter = projection.chapter;
    const chapterTarget: Record<ChapterId, [number, number, number, number, number]> = {
      origin: [mobile ? .1 : 1.7, mobile ? -.22 : -.18, -.8, mobile ? .32 : .54, 0],
      human: [mobile ? .18 : 1.52, mobile ? -.06 : .02, -.1, mobile ? .43 : .9, .02],
      work: [mobile ? -.02 : -.08, mobile ? .02 : .08, .12, mobile ? .45 : 1.03, -.03],
      growth: [mobile ? 0 : .05, mobile ? .05 : .12, .08, mobile ? .45 : 1.02, .035],
      history: [mobile ? .05 : .45, mobile ? -.04 : -.06, -.26, mobile ? .42 : .9, -.02],
      understanding: [0, 0, -.16, mobile ? .42 : .94, 0],
      present: [mobile ? .02 : .12, 0, -.2, mobile ? .4 : .84, .01],
    };
    let [x, y, z, scale, rz] = chapterTarget[chapter];
    if (indexOpen) {
      x = mobile ? .04 : 1.1;
      y = 0;
      z = -.5;
      scale = mobile ? .42 : .78;
      rz = 0;
    }
    const damping = indexOpen ? 3.6 : 2.8;
    node.position.x = THREE.MathUtils.damp(node.position.x, x, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, y, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, z, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, rz, damping, delta);
    const nextScale = THREE.MathUtils.damp(node.scale.x, scale, damping, delta);
    node.scale.setScalar(nextScale);
  });

  return (
    <group ref={group}>
      {specs.map((spec) => (
        <TubeStrand
          key={spec.id}
          spec={spec}
          active={active || indexOpen}
          motionMode={motionMode}
          renderTier={renderTier}
          glow={spec.domain !== "growth" || spec.opacity > .25}
        />
      ))}
    </group>
  );
}

function Matter({ renderTier, motionMode, chapter }: { renderTier: RenderTier; motionMode: MotionMode; chapter: ChapterId }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 180 : 84;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`v3:matter:${index}`) - .5) * 11;
      positions[index * 3 + 1] = (hash01(`v3:matter:${index}:y`) - .5) * 6.6;
      positions[index * 3 + 2] = -2 + hash01(`v3:matter:${index}:z`) * 3;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * .0014;
    points.current.position.y = Math.sin(state.clock.elapsedTime * .1) * .025;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={chapter === "origin" ? "#d6aabd" : "#b8adb2"}
        size={renderTier === "full" ? .017 : .014}
        transparent
        opacity={chapter === "origin" ? .13 : .075}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function TraceWorld({ projection, renderTier, motionMode, interaction, indexOpen }: {
  projection: WorldProjection;
  renderTier: RenderTier;
  motionMode: MotionMode;
  interaction: React.MutableRefObject<InteractionState>;
  indexOpen: boolean;
}) {
  const originActive = projection.chapter === "origin" && !indexOpen;
  return (
    <>
      <ambientLight intensity={.16} />
      <pointLight position={[3.8, 2.8, 5]} color="#f0c6d7" intensity={1.7} distance={11} decay={1.8} />
      <pointLight position={[1.2, -2.5, 3]} color="#7fa8b4" intensity={.72} distance={9} decay={2} />
      <Matter renderTier={renderTier} motionMode={motionMode} chapter={projection.chapter} />
      <OriginKnot interaction={interaction} renderTier={renderTier} motionMode={motionMode} active={originActive} />
      <JourneyArchitecture projection={projection} renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} active={!originActive} />
    </>
  );
}

export default function LivingTraceCanvasV3({ renderTier, motionMode, livingState, onReady }: LivingTraceCanvasProps) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const [indexOpen, setIndexOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const interaction = useRef<InteractionState>({ x: 0, y: 0, velocity: 0 });
  const projection = useMemo(() => createWorldProjection(livingState, chapter), [livingState, chapter]);

  useEffect(() => {
    const root = document.documentElement;
    const stored = root.dataset.chapter as ChapterId | undefined;
    if (stored) setChapter(stored);
    setIndexOpen(root.dataset.indexOpen === "true");
    setVisible(document.visibilityState === "visible");

    const onPointer = (event: PointerEvent) => {
      if (motionMode === "reduced") return;
      interaction.current.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      interaction.current.y = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };
    const onMotion = (event: Event) => {
      interaction.current.velocity = (event as CustomEvent<{ scrollVelocity?: number }>).detail?.scrollVelocity ?? 0;
    };
    const onChapter = (event: Event) => {
      const next = (event as CustomEvent<ChapterId>).detail;
      if (next) setChapter(next);
    };
    const onIndex = (event: Event) => {
      setIndexOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    };
    const onVisibility = (event: Event) => {
      setVisible(Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible));
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("adham:motion", onMotion);
    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("adham:index", onIndex);
    window.addEventListener("adham:visibility", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("adham:motion", onMotion);
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("adham:index", onIndex);
      window.removeEventListener("adham:visibility", onVisibility);
    };
  }, [motionMode]);

  return (
    <Canvas
      className="living-trace-canvas"
      dpr={renderTier === "full" ? [1, 1.35] : [1, 1.08]}
      camera={{ position: [0, 0, 8.6], fov: 44, near: .1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" || !visible ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady();
      }}
    >
      <TraceWorld projection={projection} renderTier={renderTier} motionMode={motionMode} interaction={interaction} indexOpen={indexOpen} />
    </Canvas>
  );
}

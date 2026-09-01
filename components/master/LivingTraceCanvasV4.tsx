"use client";

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

type Props = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  livingState: PublicLivingState;
  onReady: () => void;
};

type Interaction = { x: number; y: number; velocity: number };

type StrandSpec = {
  id: string;
  domain: TraceRegion["domain"];
  curve: THREE.CatmullRomCurve3;
  color: string;
  radius: number;
  opacity: number;
  phase: number;
  glow: number;
  dormant?: boolean;
};

function hash01(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function curve(points: Array<[number, number, number]>) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "catmullrom",
    0.36,
  );
}

const COLORS: Record<TraceRegion["domain"], string> = {
  self: "#e9d1dc",
  work: "#8eb8c2",
  growth: "#d1a05e",
  history: "#8e919a",
};

function selfCoreCurve() {
  return curve([
    [-2.25, -.18, -.16],
    [-1.58, .34, .28],
    [-.82, 1.05, -.16],
    [.1, 1.18, .48],
    [.96, .62, .2],
    [1.1, -.22, -.38],
    [.52, -1.0, -.1],
    [-.38, -1.08, .52],
    [-1.1, -.48, .2],
    [-.92, .22, -.55],
    [-.08, .48, -.18],
    [.88, .12, .38],
    [1.7, -.22, .02],
    [2.65, -.06, -.24],
  ]);
}

function selfCompanionCurve() {
  return curve([
    [-2.02, -.3, .28],
    [-1.38, .52, -.34],
    [-.46, .98, .35],
    [.42, .86, -.5],
    [1.12, .22, .42],
    [.88, -.72, .18],
    [.02, -1.04, -.46],
    [-.8, -.64, .38],
    [-.66, .02, .12],
    [.16, .3, .46],
    [1.02, -.02, -.3],
    [1.9, -.06, .18],
    [2.72, .06, -.04],
  ]);
}

function workCurve(seed: number) {
  const lift = (seed - .5) * .2;
  return curve([
    [.56, .18, .05],
    [1.18, .42 + lift, -.18],
    [1.86, .7 + lift, .26],
    [2.58, .52 + lift, .55],
    [3.18, .12 + lift, .2],
    [3.86, -.08 + lift, -.2],
    [4.68, .06 + lift, -.38],
  ]);
}

function growthCurve(index: number, seed: number) {
  const configs: Array<Array<[number, number, number]>> = [
    [[-.62,.64,.08],[-.78,1.18,.28],[-.48,1.78,-.08],[.02,2.28,.18],[.56,2.64,-.16]],
    [[.16,-.72,.04],[.22,-1.22,-.24],[.62,-1.72,.24],[1.18,-2.04,-.08],[1.82,-2.2,.12]],
    [[1.02,.42,-.04],[1.34,.94,-.34],[1.74,1.42,.14],[2.18,1.7,.42],[2.62,1.92,-.02]],
  ];
  const points = configs[index % configs.length].map(([x, y, z], pointIndex) => [
    x + (seed - .5) * .16 * pointIndex,
    y + Math.sin(seed * 7 + pointIndex) * .05,
    z + (seed - .5) * .18,
  ] as [number, number, number]);
  return curve(points);
}

function historyCurve(seed: number) {
  const shift = (seed - .5) * .16;
  return curve([
    [-.92, -.38, .12],
    [-1.42, -.82 + shift, -.12],
    [-1.92, -1.28 + shift, .24],
    [-2.52, -1.46 + shift, -.08],
    [-3.02, -1.18 + shift, -.32],
    [-3.44, -.78 + shift, -.04],
  ]);
}

function originSpecs(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const specs: StrandSpec[] = [
    {
      id: "origin:self:core",
      domain: "self",
      curve: selfCoreCurve(),
      color: "#efdce5",
      radius: renderTier === "full" ? .061 : .052,
      opacity: .88,
      phase: .3,
      glow: .07,
    },
    {
      id: "origin:self:companion",
      domain: "self",
      curve: selfCompanionCurve(),
      color: "#b88099",
      radius: renderTier === "full" ? .034 : .029,
      opacity: .64,
      phase: 1.7,
      glow: .045,
    },
  ];

  const regions = projection.regions.filter((region) => region.domain !== "self");
  let growthIndex = 0;
  let seenWork = false;
  let seenHistory = false;

  for (const region of regions) {
    const seed = hash01(region.id);
    if (region.domain === "work" && !seenWork) {
      seenWork = true;
      specs.push({
        id: `origin:${region.id}`,
        domain: "work",
        curve: workCurve(seed),
        color: COLORS.work,
        radius: renderTier === "full" ? .036 : .031,
        opacity: .58 + Math.min(.14, region.emphasis * .08),
        phase: seed * Math.PI * 2,
        glow: .04,
      });
      continue;
    }

    if (region.domain === "growth") {
      const index = growthIndex++;
      if (renderTier !== "full" && index > 1) continue;
      specs.push({
        id: `origin:${region.id}`,
        domain: "growth",
        curve: growthCurve(index, seed),
        color: COLORS.growth,
        radius: renderTier === "full" ? .014 + region.emphasis * .006 : .013,
        opacity: region.energy === "dormant" ? .22 : .42,
        phase: seed * Math.PI * 2,
        glow: region.energy === "dormant" ? .012 : .025,
        dormant: region.energy === "dormant",
      });
      continue;
    }

    if (region.domain === "history" && !seenHistory) {
      seenHistory = true;
      specs.push({
        id: `origin:${region.id}`,
        domain: "history",
        curve: historyCurve(seed),
        color: COLORS.history,
        radius: renderTier === "full" ? .018 : .016,
        opacity: .26,
        phase: seed * Math.PI * 2,
        glow: .012,
        dormant: true,
      });
    }
  }

  return specs;
}

function journeySpine() {
  return curve([
    [-5.5,-1.38,-.22],[-4.35,-.92,.14],[-3.22,-.12,.34],[-2.08,.46,-.04],[-.9,.56,-.32],
    [.2,.08,.05],[1.34,-.24,.42],[2.46,.16,.52],[3.5,.8,.08],[4.72,1.22,-.28],[5.55,1.1,-.1],
  ]);
}

function journeyBranch(spine: THREE.CatmullRomCurve3, region: TraceRegion, index: number) {
  const anchor = region.domain === "work" ? .57 : region.domain === "history" ? .78 : .28 + (index % 3) * .18;
  const start = spine.getPoint(anchor);
  const seed = hash01(region.id);
  const sign = seed > .5 ? 1 : -1;
  const reach = region.domain === "work" ? 2.85 : region.domain === "growth" ? 2 + seed * 1.15 : 2.2;
  const lift = region.domain === "history" ? -1.1 : sign * (.9 + hash01(`${region.id}:lift`) * 1.15);
  const depth = (hash01(`${region.id}:z`) - .5) * 1.35;
  return new THREE.CatmullRomCurve3([
    start,
    start.clone().add(new THREE.Vector3(reach * .18, lift * .08, depth * .08)),
    start.clone().add(new THREE.Vector3(reach * .42, lift * .3, depth * .35)),
    start.clone().add(new THREE.Vector3(reach * .7, lift * .62, depth * .68)),
    start.clone().add(new THREE.Vector3(reach, lift, depth)),
  ], false, "catmullrom", .38);
}

function journeySpecs(projection: WorldProjection, renderTier: RenderTier): StrandSpec[] {
  const spine = journeySpine();
  const specs: StrandSpec[] = [{
    id: "journey:self",
    domain: "self",
    curve: spine,
    color: COLORS.self,
    radius: renderTier === "full" ? .034 : .029,
    opacity: .68,
    phase: .4,
    glow: .04,
  }];
  let growthIndex = 0;
  for (const region of projection.regions) {
    if (region.domain === "self") continue;
    const index = region.domain === "growth" ? growthIndex++ : 0;
    if (renderTier !== "full" && region.domain === "growth" && index > 1) continue;
    specs.push({
      id: region.id,
      domain: region.domain,
      curve: journeyBranch(spine, region, index),
      color: COLORS[region.domain],
      radius: region.energy === "dormant" ? .012 : .018 + region.emphasis * .005,
      opacity: region.energy === "dormant" ? .18 : .34 + region.emphasis * .12,
      phase: hash01(region.id) * Math.PI * 2,
      glow: region.energy === "dormant" ? .008 : .025,
      dormant: region.energy === "dormant",
    });
  }
  return specs;
}

function Strand({
  spec,
  active,
  motionMode,
  renderTier,
  interaction,
  origin,
}: {
  spec: StrandSpec;
  active: boolean;
  motionMode: MotionMode;
  renderTier: RenderTier;
  interaction?: MutableRefObject<Interaction>;
  origin?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const segments = renderTier === "full" ? 154 : 92;
  const radial = renderTier === "full" ? 10 : 7;

  useFrame((state, delta) => {
    const target = active ? spec.opacity : .018;
    if (material.current) {
      material.current.opacity = THREE.MathUtils.damp(material.current.opacity, target, 4.1, delta);
      material.current.emissiveIntensity = THREE.MathUtils.damp(
        material.current.emissiveIntensity,
        active ? .24 + Math.sin(state.clock.elapsedTime * .27 + spec.phase) * .045 : .045,
        2.6,
        delta,
      );
    }
    if (glow.current) {
      glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, active ? spec.glow : .002, 3.6, delta);
    }
    if (!group.current || motionMode === "reduced") return;

    const pointer = interaction?.current;
    const signed = Math.sin(spec.phase * 1.7) >= 0 ? 1 : -1;
    const px = origin && pointer ? pointer.x * .035 * signed : 0;
    const py = origin && pointer ? pointer.y * .027 * Math.cos(spec.phase + .4) : 0;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, px, 3 + (spec.dormant ? 1.2 : 0), delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, py, 3.2, delta);
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      origin && pointer ? pointer.x * .008 * signed : Math.sin(state.clock.elapsedTime * .11 + spec.phase) * .0018,
      2.5,
      delta,
    );
  });

  return (
    <group ref={group}>
      {spec.glow > 0 && (
        <mesh>
          <tubeGeometry args={[spec.curve, segments, spec.radius * 2.7, radial, false]} />
          <meshBasicMaterial
            ref={glow}
            color={spec.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh>
        <tubeGeometry args={[spec.curve, segments, spec.radius, radial, false]} />
        <meshPhysicalMaterial
          ref={material}
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={.08}
          roughness={spec.dormant ? .56 : .32}
          metalness={.04}
          clearcoat={spec.dormant ? 0 : .28}
          clearcoatRoughness={.48}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Terminal({ spec, active }: { spec: StrandSpec; active: boolean }) {
  if (spec.domain !== "growth") return null;
  const end = spec.curve.getPoint(1);
  return (
    <group position={end}>
      <mesh>
        <sphereGeometry args={[spec.dormant ? .022 : .032, 10, 10]} />
        <meshBasicMaterial color={spec.color} transparent opacity={active ? (spec.dormant ? .26 : .55) : .04} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh scale={4.2}>
        <sphereGeometry args={[spec.dormant ? .022 : .032, 8, 8]} />
        <meshBasicMaterial color={spec.color} transparent opacity={active ? .018 : .002} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function OriginTopology({
  projection,
  renderTier,
  motionMode,
  interaction,
  active,
}: {
  projection: WorldProjection;
  renderTier: RenderTier;
  motionMode: MotionMode;
  interaction: MutableRefObject<Interaction>;
  active: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mobile = useThree((state) => state.size.width < 760);
  const specs = useMemo(() => originSpecs(projection, renderTier), [projection, renderTier]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const pointer = interaction.current;
    const targetScale = active ? (mobile ? .74 : 1.16) : (mobile ? .38 : .52);
    const targetX = mobile ? .72 : 2.15;
    const targetY = mobile ? .38 : .08;
    const targetZ = active ? .28 : -.72;
    const damping = active ? 2.75 : 3.5;

    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX + pointer.x * (active ? .04 : .01), damping, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY + pointer.y * (active ? .032 : .01) + pointer.velocity * .022, damping, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, targetZ, damping, delta);
    const scale = THREE.MathUtils.damp(group.current.scale.x, targetScale, damping, delta);
    group.current.scale.setScalar(scale);

    if (motionMode !== "reduced") {
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * (active ? .045 : .012) + Math.sin(state.clock.elapsedTime * .17) * .008, 2.5, delta);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * (active ? .07 : .018) + Math.cos(state.clock.elapsedTime * .145) * .012, 2.5, delta);
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, active ? -.07 : -.015, 2.5, delta);
    }
  });

  return (
    <group ref={group}>
      {specs.map((spec) => (
        <group key={spec.id}>
          <Strand spec={spec} active={active} motionMode={motionMode} renderTier={renderTier} interaction={interaction} origin />
          <Terminal spec={spec} active={active} />
        </group>
      ))}
    </group>
  );
}

function JourneyArchitecture({
  projection,
  renderTier,
  motionMode,
  indexOpen,
  active,
}: {
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
    const table: Record<ChapterId, [number, number, number, number, number]> = {
      origin: [mobile ? .1 : 1.7, mobile ? -.22 : -.18, -.8, mobile ? .3 : .5, 0],
      human: [mobile ? .16 : 1.48, mobile ? -.05 : .02, -.08, mobile ? .43 : .88, .02],
      work: [mobile ? -.02 : -.08, mobile ? .02 : .08, .1, mobile ? .45 : 1.02, -.03],
      growth: [mobile ? 0 : .05, mobile ? .05 : .12, .06, mobile ? .45 : 1.02, .035],
      history: [mobile ? .05 : .45, mobile ? -.04 : -.06, -.26, mobile ? .42 : .9, -.02],
      understanding: [0,0,-.16,mobile ? .42 : .94,0],
      present: [mobile ? .02 : .12,0,-.2,mobile ? .4 : .84,.01],
    };
    let [x,y,z,scale,rz] = table[projection.chapter];
    if (indexOpen) {
      x = mobile ? .04 : 1.08;
      y = 0;
      z = -.48;
      scale = mobile ? .4 : .76;
      rz = 0;
    }
    const damping = indexOpen ? 3.6 : 2.8;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, x, damping, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y, damping, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, z, damping, delta);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, rz, damping, delta);
    const nextScale = THREE.MathUtils.damp(group.current.scale.x, scale, damping, delta);
    group.current.scale.setScalar(nextScale);
  });

  return (
    <group ref={group}>
      {specs.map((spec) => (
        <group key={spec.id}>
          <Strand spec={spec} active={active || indexOpen} motionMode={motionMode} renderTier={renderTier} />
          <Terminal spec={spec} active={active || indexOpen} />
        </group>
      ))}
    </group>
  );
}

function Matter({ renderTier, motionMode, chapter }: { renderTier: RenderTier; motionMode: MotionMode; chapter: ChapterId }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = renderTier === "full" ? 150 : 72;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`matter4:${index}`) - .5) * 11.5;
      positions[index * 3 + 1] = (hash01(`matter4:${index}:y`) - .5) * 6.8;
      positions[index * 3 + 2] = -2 + hash01(`matter4:${index}:z`) * 3;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [renderTier]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * .0012;
    points.current.position.y = Math.sin(state.clock.elapsedTime * .09) * .022;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={chapter === "origin" ? "#d5a9bb" : "#b5aaaf"}
        size={renderTier === "full" ? .016 : .013}
        transparent
        opacity={chapter === "origin" ? .1 : .06}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function World({
  projection,
  renderTier,
  motionMode,
  interaction,
  indexOpen,
}: {
  projection: WorldProjection;
  renderTier: RenderTier;
  motionMode: MotionMode;
  interaction: MutableRefObject<Interaction>;
  indexOpen: boolean;
}) {
  const originActive = projection.chapter === "origin" && !indexOpen;
  return (
    <>
      <ambientLight intensity={.24} />
      <pointLight position={[3.5, 2.7, 5]} color="#f1cbd9" intensity={2.15} distance={12} decay={1.9} />
      <pointLight position={[.7, -2.6, 3.6]} color="#82acb7" intensity={.92} distance={10} decay={2} />
      <pointLight position={[-2.4, 1.2, 2.4]} color="#c59259" intensity={.34} distance={8} decay={2} />
      <Matter renderTier={renderTier} motionMode={motionMode} chapter={projection.chapter} />
      <OriginTopology projection={projection} renderTier={renderTier} motionMode={motionMode} interaction={interaction} active={originActive} />
      <JourneyArchitecture projection={projection} renderTier={renderTier} motionMode={motionMode} indexOpen={indexOpen} active={!originActive} />
    </>
  );
}

export default function LivingTraceCanvasV4({ renderTier, motionMode, livingState, onReady }: Props) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const [indexOpen, setIndexOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const interaction = useRef<Interaction>({ x: 0, y: 0, velocity: 0 });
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
    const onIndex = (event: Event) => setIndexOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    const onVisibility = (event: Event) => setVisible(Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible));

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
      camera={{ position: [0, 0, 8.7], fov: 44, near: .1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" || !visible ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady();
      }}
    >
      <World projection={projection} renderTier={renderTier} motionMode={motionMode} interaction={interaction} indexOpen={indexOpen} />
    </Canvas>
  );
}

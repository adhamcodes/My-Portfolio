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
type Role = "core" | "branch" | "direction" | "fossil" | "horizon" | "atlas";

type StrandSpec = {
  id: string;
  domain: TraceRegion["domain"];
  curve: THREE.CatmullRomCurve3;
  color: string;
  radius: number;
  opacity: number;
  glow: number;
  phase: number;
  role: Role;
  dormant?: boolean;
};

const COLORS: Record<TraceRegion["domain"], string> = {
  self: "#ead6df",
  work: "#91bac3",
  growth: "#cda061",
  history: "#898c94",
};

function hash01(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function curve(points: Array<[number, number, number]>, tension = .38) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "catmullrom",
    tension,
  );
}

function regionFor(projection: WorldProjection, domain: TraceRegion["domain"]) {
  return projection.regions.filter((region) => region.domain === domain);
}

function originSpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const work = regionFor(projection, "work")[0];
  const growth = regionFor(projection, "growth");
  const history = regionFor(projection, "history")[0];
  const coreRadius = tier === "full" ? .062 : .052;
  const specs: StrandSpec[] = [
    {
      id: "origin:self:a",
      domain: "self",
      curve: curve([[-2.35,-.18,-.18],[-1.62,.4,.28],[-.76,1.08,-.18],[.18,1.15,.48],[1.04,.54,.16],[1.02,-.34,-.38],[.34,-1.02,-.08],[-.54,-.96,.5],[-1.1,-.34,.18],[-.72,.34,-.5],[.12,.46,-.12],[1.04,.08,.38],[1.94,-.17,.02],[2.78,-.03,-.22]]),
      color: "#efdce5",
      radius: coreRadius,
      opacity: .88,
      glow: .075,
      phase: .3,
      role: "core",
    },
    {
      id: "origin:self:b",
      domain: "self",
      curve: curve([[-2.08,-.34,.3],[-1.34,.58,-.34],[-.42,1.0,.36],[.48,.82,-.48],[1.16,.14,.44],[.8,-.76,.16],[-.1,-1.02,-.44],[-.82,-.52,.4],[-.52,.14,.1],[.34,.3,.48],[1.18,-.04,-.3],[2.02,-.08,.18],[2.8,.06,-.04]]),
      color: "#b9839b",
      radius: tier === "full" ? .034 : .029,
      opacity: .62,
      glow: .04,
      phase: 1.8,
      role: "branch",
    },
  ];

  if (work) specs.push({
    id: `origin:${work.id}`,
    domain: "work",
    curve: curve([[.62,.18,.05],[1.28,.48,-.18],[2.02,.72,.28],[2.7,.5,.52],[3.28,.08,.18],[3.9,-.08,-.18],[4.65,.08,-.36]]),
    color: COLORS.work,
    radius: tier === "full" ? .034 : .029,
    opacity: .54,
    glow: .035,
    phase: hash01(work.id) * 6.28,
    role: "branch",
  });

  growth.slice(0, tier === "full" ? 3 : 2).forEach((item, index) => {
    const paths: Array<Array<[number, number, number]>> = [
      [[-.58,.62,.08],[-.8,1.18,.26],[-.54,1.78,-.1],[-.04,2.25,.18],[.54,2.64,-.16]],
      [[.14,-.72,.04],[.2,-1.24,-.22],[.58,-1.7,.22],[1.18,-2.06,-.08],[1.82,-2.2,.12]],
      [[1.0,.4,-.02],[1.3,.94,-.32],[1.72,1.42,.14],[2.18,1.7,.4],[2.66,1.92,-.02]],
    ];
    specs.push({
      id: `origin:${item.id}`,
      domain: "growth",
      curve: curve(paths[index % paths.length]),
      color: COLORS.growth,
      radius: tier === "full" ? .013 : .011,
      opacity: .18,
      glow: .008,
      phase: hash01(item.id) * 6.28,
      role: "direction",
      dormant: item.energy === "dormant",
    });
  });

  if (history) specs.push({
    id: `origin:${history.id}`,
    domain: "history",
    curve: curve([[-.92,-.36,.12],[-1.46,-.82,-.12],[-1.98,-1.26,.24],[-2.55,-1.42,-.08],[-3.04,-1.16,-.3],[-3.48,-.76,-.04]]),
    color: COLORS.history,
    radius: .014,
    opacity: .18,
    glow: .004,
    phase: hash01(history.id) * 6.28,
    role: "fossil",
    dormant: true,
  });

  return specs;
}

function humanSpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const self = regionFor(projection, "self")[0];
  const work = regionFor(projection, "work")[0];
  const growth = regionFor(projection, "growth").slice(0, 2);
  const base = tier === "full" ? .038 : .031;
  const specs: StrandSpec[] = [
    {
      id: "human:self:before",
      domain: "self",
      curve: curve([[-5.2,-1.15,-.18],[-4.3,-.76,.14],[-3.4,-.22,.28],[-2.55,.18,-.02],[-1.75,.32,-.24],[-.82,.08,.06]]),
      color: COLORS.self,
      radius: base,
      opacity: .42,
      glow: .02,
      phase: .6,
      role: "fossil",
    },
    {
      id: "human:self:after",
      domain: "self",
      curve: curve([[.48,-.04,.02],[1.16,.12,.32],[1.86,.5,.2],[2.56,.84,-.18],[3.38,.72,.24],[4.34,1.18,-.08],[5.35,1.02,-.2]]),
      color: "#f0dce5",
      radius: base * 1.18,
      opacity: Math.min(.9, .58 + (self?.emphasis ?? .7) * .14),
      glow: .04,
      phase: 1.3,
      role: "core",
    },
  ];

  if (work) specs.push({
    id: "human:work:direction",
    domain: "work",
    curve: curve([[1.2,.12,.08],[1.68,-.34,.22],[2.18,-.8,-.12],[2.85,-1.12,.1],[3.62,-1.36,-.18]]),
    color: COLORS.work,
    radius: .017,
    opacity: .3,
    glow: .01,
    phase: 2.1,
    role: "direction",
  });

  growth.forEach((item, index) => specs.push({
    id: `human:${item.id}`,
    domain: "growth",
    curve: index === 0
      ? curve([[1.72,.5,.05],[1.92,1.0,-.18],[2.34,1.48,.18],[2.88,1.82,-.08]])
      : curve([[2.28,.64,.02],[2.7,1.0,.2],[3.12,1.42,-.16],[3.56,1.7,.1]]),
    color: COLORS.growth,
    radius: .009,
    opacity: .18,
    glow: 0,
    phase: hash01(item.id) * 6.28,
    role: "direction",
    dormant: true,
  }));

  return specs;
}

function workSpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const work = regionFor(projection, "work")[0];
  const selfRadius = tier === "full" ? .025 : .021;
  return [
    {
      id: "work:self",
      domain: "self",
      curve: curve([[-5.3,-.7,-.2],[-4.22,-.44,.12],[-3.08,-.12,.24],[-2.0,.08,-.08],[-.92,.1,.04],[.05,.02,-.16]]),
      color: COLORS.self,
      radius: selfRadius,
      opacity: .24,
      glow: .008,
      phase: .4,
      role: "branch",
    },
    {
      id: `work:${work?.id ?? "featured"}`,
      domain: "work",
      curve: curve([[-.12,.02,.02],[.62,.42,.28],[1.28,.92,-.12],[1.96,.72,.46],[2.34,.12,.24],[2.04,-.52,-.28],[1.38,-.76,.18],[.82,-.34,.38],[1.2,.1,-.18],[2.08,.04,.12],[3.0,.02,-.18],[3.82,.04,-.32]]),
      color: "#a6cbd3",
      radius: tier === "full" ? .064 : .052,
      opacity: .86,
      glow: .07,
      phase: 1.4,
      role: "core",
    },
    {
      id: "work:edge",
      domain: "work",
      curve: curve([[3.82,.04,-.32],[4.05,.02,-.34],[4.18,-.02,-.36]]),
      color: COLORS.work,
      radius: .018,
      opacity: .38,
      glow: .02,
      phase: 2.3,
      role: "horizon",
    },
  ];
}

function growthSpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const tracks = regionFor(projection, "growth").slice(0, 3);
  const base = tier === "full" ? .021 : .017;
  const paths: Array<Array<[number, number, number]>> = [
    [[-.4,.0,.04],[-1.05,.42,.18],[-1.76,.96,-.18],[-2.24,1.62,.22],[-2.54,2.32,-.08],[-2.38,2.92,.14]],
    [[-.32,.02,.02],[.2,.62,-.16],[.58,1.28,.2],[1.16,1.78,-.08],[1.86,2.18,.18],[2.72,2.38,-.1]],
    [[-.34,-.02,-.04],[.12,-.62,.16],[.58,-1.14,-.24],[1.18,-1.58,.16],[1.92,-1.82,-.08],[2.78,-2.04,.1]],
  ];
  const specs: StrandSpec[] = [{
    id: "growth:root",
    domain: "self",
    curve: curve([[-4.8,-.3,-.16],[-3.7,-.16,.1],[-2.7,.04,.22],[-1.65,.06,-.1],[-.52,.0,.04]]),
    color: COLORS.self,
    radius: .02,
    opacity: .22,
    glow: .006,
    phase: .2,
    role: "branch",
  }];

  tracks.forEach((track, index) => {
    specs.push({
      id: `growth:${track.id}`,
      domain: "growth",
      curve: curve(paths[index % paths.length]),
      color: index === 0 ? "#d8ad70" : COLORS.growth,
      radius: base + (index === 0 ? .01 : 0),
      opacity: track.energy === "dormant" ? (index === 0 ? .48 : .34) : .72,
      glow: track.energy === "dormant" ? .014 : .04,
      phase: hash01(track.id) * 6.28,
      role: "direction",
      dormant: track.energy === "dormant",
    });
  });
  return specs;
}

function historySpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const history = regionFor(projection, "history").slice(0, tier === "full" ? 4 : 3);
  const loops: Array<Array<[number, number, number]>> = [
    [[-2.8,-.1,.1],[-2.1,.92,-.2],[-.9,1.15,.28],[.15,.44,-.12],[.2,-.72,.24],[-.92,-1.18,-.28],[-2.1,-.86,.16],[-2.8,-.1,.1]],
    [[-2.42,-.16,-.2],[-1.82,.68,.18],[-.78,.84,-.22],[.04,.28,.28],[-.08,-.58,-.16],[-.98,-.9,.2],[-1.86,-.7,-.2],[-2.42,-.16,-.2]],
    [[-1.94,-.2,.24],[-1.46,.48,-.18],[-.62,.58,.22],[-.02,.12,-.2],[-.18,-.46,.18],[-.88,-.66,-.18],[-1.5,-.52,.16],[-1.94,-.2,.24]],
    [[-3.28,-.04,-.16],[-2.58,1.2,.16],[-1.12,1.54,-.16],[.48,.66,.14],[.62,-.94,-.14],[-1.02,-1.52,.18],[-2.52,-1.04,-.1],[-3.28,-.04,-.16]],
  ];
  const specs = history.map((item, index): StrandSpec => ({
    id: `history:${item.id}:${index}`,
    domain: "history",
    curve: curve(loops[index % loops.length], .32),
    color: index === 0 ? "#a0a1a6" : COLORS.history,
    radius: (tier === "full" ? .026 : .021) * (1 - index * .12),
    opacity: .45 - index * .07,
    glow: index === 0 ? .015 : 0,
    phase: hash01(item.id) * 6.28,
    role: "fossil",
    dormant: true,
  }));
  specs.push({
    id: "history:present-thread",
    domain: "self",
    curve: curve([[.7,.08,-.16],[1.58,.16,.08],[2.56,.42,-.08],[3.56,.66,.1],[4.7,.62,-.12]]),
    color: COLORS.self,
    radius: .012,
    opacity: .2,
    glow: .004,
    phase: .5,
    role: "horizon",
  });
  return specs;
}

function presentSpecs(projection: WorldProjection, tier: RenderTier): StrandSpec[] {
  const end: [number, number, number] = [1.0, .04, .08];
  const domainStarts: Record<TraceRegion["domain"], Array<[number, number, number]>> = {
    self: [[-4.8,.7,-.12],[-3.4,.52,.18],[-2.1,.32,-.08],[-.6,.12,.12],end],
    work: [[-3.8,-1.5,.08],[-2.65,-1.12,-.18],[-1.5,-.66,.2],[-.2,-.16,-.06],end],
    growth: [[-2.2,2.25,-.08],[-1.55,1.7,.18],[-.72,1.0,-.14],[.1,.42,.12],end],
    history: [[-4.1,-.25,.18],[-3.05,-.18,-.16],[-1.86,-.1,.12],[-.48,.0,-.08],end],
  };
  const specs: StrandSpec[] = (Object.keys(domainStarts) as TraceRegion["domain"][]).map((domain, index) => ({
    id: `present:${domain}`,
    domain,
    curve: curve(domainStarts[domain]),
    color: COLORS[domain],
    radius: tier === "full" ? .022 + (domain === "self" ? .01 : 0) : .019,
    opacity: domain === "self" ? .56 : .38,
    glow: domain === "self" ? .025 : .009,
    phase: .5 + index * 1.2,
    role: "branch",
  }));
  specs.push({
    id: "present:future",
    domain: "self",
    curve: curve([[1.0,.04,.08],[1.65,.06,.0],[2.38,.1,-.08],[3.16,.16,.1],[4.08,.24,-.04]]),
    color: "#c992a8",
    radius: .008,
    opacity: .18,
    glow: .004,
    phase: 3.2,
    role: "horizon",
    dormant: true,
  });
  return specs;
}

function atlasSpecs(tier: RenderTier): StrandSpec[] {
  const ys = [1.95,.98,.02,-.94,-1.88];
  const domains: TraceRegion["domain"][] = ["self","work","growth","history","self"];
  return ys.map((y, index) => ({
    id: `atlas:${index}`,
    domain: domains[index],
    curve: curve([[1.2,0,0],[1.8,y * .2,.12],[2.55,y * .52,-.1],[3.45,y * .8,.1],[4.55,y,-.06]], .26),
    color: COLORS[domains[index]],
    radius: tier === "full" ? .018 : .015,
    opacity: index === 0 || index === 4 ? .4 : .5,
    glow: .01,
    phase: index * 1.12,
    role: "atlas",
  }));
}

function buildSpecs(projection: WorldProjection, tier: RenderTier, indexOpen: boolean) {
  if (indexOpen) return atlasSpecs(tier);
  switch (projection.chapter) {
    case "origin": return originSpecs(projection, tier);
    case "human": return humanSpecs(projection, tier);
    case "work": return workSpecs(projection, tier);
    case "growth": return growthSpecs(projection, tier);
    case "history": return historySpecs(projection, tier);
    case "present": return presentSpecs(projection, tier);
    case "understanding": return presentSpecs(projection, tier);
    default: return originSpecs(projection, tier);
  }
}

function Strand({ spec, tier, motionMode, interaction, chapter }: {
  spec: StrandSpec;
  tier: RenderTier;
  motionMode: MotionMode;
  interaction: MutableRefObject<Interaction>;
  chapter: ChapterId;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const signal = useRef<THREE.Mesh>(null);
  const segments = tier === "full" ? 132 : 78;
  const radial = tier === "full" ? 9 : 6;

  useFrame((state, delta) => {
    if (material.current) {
      material.current.opacity = THREE.MathUtils.damp(material.current.opacity, spec.opacity, 4.2, delta);
      material.current.emissiveIntensity = THREE.MathUtils.damp(
        material.current.emissiveIntensity,
        spec.dormant ? .035 : .15 + Math.sin(state.clock.elapsedTime * .26 + spec.phase) * .026,
        2.5,
        delta,
      );
    }
    if (glow.current) glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, spec.glow, 3.5, delta);
    if (!group.current || motionMode === "reduced") return;

    const pointer = interaction.current;
    const response = chapter === "origin" ? .035 : chapter === "growth" ? .018 : .012;
    const sign = Math.sin(spec.phase + .4) > 0 ? 1 : -1;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, pointer.x * response * sign, 3, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, pointer.y * response * .72 + pointer.velocity * .02 * sign, 3.2, delta);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, pointer.x * response * .055 * sign, 2.4, delta);

    if (signal.current && !spec.dormant && spec.role !== "fossil") {
      const speed = spec.role === "core" ? .028 : .016;
      const t = (state.clock.elapsedTime * speed + spec.phase / 6.28) % 1;
      signal.current.position.copy(spec.curve.getPoint(t));
    }
  });

  const end = spec.curve.getPoint(1);
  return (
    <group ref={group}>
      {spec.glow > 0 && (
        <mesh>
          <tubeGeometry args={[spec.curve, segments, spec.radius * 2.8, radial, false]} />
          <meshBasicMaterial ref={glow} color={spec.color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <mesh>
        <tubeGeometry args={[spec.curve, segments, spec.radius, radial, false]} />
        <meshPhysicalMaterial
          ref={material}
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={.04}
          roughness={spec.role === "fossil" ? .68 : spec.dormant ? .54 : .31}
          metalness={spec.role === "fossil" ? .08 : .03}
          clearcoat={spec.role === "core" ? .36 : .12}
          clearcoatRoughness={.46}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {!spec.dormant && spec.role !== "fossil" && (
        <mesh ref={signal}>
          <sphereGeometry args={[Math.max(.018, spec.radius * .55), 8, 8]} />
          <meshBasicMaterial color={spec.color} transparent opacity={.48} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {(spec.role === "direction" || spec.role === "atlas" || spec.role === "horizon") && (
        <mesh position={end}>
          <sphereGeometry args={[Math.max(.012, spec.radius * .72), 8, 8]} />
          <meshBasicMaterial color={spec.color} transparent opacity={spec.dormant ? .22 : .48} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Matter({ tier, motionMode, chapter, indexOpen }: { tier: RenderTier; motionMode: MotionMode; chapter: ChapterId; indexOpen: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = tier === "full" ? 126 : 62;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`v5:matter:${index}`) - .5) * 12;
      positions[index * 3 + 1] = (hash01(`v5:matter:${index}:y`) - .5) * 7;
      positions[index * 3 + 2] = -2 + hash01(`v5:matter:${index}:z`) * 3.2;
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [tier]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * (indexOpen ? .0004 : .001);
    points.current.position.y = Math.sin(state.clock.elapsedTime * .08) * .018;
  });

  const colors: Record<ChapterId, string> = {
    origin: "#d4a8ba",
    human: "#bba9b1",
    work: "#92b5bc",
    growth: "#b79568",
    history: "#777a82",
    understanding: "#aaa0a5",
    present: "#c19aaa",
  };

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color={colors[chapter]} size={tier === "full" ? .015 : .012} transparent opacity={indexOpen ? .045 : .07} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Architecture({ projection, tier, motionMode, interaction, indexOpen }: {
  projection: WorldProjection;
  tier: RenderTier;
  motionMode: MotionMode;
  interaction: MutableRefObject<Interaction>;
  indexOpen: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const mobile = useThree((state) => state.size.width < 760);
  const specs = useMemo(() => buildSpecs(projection, tier, indexOpen), [projection, tier, indexOpen]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const desktop: Record<ChapterId, [number, number, number, number, number]> = {
      origin: [2.0,.1,.18,1.08,-.04],
      human: [.62,.0,-.05,.92,.0],
      work: [.25,.02,.08,.98,-.02],
      growth: [.1,.04,.05,.92,.02],
      history: [.65,-.04,-.24,.9,-.02],
      understanding: [.1,0,-.16,.92,0],
      present: [.5,0,-.08,.96,0],
    };
    const mobileTable: Record<ChapterId, [number, number, number, number, number]> = {
      origin: [.65,.28,.1,.66,-.04],
      human: [.08,.02,-.06,.39,0],
      work: [.03,.02,.02,.4,-.02],
      growth: [.02,.04,.02,.38,.02],
      history: [.12,-.02,-.12,.4,-.02],
      understanding: [0,0,-.12,.4,0],
      present: [.06,0,-.08,.4,0],
    };
    let [x,y,z,scale,rz] = (mobile ? mobileTable : desktop)[projection.chapter];
    if (indexOpen) {
      x = mobile ? .02 : 1.2;
      y = mobile ? .02 : 0;
      z = -.42;
      scale = mobile ? .38 : .78;
      rz = 0;
    }
    const damping = indexOpen ? 3.8 : 2.8;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, x, damping, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, y, damping, delta);
    root.current.position.z = THREE.MathUtils.damp(root.current.position.z, z, damping, delta);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, rz, damping, delta);
    const s = THREE.MathUtils.damp(root.current.scale.x, scale, damping, delta);
    root.current.scale.setScalar(s);
  });

  return (
    <group ref={root}>
      {specs.map((spec) => (
        <Strand key={`${projection.chapter}:${indexOpen ? "atlas" : "scene"}:${spec.id}`} spec={spec} tier={tier} motionMode={motionMode} interaction={interaction} chapter={projection.chapter} />
      ))}
      {projection.chapter === "present" && !indexOpen && (
        <mesh position={[1,.04,.08]}>
          <sphereGeometry args={[.055, 12, 12]} />
          <meshBasicMaterial color="#d48aa7" transparent opacity={.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function World({ projection, tier, motionMode, interaction, indexOpen }: {
  projection: WorldProjection;
  tier: RenderTier;
  motionMode: MotionMode;
  interaction: MutableRefObject<Interaction>;
  indexOpen: boolean;
}) {
  return (
    <>
      <ambientLight intensity={.22} />
      <pointLight position={[3.6,2.8,5.2]} color="#efcbd9" intensity={2.05} distance={12} decay={1.9} />
      <pointLight position={[.4,-2.8,3.8]} color="#83aeb8" intensity={.82} distance={10} decay={2} />
      <pointLight position={[-2.8,1.4,2.8]} color="#c69b63" intensity={.32} distance={8} decay={2} />
      <Matter tier={tier} motionMode={motionMode} chapter={projection.chapter} indexOpen={indexOpen} />
      <Architecture projection={projection} tier={tier} motionMode={motionMode} interaction={interaction} indexOpen={indexOpen} />
    </>
  );
}

export default function LivingTraceCanvasV5({ renderTier, motionMode, livingState, onReady }: Props) {
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
      camera={{ position: [0,0,8.8], fov: 44, near: .1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={motionMode === "reduced" || !visible ? "demand" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady();
      }}
    >
      <World projection={projection} tier={renderTier} motionMode={motionMode} interaction={interaction} indexOpen={indexOpen} />
    </Canvas>
  );
}

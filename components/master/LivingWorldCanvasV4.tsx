"use client";

import { Edges } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { buildActivityVeilSnapshot } from "@/core/activity-veil";
import type {
  ActivityVeilDay,
  ChapterId,
  MotionMode,
  PublicLivingState,
  RenderTier,
  TraceRegion,
} from "@/core/contracts";

type Props = {
  renderTier: RenderTier;
  motionMode: MotionMode;
  livingState: PublicLivingState;
  onReady: () => void;
};

type Interaction = {
  x: number;
  y: number;
  pointerVelocity: number;
  scrollVelocity: number;
  active: boolean;
};

type ForcePoint = {
  x: number;
  y: number;
  active: boolean;
  impulse: number;
  travel: number;
};

type Layout = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

type FragmentSpec = {
  id: string;
  domain: TraceRegion["domain"];
  side: -1 | 1;
  order: number;
  route: number;
  sequence: number;
  polygon: Array<[number, number]>;
  depth: number;
  origin: Layout;
  scatter: [number, number, number];
};

const DOMAIN_COLOR: Record<TraceRegion["domain"], string> = {
  self: "#f0cfdd",
  work: "#92c5cd",
  growth: "#d5a45f",
  history: "#8a8f9b",
};

const DOMAIN_BASE: Record<TraceRegion["domain"], string> = {
  self: "#332a31",
  work: "#2c3234",
  growth: "#342f29",
  history: "#292b30",
};

function hash01(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function fragmentsFor(tier: RenderTier): FragmentSpec[] {
  const bands = tier === "full" ? 11 : 8;
  const routeDomains: TraceRegion["domain"][] = ["self", "work", "growth", "history", "self"];
  const routeCounts = [0, 0, 0, 0, 0];
  const fragments: FragmentSpec[] = [];
  const innerX = (y: number, side: -1 | 1) => side * (
    .26
    + Math.sin((y + 3.1) * 1.58 + side * .32) * .11
    + Math.cos(y * 2.2 - side * .4) * .045
  );
  const outerX = (y: number, side: -1 | 1) => {
    const taper = 1 - Math.min(1, Math.abs(y) / 3.2);
    const shoulder = Math.sin(y * 1.62 + side * .68) * .22;
    const asymmetry = side === 1 ? .22 + Math.cos(y * .72) * .1 : Math.sin(y * .82) * .08;
    return side * (1.16 + taper * .96 + shoulder + asymmetry);
  };

  for (let band = 0; band < bands; band += 1) {
    const y0 = -3.08 + (band / bands) * 6.16;
    const y1 = -3.08 + ((band + 1) / bands) * 6.16;
    for (const side of [-1, 1] as const) {
      const innerBottom: [number, number] = [innerX(y0, side), y0];
      const innerTop: [number, number] = [innerX(y1, side), y1];
      const outerTop: [number, number] = [outerX(y1, side), y1];
      const outerBottom: [number, number] = [outerX(y0, side), y0];
      const center: [number, number] = [
        (innerBottom[0] + innerTop[0] + outerTop[0] + outerBottom[0]) / 4,
        (y0 + y1) / 2,
      ];
      const panels: Array<Array<[number, number]>> = side === 1
        ? [
            [innerBottom, innerTop, center],
            [innerTop, outerTop, center],
            [outerTop, outerBottom, center],
            [outerBottom, innerBottom, center],
          ]
        : [
            [innerBottom, center, innerTop],
            [innerTop, center, outerTop],
            [outerTop, center, outerBottom],
            [outerBottom, center, innerBottom],
          ];

      panels.forEach((panel, triangle) => {
        const seed = `v4:facet:${band}:${side}:${triangle}`;
        const route = (band * 2 + triangle + (side === 1 ? 1 : 0)) % 5;
        const centerX = panel.reduce((sum, point) => sum + point[0], 0) / panel.length;
        const centerY = panel.reduce((sum, point) => sum + point[1], 0) / panel.length;
        const sequence = routeCounts[route];
        routeCounts[route] += 1;
        fragments.push({
          id: seed,
          domain: routeDomains[route],
          side,
          order: band,
          route,
          sequence,
          polygon: panel.map(([x, y]) => [x - centerX, y - centerY]),
          depth: .18 + hash01(`${seed}:depth`) * .4,
          origin: {
            position: [centerX, centerY, (hash01(`${seed}:z`) - .5) * .34],
            rotation: [
              (hash01(`${seed}:rx`) - .5) * .09,
              side * (hash01(`${seed}:ry`) - .5) * .13,
              (hash01(`${seed}:rz`) - .5) * .032,
            ],
            scale: [.965, .965, 1],
          },
          scatter: [
            side * (.9 + hash01(`${seed}:sx`) * 1.8),
            (hash01(`${seed}:sy`) - .5) * 2.6,
            -.8 + hash01(`${seed}:sz`) * 1.6,
          ],
        });
      });
    }
  }

  return fragments;
}

function chapterLayout(spec: FragmentSpec, chapter: ChapterId, indexOpen: boolean, mobile: boolean): Layout {
  if (indexOpen) {
    const columns = mobile ? 4 : 9;
    const column = spec.sequence % columns;
    const lane = Math.floor(spec.sequence / columns);
    const x = mobile ? -.72 + column * .54 : .14 + column * .57;
    const y = (mobile ? 2.05 : 1.92) - spec.route * (mobile ? 1.02 : .91) + lane * .09;
    return {
      position: [x, y, -.32 + lane * .085],
      rotation: [lane * .018, 0, spec.sequence % 2 === 0 ? -.035 : .026],
      scale: [mobile ? .34 : .41, mobile ? .21 : .3, mobile ? .48 : .6],
    };
  }

  const source = spec.origin;
  switch (chapter) {
    case "human":
      return {
        position: [
          source.position[0] + spec.side * .78,
          source.position[1] * .94,
          source.position[2] - .12 - Math.abs(spec.order - 5) * .045,
        ],
        rotation: [
          source.rotation[0] * .55,
          source.rotation[1] * .55 + spec.side * (.08 + spec.order * .004),
          source.rotation[2] * .6,
        ],
        scale: [.9, .9, .98],
      };
    case "work":
      return {
        position: [-2.35 + (spec.order % 8) * .72, (spec.route % 3 - 1) * .7, -.38 + spec.side * .14],
        rotation: [0, spec.side * .06, (spec.route - 2) * .018],
        scale: [.52 + (spec.order % 3) * .1, .16 + (spec.route === 1 ? .12 : 0), .58],
      };
    case "growth": {
      const lane = spec.route - 2;
      const progress = Math.min(1, (spec.order + (spec.side === 1 ? .42 : 0)) / 10.6);
      const gap = (spec.order + spec.route) % 5 === 0 ? .38 : 1;
      return {
        position: [
          lane * (.18 + progress * 1.42) + spec.side * .06,
          -2.94 + progress * 5.94,
          -.46 - Math.abs(lane) * .1 - (1 - gap) * .34,
        ],
        rotation: [
          source.rotation[0] * .2,
          spec.side * .055,
          lane * -.12 + (spec.route === 2 ? 0 : spec.side * .014),
        ],
        scale: [
          (.13 + (spec.route === 2 ? .13 : .045)) * gap,
          (.28 + progress * .13) * gap,
          .4,
        ],
      };
    }
    case "history":
      return {
        position: [-2.4 + (spec.order % 7) * .78, -1.85 + spec.route * .72, -.65 - (spec.order % 4) * .14],
        rotation: [0, 0, (hash01(`${spec.id}:age`) - .5) * .045],
        scale: [.48, .14, .48 + (spec.route === 3 ? .16 : 0)],
      };
    case "present":
    case "understanding":
      return {
        position: [source.position[0] * .76, source.position[1] * .74, source.position[2] * .45],
        rotation: [source.rotation[0] * .3, source.rotation[1] * .35, source.rotation[2] * .3],
        scale: [.82, .84, .8],
      };
    default:
      return source;
  }
}

function Fragment({
  spec,
  chapter,
  indexOpen,
  indexFocus,
  mobile,
  motionMode,
  force,
  activity,
}: {
  spec: FragmentSpec;
  chapter: ChapterId;
  indexOpen: boolean;
  indexFocus: number | null;
  mobile: boolean;
  motionMode: MotionMode;
  force: MutableRefObject<ForcePoint>;
  activity: number;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const target = useMemo(() => chapterLayout(spec, chapter, indexOpen, mobile), [spec, chapter, indexOpen, mobile]);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const [first, ...rest] = spec.polygon;
    shape.moveTo(first[0], first[1]);
    for (const [x, y] of rest) shape.lineTo(x, y);
    shape.closePath();
    const next = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: spec.depth,
      bevelEnabled: true,
      bevelThickness: .025,
      bevelSize: .018,
      bevelSegments: 1,
    });
    next.translate(0, 0, -spec.depth / 2);
    next.computeVertexNormals();
    return next;
  }, [spec]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

    const dx = target.position[0] - force.current.x;
    const dy = target.position[1] - force.current.y;
    const distance = Math.hypot(dx, dy);
    const core = force.current.active ? 1 - THREE.MathUtils.smoothstep(distance, 0, .82) : 0;
    const propagation = force.current.active
      ? THREE.MathUtils.smoothstep(distance, .55, .95) * (1 - THREE.MathUtils.smoothstep(distance, .95, 1.72)) * .36
      : 0;
    const pressure = motionMode === "reduced" ? 0 : Math.max(0, core + propagation);
    const directionX = distance > .001 ? dx / distance : spec.side;
    const directionY = distance > .001 ? dy / distance : 0;
    const reveal = motionMode === "reduced" ? 0 : Math.max(0, 1 - state.clock.elapsedTime / 1.35);
    const response = pressure * (spec.side === -1 ? -.18 : .18) * (1 + force.current.impulse * .42);
    const travelStress = motionMode === "reduced" ? 0 : force.current.travel * ((spec.order % 5) - 2) * .012;

    const x = target.position[0] + spec.scatter[0] * reveal + directionX * response;
    const y = target.position[1] + spec.scatter[1] * reveal + directionY * Math.abs(response) * .62;
    const z = target.position[2] + spec.scatter[2] * reveal + pressure * .28 + travelStress;
    const damping = reveal > 0 ? 2.9 : pressure > 0 ? 10.5 : 3.25;

    node.position.x = THREE.MathUtils.damp(node.position.x, x, damping, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, y, damping, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, z, damping, delta);
    node.rotation.x = THREE.MathUtils.damp(node.rotation.x, target.rotation[0] + pressure * .035, damping, delta);
    node.rotation.y = THREE.MathUtils.damp(node.rotation.y, target.rotation[1] + response * .16, damping, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, target.rotation[2] + directionY * response * .1, damping, delta);
    node.scale.x = THREE.MathUtils.damp(node.scale.x, target.scale[0], 4.2, delta);
    node.scale.y = THREE.MathUtils.damp(node.scale.y, target.scale[1], 4.2, delta);
    node.scale.z = THREE.MathUtils.damp(node.scale.z, target.scale[2], 4.2, delta);

    if (material.current) {
      const routeActive = indexOpen && indexFocus === spec.route;
      const energy = routeActive ? .92 : (indexOpen ? .23 : .075) + activity * .08 + pressure * .18;
      material.current.emissiveIntensity = THREE.MathUtils.damp(material.current.emissiveIntensity, energy, 5, delta);
      material.current.opacity = THREE.MathUtils.damp(material.current.opacity, indexOpen && indexFocus !== null && !routeActive ? .46 : .98, 6, delta);
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          ref={material}
          color={DOMAIN_BASE[spec.domain]}
          emissive={DOMAIN_COLOR[spec.domain]}
          emissiveIntensity={.075}
          roughness={spec.domain === "history" ? .78 : .48}
          metalness={.12}
          clearcoat={.42}
          clearcoatRoughness={.48}
          transparent
          opacity={.98}
          side={THREE.DoubleSide}
        />
        <Edges color={DOMAIN_COLOR[spec.domain]} threshold={14} transparent opacity={indexOpen ? .56 : .19} />
      </mesh>
    </group>
  );
}

function Aperture({ chapter, indexOpen, motionMode }: { chapter: ChapterId; indexOpen: boolean; motionMode: MotionMode }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => {
    const centers: Array<[number, number]> = [
      [-.03, -3.2], [.08, -2.45], [-.1, -1.72], [.1, -.98], [-.07, -.25], [.12, .52], [-.08, 1.22], [.08, 1.95], [-.02, 3.2],
    ];
    const halfWidth = .055;
    const shape = new THREE.Shape();
    centers.forEach(([x, y], index) => {
      const point: [number, number] = [x - halfWidth, y];
      if (index === 0) shape.moveTo(...point);
      else shape.lineTo(...point);
    });
    [...centers].reverse().forEach(([x, y]) => shape.lineTo(x + halfWidth, y));
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!group.current || !material.current) return;
    const growth = chapter === "growth" ? 1.28 : chapter === "history" ? .62 : 1;
    const targetX = indexOpen ? .18 : 0;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 3.4, delta);
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, indexOpen ? .78 : growth, 3.4, delta);
    const pulse = motionMode === "reduced" ? 0 : Math.sin(state.clock.elapsedTime * .48) * .025;
    material.current.opacity = (indexOpen ? .31 : .39) + pulse;
  });

  return (
    <group ref={group} position={[0, 0, -.52]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial ref={material} color="#f4d7e3" transparent opacity={.39} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} position={[.01, 0, -.03]} scale={[4.8, 1.04, 1]}>
        <meshBasicMaterial color="#91c2ca" transparent opacity={.062} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function IndexArchitecture({ open, mobile }: { open: boolean; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const routeDomains: TraceRegion["domain"][] = ["self", "work", "growth", "history", "self"];

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.scale.x = THREE.MathUtils.damp(group.current.scale.x, open ? 1 : .004, 4.4, delta);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, open ? 0 : -.28, 4.4, delta);
  });

  return (
    <group ref={group} position={[-.28, 0, -.7]} scale={[.004, 1, 1]} visible={open}>
      <mesh position={[.02, .1, 0]}>
        <boxGeometry args={[.025, mobile ? 4.9 : 4.35, .025]} />
        <meshBasicMaterial color="#e6c8d5" transparent opacity={.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {routeDomains.map((domain, route) => {
        const y = (mobile ? 2.05 : 1.92) - route * (mobile ? 1.02 : .91);
        return (
          <group key={domain + route} position={[0, y, 0]}>
            <mesh position={[2.45, 0, 0]}>
              <boxGeometry args={[4.9, .018, .018]} />
              <meshBasicMaterial color={DOMAIN_COLOR[domain]} transparent opacity={.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[.02, 0, .035]}>
              <circleGeometry args={[.07, 18]} />
              <meshBasicMaterial color={DOMAIN_COLOR[domain]} transparent opacity={.76} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ActivityPane({ day, index, chapter, indexOpen, motionMode }: {
  day: ActivityVeilDay;
  index: number;
  chapter: ChapterId;
  indexOpen: boolean;
  motionMode: MotionMode;
}) {
  const group = useRef<THREE.Group>(null);
  const seed = `activity:${day.date}`;
  const position = useMemo<[number, number, number]>(() => [
    .9 + (hash01(`${seed}:x`) - .5) * 5.4,
    (hash01(`${seed}:y`) - .5) * 5.2,
    -1.7 + hash01(`${seed}:z`) * 1.25,
  ], [seed]);
  const color = day.tagsPublished > 0 ? "#d9a65e" : day.pullRequestsMerged > 0 ? "#8eb9c0" : "#c9a4b4";

  useFrame((state, delta) => {
    if (!group.current) return;
    const growthVisible = chapter === "growth" ? 1 : chapter === "origin" ? .42 : .64;
    const targetY = indexOpen ? 2.1 - (index % 5) * 1.07 : position[1];
    const targetX = indexOpen ? 4.9 + (index % 3) * .18 : position[0];
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 2.8, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 2.8, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2], 2.8, delta);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, growthVisible, 3, delta));
    if (motionMode !== "reduced" && !indexOpen) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * .08 + index) * .1;
      group.current.position.y += Math.sin(state.clock.elapsedTime * .13 + index * .7) * .0008;
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, (hash01(`${seed}:r`) - .5) * .45, (hash01(`${seed}:rz`) - .5) * .14]}>
      <mesh scale={[.9 + day.atmosphere * 1.5, .025 + day.atmosphere * .035, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={.06 + day.atmosphere * .08} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ActivityVeil({ state, chapter, indexOpen, motionMode }: {
  state: PublicLivingState;
  chapter: ChapterId;
  indexOpen: boolean;
  motionMode: MotionMode;
}) {
  const snapshot = useMemo(() => buildActivityVeilSnapshot(state), [state]);
  return (
    <group>
      {snapshot.days.slice(-18).map((day, index) => (
        <ActivityPane key={day.date} day={day} index={index} chapter={chapter} indexOpen={indexOpen} motionMode={motionMode} />
      ))}
    </group>
  );
}

function ConstructionMatter({ tier, motionMode, indexOpen }: { tier: RenderTier; motionMode: MotionMode; indexOpen: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = tier === "full" ? 320 : 140;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (hash01(`v4:dust:${index}:x`) - .5) * 12;
      positions[index * 3 + 1] = (hash01(`v4:dust:${index}:y`) - .5) * 7.4;
      positions[index * 3 + 2] = -2.5 + hash01(`v4:dust:${index}:z`) * 3;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return next;
  }, [tier]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((state, delta) => {
    if (!points.current || motionMode === "reduced") return;
    points.current.rotation.z += delta * (indexOpen ? .0004 : .0015);
    points.current.position.y = Math.sin(state.clock.elapsedTime * .1) * .025;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color="#d3bdc7" size={tier === "full" ? .012 : .015} transparent opacity={indexOpen ? .075 : .1} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Monument({
  tier,
  motionMode,
  state,
  chapter,
  indexOpen,
  indexFocus,
  interaction,
}: {
  tier: RenderTier;
  motionMode: MotionMode;
  state: PublicLivingState;
  chapter: ChapterId;
  indexOpen: boolean;
  indexFocus: number | null;
  interaction: MutableRefObject<Interaction>;
}) {
  const root = useRef<THREE.Group>(null);
  const force = useRef<ForcePoint>({ x: 999, y: 999, active: false, impulse: 0, travel: 0 });
  const camera = useThree((value) => value.camera);
  const mobile = useThree((value) => value.size.width < 760);
  const specs = useMemo(() => fragmentsFor(tier), [tier]);
  const math = useMemo(() => ({
    ndc: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    world: new THREE.Vector3(),
    origin: new THREE.Vector3(),
  }), []);
  const activity = useMemo(() => {
    const days = buildActivityVeilSnapshot(state).days;
    return days[days.length - 1]?.atmosphere ?? .08;
  }, [state]);

  useFrame((_, delta) => {
    const node = root.current;
    if (!node) return;
    const table: Record<ChapterId, [number, number, number, number, number]> = mobile ? {
      origin: [.92, .06, -.08, .86, -.025],
      human: [0, -.08, -.22, .58, 0],
      work: [0, 0, -.28, .6, 0],
      growth: [.18, -.16, -.5, .58, 0],
      history: [0, 0, -.52, .58, 0],
      understanding: [0, 0, -.38, .58, 0],
      present: [0, 0, -.32, .62, 0],
    } : {
      origin: [1.62, .02, -.14, 1.2, -.035],
      human: [.55, 0, -.3, .9, 0],
      work: [.15, 0, -.34, .94, 0],
      growth: [.78, -.12, -.62, .94, -.02],
      history: [.18, 0, -.64, .9, 0],
      understanding: [.18, 0, -.46, .9, 0],
      present: [.4, 0, -.38, .94, 0],
    };
    let [x, y, z, scale, rz] = table[chapter];
    if (indexOpen) {
      x = mobile ? 1.18 : .9;
      y = 0;
      z = -.72;
      scale = mobile ? .68 : 1.02;
      rz = 0;
    }
    node.position.x = THREE.MathUtils.damp(node.position.x, x, 3.1, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, y, 3.1, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, z, 3.1, delta);
    node.rotation.z = THREE.MathUtils.damp(node.rotation.z, rz, 3.1, delta);
    const nextScale = THREE.MathUtils.damp(node.scale.x, scale, 3.1, delta);
    node.scale.setScalar(nextScale);

    const input = interaction.current;
    input.pointerVelocity = THREE.MathUtils.damp(input.pointerVelocity, 0, 7.5, delta);
    force.current.impulse = THREE.MathUtils.damp(force.current.impulse, Math.min(.9, input.pointerVelocity * .018), 8, delta);
    force.current.travel = THREE.MathUtils.damp(force.current.travel, Math.min(1.2, Math.abs(input.scrollVelocity) * .015), 5, delta);
    if (motionMode === "reduced" || !input.active) {
      force.current.active = false;
      return;
    }

    node.updateWorldMatrix(true, false);
    node.getWorldPosition(math.origin);
    math.ndc.set(input.x, input.y, .12).unproject(camera);
    math.direction.copy(math.ndc).sub(camera.position).normalize();
    if (Math.abs(math.direction.z) < .0001) return;
    const travel = (math.origin.z - camera.position.z) / math.direction.z;
    if (travel <= 0) return;
    math.world.copy(camera.position).addScaledVector(math.direction, travel);
    node.worldToLocal(math.world);
    const settle = 1 - Math.exp(-delta * 15);
    force.current.x = THREE.MathUtils.lerp(force.current.x, math.world.x, settle);
    force.current.y = THREE.MathUtils.lerp(force.current.y, math.world.y, settle);
    force.current.active = true;
  });

  return (
    <group ref={root}>
      <Aperture chapter={chapter} indexOpen={indexOpen} motionMode={motionMode} />
      <IndexArchitecture open={indexOpen} mobile={mobile} />
      {specs.map((spec) => (
        <Fragment
          key={spec.id}
          spec={spec}
          chapter={chapter}
          indexOpen={indexOpen}
          indexFocus={indexFocus}
          mobile={mobile}
          motionMode={motionMode}
          force={force}
          activity={activity}
        />
      ))}
      <ActivityVeil state={state} chapter={chapter} indexOpen={indexOpen} motionMode={motionMode} />
    </group>
  );
}

function World({
  tier,
  motionMode,
  state,
  chapter,
  indexOpen,
  indexFocus,
  interaction,
}: {
  tier: RenderTier;
  motionMode: MotionMode;
  state: PublicLivingState;
  chapter: ChapterId;
  indexOpen: boolean;
  indexFocus: number | null;
  interaction: MutableRefObject<Interaction>;
}) {
  return (
    <>
      <fog attach="fog" args={["#050506", 8.5, 17]} />
      <ambientLight intensity={.52} />
      <hemisphereLight args={["#f0dce4", "#101319", .72]} />
      <directionalLight position={[3.2, 4.6, 6]} color="#f4dce5" intensity={2.45} />
      <pointLight position={[-2.8, -1.8, 4.2]} color="#86b7c0" intensity={1.28} distance={13} decay={1.8} />
      <pointLight position={[3.6, 1.2, 2.8]} color="#d3a0b3" intensity={1.02} distance={9} decay={2} />
      <ConstructionMatter tier={tier} motionMode={motionMode} indexOpen={indexOpen} />
      <Monument tier={tier} motionMode={motionMode} state={state} chapter={chapter} indexOpen={indexOpen} indexFocus={indexFocus} interaction={interaction} />
    </>
  );
}

export default function LivingWorldCanvasV4({ renderTier, motionMode, livingState, onReady }: Props) {
  const [chapter, setChapter] = useState<ChapterId>("origin");
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexFocus, setIndexFocus] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const interaction = useRef<Interaction>({ x: 0, y: 0, pointerVelocity: 0, scrollVelocity: 0, active: false });

  useEffect(() => {
    const root = document.documentElement;
    const stored = root.dataset.chapter as ChapterId | undefined;
    if (stored) setChapter(stored);
    setIndexOpen(root.dataset.indexOpen === "true");
    setVisible(document.visibilityState === "visible");

    const deactivate = () => {
      interaction.current.active = false;
      interaction.current.pointerVelocity = 0;
    };
    const updatePointer = (event: PointerEvent) => {
      interaction.current.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      interaction.current.y = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      interaction.current.pointerVelocity = Math.hypot(event.movementX, event.movementY);
      if (event.pointerType !== "touch") interaction.current.active = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event);
      interaction.current.active = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") deactivate();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) deactivate();
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
      if (!open) setIndexFocus(null);
    };
    const onIndexFocus = (event: Event) => {
      const route = (event as CustomEvent<{ route?: number | null }>).detail?.route;
      setIndexFocus(typeof route === "number" ? route : null);
    };
    const onVisibility = (event: Event) => {
      const next = Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible);
      setVisible(next);
      if (!next) deactivate();
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", deactivate);
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", deactivate);
    window.addEventListener("adham:motion", onMotion);
    window.addEventListener("adham:chapter", onChapter);
    window.addEventListener("adham:index", onIndex);
    window.addEventListener("adham:index-focus", onIndexFocus);
    window.addEventListener("adham:visibility", onVisibility);
    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", deactivate);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", deactivate);
      window.removeEventListener("adham:motion", onMotion);
      window.removeEventListener("adham:chapter", onChapter);
      window.removeEventListener("adham:index", onIndex);
      window.removeEventListener("adham:index-focus", onIndexFocus);
      window.removeEventListener("adham:visibility", onVisibility);
    };
  }, []);

  return (
    <Canvas
      className="living-trace-canvas living-world-canvas-v4"
      dpr={renderTier === "full" ? [1, 1.4] : [1, 1.08]}
      camera={{ position: [0, 0, 9.4], fov: 42, near: .1, far: 30 }}
      gl={{ alpha: true, antialias: renderTier === "full", powerPreference: "high-performance" }}
      frameloop={visible ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        onReady();
      }}
    >
      <World
        tier={renderTier}
        motionMode={motionMode}
        state={livingState}
        chapter={chapter}
        indexOpen={indexOpen}
        indexFocus={indexFocus}
        interaction={interaction}
      />
    </Canvas>
  );
}

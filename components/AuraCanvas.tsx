"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Float, Points, PointMaterial, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { AuraMode } from "@/data/site";
import type { AuraQuality } from "@/components/PerformanceGovernor";
import type { CoreScene } from "@/components/CoreDirector";

const palettes: Record<AuraMode, { primary: string; secondary: string; tertiary: string; base: string; emissive: string }> = {
  pulse: { primary: "#ff5f88", secondary: "#67dcff", tertiary: "#b49aff", base: "#10131b", emissive: "#21142f" },
  forge: { primary: "#ffc26b", secondary: "#ff765c", tertiary: "#ffe0ad", base: "#151009", emissive: "#31170a" },
  void: { primary: "#aa91ff", secondary: "#6176ff", tertiary: "#86dfff", base: "#080a12", emissive: "#0d1230" },
};

const personalities: Record<AuraMode, { spin: number; float: number; rotation: number; warp: number; ring: number; density: number; sparkle: number; scale: number }> = {
  pulse: { spin: .052, float: .82, rotation: .22, warp: .72, ring: .11, density: 1, sparkle: .9, scale: 1 },
  forge: { spin: .026, float: .38, rotation: .12, warp: 1.12, ring: .058, density: .82, sparkle: 1.18, scale: 1.03 },
  void: { spin: .01, float: .13, rotation: .05, warp: .22, ring: .018, density: .44, sparkle: .42, scale: .96 },
};

type SceneState = { x: number; y: number; z: number; scale: number; pointer: number; cloud: number; opacity: number; ring: number };

const sceneConfig: Record<CoreScene, SceneState> = {
  origin: { x: 2.15, y: .12, z: -.15, scale: .88, pointer: .68, cloud: .62, opacity: .94, ring: 1 },
  state: { x: -2.85, y: .3, z: -1.05, scale: .3, pointer: .18, cloud: .18, opacity: .28, ring: .3 },
  work: { x: 3.18, y: .18, z: -1.05, scale: .26, pointer: .12, cloud: .2, opacity: .3, ring: .28 },
  foundry: { x: -3.2, y: .8, z: -1.55, scale: .12, pointer: .05, cloud: .11, opacity: .14, ring: .08 },
  trajectory: { x: 0, y: -1.1, z: -2.4, scale: .035, pointer: 0, cloud: .08, opacity: .06, ring: 0 },
  transmissions: { x: 0, y: 0, z: -3, scale: .001, pointer: 0, cloud: .035, opacity: 0, ring: 0 },
  machine: { x: 3.22, y: -.08, z: -1.15, scale: .32, pointer: .12, cloud: .16, opacity: .3, ring: .24 },
  contact: { x: 2.55, y: .06, z: -.5, scale: .72, pointer: .16, cloud: .38, opacity: .78, ring: .62 },
};

const qualityConfig: Record<AuraQuality, { points: number; segments: number; ringSegments: number; sparkles: number; dpr: [number, number] }> = {
  high: { points: 390, segments: 72, ringSegments: 144, sparkles: 36, dpr: [1, 1.35] },
  balanced: { points: 280, segments: 56, ringSegments: 104, sparkles: 26, dpr: [0.9, 1.15] },
  low: { points: 150, segments: 38, ringSegments: 72, sparkles: 16, dpr: [0.72, 1] },
};

function artifactDetail(segments: number) {
  if (segments >= 70) return 4;
  if (segments >= 50) return 3;
  return 2;
}

function seededUnit(index: number, salt: number) {
  let value = (index * 1664525 + 1013904223 + salt * 374761393) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 1274126177) >>> 0;
  return value / 4294967295;
}

function SignalCloud({ color, energy, count, aura, scene }: { color: string; energy: number; count: number; aura: AuraMode; scene: CoreScene }) {
  const personality = personalities[aura];
  const target = sceneConfig[scene].cloud * (aura === "void" ? .58 : aura === "forge" ? .72 : 1);
  const material = useRef<THREE.PointsMaterial>(null);
  const adjustedCount = Math.max(64, Math.round(count * personality.density));
  const points = useMemo(() => {
    const arr = new Float32Array(adjustedCount * 3);
    for (let i = 0; i < adjustedCount; i += 1) {
      const r = 2.9 + seededUnit(i, 1) * 4.7;
      const theta = seededUnit(i, 2) * Math.PI * 2;
      const phi = Math.acos(2 * seededUnit(i, 3) - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [adjustedCount]);

  useFrame((_state, delta) => {
    if (!material.current) return;
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, target * (.19 + energy * .045), 2.4, delta);
  });

  return (
    <Points positions={points} stride={3} frustumCulled={false}>
      <PointMaterial ref={material} transparent color={color} size={(0.011 + energy * 0.0025) * (aura === "forge" ? 1.12 : 1)} sizeAttenuation depthWrite={false} opacity={0} />
    </Points>
  );
}

const vertexShader = `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uWarp;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vWave;
  void main() {
    vec3 p = position;
    float t = uTime;
    float a = sin(p.y * 3.15 + t * .58);
    float b = sin(p.x * 3.8 - t * .41);
    float c = cos(p.z * 2.7 + t * .33);
    float d = sin((p.x + p.y + p.z) * 6.2 + t * .72);
    float wave = (a + b + c) * .024 + d * .007;
    p += normal * wave * uWarp * (.55 + uEnergy * .45);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = mv.xyz;
    vWave = wave;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vWave;
  void main() {
    vec3 viewDir = normalize(-vView);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.35);
    float drift = .5 + .5 * sin(vNormal.y * 4.4 + uTime * .32 + vWave * 18.0);
    vec3 color = mix(uColorA, uColorB, .24 + drift * .44);
    float alpha = uOpacity * (.045 + fresnel * .48 + drift * .035);
    gl_FragColor = vec4(color * (.62 + fresnel * 1.1), alpha);
  }
`;

function FieldShell({ palette, energy, warp, reduced, segments, opacity }: { palette: { primary: string; secondary: string }; energy: number; warp: number; reduced: boolean; segments: number; opacity: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uEnergy: { value: energy },
    uWarp: { value: warp },
    uOpacity: { value: 0 },
    uColorA: { value: new THREE.Color(palette.primary) },
    uColorB: { value: new THREE.Color(palette.secondary) },
  }), []);

  useEffect(() => {
    const mat = material.current;
    if (!mat) return;
    mat.uniforms.uEnergy.value = energy;
    mat.uniforms.uWarp.value = warp;
    mat.uniforms.uColorA.value.set(palette.primary);
    mat.uniforms.uColorB.value.set(palette.secondary);
  }, [energy, palette.primary, palette.secondary, warp]);

  useFrame(({ clock }, delta) => {
    const mat = material.current;
    if (!mat) return;
    mat.uniforms.uTime.value = reduced ? 0 : clock.getElapsedTime();
    mat.uniforms.uOpacity.value = THREE.MathUtils.damp(mat.uniforms.uOpacity.value, opacity, 2.8, delta);
  });

  return (
    <mesh scale={[1.11, .94, 1.04]} rotation={[-.08, .2, -.11]}>
      <icosahedronGeometry args={[1.16, artifactDetail(segments)]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ReactiveField({ reduced, aura, energy, quality, kinetic, scene }: { reduced: boolean; aura: AuraMode; energy: number; quality: AuraQuality; kinetic: { current: number }; scene: CoreScene }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshPhysicalMaterial>(null);
  const wire = useRef<THREE.MeshBasicMaterial>(null);
  const spine = useRef<THREE.Mesh>(null);
  const spineMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringMatA = useRef<THREE.MeshBasicMaterial>(null);
  const ringMatB = useRef<THREE.MeshBasicMaterial>(null);
  const presence = useRef(0);
  const { pointer, viewport } = useThree();
  const palette = palettes[aura];
  const config = qualityConfig[quality];
  const personality = personalities[aura];
  const sceneState = sceneConfig[scene];
  const narrow = viewport.width < 7;
  const xFactor = narrow ? .68 : 1;
  const sceneScale = narrow ? .72 : 1;

  useFrame((_state, delta) => {
    if (!group.current) return;
    const kineticEnergy = reduced ? 0 : kinetic.current;
    const effective = energy + kineticEnergy * .45;
    const pointerX = pointer.x * Math.min(viewport.width * .1, .72) * sceneState.pointer;
    const pointerY = pointer.y * Math.min(viewport.height * .08, .52) * sceneState.pointer;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, sceneState.x * xFactor + pointerX, 2.35, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, sceneState.y + pointerY, 2.35, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, sceneState.z, 2.2, delta);
    const targetScale = sceneState.scale * sceneScale * personality.scale * (1 + kineticEnergy * .018);
    const scale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 3.1, delta);
    group.current.scale.setScalar(scale);
    presence.current = THREE.MathUtils.damp(presence.current, sceneState.opacity, 2.65, delta);

    if (body.current) body.current.opacity = presence.current * .72;
    if (wire.current) wire.current.opacity = presence.current * (aura === "void" ? .035 : .075);
    if (spineMat.current) spineMat.current.opacity = presence.current * sceneState.ring * (aura === "void" ? .075 : aura === "forge" ? .19 : .23);
    if (ringMatA.current) ringMatA.current.opacity = presence.current * sceneState.ring * (aura === "void" ? .075 : .15);
    if (ringMatB.current) ringMatB.current.opacity = presence.current * sceneState.ring * (aura === "void" ? .055 : .1);

    if (!reduced) {
      group.current.rotation.y += delta * (personality.spin + effective * .006);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * .08 * sceneState.pointer, 1.8, delta);
      if (spine.current) {
        spine.current.rotation.y += delta * (personality.ring * .44 + effective * .01);
        spine.current.rotation.z -= delta * (personality.ring * .26 + effective * .006);
      }
      if (ringA.current) ringA.current.rotation.z += delta * (personality.ring + effective * .016);
      if (ringB.current) ringB.current.rotation.x -= delta * (personality.ring * .68 + effective * .012);
    }
  });

  return (
    <group ref={group} position={[sceneState.x * xFactor, sceneState.y, sceneState.z]} scale={.001}>
      <Float speed={reduced ? 0 : personality.float + energy * .08} rotationIntensity={reduced ? 0 : personality.rotation} floatIntensity={reduced ? 0 : aura === "void" ? .08 : aura === "forge" ? .16 : .24}>
        <mesh scale={[1.04, .9, 1.08]} rotation={[.08, -.16, .13]}>
          <icosahedronGeometry args={[1.13, artifactDetail(config.segments)]} />
          <meshPhysicalMaterial ref={body} transparent opacity={0} depthWrite={false} color={palette.base} emissive={palette.emissive} emissiveIntensity={aura === "forge" ? .54 + energy * .08 : .28 + energy * .06} roughness={aura === "void" ? .5 : .34} metalness={aura === "forge" ? .34 : .24} clearcoat={.82} clearcoatRoughness={.32} />
        </mesh>
        <mesh scale={[1.055, .915, 1.095]} rotation={[.08, -.16, .13]}>
          <icosahedronGeometry args={[1.13, Math.max(2, artifactDetail(config.segments) - 1)]} />
          <meshBasicMaterial ref={wire} color={palette.primary} wireframe transparent opacity={0} depthWrite={false} />
        </mesh>
        <FieldShell palette={palette} energy={energy} warp={personality.warp} reduced={reduced} segments={config.segments} opacity={sceneState.opacity * (aura === "void" ? .58 : aura === "forge" ? .9 : .78)} />
      </Float>
      <mesh ref={spine} rotation={[.56, -.24, .7]}>
        <torusKnotGeometry args={[1.4, .014, quality === "high" ? 128 : quality === "balanced" ? 96 : 64, 5, 3, 7]} />
        <meshBasicMaterial ref={spineMat} color={palette.secondary} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringA} rotation={[1.18, .08, .22]}>
        <torusGeometry args={[1.67, .0055, 6, config.ringSegments]} />
        <meshBasicMaterial ref={ringMatA} color={palette.secondary} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} rotation={[.22, .9, 1.08]}>
        <torusGeometry args={[2.02, .0035, 6, config.ringSegments]} />
        <meshBasicMaterial ref={ringMatB} color={palette.tertiary} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Sparkles count={reduced ? 8 : Math.round(config.sparkles * personality.sparkle)} scale={aura === "void" ? 7 : 5.2} size={aura === "forge" ? 1.6 : 1.05} speed={reduced ? 0 : aura === "forge" ? .16 : aura === "void" ? .025 : .09} opacity={sceneState.cloud * (aura === "void" ? .08 : .2)} color={palette.tertiary} />
    </group>
  );
}

function LightRig({ aura, energy, scene }: { aura: AuraMode; energy: number; scene: CoreScene }) {
  const palette = palettes[aura];
  const sceneLight = .35 + sceneConfig[scene].opacity * .65;
  const factor = (aura === "forge" ? 1.08 : aura === "void" ? .48 : .84) * sceneLight;
  return <><ambientLight intensity={(.22 + energy * .06) * factor} /><pointLight position={[4, 4, 4]} intensity={(6 + energy * 2.4) * factor} distance={11} color={palette.primary} /><pointLight position={[-4, -2, 3]} intensity={(4.5 + energy * 1.7) * factor} distance={10} color={palette.secondary} /></>;
}

export default function AuraCanvas({ aura }: { aura: AuraMode }) {
  const [reduced, setReduced] = useState(false);
  const [capable, setCapable] = useState(true);
  const [energy, setEnergy] = useState(1);
  const [quality, setQuality] = useState<AuraQuality>("balanced");
  const [scene, setScene] = useState<CoreScene>("origin");
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kinetic = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    const weak = Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    setCapable(!weak);
    const initial = document.documentElement.dataset.quality;
    if (initial === "high" || initial === "balanced" || initial === "low") setQuality(initial);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const onEnergy = (event: Event) => { const value = (event as CustomEvent<number>).detail; if (Number.isFinite(value)) setEnergy(THREE.MathUtils.clamp(value, .55, 1.55)); };
    const onBurst = () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
      setEnergy((value) => Math.min(1.65, value + .34));
      burstTimer.current = setTimeout(() => {
        const cssEnergy = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--aura-energy"));
        setEnergy(Number.isFinite(cssEnergy) ? cssEnergy : 1);
      }, 760);
    };
    const onQuality = (event: Event) => { const value = (event as CustomEvent<AuraQuality>).detail; if (value === "high" || value === "balanced" || value === "low") setQuality(value); };
    const onKinetic = (event: Event) => { const value = (event as CustomEvent<number>).detail; if (Number.isFinite(value)) kinetic.current = THREE.MathUtils.clamp(value, 0, 1); };
    const onScene = (event: Event) => { const value = (event as CustomEvent<CoreScene>).detail; if (value in sceneConfig) setScene(value); };
    window.addEventListener("aura:energy", onEnergy as EventListener);
    window.addEventListener("aura:burst", onBurst);
    window.addEventListener("aura:quality", onQuality as EventListener);
    window.addEventListener("aura:kinetic", onKinetic as EventListener);
    window.addEventListener("aura:scene", onScene as EventListener);
    return () => {
      window.removeEventListener("aura:energy", onEnergy as EventListener);
      window.removeEventListener("aura:burst", onBurst);
      window.removeEventListener("aura:quality", onQuality as EventListener);
      window.removeEventListener("aura:kinetic", onKinetic as EventListener);
      window.removeEventListener("aura:scene", onScene as EventListener);
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, []);

  if (!capable) return <div className="aura-fallback" aria-hidden="true" />;
  const config = qualityConfig[quality];
  return (
    <div className="aura-canvas" aria-hidden="true" data-quality={quality} data-scene={scene}>
      <Canvas dpr={config.dpr} camera={{ position: [0, 0, 7.2], fov: 43 }} gl={{ alpha: true, antialias: quality !== "low", powerPreference: "high-performance" }}>
        <AdaptiveDpr />
        <LightRig aura={aura} energy={energy} scene={scene} />
        <SignalCloud color={palettes[aura].tertiary} energy={energy} count={config.points} aura={aura} scene={scene} />
        <ReactiveField reduced={reduced} aura={aura} energy={energy} quality={quality} kinetic={kinetic} scene={scene} />
      </Canvas>
    </div>
  );
}

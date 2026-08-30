"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Float, MeshDistortMaterial, Points, PointMaterial, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { AuraMode } from "@/data/site";
import type { AuraQuality } from "@/components/PerformanceGovernor";
import type { CoreScene } from "@/components/CoreDirector";

const palettes: Record<AuraMode, { primary: string; secondary: string; tertiary: string; base: string; emissive: string }> = {
  pulse: { primary: "#ff4d7e", secondary: "#55d8ff", tertiary: "#a887ff", base: "#12131c", emissive: "#241334" },
  forge: { primary: "#ffb95a", secondary: "#ff624d", tertiary: "#ffe0a3", base: "#171009", emissive: "#3a1808" },
  void: { primary: "#a887ff", secondary: "#5267ff", tertiary: "#7fdcff", base: "#080912", emissive: "#0d1032" },
};

const personalities: Record<AuraMode, { spin: number; float: number; rotation: number; distort: number; materialSpeed: number; ring: number; density: number; sparkle: number; scale: number }> = {
  pulse: { spin: .082, float: 1.25, rotation: .34, distort: .24, materialSpeed: 1.15, ring: .17, density: 1, sparkle: 1, scale: 1 },
  forge: { spin: .036, float: .66, rotation: .18, distort: .38, materialSpeed: .72, ring: .095, density: 1.22, sparkle: 1.38, scale: 1.08 },
  void: { spin: .014, float: .24, rotation: .08, distort: .105, materialSpeed: .28, ring: .032, density: .55, sparkle: .5, scale: .94 },
};

const sceneConfig: Record<CoreScene, { x: number; y: number; z: number; scale: number; pointer: number; ghost: number }> = {
  origin: { x: 1.7, y: .2, z: 0, scale: 1, pointer: 1, ghost: .15 },
  state: { x: -2.25, y: .15, z: -.2, scale: .63, pointer: .42, ghost: .32 },
  work: { x: 2.65, y: .35, z: -.25, scale: .56, pointer: .32, ghost: .55 },
  foundry: { x: .25, y: .05, z: -.55, scale: .3, pointer: .12, ghost: .8 },
  trajectory: { x: -1.7, y: -.9, z: -1.2, scale: .13, pointer: .06, ghost: 1 },
  transmissions: { x: 3.2, y: 1.25, z: -1.8, scale: .035, pointer: 0, ghost: 1.3 },
  machine: { x: 2.25, y: -.05, z: -.2, scale: .72, pointer: .38, ghost: .45 },
  contact: { x: .45, y: 0, z: .15, scale: 1.28, pointer: .18, ghost: .25 },
};

const qualityConfig: Record<AuraQuality, { points: number; detail: number; ringSegments: number; sparkles: number; dpr: [number, number] }> = {
  high: { points: 450, detail: 5, ringSegments: 160, sparkles: 54, dpr: [1, 1.35] },
  balanced: { points: 320, detail: 4, ringSegments: 120, sparkles: 38, dpr: [0.9, 1.15] },
  low: { points: 190, detail: 3, ringSegments: 82, sparkles: 22, dpr: [0.72, 1] },
};

function SignalCloud({ color, energy, count, aura }: { color: string; energy: number; count: number; aura: AuraMode }) {
  const personality = personalities[aura];
  const adjustedCount = Math.max(80, Math.round(count * personality.density));
  const points = useMemo(() => {
    const arr = new Float32Array(adjustedCount * 3);
    for (let i = 0; i < adjustedCount; i++) {
      const r = 2.7 + Math.random() * 4.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [adjustedCount]);

  return (
    <Points positions={points} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={(0.015 + energy * 0.004) * (aura === "void" ? .72 : aura === "forge" ? 1.16 : 1)} sizeAttenuation depthWrite={false} opacity={(0.22 + energy * 0.1) * (aura === "void" ? .55 : 1)} />
    </Points>
  );
}

const vertexShader = `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position;
    float waveA = sin(p.x * 4.0 + uTime * 1.1);
    float waveB = cos(p.y * 5.0 - uTime * 0.8);
    float waveC = sin(p.z * 6.0 + uTime * 0.55);
    float displacement = (waveA + waveB + waveC) * 0.012 * uEnergy;
    p += normal * displacement;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDirection = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.2);
    float scan = 0.5 + 0.5 * sin(vPosition.y * 13.0 - uTime * 2.1);
    float pulse = 0.82 + sin(uTime * 1.7) * 0.08;
    float alpha = (0.035 + fresnel * 0.34 + scan * 0.025) * uEnergy;
    vec3 signal = uColor * (0.7 + fresnel * 1.35) * pulse;
    gl_FragColor = vec4(signal, alpha);
  }
`;

function SignalMembrane({ color, energy, reduced, detail }: { color: string; energy: number; reduced: boolean; detail: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: energy }, uColor: { value: new THREE.Color(color) } }), []);
  useEffect(() => {
    if (!material.current) return;
    material.current.uniforms.uEnergy.value = energy;
    material.current.uniforms.uColor.value.set(color);
  }, [color, energy]);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = reduced ? 0 : clock.getElapsedTime();
  });
  return (
    <mesh scale={1.47}>
      <icosahedronGeometry args={[1.28, detail]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ReactiveCore({ reduced, aura, energy, quality, kinetic, scene }: { reduced: boolean; aura: AuraMode; energy: number; quality: AuraQuality; kinetic: { current: number }; scene: CoreScene }) {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const { pointer, viewport } = useThree();
  const palette = palettes[aura];
  const config = qualityConfig[quality];
  const personality = personalities[aura];
  const sceneState = sceneConfig[scene];

  useFrame((_state, delta) => {
    if (!group.current) return;
    const kineticEnergy = reduced ? 0 : kinetic.current;
    const effective = energy + kineticEnergy * .72;
    const pointerX = pointer.x * Math.min(viewport.width * .16, 1.15) * sceneState.pointer;
    const pointerY = pointer.y * Math.min(viewport.height * .12, .85) * sceneState.pointer;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, sceneState.x + pointerX, 2.9, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, sceneState.y + pointerY, 2.7, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, sceneState.z, 2.3, delta);
    const targetScale = sceneState.scale * personality.scale * (1 + kineticEnergy * .035);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, targetScale, 4.5, delta));
    if (!reduced) {
      group.current.rotation.y += delta * (personality.spin + effective * .018);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * .18 * sceneState.pointer, 2, delta);
      if (ringA.current) ringA.current.rotation.z += delta * (personality.ring + effective * .04);
      if (ringB.current) ringB.current.rotation.x -= delta * (personality.ring * .72 + effective * .028);
    }
  });

  return (
    <group ref={group} position={[sceneState.x, sceneState.y, sceneState.z]}>
      <Float speed={reduced ? 0 : personality.float + energy * .18} rotationIntensity={reduced ? 0 : personality.rotation} floatIntensity={reduced ? 0 : aura === "void" ? .15 : aura === "forge" ? .28 : .5}>
        <mesh>
          <icosahedronGeometry args={[1.28, config.detail]} />
          <MeshDistortMaterial color={palette.base} emissive={palette.emissive} emissiveIntensity={aura === "forge" ? .72 + energy * .2 : .38 + energy * .18} roughness={aura === "void" ? .34 : .16} metalness={aura === "forge" ? .5 : .38} distort={reduced ? .04 : personality.distort + energy * .07} speed={reduced ? 0 : personality.materialSpeed + energy * .22} />
        </mesh>
        <mesh scale={1.02}>
          <icosahedronGeometry args={[1.28, Math.max(2, config.detail - 2)]} />
          <meshBasicMaterial color={palette.primary} wireframe transparent opacity={(0.075 + energy * .045) * (aura === "void" ? .48 : 1)} />
        </mesh>
        <SignalMembrane color={palette.primary} energy={energy * (aura === "void" ? .72 : aura === "forge" ? 1.2 : 1)} reduced={reduced} detail={config.detail} />
      </Float>
      <mesh ref={ringA} rotation={[1.2, .1, .2]}>
        <torusGeometry args={[1.86, .012, 8, config.ringSegments]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={(.32 + energy * .13) * (aura === "void" ? .36 : 1)} />
      </mesh>
      <mesh ref={ringB} rotation={[.2, .9, 1.1]}>
        <torusGeometry args={[2.22, .008, 8, config.ringSegments]} />
        <meshBasicMaterial color={palette.tertiary} transparent opacity={(.22 + energy * .1) * (aura === "void" ? .42 : 1)} />
      </mesh>
      <Sparkles count={reduced ? 12 : Math.round((config.sparkles + energy * 8) * personality.sparkle)} scale={aura === "void" ? 7 : 5} size={aura === "forge" ? 2.05 + energy * .42 : 1.35 + energy * .32} speed={reduced ? 0 : aura === "forge" ? .36 : aura === "void" ? .035 : .19} opacity={aura === "void" ? .18 : .36 + energy * .08} color={palette.tertiary} />
      {sceneState.ghost > .5 && <Sparkles count={reduced ? 10 : Math.round(config.sparkles * sceneState.ghost * 1.7)} scale={8 + sceneState.ghost * 4} size={scene === "transmissions" ? 1.1 : 1.7} speed={reduced ? 0 : scene === "trajectory" ? .035 : .08} opacity={scene === "transmissions" ? .16 : .28} color={palette.secondary} />}
    </group>
  );
}

function LightRig({ aura, energy }: { aura: AuraMode; energy: number }) {
  const palette = palettes[aura];
  const factor = aura === "forge" ? 1.24 : aura === "void" ? .46 : 1;
  return <><ambientLight intensity={(.34 + energy * .12) * factor} /><pointLight position={[4, 4, 4]} intensity={(10 + energy * 5) * factor} distance={12} color={palette.primary} /><pointLight position={[-4, -2, 3]} intensity={(7 + energy * 3) * factor} distance={11} color={palette.secondary} /><pointLight position={[0, 4, -4]} intensity={(5 + energy * 2.5) * factor} distance={12} color={palette.tertiary} /></>;
}

export default function AuraCanvas({ aura }: { aura: AuraMode }) {
  const [reduced, setReduced] = useState(false);
  const [capable, setCapable] = useState(true);
  const [energy, setEnergy] = useState(1);
  const [quality, setQuality] = useState<AuraQuality>("high");
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
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const onEnergy = (event: Event) => { const value = (event as CustomEvent<number>).detail; if (Number.isFinite(value)) setEnergy(THREE.MathUtils.clamp(value, .55, 1.55)); };
    const onBurst = () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
      setEnergy((value) => Math.min(1.75, value + .5));
      burstTimer.current = setTimeout(() => {
        const cssEnergy = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--aura-energy"));
        setEnergy(Number.isFinite(cssEnergy) ? cssEnergy : 1);
      }, 850);
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
      <Canvas dpr={config.dpr} camera={{ position: [0, 0, 7.4], fov: 44 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <AdaptiveDpr />
        <LightRig aura={aura} energy={energy} />
        <SignalCloud color={palettes[aura].tertiary} energy={energy} count={config.points} aura={aura} />
        <ReactiveCore reduced={reduced} aura={aura} energy={energy} quality={quality} kinetic={kinetic} scene={scene} />
      </Canvas>
    </div>
  );
}

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Float, MeshDistortMaterial, Points, PointMaterial, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { AuraMode } from "@/data/site";
import type { AuraQuality } from "@/components/PerformanceGovernor";

const palettes: Record<AuraMode, { primary: string; secondary: string; tertiary: string; base: string; emissive: string }> = {
  pulse: { primary: "#ff4d7e", secondary: "#55d8ff", tertiary: "#a887ff", base: "#12131c", emissive: "#241334" },
  forge: { primary: "#ffb95a", secondary: "#ff624d", tertiary: "#ffe0a3", base: "#171009", emissive: "#3a1808" },
  void: { primary: "#a887ff", secondary: "#5267ff", tertiary: "#7fdcff", base: "#080912", emissive: "#0d1032" },
};

const qualityConfig: Record<AuraQuality, { points: number; detail: number; ringSegments: number; sparkles: number; dpr: [number, number] }> = {
  high: { points: 450, detail: 5, ringSegments: 160, sparkles: 54, dpr: [1, 1.35] },
  balanced: { points: 320, detail: 4, ringSegments: 120, sparkles: 38, dpr: [0.9, 1.15] },
  low: { points: 190, detail: 3, ringSegments: 82, sparkles: 22, dpr: [0.72, 1] },
};

function SignalCloud({ color, energy, count }: { color: string; energy: number; count: number }) {
  const points = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.7 + Math.random() * 4.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  return (
    <Points positions={points} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.015 + energy * 0.004} sizeAttenuation depthWrite={false} opacity={0.22 + energy * 0.1} />
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
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uEnergy: { value: energy },
    uColor: { value: new THREE.Color(color) },
  }), []);

  useEffect(() => {
    if (!material.current) return;
    material.current.uniforms.uEnergy.value = energy;
    material.current.uniforms.uColor.value.set(color);
  }, [color, energy]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = reduced ? 0 : clock.getElapsedTime();
  });

  return (
    <mesh scale={1.47}>
      <icosahedronGeometry args={[1.28, detail]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ReactiveCore({ reduced, aura, energy, quality }: { reduced: boolean; aura: AuraMode; energy: number; quality: AuraQuality }) {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const { pointer, viewport } = useThree();
  const palette = palettes[aura];
  const config = qualityConfig[quality];

  useFrame((_state, delta) => {
    if (!group.current) return;
    const scroll = typeof window === "undefined" ? 0 : window.scrollY / Math.max(window.innerHeight, 1);
    const tx = pointer.x * Math.min(viewport.width * 0.16, 1.15);
    const ty = pointer.y * Math.min(viewport.height * 0.12, 0.85);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, tx, 2.6, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, ty - Math.min(scroll * 0.14, 0.9), 2.4, delta);
    if (!reduced) {
      group.current.rotation.y += delta * (0.055 + energy * 0.025);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * 0.18, 2, delta);
      if (ringA.current) ringA.current.rotation.z += delta * (0.11 + energy * 0.07);
      if (ringB.current) ringB.current.rotation.x -= delta * (0.08 + energy * 0.05);
    }
  });

  return (
    <group ref={group} position={[1.7, 0.2, 0]}>
      <Float speed={reduced ? 0 : 1.1 + energy * 0.22} rotationIntensity={reduced ? 0 : 0.28 + energy * 0.08} floatIntensity={reduced ? 0 : 0.45 + energy * 0.12}>
        <mesh>
          <icosahedronGeometry args={[1.28, config.detail]} />
          <MeshDistortMaterial
            color={palette.base}
            emissive={palette.emissive}
            emissiveIntensity={0.38 + energy * 0.18}
            roughness={0.16}
            metalness={0.38}
            distort={reduced ? 0.04 : 0.22 + energy * 0.1}
            speed={reduced ? 0 : 0.9 + energy * 0.45}
          />
        </mesh>
        <mesh scale={1.02}>
          <icosahedronGeometry args={[1.28, Math.max(2, config.detail - 2)]} />
          <meshBasicMaterial color={palette.primary} wireframe transparent opacity={0.075 + energy * 0.045} />
        </mesh>
        <SignalMembrane color={palette.primary} energy={energy} reduced={reduced} detail={config.detail} />
      </Float>

      <mesh ref={ringA} rotation={[1.2, 0.1, 0.2]}>
        <torusGeometry args={[1.86, 0.012, 8, config.ringSegments]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={0.32 + energy * 0.13} />
      </mesh>
      <mesh ref={ringB} rotation={[0.2, 0.9, 1.1]}>
        <torusGeometry args={[2.22, 0.008, 8, config.ringSegments]} />
        <meshBasicMaterial color={palette.tertiary} transparent opacity={0.22 + energy * 0.1} />
      </mesh>
      <Sparkles count={reduced ? 14 : Math.round(config.sparkles + energy * 8)} scale={5} size={1.4 + energy * 0.35} speed={reduced ? 0 : 0.12 + energy * 0.1} opacity={0.32 + energy * 0.1} color={palette.tertiary} />
    </group>
  );
}

function LightRig({ aura, energy }: { aura: AuraMode; energy: number }) {
  const palette = palettes[aura];
  return (
    <>
      <ambientLight intensity={0.34 + energy * 0.12} />
      <pointLight position={[4, 4, 4]} intensity={10 + energy * 5} distance={12} color={palette.primary} />
      <pointLight position={[-4, -2, 3]} intensity={7 + energy * 3} distance={11} color={palette.secondary} />
      <pointLight position={[0, 4, -4]} intensity={5 + energy * 2.5} distance={12} color={palette.tertiary} />
    </>
  );
}

export default function AuraCanvas({ aura }: { aura: AuraMode }) {
  const [reduced, setReduced] = useState(false);
  const [capable, setCapable] = useState(true);
  const [energy, setEnergy] = useState(1);
  const [quality, setQuality] = useState<AuraQuality>("high");
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const onEnergy = (event: Event) => {
      const value = (event as CustomEvent<number>).detail;
      if (Number.isFinite(value)) setEnergy(THREE.MathUtils.clamp(value, 0.55, 1.55));
    };
    const onBurst = () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
      setEnergy((value) => Math.min(1.75, value + 0.5));
      burstTimer.current = setTimeout(() => {
        const cssEnergy = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--aura-energy"));
        setEnergy(Number.isFinite(cssEnergy) ? cssEnergy : 1);
      }, 850);
    };
    const onQuality = (event: Event) => {
      const value = (event as CustomEvent<AuraQuality>).detail;
      if (value === "high" || value === "balanced" || value === "low") setQuality(value);
    };
    window.addEventListener("aura:energy", onEnergy as EventListener);
    window.addEventListener("aura:burst", onBurst);
    window.addEventListener("aura:quality", onQuality as EventListener);
    return () => {
      window.removeEventListener("aura:energy", onEnergy as EventListener);
      window.removeEventListener("aura:burst", onBurst);
      window.removeEventListener("aura:quality", onQuality as EventListener);
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, []);

  if (!capable) return <div className="aura-fallback" aria-hidden="true" />;

  const config = qualityConfig[quality];

  return (
    <div className="aura-canvas" aria-hidden="true" data-quality={quality}>
      <Canvas dpr={config.dpr} camera={{ position: [0, 0, 7.4], fov: 44 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <AdaptiveDpr />
        <LightRig aura={aura} energy={energy} />
        <SignalCloud color={palettes[aura].tertiary} energy={energy} count={config.points} />
        <ReactiveCore reduced={reduced} aura={aura} energy={energy} quality={quality} />
      </Canvas>
    </div>
  );
}

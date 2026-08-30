"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Points, PointMaterial, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function SignalCloud() {
  const points = useMemo(() => {
    const arr = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) {
      const r = 2.7 + Math.random() * 4.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  return (
    <Points positions={points} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#f3efe5" size={0.018} sizeAttenuation depthWrite={false} opacity={0.34} />
    </Points>
  );
}

function ReactiveCore({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const { pointer, viewport } = useThree();

  useFrame((_state, delta) => {
    if (!group.current) return;
    const scroll = typeof window === "undefined" ? 0 : window.scrollY / Math.max(window.innerHeight, 1);
    const tx = pointer.x * Math.min(viewport.width * 0.16, 1.15);
    const ty = pointer.y * Math.min(viewport.height * 0.12, 0.85);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, tx, 2.6, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, ty - Math.min(scroll * 0.14, 0.9), 2.4, delta);
    if (!reduced) {
      group.current.rotation.y += delta * 0.08;
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * 0.18, 2, delta);
      if (ringA.current) ringA.current.rotation.z += delta * 0.18;
      if (ringB.current) ringB.current.rotation.x -= delta * 0.13;
    }
  });

  return (
    <group ref={group} position={[1.7, 0.2, 0]}>
      <Float speed={reduced ? 0 : 1.35} rotationIntensity={reduced ? 0 : 0.35} floatIntensity={reduced ? 0 : 0.6}>
        <mesh>
          <icosahedronGeometry args={[1.28, 5]} />
          <MeshDistortMaterial
            color="#12131c"
            emissive="#241334"
            emissiveIntensity={0.55}
            roughness={0.16}
            metalness={0.38}
            distort={reduced ? 0.05 : 0.34}
            speed={reduced ? 0 : 1.4}
          />
        </mesh>
        <mesh scale={1.02}>
          <icosahedronGeometry args={[1.28, 2]} />
          <meshBasicMaterial color="#ff4d7e" wireframe transparent opacity={0.12} />
        </mesh>
      </Float>

      <mesh ref={ringA} rotation={[1.2, 0.1, 0.2]}>
        <torusGeometry args={[1.86, 0.012, 8, 160]} />
        <meshBasicMaterial color="#66d9ff" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ringB} rotation={[0.2, 0.9, 1.1]}>
        <torusGeometry args={[2.22, 0.008, 8, 160]} />
        <meshBasicMaterial color="#ffbf69" transparent opacity={0.34} />
      </mesh>
      <Sparkles count={reduced ? 20 : 56} scale={5} size={1.8} speed={reduced ? 0 : 0.24} opacity={0.45} color="#caa7ff" />
    </group>
  );
}

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={16} distance={12} color="#ff4d7e" />
      <pointLight position={[-4, -2, 3]} intensity={10} distance={11} color="#4edcff" />
      <pointLight position={[0, 4, -4]} intensity={8} distance={12} color="#a77dff" />
    </>
  );
}

export default function AuraCanvas() {
  const [reduced, setReduced] = useState(false);
  const [capable, setCapable] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    const weak = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    setCapable(!weak);
    return () => media.removeEventListener?.("change", update);
  }, []);

  if (!capable) return <div className="aura-fallback" aria-hidden="true" />;

  return (
    <div className="aura-canvas" aria-hidden="true">
      <Canvas dpr={[1, 1.35]} camera={{ position: [0, 0, 7.4], fov: 44 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <LightRig />
        <SignalCloud />
        <ReactiveCore reduced={reduced} />
      </Canvas>
    </div>
  );
}

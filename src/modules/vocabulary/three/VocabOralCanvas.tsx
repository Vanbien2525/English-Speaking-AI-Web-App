"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface VocabModelProps {
  word: string;
}

function VocalTractMiniMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const tongueRef = useRef<THREE.Mesh>(null);

  // Slight gentle breathing / articulation wave animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
    if (tongueRef.current) {
      tongueRef.current.position.y = Math.sin(t * 2) * 0.04;
    }
  });

  // Color scheme based on phonetics
  const materials = useMemo(() => {
    return {
      teeth: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.15,
        metalness: 0.1,
      }),
      tongue: new THREE.MeshStandardMaterial({
        color: "#f43f5e", // Rose
        roughness: 0.4,
        metalness: 0.05,
      }),
      palate: new THREE.MeshStandardMaterial({
        color: "#fb7185",
        roughness: 0.6,
        transparent: true,
        opacity: 0.85,
      }),
      lips: new THREE.MeshStandardMaterial({
        color: "#e11d48",
        roughness: 0.5,
      }),
    };
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={1.8}>
      {/* Upper Palate (Vòm họng trên) */}
      <mesh material={materials.palate} position={[0, 0.45, 0]}>
        <torusGeometry args={[0.45, 0.08, 16, 32, Math.PI]} />
      </mesh>

      {/* Upper Teeth (Hàm trên) */}
      <mesh material={materials.teeth} position={[0, 0.38, 0.3]}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
      </mesh>

      {/* Lower Teeth (Hàm dưới) */}
      <mesh material={materials.teeth} position={[0, 0.12, 0.3]}>
        <boxGeometry args={[0.48, 0.09, 0.09]} />
      </mesh>

      {/* Dynamic Tongue (Lưỡi cơ học 3D) */}
      <mesh ref={tongueRef} material={materials.tongue} position={[0, 0.18, 0.05]}>
        <capsuleGeometry args={[0.2, 0.32, 16, 16]} />
      </mesh>

      {/* Lips (Môi trên & dưới) */}
      <mesh material={materials.lips} position={[0, 0.42, 0.4]}>
        <capsuleGeometry args={[0.07, 0.5, 8, 16]} />
      </mesh>
      <mesh material={materials.lips} position={[0, 0.08, 0.4]}>
        <capsuleGeometry args={[0.07, 0.46, 8, 16]} />
      </mesh>
    </group>
  );
}

export function VocabOralCanvas({ word }: VocabModelProps) {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-canvas/80 border border-border-subtle/80 shadow-inner">
      <div className="absolute top-2 left-3 z-10 text-[11px] font-medium tracking-wide uppercase text-ink-muted/80 bg-surface/80 px-2 py-0.5 rounded backdrop-blur">
        Mô hình 3D Khẩu hình ({word})
      </div>
      <Canvas
        camera={{ position: [0.35, 0.15, 1.4], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 3]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-2, -1, 1]} intensity={0.6} color="#38bdf8" />
        <VocalTractMiniMesh />
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 1.7} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePracticeStore } from "../stores/usePracticeStore";

// Static deterministic particle data generated once at module evaluation time
const PARTICLE_COUNT = 70;
const INITIAL_PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const t = i / PARTICLE_COUNT;
  // Deterministic pseudo-jitter without Math.random
  const jitterX = Math.sin(i * 12.9898) * 0.0075;
  const jitterY = Math.cos(i * 78.233) * 0.0075;
  const jitterZ = Math.sin(i * 45.164) * 0.01;

  INITIAL_PARTICLE_POSITIONS[i * 3] = -0.05 + t * 0.25 + jitterX;
  INITIAL_PARTICLE_POSITIONS[i * 3 + 1] = -0.22 + t * 0.28 + jitterY;
  INITIAL_PARTICLE_POSITIONS[i * 3 + 2] = jitterZ;
}

/**
 * Mid-Sagittal Vocal Tract Cross-Section Model (Mặt cắt đứng dọc giải phẫu cơ quan cấu âm)
 * Thiết kế chuẩn ngữ âm học học thuật (Academic Phonetics):
 * - Vị trí cấu âm (Place of Articulation): Interdental (Giữa hai hàm răng)
 * - Cơ quan chủ động (Active Articulator): Đầu lưỡi (Apex)
 * - Cơ quan bị động (Passive Articulator): Bờ cắn răng cửa hàm trên (Upper Incisors)
 * - Luồng hơi ma sát (Frictional Airflow Stream): Thoát qua kẽ răng hẹp
 */
export function OralCavityModel() {
  const { invalidate } = useThree();
  const morphWeights = usePracticeStore((s) => s.morphWeights);
  const isXRayMode = usePracticeStore((s) => s.isXRayMode);
  const showAnatomicalLabels = usePracticeStore((s) => s.showAnatomicalLabels);
  const activeFocusArticulator = usePracticeStore((s) => s.activeFocusArticulator);

  // References for morphing meshes
  const tongueRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Group>(null);
  const velumRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Materials based on X-Ray mode
  const materials = useMemo(() => {
    if (isXRayMode) {
      return {
        flesh: new THREE.MeshStandardMaterial({
          color: "#0284c7",
          transparent: true,
          opacity: 0.45,
          wireframe: false,
          roughness: 0.2,
          metalness: 0.8,
          emissive: "#0369a1",
          emissiveIntensity: 0.35,
        }),
        teeth: new THREE.MeshStandardMaterial({
          color: "#38bdf8",
          emissive: "#0284c7",
          emissiveIntensity: 0.5,
          roughness: 0.1,
        }),
        accent: new THREE.MeshBasicMaterial({
          color: "#38bdf8",
          wireframe: true,
        }),
      };
    }

    return {
      flesh: new THREE.MeshStandardMaterial({
        color: "#be185d", // Màu mô mềm hồng thẫm tự nhiên (Lingual flesh)
        roughness: 0.35,
        metalness: 0.05,
      }),
      palate: new THREE.MeshStandardMaterial({
        color: "#fda4af", // Vòm ngạc hồng nhạt
        roughness: 0.4,
      }),
      teeth: new THREE.MeshStandardMaterial({
        color: "#f8fafc", // Men răng trắng ngà
        roughness: 0.15,
        metalness: 0.1,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: "#fb7185",
        roughness: 0.3,
      }),
    };
  }, [isXRayMode]);

  // Airflow dynamic particles data
  const { particleGeometry, particleInitialPos } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(INITIAL_PARTICLE_POSITIONS);
    const initial = new Float32Array(INITIAL_PARTICLE_POSITIONS);

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { particleGeometry: geo, particleInitialPos: initial };
  }, []);

  // Update morph targets each frame & animate airflow
  useFrame((_, delta) => {
    let needsRender = false;

    // 1. Morph Lower Jaw opening
    if (lowerJawRef.current) {
      const targetJawRotation = -morphWeights.jawOpen * 0.25; // Hàm dưới hạ xuống
      const currentRot = lowerJawRef.current.rotation.z;
      const newRot = THREE.MathUtils.lerp(currentRot, targetJawRotation, 0.15);
      if (Math.abs(newRot - currentRot) > 0.0005) {
        lowerJawRef.current.rotation.z = newRot;
        needsRender = true;
      }
    }

    // 2. Morph Tongue shape
    if (tongueRef.current) {
      // Khi phát âm /θ/, đầu lưỡi đẩy ra trước và nhích nhẹ lên kẹp giữa răng
      const targetX = 0.05 + morphWeights.tongueInterdental * 0.045 - morphWeights.tongueVelar * 0.03;
      const targetY = -0.04 + morphWeights.tongueAlveolar * 0.035 - morphWeights.jawOpen * 0.03;
      const targetScaleX = 1 + morphWeights.tongueInterdental * 0.25;

      tongueRef.current.position.x = THREE.MathUtils.lerp(tongueRef.current.position.x, targetX, 0.15);
      tongueRef.current.position.y = THREE.MathUtils.lerp(tongueRef.current.position.y, targetY, 0.15);
      tongueRef.current.scale.x = THREE.MathUtils.lerp(tongueRef.current.scale.x, targetScaleX, 0.15);

      if (Math.abs(tongueRef.current.position.x - targetX) > 0.0005) {
        needsRender = true;
      }
    }

    // 3. Morph Velum (Ngạc mềm)
    if (velumRef.current) {
      const targetVelumRot = morphWeights.velumLower * 0.35; // Hạ ngạc mềm
      velumRef.current.rotation.z = THREE.MathUtils.lerp(velumRef.current.rotation.z, targetVelumRot, 0.15);
    }

    // 4. Animate Airflow stream particles
    if (particlesRef.current && morphWeights.airflowIntensity > 0.1) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idxX = i * 3;
        const idxY = i * 3 + 1;
        const currentX = posArray[idxX] ?? 0;
        const currentY = posArray[idxY] ?? 0;

        posArray[idxX] = currentX + delta * (0.15 * morphWeights.airflowIntensity);
        posArray[idxY] = currentY + delta * (0.12 * morphWeights.airflowIntensity);

        // Reset hạt khi vượt ra ngoài môi
        if (currentX > 0.18 || currentY > 0.06) {
          posArray[idxX] = particleInitialPos[idxX] ?? 0;
          posArray[idxY] = particleInitialPos[idxY] ?? 0;
        }
      }
      posAttr.needsUpdate = true;
      needsRender = true;
    }

    if (needsRender) {
      invalidate();
    }
  });

  // Re-render whenever parameters change
  useEffect(() => {
    invalidate();
  }, [morphWeights, isXRayMode, showAnatomicalLabels, invalidate]);

  return (
    <group position={[0, 0, 0]}>
      {/* =====================================================================
          1. VÒM KHẨU CÁI CỐ ĐỊNH & HÀM RĂNG TRÊN (MAXILLA & HARD PALATE)
          ===================================================================== */}
      {/* Vòm miệng cứng (Hard Palate) */}
      <mesh position={[0.02, 0.05, 0]} material={materials.palate}>
        <boxGeometry args={[0.16, 0.015, 0.08]} />
      </mesh>

      {/* Răng cửa hàm trên (Upper Incisors) — Điểm đối chiếu cấu âm của âm /θ/ */}
      <mesh
        position={[0.1, 0.028, 0]}
        rotation={[0, 0, 0.15]}
        material={materials.teeth}
      >
        <boxGeometry args={[0.012, 0.032, 0.06]} />
      </mesh>

      {/* Môi trên (Upper Lip) */}
      <mesh position={[0.12, 0.055, 0]} material={materials.flesh}>
        <capsuleGeometry args={[0.018, 0.04, 8, 16]} />
      </mesh>

      {/* Ngạc mềm & Lưỡi gà (Soft Palate & Uvula) */}
      <group position={[-0.06, 0.045, 0]} ref={velumRef}>
        <mesh position={[-0.025, -0.02, 0]} rotation={[0, 0, 0.35]} material={materials.palate}>
          <capsuleGeometry args={[0.012, 0.05, 8, 16]} />
        </mesh>
      </group>

      {/* Thành sau họng (Posterior Pharyngeal Wall) */}
      <mesh position={[-0.1, -0.06, 0]} material={materials.flesh}>
        <boxGeometry args={[0.02, 0.28, 0.08]} />
      </mesh>

      {/* =====================================================================
          2. CUNG HÀM DƯỚI & RĂNG CỬA DƯỚI (MANDIBLE & LOWER INCISORS)
          ===================================================================== */}
      <group position={[-0.04, -0.08, 0]} ref={lowerJawRef}>
        {/* Xương cung hàm dưới */}
        <mesh position={[0.08, -0.02, 0]} material={materials.palate}>
          <boxGeometry args={[0.12, 0.025, 0.07]} />
        </mesh>

        {/* Răng cửa hàm dưới (Lower Incisors) */}
        <mesh position={[0.13, 0.015, 0]} rotation={[0, 0, -0.1]} material={materials.teeth}>
          <boxGeometry args={[0.011, 0.028, 0.055]} />
        </mesh>

        {/* Môi dưới (Lower Lip) */}
        <mesh position={[0.15, -0.005, 0]} material={materials.flesh}>
          <capsuleGeometry args={[0.017, 0.035, 8, 16]} />
        </mesh>
      </group>

      {/* =====================================================================
          3. CƠ THỂ LƯỠI CƠ SINH HỌC (BIOMECHANICAL TONGUE MESH)
          ===================================================================== */}
      <mesh
        ref={tongueRef}
        position={[0.05, -0.04, 0]}
        material={materials.flesh}
      >
        {/* Dáng lưỡi hình giọt nước uốn cong chuẩn giải phẫu */}
        <sphereGeometry args={[0.055, 32, 24]} />
      </mesh>

      {/* =====================================================================
          4. THANH QUẢN & DÂY THANH (LARYNX & VOCAL FOLDS)
          ===================================================================== */}
      <group position={[-0.07, -0.22, 0]}>
        <mesh material={materials.palate}>
          <cylinderGeometry args={[0.025, 0.022, 0.08, 16]} />
        </mesh>
        {/* Dây thanh (Glottis) - Phát sáng nhẹ báo hiệu âm vô thanh /θ/ (không rung) */}
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.005, 0.018, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* =====================================================================
          5. LUỒNG KHÍ ĐỘNG HỌC MA SÁT (FRICTION AIRFLOW PARTICLE STREAM)
          ===================================================================== */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.006}
          color={isXRayMode ? "#38bdf8" : "#67e8f9"}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* =====================================================================
          6. ĐIỂM TIẾP XÚC CẤU ÂM NỔI BẬT (HIGHLIGHTED ARTICULATION CONTACT)
          ===================================================================== */}
      {/* Vòng hào quang đánh dấu kẽ răng cho âm /θ/ */}
      <mesh position={[0.105, 0.015, 0]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial
          color="#10b981"
          wireframe
          transparent
          opacity={activeFocusArticulator === "tongue_tip" ? 0.9 : 0.3}
        />
      </mesh>

      {/* =====================================================================
          7. CÁC GHIM CHỈ DẪN GIẢI PHẪU HỌC THUẬT (ACADEMIC ANATOMICAL PINS)
          ===================================================================== */}
      {showAnatomicalLabels && (
        <>
          {/* Ghim 1: Răng cửa trên */}
          <Html position={[0.11, 0.065, 0]} center distanceFactor={1.2}>
            <div className="pointer-events-none select-none rounded-md bg-canvas/90 px-2 py-0.5 text-[10px] font-semibold text-sky-400 shadow-md backdrop-blur-md border border-sky-500/30">
              Răng cửa trên (Upper Incisors)
            </div>
          </Html>

          {/* Ghim 2: Đầu lưỡi đặt giữa 2 răng - Trọng tâm âm /θ/ */}
          <Html position={[0.13, -0.015, 0]} center distanceFactor={1.1}>
            <div className="pointer-events-none select-none flex items-center gap-1 rounded-md bg-emerald-950/90 px-2.5 py-1 text-[11px] font-bold text-emerald-400 shadow-lg backdrop-blur-md border border-emerald-500/50 animate-pulse">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Đầu lưỡi kẹp giữa 2 răng (/θ/)
            </div>
          </Html>

          {/* Ghim 3: Ngạc mềm & Lưỡi gà */}
          <Html position={[-0.08, 0.085, 0]} center distanceFactor={1.3}>
            <div className="pointer-events-none select-none rounded-md bg-canvas/80 px-2 py-0.5 text-[10px] text-ink-muted backdrop-blur-md border border-border-subtle">
              Ngạc mềm (Velum)
            </div>
          </Html>

          {/* Ghim 4: Luồng khí ma sát */}
          <Html position={[0.17, 0.035, 0]} center distanceFactor={1.3}>
            <div className="pointer-events-none select-none rounded-md bg-cyan-950/80 px-2 py-0.5 text-[10px] font-medium text-cyan-300 backdrop-blur-md border border-cyan-500/30">
              Luồng khí ma sát (Fricative Airflow)
            </div>
          </Html>

          {/* Ghim 5: Dây thanh quản */}
          <Html position={[-0.1, -0.24, 0]} center distanceFactor={1.4}>
            <div className="pointer-events-none select-none rounded-md bg-canvas/80 px-2 py-0.5 text-[10px] text-ink-muted backdrop-blur-md border border-border-subtle">
              Dây thanh (Vocal Folds: Không rung)
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

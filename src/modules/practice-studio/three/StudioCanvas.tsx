"use client";

import { AdaptiveDpr, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { StudioStage } from "./StudioStage";
import { OralCavityModel } from "./OralCavityModel";
import { usePracticeStore } from "../stores/usePracticeStore";

const DPR_LOW = 1;
const DPR_HIGH = 2;
const DPR_INITIAL = 1.5;

/**
 * Điều khiển góc quay và tiêu cự Camera tương ứng với các chế độ học thuật:
 * - crossSection: Góc nhìn tối ưu quan sát mặt cắt đứng dọc khoang miệng
 * - profile: Góc nhìn ngang 90 độ
 * - frontal: Góc nhìn trực diện khẩu hình môi - răng
 */
function CameraController() {
  const { camera, invalidate } = useThree();
  const cameraPreset = usePracticeStore((s) => s.cameraPreset);
  const cameraResetNonce = usePracticeStore((s) => s.cameraResetNonce);

  useEffect(() => {
    let targetPos: [number, number, number] = [0.06, -0.01, 0.45];
    let targetLookAt: [number, number, number] = [0.03, -0.04, 0];

    if (cameraPreset === "crossSection") {
      targetPos = [0.06, -0.01, 0.45];
      targetLookAt = [0.03, -0.04, 0];
    } else if (cameraPreset === "profile") {
      targetPos = [0, -0.04, 0.5];
      targetLookAt = [0.02, -0.04, 0];
    } else if (cameraPreset === "frontal") {
      targetPos = [0.46, -0.01, 0];
      targetLookAt = [0.05, -0.01, 0];
    }

    camera.position.set(...targetPos);
    camera.lookAt(new THREE.Vector3(...targetLookAt));
    camera.updateProjectionMatrix();
    invalidate();
  }, [cameraPreset, cameraResetNonce, camera, invalidate]);

  return null;
}

/**
 * Root WebGL canvas của Phòng Luyện Phát Âm 3D.
 * - `frameloop="demand"`: Chỉ render khi có tương tác / invalidation từ Morph Targets để tối ưu 60 FPS & pin.
 * - Chứa mô hình mặt cắt giải phẫu học thuật OralCavityModel.
 */
export function StudioCanvas() {
  const [dpr, setDpr] = useState<number>(DPR_INITIAL);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraResetNonce = usePracticeStore((s) => s.cameraResetNonce);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [cameraResetNonce]);

  return (
    <Canvas
      role="img"
      aria-label="Mô hình 3D mặt cắt đứng dọc khoang miệng — kéo để xoay, cuộn để phóng to"
      className="absolute inset-0"
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [0.06, -0.01, 0.45], fov: 34, near: 0.01, far: 20 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
    >
      <color attach="background" args={["#111625"]} />
      <PerformanceMonitor onIncline={() => setDpr(DPR_HIGH)} onDecline={() => setDpr(DPR_LOW)} />
      <AdaptiveDpr pixelated={false} />

      <CameraController />
      <StudioStage />
      <OralCavityModel />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.18}
        maxDistance={1.2}
        target={[0.03, -0.04, 0]}
      />
    </Canvas>
  );
}

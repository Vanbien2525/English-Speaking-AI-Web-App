"use client";

import { Grid } from "@react-three/drei";

/**
 * Lighting rig + reference floor shared by every Practice Studio scene.
 * No HDR environment maps are fetched (offline-first, zero CDN dependency).
 */
export function StudioStage() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[0.6, 1.2, 0.8]} intensity={1.4} />
      <directionalLight position={[-0.8, 0.4, -0.6]} intensity={0.5} color="#8fb4ff" />
      <Grid
        position={[0, -0.15, 0]}
        args={[2, 2]}
        cellSize={0.05}
        cellThickness={0.6}
        cellColor="#2a3350"
        sectionSize={0.25}
        sectionThickness={1}
        sectionColor="#3d4a73"
        fadeDistance={1.6}
        fadeStrength={1.5}
        infiniteGrid
      />
    </>
  );
}

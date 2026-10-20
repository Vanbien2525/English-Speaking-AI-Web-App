import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // three.js ships modern ESM; transpiling keeps tree-shaking consistent across drei/fiber.
  transpilePackages: ["three"],
  async headers() {
    return [
      {
        // Compressed 3D assets & Draco decoder are content-addressed by deploy; cache aggressively.
        source: "/:dir(models|draco)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

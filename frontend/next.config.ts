import type { NextConfig } from "next";

const isCapacitorBuild = Boolean(process.env.CAPACITOR_BUILD);

const nextConfig: NextConfig = {
  ...(isCapacitorBuild ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

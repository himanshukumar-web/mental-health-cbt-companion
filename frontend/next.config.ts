import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "date-fns",
      "react-hot-toast",
      "@supabase/supabase-js",
      "zustand",
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  reactStrictMode: true,
};

export default nextConfig;


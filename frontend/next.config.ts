import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "export" }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Optimize for Docker builds
    optimizePackageImports: ['lucide-react', '@tanstack/react-query']
  }
};

export default nextConfig;

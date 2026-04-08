import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  allowedDevOrigins: [
    "*.orchids.cloud",
    "*.daytona.works",
    "*.proxy.daytona.works",
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.orchids.cloud",
        "*.daytona.works",
        "*.proxy.daytona.works",
      ],
    },
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

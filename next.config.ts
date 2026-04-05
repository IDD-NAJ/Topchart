import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

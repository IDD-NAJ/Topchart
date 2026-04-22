import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /Invalid source map/,
        /sourceMapURL could not be parsed/,
      ];
    }
    return config;
  },
  turbopack: {},
  allowedDevOrigins: [
    "*.orchids.cloud",
    "*.daytona.works",
    "*.proxy.daytona.works",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.orchids.cloud",
        "*.daytona.works",
        "*.proxy.daytona.works",
        "topchart.gh",
        "www.topchart.gh",
      ],
      bodySizeLimit: "100mb",
    },
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'topchart.gh',
      },
      {
        protocol: 'https',
        hostname: '*.netlify.app',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'pvadeals-mobile-builds.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cibtsrkdatuymjpzcfol.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

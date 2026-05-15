import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
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
    "localhost",
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
        "topchart.store",
        "www.topchart.store",
      ],
      bodySizeLimit: "100mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-select",
      "@radix-ui/react-accordion",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "sonner",
      "date-fns",
      "uuid",
      "@supabase/supabase-js",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'topchart.store',
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
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/icon.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/logo.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/api/service-status",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=120" },
        ],
      },
      {
        source: "/api/content/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

export default nextConfig;

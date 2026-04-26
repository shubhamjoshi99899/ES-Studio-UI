import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:9000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: "/page-mappings/:path*",
        destination: `${backendUrl}/page-mappings/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "search.pstatic.net",
        port: "",
        pathname: "/common/**",
      },
      {
        protocol: "https",
        hostname: "ldb-phinf.pstatic.net",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination:
          "https://coffee-map-1ab36.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

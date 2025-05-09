// @ts-nocheck
import withPWA from "next-pwa";
import { env } from "./src/env.mjs";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Enable output standalone for Docker deployments
  output: "standalone",

  // Configure image domains
  images: {
    domains: ["images.unsplash.com", "placehold.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },

  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Ignore type and lint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configure headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Configure experimental features
  experimental: {
    // External packages that should be bundled
    serverExternalPackages: ["mongoose"],
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(config);

export default withPWAConfig;

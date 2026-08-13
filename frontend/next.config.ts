import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN devices to access the dev server without being blocked
  allowedDevOrigins: ["192.168.30.155"],

  // Redirect legacy /challenge/:id route to canonical /challenges/:id
  // Handled here instead of a server component redirect() to avoid
  // the performance.measure negative-timestamp bug (Next.js 15+).
  async redirects() {
    return [
      {
        source: "/challenge/:challengeId",
        destination: "/challenges/:challengeId",
        permanent: true,
      },
    ]
  },

  experimental: {
    serverActions: {
      // Allow Server Actions to be invoked from the LAN IP
      allowedOrigins: ["192.168.30.155:3000"],
    },
  },
};

export default nextConfig;

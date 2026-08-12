import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN devices to access the dev server without being blocked
  allowedDevOrigins: ["192.168.30.155"],

  experimental: {
    serverActions: {
      // Allow Server Actions to be invoked from the LAN IP
      allowedOrigins: ["192.168.30.155:3000"],
    },
  },
};

export default nextConfig;

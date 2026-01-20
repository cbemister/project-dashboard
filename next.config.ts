import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Electron production builds
  // This creates a minimal Node.js server that can run independently
  output: "standalone",
};

export default nextConfig;

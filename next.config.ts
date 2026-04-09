import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @arcium-hq/client uses Node.js 'fs' — only runs in API routes (server-side)
  // This prevents build errors when Next.js tries to bundle it for the client
  serverExternalPackages: ["@arcium-hq/client"],
};

export default nextConfig;

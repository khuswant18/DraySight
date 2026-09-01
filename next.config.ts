import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@solarisdk/browser",
    "patchright-core",
    "better-sqlite3",
  ],
};

export default nextConfig;

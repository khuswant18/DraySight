import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@solarisdk/browser",
    "patchright-core",
  ],
};

export default nextConfig;

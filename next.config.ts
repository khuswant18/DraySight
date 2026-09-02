import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@solarisdk/browser", "patchright-core"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/patchright-core/**/*"],
  },
};

export default nextConfig;

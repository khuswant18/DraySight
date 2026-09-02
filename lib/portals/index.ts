import type { TerminalPortalAdapter } from "./types";
import { DemoTerminalAdapter } from "./demo-terminal";
import { LBCTAdapter } from "./lbct";

export function getPortalAdapter(overrideMode?: string): TerminalPortalAdapter {
  const mode = overrideMode ?? process.env.PORTAL_MODE ?? "demo";
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  if (!baseUrl) {
    baseUrl = "http://localhost:3000";
  }

  switch (mode) {
    case "demo":
      return new DemoTerminalAdapter(baseUrl);
    case "lbct":
      return new LBCTAdapter();
    default:
      throw new Error(
        `Unknown PORTAL_MODE: ${mode}. Supported: demo, lbct`
      );
  }
}

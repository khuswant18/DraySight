import type { TerminalPortalAdapter } from "./types";
import { DemoTerminalAdapter } from "./demo-terminal";
import { LBCTAdapter } from "./lbct";

export function getPortalAdapter(): TerminalPortalAdapter {
  const mode = process.env.PORTAL_MODE ?? "demo";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

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

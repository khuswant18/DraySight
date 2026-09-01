import { NextResponse } from "next/server";
import { getPortalAdapter } from "@/lib/portals";

export async function GET() {
  const portalMode = process.env.PORTAL_MODE ?? "demo";
  const adapter = getPortalAdapter();

  return NextResponse.json({
    portalMode,
    portalName: adapter.portalName,
    portalBaseUrl: adapter.baseUrl,
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || "3", 10),
  });
}

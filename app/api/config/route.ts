import { NextResponse } from "next/server";
import { getPortalAdapter } from "@/lib/portals";

export const dynamic = "force-dynamic";

export async function GET() {
  const portalMode = process.env.PORTAL_MODE ?? "demo";
  const adapter = getPortalAdapter();
  const hasApiKey = Boolean(process.env.SOLARI_API_KEY);

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  if (!baseUrl) {
    baseUrl = "http://localhost:3000";
  }

  return NextResponse.json({
    portalMode,
    portalName: adapter.portalName,
    portalBaseUrl: adapter.baseUrl,
    baseUrl,
    hasApiKey,
    isLocalhost: baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || "3", 10),
  });
}

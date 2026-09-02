import { NextRequest, NextResponse } from "next/server";
import { parseContainerInput, validateContainers } from "@/lib/validation/containers";
import { createTrackingRun } from "@/lib/runner/track-runner";
import { getRun } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SOLARI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "SOLARI_API_KEY is missing. Please add SOLARI_API_KEY in your Vercel Project Settings (Environment Variables).",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let containerList: string[] = [];

    if (Array.isArray(body.containers)) {
      containerList = body.containers.map((c: any) => String(c).trim().toUpperCase());
    } else if (typeof body.containers === "string") {
      containerList = parseContainerInput(body.containers);
    } else if (typeof body.input === "string") {
      containerList = parseContainerInput(body.input);
    }

    if (containerList.length === 0) {
      return NextResponse.json(
        { error: "No container numbers provided." },
        { status: 400 }
      );
    }

    const { valid, invalid, duplicatesRemoved } = validateContainers(containerList);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: "All provided container numbers were invalid format.",
          invalid,
        },
        { status: 400 }
      );
    }

    const portalMode = body.portalMode || process.env.PORTAL_MODE || "demo";

    if (portalMode === "demo") {
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      } else if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
      if (!baseUrl) {
        baseUrl = "http://localhost:3000";
      }

      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        return NextResponse.json(
          {
            error:
              "Solari browsers execute on cloud microVMs and cannot connect directly to 'localhost'. To test with PacificPort Demo Terminal locally, expose port 3000 via a tunnel (e.g., `npx cloudflared tunnel --url http://localhost:3000` and update NEXT_PUBLIC_BASE_URL in .env.local), or switch Target Terminal to 'LBCT (Real Terminal)' to run without any tunnel.",
          },
          { status: 400 }
        );
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const pingRes = await fetch(`${baseUrl}/demo-terminal/login`, {
          method: "HEAD",
          signal: controller.signal,
        }).catch(() => null);
        clearTimeout(timeout);

        if (!pingRes || (!pingRes.ok && pingRes.status >= 500)) {
          return NextResponse.json(
            {
              error: `The configured demo terminal URL (${baseUrl}) is unreachable or the tunnel is inactive. Please restart your tunnel (e.g., \`npx cloudflared tunnel --url http://localhost:3000\`), or switch Target Terminal to 'LBCT (Real Terminal)'.`,
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            error: `Could not connect to demo terminal tunnel at ${baseUrl}. Please check your tunnel or switch Target Terminal to 'LBCT (Real Terminal)'.`,
          },
          { status: 400 }
        );
      }
    }

    const maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || "3", 10);
    const { runId, initialRun, executeBatch } = await createTrackingRun({
      containers: valid,
      maxConcurrency,
      portalMode,
    });

    // Execute the Solari cloud browser fleet
    await executeBatch();

    const finalRun = getRun(runId) || initialRun;

    return NextResponse.json({
      runId,
      run: finalRun,
      status: finalRun.status,
      portal: finalRun.portal,
      totalContainers: valid.length,
      completedCount: finalRun.completedCount,
      failedCount: finalRun.failedCount,
      results: finalRun.results,
      validContainers: valid,
      invalidContainers: invalid,
      duplicatesRemoved,
    });
  } catch (error: any) {
    console.error("[API /api/track] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

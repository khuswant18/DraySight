import { NextRequest, NextResponse } from "next/server";
import { parseContainerInput, validateContainers } from "@/lib/validation/containers";
import { startTrackingRun } from "@/lib/runner/track-runner";

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

    const maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || "3", 10);
    const { runId, initialRun } = await startTrackingRun({
      containers: valid,
      maxConcurrency,
    });

    return NextResponse.json({
      runId,
      status: initialRun.status,
      portal: initialRun.portal,
      totalContainers: valid.length,
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

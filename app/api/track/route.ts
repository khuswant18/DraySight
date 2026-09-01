import { NextRequest, NextResponse } from "next/server";
import { parseContainerInput, validateContainers } from "@/lib/validation/containers";
import { startTrackingRun } from "@/lib/runner/track-runner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const { initialRun } = await startTrackingRun({ containers: valid });

    return NextResponse.json({
      runId: initialRun.id,
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

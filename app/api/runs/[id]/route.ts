import { NextRequest, NextResponse } from "next/server";
import { getRun } from "@/lib/db";
import { getActiveSessionsForRun } from "@/lib/runner/track-runner";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = getRun(id);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const activeSessions = getActiveSessionsForRun(id);

  return NextResponse.json({
    ...run,
    activeSessions,
  });
}

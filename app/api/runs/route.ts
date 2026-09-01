import { NextResponse } from "next/server";
import { listRecentRuns } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = listRecentRuns(15);
  return NextResponse.json({ runs });
}

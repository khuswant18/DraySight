import { NextResponse } from "next/server";
import { listRecentRuns } from "@/lib/db";

export async function GET() {
  const runs = listRecentRuns(15);
  return NextResponse.json({ runs });
}

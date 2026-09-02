import { NextRequest, NextResponse } from "next/server";
import { getSolariClient } from "@/lib/solari/client";
import zlib from "zlib";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const wantEvents = searchParams.get("format") === "events";

  try {
    const solari = await getSolariClient();

    // Extract UUID if composite session ID format
    const uuidMatch = sessionId.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    const candidateIds = [sessionId];
    if (uuidMatch && uuidMatch[0] !== sessionId) {
      candidateIds.push(uuidMatch[0]);
    }

    let replay: any = null;

    for (const id of candidateIds) {
      try {
        replay = await solari.sessions.getReplayUrl(id);
        if (replay?.url) break;
      } catch (err) {}
    }

    if (!replay?.url) {
      return NextResponse.json({
        hasReplay: false,
        sessionId,
        message:
          "Solari cloud session verified. Screencast stream not stored for this session tier.",
      });
    }

    if (!wantEvents) {
      return NextResponse.json({
        hasReplay: true,
        url: replay.url,
        expiresInSeconds: replay.expiresInSeconds,
        sessionId,
      });
    }

    const s3Res = await fetch(replay.url);
    if (!s3Res.ok) {
      return NextResponse.json({
        hasReplay: false,
        sessionId,
        message: "Failed to download recording from S3 storage.",
      });
    }

    const arrayBuffer = await s3Res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
      text = zlib.gunzipSync(buffer).toString("utf-8");
    } else {
      text = buffer.toString("utf-8");
    }

    const rawEvents = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Skip leading about:blank initialization events
    let firstActiveIndex = 0;
    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      if (ev.type === 4 && ev.data?.href && ev.data.href !== "about:blank") {
        firstActiveIndex = Math.max(0, i - 1);
        break;
      }
    }

    const events = rawEvents.slice(firstActiveIndex);

    if (events.length > 0 && firstActiveIndex > 0) {
      const offset = events[0].timestamp - (rawEvents[0]?.timestamp || 0);
      events.forEach((ev) => {
        ev.timestamp = Math.max(0, ev.timestamp - offset);
      });
    }

    return NextResponse.json({
      hasReplay: true,
      url: replay.url,
      sessionId,
      events: events.length > 0 ? events : rawEvents,
      totalEvents: (events.length > 0 ? events : rawEvents).length,
    });
  } catch (error: any) {
    console.error(`[API /api/replays/${sessionId}] Error:`, error);
    return NextResponse.json({
      hasReplay: false,
      sessionId,
      message: error?.message || "Session telemetry verified.",
    });
  }
}

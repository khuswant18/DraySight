import { NextRequest, NextResponse } from "next/server";
import { getSolariClient } from "@/lib/solari/client";

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

    // Retry loop to handle Solari S3 upload latency right after session closure
    let replay: any = null;
    let lastErr: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        replay = await solari.sessions.getReplayUrl(sessionId);
        if (replay?.url) break;
      } catch (err: any) {
        lastErr = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    if (!replay?.url) {
      throw lastErr || new Error("Replay URL not available yet");
    }

    if (!wantEvents) {
      return NextResponse.json({
        url: replay.url,
        expiresInSeconds: replay.expiresInSeconds,
        sessionId,
      });
    }

    const s3Res = await fetch(replay.url);
    if (!s3Res.ok) {
      throw new Error(`Failed to fetch replay recording: ${s3Res.statusText}`);
    }

    const text = await s3Res.text();
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
      url: replay.url,
      sessionId,
      events: events.length > 0 ? events : rawEvents,
      totalEvents: (events.length > 0 ? events : rawEvents).length,
    });
  } catch (error: any) {
    console.error(`[API /api/replays/${sessionId}] Error:`, error);
    return NextResponse.json(
      {
        error:
          error?.status === 404
            ? "Replay recording is still being processed by Solari S3. Please retry in a few seconds."
            : error?.message || "Failed to retrieve session replay",
      },
      { status: error?.status || 500 }
    );
  }
}

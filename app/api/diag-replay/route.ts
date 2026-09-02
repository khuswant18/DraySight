import { NextResponse } from "next/server";
import { getSolariClient } from "@/lib/solari/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[diag] ${msg}`);
    logs.push(`${new Date().toISOString()} ${msg}`);
  };

  try {
    log("1. Getting Solari client...");
    const solari = await getSolariClient();

    log("2. Launching browser with recording: true...");
    const browser = await solari.launch({
      recording: true,
      retries: 1,
      probeTimeoutMs: 10000,
    });
    const sessionId = browser.id;
    log(`3. Session ID: ${sessionId}`);

    const page = await browser.newPage();
    log("4. Navigating to example.com...");
    await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
    log(`5. Page title: ${await page.title()}`);
    await page.waitForTimeout(2000);

    log("6. Closing browser (BrowserSession.close)...");
    const closeStart = Date.now();
    try {
      await browser.close();
      log(`7. browser.close() succeeded in ${Date.now() - closeStart}ms`);
    } catch (closeErr: any) {
      log(`7. browser.close() FAILED in ${Date.now() - closeStart}ms: ${closeErr.message}`);
    }

    log("8. Polling for replay URL (up to 30s)...");
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const replay = await solari.sessions.getReplayUrl(sessionId);
        log(`9. ✅ Got replay URL on attempt ${i + 1}!`);
        log(`   URL: ${replay.url.substring(0, 100)}...`);

        const res = await fetch(replay.url);
        const ab = await res.arrayBuffer();
        log(`10. Downloaded ${ab.byteLength} bytes`);

        return NextResponse.json({
          success: true,
          sessionId,
          replayAvailable: true,
          replayBytes: ab.byteLength,
          logs,
        });
      } catch (err: any) {
        log(`   Attempt ${i + 1}/10: ${err.status || "?"} ${err.message?.substring(0, 80)}`);
      }
    }

    log("❌ Replay never became available after 30s");
    return NextResponse.json({
      success: false,
      sessionId,
      replayAvailable: false,
      logs,
    });
  } catch (error: any) {
    log(`FATAL: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message, logs });
  }
}

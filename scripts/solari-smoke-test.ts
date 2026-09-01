import { Solari } from "@solarisdk/browser";
import { DemoTerminalAdapter } from "../lib/portals/demo-terminal.js";
import { normalizeResult } from "../lib/extraction/normalize.js";

async function main() {
  const apiKey = process.env.SOLARI_API_KEY;
  if (!apiKey) {
    console.error("❌ SOLARI_API_KEY is not set");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("❌ NEXT_PUBLIC_BASE_URL is not set");
    process.exit(1);
  }

  const containerNumber = process.argv[2] ?? "DRAY1000001";

  console.log("═══════════════════════════════════════════════════");
  console.log("  DraySight — Solari Smoke Test");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Container:  ${containerNumber}`);
  console.log(`  Portal:     ${baseUrl}/demo-terminal`);
  console.log("═══════════════════════════════════════════════════\n");

  const solari = new Solari({ apiKey });
  const adapter = new DemoTerminalAdapter(baseUrl);

  try {
    console.log("🚀 Launching Solari cloud browser (recording enabled)...");
    const startTime = Date.now();
    const browser = await solari.launch({ recording: true });
    console.log(`   Session ID: ${browser.id}`);
    console.log(`   Launched in ${Date.now() - startTime}ms\n`);

    try {
      const page = await browser.newPage();

      console.log("🔐 Logging in to demo terminal...");
      await adapter.login(page);
      console.log("   ✅ Login successful\n");

      console.log(`🔍 Searching for container ${containerNumber}...`);
      const rawResult = await adapter.searchContainer(page, containerNumber);
      console.log("   Raw result:");
      console.log(`     Status: ${rawResult.rawStatusText}`);
      console.log(`     LFD:    ${rawResult.rawLastFreeDay ?? "N/A"}`);
      console.log("");

      console.log("📊 Normalizing result...");
      const result = normalizeResult(rawResult, adapter.portalName, browser.id);
      console.log("   Normalized result:");
      console.log(`     Container:  ${result.containerNumber}`);
      console.log(`     Status:     ${result.status}`);
      console.log(`     LFD:        ${result.lastFreeDay ?? "N/A"}`);
      console.log(`     Urgency:    ${result.urgency}`);
      console.log(`     Days left:  ${result.daysUntilLastFreeDay ?? "N/A"}`);
      console.log(`     Confidence: ${result.confidence}`);
      console.log(`     Evidence:   ${JSON.stringify(result.rawEvidence)}`);
      console.log("");

      console.log("📹 Checking for session replay...");
      const sessionId = browser.id;

      console.log("🔒 Closing browser session...");
      await browser.close();

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const replay = await solari.sessions.getReplayUrl(sessionId);
          console.log(`   ✅ Replay URL: ${replay.url}`);
          console.log(`   Expires in: ${replay.expiresInSeconds}s`);
          break;
        } catch {
          console.log(`   Attempt ${i + 1}: replay not ready yet...`);
        }
      }

      const totalMs = Date.now() - startTime;
      console.log("\n═══════════════════════════════════════════════════");
      console.log("  ✅ SMOKE TEST PASSED");
      console.log(`  Total duration: ${totalMs}ms`);
      console.log("═══════════════════════════════════════════════════");
      console.log("\nFull result JSON:");
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      try {
        await browser.close();
      } catch {}
      throw error;
    }
  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILED");
    console.error(error);
    process.exit(1);
  } finally {
    await solari.close();
  }
}

main();

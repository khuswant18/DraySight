import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Solari } from "@solarisdk/browser";
import type { Page } from "patchright-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, "..", ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx);
    const value = trimmed.substring(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // Rely on process.env
}

const LBCT_CARGO_SEARCH_URL = "https://portal.lbct.com/CargoSearch";
const DEFAULT_TEST_CONTAINER = "MSCU1234567";

interface DiagnosticSummary {
  url: string;
  title: string;
  visibleIndicators: string[];
  inputs: { tag: string; id?: string; name?: string; type?: string; placeholder?: string }[];
  buttons: { tag: string; text: string; id?: string; type?: string }[];
  links: string[];
  bodyTextSnippet: string;
}

async function inspectPage(page: Page): Promise<DiagnosticSummary> {
  const url = page.url();
  const title = await page.title();

  const result = await page.evaluate(() => {
    const body = document.body;
    const bodyText = (body?.innerText ?? "").substring(0, 2000);

    const inputs = Array.from(document.querySelectorAll("input, textarea")).map((el) => ({
      tag: el.tagName.toLowerCase(),
      id: (el as HTMLInputElement).id || undefined,
      name: (el as HTMLInputElement).name || undefined,
      type: (el as HTMLInputElement).type || undefined,
      placeholder: (el as HTMLInputElement).placeholder || undefined,
    }));

    const buttonEls = Array.from(document.querySelectorAll("button, input[type=button], input[type=submit], a.k-button, [role=button]"));
    const buttons = buttonEls.map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el as HTMLElement).innerText?.trim().substring(0, 100) || "",
      id: (el as HTMLElement).id || undefined,
      type: (el as HTMLInputElement).type || undefined,
    }));

    const linkEls = Array.from(document.querySelectorAll("a")).slice(0, 20);
    const links = linkEls.map((a) => a.innerText?.trim()).filter(Boolean);

    const indicators: string[] = [];
    const lowerText = bodyText.toLowerCase();
    for (const term of [
      "cargo search", "container", "search", "login", "register",
      "not available", "unavailable", "access denied", "blocked",
      "captcha", "please verify", "security", "error",
      "operational information", "trucker portal", "booking",
    ]) {
      if (lowerText.includes(term)) indicators.push(term);
    }

    return {
      bodyText: bodyText.substring(0, 800),
      inputs,
      buttons,
      links,
      indicators,
    };
  });

  return {
    url,
    title,
    visibleIndicators: result.indicators,
    inputs: result.inputs,
    buttons: result.buttons,
    links: result.links,
    bodyTextSnippet: result.bodyText,
  };
}

type PageState = "RENDERED" | "PARTIALLY_RENDERED" | "BLOCKED" | "UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";

function classifyPageState(diag: DiagnosticSummary): PageState {
  const lower = diag.bodyTextSnippet.toLowerCase();

  if (lower.includes("access denied") || lower.includes("blocked") || lower.includes("captcha") || lower.includes("please verify")) {
    return "BLOCKED";
  }

  if (lower.includes("not currently available") || lower.includes("service unavailable") || lower.includes("maintenance")) {
    return "UNAVAILABLE";
  }

  const hasSearchIndicator = diag.visibleIndicators.includes("cargo search") || diag.visibleIndicators.includes("container");
  const hasInputs = diag.inputs.length > 0;

  if (hasSearchIndicator && hasInputs) {
    return "RENDERED";
  }

  if (hasSearchIndicator) {
    return "PARTIALLY_RENDERED";
  }

  return "UNKNOWN";
}

type SearchResult = "FOUND" | "NOT_FOUND" | "SERVICE_UNAVAILABLE" | "BLOCKED" | "ERROR" | "UNKNOWN";

interface SearchOutcome {
  result: SearchResult;
  extractedStatus?: string;
  extractedAvailability?: string;
  extractedHolds?: string;
  extractedLFD?: string;
  extractedDemurrage?: string;
  evidence: string;
}

async function main() {
  const apiKey = process.env.SOLARI_API_KEY;
  if (!apiKey) {
    console.error("❌ SOLARI_API_KEY is not set");
    process.exit(1);
  }

  const containerNumber = process.argv[2] ?? DEFAULT_TEST_CONTAINER;

  console.log("══════════════════════════════════════════════════════════");
  console.log("  DraySight — LBCT Solari Verification");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Portal:     ${LBCT_CARGO_SEARCH_URL}`);
  console.log(`  Container:  ${containerNumber}`);
  console.log("══════════════════════════════════════════════════════════\n");

  const solari = new Solari({ apiKey });
  const startTime = Date.now();

  let sessionId = "";
  let pageState: PageState = "UNKNOWN";
  let searchInputFound = false;
  let searchActionFound = false;
  let searchOutcome: SearchOutcome = { result: "UNKNOWN", evidence: "" };
  let replayUrl = "";
  let verdict: "PASS" | "PARTIAL" | "FAIL" = "FAIL";

  try {
    console.log("🚀 Step 1: Launching Solari cloud browser...");
    const browser = await solari.launch({
      recording: true,
      retries: 2,
      probeTimeoutMs: 10000,
    });
    sessionId = browser.id;
    console.log(`   ✅ Session ID: ${sessionId}`);
    console.log(`   Launched in ${Date.now() - startTime}ms\n`);

    try {
      const page = await browser.newPage();

      console.log("🌐 Step 2: Navigating to LBCT Cargo Search...");
      const navStart = Date.now();
      try {
        await page.goto(LBCT_CARGO_SEARCH_URL, {
          waitUntil: "networkidle",
          timeout: 45000,
        });
        console.log(`   Loaded in ${Date.now() - navStart}ms`);
      } catch {
        await page.goto(LBCT_CARGO_SEARCH_URL, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        console.log(`   Loaded (domcontentloaded) in ${Date.now() - navStart}ms`);
      }

      console.log("   Waiting 5s for UI initialization...");
      await page.waitForTimeout(5000);

      console.log("\n🔍 Step 3: Inspecting rendered page...");
      const diag = await inspectPage(page);
      pageState = classifyPageState(diag);
      console.log(`\n📋 Step 4: Page state: ${pageState}\n`);

      if (pageState !== "BLOCKED" && pageState !== "TIMEOUT") {
        const searchStrategies = [
          "textarea",
          "input[name*='container' i]",
          "input[placeholder*='container' i]",
          "input[id*='container' i]",
          "input[id*='search' i]",
          "input[type='text']",
        ];

        let searchSelector: string | null = null;
        for (const sel of searchStrategies) {
          const count = await page.locator(sel).count();
          if (count > 0) {
            const isVisible = await page.locator(sel).first().isVisible().catch(() => false);
            if (isVisible) {
              searchSelector = sel;
              searchInputFound = true;
              break;
            }
          }
        }

        const actionStrategies = [
          "button:has-text('Search')",
          "input[type='submit']",
          "button[type='submit']",
          "a:has-text('Search')",
          "#btnSearch",
          ".k-button:has-text('Search')",
        ];

        let actionSelector: string | null = null;
        for (const sel of actionStrategies) {
          try {
            const count = await page.locator(sel).count();
            if (count > 0) {
              const isVisible = await page.locator(sel).first().isVisible().catch(() => false);
              if (isVisible) {
                actionSelector = sel;
                searchActionFound = true;
                break;
              }
            }
          } catch {}
        }

        if (searchInputFound && searchSelector) {
          console.log(`\n🚀 Submitting search for ${containerNumber}...`);
          const inputEl = page.locator(searchSelector).first();
          await inputEl.click();
          await inputEl.pressSequentially(containerNumber, { delay: 60 });

          if (searchActionFound && actionSelector) {
            await page.locator(actionSelector).first().click();
          } else {
            await inputEl.press("Enter");
          }

          await page.waitForTimeout(4000);

          const postSearchDiag = await inspectPage(page);
          const resultText = postSearchDiag.bodyTextSnippet.toLowerCase();
          const evidence = postSearchDiag.bodyTextSnippet.substring(0, 800);

          if (resultText.includes("not found") || resultText.includes("no record") || resultText.includes("no results")) {
            searchOutcome = { result: "NOT_FOUND", evidence };
          } else if (resultText.includes("not currently available") || resultText.includes("service unavailable")) {
            searchOutcome = { result: "SERVICE_UNAVAILABLE", evidence };
          } else if (resultText.includes("available") || resultText.includes("status") || resultText.includes("hold")) {
            searchOutcome = { result: "FOUND", evidence };
          } else {
            searchOutcome = { result: "UNKNOWN", evidence };
          }
        }
      }

      console.log("\n🔒 Closing browser session...");
      await browser.close();

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const replay = await solari.sessions.getReplayUrl(sessionId);
          replayUrl = replay.url;
          break;
        } catch {}
      }
    } catch (error) {
      try { await browser.close(); } catch {}
      throw error;
    }

    if (pageState === "RENDERED" && searchInputFound &&
        (searchOutcome.result === "FOUND" || searchOutcome.result === "NOT_FOUND")) {
      verdict = "PASS";
    } else if (pageState === "RENDERED" || pageState === "PARTIALLY_RENDERED") {
      verdict = "PARTIAL";
    } else {
      verdict = "FAIL";
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error}`);
    searchOutcome = { result: "ERROR", evidence: String(error) };
    verdict = "FAIL";
  } finally {
    await solari.close();
  }

  const totalDuration = Date.now() - startTime;
  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  Result: ${searchOutcome.result} | Verdict: ${verdict} (${totalDuration}ms)`);
  console.log("══════════════════════════════════════════════════════════");

  if (verdict === "FAIL") {
    process.exit(1);
  }
}

main();

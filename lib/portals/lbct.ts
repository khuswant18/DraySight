import type { Page } from "patchright-core";
import type { PortalRawResult } from "../types.js";
import type { TerminalPortalAdapter } from "./types.js";

export class LBCTAdapter implements TerminalPortalAdapter {
  readonly portalName = "LBCT — Long Beach Container Terminal";
  readonly baseUrl = "https://portal.lbct.com";

  async login(page: Page): Promise<void> {
    const cargoSearchUrl = `${this.baseUrl}/CargoSearch`;
    console.log(`[LBCTAdapter] Navigating to Cargo Search: ${cargoSearchUrl}`);

    await page.goto(cargoSearchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Wait for Kendo UI to mount
    console.log("[LBCTAdapter] Waiting for UI initialization...");
    await page.waitForTimeout(5000);

    // Dismiss cookie banner if present
    try {
      const acceptBtn = page.locator("button:has-text('ACCEPT')");
      if ((await acceptBtn.count()) > 0 && (await acceptBtn.first().isVisible())) {
        console.log("[LBCTAdapter] Dismissing cookie banner...");
        await acceptBtn.first().click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Banner not present or already accepted
    }

    console.log("[LBCTAdapter] Waiting for search input...");
    await page.waitForSelector("#cargosearchtextarea3", { timeout: 20000 });
    console.log("[LBCTAdapter] Cargo Search page ready");
  }

  async searchContainer(
    page: Page,
    containerNumber: string
  ): Promise<PortalRawResult> {
    console.log(`[LBCTAdapter] Searching for container: ${containerNumber}`);

    const searchInput = page.locator("#cargosearchtextarea3");
    if ((await searchInput.count()) === 0) {
      throw new Error("Search textarea (#cargosearchtextarea3) not found");
    }

    console.log("[LBCTAdapter] Entering container number...");
    await searchInput.click();
    await searchInput.pressSequentially(containerNumber, { delay: 60 });
    await page.waitForTimeout(300);

    // Trigger input events so Kendo UI enables the submit button
    await page.evaluate((cn: string) => {
      const textarea = (document.getElementById("cargosearchtextarea3") ||
        document.getElementById("sideBarTextarea")) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = cn;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
        textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
      }
      const btn = document.getElementById("searchcargo") as HTMLInputElement | null;
      if (btn && btn.disabled) {
        btn.removeAttribute("disabled");
      }
    }, containerNumber);

    console.log("[LBCTAdapter] Submitting search...");
    try {
      const submitBtn = page.locator("#searchcargo");
      if ((await submitBtn.count()) > 0) {
        await submitBtn.click({ timeout: 5000 });
      } else {
        await searchInput.press("Enter");
      }
    } catch {
      console.log("[LBCTAdapter] Fallback submit...");
      await page.evaluate(() => {
        const btn = (document.getElementById("searchcargo") ||
          document.getElementById("sideBarTextareaSubmitBtn")) as HTMLElement | null;
        if (btn) btn.click();
      });
    }

    console.log("[LBCTAdapter] Waiting for results...");
    await page.waitForTimeout(3000);

    try {
      await page.waitForFunction(
        () => {
          const text = document.body?.innerText ?? "";
          return (
            text.includes("Not Found") ||
            text.includes("Available") ||
            text.includes("Hold") ||
            text.includes("HOLD") ||
            text.includes("Status") ||
            text.includes("Discharged") ||
            text.includes("On Vessel") ||
            text.includes("Error") ||
            text.includes("not currently available")
          );
        },
        { timeout: 12000 }
      );
    } catch {
      console.log("[LBCTAdapter] Result text wait timeout, checking current DOM");
    }

    const extraction = await page.evaluate((cn: string) => {
      const bodyText = document.body?.innerText ?? "";
      const lines = bodyText.split("\n").map((l: string) => l.trim()).filter(Boolean);

      const lowerText = bodyText.toLowerCase();
      const isNotFound =
        lowerText.includes("not found") ||
        lowerText.includes("no record") ||
        lowerText.includes("no data") ||
        lowerText.includes("no results");

      if (isNotFound) {
        return {
          rawStatusText: "Not Found",
          rawLastFreeDay: undefined as string | undefined,
          rawPageText: bodyText.substring(0, 1500),
        };
      }

      let rawStatusText: string | undefined;
      let rawLastFreeDay: string | undefined;
      let holds: string | undefined;

      const containerIdx = lines.findIndex((l: string) =>
        l.toUpperCase().includes(cn.toUpperCase())
      );

      if (containerIdx >= 0) {
        const context = lines.slice(
          Math.max(0, containerIdx - 5),
          Math.min(lines.length, containerIdx + 20)
        );

        for (const line of context) {
          const lower = line.toLowerCase();
          if (
            (lower.includes("available") || lower.includes("released")) &&
            !rawStatusText
          ) {
            rawStatusText = line;
          }
          if (lower.includes("hold") && !holds) {
            holds = line;
          }
          const dateMatch = line.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
          if (dateMatch && !rawLastFreeDay) {
            if (
              lower.includes("last free") ||
              lower.includes("lfd") ||
              lower.includes("free time") ||
              lower.includes("expir")
            ) {
              rawLastFreeDay = dateMatch[0];
            }
          }
        }

        if (!rawStatusText && holds) {
          rawStatusText = holds;
        }

        if (!rawStatusText) {
          rawStatusText = context.join(" | ");
        }
      }

      return {
        rawStatusText,
        rawLastFreeDay,
        rawPageText: bodyText.substring(0, 1500),
      };
    }, containerNumber);

    console.log(
      `[LBCTAdapter] Extracted: status="${extraction.rawStatusText}", LFD="${extraction.rawLastFreeDay ?? "N/A"}"`
    );

    // Brief pause so the session replay captures the result before closing
    await page.waitForTimeout(1500);

    return {
      containerNumber,
      rawStatusText: extraction.rawStatusText,
      rawLastFreeDay: extraction.rawLastFreeDay,
      rawPageText: extraction.rawPageText,
    };
  }
}

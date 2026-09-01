import type { Page } from "patchright-core";
import type { PortalRawResult } from "../types.js";
import type { TerminalPortalAdapter } from "./types.js";

export class DemoTerminalAdapter implements TerminalPortalAdapter {
  readonly portalName = "PacificPort Demo Terminal";
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(page: Page): Promise<void> {
    const loginUrl = `${this.baseUrl}/demo-terminal/login`;
    console.log(`[DemoAdapter] Navigating to login: ${loginUrl}`);
    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("[DemoAdapter] Waiting for page elements to mount...");
    try {
      await page.waitForSelector("#username, #container, input[name='username']", {
        timeout: 30000,
        state: "attached",
      });
    } catch {
      const html = await page.content().catch(() => "");
      throw new Error(
        `Expected login page at ${loginUrl}, but #username or #container selector did not appear. HTML length: ${html.length}`
      );
    }

    if ((await page.locator("#container").count()) > 0) {
      console.log("[DemoAdapter] Already authenticated — Dashboard reached");
      return;
    }

    console.log("[DemoAdapter] Entering dispatcher credentials...");
    const usernameInput = page.locator("#username, input[name='username']").first();
    const passwordInput = page.locator("#password, input[name='password']").first();
    await usernameInput.click();
    await usernameInput.pressSequentially("dispatcher", { delay: 60 });
    await page.waitForTimeout(300);
    await passwordInput.click();
    await passwordInput.pressSequentially("freight2026", { delay: 60 });
    await page.waitForTimeout(400);

    console.log("[DemoAdapter] Submitting login form...");
    const loginBtn = page.locator("#login-button, button[type='submit']");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
      loginBtn.first().click(),
    ]);

    console.log("[DemoAdapter] Waiting for terminal dashboard...");
    await page.waitForSelector("#container, input[name='container']", { timeout: 30000 });
    console.log("[DemoAdapter] ✅ Login verified — Dashboard reached");
  }

  async searchContainer(
    page: Page,
    containerNumber: string
  ): Promise<PortalRawResult> {
    console.log(`[DemoAdapter] Searching for container: ${containerNumber}`);

    const searchInput = page.locator("#container, input[name='container']");
    if ((await searchInput.count()) === 0) {
      const dashboardUrl = `${this.baseUrl}/demo-terminal/dashboard`;
      await page.goto(dashboardUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForSelector("#container, input[name='container']", { timeout: 20000 });
    }

    console.log(`[DemoAdapter] Entering container ${containerNumber} into dashboard...`);
    const input = page.locator("#container, input[name='container']").first();
    await input.click();
    await input.pressSequentially(containerNumber, { delay: 70 });
    await page.waitForTimeout(500);

    console.log("[DemoAdapter] Submitting container search...");
    const searchBtn = page.locator("#search-button, button[type='submit']").first();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {}),
      searchBtn.click(),
    ]);

    console.log("[DemoAdapter] Waiting for search results to render...");
    await page.waitForSelector("#container-result", { timeout: 25000 });

    await page.waitForTimeout(1500);

    const errorBox = page.locator(".error-box#container-result");
    if ((await errorBox.count()) > 0) {
      const errorText = await errorBox.innerText();
      console.log(`[DemoAdapter] Container not found or error: ${containerNumber}`);
      return {
        containerNumber,
        rawStatusText: "No record found",
        rawPageText: errorText,
      };
    }

    const rawStatusText = await this.safeInnerText(page, "#result-status");
    const rawLastFreeDay = await this.safeInnerText(page, "#result-lfd");
    const rawPageText = await page.locator("#container-result").innerText();

    console.log(`[DemoAdapter] Extracted: status="${rawStatusText}", LFD="${rawLastFreeDay}"`);

    return {
      containerNumber,
      rawStatusText,
      rawLastFreeDay: rawLastFreeDay === "N/A" ? undefined : rawLastFreeDay,
      rawPageText,
    };
  }

  private async safeInnerText(
    page: Page,
    selector: string
  ): Promise<string | undefined> {
    const el = page.locator(selector);
    if ((await el.count()) === 0) return undefined;
    const text = await el.innerText();
    return text.trim() || undefined;
  }
}

import type { ContainerResult } from "../types";
import type { TerminalPortalAdapter } from "../portals/types";
import { getSolariClient } from "./client";
import { normalizeResult } from "../extraction/normalize";

export interface AgentCheckOptions {
  containerNumber: string;
  adapter: TerminalPortalAdapter;
  maxRetries?: number;
}

export interface AgentCheckResult {
  result: ContainerResult;
  sessionId?: string;
  durationMs: number;
}

export async function checkContainer(
  options: AgentCheckOptions
): Promise<AgentCheckResult> {
  const { containerNumber, adapter, maxRetries = 2 } = options;
  const solari = await getSolariClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(
        `[Agent] Retry ${attempt}/${maxRetries} for ${containerNumber} after ${backoffMs}ms`
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }

    const startTime = Date.now();
    let sessionId: string | undefined;

    try {
      console.log(
        `[Agent] Launching Solari session for ${containerNumber} (attempt ${attempt + 1})`
      );

      const browser = await solari.launch({
        recording: true,
        retries: 2,
        probeTimeoutMs: 10000,
      });
      sessionId = browser.id;

      try {
        const page = await browser.newPage();

        console.log(`[Agent] Logging in to ${adapter.portalName}...`);
        await adapter.login(page);

        console.log(`[Agent] Searching container ${containerNumber}...`);
        const rawResult = await adapter.searchContainer(page, containerNumber);

        console.log(`[Agent] Normalizing result for ${containerNumber}...`);
        const normalized = normalizeResult(rawResult, adapter.portalName, sessionId);

        const durationMs = Date.now() - startTime;
        console.log(
          `[Agent] ✅ ${containerNumber}: ${normalized.status} (${durationMs}ms)`
        );

        return { result: normalized, sessionId, durationMs };
      } finally {
        await browser.close();
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Agent] ❌ Attempt ${attempt + 1} failed for ${containerNumber}: ${lastError.message}`
      );
    }
  }

  return {
    result: {
      containerNumber,
      status: "ERROR",
      urgency: "UNKNOWN",
      sourcePortal: adapter.portalName,
      checkedAt: new Date().toISOString(),
      confidence: "UNKNOWN",
      error: lastError?.message ?? "Failed to query container after retries",
    },
    durationMs: 0,
  };
}

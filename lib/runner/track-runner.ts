import { v4 as uuidv4 } from "uuid";
import type { TrackingRun, ContainerResult } from "../types";
import { getPortalAdapter } from "../portals";
import { checkContainer } from "../solari/browser-agent";
import {
  createRun,
  saveContainerResult,
  completeRun,
  getRun,
} from "../db";

export interface ActiveSessionInfo {
  sessionId?: string;
  containerNumber: string;
  status: "STARTING" | "LOGGING_IN" | "SEARCHING" | "COMPLETED" | "FAILED";
  startedAt: number;
}

const activeRunSessions = new Map<string, Map<string, ActiveSessionInfo>>();

export function getActiveSessionsForRun(runId: string): ActiveSessionInfo[] {
  const sessionsMap = activeRunSessions.get(runId);
  if (!sessionsMap) return [];
  return Array.from(sessionsMap.values());
}

class Semaphore {
  private tasks: (() => void)[] = [];
  private count: number;

  constructor(max: number) {
    this.count = max;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.tasks.push(resolve);
    });
  }

  release(): void {
    this.count++;
    if (this.tasks.length > 0) {
      this.count--;
      const next = this.tasks.shift();
      if (next) next();
    }
  }
}

export interface StartRunOptions {
  containers: string[];
  maxConcurrency?: number;
}

export async function createTrackingRun(
  options: StartRunOptions
): Promise<{ runId: string; initialRun: TrackingRun; executeBatch: () => Promise<void> }> {
  const { containers, maxConcurrency = 3 } = options;
  const adapter = getPortalAdapter();

  const runId = `run_${Date.now()}_${uuidv4().slice(0, 6)}`;
  createRun(runId, containers, adapter.portalName);

  const sessionMap = new Map<string, ActiveSessionInfo>();
  containers.forEach((cn) => {
    sessionMap.set(cn, {
      containerNumber: cn,
      status: "STARTING",
      startedAt: Date.now(),
    });
  });
  activeRunSessions.set(runId, sessionMap);

  const initialRun = getRun(runId)!;

  const executeBatch = async () => {
    await runBatchAsync(runId, containers, maxConcurrency, adapter);
  };

  return { runId, initialRun, executeBatch };
}

export async function startTrackingRun(
  options: StartRunOptions
): Promise<{ runId: string; initialRun: TrackingRun }> {
  const { runId, initialRun, executeBatch } = await createTrackingRun(options);
  executeBatch().catch((err) => console.error(`[TrackRunner] Batch error for ${runId}:`, err));
  return { runId, initialRun };
}

export async function runBatchAsync(
  runId: string,
  containers: string[],
  concurrency: number,
  adapter: ReturnType<typeof getPortalAdapter>
): Promise<void> {
  const semaphore = new Semaphore(concurrency);
  const sessionMap = activeRunSessions.get(runId);

  const tasks = containers.map(async (containerNumber) => {
    await semaphore.acquire();

    if (sessionMap) {
      const info = sessionMap.get(containerNumber);
      if (info) info.status = "SEARCHING";
    }

    try {
      console.log(`[TrackRunner] Running ${containerNumber} on run ${runId}`);
      const checkRes = await checkContainer({
        containerNumber,
        adapter,
        maxRetries: 2,
      });

      if (sessionMap) {
        const info = sessionMap.get(containerNumber);
        if (info) {
          info.sessionId = checkRes.sessionId;
          info.status = checkRes.result.status === "ERROR" ? "FAILED" : "COMPLETED";
        }
      }

      saveContainerResult(runId, checkRes.result);
    } catch (err: any) {
      console.error(`[TrackRunner] Unhandled error for ${containerNumber}:`, err);

      if (sessionMap) {
        const info = sessionMap.get(containerNumber);
        if (info) info.status = "FAILED";
      }

      const fallbackResult: ContainerResult = {
        containerNumber,
        status: "ERROR",
        urgency: "UNKNOWN",
        sourcePortal: adapter.portalName,
        checkedAt: new Date().toISOString(),
        confidence: "UNKNOWN",
        error: err.message || "Unhandled worker failure",
      };
      saveContainerResult(runId, fallbackResult);
    } finally {
      semaphore.release();
    }
  });

  try {
    await Promise.allSettled(tasks);
    completeRun(runId);
    console.log(`[TrackRunner] Run ${runId} finished successfully`);
  } catch (err) {
    console.error(`[TrackRunner] Run ${runId} completion error:`, err);
    completeRun(runId);
  } finally {
    setTimeout(() => {
      activeRunSessions.delete(runId);
    }, 60000);
  }
}

import path from "path";
import fs from "fs";
import type { TrackingRun, ContainerResult, RunStatus } from "../types";

// In-memory cache for ultra-fast access
const memoryStore = new Map<string, TrackingRun>();

function getStoragePath(): string {
  const dir = process.env.VERCEL ? "/tmp" : process.cwd();
  return path.resolve(dir, ".draysight-store.json");
}

function loadFromDisk(): void {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, "utf-8");
      const list = JSON.parse(data) as TrackingRun[];
      if (Array.isArray(list)) {
        list.forEach((run) => {
          if (run && run.id) {
            memoryStore.set(run.id, run);
          }
        });
      }
    }
  } catch (err) {
    // Non-fatal if disk store cannot be read
  }
}

function saveToDisk(): void {
  try {
    const file = getStoragePath();
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(file, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal in read-only / restricted environments
  }
}

// Initial load
loadFromDisk();

export function createRun(id: string, containers: string[], portal: string): TrackingRun {
  const startedAt = new Date().toISOString();
  const run: TrackingRun = {
    id,
    portal,
    status: "RUNNING",
    totalContainers: containers.length,
    completedCount: 0,
    failedCount: 0,
    containers,
    results: [],
    startedAt,
  };

  memoryStore.set(id, run);
  saveToDisk();
  return run;
}

export function saveContainerResult(runId: string, result: ContainerResult): void {
  let run = memoryStore.get(runId);
  if (!run) {
    loadFromDisk();
    run = memoryStore.get(runId);
  }

  if (run) {
    // Check if result already exists for container and update or append
    const existingIdx = run.results.findIndex(
      (r) => r.containerNumber === result.containerNumber
    );

    if (existingIdx >= 0) {
      run.results[existingIdx] = result;
    } else {
      run.results.push(result);
      run.completedCount++;
      if (result.status === "ERROR") {
        run.failedCount++;
      }
    }

    // Sort results by urgency priority: CRITICAL (1) -> URGENT (2) -> NORMAL (3) -> others (4)
    run.results.sort((a, b) => {
      const getPriority = (urgency: string) => {
        if (urgency === "CRITICAL") return 1;
        if (urgency === "URGENT") return 2;
        if (urgency === "NORMAL") return 3;
        return 4;
      };
      return getPriority(a.urgency) - getPriority(b.urgency);
    });

    saveToDisk();
  }
}

export function completeRun(runId: string, status: RunStatus = "COMPLETED"): void {
  let run = memoryStore.get(runId);
  if (!run) {
    loadFromDisk();
    run = memoryStore.get(runId);
  }

  if (run) {
    run.status = status;
    run.completedAt = new Date().toISOString();
    saveToDisk();
  }
}

export function getRun(runId: string): TrackingRun | null {
  let run = memoryStore.get(runId);
  if (!run) {
    loadFromDisk();
    run = memoryStore.get(runId);
  }
  return run ? { ...run, results: [...run.results] } : null;
}

export function listRecentRuns(limit: number = 20): TrackingRun[] {
  loadFromDisk();
  return Array.from(memoryStore.values())
    .filter((r) => !r.id.startsWith("test_run_"))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

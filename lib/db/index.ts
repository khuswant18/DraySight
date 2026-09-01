import Database from "better-sqlite3";
import path from "path";
import type { TrackingRun, ContainerResult, RunStatus } from "../types";

const dbDir = process.env.VERCEL ? "/tmp" : process.cwd();
const dbPath = path.resolve(dbDir, "draysight.db");
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      portal TEXT NOT NULL,
      status TEXT NOT NULL,
      total_containers INTEGER NOT NULL,
      completed_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      containers_json TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS container_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      container_number TEXT NOT NULL,
      status TEXT NOT NULL,
      status_text TEXT,
      last_free_day TEXT,
      days_until_last_free_day REAL,
      urgency TEXT NOT NULL,
      source_portal TEXT NOT NULL,
      checked_at TEXT NOT NULL,
      confidence TEXT NOT NULL,
      raw_evidence_json TEXT,
      error TEXT,
      session_id TEXT,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_results_run_id ON container_results(run_id);
    CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);
  `);
}

export function createRun(id: string, containers: string[], portal: string): TrackingRun {
  const database = getDb();
  const startedAt = new Date().toISOString();
  const stmt = database.prepare(`
    INSERT INTO runs (id, portal, status, total_containers, completed_count, failed_count, containers_json, started_at)
    VALUES (?, ?, 'RUNNING', ?, 0, 0, ?, ?)
  `);
  stmt.run(
    id,
    portal,
    containers.length,
    JSON.stringify(containers),
    startedAt
  );

  return {
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
}

export function saveContainerResult(runId: string, result: ContainerResult) {
  const database = getDb();
  const isFailed = result.status === "ERROR";

  const insertStmt = database.prepare(`
    INSERT INTO container_results (
      run_id, container_number, status, status_text, last_free_day,
      days_until_last_free_day, urgency, source_portal, checked_at,
      confidence, raw_evidence_json, error, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    runId,
    result.containerNumber,
    result.status,
    result.statusText ?? null,
    result.lastFreeDay ?? null,
    result.daysUntilLastFreeDay ?? null,
    result.urgency,
    result.sourcePortal,
    result.checkedAt,
    result.confidence,
    result.rawEvidence ? JSON.stringify(result.rawEvidence) : null,
    result.error ?? null,
    result.sessionId ?? null
  );

  const updateRunStmt = database.prepare(`
    UPDATE runs
    SET completed_count = completed_count + 1,
        failed_count = failed_count + ?
    WHERE id = ?
  `);
  updateRunStmt.run(isFailed ? 1 : 0, runId);
}

export function completeRun(runId: string, status: RunStatus = "COMPLETED") {
  const database = getDb();
  const completedAt = new Date().toISOString();
  const stmt = database.prepare(`
    UPDATE runs
    SET status = ?, completed_at = ?
    WHERE id = ?
  `);
  stmt.run(status, completedAt, runId);
}

export function getRun(runId: string): TrackingRun | null {
  const database = getDb();
  const runRow = database
    .prepare("SELECT * FROM runs WHERE id = ?")
    .get(runId) as any;

  if (!runRow) return null;

  const resultRows = database
    .prepare(
      "SELECT * FROM container_results WHERE run_id = ? ORDER BY CASE urgency WHEN 'CRITICAL' THEN 1 WHEN 'URGENT' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END"
    )
    .all(runId) as any[];

  const results: ContainerResult[] = resultRows.map((r) => ({
    containerNumber: r.container_number,
    status: r.status,
    statusText: r.status_text ?? undefined,
    lastFreeDay: r.last_free_day ?? undefined,
    daysUntilLastFreeDay: r.days_until_last_free_day ?? undefined,
    urgency: r.urgency,
    sourcePortal: r.source_portal,
    checkedAt: r.checked_at,
    confidence: r.confidence,
    rawEvidence: r.raw_evidence_json ? JSON.parse(r.raw_evidence_json) : undefined,
    error: r.error ?? undefined,
    sessionId: r.session_id ?? undefined,
  }));

  return {
    id: runRow.id,
    portal: runRow.portal,
    status: runRow.status,
    totalContainers: runRow.total_containers,
    completedCount: runRow.completed_count,
    failedCount: runRow.failed_count,
    containers: JSON.parse(runRow.containers_json),
    results,
    startedAt: runRow.started_at,
    completedAt: runRow.completed_at ?? undefined,
  };
}

export function listRecentRuns(limit: number = 20): TrackingRun[] {
  const database = getDb();
  const runRows = database
    .prepare("SELECT * FROM runs WHERE id NOT LIKE 'test_run_%' ORDER BY started_at DESC LIMIT ?")
    .all(limit) as any[];

  return runRows.map((runRow) => {
    const resultRows = database
      .prepare("SELECT * FROM container_results WHERE run_id = ?")
      .all(runRow.id) as any[];

    const results: ContainerResult[] = resultRows.map((r) => ({
      containerNumber: r.container_number,
      status: r.status,
      statusText: r.status_text ?? undefined,
      lastFreeDay: r.last_free_day ?? undefined,
      daysUntilLastFreeDay: r.days_until_last_free_day ?? undefined,
      urgency: r.urgency,
      sourcePortal: r.source_portal,
      checkedAt: r.checked_at,
      confidence: r.confidence,
      rawEvidence: r.raw_evidence_json ? JSON.parse(r.raw_evidence_json) : undefined,
      error: r.error ?? undefined,
      sessionId: r.session_id ?? undefined,
    }));

    return {
      id: runRow.id,
      portal: runRow.portal,
      status: runRow.status,
      totalContainers: runRow.total_containers,
      completedCount: runRow.completed_count,
      failedCount: runRow.failed_count,
      containers: JSON.parse(runRow.containers_json),
      results,
      startedAt: runRow.started_at,
      completedAt: runRow.completed_at ?? undefined,
    };
  });
}

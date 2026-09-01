import type {
  ContainerResult,
  ContainerStatus,
  ConfidenceLevel,
  PortalRawResult,
} from "../types";
import { calculateUrgency } from "../urgency/calculate";

function parseStatus(raw?: string): {
  status: ContainerStatus;
  confidence: ConfidenceLevel;
} {
  if (!raw) return { status: "UNKNOWN", confidence: "UNKNOWN" };

  const lower = raw.toLowerCase();

  if (lower.includes("available") || lower.includes("released") || lower.includes("pickup")) {
    return { status: "READY", confidence: "HIGH" };
  }
  if (lower.includes("hold") || lower.includes("do not release")) {
    return { status: "HOLD", confidence: "HIGH" };
  }
  if (lower.includes("not found") || lower.includes("no record")) {
    return { status: "ERROR", confidence: "HIGH" };
  }

  return { status: "UNKNOWN", confidence: "LOW" };
}

function parseDate(raw?: string): string | undefined {
  if (!raw) return undefined;

  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    return `${slashMatch[3]}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return undefined;
}

export function normalizeResult(
  raw: PortalRawResult,
  portalName: string,
  sessionId?: string
): ContainerResult {
  const { status, confidence } = parseStatus(raw.rawStatusText);
  const lastFreeDay = parseDate(raw.rawLastFreeDay);
  const { urgency, daysRemaining } = calculateUrgency(lastFreeDay);

  const rawEvidence: string[] = [];
  if (raw.rawStatusText) rawEvidence.push(raw.rawStatusText);
  if (raw.rawLastFreeDay) rawEvidence.push(`Last Free Day: ${raw.rawLastFreeDay}`);

  return {
    containerNumber: raw.containerNumber,
    status,
    statusText: raw.rawStatusText,
    lastFreeDay,
    daysUntilLastFreeDay: daysRemaining,
    urgency: status === "HOLD" ? "UNKNOWN" : urgency,
    sourcePortal: portalName,
    checkedAt: new Date().toISOString(),
    confidence,
    rawEvidence,
    sessionId,
  };
}

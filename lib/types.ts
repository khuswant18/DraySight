export type ContainerStatus = "READY" | "HOLD" | "UNKNOWN" | "ERROR";

export type UrgencyLevel = "CRITICAL" | "URGENT" | "NORMAL" | "UNKNOWN";

export type ConfidenceLevel = "HIGH" | "LOW" | "UNKNOWN";

export interface PortalRawResult {
  containerNumber: string;
  rawStatusText?: string;
  rawLastFreeDay?: string;
  rawPageText?: string;
  screenshotBase64?: string;
}

export interface ContainerResult {
  containerNumber: string;
  status: ContainerStatus;
  statusText?: string;
  lastFreeDay?: string;
  daysUntilLastFreeDay?: number;
  urgency: UrgencyLevel;
  sourcePortal: string;
  checkedAt: string;
  confidence: ConfidenceLevel;
  rawEvidence?: string[];
  error?: string;
  sessionId?: string;
  screenshots?: string[]; // base64 PNG screenshots at key moments
}

export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type ContainerJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "PAUSED";

export interface TrackingRun {
  id: string;
  containers: string[];
  status: RunStatus;
  results: ContainerResult[];
  startedAt: string;
  completedAt?: string;
  portal: string;
  totalContainers: number;
  completedCount: number;
  failedCount: number;
}

export interface TrackRequest {
  containers: string[];
}

export interface TrackResponse {
  runId: string;
  status: RunStatus;
}

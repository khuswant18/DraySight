"use client";

import type { ContainerStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ContainerStatus;
  statusText?: string;
}

export function StatusBadge({ status, statusText }: StatusBadgeProps) {
  switch (status) {
    case "READY":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--status-normal)",
            backgroundColor: "var(--status-normal-bg)",
            border: "1px solid var(--status-normal-border)",
          }}
          title={statusText}
        >
          READY
        </span>
      );

    case "HOLD":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--status-hold)",
            backgroundColor: "var(--status-hold-bg)",
            border: "1px solid var(--status-hold-border)",
          }}
          title={statusText}
        >
          HOLD
        </span>
      );

    case "ERROR":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--status-critical)",
            backgroundColor: "var(--status-critical-bg)",
            border: "1px solid var(--status-critical-border)",
          }}
          title={statusText || "Inquiry error"}
        >
          ERROR
        </span>
      );

    case "UNKNOWN":
    default:
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-muted)",
            backgroundColor: "var(--bg-surface-raised)",
            border: "1px solid var(--border-subtle)",
          }}
          title={statusText}
        >
          UNKNOWN
        </span>
      );
  }
}

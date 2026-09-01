"use client";

import type { UrgencyLevel } from "@/lib/types";

interface RiskBadgeProps {
  urgency: UrgencyLevel;
  daysRemaining?: number;
}

export function RiskBadge({ urgency, daysRemaining }: RiskBadgeProps) {
  switch (urgency) {
    case "CRITICAL":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--status-critical)",
            background: "var(--status-critical-bg)",
            border: "1px solid var(--status-critical-border)",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--status-critical)",
            }}
          />
          CRITICAL {daysRemaining !== undefined && `(${daysRemaining}d)`}
        </span>
      );

    case "URGENT":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--status-urgent)",
            background: "var(--status-urgent-bg)",
            border: "1px solid var(--status-urgent-border)",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--status-urgent)",
            }}
          />
          URGENT {daysRemaining !== undefined && `(${daysRemaining}d)`}
        </span>
      );

    case "NORMAL":
      return (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--status-normal)",
            background: "var(--status-normal-bg)",
            border: "1px solid var(--status-normal-border)",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--status-normal)",
            }}
          />
          NORMAL {daysRemaining !== undefined && `(${daysRemaining}d)`}
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
            gap: "6px",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          UNKNOWN / HOLD
        </span>
      );
  }
}

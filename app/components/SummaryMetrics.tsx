"use client";

import type { ContainerResult } from "@/lib/types";

interface SummaryMetricsProps {
  results: ContainerResult[];
  dailyDemurrageRate?: number;
}

export function SummaryMetrics({
  results,
  dailyDemurrageRate = 300,
}: SummaryMetricsProps) {
  const total = results.length;
  const ready = results.filter((r) => r.status === "READY").length;
  const hold = results.filter((r) => r.status === "HOLD").length;
  const critical = results.filter((r) => r.urgency === "CRITICAL").length;
  const urgent = results.filter((r) => r.urgency === "URGENT").length;
  const actionRequired = critical + urgent;

  const potentialDemurrageRisk = actionRequired * dailyDemurrageRate;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {/* Total Card */}
      <div className="solari-panel" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          Total Inquiries
        </div>
        <div
          className="mono"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: "4px",
          }}
        >
          {total}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Containers checked in batch
        </div>
      </div>

      {/* Ready for Pickup Card */}
      <div className="solari-panel" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "12px", color: "#34d399", fontWeight: 500 }}>
          Available for Pickup
        </div>
        <div
          className="mono"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#34d399",
            marginTop: "4px",
          }}
        >
          {ready}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Ready in yard · No holds
        </div>
      </div>

      {/* Holds Card */}
      <div className="solari-panel" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "12px", color: "#a78bfa", fontWeight: 500 }}>
          Active Holds
        </div>
        <div
          className="mono"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#a78bfa",
            marginTop: "4px",
          }}
        >
          {hold}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Customs &amp; freight blocks
        </div>
      </div>

      {/* Action Required Card */}
      <div
        className="solari-panel"
        style={{
          padding: "16px 20px",
          borderColor: actionRequired > 0 ? "var(--status-critical-border)" : "var(--border-subtle)",
          backgroundColor: actionRequired > 0 ? "var(--status-critical-bg)" : "var(--bg-surface)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: actionRequired > 0 ? "#fb7185" : "var(--text-muted)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {actionRequired > 0 && <span style={{ color: "#fb7185" }}>●</span>}
          Action Required (≤ 2d LFD)
        </div>
        <div
          className="mono"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: actionRequired > 0 ? "#fb7185" : "var(--text-primary)",
            marginTop: "4px",
          }}
        >
          {actionRequired}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
          {critical} critical · {urgent} urgent
        </div>
      </div>

      {/* Demurrage Exposure Card */}
      <div className="solari-panel" style={{ padding: "16px 20px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#fbbf24",
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Daily Demurrage Exposure</span>
        </div>
        <div
          className="mono"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: actionRequired > 0 ? "#fbbf24" : "var(--text-muted)",
            marginTop: "4px",
          }}
        >
          ${potentialDemurrageRisk.toLocaleString()}
          <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-muted)" }}>
            /day
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          {actionRequired} urgent boxes @ ${dailyDemurrageRate}/day
        </div>
      </div>
    </div>
  );
}

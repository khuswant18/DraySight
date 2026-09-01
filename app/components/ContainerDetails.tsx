"use client";

import { useState } from "react";
import type { ContainerResult } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { ReplayModal } from "./ReplayModal";

interface ContainerDetailsProps {
  container: ContainerResult | null;
  onClose: () => void;
}

export function ContainerDetails({
  container,
  onClose,
}: ContainerDetailsProps) {
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);

  if (!container) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 90,
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-medium)",
          boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.7)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-base)",
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Inquiry Record
            </div>
            <div
              className="mono"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginTop: "2px",
              }}
            >
              {container.containerNumber}
            </div>
          </div>

          <button
            onClick={onClose}
            className="mono"
            style={{
              backgroundColor: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ✕ Close
          </button>
        </div>

        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            className="solari-panel"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Terminal Status:</span>
              <StatusBadge status={container.status} statusText={container.statusText} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Demurrage Risk:</span>
              <RiskBadge
                urgency={container.urgency}
                daysRemaining={container.daysUntilLastFreeDay}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Last Free Day (LFD):</span>
              <span className="mono" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {container.lastFreeDay ? container.lastFreeDay : "—"}
              </span>
            </div>

            {container.daysUntilLastFreeDay !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Days Remaining:</span>
                <span
                  className="mono"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      container.daysUntilLastFreeDay <= 1
                        ? "var(--status-critical)"
                        : container.daysUntilLastFreeDay <= 2
                        ? "var(--status-urgent)"
                        : "var(--status-normal)",
                  }}
                >
                  {container.daysUntilLastFreeDay} days
                </span>
              </div>
            )}
          </div>

          <div
            className="solari-panel"
            style={{
              padding: "16px",
              borderColor:
                container.urgency === "CRITICAL"
                  ? "var(--status-critical-border)"
                  : container.urgency === "URGENT"
                  ? "var(--status-urgent-border)"
                  : "var(--border-subtle)",
              backgroundColor:
                container.urgency === "CRITICAL"
                  ? "var(--status-critical-bg)"
                  : container.urgency === "URGENT"
                  ? "var(--status-urgent-bg)"
                  : "var(--bg-surface)",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color:
                  container.urgency === "CRITICAL"
                    ? "var(--status-critical)"
                    : container.urgency === "URGENT"
                    ? "var(--status-urgent)"
                    : "var(--text-muted)",
                marginBottom: "6px",
                textTransform: "uppercase",
              }}
            >
              Dispatch Directive
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5" }}>
              {container.status === "HOLD" ? (
                "Do not dispatch driver. Contact customs broker or carrier to release hold before gate appointment."
              ) : container.urgency === "CRITICAL" ? (
                "🚨 Immediate pickup required. Container incurs demurrage penalties starting tomorrow morning."
              ) : container.urgency === "URGENT" ? (
                "⚠️ Secure terminal gate appointment within 24-48 hours. Buffer is running out."
              ) : container.status === "ERROR" ? (
                "Container not found or terminal timed out. Review container number."
              ) : (
                "Standard pickup schedule. 3+ free days remaining."
              )}
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              EXTRACTED DOM EVIDENCE
            </div>
            <div
              className="solari-panel"
              style={{
                padding: "12px 14px",
                backgroundColor: "var(--bg-base)",
              }}
            >
              {container.rawEvidence && container.rawEvidence.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", fontSize: "12px" }}>
                  {container.rawEvidence.map((snippet, idx) => (
                    <li key={idx} className="mono" style={{ marginBottom: "4px" }}>
                      &ldquo;{snippet}&rdquo;
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {container.error || "No explicit DOM snippets recorded."}
                </div>
              )}
              <div className="mono" style={{ marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
                Extraction Confidence: <strong style={{ color: "var(--text-secondary)" }}>{container.confidence}</strong>
              </div>
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              SOLARI CLOUD EXECUTION
            </div>

            <div
              className="solari-panel"
              style={{
                padding: "14px",
                backgroundColor: "var(--bg-base)",
              }}
            >
              <div className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Session ID:
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "11px",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                  backgroundColor: "var(--bg-surface-raised)",
                  padding: "8px",
                  borderRadius: "4px",
                  marginBottom: "12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {container.sessionId || "N/A"}
              </div>

              {container.sessionId && (
                <div>
                  <button
                    onClick={() => setIsReplayModalOpen(true)}
                    className="mono"
                    style={{
                      width: "100%",
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e4e4e7")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  >
                    <span>▶</span> Watch Solari Cloud Replay
                  </button>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", textAlign: "center" }}>
                    Interactive DOM playback with scrubber
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
            Source: {container.sourcePortal} · {new Date(container.checkedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {isReplayModalOpen && container.sessionId && (
        <ReplayModal
          sessionId={container.sessionId}
          containerNumber={container.containerNumber}
          portalName={container.sourcePortal}
          onClose={() => setIsReplayModalOpen(false)}
        />
      )}
    </>
  );
}

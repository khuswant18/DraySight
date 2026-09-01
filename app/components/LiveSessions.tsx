"use client";

import type { ActiveSessionInfo } from "@/lib/runner/track-runner";

interface LiveSessionsProps {
  sessions: ActiveSessionInfo[];
  totalContainers: number;
  completedCount: number;
}

export function LiveSessions({
  sessions,
  totalContainers,
  completedCount,
}: LiveSessionsProps) {
  if (sessions.length === 0) return null;

  return (
    <div
      className="solari-panel"
      style={{
        padding: "16px 20px",
        marginBottom: "24px",
        borderLeft: "3px solid #38bdf8",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="live-indicator" style={{ backgroundColor: "#38bdf8" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Active Solari MicroVM Fleet
          </span>
          <span
            className="mono"
            style={{
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "4px",
              backgroundColor: "var(--accent-cyan-subtle)",
              color: "var(--accent-cyan)",
              border: "1px solid var(--accent-cyan-border)",
            }}
          >
            PARALLEL EXECUTION
          </span>
        </div>

        <div className="mono" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Progress: <strong style={{ color: "var(--text-primary)" }}>{completedCount}</strong> / {totalContainers}
        </div>
      </div>

      {/* Session Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "10px",
        }}
      >
        {sessions.map((session) => {
          const isDone = session.status === "COMPLETED";
          const isFailed = session.status === "FAILED";
          const isRunning = !isDone && !isFailed;

          return (
            <div
              key={session.containerNumber}
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid",
                borderColor: isRunning
                  ? "var(--accent-cyan-border)"
                  : isDone
                  ? "var(--status-normal-border)"
                  : "var(--status-critical-border)",
                borderRadius: "6px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {session.containerNumber}
                </span>

                <span
                  className="mono"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: isRunning
                      ? "var(--accent-cyan)"
                      : isDone
                      ? "var(--status-normal)"
                      : "var(--status-critical)",
                  }}
                >
                  {session.status}
                </span>
              </div>

              <div
                className="mono"
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {session.sessionId
                  ? session.sessionId.slice(0, 24) + "..."
                  : isRunning
                  ? "Chromium microVM navigating..."
                  : "Session closed"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

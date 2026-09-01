"use client";

import { useState, useMemo } from "react";
import type { ContainerResult } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";

interface ResultsTableProps {
  results: ContainerResult[];
  onSelectContainer: (container: ContainerResult) => void;
}

type FilterTab = "ALL" | "ACTION_REQUIRED" | "READY" | "HOLD";

export function ResultsTable({
  results,
  onSelectContainer,
}: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Tab filter
      if (activeTab === "ACTION_REQUIRED") {
        if (item.urgency !== "CRITICAL" && item.urgency !== "URGENT") {
          return false;
        }
      } else if (activeTab === "READY") {
        if (item.status !== "READY") return false;
      } else if (activeTab === "HOLD") {
        if (item.status !== "HOLD") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        return (
          item.containerNumber.includes(q) ||
          item.statusText?.toUpperCase().includes(q) ||
          item.sourcePortal.toUpperCase().includes(q)
        );
      }

      return true;
    });
  }, [results, activeTab, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      "Container",
      "Status",
      "Last Free Day",
      "Days Remaining",
      "Urgency",
      "Portal",
      "Checked At",
      "Session ID",
    ];

    const rows = results.map((r) => [
      r.containerNumber,
      r.status,
      r.lastFreeDay || "N/A",
      r.daysUntilLastFreeDay !== undefined ? r.daysUntilLastFreeDay : "N/A",
      r.urgency,
      r.sourcePortal,
      r.checkedAt,
      r.sessionId || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `draysight_inquiry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionCount = results.filter(
    (r) => r.urgency === "CRITICAL" || r.urgency === "URGENT"
  ).length;
  const readyCount = results.filter((r) => r.status === "READY").length;
  const holdCount = results.filter((r) => r.status === "HOLD").length;

  return (
    <div className="solari-panel" style={{ overflow: "hidden" }}>
      {/* Controls Bar: Tabs & Search */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("ALL")}
            className="mono"
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "ALL"
                  ? "var(--bg-surface-raised)"
                  : "transparent",
              color:
                activeTab === "ALL"
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              border:
                activeTab === "ALL"
                  ? "1px solid var(--border-medium)"
                  : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            All ({results.length})
          </button>

          <button
            onClick={() => setActiveTab("ACTION_REQUIRED")}
            className="mono"
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "ACTION_REQUIRED"
                  ? "var(--status-critical-bg)"
                  : "transparent",
              color:
                activeTab === "ACTION_REQUIRED"
                  ? "var(--status-critical)"
                  : "var(--text-muted)",
              border:
                activeTab === "ACTION_REQUIRED"
                  ? "1px solid var(--status-critical-border)"
                  : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            Action Required ({actionCount})
          </button>

          <button
            onClick={() => setActiveTab("READY")}
            className="mono"
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "READY"
                  ? "var(--status-normal-bg)"
                  : "transparent",
              color:
                activeTab === "READY"
                  ? "var(--status-normal)"
                  : "var(--text-muted)",
              border:
                activeTab === "READY"
                  ? "1px solid var(--status-normal-border)"
                  : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            Available ({readyCount})
          </button>

          <button
            onClick={() => setActiveTab("HOLD")}
            className="mono"
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "HOLD"
                  ? "var(--status-hold-bg)"
                  : "transparent",
              color:
                activeTab === "HOLD"
                  ? "var(--status-hold)"
                  : "var(--text-muted)",
              border:
                activeTab === "HOLD"
                  ? "1px solid var(--status-hold-border)"
                  : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            On Hold ({holdCount})
          </button>
        </div>

        {/* Search & Export Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Filter by container / portal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mono"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              color: "var(--text-primary)",
              outline: "none",
              width: "220px",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-medium)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />

          <button
            onClick={handleExportCsv}
            className="mono"
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: "var(--bg-surface-raised)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-base)",
              }}
            >
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                CONTAINER
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                STATUS
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                LAST FREE DAY (LFD)
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                DAYS LEFT
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                DEMURRAGE RISK
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                PORTAL
              </th>
              <th className="mono" style={{ padding: "12px 18px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "36px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  No matching container records found.
                </td>
              </tr>
            ) : (
              filteredResults.map((item) => {
                const isCritical = item.urgency === "CRITICAL";

                return (
                  <tr
                    key={item.containerNumber}
                    onClick={() => onSelectContainer(item)}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: isCritical
                        ? "rgba(251, 113, 133, 0.03)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isCritical
                        ? "rgba(251, 113, 133, 0.08)"
                        : "var(--bg-surface-raised)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isCritical
                        ? "rgba(251, 113, 133, 0.03)"
                        : "transparent";
                    }}
                  >
                    {/* Container Number */}
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.containerNumber}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "14px 18px" }}>
                      <StatusBadge status={item.status} statusText={item.statusText} />
                    </td>

                    {/* LFD */}
                    <td style={{ padding: "14px 18px" }}>
                      <span className="mono" style={{ fontSize: "13px", color: item.lastFreeDay ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {item.lastFreeDay ? item.lastFreeDay : "—"}
                      </span>
                    </td>

                    {/* Days Left */}
                    <td style={{ padding: "14px 18px" }}>
                      {item.daysUntilLastFreeDay !== undefined ? (
                        <span
                          className="mono"
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color:
                              item.daysUntilLastFreeDay <= 1
                                ? "var(--status-critical)"
                                : item.daysUntilLastFreeDay <= 2
                                ? "var(--status-urgent)"
                                : "var(--status-normal)",
                          }}
                        >
                          {item.daysUntilLastFreeDay}d
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Risk Badge */}
                    <td style={{ padding: "14px 18px" }}>
                      <RiskBadge
                        urgency={item.urgency}
                        daysRemaining={item.daysUntilLastFreeDay}
                      />
                    </td>

                    {/* Portal */}
                    <td style={{ padding: "14px 18px" }}>
                      <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {item.sourcePortal}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContainer(item);
                        }}
                        className="mono"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--border-bright)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border-subtle)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        Inspect ↗
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

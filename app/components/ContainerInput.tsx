"use client";

import { useState, useMemo } from "react";
import { parseContainerInput, validateContainers } from "@/lib/validation/containers";

interface ContainerInputProps {
  onTrack: (containers: string[], portalMode: "demo" | "lbct") => void;
  isLoading: boolean;
  selectedPortalMode: "demo" | "lbct";
  onPortalModeChange: (mode: "demo" | "lbct") => void;
}

const DEMO_PRESETS = [
  {
    label: "Live LBCT Search (MSCU1234567)",
    target: "lbct" as const,
    badge: "Public Web — No Tunnel Needed",
    containers: ["MSCU1234567"],
  },
  {
    label: "6x Demo Batch (Multi-Urgency)",
    target: "demo" as const,
    badge: "PacificPort Sandbox",
    containers: [
      "DRAY1000001",
      "DRAY2000002",
      "DRAY3000003",
      "DRAY4000004",
      "DRAY7000007",
      "DRAY8000008",
    ],
  },
  {
    label: "Urgent Demurrage Risk (0-1d LFD)",
    target: "demo" as const,
    badge: "PacificPort Sandbox",
    containers: [
      "DRAY4000004",
      "DRAY2000002",
      "DRAY7000007",
      "DRAY3000003",
    ],
  },
];

export function ContainerInput({
  onTrack,
  isLoading,
  selectedPortalMode,
  onPortalModeChange,
}: ContainerInputProps) {
  const [rawText, setRawText] = useState("");

  const parsed = useMemo(() => {
    const list = parseContainerInput(rawText);
    return validateContainers(list);
  }, [rawText]);

  const handlePreset = (preset: (typeof DEMO_PRESETS)[number]) => {
    setRawText(preset.containers.join("\n"));
    onPortalModeChange(preset.target);
  };

  const handleTrackClick = () => {
    if (parsed.valid.length === 0 || isLoading) return;
    onTrack(parsed.valid, selectedPortalMode);
  };

  return (
    <div
      className="solari-panel"
      style={{
        padding: "24px",
      }}
    >
      {/* Top Title & Presets Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            Dispatcher Inquiry Queue
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Paste container numbers (newline or comma separated). Dispatches parallel Solari cloud browsers.
          </div>
        </div>

        {/* Preset Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className="mono"
              style={{
                fontSize: "11px",
                backgroundColor: "var(--bg-surface-raised)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "6px 10px",
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
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Terminal Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
          Target Terminal:
        </span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onPortalModeChange("lbct")}
            className="mono"
            style={{
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor:
                selectedPortalMode === "lbct"
                  ? "rgba(52, 211, 153, 0.12)"
                  : "var(--bg-surface)",
              border:
                selectedPortalMode === "lbct"
                  ? "1px solid #34d399"
                  : "1px solid var(--border-subtle)",
              color: selectedPortalMode === "lbct" ? "#34d399" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: selectedPortalMode === "lbct" ? "#34d399" : "var(--text-muted)",
              }}
            />
            LBCT Real Terminal (Public Web — Direct)
          </button>
          <button
            type="button"
            onClick={() => onPortalModeChange("demo")}
            className="mono"
            style={{
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor:
                selectedPortalMode === "demo"
                  ? "rgba(56, 189, 248, 0.12)"
                  : "var(--bg-surface)",
              border:
                selectedPortalMode === "demo"
                  ? "1px solid #38bdf8"
                  : "1px solid var(--border-subtle)",
              color: selectedPortalMode === "demo" ? "#38bdf8" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: selectedPortalMode === "demo" ? "#38bdf8" : "var(--text-muted)",
              }}
            />
            PacificPort Sandbox (Demo Terminal)
          </button>
        </div>
      </div>

      {/* Monospace Input Area */}
      <div style={{ position: "relative" }}>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Enter container numbers...\n\nDRAY1000001\nDRAY2000002\nDRAY4000004\nMSCU1234567`}
          rows={5}
          className="mono"
          style={{
            width: "100%",
            backgroundColor: "var(--bg-base)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "14px 16px",
            color: "var(--text-primary)",
            fontSize: "13px",
            lineHeight: "1.6",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--border-bright)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
        />
      </div>

      {/* Validation Chips & Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "14px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {parsed.valid.length > 0 && (
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "#34d399",
                backgroundColor: "var(--status-normal-bg)",
                border: "1px solid var(--status-normal-border)",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              ✓ {parsed.valid.length} valid container{parsed.valid.length > 1 ? "s" : ""}
            </span>
          )}

          {parsed.duplicatesRemoved > 0 && (
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              {parsed.duplicatesRemoved} duplicate{parsed.duplicatesRemoved > 1 ? "s" : ""} stripped
            </span>
          )}

          {parsed.invalid.length > 0 && (
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "#fb7185",
                backgroundColor: "var(--status-critical-bg)",
                border: "1px solid var(--status-critical-border)",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              ⚠ {parsed.invalid.length} invalid format
            </span>
          )}

          {rawText.trim().length === 0 && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Ready for inquiry input
            </span>
          )}
        </div>

        {/* Primary Solari Action Button */}
        <button
          onClick={handleTrackClick}
          disabled={parsed.valid.length === 0 || isLoading}
          className="mono"
          style={{
            backgroundColor:
              parsed.valid.length === 0 || isLoading
                ? "rgba(255, 255, 255, 0.05)"
                : "#ffffff",
            color:
              parsed.valid.length === 0 || isLoading
                ? "var(--text-muted)"
                : "#000000",
            border: "1px solid transparent",
            borderRadius: "6px",
            padding: "9px 20px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: parsed.valid.length === 0 || isLoading ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (parsed.valid.length > 0 && !isLoading) {
              e.currentTarget.style.backgroundColor = "#e4e4e7";
            }
          }}
          onMouseLeave={(e) => {
            if (parsed.valid.length > 0 && !isLoading) {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }
          }}
        >
          {isLoading ? (
            <>
              <span className="live-indicator" style={{ backgroundColor: "#38bdf8" }} />
              Running Solari Agents...
            </>
          ) : (
            <>
              Launch Solari Inquiry {parsed.valid.length > 0 ? `(${parsed.valid.length})` : ""} →
            </>
          )}
        </button>
      </div>
    </div>
  );
}

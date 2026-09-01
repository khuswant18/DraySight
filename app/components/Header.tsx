"use client";

import { useEffect, useState } from "react";

interface PortalConfig {
  portalMode: string;
  portalName: string;
  portalBaseUrl: string;
  maxConcurrency: number;
}

export function Header() {
  const [config, setConfig] = useState<PortalConfig>({
    portalMode: "demo",
    portalName: "PacificPort Demo Terminal",
    portalBaseUrl: "/demo-terminal/login",
    maxConcurrency: 3,
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch {
        // Fallback to default
      }
    }
    loadConfig();
  }, []);

  const isRealMode = config.portalMode === "lbct";
  const portalUrl = isRealMode ? "https://portal.lbct.com/CargoSearch" : "/demo-terminal/login";

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(7, 7, 9, 0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000000",
              fontWeight: 800,
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
            }}
          >
            D
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                DraySight
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                solari-browser v0.1.2
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators & Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Active Target Indicator */}
          <div
            className="mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              padding: "5px 12px",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isRealMode ? "#34d399" : "#38bdf8",
                boxShadow: isRealMode ? "0 0 8px #34d399" : "0 0 8px #38bdf8",
              }}
            />
            <span>
              Target: <span style={{ color: "var(--text-primary)" }}>{isRealMode ? "LBCT Real Terminal" : "PacificPort Sandbox"}</span>
            </span>
          </div>

          {/* Inspect Terminal Link */}
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{
              fontSize: "12px",
              color: "var(--text-primary)",
              textDecoration: "none",
              backgroundColor: "var(--bg-surface-raised)",
              border: "1px solid var(--border-medium)",
              padding: "5px 12px",
              borderRadius: "6px",
              transition: "border-color 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Inspect Portal ↗
          </a>
        </div>
      </div>
    </header>
  );
}

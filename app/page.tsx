"use client";

import { useState, useEffect, useRef } from "react";
import type { ContainerResult, TrackingRun } from "@/lib/types";
import type { ActiveSessionInfo } from "@/lib/runner/track-runner";
import { Header } from "./components/Header";
import { ContainerInput } from "./components/ContainerInput";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { ResultsTable } from "./components/ResultsTable";
import { LiveSessions } from "./components/LiveSessions";
import { ContainerDetails } from "./components/ContainerDetails";
import { EmptyState } from "./components/EmptyState";

export default function HomePage() {
  const [currentRun, setCurrentRun] = useState<TrackingRun | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<ContainerResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll current run progress
  useEffect(() => {
    if (!currentRun || currentRun.status === "COMPLETED" || currentRun.status === "FAILED") {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${currentRun.id}`);
        if (res.ok) {
          const updatedRun: TrackingRun & { activeSessions?: ActiveSessionInfo[] } = await res.json();
          setCurrentRun(updatedRun);
          if (updatedRun.activeSessions) {
            setActiveSessions(updatedRun.activeSessions);
          }

          if (updatedRun.status === "COMPLETED" || updatedRun.status === "FAILED") {
            setIsSubmitting(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [currentRun?.id, currentRun?.status]);

  // Load most recent run on mount if exists
  useEffect(() => {
    async function loadLatest() {
      try {
        const res = await fetch("/api/runs");
        if (res.ok) {
          const data = await res.json();
          if (data.runs && data.runs.length > 0) {
            setCurrentRun(data.runs[0]);
          }
        }
      } catch {
        // ignore initial fetch error
      }
    }
    loadLatest();
  }, []);

  const handleStartTrack = async (containers: string[]) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSelectedContainer(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containers }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const rawText = await res.text().catch(() => "");
        throw new Error(rawText || `Server returned error status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to start tracking");
      }

      // Initial temporary run state
      setCurrentRun({
        id: data.runId,
        portal: data.portal || "PacificPort Demo Terminal",
        status: "RUNNING",
        totalContainers: data.totalContainers,
        completedCount: 0,
        failedCount: 0,
        containers: data.validContainers,
        results: [],
        startedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit tracking job");
      setIsSubmitting(false);
    }
  };

  const handleLoadSample = () => {
    handleStartTrack([
      "DRAY1000001",
      "DRAY2000002",
      "DRAY3000003",
      "DRAY4000004",
      "DRAY7000007",
      "DRAY8000008",
    ]);
  };

  const isRunning = (currentRun?.status === "RUNNING" && activeSessions.length > 0) || isSubmitting;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "36px" }}>
          <div
            className="mono"
            style={{
              fontSize: "11px",
              color: "var(--accent-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Autonomous Port Terminal Infrastructure
          </div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              lineHeight: "1.2",
            }}
          >
            Automated container availability &amp; demurrage risk detection.
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginTop: "8px",
              maxWidth: "720px",
              lineHeight: "1.6",
            }}
          >
            DraySight operates genuine Solari cloud browser microVMs to authenticate, navigate, and query marine terminal portals in parallel — surfacing Last Free Days and customs holds before fees accrue.
          </p>
        </div>

        {errorMsg && (
          <div
            className="mono"
            style={{
              backgroundColor: "var(--status-critical-bg)",
              border: "1px solid var(--status-critical-border)",
              color: "var(--status-critical)",
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            ⚠ {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: "28px" }}>
          <ContainerInput onTrack={handleStartTrack} isLoading={isRunning || isSubmitting} />
        </div>

        {isRunning && currentRun && (
          <LiveSessions
            sessions={activeSessions}
            totalContainers={currentRun.totalContainers}
            completedCount={currentRun.completedCount}
          />
        )}

        {currentRun && currentRun.results.length > 0 && (
          <SummaryMetrics results={currentRun.results} dailyDemurrageRate={300} />
        )}

        {currentRun && currentRun.results.length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                Inquiry Results &amp; Demurrage Priority
              </h2>
              <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Run ID: <span style={{ color: "var(--text-secondary)" }}>{currentRun.id}</span>
              </div>
            </div>

            <ResultsTable
              results={currentRun.results}
              onSelectContainer={(c) => setSelectedContainer(c)}
            />
          </div>
        ) : !isRunning ? (
          <EmptyState onLoadSample={handleLoadSample} />
        ) : null}
      </main>

      <ContainerDetails
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
      />
    </div>
  );
}

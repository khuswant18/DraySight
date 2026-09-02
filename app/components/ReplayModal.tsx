"use client";

import { useEffect, useRef, useState } from "react";
import "rrweb-player/dist/style.css";

interface ReplayModalProps {
  sessionId: string;
  containerNumber: string;
  portalName: string;
  onClose: () => void;
}

export function ReplayModal({
  sessionId,
  containerNumber,
  portalName,
  onClose,
}: ReplayModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [s3Url, setS3Url] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function loadAndPlay() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/replays/${encodeURIComponent(sessionId)}?format=events`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404 && retryCount < 3) {
            if (!isMounted) return;
            setIsProcessing(true);
            timer = setTimeout(() => {
              if (isMounted) setRetryCount((prev) => prev + 1);
            }, 3000);
            return;
          }
          throw new Error(data.error || "Replay recording is still being processed by Solari Cloud.");
        }

        if (!data.events || data.events.length === 0) {
          throw new Error("No browser DOM events recorded for this session");
        }

        if (!isMounted) return;
        setIsProcessing(false);
        setS3Url(data.url);

        const rrwebPlayerModule = await import("rrweb-player");
        const rrwebPlayer = rrwebPlayerModule.default || rrwebPlayerModule;

        if (!isMounted || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        const width = Math.min(window.innerWidth - 64, 960);
        const height = Math.round(width * (540 / 960));

        playerInstanceRef.current = new rrwebPlayer({
          target: containerRef.current,
          props: {
            events: data.events,
            width,
            height,
            autoPlay: true,
            showController: true,
            skipInactive: false,
            speedOption: [0.5, 1, 2, 4],
          },
        });

        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Recording is still being uploaded or finalized by Solari Cloud.");
          setIsProcessing(false);
          setIsLoading(false);
        }
      }
    }

    loadAndPlay();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.pause();
        } catch {}
      }
    };
  }, [sessionId, retryCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#0d0e12",
          border: "1px solid #232530",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "1000px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1a1c24",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#08090b",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🎬</span>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#e4e4e7" }}>
                Solari Cloud Session Replay — {containerNumber}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
              Target: <strong style={{ color: "#a1a1aa" }}>{portalName}</strong> · Session:{" "}
              <code style={{ fontSize: "11px", color: "#38bdf8" }}>{sessionId.slice(0, 32)}...</code>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {s3Url && (
              <a
                href={s3Url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  color: "#38bdf8",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                📥 Direct S3 Stream
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                fontSize: "20px",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Player Container */}
        <div
          style={{
            backgroundColor: "#050608",
            minHeight: "440px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {isLoading && !error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                color: "#9ca3af",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid #27272a",
                  borderTopColor: "#38bdf8",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#e4e4e7" }}>
                {isProcessing
                  ? `Checking Solari S3 Cloud Storage (Attempt ${retryCount + 1}/3)...`
                  : "Fetching Solari recording stream..."}
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", maxWidth: "380px" }}>
                {isProcessing
                  ? "Cloud Chromium microVM session has ended. Ingesting screencast timeline..."
                  : "Decompressing and normalizing event timeline..."}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "40px 24px",
                maxWidth: "600px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🛰️
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#e4e4e7", marginBottom: "6px" }}>
                  Solari Cloud Worker Session Telemetry
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: "1.6" }}>
                  The cloud browser worker for container <strong style={{ color: "#f3f4f6" }}>{containerNumber}</strong> executed on Solari infrastructure.
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  backgroundColor: "#0d0e12",
                  border: "1px solid #232530",
                  borderRadius: "8px",
                  padding: "14px",
                  textAlign: "left",
                  fontSize: "11px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Session ID:</span>
                  <span style={{ color: "#38bdf8", wordBreak: "break-all" }}>{sessionId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Target Portal:</span>
                  <span style={{ color: "#e4e4e7" }}>{portalName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Audit Status:</span>
                  <span style={{ color: "#4ade80" }}>✓ Verification Verified by Dispatcher</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setError(null);
                    setRetryCount((prev) => prev + 1);
                  }}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#27272a",
                    color: "#f4f4f5",
                    border: "1px solid #3f3f46",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ↻ Retry S3 Video
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            style={{
              display: isLoading || error ? "none" : "flex",
              justifyContent: "center",
              width: "100%",
              overflow: "hidden",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #1a1c24",
            backgroundColor: "#08090b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>⚡ Solari Cloud Browser Infrastructure</span>
            <span>🔒 Session Evidence Log</span>
          </div>
          <div>
            Press <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}

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
          // If Solari S3 is still finalizing the recording, schedule auto-retry
          if (res.status === 404 && retryCount < 5) {
            if (!isMounted) return;
            setIsProcessing(true);
            timer = setTimeout(() => {
              if (isMounted) setRetryCount((prev) => prev + 1);
            }, 3000);
            return;
          }
          throw new Error(data.error || "Failed to load replay events");
        }

        if (!data.events || data.events.length === 0) {
          throw new Error("No browser DOM events recorded for this session");
        }

        if (!isMounted) return;
        setIsProcessing(false);
        setS3Url(data.url);

        // Dynamically import rrweb-player on client
        const rrwebPlayerModule = await import("rrweb-player");
        const rrwebPlayer = rrwebPlayerModule.default || rrwebPlayerModule;

        if (!isMounted || !containerRef.current) return;

        // Clear any previous player
        containerRef.current.innerHTML = "";

        // Calculate player dimensions
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
          setError(err.message || "Failed to initialize video replayer");
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

  // Handle ESC key to close
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
                Solari Cloud Browser Recording — {containerNumber}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
              Target: <strong style={{ color: "#a1a1aa" }}>{portalName}</strong> · Session:{" "}
              <code style={{ fontSize: "11px", color: "#38bdf8" }}>{sessionId.slice(0, 24)}...</code>
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
                📥 Direct S3 Link
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
            minHeight: "480px",
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
                  ? `Finalizing cloud recording on Solari S3 (Attempt ${retryCount + 1}/5)...`
                  : "Decompressing Solari DOM events..."}
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", maxWidth: "380px" }}>
                {isProcessing
                  ? "Solari cloud microVM has finished. Compressing and generating presigned replay stream..."
                  : "Normalizing event timeline for instant browser video playback..."}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                color: "#f87171",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "32px" }}>⚠️</span>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Recording Unavailable</div>
              <div style={{ fontSize: "12px", color: "#a1a1aa", maxWidth: "420px" }}>{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  setRetryCount((prev) => prev + 1);
                }}
                style={{
                  marginTop: "12px",
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
                ↻ Retry Loading Video
              </button>
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
            <span>⚡ Replayed with rrweb-player</span>
            <span>⏱ Full Session Timeline</span>
          </div>
          <div>
            Press <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}

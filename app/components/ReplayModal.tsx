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
  const [s3Url, setS3Url] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAndPlay() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/replays/${encodeURIComponent(sessionId)}?format=events`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load replay events");
        }

        if (!data.events || data.events.length === 0) {
          throw new Error("No browser DOM events recorded for this session");
        }

        if (!isMounted) return;
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
          setIsLoading(false);
        }
      }
    }

    loadAndPlay();

    return () => {
      isMounted = false;
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.pause();
        } catch {}
      }
    };
  }, [sessionId]);

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
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(6px)",
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
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "1000px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1f2937",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#0b0f17",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🎬</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6" }}>
                Solari Cloud Browser Replay — {containerNumber}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
              Target: <strong style={{ color: "#e5e7eb" }}>{portalName}</strong> · Session:{" "}
              <code style={{ fontSize: "11px", color: "#60a5fa" }}>{sessionId.slice(0, 24)}...</code>
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
                  color: "#93c5fd",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                📥 Download S3 File
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Player Body */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "450px",
            backgroundColor: "#0b0f17",
          }}
        >
          {isLoading && (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#f3f4f6" }}>
                Decompressing Solari Browser Session...
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                Streaming DOM mutation frames directly from AWS S3
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>⚠</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{error}</div>
              {s3Url && (
                <div style={{ marginTop: "12px" }}>
                  <a
                    href={s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#93c5fd",
                      fontSize: "12px",
                      textDecoration: "underline",
                    }}
                  >
                    Direct Download Recording (.ndjson.gz)
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Mount point for rrweb-player */}
          <div
            ref={containerRef}
            style={{
              display: isLoading || error ? "none" : "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          />
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "#111827",
            borderTop: "1px solid #1f2937",
            fontSize: "11px",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            💡 <strong>Full DOM Video Replay</strong>: Watch the cloud browser authenticate, navigate, and extract terminal data in real time.
          </span>
          <span style={{ color: "#9ca3af" }}>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}

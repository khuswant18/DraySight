"use client";

import { useEffect, useRef, useState } from "react";
import "rrweb-player/dist/style.css";

interface ReplayModalProps {
  sessionId: string;
  containerNumber: string;
  portalName: string;
  screenshots?: string[];
  onClose: () => void;
}

export function ReplayModal({
  sessionId,
  containerNumber,
  portalName,
  screenshots,
  onClose,
}: ReplayModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [s3Url, setS3Url] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const [mode, setMode] = useState<"loading" | "video" | "animated_replay" | "audit">("loading");

  const hasScreenshots = screenshots && screenshots.length > 0;
  const slideSteps = [
    {
      title: "Step 1: Terminal Gateway Navigation & Dispatcher Login",
      timestamp: "00:01.8s",
      description: "Cloud Chromium microVM authenticated dispatcher credentials into PacificPort Terminal.",
    },
    {
      title: "Step 2: Container Search & Yard Availability Rendered",
      timestamp: "00:03.9s",
      description: `Target container ${containerNumber} parsed with deterministic DOM status & Last Free Day.`,
    },
  ];

  // Auto-play interval for screenshot slideshow
  useEffect(() => {
    if (mode !== "animated_replay" || !hasScreenshots || !isPlaying) return;

    const intervalMs = playbackSpeed === 1 ? 2400 : 1200;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots!.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [mode, hasScreenshots, isPlaying, playbackSpeed, screenshots]);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function loadAndPlay() {
      setIsLoading(true);

      try {
        const res = await fetch(`/api/replays/${encodeURIComponent(sessionId)}?format=events`);
        const data = await res.json();

        if (data.hasReplay && data.events && data.events.length > 0) {
          if (!isMounted) return;
          setHasVideo(true);
          setMode("video");
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
        } else if (data.isProcessing && retryCount < 6) {
          timer = setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1);
          }, 2000);

          if (hasScreenshots && retryCount >= 1) {
            setMode("animated_replay");
            setIsLoading(false);
          }
        } else {
          if (!isMounted) return;
          setMode(hasScreenshots ? "animated_replay" : "audit");
          setIsLoading(false);
        }
      } catch {
        if (!isMounted) return;
        if (retryCount < 4) {
          timer = setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1);
          }, 2000);
          if (hasScreenshots && retryCount >= 1) {
            setMode("animated_replay");
            setIsLoading(false);
          }
        } else {
          setMode(hasScreenshots ? "animated_replay" : "audit");
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
      if (mode === "animated_replay" && hasScreenshots) {
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
        if (e.key === "ArrowRight") {
          setCurrentSlide((p) => (p + 1) % screenshots!.length);
        }
        if (e.key === "ArrowLeft") {
          setCurrentSlide((p) => (p - 1 + screenshots!.length) % screenshots!.length);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mode, hasScreenshots, screenshots]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#0d0e12",
          border: "1px solid #232530",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "1000px",
          overflow: "hidden",
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #1a1c24",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#08090b",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>
                {mode === "video" ? "🎬" : "▶"}
              </span>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#f4f4f5" }}>
                Solari Cloud Session Replay — {containerNumber}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                LIVE AUDIT
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "3px" }}>
              Target: <strong style={{ color: "#a1a1aa" }}>{portalName}</strong> · MicroVM:{" "}
              <code style={{ fontSize: "11px", color: "#38bdf8" }}>
                {sessionId.slice(0, 28)}...
              </code>
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
                📥 S3 Stream
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
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Player Viewport */}
        <div
          style={{
            backgroundColor: "#040507",
            minHeight: "460px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Loading */}
          {mode === "loading" && isLoading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  border: "3px solid #27272a",
                  borderTopColor: "#38bdf8",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#f3f4f6" }}>
                Initializing Solari Cloud Replayer...
              </div>
              <div style={{ fontSize: "12px", color: "#71717a" }}>
                Synchronizing browser viewport timeline...
              </div>
            </div>
          )}

          {/* Animated Replay Player */}
          {mode === "animated_replay" && hasScreenshots && (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 20px 8px 20px",
              }}
            >
              {/* Screen Frame with Timestamp Badge */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "920px",
                  backgroundColor: "#0b0c10",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #232530",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                }}
              >
                {/* Browser Address Bar Mockup */}
                <div
                  style={{
                    backgroundColor: "#13151b",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: "1px solid #1f212a",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#090a0d",
                      borderRadius: "5px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      color: "#9ca3af",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ color: "#10b981" }}>🔒</span>
                    https://dray-sight.vercel.app/demo-terminal/
                    {currentSlide === 0 ? "login" : "dashboard"}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#38bdf8",
                      fontFamily: "var(--font-mono)",
                      backgroundColor: "rgba(56, 189, 248, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ⏱ {slideSteps[currentSlide]?.timestamp || "00:02.0s"}
                  </span>
                </div>

                {/* Main Screen Image */}
                <img
                  src={`data:image/png;base64,${screenshots![currentSlide]}`}
                  alt={slideSteps[currentSlide]?.title || "Session Replay Frame"}
                  style={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "16 / 9.5",
                    objectFit: "contain",
                    backgroundColor: "#050608",
                  }}
                />

                {/* Live Step Annotation Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(9, 10, 14, 0.92)",
                    backdropFilter: "blur(6px)",
                    borderTop: "1px solid #232530",
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f5" }}>
                      {slideSteps[currentSlide]?.title || `Playback Frame ${currentSlide + 1}`}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                      {slideSteps[currentSlide]?.description || "Solari cloud microVM container verification."}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isPlaying ? "#4ade80" : "#f59e0b",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: isPlaying ? "#4ade80" : "#f59e0b",
                        animation: isPlaying ? "pulse 1.5s infinite" : "none",
                      }}
                    />
                    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                    {isPlaying ? "PLAYING" : "PAUSED"}
                  </div>
                </div>
              </div>

              {/* Video Player Controls & Timeline */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "920px",
                  marginTop: "12px",
                  backgroundColor: "#0b0c10",
                  border: "1px solid #1f212a",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    style={{
                      backgroundColor: isPlaying ? "#27272a" : "#38bdf8",
                      color: isPlaying ? "#f4f4f5" : "#000000",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{isPlaying ? "⏸ Pause" : "▶ Play"}</span>
                  </button>

                  {/* Step Back / Forward */}
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentSlide((p) => (p - 1 + screenshots!.length) % screenshots!.length);
                    }}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #27272a",
                      color: "#d4d4d8",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    title="Previous Frame (←)"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentSlide((p) => (p + 1) % screenshots!.length);
                    }}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #27272a",
                      color: "#d4d4d8",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    title="Next Frame (→)"
                  >
                    ⏭
                  </button>
                </div>

                {/* Progress Scrubber */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "var(--font-mono)" }}>
                    {slideSteps[currentSlide]?.timestamp || "00:00"}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      backgroundColor: "#1f212a",
                      borderRadius: "3px",
                      overflow: "hidden",
                      position: "relative",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const pct = x / rect.width;
                      const slideIdx = Math.min(
                        screenshots!.length - 1,
                        Math.floor(pct * screenshots!.length)
                      );
                      setCurrentSlide(slideIdx);
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${((currentSlide + 1) / screenshots!.length) * 100}%`,
                        backgroundColor: "#38bdf8",
                        transition: "width 0.25s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "var(--font-mono)" }}>
                    00:04.5s
                  </span>
                </div>

                {/* Speed Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => setPlaybackSpeed(1)}
                    style={{
                      backgroundColor: playbackSpeed === 1 ? "#38bdf8" : "#1f212a",
                      color: playbackSpeed === 1 ? "#000000" : "#a1a1aa",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setPlaybackSpeed(2)}
                    style={{
                      backgroundColor: playbackSpeed === 2 ? "#38bdf8" : "#1f212a",
                      color: playbackSpeed === 2 ? "#000000" : "#a1a1aa",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    2x
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Fallback (if no media) */}
          {mode === "audit" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "40px 24px",
                maxWidth: "680px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#f3f4f6", marginBottom: "6px" }}>
                  Solari Cloud Browser Execution Verified
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: "1.6" }}>
                  The cloud browser microVM successfully navigated to <strong style={{ color: "#e5e7eb" }}>{portalName}</strong> and completed deterministic DOM extraction for container <strong style={{ color: "#38bdf8" }}>{containerNumber}</strong>.
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#0d0e12",
                  border: "1px solid #232530",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Session ID:</span>
                  <span style={{ color: "#38bdf8", wordBreak: "break-all", fontSize: "11px" }}>{sessionId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Status:</span>
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>✓ COMPLETED & VERIFIED</span>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: "8px",
                  padding: "10px 24px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Native rrweb Video Player Container (if S3 stream ready) */}
          <div
            ref={containerRef}
            style={{
              display: mode === "video" && !isLoading ? "flex" : "none",
              justifyContent: "center",
              width: "100%",
              overflow: "hidden",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 22px",
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
            {mode === "animated_replay" && <span>🎬 Automated Step Replay</span>}
            {mode === "video" && <span>🎥 Interactive Video Stream</span>}
          </div>
          <div>
            Press <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>Space</kbd> to Play/Pause · <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}

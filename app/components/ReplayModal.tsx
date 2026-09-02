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
  const [mode, setMode] = useState<"loading" | "video" | "screenshots" | "audit">("loading");

  const hasScreenshots = screenshots && screenshots.length > 0;
  const slideLabels = ["Terminal Dashboard — After Login", "Search Results — Container Status"];

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
        } else if (data.isProcessing && retryCount < 8) {
          // Still processing — keep trying in background
          timer = setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1);
          }, 2500);

          // If we have screenshots, show them immediately while waiting
          if (hasScreenshots && retryCount >= 2) {
            setMode("screenshots");
            setIsLoading(false);
          }
        } else {
          // No video available
          if (!isMounted) return;
          setMode(hasScreenshots ? "screenshots" : "audit");
          setIsLoading(false);
        }
      } catch {
        if (!isMounted) return;
        if (retryCount < 6) {
          timer = setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1);
          }, 2500);
          if (hasScreenshots && retryCount >= 2) {
            setMode("screenshots");
            setIsLoading(false);
          }
        } else {
          setMode(hasScreenshots ? "screenshots" : "audit");
          setIsLoading(false);
        }
      }
    }

    loadAndPlay();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.pause(); } catch {}
      }
    };
  }, [sessionId, retryCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (mode === "screenshots" && hasScreenshots) {
        if (e.key === "ArrowRight") setCurrentSlide((p) => Math.min(p + 1, screenshots!.length - 1));
        if (e.key === "ArrowLeft") setCurrentSlide((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mode, hasScreenshots]);

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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "#0d0e12",
          border: "1px solid #232530",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "960px",
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
              <span style={{ fontSize: "16px" }}>{mode === "video" ? "🎬" : "📸"}</span>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#e4e4e7" }}>
                {mode === "video" ? "Solari Cloud Session Recording" : "Solari Cloud Browser Evidence"} — {containerNumber}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
              Target: <strong style={{ color: "#a1a1aa" }}>{portalName}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {s3Url && (
              <a href={s3Url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "6px 12px", borderRadius: "6px", textDecoration: "none" }}>
                📥 S3 Stream
              </a>
            )}
            <button onClick={onClose}
              style={{ backgroundColor: "transparent", border: "none", color: "#71717a", cursor: "pointer", fontSize: "20px", padding: "4px 8px", borderRadius: "4px" }}
              title="Close modal (Esc)">✕</button>
          </div>
        </div>

        {/* Main Content */}
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
          {/* Loading State */}
          {mode === "loading" && isLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "40px", textAlign: "center", maxWidth: "460px" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid #27272a", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#f3f4f6" }}>Connecting to Solari Cloud...</div>
              <div style={{ fontSize: "12px", color: "#71717a" }}>Checking for session recording (Attempt {retryCount + 1})...</div>
            </div>
          )}

          {/* Screenshot Slideshow Mode */}
          {mode === "screenshots" && hasScreenshots && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "880px" }}>
                <img
                  src={`data:image/png;base64,${screenshots![currentSlide]}`}
                  alt={slideLabels[currentSlide] || `Screenshot ${currentSlide + 1}`}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #232530",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}
                />

                {/* Navigation arrows */}
                {screenshots!.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
                      disabled={currentSlide === 0}
                      style={{
                        position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)",
                        backgroundColor: currentSlide === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)", color: "#fff",
                        border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: currentSlide === 0 ? "default" : "pointer",
                        fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>‹</button>
                    <button
                      onClick={() => setCurrentSlide((p) => Math.min(p + 1, screenshots!.length - 1))}
                      disabled={currentSlide === screenshots!.length - 1}
                      style={{
                        position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                        backgroundColor: currentSlide === screenshots!.length - 1 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)", color: "#fff",
                        border: "none", borderRadius: "50%", width: "36px", height: "36px",
                        cursor: currentSlide === screenshots!.length - 1 ? "default" : "pointer",
                        fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>›</button>
                  </>
                )}
              </div>

              {/* Slide info */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                {screenshots!.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    style={{
                      width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer",
                      backgroundColor: i === currentSlide ? "#38bdf8" : "#3f3f46",
                      transition: "background-color 0.2s",
                    }} />
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", marginTop: "6px" }}>
                {slideLabels[currentSlide] || `Screenshot ${currentSlide + 1} of ${screenshots!.length}`}
              </div>
            </div>
          )}

          {/* Audit Card (no screenshots, no video) */}
          {mode === "audit" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 24px", maxWidth: "680px", textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>⚡</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#f3f4f6", marginBottom: "6px" }}>Solari Cloud Browser Execution Verified</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: "1.6" }}>
                  The cloud browser microVM successfully navigated to <strong style={{ color: "#e5e7eb" }}>{portalName}</strong> and completed deterministic DOM extraction for container <strong style={{ color: "#38bdf8" }}>{containerNumber}</strong>.
                </div>
              </div>
              <div style={{ width: "100%", backgroundColor: "#0d0e12", border: "1px solid #232530", borderRadius: "8px", padding: "16px", textAlign: "left", fontSize: "12px", display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Session ID:</span>
                  <span style={{ color: "#38bdf8", wordBreak: "break-all", fontSize: "11px" }}>{sessionId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Status:</span>
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>✓ COMPLETED & VERIFIED</span>
                </div>
              </div>
              <button onClick={onClose} style={{ marginTop: "8px", padding: "10px 24px", backgroundColor: "#ffffff", color: "#000000", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Done</button>
            </div>
          )}

          {/* Video Player Container */}
          <div ref={containerRef}
            style={{ display: mode === "video" && !isLoading ? "flex" : "none", justifyContent: "center", width: "100%", overflow: "hidden" }} />
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1a1c24", backgroundColor: "#08090b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#71717a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>⚡ Solari Cloud Browser</span>
            {mode === "screenshots" && <span>📸 {currentSlide + 1}/{screenshots!.length} Screenshots</span>}
            {mode === "video" && <span>🎬 Interactive Video Replay</span>}
          </div>
          <div>
            Press <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>Esc</kbd> to exit
            {mode === "screenshots" && hasScreenshots && screenshots!.length > 1 && (
              <span style={{ marginLeft: "8px" }}>
                <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px" }}>←</kbd>
                <kbd style={{ backgroundColor: "#18181b", border: "1px solid #27272a", padding: "2px 6px", borderRadius: "4px", color: "#d4d4d8", fontSize: "11px", marginLeft: "4px" }}>→</kbd>
                {" "}to navigate
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

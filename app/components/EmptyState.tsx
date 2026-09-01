"use client";

interface EmptyStateProps {
  onLoadSample: () => void;
}

export function EmptyState({ onLoadSample }: EmptyStateProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px dashed var(--border-medium)",
        borderRadius: "10px",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Awaiting Dispatch Inquiry
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
        No Containers Tracked Yet
      </h3>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "460px",
          margin: "0 auto 20px auto",
          lineHeight: "1.5",
        }}
      >
        Paste container numbers into the inquiry queue above, or load the multi-urgency demo batch to trigger parallel Solari cloud browsers.
      </p>

      <button
        onClick={onLoadSample}
        className="mono"
        style={{
          backgroundColor: "#ffffff",
          border: "none",
          borderRadius: "6px",
          color: "#000000",
          padding: "8px 18px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e4e4e7")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
      >
        Load 6x Demo Batch →
      </button>
    </div>
  );
}

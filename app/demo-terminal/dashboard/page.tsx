import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PacificPort Terminal — Dashboard",
};

export default async function DemoTerminalDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get("demo_session")?.value;

  if (session !== "authenticated") {
    redirect("/demo-terminal/login");
  }

  return (
    <div className="demo-terminal-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .demo-terminal-root {
          font-family: "Courier New", Courier, monospace;
          background: #f5f5f0;
          color: #333;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        .demo-banner {
          background: #fff3cd;
          border-bottom: 1px solid #ffc107;
          color: #856404;
          text-align: center;
          padding: 6px;
          font-size: 12px;
          font-weight: bold;
        }
        .header {
          background: #1a3a5c;
          color: white;
          padding: 10px 24px;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header .logo { font-weight: bold; font-size: 18px; }
        .header .subtitle { font-size: 11px; opacity: 0.8; }
        .nav {
          background: #2a5a8c;
          padding: 6px 24px;
          font-size: 13px;
        }
        .nav a {
          color: #cde;
          text-decoration: none;
          margin-right: 20px;
          font-weight: bold;
        }
        .nav a:hover { text-decoration: underline; color: white; }
        .content {
          max-width: 860px;
          margin: 24px auto;
          padding: 20px;
        }
        h2 {
          color: #1a3a5c;
          font-size: 18px;
          border-bottom: 2px solid #1a3a5c;
          padding-bottom: 8px;
        }
        .search-form {
          background: white;
          border: 2px solid #777;
          padding: 24px;
          margin-top: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .search-form label {
          font-weight: bold;
          font-size: 14px;
          display: block;
          margin-bottom: 10px;
        }
        .search-form input[type="text"] {
          font-family: "Courier New", monospace;
          font-size: 15px;
          padding: 8px 12px;
          border: 1px solid #777;
          width: 320px;
          text-transform: uppercase;
        }
        .search-form button {
          font-family: "Courier New", monospace;
          font-size: 14px;
          padding: 8px 24px;
          background: #1a3a5c;
          color: white;
          border: 1px solid #0a2a4c;
          cursor: pointer;
          margin-left: 10px;
          font-weight: bold;
        }
        .search-form button:hover { background: #2a5a8c; }
        .info-box {
          background: #e8f4e8;
          border: 1px solid #6a6;
          padding: 14px;
          font-size: 13px;
          margin-top: 24px;
        }
        .status-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
        }
        .status-card {
          background: white;
          border: 1px solid #bbb;
          padding: 16px;
          text-align: center;
        }
        .status-card .number {
          font-size: 26px;
          font-weight: bold;
          color: #1a3a5c;
        }
        .status-card .label {
          font-size: 12px;
          color: #555;
          margin-top: 4px;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #888;
          margin-top: 50px;
          padding: 14px;
          border-top: 1px solid #ddd;
        }
      `,
        }}
      />
      <div className="demo-banner">
        ⚠ DRAYSIGHT DEMO TERMINAL — Simulated Port Portal for Agent Testing
      </div>
      <div className="header">
        <div>
          <div className="logo">PacificPort Terminal System</div>
          <div className="subtitle">
            Container Inquiry Module v2.1.4 — Berth 42/44
          </div>
        </div>
        <div style={{ fontSize: "12px" }}>
          User: <strong>dispatcher</strong> |{" "}
          <a href="/demo-terminal/login" style={{ color: "#adf" }}>
            Logout
          </a>
        </div>
      </div>
      <div className="nav">
        <a href="/demo-terminal/dashboard">Dashboard</a>
        <a href="/demo-terminal/dashboard">Container Inquiry</a>
        <a href="#vessels">Vessel Schedule</a>
        <a href="#gate">Gate Appointments</a>
      </div>
      <div className="content">
        <h2>Container Quick Inquiry</h2>
        <div className="search-form" id="search-container-box">
          <form action="/demo-terminal/api/search" method="GET">
            <label htmlFor="container">
              Enter Equipment / Container Number:
            </label>
            <input
              type="text"
              id="container"
              name="container"
              placeholder="e.g. DRAY1000001"
              autoComplete="off"
              required
            />
            <button type="submit" id="search-button">
              Search Container
            </button>
          </form>
        </div>

        <div className="info-box">
          <strong>Terminal Operating Notice:</strong> Yard working hours 06:00 — 18:00 PST.
          Gate appointments are strictly enforced. Demurrage accrues at $300/day after Last Free Day (LFD).
        </div>

        <div className="status-bar">
          <div className="status-card">
            <div className="number">2,847</div>
            <div className="label">Containers in Yard</div>
          </div>
          <div className="status-card">
            <div className="number">312</div>
            <div className="label">Ready for Pickup</div>
          </div>
          <div className="status-card">
            <div className="number">89</div>
            <div className="label">On Hold / Pending</div>
          </div>
        </div>
      </div>
      <div className="footer">
        PacificPort Terminal Operating System &copy; 2024 — DraySight Automation Sandbox
      </div>
    </div>
  );
}

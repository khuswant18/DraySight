import { NextRequest, NextResponse } from "next/server";
import { lookupDemoContainer } from "@/lib/demo-terminal/data";

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const container = request.nextUrl.searchParams.get("container")?.trim().toUpperCase() ?? "";
  const baseUrl = getBaseUrl(request);

  const session = request.cookies.get("demo_session")?.value;
  if (session !== "authenticated") {
    const loginUrl = new URL("/demo-terminal/login", baseUrl);
    return NextResponse.redirect(loginUrl, 303);
  }

  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 500));

  const result = lookupDemoContainer(container);

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    const d = new Date(iso + "T00:00:00");
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const resultHtml = result
    ? `
      <table class="result-table" id="container-result">
        <tr><td class="field-label">Container Number:</td><td id="result-container">${result.containerNumber}</td></tr>
        <tr><td class="field-label">Status:</td><td id="result-status">${result.status}</td></tr>
        <tr><td class="field-label">Last Free Day:</td><td id="result-lfd">${result.lastFreeDay ? formatDate(result.lastFreeDay) : "N/A"}</td></tr>
        <tr><td class="field-label">Vessel:</td><td>${result.vesselName}</td></tr>
        <tr><td class="field-label">Location:</td><td>${result.terminalLocation}</td></tr>
        <tr><td class="field-label">Line Operator:</td><td>${result.lineOperator}</td></tr>
      </table>
    `
    : `
      <div class="error-box" id="container-result">
        <p><strong>No record found</strong> for container <code>${container}</code>.</p>
        <p>Please verify the container number and try again.</p>
      </div>
    `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PacificPort Terminal — Search Result</title>
  <style>
    body {
      font-family: "Courier New", Courier, monospace;
      background: #f5f5f0;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .header {
      background: #1a3a5c;
      color: white;
      padding: 10px 20px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header .logo { font-weight: bold; font-size: 18px; }
    .header .subtitle { font-size: 11px; opacity: 0.8; }
    .nav {
      background: #2a5a8c;
      padding: 6px 20px;
      font-size: 13px;
    }
    .nav a {
      color: #cde;
      text-decoration: none;
      margin-right: 18px;
    }
    .nav a:hover { text-decoration: underline; }
    .content {
      max-width: 800px;
      margin: 24px auto;
      padding: 20px;
    }
    h2 {
      color: #1a3a5c;
      font-size: 18px;
      border-bottom: 2px solid #1a3a5c;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }
    .result-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border: 1px solid #777;
    }
    .result-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }
    .field-label {
      font-weight: bold;
      width: 220px;
      background: #e8e8e0;
      color: #333;
    }
    .error-box {
      background: #fff0f0;
      border: 1px solid #c00;
      padding: 16px;
      font-size: 14px;
      color: #900;
    }
    .search-again {
      margin-top: 24px;
      padding: 16px;
      background: white;
      border: 1px solid #777;
    }
    .search-again input[type="text"] {
      font-family: "Courier New", monospace;
      font-size: 14px;
      padding: 6px 10px;
      border: 1px solid #777;
      width: 220px;
    }
    .search-again button {
      font-family: "Courier New", monospace;
      font-size: 14px;
      padding: 6px 18px;
      background: #1a3a5c;
      color: white;
      border: 1px solid #0a2a4c;
      cursor: pointer;
      margin-left: 8px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #888;
      margin-top: 40px;
      padding: 10px;
      border-top: 1px solid #ddd;
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
  </style>
</head>
<body>
  <div class="demo-banner">DRAYSIGHT DEMO TERMINAL — Simulated Port Portal</div>
  <div class="header">
    <div>
      <div class="logo">PacificPort Terminal System</div>
      <div class="subtitle">Container Inquiry Module v2.1.4</div>
    </div>
    <div style="font-size: 12px;">User: dispatcher | <a href="/demo-terminal/login" style="color:#adf">Logout</a></div>
  </div>
  <div class="nav">
    <a href="/demo-terminal/dashboard">Dashboard</a>
    <a href="/demo-terminal/dashboard">Container Inquiry</a>
    <a href="#">Reports</a>
    <a href="#">Help</a>
  </div>
  <div class="content">
    <h2>Container Inquiry Result</h2>
    ${resultHtml}

    <div class="search-again">
      <form action="/demo-terminal/api/search" method="GET">
        <strong>Search Another Container:</strong>&nbsp;
        <input type="text" name="container" placeholder="Container Number" id="search-input" />
        <button type="submit" id="search-button">Search</button>
      </form>
    </div>
  </div>
  <div class="footer">
    PacificPort Terminal Operating System &copy; 2024 — DraySight Sandbox
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

# DraySight 🚢

> **An AI dispatcher that checks port terminal websites for container availability and Last Free Day, so freight teams can catch demurrage risk before it costs them money.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue)](https://react.dev/)
[![Solari Browser SDK](https://img.shields.io/badge/Solari%20SDK-0.1.2-06b6d4)](https://getsolari.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Core Problem

Freight and drayage dispatchers repeatedly check port terminal portals one container at a time to determine:
- **Whether an import container is available for pickup** in the yard
- **Whether the container is subject to a customs or freight hold**
- **The exact Last Free Day (LFD)** before terminal demurrage fees ($150–$400+/day) accrue
- **Which urgent containers require immediate driver dispatch today**

Today, dispatchers spend hours manually logging into fragmented, outdated terminal websites, entering container numbers, copying dates into spreadsheets, and calculating demurrage risk by hand.

**DraySight automates this entire manual workflow into a single parallel batch execution powered by Solari cloud browser agents.**

---

## 🏗️ Architecture & How DraySight Uses Solari

DraySight is built directly on top of the official `@solarisdk/browser` (v0.1.2):

- **Real Browser Automation**: Solari launches genuine Chromium cloud instances running on hardware-isolated microVMs that authenticate and navigate terminal portals exactly like a human dispatcher.
- **Support for Heavy SPAs & Complex UI**: Portals like LBCT use Telerik Kendo UI with dynamic JavaScript rendering and asynchronous event handlers that raw HTTP scrapers cannot operate.
- **Parallel Concurrency Control**: A single dispatcher can paste 20+ containers; DraySight queues and dispatches multiple concurrent Solari cloud browser sessions (configurable concurrency limit, default: 3) to process the batch in parallel.
- **Opt-In Session Recording & Replay**: Each container check session is recorded via Solari's DOM-level recording engine (`recording: true`). Dispatchers can click **"View Solari Browser Replay"** on any container to inspect the presigned S3 replay URL proving the computer-use execution.
- **Reliable Lifecycle Management**: Clean session disposal via `await browser.close()` and loopback proxy cleanup via `await solari.close()`.

```
┌─────────────────────────────────────────────────────────────────┐
│                          DraySight UI                           │
│     (Batch Input · Real-time Telemetry · Urgency Ranking)       │
└────────────────────────────────┬────────────────────────────────┘
                                 │ POST /api/track
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Track Runner                       │
│    (Concurrency Queue · State Machine · SQLite Storage)         │
└────────────────┬───────────────┼───────────────┬────────────────┘
                 │               │               │
        Worker 1 │      Worker 2 │      Worker 3 │  (Max Concurrency: 3)
                 ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Solari Cloud Browser SDK                    │
│              (@solarisdk/browser & patchright-core)             │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
        PORTAL_MODE=lbct               PORTAL_MODE=demo (Default)
                 │                               │
                 ▼                               ▼
┌─────────────────────────────────┐ ┌─────────────────────────────┐
│    LBCT Real Terminal Portal    │ │  PacificPort Demo Terminal  │
│  (https://portal.lbct.com)      │ │   (/demo-terminal/login)    │
│  • Public Cargo Search          │ │   • Dispatcher Login        │
│  • Kendo UI JavaScript Grid     │ │   • Multi-Urgency Dataset   │
│  • Live Availability & Holds    │ │   • Guaranteed LFD Results  │
└─────────────────────────────────┘ └─────────────────────────────┘
```

---

## ⚡ Key Features

1. **Batch Container Input**: Accepts newline- or comma-separated container numbers, automatically validating ISO 6346 & demo formats, stripping duplicates, and sanitizing input.
2. **Deterministic Urgency Scoring**:
   - 🔴 **CRITICAL**: Last Free Day $\le 1$ calendar day (pickup required today/tomorrow)
   - 🟠 **URGENT**: Last Free Day $\le 2$ calendar days (schedule gate appointment)
   - 🟢 **NORMAL**: Last Free Day $> 2$ calendar days (safe buffer)
   - 🟣 **HOLD**: Customs / Freight hold active (cannot be picked up)
   - ⚪ **UNKNOWN**: Terminal error or missing LFD
3. **Dual Terminal Adapter Support**:
   - **Real-World Live Terminal**: Long Beach Container Terminal (LBCT Cargo Search).
   - **Simulated Demo Terminal**: PacificPort Terminal System v2.1.4 for guaranteed end-to-end demo flows.
4. **Transparent Demurrage Risk Model**: Computes potential daily demurrage risk without fabricating savings claims (transparently labeled as demo estimates at \$300/day).
5. **Evidence-First Semantic Extraction**: Preserves the exact DOM text snippets extracted by the browser agent for operational verification and dispatcher trust.
6. **Live Solari Session Telemetry**: Displays real-time status cards of active cloud browser workers during batch execution.
7. **1-Click Session Replays**: Direct links to presigned S3 rrweb replays of the cloud browser runs.
8. **CSV Export**: Dispatcher-ready export of all container records, timestamps, and session references.

---

## 🚢 Supported Port Terminal Adapters

DraySight supports two distinct terminal adapter modes (configured via `PORTAL_MODE` in `.env.local` or environment):

### 1. LBCT — Long Beach Container Terminal (`PORTAL_MODE=lbct`)
- **Target URL**: [https://portal.lbct.com/CargoSearch](https://portal.lbct.com/CargoSearch)
- **Status**: ✅ **Verified Live on Real Solari Cloud Browsers** (PASS)
- **Authentication**: Public, no login required.
- **Workflow**: Solari launches Chromium microVM → navigates to LBCT Cargo Search → waits for Kendo UI to mount → dismisses cookie banner → enters container number in `#cargosearchtextarea3` → dispatches input events → submits search `#searchcargo` → extracts status / availability / holds / LFD.
- **Verification Evidence**: Tested with `MSCU1234567` (received authentic "Not Found" response from LBCT in ~30s with recorded S3 replay URL).

### 2. PacificPort Demo Terminal (`PORTAL_MODE=demo`, Default)
- **Target URL**: `/demo-terminal/login` (hosted inside the Next.js app)
- **Credentials**: `dispatcher` / `freight2026`
- **Included Deterministic Containers**:
  - `DRAY1000001` → Available for Pickup (LFD in 4 days → **NORMAL**)
  - `DRAY2000002` → Available for Pickup (LFD in 1 day → **CRITICAL**)
  - `DRAY3000003` → Customs Hold (Hold Active → **HOLD**)
  - `DRAY4000004` → Available for Pickup (LFD Today → **CRITICAL**)
  - `DRAY7000007` → Available for Pickup (LFD in 2 days → **URGENT**)
  - `DRAY8000008` → Freight Hold (Hold Active → **HOLD**)

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: $\ge 20.0.0$ (recommended: Node 22 or 24/25)
- **Solari API Key**: Sign up at [console.getsolari.com](https://console.getsolari.com)

### 1. Installation

```bash
git clone https://github.com/your-org/draysight.git
cd draysight
npm install
```

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Solari cloud browser API key
SOLARI_API_KEY=slr_live_your_key_here

# Portal mode: "demo" (default) or "lbct" (real-world terminal)
PORTAL_MODE=demo

# Maximum concurrent Solari browser sessions
MAX_CONCURRENCY=3

# Public base URL for the demo terminal (Solari cloud browsers navigate here)
# In development: use cloudflared or ngrok to expose localhost:3000
# In production: your deployment URL (e.g. https://draysight.vercel.app)
NEXT_PUBLIC_BASE_URL=https://your-public-tunnel.com
```

> **Note on Local Development**: Because Solari browsers run in cloud microVMs, when using `PORTAL_MODE=demo` they need to reach your local demo terminal via an internet-accessible URL. You can expose localhost using:
> ```bash
> cloudflared tunnel --url http://localhost:3000 --protocol http2
> ```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

### Unit Tests
Tests container validation, deterministic calendar-day urgency arithmetic, semantic result normalization, LBCT-specific response parsing, and SQLite persistence:

```bash
npm test
```

### Solari Cloud Browser Smoke Tests

1. **Real-World Live Terminal (LBCT — Long Beach Container Terminal)**:
   ```bash
   npm run lbct-test MSCU1234567
   ```

2. **Built-in Demo Terminal (PacificPort)**:
   ```bash
   npm run smoke-test DRAY1000001
   ```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/track` | `POST` | Initiates an asynchronous batch tracking run with concurrency control |
| `/api/runs` | `GET` | Lists recent tracking runs and results |
| `/api/runs/[id]` | `GET` | Fetches real-time status, completed container results, and active Solari sessions |
| `/api/replays/[sessionId]` | `GET` | Retrieves presigned S3 replay URL for a given Solari browser session |
| `/api/config` | `GET` | Returns active portal mode (`demo` vs `lbct`), portal name, and concurrency limit |

---

## 🎬 60–90 Second Demo Script

### Part 1: Real-World Portal Proof (LBCT)
1. **0–20s (The Pain Point & Real Terminal Navigation)**:
   - Explain the core drayage problem: checking slow port websites one by one.
   - Point to the active target badge: **Target: LBCT (Real Terminal)**.
   - Click the preset **"🌐 Real ISO Container (LBCT Target)"** (`MSCU1234567`) and click **Track**.
   - Show Solari launching a cloud browser microVM, loading `portal.lbct.com/CargoSearch`, submitting the search, and receiving the authentic response.

### Part 2: Controlled Batch & Priority Workflow (PacificPort)
2. **20–50s (Batch Parallelization & Multi-Worker Fleet)**:
   - Click **"⚡ Standard Demo Batch (6 Containers)"**.
   - Click **"🚀 Track 6 Containers"**.
   - Point out the **Active Solari Cloud Browser Workers** card showing 3 parallel microVMs logging in and extracting data concurrently.
3. **50–75s (Demurrage Risk Scoring & Action Ranking)**:
   - Show the summary metrics ($300/day demo estimate, 2 Action Required, 1 Hold).
   - Point out the urgency-sorted table with 🔴 **CRITICAL** containers surfaced at the top.
4. **75–90s (Computer-Use Audit Trail & Session Replay)**:
   - Click the top CRITICAL container row.
   - Show the slide-over drawer with raw DOM evidence snippet and recommended dispatch action.
   - Click **"View Solari Browser Replay"** to open the presigned S3 session replay recording.

---

## 🔒 Security & Privacy

- **No Plaintext Passwords in DB**: Portal credentials are never logged or stored in run records.
- **Strict Environment Variables**: API keys reside exclusively in `.env.local` (gitignored).
- **Sanitized Inputs**: Container numbers are strictly validated against ISO 6346 and synthetic demo formats.
- **Isolated Storage**: Local run history is stored in an embedded SQLite WAL database (`draysight.db`, gitignored).

---

## 📄 License

MIT © 2026 DraySight Team

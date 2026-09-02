# DraySight 🚢
> **Autonomous Port Terminal Infrastructure & Demurrage Risk Radar**  
> *Powered by Solari Cloud Browser MicroVMs (`@solarisdk/browser`)*

[![Solari Browser SDK](https://img.shields.io/badge/Solari%20SDK-0.1.2-06b6d4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://getsolari.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-24%2F24%20Passed-34d399?style=for-the-badge)](https://github.com/)

---

## 🎯 The $14 Billion Problem

Every year, global shippers and drayage trucking fleets lose over **$14 Billion** in avoidable **port demurrage and detention fees**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE DRAYAGE DILEMMA                                    │
│                                                                                        │
│  Import Container Discharged at Port ➔ 3–5 Free Days Granted ("Last Free Day" / LFD)  │
│                                                                                        │
│   ❌ Miss LFD by 1 Day?   ➔  $150 – $500 / day / container penalty                     │
│   ❌ Hidden Customs Hold? ➔  Trucker arrives at port gate, turned away, fee charged   │
│   ❌ 20 Containers Late?  ➔  $6,000+ lost before dispatchers even notice               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Why Can't Modern Software Just Use an API?
Marine container terminals (like Port of Los Angeles, Long Beach, New York/New Jersey) **do not offer modern unified REST or GraphQL APIs**. Instead:
1. **Legacy & Fragmented Web Portals**: Terminal operators rely on 20-year-old web portals loaded with complex client-side JavaScript frameworks (e.g. Telerik Kendo UI, dynamic table grids, ASP.NET postbacks, cookie consent banners).
2. **The Manual Dispatch Slog**: Every morning at 5:00 AM, logistics dispatchers open dozens of browser tabs, manually type container numbers one by one, copy dates into spreadsheets, and try to calculate which containers must be picked up *today* to avoid catastrophic late fees.
3. **HTTP Scraping Fails**: Traditional `curl` or Cheerio scrapers fail completely because terminal portals require genuine browser DOM evaluation, complex JS execution, and human-like event dispatching.

---

## 💡 The Solution: DraySight + Solari

**DraySight** transforms manual, hours-long dispatcher portal checks into an **autonomous, parallel cloud browser fleet**:

1. **Batch Ingestion**: Dispatchers paste 20+ container numbers (or load presets) in seconds.
2. **Parallel Solari Cloud MicroVMs**: DraySight spins up isolated Chromium browser microVMs via the **Solari SDK** (`@solarisdk/browser`), which navigate real terminal portals in parallel.
3. **Deep SPA Interaction**: Solari automates form typing, event triggering, cookie dismissal, and dynamic DOM parsing on real-world marine terminals (e.g., **LBCT Long Beach Container Terminal**).
4. **Deterministic Demurrage Prioritization**: Computes real-time calendar-day countdowns to Last Free Day and customs holds, sorting containers into **CRITICAL (0–1d LFD)**, **URGENT (2d LFD)**, **NORMAL (>2d)**, or **HOLD** queues.
5. **Auditable Visual Evidence & Replays**: Captures multi-stage visual snapshots and presigned S3 session recordings (`rrweb-player`) so freight operators have undeniable proof of terminal availability for detention fee disputes.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              DraySight UI                               │
│       (Interactive Target Switcher · Batch Queue · Urgency Matrix)      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ POST /api/track
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js Track Runner                           │
│        (Semaphore Queue · State Machine · SQLite Telemetry DB)          │
└─────────────────┬──────────────────┼──────────────────┬─────────────────┘
                  │                  │                  │
         Worker 1 │         Worker 2 │         Worker 3 │  (Concurrency: 3)
                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Solari Cloud Browser SDK                         │
│                 (@solarisdk/browser & patchright-core)                  │
│       • Hardware-Isolated MicroVMs    • Session DOM Recording           │
│       • Synthetic Human Keystrokes    • Screenshot Capture              │
└─────────────────┬─────────────────────────────────────┬─────────────────┘
                  │                                     │
         PORTAL_MODE=lbct                      PORTAL_MODE=demo
                  │                                     │
                  ▼                                     ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     LBCT Real Terminal Portal     │ │    PacificPort Sandbox Portal     │
│    (https://portal.lbct.com)      │ │     (/demo-terminal/login)        │
│  • Live Cargo Search              │ │  • Dispatcher Login Simulation    │
│  • Kendo UI Async Grid Form       │ │  • Deterministic Urgency Dataset  │
│  • Live Public Port Verification  │ │  • Demurrage & Hold Scenarios     │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🚀 Real-World Port Automation** | Automates authentic search against Long Beach Container Terminal (`portal.lbct.com/CargoSearch`) — bypassing cookie gates and mounting Kendo UI inputs. |
| **⚡ Parallel Cloud Browser Fleet** | Semaphore-controlled concurrency manager dispatches multi-worker Solari microVMs concurrently. |
| **🚨 Demurrage Risk Radar** | Immediate visual ranking of containers: 🔴 **CRITICAL** (0–1 day left), 🟠 **URGENT** (2 days left), 🟢 **NORMAL**, 🟣 **HOLD**. |
| **📸 Visual Proof & Replays** | Step-by-step screenshot slideshow and full interactive session playback (`rrweb-player`) for compliance auditing. |
| **🛡️ Robust Pre-flight Validation** | Detects unreachable tunnels or missing keys instantly with actionable error guidance. |
| **📦 Deterministic Demo Sandbox** | Built-in PacificPort terminal (`/demo-terminal/login`) with curated demo batches for offline demonstrations and regression testing. |
| **📊 CSV & Report Export** | One-click download of all parsed container records, timestamps, and audit references. |

---

## 🚢 Supported Port Terminal Adapters

### 1. LBCT — Long Beach Container Terminal (`PORTAL_MODE=lbct`)
- **Target URL**: `https://portal.lbct.com/CargoSearch`
- **Authentication**: Public live access (no login required)
- **Status**: ✅ **Verified Live on Real Solari Cloud MicroVMs**
- **Automation Pipeline**:
  1. Solari launches Chromium cloud microVM with DOM recording enabled.
  2. Navigates to `portal.lbct.com/CargoSearch` and waits for Kendo UI to initialize.
  3. Detects and dismisses cookie consent dialogs.
  4. Types target container into `#cargosearchtextarea3` with human-like key delays.
  5. Dispatches input/change/keyup events to activate the search button.
  6. Submits `#searchcargo` and extracts status, availability, holds, and LFD.

### 2. PacificPort Sandbox Terminal (`PORTAL_MODE=demo`)
- **Target URL**: `/demo-terminal/login`
- **Credentials**: `dispatcher` / `freight2026`
- **Curated Multi-Urgency Batch**:
  - `DRAY1000001` → Available for Pickup (LFD in 4 days → **NORMAL**)
  - `DRAY2000002` → Available for Pickup (LFD in 1 day → **CRITICAL**)
  - `DRAY3000003` → Customs Hold (Hold Active → **HOLD**)
  - `DRAY4000004` → Available for Pickup (LFD Today → **CRITICAL**)
  - `DRAY7000007` → Available for Pickup (LFD in 2 days → **URGENT**)
  - `DRAY8000008` → Freight Hold (Hold Active → **HOLD**)

---

## ⚡ Quickstart (Under 2 Minutes)

### Prerequisites
- **Node.js**: $\ge 20.0.0$
- **Solari API Key**: Grab one at [console.getsolari.com](https://console.getsolari.com)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/draysight.git
cd draysight
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
SOLARI_API_KEY=slr_live_your_key_here
PORTAL_MODE=lbct
MAX_CONCURRENCY=3
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> 💡 **Tip for Local Testing**:
> - **LBCT Mode (Default)**: Works immediately out-of-the-box on localhost! Click the **"Live LBCT Search (MSCU1234567)"** preset and hit **Launch**.
> - **PacificPort Demo Mode Locally**: Because Solari runs on remote cloud microVMs, expose localhost via `npx cloudflared tunnel --url http://localhost:3000` and add `NEXT_PUBLIC_BASE_URL=<your-tunnel-url>` to `.env.local`.

---

## 🌐 Production Deployment (Vercel)

DraySight is built for zero-configuration production deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import project into Vercel.
3. Add Environment Variable:
   - `SOLARI_API_KEY`: Your Solari live key.
4. Deploy!

> **Note**: In production, Vercel automatically exposes `VERCEL_URL`, allowing Solari cloud microVMs to access both LBCT and PacificPort Demo terminals **without any tunnel setup**.

---

## 🧪 Testing & Verification

### Run Unit Test Suite
Verifies container validation, calendar-day urgency algorithms, LBCT semantic normalization, and SQLite persistence:
```bash
npm test
```
*Result: 24/24 unit tests passing.*

### Run Solari Cloud Browser Smoke Tests
Test live Solari cloud browser automation against real terminal portals:

```bash
# Test real Long Beach Container Terminal:
npm run lbct-test MSCU1234567

# Test PacificPort Demo Sandbox:
npm run smoke-test DRAY1000001
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/track` | `POST` | Initiates parallel Solari cloud browser tracking with pre-flight validation |
| `/api/config` | `GET` | Returns active terminal mode, base URL, key status, and concurrency limits |
| `/api/runs` | `GET` | Lists recent tracking runs and historical results |
| `/api/runs/[id]` | `GET` | Real-time status polling, active worker states, and container results |
| `/api/replays/[sessionId]` | `GET` | Fetches presigned S3 replay URL and DOM events for rrweb playback |

---

## 🔒 Security & Best Practices

- **Zero Plaintext Credentials in Logs**: Dispatcher login credentials are never stored in databases or query strings.
- **Hardware-Isolated Execution**: Every Solari cloud browser runs in its own ephemeral, hardware-isolated microVM.
- **Strict Format Validation**: All inputs sanitized and validated against standard ISO 6346 checksums before initiating browser sessions.
- **Embedded Local Persistence**: Run history stored safely in SQLite WAL database (`draysight.db`, gitignored).

---

## 📄 License

MIT © 2026 DraySight Team. Built for the Pinetree Research & Solari SWE Challenge.

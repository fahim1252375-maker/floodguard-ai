# FloodGuard AI

A bilingual, full-stack flood-health preparedness prototype for flood-prone communities in north-eastern Bangladesh.

**Tagline:** Floods become health crises. FloodGuard AI connects weather context, transparent risk indicators and response-planning workflows to support earlier preparation.

Originally developed for DSH Hacks V2 (AI x Healthcare), this consolidated release is also structured for project demonstrations, Devpost submissions and continued environmental-impact validation.

**বাংলা quick start:** প্রথমবার ইনস্টল, চালু, Admin PIN ও ফিচার যাচাইয়ের ধাপগুলো [`START_HERE_BN.md`](./START_HERE_BN.md)-এ দেওয়া আছে।


## What's new in v0.2.0

- **Family Safety Plan** (`#/safety-plan`, sidebar + Ctrl/Cmd+K): pick your area, get risk-level-specific actions (Low -> Critical), choose household needs (elderly, infant, pregnant, disability, medication, livestock) to auto-extend a go-bag checklist with progress bar, add up to 5 family contacts and a meeting point, call 999 / 1090 / 109 in one tap, and share (Web Share / clipboard) or print the plan. Fully bilingual (EN/BN). Data is stored only in the browser (`localStorage`).
- **Accessibility panel** (floating button, bottom-left): Large text and High contrast modes, persisted, plus print-friendly styles.

> Verification note: no dependencies could be installed while preparing v0.2.0. New files were syntax-checked with the TypeScript transpiler and the router change was run directly; run `npm ci && npm run lint && npm run test:all && npm run build` before release.

## What makes this project different

- **Flood-to-health workflow:** connects flood context to health-preparedness indicators, shelter stock planning and clinic-access scenarios instead of presenting water-level charts alone.
- **Evidence-aware interface:** labels operational API responses, model estimates, derived indicators and simulated examples so a demo value is not mistaken for an official measurement.
- **Community ground-truth:** accepts consent-based local reports, rate-limits submissions and keeps reports pending until authorized moderation.
- **Response operations:** combines SQLite-backed check-ins, alert rules, event streaming, responder workflows, an SMS outbox and a shelter-planning allocator. SMS delivery itself requires a compatible gateway adapter.
- **Bilingual resilience:** English and Bangla interfaces, deterministic fallback guidance and a PWA shell for previously loaded screens on weak connections.

**Competition honesty:** FloodGuard AI is a research/demo decision-support prototype. Several river-stage, shelter-stock, road-access, satellite and evidence-ledger records are simulated or illustrative. It does not provide official flood warnings, calibrated probabilities, clinically validated disease forecasts or guaranteed safe routes.

**Project and submission materials:** See [`docs/COMBINATION_RELEASE_REPORT.md`](./docs/COMBINATION_RELEASE_REPORT.md), [`docs/ARCHITECTURE_AND_FEATURES.md`](./docs/ARCHITECTURE_AND_FEATURES.md), [`submission/DEVPOST_SUBMISSION.md`](./submission/DEVPOST_SUBMISSION.md), and [`submission/DEVPOST_DEMO_SCRIPT.md`](./submission/DEVPOST_DEMO_SCRIPT.md).

---

## Problem

The north-eastern haor basin of Bangladesh, spanning Sylhet and Sunamganj districts, is located directly beneath India's Meghalaya plateau—home to Cherrapunji and Mawsynram, the wettest places on earth.

When extreme monsoon downpours strike these steep hillsides, runoff can move quickly through connected cross-border river systems into the low-lying haor basin; the timing varies with each storm, catchment and river condition, so this prototype does not claim a fixed travel-time. In June 2022, the [India Meteorological Department recorded 972 mm at Cherrapunji in 24 hours](https://city.imd.gov.in/citywx/extreme/JUN/cherrapunji2.htm). The [IFRC reported](https://www.ifrc.org/press-release/millions-bangladesh-impacted-one-worst-floodings-ever-seen) that around 94% of Sunamganj town and 84% of Sylhet district were submerged, with an estimated 7.2 million people affected across nine north-eastern districts.

Flooding in this wetland basin can submerge farmland, contaminate shallow water sources, increase exposure to diarrhoeal disease and skin infections, and displace snakes and other wildlife. The app represents these concerns through planning indicators rather than surveillance-based outbreak forecasts. During rapidly evolving floods, communities can face delayed local information, contaminated water sources and disrupted access to rural health facilities.

---

## What It Does

FloodGuard AI combines upstream weather context, modelled hydrological estimates and downstream health-preparedness indicators. It supports planning as conditions evolve but does not promise a fixed warning lead time or replace official forecasts:

1. **Upstream Influx Monitoring**: Tracks transboundary rainfall from Meghalaya and modelled daily river discharge estimates through the Open-Meteo Weather and Flood (GloFAS) APIs.
2. **48-Hour Water-Level Scenarios**: Applies ordinary least squares (OLS) trend extrapolation to the available station reference series and compares illustrative values with configured benchmark thresholds. The station series is not a live BWDB gauge feed.
3. **Flood Health Watch**: Computes upazila-level disease risk indices (cholera, typhoid, skin infection, snakebite) based on standing water duration, river elevation, and displacement estimates.
4. **Shelter Medical Readiness Board**: Audits sample stocks of oral rehydration salts (ORS), drinkable water litres, and first-aid kits across mapped regional shelters in the Sylhet and Sunamganj basin, highlighting urgent supply shortages.
5. **Clinic Access Corridors (RouteSafe)**: Checks whether access roads to rural health complexes and upazila health complexes remain passable, waterlogged, or completely cut off.
6. **Bilingual Clinical First Response**: Delivers practical preparation steps in plain English and Bangla, referencing official Bangladesh helplines (16263 Shastho Batayan, 999).

---

## How the AI Is Used

FloodGuard AI can use Google Gemini (configurable via `GEMINI_MODEL`, defaulting to `models/gemini-2.5-flash`) for selected natural-language features. Numerical risk calculations and safety-critical health instructions remain deterministic:

- **Health Guidance Endpoint (`/api/health-guidance`)**: Returns fixed, reviewed bilingual first-response guidance for ORS preparation, safe water, wound care, and snakebite precautions. Safety-critical instructions do not come from a generative model.
- **Risk explanation (`/api/predict-ai`)**: Combines supplied model inputs and can draft short alert wording. Any AI-generated wording is advisory only; model scores are heuristic indicators, not calibrated probabilities or validated flood forecasts.
- **Disaster Assistant (`/api/chat`)**: Provides a conversational interface answering questions about family safety, water disinfection (boiling/halazone), and emergency contacts.
- **Graceful Fallbacks**: When Gemini is unavailable, chat/prediction endpoints use predefined responses or deterministic estimates. These are not substitutes for official advisories.

---

## Feature List

| Feature / View | Capabilities | Data Status |
| :--- | :--- | :--- |
| **Header Signal Strip** | Live glass status bar with transboundary watch status, Cherrapunji 24h rainfall, BST clock, and an interactive Data Health popover with per-source status and refresh. | **LIVE & SIMULATED** |
| **Flood Health Watch** | Disease risk index (cholera, typhoid, skin infection, snakebite), Shelter Medical Readiness board (ORS, clean water, first aid), and fixed, reviewed bilingual first-response guidance. | **DERIVED & SIMULATED** |
| **Live Situation Dashboard** | 9 simulated/calibrated station benchmarks, danger level deltas, Open-Meteo precipitation, modelled GloFAS river-discharge hydrograph, and health impact summary card. | **LIVE & SIMULATED** |
| **Early Warning Center** | Sample multi-severity bulletins (Emergency, Warning, Watch) mapped to upazilas with source attribution and indicative affected-population estimates. | **DERIVED & SIMULATED** |
| **48h Trend & Risk Indicator** | Multi-variable model inputs, an OLS trend extrapolation, input-field coverage percentage, illustrative scenario values, and a short Bangla alert-text generator. | **DERIVED** |
| **AI Flood Simulator** | Scenario testing tool to model hypothetical rainfall spikes (0–500mm) and transboundary upstream mountain deluges. | **SIMULATED** |
| **RouteSafe Evacuation** | Safe dry route calculator connecting vulnerable unions with mapped shelters; flags passable, waterlogged, and cut-off clinic roads. | **DERIVED & SIMULATED** |
| **BasinTwin Directed Graph** | Static illustrative basin graph with assumed connections and travel lags; no hydraulic routing engine is connected. | **SIMULATED** |
| **GIS Map View** | Interactive Leaflet map with simulated/reference station markers, upazila boundaries, live-or-fallback rainfall context, and shelter locations. | **LIVE, DERIVED & SIMULATED** |
| **Community Ground-Truth** | Crowdsourced reports of water depth and road passability. Server-side validation and field whitelisting, a mandatory consent checkbox, per-IP rate limiting, atomic file persistence, and public listings that never include the reporter's contact number. Reports stay *pending* until an admin verifies them. | **CROWDSOURCED (unverified until moderated)** |
| **Historical Archive & Backtest** | Historical rainfall archive where available, plus clearly labelled illustrative stage scenarios for selected flood periods; instant RFC-4180 CSV export. | **LIVE ARCHIVE + SIMULATED STAGE** |
| **Operations Center** | Recorded-series trend extrapolation (OLS + Holt + damped Holt) with an illustrative range band and threshold-crossing scenarios (not calibrated probabilities); priority-based shelter allocator with adjustable planning assumptions; custom alert rules stored in the browser with optional Notification API alerts; one-click bilingual SitRep (copy or .md download) that excludes reporter contact details. | **DERIVED & SIMULATED** |
| **Admin Portal** | Server-verified single-admin PIN; protected report moderation; bilingual emergency alert publishing; persistent warning/danger threshold overrides; audit trail. | **INTERNAL** |

---

## Data Sources and What Is Real vs Simulated

In accordance with scientific and hackathon ethics, every data stream in this application is explicitly categorized:

### 1. Live Data (Operational APIs)
- **Precipitation**: Hourly precipitation rates and 24-hour accumulations from the Open-Meteo Free Weather API for Sylhet (24.8949, 91.8687), Sunamganj (25.0658, 91.4073), and the Cherrapunji catchment (25.27, 91.73). Cached for 10 minutes.
- **River Discharge (GloFAS)**: Daily modelled discharge and seasonal mean comparisons from the Open-Meteo Flood API. This is a roughly 5 km grid-cell estimate, not a local river-gauge observation; the nearest grid cell may not represent the intended river. Missing values are shown as unavailable, not replaced with invented measurements.
- **Historical Rainfall Archive**: Hourly precipitation records for selected historical dates fetched from the Open-Meteo Archive API when available. Historical river-stage traces in the backtest are illustrative scenarios, not recovered BWDB observations.

### 2. Derived Data (Statistical & Physical Models)
- **48-Hour Regression Hydrographs**: Computed via ordinary least squares (OLS) linear regression over the station series available to the app. Because the app has no live BWDB gauge adapter, these stage series are simulated/reference inputs, not measured observations.
- **Flood Risk Classification**: Algorithmic multi-factor index combining river stage deltas vs Danger Mark, rainfall rates, crest velocity, and catchment influx.
- **Waterborne Disease Risk Index**: A transparent heuristic calculated from flood risk scores, days of standing water, displaced populations, and shelter crowding. Weights are hand-set, not fitted to surveillance data and not clinically validated.

### 3. Simulated Data (Calibrated Benchmarks)
- **Station Water Levels**: River gauge elevations are calibrated against real Bangladesh Water Development Board (BWDB) benchmark danger marks (e.g., Sylhet SW267 at 10.95m, Sunamganj SW268 at 8.25m, Chhatak SW269 at 21.30m) reflecting historic flood peaks.
- **Shelter Medical Stock**: Sample inventory counts of ORS sachets, water purification tablets, and first-aid kits are simulated to demonstrate emergency health logistics workflows.

---

## Run Locally

### Prerequisites
- Node.js 22.13 or higher (the Operations Center uses built-in `node:sqlite`; Node 22 marks this API experimental)
- npm

### 1. Clone and install
```bash
git clone https://github.com/fahim1252375-maker/floodguard-ai-fullstack.git
cd floodguard-ai-fullstack
npm ci
```

### 2. Configure environment
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Set your configuration:
```env
# Optional for Gemini-powered chat and prediction explanations (health safety content is fixed server-side)
GEMINI_API_KEY="your-gemini-api-key"

# Optional: Gemini model override (default shown)
GEMINI_MODEL="models/gemini-2.5-flash"

# Optional: Master PIN for the Admin portal.
# If omitted or left blank in development, the server generates an ephemeral random 6-digit PIN and logs it to the terminal. Production requires a private 6-128 character value.
ADMIN_PIN=""

PORT=3000
NODE_ENV=development
# TRUST_PROXY=true   # only when deployed behind one trusted reverse proxy
```

### 3. Start the application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Run test suite
```bash
npm run test
```
`npm run test` runs the Vitest suite. `npm run test:server` runs Node's built-in test runner for backend tests. `npm run test:all` runs both suites.

### 5. Check types and build
```bash
npm run lint    # runs tsc --noEmit
npm run build   # builds Vite production bundle
```

---

## Deployment

FloodGuard AI is a full-stack app: the Express server proxies Open-Meteo/GloFAS, calls Gemini, stores community reports and enforces the admin PIN. A static-only host (for example plain Netlify or GitHub Pages) serves the UI but **not** these `/api` routes, so there the live feeds, AI features and report persistence fall back to baselines or run in-browser only, and the interface labels them as such. To run everything live, deploy the Node server (Render, Railway, Cloud Run or any Node host):

```bash
npm ci
npm run build          # builds the Vite bundle into dist/
NODE_ENV=production PORT=8080 npm start
```

Set `GEMINI_API_KEY` and `ADMIN_PIN` as environment variables on the host (never commit them). `npm start` uses `tsx`, so install dev dependencies on the host. Report data is written to `data/reports.json`, which is git-ignored and may be wiped on hosts with ephemeral disks.

## Local Setup and First Run

### Requirements
- Node.js **22.13 or newer** (Node 24 LTS is also suitable). The Operations Center uses Node's built-in `node:sqlite`; on Node 22 this API is still marked experimental by Node.js.
- npm and an internet connection for the initial package installation.

### Install and start

```bash
node -v
npm ci
cp .env.example .env
# Edit .env: add GEMINI_API_KEY if you want Gemini-powered chat/prediction.
# In development, leave ADMIN_PIN empty to get a random PIN printed in the terminal.
npm run dev
```

Open the local URL printed by Vite/Express. Keep the terminal open: it shows the development Admin PIN when one is generated. In the app, open Operations Center and Admin Portal to test citizen check-ins, alert subscriptions, responder workflows, report moderation, alert publishing, and station threshold settings.

### Quality checks

```bash
npm run test:all
npm run lint
npm run build
```

A successful start is not a substitute for the full test, type-check and production-build commands. If package installation fails, check network/DNS access to the npm registry and retry `npm ci`.

### Production settings

- Set `NODE_ENV=production`, `ADMIN_PIN` (a unique private value of 6-128 characters), and `GEMINI_API_KEY` where applicable.
- Set `OPS_SEED_DEMO=false` so demo history is not mixed into monitoring history.
- Mount a persistent disk for `data/`; set `OPS_DB_PATH` if the disk is mounted elsewhere. Back up SQLite plus the two JSON persistence files.
- Configure `NOTIFY_WEBHOOK_URL` only when a compatible SMS gateway adapter exists. Without an adapter, SMS jobs remain queued in the outbox; no SMS is sent by the app itself.
- Use a Node-capable host. Static-only hosting (for example, GitHub Pages) cannot run the Express APIs or persist reports.

## Privacy

- Community reports require an explicit consent checkbox; the server rejects reports without it.
- The reporter's name, area and observations are shown publicly as unverified; the optional contact number is stored for verification only and is never returned by the public API.
- Reports are not forwarded to any government office. In an emergency call 999 or 16263.

## Offline Behaviour

The app registers a service worker that pre-caches the app shell and keeps recently loaded assets and telemetry responses, so screens that were already opened can still load without a connection. Live weather, river discharge, Gemini chat/prediction, and server report submission need connectivity; when unreachable they show baseline or *simulated* data with a label. This is a resilience aid, not a guarantee of full offline operation.

## Limitations

- **Demo Data**: River gauge levels, shelter stocks and clinic road status are simulated demo benchmarks; community reports in the demo may include fictional seed records plus anything submitted to your own server. Rate limiting is in-memory and per instance; admin access is a single shared PIN, not a multi-user identity/role system.
- **Prototype Scope**: FloodGuard AI is an academic and technology prototype created for disaster and healthcare resilience research. It does not replace statutory directives from Bangladesh civil authorities.
- **Statutory Authority**: In Bangladesh, official flood bulletins, red alerts, and evacuation mandates legally originate exclusively from the Flood Forecasting and Warning Centre (FFWC) under the Bangladesh Water Development Board (BWDB) and the Ministry of Disaster Management and Relief (MoDMR).
- **Medical Disclaimer**: Fixed first-response tips are educational guidance, not diagnosis or treatment. In a medical emergency, contact **16263** (DGHS Shastho Batayan) or **999**; for disaster early warnings call **1090**.

---

## AI-Use Disclosure

FloodGuard AI uses Gemini at runtime for selected conversational and prediction-summary features when configured. AI-assisted development tools were also used during implementation. Contributors should review, test, and disclose AI assistance in line with their event or institution's rules; no claim is made that the source is entirely human-written.


---

## Operations Center (full-stack): how it works and its limits

**Requires Node 22.13+** (uses the built-in `node:sqlite`, so there is no native database driver to install).

### Architecture
```
React views (src/views/OpsCenterView.tsx + src/components/ops/*)
   |  fetch + Server-Sent Events (/api/ops/stream)
Express router  (server/opsRouter.ts)  ->  validation, rate limits, PIN-protected admin routes
   |
Monitoring engine (server/engine.ts)   ->  every 15 min: record readings, evaluate rules, create events, queue SMS
   |
SQLite  (data/floodguard.db)           ->  readings, alert_events, subscribers, notifications, checkins, sitreps, audit_log
```

### What each audience gets
- **Citizen:** a plain-language green/amber/red status for their area with what-to-do steps and helplines; one-tap *I'm safe / I need help* check-ins; alert subscriptions (browser or SMS queue) with one-click unsubscribe-and-delete; a live alert feed.
- **Responder (Admin PIN):** help-request queue with call links, acknowledge alerts, SMS outbox (manual or webhook), SitRep archive, audit log; recorded-data ensemble forecast; shelter allocator that adds live check-in demand; custom alert rules.

### API (`/api/ops`)
Public: `GET /overview`, `/events`, `/readings/:id`, `/forecast/:id`, `/checkins/summary`, `/stream` (SSE); `POST /checkins`, `/subscribers` (consent required, rate limited). Token-scoped (header `x-ops-token`): `GET|DELETE /subscribers/me`, `POST /checkins/mine/resolve`, `DELETE /checkins/mine`. Admin (`x-admin-pin`): `/checkins`, `/checkins/:id/resolve`, `/outbox`, `/outbox/:id/sent`, `/outbox/flush`, `/events/:id/ack`, `/sitreps`, `/audit`, `POST /cycle`.

### Honest limits
- **Station values are simulated/calibrated** unless a live gauge feed is wired in; recorded history is only as real as its source. On an empty database the server seeds 48h of history marked `demo_seed`, and the forecast UI says so. Set `OPS_SEED_DEMO=false` in production.
- **The ensemble forecast** (OLS + Holt + damped Holt, illustrative model range band) is statistical extrapolation, not a hydrodynamic model or a calibrated probability forecast. It cannot anticipate new rainfall, dam releases or embankment failure.
- **No SMS is sent by this server by itself.** Alerts for SMS subscribers go to an outbox; they are sent only if you set `NOTIFY_WEBHOOK_URL` to a gateway adapter or a responder sends them manually.
- **Check-ins are self-reported and unverified.** Public views show totals only; phone numbers and notes are visible to responders only; people can delete their own check-in or subscription.
- **Shelter capacities and evacuation shares are adjustable planning assumptions**, not surveyed figures.
- Community reports and broadcast alerts use atomic JSON files (`data/reports.json`, `data/alerts.json`); the Operations Center uses SQLite (`data/floodguard.db`). Back up both stores.
- Always defer to official BWDB/FFWC bulletins and local disaster management officials.

### Tests
`npm run test:server` runs the backend suite (database, engine cooldown/escalation, outbox, privacy, validation, route handlers) with `node --test`. `npm run test:all` runs everything.

<!-- Project README: FloodGuard AI -->

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B253A,45:0F766E,100:2563EB&height=190&section=header&text=FloodGuard%20AI&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=Predict%20Early.%20Prepare%20Together.&descAlignY=62&descSize=15" alt="FloodGuard AI — Predict Early. Prepare Together." />
</p>

<p align="center">
  <strong>A bilingual flood and community-health preparedness prototype for north-eastern Bangladesh.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-0F766E?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.13-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 22.13 or newer" />
  <img src="https://img.shields.io/badge/Interface-English%20%2B%20Bangla-2563EB?style=flat-square" alt="English and Bangla" />
  <img src="https://img.shields.io/badge/Status-Research%20%2F%20Demo%20Prototype-D97706?style=flat-square" alt="Research and demo prototype" />
</p>

<p align="center">
  <a href="./START_HERE_BN.md">বাংলা Setup Guide</a> ·
  <a href="./docs/ARCHITECTURE_AND_FEATURES.md">Architecture</a> ·
  <a href="./docs/QUALITY_REVIEW.md">Quality Review</a> ·
  <a href="./submission/DEVPOST_SUBMISSION.md">Project Summary</a>
</p>

---

## Overview

FloodGuard AI explores how weather context, transparent risk indicators, and preparedness workflows can be brought together for flood-prone communities in the Sylhet–Sunamganj haor region.

The project is designed as a **decision-support and demonstration prototype**. It is not an official flood-warning service and must not be used as the sole basis for evacuation, medical, or emergency decisions.

**Project principle:** distinguish operational API responses, derived model outputs, and simulated demonstration records so users can see what is measured, estimated, or illustrative.

## Problem Context

Communities in north-eastern Bangladesh can face rapidly changing flood conditions, disrupted transport, contaminated water, and reduced access to health services. A useful preparedness interface needs to communicate uncertainty, practical preparation steps, and the provenance of the information it displays—not just show a risk score.

FloodGuard AI is a student-built exploration of that problem. Its indicators are intended for learning, discussion, and further validation, not as a substitute for the Bangladesh Water Development Board's Flood Forecasting and Warning Centre (FFWC), local authorities, or qualified health professionals.

## Capabilities

| Area | What the prototype includes |
|---|---|
| Weather and upstream context | Weather and modelled hydrological context from configured Open-Meteo endpoints, including Flood / GloFAS data where available |
| Water-level scenarios | Trend-based scenario estimates from a reference series; the bundled station series is not a live BWDB gauge feed |
| Flood-health preparedness | Upazila-oriented heuristic indicators for risks that can increase during prolonged flooding; these are not disease surveillance or validated outbreak forecasts |
| Family preparedness | Bilingual safety planning, household-needs checklist, emergency contacts, and printable/shareable plans |
| Shelter and clinic planning | Demonstration shelter-stock and access-corridor views; values must be checked against verified local information |
| Community reports | Consent-based report submission with moderation before public display |
| Operations Center | Check-ins, alert rules, responder workflows, event stream, audit history, and an SMS outbox |
| AI-assisted interaction | Optional Gemini-powered explanations and chat; deterministic safety guidance remains separate from generative output |
| Resilient interface | English/Bangla UI and a PWA shell for previously loaded app assets |

Feature availability depends on local configuration and backend connectivity. See the architecture and quality-review documents for implementation details and known gaps.

## Data Provenance

FloodGuard uses three distinct kinds of information:

1. **Operational API data** — responses from configured third-party weather and hydrological APIs. Availability, coverage, latency, and model assumptions remain dependent on those providers.
2. **Derived indicators** — calculations or trend estimates produced from supplied inputs and reference series. These are model outputs, not direct gauge measurements.
3. **Simulated or illustrative records** — seeded river history, shelter inventories, clinic-road status, and other demonstration values used to exercise the interface. They must never be presented as live observations.

The Operations Center can seed example history for demonstration. Set `OPS_SEED_DEMO=false` in production and use a persistent data volume. The repository's documentation explains the relevant storage files and configuration.

## AI and Safety Boundaries

- Gemini is optional and is used for selected conversational or explanatory features when configured.
- Numerical indicators use application logic and supplied inputs; AI-generated text does not turn heuristic values into calibrated predictions.
- Fixed first-response guidance is provided separately from generative answers.
- No claim is made that FloodGuard predicts disease outbreaks, verifies all local reports, sends emergency alerts to government agencies, or guarantees a safe route.
- SMS messages are queued in an outbox. Delivery requires a compatible gateway adapter or manual responder action; the app does not send SMS by itself.

> **Emergency notice:** follow official FFWC/BWDB bulletins and local disaster-management instructions. For emergencies in Bangladesh, use the appropriate official services, including 999; for health advice, 16263; and for disaster-related warning information, 1090. Do not rely on this prototype for emergency instructions.

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Mapping and visualisation | Leaflet, Recharts |
| Backend | Node.js, Express |
| Persistence | SQLite via Node's built-in `node:sqlite`, plus documented JSON-backed stores |
| AI integration | Google Gemini through `@google/genai` |
| Tests and checks | Vitest, Node.js test runner, TypeScript compiler |

## Run Locally

### Requirements

- Node.js **22.13 or newer**
- npm
- Internet access for initial dependency installation and external API features
- Gemini API key only for optional Gemini-powered features

### Install

```bash
git clone https://github.com/fahim1252375-maker/floodguard-ai.git
cd floodguard-ai
npm ci
cp .env.example .env
```

Edit `.env` as needed:

```env
GEMINI_API_KEY=""
GEMINI_MODEL="models/gemini-2.5-flash"
ADMIN_PIN=""
PORT=3000
NODE_ENV=development
```

- `GEMINI_API_KEY` is optional. Without it, Gemini-backed features are unavailable or use documented fallback behaviour.
- In development, an empty `ADMIN_PIN` causes an ephemeral six-digit PIN to be generated and printed in the terminal.
- In production, configure a private `ADMIN_PIN` of 6–128 characters. Never commit secrets.
- Set `TRUST_PROXY=true` only when the app is behind exactly one trusted reverse proxy.

### Start

```bash
npm run dev
```

Open the local URL printed by the server (normally [http://localhost:3000](http://localhost:3000)).

### Validate

```bash
npm run test:all
npm run lint
npm run build
```

`npm run test:all` runs the Vitest and backend Node.js test suites. `npm run lint` runs the TypeScript compiler with `tsc --noEmit`; it is not an ESLint style check.

For a Bangla-first walkthrough, see [START_HERE_BN.md](./START_HERE_BN.md).

## Deployment Notes

FloodGuard is a full-stack application: Express handles API routes, external API requests, report handling, and Operations Center workflows. A static-only host can serve a frontend bundle but cannot run these server-side features.

For a Node-capable host:

```bash
npm ci
npm run build
NODE_ENV=production PORT=8080 npm start
```

Before production use:

- Configure a private `ADMIN_PIN` and any required API keys in the host's secret manager.
- Set `OPS_SEED_DEMO=false`; do not mix demonstration history with operational records.
- Mount persistent storage for the `data/` directory and back up SQLite and JSON persistence files.
- Configure `NOTIFY_WEBHOOK_URL` only when a compatible SMS gateway adapter is available.
- Verify proxy settings, rate limits, access controls, and data retention for the actual hosting environment.

A successful local start does not establish that a deployment is live, production-ready, or connected to authoritative local sensors.

## Repository Guide

- [`src/`](./src/) — React application and UI components
- [`server.ts`](./server.ts) and [`server/`](./server/) — Express entry point and backend modules
- [`data/`](./data/) — runtime data location; operational data should not be committed
- [`docs/ARCHITECTURE_AND_FEATURES.md`](./docs/ARCHITECTURE_AND_FEATURES.md) — architecture and feature details
- [`docs/COMBINATION_RELEASE_REPORT.md`](./docs/COMBINATION_RELEASE_REPORT.md) — release notes and consolidation report
- [`docs/QUALITY_REVIEW.md`](./docs/QUALITY_REVIEW.md) — current quality review
- [`submission/`](./submission/) — project and demonstration material

## Privacy and Security

- Community report submission requires consent.
- Public report information is unverified and must not be treated as an official incident record.
- Optional contact details are not returned by the public reports API, according to the project documentation.
- Do not commit API keys, admin PINs, personal data, or private operational records.
- Review the hosting environment, persistence, and access controls before handling real community information.

## Limitations

- Several station, shelter, road-access, and health-preparedness values are simulated or illustrative.
- The trend-based water-level scenario is not a hydrodynamic forecast and cannot account for all changing conditions.
- Health indices are heuristic planning indicators, not clinically validated predictions or disease surveillance.
- Community check-ins and reports are self-reported and may be incomplete or inaccurate.
- The SMS outbox is not proof of message delivery.
- Offline support covers previously cached app assets; live feeds, server actions, and AI features require connectivity.

## Development and AI Disclosure

AI tools may assist with brainstorming, debugging, implementation support, and documentation. Contributors remain responsible for understanding, reviewing, and testing submitted work. Disclose AI assistance when required by an event, institution, or contribution policy. Do not claim that AI-assisted code was written unaided or that unverified behaviour has been tested.

## License

This repository is distributed under the [MIT License](./LICENSE).

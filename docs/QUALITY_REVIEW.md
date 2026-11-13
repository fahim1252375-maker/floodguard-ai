# FloodGuard AI — Quality Review and Release Notes

Updated: 11 November 2026

## What changed in this review

### Security and administration
- Admin PIN configuration is validated (6–32 characters); production refuses to start without an explicitly configured PIN. The `.env.example` Gemini key is blank by default so a placeholder string is never sent as a credential.
- PIN verification uses a constant-time comparison after checking byte lengths and rate-limits failed attempts by client IP.
- A failed network request is not treated as successful authentication.
- Report moderation, alert publishing, and station-threshold changes require a valid `x-admin-pin` header on the server.
- Public report verification controls were removed; reporter-supplied data cannot set `status` or `verifiedBy`.
- Alert creation now uses a server-side whitelist, bounded text fields, severity/district/population validation, a server-generated timestamp and a server-owned source label.
- A single shared administrator PIN is still used. This is not a multi-user login, role hierarchy, or identity-management system.
- `TRUST_PROXY` defaults to false. Set it to true only when Express is behind exactly one trusted reverse proxy.

### Persistence and Operations Center
- Added `station_thresholds` SQLite table with update timestamps and actor metadata.
- Warning and danger marks can be edited independently, persist across restarts, and are applied to monitoring/forecast computations.
- Operations Center keeps its existing check-in, subscriber consent, outbox, SSE event stream, SitRep, alert-rule, ensemble forecast and audit-log workflows.
- Atomic JSON writes for community reports and public alerts are now serialized per file to prevent near-simultaneous updates from racing during rename.
- Reports and alerts are stored in JSON files; Operations Center records are stored in SQLite. Back up both storage formats.

### Data, time and public-health safety
- Open-Meteo weather hourly labels are compared against the `Asia/Dhaka` clock. The request includes `past_days=1` so a rolling 24-hour window can be assembled.
- Open-Meteo Flood API requests explicitly use `timezone=GMT` and `cell_selection=land`; date labels are preserved in the model's daily time basis.
- GloFAS is a daily, approximately 5 km grid-cell discharge estimate, not a local river-gauge observation. The closest river may not be represented by the selected grid cell. Missing values remain unavailable rather than becoming invented measurements.
- Safety-critical ORS and water-treatment guidance is fixed bilingual server content. A generative model cannot rewrite the dose or water-treatment instruction.
- If no commercial ORS sachet is available, the fallback text uses 6 level teaspoons of sugar and 1/2 level teaspoon of salt in 1 litre of safe water. An ORS packet must always be mixed with the volume printed on that packet. Water purification products must be used by their own label instructions.
- Emergency contacts surfaced in the app include 999 (national emergency), 1090 (disaster helpline) and 16263 (health helpline); confirm current details with official agencies before public deployment.

## Verification performed in this environment

- Node runtime: v22.16.0; built-in `node:sqlite` worked and emitted its experimental warning.
- TypeScript syntax scan: 117 `.ts` / `.tsx` files parsed with zero syntax diagnostics using the globally installed TypeScript transpiler (syntax/transpile check only; not a full semantic type-check).
- Fresh dependency-free test run: 97/97 Node test cases passed across the native Node test files that do not require the unavailable npm packages. Coverage includes Admin PIN checks, report validation/privacy, atomic persistence, live-weather-versus-demo-stage provenance, weather time-zone selection, GloFAS missing-value handling, flood/health calculations, ensemble forecasts, Operations Center engine cycles and SQLite threshold persistence.
- The concurrency regression test writes 25 successive JSON updates and verifies the last submitted state remains on disk.

## Verification that remains outstanding

The npm package registry did not become reachable from the build environment: `npm ping` returned `EAI_AGAIN` DNS resolution failure and repeated `npm ci` attempts timed out before completing. The npm cache was empty at the start of this retry. Therefore the following were **not** verified here:

- `npm run test:all` including Vitest suites and Express router integration tests;
- `npm run lint` full TypeScript semantic type-check;
- `npm run build` Vite production bundle;
- full browser click-through with a locally installed dependency tree.

Run these commands after `npm ci` succeeds on your computer. Do not describe the project as fully build-verified until all three complete successfully.

## Known limits to disclose in a demo or submission

- River stage values, shelter stock, and many clinic-road conditions are simulated/calibrated demo inputs, not live BWDB sensor readings.
- GloFAS discharge is a model estimate and grid-cell selection can miss the intended river.
- Health-risk scores are hand-weighted planning indicators, not clinically validated outbreak predictions.
- The forecast engine extrapolates recorded values; it is not a hydrodynamic model and cannot anticipate every embankment breach, dam release or new rainfall event.
- Community reports are user-submitted and remain unverified until an authorized administrator reviews them.
- SMS is queued in an outbox. Actual sending requires a compatible, configured gateway adapter; the app does not connect directly to government SMS/IVR systems.
- The PIN is a shared administrator secret, not per-person authentication. Rate limiting is in-memory and per app instance.
- `node:sqlite` is available without a native add-on in Node 22.13+, but Node 22 reports it as experimental; keep backups and test persistence on the intended host.
- A persistent disk is required for `data/` on deployment. Set `OPS_SEED_DEMO=false` for production.

## Authoritative references used for this review

- Open-Meteo Flood API documentation: https://open-meteo.com/en/docs/flood-api
- Open-Meteo Weather API documentation: https://open-meteo.com/en/docs
- Node.js SQLite documentation: https://nodejs.org/api/sqlite.html
- Bangladesh DGHS: https://dghs.gov.bd/
- Bangladesh Department of Disaster Management AWARE: https://rapid.ddm.gov.bd/
- CDC emergency drinking-water guidance: https://www.cdc.gov/water-emergency/about/index.html

## AI-use transparency

Gemini is used at runtime for selected chat and prediction-language features when configured. Safety-critical ORS/water instructions are fixed application text. AI-assisted development tools were also used during implementation. This release does not claim to be entirely human-written or to evade AI-detection systems.

## First-run guide and submission files

- `START_HERE_BN.md` provides the Bengali local setup and first-run checklist.
- `submission/quick-start-bn.pdf` is a separately rendered, four-page Bengali quick-start guide; it is not a hackathon-required submission artifact.
- `submission/one-page-description.pdf` and `submission/code.pdf` were regenerated from this reviewed source tree. The source PDF excludes the long quick-start guide; use the Markdown/PDF guide alongside it.

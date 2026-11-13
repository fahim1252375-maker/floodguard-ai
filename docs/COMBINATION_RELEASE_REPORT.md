# FloodGuard AI — Combination & Release Report

**Prepared:** 13 November 2026
**Inputs:** `FloodGuard_AI_Updated_Release.zip` and `floodguard-ai-fullstackm.zip`

## Consolidation decision

Both archives contain the same `floodguard-ai-fullstack/` application and the same overall module set. The updated-release archive contains 147 files; the earlier full-stack archive contains 142. Every path in the earlier archive is present in the updated release, while the updated release adds Bengali setup/release documentation and quality-review material.

The updated release was therefore selected as the merge base. Files that differ between the two archives were not blindly copied from the older archive: the newer versions include important corrections to data provenance, simulated-alert labeling, model-output wording, backend authorization, request validation, report privacy and persistence handling. Reverting those changes would make the demo less safe and less scientifically honest.

## Integrated feature set

The unified application includes 20 lazy-loaded views: Landing, Dashboard, Prediction, Simulator, Map, Assistant, Early Warning, Community Reports, Historical Archive, Admin, About, Basin Twin, Evidence Fusion, Impact Lens, RouteSafe, Resilience Planner, Satellite, Global Coverage, Health Watch and Operations Center.

The combined product brings together these major capability groups:

1. **Flood intelligence:** weather context, modelled discharge, trend analysis, scenario simulation, historical rainfall context and an illustrative basin graph.
2. **Flood-to-health preparedness:** hand-weighted health-risk indicators, shelter medical-readiness planning, bilingual preparedness guidance and clinic-access scenarios.
3. **Community and operations:** consent-based field reports, server-side moderation, citizen check-ins, alert subscriptions, event streaming, responder workflows, a SQLite-backed operations engine, SitRep generation and a queued-notification outbox.
4. **Evidence and resilience:** data-provenance labels, explainability screens, CSV exports, bilingual UI, service-worker caching and PWA installation support.

## Release polish added in this package

- Rebranded page title, Open Graph metadata, navigation labels, key module badges and PWA manifest so the product is not tied to one hackathon.
- Replaced hard-coded MAE/RMSE/bias/R² values in the June 2022 historical scenario panel with actual scenario-input/output summaries. The panel now explicitly states that forecast-accuracy metrics are unavailable because the synthetic stage trace is not paired with observed BWDB gauge measurements.
- Fixed an Operations Center router test that reused an IP after the test had intentionally triggered the admin rate limit; valid-admin test requests now use isolated test IPs.
- Added a clear combined-project overview to the README, a judge-facing architecture/feature map and Devpost-ready copy/demo guidance.
- Preserved the Bengali first-run guide, source snapshot and existing submission resources.

## Important verification boundary

This environment has no installed project dependencies and a clean npm install was not run. A TypeScript/TSX syntax-transpile scan completed for 117 files with zero syntax diagnostics. The two Node-native backend test files completed 16/16 test cases using Node's built-in runner, TypeScript transpilation and a lightweight Express Router test adapter. This validates the backend test logic but is not a substitute for running the project with the actual Express dependency installed. The Vitest frontend suites, full semantic TypeScript type-check, Vite production build and browser click-through were **not** verified in this environment. Run `npm ci`, `npm run test:all`, `npm run lint` and `npm run build` as documented in `START_HERE_BN.md` before describing the project as fully build-verified.

## Ethical and scientific constraints retained

- Open-Meteo precipitation can be live; GloFAS discharge is a gridded model estimate, not a local gauge observation.
- This release does not connect a live BWDB river-stage sensor feed. Station stages, selected shelter inventory, road conditions, satellite content and evidence-ledger examples are simulated/reference data.
- Health-risk indicators are hand-weighted planning heuristics, not clinically validated disease forecasts.
- Trend projections are statistical extrapolations, not a calibrated hydrodynamic forecast.
- Community reports are unverified until moderated. Reporter contact details must not be exposed publicly.
- SMS messages remain queued unless a compatible gateway adapter is configured.
- The application does not replace official FFWC/BWDB/DDM instructions or professional medical care.

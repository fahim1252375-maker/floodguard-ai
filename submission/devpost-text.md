# Devpost Submission Text — FloodGuard AI

**Hackathon:** DSH Hacks V2
**Theme:** AI x Healthcare
**Tagline:** Floods become health crises. We estimate health risks to support earlier preparation.

---

### Project Title
**FloodGuard AI — Flood Health Preparedness & Response Planning for Bangladesh**

---

### Inspiration
In north-eastern Bangladesh (the Sylhet and Sunamganj haor basin), monsoonal flash floods are an annual reality. In June 2022, torrential downpours in Cherrapunji, India (972 mm in 24 hours, per the India Meteorological Department) contributed to severe flooding across the Surma–Kushiyara basin. The IFRC reported that around 94% of Sunamganj town and 84% of Sylhet district were submerged, and estimated that 7.2 million people were affected across nine north-eastern districts.

Yet the primary loss of life and prolonged suffering during floods does not stem solely from rising water—it stems from the subsequent **public health collapse**. When floodwaters stagnate in saucer-shaped haor depressions, shallow tube wells and pit latrines are submerged. Contaminated water triggers massive outbreaks of acute diarrhoea, cholera, typhoid, and waterlogged dermatitis, while stranded venomous snakes seek refuge in homes and shelters. Crucially, rural health facilities and Upazila Health Complexes become inaccessible just as disease strikes.

We built **FloodGuard AI** as a research prototype that connects flood-related indicators with community health preparedness and response logistics. Its risk scores and forecasts are decision-support estimates, not official forecasts or validated outbreak predictions.

---

### What It Does
FloodGuard AI is a bilingual full-stack research/demo prototype that connects weather data, modelled hydrological estimates and healthcare-readiness workflows:

1. **Flood Health Watch & Disease Vulnerability Index:** A transparent, hand-weighted heuristic index (not clinically validated, not fitted to surveillance data) that models location-specific disease risks across four key vectors: Acute Diarrhoea & Cholera, Enteric Typhoid Fever, Waterlogged Dermatitis, and Snakebite Envenomation, with a 48-hour statistical projection horizon.
2. **Medical Preposition Planner:** Audits sample medical inventories across regional shelters, estimating supply deficits for Oral Rehydration Salts (ORS sachets), chlorine water purification tablets, and antivenom vials based on projected displacement numbers and adjustable planning assumptions.
3. **RouteSafe GIS & Clinic Access Corridors:** Shows modeled accessibility of rural community clinics and upazila hospitals (demo data), flagging corridors as Passable, Waterlogged, or Cut-Off (requiring motorized country boats).
4. **BasinTwin Directed Graph:** Models the hydraulic travel lag (illustrative travel-lag assumptions) as runoff moves through transboundary river chutes (Sari-Gowain, Upper Surma, Jadukata) into downstream haor sinks.
5. **Dual-Layer Resilient AI & OLS Predictor:** Uses Ordinary Least Squares (OLS) and ensemble methods to extrapolate recorded water-level trends over a 48-hour horizon. Gemini can produce natural-language summaries; short Bangla SMS drafts are prepared for an outbox workflow, not sent directly by the app.
6. **Community Ground-Truth & Admin Verification:** Allows villagers and field workers to submit georeferenced flood and road condition reports with atomic disk persistence, with server-side validation, a mandatory consent checkbox, per-IP rate limiting, and an administrator moderation workflow protected by a PIN. Contact numbers are never shown publicly.
7. **Operations Center (full-stack):** A SQLite-backed monitoring engine records every station on a schedule, applies alert rules with cooldown/escalation, and streams events live (Server-Sent Events). Citizens get a plain-language green/amber/red status, a one-tap safe check-in and alert subscriptions with delete-my-data; responders get a help-request queue, SMS outbox, SitRep archive, audit log, a recorded-data ensemble forecast (80% band) and a shelter allocator that includes live check-in demand. Public views show totals only and no SMS is sent without a configured gateway.
8. **Resilience & Bilingual Support:** English and Bangla (বাংলা) interface for the main views and alerts, plus an installable Progressive Web App whose service worker caches the app shell and recently loaded data so previously opened screens still load on a weak connection.

---

### How We Built It
- **Frontend:** React 19 SPA built with Vite 8, TypeScript, and Tailwind CSS 4, utilizing Lucide icons and Recharts for interactive hydrographs.
- **Backend & Proxy:** Express.js server proxies Open-Meteo weather and Flood API requests, validates user submissions, rate-limits sensitive endpoints, and persists community reports and alerts atomically. Operations records use SQLite.
- **AI Integration:** Google Gemini API (`models/gemini-2.5-flash`) executing structured diagnostic analysis, bilingual conversational responses and hydrological advisory summaries; safety-critical ORS and water-treatment content is fixed text, not generated.
- **Hydrological & Epidemiological Modeling:** Deterministic OLS linear regression for water stage velocity, Dijkstra routing for basin travel lag, and transparent hand-weighted heuristic formulas for the disease indices.

---

### Challenges We Faced
1. **Transboundary Data Silos:** Upstream rainfall occurs in India (Meghalaya), while impacts occur in Bangladesh. Combining upstream weather data with local benchmark thresholds creates a useful situational picture, but does not establish a guaranteed river travel time.
2. **Resilience During Blackouts:** When severe floods hit haor regions, cellular towers and power grids often fail. We designed FloodGuard AI with dual-layer architecture: cloud-powered Gemini API for rich analysis when connected, backed by deterministic rule engines and a cached app shell when the connection drops.
3. **Preventing Hallucinations:** AI in emergency management can be wrong, so safety-critical ORS and water-treatment instructions are fixed server-side content. Gemini is used only for selected natural-language summaries and chat; it is not the source of hydrological measurements or medical treatment instructions.

---

### Accomplishments We're Proud Of
- Building a connected flood-health preparedness prototype that translates risk indicators into illustrative medical-logistics planning needs (ORS sachets, water purification tablets) rather than just abstract water levels.
- Automated regression coverage for flood and health calculations, forecasting, report validation/privacy, persistence, Admin PIN handling, and SQLite Operations Center workflows.
- English and Bangla coverage of the main views, alerts and SMS drafts, written with Bangla-speaking users in mind.
- Clear data provenance labels distinguishing LIVE API responses, DERIVED estimates and SIMULATED demo benchmarks.

---

### What We Learned
- Early warning without prepositioning is insufficient. A planning prototype is most useful when it connects risk indicators with supply gaps and clinic access, while making its assumptions visible.
- Deterministic models and Large Language Models are complementary: statistical regression provides rock-solid numerical boundaries, while Gemini provides empathetic, culturally accessible communication for rural populations.

---

### What's Next for FloodGuard AI
- Integrating low-bandwidth SMS/IVR gateways directly with the 1090 and 16263 national telecommunication backbones.
- Collaborating with local Upazila Disaster Management Committees (UDMC) and humanitarian NGOs in Sunamganj to field-test the Preposition Planner during the 2027 pre-monsoon flash flood season.
- Exploring edge-based hydrological sensor mesh networks deployed along transboundary river ingress points.

---

### Built With (Tags)
`typescript`, `react`, `tailwindcss`, `vite`, `express`, `gemini-api`, `leaflet`, `recharts`, `vitest`, `pwa`, `healthcare`, `disaster-response`

---

### AI Use Disclosure
Google Gemini API (`models/gemini-2.5-flash`) is used for selected natural-language diagnostics under `/api/predict-ai` and conversational responses under `/api/chat`. Safety-critical ORS and water-treatment instructions are fixed server-side text and are not generated by Gemini. AI-assisted development tools were also used during implementation; generated code and technical claims should be reviewed and tested by the project maintainers before operational use.

---

### Data Sources & Attributions
- **Open-Meteo Weather API:** Hourly precipitation data and numerical outlooks for Sylhet, Sunamganj, and Cherrapunji; API output depends on the selected forecast model and time window.
- **Open-Meteo Flood API (Copernicus GloFAS):** Daily modelled discharge estimates from approximately 5 km grid cells, not local gauge telemetry; grid-cell river selection can be imperfect.
- **Bangladesh Water Development Board (BWDB) & FFWC:** Historical danger level thresholds and 2022 deluge benchmark datums.
- **Public-health background (ICDDR,B, WHO):** General context on monsoon-season waterborne disease. No surveillance dataset is ingested or fitted; disease scores are a heuristic.
- **Planning assumptions:** Daily ORS, tablet and water quantities in the Preposition Planner are adjustable sliders, not official standards; verify against current DGHS/WHO/Sphere guidance before operational use.

---

### Limitations Statement
Station river stages, shelter inventory stocks and some clinic-road conditions in this demonstration release are simulated demo inputs, not live BWDB sensor or surveyed inventory data. Community reports submitted in the demo are stored on the demo server only, shown as unverified, and are not forwarded to any authority. FloodGuard AI is a research/demo decision-support prototype; it does not replace statutory disaster warnings issued by the Flood Forecasting and Warning Centre (FFWC/BWDB) or official medical diagnoses from licensed healthcare practitioners.

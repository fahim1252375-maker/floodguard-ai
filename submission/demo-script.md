# FloodGuard AI — Demo Video Script & Shot List (DSH Hacks V2)

**Track:** AI x Healthcare
**Target Duration:** 2:45 – 3:00 minutes
**Tone:** Urgent, scientifically grounded, empathetic, honest
**Voiceover Language:** English (Clear, steady cadence; optional Bangla captions)

---

## Technical Recording Checklist
- [ ] Display resolution: 1920x1080 (1080p, 60fps or 30fps)
- [ ] Browser window: Fullscreen, clean address bar, zoom set to 100%
- [ ] Environment: record against the full-stack server (`npm run dev` locally, or a Node deployment such as Cloud Run), not a static-only build, so the LIVE labels are genuinely live
- [ ] Clean state: No open inspect tools, no secret tokens or `.env` files shown
- [ ] Audio check: USB condenser mic or clear headset, test audio levels (-6dB to -3dB peak)

---

## Detailed Video Flow & Shot List

### [0:00 – 0:25] ACT I: The Crisis Hook (Problem Definition)
- **On Screen:** Start on the landing hero section showing the title: *"Floods become health crises. We estimate health risks to support earlier preparation."* Scroll smoothly down to the **Cause-to-Effect Chain** (Cherrapunji rainfall → River Crest → Standing Water → Disease Surge → Clinic Access Cut).
- **Narration:**
  > "Every monsoon, millions in Bangladesh's Sylhet and Sunamganj haor basin face catastrophic flash floods triggered by extreme rainfall in the upstream Meghalaya hills. Runoff from the Meghalaya hills can rapidly raise levels in the Surma and Kushiyara river systems, but travel time varies by storm and basin conditions. Flooding can contaminate water sources and disrupt access to healthcare just when communities need it most. I'm presenting FloodGuard AI — predictive health intelligence for monsoonal flood emergencies."

### [0:25 – 1:00] ACT II: Real-Time Intelligence & Basin Health Radar
- **On Screen:** Click **"Open live dashboard"** or use the top nav to show **Live Situation Dashboard**. Point out the **Header Signal Strip** showing live Open-Meteo precipitation, modelled GloFAS discharge (when available), and simulated station levels compared with reference danger marks. Do not describe station levels as live BWDB telemetry. Then navigate to **Flood Health Watch**.
- **Narration:**
  > "FloodGuard AI bridges the critical gap between hydrological alerts and frontline healthcare logistics. On our dashboard, hourly precipitation and 7-day forecasts can come from the Open-Meteo API, while GloFAS provides daily modelled discharge estimates when available—not local gauge readings. In our Flood Health Watch view, our hand-weighted planning model combines configured river-stage inputs, standing-water assumptions and displacement estimates into preparedness indicators for waterborne disease and snakebite response. These are not clinically validated outbreak predictions."

### [1:00 – 1:40] ACT III: Preposition Planner, RouteSafe & AI Prediction
- **On Screen:**
  1. Show the **Shelter Medical Readiness Board & Preposition Planner** in HealthWatch. Show the sample stock gaps (ORS sachets, water litres, purification tablets) and explain that inventory values are illustrative demo data.
  2. Switch to **RouteSafe GIS** or **Interactive Map** showing passable vs cut-off clinic roads.
  3. Navigate to **AI Prediction** view. Click **Kanaighat** or **Gowainghat**. Show the 48-hour OLS linear regression forecast curve and the optional Gemini-generated explanation (when an API key is configured), plus the Bangla SMS draft queued for the outbox; the app does not send it automatically.
- **Narration:**
  > "Rather than reacting after villages are isolated, our Shelter Medical Readiness Board calculates illustrative prepositioning gaps — estimating how many thousands of Oral Rehydration Salts and water purification tablets must be stockpiled before access roads flood. Through our RouteSafe module, responders can explore the demo route layer's passable, waterlogged and cut-off states; these are not live road-condition reports. Here in our trend projection view, an ordinary least squares model projects the recorded/demo stage trend over 48 hours; it is not a validated hydrodynamic crest forecast, with optional Gemini-assisted draft wording when configured; messages remain drafts until an authorized operator reviews and sends them through a configured gateway."

### [1:40 – 2:20] ACT IV: BasinTwin Hydrological Graph & Flood Simulator
- **On Screen:** Navigate to **BasinTwin Graph**. Click on upstream and downstream nodes (Meghalaya Catchment → Sarighat → Sylhet Sadar) to show hydraulic lag times and surge pressure. Then navigate to **Simulator**, adjust the rainfall slider, toggle the transboundary deluge, and show the instant shift in disease vulnerability.
- **Narration:**
  > "Our BasinTwin graph is an illustrative scenario: its river connections, travel-lag values and node conditions are fixed example inputs, not a calibrated hydraulic model. The Scenario Simulator lets users vary rainfall assumptions and compare preparedness needs across scenarios."

### [2:20 – 2:40] ACT V: Scientific Honesty & Provenance Disclosure
- **On Screen:** Open the **Data Provenance & Scientific Integrity** panel or the **About & Methodology** view. Point out the clear labels: **LIVE WEATHER, MODEL ESTIMATE, DERIVED, SIMULATED, ASSUMPTION.**
- **Narration:**
  > "Scientific integrity and data honesty are central to FloodGuard AI. We distinguish live weather API responses from modelled GloFAS discharge estimates, derived trend indicators and simulated station, route, shelter and satellite examples. Health indices are hand-weighted preparedness indicators, not validated epidemiological predictions. The June 2022 replay uses historical rainfall where available but a synthetic river-stage response, so it does not establish measured warning lead time. FloodGuard AI provides decision support and never claims to replace statutory warnings or clinical medical diagnosis. Community reports need explicit consent, appear as unverified until moderated, and contact numbers are never shown publicly."

### [2:40 – 3:00] ACT VI: Bilingual Access & Closing
- **On Screen:** Toggle the language button to **BN (বাংলা)**. Show the seamless transition of the UI into natural Bengali. Highlight the emergency hotlines: 16263 (Shastho Batayan), 1090 (Flood IVR), 999 (National Rescue).
- **Narration:**
  > "As an installable app with a cached shell for weak connections and deterministic fallbacks when supported data feeds are unreachable, and an English and Bangla interface, FloodGuard AI helps rural health officers, shelter managers, and families prepare before the water rises. Thank you."

---

## Devpost Video Submission Details
- **Recommended Title:** FloodGuard AI — Flood Health Preparedness and Response Planning for Bangladesh
- **Platform:** YouTube (Unlisted or Public) or Vimeo
- **Video Description:** Add link to the GitHub repository and live web app.

> Historical event-specific checklist from the original DSH Hacks V2 preparation. Verify the current event page and deadline before reusing; do not assume these details apply to a different Devpost event.

# DSH Hacks V2 — Submission Checklist (FloodGuard AI)

Source: https://dsh-hacks-v2.devpost.com/ (checked 9 Nov 2026)

## Deadline (confirm on Devpost today)
- Main page header: **Nov 14, 2026, 11:45 pm PST**.
- The Rules tab still lists "Submission period: June 24 to November 8". The two pages disagree.
  Treat the earlier date as a risk: submit as early as you can, and email the hackathon manager
  (link at the bottom of the Devpost page) to confirm the real cutoff.
- Eligibility: students only, age 13+, member of an educational institution. Companies excluded.

## Required items (all four are listed on Devpost)
| Item | File / action | Status |
| --- | --- | --- |
| Working project with user interaction | Deploy the Node server (see README "Deployment") and paste the live URL | TODO: current footer URL is an AI Studio preview link, replace it with a stable host |
| Demo video | Follow `submission/demo-script.md` (about 3 min), upload to YouTube/Vimeo | TODO: you must record it |
| One-page PDF | `submission/one-page-description.pdf` (regenerated, 1 page, Letter) | Done |
| Bengali setup guide | `START_HERE_BN.md` and `submission/quick-start-bn.pdf` (local run instructions; optional attachment) | Ready |
| GitHub repo / code PDF | `submission/code.pdf` (source snapshot; regenerate after code changes) and push the repo | Done, repo push is yours |

## Judging criteria and where FloodGuard answers them
- Idea: flood to health-impact chain for the Sylhet/Sunamganj haor basin, bilingual output.
- Implementation: React/Vite views, Express API, SQLite-backed Operations Center, Gemini-assisted chat/prediction, and bilingual safety guidance.
- Design: bilingual UI, data provenance labels (LIVE / DERIVED / SIMULATED).
- Presentation: demo video + one-pager + Devpost text. Lead with the problem in the first 20 seconds.

## Before you press Submit (not possible in this sandbox: no npm network)
1. `npm ci`
2. `npm run test:all`, `npm run lint`, and `npm run build`. Fix anything that fails.
3. `npm run dev`, then click through: Dashboard, Health Watch, Prediction, Community Reports, Admin, Bangla toggle.
4. Set `GEMINI_API_KEY` and `ADMIN_PIN` on the host. Never commit `.env`.
5. Record the actual test count and result from the final `npm run test:all` output; do not claim an unverified count.
6. Re-generate `submission/code.pdf` after any further code change. The standalone Bengali first-run guide is `START_HERE_BN.md` / `submission/quick-start-bn.pdf`.

## Quality and safety notes for the updated build
- Admin writes now require server-side PIN verification; client-only alert/moderation changes were removed.
- GloFAS output is described as modelled grid-cell discharge, not a river-gauge reading; missing values remain unavailable.
- Planner labels "WHO Standard" / "Sphere Standard" removed; they are adjustable planning assumptions.
- Water-treatment advice is fixed text, not Gemini-generated. Boil safe water or follow the exact product label; do not assume a tablet dose across brands.

## Still worth verifying yourself
- Gauge danger marks in README/mock data against the latest BWDB/FFWC records before presenting them as official thresholds.
- 2022 flood figures (972 mm Cherrapunji, 94% Sunamganj, 84% Sylhet, 7.2 million affected) against the cited sources.
- Phone numbers 999, 16263, 1090 against current official pages.
- Demo URL in the one-pager footer.

# Contributing to FloodGuard AI

Thank you for taking an interest in FloodGuard AI. Contributions that improve clarity, accessibility, testing, reliability, and data transparency are welcome.

## Before You Start

- Read the [README](./README.md), [architecture guide](./docs/ARCHITECTURE_AND_FEATURES.md), and [quality review](./docs/QUALITY_REVIEW.md).
- For substantial changes, open an issue first to discuss the proposed scope.
- Keep changes focused and explain the problem they solve.
- Do not include real personal information, private contact details, credentials, or non-public community reports in issues, commits, screenshots, or test fixtures.

## Local Development

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Set optional environment variables locally. Never commit `.env`, API keys, the admin PIN, or runtime data.

## Validation

Run the checks relevant to your change:

```bash
npm run test:all
npm run lint
npm run build
```

- `npm run test:all` runs the Vitest and backend Node.js test suites.
- `npm run lint` runs TypeScript validation with `tsc --noEmit`; it is not an ESLint style check.
- `npm run build` creates the Vite production bundle.

In your pull request, state exactly which commands you ran and whether each passed. If a check could not be run, explain why. Do not report a test as passing based only on syntax inspection.

## Safety and Data Integrity Requirements

FloodGuard AI is a research and demonstration prototype. Contributions must preserve these boundaries:

- Do not present simulated, seeded, or illustrative records as live observations.
- Identify the source and limitations of any new external data feed.
- Do not describe heuristic indicators as calibrated probabilities, official warnings, clinically validated forecasts, or disease surveillance.
- Do not imply that the app guarantees safe routes, evacuation outcomes, or emergency response.
- Do not turn AI-generated text into the source of safety-critical instructions.
- Do not claim that SMS or government-agency notifications are delivered unless an actual, tested adapter and recipient workflow exist.
- Preserve consent checks, moderation, privacy protections, and clear emergency disclaimers.

Changes to public health or disaster guidance require appropriate authoritative sourcing and careful review. This project is not a substitute for official FFWC/BWDB bulletins, local disaster-management instructions, or qualified medical advice.

## Pull Requests

- Use a focused branch and a descriptive commit message.
- Explain the user problem, implementation approach, and any trade-offs.
- Include screenshots for meaningful UI changes, using synthetic data only.
- Add or update tests for changed behaviour.
- Update relevant documentation and data-provenance notes.
- Disclose AI assistance where relevant and required by the event or contribution rules.

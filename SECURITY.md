# Security Policy

FloodGuard AI is a research and demonstration prototype. It is not an official flood-warning, emergency-response, or clinical service.

## Reporting a Vulnerability

Please do not publish exploitable vulnerabilities, credentials, admin PINs, private reports, or personal information in a public issue.

1. Use GitHub's **Private vulnerability reporting** feature for this repository when it is available.
2. If private reporting is unavailable, contact the maintainer through the contact details on the [GitHub profile](https://github.com/fahim1252375-maker) and provide a concise reproduction, affected commit, impact, and suggested mitigation.
3. Do not include real community contact details, health information, or production secrets in the report.

## Scope and Important Limitations

- The Operations Center uses a shared administrator PIN, not individual user accounts or role-based access control.
- Rate limiting is in-memory and per application process. It is not a distributed abuse-control system.
- SQLite and JSON-backed runtime data require persistent storage and a backup plan on the deployment host.
- Simulated or seeded readings and planning values must not be treated as operational observations.
- SMS delivery requires a separately configured gateway adapter; an outbox entry is not proof of delivery.

## Supported Versions

Security fixes are made against the current default branch (main). There is no formal long-term support or guaranteed response-time commitment.

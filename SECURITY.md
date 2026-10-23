# Security Policy

## Supported Versions

AgreeMate follows semantic versioning. Critical security patches and updates are provided for the versions listed below:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The AgreeMate team takes security seriously. If you discover a security vulnerability or potential threat in this repository, please disclose it responsibly.

### How to Report
- **Do not open public GitHub issues or discussions** for undisclosed security vulnerabilities.
- Please report vulnerabilities privately via **GitHub Private Vulnerability Reporting** on the repository or email `punjabidevesh5810@gmail.com` with the subject line `[SECURITY] AgreeMate Vulnerability Report`.
- Include the following details in your report:
  1. Description of the vulnerability and its potential impact.
  2. Step-by-step reproduction instructions or proof-of-concept (PoC).
  3. Affected component(s) (`backend`, `frontend`, API endpoint, token handling, etc.).
  4. Any suggested remediations or mitigations.

### Response Timelines
- **Acknowledgement**: Within 48 hours.
- **Assessment & Triage**: Within 5 business days.
- **Remediation & Patch**: Timeline coordinated based on severity (Critical issues patched within 7 business days).

---

## Security Practices & Safeguards

AgreeMate implements several layers of defense-in-depth:
- **Authentication**: Argon2id password hashing, JWT with strict issuer/audience claims, and token family rotation with reuse/replay compromise revocation.
- **Session Tokens**: Refresh tokens stored exclusively in `HttpOnly; Secure; SameSite=Lax` cookies; access tokens held in memory.
- **Evidence Verification**: Cryptographic SHA-256 content hashing verified on ingestion and re-verified on export; proxy downloads require authenticated ownership.
- **State Integrity**: Agreement state transitions enforced via atomic MongoDB conditional updates with precondition status filters.
- **Dependency Auditing**: Automated CI scans with `pip-audit` and `npm audit --audit-level=high` on pull requests and scheduled runs.

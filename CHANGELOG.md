# Changelog

All notable changes to the AgreeMate project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-24

### Security & Hardening
- **Authorization**: Removed hardcoded administrative email allowlists; access control is strictly database role-based (`admin`, `super_admin`).
- **Admin Access**: Removed backdoor auto-seeding on admin login and removed default credentials.
- **Session Tokens**: Moved refresh tokens into `HttpOnly; Secure; SameSite=Lax` cookies; access tokens held in memory.
- **Token Families**: Implemented session token families with replay/reuse compromise detection that automatically revokes entire compromised sessions.
- **Data Privacy**: Built real DPDP-compliant data export endpoint (`GET /api/v1/security/data-export/download`) streaming verified ZIP archives with SHA-256 manifest.
- **Evidence Verification**: Recomputed and verified SHA-256 checksums on all exported evidence files; upload failures now return HTTP 502 rather than mock URLs.
- **Invoices**: Enforced verified database lookup for tax invoice retrieval; removed mock fallback identities and fictitious data.
- **Penalties**: Migrated penalty calculations to `Decimal` precision quantized to `0.01` and added maximum penalty caps.
- **State Machine**: Enforced atomic transitions with precondition status filters on agreement state mutations.
- **Headers & Health**: Added modernized HTTP security headers (`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy`) and structured `/health/live`, `/health/ready` probe endpoints.

### Architecture & Reorganization
- Reorganized into clean dual-tier architecture: isolated Next.js 16 frontend (`frontend/src/`) and modular FastAPI backend (`backend/app/`).
- Standardized runtime to Python 3.12 across CI/CD workflows, Dockerfiles, and documentation.
- Consolidated Docker infrastructure into `infrastructure/docker/`.
- Consolidated planning, specifications, and architecture records into `.agents/plan/`.
- Hardened CI/CD pipelines by eliminating bypass flags (`|| true`, `|| echo`) and enforcing strict lint, typecheck, and audit gates.

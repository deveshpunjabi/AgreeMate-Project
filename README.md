# AgreeMate

**Lend with Trust. Borrow with Proof.**

AgreeMate is a mutual-consent lending platform with tamper-proof SHA-256 evidence, automated penalties, and dispute-ready legal exports. Designed for individuals and small businesses who lend physical items and need cryptographic certainty.

Live Production URL: [agree-mate.vercel.app](https://agree-mate.vercel.app)  
Full documentation: [`docs/documentation.md`](docs/documentation.md) — architecture diagrams, data models, API reference, security, and compliance.

---

## 🚀 Features

- **SHA-256 Evidence Vault** — Every uploaded condition photo is cryptographically hashed with SHA-256 at the moment of capture for tamper-evident records.
- **Mutual Consent Signatures** — Both owner and borrower digitally sign with IP address and UTC timestamp audit logging.
- **SMTP OTP Verification** — Verification emails are sent before signup returns, supporting serverless execution.
- **Dual-Port Resilient SMTP** — Multi-port fallback (465 SSL, 587 STARTTLS, 2525 alternative) with automated Google App Password sanitization.
- **Executive Admin Command Center** — Dedicated `/admin` dashboard with telemetry KPI cards, SVG charts, user directory, and master agreement ledger.
- **Section 65B Electronic Record Certificate** — Embedded Indian legal certificate (BSA 2023 / IEA 2000) with cryptographic SHA-256 seal.
- **ISO A4 Tax Invoice Generator** — GSTIN line items, SAC codes, and digital hash verification.
- **Automated Penalty Engine** — Fixed, per-day, and percentage late return penalties calculated dynamically.
- **Scheduled Email Reminders** — Daily reminder pipeline triggered via Vercel Cron at 09:00 UTC with Bearer `CRON_SECRET` protection.
- **PDF/ZIP Evidence Export** — Lawyer-ready audit packets containing cryptographic manifests and condition photos.

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | `16.x` | Modern React 19 UI, SSR, Turbopack, Tailwind CSS v4 |
| **State & Data** | Zustand & TanStack Query | `5.0+` / `5.101+` | Client store & asynchronous server state management |
| **Backend** | FastAPI / Starlette | `0.161+` | High-performance Python ASGI REST API |
| **Database** | MongoDB Atlas / Motor | `7.0` / `3.7+` | Non-blocking async document store with TLS certifi |
| **Authentication** | Argon2id & PyJWT | RFC 7519 | Access tokens + HTTP-only refresh cookies + session revocation |
| **Email** | aiosmtplib (Dual-Port) | `5.1.2+` | Resilient SMTP delivery (465 SSL / 587 TLS) |
| **Storage** | Cloudinary CDN | `1.42+` | Media hosting with client & server-side SHA-256 hashing |
| **PDF Generation** | ReportLab | `4.3+` | In-memory legal PDF generation and Section 65B certificates |
| **Deployment** | Vercel 2-in-1 Monorepo | Monorepo | Unified frontend + Python serverless hosting |

---

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- MongoDB 7.0 (local or MongoDB Atlas connection string)

### 1. Clone & Configure
```bash
git clone https://github.com/deveshpunjabi/AgreeMate-Project.git
cd AgreeMate-Project
```

Copy `.env.example` to `.env` at the repository root and configure your credentials:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm ci
python -m venv .venv
# Activate .venv (Windows: .venv\Scripts\Activate.ps1; Unix: source .venv/bin/activate)
python -m pip install -r backend/requirements-dev.txt
```

### 3. Start Both Services Locally (Recommended)
```bash
# Starts both Next.js frontend (port 3000) and FastAPI backend (port 8000)
npm run dev:all
# or:
python run.py
```

### 4. Safe Database Admin Provisioning
To safely create an administrator account without modifying or dropping existing collections:
```bash
python backend/scripts/seed_admin.py
```

> **Development-Only Purge**:
> To completely wipe development mock collections and re-seed clean data, use the guarded script:
> ```bash
> python backend/scripts/clean_and_seed_admin.py --confirm-purge-dev-data
> ```
> *(This script is blocked by an absolute safety gate when `ENVIRONMENT=production`)*.

---

## 📂 Project Structure

```
AgreeMate-Project/
├── api/                            # Vercel ASGI Serverless Adapter (api/index.py)
├── backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── core/                   # Centralized config, security headers, CORS
│   │   ├── db/                     # MongoDB client & idempotent index CLI
│   │   ├── modules/                # Domain routers, schemas, auth, lending and security
│   │   ├── services/               # SMTP, Cloudinary, PDF and ZIP generation
│   │   ├── jobs/                   # Reminder execution
│   │   └── main.py                 # Lean FastAPI application factory
│   ├── scripts/                    # seed_admin.py & clean_and_seed_admin.py
│   ├── tests/                      # Pytest unit, integration, and security tests
│   └── requirements.txt            # Canonical backend dependency constraints
├── frontend/                       # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/                    # Next.js App Router (Routes & Layouts ONLY)
│   │   ├── components/             # Reusable UI & layout primitives
│   │   ├── features/               # Agreement UI and wizard
│   │   ├── stores/                 # Zustand stores
│   │   ├── hooks/                  # Shared React hooks
│   │   └── lib/                    # API clients and utilities
│   ├── tests/                      # Vitest test suite
│   ├── package.json                # Frontend package manifest
│   └── next.config.ts              # Next.js configuration and relative rewrites
├── docs/                           # Architecture, database models, and deployment guides
├── infrastructure/docker/          # Dockerfile.frontend & Dockerfile.backend
├── .github/workflows/              # GitHub Actions CI (Frontend, Backend, Security Scan)
├── docker-compose.yml              # Local container stack
├── package.json                    # Root monorepo workspace manifest
├── requirements.txt                # Root serverless Python dependencies
├── vercel.json                     # Vercel 2-in-1 routing and cron schedule
└── run.py                          # Local multi-service supervisor script
```

---

## 🧪 Testing

### Backend Test Suite (Pytest)
```bash
cd backend && python -m pytest tests/ -v
```

### Frontend Test Suite (Vitest)
```bash
npm --prefix frontend test
```

### Repository Hygiene
```bash
python scripts/check_repository.py
```

### Frontend Code Quality Check (ESLint)
```bash
npm --prefix frontend run lint
```

### Production Build Verification
```bash
npm run build
```

---

## 🚢 Deployment

AgreeMate is configured for **Vercel 2-in-1 Monorepo Deployment**:
1. Connect repository to Vercel.
2. Set Root Directory to `./` (repository root).
3. Framework Preset: Next.js.
4. Set required environment variables (see [`docs/deployment/environment-variables.md`](docs/deployment/environment-variables.md)).
5. Vercel automatically routes `/api/v1/*` to FastAPI serverless functions and Next.js static/dynamic pages to the web app on `agree-mate.vercel.app`.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

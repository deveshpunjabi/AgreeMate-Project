# ADR 001: Pure SMTP Delivery and Vercel 2-in-1 Monorepo Deployment

## Context
AgreeMate was previously deployed across separate Render (backend) and Vercel (frontend) instances, leading to cross-domain cookie issues, cold-start latency, and background worker freezes.

## Decisions
1. **2-in-1 Vercel Deployment**: Unified both Next.js 16 and FastAPI into a single Vercel project using `/api/index.py` serverless routing and Next.js frontend pages under relative `/api/v1` routes.
2. **Pure SMTP Email Engine**: Standardized on Google SMTP (`smtp.gmail.com`) using `aiosmtplib`, with dual-port failover (Port 465 Direct SSL primary, Port 587 STARTTLS secondary) and synchronous `await` in serverless execution.
3. **Canonical Monorepo Directory Layout**: Modularized frontend into `features/`, `components/`, and `stores/`, and backend into `core/`, `db/`, `modules/`, and `services/`.

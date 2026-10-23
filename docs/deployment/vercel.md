# AgreeMate — Vercel 2-in-1 Deployment Architecture

## 1. Overview

AgreeMate deploys as a **unified 2-in-1 monorepo** on Vercel. Both the Next.js 16 frontend and the Python FastAPI backend are hosted within a single Vercel project at the repository root (`./`).

```
Internet Request (https://agree-mate.vercel.app)
       │
       ▼
 ┌─────────────── Vercel Edge Router ───────────────┐
 │                                                  │
 │   Does path match /api/v1/* ?                    │
 │         │                       │                │
 │        YES                      NO               │
 │         ▼                       ▼                │
 │   api/index.py            frontend/.next         │
 │ (FastAPI Serverless)    (Next.js App Router)     │
 └──────────────────────────────────────────────────┘
```

---

## 2. Vercel Project Settings

When importing the repository into Vercel:
- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (Leave as repository root — DO NOT set to `frontend`)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install`

---

## 3. Configuration Breakdown

### 3.1 `vercel.json` (Root)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "/api/index.py"
    },
    {
      "source": "/docs",
      "destination": "/api/index.py"
    },
    {
      "source": "/openapi.json",
      "destination": "/api/index.py"
    }
  ],
  "crons": [
    {
      "path": "/api/v1/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 3.2 Routing Advantages
1. **Same-Origin API Access**: All requests from the browser to `/api/v1` are relative URLs (`/api/v1/auth/login`). There are no cross-origin cookies or CORS preflight latency.
2. **Built-in Cron**: Daily reminder emails are triggered via Vercel Crons without needing long-running background worker processes.
3. **Single Domain**: Eliminates managing separate frontend and backend domains. Everything is served under `https://agree-mate.vercel.app`.

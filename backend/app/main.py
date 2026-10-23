import logging
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from backend.app.core.config import settings
from backend.app.core.security import SecurityHeadersMiddleware, get_cors_configuration
from backend.app.db.client import get_db, db
from backend.app.db.indexes import ensure_indexes
from backend.app.modules.reminders.scheduler import start_scheduler, shutdown_scheduler
from backend.app.modules.reminders.cron_router import router as cron_router

# Feature domain routers
from backend.app.modules.auth.router import router as auth_router
from backend.app.modules.users.router import router as users_router
from backend.app.modules.items.router import router as items_router
from backend.app.modules.agreements.router import router as agreements_router
from backend.app.modules.evidence.router import router as evidence_router
from backend.app.modules.penalties.router import router as penalties_router
from backend.app.modules.notifications.router import router as notifications_router
from backend.app.modules.security.router import router as security_router
from backend.app.modules.admin.router import router as admin_router

logger = logging.getLogger(__name__)

_indexes_verified = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _indexes_verified
    
    # 1. Fast cold-start connectivity check
    try:
        await db.client.admin.command("ping")
        logger.info("MongoDB connection ping successful.")
    except Exception as e:
        logger.warning(f"MongoDB ping warning during cold start: {e}")

    # 2. In non-production or non-serverless environments, ensure indexes asynchronously once
    if not _indexes_verified and (settings.ENVIRONMENT != "production" and not os.environ.get("VERCEL")):
        try:
            asyncio.create_task(ensure_indexes(db))
            _indexes_verified = True
        except Exception as e:
            logger.warning(f"Non-fatal background index check warning: {e}")

    # 3. In-process scheduler: only run in traditional server environments, never in serverless
    run_scheduler = (
        settings.ENABLE_IN_PROCESS_SCHEDULER
        or (settings.ENVIRONMENT != "production" and not os.environ.get("VERCEL"))
    )
    if run_scheduler:
        start_scheduler()

    yield

    if run_scheduler:
        shutdown_scheduler()


# Initialize FastAPI Application
app = FastAPI(
    title="AgreeMate API",
    description="Mutual consent items lending platform with SHA-256 evidence logging",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Apply Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Apply Locked CORS Middleware
cors_origins, cors_origin_regex = get_cors_configuration()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes under canonical prefix /api/v1
api_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(items_router, prefix=api_prefix)
app.include_router(agreements_router, prefix=api_prefix)
app.include_router(evidence_router, prefix=api_prefix)
app.include_router(penalties_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(security_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(cron_router, prefix=api_prefix)


# Root & Documentation Endpoints
@app.get("/")
@app.get(f"{api_prefix}")
@app.get(f"{api_prefix}/")
async def root():
    return {
        "service": "AgreeMate API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get(f"{api_prefix}/docs", include_in_schema=False)
async def api_docs_redirect():
    return RedirectResponse(url="/docs")


@app.get(f"{api_prefix}/openapi.json", include_in_schema=False)
async def api_openapi_redirect():
    return RedirectResponse(url="/openapi.json")


# Health Check Probes
@app.get("/health/live")
@app.get(f"{api_prefix}/health/live")
async def health_live():
    return {"status": "live", "service": "AgreeMate"}


@app.get("/health/ready")
@app.get(f"{api_prefix}/health/ready")
async def health_ready(database=Depends(get_db)):
    try:
        await database.client.admin.command("ping")
        return {"status": "ready", "service": "AgreeMate", "db": "connected"}
    except Exception:
        logger.exception("Readiness check DB ping failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database disconnected"
        )


@app.get("/health")
@app.get(f"{api_prefix}/health")
async def health_check(database=Depends(get_db)):
    try:
        await database.client.admin.command("ping")
        return {"status": "healthy", "service": "AgreeMate", "db": "connected"}
    except Exception:
        logger.exception("Health check DB ping failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database disconnected"
        )

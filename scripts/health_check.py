"""
AgreeMate System Health Check CLI
Verifies database connectivity, configuration variables, and core services.
"""
import asyncio
import os
import sys

# Ensure repository root and backend directory are on sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.db.client import db


async def check_health() -> bool:
    print("=" * 60)
    print("AGREEMATE SYSTEM PRE-FLIGHT HEALTH CHECK")
    print("=" * 60)
    all_ok = True

    # 1. Environment & Configuration
    print(f"\n[1/3] Environment: {settings.ENVIRONMENT}")
    print(f"      Database Name: {settings.DATABASE_NAME}")
    print(f"      Frontend URL: {settings.FRONTEND_URL}")
    print(f"      SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"      SMTP User: {settings.SMTP_USERNAME or 'Not configured'}")
    
    if not settings.JWT_SECRET or len(settings.JWT_SECRET) < 32:
        print("  [FAIL] JWT_SECRET must be at least 32 characters long.")
        all_ok = False
    else:
        print("  [PASS] JWT_SECRET configuration validated.")

    # 2. Database Connectivity
    print("\n[2/3] Checking MongoDB Atlas Connection...")
    try:
        ping = await db.client.admin.command("ping")
        print(f"  [PASS] MongoDB connected successfully. Ping response: {ping.get('ok')}")
    except Exception as e:
        print(f"  [FAIL] Could not connect to MongoDB: {e}")
        all_ok = False

    # 3. Router & ASGI Verification
    print("\n[3/3] Checking ASGI Application Factory...")
    try:
        from backend.app.main import app
        route_count = len(app.routes)
        print(f"  [PASS] FastAPI initialized with {route_count} mounted routes.")
    except Exception as e:
        print(f"  [FAIL] FastAPI import failed: {e}")
        all_ok = False

    print("\n" + "=" * 60)
    if all_ok:
        print(">>> ALL HEALTH CHECKS PASSED - READY FOR PRODUCTION <<<")
    else:
        print(">>> ONE OR MORE HEALTH CHECKS FAILED <<<")
    print("=" * 60 + "\n")
    return all_ok


if __name__ == "__main__":
    success = asyncio.run(check_health())
    sys.exit(0 if success else 1)

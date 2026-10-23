import logging
import os
import hmac
from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException, status
from backend.app.core.config import settings
from backend.app.jobs.reminders import check_and_send_reminders

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cron", tags=["Scheduled Tasks"])


def _verify_cron_auth(authorization: str | None, x_vercel_cron: str | None) -> bool:
    """
    Validates that the incoming cron trigger is authorized.
    Supports:
    1. 'Authorization: Bearer <CRON_SECRET>'
    2. Vercel Cron invocation with CRON_SECRET configured
    """
    expected_secret = settings.CRON_SECRET

    # In local development without a CRON_SECRET, allow execution for ease of testing
    if not expected_secret:
        if settings.ENVIRONMENT != "production" and not os.environ.get("VERCEL"):
            logger.info("Cron invoked without CRON_SECRET in non-production environment; allowed.")
            return True
        logger.error("Cron request rejected: CRON_SECRET is not configured on the server.")
        return False

    # Check Authorization header (Bearer <CRON_SECRET>)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if hmac.compare_digest(token, expected_secret):
            return True

    return False


@router.get("/reminders")
@router.post("/reminders")
async def trigger_daily_reminders(
    authorization: str | None = Header(default=None),
    x_vercel_cron_schedule: str | None = Header(default=None, alias="x-vercel-cron-schedule"),
):
    """
    Secure cron trigger for daily reminder checks and overdue status transitions.
    Invoked daily at 09:00 UTC by Vercel Cron or an authorized external scheduler.
    """
    if not _verify_cron_auth(authorization, x_vercel_cron_schedule):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized cron execution. Valid CRON_SECRET bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    start_time = datetime.now(timezone.utc)
    logger.info("Executing scheduled daily reminders job...")

    try:
        await check_and_send_reminders()
        elapsed_sec = (datetime.now(timezone.utc) - start_time).total_seconds()
        logger.info(f"Daily reminders job completed successfully in {elapsed_sec:.2f}s.")
        return {
            "status": "success",
            "job": "daily_reminders",
            "triggered_at": start_time.isoformat(),
            "duration_seconds": round(elapsed_sec, 2),
            "message": "Daily reminders checked and dispatched successfully."
        }
    except Exception as exc:
        logger.exception("Error executing scheduled daily reminders job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Daily reminders job failed: {str(exc)}"
        )

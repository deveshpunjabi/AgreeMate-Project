import secrets
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status

def generate_otp() -> str:
    """Generates a 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"

async def check_otp_rate_limit(user_id: str, db) -> bool:
    """
    Checks if user has requested more than 5 OTPs in the last 60 minutes.
    Raises HTTPException 429 if rate limit exceeded.
    """
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    count = await db.otps.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": one_hour_ago}
    })
    
    if count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again after some time."
        )
    return True


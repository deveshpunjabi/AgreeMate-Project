import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from backend.app.core.config import settings

def generate_invite_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)

def calculate_invite_expiry(days: int = 7) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)

def build_invite_url(token: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")
    return f"{base_url}/invite/{token}"

def is_invite_expired(invite_expires_at: Optional[datetime]) -> bool:
    if not invite_expires_at:
        return False
    expires = invite_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires < datetime.now(timezone.utc)

def validate_invite_token(agreement: Optional[dict]) -> Tuple[bool, Optional[str]]:
    if not agreement:
        return False, "Invitation not found or invalid token."
    
    token = agreement.get("invite_token")
    if not token:
        return False, "This agreement no longer has an active invitation link."
        
    expires_at = agreement.get("invite_expires_at")
    if is_invite_expired(expires_at):
        return False, "This invitation link has expired. Please ask the lender to resend."
        
    current_status = agreement.get("status")
    if current_status not in ["pending_borrower_acceptance", "draft"]:
        return False, f"This agreement is no longer awaiting acceptance (current status: {current_status})."
        
    return True, None

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class TOTPSetupResponse(BaseModel):
    totp_secret: str
    otpauth_url: str

class TOTPVerifyRequest(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=6)

class TOTPVerifyResponse(BaseModel):
    success: bool
    backup_codes: List[str]

class TOTPDisableRequest(BaseModel):
    current_password: str
    totp_code: str

class SessionResponse(BaseModel):
    id: str
    user_agent: str
    device_name: str
    ip_address: str
    last_active_at: datetime
    is_current: bool

class AuditLogItem(BaseModel):
    id: str
    action: str
    ip_address: str
    user_agent: str
    timestamp: datetime

class VerificationLevelResponse(BaseModel):
    badge: str
    email_verified: bool
    phone_provided: bool = False
    phone_verified: bool = False
    id_uploaded: bool = False
    id_verified: bool = False
    selfie_uploaded: bool = False
    selfie_verified: bool = False

class AccountDeactivateRequest(BaseModel):
    current_password: str
    reason: Optional[str] = None

class AccountDeleteRequest(BaseModel):
    current_password: str
    confirmation_word: str = Field(..., description="Must equal 'DELETE'")

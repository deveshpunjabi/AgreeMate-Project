from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator

class User(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    password_hash: str
    role: str = "user"
    email_verified: bool = False
    is_active: bool = True
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)

class SignUpResponse(BaseModel):
    user_id: str
    message: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class ProfileInfo(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserInfo(BaseModel):
    id: str
    email: str
    role: str
    email_verified: bool
    profile: Optional[ProfileInfo] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_profile(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "id" not in data and "_id" in data:
                data["id"] = data["_id"]
            if "profile" not in data or data["profile"] is None:
                data["profile"] = {
                    "full_name": data.get("full_name"),
                    "phone": data.get("phone"),
                    "city": data.get("city"),
                    "avatar_url": data.get("avatar_url"),
                }
        else:
            id_val = getattr(data, "id", None) or getattr(data, "_id", None)
            email = getattr(data, "email", None)
            role = getattr(data, "role", None)
            email_verified = getattr(data, "email_verified", None)
            profile = {
                "full_name": getattr(data, "full_name", None),
                "phone": getattr(data, "phone", None),
                "city": getattr(data, "city", None),
                "avatar_url": getattr(data, "avatar_url", None),
            }
            return {
                "id": str(id_val) if id_val else None,
                "email": email,
                "role": role,
                "email_verified": email_verified,
                "profile": profile
            }
        return data

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserInfo

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None

class ProfileResponse(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

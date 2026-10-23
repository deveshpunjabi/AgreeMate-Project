from typing import Optional
from fastapi import APIRouter, Depends, status, Response, Request, Body, HTTPException
from pydantic import BaseModel, EmailStr
from backend.app.db.client import get_db
from backend.app.core.config import settings
from backend.app.modules.auth.schemas import (
    SignUpRequest,
    SignUpResponse,
    VerifyOTPRequest,
    TokenResponse,
    LoginRequest,
    RefreshRequest,
)
from backend.app.modules.auth.service import (
    create_user_signup,
    resend_user_otp,
    verify_user_otp,
    authenticate_user,
    refresh_user_tokens,
    revoke_user_session,
)

router = APIRouter(prefix="/auth", tags=["auth"])

def _set_refresh_cookie(response: Response, refresh_token: str):
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="am_refresh",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

def _clear_refresh_cookie(response: Response):
    is_prod = settings.ENVIRONMENT == "production"
    response.delete_cookie(
        key="am_refresh",
        path="/api/v1/auth",
        secure=is_prod,
        samesite="none" if is_prod else "lax",
    )

@router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignUpRequest, db = Depends(get_db)):
    user = await create_user_signup(db, data)
    return SignUpResponse(user_id=user.id, message="OTP sent")

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: VerifyOTPRequest, response: Response, db = Depends(get_db)):
    result = await verify_user_otp(db, data)
    _set_refresh_cookie(response, result["refresh_token"])
    return result

class ResendOTPRequest(BaseModel):
    email: EmailStr

@router.post("/resend-otp")
async def resend_otp(data: ResendOTPRequest, db = Depends(get_db)):
    result = await resend_user_otp(db, data.email)
    return result

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response, db = Depends(get_db)):
    result = await authenticate_user(db, data)
    _set_refresh_cookie(response, result["refresh_token"])
    return result

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    data: Optional[RefreshRequest] = Body(default=None),
    db = Depends(get_db),
):
    token = (data.refresh_token if data and data.refresh_token else None) or request.cookies.get("am_refresh")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required.")
    result = await refresh_user_tokens(db, token)
    _set_refresh_cookie(response, result["refresh_token"])
    return result

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    data: Optional[RefreshRequest] = Body(default=None),
    db = Depends(get_db),
):
    token = (data.refresh_token if data and data.refresh_token else None) or request.cookies.get("am_refresh")
    _clear_refresh_cookie(response)
    if token:
        return await revoke_user_session(db, token)
    return {"message": "Logged out successfully."}


import logging
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from pymongo import ReturnDocument
from backend.app.modules.auth.schemas import SignUpRequest, VerifyOTPRequest, LoginRequest, User
from backend.app.modules.auth.password import hash_password, verify_password
from backend.app.modules.auth.otp import generate_otp, check_otp_rate_limit
from backend.app.modules.auth.jwt import create_access_token, create_refresh_token, verify_token
from backend.app.modules.security.totp import verify_totp_code
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

def hash_token_str(token: str) -> str:
    """Computes a SHA-256 hash of a token string for secure DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()

async def create_user_signup(db, data: SignUpRequest):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        # If the user has already verified their email, prevent duplicate registration
        if existing_user.get("email_verified", False):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists. Please sign in."
            )
        
        # If registration was left incomplete/unverified, restart from beginning
        pwd_hash = hash_password(data.password)
        user_id = existing_user["_id"]
        update_fields = {
            "password_hash": pwd_hash,
            "full_name": data.full_name,
            "is_active": True,
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.update_one({"_id": user_id}, {"$set": update_fields})
        existing_user.update(update_fields)
        user_doc = existing_user

        # Invalidate previous unverified OTPs
        await db.otps.update_many(
            {"user_id": user_id, "purpose": "email_verify", "used": False},
            {"$set": {"used": True}}
        )
    else:
        # Create fresh user
        pwd_hash = hash_password(data.password)
        user_id = uuid.uuid4().hex
        
        user_doc = {
            "_id": user_id,
            "email": data.email,
            "password_hash": pwd_hash,
            "role": "user",
            "email_verified": False,
            "is_active": True,
            "full_name": data.full_name,
            "phone": None,
            "city": None,
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    
    # Create OTP for email verification
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_doc = {
        "_id": uuid.uuid4().hex,
        "user_id": user_id,
        "otp_code": otp_code,
        "purpose": "email_verify",
        "expires_at": otp_expiry,
        "attempts": 0,
        "used": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.otps.insert_one(otp_doc)
    
    # Dispatch verification email synchronously so Serverless functions (Vercel) do not terminate before sending
    try:
        from backend.app.modules.auth.email import send_otp_email
        await send_otp_email(data.email, otp_code)
    except Exception as e:
        logger.error(f"OTP email dispatch error for {data.email}: {e}")
    logger.info("OTP generated for signup flow", extra={"email": data.email})
    
    return User(**user_doc)

async def resend_user_otp(db, email: str):
    user = await db.users.find_one({"email": email})
    if not user:
        # Prevent user enumeration: return success even if email not found
        return {"message": "Verification code resent if account exists.", "retry_after_seconds": 60}
    
    await check_otp_rate_limit(user["_id"], db)
    
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_doc = {
        "_id": uuid.uuid4().hex,
        "user_id": user["_id"],
        "otp_code": otp_code,
        "purpose": "email_verify",
        "expires_at": otp_expiry,
        "attempts": 0,
        "used": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.otps.insert_one(otp_doc)
    
    # Dispatch verification email synchronously so Serverless functions (Vercel) do not terminate before sending
    try:
        from backend.app.modules.auth.email import send_otp_email
        await send_otp_email(email, otp_code)
    except Exception as e:
        logger.error(f"OTP email dispatch error for {email}: {e}")
    logger.info("OTP regenerated for resend flow", extra={"email": email})
    
    return {"message": "Verification code resent.", "retry_after_seconds": 60}

async def verify_user_otp(db, data: VerifyOTPRequest):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification code."
        )

    # Atomic attempt counter and validation guard
    now = datetime.now(timezone.utc)
    otp_req = await db.otps.find_one_and_update(
        {
            "user_id": user["_id"],
            "purpose": "email_verify",
            "used": False,
            "attempts": {"$lt": 5},
            "expires_at": {"$gt": now},
        },
        {"$inc": {"attempts": 1}},
        sort=[("created_at", -1)],
        return_document=ReturnDocument.AFTER,
    )
    if not otp_req:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code invalid, expired, or maximum attempts exceeded."
        )

    if otp_req["otp_code"] != data.otp_code:
        if otp_req.get("attempts", 0) >= 5:
            await db.otps.update_one({"_id": otp_req["_id"]}, {"$set": {"used": True}})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # Atomically mark code as used
    claim_res = await db.otps.update_one(
        {"_id": otp_req["_id"], "used": False},
        {"$set": {"used": True}}
    )
    if claim_res.modified_count != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code already used or invalid."
        )

    await db.users.update_one({"_id": user["_id"]}, {"$set": {"email_verified": True}})
    user["email_verified"] = True

    # Generate tokens with session id and family id
    session_id = uuid.uuid4().hex
    family_id = uuid.uuid4().hex
    access_token = create_access_token(user["_id"], role=user.get("role", "user"), sid=session_id)
    refresh_token = create_refresh_token(user["_id"], family_id=family_id)

    refresh_hash = hash_token_str(refresh_token)
    session_expiry = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session_doc = {
        "_id": session_id,
        "user_id": user["_id"],
        "family_id": family_id,
        "refresh_token_hash": refresh_hash,
        "expires_at": session_expiry,
        "revoked": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.sessions.insert_one(session_doc)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": User(**user)
    }

async def authenticate_user(db, data: LoginRequest):
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password."
    )
    
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise generic_error

    # Check for temporary account lockout due to excessive failed attempts
    now = datetime.now(timezone.utc)
    lockout_until = user.get("lockout_until")
    if lockout_until:
        if lockout_until.tzinfo is None:
            lockout_until = lockout_until.replace(tzinfo=timezone.utc)
        if now < lockout_until:
            remaining_seconds = int((lockout_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in {remaining_minutes} minutes.",
                headers={"Retry-After": str(remaining_seconds)}
            )
        
    if not verify_password(data.password, user["password_hash"]):
        # Increment failed login attempts
        failed_count = user.get("failed_login_attempts", 0) + 1
        update_doc = {
            "failed_login_attempts": failed_count,
            "last_failed_login": now
        }
        if failed_count >= 5:
            update_doc["lockout_until"] = now + timedelta(minutes=15)
            update_doc["failed_login_attempts"] = 0
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_doc})
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Account temporarily locked for 15 minutes.",
                headers={"Retry-After": "900"}
            )
        else:
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_doc})
        raise generic_error

    # Reset failed attempts and lockout on successful password verification
    if user.get("failed_login_attempts", 0) > 0 or user.get("lockout_until"):
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"failed_login_attempts": 0, "lockout_until": None}}
        )
        
    if not user.get("is_active", True) or user.get("is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated or deleted."
        )

    if not user.get("email_verified", False):
        try:
            await resend_user_otp(db, user["email"])
        except Exception as e:
            logger.warning(f"Auto-resend OTP on unverified login notice: {e}")

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED: Please verify your email address before signing in."
        )

    # Check Two-Factor Authentication (2FA) if enabled
    if user.get("is_2fa_enabled", False):
        if not data.totp_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="2FA_REQUIRED"
            )
        totp_secret = user.get("totp_secret")
        totp_valid = False
        if totp_secret and verify_totp_code(totp_secret, data.totp_code):
            totp_valid = True
        else:
            # Check single-use backup codes with atomic consumption
            code_hash = hashlib.sha256(data.totp_code.strip().upper().encode("utf-8")).hexdigest()
            consumed = await db.users.find_one_and_update(
                {"_id": user["_id"], "backup_codes": code_hash},
                {"$pull": {"backup_codes": code_hash}},
                return_document=ReturnDocument.AFTER
            )
            if consumed:
                totp_valid = True

        if not totp_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid two-factor authentication code."
            )
        
    # Generate tokens with session id and family id
    session_id = uuid.uuid4().hex
    family_id = uuid.uuid4().hex
    access_token = create_access_token(user["_id"], role=user.get("role", "user"), sid=session_id)
    refresh_token = create_refresh_token(user["_id"], family_id=family_id)

    refresh_hash = hash_token_str(refresh_token)
    session_expiry = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session_doc = {
        "_id": session_id,
        "user_id": user["_id"],
        "family_id": family_id,
        "refresh_token_hash": refresh_hash,
        "expires_at": session_expiry,
        "revoked": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.sessions.insert_one(session_doc)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": User(**user)
    }

async def refresh_user_tokens(db, refresh_token: str):
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
        
    refresh_hash = hash_token_str(refresh_token)
    
    # Query database for session
    session = await db.sessions.find_one({
        "refresh_token_hash": refresh_hash,
        "user_id": user_id,
    })
    
    # Replay detection: if session was already revoked or rotated, revoke entire family
    if not session or session.get("revoked", False):
        if session and session.get("rotated_at"):
            rotated_at = session.get("rotated_at")
            if rotated_at.tzinfo is None:
                rotated_at = rotated_at.replace(tzinfo=timezone.utc)
            # 15s concurrency grace window for in-flight requests during token rotation
            if (datetime.now(timezone.utc) - rotated_at).total_seconds() < 15:
                active_session = await db.sessions.find_one({"family_id": session.get("family_id"), "revoked": False})
                if active_session:
                    user = await db.users.find_one({"_id": user_id, "is_active": True})
                    if user:
                        new_sid = uuid.uuid4().hex
                        new_access_token = create_access_token(user_id, role=user.get("role", "user"), sid=new_sid)
                        return {
                            "access_token": new_access_token,
                            "refresh_token": refresh_token,
                            "user": User(**user)
                        }
        if session and session.get("family_id"):
            family_id = session["family_id"]
            await db.sessions.update_many({"family_id": family_id}, {"$set": {"revoked": True}})
            logger.critical(f"Replay attack detected for user {user_id}. Revoked session family {family_id}.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or been revoked."
        )
        
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.sessions.update_one({"_id": session["_id"]}, {"$set": {"revoked": True}})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or been revoked."
        )
        
    user = await db.users.find_one({"_id": user_id, "is_active": True})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    # Rotate refresh tokens: mark current session revoked and record replaced_by
    family_id = session.get("family_id") or uuid.uuid4().hex
    new_session_id = uuid.uuid4().hex
    new_access_token = create_access_token(user_id, role=user.get("role", "user"), sid=new_session_id)
    new_refresh_token = create_refresh_token(user_id, family_id=family_id)
    new_refresh_hash = hash_token_str(new_refresh_token)

    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"revoked": True, "replaced_by": new_refresh_hash, "rotated_at": datetime.now(timezone.utc)}}
    )
    
    new_session_expiry = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_session = {
        "_id": new_session_id,
        "user_id": user_id,
        "family_id": family_id,
        "refresh_token_hash": new_refresh_hash,
        "rotated_from": refresh_hash,
        "expires_at": new_session_expiry,
        "revoked": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.sessions.insert_one(new_session)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "user": User(**user)
    }

async def revoke_user_session(db, refresh_token: str):
    refresh_hash = hash_token_str(refresh_token)
    await db.sessions.update_many({"refresh_token_hash": refresh_hash}, {"$set": {"revoked": True}})
    return {"message": "Session successfully revoked."}


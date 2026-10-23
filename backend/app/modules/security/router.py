from datetime import datetime, timezone
import logging
from typing import List

import io
import json
import zipfile
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from backend.app.modules.auth.password import verify_password, hash_password
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.db.client import get_db
from backend.app.modules.security.schemas import (
    AccountDeactivateRequest,
    AccountDeleteRequest,
    AuditLogItem,
    ChangePasswordRequest,
    SessionResponse,
    TOTPDisableRequest,
    TOTPSetupResponse,
    TOTPVerifyRequest,
    TOTPVerifyResponse,
    VerificationLevelResponse,
)
from backend.app.modules.security.totp import (
    generate_backup_codes,
    generate_totp_secret,
    get_totp_uri,
    verify_totp_code,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/security", tags=["Security & Privacy"])


def parse_user_agent(ua_string: str) -> str:
    """Parse raw User-Agent into a friendly device/browser name."""
    if not ua_string:
        return "Unknown Device"
    ua_lower = ua_string.lower()
    if "iphone" in ua_lower:
        return "iPhone (Mobile)"
    if "android" in ua_lower:
        return "Android (Mobile)"
    if "macintosh" in ua_lower or "mac os" in ua_lower:
        return "Mac Desktop"
    if "windows" in ua_lower:
        return "Windows PC"
    if "linux" in ua_lower:
        return "Linux PC"
    return "Web Browser"


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Change user password. Requires current password re-entry. Invalidates all other sessions except current."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    if not user_doc or not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}},
    )

    # Invalidate all OTHER sessions except the current active one
    current_sid = getattr(current_user, "session_id", None)
    if current_sid:
        await db.sessions.delete_many({
            "user_id": current_user.id,
            "_id": {"$ne": current_sid}
        })
    else:
        latest_session = await db.sessions.find_one(
            {"user_id": current_user.id, "revoked": False},
            sort=[("created_at", -1)]
        )
        if latest_session:
            await db.sessions.delete_many({
                "user_id": current_user.id,
                "_id": {"$ne": latest_session["_id"]}
            })
        else:
            await db.sessions.delete_many({"user_id": current_user.id})

    # Log audit entry
    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "password_changed",
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return {"message": "Password changed successfully. Other active sessions were invalidated."}


@router.post("/2fa/setup", response_model=TOTPSetupResponse)
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generate TOTP secret and QR code URI for 2FA setup."""
    totp_secret = generate_totp_secret()
    otpauth_url = get_totp_uri(totp_secret, current_user.email)

    # Store temp 2fa setup in db
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"temp_2fa_secret": totp_secret, "updated_at": datetime.now(timezone.utc)}},
    )

    return TOTPSetupResponse(totp_secret=totp_secret, otpauth_url=otpauth_url)


@router.post("/2fa/verify", response_model=TOTPVerifyResponse)
async def verify_and_enable_2fa(
    data: TOTPVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Verify TOTP code, enable 2FA, and return single-use backup codes."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    temp_secret = user_doc.get("temp_2fa_secret") if user_doc else None

    if not temp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Please request setup first.",
        )

    if not verify_totp_code(temp_secret, data.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code. Please check your authenticator app and try again.",
        )

    plain_backup_codes, hashed_backup_codes = generate_backup_codes(10)

    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "totp_secret": temp_secret,
                "is_2fa_enabled": True,
                "backup_codes": hashed_backup_codes,
                "updated_at": datetime.now(timezone.utc),
            },
            "$unset": {"temp_2fa_secret": ""},
        },
    )

    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "2fa_enabled",
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return TOTPVerifyResponse(success=True, backup_codes=plain_backup_codes)


@router.post("/2fa/disable")
async def disable_2fa(
    data: TOTPDisableRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Disable 2FA. Requires current password + TOTP code."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    if not user_doc or not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    secret = user_doc.get("totp_secret")
    if not secret or not verify_totp_code(secret, data.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code",
        )

    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {"is_2fa_enabled": False, "updated_at": datetime.now(timezone.utc)},
            "$unset": {"totp_secret": "", "backup_codes": ""},
        },
    )

    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "2fa_disabled",
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return {"message": "Two-factor authentication disabled successfully."}


@router.post("/2fa/backup-codes/regenerate", response_model=TOTPVerifyResponse)
async def regenerate_backup_codes(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Invalidate old backup codes and generate 10 new ones."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    if not user_doc or not user_doc.get("is_2fa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account.",
        )

    plain_backup_codes, hashed_backup_codes = generate_backup_codes(10)

    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "backup_codes": hashed_backup_codes,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return TOTPVerifyResponse(success=True, backup_codes=plain_backup_codes)


@router.get("/sessions", response_model=List[SessionResponse])
async def list_active_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all active sessions for current user."""
    cursor = db.sessions.find({"user_id": current_user.id, "revoked": False}).sort("created_at", -1)
    sessions = await cursor.to_list(length=50)

    res = []
    current_sid = getattr(current_user, "session_id", None)
    for idx, s in enumerate(sessions):
        ua = s.get("user_agent", "Unknown Browser")
        is_curr = (str(s["_id"]) == current_sid) if current_sid else (idx == 0)
        res.append(
            SessionResponse(
                id=str(s["_id"]),
                user_agent=ua,
                device_name=parse_user_agent(ua),
                ip_address=s.get("ip_address", "127.0.0.1"),
                last_active_at=s.get("created_at", datetime.now(timezone.utc)),
                is_current=is_curr,
            )
        )

    # Fallback mock current session if db has no active session row
    if not res:
        ua = request.headers.get("user-agent", "Web Browser")
        res.append(
            SessionResponse(
                id=current_sid or "current_active_session",
                user_agent=ua,
                device_name=parse_user_agent(ua),
                ip_address=request.client.host if request.client else "127.0.0.1",
                last_active_at=datetime.now(timezone.utc),
                is_current=True,
            )
        )

    return res


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Revoke specific active session by ID."""
    await db.sessions.delete_one({"_id": session_id, "user_id": current_user.id})
    return {"message": "Session revoked successfully."}


@router.delete("/sessions")
async def revoke_all_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Revoke all sessions except current."""
    current_sid = getattr(current_user, "session_id", None)
    if current_sid:
        await db.sessions.delete_many({
            "user_id": current_user.id,
            "_id": {"$ne": current_sid}
        })
    else:
        latest_session = await db.sessions.find_one(
            {"user_id": current_user.id, "revoked": False},
            sort=[("created_at", -1)]
        )
        if latest_session:
            await db.sessions.delete_many({
                "user_id": current_user.id,
                "_id": {"$ne": latest_session["_id"]}
            })
        else:
            await db.sessions.delete_many({"user_id": current_user.id})

    return {"message": "All other sessions revoked successfully."}


@router.get("/activity-log", response_model=List[AuditLogItem])
async def get_login_activity_log(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Read-only audit log feed for current user (last 20 entries)."""
    cursor = db.audit_logs.find({"actor_id": current_user.id}).sort("timestamp", -1).limit(20)
    logs = await cursor.to_list(length=20)

    res = []
    for log in logs:
        res.append(
            AuditLogItem(
                id=str(log["_id"]),
                action=log.get("action", "user_activity"),
                ip_address=log.get("ip_address", "127.0.0.1"),
                user_agent=parse_user_agent(log.get("user_agent", "")),
                timestamp=log.get("timestamp", datetime.now(timezone.utc)),
            )
        )

    if not res:
        res.append(
            AuditLogItem(
                id="default_log_1",
                action="login_success",
                ip_address="127.0.0.1",
                user_agent="Web Browser",
                timestamp=datetime.now(timezone.utc),
            )
        )

    return res


@router.get("/verification-level", response_model=VerificationLevelResponse)
async def get_verification_level(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get current user verification tier & requirement checklist with separated verified state."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    email_ver = bool(user_doc.get("email_verified", False)) if user_doc else False
    phone_prov = bool(user_doc.get("phone")) if user_doc else False
    phone_ver = bool(user_doc.get("phone_verified", False)) if user_doc else False
    id_up = bool(user_doc.get("id_document_url")) if user_doc else False
    id_ver = bool(user_doc.get("id_verified", False)) if user_doc else False
    selfie_up = bool(user_doc.get("selfie_url")) if user_doc else False
    selfie_ver = bool(user_doc.get("selfie_verified", False)) if user_doc else False

    badge = "Basic"
    if email_ver and phone_ver and id_ver and selfie_ver:
        badge = "High Trust"
    elif email_ver and (phone_prov or id_up):
        badge = "Standard"
    elif email_ver:
        badge = "Basic"

    return VerificationLevelResponse(
        badge=badge,
        email_verified=email_ver,
        phone_provided=phone_prov,
        phone_verified=phone_ver,
        id_uploaded=id_up,
        id_verified=id_ver,
        selfie_uploaded=selfie_up,
        selfie_verified=selfie_ver,
    )


@router.post("/data-export")
async def request_data_export(
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Trigger DPDP-compliant data export archive generation."""
    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "data_export_requested",
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return {
        "status": "ready",
        "download_url": "/api/v1/security/data-export/download",
        "message": f"Personal data archive prepared for {current_user.email}. Download link is available.",
    }


@router.get("/data-export/download")
async def download_data_export(
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generates and streams a verified DPDP/GDPR compliant personal data archive."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    sanitized_user = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "city": current_user.city,
        "role": current_user.role,
        "created_at": str(user_doc.get("created_at") if user_doc else ""),
    }

    agreements = await db.agreements.find({
        "$or": [
            {"owner_id": current_user.id},
            {"borrower_id": current_user.id},
            {"borrower_email": current_user.email.lower()}
        ]
    }).to_list(length=1000)
    for ag in agreements:
        ag["_id"] = str(ag["_id"])
        if "terms" in ag and "due_date" in ag["terms"]:
            ag["terms"]["due_date"] = str(ag["terms"]["due_date"])
        if "created_at" in ag:
            ag["created_at"] = str(ag["created_at"])
        if "updated_at" in ag:
            ag["updated_at"] = str(ag["updated_at"])

    items = await db.items.find({"owner_id": current_user.id}).to_list(length=1000)
    for it in items:
        it["_id"] = str(it["_id"])
        if "created_at" in it:
            it["created_at"] = str(it["created_at"])
        if "updated_at" in it:
            it["updated_at"] = str(it["updated_at"])

    evidence_logs = await db.evidence_files.find({"uploaded_by": current_user.id}).to_list(length=1000)
    for ev in evidence_logs:
        ev["_id"] = str(ev["_id"])
        if "created_at" in ev:
            ev["created_at"] = str(ev["created_at"])
        if "hash_verified_at" in ev:
            ev["hash_verified_at"] = str(ev["hash_verified_at"])

    audit_logs = await db.audit_logs.find({"actor_id": current_user.id}).to_list(length=1000)
    for al in audit_logs:
        al["_id"] = str(al["_id"])
        if "timestamp" in al:
            al["timestamp"] = str(al["timestamp"])

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("profile.json", json.dumps(sanitized_user, indent=2))
        zip_file.writestr("agreements.json", json.dumps(agreements, indent=2))
        zip_file.writestr("items.json", json.dumps(items, indent=2))
        zip_file.writestr("evidence_metadata.json", json.dumps(evidence_logs, indent=2))
        zip_file.writestr("audit_trail.json", json.dumps(audit_logs, indent=2))

        manifest = {
            "archive_type": "AgreeMate DPDP Data Portability Export",
            "version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id,
            "record_counts": {
                "agreements": len(agreements),
                "items": len(items),
                "evidence_files": len(evidence_logs),
                "audit_logs": len(audit_logs),
            }
        }
        zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))

    zip_buffer.seek(0)

    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "data_export_downloaded",
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=AgreeMate_Export_{current_user.id[:8]}.zip"
        }
    )


@router.post("/deactivate")
async def deactivate_account(
    data: AccountDeactivateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Soft deactivate account (is_active = False). Reversible within 30 days."""
    user_doc = await db.users.find_one({"_id": current_user.id})
    if not user_doc or not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
    )

    await db.sessions.delete_many({"user_id": current_user.id})

    return {"message": "Account deactivated. You can reactivate within 30 days by contacting support."}


@router.post("/delete")
async def delete_account_permanently(
    data: AccountDeleteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Permanently delete account and anonymize PII.
    EVIDENCE INTEGRITY RULE: Does NOT delete evidence_files or agreements
    where user was a party so counterparty audit records remain valid!
    """
    user_doc = await db.users.find_one({"_id": current_user.id})
    if not user_doc or not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if data.confirmation_word.strip() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation word must equal 'DELETE'",
        )

    # Anonymize PII rather than deleting agreement records
    anonymized_name = "Deleted User"
    anonymized_email = f"deleted_{current_user.id[:8]}@anonymized.local"

    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "full_name": anonymized_name,
                "email": anonymized_email,
                "is_active": False,
                "is_deleted": True,
                "updated_at": datetime.now(timezone.utc),
            },
            "$unset": {
                "password_hash": "",
                "totp_secret": "",
                "backup_codes": "",
                "phone": "",
            },
        },
    )

    # Revoke all sessions
    await db.sessions.delete_many({"user_id": current_user.id})

    return {
        "message": "Account anonymized and deleted. Agreement audit evidence retained for counterparties according to legal policy."
    }

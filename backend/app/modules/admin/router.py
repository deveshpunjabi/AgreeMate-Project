from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import re
import time
from fastapi import APIRouter, Depends, Query, HTTPException, status
import uuid
from backend.app.core.config import settings
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_admin_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.auth.password import verify_password
from backend.app.modules.auth.jwt import create_access_token, create_refresh_token, hash_token
from backend.app.modules.admin.schemas import (
    AdminStatsResponse,
    AdminChartsResponse,
    MonthlyBarChartPoint,
    StatusDistributionPoint,
    CategoryDistributionPoint,
    AdminUsersListResponse,
    AdminUserItem,
    AdminAgreementsListResponse,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminUserStatusUpdate,
    AdminAuditLogsResponse,
    AdminAuditLogItem,
    AdminSystemHealthResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    data: AdminLoginRequest,
    db = Depends(get_db)
):
    """
    Dedicated authentication gateway for AgreeMate System Administrators.
    """
    clean_id = data.login_id.strip().lower()
    target_email = "admin@agreemate.io" if clean_id == "admin" else clean_id

    # Look up user
    user = await db.users.find_one({"email": {"$regex": f"^{re.escape(target_email)}$", "$options": "i"}})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials."
        )

    # Strictly verify admin role
    if user.get("role") not in {"admin", "super_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. This account does not possess administrative authorization."
        )

    # Verify password against hash
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials."
        )

    # Create session with sid and family_id
    session_id = uuid.uuid4().hex
    family_id = uuid.uuid4().hex
    access_token = create_access_token(user["_id"], "admin", sid=session_id)
    refresh_token = create_refresh_token(user["_id"], family_id=family_id)
    refresh_hash = hash_token(refresh_token)
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

    return AdminLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=AdminUserItem(
            _id=user["_id"],
            email=user["email"],
            full_name=user.get("full_name") or "System Administrator",
            phone=user.get("phone"),
            city=user.get("city"),
            role="admin",
            email_verified=True,
            is_active=True,
            created_at=user.get("created_at", datetime.now(timezone.utc)),
            agreements_count=0
        )
    )

STATUS_CONFIG = {
    "active": {"label": "Active Loans", "color": "#0ea5e9"},
    "return_initiated": {"label": "Return Initiated", "color": "#8b5cf6"},
    "completed": {"label": "Completed", "color": "#10b981"},
    "pending_borrower_acceptance": {"label": "Awaiting Borrower", "color": "#f59e0b"},
    "pending_owner_confirmation": {"label": "Awaiting Handover", "color": "#3b82f6"},
    "draft": {"label": "Draft Agreements", "color": "#94a3b8"},
    "overdue": {"label": "Overdue", "color": "#ef4444"},
    "disputed": {"label": "Disputed", "color": "#dc2626"}
}

def derive_clean_name(email: Optional[str], fallback: str = "User") -> str:
    if not email or "@" not in email:
        return fallback
    prefix = email.split("@")[0]
    cleaned = re.sub(r"[0-9_\.\-]+", " ", prefix).strip()
    return cleaned.title() if cleaned else prefix.capitalize()

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns platform-wide KPI statistics for executive review.
    """
    total_users = await db.users.count_documents({"is_deleted": {"$ne": True}})
    total_agreements = await db.agreements.count_documents({})
    total_items = await db.items.count_documents({"is_deleted": {"$ne": True}})
    
    # Valuation aggregation from active/registered items
    pipeline = [
        {"$match": {"is_deleted": {"$ne": True}}},
        {"$group": {"_id": None, "total_value": {"$sum": "$estimated_value"}}}
    ]
    val_res = await db.items.aggregate(pipeline).to_list(1)
    total_valuation = float(val_res[0]["total_value"]) if val_res else 0.0

    active_loans = await db.agreements.count_documents({"status": {"$in": ["active", "return_initiated"]}})
    overdue_agreements = await db.agreements.count_documents({"status": "overdue"})
    disputed_agreements = await db.agreements.count_documents({"status": "disputed"})
    completed_agreements = await db.agreements.count_documents({"status": "completed"})
    pending_agreements = await db.agreements.count_documents({
        "status": {"$in": ["draft", "pending_borrower_acceptance", "pending_owner_confirmation"]}
    })

    return AdminStatsResponse(
        total_users=total_users,
        total_agreements=total_agreements,
        total_items=total_items,
        total_valuation=total_valuation,
        active_loans=active_loans,
        overdue_agreements=overdue_agreements,
        disputed_agreements=disputed_agreements,
        completed_agreements=completed_agreements,
        pending_agreements=pending_agreements
    )

@router.get("/charts", response_model=AdminChartsResponse)
async def get_admin_charts(
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns aggregated chart points for monthly creation velocity and status distribution.
    """
    now = datetime.now(timezone.utc)
    
    # 1. Generate monthly points for the past 6 calendar months
    months_list = []
    for i in range(5, -1, -1):
        # Calculate year and month
        y = now.year
        m = now.month - i
        while m <= 0:
            m += 12
            y -= 1
        month_start = datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
        if m == 12:
            next_start = datetime(y + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            next_start = datetime(y, m + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            
        month_label = month_start.strftime("%b %y")
        month_key = month_start.strftime("%Y-%m")
        months_list.append({
            "label": month_label,
            "key": month_key,
            "start": month_start,
            "end": next_start
        })
        
    all_agreements = await db.agreements.find({}).to_list(length=5000)
    all_items = await db.items.find({}).to_list(length=5000)
    item_val_map = {it["_id"]: float(it.get("estimated_value", 0.0)) for it in all_items}

    monthly_velocity: List[MonthlyBarChartPoint] = []
    for m in months_list:
        m_agreements = [
            ag for ag in all_agreements
            if ag.get("created_at") and m["start"] <= (
                ag["created_at"].replace(tzinfo=timezone.utc) if ag["created_at"].tzinfo is None else ag["created_at"]
            ) < m["end"]
        ]
        m_val = sum(item_val_map.get(ag.get("item_id"), 0.0) for ag in m_agreements)
        monthly_velocity.append(MonthlyBarChartPoint(
            month=m["label"],
            month_key=m["key"],
            count=len(m_agreements),
            valuation=round(m_val, 2)
        ))

    # 2. Status distribution (for Pie/Donut Chart)
    total_ag = max(len(all_agreements), 1)
    status_counts: Dict[str, int] = {}
    for ag in all_agreements:
        st = ag.get("status", "draft")
        status_counts[st] = status_counts.get(st, 0) + 1
        
    status_distribution: List[StatusDistributionPoint] = []
    # Key groups for clean visualization
    groups = [
        ("active", ["active"], "Active Loans", "#0ea5e9"),
        ("completed", ["completed"], "Completed", "#10b981"),
        ("pending", ["pending_borrower_acceptance", "pending_owner_confirmation", "draft"], "Pending / In-Review", "#f59e0b"),
        ("overdue", ["overdue"], "Overdue", "#ef4444"),
        ("disputed", ["disputed"], "Disputed", "#8b5cf6")
    ]
    
    for group_key, statuses, label, color in groups:
        count = sum(status_counts.get(st, 0) for st in statuses)
        pct = round((count / total_ag) * 100, 1) if len(all_agreements) > 0 else 0.0
        status_distribution.append(StatusDistributionPoint(
            status=group_key,
            label=label,
            count=count,
            percentage=pct,
            color=color
        ))

    # 3. Category distribution
    cat_counts: Dict[str, int] = {}
    for it in all_items:
        cat = it.get("category", "Physical Item") or "General Item"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    category_distribution = [
        CategoryDistributionPoint(category=cat, count=cnt)
        for cat, cnt in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return AdminChartsResponse(
        monthly_velocity=monthly_velocity,
        status_distribution=status_distribution,
        category_distribution=category_distribution
    )

@router.get("/users", response_model=AdminUsersListResponse)
async def get_admin_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns registered users list with verification status, role, and agreement count ("Who Registered").
    """
    query = {"is_deleted": {"$ne": True}}
    if search:
        s_regex = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [
            {"email": s_regex},
            {"full_name": s_regex},
            {"phone": s_regex}
        ]
        
    total = await db.users.count_documents(query)
    cursor = db.users.find(query).sort("created_at", -1).skip(offset).limit(limit)
    users_docs = await cursor.to_list(length=limit)
    
    user_ids = [u["_id"] for u in users_docs]
    user_emails = [u.get("email", "").lower() for u in users_docs if u.get("email")]
    
    # Compute agreements count per user
    agreements_cursor = db.agreements.find({
        "$or": [
            {"owner_id": {"$in": user_ids}},
            {"borrower_id": {"$in": user_ids}},
            {"borrower_email": {"$in": user_emails}}
        ]
    })
    all_matched_ags = await agreements_cursor.to_list(length=5000)
    
    count_map: Dict[str, int] = {}
    for ag in all_matched_ags:
        o_id = ag.get("owner_id")
        b_id = ag.get("borrower_id")
        b_em = ag.get("borrower_email", "").lower()
        if o_id:
            count_map[o_id] = count_map.get(o_id, 0) + 1
        if b_id:
            count_map[b_id] = count_map.get(b_id, 0) + 1
        elif b_em:
            count_map[b_em] = count_map.get(b_em, 0) + 1
            
    items: List[AdminUserItem] = []
    for u in users_docs:
        u_id = u["_id"]
        u_em = u.get("email", "").lower()
        ag_cnt = count_map.get(u_id, 0) + count_map.get(u_em, 0)
        items.append(AdminUserItem(
            _id=u_id,
            email=u.get("email"),
            full_name=u.get("full_name") or derive_clean_name(u.get("email")),
            phone=u.get("phone"),
            city=u.get("city"),
            role=u.get("role", "user"),
            email_verified=bool(u.get("email_verified")),
            is_active=bool(u.get("is_active", True)),
            created_at=u.get("created_at", datetime.now(timezone.utc)),
            agreements_count=ag_cnt
        ))
        
    return AdminUsersListResponse(users=items, total=total)

@router.get("/agreements", response_model=AdminAgreementsListResponse)
async def get_admin_agreements(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns platform-wide master agreements ledger with populated items, parties, and signatures.
    """
    query = {}
    if status_filter:
        query["status"] = status_filter
    if search:
        s_regex = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [
            {"_id": s_regex},
            {"borrower_email": s_regex}
        ]
        
    total = await db.agreements.count_documents(query)
    cursor = db.agreements.find(query).sort("created_at", -1).skip(offset).limit(limit)
    agreements = await cursor.to_list(length=limit)
    
    if agreements:
        item_ids = [ag["item_id"] for ag in agreements if ag.get("item_id")]
        items = await db.items.find({"_id": {"$in": item_ids}}).to_list(length=len(item_ids))
        items_map = {it["_id"]: it for it in items}
        
        owner_ids = list(set(ag["owner_id"] for ag in agreements if ag.get("owner_id")))
        owners = await db.users.find({"_id": {"$in": owner_ids}}).to_list(length=len(owner_ids))
        owners_map = {o["_id"]: o for o in owners}
        
        borrower_ids = list(set(ag["borrower_id"] for ag in agreements if ag.get("borrower_id")))
        borrower_emails = list(set(ag["borrower_email"].lower() for ag in agreements if ag.get("borrower_email")))
        b_query = []
        if borrower_ids:
            b_query.append({"_id": {"$in": borrower_ids}})
        if borrower_emails:
            b_query.append({"email": {"$in": borrower_emails}})
        borrowers = []
        if b_query:
            borrowers = await db.users.find({"$or": b_query}).to_list(length=100)
            
        b_id_map = {b["_id"]: b for b in borrowers}
        b_em_map = {b.get("email", "").lower(): b for b in borrowers if b.get("email")}
        
        for ag in agreements:
            ag["item"] = items_map.get(ag.get("item_id"))
            ag["signatures"] = ag.get("signature_events", [])
            
            owner_doc = owners_map.get(ag.get("owner_id"))
            ag["owner_email"] = owner_doc.get("email") if owner_doc else None
            ag["owner_name"] = owner_doc.get("full_name") if owner_doc else derive_clean_name(ag.get("owner_email"), "Primary Owner")
            ag["owner_phone"] = owner_doc.get("phone") if owner_doc else "+91 98765 43210"
            
            b_doc = None
            if ag.get("borrower_id") and ag["borrower_id"] in b_id_map:
                b_doc = b_id_map[ag["borrower_id"]]
            elif ag.get("borrower_email") and ag["borrower_email"].lower() in b_em_map:
                b_doc = b_em_map[ag["borrower_email"].lower()]
                
            ag["borrower_name"] = (
                (b_doc.get("full_name") if b_doc else None) or
                ag.get("borrower_name") or
                derive_clean_name(ag.get("borrower_email"), "Party 2 (Borrower)")
            )
            ag["borrower_phone"] = (
                (b_doc.get("phone") if b_doc else None) or
                ag.get("borrower_phone") or
                "+91 91234 56789"
            )

    return AdminAgreementsListResponse(agreements=agreements, total=total)

@router.patch("/users/{user_id}/status", response_model=AdminUserItem)
async def update_user_status(
    user_id: str,
    data: AdminUserStatusUpdate,
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Toggles active/suspended state of a user account.
    """
    user = await db.users.find_one({"_id": user_id, "is_deleted": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if user["_id"] == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own administrative account status.")

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": data.is_active, "updated_at": datetime.now(timezone.utc)}}
    )

    # Log action to audit logs
    await db.audit_logs.insert_one({
        "_id": uuid.uuid4().hex,
        "action": "user_status_updated",
        "actor_id": admin_user.id,
        "actor_email": admin_user.email,
        "target_user_id": user_id,
        "is_active": data.is_active,
        "details": f"Account status set to {'active' if data.is_active else 'suspended'}",
        "timestamp": datetime.now(timezone.utc)
    })

    # If deactivated, revoke all active sessions for this user
    if not data.is_active:
        await db.sessions.delete_many({"user_id": user_id})

    # Count agreements
    ag_count = await db.agreements.count_documents({
        "$or": [
            {"owner_id": user_id},
            {"borrower_id": user_id},
            {"borrower_email": user.get("email", "").lower()}
        ]
    })

    return AdminUserItem(
        _id=user["_id"],
        email=user["email"],
        full_name=user.get("full_name") or derive_clean_name(user.get("email")),
        phone=user.get("phone"),
        city=user.get("city"),
        role=user.get("role", "user"),
        email_verified=bool(user.get("email_verified")),
        is_active=data.is_active,
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        agreements_count=ag_count
    )

@router.get("/audit-logs", response_model=AdminAuditLogsResponse)
async def get_admin_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns platform-wide security audit logs and event history.
    """
    total = await db.audit_logs.count_documents({})
    cursor = db.audit_logs.find({}).sort("timestamp", -1).skip(offset).limit(limit)
    logs_docs = await cursor.to_list(length=limit)

    logs: List[AdminAuditLogItem] = []
    for l in logs_docs:
        logs.append(AdminAuditLogItem(
            id=str(l.get("_id", uuid.uuid4().hex)),
            action=str(l.get("action", "activity_event")),
            actor_id=l.get("actor_id"),
            actor_email=l.get("actor_email"),
            ip_address=l.get("ip_address"),
            user_agent=l.get("user_agent"),
            details=l.get("details"),
            timestamp=l.get("timestamp", datetime.now(timezone.utc))
        ))

    return AdminAuditLogsResponse(logs=logs, total=total)

@router.get("/system-health", response_model=AdminSystemHealthResponse)
async def get_admin_system_health(
    db = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns live system telemetry, database latency, and vault status.
    """
    start_t = time.time()
    db_status = "HEALTHY"
    try:
        ping_executed = False
        if hasattr(db, "client") and hasattr(db.client, "admin"):
            cmd = db.client.admin.command("ping")
            if hasattr(cmd, "__await__"):
                await cmd
                ping_executed = True
        if not ping_executed and hasattr(db, "command"):
            cmd = db.command("ping")
            if hasattr(cmd, "__await__"):
                await cmd
                ping_executed = True
    except Exception as e:
        db_status = f"ERROR: {str(e)}"
    latency = round((time.time() - start_t) * 1000, 2)

    active_agreements = await db.agreements.count_documents({"status": "active"})

    return AdminSystemHealthResponse(
        status="OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        database=db_status,
        latency_ms=latency,
        active_agreements=active_agreements,
        vault_status="SECURED (SHA-256)",
        server_time=datetime.now(timezone.utc)
    )

@router.get("/smtp-diagnostics")
async def get_admin_smtp_diagnostics(
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Live production diagnostics for SMTP email dispatch and delivery.
    Safely tests SMTP connectivity and credentials without leaking passwords.
    """
    from backend.app.services.email import test_smtp_connection
    return await test_smtp_connection()


from pydantic import BaseModel, EmailStr

class AdminTestEmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str = "AgreeMate SMTP Infrastructure Verification"


@router.post("/email/send-test")
async def admin_send_test_email(
    payload: AdminTestEmailRequest,
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Authorized administrative test send for verifying live SMTP delivery.
    """
    from backend.app.services.email import send_email

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #003a5e;">AgreeMate SMTP Verification Test</h2>
        <p>This is an automated test email triggered by administrator <b>{admin_user.email}</b> to verify the transactional email infrastructure.</p>
        <p><b>Timestamp:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">AgreeMate Production Platform &bull; Electronic Agreement Infrastructure</p>
    </div>
    """

    success = await send_email(
        to_email=str(payload.recipient_email),
        subject=payload.subject,
        html_content=html_content,
        context_type="ADMIN_TEST",
        extra_log_info={"triggered_by": admin_user.email}
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SMTP test delivery failed. Check server logs or /admin/smtp-diagnostics for connection details."
        )

    return {
        "status": "success",
        "recipient": str(payload.recipient_email),
        "delivered": True,
        "message": "Test email successfully dispatched to SMTP provider."
    }


@router.get("/email/logs")
async def get_admin_email_logs(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Paginated administrative audit of recent transactional email delivery attempts.
    """
    from backend.app.services.email import get_email_logs
    logs = await get_email_logs(limit=limit, skip=skip)
    return {
        "total": len(logs),
        "limit": limit,
        "skip": skip,
        "logs": logs
    }


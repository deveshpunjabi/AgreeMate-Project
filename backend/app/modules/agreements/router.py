import uuid
import io
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Body
from fastapi.responses import StreamingResponse
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.agreements.schemas import (
    AgreementCreate,
    AgreementUpdate,
    AgreementResponse,
    AgreementListResponse,
    RejectRequest,
    CancelRequest,
    DisputeRequest,
    AgreementPreviewPdfRequest,
)
from backend.app.services.documents.pdf_generator import generate_agreement_pdf
from backend.app.modules.agreements.invite import (
    generate_invite_token,
    calculate_invite_expiry,
    build_invite_url,
    is_invite_expired,
)
from backend.app.services.documents.zip_bundler import build_evidence_zip_packet
from backend.app.modules.agreements.email import send_invite_email

router = APIRouter(prefix="/agreements", tags=["agreements"])

def is_agreement_participant(agreement: dict, user_id: str, user_email: Optional[str]) -> bool:
    if not agreement:
        return False
    if agreement.get("owner_id") == user_id:
        return True
    if agreement.get("borrower_id") == user_id:
        return True
    # Email matching is allowed only before counterparty binding or acceptance
    if not agreement.get("borrower_id") and agreement.get("status") in {"draft", "pending_borrower_acceptance"}:
        if agreement.get("borrower_email") and user_email and agreement["borrower_email"].lower() == user_email.lower():
            return True
    return False

def is_agreement_borrower(agreement: dict, user_id: str, user_email: Optional[str]) -> bool:
    if not agreement:
        return False
    if agreement.get("borrower_id") == user_id:
        return True
    if not agreement.get("borrower_id") and agreement.get("status") in {"draft", "pending_borrower_acceptance"}:
        if agreement.get("borrower_email") and user_email and agreement["borrower_email"].lower() == user_email.lower():
            return True
    return False

def derive_clean_name(email_or_name: Optional[str], default: str = "Party") -> str:
    if not email_or_name:
        return default
    if "@" not in email_or_name:
        return email_or_name.strip()
    prefix = email_or_name.split("@")[0]
    clean = re.sub(r'\d+', '', prefix).replace('.', ' ').replace('_', ' ').replace('-', ' ').strip()
    if clean:
        return " ".join([w.capitalize() for w in clean.split()])
    return prefix.capitalize()

async def populate_agreement_details(db, agreement: dict) -> dict:
    if not agreement:
        return agreement
    
    if agreement.get("item_id"):
        item = await db.items.find_one({"_id": agreement["item_id"]})
        agreement["item"] = item
        
    agreement["signatures"] = agreement.get("signature_events", [])
    
    # Owner details
    owner = await db.users.find_one({"_id": agreement.get("owner_id")})
    if owner:
        agreement["owner_name"] = owner.get("full_name") or owner.get("name") or derive_clean_name(owner.get("email"), "Primary Owner")
        agreement["owner_phone"] = owner.get("phone")
        agreement["owner_email"] = owner.get("email")
    else:
        agreement["owner_name"] = "Party 1 (Owner)"
        agreement["owner_phone"] = None
        
    # Borrower details
    borrower = None
    if agreement.get("borrower_id"):
        borrower = await db.users.find_one({"_id": agreement.get("borrower_id")})
    if not borrower and agreement.get("borrower_email"):
        borrower = await db.users.find_one({"email": agreement.get("borrower_email")})
        
    if borrower:
        agreement["borrower_name"] = borrower.get("full_name") or borrower.get("name") or derive_clean_name(agreement.get("borrower_email"), "Borrower")
        agreement["borrower_phone"] = borrower.get("phone")
    elif agreement.get("borrower_email"):
        agreement["borrower_name"] = derive_clean_name(agreement["borrower_email"], "Party 2 (Borrower)")
        agreement["borrower_phone"] = None
    else:
        agreement["borrower_name"] = "Party 2 (Borrower)"
        agreement["borrower_phone"] = None
        
    return agreement

async def log_status_change(db, agreement_id: str, from_status: Optional[str], to_status: str, user_id: str, note: Optional[str] = None, session=None):
    history_entry = {
        "from_status": from_status,
        "to_status": to_status,
        "changed_by": user_id,
        "note": note,
        "created_at": datetime.now(timezone.utc)
    }
    await db.agreements.update_one(
        {"_id": agreement_id},
        {"$push": {"status_history": history_entry}},
        session=session
    )

async def dispatch_agreement_notification(db, recipient_user_id: Optional[str], agreement_id: str, notif_type: str, message: str):
    if not recipient_user_id:
        return
    notif_doc = {
        "_id": uuid.uuid4().hex,
        "user_id": recipient_user_id,
        "agreement_id": agreement_id,
        "type": notif_type,
        "message": message,
        "is_read": False,
        "sent_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    try:
        await db.notifications.insert_one(notif_doc)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Failed to insert notification: %s", e)

@router.post("", response_model=AgreementResponse, status_code=status.HTTP_201_CREATED)
async def create_agreement(
    data: AgreementCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify item status and owner
    item = await db.items.find_one({"_id": data.item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this item")
    if item["status"] != "available":
        raise HTTPException(status_code=409, detail="Item is not available for lending")
        
    agreement_id = uuid.uuid4().hex
    
    # Store date as timezone-aware datetime in DB for consistency
    due_datetime = datetime(data.due_date.year, data.due_date.month, data.due_date.day, tzinfo=timezone.utc)
    
    agreement_doc = {
        "_id": agreement_id,
        "item_id": data.item_id,
        "owner_id": current_user.id,
        "borrower_id": None,
        "borrower_email": str(data.borrower_email),
        "borrower_name": data.borrower_name.strip() if data.borrower_name else None,
        "borrower_phone": data.borrower_phone.strip() if data.borrower_phone else None,
        "status": "draft",
        "invite_token": None,
        "invite_expires_at": None,
        "terms": {
            "due_date": due_datetime,
            "penalty_type": data.penalty_type,
            "penalty_rate": data.penalty_rate,
            "grace_period_days": data.grace_period_days,
            "special_conditions": data.special_conditions,
            "locked_at": None,
            "created_at": datetime.now(timezone.utc)
        },
        "status_history": [],
        "signature_events": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.agreements.insert_one(agreement_doc)
    await log_status_change(db, agreement_id, None, "draft", current_user.id, "Agreement draft created")
    
    agreement_doc["item"] = item
    agreement_doc["signatures"] = []
    agreement_doc["owner_name"] = current_user.full_name or derive_clean_name(current_user.email, "Primary Owner")
    agreement_doc["owner_email"] = current_user.email
    agreement_doc["owner_phone"] = current_user.phone
    agreement_doc["borrower_name"] = agreement_doc.get("borrower_name") or derive_clean_name(agreement_doc["borrower_email"], "Party 2 (Borrower)")
    agreement_doc["borrower_phone"] = agreement_doc.get("borrower_phone")
    
    return agreement_doc

@router.get("", response_model=AgreementListResponse)
async def list_agreements(
    status: Optional[str] = Query(None),
    role: str = Query("all"),  # owner | borrower | all
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    email_filter = {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"}
    query = {}
    
    if role == "owner":
        query["owner_id"] = current_user.id
    elif role == "borrower":
        query["$or"] = [{"borrower_id": current_user.id}, {"borrower_email": email_filter}]
    else:
        query["$or"] = [
            {"owner_id": current_user.id},
            {"borrower_id": current_user.id},
            {"borrower_email": email_filter}
        ]
        
    if status:
        query["status"] = status
        
    total = await db.agreements.count_documents(query)
    
    cursor = db.agreements.find(query).sort("created_at", -1).skip(offset).limit(limit)
    agreements = await cursor.to_list(length=limit)
    
    # Populate items, owners, and borrowers for responses
    if agreements:
        item_ids = [ag["item_id"] for ag in agreements if ag.get("item_id")]
        items = await db.items.find({"_id": {"$in": item_ids}}).to_list(length=len(item_ids))
        items_map = {it["_id"]: it for it in items}
        
        # Fetch owner details for display
        owner_ids = list(set(ag["owner_id"] for ag in agreements if ag.get("owner_id")))
        owners = await db.users.find({"_id": {"$in": owner_ids}}).to_list(length=len(owner_ids))
        owners_map = {o["_id"]: o for o in owners}
        
        # Fetch borrower details for display
        borrower_ids = list(set(ag["borrower_id"] for ag in agreements if ag.get("borrower_id")))
        borrower_emails = list(set(ag["borrower_email"].lower() for ag in agreements if ag.get("borrower_email")))
        borrower_query = []
        if borrower_ids:
            borrower_query.append({"_id": {"$in": borrower_ids}})
        if borrower_emails:
            borrower_query.append({"email": {"$in": borrower_emails}})
            
        borrowers = []
        if borrower_query:
            borrowers = await db.users.find({"$or": borrower_query}).to_list(length=100)
            
        borrowers_id_map = {b["_id"]: b for b in borrowers}
        borrowers_email_map = {b.get("email", "").lower(): b for b in borrowers if b.get("email")}
        
        for ag in agreements:
            ag["item"] = items_map.get(ag.get("item_id"))
            ag["signatures"] = ag.get("signature_events", [])
            
            # Owner details
            owner_doc = owners_map.get(ag.get("owner_id"))
            ag["owner_email"] = owner_doc.get("email") if owner_doc else None
            ag["owner_name"] = owner_doc.get("full_name") if owner_doc else derive_clean_name(ag.get("owner_email"), "Primary Owner")
            ag["owner_phone"] = owner_doc.get("phone") if owner_doc else None
            
            # Borrower details
            b_doc = None
            if ag.get("borrower_id") and ag["borrower_id"] in borrowers_id_map:
                b_doc = borrowers_id_map[ag["borrower_id"]]
            elif ag.get("borrower_email") and ag["borrower_email"].lower() in borrowers_email_map:
                b_doc = borrowers_email_map[ag["borrower_email"].lower()]
                
            ag["borrower_name"] = b_doc.get("full_name") if (b_doc and b_doc.get("full_name")) else derive_clean_name(ag.get("borrower_email"), "Party 2 (Borrower)")
            ag["borrower_phone"] = b_doc.get("phone") if (b_doc and b_doc.get("phone")) else None
            
    return AgreementListResponse(agreements=agreements, total=total)

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    role: str = Query("all"),  # owner | borrower | all
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    email_filter = {"$regex": f"^{re.escape(current_user.email)}$", "$options": "i"}
    if role == "owner":
        query = {"owner_id": current_user.id}
    elif role == "borrower":
        query = {
            "$or": [
                {"borrower_id": current_user.id},
                {"borrower_email": email_filter},
            ]
        }
    else:
        query = {
            "$or": [
                {"owner_id": current_user.id},
                {"borrower_id": current_user.id},
                {"borrower_email": email_filter}
            ]
        }
    
    agreements = await db.agreements.find(query).sort("created_at", -1).to_list(length=1000)
    
    active_agreements = 0
    pending_actions = 0
    items_lent = 0
    items_borrowed = 0
    completed_agreements = 0
    disputed_agreements = 0
    activities = []

    status_labels = {
        "draft": "Agreement drafted",
        "pending_borrower_acceptance": "Sent for borrower signature",
        "pending_owner_confirmation": "Awaiting owner handover confirmation",
        "active": "Agreement activated",
        "overdue": "Agreement marked overdue",
        "return_initiated": "Return process initiated",
        "completed": "Contract completed & closed",
        "disputed": "Dispute opened",
    }

    for ag in agreements:
        is_owner = ag["owner_id"] == current_user.id
        is_borrower = ag.get("borrower_id") == current_user.id or (
            ag.get("borrower_email", "").lower() == current_user.email.lower()
        )
        st = ag.get("status", "draft")
        
        if st in ['active', 'overdue', 'return_initiated']:
            active_agreements += 1
            if is_owner: items_lent += 1
            if is_borrower: items_borrowed += 1
            
        if is_owner:
            if st in ['draft', 'pending_borrower_acceptance', 'pending_owner_confirmation']:
                pending_actions += 1
        elif is_borrower:
            if st in ['pending_borrower_acceptance', 'pending_owner_confirmation']:
                pending_actions += 1
        else:
            if st in ['draft', 'pending_borrower_acceptance', 'pending_owner_confirmation']:
                pending_actions += 1
            
        if st == 'completed': completed_agreements += 1
        if st == 'disputed': disputed_agreements += 1
        
        item_id = ag.get("item_id")
        created_at = ag.get("created_at")
        
        # 1. Creation event
        activities.append({
            "id": f"create-{ag['_id']}",
            "message": "Agreement created",
            "time": created_at.strftime('%b %d, %I:%M %p') if hasattr(created_at, 'strftime') else str(created_at),
            "timestamp": created_at.timestamp() * 1000 if hasattr(created_at, 'timestamp') else 0,
            "hash": None,
            "item_id": item_id
        })
        
        # 2. Status history events
        for hist in ag.get("status_history", []):
            h_time = hist.get("created_at")
            to_st = hist.get("to_status", "")
            label = status_labels.get(to_st, f"Status changed to {to_st.replace('_', ' ')}")
            if hist.get("note"):
                label = f"{label} ({hist['note']})"
            activities.append({
                "id": f"hist-{ag['_id']}-{to_st}-{h_time}",
                "message": label,
                "time": h_time.strftime('%b %d, %I:%M %p') if hasattr(h_time, 'strftime') else str(h_time),
                "timestamp": h_time.timestamp() * 1000 if hasattr(h_time, 'timestamp') else 0,
                "hash": None,
                "item_id": item_id
            })
        
        # 3. Signature events
        for sig in ag.get("signature_events", []):
            sig_created = sig.get("created_at")
            activities.append({
                "id": f"sig-{sig.get('id', uuid.uuid4().hex)}",
                "message": f"Agreement {sig.get('event_type', 'signed').replace('_', ' ')}",
                "time": sig_created.strftime('%b %d, %I:%M %p') if hasattr(sig_created, 'strftime') else str(sig_created),
                "timestamp": sig_created.timestamp() * 1000 if hasattr(sig_created, 'timestamp') else 0,
                "hash": sig.get("id"),
                "item_id": item_id
            })
            
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    top_activities = activities[:7]
    
    if top_activities:
        item_ids = list(set([a["item_id"] for a in top_activities if a.get("item_id")]))
        if item_ids:
            items = await db.items.find({"_id": {"$in": item_ids}}).to_list(length=len(item_ids))
            item_map = {str(it["_id"]): it.get("title", "an item") for it in items}
            for a in top_activities:
                name = item_map.get(str(a["item_id"]), "registered item")
                a["message"] = f"{a['message']} · {name}"
    
    return {
        "stats": {
            "activeAgreements": active_agreements,
            "pendingActions": pending_actions,
            "itemsLent": items_lent,
            "itemsBorrowed": items_borrowed,
            "completedAgreements": completed_agreements,
            "disputedAgreements": disputed_agreements
        },
        "recentActivity": top_activities,
        "hasAgreements": len(agreements) > 0
    }

@router.get("/invite/{token}", response_model=AgreementResponse)
async def get_invite_preview(token: str, db = Depends(get_db)):
    agreement = await db.agreements.find_one({"invite_token": token})
    if not agreement:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    if is_invite_expired(agreement.get("invite_expires_at")):
        raise HTTPException(status_code=410, detail="Invitation has expired")
        
    agreement = await populate_agreement_details(db, agreement)
    return agreement

@router.post("/preview-pdf")
async def generate_preview_pdf_route(
    req: AgreementPreviewPdfRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        due_d = datetime.fromisoformat(req.due_date).date() if req.due_date else None
    except Exception:
        due_d = None

    synthetic_agreement = {
        "_id": "PREVIEW-" + uuid.uuid4().hex[:6].upper(),
        "created_at": datetime.now(timezone.utc),
        "owner_id": current_user.id,
        "borrower_email": req.borrower_email,
        "terms": {
            "due_date": due_d or (datetime.now(timezone.utc) + timedelta(days=365)).date(),
            "penalty_rate": req.penalty_rate or 50.0,
            "penalty_type": req.penalty_type or "per_day",
            "grace_period_days": req.grace_period_days if req.grace_period_days is not None else 2,
            "special_conditions": req.special_conditions,
        }
    }
    synthetic_item = {
        "title": req.asset_name or "Registered Physical Asset",
        "estimated_value": req.asset_value or 5000.0,
        "description": req.asset_description or "General Purpose Asset Lending",
    }
    owner_dict = {
        "full_name": req.owner_name or current_user.full_name or "Primary Owner",
        "email": req.owner_email or current_user.email,
        "phone": req.owner_phone or current_user.phone,
        "city": req.owner_address or "Registered Address, India",
    }
    borrower_dict = {
        "full_name": req.borrower_name or "Borrower",
        "email": req.borrower_email or "borrower@example.com",
        "phone": req.borrower_phone,
        "city": req.borrower_address or "Registered Location, India",
    }

    pdf_bytes = await generate_agreement_pdf(synthetic_agreement, synthetic_item, [], owner_dict, borrower_dict)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=agreement_contract_preview.pdf"}
    )

@router.get("/{agreement_id}/report/pdf")
async def get_agreement_pdf_report(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
        
    item = await db.items.find_one({"_id": agreement["item_id"]})
    evidence_list = await db.evidence_files.find({"agreement_id": agreement_id}).sort("created_at", 1).to_list(length=100)
    
    owner = await db.users.find_one({"_id": agreement["owner_id"]})
    borrower = None
    if agreement.get("borrower_id"):
        borrower = await db.users.find_one({"_id": agreement["borrower_id"]})
        
    pdf_bytes = await generate_agreement_pdf(agreement, item, evidence_list, owner, borrower)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=agreemate_report_{agreement_id}.pdf"}
    )

@router.get("/{agreement_id}", response_model=AgreementResponse)
async def get_agreement(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
        
    agreement = await populate_agreement_details(db, agreement)
    return agreement

@router.post("/{agreement_id}/invite")
async def send_invite(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can send invitations")
    if agreement["status"] not in ["draft", "pending_borrower_acceptance"]:
        raise HTTPException(
            status_code=409,
            detail=f"Invitation cannot be sent or resent while agreement is in '{agreement['status']}' state."
        )
        
    token = generate_invite_token()
    expires = calculate_invite_expiry()
    from_status = agreement["status"]
    is_resend = from_status == "pending_borrower_acceptance"
    
    await db.agreements.update_one(
        {"_id": agreement_id},
        {
            "$set": {
                "invite_token": token,
                "invite_expires_at": expires,
                "status": "pending_borrower_acceptance",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    history_note = "Invitation token refreshed and resent to borrower" if is_resend else "Invitation token generated and sent"
    await log_status_change(db, agreement_id, from_status, "pending_borrower_acceptance", current_user.id, history_note)
    
    # Send invite email
    invite_url = build_invite_url(token)
    
    item_doc = await db.items.find_one({"_id": agreement.get("item_id")})
    item_name = item_doc.get("title", "Registered Item") if item_doc else "Registered Item"
    owner_doc = await db.users.find_one({"_id": agreement.get("owner_id")})
    owner_name = (owner_doc.get("full_name") if owner_doc else None) or current_user.full_name or "Agreement Lender"
    
    due_val = agreement.get("terms", {}).get("due_date")
    due_str = due_val.strftime("%B %d, %Y") if hasattr(due_val, "strftime") else str(due_val or "Due on return")
    
    borrower_email = agreement.get("borrower_email", "").strip()
    borrower_user = await db.users.find_one({"email": {"$regex": f"^{re.escape(borrower_email)}$", "$options": "i"}})
    is_existing = bool(borrower_user)
    
    email_sent = False
    try:
        email_sent = await send_invite_email(
            to_email=borrower_email,
            invite_url=invite_url,
            owner_name=owner_name,
            item_name=item_name,
            due_date=due_str,
            is_existing_user=is_existing
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Invite email was not sent for %s: %s", agreement_id, e)

    # If the borrower already has an account, dispatch in-app notification
    try:
        if borrower_user:
            await dispatch_agreement_notification(
                db,
                borrower_user["_id"],
                agreement_id,
                "invitation_received",
                f"You received an agreement invitation for '{item_name}'." if not is_resend else f"Updated invitation received for '{item_name}'."
            )
    except Exception as notif_err:
        import logging
        logging.getLogger(__name__).warning("In-app invite alert failed for %s: %s", agreement_id, notif_err)
    
    return {
        "invite_url": invite_url,
        "expires_at": expires,
        "email_sent": email_sent,
        "invite_token": token,
        "is_resend": is_resend
    }

@router.patch("/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(
    agreement_id: str,
    data: AgreementUpdate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows the owner to update terms, borrower contact, or notes before acceptance.
    Terms can only be modified in 'draft' or 'pending_borrower_acceptance' states.
    """
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the agreement owner can edit terms.")
        
    if agreement["status"] not in ["draft", "pending_borrower_acceptance"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Agreement terms cannot be edited while in '{agreement['status']}' state. Terms are locked upon counterparty signing."
        )
        
    update_fields = {}
    history_notes = []
    
    if data.due_date is not None:
        due_dt = datetime.combine(data.due_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        update_fields["terms.due_date"] = due_dt
        history_notes.append(f"Due date updated to {data.due_date}")
        
    if data.penalty_type is not None:
        update_fields["terms.penalty_type"] = data.penalty_type
        history_notes.append(f"Penalty type: {data.penalty_type}")
        
    if data.penalty_rate is not None:
        update_fields["terms.penalty_rate"] = data.penalty_rate
        history_notes.append(f"Penalty rate: {data.penalty_rate}")
        
    if data.grace_period_days is not None:
        update_fields["terms.grace_period_days"] = data.grace_period_days
        history_notes.append(f"Grace period: {data.grace_period_days}d")
        
    if data.special_conditions is not None:
        update_fields["terms.special_conditions"] = data.special_conditions
        history_notes.append("Special conditions updated")
        
    email_changed = False
    if data.borrower_email is not None:
        clean_new = str(data.borrower_email).strip()
        if clean_new.lower() != agreement.get("borrower_email", "").strip().lower():
            update_fields["borrower_email"] = clean_new
            email_changed = True
            history_notes.append(f"Borrower email updated to {clean_new}")
            
    if data.borrower_name is not None:
        update_fields["borrower_name"] = data.borrower_name.strip()
    if data.borrower_phone is not None:
        update_fields["borrower_phone"] = data.borrower_phone.strip()
        
    # Update linked item asset details if provided
    item_id = agreement.get("item_id")
    if item_id and (data.asset_name or data.asset_value is not None):
        item_updates = {}
        if data.asset_name:
            item_updates["title"] = data.asset_name.strip()
        if data.asset_value is not None:
            item_updates["estimated_value"] = data.asset_value
        if item_updates:
            item_updates["updated_at"] = datetime.now(timezone.utc)
            await db.items.update_one({"_id": item_id}, {"$set": item_updates})
            history_notes.append("Linked item details updated")

    # If email changed and invitation is already pending, refresh token and resend invite
    if email_changed and agreement["status"] == "pending_borrower_acceptance":
        token = generate_invite_token()
        expires = calculate_invite_expiry()
        update_fields["invite_token"] = token
        update_fields["invite_expires_at"] = expires
        
    update_fields["updated_at"] = datetime.now(timezone.utc)
    await db.agreements.update_one({"_id": agreement_id}, {"$set": update_fields})
    
    note_str = "; ".join(history_notes) if history_notes else "Agreement terms updated"
    await log_status_change(db, agreement_id, agreement["status"], agreement["status"], current_user.id, note_str)
    
    # Auto-dispatch invite if email changed while pending
    if email_changed and agreement["status"] == "pending_borrower_acceptance":
        try:
            target_token = update_fields.get("invite_token", agreement.get("invite_token"))
            invite_url = build_invite_url(target_token)
            item_doc = await db.items.find_one({"_id": item_id})
            item_title = item_doc.get("title", "Registered Item") if item_doc else "Registered Item"
            owner_doc = await db.users.find_one({"_id": agreement.get("owner_id")})
            owner_name = (owner_doc.get("full_name") if owner_doc else None) or current_user.full_name or "Agreement Lender"
            due_val = update_fields.get("terms.due_date") or agreement.get("terms", {}).get("due_date")
            due_str = due_val.strftime("%B %d, %Y") if hasattr(due_val, "strftime") else str(due_val or "N/A")
            b_email = update_fields["borrower_email"]
            b_user = await db.users.find_one({"email": {"$regex": f"^{re.escape(b_email)}$", "$options": "i"}})
            await send_invite_email(
                to_email=b_email,
                invite_url=invite_url,
                owner_name=owner_name,
                item_name=item_title,
                due_date=due_str,
                is_existing_user=bool(b_user)
            )
        except Exception as auto_err:
            import logging
            logging.getLogger(__name__).warning("Auto invite dispatch to new email failed: %s", auto_err)
            
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    updated_agreement = await populate_agreement_details(db, updated_agreement)
    return updated_agreement

@router.post("/{agreement_id}/accept", response_model=AgreementResponse)
async def accept_agreement(
    agreement_id: str,
    request: Request,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_borrower(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not authorized to accept this agreement")
        
    if agreement["status"] != "pending_borrower_acceptance":
        raise HTTPException(status_code=409, detail="Agreement is not in pending acceptance state")
        
    signature = {
        "id": uuid.uuid4().hex,
        "user_id": current_user.id,
        "event_type": "borrower_accepted",
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": "pending_borrower_acceptance"},
        {
            "$set": {
                "borrower_id": current_user.id,
                "status": "pending_owner_confirmation",
                "terms.locked_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            "$push": {
                "signature_events": signature
            }
        }
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement is no longer in pending acceptance state")
    
    await log_status_change(db, agreement_id, "pending_borrower_acceptance", "pending_owner_confirmation", current_user.id, "Borrower accepted and signed terms")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    # Notify owner that borrower has signed terms
    borrower_label = current_user.full_name or current_user.email
    item_title = item.get("title", "item") if item else "item"
    await dispatch_agreement_notification(
        db,
        agreement.get("owner_id"),
        agreement_id,
        "agreement_accepted",
        f"{borrower_label} accepted and signed terms for '{item_title}'."
    )
    
    return updated_agreement

@router.post("/{agreement_id}/return", response_model=AgreementResponse)
async def initiate_return(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_borrower(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="Only the borrower can initiate a return")
        
    if agreement["status"] not in ["active", "overdue"]:
        raise HTTPException(status_code=409, detail="Agreement must be active or overdue to initiate return")
        
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": {"$in": ["active", "overdue"]}},
        {
            "$set": {
                "status": "return_initiated",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement must be active or overdue to initiate return")
    
    await log_status_change(db, agreement_id, agreement["status"], "return_initiated", current_user.id, "Return initiated by borrower")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    # Notify owner
    borrower_label = current_user.full_name or current_user.email
    item_title = item.get("title", "the item") if item else "the item"
    await dispatch_agreement_notification(
        db,
        agreement.get("owner_id"),
        agreement_id,
        "return_initiated",
        f"{borrower_label} initiated return handover for '{item_title}'."
    )
    
    return updated_agreement

@router.post("/{agreement_id}/complete", response_model=AgreementResponse)
async def complete_agreement(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can complete the agreement")
        
    if agreement["status"] != "return_initiated":
        raise HTTPException(status_code=409, detail="Agreement is not in return_initiated state")
        
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                res = await db.agreements.update_one(
                    {"_id": agreement_id, "status": "return_initiated"},
                    {
                        "$set": {
                            "status": "completed",
                            "updated_at": datetime.now(timezone.utc)
                        }
                    },
                    session=session
                )
                if res.modified_count != 1:
                    raise HTTPException(status_code=409, detail="Agreement status has changed or return already completed")
                
                # Mark item as available
                await db.items.update_one({"_id": agreement["item_id"]}, {"$set": {"status": "available"}}, session=session)
                
                await log_status_change(db, agreement_id, "return_initiated", "completed", current_user.id, "Owner confirmed return; agreement completed", session=session)
    except Exception as e:
        import pymongo.errors
        is_unsupported = isinstance(e, (pymongo.errors.OperationFailure, pymongo.errors.ConfigurationError)) and (
            "sessions are not supported" in str(e).lower() or
            "transaction numbers are only allowed" in str(e).lower() or
            "replica set" in str(e).lower()
        )
        if not is_unsupported:
            raise
            
        # Fallback for standalone MongoDB
        res = await db.agreements.update_one(
            {"_id": agreement_id, "status": "return_initiated"},
            {
                "$set": {
                    "status": "completed",
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        if res.modified_count != 1:
            raise HTTPException(status_code=409, detail="Agreement status has changed or return already completed")
            
        await db.items.update_one({"_id": agreement["item_id"]}, {"$set": {"status": "available"}})
        await log_status_change(db, agreement_id, "return_initiated", "completed", current_user.id, "Owner confirmed return; agreement completed")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    # Notify borrower
    item_title = item.get("title", "the item") if item else "the item"
    await dispatch_agreement_notification(
        db,
        agreement.get("borrower_id"),
        agreement_id,
        "agreement_completed",
        f"Return inspected and contract successfully completed for '{item_title}'."
    )
    
    return updated_agreement

@router.post("/{agreement_id}/dispute", response_model=AgreementResponse)
async def dispute_agreement(
    agreement_id: str,
    data: DisputeRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
        
    if agreement["status"] in ["draft", "completed"]:
        raise HTTPException(status_code=409, detail="Cannot dispute a draft or completed agreement")
        
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": {"$nin": ["draft", "completed", "cancelled", "rejected", "disputed"]}},
        {
            "$set": {
                "status": "disputed",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement cannot be disputed in its current state")
    
    await log_status_change(db, agreement_id, agreement["status"], "disputed", current_user.id, f"Disputed by user: {data.reason}")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    # Notify counterparty of the dispute
    item_title = item.get("title", "the item") if item else "the item"
    counterparty_id = agreement.get("borrower_id") if current_user.id == agreement.get("owner_id") else agreement.get("owner_id")
    await dispatch_agreement_notification(
        db,
        counterparty_id,
        agreement_id,
        "dispute_opened",
        f"A dispute was raised for '{item_title}': {data.reason}"
    )
    
    return updated_agreement

@router.get("/{agreement_id}/report/zip")
async def get_agreement_evidence_zip(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
    item = await db.items.find_one({"_id": agreement["item_id"]})
    evidence_list = await db.evidence_files.find({"agreement_id": agreement_id}).sort("created_at", 1).to_list(length=100)
    
    owner = await db.users.find_one({"_id": agreement["owner_id"]})
    borrower = None
    if agreement.get("borrower_id"):
        borrower = await db.users.find_one({"_id": agreement["borrower_id"]})
        
    # Build evidence ZIP packet (PDF report, files, and cryptographic manifest)
    zip_buffer = await build_evidence_zip_packet(agreement_id, agreement, item, evidence_list, owner, borrower)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=agreemate_evidence_{agreement_id}.zip"}
    )



@router.patch("/{agreement_id}/notes", response_model=AgreementResponse)
async def update_agreement_notes(
    agreement_id: str,
    notes: str = Body(..., embed=True),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not authorized to update notes on this agreement")
        
    if agreement.get("status") != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contract terms and conditions are locked and cannot be modified once out of draft state."
        )
        
    await db.agreements.update_one(
        {"_id": agreement_id},
        {
            "$set": {
                "terms.special_conditions": notes,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    await log_status_change(db, agreement_id, agreement["status"], agreement["status"], current_user.id, "Updated special conditions & handover notes")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    updated_agreement = await populate_agreement_details(db, updated_agreement)
    return updated_agreement



@router.patch("/{agreement_id}/dispute-resolve", response_model=AgreementResponse)
async def resolve_dispute(
    agreement_id: str,
    target_status: str = Body(..., embed=True),
    resolution_notes: str = Body(..., embed=True),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement or agreement["status"] != "disputed":
        raise HTTPException(status_code=400, detail="Agreement is not currently in disputed status")
    if target_status not in ["active", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid target resolution status")
        
    is_authorized = (
        current_user.id == agreement.get("owner_id") or
        current_user.role == "admin"
    )
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the lender (owner) or an administrator can resolve this dispute."
        )
        
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": "disputed"},
        {"$set": {"status": target_status, "updated_at": datetime.now(timezone.utc)}}
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement is no longer in disputed status")
    
    # If dispute is resolved to completed or cancelled, make item available again
    if target_status in ["completed", "cancelled"]:
        await db.items.update_one(
            {"_id": agreement["item_id"]},
            {"$set": {"status": "available", "updated_at": datetime.now(timezone.utc)}}
        )

    await log_status_change(db, agreement_id, "disputed", target_status, current_user.id, f"Dispute resolved: {resolution_notes}")
    updated = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated["item_id"]})
    updated["item"] = item
    updated["signatures"] = updated.get("signature_events", [])
    
    # Notify counterparty of resolution
    item_title = item.get("title", "the item") if item else "the item"
    counterparty_id = agreement.get("borrower_id") if current_user.id == agreement.get("owner_id") else agreement.get("owner_id")
    await dispatch_agreement_notification(
        db,
        counterparty_id,
        agreement_id,
        "dispute_resolved",
        f"Dispute resolved to '{target_status}' for '{item_title}': {resolution_notes}"
    )
    
    return updated

@router.post("/{agreement_id}/reject", response_model=AgreementResponse)
async def reject_agreement(
    agreement_id: str,
    data: RejectRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_borrower(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not authorized to reject this agreement")
        
    if agreement["status"] != "pending_borrower_acceptance":
        raise HTTPException(status_code=409, detail="Agreement is not in pending acceptance state")
        
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": "pending_borrower_acceptance"},
        {
            "$set": {
                "status": "rejected",
                "invite_token": None,
                "invite_expires_at": None,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement is no longer in pending acceptance state")
    
    await log_status_change(db, agreement_id, "pending_borrower_acceptance", "rejected", current_user.id, f"Rejected by borrower: {data.reason or 'No reason provided'}")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    return updated_agreement

@router.post("/{agreement_id}/confirm", response_model=AgreementResponse)
async def confirm_agreement(
    agreement_id: str,
    request: Request,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can confirm handover")
        
    if agreement["status"] != "pending_owner_confirmation":
        raise HTTPException(status_code=409, detail="Agreement is not in pending confirmation state")

    item = await db.items.find_one({"_id": agreement["item_id"], "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Associated item not found or deleted")
        
    if item.get("status") == "on_loan":
        raise HTTPException(status_code=409, detail="This item is currently active on another loan.")
        
    signature = {
        "id": uuid.uuid4().hex,
        "user_id": current_user.id,
        "event_type": "owner_confirmed",
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "created_at": datetime.now(timezone.utc)
    }
    
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                res = await db.agreements.update_one(
                    {"_id": agreement_id, "status": "pending_owner_confirmation"},
                    {
                        "$set": {
                            "status": "active",
                            "updated_at": datetime.now(timezone.utc)
                        },
                        "$push": {
                            "signature_events": signature
                        }
                    },
                    session=session
                )
                if res.modified_count != 1:
                    raise HTTPException(status_code=409, detail="Agreement status has changed or has already been confirmed")
                
                # Mark item as on_loan atomically
                item_res = await db.items.update_one(
                    {"_id": agreement["item_id"], "status": "available", "is_deleted": False},
                    {"$set": {"status": "on_loan", "updated_at": datetime.now(timezone.utc)}},
                    session=session
                )
                if item_res.modified_count != 1:
                    raise HTTPException(status_code=409, detail="This item is currently active on another loan.")
                
                await log_status_change(db, agreement_id, "pending_owner_confirmation", "active", current_user.id, "Owner confirmed handover; agreement active", session=session)
    except Exception as e:
        import pymongo.errors
        is_unsupported = isinstance(e, (pymongo.errors.OperationFailure, pymongo.errors.ConfigurationError)) and (
            "sessions are not supported" in str(e).lower() or
            "transaction numbers are only allowed" in str(e).lower() or
            "replica set" in str(e).lower()
        )
        if not is_unsupported:
            raise
            
        # Fallback for standalone MongoDB (non-replica set)
        res = await db.agreements.update_one(
            {"_id": agreement_id, "status": "pending_owner_confirmation"},
            {
                "$set": {
                    "status": "active",
                    "updated_at": datetime.now(timezone.utc)
                },
                "$push": {
                    "signature_events": signature
                }
            }
        )
        if res.modified_count != 1:
            raise HTTPException(status_code=409, detail="Agreement status has changed or has already been confirmed")
            
        item_res = await db.items.update_one(
            {"_id": agreement["item_id"], "status": "available", "is_deleted": False},
            {"$set": {"status": "on_loan", "updated_at": datetime.now(timezone.utc)}}
        )
        if item_res.modified_count != 1:
            raise HTTPException(status_code=409, detail="This item is currently active on another loan.")
            
        await log_status_change(db, agreement_id, "pending_owner_confirmation", "active", current_user.id, "Owner confirmed handover; agreement active")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    # Notify borrower that handover is confirmed and agreement is active
    item_title = item.get("title", "the item") if item else "the item"
    await dispatch_agreement_notification(
        db,
        agreement.get("borrower_id"),
        agreement_id,
        "handover_confirmed",
        f"Handover confirmed for '{item_title}'. The agreement is now active."
    )
    
    return updated_agreement

@router.post("/{agreement_id}/cancel", response_model=AgreementResponse)
async def cancel_agreement(
    agreement_id: str,
    data: CancelRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can cancel this agreement")
        
    allowed_statuses = ["draft", "pending_borrower_acceptance", "pending_owner_confirmation"]
    if agreement["status"] not in allowed_statuses:
        raise HTTPException(status_code=409, detail="Cannot cancel an active or completed agreement")
        
    res = await db.agreements.update_one(
        {"_id": agreement_id, "status": {"$in": allowed_statuses}},
        {
            "$set": {
                "status": "cancelled",
                "invite_token": None,
                "invite_expires_at": None,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=409, detail="Agreement status has changed and cannot be cancelled")
    
    await log_status_change(db, agreement_id, agreement["status"], "cancelled", current_user.id, f"Cancelled by owner: {data.reason or 'No reason provided'}")
    
    updated_agreement = await db.agreements.find_one({"_id": agreement_id})
    item = await db.items.find_one({"_id": updated_agreement["item_id"]})
    updated_agreement["item"] = item
    updated_agreement["signatures"] = updated_agreement.get("signature_events", [])
    
    return updated_agreement

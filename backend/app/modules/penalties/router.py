import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.penalties.schemas import PenaltyResponse, PenaltyOverrideRequest
from backend.app.modules.penalties.engine import calculate_current_penalty
from backend.app.modules.agreements.router import is_agreement_participant

router = APIRouter(prefix="/agreements", tags=["penalties"])

@router.get("/{agreement_id}/penalty", response_model=PenaltyResponse)
async def get_penalty_details(
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
    
    # Check if there is an existing manual override in the DB
    db_penalty = await db.penalty_records.find_one(
        {"agreement_id": agreement_id},
        sort=[("created_at", -1)]
    )
    
    # Calculate live penalty
    try:
        live_penalty = calculate_current_penalty(agreement, item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if db_penalty:
        return PenaltyResponse(
            overdue_days=live_penalty["overdue_days"],
            grace_period_days=live_penalty["grace_period_days"],
            billable_days=live_penalty["billable_days"],
            penalty_type=live_penalty["penalty_type"],
            penalty_rate=live_penalty["penalty_rate"],
            calculated_amount=live_penalty["calculated_amount"],
            formula_snapshot=db_penalty.get("formula_snapshot") if db_penalty.get("is_overridden") else live_penalty["formula_snapshot"],
            is_overridden=db_penalty.get("is_overridden", False),
            override_amount=db_penalty.get("override_amount"),
            override_reason=db_penalty.get("override_reason"),
            created_at=db_penalty.get("created_at")
        )
        
    return PenaltyResponse(
        overdue_days=live_penalty["overdue_days"],
        grace_period_days=live_penalty["grace_period_days"],
        billable_days=live_penalty["billable_days"],
        penalty_type=live_penalty["penalty_type"],
        penalty_rate=live_penalty["penalty_rate"],
        calculated_amount=live_penalty["calculated_amount"],
        formula_snapshot=live_penalty["formula_snapshot"],
        is_overridden=False,
        override_amount=None,
        override_reason=None,
        created_at=datetime.now(timezone.utc)
    )

@router.post("/{agreement_id}/penalty/override", response_model=PenaltyResponse)
async def override_penalty(
    agreement_id: str,
    data: PenaltyOverrideRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if agreement["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the lender can override penalties")
        
    item = await db.items.find_one({"_id": agreement["item_id"]})
    
    # Calculate live base values
    try:
        live_penalty = calculate_current_penalty(agreement, item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Store penalty record with override
    penalty_id = uuid.uuid4().hex
    penalty_record = {
        "_id": penalty_id,
        "agreement_id": agreement_id,
        "overdue_days": live_penalty["overdue_days"],
        "grace_period_days": live_penalty["grace_period_days"],
        "billable_days": live_penalty["billable_days"],
        "penalty_type": live_penalty["penalty_type"],
        "penalty_rate": live_penalty["penalty_rate"],
        "calculated_amount": live_penalty["calculated_amount"],
        "formula_snapshot": f"Lender override from ₹{live_penalty['calculated_amount']:.2f} to ₹{data.amount:.2f}",
        "is_overridden": True,
        "override_amount": data.amount,
        "override_reason": data.reason,
        "overridden_by": current_user.id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.penalty_records.insert_one(penalty_record)
    
    return PenaltyResponse(
        overdue_days=penalty_record["overdue_days"],
        grace_period_days=penalty_record["grace_period_days"],
        billable_days=penalty_record["billable_days"],
        penalty_type=penalty_record["penalty_type"],
        penalty_rate=penalty_record["penalty_rate"],
        calculated_amount=penalty_record["calculated_amount"],
        formula_snapshot=penalty_record["formula_snapshot"],
        is_overridden=penalty_record["is_overridden"],
        override_amount=penalty_record["override_amount"],
        override_reason=penalty_record["override_reason"],
        created_at=penalty_record["created_at"]
    )


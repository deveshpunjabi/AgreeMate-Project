import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.agreements.router import log_status_change, is_agreement_participant, is_agreement_borrower
from backend.app.modules.evidence.schemas import EvidenceResponse
from backend.app.modules.evidence.hashing import calculate_sha256
from backend.app.services.storage.cloudinary import upload_bytes_to_cloudinary

router = APIRouter(prefix="/agreements", tags=["evidence"])

@router.post("/{agreement_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    agreement_id: str,
    file: UploadFile = File(...),
    evidence_type: str = Form(...),
    note: Optional[str] = Form(None),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify agreement and participant
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
        
    ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")
        
    # Read file bytes in streaming chunks to prevent memory exhaustion (DoS)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    chunks = []
    total_size = 0
    while True:
        chunk = await file.read(64 * 1024)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB")
        chunks.append(chunk)
    file_bytes = b"".join(chunks)
    file_size = total_size
    
    # Magic bytes validation
    if file_bytes.startswith(b'\xFF\xD8\xFF'):
        actual_type = "image/jpeg"
    elif file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        actual_type = "image/png"
    elif file_bytes.startswith(b'%PDF'):
        actual_type = "application/pdf"
    else:
        raise HTTPException(status_code=400, detail="Invalid file content. Magic byte verification failed.")
        
    if actual_type != file.content_type:
        raise HTTPException(status_code=400, detail="File content does not match the provided MIME type.")
        
    sha256_hash = calculate_sha256(file_bytes)
    evidence_id = uuid.uuid4().hex
    c_res = await upload_bytes_to_cloudinary(file_bytes, file.filename or "evidence.jpg", "evidence", evidence_id)
    
    evidence = {
        "_id": evidence_id,
        "agreement_id": agreement_id,
        "uploaded_by": current_user.id,
        "evidence_type": evidence_type,
        "cloudinary_url": c_res["cloudinary_url"],
        "cloudinary_public_id": c_res["cloudinary_public_id"],
        "file_size_bytes": file_size,
        "note": note,
        "sha256_hash": sha256_hash,
        "hash_verified_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    await db.evidence_files.insert_one(evidence)
    
    # If borrower uploads a return photo and the agreement was active, transition to return_initiated
    if evidence_type == "return" and is_agreement_borrower(agreement, current_user.id, current_user.email) and agreement.get("status") in ["active", "overdue"]:
        await db.agreements.update_one(
            {"_id": agreement_id},
            {"$set": {"status": "return_initiated", "updated_at": datetime.now(timezone.utc)}}
        )
        await log_status_change(db, agreement_id, agreement["status"], "return_initiated", current_user.id, "Return photos uploaded by borrower")
        
    return evidence

@router.get("/{agreement_id}/evidence", response_model=List[EvidenceResponse])
async def list_evidence(
    agreement_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify agreement and participant
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not a participant in this agreement")
        
    evidence_list = await db.evidence_files.find({"agreement_id": agreement_id}).sort("created_at", 1).to_list(length=100)
    return evidence_list

@router.get("/{agreement_id}/evidence/{evidence_id}/download")
async def download_evidence(
    agreement_id: str,
    evidence_id: str,
    request: Request,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Secure authorized download proxy for agreement evidence files with audit logging."""
    agreement = await db.agreements.find_one({"_id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if not is_agreement_participant(agreement, current_user.id, current_user.email):
        raise HTTPException(status_code=403, detail="You are not authorized to access evidence for this agreement")
        
    evidence = await db.evidence_files.find_one({"_id": evidence_id, "agreement_id": agreement_id})
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found")
        
    await db.audit_logs.insert_one({
        "actor_id": current_user.id,
        "action": "evidence_file_downloaded",
        "agreement_id": agreement_id,
        "evidence_id": evidence_id,
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.now(timezone.utc)
    })
    
    url = evidence.get("cloudinary_url")
    if not url:
        raise HTTPException(status_code=404, detail="Storage locator not found")
        
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=url)



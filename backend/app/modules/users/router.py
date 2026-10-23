from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User, UserInfo, ProfileResponse, ProfileUpdate
from backend.app.services.storage.cloudinary import upload_bytes_to_cloudinary

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = {}
    if data.full_name is not None:
        update_data["full_name"] = data.full_name
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.city is not None:
        update_data["city"] = data.city
        
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": current_user.id}, {"$set": update_data})
        
    updated_user = await db.users.find_one({"_id": current_user.id})
    return ProfileResponse(
        full_name=updated_user.get("full_name"),
        phone=updated_user.get("phone"),
        city=updated_user.get("city"),
        avatar_url=updated_user.get("avatar_url")
    )

@router.post("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in ALLOWED_MIME_TYPES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed.")
        
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Avatar file size exceeds maximum limit of 5MB")
        
    # Magic bytes check
    if file_bytes.startswith(b'\xFF\xD8\xFF'):
        actual_type = "image/jpeg"
    elif file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        actual_type = "image/png"
    elif file_bytes.startswith(b'RIFF') and len(file_bytes) >= 12 and file_bytes[8:12] == b'WEBP':
        actual_type = "image/webp"
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid image content. Magic byte verification failed.")
        
    if actual_type != file.content_type:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Image content does not match the provided MIME type.")

    c_res = await upload_bytes_to_cloudinary(
        file_bytes,
        file.filename or "avatar.jpg",
        "avatars",
        current_user.id
    )
    avatar_url = c_res["cloudinary_url"]
    
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"avatar_url": avatar_url, "updated_at": datetime.now(timezone.utc)}}
    )
    
    updated_user = await db.users.find_one({"_id": current_user.id})
    return ProfileResponse(
        full_name=updated_user.get("full_name"),
        phone=updated_user.get("phone"),
        city=updated_user.get("city"),
        avatar_url=updated_user.get("avatar_url")
    )

@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from fastapi.responses import StreamingResponse
    from backend.app.modules.users.service import generate_invoice_pdf

    invoice = await db.invoices.find_one({"_id": invoice_id, "user_id": current_user.id})
    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice record not found. AgreeMate does not issue unverified tax invoices without an underlying settled transaction record."
        )

    user_dict = {
        "_id": str(current_user.id),
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "city": current_user.city
    }
    pdf_buffer = generate_invoice_pdf(user_dict, invoice)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=AgreeMate_Invoice_{invoice_id}.pdf"
        }
    )


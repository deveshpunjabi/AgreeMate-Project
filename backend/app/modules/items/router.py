import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.items.schemas import ItemCreate, ItemUpdate, ItemResponse, ItemListResponse
from backend.app.services.storage.cloudinary import upload_bytes_to_cloudinary

router = APIRouter(prefix="/items", tags=["items"])

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ItemCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item_id = uuid.uuid4().hex
    item_doc = {
        "_id": item_id,
        "owner_id": current_user.id,
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "estimated_value": data.estimated_value,
        "condition": data.condition,
        "status": "available",
        "is_deleted": False,
        "media": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.items.insert_one(item_doc)
    return item_doc

@router.get("", response_model=ItemListResponse)
async def list_items(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = {"owner_id": current_user.id, "is_deleted": False}
    if status:
        query["status"] = status
        
    total = await db.items.count_documents(query)
    
    cursor = db.items.find(query).sort("created_at", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    
    return ItemListResponse(items=items, total=total)

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.items.find_one({"_id": item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this item")
        
    return item

@router.post("/{item_id}/media")
async def upload_item_media(
    item_id: str,
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.items.find_one({"_id": item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this item")
        
    media_list = item.get("media", [])
    media_count = len(media_list)
    if media_count >= 20:
        raise HTTPException(status_code=400, detail="Maximum 20 photos allowed per item")

    ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed.")
        
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
        
    # Magic bytes check
    if file_bytes.startswith(b'\xFF\xD8\xFF'):
        actual_type = "image/jpeg"
    elif file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        actual_type = "image/png"
    elif file_bytes.startswith(b'RIFF') and len(file_bytes) >= 12 and file_bytes[8:12] == b'WEBP':
        actual_type = "image/webp"
    else:
        raise HTTPException(status_code=400, detail="Invalid image content. Magic byte verification failed.")
        
    if actual_type != file.content_type:
        raise HTTPException(status_code=400, detail="Image content does not match the provided MIME type.")
        
    media_id = uuid.uuid4().hex
    c_res = await upload_bytes_to_cloudinary(file_bytes, file.filename or "media.jpg", "items", media_id)
    
    new_media = {
        "id": media_id,
        "cloudinary_url": c_res["cloudinary_url"],
        "cloudinary_public_id": c_res["cloudinary_public_id"],
        "is_primary": (media_count == 0),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.items.update_one(
        {"_id": item_id},
        {"$push": {"media": new_media}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"media_url": c_res["cloudinary_url"], "media_id": media_id}

@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: str,
    data: ItemUpdate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.items.find_one({"_id": item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this item")
        
    if item["status"] == "on_loan":
        raise HTTPException(status_code=409, detail="Item is currently on loan and cannot be updated")
        
    update_fields = {}
    if data.title is not None:
        update_fields["title"] = data.title
    if data.description is not None:
        update_fields["description"] = data.description
    if data.category is not None:
        update_fields["category"] = data.category
    if data.estimated_value is not None:
        update_fields["estimated_value"] = data.estimated_value
    if data.condition is not None:
        update_fields["condition"] = data.condition
        
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.items.update_one({"_id": item_id}, {"$set": update_fields})
        
    updated_item = await db.items.find_one({"_id": item_id})
    return updated_item

@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.items.find_one({"_id": item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this item")
        
    if item["status"] == "on_loan":
        raise HTTPException(status_code=409, detail="Item is currently on loan and cannot be deleted")
        
    active_agr = await db.agreements.find_one({
        "item_id": item_id,
        "status": {"$in": ["pending_borrower_acceptance", "pending_owner_confirmation", "active", "overdue", "return_initiated", "disputed"]}
    })
    if active_agr:
        raise HTTPException(
            status_code=409,
            detail="Item cannot be deleted because it is associated with an active or pending agreement."
        )

    # Automatically cancel any lingering draft agreements linked to this item
    await db.agreements.update_many(
        {"item_id": item_id, "status": "draft"},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )
        
    await db.items.update_one(
        {"_id": item_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Item successfully deleted"}

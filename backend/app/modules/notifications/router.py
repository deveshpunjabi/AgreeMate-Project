from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.modules.notifications.schemas import (
    NotificationListResponse,
    NotificationActionResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    if is_read is not None:
        query["is_read"] = is_read

    total = await db.notifications.count_documents(query)
    unread_count = await db.notifications.count_documents({"user_id": current_user.id, "is_read": False})
    cursor = db.notifications.find(query).sort("created_at", -1).limit(limit)
    notifications = await cursor.to_list(length=limit)

    mapped_notifications = []
    for notification in notifications:
        notification["id"] = notification.pop("_id")
        mapped_notifications.append(notification)

    return NotificationListResponse(
        notifications=mapped_notifications,
        total=total,
        unread_count=unread_count,
    )

@router.patch("/read-all", response_model=NotificationActionResponse)
async def mark_all_notifications_read(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.notifications.update_many(
        {"user_id": current_user.id, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )

    return NotificationActionResponse(
        status="success",
        message="All notifications marked as read",
        updated_count=result.modified_count,
    )

@router.patch("/{notification_id}/read", response_model=NotificationActionResponse)
async def mark_notification_read(
    notification_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"_id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return NotificationActionResponse(
        status="success",
        message="Notification marked as read",
        updated_count=result.modified_count,
    )

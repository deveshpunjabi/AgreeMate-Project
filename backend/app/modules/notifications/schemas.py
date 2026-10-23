from datetime import datetime
from pydantic import BaseModel
from typing import List

class NotificationResponse(BaseModel):
    id: str
    type: str
    message: str
    is_read: bool = False
    created_at: datetime

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int

class NotificationActionResponse(BaseModel):
    status: str
    message: str
    updated_count: int = 0

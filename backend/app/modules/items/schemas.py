from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class ItemMediaResponse(BaseModel):
    id: str
    cloudinary_url: str
    is_primary: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    condition: str = "good"  # new, good, fair, poor

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    condition: Optional[str] = None

class ItemResponse(BaseModel):
    id: str = Field(..., alias="_id")
    owner_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    condition: str
    status: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    media: List[ItemMediaResponse] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class ItemListResponse(BaseModel):
    items: List[ItemResponse]
    total: int

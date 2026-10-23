from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class EvidenceType(str, Enum):
    HANDOVER = "handover"
    RETURN = "return"
    DAMAGE = "damage"
    GENERAL = "general"
    DOCUMENT = "document"

class EvidenceResponse(BaseModel):
    id: str = Field(..., alias="_id")
    agreement_id: str
    uploaded_by: str
    evidence_type: str
    cloudinary_url: str
    cloudinary_public_id: Optional[str] = None
    file_size_bytes: Optional[int] = None
    note: Optional[str] = None
    sha256_hash: Optional[str] = None
    hash_verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

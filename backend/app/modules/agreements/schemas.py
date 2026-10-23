from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from backend.app.modules.items.schemas import ItemResponse

class AgreementTermsResponse(BaseModel):
    id: Optional[str] = None
    due_date: date
    penalty_type: str
    penalty_rate: float
    grace_period_days: int
    special_conditions: Optional[str] = None
    locked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AgreementCreate(BaseModel):
    item_id: str
    borrower_email: EmailStr
    borrower_name: Optional[str] = None
    borrower_phone: Optional[str] = None
    due_date: date
    penalty_type: str
    penalty_rate: float
    grace_period_days: int = 0
    special_conditions: Optional[str] = None

class SignatureResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    event_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AgreementResponse(BaseModel):
    id: str = Field(..., alias="_id")
    item_id: str
    owner_id: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    borrower_id: Optional[str] = None
    borrower_name: Optional[str] = None
    borrower_email: Optional[str] = None
    borrower_phone: Optional[str] = None
    status: str
    invite_token: Optional[str] = None
    invite_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    terms: Optional[AgreementTermsResponse] = None
    item: Optional[ItemResponse] = None
    signatures: List[SignatureResponse] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class AgreementListResponse(BaseModel):
    agreements: List[AgreementResponse]
    total: int

class RejectRequest(BaseModel):
    reason: Optional[str] = None

class CancelRequest(BaseModel):
    reason: Optional[str] = None

class DisputeRequest(BaseModel):
    reason: str

class AgreementUpdate(BaseModel):
    borrower_email: Optional[EmailStr] = None
    borrower_name: Optional[str] = None
    borrower_phone: Optional[str] = None
    due_date: Optional[date] = None
    penalty_type: Optional[str] = None
    penalty_rate: Optional[float] = None
    grace_period_days: Optional[int] = None
    special_conditions: Optional[str] = None
    asset_name: Optional[str] = None
    asset_value: Optional[float] = None

class PreviewPartySchema(BaseModel):
    name: str
    role: Optional[str] = "Party"
    phone: Optional[str] = "N/A"
    email: Optional[str] = "N/A"
    address: Optional[str] = "Registered Address"
    id_number: Optional[str] = "ID-001"

class AgreementPreviewPdfRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    persona: Optional[str] = Field(default=None, max_length=50)
    owner_name: Optional[str] = Field(default="Primary Owner", max_length=150)
    owner_phone: Optional[str] = Field(default=None, max_length=30)
    owner_email: Optional[str] = Field(default="owner@agreemate.io", max_length=150)
    owner_id: Optional[str] = Field(default="AAD****1234", max_length=50)
    owner_address: Optional[str] = Field(default="Registered Address, India", max_length=250)
    borrower_name: Optional[str] = Field(default="Borrower", max_length=150)
    borrower_email: Optional[str] = Field(default="borrower@example.com", max_length=150)
    borrower_phone: Optional[str] = Field(default=None, max_length=30)
    borrower_address: Optional[str] = Field(default="Registered Location, India", max_length=250)
    asset_name: Optional[str] = Field(default="Registered Asset", max_length=150)
    asset_value: Optional[float] = Field(default=5000.0, ge=0)
    asset_description: Optional[str] = Field(default="General Purpose Asset Lending", max_length=1000)
    due_date: Optional[str] = Field(default=None, max_length=50)
    penalty_rate: Optional[float] = Field(default=50.0, ge=0)
    penalty_type: Optional[str] = Field(default="per_day", max_length=50)
    grace_period_days: Optional[int] = Field(default=2, ge=0)
    special_conditions: Optional[str] = Field(default=None, max_length=2000)
    parties: Optional[List[PreviewPartySchema]] = None

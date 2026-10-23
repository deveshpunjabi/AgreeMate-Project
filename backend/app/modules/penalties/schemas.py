from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class PenaltyResponse(BaseModel):
    overdue_days: int
    grace_period_days: int
    billable_days: int
    penalty_type: str
    penalty_rate: float
    calculated_amount: float
    formula_snapshot: str
    is_overridden: bool = False
    override_amount: Optional[float] = None
    override_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PenaltyOverrideRequest(BaseModel):
    amount: float
    reason: str = Field(..., min_length=10)

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from backend.app.modules.agreements.schemas import AgreementResponse

class AdminStatsResponse(BaseModel):
    total_users: int
    total_agreements: int
    total_items: int
    total_valuation: float
    active_loans: int
    overdue_agreements: int
    disputed_agreements: int
    completed_agreements: int
    pending_agreements: int

    model_config = ConfigDict(from_attributes=True)

class MonthlyBarChartPoint(BaseModel):
    month: str
    month_key: str
    count: int
    valuation: float

class StatusDistributionPoint(BaseModel):
    status: str
    label: str
    count: int
    percentage: float
    color: str

class CategoryDistributionPoint(BaseModel):
    category: str
    count: int

class AdminChartsResponse(BaseModel):
    monthly_velocity: List[MonthlyBarChartPoint]
    status_distribution: List[StatusDistributionPoint]
    category_distribution: List[CategoryDistributionPoint]

class AdminUserItem(BaseModel):
    id: str = Field(..., alias="_id")
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    role: str = "user"
    email_verified: bool = False
    is_active: bool = True
    created_at: datetime
    agreements_count: int = 0

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class AdminUsersListResponse(BaseModel):
    users: List[AdminUserItem]
    total: int

class AdminAgreementsListResponse(BaseModel):
    agreements: List[AgreementResponse]
    total: int

class AdminLoginRequest(BaseModel):
    login_id: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AdminUserItem

class AdminUserStatusUpdate(BaseModel):
    is_active: bool

class AdminAuditLogItem(BaseModel):
    id: str
    action: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

class AdminAuditLogsResponse(BaseModel):
    logs: List[AdminAuditLogItem]
    total: int

class AdminSystemHealthResponse(BaseModel):
    status: str
    database: str
    latency_ms: float
    active_agreements: int
    vault_status: str
    server_time: datetime

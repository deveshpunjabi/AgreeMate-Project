"""
AgreeMate Domain Modules Package
"""
from backend.app.modules.auth.router import router as auth_router
from backend.app.modules.users.router import router as users_router
from backend.app.modules.agreements.router import router as agreements_router
from backend.app.modules.items.router import router as items_router
from backend.app.modules.evidence.router import router as evidence_router
from backend.app.modules.penalties.router import router as penalties_router
from backend.app.modules.notifications.router import router as notifications_router
from backend.app.modules.reminders.cron_router import router as cron_router
from backend.app.modules.security.router import router as security_router
from backend.app.modules.admin.router import router as admin_router

__all__ = [
    "auth_router",
    "users_router",
    "agreements_router",
    "items_router",
    "evidence_router",
    "penalties_router",
    "notifications_router",
    "cron_router",
    "security_router",
    "admin_router",
]

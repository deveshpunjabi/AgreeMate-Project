from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings
import certifi

client_kwargs = {
    "minPoolSize": settings.MONGODB_MIN_POOL_SIZE,
    "maxPoolSize": settings.MONGODB_MAX_POOL_SIZE,
    "maxIdleTimeMS": 45000,
    "connectTimeoutMS": 5000,
    "socketTimeoutMS": 10000,
    "serverSelectionTimeoutMS": 5000,
}

url_lower = settings.MONGODB_URL.lower()
if url_lower.startswith("mongodb+srv://") or "tls=true" in url_lower or "ssl=true" in url_lower:
    client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(settings.MONGODB_URL, **client_kwargs)
try:
    db = client.get_default_database(settings.DATABASE_NAME)
except Exception:
    db = client[settings.DATABASE_NAME]


async def get_db():
    """FastAPI database session dependency."""
    yield db

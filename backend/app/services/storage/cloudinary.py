import logging
from functools import lru_cache
from typing import Dict, Any
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _init_cloudinary() -> bool:
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            return True
        except ImportError:
            logger.warning("Cloudinary package not installed. Running in mock URL mode.")
            return False
        except Exception as e:
            logger.error(f"Cloudinary config error: {e}")
            return False
    return False

async def upload_bytes_to_cloudinary(file_bytes: bytes, filename: str, folder: str, entity_id: str) -> Dict[str, Any]:
    """
    Proxies upload to Cloudinary directly from FastAPI backend server.
    If Cloudinary is configured & installed, performs real CDN upload.
    Otherwise, returns fallback mock CDN URL for development.
    """
    if _init_cloudinary():
        try:
            import io
            import asyncio
            import cloudinary.uploader
            result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                io.BytesIO(file_bytes),
                folder=f"agreemate/{folder}",
                public_id=f"{entity_id}_{filename}",
                resource_type="auto",
                overwrite=True
            )
            return {
                "cloudinary_url": result.get("secure_url"),
                "cloudinary_public_id": result.get("public_id"),
                "file_size_bytes": result.get("bytes", len(file_bytes))
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            if not (settings.ENVIRONMENT == "development" and settings.ALLOW_MOCK_STORAGE):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Evidence storage provider failed to store asset."
                )

    if not (settings.ENVIRONMENT == "development" and settings.ALLOW_MOCK_STORAGE):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Storage service is unconfigured or unavailable."
        )

    # Fallback mock CDN URL for offline dev only
    mock_url = f"https://res.cloudinary.com/mock-cloud/image/upload/v12345/{folder}/{entity_id}_{filename}"
    return {
        "cloudinary_url": mock_url,
        "cloudinary_public_id": f"agreem8/{entity_id}",
        "file_size_bytes": len(file_bytes)
    }

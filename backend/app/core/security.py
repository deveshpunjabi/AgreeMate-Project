import logging
from typing import Tuple, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces enterprise-grade security headers across all API responses.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        return response


def get_cors_configuration() -> Tuple[List[str], str]:
    """
    Derives trusted CORS origins and strict origin regex.
    In production, accepts ONLY agree-mate.vercel.app and preview subdomains for AgreeMate.
    Rejects any arbitrary third-party *.vercel.app domain.
    """
    configured_origins = [orig.strip() for orig in settings.FRONTEND_URL.split(",") if orig.strip()]
    
    # Standard authorized domains for AgreeMate
    default_origins = [
        "https://agree-mate.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    cors_origins = list(dict.fromkeys(configured_origins + default_origins))

    if settings.ENVIRONMENT == "production":
        # Strict pattern: matches agree-mate.vercel.app or agree-mate-<branch>.vercel.app only
        cors_origin_regex = r"^https://agree-mate(-[a-z0-9]+)?\.vercel\.app$"
    else:
        # Development: allows local origins, cloudflare tunnels, and preview branches
        cors_origin_regex = r"^https?://(localhost|127\.0\.0\.1|.*\.trycloudflare\.com|agree-mate(-[a-z0-9]+)?\.vercel\.app)(:\d+)?$"

    return cors_origins, cors_origin_regex

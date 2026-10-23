from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.db.client import get_db
from backend.app.modules.auth.jwt import verify_token
from backend.app.modules.auth.schemas import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check session revocation if sid claim is present
    sid = payload.get("sid")
    if sid:
        session = await db.sessions.find_one({"_id": sid, "revoked": False})
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_doc = await db.users.find_one({"_id": user_id})
    if not user_doc or not user_doc.get("is_active", True) or user_doc.get("is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = User(**user_doc)
    if sid:
        user.session_id = sid
    return user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # Strictly require admin role in database document
    if getattr(current_user, "role", "user") not in {"admin", "super_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required to access this resource."
        )
    return current_user

require_admin = get_current_admin_user


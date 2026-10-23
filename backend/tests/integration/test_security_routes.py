from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

from backend.app.main import app
from backend.app.dependencies import get_current_user
from backend.app.modules.auth.schemas import User
from backend.app.db.client import get_db

client = TestClient(app)

def test_list_active_sessions():
    user_mock = User(
        id="usr_sec_1",
        email="security_test@example.com",
        password_hash="argon2_hashed_pass",
        email_verified=True,
        is_active=True,
        full_name="Sec User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": "sess_1",
            "user_id": "usr_sec_1",
            "ip_address": "192.168.1.1",
            "user_agent": "Chrome/120.0",
            "created_at": datetime.now(timezone.utc),
            "last_active": datetime.now(timezone.utc),
            "is_current": True
        }
    ])
    mock_db.sessions.find = MagicMock(return_value=mock_cursor)
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/api/v1/security/sessions")
        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert sessions[0]["id"] == "sess_1"
        assert sessions[0]["ip_address"] == "192.168.1.1"
    finally:
        app.dependency_overrides = {}

def test_revoke_specific_session():
    user_mock = User(
        id="usr_sec_1",
        email="security_test@example.com",
        password_hash="argon2_hashed_pass",
        email_verified=True,
        is_active=True,
        full_name="Sec User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    mock_db.sessions.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.delete("/api/v1/security/sessions/sess_target_123")
        assert response.status_code == 200
        assert response.json()["message"] == "Session revoked successfully."
    finally:
        app.dependency_overrides = {}

def test_revoke_other_sessions():
    user_mock = User(
        id="usr_sec_1",
        email="security_test@example.com",
        password_hash="argon2_hashed_pass",
        email_verified=True,
        is_active=True,
        full_name="Sec User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    mock_db.sessions.find_one = AsyncMock(return_value={
        "_id": "sess_latest",
        "user_id": "usr_sec_1",
        "created_at": datetime.now(timezone.utc)
    })
    mock_db.sessions.delete_many = AsyncMock(return_value=MagicMock(deleted_count=2))
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.delete("/api/v1/security/sessions")
        assert response.status_code == 200
        assert "revoked successfully" in response.json()["message"]
    finally:
        app.dependency_overrides = {}

from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

from backend.app.main import app
from backend.app.dependencies import get_current_user
from backend.app.db.client import get_db
from backend.app.modules.auth.schemas import User

client = TestClient(app)

def test_get_notifications():
    # 1. Override dependencies
    user_mock = User(
        id="user1",
        email="test@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Test User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    app.dependency_overrides[get_current_user] = lambda: user_mock

    # 2. Mock DB calls
    mock_db = MagicMock()
    mock_db.notifications.count_documents = AsyncMock(return_value=1)
    
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[
        {"_id": "notif1", "user_id": "user1", "type": "agreement_created", "message": "Test notification", "is_read": False, "created_at": datetime.now(timezone.utc)}
    ])
    mock_db.notifications.find.return_value = mock_cursor

    
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/api/v1/notifications")
        
        assert response.status_code == 200
        assert "notifications" in response.json()
        assert response.json()["total"] == 1
        assert response.json()["notifications"][0]["message"] == "Test notification"
    finally:
        app.dependency_overrides = {}

def test_mark_notification_read():
    # 1. Override dependencies
    user_mock = User(
        id="user1",
        email="test@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Test User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    app.dependency_overrides[get_current_user] = lambda: user_mock

    # 2. Mock DB calls
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.matched_count = 1
    mock_result.modified_count = 1
    mock_db.notifications.update_one = AsyncMock(return_value=mock_result)
    
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.patch("/api/v1/notifications/notif1/read")
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["updated_count"] == 1
    finally:
        app.dependency_overrides = {}


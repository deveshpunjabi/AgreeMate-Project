from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone, date

from backend.app.main import app
from backend.app.dependencies import get_current_user
from backend.app.db.client import get_db
from backend.app.modules.auth.schemas import User

client = TestClient(app)

def test_prevent_double_lending_on_active_loan():
    owner_user = User(
        id="usr_owner_1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner Alice",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: owner_user

    mock_db = MagicMock()
    mock_db.agreements.find_one = AsyncMock(return_value={
        "_id": "agr_attempt_2",
        "owner_id": "usr_owner_1",
        "borrower_id": "usr_borrower_2",
        "borrower_email": "borrower2@example.com",
        "item_id": "item_busy",
        "status": "pending_owner_confirmation",
        "terms": {
            "due_date": date(2026, 12, 31),
            "penalty_type": "fixed",
            "penalty_rate": 50.0,
            "grace_period_days": 0
        },
        "signature_events": []
    })
    mock_db.items.find_one = AsyncMock(return_value={
        "_id": "item_busy",
        "title": "Sony Alpha A7 IV",
        "owner_id": "usr_owner_1",
        "status": "on_loan",
        "condition": "good",
        "is_deleted": False
    })
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post("/api/v1/agreements/agr_attempt_2/confirm")
        assert response.status_code == 409
        assert "currently active on another loan" in response.json()["detail"]
    finally:
        app.dependency_overrides = {}

def test_resolve_dispute_restores_item_availability():
    owner_user = User(
        id="usr_owner_1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner Alice",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: owner_user

    mock_db = MagicMock()
    
    status_state = {"count": 0}
    async def mock_agr_find_one(query):
        s = "disputed" if status_state["count"] == 0 else "completed"
        status_state["count"] += 1
        return {
            "_id": "agr_disputed_1",
            "owner_id": "usr_owner_1",
            "borrower_id": "usr_borrower_1",
            "borrower_email": "borrower1@example.com",
            "item_id": "item_disputed",
            "status": s,
            "terms": {
                "due_date": date(2026, 12, 31),
                "penalty_type": "fixed",
                "penalty_rate": 50.0,
                "grace_period_days": 0
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "signature_events": [],
            "status_history": []
        }

    mock_db.agreements.find_one = AsyncMock(side_effect=mock_agr_find_one)
    mock_db.agreements.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    mock_db.items.find_one = AsyncMock(return_value={
        "_id": "item_disputed",
        "title": "Drone DJI Mavic",
        "owner_id": "usr_owner_1",
        "status": "available",
        "condition": "good",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })
    mock_db.items.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.patch(
            "/api/v1/agreements/agr_disputed_1/dispute-resolve",
            json={"target_status": "completed", "resolution_notes": "Item returned with settlement fee paid"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
        mock_db.items.update_one.assert_called()
    finally:
        app.dependency_overrides = {}

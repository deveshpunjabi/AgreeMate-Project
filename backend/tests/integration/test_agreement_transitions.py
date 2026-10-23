from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone, date

from backend.app.main import app
from backend.app.dependencies import get_current_user
from backend.app.db.client import get_db
from backend.app.modules.auth.schemas import User

client = TestClient(app)

def test_agreement_transition_active_to_completed():
    # 1. Override current user dependency
    user_mock = User(
        id="user1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    app.dependency_overrides[get_current_user] = lambda: user_mock

    # 2. Mock MongoDB database operations
    mock_db = MagicMock()
    
    # Mock transaction session client calls
    mock_session = MagicMock()
    mock_transaction = MagicMock()
    mock_transaction.__aenter__ = AsyncMock()
    mock_transaction.__aexit__ = AsyncMock()
    mock_session.start_transaction = MagicMock(return_value=mock_transaction)
    
    mock_session_context = MagicMock()
    mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_context.__aexit__ = AsyncMock()
    mock_db.client.start_session = AsyncMock(return_value=mock_session_context)


    
    # We use AsyncMock for async find_one operations
    async def mock_find_one(query):
        if query.get("_id") == "agreement1":
            # If the status check has not completed yet, return return_initiated
            # Otherwise return completed.
            if mock_db.agreements.update_one.call_count == 0:
                return {
                    "_id": "agreement1",
                    "owner_id": "user1",
                    "borrower_id": "user2",
                    "borrower_email": "borrower@example.com",
                    "item_id": "item1",
                    "status": "return_initiated",
                    "terms": {
                        "due_date": date.today(),
                        "penalty_type": "fixed",
                        "penalty_rate": 200.0,
                        "grace_period_days": 0
                    },
                    "status_history": [],
                    "signature_events": [],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            else:
                return {
                    "_id": "agreement1",
                    "owner_id": "user1",
                    "borrower_id": "user2",
                    "borrower_email": "borrower@example.com",
                    "item_id": "item1",
                    "status": "completed",
                    "terms": {
                        "due_date": date.today(),
                        "penalty_type": "fixed",
                        "penalty_rate": 200.0,
                        "grace_period_days": 0
                    },
                    "status_history": [],
                    "signature_events": [],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
        elif query.get("_id") == "item1":
            return {
                "_id": "item1",
                "title": "Item 1",
                "owner_id": "user1",
                "status": "available",
                "condition": "good",
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        return None


    mock_db.agreements.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.items.find_one = AsyncMock(side_effect=mock_find_one)
    
    # Mock update_one
    mock_update_result = MagicMock()
    mock_update_result.modified_count = 1
    mock_db.agreements.update_one = AsyncMock(return_value=mock_update_result)
    mock_db.items.update_one = AsyncMock(return_value=mock_update_result)

    # Override get_db
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post(
            "/api/v1/agreements/agreement1/complete"
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
    finally:
        # Clean overrides
        app.dependency_overrides = {}


def test_dispute_resolution_active():
    user_mock = User(
        id="user1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    async def mock_find_one(query):
        if query.get("_id") == "agreement_disputed":
            status = "completed" if mock_db.agreements.update_one.call_count > 0 else "disputed"
            return {
                "_id": "agreement_disputed",
                "owner_id": "user1",
                "borrower_id": "user2",
                "borrower_email": "borrower@example.com",
                "item_id": "item1",
                "status": status,
                "terms": {
                    "due_date": date.today(),
                    "penalty_type": "fixed",
                    "penalty_rate": 200.0,
                    "grace_period_days": 0
                },
                "status_history": [],
                "signature_events": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        elif query.get("_id") == "item1":
            return {
                "_id": "item1",
                "title": "Camera Kit",
                "owner_id": "user1",
                "status": "available",
                "condition": "good",
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        return None

    mock_db.agreements.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.items.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.agreements.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    mock_db.items.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.patch(
            "/api/v1/agreements/agreement_disputed/dispute-resolve",
            json={"target_status": "completed", "resolution_notes": "Settled mutually"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
    finally:
        app.dependency_overrides = {}


def test_resend_invitation_flow():
    user_mock = User(
        id="owner1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    
    async def mock_find_one(query):
        if query.get("_id") == "ag_pending":
            return {
                "_id": "ag_pending",
                "owner_id": "owner1",
                "borrower_email": "borrower@example.com",
                "item_id": "item1",
                "status": "pending_borrower_acceptance",
                "invite_token": "old_token_123",
                "terms": {
                    "due_date": date.today(),
                    "penalty_type": "fixed",
                    "penalty_rate": 100.0,
                    "grace_period_days": 1
                },
                "status_history": [],
                "signature_events": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        elif query.get("_id") == "item1":
            return {
                "_id": "item1",
                "title": "Camera Gear",
                "estimated_value": 45000.0,
                "is_deleted": False
            }
        elif query.get("_id") == "owner1":
            return {
                "_id": "owner1",
                "full_name": "Owner User",
                "email": "owner@example.com"
            }
        return None

    mock_db.agreements.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.items.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.users.find_one = AsyncMock(return_value=None)  # Non-existing borrower test
    mock_db.agreements.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    mock_db.notifications.insert_one = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post("/api/v1/agreements/ag_pending/invite")
        assert response.status_code == 200
        data = response.json()
        assert "invite_url" in data
        assert "invite_token" in data
        assert data["is_resend"] is True
    finally:
        app.dependency_overrides = {}


def test_update_agreement_terms_flow():
    user_mock = User(
        id="owner1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    
    ag_state = {
        "_id": "ag_draft",
        "owner_id": "owner1",
        "borrower_email": "borrower@example.com",
        "item_id": "item1",
        "status": "pending_borrower_acceptance",
        "invite_token": "token_abc",
        "terms": {
            "due_date": date.today(),
            "penalty_type": "fixed",
            "penalty_rate": 50.0,
            "grace_period_days": 2,
            "special_conditions": "Original terms"
        },
        "status_history": [],
        "signature_events": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    async def mock_find_one(query):
        if query.get("_id") == "ag_draft":
            return ag_state
        elif query.get("_id") == "item1":
            return {
                "_id": "item1",
                "title": "Drone Pro",
                "estimated_value": 75000.0,
                "owner_id": "owner1",
                "status": "available",
                "condition": "good",
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        elif query.get("_id") == "owner1":
            return {"_id": "owner1", "full_name": "Owner User", "email": "owner@example.com"}
        return None

    mock_db.agreements.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.items.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db.users.find_one = AsyncMock(return_value=None)
    mock_db.agreements.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    mock_db.items.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.patch(
            "/api/v1/agreements/ag_draft",
            json={
                "penalty_rate": 150.0,
                "grace_period_days": 5,
                "special_conditions": "Updated terms with grace period"
            }
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}


def test_update_agreement_terms_locked_error():
    user_mock = User(
        id="owner1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: user_mock

    mock_db = MagicMock()
    mock_db.agreements.find_one = AsyncMock(return_value={
        "_id": "ag_active",
        "owner_id": "owner1",
        "borrower_email": "borrower@example.com",
        "item_id": "item1",
        "status": "active",  # Locked state
        "terms": {"due_date": date.today(), "penalty_type": "fixed", "penalty_rate": 50.0, "grace_period_days": 2},
        "created_at": datetime.now(timezone.utc)
    })
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.patch(
            "/api/v1/agreements/ag_active",
            json={"penalty_rate": 500.0}
        )
        assert response.status_code == 409
        assert "cannot be edited" in response.json()["detail"]
    finally:
        app.dependency_overrides = {}


def test_admin_portal_endpoints():
    admin_mock = User(
        id="admin1",
        email="punjabidevesh5810@gmail.com",
        role="admin",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Devesh Punjabi",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    app.dependency_overrides[get_current_user] = lambda: admin_mock

    mock_db = MagicMock()
    mock_db.users.count_documents = AsyncMock(return_value=15)
    mock_db.agreements.count_documents = AsyncMock(return_value=28)
    mock_db.items.count_documents = AsyncMock(return_value=30)
    
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[{"_id": None, "total_value": 350000.0}])
    mock_db.items.aggregate = MagicMock(return_value=mock_cursor)

    # Empty list for charts queries
    ag_cursor = MagicMock()
    ag_cursor.to_list = AsyncMock(return_value=[])
    mock_db.agreements.find = MagicMock(return_value=ag_cursor)
    
    it_cursor = MagicMock()
    it_cursor.to_list = AsyncMock(return_value=[])
    mock_db.items.find = MagicMock(return_value=it_cursor)
    
    u_cursor = MagicMock()
    u_cursor.sort = MagicMock(return_value=u_cursor)
    u_cursor.skip = MagicMock(return_value=u_cursor)
    u_cursor.limit = MagicMock(return_value=u_cursor)
    u_cursor.to_list = AsyncMock(return_value=[])
    mock_db.users.find = MagicMock(return_value=u_cursor)

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # Test Stats
        res_stats = client.get("/api/v1/admin/stats")
        assert res_stats.status_code == 200
        stats_data = res_stats.json()
        assert stats_data["total_users"] == 15
        assert stats_data["total_agreements"] == 28
        assert stats_data["total_valuation"] == 350000.0

        # Test Charts
        res_charts = client.get("/api/v1/admin/charts")
        assert res_charts.status_code == 200
        charts_data = res_charts.json()
        assert "monthly_velocity" in charts_data
        assert "status_distribution" in charts_data
        assert len(charts_data["monthly_velocity"]) == 6

        # Test System Health Telemetry
        mock_db.client.admin.command = AsyncMock(return_value={"ok": 1})
        mock_db.command = AsyncMock(return_value={"ok": 1})
        res_health = client.get("/api/v1/admin/system-health")
        assert res_health.status_code == 200
        health_data = res_health.json()
        assert health_data["status"] == "OPERATIONAL"
        assert health_data["database"] == "HEALTHY"
        assert health_data["vault_status"] == "SECURED (SHA-256)"
    finally:
        app.dependency_overrides = {}




import pytest
import io
import zipfile
import json
from datetime import datetime, timezone, date
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.dependencies import require_admin, get_current_user
from backend.app.db.client import get_db
from backend.app.modules.auth.schemas import User
from backend.app.services.documents.zip_bundler import build_evidence_zip_packet

client = TestClient(app)

def test_admin_email_bypass_is_eliminated():
    """SEC-01: Verify that a regular user with an allowlisted email is strictly denied admin privileges."""
    user = User(
        id="user_allowlist_email",
        email="punjabidevesh5810@gmail.com",
        role="user",  # Regular user role
        full_name="Allowlist User",
        email_verified=True,
        is_active=True,
        password_hash="hash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    with pytest.raises(HTTPException) as exc_info:
        # require_admin is an async function
        import asyncio
        asyncio.run(require_admin(current_user=user))
    
    assert exc_info.value.status_code == 403
    assert "Administrator privileges required" in exc_info.value.detail


def test_admin_role_granted():
    """Verify that only explicit admin or super_admin roles pass require_admin."""
    admin_user = User(
        id="admin_user_1",
        email="anyadmin@example.com",
        role="admin",
        full_name="Admin",
        email_verified=True,
        is_active=True,
        password_hash="hash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    import asyncio
    res = asyncio.run(require_admin(current_user=admin_user))
    assert res.role == "admin"


def test_invoice_pdf_requires_verified_record():
    """SEC-05: Verify that downloading invoice PDF for non-existent invoice returns 404."""
    user = User(
        id="user_inv_test",
        email="invtest@example.com",
        role="user",
        full_name="Invoice User",
        email_verified=True,
        is_active=True,
        password_hash="hash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    app.dependency_overrides[get_current_user] = lambda: user

    mock_db = MagicMock()
    mock_db.invoices.find_one = AsyncMock(return_value=None)
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/api/v1/users/invoices/non_existent_inv_id/pdf")
        assert response.status_code == 404
        assert "Invoice record not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_data_export_download_streams_verified_zip():
    """SEC-10: Verify that data export download streams an actual valid ZIP containing user data."""
    user = User(
        id="user_export_test",
        email="exporttest@example.com",
        role="user",
        full_name="Export User",
        email_verified=True,
        is_active=True,
        password_hash="hash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    app.dependency_overrides[get_current_user] = lambda: user

    mock_db = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value={
        "_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": datetime.now(timezone.utc)
    })
    
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.agreements.find = MagicMock(return_value=mock_cursor)
    mock_db.items.find = MagicMock(return_value=mock_cursor)
    mock_db.evidence_files.find = MagicMock(return_value=mock_cursor)
    mock_db.notifications.find = MagicMock(return_value=mock_cursor)
    mock_db.audit_logs.find = MagicMock(return_value=mock_cursor)
    mock_db.audit_logs.insert_one = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/api/v1/security/data-export/download")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"

        # Verify ZIP contents
        zip_bytes = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_bytes, "r") as zf:
            namelist = zf.namelist()
            assert "profile.json" in namelist
            assert "agreements.json" in namelist
            assert "manifest.json" in namelist

            manifest_data = json.loads(zf.read("manifest.json").decode())
            assert manifest_data["archive_type"] == "AgreeMate DPDP Data Portability Export"
            assert manifest_data["user_id"] == user.id
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_evidence_export_rejects_hash_mismatch():
    """SEC-22: Verify that evidence ZIP export rejects hash mismatches."""
    agreement = {
        "_id": "ag_test",
        "owner_id": "owner_1",
        "borrower_id": "borrower_1",
        "status": "active",
        "terms": {
            "due_date": date.today(),
            "penalty_type": "fixed",
            "penalty_rate": 100.0,
            "grace_period_days": 2,
        },
        "signature_events": [],
    }
    owner = {"_id": "owner_1", "email": "owner@example.com", "full_name": "Owner"}
    borrower = {"_id": "borrower_1", "email": "borrower@example.com", "full_name": "Borrower"}
    
    # Evidence with a recorded hash that won't match downloaded bytes
    evidence_list = [{
        "_id": "ev_1",
        "evidence_type": "handover",
        "cloudinary_url": "https://example.com/fake_image.jpg",
        "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  # Hash of empty string
    }]

    from unittest.mock import patch
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b"Non-empty real bytes that will cause a hash mismatch"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        with pytest.raises(HTTPException) as exc_info:
            await build_evidence_zip_packet("ag_test", agreement, None, evidence_list, owner, borrower)
        assert exc_info.value.status_code == 502
        assert "Cryptographic hash mismatch" in exc_info.value.detail


def test_health_and_readiness_endpoints():
    """SEC-47: Verify /health/live, /health/ready, and /health endpoints."""
    # 1. Live probe always returns 200
    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json() == {"status": "live", "service": "AgreeMate"}

    # 2. Ready probe with connected DB returns 200
    mock_db = MagicMock()
    mock_db.client.admin.command = AsyncMock(return_value={"ok": 1})
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        res_ready = client.get("/health/ready")
        assert res_ready.status_code == 200
        assert res_ready.json() == {"status": "ready", "service": "AgreeMate", "db": "connected"}

        res_ready_v1 = client.get("/api/v1/health/ready")
        assert res_ready_v1.status_code == 200

        res_health = client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json() == {"status": "healthy", "service": "AgreeMate", "db": "connected"}

        res_health_v1 = client.get("/api/v1/health")
        assert res_health_v1.status_code == 200
    finally:
        app.dependency_overrides.clear()

    # 3. Ready probe with disconnected DB returns 503
    mock_failing_db = MagicMock()
    mock_failing_db.client.admin.command = AsyncMock(side_effect=Exception("Connection refused"))
    app.dependency_overrides[get_db] = lambda: mock_failing_db
    try:
        res_ready_fail = client.get("/health/ready")
        assert res_ready_fail.status_code == 503

        res_health_fail = client.get("/health")
        assert res_health_fail.status_code == 503
    finally:
        app.dependency_overrides.clear()


def test_security_headers_present_and_obsolete_headers_removed():
    """SEC-50: Verify modernized security headers and absence of obsolete X-XSS-Protection."""
    response = client.get("/health/live")
    headers = response.headers

    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert headers.get("cross-origin-opener-policy") == "same-origin"
    assert headers.get("cross-origin-resource-policy") == "same-origin"
    assert "camera=()" in headers.get("permissions-policy", "")
    assert "x-xss-protection" not in headers


from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from backend.app.main import app
from backend.app.modules.auth.schemas import User
from datetime import datetime, timezone

client = TestClient(app)

def test_login_flow():
    with patch("backend.app.modules.auth.router.authenticate_user", new_callable=AsyncMock) as mock_auth:
        user_mock = User(
            id="1",
            email="test@example.com",
            password_hash="fake_hash",
            email_verified=True,
            is_active=True,
            full_name="Test User",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        mock_auth.return_value = {
            "access_token": "fake_access_token",
            "refresh_token": "fake_refresh_token",
            "user": user_mock
        }
        
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["user"]["email"] == "test@example.com"

def test_register_flow():
    with patch("backend.app.modules.auth.router.create_user_signup", new_callable=AsyncMock) as mock_register:
        user_mock = User(
            id="1",
            email="test@example.com",
            password_hash="fake_hash",
            email_verified=False,
            is_active=True,
            full_name="Test User",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        mock_register.return_value = user_mock
        
        response = client.post(
            "/api/v1/auth/signup",
            json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
        )
        
        assert response.status_code == 201
        assert response.json()["user_id"] == "1"
        assert "OTP sent" in response.json()["message"]

def test_unverified_login_flow():
    from fastapi import HTTPException
    with patch("backend.app.modules.auth.router.authenticate_user", new_callable=AsyncMock) as mock_auth:
        mock_auth.side_effect = HTTPException(
            status_code=403,
            detail="EMAIL_NOT_VERIFIED: Please verify your email address before signing in."
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "unverified@example.com", "password": "password123"}
        )
        assert response.status_code == 403
        assert "EMAIL_NOT_VERIFIED" in response.json()["detail"]

def test_verify_otp_flow():
    with patch("backend.app.modules.auth.router.verify_user_otp", new_callable=AsyncMock) as mock_verify:
        user_mock = User(
            id="1",
            email="test@example.com",
            password_hash="fake_hash",
            email_verified=True,
            is_active=True,
            full_name="Test User",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        mock_verify.return_value = {
            "access_token": "verified_access_token",
            "refresh_token": "verified_refresh_token",
            "user": user_mock
        }
        response = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": "test@example.com", "otp_code": "123456"}
        )
        assert response.status_code == 200
        assert response.json()["access_token"] == "verified_access_token"
        assert response.json()["user"]["email_verified"] is True

def test_resend_otp_flow():
    with patch("backend.app.modules.auth.router.resend_user_otp", new_callable=AsyncMock) as mock_resend:
        mock_resend.return_value = {
            "message": "Verification code resent.",
            "retry_after_seconds": 60
        }
        response = client.post(
            "/api/v1/auth/resend-otp",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 200
        assert "Verification code resent" in response.json()["message"]
        assert response.json()["retry_after_seconds"] == 60




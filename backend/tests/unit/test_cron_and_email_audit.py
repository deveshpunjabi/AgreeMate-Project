import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)


def test_cron_reminders_unauthorized_when_secret_set():
    with patch.object(settings, "CRON_SECRET", "super-secret-cron-token-123"):
        # Without header
        resp = client.get("/api/v1/cron/reminders")
        assert resp.status_code == 401
        assert "Unauthorized" in resp.json()["detail"]

        # With wrong token
        resp = client.get(
            "/api/v1/cron/reminders",
            headers={"Authorization": "Bearer wrong-token"}
        )
        assert resp.status_code == 401


def test_cron_reminders_authorized():
    with patch.object(settings, "CRON_SECRET", "super-secret-cron-token-123"):
        with patch("backend.app.modules.reminders.cron_router.check_and_send_reminders", new_callable=AsyncMock) as mock_reminders:
            mock_reminders.return_value = None

            resp = client.get(
                "/api/v1/cron/reminders",
                headers={"Authorization": "Bearer super-secret-cron-token-123"}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "success"
            assert data["job"] == "daily_reminders"
            assert "duration_seconds" in data
            assert mock_reminders.called


@pytest.mark.asyncio
async def test_send_email_records_audit_log_in_database():
    from backend.app.services.email import send_email

    with patch("backend.app.services.email.sender._record_email_log", new_callable=AsyncMock) as mock_record:
        with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_smtp:
            mock_smtp.return_value = None
            with patch.object(settings, "SMTP_USERNAME", "testuser@gmail.com"):
                with patch.object(settings, "SMTP_PASSWORD", "abcd efgh ijkl mnop"):
                    with patch.object(settings, "ENVIRONMENT", "production"):
                        success = await send_email(
                            to_email="audittest@example.com",
                            subject="Audit Test Subject",
                            html_content="<p>Test Body</p>",
                            context_type="AUDIT_VERIFICATION"
                        )
                        assert success is True
                        assert mock_record.called
                        kwargs = mock_record.call_args[1]
                        assert kwargs["to_email"] == "audittest@example.com"
                        assert kwargs["subject"] == "Audit Test Subject"
                        assert kwargs["context_type"] == "AUDIT_VERIFICATION"
                        assert kwargs["status"] == "accepted"

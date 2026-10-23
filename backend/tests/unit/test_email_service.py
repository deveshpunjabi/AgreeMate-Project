import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.email import sender as email_service
from backend.app.services.email.sender import send_email, _strip_html


@pytest.fixture(autouse=True)
def mock_delivery_database():
    with patch.object(email_service, "db") as database:
        database.email_logs.insert_one = AsyncMock()
        yield database


def test_strip_html():
    html_sample = "<p>Hello <b>World</b>!</p><br/><span>Next line</span>"
    clean = _strip_html(html_sample)
    assert "Hello World!" in clean
    assert "Next line" in clean
    assert "<p>" not in clean
    assert "<span>" not in clean


@pytest.mark.asyncio
async def test_send_email_smtp_success():
    with patch("backend.app.services.email.sender.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        with patch.object(email_service.settings, "SMTP_USERNAME", "test@gmail.com"):
            with patch.object(email_service.settings, "SMTP_PASSWORD", "app-pass-123"):
                success = await send_email(
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    html_content="<p>Test Content</p>",
                    context_type="TEST",
                )
                assert success is True
                assert mock_send.call_count == 1
                call_kwargs = mock_send.call_args.kwargs
                assert call_kwargs["hostname"] == email_service.settings.SMTP_HOST
                assert call_kwargs["username"] == "test@gmail.com"


@pytest.mark.asyncio
async def test_send_email_smtp_failure_fallback():
    with patch("backend.app.services.email.sender.aiosmtplib.send", new_callable=AsyncMock, side_effect=Exception("Auth error")):
        with patch.object(email_service.settings, "SMTP_USERNAME", "test@gmail.com"):
            with patch.object(email_service.settings, "SMTP_PASSWORD", "invalid-pass"):
                success = await send_email(
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    html_content="<p>Test Content</p>",
                    context_type="TEST",
                )
                assert success is False


@pytest.mark.asyncio
async def test_send_email_dev_console_fallback():
    with patch.object(email_service.settings, "SMTP_USERNAME", None):
        with patch.object(email_service.settings, "SMTP_PASSWORD", None):
            success = await send_email(
                to_email="recipient@example.com",
                subject="Dev Console Subject",
                html_content="<p>Dev Content</p>",
                context_type="DEV_TEST",
                extra_log_info={"OTP": "999888"},
            )
            assert success is True

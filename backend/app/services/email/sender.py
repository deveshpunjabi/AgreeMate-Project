import logging
import html
import re
import asyncio
import uuid
import time
from datetime import datetime, timezone
from email.message import EmailMessage
import aiosmtplib

from backend.app.core.config import settings
from backend.app.db.client import db

logger = logging.getLogger(__name__)


def _strip_html(html_text: str) -> str:
    """Helper to convert HTML content to clean plain text."""
    clean = re.sub(r"<(script|style).*?>.*?</\1>", "", html_text, flags=re.DOTALL)
    clean = re.sub(r"<br\s*/?>", "\n", clean, flags=re.IGNORECASE)
    clean = re.sub(r"</p>", "\n\n", clean, flags=re.IGNORECASE)
    clean = re.sub(r"<[^>]+>", "", clean)
    clean = html.unescape(clean)
    clean = re.sub(r"\n\s*\n", "\n\n", clean)
    return clean.strip()


def _extract_raw_email(addr: str) -> str:
    """Extract raw email address from formats like 'Name <email@domain.com>' or 'email@domain.com'."""
    match = re.search(r"<([^>]+)>", addr)
    if match:
        return match.group(1).strip()
    return addr.strip()


async def _record_email_log(
    to_email: str,
    subject: str,
    context_type: str,
    status: str,
    port: int | None,
    host: str | None,
    error: str | None,
    duration_ms: float,
    extra_meta: dict | None = None,
):
    """Persists email delivery attempt details into db.email_logs for audit and diagnostics."""
    try:
        log_entry = {
            "_id": uuid.uuid4().hex,
            "to_email": to_email,
            "subject": subject,
            "context_type": context_type,
            "status": status,
            "port": port,
            "host": host,
            "error": error,
            "duration_ms": duration_ms,
            "created_at": datetime.now(timezone.utc),
            "meta": extra_meta or {},
        }
        await db.email_logs.insert_one(log_entry)
    except Exception as e:
        logger.debug(f"Non-fatal error recording email dispatch log to database: {e}")


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
    context_type: str = "GENERIC",
    extra_log_info: dict | None = None,
) -> bool:
    """
    Centralized production SMTP email sender for AgreeMate.
    - Sanitizes Google App Passwords (stripping spaces).
    - Uses strict RFC 5321 envelope addresses (sender/recipients) to avoid SMTP syntax rejections.
    - Implements automatic dual-port fallback between Port 465 (Direct SSL) and Port 587 (STARTTLS)
      to bypass cloud host firewall / ISP egress blocks.
    - Persists delivery attempt records into MongoDB for auditing.
    """
    start_time = time.time()
    to_email = to_email.strip()
    plain_text = text_content or _strip_html(html_content)

    raw_user = settings.SMTP_USERNAME
    raw_pass = settings.SMTP_PASSWORD

    smtp_user = raw_user.strip() if raw_user else None
    smtp_pass = raw_pass.replace(" ", "").strip() if raw_pass else None

    # Check if SMTP credentials are configured
    if not smtp_user or not smtp_pass:
        if getattr(settings, "ENVIRONMENT", "development") == "production":
            err_msg = (
                "Email dispatch failed in production: SMTP_USERNAME or SMTP_PASSWORD is not configured. "
                "Please configure SMTP_USERNAME and SMTP_PASSWORD in your environment variables. "
                f"Recipient: {to_email}, Subject: '{subject}'"
            )
            logger.error(err_msg)
            await _record_email_log(
                to_email=to_email,
                subject=subject,
                context_type=context_type,
                status="failed",
                port=None,
                host=settings.SMTP_HOST,
                error="MISSING_CREDENTIALS",
                duration_ms=round((time.time() - start_time) * 1000, 2),
                extra_meta=extra_log_info,
            )
            return False

        # Development fallback
        logger.info(
            f"[DEV CONSOLE EMAIL] Context: {context_type} | To: {to_email} | Subject: {subject} | Extra: {extra_log_info or {}}"
        )

        await _record_email_log(
            to_email=to_email,
            subject=subject,
            context_type=context_type,
            status="dev_console",
            port=None,
            host="localhost",
            error=None,
            duration_ms=round((time.time() - start_time) * 1000, 2),
            extra_meta=extra_log_info,
        )
        return True

    # Prepare RFC 5322 MIME message
    sender_header = settings.SMTP_FROM or f"AgreeMate <{smtp_user}>"
    envelope_sender = _extract_raw_email(smtp_user)
    envelope_recipient = _extract_raw_email(to_email)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender_header
    message["To"] = to_email
    message.set_content(plain_text)
    message.add_alternative(html_content, subtype="html")

    # Define primary and fallback port attempts
    configured_port = int(settings.SMTP_PORT) if settings.SMTP_PORT else 465
    configured_host = settings.SMTP_HOST or "smtp.gmail.com"

    # Strategy: try configured port first, then fall back to alternate cloud ports (465, 587, 2525).
    attempts = []
    if configured_port == 465:
        attempts.append({"port": 465, "use_tls": True, "start_tls": False, "desc": "Port 465 (Direct SSL)"})
        attempts.append({"port": 587, "use_tls": False, "start_tls": True, "desc": "Port 587 (STARTTLS fallback)"})
        attempts.append({"port": 2525, "use_tls": False, "start_tls": True, "desc": "Port 2525 (Alternative SMTP fallback)"})
    elif configured_port == 2525:
        attempts.append({"port": 2525, "use_tls": False, "start_tls": True, "desc": "Port 2525 (Alternative SMTP)"})
        attempts.append({"port": 465, "use_tls": True, "start_tls": False, "desc": "Port 465 (Direct SSL fallback)"})
        attempts.append({"port": 587, "use_tls": False, "start_tls": True, "desc": "Port 587 (STARTTLS fallback)"})
    else:
        attempts.append({"port": configured_port, "use_tls": False, "start_tls": True, "desc": f"Port {configured_port} (STARTTLS)"})
        attempts.append({"port": 465, "use_tls": True, "start_tls": False, "desc": "Port 465 (Direct SSL fallback)"})
        attempts.append({"port": 2525, "use_tls": False, "start_tls": True, "desc": "Port 2525 (Alternative SMTP fallback)"})

    last_error = None
    for attempt in attempts:
        port = attempt["port"]
        use_tls = attempt["use_tls"]
        start_tls = attempt["start_tls"]
        desc = attempt["desc"]

        try:
            logger.info(f"Attempting SMTP dispatch to {envelope_recipient} via {configured_host}:{port} ({desc})...")
            await aiosmtplib.send(
                message,
                hostname=configured_host,
                port=port,
                username=smtp_user,
                password=smtp_pass,
                sender=envelope_sender,
                recipients=[envelope_recipient],
                use_tls=use_tls,
                start_tls=start_tls,
                timeout=7.0,
            )
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(f"Email successfully delivered to {to_email} via {configured_host}:{port} ({desc}) in {elapsed_ms}ms")

            await _record_email_log(
                to_email=to_email,
                subject=subject,
                context_type=context_type,
                status="accepted",
                port=port,
                host=configured_host,
                error=None,
                duration_ms=elapsed_ms,
                extra_meta=extra_log_info,
            )
            return True

        except aiosmtplib.SMTPAuthenticationError as auth_err:
            last_error = auth_err
            logger.error(
                f"SMTP Authentication Error (Code {auth_err.code}): {auth_err.message}. "
                "CRITICAL: If using Gmail, ensure you have generated a 16-character Google App Password "
                "from https://myaccount.google.com/apppasswords. Normal Google account passwords are "
                "strictly rejected by Google SMTP."
            )
            # Auth errors won't succeed on another port with the same credentials
            break

        except (TimeoutError, asyncio.TimeoutError) as timeout_err:
            last_error = timeout_err
            logger.warning(
                f"SMTP connection to {configured_host}:{port} timed out after 7s. "
                "This typically indicates the cloud hosting provider is filtering or blocking this outbound port. "
                "Trying next port strategy..."
            )

        except Exception as exc:
            last_error = exc
            logger.warning(f"SMTP dispatch attempt failed on {configured_host}:{port}: {exc}. Trying next port strategy...")

    # All attempts failed
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    logger.error(
        f"All SMTP delivery attempts failed for recipient {to_email} using host {configured_host}. "
        f"Final error: {last_error}"
    )

    await _record_email_log(
        to_email=to_email,
        subject=subject,
        context_type=context_type,
        status="failed",
        port=configured_port,
        host=configured_host,
        error=str(last_error),
        duration_ms=elapsed_ms,
        extra_meta=extra_log_info,
    )

    logger.error(
        f"[SMTP DISPATCH FAILURE] Context: {context_type} | To: {to_email} | Subject: {subject} | Host: {configured_host} | Error: {last_error} | Extra: {extra_log_info or {}}"
    )
    return False


async def test_smtp_connection() -> dict:
    """Diagnostic tool to test SMTP connection and authentication health."""
    raw_user = settings.SMTP_USERNAME
    raw_pass = settings.SMTP_PASSWORD

    smtp_user = raw_user.strip() if raw_user else None
    smtp_pass = raw_pass.replace(" ", "").strip() if raw_pass else None

    if not smtp_user or not smtp_pass:
        return {
            "configured": False,
            "status": "MISSING_CREDENTIALS",
            "message": "SMTP_USERNAME or SMTP_PASSWORD is not set in environment variables.",
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
        }

    configured_host = settings.SMTP_HOST or "smtp.gmail.com"
    configured_port = int(settings.SMTP_PORT) if settings.SMTP_PORT else 465

    # Mask username for safety
    masked_user = f"{smtp_user[:3]}***@{smtp_user.split('@')[-1]}" if "@" in smtp_user else "***"

    # Test connection across standard and alternative ports
    ports_to_test = [configured_port]
    for p in [465, 587, 2525]:
        if p not in ports_to_test:
            ports_to_test.append(p)

    diagnostics = []
    for port in ports_to_test:
        use_tls = (port == 465)
        start_tls = (port != 465)
        try:
            client = aiosmtplib.SMTP(
                hostname=configured_host,
                port=port,
                use_tls=use_tls,
                start_tls=start_tls,
                timeout=5.0,
            )
            await client.connect()
            await client.login(smtp_user, smtp_pass)
            await client.quit()
            return {
                "configured": True,
                "status": "HEALTHY",
                "connected_port": port,
                "host": configured_host,
                "username": masked_user,
                "message": f"Successfully authenticated to {configured_host}:{port}",
            }
        except aiosmtplib.SMTPAuthenticationError as auth_err:
            return {
                "configured": True,
                "status": "AUTHENTICATION_FAILED",
                "code": auth_err.code,
                "host": configured_host,
                "port": port,
                "username": masked_user,
                "message": f"Authentication failed: {auth_err.message}. Ensure a 16-character Google App Password is used.",
            }
        except Exception as e:
            diagnostics.append(f"Port {port}: {str(e)}")

    return {
        "configured": True,
        "status": "CONNECTION_FAILED",
        "host": configured_host,
        "username": masked_user,
        "message": f"Failed to connect to SMTP server: {'; '.join(diagnostics)}",
    }


async def get_email_logs(limit: int = 50, skip: int = 0) -> list[dict]:
    """Retrieve recent email delivery attempt logs from MongoDB for administrative audit."""
    try:
        cursor = db.email_logs.find().sort("created_at", -1).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)
        for log in logs:
            if "_id" in log:
                log["id"] = str(log.pop("_id"))
        return logs
    except Exception as e:
        logger.error(f"Error fetching email logs: {e}")
        return []

"""
Email Service Package
"""
from backend.app.services.email.sender import send_email, test_smtp_connection, get_email_logs

__all__ = ["send_email", "test_smtp_connection", "get_email_logs"]

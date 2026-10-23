import html
import logging
from typing import Any
from datetime import datetime, date, timezone

logger = logging.getLogger(__name__)

async def send_reminder_email(to_email: str, borrower_name: str, item_name: str, due_date: Any, reminder_type: str, agreement_id: str):
    due_date_str = str(due_date)
    if isinstance(due_date, (date, datetime)):
        due_date_str = due_date.strftime("%Y-%m-%d")
        
    safe_borrower_name = html.escape(str(borrower_name or "Borrower"))
    safe_item_name = html.escape(str(item_name or "Item"))
    today_utc = datetime.now(timezone.utc).date()

    n = 1
    if reminder_type == "reminder_7d":
        subject = f"Reminder: '{item_name}' due in 7 days"
        body_text = f"Hi {safe_borrower_name},<br><br>This is a friendly reminder that '{safe_item_name}' is due in 7 days (on {due_date_str})."
    elif reminder_type == "reminder_3d":
        subject = f"3 days left to return '{item_name}'"
        body_text = f"Hi {safe_borrower_name},<br><br>This is a reminder that '{safe_item_name}' is due in 3 days (on {due_date_str})."
    elif reminder_type == "reminder_1d":
        subject = f"Tomorrow: return '{item_name}'"
        body_text = f"Hi {safe_borrower_name},<br><br>Tomorrow is the due date to return '{safe_item_name}' (on {due_date_str})."
    elif reminder_type == "due_today":
        subject = f"Due today: '{item_name}'"
        body_text = f"Hi {safe_borrower_name},<br><br>'{safe_item_name}' is due today! Please return it."
    elif reminder_type == "overdue":
        if isinstance(due_date, str):
            try:
                due_d = datetime.strptime(due_date.split("T")[0], "%Y-%m-%d").date()
                n = max(1, (today_utc - due_d).days)
            except Exception:
                n = 1
        elif isinstance(due_date, (date, datetime)):
            due_d = due_date.date() if isinstance(due_date, datetime) else due_date
            n = max(1, (today_utc - due_d).days)
        subject = f"OVERDUE: '{item_name}' is {n} days late"
        body_text = f"Hi {safe_borrower_name},<br><br>'{safe_item_name}' is OVERDUE by {n} days! It was due on {due_date_str}."
    else:
        subject = f"AgreeMate Notification: {item_name}"
        body_text = f"Notification regarding agreement for {safe_item_name}."

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>{subject}</title>
        <style>
          body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f6f9fc;
            color: #1e2c3a;
            margin: 0;
            padding: 0;
          }}
          .wrapper {{
            width: 100%;
            background-color: #f6f9fc;
            padding: 40px 0;
          }}
          .container {{
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 104, 163, 0.06);
            border: 1px solid #e2e8f0;
          }}
          .header {{
            background-color: #005080;
            padding: 30px;
            text-align: center;
          }}
          .logo {{
            font-weight: 800;
            font-size: 22px;
            color: #ffffff;
            letter-spacing: -0.02em;
          }}
          .logo-mate {{
            color: #0ea5e9;
          }}
          .content {{
            padding: 40px 35px;
          }}
          .headline {{
            font-size: 18px;
            font-weight: 700;
            color: #003a5e;
            margin-top: 0;
            margin-bottom: 20px;
          }}
          .body-text {{
            font-size: 14px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 25px;
          }}
          .footer {{
            padding: 30px;
            border-top: 1px solid #edf2f7;
            text-align: center;
            background-color: #fafbfe;
          }}
          .footer-text {{
            font-size: 11px;
            color: #a0aec0;
            line-height: 1.5;
            margin: 0;
          }}
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">Agree<span class="logo-mate">Mate</span></div>
            </div>
            <div class="content">
              <h2 class="headline">{subject}</h2>
              <p class="body-text">
                {body_text.replace(chr(10), '<br>')}
              </p>
              <p class="body-text" style="font-size: 12px; color: #718096; margin-bottom: 0;">
                Agreement ID: <code style="font-family: monospace; background-color: #edf2f7; padding: 2px 6px; border-radius: 4px;">{agreement_id}</code>
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">
                &copy; 2026 AgreeMate. Secure lending records.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
    """

    from backend.app.services.email import send_email

    await send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=body_text,
        context_type="RETURN_REMINDER",
        extra_log_info={
            "Item": item_name,
            "Borrower": borrower_name,
            "Reminder Type": reminder_type,
            "Due Date": due_date,
        },
    )


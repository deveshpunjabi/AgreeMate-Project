import html
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def send_invite_email(
    to_email: str,
    invite_url: str,
    owner_name: Optional[str] = None,
    item_name: Optional[str] = None,
    due_date: Optional[str] = None,
    is_existing_user: bool = False
) -> bool:
    """
    Dispatches a high-conversion, luxury HTML agreement invitation email.
    Explicitly guides both existing users and new (unregistered) users to join and accept the agreement.
    """
    safe_owner = html.escape(str(owner_name or "A colleague or friend"))
    safe_item = html.escape(str(item_name or "a registered asset"))
    safe_due = html.escape(str(due_date or "As specified in agreement terms"))
    safe_email = html.escape(str(to_email))
    safe_url = html.escape(str(invite_url))

    account_notice_html = (
        """
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #003a5e;">
            ✨ First time on AgreeMate?
          </p>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #0369a1;">
            You do <strong>not</strong> need an existing account to review this agreement. Click the button below to inspect the complete terms, verify your email, and sign the contract in 30 seconds.
          </p>
        </div>
        """
        if not is_existing_user
        else """
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin: 24px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #475569;">
            This invitation was matched to your existing AgreeMate profile (<strong>""" + safe_email + """</strong>). Sign in to view and accept your contract terms.
          </p>
        </div>
        """
    )

    html_content = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agreement Invitation · AgreeMate</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased; color: #0f172a;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
      
      <!-- Top Brand Banner -->
      <tr>
        <td style="background-color: #003a5e; padding: 32px 36px; text-align: left; background: linear-gradient(135deg, #002842 0%, #003a5e 60%, #005080 100%);">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                  Agree<span style="color: #0ea5e9; font-style: italic; font-weight: 400;">Mate</span>
                </div>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #7dd3fc; margin-top: 4px; font-weight: 700;">
                  Mutual Consent Lending &amp; Evidence Vault
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body Content -->
      <tr>
        <td style="padding: 36px 36px 28px 36px;">
          <h1 style="font-size: 18px; font-weight: 800; color: #003a5e; margin: 0 0 12px 0; line-height: 1.3;">
            You have received an Agreement Invitation
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
            <strong>{safe_owner}</strong> has drafted a formal mutual-consent lending agreement with you for <strong>'{safe_item}'</strong> and is awaiting your review and digital acceptance.
          </p>

          <!-- Agreement Summary Box -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 18px 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="6">
                  <tr>
                    <td width="36%" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Registered Item:</td>
                    <td style="font-size: 13px; font-weight: 700; color: #003a5e;">{safe_item}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Lender / Owner:</td>
                    <td style="font-size: 13px; font-weight: 600; color: #1e293b;">{safe_owner}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Return Due Date:</td>
                    <td style="font-size: 13px; font-weight: 600; color: #1e293b;">{safe_due}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Legal Trail:</td>
                    <td style="font-size: 12px; font-family: monospace; font-weight: 600; color: #0284c7;">SHA-256 Tamper-Proof Certified</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          {account_notice_html}

          <!-- Action CTA Button -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
            <tr>
              <td align="center">
                <a href="{safe_url}" target="_blank" style="display: inline-block; background-color: #003a5e; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 58, 94, 0.25); text-align: center;">
                  Review &amp; Accept Agreement &rarr;
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0 0 10px 0; text-align: center;">
            Or copy and paste this secure link directly into your browser:
          </p>
          <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; word-break: break-all; font-family: monospace; font-size: 11px; color: #0f172a; text-align: center; margin-bottom: 24px;">
            <a href="{safe_url}" style="color: #005080; text-decoration: none;">{safe_url}</a>
          </div>

          <p style="font-size: 11.5px; line-height: 1.5; color: #94a3b8; margin: 0; text-align: center;">
            This invitation link is valid for 7 days. If you did not expect this agreement, you can safely decline or ignore this email.
          </p>
        </td>
      </tr>

      <!-- Footer Bar -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px 0;">
            &copy; 2026 AgreeMate Technologies &bull; Section 65B Electronic Record Compliance
          </p>
          <p style="font-size: 10.5px; color: #cbd5e1; margin: 0;">
            Mutual Consent Agreements &bull; Cryptographic Evidence Trail &bull; Automated Penalty Engine
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>"""

    from backend.app.services.email import send_email

    subject = f"Agreement Invitation: '{item_name or 'Mutual Contract'}' from {owner_name or 'AgreeMate'}"
    success = await send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        context_type="BORROWER_INVITATION",
        extra_log_info={
            "Item": item_name,
            "Owner": owner_name,
            "Existing User": is_existing_user,
            "Invite Path": "/invite/[TOKEN_REDACTED]",
        },
    )
    return success


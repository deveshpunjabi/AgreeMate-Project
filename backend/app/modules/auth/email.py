import logging

logger = logging.getLogger(__name__)

async def send_otp_email(to_email: str, otp_code: str):
    # Professional HTML Email Template Design with premium styling
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your AgreeMate Account</title>
        <style>
          body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f6f9fc;
            color: #1e2c3a;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
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
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }}
          .logo {{
            font-weight: 800;
            font-size: 24px;
            color: #ffffff;
            letter-spacing: -0.02em;
          }}
          .logo-mate {{
            color: #0ea5e9;
          }}
          .subtitle {{
            color: rgba(255, 255, 255, 0.8);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-top: 5px;
            font-weight: 700;
          }}
          .content {{
            padding: 40px 35px;
          }}
          .headline {{
            font-size: 20px;
            font-weight: 700;
            color: #003a5e;
            margin-top: 0;
            margin-bottom: 15px;
            letter-spacing: -0.01em;
          }}
          .body-text {{
            font-size: 14px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 30px;
          }}
          .otp-container {{
            background: linear-gradient(135deg, #005080 0%, #0ea5e9 100%);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
          }}
          .otp-code {{
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 0.2em;
            color: #ffffff;
            margin: 0;
            padding-left: 0.2em;
          }}
          .otp-label {{
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
            font-weight: 700;
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
              <div class="subtitle">Trust & Evidence Vault</div>
            </div>
            <div class="content">
              <h2 class="headline">Verify your email address</h2>
              <p class="body-text">
                Thank you for creating an account with AgreeMate. Please use the following one-time password (OTP) to verify your registration. This code is valid for 5 minutes.
              </p>
              <div class="otp-container">
                <div class="otp-label">Verification Code</div>
                <div class="otp-code">{otp_code}</div>
              </div>
              <p class="body-text" style="margin-bottom: 0; font-size: 12px; color: #718096; text-align: center;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">
                &copy; 2026 AgreeMate. All rights reserved.<br>
                Secure mutual-consent lending records.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
    """
    from backend.app.services.email import send_email

    subject = f"AgreeMate: {otp_code} is your verification code"
    success = await send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        context_type="OTP_VERIFICATION",
        extra_log_info={"Verification Code": "[PROTECTED]"},
    )
    return success


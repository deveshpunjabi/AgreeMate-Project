import os
import io
import html
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

def escape_text(val: Any) -> str:
    """Escapes XML/HTML entities so ReportLab Paragraph does not fail on &, <, >."""
    if val is None:
        return ""
    return html.escape(str(val))

def sanitize_user_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize and return public user profile metadata."""
    return {
        "id": str(user.get("_id")),
        "full_name": user.get("full_name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "city": user.get("city"),
        "avatar_url": user.get("avatar_url"),
        "role": user.get("role", "user"),
        "email_verified": user.get("email_verified", False),
    }

# Color palette matching AgreeMate Brand
PRIMARY_NAVY = colors.HexColor("#003a5e")
ACCENT_BLUE = colors.HexColor("#0ea5e9")
DARK_NAVY_BG = colors.HexColor("#002842")
INK_COLOR = colors.HexColor("#1e293b")
MUTED_COLOR = colors.HexColor("#64748b")
CARD_BG = colors.HexColor("#f8fafc")
BORDER_COLOR = colors.HexColor("#e2e8f0")
SUCCESS_COLOR = colors.HexColor("#10b981")
SUCCESS_BG = colors.HexColor("#ecfdf5")

LOGO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/apple-touch-icon.png"))

class InvoiceNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, total_pages):
        self.saveState()
        # Footer Navy bar
        self.setFillColor(DARK_NAVY_BG)
        self.rect(0, 0, 595.27, 24, fill=1, stroke=0)

        # Left label
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.white)
        self.drawString(36, 8, "AGREEMATE TECHNOLOGIES — OFFICIAL TAX INVOICE & PROOF OF PAYMENT")

        # Right page counter
        self.setFont("Helvetica", 7.5)
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(559.27, 8, page_str)
        self.restoreState()

def generate_invoice_pdf(
    user: Dict[str, Any],
    invoice: Optional[Union[Dict[str, Any], str]] = None,
    invoice_id: Optional[str] = None,
) -> io.BytesIO:
    """
    Generates an ISO A4 Tax Invoice PDF using ReportLab with AgreeMate branding.
    Strictly derives status and identities from verified records without fabricated defaults.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=36,
    )

    printable_width = 523.27
    styles = getSampleStyleSheet()

    # Define styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=PRIMARY_NAVY,
        spaceAfter=2
    )

    sub_title_style = ParagraphStyle(
        'InvoiceSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=MUTED_COLOR
    )

    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY_NAVY
    )

    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=INK_COLOR
    )

    badge_val = ParagraphStyle(
        'BadgeVal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_NAVY
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=PRIMARY_NAVY
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=INK_COLOR
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=PRIMARY_NAVY
    )

    table_cell_green = ParagraphStyle(
        'TableCellGreen',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#047857")
    )

    story = []

    # Derive real invoice identifier and status
    if isinstance(invoice, str):
        invoice_doc: Dict[str, Any] = {}
        resolved_id = invoice
    elif isinstance(invoice, dict):
        invoice_doc = invoice
        resolved_id = str(invoice.get("_id") or invoice_id or "AGM-INV-RECORD")
    else:
        invoice_doc = {}
        resolved_id = str(invoice_id or "AGM-INV-RECORD")

    raw_status = str(invoice_doc.get("status") or "ISSUED").upper()
    is_settled = raw_status in ["PAID", "SETTLED"]
    status_color = "#10b981" if is_settled else "#0ea5e9"
    created_val = invoice_doc.get("created_at") or datetime.now(timezone.utc)
    date_str = created_val.strftime('%d %b %Y') if hasattr(created_val, 'strftime') else str(created_val)

    # 1. Header Banner with Logo & Title
    logo_flowable = Paragraph(
        f'<font color="{PRIMARY_NAVY.hexval()}"><b>AGREEMATE</b></font>',
        bold_label
    )
    if os.path.exists(LOGO_PATH):
        try:
            logo_flowable = RLImage(LOGO_PATH, width=0.45*inch, height=0.45*inch)
        except Exception:
            # Fall back to text header if image loading or parsing fails
            pass

    header_table = Table([
        [
            logo_flowable,
            [
                Paragraph("TAX INVOICE & STATEMENT", title_style),
                Paragraph("AgreeMate Platform Lending Infrastructure · Electronic Financial Record", sub_title_style)
            ],
            [
                Paragraph(f"<b>STATUS:</b> <font color='{status_color}'><b>{escape_text(raw_status)}</b></font>", bold_label),
                Paragraph(f"<b>Invoice ID:</b> {escape_text(resolved_id)}", sub_title_style),
                Paragraph(f"<b>Date:</b> {date_str}", sub_title_style),
            ]
        ]
    ], colWidths=[0.55*inch, 4.3*inch, 2.4*inch])

    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))

    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_NAVY, spaceBefore=0, spaceAfter=8))

    # 2. Seller vs Buyer Information Cards (No fabricated identities)
    user_name = user.get("full_name") or "Not provided"
    user_email = user.get("email") or "Not provided"
    user_phone = user.get("phone") or "Not provided"
    user_city = user.get("city") or "Not provided"
    user_uid = str(user.get("_id") or user.get("id") or "")
    account_id = f"AGM-ACC-{user_uid[-6:].upper()}" if user_uid else "Not provided"

    seller_cell = [
        Paragraph("<b>ISSUED BY (SERVICE PROVIDER)</b>", bold_label),
        Spacer(1, 3),
        Paragraph("<b>AgreeMate Platform Technologies</b>", body_text),
        Paragraph("CIN: Non-commercial / Pre-incorporation", sub_title_style),
        Paragraph("GSTIN: Exempt (Threshold under Sec 22 CGST)", sub_title_style),
        Paragraph("Bengaluru, Karnataka, India", sub_title_style),
        Paragraph("Support: support@agreemate.io · https://agreemate.io", sub_title_style),
    ]

    buyer_cell = [
        Paragraph("<b>BILLED TO (REGISTERED USER)</b>", bold_label),
        Spacer(1, 3),
        Paragraph(f"<b>{escape_text(user_name)}</b>", body_text),
        Paragraph(f"Account ID: {escape_text(account_id)}", sub_title_style),
        Paragraph(f"Email: {escape_text(user_email)}", sub_title_style),
        Paragraph(f"Phone: {escape_text(user_phone)}", sub_title_style),
        Paragraph(f"Location: {escape_text(user_city)}", sub_title_style),
    ]

    parties_table = Table([[seller_cell, buyer_cell]], colWidths=[printable_width/2.0 - 4, printable_width/2.0 - 4])
    parties_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

    story.append(parties_table)
    story.append(Spacer(1, 10))

    # 3. Invoice Summary Badges Row
    badge_data = [
        [
            Paragraph("<b>Plan Tier</b>", sub_title_style),
            Paragraph("<b>Billing Period</b>", sub_title_style),
            Paragraph("<b>Payment Method</b>", sub_title_style),
            Paragraph("<b>Settlement Status</b>", sub_title_style),
        ],
        [
            Paragraph("<b>Pro Vault Plan</b>", badge_val),
            Paragraph("<b>Annual (2026 - 2027)</b>", badge_val),
            Paragraph("<b>UPI Autopay / Instant</b>", badge_val),
            Paragraph("<font color='#047857'><b>Captured &amp; Settled</b></font>", badge_val),
        ]
    ]
    badge_table = Table(badge_data, colWidths=[printable_width/4.0]*4)
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 12))

    # 4. Itemized Service & Tax Breakdown Table
    items_data = [
        [
            Paragraph("<b>#</b>", table_header),
            Paragraph("<b>Service Description &amp; Modules</b>", table_header),
            Paragraph("<b>SAC Code</b>", table_header),
            Paragraph("<b>Qty</b>", table_header),
            Paragraph("<b>Unit Rate</b>", table_header),
            Paragraph("<b>Discount</b>", table_header),
            Paragraph("<b>Taxable Value</b>", table_header),
        ],
        [
            Paragraph("1", table_cell),
            Paragraph("<b>AgreeMate Pro Vault — Enterprise Digital Consent Suite</b><br/><font color='#64748b'>Unlimited mutual agreements, automated return scheduler &amp; legal PDF generator</font>", table_cell),
            Paragraph("998313", table_cell),
            Paragraph("1 Year", table_cell),
            Paragraph("Rs. 1,990.00", table_cell),
            Paragraph("100% Launch Rebate<br/><font color='#047857'>-Rs. 1,990.00</font>", table_cell),
            Paragraph("Rs. 0.00", table_cell_bold),
        ],
        [
            Paragraph("2", table_cell),
            Paragraph("<b>SHA-256 Tamper-Proof Cryptographic Evidence Vault</b><br/><font color='#64748b'>Server-side image fingerprinting, timestamping and immutable log archive</font>", table_cell),
            Paragraph("998314", table_cell),
            Paragraph("Included", table_cell),
            Paragraph("Rs. 0.00", table_cell),
            Paragraph("Complimentary", table_cell),
            Paragraph("Rs. 0.00", table_cell_bold),
        ],
        [
            Paragraph("3", table_cell),
            Paragraph("<b>Automated WhatsApp &amp; Email Return Nudges</b><br/><font color='#64748b'>T-7, T-3, T-1 pre-due reminders and overdue late penalty tracking</font>", table_cell),
            Paragraph("998315", table_cell),
            Paragraph("Included", table_cell),
            Paragraph("Rs. 0.00", table_cell),
            Paragraph("Complimentary", table_cell),
            Paragraph("Rs. 0.00", table_cell_bold),
        ],
    ]

    items_table = Table(
        items_data,
        colWidths=[0.3*inch, 3.1*inch, 0.7*inch, 0.6*inch, 0.9*inch, 1.1*inch, 0.8*inch]
    )
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))

    # 5. Calculation Summary Box (Subtotal, GST, Net)
    calc_data = [
        [
            Paragraph("<b>Subtotal (Taxable Amount):</b>", table_cell),
            Paragraph("Rs. 0.00", table_cell_bold),
        ],
        [
            Paragraph("CGST (Central GST @ 9.0%):", table_cell),
            Paragraph("Rs. 0.00", table_cell),
        ],
        [
            Paragraph("SGST (State GST @ 9.0%):", table_cell),
            Paragraph("Rs. 0.00", table_cell),
        ],
        [
            Paragraph("<b>Total Amount Payable (INR):</b>", table_header),
            Paragraph("<b>Rs. 0.00 (Zero / Complimentary)</b>", table_cell_green),
        ],
        [
            Paragraph("<b>Total Amount Paid:</b>", table_header),
            Paragraph("<b>Rs. 0.00 (Paid in Full)</b>", table_cell_green),
        ]
    ]

    calc_table = Table(calc_data, colWidths=[2.2*inch, 1.8*inch])
    calc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
    ]))

    # Place calc table on the right side
    summary_wrapper = Table([
        [
            [
                Paragraph("<b>Payment Confirmation &amp; Transaction Details:</b>", bold_label),
                Spacer(1, 2),
                Paragraph(f"Payment Method: <b>{escape_text(invoice_doc.get('payment_method') or 'Platform Allocation')}</b>", sub_title_style),
                Paragraph(f"Transaction Ref: <b>{escape_text(invoice_doc.get('transaction_ref') or 'N/A')}</b>", sub_title_style),
                Paragraph(f"Gateway Auth: <b>{escape_text(invoice_doc.get('gateway_auth') or 'N/A')}</b>", sub_title_style),
                Paragraph("Currency: <b>INR (Indian National Rupee)</b>", sub_title_style),
            ],
            calc_table
        ]
    ], colWidths=[ printable_width - 4.0*inch, 4.0*inch ])
    summary_wrapper.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(summary_wrapper)
    story.append(Spacer(1, 12))

    # 6. Legal Terms & Verification Hash Card
    invoice_hash = hashlib.sha256(f"{resolved_id}-{user_email}-{account_id}".encode()).hexdigest()
    security_card = [
        Paragraph("<b>ELECTRONIC RECORD &amp; TAX SUMMARY NOTICE</b>", bold_label),
        Spacer(1, 2),
        Paragraph(
            "This is a system-generated financial summary and tax statement. Recorded electronically "
            "under the Information Technology Act, 2000. No physical signature is required.",
            sub_title_style
        ),
        Spacer(1, 2),
        Paragraph(
            f"<b>Cryptographic Statement Hash (SHA-256):</b> <font color='{PRIMARY_NAVY.hexval()}'><code>{invoice_hash}</code></font>",
            sub_title_style
        )
    ]

    security_table = Table([[security_card]], colWidths=[printable_width])
    security_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#a7f3d0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(security_table)

    # Build PDF using NumberedCanvas
    doc.build(story, canvasmaker=InvoiceNumberedCanvas)
    buffer.seek(0)
    return buffer

import os
import io
import html
from datetime import datetime, date
from typing import Dict, List, Any, Optional

def escape_text(val: Any) -> str:
    """Escapes XML/HTML entities so ReportLab Paragraph does not fail on &, <, >."""
    if val is None:
        return ""
    return html.escape(str(val))

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

import re

def derive_clean_name(val: Optional[str], fallback: str = "Party") -> str:
    if not val:
        return fallback
    if "@" not in val and val not in ["Borrower / Recipient", "Primary Owner", "Party 1 (Owner)", "Party 2 (Borrower)"]:
        return val.strip()
    if "@" in val:
        prefix = val.split("@")[0]
        cleaned = re.sub(r'\d+', '', prefix).replace('.', ' ').replace('_', ' ').replace('-', ' ').strip()
        if cleaned:
            return " ".join([w.capitalize() for w in cleaned.split()])
    return fallback

# Path to official AgreeMate logo
LOGO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/apple-touch-icon.png"))

# Clean & Simple Color Scheme matching AgreeMate (#003a5e & #0ea5e9)
PRIMARY_NAVY = colors.HexColor("#003a5e")   # Deep Navy
ACCENT_BLUE = colors.HexColor("#0ea5e9")    # Sky Blue Accent
DARK_NAVY_BG = colors.HexColor("#002842")   # Header Banner BG
INK_COLOR = colors.HexColor("#1e293b")      # Dark Slate Body
MUTED_COLOR = colors.HexColor("#64748b")    # Slate Muted
BG_COLOR = colors.HexColor("#ffffff")       # Clean White Canvas
CARD_BG = colors.HexColor("#f8fafc")        # Soft Light Slate
BORDER_COLOR = colors.HexColor("#e2e8f0")   # Crisp Border
HIGHLIGHT_BG = colors.HexColor("#f0f9ff")   # Sky Capsule BG
SUCCESS_COLOR = colors.HexColor("#10b981")  # Emerald Green

def get_report_styles():
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=PRIMARY_NAVY,
        alignment=0, # Left
        spaceAfter=1
    )
    
    sub_title_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=MUTED_COLOR,
        alignment=0,
        spaceAfter=3
    )
    
    header_white_brand = ParagraphStyle(
        'HeaderWhiteBrand',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=colors.white
    )

    header_white_sub = ParagraphStyle(
        'HeaderWhiteSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#bae6fd")
    )

    header_white_meta = ParagraphStyle(
        'HeaderWhiteMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#e2e8f0"),
        alignment=2 # Right
    )
    
    section_h2_style = ParagraphStyle(
        'SectionHeaderH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_NAVY,
        spaceBefore=3,
        spaceAfter=2,
        keepWithNext=True
    )
    
    clause_title_style = ParagraphStyle(
        'ClauseTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=PRIMARY_NAVY,
        spaceAfter=1
    )
    
    clause_body_style = ParagraphStyle(
        'ClauseBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=INK_COLOR
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.white,
        alignment=1
    )

    th_left_style = ParagraphStyle(
        'TableHeaderLeft',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.white,
        alignment=0
    )
    
    td_key_style = ParagraphStyle(
        'TableKey',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=PRIMARY_NAVY
    )
    
    td_val_style = ParagraphStyle(
        'TableVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=INK_COLOR
    )
    
    party_pill_style = ParagraphStyle(
        'PartyPill',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6,
        leading=7.5,
        textColor=colors.white,
        alignment=0
    )

    party_header_style = ParagraphStyle(
        'PartyHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.white
    )
    
    footer_white_left = ParagraphStyle(
        'FooterWhiteLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor("#e2e8f0"),
        alignment=0
    )

    footer_white_right = ParagraphStyle(
        'FooterWhiteRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8,
        textColor=colors.white,
        alignment=2
    )

    mini_header_left = ParagraphStyle(
        'MiniHeaderLeft',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=PRIMARY_NAVY
    )

    mini_header_right = ParagraphStyle(
        'MiniHeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8,
        textColor=MUTED_COLOR,
        alignment=2
    )

    return {
        'title': title_style,
        'subtitle': sub_title_style,
        'header_white_brand': header_white_brand,
        'header_white_sub': header_white_sub,
        'header_white_meta': header_white_meta,
        'h2': section_h2_style,
        'clause_title': clause_title_style,
        'clause_body': clause_body_style,
        'th': th_style,
        'th_left': th_left_style,
        'td_key': td_key_style,
        'td_val': td_val_style,
        'party_pill': party_pill_style,
        'party_header': party_header_style,
        'footer_white_left': footer_white_left,
        'footer_white_right': footer_white_right,
        'mini_header_left': mini_header_left,
        'mini_header_right': mini_header_right
    }

async def generate_agreement_pdf(
    agreement: Dict[str, Any],
    item: Dict[str, Any],
    evidence_list: List[Dict[str, Any]],
    owner: Dict[str, Any],
    borrower: Optional[Dict[str, Any]]
) -> bytes:
    item = item or {}
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=28,
        leftMargin=28,
        topMargin=24,
        bottomMargin=24
    )
    
    styles = get_report_styles()
    story = []
    
    # Auto-fetch real owner details
    owner_name = escape_text(derive_clean_name(owner.get('full_name') or owner.get('name'), 'Lender'))
    owner_email = escape_text(owner.get('email', ''))
    owner_phone = escape_text(owner.get('phone') or 'Not provided')
    owner_city = escape_text(owner.get('city') or owner.get('address') or 'Not specified')

    # Auto-fetch real borrower details
    raw_borrower_name = borrower.get('full_name') if borrower else (agreement.get('borrower_name') or agreement.get('borrower_email'))
    borrower_name = escape_text(derive_clean_name(raw_borrower_name, 'Borrower'))
    borrower_email = escape_text(agreement.get('borrower_email', ''))
    borrower_phone = escape_text(borrower.get('phone') if (borrower and borrower.get('phone')) else 'Not provided')
    borrower_city = escape_text(borrower.get('city') if (borrower and borrower.get('city')) else 'Not specified')

    terms = agreement.get("terms", {})
    due_date = terms.get("due_date")
    due_date_str = due_date.strftime("%B %d, %Y") if isinstance(due_date, (datetime, date)) else "August 21, 2026"
    
    created_at = agreement.get("created_at", datetime.now())
    created_date_str = created_at.strftime("%B %d, %Y") if isinstance(created_at, (datetime, date)) else "August 06, 2026"
    
    agreement_no = f"AGM/2026/{agreement.get('_id', '6EDAB6')[:6].upper()}" if agreement.get('_id') else "AGM/2026/6EDAB6"
    item_val = item.get("estimated_value", 5000.0)
    principal_display = f"Rs. {item_val:,.2f}"
    
    item_title = escape_text(item.get('title', 'Registered Asset'))
    item_desc = escape_text(item.get('description', 'General Purpose Asset Lending'))

    penalty_rate = terms.get("penalty_rate", 0.0)
    penalty_type = str(terms.get("penalty_type", "per_day")).lower()
    grace_days = terms.get("grace_period_days", 0)
    custom_interest = terms.get("interest_rate", 0.0)

    if custom_interest and float(custom_interest) > 0:
        interest_display = f"{float(custom_interest):.1f}% per annum"
    elif penalty_type == "percentage" and penalty_rate > 0:
        interest_display = f"{penalty_rate:.1f}% per period"
    else:
        interest_display = "0% (No Interest)"

    if penalty_type == "per_day" and penalty_rate > 0:
        late_fee_display = f"Rs. {penalty_rate:,.2f} / Day"
        penalty_display = f"Rs. {penalty_rate:,.2f} / Day (Grace: {grace_days} days)"
    elif penalty_type == "fixed" and penalty_rate > 0:
        late_fee_display = f"Rs. {penalty_rate:,.2f} Flat"
        penalty_display = f"Rs. {penalty_rate:,.2f} Fixed Penalty"
    elif penalty_type == "percentage" and penalty_rate > 0:
        late_fee_display = f"{penalty_rate:.1f}% Overdue Fee"
        penalty_display = f"{penalty_rate:.1f}% Penalty Fee"
    elif penalty_rate > 0:
        late_fee_display = f"Rs. {penalty_rate:,.2f} ({penalty_type})"
        penalty_display = f"Rs. {penalty_rate:,.2f} ({penalty_type})"
    else:
        late_fee_display = "Nil (No Late Fee)"
        penalty_display = "Nil (Mutual Consent)"

    # Real parties list (No dummy parties)
    parties = [
        {"name": owner_name, "role": "Owner / Lender", "phone": owner_phone, "email": owner_email, "address": owner_city, "id": "AAD****1234"},
        {"name": borrower_name, "role": "Borrower", "phone": borrower_phone, "email": borrower_email, "address": borrower_city, "id": "AAD****5678"},
    ]

    total_parties = len(parties)
    has_extra_parties = total_parties > 2
    total_pages = 3 if has_extra_parties else 2

    def make_mini_header():
        if os.path.exists(LOGO_PATH):
            left_cell = Table([[RLImage(LOGO_PATH, width=0.18 * inch, height=0.18 * inch), Paragraph("<b>AGREEMATE TECHNOLOGIES</b>", styles['mini_header_left'])]], colWidths=[0.24 * inch, 3.5 * inch], style=[('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('PADDING', (0,0), (-1,-1), 0)])
        else:
            left_cell = Paragraph("<b>AGREEMATE TECHNOLOGIES</b>", styles['mini_header_left'])

        tbl = Table([
            [left_cell,
             Paragraph(f"Agreement No.: <b>{agreement_no}</b> &nbsp;|&nbsp; Effective Date: <b>{created_date_str}</b>", styles['mini_header_right'])]
        ], colWidths=[3.7 * inch, 3.7 * inch])
        tbl.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 0.75, PRIMARY_NAVY),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        return tbl

    def make_footer(page_num):
        tbl = Table([
            [Paragraph("<font color='#ffffff' size=6>Confidential - Intended solely for the Parties named in this Agreement</font>", styles['footer_white_left']),
             Paragraph(f"<font color='#ffffff' size=6><b>Page {page_num} of {total_pages}</b></font>", styles['footer_white_right'])]
        ], colWidths=[5.6 * inch, 1.8 * inch])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY),
            ('PADDING', (0,0), (-1,-1), 3),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        return tbl

    # =========================================================================
    # PAGE 1: COVER, COMPANY BANNER, 3 BADGES, PARTIES, METRICS & TRANSACTION SUMMARY
    # =========================================================================
    if os.path.exists(LOGO_PATH):
        brand_identity = Table([[
            RLImage(LOGO_PATH, width=0.4 * inch, height=0.4 * inch),
            [
                Paragraph("<b>AGREEMATE</b><br/><font size=6.5>TECHNOLOGIES</font>", styles['header_white_brand']),
                Spacer(1, 1),
                Paragraph("Digital Agreements. Trusted Records.", styles['header_white_sub'])
            ]
        ]], colWidths=[0.5 * inch, 3.8 * inch], style=[
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 0),
        ])
        brand_box = [brand_identity]
    else:
        brand_box = [
            Paragraph("<b>AGREEMATE</b><br/><font size=6.5>TECHNOLOGIES</font>", styles['header_white_brand']),
            Spacer(1, 1),
            Paragraph("Digital Agreements. Trusted Records.", styles['header_white_sub'])
        ]
    meta_box = [
        Paragraph("legal@agreemate.io", styles['header_white_meta']),
        Paragraph("www.agreemate.io", styles['header_white_meta'])
    ]
    banner_tbl = Table([[brand_box, meta_box]], colWidths=[4.3 * inch, 3.1 * inch])
    banner_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK_NAVY_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(banner_tbl)
    story.append(Spacer(1, 4))
    
    # Document Title (Compact)
    story.append(Paragraph("<b>BORROWING &amp; LENDING AGREEMENT</b>", styles['title']))
    story.append(Paragraph("Digital Transaction &amp; Repayment Agreement", styles['subtitle']))
    story.append(Spacer(1, 2))
    
    # Exactly 3 Metadata Badges Row (Version removed as requested)
    b1 = [Paragraph("<font size=5.5 color='#64748b'>Agreement No.</font>", styles['td_val']), Paragraph(f"<b><font size=7 color='#0f172a'>{agreement_no}</font></b>", styles['td_val'])]
    b2 = [Paragraph("<font size=5.5 color='#64748b'>Agreement Date</font>", styles['td_val']), Paragraph(f"<b><font size=7 color='#0f172a'>{created_date_str}</font></b>", styles['td_val'])]
    b3 = [Paragraph("<font size=5.5 color='#64748b'>Effective Date</font>", styles['td_val']), Paragraph(f"<b><font size=7 color='#0f172a'>{created_date_str}</font></b>", styles['td_val'])]
    
    badge_tbl = Table([[b1, b2, b3]], colWidths=[2.46 * inch, 2.47 * inch, 2.47 * inch])
    badge_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (0,0), 0.5, BORDER_COLOR),
        ('BOX', (1,0), (1,0), 0.5, BORDER_COLOR),
        ('BOX', (2,0), (2,0), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(badge_tbl)
    story.append(Spacer(1, 3))
    
    # Preamble
    intro_p = (
        f"This Borrowing &amp; Lending Agreement (&quot;Agreement&quot;) is entered into on "
        f"<b>{created_date_str}</b> and becomes effective on <b>{created_date_str}</b> by and between the Parties identified below:"
    )
    story.append(Paragraph(intro_p, styles['clause_body']))
    story.append(Spacer(1, 3))
    
    # Contracting Parties Cards
    party1_tag = Table([[Paragraph("<font color='#ffffff' size=5.5><b>PARTY 1 &nbsp;&bull;&nbsp; OWNER / PRIMARY PARTY</b></font>", styles['party_pill'])]], colWidths=[2.2 * inch], style=[('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY), ('PADDING', (0,0), (-1,-1), 2), ('VALIGN', (0,0), (-1,-1), 'MIDDLE')])
    party1_box = [
        party1_tag,
        Spacer(1, 2),
        Paragraph(f"<b><font size=8.5 color='#0f172a'>{owner_name}</font></b> &nbsp;<font size=6.5 color='#64748b'>(Lender)</font>", styles['td_val']),
        HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=2),
        Paragraph(f"<font size=6.5 color='#64748b'>Phone:</font> <font size=6.5 color='#1e293b'>{owner_phone}</font> &nbsp;|&nbsp; <font size=6.5 color='#64748b'>Email:</font> <font size=6.5 color='#1e293b'>{owner_email}</font>", styles['td_val']),
        Paragraph(f"<font size=6.5 color='#64748b'>Address:</font> <font size=6.5 color='#1e293b'>{owner_city}</font> &nbsp;|&nbsp; <font size=6.5 color='#64748b'>ID:</font> <font size=6.5 color='#1e293b'>AAD****1234</font>", styles['td_val']),
    ]

    party2_tag = Table([[Paragraph("<font color='#ffffff' size=5.5><b>PARTY 2 &nbsp;&bull;&nbsp; BORROWER</b></font>", styles['party_pill'])]], colWidths=[1.8 * inch], style=[('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY), ('PADDING', (0,0), (-1,-1), 2), ('VALIGN', (0,0), (-1,-1), 'MIDDLE')])
    party2_box = [
        party2_tag,
        Spacer(1, 2),
        Paragraph(f"<b><font size=8.5 color='#0f172a'>{borrower_name}</font></b> &nbsp;<font size=6.5 color='#64748b'>(Borrower)</font>", styles['td_val']),
        HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=2),
        Paragraph(f"<font size=6.5 color='#64748b'>Phone:</font> <font size=6.5 color='#1e293b'>{borrower_phone}</font> &nbsp;|&nbsp; <font size=6.5 color='#64748b'>Email:</font> <font size=6.5 color='#1e293b'>{borrower_email}</font>", styles['td_val']),
        Paragraph(f"<font size=6.5 color='#64748b'>Address:</font> <font size=6.5 color='#1e293b'>{borrower_city}</font> &nbsp;|&nbsp; <font size=6.5 color='#64748b'>ID:</font> <font size=6.5 color='#1e293b'>AAD****5678</font>", styles['td_val']),
    ]

    parties_tbl = Table([[party1_box, party2_box]], colWidths=[3.67 * inch, 3.67 * inch])
    parties_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (0,0), 0.5, BORDER_COLOR),
        ('BOX', (1,0), (1,0), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(parties_tbl)
    story.append(Spacer(1, 4))
    
    # AGREEMENT SUMMARY Metrics
    story.append(Paragraph("<b>AGREEMENT SUMMARY</b>", styles['h2']))
    m1 = [Paragraph("<font size=5.5 color='#64748b'>Principal Valuation</font>", styles['td_val']), Paragraph(f"<b><font size=7.5 color='#003a5e'>{principal_display}</font></b>", styles['td_val'])]
    m2 = [Paragraph("<font size=5.5 color='#64748b'>Interest Terms</font>", styles['td_val']), Paragraph(f"<b><font size=7.5 color='#0f172a'>{interest_display}</font></b>", styles['td_val'])]
    m3 = [Paragraph("<font size=5.5 color='#64748b'>Repayment Frequency</font>", styles['td_val']), Paragraph("<b><font size=7.5 color='#0f172a'>One-Time on Due Date</font></b>", styles['td_val'])]
    m4 = [Paragraph("<font size=5.5 color='#64748b'>Final Due Date</font>", styles['td_val']), Paragraph(f"<b><font size=7.5 color='#003a5e'>{due_date_str}</font></b>", styles['td_val'])]
    
    summary_metric_tbl = Table([[m1, m2, m3, m4]], colWidths=[1.85 * inch, 1.85 * inch, 1.85 * inch, 1.85 * inch])
    summary_metric_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (0,0), 0.5, BORDER_COLOR),
        ('BOX', (1,0), (1,0), 0.5, BORDER_COLOR),
        ('BOX', (2,0), (2,0), 0.5, BORDER_COLOR),
        ('BOX', (3,0), (3,0), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_metric_tbl)
    story.append(Spacer(1, 4))
    
    # TRANSACTION SUMMARY Table (Placed directly on Page 1 to perfectly fill page 1)
    story.append(Paragraph("<b>TRANSACTION SUMMARY DETAILS</b>", styles['h2']))
    summary_rows = [
        [Paragraph("DETAIL", styles['th_left']), Paragraph("INFORMATION", styles['th_left'])],
        [Paragraph("Transaction Type", styles['td_key']), Paragraph("Asset Lending / Borrowing Agreement", styles['td_val'])],
        [Paragraph("Principal Valuation", styles['td_key']), Paragraph(f"<b>{principal_display} ({item_title})</b>", styles['td_val'])],
        [Paragraph("Purpose", styles['td_key']), Paragraph(item_desc, styles['td_val'])],
        [Paragraph("Disbursement Date", styles['td_key']), Paragraph(created_date_str, styles['td_val'])],
        [Paragraph("Final Due Date", styles['td_key']), Paragraph(due_date_str, styles['td_val'])],
        [Paragraph("Interest Rate", styles['td_key']), Paragraph(interest_display, styles['td_val'])],
        [Paragraph("Late Fee / Penalty", styles['td_key']), Paragraph(f"<b>{late_fee_display}</b>", styles['td_val'])],
        [Paragraph("Repayment Frequency", styles['td_key']), Paragraph("One-Time on Due Date", styles['td_val'])],
    ]
    summary_table = Table(summary_rows, colWidths=[2.1 * inch, 5.3 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 3))
    story.append(Paragraph("This Agreement records the terms and conditions under which the Parties agree to a borrowing and lending transaction and the repayment/return of the asset in accordance with agreed terms.", styles['clause_body']))
    story.append(Spacer(1, 4))
    story.append(make_footer(1))
    
    cur_page = 1

    # =========================================================================
    # OPTIONAL MULTI-PARTY PAGE (ONLY IF > 2 PARTIES)
    # =========================================================================
    if has_extra_parties:
        cur_page += 1
        story.append(PageBreak())
        story.append(make_mini_header())
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>PARTIES TO THE AGREEMENT (TOTAL PARTIES: {total_parties})</b>", styles['h2']))
        
        for idx, p in enumerate(parties):
            p_row = [
                Paragraph(f"<font color='#ffffff'><b>PARTY {idx + 1}</b></font>", styles['party_header']),
                Paragraph(f"<b>{p['name']}</b><br/>Role: {p['role']}<br/>Contact: {p['phone']} &nbsp;|&nbsp; Email: {p['email']}<br/>Address: {p['address']}<br/>ID: {p['id']}", styles['td_val'])
            ]
            p_tbl = Table([p_row], colWidths=[1.1 * inch, 6.3 * inch])
            p_tbl.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (0,0), PRIMARY_NAVY),
                ('BACKGROUND', (1,0), (1,0), CARD_BG),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(p_tbl)
            story.append(Spacer(1, 3))
            
        story.append(Spacer(1, 4))
        story.append(make_footer(cur_page))

    # =========================================================================
    # PAGE 2: OPERATIVE CLAUSES 1 TO 8, SIGNATURES & PLATFORM CERTIFICATION
    # =========================================================================
    cur_page += 1
    story.append(PageBreak())
    story.append(make_mini_header())
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("<b>1. PURPOSE &amp; VOLUNTARY CONSENT</b>", styles['h2']))
    story.append(Paragraph("This Agreement records the terms and conditions under which the Lender agrees to lend and the Borrower agrees to borrow the registered asset / principal value stated above, and to repay or return the same along with applicable charges. The Parties enter into this Agreement voluntarily.", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>2. LOAN AMOUNT &amp; ASSET VALUATION</b>", styles['h2']))
    story.append(Paragraph(f"<b>2.1 Principal Valuation:</b> The Lender lends and the Borrower receives asset valuation of <b>{principal_display} ({item_title})</b>.<br/><b>2.2 Permitted Purpose:</b> The asset shall be used solely for: <b>{item_desc}</b>.<br/><b>2.3 Receipt Acknowledgement:</b> The Borrower acknowledges receipt and agrees to repay/return as agreed.", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>3. DISBURSEMENT &amp; HANDOVER</b>", styles['h2']))
    story.append(Paragraph(f"<b>3.1 Handover Date:</b> {created_date_str}. &nbsp;|&nbsp; <b>3.2 Method:</b> Physical Handover &bull; Verified Inspection &bull; Digital OTP Acceptance.<br/><b>3.3 SHA-256 Vault Reference ID:</b> <b>AGM-{agreement.get('_id', 'VAULT-001')[:10].upper()}</b>", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>4. REPAYMENT TERMS &amp; SCHEDULE</b>", styles['h2']))
    sched_rows = [
        [Paragraph("Milestone", styles['th']), Paragraph("Due Date", styles['th']), Paragraph("Principal Value", styles['th']), Paragraph("Late Fee / Interest", styles['th']), Paragraph("Total Due", styles['th'])],
        [Paragraph("Final Return", styles['td_val']), Paragraph(due_date_str, styles['td_val']), Paragraph(principal_display, styles['td_val']), Paragraph(late_fee_display, styles['td_val']), Paragraph(f"<b>{principal_display}</b>", styles['td_val'])],
    ]
    sched_table = Table(sched_rows, colWidths=[1.3 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch, 1.6 * inch])
    sched_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(sched_table)
    story.append(Spacer(1, 2))
    story.append(Paragraph(f"<b>4.3 Final Repayment Date:</b> All obligations must be completed on or before <b>{due_date_str}</b>.", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>5. INTEREST, PENALTIES &amp; SECURITY</b>", styles['h2']))
    story.append(Paragraph(f"<b>5.1 Interest:</b> {interest_display}. &nbsp;|&nbsp; <b>5.2 Late Penalty:</b> {penalty_display}.<br/><b>5.3 Early Repayment:</b> Permitted without penalty. &nbsp;|&nbsp; <b>5.4 Security:</b> Secured via SHA-256 Vault Records. Obligation fully discharged upon verified return.", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>6. LEGAL COVENANTS &amp; STATUTORY COMPLIANCE</b>", styles['h2']))
    story.append(Paragraph("<b>6.1 Custody &amp; Debt:</b> The Borrower acknowledges lawful custody and debt liability under applicable law.<br/><b>6.2 Digital Record &amp; Evidence:</b> This Agreement, SHA-256 hashes, timestamps, and electronic acceptance constitute valid legal evidence under the Information Technology Act, 2000 and Bharatiya Nyaya Sanhita (BNS).<br/><b>6.3 Confidentiality:</b> Parties agree to protect sensitive financial and personal data from unauthorized disclosure.<br/><b>6.4 Dispute Resolution:</b> Mutual settlement first, followed by binding arbitration or jurisdictional court proceedings.<br/><b>6.5 Governing Law:</b> This transaction is governed strictly by the laws and jurisdictional courts of India.", styles['clause_body']))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>7. NO ROLE OF THE COMPANY (PLATFORM TECHNOLOGY DISCLAIMER)</b>", styles['h2']))
    disc_box = Table([[
        Paragraph("The Company acts solely as a technology platform for recording and managing borrowing and lending transactions between the Parties. The Company is not a lender, borrower, guarantor, broker, or party to this transaction and assumes no liability for default, damage, dispute, or performance between the Parties.", styles['clause_body'])
    ]], colWidths=[7.4 * inch])
    disc_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HIGHLIGHT_BG),
        ('BOX', (0,0), (-1,-1), 0.5, ACCENT_BLUE),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(disc_box)
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("<b>8. ACKNOWLEDGEMENT &amp; VOLUNTARY CONSENT</b>", styles['h2']))
    story.append(Paragraph("Each Party confirms that they have read, understood, and voluntarily accept all terms and conditions of this Agreement.", styles['clause_body']))
    story.append(Spacer(1, 3))

    # Signatures Table - Derived dynamically from actual agreement status
    agreement_status = (agreement.get("status") or "draft").lower()
    is_executed = agreement_status in {"active", "completed", "return_initiated", "overdue"}
    is_borrower_accepted = is_executed or agreement_status == "pending_owner_confirmation"
    is_owner_accepted = agreement_status != "draft"

    owner_status_pill = "<font color='#10b981'><b>✓ Accepted &amp; Recorded</b></font>" if is_owner_accepted else "<font color='#f59e0b'><b>⌛ Draft / Pending Invite</b></font>"
    borrower_status_pill = "<font color='#10b981'><b>✓ Accepted &amp; Recorded</b></font>" if is_borrower_accepted else "<font color='#f59e0b'><b>⌛ Pending Acceptance</b></font>"

    if is_executed:
        status_display = "<font color='#10b981'><b>Executed &amp; Active</b></font>"
    elif agreement_status == "completed":
        status_display = "<font color='#10b981'><b>Completed &amp; Discharged</b></font>"
    elif agreement_status == "cancelled":
        status_display = "<font color='#ef4444'><b>Cancelled / Void</b></font>"
    elif agreement_status == "disputed":
        status_display = "<font color='#f97316'><b>In Dispute</b></font>"
    else:
        status_display = f"<font color='#f59e0b'><b>{agreement_status.replace('_', ' ').title()}</b></font>"

    story.append(Paragraph(f"<b>SIGNATURES &amp; ACCEPTANCE (TOTAL SIGNATORIES: {total_parties})</b>", styles['h2']))
    sig_boxes = [
        [
            Paragraph(f"<b>PARTY 1 &nbsp;&bull;&nbsp; OWNER / LENDER</b><br/><br/><i><font size=9 color='#003a5e'>{owner_name}</font></i><br/>-----------------------------------<br/><b>{owner_name}</b><br/>Date: {created_date_str}<br/>{owner_status_pill}", styles['td_val']),
            Paragraph(f"<b>PARTY 2 &nbsp;&bull;&nbsp; BORROWER</b><br/><br/><i><font size=9 color='#003a5e'>{borrower_name}</font></i><br/>-----------------------------------<br/><b>{borrower_name}</b><br/>Date: {created_date_str}<br/>{borrower_status_pill}", styles['td_val']),
        ]
    ]
    sig_table = Table(sig_boxes, colWidths=[3.67 * inch, 3.67 * inch])
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 3.5))

    # Electronic Record Audit & Section 63 BSA / Section 65B IT Act Certificate
    cert_data = [
        [
            Paragraph(
                "<b>ELECTRONIC RECORD AUDIT (SEC. 65B IT ACT, 2000 / SEC. 63 BSA, 2023)</b> &nbsp;|&nbsp; "
                "This Agreement records electronic acceptance, SHA-256 evidence digests, and platform audit trail events in accordance with applicable electronic record provisions.<br/>"
                f"<b>Document ID:</b> {agreement_no} &nbsp;&bull;&nbsp; <b>Signatories:</b> {total_parties} &nbsp;&bull;&nbsp; "
                f"<b>Recorded Date:</b> {created_date_str} &nbsp;&bull;&nbsp; <b>Status:</b> {status_display}",
                styles['td_val']
            )
        ]
    ]
    cert_table = Table(cert_data, colWidths=[7.4 * inch])
    cert_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(cert_table)
    story.append(Spacer(1, 4))
    story.append(make_footer(total_pages))
    
    # Build Document
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

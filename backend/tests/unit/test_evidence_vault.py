import pytest
import hashlib
from datetime import datetime, timezone, date
from backend.app.modules.evidence.hashing import calculate_sha256
from backend.app.services.documents.pdf_generator import generate_agreement_pdf, escape_text

def test_calculate_sha256():
    sample_data = b"AgreeMate Tamper Proof Evidence String 2026"
    expected_hash = hashlib.sha256(sample_data).hexdigest()
    calculated = calculate_sha256(sample_data)
    assert calculated == expected_hash
    assert len(calculated) == 64

def test_escape_text_special_characters():
    assert escape_text("Sony & Canon <Camera>") == "Sony &amp; Canon &lt;Camera&gt;"
    assert escape_text(None) == ""
    assert escape_text(123) == "123"

@pytest.mark.asyncio
async def test_generate_agreement_pdf_with_xml_entities():
    agreement = {
        "_id": "agr_test_xml_123",
        "borrower_email": "borrower&co<test>@example.com",
        "status": "active",
        "terms": {
            "due_date": date(2026, 12, 31),
            "penalty_type": "per_day",
            "penalty_rate": 75.0,
            "grace_period_days": 1,
            "special_conditions": "Handle with care & do not expose to water <important>"
        },
        "status_history": [
            {
                "created_at": datetime.now(timezone.utc),
                "changed_by": "usr_owner",
                "from_status": "draft",
                "to_status": "active",
                "note": "Handover confirmed & signed"
            }
        ],
        "signature_events": [
            {
                "user_id": "usr_owner",
                "event_type": "owner_confirmed",
                "ip_address": "127.0.0.1",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) <Test>",
                "created_at": datetime.now(timezone.utc)
            }
        ]
    }
    
    item = {
        "_id": "item_123",
        "title": "MacBook Pro 16\" & Charger",
        "category": "Electronics <Laptops>",
        "estimated_value": 250000.0,
        "condition": "mint",
    }
    
    owner = {
        "_id": "usr_owner",
        "full_name": "Alice & Bob Smith",
        "email": "alice&bob@example.com"
    }
    
    borrower = {
        "_id": "usr_borrower",
        "full_name": "Charlie <Developer>",
        "email": "charlie@example.com"
    }
    
    evidence_list = [
        {
            "_id": "ev_1",
            "uploaded_by": "usr_owner",
            "evidence_type": "handover",
            "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "note": "Photo of serial number & screen condition",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    pdf_bytes = await generate_agreement_pdf(agreement, item, evidence_list, owner, borrower)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

def test_generate_invoice_pdf():
    from backend.app.modules.users.service import generate_invoice_pdf
    user = {
        "_id": "usr_test_123",
        "full_name": "Somya & Co <Testing>",
        "email": "somya@example.com",
        "phone": "+91 98765 43210",
        "city": "Bengaluru"
    }
    pdf_buffer = generate_invoice_pdf(user, "AGM-INV-2026-001")
    pdf_bytes = pdf_buffer.read()
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")


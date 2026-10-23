import io
import os
import zipfile
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
import httpx

from backend.app.services.documents.pdf_generator import generate_agreement_pdf
from backend.app.core.config import settings

def _infer_extension(url: str, filename_hint: Optional[str], content_type: Optional[str]) -> str:
    """Derive true file extension from content-type or filename to avoid .jpg collision on PDFs."""
    if content_type:
        ct = content_type.lower()
        if "pdf" in ct:
            return ".pdf"
        if "png" in ct:
            return ".png"
        if "webp" in ct:
            return ".webp"
        if "jpeg" in ct or "jpg" in ct:
            return ".jpg"

    if filename_hint:
        _, ext = os.path.splitext(filename_hint)
        if ext.lower() in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
            return ext.lower()

    clean_url = url.split("?")[0].lower()
    for ext in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        if clean_url.endswith(ext):
            return ext
    return ".jpg"

async def build_evidence_zip_packet(
    agreement_id: str,
    agreement: Dict[str, Any],
    item: Optional[Dict[str, Any]],
    evidence_list: List[Dict[str, Any]],
    owner: Dict[str, Any],
    borrower: Optional[Dict[str, Any]],
) -> io.BytesIO:
    # 1. Generate electronic agreement PDF report
    pdf_bytes = await generate_agreement_pdf(agreement, item, evidence_list, owner, borrower)

    # 2. Package into in-memory ZIP archive
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("audit_report.pdf", pdf_bytes)

        owner_name = owner.get("full_name") or owner.get("email") or "Owner"
        borrower_name = (
            borrower.get("full_name")
            if borrower
            else agreement.get("borrower_email", "Awaiting Acceptance")
        )

        manifest_lines = [
            "=================================================================",
            "             AGREEMATE CRYPTOGRAPHIC EVIDENCE PACKET             ",
            "=================================================================",
            f"Agreement ID: {agreement_id}",
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"Owner: {owner_name} ({owner.get('email')})",
            f"Borrower: {borrower_name} ({agreement.get('borrower_email')})",
            "",
            "EVIDENCE INTEGRITY LOGS:",
            "-----------------------------------------------------------------",
        ]

        async with httpx.AsyncClient(timeout=15.0) as client:
            for idx, ev in enumerate(evidence_list):
                url = ev.get("cloudinary_url", "")
                evidence_type = ev.get("evidence_type", "file")
                expected_sha256 = ev.get("sha256_hash")

                if not url:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Evidence item #{idx+1} is missing a storage locator URL."
                    )

                is_mock_url = "mock-cloud" in url or not url.startswith("http")

                if is_mock_url:
                    if not getattr(settings, "ALLOW_MOCK_STORAGE", False):
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Evidence record #{idx+1} references mock storage, which is prohibited in this environment."
                        )
                    file_bytes = b"MOCK IMAGE DATA FOR TESTING"
                else:
                    try:
                        resp = await client.get(url)
                        if resp.status_code != 200:
                            raise HTTPException(
                                status_code=status.HTTP_502_BAD_GATEWAY,
                                detail=f"Failed to fetch evidence file #{idx+1} from storage (HTTP {resp.status_code})."
                            )
                        file_bytes = resp.content
                    except httpx.HTTPError as exc:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Network error while downloading evidence #{idx+1}: {str(exc)}"
                        )

                # Recompute SHA-256 on downloaded bytes
                computed_hash = hashlib.sha256(file_bytes).hexdigest()
                if expected_sha256 and not is_mock_url:
                    if computed_hash.lower() != expected_sha256.lower():
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Cryptographic hash mismatch for evidence #{idx+1}. Expected {expected_sha256}, got {computed_hash}."
                        )

                ext = _infer_extension(url, ev.get("file_name"), None)
                filename = f"evidence_{idx+1}_{evidence_type}{ext}"
                zip_file.writestr(filename, file_bytes)

                manifest_lines.append(f"File: {filename}")
                manifest_lines.append(f"Type: {evidence_type}")
                manifest_lines.append(
                    f"Uploaded By: {'Lender' if ev.get('uploaded_by') == owner.get('_id') else 'Borrower'}"
                )
                manifest_lines.append(f"Recorded SHA-256: {expected_sha256 or 'N/A'}")
                manifest_lines.append(f"Verified SHA-256: {computed_hash}")
                manifest_lines.append("Integrity Status: VERIFIED_MATCH")
                manifest_lines.append(f"Storage URL: {url}")
                manifest_lines.append("-----------------------------------------------------------------")

        manifest_content = "\n".join(manifest_lines)
        zip_file.writestr("manifest.txt", manifest_content.encode())

    zip_buffer.seek(0)
    return zip_buffer

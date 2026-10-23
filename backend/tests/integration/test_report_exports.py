"""Regression tests for the agreement export endpoints.

`agreements/router.py` once defined `get_agreement_evidence_zip` twice. Starlette matches the
FIRST registered route, so the earlier stub (which had no return statement) shadowed the real
ZIP builder and `/report/zip` answered `200 null`. These tests fail if that regression returns.
"""

import io
import zipfile
from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from backend.app.modules.auth.schemas import User
from backend.app.db.client import get_db
from backend.app.dependencies import get_current_user
from backend.app.main import app

client = TestClient(app)

AGREEMENT_ID = "agreement-zip-1"


def _user():
    return User(
        id="user1",
        email="owner@example.com",
        password_hash="fake_hash",
        email_verified=True,
        is_active=True,
        full_name="Owner User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


class _Cursor:
    """Stands in for a Motor cursor: .sort(...).to_list(length=...)."""

    def __init__(self, docs):
        self._docs = docs

    def sort(self, *_args, **_kwargs):
        return self

    async def to_list(self, length=None):
        return self._docs[:length] if length else self._docs


class _Collection:
    def __init__(self, docs=None, one=None):
        self._docs = docs or []
        self._one = one

    async def find_one(self, *_args, **_kwargs):
        return self._one

    def find(self, *_args, **_kwargs):
        return _Cursor(self._docs)


class _Db:
    def __init__(self):
        self.agreements = _Collection(
            one={
                "_id": AGREEMENT_ID,
                "owner_id": "user1",
                "borrower_id": "user2",
                "borrower_email": "borrower@example.com",
                "item_id": "item1",
                "status": "active",
                "notes": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "signature_events": [],
                "terms": {
                    "due_date": date.today(),
                    "penalty_type": "fixed",
                    "penalty_amount": 100.0,
                    "grace_period_days": 0,
                    "deposit_amount": 0.0,
                    "notes": None,
                },
            }
        )
        self.items = _Collection(one={"_id": "item1", "name": "Drill", "owner_id": "user1"})
        self.users = _Collection(one={"_id": "user1", "email": "owner@example.com", "full_name": "Owner User"})
        self.evidence_files = _Collection(docs=[])


def _setup():
    app.dependency_overrides[get_current_user] = _user
    app.dependency_overrides[get_db] = _Db


def _teardown():
    app.dependency_overrides.clear()


def test_report_zip_returns_a_real_zip_archive():
    """The ZIP export must stream an actual archive, not a null body."""
    _setup()
    try:
        response = client.get(f"/api/v1/agreements/{AGREEMENT_ID}/report/zip")

        assert response.status_code == 200, response.text
        # The shadowed stub returned None -> FastAPI serialised it as the 4 bytes b"null".
        assert response.content not in (b"null", b""), (
            "/report/zip returned a null body: the duplicate route definition is shadowing "
            "the real ZIP handler again."
        )
        assert zipfile.is_zipfile(io.BytesIO(response.content)), "response body is not a ZIP archive"

        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            names = archive.namelist()
        assert "audit_report.pdf" in names, f"audit report missing from ZIP, got {names}"
    finally:
        _teardown()


def test_report_pdf_returns_a_real_pdf():
    """The PDF export shares the duplicated decorator stack, so pin it down too."""
    _setup()
    try:
        response = client.get(f"/api/v1/agreements/{AGREEMENT_ID}/report/pdf")

        assert response.status_code == 200, response.text
        assert response.content.startswith(b"%PDF"), (
            f"expected a PDF body, got {response.content[:40]!r}"
        )
    finally:
        _teardown()


def test_export_routes_are_registered_exactly_once():
    """Duplicate registrations are what caused the shadowing; forbid them outright."""
    paths = [
        route.path
        for route in app.routes
        if getattr(route, "path", "").endswith(("/report/zip", "/report/pdf"))
    ]
    for suffix in ("/report/zip", "/report/pdf"):
        hits = [p for p in paths if p.endswith(suffix)]
        assert len(hits) <= 1, f"{suffix} is registered {len(hits)} times: {hits}"

import os
import sys
import asyncio
from datetime import datetime, timezone
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

# Add project roots to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = root_dir / "backend"
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.modules.auth.password import hash_password
from backend.app.db.indexes import ensure_indexes


async def clean_database_and_seed_admin():
    print("=" * 60)
    print("AGREEMATE DEVELOPMENT DATABASE PURGE & CLEAN ADMIN SEED")
    print("=" * 60)

    # STRICT PRODUCTION SAFETY GATE
    if settings.ENVIRONMENT == "production":
        print("\n[FATAL ERROR] Destructive database purge is strictly forbidden in production!")
        print("To safely create an admin user in production without data loss, run:")
        print("    python backend/scripts/seed_admin.py")
        sys.exit(1)

    if "--confirm-purge-dev-data" not in sys.argv:
        print("\n[SAFETY CONFIRMATION REQUIRED]")
        print("This script permanently deletes all data in the development database.")
        print("To proceed, you must pass the confirmation flag:")
        print("    python backend/scripts/clean_and_seed_admin.py --confirm-purge-dev-data")
        sys.exit(1)

    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tlsCAFile=certifi.where() if "mongodb+srv://" in settings.MONGODB_URL else None,
        serverSelectionTimeoutMS=8000
    )

    try:
        db = client.get_default_database(settings.DATABASE_NAME)
    except Exception:
        db = client[settings.DATABASE_NAME]

    print(f"Connected to database: {db.name}")

    # 1. Clear existing collections
    collections_to_purge = [
        "agreements",
        "items",
        "evidence_files",
        "evidence",
        "notifications",
        "penalty_records",
        "penalties",
        "invoices",
        "otps",
        "sessions",
        "audit_logs",
        "users"
    ]

    for coll_name in collections_to_purge:
        count = await db[coll_name].count_documents({})
        if count > 0:
            res = await db[coll_name].delete_many({})
            print(f" - Purged {res.deleted_count} documents from '{coll_name}'")
        else:
            print(f" - Collection '{coll_name}' is already empty (0 documents)")

    # 2. Seed Super Admin Account
    admin_email = os.getenv("ADMIN_EMAIL", "admin@agreemate.io")
    admin_password = os.getenv("ADMIN_INITIAL_PASSWORD")
    generated = False
    if not admin_password:
        import secrets
        admin_password = secrets.token_urlsafe(16)
        generated = True
    admin_user_id = "admin-root-001"

    hashed_pw = hash_password(admin_password)

    admin_doc = {
        "_id": admin_user_id,
        "email": admin_email,
        "password_hash": hashed_pw,
        "full_name": "AgreeMate Super Admin",
        "role": "admin",
        "email_verified": True,
        "is_active": True,
        "phone": "+91 98765 00001",
        "city": "Mumbai, India",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    await db.users.insert_one(admin_doc)
    print("\nCreated Super Admin Account:")
    print(f"  ID:       {admin_user_id}")
    print(f"  Email:    {admin_email}")
    if generated:
        print(f"  Password (GENERATED): {admin_password}")
        print("  [SECURITY NOTICE] Save this password or set ADMIN_INITIAL_PASSWORD in .env.")
    else:
        print("  Password: [Configured via ADMIN_INITIAL_PASSWORD]")
    print("  Role:     admin")
    print("  Status:   Verified & Active")

    # 3. Rebuild Database Indexes using centralized idempotent engine
    print("\nVerifying production indexes...")
    index_report = await ensure_indexes(db)
    print(f"Indexes status: {index_report['status']} ({index_report['succeeded']}/{index_report['total']} verified)")

    print("\n" + "=" * 60)
    print("DEVELOPMENT DATABASE PURGE & SEED COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(clean_database_and_seed_admin())

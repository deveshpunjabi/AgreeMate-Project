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


async def seed_admin_safe():
    """
    Idempotently creates a super admin user if one does not already exist.
    DOES NOT drop or modify any existing collections or documents.
    Completely safe to run in production.
    """
    print("=" * 60)
    print("AGREEMATE SAFE IDEMPOTENT ADMIN PROVISIONING")
    print("=" * 60)

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

    admin_email = os.getenv("ADMIN_EMAIL", "admin@agreemate.io").lower().strip()
    
    # 1. Check if admin already exists
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"\n[INFO] Admin user with email '{admin_email}' already exists.")
        print(f"  User ID: {existing.get('_id')}")
        print(f"  Role:    {existing.get('role')}")
        print(f"  Status:  Active={existing.get('is_active')}, Verified={existing.get('email_verified')}")
        print("No changes made to existing account.")
    else:
        admin_password = os.getenv("ADMIN_INITIAL_PASSWORD")
        generated = False
        if not admin_password:
            import secrets
            admin_password = secrets.token_urlsafe(16)
            generated = True

        admin_user_id = f"admin-{int(datetime.now(timezone.utc).timestamp())}"
        hashed_pw = hash_password(admin_password)

        admin_doc = {
            "_id": admin_user_id,
            "email": admin_email,
            "password_hash": hashed_pw,
            "full_name": "AgreeMate Administrator",
            "role": "admin",
            "email_verified": True,
            "is_active": True,
            "phone": "+91 98765 00001",
            "city": "Mumbai, India",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db.users.insert_one(admin_doc)
        print("\n[SUCCESS] Provisioned New Admin Account:")
        print(f"  ID:       {admin_user_id}")
        print(f"  Email:    {admin_email}")
        if generated:
            creds_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".admin_credentials.local"))
            try:
                with open(creds_path, "w", encoding="utf-8") as cred_f:
                    cred_f.write(f"ADMIN_EMAIL={admin_email}\nADMIN_PASSWORD={admin_password}\n")
                print(f"  Password (GENERATED): [Saved securely to {os.path.basename(creds_path)}]")
            except Exception:
                # If writing credentials file fails, advise setting ADMIN_INITIAL_PASSWORD
                print("  Password (GENERATED): [Generated - Please configure ADMIN_INITIAL_PASSWORD env var]")
            print("  [SECURITY NOTICE] Store this password securely or configure ADMIN_INITIAL_PASSWORD.")
        else:
            print("  Password: [Configured via ADMIN_INITIAL_PASSWORD]")
        print("  Role:     admin")

    # 2. Ensure indexes are up to date
    print("\nVerifying database indexes...")
    index_report = await ensure_indexes(db)
    print(f"Index status: {index_report['status']} ({index_report['succeeded']}/{index_report['total']} verified)")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_admin_safe())

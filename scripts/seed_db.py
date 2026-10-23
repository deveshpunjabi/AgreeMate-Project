"""
AgreeMate Development Database Seeder
Seeds initial super admin and verification indexes.
"""
import asyncio
import os
import sys

# Ensure repository root and backend directory are on sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.scripts.clean_and_seed_admin import clean_and_seed


if __name__ == "__main__":
    print("Running AgreeMate database seeding via scripts/seed_db.py...")
    asyncio.run(clean_and_seed())

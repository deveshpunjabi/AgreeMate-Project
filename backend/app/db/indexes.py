import asyncio
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Complete list of canonical AgreeMate MongoDB indexes
INDEX_DEFINITIONS: List[Dict[str, Any]] = [
    {"collection": "users", "keys": "email", "unique": True},
    {"collection": "otps", "keys": [("user_id", 1), ("created_at", -1)]},
    {"collection": "otps", "keys": "expires_at", "expireAfterSeconds": 0},
    {"collection": "sessions", "keys": "refresh_token_hash"},
    {"collection": "sessions", "keys": "expires_at", "expireAfterSeconds": 0},
    {"collection": "sessions", "keys": [("user_id", 1), ("revoked", 1), ("created_at", -1)]},
    {"collection": "items", "keys": [("owner_id", 1), ("is_deleted", 1)]},
    {"collection": "agreements", "keys": [("owner_id", 1), ("borrower_id", 1), ("borrower_email", 1)]},
    {"collection": "agreements", "keys": [("owner_id", 1), ("created_at", -1)]},
    {"collection": "agreements", "keys": [("borrower_id", 1), ("created_at", -1)]},
    {"collection": "agreements", "keys": [("borrower_email", 1), ("created_at", -1)]},
    {"collection": "agreements", "keys": [("status", 1), ("created_at", -1)]},
    {"collection": "agreements", "keys": "item_id"},
    {"collection": "agreements", "keys": "invite_token"},
    {"collection": "agreements", "keys": "status"},
    {"collection": "evidence_files", "keys": [("agreement_id", 1), ("created_at", 1)]},
    {"collection": "notifications", "keys": [("user_id", 1), ("is_read", 1), ("created_at", -1)]},
    {"collection": "penalty_records", "keys": [("agreement_id", 1), ("created_at", -1)]},
    {"collection": "audit_logs", "keys": [("actor_id", 1), ("timestamp", -1)]},
]


async def ensure_indexes(db) -> Dict[str, Any]:
    """
    Idempotent index creation with accurate error inspection.
    Never swallows errors silently with asyncio.gather(return_exceptions=True).
    Returns an audit report containing succeeded and failed indexes.
    """
    successes = []
    failures = []

    for index_spec in INDEX_DEFINITIONS:
        coll_name = index_spec["collection"]
        keys = index_spec["keys"]
        kwargs = {k: v for k, v in index_spec.items() if k not in ("collection", "keys")}
        
        try:
            coll = getattr(db, coll_name)
            name = await coll.create_index(keys, **kwargs)
            successes.append({"collection": coll_name, "index": name})
        except Exception as exc:
            error_msg = f"Failed to create index on {coll_name} ({keys}): {exc}"
            logger.error(error_msg)
            failures.append({"collection": coll_name, "keys": str(keys), "error": str(exc)})

    if failures:
        logger.warning(f"MongoDB index setup completed with {len(failures)} failures: {failures}")
    else:
        logger.info(f"MongoDB indexes verified successfully: {len(successes)} active indexes.")

    return {
        "status": "healthy" if not failures else "degraded",
        "total": len(INDEX_DEFINITIONS),
        "succeeded": len(successes),
        "failed": len(failures),
        "failures": failures,
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    # Add project roots to sys.path
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    backend_dir = root_dir / "backend"
    for p in [str(root_dir), str(backend_dir)]:
        if p not in sys.path:
            sys.path.insert(0, p)
            
    from backend.app.db.client import db

    async def main():
        print("Running AgreeMate idempotent MongoDB index initialization...")
        report = await ensure_indexes(db)
        print(f"Status: {report['status']}")
        print(f"Succeeded: {report['succeeded']}/{report['total']}")
        if report['failures']:
            print("Errors encountered:")
            for fail in report['failures']:
                print(f"  - {fail['collection']}: {fail['error']}")
            sys.exit(1)
        else:
            print("All indexes are up-to-date and verified.")

    asyncio.run(main())

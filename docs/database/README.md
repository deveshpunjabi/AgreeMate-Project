# AgreeMate MongoDB Database Architecture

AgreeMate connects to MongoDB Atlas via the Motor asynchronous driver (`backend/app/db/client.py`).

## Core Collections
1. `users`: Registered users, argon2id password hashes, TOTP secrets, roles (`user`, `admin`).
2. `sessions`: Hashed refresh tokens with automatic TTL index and 15s grace rotation window.
3. `items`: Registered lendable items with approximate replacement values.
4. `agreements`: Core mutual lending records with immutable terms lock upon acceptance.
5. `evidence_files`: Append-only records of condition media with SHA-256 byte hashes.
6. `notifications`: In-app event alerts.
7. `email_logs`: Transactional email delivery logs with timestamps, ports, and error diagnostics.

## Idempotent Index Initialization
Handled on startup by `ensure_indexes(db)` in `backend/app/db/indexes.py`.

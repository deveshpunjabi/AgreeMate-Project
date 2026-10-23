# AgreeMate Security & Compliance Architecture

## Security Pillars
1. **Password Hashing**: Argon2id via `argon2-cffi` with bcrypt fallback. Passwords are never stored in plaintext.
2. **Session Security**: Short-lived access tokens (15m) + refresh tokens (7d) stored in MongoDB as SHA-256 hex hashes.
3. **Evidence Integrity**: SHA-256 binary hash computed during upload and stored in append-only records for Section 65B compliance.
4. **Email Security**: Google App Passwords sanitized, dual-port fallback (465 SSL, 587 STARTTLS) to prevent ISP egress blocks.
5. **Zero Secrets in Git**: Enforced by comprehensive `.gitignore` and `.vercelignore`.

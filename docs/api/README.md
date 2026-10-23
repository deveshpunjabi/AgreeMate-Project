# AgreeMate API Architecture & Endpoint Catalog

All AgreeMate backend endpoints are exposed under `/api/v1` via FastAPI.

## Routers & Domains
1. **Auth** (`/api/v1/auth`): Registration, login, 6-digit email OTP verification, token refresh, and logout.
2. **Users** (`/api/v1/users`): Profile management, user metadata, and password updates.
3. **Items** (`/api/v1/items`): Lender catalog and item registration.
4. **Agreements** (`/api/v1/agreements`): 7-state lending agreement lifecycle, invites, Section 65B PDF generation, and export.
5. **Evidence** (`/api/v1/evidence`): SHA-256 cryptographic condition photos (handover and return).
6. **Penalties** (`/api/v1/penalties`): Late fee calculation engine and status.
7. **Notifications** (`/api/v1/notifications`): In-app alerts and read state tracking.
8. **Reminders** (`/api/v1/cron`): Due date reminder sweep and automated alerts.
9. **Security** (`/api/v1/security`): TOTP 2FA setup, verification, and recovery codes.
10. **Admin** (`/api/v1/admin`): Telemetry metrics, user directory, and dispute resolution.

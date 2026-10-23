# AgreeMate — Environment Variables & Secrets Guide

This document lists all environment variables required for running AgreeMate in development and production (Vercel).

## 1. Backend Environment Variables (Vercel Project Settings)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | Yes | `production` | Set to `production` in Vercel to enforce strict security headers and cookie policies. |
| `MONGODB_URL` | Yes | - | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `DATABASE_NAME` | No | `agreemate` | Target database name in MongoDB. |
| `JWT_SECRET` | Yes | - | Cryptographic secret key for signing tokens (minimum 32 characters long). |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Expiry duration for access tokens. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Expiry duration for refresh tokens. |
| `FRONTEND_URL` | Yes | `https://agree-mate.vercel.app` | Primary frontend domain for CORS and email links. |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | Outbound mail server hostname. |
| `SMTP_PORT` | Yes | `465` | Outbound port (465 SSL, 587 STARTTLS, 2525 alternative). |
| `SMTP_USERNAME` | Yes | - | Email account username (e.g. `yourname@gmail.com`). |
| `SMTP_PASSWORD` | Yes | - | 16-character Google App Password (spaces automatically stripped). |
| `SMTP_FROM` | Yes | - | Sender address displayed to users (`noreply@agreemate.com`). |
| `SMTP_USE_TLS` | No | `true` | Enable TLS security for email connections. |
| `CRON_SECRET` | Recommended | - | Bearer token required for triggering `/api/v1/cron/reminders`. |
| `CLOUDINARY_CLOUD_NAME` | Optional | - | Cloudinary cloud name for condition photos. |
| `CLOUDINARY_API_KEY` | Optional | - | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional | - | Cloudinary API secret. |

---

## 2. Frontend Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | No | `/api/v1` | Base API URL. In production, leave empty to automatically default to relative `/api/v1`. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | - | Public Cloudinary cloud name for client photo uploads. |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Optional | - | Unsigned upload preset for direct uploads. |

---

## 3. Secret Management & Compliance
- **Zero Secrets in Git**: Never commit `.env` or any file containing credentials.
- **Production Guard**: When `ENVIRONMENT=production`, AgreeMate validates that `JWT_SECRET` is at least 32 characters long and automatically activates HSTS with `max-age=31536000; includeSubDomains; preload`.

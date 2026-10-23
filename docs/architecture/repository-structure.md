# Repository structure

Runtime Python code has one canonical location: domains in backend/app/modules, integrations in backend/app/services, configuration/security headers in backend/app/core, database connection/indexes in backend/app/db, and reminder execution in backend/app/jobs. All Python imports use backend.app; the old flat domain directories and compatibility facades have been removed.

Frontend routing lives in frontend/src/app. Agreement UI lives in frontend/src/features/agreements. Shared layouts, UI, providers and landing sections live in frontend/src/components. Stores and hooks live in frontend/src/stores and frontend/src/hooks; frontend/src/lib contains API clients and utilities. Global CSS remains in app/globals.css. No empty feature placeholders are required.

api/index.py is the Vercel ASGI entrypoint. The root docker-compose.yml is the only Compose definition. Dockerfiles remain in infrastructure/docker.

## API ownership

- `api/index.py` is a small hosting adapter that exports the existing FastAPI application. Vercel routes `/api/v1/*` to this file.
- `backend/app/main.py` assembles the application; `backend/app/modules/*/router.py` implements its endpoints. There is no separate `backend/api` application.
- `frontend/src/lib/api` contains browser HTTP clients that call those endpoints. These files are not another backend or server entrypoint.

The request path is: frontend HTTP client → `/api/v1/...` → Vercel adapter → FastAPI domain router. Local development runs FastAPI directly, using the same application and routers.

package-lock.json at the root is the npm workspace lockfile; use npm ci from the repository root. backend/requirements.txt is the canonical Python dependency list. Root and API requirements files mirror it as self-contained deployment manifests because Vercel rejects cross-directory requirements includes. The repository check verifies that all three manifests agree. backend/requirements-dev.txt adds test dependencies.

Tests and public documentation belong in Git. Local .env files, agent notes, generated graphs, caches, virtual environments and build output do not. Ignore rules do not remove previously committed material from Git history.

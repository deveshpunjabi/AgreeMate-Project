# Contributing to AgreeMate

Thank you for your interest in contributing to AgreeMate! This guide explains how to set up your local environment, run tests, and submit high-quality contributions.

---

## 1. Code of Conduct

All contributors and maintainers are expected to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 2. Architecture Overview

AgreeMate is a dual-tier modular architecture:
- **`frontend/`**: Next.js 16 (React 19 + Tailwind CSS v4). All application code lives in `frontend/src/`.
- **`backend/`**: Python 3.12+ FastAPI service. Modular domains in `backend/app/` (`auth/`, `agreements/`, `items/`, `evidence/`, `penalties/`, `notifications/`, `reminders/`, `security/`, `admin/`, `users/`).
- **`run.py`**: Unified development runner managing backend, frontend, MongoDB connectivity, and tunnels.

---

## 3. Development Setup

### Prerequisites
- Node.js 20+ and npm 10+
- Python 3.12+
- MongoDB 7.0+ (local instance or Docker)

### Installation
```bash
# Clone the repository
git clone https://github.com/deveshpunjabi/AgreeMate-Project.git
cd AgreeMate-Project

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Running Locally
From the project root:
```bash
python run.py
```
This starts both the FastAPI backend on port 8000 and Next.js frontend on port 3000 with automatic port freeing and process supervision.

---

## 4. Verification & Testing

Before submitting a pull request, ensure all tests and linters pass:

### Backend Checks
```bash
cd backend
# Run test suite
python -m pytest tests/ -v

# Run security audit tests
python -m pytest tests/security/ -v
```

### Frontend Checks
```bash
cd frontend
# TypeScript compilation check
npx tsc --noEmit

# ESLint code quality check
npm run lint

# Vitest unit test suite
npm test

# Production build check
npm run build
```

---

## 5. Branch & Commit Conventions

- Use feature branches off `main`: `feat/feature-name`, `fix/bug-name`, `refactor/scope`.
- Follow Conventional Commits:
  - `feat(agreements): add party identification step`
  - `fix(security): resolve refresh token replay detection`
  - `docs(readme): update installation instructions`
- Keep commits focused and atomic.

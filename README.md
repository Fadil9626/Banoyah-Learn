# Banoyah Learn

A standalone training & certification platform (a Banoyah Technologies product).
**API-first:** other systems (HMS, eLIMS, Remedy) read certification status over a
keyed API — they never share its database, and training never blocks access.

## Stack
- **Backend:** Node/Express + PostgreSQL (`pg`), JWT auth, forward-only SQL migrations.
- **Frontend:** React + Vite + Tailwind, **dark-mode-first** (semantic design tokens).

## Local setup

### 1. Database
Create a Postgres database, e.g.:
```bash
createdb banoyah_learn
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npm install
npm run dev                 # migrates on boot, serves on :5300
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5301 (proxies /api to :5300)
```

First run shows a **setup screen** to create your organization + admin account.

## Phase 1 (this scaffold)
- Tenancy (`organizations`) + identity (`users`: admin / instructor / learner)
- Bootstrap / login / me, session-guarded routes
- People management (add learners, role, `external_id` for API mapping)
- Dark-mode-first UI shell (dashboard, people, theme switcher)

## Next
Courses & lessons → quizzes → certificates (PDF) → public certification API →
media/CDN → reminders (scheduler + email) → reporting.

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

---

## Production deployment

The backend serves **both** the API and the built frontend on a single port, so a
deploy is one Node process behind nginx. Do the **first-time provisioning** below
once; after that, every update is just `./deploy.sh`.

### Prerequisites (on the server)
- Node 18+ and npm
- PostgreSQL 14+
- pm2 (`npm i -g pm2`)
- nginx (reverse proxy + TLS)

Run everything as a dedicated **non-root app user** (e.g. `banoyah`). pm2 is
per-user — if you provision as `banoyah`, always deploy as `banoyah` (never
`sudo`), or pm2 won't find the process.

### 1. Database
```bash
sudo -u postgres createuser banoyah --pwprompt
sudo -u postgres createdb banoyah_learn -O banoyah
```

### 2. Clone + configure
```bash
cd ~ && git clone https://github.com/Fadil9626/Banoyah-Learn.git banoyah-learn
cd banoyah-learn/backend
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgres://banoyah:PASSWORD@localhost:5432/banoyah_learn
#   JWT_SECRET=<64+ random chars>   # e.g. `openssl rand -hex 48`
#   PORT=5300
```

### 3. Build + first start
```bash
cd ~/banoyah-learn/backend  && npm ci --omit=dev     # migrations run on boot
cd ~/banoyah-learn/frontend && npm ci && npm run build
cd ~/banoyah-learn          && pm2 start ecosystem.config.js
pm2 save
pm2 startup            # run the printed command once, so pm2 survives reboots
```
Check it: `curl -s localhost:5300/api/health`. Then open the domain — the first
visit shows the **setup screen** to create the org + admin account.

### 4. nginx reverse proxy
```nginx
server {
  server_name learn.yourdomain.com;
  client_max_body_size 10m;            # matches the 5mb JSON limit + uploads
  location / {
    proxy_pass http://127.0.0.1:5300;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
`X-Forwarded-*` matters: the app runs with `trust proxy = 1` so the auth/verify
rate limiters see the real client IP. Then issue TLS:
`sudo certbot --nginx -d learn.yourdomain.com`.

### 5. Updates (after provisioning)
```bash
cd ~/banoyah-learn && ./deploy.sh          # pull → build → pm2 restart → save
```

### Optional: demo data
To populate a **non-production** instance with realistic sample learners/certs
for screenshots/demos (creates `demo-*` users — never run against a real tenant):
```bash
cd backend && node -r dotenv/config scripts/seed-demo.js
```

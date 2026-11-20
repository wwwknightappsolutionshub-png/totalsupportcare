# tsc-api

Express + SQLite backend for Total Support Care. Node **22+** (`node:sqlite`).

## Roles

| Role | Access |
|------|--------|
| **owner** | Site CMS, media, WhatsApp CRM, settings + full HR |
| **hr** | Recruitment, screening, onboarding, staff, training, absence, tasks, reports, enquiries — no CMS/media/WhatsApp |

## Quick start

```bash
cd tsc-api
cp secrets/.env.example secrets/.env   # preferred over root .env
npm install
npm run seed
node scripts/activate-totalsupport.mjs
npm run dev
```

API: `http://127.0.0.1:8787`

Logins: `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `HR_EMAIL` / `HR_PASSWORD` from `secrets/.env`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Watch mode |
| `npm start` | Production process |
| `npm run seed` | Create admin/HR + base content |
| `npm run smoke` | Smoke e2e (API must be running) |

## Env

See `secrets/.env.example`. Important production keys: `JWT_SECRET`, `ADMIN_PASSWORD`, `HR_PASSWORD`, `APP_ORIGINS`, `COOKIE_SECURE`, `TURNSTILE_*`, `PUBLIC_SITE_URL`, `HOST=127.0.0.1`.

## Persist on deploy

- `data/tsc.db` (+ WAL files)
- `uploads/`
- `private/cvs/`

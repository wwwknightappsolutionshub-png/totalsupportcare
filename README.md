# Total Support Care (TSC ONLY)

Single-tenant site + admin/HR for **Total Support Care** (Edinburgh & Loanhead).

| Folder | Role |
|--------|------|
| `tsc-api` | Express + SQLite API (`data/tsc.db`) |
| `tsc-site` | Vite + React public site, admin CMS, HR |

## Local bootstrap

```powershell
# API
cd tsc-api
Copy-Item secrets\.env.example secrets\.env
# Edit secrets\.env — set JWT_SECRET and passwords
npm install
npm run seed
node scripts/activate-totalsupport.mjs
npm run dev

# Frontend (new terminal)
cd tsc-site
npm install
npm run dev
```

- API: `http://127.0.0.1:8787`
- Site / admin: `http://127.0.0.1:5173` · `/admin/login`
- Dev: leave `VITE_API_BASE` empty so Vite proxies `/api` and `/uploads` (same-origin cookies)

Default local logins come from `secrets/.env` (see `.env.example`). **Change them before production.**

## Git — what not to commit

Already ignored:

- `tsc-api/secrets/.env`
- `tsc-api/data/*.db*`
- `tsc-api/uploads/*` (except `.gitkeep`)
- `tsc-api/private/**` (except keep files)
- `node_modules/`, `dist/`, real `.env` files

Safe to commit: source, `secrets/.env.example`, `.env.example`, `.env.development` (no secrets), pack assets under `tsc-site/public/`.

```powershell
cd "TSC ONLY"
git init
git add .
git status   # verify no .env / .db / uploads blobs
git commit -m "Initial Total Support Care site and API"
```

## Production checklist

1. `NODE_ENV=production`
2. Unique `JWT_SECRET` (≥32 chars)
3. Strong unique `ADMIN_PASSWORD` / `HR_PASSWORD` (defaults are refused; seed a **fresh** DB — do not copy a local DB with old hashes)
4. `APP_ORIGINS=https://www.totalsupportcare.co.uk` (your real origin)
5. `COOKIE_SECURE=true` behind HTTPS
6. Cloudflare Turnstile keys (`TURNSTILE_*`) — required in production
7. `PUBLIC_SITE_URL` on API; build site with `VITE_SITE_URL=https://www.totalsupportcare.co.uk`
8. Reverse-proxy TLS → Node on `127.0.0.1`; proxy `/api` and `/uploads` so cookies stay same-origin
9. Persist volumes: `data/`, `uploads/`, `private/cvs/` + backups
10. Never set `FORCE_RESEED_PACKS` / `ALLOW_FORCE_RESEED` on a live edited CMS
11. Smoke: login, idle logout, apply form + CV, contact, CMS publish, OG preview

### Known ops gaps

- **No SMTP yet** — password-reset and notify paths log only; wire mail before relying on self-serve reset
- WhatsApp is optional (needs secrets; unsigned webhooks are rejected)

## Security (built-in)

- Cookie JWT sessions; single active login per user; 5‑minute idle logout
- Login lockout: 5 failed attempts → account + IP lock 30 minutes; rate limit 10 / 15 min
- Prod boot guards: JWT, passwords, Turnstile, non-local `APP_ORIGINS`
- Uploads: MIME sniffing; CVs private + auth download
